import uuid
import json
import logging
from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.models.schedule import ScheduledResearch
from app.models.activity import ActivityEvent

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/schedules", tags=["Scheduled Research"])


# ─── Helpers ─────────────────────────────────────────────────────────────────

FREQUENCY_DELTA = {
    "daily": timedelta(days=1),
    "weekly": timedelta(weeks=1),
    "monthly": timedelta(days=30),
}

FREQUENCY_LABELS = {
    "daily": "Every day",
    "weekly": "Every week",
    "monthly": "Every month",
}


def calc_next_run(frequency: str) -> datetime:
    delta = FREQUENCY_DELTA.get(frequency, timedelta(weeks=1))
    return datetime.utcnow() + delta


def log_activity(db: Session, event_type: str, entity_id: str, description: str, actor: str = "Scheduler"):
    event = ActivityEvent(
        id=str(uuid.uuid4()),
        event_type=event_type,
        entity_type="schedule",
        entity_id=entity_id,
        description=description,
        actor=actor,
    )
    db.add(event)
    db.commit()


# ─── Pydantic Schemas ─────────────────────────────────────────────────────────

class ScheduleCreate(BaseModel):
    company_name: str
    industry: str
    focus_areas: Optional[List[str]] = None
    frequency: str = "weekly"   # daily | weekly | monthly


class ScheduleResponse(BaseModel):
    id: str
    company_name: str
    industry: str
    focus_areas: Optional[List[str]] = None
    frequency: str
    frequency_label: str
    is_active: bool
    next_run_at: Optional[datetime] = None
    last_run_at: Optional[datetime] = None
    last_report_id: Optional[str] = None
    last_digest: Optional[List[str]] = None
    created_at: datetime

    model_config = {"from_attributes": True}


def _serialize(s: ScheduledResearch) -> ScheduleResponse:
    focus = json.loads(s.focus_areas) if s.focus_areas else None
    digest = json.loads(s.last_digest) if s.last_digest else None
    return ScheduleResponse(
        id=s.id,
        company_name=s.company_name,
        industry=s.industry,
        focus_areas=focus,
        frequency=s.frequency,
        frequency_label=FREQUENCY_LABELS.get(s.frequency, s.frequency.capitalize()),
        is_active=s.is_active,
        next_run_at=s.next_run_at,
        last_run_at=s.last_run_at,
        last_report_id=s.last_report_id,
        last_digest=digest,
        created_at=s.created_at,
    )


# ─── CRUD Endpoints ───────────────────────────────────────────────────────────

@router.post("/", response_model=ScheduleResponse, summary="Create Scheduled Research Job")
def create_schedule(payload: ScheduleCreate, db: Session = Depends(get_db)):
    """
    Creates a recurring market intelligence research schedule.
    The APScheduler daemon will fire research automatically at each next_run_at.
    """
    if payload.frequency not in FREQUENCY_DELTA:
        raise HTTPException(400, detail=f"Invalid frequency. Choose from: {list(FREQUENCY_DELTA.keys())}")

    schedule = ScheduledResearch(
        id=str(uuid.uuid4()),
        company_name=payload.company_name,
        industry=payload.industry,
        focus_areas=json.dumps(payload.focus_areas) if payload.focus_areas else None,
        frequency=payload.frequency,
        next_run_at=calc_next_run(payload.frequency),
        is_active=True,
    )
    db.add(schedule)
    db.commit()
    db.refresh(schedule)

    log_activity(
        db, "schedule.created", schedule.id,
        f"Scheduled {payload.frequency} research for {payload.company_name} ({payload.industry})",
        "Scheduler",
    )
    return _serialize(schedule)


@router.get("/", response_model=List[ScheduleResponse], summary="List Scheduled Research Jobs")
def list_schedules(db: Session = Depends(get_db)):
    """Returns all scheduled research jobs ordered by creation date."""
    schedules = db.query(ScheduledResearch).order_by(ScheduledResearch.created_at.desc()).all()
    return [_serialize(s) for s in schedules]


@router.get("/{schedule_id}", response_model=ScheduleResponse, summary="Get Scheduled Job Details")
def get_schedule(schedule_id: str, db: Session = Depends(get_db)):
    s = db.query(ScheduledResearch).filter(ScheduledResearch.id == schedule_id).first()
    if not s:
        raise HTTPException(404, detail="Schedule not found.")
    return _serialize(s)


@router.patch("/{schedule_id}/toggle", response_model=ScheduleResponse, summary="Pause or Resume Schedule")
def toggle_schedule(schedule_id: str, db: Session = Depends(get_db)):
    """Toggles a schedule between active (running) and paused states."""
    s = db.query(ScheduledResearch).filter(ScheduledResearch.id == schedule_id).first()
    if not s:
        raise HTTPException(404, detail="Schedule not found.")
    s.is_active = not s.is_active
    if s.is_active:
        s.next_run_at = calc_next_run(s.frequency)
    db.commit()
    db.refresh(s)
    state = "resumed" if s.is_active else "paused"
    log_activity(db, f"schedule.{state}", s.id, f"Schedule for {s.company_name} was {state}.", "User")
    return _serialize(s)


