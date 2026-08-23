import logging
from typing import Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.services.firebase_service import firebase_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/firebase", tags=["Firebase Cloud Integration"])


class SyncResponse(BaseModel):
    success: bool
    synced_reports: int
    synced_activities: int
    timestamp: str
    status: str


@router.get("/config", summary="Get Firebase Web SDK Configuration")
def get_firebase_config():
    """Returns Web SDK config parameters for initializing client-side Firebase."""
    return firebase_service.get_config()


@router.get("/status", summary="Get Firebase Cloud Connection Status")
def get_firebase_status():
    """Returns Firestore connection state, collection counts, and security rules status."""
    return firebase_service.get_status()


@router.post("/sync", response_model=SyncResponse, summary="Trigger Batch Sync to Firestore")
def trigger_firebase_sync(db: Session = Depends(get_db)):
    """
    Syncs local SQLite/PostgreSQL reports and activity events to Cloud Firestore.
    """
    from app.models.intelligence import MarketReport
    from app.models.activity import ActivityEvent

    reports = db.query(MarketReport).all()
    activities = db.query(ActivityEvent).all()

    result = firebase_service.sync_to_firestore(reports, activities)
    return SyncResponse(**result)
