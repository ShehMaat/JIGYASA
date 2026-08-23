from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum


class TaskStatusEnum(str, Enum):
    QUEUED = "QUEUED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


# Request to trigger research
class ResearchRequest(BaseModel):
    company_name: str = Field(..., example="Stripe", description="Target company or brand to research")
    industry: str = Field(..., example="Fintech / Payment Processing", description="Industry or niche market")
    target_competitors: Optional[List[str]] = Field(default=[], example=["Adyen", "PayPal", "Square", "Checkout.com"])
    focus_areas: Optional[List[str]] = Field(
        default=["pricing", "features", "market_share", "gtm_strategy", "customer_sentiment"],
        description="Key intelligence focus dimensions"
    )
    depth: Optional[str] = Field(default="standard", description="quick, standard, or comprehensive")
    project_id: Optional[str] = None
    prompt_template_id: Optional[str] = None


class CompetitorProfile(BaseModel):
    name: str
    market_position: str
    estimated_market_share: Optional[str] = "N/A"
    key_strengths: List[str]
    key_weaknesses: List[str]
    pricing_strategy: str
    target_segment: str
    differentiation_factor: str


class SWOTAnalysis(BaseModel):
    strengths: List[str]
    weaknesses: List[str]
    opportunities: List[str]
    threats: List[str]


class StrategicRecommendation(BaseModel):
    priority: str = Field(..., description="High, Medium, Low")
    timeframe: str = Field(..., description="Short-term (0-3 mo), Mid-term (3-12 mo), Long-term (1+ yr)")
    title: str
    description: str
    expected_impact: str


class RiskItem(BaseModel):
    risk_title: str
    severity: str = Field(..., description="Critical, High, Medium, Low")
    likelihood: str = Field(..., description="High, Medium, Low")
    mitigation_strategy: str


class MarketOverview(BaseModel):
    tam: Optional[str] = None
    sam: Optional[str] = None
    som: Optional[str] = None
    cagr: Optional[str] = None
    key_trends: List[str] = []


class LogEntry(BaseModel):
    timestamp: str
    message: str
    level: str = "info"


# Full Report Response Schema
class MarketReportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    task_id: str
    project_id: Optional[str] = None
    title: str
    executive_summary: str
    market_overview: MarketOverview
    competitor_analysis: List[CompetitorProfile]
    swot_analysis: SWOTAnalysis
    strategic_recommendations: List[StrategicRecommendation]
    risk_matrix: List[RiskItem]
    raw_evidence: Optional[List[Dict[str, Any]]] = []
    created_at: datetime


class ReportSummaryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    executive_summary: str
    competitor_count: int
    recommendation_count: int
    risk_count: int
    evidence_count: int
    tam: Optional[str] = None
    cagr: Optional[str] = None
    created_at: datetime


# Task Status Response
class TaskStatusResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    company_name: str
    industry: str
    status: TaskStatusEnum
    progress_percentage: int
    current_step: str
    logs: List[Dict[str, Any]]
    error_message: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None
    report_id: Optional[str] = None


# Project Schemas
class ProjectCreate(BaseModel):
    name: str = Field(..., description="Project name")
    description: Optional[str] = Field(default="", description="Project description")


class ProjectResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    description: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class ProjectListItemResponse(ProjectResponse):
    report_count: int = 0


class ProjectDetailReportItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    executive_summary: str
    created_at: datetime


class ProjectDetailResponse(ProjectResponse):
    reports: List[ProjectDetailReportItem] = []
