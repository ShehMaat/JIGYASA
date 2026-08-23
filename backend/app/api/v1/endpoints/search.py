import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/search", tags=["Global Search"])


# ─── Pydantic Schemas ─────────────────────────────────────────────────────────

class SearchResult(BaseModel):
    type: str           # "report" | "project" | "knowledge" | "monitor" | "schedule"
    id: str
    title: str
    subtitle: str
    url: str
    score: float        # relevance score 0-1


class SearchResponse(BaseModel):
    query: str
    total: int
    results: List[SearchResult]


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _score(text: str, query: str) -> float:
    """Simple relevance score: proportion of query words found in text."""
    q_lower = query.lower()
    t_lower = text.lower()
    words = q_lower.split()
    if not words:
        return 0.0
    hits = sum(1 for w in words if w in t_lower)
    # Boost exact match
    bonus = 0.25 if q_lower in t_lower else 0.0
    return min(1.0, round(hits / len(words) + bonus, 3))


# ─── Search Endpoint ──────────────────────────────────────────────────────────

@router.get("/", response_model=SearchResponse, summary="Global Platform Search")
def global_search(
    q: str = Query(..., min_length=1, description="Search query string"),
    types: Optional[str] = Query(None, description="Comma-separated entity types to search"),
    limit: int = Query(30, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """
    Unified full-text search across all platform entities:
    reports, projects, knowledge documents, monitoring targets, scheduled research.

    Returns ranked results grouped by type with deep-link URLs.
    """
    q = q.strip()
    if not q:
        return SearchResponse(query=q, total=0, results=[])

    requested_types = set(types.split(",")) if types else {"reports", "projects", "knowledge", "monitoring", "schedules"}
    results: List[SearchResult] = []
    like = f"%{q}%"

    # ── Reports ────────────────────────────────────────────────────────────────
    if "reports" in requested_types:
        try:
            from app.models.intelligence import MarketReport
            rows = db.query(MarketReport).filter(
                (MarketReport.title.ilike(like)) |
                (MarketReport.executive_summary.ilike(like))
            ).limit(limit).all()
            for r in rows:
                text = f"{r.title} {r.executive_summary[:200] if r.executive_summary else ''}"
                sc = _score(text, q)
                results.append(SearchResult(
                    type="report",
                    id=r.id,
                    title=r.title or "Intelligence Dossier",
                    subtitle=f"{r.created_at.strftime('%b %d, %Y') if r.created_at else ''}",
                    url=f"/reports/{r.id}",
                    score=sc,
                ))
        except Exception as e:
            logger.warning(f"[Search] Reports search error: {e}")

    # ── Projects ───────────────────────────────────────────────────────────────
    if "projects" in requested_types:
        try:
            from app.models.intelligence import Project
            rows = db.query(Project).filter(
                (Project.name.ilike(like)) |
                (Project.description.ilike(like))
            ).limit(limit).all()
            for r in rows:
                text = f"{r.name} {r.description or ''}"
                sc = _score(text, q)
                results.append(SearchResult(
                    type="project",
                    id=r.id,
                    title=r.name,
                    subtitle=r.description[:80] + "..." if r.description and len(r.description) > 80 else (r.description or "Research workspace"),
                    url=f"/projects/{r.id}",
                    score=sc,
                ))
        except Exception as e:
            logger.warning(f"[Search] Projects search error: {e}")

    # ── Knowledge Base ─────────────────────────────────────────────────────────
    if "knowledge" in requested_types:
        try:
            from app.models.intelligence import VectorDocument
            rows = db.query(VectorDocument).filter(
                (VectorDocument.title.ilike(like)) |
                (VectorDocument.content.ilike(like))
            ).limit(limit).all()
            for r in rows:
                text = f"{r.title} {r.content[:200] if r.content else ''}"
                sc = _score(text, q)
                snippet = (r.content[:90] + "...") if r.content and len(r.content) > 90 else (r.content or "")
                results.append(SearchResult(
                    type="knowledge",
                    id=r.id,
                    title=r.title,
                    subtitle=snippet or "Knowledge document",
                    url="/knowledge",
                    score=sc,
                ))
        except Exception as e:
            logger.warning(f"[Search] Knowledge search error: {e}")

    # ── Monitoring Trackers ────────────────────────────────────────────────────
    if "monitoring" in requested_types:
        try:
            from app.models.monitoring import CompetitorTracker
            rows = db.query(CompetitorTracker).filter(
                (CompetitorTracker.company_name.ilike(like)) |
                (CompetitorTracker.industry.ilike(like))
            ).limit(limit).all()
            for r in rows:
                text = f"{r.company_name} {r.industry}"
                sc = _score(text, q)
                results.append(SearchResult(
                    type="monitor",
                    id=r.id,
                    title=r.company_name,
                    subtitle=f"Monitoring · {r.industry}",
                    url="/monitoring",
                    score=sc,
                ))
        except Exception as e:
            logger.warning(f"[Search] Monitoring search error: {e}")

    # ── Scheduled Research ─────────────────────────────────────────────────────
    if "schedules" in requested_types:
        try:
            from app.models.schedule import ScheduledResearch
            rows = db.query(ScheduledResearch).filter(
                (ScheduledResearch.company_name.ilike(like)) |
                (ScheduledResearch.industry.ilike(like))
            ).limit(limit).all()
            for r in rows:
                text = f"{r.company_name} {r.industry}"
                sc = _score(text, q)
                status = "Active" if r.is_active else "Paused"
                results.append(SearchResult(
                    type="schedule",
                    id=r.id,
                    title=r.company_name,
                    subtitle=f"Scheduled {r.frequency} research · {r.industry} · {status}",
                    url="/scheduled",
                    score=sc,
                ))
        except Exception as e:
            logger.warning(f"[Search] Schedules search error: {e}")

    # Sort by relevance score descending
    results.sort(key=lambda x: x.score, reverse=True)

    return SearchResponse(query=q, total=len(results), results=results[:limit])
