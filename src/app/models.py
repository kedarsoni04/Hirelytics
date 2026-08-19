"""
Hirelytics — SQLAlchemy Models
FastAPI + PostgreSQL backend schema

Install:
    pip install sqlalchemy psycopg2-binary

Usage:
    from app.database import Base
    (Base is imported here — see database.py for engine/session setup)
"""

import uuid
import enum
from datetime import datetime, timezone

from sqlalchemy import (
    Column, String, Text, Boolean, DateTime, ForeignKey,
    Numeric, Integer, Enum as SQLEnum
)
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from sqlalchemy.orm import relationship, declarative_base

Base = declarative_base()


def gen_uuid():
    return str(uuid.uuid4())


# ─────────────────────────────────────────────
# ENUMS
# ─────────────────────────────────────────────

class UserRole(str, enum.Enum):
    student = "student"
    company = "company"
    admin = "admin"


class StudentStatus(str, enum.Enum):
    active = "active"
    flagged = "flagged"
    suspended = "suspended"


class CompanyStatus(str, enum.Enum):
    pending = "pending"
    verified = "verified"
    suspended = "suspended"


class DriveStatus(str, enum.Enum):
    draft = "draft"
    live = "live"
    closed = "closed"


class ApplicationStage(str, enum.Enum):
    applied = "applied"
    resume_screened = "resume_screened"
    assessment = "assessment"
    ai_interview = "ai_interview"
    shortlisted = "shortlisted"
    hr_round = "hr_round"
    offered = "offered"
    hired = "hired"
    rejected = "rejected"


# ─────────────────────────────────────────────
# CORE AUTH
# ─────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    role = Column(SQLEnum(UserRole), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    student = relationship("Student", back_populates="user", uselist=False, cascade="all, delete-orphan")
    company = relationship("Company", back_populates="user", uselist=False, cascade="all, delete-orphan")
    admin = relationship("Admin", back_populates="user", uselist=False, cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")


# ─────────────────────────────────────────────
# PROFILES
# ─────────────────────────────────────────────

class Student(Base):
    __tablename__ = "students"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), unique=True, nullable=False)

    full_name = Column(String, nullable=False)
    college = Column(String)
    branch = Column(String)
    cgpa = Column(Numeric(3, 2))
    resume_url = Column(String)
    skills = Column(ARRAY(String), default=list)
    linkedin_url = Column(String)
    github_url = Column(String)
    portfolio_url = Column(String)
    profile_photo = Column(String)
    notification_prefs = Column(JSONB, default=lambda: {"email": True, "inApp": True})
    status = Column(SQLEnum(StudentStatus), default=StudentStatus.active)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="student")
    applications = relationship("Application", back_populates="student", cascade="all, delete-orphan")


class Company(Base):
    __tablename__ = "companies"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), unique=True, nullable=False)

    company_name = Column(String, nullable=False)
    industry = Column(String)
    logo_url = Column(String)
    notification_prefs = Column(JSONB, default=lambda: {"email": True, "inApp": True})
    status = Column(SQLEnum(CompanyStatus), default=CompanyStatus.pending)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="company")
    drives = relationship("Drive", back_populates="company", cascade="all, delete-orphan")


class Admin(Base):
    __tablename__ = "admins"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), unique=True, nullable=False)

    full_name = Column(String, nullable=False)
    admin_role = Column(String, default="super_admin")

    user = relationship("User", back_populates="admin")


# ─────────────────────────────────────────────
# DRIVES & APPLICATIONS
# ─────────────────────────────────────────────

class Drive(Base):
    __tablename__ = "drives"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    company_id = Column(UUID(as_uuid=False), ForeignKey("companies.id"), nullable=False)

    title = Column(String, nullable=False)
    description = Column(Text)
    package = Column(String)
    location = Column(String)
    min_cgpa = Column(Numeric(3, 2))
    eligible_branches = Column(ARRAY(String), default=list)
    max_backlogs = Column(Integer, default=0)
    selection_stages = Column(JSONB, default=list)  # e.g. ["resume","assessment","ai_interview","hr"]
    status = Column(SQLEnum(DriveStatus), default=DriveStatus.draft)
    deadline = Column(DateTime)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    company = relationship("Company", back_populates="drives")
    applications = relationship("Application", back_populates="drive", cascade="all, delete-orphan")
    assessment = relationship("Assessment", back_populates="drive", uselist=False, cascade="all, delete-orphan")


class Application(Base):
    __tablename__ = "applications"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    student_id = Column(UUID(as_uuid=False), ForeignKey("students.id"), nullable=False)
    drive_id = Column(UUID(as_uuid=False), ForeignKey("drives.id"), nullable=False)

    current_stage = Column(SQLEnum(ApplicationStage), default=ApplicationStage.applied)
    applied_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    student = relationship("Student", back_populates="applications")
    drive = relationship("Drive", back_populates="applications")
    scorecard = relationship("Scorecard", back_populates="application", uselist=False, cascade="all, delete-orphan")
    assessment_submission = relationship("AssessmentSubmission", back_populates="application", uselist=False, cascade="all, delete-orphan")
    interview = relationship("Interview", back_populates="application", uselist=False, cascade="all, delete-orphan")


# ─────────────────────────────────────────────
# AI OUTPUTS
# ─────────────────────────────────────────────

class Scorecard(Base):
    __tablename__ = "scorecards"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    application_id = Column(UUID(as_uuid=False), ForeignKey("applications.id"), unique=True, nullable=False)

    resume_match_score = Column(Numeric(5, 2))
    assessment_score = Column(Numeric(5, 2))
    communication_score = Column(Numeric(5, 2))
    overall_ai_score = Column(Numeric(5, 2))
    ai_summary = Column(Text)          # one-line insight, e.g. "Strong technical fit"
    ai_insights = Column(JSONB, default=list)  # bullet-point highlights
    generated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    application = relationship("Application", back_populates="scorecard")


class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    drive_id = Column(UUID(as_uuid=False), ForeignKey("drives.id"), unique=True, nullable=False)

    questions = Column(JSONB, default=list)  # [{question, options[], correct_option}]
    duration_mins = Column(Integer, default=30)

    drive = relationship("Drive", back_populates="assessment")


class AssessmentSubmission(Base):
    __tablename__ = "assessment_submissions"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    application_id = Column(UUID(as_uuid=False), ForeignKey("applications.id"), unique=True, nullable=False)

    answers = Column(JSONB, default=list)       # [{question_id, selected_option}]
    score = Column(Numeric(5, 2))
    proctor_flags = Column(JSONB, default=list)  # [{type: 'tab_switch', timestamp}]
    submitted_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    application = relationship("Application", back_populates="assessment_submission")


class Interview(Base):
    __tablename__ = "interviews"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    application_id = Column(UUID(as_uuid=False), ForeignKey("applications.id"), unique=True, nullable=False)

    questions = Column(JSONB, default=list)
    transcript = Column(Text)              # from Whisper (Groq)
    video_url = Column(String)             # optional, if recordings are stored
    sentiment_data = Column(JSONB, default=dict)  # {confidence, tone, filler_word_count, ...}
    scheduled_at = Column(DateTime)
    completed_at = Column(DateTime)

    application = relationship("Application", back_populates="interview")


# ─────────────────────────────────────────────
# PLATFORM-WIDE
# ─────────────────────────────────────────────

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=False)

    type = Column(String, nullable=False)   # 'application_update', 'ai_result_ready', etc.
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="notifications")


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=True)

    action = Column(String, nullable=False)
    log_metadata = Column(JSONB, default=dict)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
