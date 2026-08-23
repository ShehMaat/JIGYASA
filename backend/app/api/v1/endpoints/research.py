from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.models.intelligence import ResearchTask, MarketReport, TaskStatus
from app.schemas.intelligence import (
    ResearchRequest,
    TaskStatusResponse,
    MarketReportResponse
)
from app.services.research_service import ResearchService

router = APIRouter(prefix="/research", tags=["Market Research"])


@router.post("/start", response_model=TaskStatusResponse, summary="Start Market Intelligence Task")
def start_research_task(request: ResearchRequest, db: Session = Depends(get_db)):
    """
    Initiates an asynchronous multi-stage market intelligence research task.
    Returns the task ID to track progress and logs.
    """
    task = ResearchService.create_task(db, request)
    ResearchService.execute_task_async(task.id)
    return task


@router.get("/tasks/{task_id}", response_model=TaskStatusResponse, summary="Get Research Task Status")
def get_task_status(task_id: str, db: Session = Depends(get_db)):
    """
    Returns the real-time execution status, progress percentage, and logs for a task.
    """
    task = db.query(ResearchTask).filter(ResearchTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail=f"Research task '{task_id}' not found.")
    
    report = db.query(MarketReport).filter(MarketReport.task_id == task_id).first()
    response_data = TaskStatusResponse.from_orm(task)
    if report:
        response_data.report_id = report.id
    return response_data


@router.get("/tasks/{task_id}/stream", summary="Stream Real-Time Task Execution Logs (SSE)")
async def stream_task_logs(task_id: str, db: Session = Depends(get_db)):
    """
    Streams real-time task execution events and log lines as Server-Sent Events (SSE).
    """
    import asyncio
    import json
    from fastapi.responses import StreamingResponse

    async def event_generator():
        last_log_count = 0
        while True:
            db.expire_all()
            task = db.query(ResearchTask).filter(ResearchTask.id == task_id).first()
            if not task:
                yield f"data: {json.dumps({'error': 'Task not found'})}\n\n"
                break

            logs = task.logs or []
            if len(logs) > last_log_count:
                new_logs = logs[last_log_count:]
                last_log_count = len(logs)
                for log_msg in new_logs:
                    yield f"data: {json.dumps({'status': task.status, 'progress': task.progress, 'log': log_msg})}\n\n"

            if task.status in ["completed", "failed"]:
                report = db.query(MarketReport).filter(MarketReport.task_id == task_id).first()
                report_id = report.id if report else None
                yield f"data: {json.dumps({'status': task.status, 'progress': 100, 'log': 'Execution finished.', 'report_id': report_id})}\n\n"
                break

            await asyncio.sleep(0.5)

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@router.get("/reports/{report_id}", response_model=MarketReportResponse, summary="Get Full Market Report")
def get_market_report(report_id: str, db: Session = Depends(get_db)):
    """
    Retrieves the complete structured market intelligence dossier.
    """
    report = db.query(MarketReport).filter(MarketReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail=f"Market report '{report_id}' not found.")
    return report