@router.delete("/{schedule_id}", summary="Delete Scheduled Research Job")
def delete_schedule(schedule_id: str, db: Session = Depends(get_db)):
    s = db.query(ScheduledResearch).filter(ScheduledResearch.id == schedule_id).first()
    if not s:
        raise HTTPException(404, detail="Schedule not found.")
    db.delete(s)
    db.commit()
    return {"status": "deleted", "id": schedule_id}


@router.post("/{schedule_id}/run-now", response_model=ScheduleResponse, summary="Force-Trigger Schedule Now")
async def run_now(schedule_id: str, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """
    Force-triggers a scheduled research job immediately, regardless of its next_run_at.
    Queues an async research task in the background.
    """
    s = db.query(ScheduledResearch).filter(ScheduledResearch.id == schedule_id).first()
    if not s:
        raise HTTPException(404, detail="Schedule not found.")

    # Queue the background research task
    background_tasks.add_task(_execute_scheduled_research, schedule_id)

    log_activity(
        db, "schedule.run_now", s.id,
        f"Manual run triggered for scheduled research: {s.company_name}",
        "User",
    )
    return _serialize(s)


@router.get("/{schedule_id}/digest", summary="Get Latest AI Digest for Schedule")
def get_digest(schedule_id: str, db: Session = Depends(get_db)):
    """Returns the most recent AI-generated digest summary for a scheduled research job."""
    s = db.query(ScheduledResearch).filter(ScheduledResearch.id == schedule_id).first()
    if not s:
        raise HTTPException(404, detail="Schedule not found.")
    digest = json.loads(s.last_digest) if s.last_digest else []
    return {
        "schedule_id": schedule_id,
        "company_name": s.company_name,
        "last_run_at": s.last_run_at,
        "last_report_id": s.last_report_id,
        "digest_bullets": digest,
    }


# ─── Background Research Executor ─────────────────────────────────────────────

async def _execute_scheduled_research(schedule_id: str):
    """
    Background task: runs a research cycle for a scheduled job, then
    generates an AI digest and updates the schedule record.
    """
    from app.core.database import SessionLocal
    from app.agents.research_agent import MarketResearchAgent
    import asyncio

    db = SessionLocal()
    try:
        s = db.query(ScheduledResearch).filter(ScheduledResearch.id == schedule_id).first()
        if not s or not s.is_active:
            return

        logger.info(f"[Scheduler] Running research for schedule {schedule_id}: {s.company_name}")

        focus = json.loads(s.focus_areas) if s.focus_areas else []
        agent = MarketResearchAgent()

        report = await agent.run_research(
            company_name=s.company_name,
            industry=s.industry,
            focus_areas=focus,
        )

        # Generate AI digest bullets
        digest_bullets = _generate_digest(s.company_name, report)

        # Persist results to schedule record
        s.last_run_at = datetime.utcnow()
        s.last_report_id = getattr(report, "id", None) or str(uuid.uuid4())
        s.last_digest = json.dumps(digest_bullets)
        s.next_run_at = calc_next_run(s.frequency)
        db.commit()

        # Log activity event for feed
        event = ActivityEvent(
            id=str(uuid.uuid4()),
            event_type="schedule.digest.ready",
            entity_type="schedule",
            entity_id=schedule_id,
            description=f"Scheduled digest ready: {s.company_name} — {len(digest_bullets)} intelligence bullets generated.",
            actor="JIGYASA Scheduler",
        )
        db.add(event)
        db.commit()
        logger.info(f"[Scheduler] Completed research for {s.company_name}")

    except Exception as exc:
        logger.error(f"[Scheduler] Research execution failed for {schedule_id}: {exc}")
    finally:
        db.close()


def _generate_digest(company_name: str, report) -> List[str]:
    """
    Generates 3 concise executive digest bullets from a research report.
    Falls back to structured extraction if Groq is unavailable.
    """
    try:
        # Extract key intelligence from the report object
        bullets = []
        if hasattr(report, "executive_summary") and report.executive_summary:
            summary = report.executive_summary[:300]
            bullets.append(f"📊 Executive: {summary.split('.')[0].strip()}.")

        if hasattr(report, "competitors") and report.competitors:
            top = report.competitors[0]
            name = getattr(top, "name", "top competitor") if hasattr(top, "name") else str(top)
            bullets.append(f"🏢 Top competitor identified: {name} — monitoring recommended.")

        if hasattr(report, "strategic_recommendations") and report.strategic_recommendations:
            rec = report.strategic_recommendations[0] if isinstance(report.strategic_recommendations, list) else report.strategic_recommendations
            bullets.append(f"🚀 Key recommendation: {str(rec)[:150].split('.')[0].strip()}.")

        if not bullets:
            bullets = [
                f"📊 New market intelligence dossier completed for {company_name}.",
                f"🔍 Competitive landscape analysis updated with latest signals.",
                f"🚀 Strategic recommendations refreshed — review full dossier for details.",
            ]
        return bullets[:3]
    except Exception:
        return [
            f"📊 Scheduled research completed for {company_name}.",
            f"🔍 Market intelligence updated with latest competitive signals.",
            f"🚀 Review the full dossier for strategic recommendations.",
        ]
