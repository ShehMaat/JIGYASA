from fastapi import APIRouter
from app.api.v1.endpoints import research, projects

api_router = APIRouter()
api_router.include_router(research.router)
api_router.include_router(projects.router)
