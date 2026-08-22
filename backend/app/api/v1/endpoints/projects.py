from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import uuid

from app.core.database import get_db
from app.models.intelligence import Project, ResearchTask, MarketReport

router = APIRouter(prefix="/projects", tags=["Projects"])


@router.post("/", summary="Create Research Project")
def create_project(
    name: str = Query(..., description="Project name"),
    description: str = Query("", description="Project description"),
    db: Session = Depends(get_db)
):
    """Creates a new research project workspace to organize reports."""
    project = Project(
        id=str(uuid.uuid4()),
        name=name,
        description=description,
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return {
        "id": project.id,
        "name": project.name,
        "description": project.description,
        "created_at": project.created_at
    }


@router.get("/", summary="List All Projects")
def list_projects(
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    """Returns all research projects ordered by creation date."""
    projects = db.query(Project).order_by(Project.created_at.desc()).limit(limit).all()
    return [
        {
            "id": p.id,
            "name": p.name,
            "description": p.description,
            "created_at": p.created_at,
            "report_count": db.query(MarketReport).filter(MarketReport.project_id == p.id).count()
        }
        for p in projects
    ]


@router.get("/{project_id}", summary="Get Project Details")
def get_project(project_id: str, db: Session = Depends(get_db)):
    """Returns project details with linked reports."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail=f"Project '{project_id}' not found.")

    reports = db.query(MarketReport).filter(MarketReport.project_id == project_id)\
        .order_by(MarketReport.created_at.desc()).all()

    return {
        "id": project.id,
        "name": project.name,
        "description": project.description,
        "created_at": project.created_at,
        "reports": [
            {
                "id": r.id,
                "title": r.title,
                "executive_summary": r.executive_summary[:200] + "..." if r.executive_summary and len(r.executive_summary) > 200 else r.executive_summary,
                "created_at": r.created_at
            }
            for r in reports
        ]
    }


@router.delete("/{project_id}", summary="Delete Project")
def delete_project(project_id: str, db: Session = Depends(get_db)):
    """Archives/deletes a project and its linked data."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail=f"Project '{project_id}' not found.")

    db.delete(project)
    db.commit()
    return {"message": f"Project '{project_id}' deleted successfully."}
