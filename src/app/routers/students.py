from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app import models, schemas
from app.database import get_db
from app.routers.auth import get_current_role
from app.services.storage_service import upload_resume

router = APIRouter()

MAX_RESUME_SIZE = 5 * 1024 * 1024  # 5 MB
ALLOWED_CONTENT_TYPES = {"application/pdf"}
ALLOWED_EXTENSIONS = {".pdf"}


# ── Partial-update schema ─────────────────────────────────────────────────────

class StudentProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    college: Optional[str] = None
    branch: Optional[str] = None
    cgpa: Optional[float] = None
    skills: Optional[List[str]] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    notification_prefs: Optional[dict] = None


# ── Routes ────────────────────────────────────────────────────────────────────

@router.patch("/me", response_model=schemas.StudentOut)
def update_my_profile(
    data: StudentProfileUpdate,
    current_user: models.User = Depends(get_current_role("student")),
    db: Session = Depends(get_db),
):
    student = (
        db.query(models.Student)
        .filter(models.Student.user_id == current_user.id)
        .first()
    )
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")

    # Apply only the fields that were explicitly provided (exclude_unset)
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(student, field, value)

    db.commit()
    db.refresh(student)
    return student


@router.delete("/me")
def delete_my_account(
    current_user: models.User = Depends(get_current_role("student")),
    db: Session = Depends(get_db),
):
    current_user.is_active = False
    student = db.query(models.Student).filter(models.Student.user_id == current_user.id).first()
    if student:
        student.status = models.StudentStatus.suspended
    db.commit()
    return {"message": "Account deactivated successfully"}


@router.post("/me/resume", response_model=schemas.StudentOut)
def upload_student_resume(
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_role("student")),
    db: Session = Depends(get_db),
):
    """Upload a PDF resume for the currently authenticated student."""
    import os

    # ── Validate extension ────────────────────────────────────────────────────
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Only PDF files are accepted.",
        )

    # ── Validate content-type header ─────────────────────────────────────────
    if file.content_type and file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid content type. Only application/pdf is accepted.",
        )

    # ── Read and validate size ────────────────────────────────────────────────
    file_bytes = file.file.read()
    if len(file_bytes) > MAX_RESUME_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File too large. Maximum allowed size is 5 MB.",
        )

    # ── Fetch student record ──────────────────────────────────────────────────
    student = (
        db.query(models.Student)
        .filter(models.Student.user_id == current_user.id)
        .first()
    )
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")

    # ── Upload to Cloudinary ──────────────────────────────────────────────────
    try:
        secure_url = upload_resume(
            file_bytes=file_bytes,
            filename=file.filename or "resume.pdf",
            student_id=str(student.id),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to upload resume to storage: {e}",
        )

    # ── Persist URL ───────────────────────────────────────────────────────────
    student.resume_url = secure_url
    db.commit()
    db.refresh(student)
    return student

@router.get("/me/activity", response_model=List[schemas.ActivityLogOut])
def get_my_activity(
    current_user: models.User = Depends(get_current_role("student")),
    db: Session = Depends(get_db),
):
    activities = (
        db.query(models.ActivityLog)
        .filter(models.ActivityLog.user_id == current_user.id)
        .order_by(models.ActivityLog.created_at.desc())
        .limit(10)
        .all()
    )
    return activities

@router.get("/me/stats", response_model=schemas.StudentStatsOut)
def get_my_stats(
    current_user: models.User = Depends(get_current_role("student")),
    db: Session = Depends(get_db),
):
    student = db.query(models.Student).filter(models.Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")

    applications_sent = db.query(models.Application).filter(models.Application.student_id == student.id).count()

    shortlisted = db.query(models.Application).filter(
        models.Application.student_id == student.id,
        models.Application.current_stage.in_([
            models.ApplicationStage.shortlisted,
            models.ApplicationStage.ai_interview,
            models.ApplicationStage.hr_round,
            models.ApplicationStage.offered,
            models.ApplicationStage.hired
        ])
    ).count()

    offers_received = db.query(models.Application).filter(
        models.Application.student_id == student.id,
        models.Application.current_stage.in_([
            models.ApplicationStage.offered,
            models.ApplicationStage.hired
        ])
    ).count()

    # Interviews scheduled (completed_at is null)
    interviews_scheduled = (
        db.query(models.Interview)
        .join(models.Application)
        .filter(models.Application.student_id == student.id, models.Interview.completed_at == None)
        .count()
    )

    # Assessments submissions
    assessment_subs = (
        db.query(models.AssessmentSubmission)
        .join(models.Application)
        .filter(models.Application.student_id == student.id)
        .all()
    )
    dsa_score = None
    if assessment_subs:
        v_dsa = [float(sub.score) for sub in assessment_subs if sub.score is not None]
        if v_dsa:
            dsa_score = round(sum(v_dsa) / len(v_dsa))

    # Scorecards
    scorecards = (
        db.query(models.Scorecard)
        .join(models.Application)
        .filter(models.Application.student_id == student.id)
        .all()
    )

    ai_score = None
    communication_score = None
    resume_score = None

    if scorecards:
        valid_scores = [float(s.overall_ai_score) for s in scorecards if s.overall_ai_score is not None]
        if valid_scores:
            ai_score = round(sum(valid_scores) / len(valid_scores))

        v_comm = [float(s.communication_score) for s in scorecards if s.communication_score is not None]
        if v_comm:
            communication_score = round(sum(v_comm) / len(v_comm))

        v_res = [float(s.resume_match_score) for s in scorecards if s.resume_match_score is not None]
        if v_res:
            resume_score = round(sum(v_res) / len(v_res))

    return {
        "applications_sent": applications_sent,
        "shortlisted": shortlisted,
        "interviews_scheduled": interviews_scheduled,
        "offers_received": offers_received,
        "ai_score": ai_score,
        "dsa_score": dsa_score,
        "communication_score": communication_score,
        "resume_score": resume_score,
    }
