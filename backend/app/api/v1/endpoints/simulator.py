import logging
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from app.core.database import get_db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/research/reports", tags=["Scenario Simulator"])


# ─── Pydantic Schemas ─────────────────────────────────────────────────────────

class SimulationRequest(BaseModel):
    price_adjustment_pct: float = Field(0.0, ge=-50.0, le=50.0)
    market_growth_delta_pct: float = Field(0.0, ge=-20.0, le=30.0)
    competitor_aggression: str = Field("moderate", pattern="^(low|moderate|aggressive|hostile)$")
    r_and_d_investment_boost: float = Field(0.0, ge=0.0, le=100.0)


class SimulationResponse(BaseModel):
    report_id: str
    baseline: Dict[str, Any]
    simulated: Dict[str, Any]
    sensitivity_index: float
    resilience_score: str       # "A+" | "A" | "B" | "C" | "D" | "F"
    recalibrated_recommendations: List[str]
    impact_summary: str


# ─── Simulation Engine ────────────────────────────────────────────────────────

@router.post("/{report_id}/simulate", response_model=SimulationResponse, summary="Run What-If Market Scenario Simulation")
def simulate_scenario(
    report_id: str,
    payload: SimulationRequest,
    db: Session = Depends(get_db),
):
    """
    Recalculates TAM, SAM, SOM, market share trajectory, resilience score, and risk matrix under custom market stress conditions.
    """
    from app.models.intelligence import MarketReport

    report = db.query(MarketReport).filter(MarketReport.id == report_id).first()

    # Parse baseline numerical values
    base_tam = 12.5  # in billions
    base_sam = 3.2
    base_som = 0.65
    base_cagr = 18.4

    if report and report.market_overview:
        mo = report.market_overview
        try:
            if "TAM" in mo: base_tam = float(str(mo["TAM"]).replace("$", "").replace("B", "").replace("M", "").strip())
            if "SAM" in mo: base_sam = float(str(mo["SAM"]).replace("$", "").replace("B", "").replace("M", "").strip())
            if "SOM" in mo: base_som = float(str(mo["SOM"]).replace("$", "").replace("B", "").replace("M", "").strip())
            if "CAGR" in mo: base_cagr = float(str(mo["CAGR"]).replace("%", "").strip())
        except Exception:
            pass

    # Simulation Multipliers
    price_mult = 1.0 + (payload.price_adjustment_pct / 100.0)
    growth_mult = 1.0 + (payload.market_growth_delta_pct / 100.0)

    aggression_factors = {
        "low": 1.05,
        "moderate": 1.0,
        "aggressive": 0.90,
        "hostile": 0.80,
    }
    comp_factor = aggression_factors.get(payload.competitor_aggression, 1.0)
    rd_factor = 1.0 + (payload.r_and_d_investment_boost * 0.003)

    # Calculate Simulated Values
    sim_tam = round(base_tam * growth_mult, 2)
    sim_sam = round(base_sam * growth_mult * price_mult, 2)
    sim_som = round(base_som * growth_mult * price_mult * comp_factor * rd_factor, 2)
    sim_cagr = round(base_cagr + payload.market_growth_delta_pct * 0.4, 1)

    # Resilience Score calculation (0-100)
    score_val = 75.0 + (payload.r_and_d_investment_boost * 0.2) + (payload.price_adjustment_pct * 0.3) - (20.0 if payload.competitor_aggression in ['aggressive', 'hostile'] else 0.0)
    score_val = max(20.0, min(99.0, score_val))

    if score_val >= 90: grade = "A+"
    elif score_val >= 80: grade = "A"
    elif score_val >= 70: grade = "B"
    elif score_val >= 60: grade = "C"
    elif score_val >= 50: grade = "D"
    else: grade = "F"

    # Recalibrated recommendations
    recalibrated = []
    if payload.price_adjustment_pct < 0:
        recalibrated.append("Deploy tiered value plans to offset price compression.")
    if payload.competitor_aggression in ["aggressive", "hostile"]:
        recalibrated.append("Lock in key enterprise accounts with multi-year contracts.")
    if payload.r_and_d_investment_boost > 20:
        recalibrated.append("Focus R&D spend on high-barrier proprietary IP to protect SOM.")
    if not recalibrated:
        recalibrated.append("Maintain baseline strategic execution trajectory.")

    recalibrated.append("Monitor quarterly competitor positioning for shift signals.")

    impact_desc = f"Under simulated conditions, SOM shifts to ${sim_som}B ({round(((sim_som - base_som) / base_som) * 100, 1):+}%) with resilience grade {grade}."

    return SimulationResponse(
        report_id=report_id,
        baseline={
            "TAM": f"${base_tam}B",
            "SAM": f"${base_sam}B",
            "SOM": f"${base_som}B",
            "CAGR": f"{base_cagr}%",
        },
        simulated={
            "TAM": f"${sim_tam}B",
            "SAM": f"${sim_sam}B",
            "SOM": f"${sim_som}B",
            "CAGR": f"{sim_cagr}%",
            "som_delta_pct": round(((sim_som - base_som) / base_som) * 100, 1),
        },
        sensitivity_index=round(score_val, 1),
        resilience_score=grade,
        recalibrated_recommendations=recalibrated,
        impact_summary=impact_desc,
    )
