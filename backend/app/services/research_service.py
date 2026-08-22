import threading
from datetime import datetime
import uuid
import logging
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.intelligence import ResearchTask, MarketReport, TaskStatus
from app.agents.research_agent import MarketResearchAgent
from app.schemas.intelligence import ResearchRequest

logger = logging.getLogger(__name__)


class ResearchService:
    @staticmethod
    def create_task(db: Session, request: ResearchRequest) -> ResearchTask:
        """Create a new research task in the database and return it."""
        task = ResearchTask(
            id=str(uuid.uuid4()),
            project_id=request.project_id,
            company_name=request.company_name,
            industry=request.industry,
            target_competitors=request.target_competitors,
            focus_areas=request.focus_areas,
            depth=request.depth,
            status=TaskStatus.QUEUED,
            progress_percentage=0,
            current_step="Queued for analysis",
            logs=[{
                "timestamp": datetime.utcnow().isoformat(),
                "message": f"Task queued for {request.company_name} ({request.industry})",
                "level": "info"
            }]
        )
        db.add(task)
        db.commit()
        db.refresh(task)
        return task

    @classmethod
    def execute_task_async(cls, task_id: str):
        """Launches the agent execution in a background thread."""
        thread = threading.Thread(target=cls._run_task_worker, args=(task_id,), daemon=True)
        thread.start()

    @classmethod
    def _run_task_worker(cls, task_id: str):
        """Worker function executing the agent workflow and persisting results."""
        db = SessionLocal()
        try:
            task = db.query(ResearchTask).filter(ResearchTask.id == task_id).first()
            if not task:
                logger.error(f"Task {task_id} not found in worker.")
                return

            task.status = TaskStatus.IN_PROGRESS
            db.commit()

            agent = MarketResearchAgent(
                company_name=task.company_name,
                industry=task.industry,
                target_competitors=task.target_competitors,
                focus_areas=task.focus_areas,
                depth=task.depth
            )

            def progress_callback(step_name: str, percent: int, log_msg: str):
                current_logs = list(task.logs or [])
                current_logs.append({
                    "timestamp": datetime.utcnow().isoformat(),
                    "message": log_msg,
                    "level": "info"
                })
                task.current_step = step_name
                task.progress_percentage = percent
                task.logs = current_logs
                db.commit()

            # Execute agent research flow
            results = agent.run_agent_workflow(progress_callback=progress_callback)

            # Persist MarketReport
            report = MarketReport(
                id=str(uuid.uuid4()),
                task_id=task.id,
                project_id=task.project_id,
                title=results["title"],
                executive_summary=results["executive_summary"],
                market_overview=results["market_overview"],
                competitor_analysis=results["competitor_analysis"],
                swot_analysis=results["swot_analysis"],
                strategic_recommendations=results["strategic_recommendations"],
                risk_matrix=results["risk_matrix"],
                raw_evidence=results.get("raw_evidence", [])
            )
            db.add(report)

            task.status = TaskStatus.COMPLETED
            task.progress_percentage = 100
            task.current_step = "Analysis Completed"
            task.completed_at = datetime.utcnow()
            db.commit()

        except Exception as e:
            logger.exception(f"Error processing research task {task_id}: {e}")
            task = db.query(ResearchTask).filter(ResearchTask.id == task_id).first()
            if task:
                task.status = TaskStatus.FAILED
                task.error_message = str(e)
                current_logs = list(task.logs or [])
                current_logs.append({
                    "timestamp": datetime.utcnow().isoformat(),
                    "message": f"Execution failed: {str(e)}",
                    "level": "error"
                })
                task.logs = current_logs
                db.commit()
        finally:
            db.close()

    @staticmethod
    def execute_quick_sync(db: Session, request: ResearchRequest) -> MarketReport:
        """Executes a synchronous direct analysis and saves it immediately."""
        task = ResearchService.create_task(db, request)
        task.status = TaskStatus.IN_PROGRESS
        db.commit()

        agent = MarketResearchAgent(
            company_name=request.company_name,
            industry=request.industry,
            target_competitors=request.target_competitors,
            focus_areas=request.focus_areas,
            depth=request.depth
        )

        results = agent.run_agent_workflow()

        report = MarketReport(
            id=str(uuid.uuid4()),
            task_id=task.id,
            project_id=task.project_id,
            title=results["title"],
            executive_summary=results["executive_summary"],
            market_overview=results["market_overview"],
            competitor_analysis=results["competitor_analysis"],
            swot_analysis=results["swot_analysis"],
            strategic_recommendations=results["strategic_recommendations"],
            risk_matrix=results["risk_matrix"],
            raw_evidence=results.get("raw_evidence", [])
        )
        db.add(report)

        task.status = TaskStatus.COMPLETED
        task.progress_percentage = 100
        task.current_step = "Completed"
        task.completed_at = datetime.utcnow()
        db.commit()
        db.refresh(report)
        return report
