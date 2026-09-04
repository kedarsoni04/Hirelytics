"""
Hirelytics — Database connection setup

Install:
    pip install sqlalchemy psycopg2-binary python-dotenv

.env file should contain:
    DATABASE_URL=postgresql://user:password@host:port/dbname
"""

import os
import socket
from urllib.parse import urlparse
from dotenv import load_dotenv, find_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

load_dotenv(find_dotenv())

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/hirelytics"
)
connect_args = {}

if DATABASE_URL and "channel_binding=" in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("&channel_binding=require", "").replace("channel_binding=require&", "").replace("channel_binding=require", "")

if DATABASE_URL and "@" in DATABASE_URL:
    try:
        parsed = urlparse(DATABASE_URL)
        if parsed.hostname and not parsed.hostname.startswith("localhost") and not parsed.hostname.startswith("127."):
            addr_info = socket.getaddrinfo(parsed.hostname, parsed.port or 5432)
            ipv4s = [ai[4][0] for ai in addr_info if ai[0] == socket.AF_INET]
            if ipv4s:
                connect_args["hostaddr"] = ipv4s[0]
    except Exception:
        pass

engine = create_engine(DATABASE_URL, connect_args=connect_args)
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
