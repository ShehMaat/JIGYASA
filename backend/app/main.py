from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
from datetime import datetime

from app.core.config import settings
from app.core.database import init_db
from app.api.v1.api import api_router

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)


# ─── APScheduler: Poll & Fire Due Research Jobs ───────────────────────────────

def _poll_and_execute_schedules():
    """
    Runs every 5 minutes. Finds all active scheduled research jobs where
    next_run_at <= now() and fires them as background coroutines.
    """
    import asyncio
    from app.core.database import SessionLocal
    from app.models.schedule import ScheduledResearch
    from app.api.v1.endpoints.schedules import _execute_scheduled_research, calc_next_run

    db = SessionLocal()
    try:
        now = datetime.utcnow()
        due = db.query(ScheduledResearch).filter(
            ScheduledResearch.is_active == True,
            ScheduledResearch.next_run_at <= now,
        ).all()

        for s in due:
            logger.info(f"[APScheduler] Firing scheduled research: {s.company_name} ({s.id})")
            # Advance next_run_at immediately to prevent double-firing
            s.next_run_at = calc_next_run(s.frequency)
            db.commit()
            # Run the async research in a new event loop
            asyncio.run(_execute_scheduled_research(s.id))
    except Exception as exc:
        logger.error(f"[APScheduler] Poll error: {exc}")
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """FastAPI lifespan: boot DB + APScheduler on startup, shutdown gracefully."""
    # ── Startup ──────────────────────────────────────────────────────────────
    logger.info("Initializing database tables...")
    try:
        init_db()
        logger.info("Database tables initialized successfully.")
    except Exception as e:
        logger.warning(f"Database initialization warning: {e}")

    # Boot APScheduler
    try:
        from apscheduler.schedulers.background import BackgroundScheduler
        scheduler = BackgroundScheduler()
        scheduler.add_job(
            _poll_and_execute_schedules,
            trigger="interval",
            minutes=5,
            id="scheduled_research_poller",
            replace_existing=True,
        )
        scheduler.start()
        app.state.scheduler = scheduler
        logger.info("[APScheduler] Scheduled research poller started (every 5 minutes).")
    except Exception as e:
        logger.warning(f"[APScheduler] Could not start scheduler: {e}")

    yield

    # ── Shutdown ─────────────────────────────────────────────────────────────
    try:
        if hasattr(app.state, "scheduler"):
            app.state.scheduler.shutdown(wait=False)
            logger.info("[APScheduler] Scheduler shut down cleanly.")
    except Exception:
        pass


# ─── Initialize FastAPI App ───────────────────────────────────────────────────

app = FastAPI(
    title=settings.APP_NAME,
    description="JIGYASA AI Market Intelligence Platform API with Autonomous Agents & Real-time Insights",
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        settings.FRONTEND_URL,
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Register API Routes
app.include_router(api_router, prefix="/api/v1")



@app.get("/")
def read_root():
    return {
        "platform": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "online",
        "docs": "/docs"
    }


@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "jigyasa-backend"}
