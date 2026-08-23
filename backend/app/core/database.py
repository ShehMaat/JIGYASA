from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

Base = declarative_base()

def _get_working_engine():
    # First try connecting to configured database (Postgres)
    if settings.DATABASE_URL.startswith("postgres"):
        try:
            pg_engine = create_engine(
                settings.DATABASE_URL,
                pool_pre_ping=True,
                pool_size=10,
                max_overflow=20,
            )
            # Test immediate connection
            with pg_engine.connect() as conn:
                pass
            logger.info("Successfully connected to PostgreSQL database.")
            return pg_engine
        except Exception as e:
            logger.warning(
                f"PostgreSQL connection to {settings.DATABASE_URL} failed ({e}). "
                "Falling back to local SQLite database (jigyasa_dev.db)."
            )

    # Fallback to local SQLite engine
    sqlite_engine = create_engine(
        "sqlite:///./jigyasa_dev.db",
        connect_args={"check_same_thread": False},
    )
    return sqlite_engine


engine = _get_working_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """Dependency that yields a database session."""
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Create all tables in the database."""
    from app.models import intelligence, monitoring, user, webhook  # noqa: F401
    Base.metadata.create_all(bind=engine)

