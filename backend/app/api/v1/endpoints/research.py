from fastapi import APIRouter, Depends, HTTPException, Query
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
    
    # Attach report_id if available
    report = db.query(MarketReport).filter(MarketReport.task_id == task_id).first()
    response_data = TaskStatusResponse.from_orm(task)
    if report:
        response_data.report_id = report.id
    return response_data


@router.get("/reports/{report_id}", response_model=MarketReportResponse, summary="Get Full Market Report")
def get_market_report(report_id: str, db: Session = Depends(get_db)):
    """
    Retrieves the complete structured market intelligence dossier.
    """
    report = db.query(MarketReport).filter(MarketReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail=f"Market report '{report_id}' not found.")
    return report


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
