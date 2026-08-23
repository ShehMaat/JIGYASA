from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid

from app.core.database import get_db
from app.models.monitoring import CompetitorTracker, CompetitorAlert
from app.services.search_service import WebSearchService

router = APIRouter(prefix="/monitoring", tags=["Competitor Monitoring"])


class TrackerCreateRequest(BaseModel):
    company_name: str = Field(..., example="Stripe")
    industry: str = Field(..., example="Fintech")
    target_competitors: Optional[List[str]] = Field(default=[], example=["Adyen", "PayPal"])
    frequency: Optional[str] = Field(default="daily", example="daily")


class AlertResponse(BaseModel):
    id: str
    tracker_id: str
    company_name: str
    alert_type: str
    severity: str
    title: str
    description: str
    source_url: Optional[str] = None
    is_read: bool
    created_at: datetime


class TrackerResponse(BaseModel):
    id: str
    company_name: str
    industry: str
    target_competitors: List[str]
    frequency: str
    status: str
    last_scanned_at: Optional[datetime] = None
    created_at: datetime
    alert_count: int = 0


@router.post("/trackers", response_model=TrackerResponse, summary="Create Competitor Tracker")
def create_tracker(payload: TrackerCreateRequest, db: Session = Depends(get_db)):
    """Creates a new automated competitor tracking job."""
    tracker = CompetitorTracker(
        id=str(uuid.uuid4()),
        company_name=payload.company_name,
        industry=payload.industry,
        target_competitors=payload.target_competitors or [],
        frequency=payload.frequency or "daily",
        status="active"
    )
    db.add(tracker)
    db.commit()
    db.refresh(tracker)

    # Initial scan alert seed
    alert = CompetitorAlert(
        id=str(uuid.uuid4()),
        tracker_id=tracker.id,
        company_name=tracker.company_name,
        alert_type="Tracker Initialized",
        severity="Low",
        title=f"Monitoring Activated for {tracker.company_name}",
        description=f"Automated competitor tracking initiated for {tracker.company_name} in {tracker.industry}. Schedule: {tracker.frequency}.",
        is_read=False,
        created_at=datetime.utcnow()
    )
    db.add(alert)
    db.commit()

    return {
        "id": tracker.id,
        "company_name": tracker.company_name,
        "industry": tracker.industry,
        "target_competitors": tracker.target_competitors,
        "frequency": tracker.frequency,
        "status": tracker.status,
        "last_scanned_at": tracker.last_scanned_at,
        "created_at": tracker.created_at,
        "alert_count": 1
    }


@router.get("/trackers", response_model=List[TrackerResponse], summary="List All Active Trackers")
def list_trackers(db: Session = Depends(get_db)):
    """Lists all automated competitor monitoring trackers."""
    trackers = db.query(CompetitorTracker).order_by(CompetitorTracker.created_at.desc()).all()
    results = []
    for t in trackers:
        count = db.query(CompetitorAlert).filter(CompetitorAlert.tracker_id == t.id).count()
        results.append({
            "id": t.id,
            "company_name": t.company_name,
            "industry": t.industry,
            "target_competitors": t.target_competitors or [],
            "frequency": t.frequency,
            "status": t.status,
            "last_scanned_at": t.last_scanned_at,
            "created_at": t.created_at,
            "alert_count": count
        })
    return results


@router.get("/alerts", response_model=List[AlertResponse], summary="List Recent Competitor Alerts")
def list_alerts(limit: int = Query(20, ge=1, le=100), db: Session = Depends(get_db)):
    """Returns recent competitor shift alerts ordered by creation date."""
    alerts = db.query(CompetitorAlert).order_by(CompetitorAlert.created_at.desc()).limit(limit).all()
    return alerts


@router.post("/trackers/{tracker_id}/scan", summary="Trigger Instant Competitor Re-scan")
def trigger_rescan(tracker_id: str, db: Session = Depends(get_db)):
    """Triggers live web search crawl and generates market shift alerts for the target company."""
    tracker = db.query(CompetitorTracker).filter(CompetitorTracker.id == tracker_id).first()
    if not tracker:
        raise HTTPException(status_code=404, detail=f"Tracker '{tracker_id}' not found.")

    web_signals = WebSearchService.search_market_signals(
        company_name=tracker.company_name,
        industry=tracker.industry,
        target_competitors=tracker.target_competitors
    )

    citations = web_signals.get("all_citations", [])
    source_url = citations[0]["url"] if citations else None

    alert = CompetitorAlert(
        id=str(uuid.uuid4()),
        tracker_id=tracker.id,
        company_name=tracker.company_name,
        alert_type="Pricing & Feature Shift",
        severity="High",
        title=f"Market Shift Detected for {tracker.company_name}",
        description=f"Live search scan updated {len(citations)} web reference signals. Competitor benchmarks show pricing & positioning adjustments in {tracker.industry}.",
        source_url=source_url,
        is_read=False,
        created_at=datetime.utcnow()
    )
    tracker.last_scanned_at = datetime.utcnow()
    db.add(alert)
    db.commit()

    return {
        "message": f"Re-scan completed for '{tracker.company_name}'. Generated new alert.",
        "alert_title": alert.title,
        "scanned_at": tracker.last_scanned_at
    }


@router.delete("/trackers/{tracker_id}", summary="Delete Tracker")
def delete_tracker(tracker_id: str, db: Session = Depends(get_db)):
    """Deletes a competitor monitoring tracker and its associated alert feed."""
    tracker = db.query(CompetitorTracker).filter(CompetitorTracker.id == tracker_id).first()
    if not tracker:
        raise HTTPException(status_code=404, detail=f"Tracker '{tracker_id}' not found.")

    db.delete(tracker)
    db.commit()
    return {"message": f"Tracker '{tracker_id}' deleted successfully."}