@router.get("/reports/{report_id}/export", summary="Export Market Intelligence Report")
def export_market_report(
    report_id: str,
    format: str = Query("markdown", description="Format: markdown, csv, html, or json"),
    db: Session = Depends(get_db)
):
    """
    Exports a market dossier in Markdown (.md), CSV (.csv), HTML (.html), or JSON (.json) formats.
    """
    report = db.query(MarketReport).filter(MarketReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail=f"Market report '{report_id}' not found.")

    overview = report.market_overview or {}
    swot = report.swot_analysis or {}
    comps = report.competitor_analysis or []
    recs = report.strategic_recommendations or []
    risks = report.risk_matrix or []
    citations = report.raw_evidence or []

    fmt = format.lower()

    if fmt == "json":
        import json as json_lib
        payload = {
            "id": report.id,
            "title": report.title,
            "executive_summary": report.executive_summary,
            "market_overview": overview,
            "competitor_analysis": comps,
            "swot_analysis": swot,
            "strategic_recommendations": recs,
            "risk_matrix": risks,
            "raw_evidence": citations,
            "created_at": report.created_at.isoformat()
        }
        return Response(
            content=json_lib.dumps(payload, indent=2),
            media_type="application/json",
            headers={"Content-Disposition": f"attachment; filename=market_dossier_{report_id}.json"}
        )

    elif fmt == "csv":
        import csv
        import io
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Competitor Name", "Market Position", "Estimated Market Share", "Pricing Strategy", "Target Segment", "Differentiation Moat", "Key Strengths", "Key Vulnerabilities"])
        for c in comps:
            writer.writerow([
                c.get("name", ""),
                c.get("market_position", ""),
                c.get("estimated_market_share", ""),
                c.get("pricing_strategy", ""),
                c.get("target_segment", ""),
                c.get("differentiation_factor", ""),
                "; ".join(c.get("key_strengths", [])),
                "; ".join(c.get("key_weaknesses", []))
            ])
        return Response(
            content=output.getvalue(),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=competitor_battlecards_{report_id}.csv"}
        )

    elif fmt == "html":
        html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>{report.title}</title>
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #07090e; color: #f8fafc; padding: 40px; line-height: 1.6; max-width: 900px; margin: 0 auto; }}
        h1 {{ color: #6366f1; border-bottom: 2px solid rgba(255,255,255,0.1); padding-bottom: 12px; }}
        h2 {{ color: #06b6d4; margin-top: 28px; }}
        .card {{ background: rgba(18,24,38,0.8); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 20px; margin-bottom: 16px; }}
        .badge {{ background: rgba(99,102,241,0.2); color: #a5b4fc; padding: 4px 10px; border-radius: 20px; font-size: 0.8rem; font-weight: 600; }}
        table {{ width: 100%; border-collapse: collapse; margin-top: 12px; }}
        th, td {{ padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.06); text-align: left; font-size: 0.9rem; }}
        th {{ color: #94a3b8; font-size: 0.75rem; text-transform: uppercase; }}
    </style>
</head>
<body>
    <h1>{report.title}</h1>
    <p><em>Generated by JIGYASA AI Market Intelligence Platform on {report.created_at.strftime('%Y-%m-%d %H:%M:%S')} UTC</em></p>
    
    <div class="card">
        <h2>Executive Summary</h2>
        <p>{report.executive_summary}</p>
    </div>

    <div class="card">
        <h2>Market Overview</h2>
        <p><strong>TAM:</strong> {overview.get('tam', 'N/A')} | <strong>SAM:</strong> {overview.get('sam', 'N/A')} | <strong>SOM:</strong> {overview.get('som', 'N/A')} | <strong>CAGR:</strong> {overview.get('cagr', 'N/A')}</p>
    </div>

    <div class="card">
        <h2>Competitor Matrix</h2>
        <table>
            <thead>
                <tr><th>Competitor</th><th>Position</th><th>Share</th><th>Pricing</th><th>Target Segment</th></tr>
            </thead>
            <tbody>
                {''.join([f"<tr><td><strong>{c.get('name')}</strong></td><td>{c.get('market_position')}</td><td>{c.get('estimated_market_share')}</td><td>{c.get('pricing_strategy')}</td><td>{c.get('target_segment')}</td></tr>" for c in comps])}
            </tbody>
        </table>
    </div>
</body>
</html>"""
        return Response(
            content=html,
            media_type="text/html",
            headers={"Content-Disposition": f"attachment; filename=executive_report_{report_id}.html"}
        )

    # Default Markdown (.md)
    md = []
    md.append(f"# {report.title}")
    md.append(f"*Generated by JIGYASA AI Market Intelligence Platform on {report.created_at.strftime('%Y-%m-%d %H:%M:%S')} UTC*\n")
    
    md.append("## 1. Executive Summary")
    md.append(f"{report.executive_summary}\n")

    md.append("## 2. Market Sizing & Macro Industry Dynamics")
    md.append(f"- **TAM (Total Addressable Market):** {overview.get('tam', 'N/A')}")
    md.append(f"- **SAM (Serviceable Addressable Market):** {overview.get('sam', 'N/A')}")
    md.append(f"- **SOM (Serviceable Obtainable Market):** {overview.get('som', 'N/A')}")
    md.append(f"- **Estimated CAGR:** {overview.get('cagr', 'N/A')}\n")
    
    if overview.get("key_trends"):
        md.append("### Key Industry Trends & Catalysts")
        for t in overview.get("key_trends", []):
            md.append(f"- {t}")
        md.append("")

    md.append("## 3. Competitor Intelligence & Battlecard Benchmarks")
    for c in comps:
        md.append(f"### {c.get('name')} ({c.get('market_position')})")
        md.append(f"- **Estimated Market Share:** {c.get('estimated_market_share', 'N/A')}")
        md.append(f"- **Pricing Strategy:** {c.get('pricing_strategy')}")
        md.append(f"- **Target Customer Segment:** {c.get('target_segment')}")
        md.append(f"- **Core Differentiation / Moat:** {c.get('differentiation_factor')}")
        md.append(f"- **Key Strengths:** {', '.join(c.get('key_strengths', []))}")
        md.append(f"- **Key Vulnerabilities:** {', '.join(c.get('key_weaknesses', []))}\n")

    md.append("## 4. SWOT Analysis Matrix")
    md.append("### Strengths")
    for s in swot.get("strengths", []):
        md.append(f"- {s}")
    md.append("\n### Weaknesses")
    for w in swot.get("weaknesses", []):
        md.append(f"- {w}")
    md.append("\n### Opportunities")
    for o in swot.get("opportunities", []):
        md.append(f"- {o}")
    md.append("\n### Threats")
    for t in swot.get("threats", []):
        md.append(f"- {t}")
    md.append("")

    md.append("## 5. Strategic Action Roadmap & Impact")
    for r in recs:
        md.append(f"### [{r.get('priority')} Priority | {r.get('timeframe')}] {r.get('title')}")
        md.append(f"{r.get('description')}")
        md.append(f"**Expected Business Impact:** {r.get('expected_impact')}\n")

    md.append("## 6. Risk Assessment Matrix")
    for rk in risks:
        md.append(f"- **{rk.get('risk_title')}** (Severity: {rk.get('severity')}, Likelihood: {rk.get('likelihood')}): {rk.get('mitigation_strategy')}")
    md.append("")

    if citations:
        md.append("## 7. Verified Sourced Evidence & Citations")
        for ct in citations:
            md.append(f"- [{ct.get('title', ct.get('source'))}]({ct.get('url')}): *\"{ct.get('snippet', '')}\"*")
        md.append("")

    markdown_text = "\n".join(md)
    return Response(
        content=markdown_text,
        media_type="text/markdown",
        headers={"Content-Disposition": f"attachment; filename=market_dossier_{report_id}.md"}
    )


@router.get("/reports", response_model=List[MarketReportResponse], summary="List Market Reports")
def list_market_reports(
    limit: int = Query(20, ge=1, le=100),
    project_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Lists generated market intelligence reports ordered by creation date.
    """
    query = db.query(MarketReport)
    if project_id:
        query = query.filter(MarketReport.project_id == project_id)
    reports = query.order_by(MarketReport.created_at.desc()).limit(limit).all()
    return reports


@router.post("/quick-analyze", response_model=MarketReportResponse, summary="Quick Synchronous Analysis")
def quick_analyze(request: ResearchRequest, db: Session = Depends(get_db)):
    """
    Performs immediate synchronous market intelligence analysis and returns the dossier.
    """
    report = ResearchService.execute_quick_sync(db, request)
    return report


@router.delete("/reports/{report_id}", summary="Delete Market Report")
def delete_market_report(report_id: str, db: Session = Depends(get_db)):
    """
    Deletes a market intelligence report by ID.
    """
    report = db.query(MarketReport).filter(MarketReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail=f"Market report '{report_id}' not found.")

    # Also delete the associated task if it exists
    task = db.query(ResearchTask).filter(ResearchTask.id == report.task_id).first()

    db.delete(report)
    if task:
        db.delete(task)
    db.commit()
    return {"message": f"Report '{report_id}' deleted successfully."}


@router.get("/reports/{report_id}/summary", summary="Get Report Summary Preview")
def get_report_summary(report_id: str, db: Session = Depends(get_db)):
    """
    Returns a lightweight preview of a report without full data.
    """
    report = db.query(MarketReport).filter(MarketReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail=f"Market report '{report_id}' not found.")

    return {
        "id": report.id,
        "title": report.title,
        "executive_summary": report.executive_summary,
        "competitor_count": len(report.competitor_analysis) if report.competitor_analysis else 0,
        "recommendation_count": len(report.strategic_recommendations) if report.strategic_recommendations else 0,
        "risk_count": len(report.risk_matrix) if report.risk_matrix else 0,
        "evidence_count": len(report.raw_evidence) if report.raw_evidence else 0,
        "tam": report.market_overview.get("tam") if report.market_overview else None,
        "cagr": report.market_overview.get("cagr") if report.market_overview else None,
        "created_at": report.created_at
    }


@router.get("/analytics/summary", summary="Get Cross-Dossier Macro Analytics Summary")
def get_analytics_summary(db: Session = Depends(get_db)):
    """
    Computes cross-dossier macro analytics metrics across all generated market dossiers.
    """
    reports = db.query(MarketReport).all()

    total_reports = len(reports)
    total_competitors = 0
    total_evidence = 0
    high_priority_recs = 0
    med_priority_recs = 0
    low_priority_recs = 0

    strengths_total = 0
    weaknesses_total = 0
    opportunities_total = 0
    threats_total = 0

    competitor_positions: Dict[str, int] = {}
    industry_counts: Dict[str, int] = {}

    for r in reports:
        comps = r.competitor_analysis or []
        total_competitors += len(comps)
        for c in comps:
            pos = c.get("market_position", "Uncategorized")
            competitor_positions[pos] = competitor_positions.get(pos, 0) + 1

        recs = r.strategic_recommendations or []
        for rec in recs:
            prio = rec.get("priority", "Medium")
            if prio == "High":
                high_priority_recs += 1
            elif prio == "Low":
                low_priority_recs += 1
            else:
                med_priority_recs += 1

        swot = r.swot_analysis or {}
        strengths_total += len(swot.get("strengths", []))
        weaknesses_total += len(swot.get("weaknesses", []))
        opportunities_total += len(swot.get("opportunities", []))
        threats_total += len(swot.get("threats", []))

        total_evidence += len(r.raw_evidence or [])

    return {
        "total_reports": total_reports,
        "total_competitors": total_competitors,
        "total_evidence_citations": total_evidence,
        "recommendations_breakdown": {
            "high_priority": high_priority_recs,
            "medium_priority": med_priority_recs,
            "low_priority": low_priority_recs,
        },
        "swot_breakdown": {
            "strengths": strengths_total,
            "weaknesses": weaknesses_total,
            "opportunities": opportunities_total,
            "threats": threats_total,
        },
        "competitor_positions": competitor_positions,
    }

