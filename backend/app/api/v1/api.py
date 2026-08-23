from fastapi import APIRouter
from app.api.v1.endpoints import research, projects, knowledge, monitoring, auth, notifications, comments, schedules, search

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(research.router)
api_router.include_router(projects.router)
api_router.include_router(knowledge.router)
api_router.include_router(monitoring.router)
api_router.include_router(notifications.router)
api_router.include_router(comments.router)
api_router.include_router(schedules.router)
api_router.include_router(search.router)
