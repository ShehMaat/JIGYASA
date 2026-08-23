import logging
from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/research/reports", tags=["Podcast Briefings"])


# ─── Pydantic Schemas ─────────────────────────────────────────────────────────

class DialogueLine(BaseModel):
    speaker: str        # "Alex (Host)" | "Dr. Maya (Analyst)"
    role: str           # "host" | "analyst"
    text: str
    timestamp: str      # e.g. "00:00"
    pitch: float = 1.0  # Web Speech API pitch multiplier
    rate: float = 1.0   # Web Speech API rate multiplier


class PodcastBriefingResponse(BaseModel):
    report_id: str
    title: str
    duration_seconds: int
    formatted_duration: str
    script: List[DialogueLine]
    hosts: Dict[str, Dict[str, Any]]


# ─── Podcast Script Generator ─────────────────────────────────────────────────

@router.get("/{report_id}/podcast", response_model=PodcastBriefingResponse, summary="Generate Executive Audio Podcast Script")
def generate_report_podcast(report_id: str, db: Session = Depends(get_db)):
    """
    Generates a 2-host conversational audio podcast script summarizing the dossier.
    """
    from app.models.intelligence import MarketReport

    report = db.query(MarketReport).filter(MarketReport.id == report_id).first()
    title = report.title if report else "Anthropic & AI Market Intelligence Briefing"
    exec_summary = report.executive_summary if report else "Comprehensive AI market intelligence briefing on foundation models and strategic growth."
    market_overview = (report.market_overview if report and report.market_overview else {"TAM": "$18.5B", "CAGR": "24.6%"})
    swot = (report.swot_analysis if report and report.swot_analysis else {})

    strengths = swot.get("strengths", ["Proprietary AI Safety Architecture", "High Reasoning Performance"])
    threats = swot.get("threats", ["Commoditization of Open Weights", "Compute Supply Bottlenecks"])

    summary_clean = exec_summary.replace("\n", " ").strip()
    first_sentence = summary_clean.split(".")[0] if summary_clean else "The market landscape is evolving rapidly."

    tam_val = str(market_overview.get("TAM", "$18.5 Billion"))
    cagr_val = str(market_overview.get("CAGR", "24.6%"))

    script = [
        DialogueLine(
            speaker="Alex",
            role="host",
            text=f"Welcome to the JIGYASA Executive Audio Briefing. Today, we're diving deep into our latest strategic intelligence report: {title}.",
            timestamp="00:00",
            pitch=1.0,
            rate=1.05,
        ),
        DialogueLine(
            speaker="Dr. Maya",
            role="analyst",
            text=f"Thanks Alex. The primary takeaway here is clear: {first_sentence}. We are seeing tremendous momentum across key enterprise adoption metrics.",
            timestamp="00:15",
            pitch=1.1,
            rate=1.0,
        ),
        DialogueLine(
            speaker="Alex",
            role="host",
            text=f"That's impressive. What do the valuation and TAM numbers look like right now?",
            timestamp="00:35",
            pitch=1.0,
            rate=1.05,
        ),
        DialogueLine(
            speaker="Dr. Maya",
            role="analyst",
            text=f"Our models project the Total Addressable Market at {tam_val}, growing at a compound annual rate of {cagr_val}. The primary driver is enterprise API integration.",
            timestamp="00:48",
            pitch=1.1,
            rate=1.0,
        ),
        DialogueLine(
            speaker="Alex",
            role="host",
            text=f"And looking at the SWOT breakdown, what's the single biggest strength and threat the leadership team needs to monitor?",
            timestamp="01:10",
            pitch=1.0,
            rate=1.05,
        ),
        DialogueLine(
            speaker="Dr. Maya",
            role="analyst",
            text=f"On the strength side, {strengths[0] if strengths else 'tech differentiation'} provides a massive moat. However, the top threat is {threats[0] if threats else 'market compression'}, so speed to execution is crucial.",
            timestamp="01:28",
            pitch=1.1,
            rate=1.0,
        ),
        DialogueLine(
            speaker="Alex",
            role="host",
            text="Fascinating briefing. Thank you Dr. Maya. For the complete SWOT matrix and interactive data models, review the full dossier on JIGYASA AI.",
            timestamp="01:50",
            pitch=1.0,
            rate=1.05,
        ),
    ]

    return PodcastBriefingResponse(
        report_id=report_id,
        title=title,
        duration_seconds=130,
        formatted_duration="02:10",
        script=script,
        hosts={
            "host": {"name": "Alex", "title": "Executive Anchor", "avatar": "🎙️"},
            "analyst": {"name": "Dr. Maya", "title": "Chief Intelligence Analyst", "avatar": "🧠"},
        },
    )
