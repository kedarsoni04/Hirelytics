"""
Hirelytics — Pydantic Schemas
Request/response validation for FastAPI endpoints.

Install:
    pip install pydantic[email]
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, ConfigDict
from app.models import UserRole, StudentStatus, CompanyStatus, DriveStatus, ApplicationStage


# ─────────────────────────────────────────────
# AUTH
# ─────────────────────────────────────────────

class UserSignup(BaseModel):
    email: EmailStr
    password: str
    role: UserRole


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: UserRole


# ─────────────────────────────────────────────
# STUDENT
# ─────────────────────────────────────────────

class StudentCreate(BaseModel):
    full_name: str
    college: Optional[str] = None
    branch: Optional[str] = None
    cgpa: Optional[float] = None
    skills: Optional[List[str]] = []
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None


class StudentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    full_name: str
    college: Optional[str] = None
    branch: Optional[str] = None
    cgpa: Optional[float] = None
    resume_url: Optional[str] = None
    skills: List[str] = []
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    profile_photo: Optional[str] = None
    status: StudentStatus
    created_at: datetime


# ─────────────────────────────────────────────
# COMPANY
# ─────────────────────────────────────────────

class CompanyCreate(BaseModel):
    company_name: str
    industry: Optional[str] = None


class CompanyOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    company_name: str
    industry: Optional[str] = None
    logo_url: Optional[str] = None
    status: CompanyStatus
    created_at: datetime


# ─────────────────────────────────────────────
# DRIVE
# ─────────────────────────────────────────────

class DriveCreate(BaseModel):
    title: str
    description: Optional[str] = None
    package: Optional[str] = None
    location: Optional[str] = None
    min_cgpa: Optional[float] = None
    eligible_branches: Optional[List[str]] = []
    max_backlogs: Optional[int] = 0
    selection_stages: Optional[List[str]] = ["resume", "assessment", "ai_interview", "hr"]
    deadline: Optional[datetime] = None


class DriveOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    company_id: str
    title: str
    description: Optional[str]
    package: Optional[str]
    location: Optional[str]
    min_cgpa: Optional[float]
    eligible_branches: List[str]
    max_backlogs: int
    selection_stages: List[str]
    status: DriveStatus
    deadline: Optional[datetime]
    created_at: datetime


# ─────────────────────────────────────────────
# APPLICATION
# ─────────────────────────────────────────────

class ApplicationCreate(BaseModel):
    drive_id: str


class ApplicationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    student_id: str
    drive_id: str
    current_stage: ApplicationStage
    applied_at: datetime
    updated_at: datetime


class ApplicationStageUpdate(BaseModel):
    current_stage: ApplicationStage


# ─────────────────────────────────────────────
# SCORECARD (AI OUTPUT)
# ─────────────────────────────────────────────

class ScorecardOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    application_id: str
    resume_match_score: Optional[float]
    assessment_score: Optional[float]
    communication_score: Optional[float]
    overall_ai_score: Optional[float]
    ai_summary: Optional[str]
    ai_insights: List[str]
    generated_at: datetime


# ─────────────────────────────────────────────
# ASSESSMENT
# ─────────────────────────────────────────────

class AssessmentQuestion(BaseModel):
    question: str
    options: List[str]
    correct_option: int  # index into options


class AssessmentCreate(BaseModel):
    drive_id: str
    questions: List[AssessmentQuestion]
    duration_mins: int = 30


class AssessmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    drive_id: str
    questions: List[Dict[str, Any]]
    duration_mins: int


class AssessmentSubmissionCreate(BaseModel):
    application_id: str
    answers: List[Dict[str, Any]]  # [{question_id, selected_option}]
    proctor_flags: Optional[List[Dict[str, Any]]] = []


class AssessmentSubmissionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    application_id: str
    score: Optional[float]
    proctor_flags: List[Dict[str, Any]]
    submitted_at: datetime


# ─────────────────────────────────────────────
# INTERVIEW
# ─────────────────────────────────────────────

class InterviewCreate(BaseModel):
    application_id: str
    questions: List[str]


class InterviewSubmit(BaseModel):
    transcript: str  # from Whisper transcription (frontend sends audio, backend transcribes, or frontend sends transcript directly)


class InterviewOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    application_id: str
    questions: List[str]
    transcript: Optional[str]
    video_url: Optional[str]
    sentiment_data: Dict[str, Any]
    scheduled_at: Optional[datetime]
    completed_at: Optional[datetime]


# ─────────────────────────────────────────────
# NOTIFICATIONS
# ─────────────────────────────────────────────

class NotificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    type: str
    message: str
    is_read: bool
    created_at: datetime
