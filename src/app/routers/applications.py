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

    return {
        "id": app_obj.id,
        "student_id": app_obj.student_id,
        "drive_id": app_obj.drive_id,
        "current_stage": app_obj.current_stage,
        "applied_at": app_obj.applied_at,
        "updated_at": app_obj.updated_at,
        "drive": drive_info,
        "student": student_info,
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
        .options(joinedload(models.Application.drive).joinedload(models.Drive.company), joinedload(models.Application.student))
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
        .options(joinedload(models.Application.drive).joinedload(models.Drive.company), joinedload(models.Application.student))
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

    app_obj.current_stage = payload.current_stage

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
