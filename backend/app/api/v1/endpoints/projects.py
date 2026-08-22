from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import uuid

from app.core.database import get_db
from app.models.intelligence import Project, ResearchTask, MarketReport
from app.schemas.intelligence import (
    ProjectCreate,
    ProjectResponse,
    ProjectListItemResponse,
    ProjectDetailResponse
)

router = APIRouter(prefix="/projects", tags=["Projects"])


@router.post("/", response_model=ProjectResponse, summary="Create Research Project")
def create_project(
    payload: ProjectCreate,
    db: Session = Depends(get_db)
):
    """
    Creates a new research project workspace to organize market intelligence reports.
    Accepts JSON body: {"name": "Project Name", "description": "Optional description"}
    """
    project = Project(
        id=str(uuid.uuid4()),
        name=payload.name,
        description=payload.description or "",
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@router.get("/", response_model=List[ProjectListItemResponse], summary="List All Projects")
def list_projects(
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    """Returns all research projects with linked report counts ordered by creation date."""
    projects = db.query(Project).order_by(Project.created_at.desc()).limit(limit).all()
    results = []
    for p in projects:
        count = db.query(MarketReport).filter(MarketReport.project_id == p.id).count()
        results.append({
            "id": p.id,
            "name": p.name,
            "description": p.description,
            "created_at": p.created_at,
            "updated_at": p.updated_at,
            "report_count": count
        })
    return results


@router.get("/{project_id}", response_model=ProjectDetailResponse, summary="Get Project Details")
def get_project(project_id: str, db: Session = Depends(get_db)):
    """Returns project details along with its linked intelligence reports."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail=f"Project '{project_id}' not found.")

    reports = db.query(MarketReport).filter(MarketReport.project_id == project_id)\
        .order_by(MarketReport.created_at.desc()).all()

    report_items = []
    for r in reports:
        summary_text = r.executive_summary or ""
        if len(summary_text) > 200:
            summary_text = summary_text[:200] + "..."
        report_items.append({
            "id": r.id,
            "title": r.title,
            "executive_summary": summary_text,
            "created_at": r.created_at
        })

    return {
        "id": project.id,
        "name": project.name,
        "description": project.description,
        "created_at": project.created_at,
        "updated_at": project.updated_at,
        "reports": report_items
    }


@router.delete("/{project_id}", summary="Delete Project")
def delete_project(project_id: str, db: Session = Depends(get_db)):
    """Archives/deletes a project and its linked tasks/reports."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail=f"Project '{project_id}' not found.")

    db.delete(project)
    db.commit()
    return {"message": f"Project '{project_id}' deleted successfully."}
