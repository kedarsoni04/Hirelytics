"""
Hirelytics — Database connection setup

Install:
    pip install sqlalchemy psycopg2-binary python-dotenv

.env file should contain:
    DATABASE_URL=postgresql://user:password@host:port/dbname
"""

import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/hirelytics"
)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Import Base from models so both share the same metadata
from app.models import Base  # noqa: E402


def get_db():
    """FastAPI dependency — yields a DB session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Creates all tables. Call this once on startup, or use Alembic migrations instead."""
    Base.metadata.create_all(bind=engine)
