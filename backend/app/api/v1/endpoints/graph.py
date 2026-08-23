import logging
from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/graph", tags=["Intelligence Graph"])


# ─── Pydantic Schemas ─────────────────────────────────────────────────────────

class GraphNode(BaseModel):
    id: str
    label: str
    type: str           # "company" | "industry" | "report" | "project" | "schedule"
    color: str
    val: int            # node size weight (e.g. 8 to 24)
    meta: Dict[str, Any] = {}


class GraphLink(BaseModel):
    source: str
    target: str
    relationship: str    # "competes_in" | "has_dossier" | "scheduled_for" | "belongs_to"
    label: str


class GraphTopologyResponse(BaseModel):
    nodes: List[GraphNode]
    links: List[GraphLink]
    stats: Dict[str, int]


# ─── Color Palette for Node Types ─────────────────────────────────────────────

TYPE_COLORS = {
    "company": "#a78bfa",    # Purple
    "industry": "#38bdf8",   # Blue/Cyan
    "report": "#34d399",     # Emerald
    "project": "#f43f5e",    # Rose/Red
    "schedule": "#fbbf24",   # Amber/Yellow
}


# ─── Graph Topology Endpoint ──────────────────────────────────────────────────

@router.get("/nodes", response_model=GraphTopologyResponse, summary="Get Full Entity Relationship Graph Topology")
def get_graph_nodes(db: Session = Depends(get_db)):
    """
    Dynamically generates graph nodes and directed links across all entities:
    Companies, Industries, Dossiers, Projects, and Scheduled Jobs.
    """
    nodes_dict: Dict[str, GraphNode] = {}
    links: List[GraphLink] = []

    def add_node(nid: str, label: str, ntype: str, val: int = 12, meta: Dict[str, Any] = None):
        if nid not in nodes_dict:
            nodes_dict[nid] = GraphNode(
                id=nid,
                label=label,
                type=ntype,
                color=TYPE_COLORS.get(ntype, "#9ca3af"),
                val=val,
                meta=meta or {},
            )

    def add_link(source: str, target: str, rel: str, label: str):
        # Prevent duplicates
        for l in links:
            if l.source == source and l.target == target and l.relationship == rel:
                return
        links.append(GraphLink(source=source, target=target, relationship=rel, label=label))

    # 1. Market Reports & Tasks (Company, Industry, Dossier)
    try:
        from app.models.intelligence import MarketReport, ResearchTask, Project
        reports = db.query(MarketReport).all()
        for r in reports:
            rep_id = f"report-{r.id}"
            add_node(rep_id, r.title or "Market Dossier", "report", val=14, meta={"url": f"/reports/{r.id}"})

            # Fetch associated task if available
            task = db.query(ResearchTask).filter(ResearchTask.id == r.task_id).first()
            if task:
                comp_id = f"company-{task.company_name.lower().replace(' ', '-')}"
                ind_id = f"industry-{task.industry.lower().replace(' ', '-')}"

                add_node(comp_id, task.company_name, "company", val=18, meta={"industry": task.industry})
                add_node(ind_id, task.industry, "industry", val=22)

                add_link(comp_id, ind_id, "competes_in", "operates in")
                add_link(comp_id, rep_id, "has_dossier", "has dossier")

                # Connect competitors from task
                if task.target_competitors and isinstance(task.target_competitors, list):
                    for c_name in task.target_competitors:
                        c_id = f"company-{c_name.lower().replace(' ', '-')}"
                        add_node(c_id, c_name, "company", val=14, meta={"industry": task.industry})
                        add_link(c_id, ind_id, "competes_in", "operates in")
                        add_link(comp_id, c_id, "competes_with", "competes with")

            # Project connection
            if r.project_id:
                proj_id = f"project-{r.project_id}"
                proj = db.query(Project).filter(Project.id == r.project_id).first()
                if proj:
                    add_node(proj_id, proj.name, "project", val=16, meta={"url": f"/projects/{proj.id}"})
                    add_link(rep_id, proj_id, "belongs_to", "assigned to")

    except Exception as e:
        logger.warning(f"[Graph] Error building report nodes: {e}")

    # 2. Research Projects
    try:
        from app.models.intelligence import Project
        projects = db.query(Project).all()
        for p in projects:
            p_id = f"project-{p.id}"
            add_node(p_id, p.name, "project", val=16, meta={"url": f"/projects/{p.id}", "desc": p.description})
    except Exception as e:
        logger.warning(f"[Graph] Error building project nodes: {e}")

    # 3. Scheduled Research Jobs
    try:
        from app.models.schedule import ScheduledResearch
        schedules = db.query(ScheduledResearch).all()
        for s in schedules:
            sched_id = f"schedule-{s.id}"
            comp_id = f"company-{s.company_name.lower().replace(' ', '-')}"
            ind_id = f"industry-{s.industry.lower().replace(' ', '-')}"

            add_node(sched_id, f"Auto: {s.company_name}", "schedule", val=14, meta={"frequency": s.frequency, "url": "/scheduled"})
            add_node(comp_id, s.company_name, "company", val=18, meta={"industry": s.industry})
            add_node(ind_id, s.industry, "industry", val=22)

            add_link(comp_id, ind_id, "competes_in", "operates in")
            add_link(comp_id, sched_id, "scheduled_for", "auto-researched via")
    except Exception as e:
        logger.warning(f"[Graph] Error building schedule nodes: {e}")

    # 4. Competitor Trackers
    try:
        from app.models.monitoring import CompetitorTracker
        trackers = db.query(CompetitorTracker).all()
        for tr in trackers:
            comp_id = f"company-{tr.company_name.lower().replace(' ', '-')}"
            ind_id = f"industry-{tr.industry.lower().replace(' ', '-')}"

            add_node(comp_id, tr.company_name, "company", val=18, meta={"industry": tr.industry})
            add_node(ind_id, tr.industry, "industry", val=22)
            add_link(comp_id, ind_id, "competes_in", "operates in")
    except Exception as e:
        logger.warning(f"[Graph] Error building tracker nodes: {e}")

    # Fallback seed nodes if database is sparse
    if len(nodes_dict) < 3:
        seed_nodes = [
            ("company-openai", "OpenAI", "company", 20),
            ("company-anthropic", "Anthropic", "company", 20),
            ("company-google", "Google DeepMind", "company", 20),
            ("industry-ai", "Artificial Intelligence", "industry", 26),
            ("report-sample-1", "AI Frontier Dossier 2026", "report", 14),
            ("schedule-sample-1", "Auto: Anthropic Weekly", "schedule", 14),
        ]
        for nid, lbl, ntype, val in seed_nodes:
            add_node(nid, lbl, ntype, val)

        add_link("company-openai", "industry-ai", "competes_in", "operates in")
        add_link("company-anthropic", "industry-ai", "competes_in", "operates in")
        add_link("company-google", "industry-ai", "competes_in", "operates in")
        add_link("company-anthropic", "company-openai", "competes_with", "competes with")
        add_link("company-anthropic", "schedule-sample-1", "scheduled_for", "auto-researched via")
        add_link("company-openai", "report-sample-1", "has_dossier", "has dossier")

    nodes_list = list(nodes_dict.values())
    type_counts = {}
    for n in nodes_list:
        type_counts[n.type] = type_counts.get(n.type, 0) + 1

    return GraphTopologyResponse(
        nodes=nodes_list,
        links=links,
        stats={
            "total_nodes": len(nodes_list),
            "total_links": len(links),
            **type_counts,
        }
    )
