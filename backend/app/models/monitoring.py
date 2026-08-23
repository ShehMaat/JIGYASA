from sqlalchemy import Column, String, Integer, DateTime, Text, JSON, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.core.database import Base


class CompetitorTracker(Base):
    __tablename__ = "competitor_trackers"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    company_name = Column(String(255), nullable=False)
    industry = Column(String(255), nullable=False)
    target_competitors = Column(JSON, default=list)  # list of strings
    frequency = Column(String(50), default="daily")   # daily, weekly
    status = Column(String(50), default="active")     # active, paused
    last_scanned_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    alerts = relationship("CompetitorAlert", back_populates="tracker", cascade="all, delete-orphan")


class CompetitorAlert(Base):
    __tablename__ = "competitor_alerts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tracker_id = Column(String(36), ForeignKey("competitor_trackers.id"), nullable=False)
    company_name = Column(String(255), nullable=False)
    alert_type = Column(String(100), nullable=False) # Pricing Change, Feature Shift, Positioning Pivot, Market News
    severity = Column(String(50), default="Medium")   # High, Medium, Low
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    source_url = Column(String(500), nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    tracker = relationship("CompetitorTracker", back_populates="alerts")
