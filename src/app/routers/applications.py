from datetime import datetime
from typing import Optional, List, Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from pydantic import BaseModel, ConfigDict

from app import models, schemas
from app.database import get_db
from app.routers.auth import get_current_user, get_current_role

router = APIRouter()


class DriveDetailForApplication(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    company_name: Optional[str] = None
    package: Optional[str] = None
    location: Optional[str] = None
    status: Optional[models.DriveStatus] = None


class StudentDetailForApplication(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    full_name: str
    college: Optional[str] = None
    branch: Optional[str] = None
    cgpa: Optional[float] = None
    resume_url: Optional[str] = None
    skills: List[str] = []
    status: Optional[models.StudentStatus] = None


class ApplicationDetailOut(schemas.ApplicationOut):
    drive: Optional[DriveDetailForApplication] = None
    student: Optional[StudentDetailForApplication] = None
    overall_ai_score: Optional[float] = None
    has_assessment: Optional[bool] = False
    assessment_completed: Optional[bool] = False
    assessment_score: Optional[float] = None
    assessment_start: Optional[datetime] = None
    assessment_end: Optional[datetime] = None
    assessment_duration_mins: Optional[int] = None
    is_shortlisted: Optional[bool] = False
    has_interview: Optional[bool] = False
    interview_completed: Optional[bool] = False
    interview_scheduled_at: Optional[datetime] = None
    interview_id: Optional[str] = None


def format_application_response(app_obj: models.Application) -> Dict[str, Any]:
    drive_info = None
    if app_obj.drive:
        drive_info = {
            "id": app_obj.drive.id,
            "title": app_obj.drive.title,
            "company_name": app_obj.drive.company.company_name if app_obj.drive.company else None,
            "package": app_obj.drive.package,
            "location": app_obj.drive.location,
            "status": app_obj.drive.status,
        }

    student_info = None
    if app_obj.student:
        student_info = {
            "id": app_obj.student.id,
            "full_name": app_obj.student.full_name,
            "college": app_obj.student.college,
            "branch": app_obj.student.branch,
            "cgpa": float(app_obj.student.cgpa) if app_obj.student.cgpa is not None else None,
            "resume_url": app_obj.student.resume_url,
            "skills": app_obj.student.skills or [],
            "status": app_obj.student.status,
        }

    scorecard_obj = getattr(app_obj, "scorecard", None)
    overall_ai_score = (
        float(scorecard_obj.overall_ai_score)
        if scorecard_obj and scorecard_obj.overall_ai_score is not None
        else None
    )

    has_assessment = bool(app_obj.drive and app_obj.drive.assessment)
    assess_obj = getattr(app_obj.drive, "assessment", None) if app_obj.drive else None
    assessment_start = assess_obj.assessment_start if assess_obj else None
    assessment_end = assess_obj.assessment_end if assess_obj else None
    assessment_duration_mins = int(assess_obj.duration_mins) if assess_obj and assess_obj.duration_mins else None

    shortlisted_stages = {
        models.ApplicationStage.shortlisted,
        models.ApplicationStage.assessment,
        models.ApplicationStage.ai_interview,
        models.ApplicationStage.hr_round,
        models.ApplicationStage.offered,
        models.ApplicationStage.hired,
    }
    is_shortlisted = app_obj.current_stage in shortlisted_stages

    submission_obj = getattr(app_obj, "assessment_submission", None)
    assessment_completed = bool(submission_obj is not None)
    assessment_score = (
        float(submission_obj.score)
        if submission_obj and submission_obj.score is not None
        else None
    )

    interview_obj = getattr(app_obj, "interview", None)
    has_interview = bool(interview_obj is not None)
    interview_completed = bool(interview_obj and interview_obj.completed_at is not None)
    interview_scheduled_at = interview_obj.scheduled_at if interview_obj else None
    interview_id = str(interview_obj.id) if interview_obj else None

    return {
        "id": app_obj.id,
        "student_id": app_obj.student_id,
        "drive_id": app_obj.drive_id,
        "current_stage": app_obj.current_stage,
        "applied_at": app_obj.applied_at,
        "updated_at": app_obj.updated_at,
        "drive": drive_info,
        "student": student_info,
        "overall_ai_score": overall_ai_score,
        "has_assessment": has_assessment,
        "assessment_completed": assessment_completed,
        "assessment_score": assessment_score,
        "assessment_start": assessment_start,
        "assessment_end": assessment_end,
        "assessment_duration_mins": assessment_duration_mins,
        "is_shortlisted": is_shortlisted,
        "has_interview": has_interview,
        "interview_completed": interview_completed,
        "interview_scheduled_at": interview_scheduled_at,
        "interview_id": interview_id,
    }


@router.post("", response_model=schemas.ApplicationOut, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=schemas.ApplicationOut, status_code=status.HTTP_201_CREATED)
def apply_to_drive(
    payload: schemas.ApplicationCreate,
    current_user: models.User = Depends(get_current_role(models.UserRole.student)),
    db: Session = Depends(get_db),
):
    student = db.query(models.Student).filter(models.Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")

    drive = db.query(models.Drive).filter(models.Drive.id == payload.drive_id).first()
    if not drive:
        raise HTTPException(status_code=404, detail="Drive not found")

    if drive.status != models.DriveStatus.live:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot apply to a drive that is not live",
        )

    # Resume is mandatory — it is the first stage of the selection process (Resume Screening)
    effective_resume_url = payload.resume_url or student.resume_url
    if not effective_resume_url:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="A resume is required to apply. Resume screening is the first stage of the hiring process. Please attach a resume before submitting.",
        )

    if payload.resume_url and payload.resume_url != student.resume_url:
        student.resume_url = payload.resume_url
        db.add(student)

    existing = (
        db.query(models.Application)
        .filter(
            models.Application.student_id == student.id,
            models.Application.drive_id == payload.drive_id,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already applied to this drive",
        )

    application = models.Application(
        student_id=student.id,
        drive_id=drive.id,
        current_stage=models.ApplicationStage.applied,
    )
    db.add(application)
    db.flush()
    
    log = models.ActivityLog(
        user_id=current_user.id,
        action=f"Applied to {drive.title} at {drive.company.company_name}",
        log_metadata={"drive_id": drive.id, "application_id": application.id}
    )
    db.add(log)
    
    # Notify Student
    notif_student = models.Notification(
        user_id=current_user.id,
        type="application_update",
        message=f"Your application to {drive.title} was submitted"
    )
    db.add(notif_student)
    
    # Notify Company
    notif_company = models.Notification(
        user_id=drive.company.user_id,
        type="application_update",
        message=f"New applicant for {drive.title}: {student.full_name}"
    )
    db.add(notif_company)
    
    db.commit()
    db.refresh(application)
    return application


@router.get("/mine", response_model=List[ApplicationDetailOut])
def get_my_applications(
    current_user: models.User = Depends(get_current_role(models.UserRole.student)),
    db: Session = Depends(get_db),
):
    student = db.query(models.Student).filter(models.Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")

    applications = (
        db.query(models.Application)
        .options(
            joinedload(models.Application.drive).joinedload(models.Drive.company),
            joinedload(models.Application.drive).joinedload(models.Drive.assessment),
            joinedload(models.Application.student),
            joinedload(models.Application.scorecard),
            joinedload(models.Application.interview),
            joinedload(models.Application.assessment_submission),
        )
        .filter(models.Application.student_id == student.id)
        .order_by(models.Application.applied_at.desc())
        .all()
    )
    return [format_application_response(app_obj) for app_obj in applications]


@router.get("/drive/{drive_id}", response_model=List[ApplicationDetailOut])
def get_applications_for_drive(
    drive_id: str,
    current_user: models.User = Depends(get_current_role(models.UserRole.company)),
    db: Session = Depends(get_db),
):
    company = db.query(models.Company).filter(models.Company.user_id == current_user.id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company profile not found")

    drive = db.query(models.Drive).filter(models.Drive.id == drive_id).first()
    if not drive:
        raise HTTPException(status_code=404, detail="Drive not found")

    if drive.company_id != company.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation not permitted. You can only view applications for your own drives.",
        )

    applications = (
        db.query(models.Application)
        .options(
            joinedload(models.Application.drive).joinedload(models.Drive.company),
            joinedload(models.Application.drive).joinedload(models.Drive.assessment),
            joinedload(models.Application.student),
            joinedload(models.Application.scorecard),
            joinedload(models.Application.interview),
            joinedload(models.Application.assessment_submission),
        )
        .filter(models.Application.drive_id == drive.id)
        .order_by(models.Application.applied_at.desc())
        .all()
    )
    return [format_application_response(app_obj) for app_obj in applications]


@router.patch("/{application_id}/stage", response_model=schemas.ApplicationOut)
def update_application_stage(
    application_id: str,
    payload: schemas.ApplicationStageUpdate,
    current_user: models.User = Depends(get_current_role(models.UserRole.company)),
    db: Session = Depends(get_db),
):
    company = db.query(models.Company).filter(models.Company.user_id == current_user.id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company profile not found")

    app_obj = (
        db.query(models.Application)
        .filter(models.Application.id == application_id)
        .first()
    )
    if not app_obj:
        raise HTTPException(status_code=404, detail="Application not found")

    if not app_obj.drive or app_obj.drive.company_id != company.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation not permitted. You can only update applications for your own drives.",
        )

    setattr(app_obj, "current_stage", payload.current_stage)

    if payload.current_stage == models.ApplicationStage.shortlisted:
        log = models.ActivityLog(
            user_id=app_obj.student.user_id,
            action=f"Shortlisted for {app_obj.drive.title} at {company.company_name}",
            log_metadata={"drive_id": app_obj.drive.id, "application_id": app_obj.id}
        )
        db.add(log)
        
        notif = models.Notification(
            user_id=app_obj.student.user_id,
            type="shortlisted",
            message=f"You've been shortlisted for {app_obj.drive.title} at {company.company_name}"
        )
        db.add(notif)
    elif payload.current_stage == models.ApplicationStage.offered:
        log = models.ActivityLog(
            user_id=app_obj.student.user_id,
            action=f"Offer received from {company.company_name} for {app_obj.drive.title}",
            log_metadata={"drive_id": app_obj.drive.id, "application_id": app_obj.id}
        )
        db.add(log)

        notif = models.Notification(
            user_id=app_obj.student.user_id,
            type="offer",
            message=f"Congratulations! You received an offer from {company.company_name}"
        )
        db.add(notif)

    db.commit()
    db.refresh(app_obj)
    return app_obj


@router.get("/{application_id}", response_model=ApplicationDetailOut)
def get_application_by_id(
    application_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    app_obj = (
        db.query(models.Application)
        .filter(models.Application.id == application_id)
        .first()
    )
    if not app_obj:
        raise HTTPException(status_code=404, detail="Application not found")

    # Check permission
    if current_user.role == models.UserRole.student:
        student = db.query(models.Student).filter(models.Student.user_id == current_user.id).first()
        if not student or app_obj.student_id != student.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Operation not permitted. You can only view your own applications.",
            )
    elif current_user.role == models.UserRole.company:
        company = db.query(models.Company).filter(models.Company.user_id == current_user.id).first()
        if not company or not app_obj.drive or app_obj.drive.company_id != company.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Operation not permitted. You can only view applications for your own drives.",
            )
    elif current_user.role == models.UserRole.admin:
        pass
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation not permitted.",
        )

    return format_application_response(app_obj)
