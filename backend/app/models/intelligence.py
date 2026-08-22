from sqlalchemy import Column, String, Integer, DateTime, Text, JSON, ForeignKey, Enum as SQLEnum, Float
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
import uuid

from app.core.database import Base


class TaskStatus(str, enum.Enum):
    QUEUED = "QUEUED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class Project(Base):
    __tablename__ = "projects"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    tasks = relationship("ResearchTask", back_populates="project", cascade="all, delete-orphan")
    reports = relationship("MarketReport", back_populates="project", cascade="all, delete-orphan")


class ResearchTask(Base):
    __tablename__ = "research_tasks"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String(36), ForeignKey("projects.id"), nullable=True)
    company_name = Column(String(255), nullable=False)
    industry = Column(String(255), nullable=False)
    target_competitors = Column(JSON, default=list)  # list of strings
    focus_areas = Column(JSON, default=list)        # list of strings (e.g. ['pricing', 'features', 'market_share'])
    depth = Column(String(50), default="standard")   # quick, standard, comprehensive
    
    status = Column(SQLEnum(TaskStatus), default=TaskStatus.QUEUED)
    progress_percentage = Column(Integer, default=0)
    current_step = Column(String(255), default="Initialized")
    logs = Column(JSON, default=list)               # list of {timestamp, message, level}
    error_message = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    project = relationship("Project", back_populates="tasks")
    report = relationship("MarketReport", back_populates="task", uselist=False)


class MarketReport(Base):
    __tablename__ = "market_reports"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    task_id = Column(String(36), ForeignKey("research_tasks.id"), nullable=False)
    project_id = Column(String(36), ForeignKey("projects.id"), nullable=True)
    
    title = Column(String(255), nullable=False)
    executive_summary = Column(Text, nullable=False)
    market_overview = Column(JSON, default=dict)      # TAM, SAM, SOM, CAGR, Trends
    competitor_analysis = Column(JSON, default=list)  # List of competitor profiles
    swot_analysis = Column(JSON, default=dict)        # {strengths: [], weaknesses: [], opportunities: [], threats: []}
    strategic_recommendations = Column(JSON, default=list) # List of action items
    risk_matrix = Column(JSON, default=list)          # List of risks and mitigations
    raw_evidence = Column(JSON, default=list)         # List of citations & evidence notes
    
    created_at = Column(DateTime, default=datetime.utcnow)

    task = relationship("ResearchTask", back_populates="report")
    project = relationship("Project", back_populates="reports")


class VectorDocument(Base):
    __tablename__ = "vector_documents"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(255), nullable=False)
    source_url = Column(String(500), nullable=True)
    content = Column(Text, nullable=False)
    embedding_json = Column(JSON, nullable=True)     # Embeddings stored as float array for cross-DB compatibility
    doc_metadata = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)
