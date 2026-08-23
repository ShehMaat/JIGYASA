import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from app.core.database import get_db
from app.models.comment import DossierComment
from app.models.activity import ActivityEvent

router = APIRouter(prefix="/comments", tags=["Collaboration & Activity"])


# ─── Pydantic Schemas ───────────────────────────────────────────────────────

class CommentCreate(BaseModel):
    author_name: Optional[str] = "Anonymous Analyst"
    content: str


class CommentResponse(BaseModel):
    id: str
    report_id: str
    author_name: str
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ActivityResponse(BaseModel):
    id: str
    event_type: str
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    description: str
    actor: Optional[str] = "System"
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Comment Endpoints ───────────────────────────────────────────────────────

@router.post("/reports/{report_id}", response_model=CommentResponse, summary="Post Comment on Dossier")
def create_comment(report_id: str, payload: CommentCreate, db: Session = Depends(get_db)):
    """
    Posts an analyst comment or annotation on a market intelligence dossier.
    Auto-logs an activity event on the platform feed.
    """
    comment = DossierComment(
        id=str(uuid.uuid4()),
        report_id=report_id,
        author_name=payload.author_name or "Anonymous Analyst",
        content=payload.content,
    )
    db.add(comment)

    # Log activity event
    event = ActivityEvent(
        id=str(uuid.uuid4()),
        event_type="comment.posted",
        entity_type="report",
        entity_id=report_id,
        description=f"{payload.author_name or 'Anonymous Analyst'} commented on report {report_id[:8]}...",
        actor=payload.author_name or "Anonymous Analyst",
    )
    db.add(event)
    db.commit()
    db.refresh(comment)
    return comment


@router.get("/reports/{report_id}", response_model=List[CommentResponse], summary="List Comments on Dossier")
def list_comments(report_id: str, db: Session = Depends(get_db)):
    """
    Returns all analyst comments on a specific market intelligence dossier.
    """
    return db.query(DossierComment).filter(
        DossierComment.report_id == report_id
    ).order_by(DossierComment.created_at.desc()).all()


@router.delete("/{comment_id}", summary="Delete Comment")
def delete_comment(comment_id: str, db: Session = Depends(get_db)):
    """Deletes an analyst comment by ID."""
    comment = db.query(DossierComment).filter(DossierComment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found.")
    db.delete(comment)
    db.commit()
    return {"status": "deleted", "id": comment_id}


# ─── Activity Feed Endpoint ──────────────────────────────────────────────────

@router.get("/activity/feed", response_model=List[ActivityResponse], summary="Platform Activity Feed", tags=["Collaboration & Activity"])
def get_activity_feed(limit: int = 50, db: Session = Depends(get_db)):
    """
    Returns a paginated platform-wide activity timeline ordered by most recent.
    """
    return db.query(ActivityEvent).order_by(ActivityEvent.created_at.desc()).limit(limit).all()


def log_activity(db: Session, event_type: str, entity_type: str, entity_id: str, description: str, actor: str = "System"):
    """
    Helper: Log a platform activity event into the activity feed.
    Call this from other services when significant events occur.
    """
    event = ActivityEvent(
        id=str(uuid.uuid4()),
        event_type=event_type,
        entity_type=entity_type,
        entity_id=entity_id,
        description=description,
        actor=actor,
    )
    db.add(event)
    db.commit()
