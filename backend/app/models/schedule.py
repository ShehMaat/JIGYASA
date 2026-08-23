from sqlalchemy import Column, String, Boolean, DateTime, Text
from datetime import datetime
import uuid

from app.core.database import Base


class ScheduledResearch(Base):
    """
    SQLAlchemy model for automated scheduled market intelligence research jobs.
    The APScheduler polls this table and fires research tasks based on next_run_at.
    """
    __tablename__ = "scheduled_research"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    company_name = Column(String, nullable=False)
    industry = Column(String, nullable=False)
    focus_areas = Column(Text, nullable=True)            # JSON-serialized list of strings
    frequency = Column(String, nullable=False, default="weekly")
    # Frequency options: "daily", "weekly", "monthly"
    is_active = Column(Boolean, default=True, nullable=False)
    next_run_at = Column(DateTime, nullable=True, index=True)
    last_run_at = Column(DateTime, nullable=True)
    last_report_id = Column(String, nullable=True)
    last_digest = Column(Text, nullable=True)            # Latest AI digest bullets (JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
