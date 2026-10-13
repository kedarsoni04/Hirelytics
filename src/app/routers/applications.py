from datetime import datetime, timezone
from typing import Optional, List, Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from pydantic import BaseModel, ConfigDict

from app import models, schemas
from app.database import get_db
from app.routers.auth import get_current_user, get_current_role
from app.services.pdf_service import generate_offer_letter_pdf
from app.services.email_service import send_offer_letter_email
from app.services.storage_service import upload_offer_letter

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
    offer_status: Optional[str] = "pending"
    offer_letter_url: Optional[str] = None
    offer_responded_at: Optional[datetime] = None


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

    assess_flags = submission_obj.proctor_flags if (submission_obj and isinstance(submission_obj.proctor_flags, list)) else []
    interview_flags = interview_obj.proctor_flags if (interview_obj and isinstance(interview_obj.proctor_flags, list)) else []
    total_proctor_flags_count = len(assess_flags) + len(interview_flags)
    has_proctor_violations = total_proctor_flags_count > 0

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
        "offer_status": getattr(app_obj, "offer_status", "pending") or "pending",
        "offer_letter_url": getattr(app_obj, "offer_letter_url", None),
        "offer_responded_at": getattr(app_obj, "offer_responded_at", None),
        "has_proctor_violations": has_proctor_violations,
        "proctor_flags_count": total_proctor_flags_count,
        "proctor_violations": assess_flags + interview_flags,
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

    # Anti-Multiple Offer / Acceptance Rule:
    # If candidate accepts an offer, they cannot apply for any other drives.
    accepted_app = (
        db.query(models.Application)
        .filter(
            models.Application.student_id == student.id,
            (models.Application.offer_status == "accepted") | (models.Application.current_stage == models.ApplicationStage.hired),
        )
        .first()
    )
    if accepted_app:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already accepted an offer for a placement drive and cannot apply for additional drives.",
        )

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
        # Reset offer_status to pending whenever offer is (re-)extended
        app_obj.offer_status = "pending"
        app_obj.offer_responded_at = None

        log = models.ActivityLog(
            user_id=app_obj.student.user_id,
            action=f"Offer received from {company.company_name} for {app_obj.drive.title}",
            log_metadata={"drive_id": app_obj.drive.id, "application_id": app_obj.id}
        )
        db.add(log)

        notif = models.Notification(
            user_id=app_obj.student.user_id,
            type="offer",
            message=f"Congratulations! You received an offer from {company.company_name} for {app_obj.drive.title}. Please respond to the offer in your dashboard."
        )
        db.add(notif)

        # Send offer letter email to candidate when the offer is extended
        student_email = app_obj.student.user.email if (app_obj.student and app_obj.student.user) else ""
        student_name = app_obj.student.full_name or "Candidate"
        company_name_val = company.company_name or "Company"
        job_title = app_obj.drive.title or "Position"
        package = app_obj.drive.package or ""
        location = app_obj.drive.location or ""
        college = app_obj.student.college or ""
        branch = app_obj.student.branch or ""
        cgpa = float(app_obj.student.cgpa) if app_obj.student.cgpa is not None else None

        try:
            pdf_bytes = generate_offer_letter_pdf(
                candidate_name=student_name,
                candidate_email=student_email,
                company_name=company_name_val,
                job_title=job_title,
                package=package,
                location=location,
                college=college,
                branch=branch,
                cgpa=cgpa,
                offer_date=datetime.now(timezone.utc).strftime("%B %d, %Y"),
            )
            offer_url = upload_offer_letter(pdf_bytes, app_obj.id)
            if offer_url:
                app_obj.offer_letter_url = offer_url

            if student_email:
                send_offer_letter_email(
                    to_email=student_email,
                    candidate_name=student_name,
                    company_name=company_name_val,
                    job_title=job_title,
                    pdf_bytes=pdf_bytes,
                    filename=f"Offer_Letter_{company_name_val.replace(' ', '_')}.pdf",
                )
        except Exception as e:
            print(f"[Error generating/sending offer letter]: {e}")

    elif payload.current_stage == models.ApplicationStage.hired:
        log = models.ActivityLog(
            user_id=app_obj.student.user_id,
            action=f"Hired for {app_obj.drive.title} at {company.company_name}",
            log_metadata={"drive_id": app_obj.drive.id, "application_id": app_obj.id}
        )
        db.add(log)

        notif = models.Notification(
            user_id=app_obj.student.user_id,
            type="offer",
            message=f"Congratulations! You have been officially hired by {company.company_name} for {app_obj.drive.title}."
        )
        db.add(notif)

    db.commit()
    db.refresh(app_obj)
    return app_obj


@router.post("/{application_id}/offer-response", response_model=ApplicationDetailOut)
def respond_to_offer(
    application_id: str,
    payload: schemas.OfferResponseRequest,
    current_user: models.User = Depends(get_current_role(models.UserRole.student)),
    db: Session = Depends(get_db),
):
    student = db.query(models.Student).filter(models.Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")

    app_obj = (
        db.query(models.Application)
        .options(
            joinedload(models.Application.drive).joinedload(models.Drive.company),
            joinedload(models.Application.drive).joinedload(models.Drive.assessment),
            joinedload(models.Application.student).joinedload(models.Student.user),
            joinedload(models.Application.scorecard),
            joinedload(models.Application.interview),
            joinedload(models.Application.assessment_submission),
        )
        .filter(models.Application.id == application_id)
        .first()
    )
    if not app_obj:
        raise HTTPException(status_code=404, detail="Application not found")
    if app_obj.student_id != student.id:
        raise HTTPException(status_code=403, detail="You do not have permission to respond to this offer")

    if app_obj.current_stage not in [models.ApplicationStage.offered, models.ApplicationStage.hired]:
        raise HTTPException(status_code=400, detail="An offer has not been extended for this application yet.")

    resp_clean = payload.response.lower().strip()
    if resp_clean not in ["accepted", "rejected"]:
        raise HTTPException(status_code=400, detail="Invalid response. Must be 'accepted' or 'rejected'.")

    app_obj.offer_status = resp_clean
    app_obj.offer_responded_at = datetime.now(timezone.utc)

    # When rejected: keep current_stage as "offered" so the candidate stays in the drive
    # and the recruiter can still extend the offer again or choose to hire.
    # When accepted: keep current_stage as "offered" — recruiter still decides whether to hire.

    company_user_id = app_obj.drive.company.user_id if (app_obj.drive and app_obj.drive.company) else None
    drive_title = app_obj.drive.title if app_obj.drive else "Drive"
    company_name = app_obj.drive.company.company_name if (app_obj.drive and app_obj.drive.company) else "Company"

    if resp_clean == "accepted":
        log = models.ActivityLog(
            user_id=current_user.id,
            action=f"Accepted job offer for {drive_title} at {company_name}",
            log_metadata={"drive_id": app_obj.drive_id, "application_id": app_obj.id}
        )
        db.add(log)

        notif_student = models.Notification(
            user_id=current_user.id,
            type="offer",
            message=f"You accepted the offer for {drive_title} at {company_name}. Awaiting final hiring confirmation from the recruiter."
        )
        db.add(notif_student)

        if company_user_id:
            notif_company = models.Notification(
                user_id=company_user_id,
                type="offer",
                message=f"Great news! Candidate {student.full_name} has ACCEPTED your job offer for {drive_title}. You can now proceed to hire them."
            )
            db.add(notif_company)
    else:
        log = models.ActivityLog(
            user_id=current_user.id,
            action=f"Declined job offer for {drive_title} at {company_name}",
            log_metadata={"drive_id": app_obj.drive_id, "application_id": app_obj.id}
        )
        db.add(log)

        notif_student = models.Notification(
            user_id=current_user.id,
            type="offer",
            message=f"You declined the offer for {drive_title}. You remain in the drive — the recruiter may extend a new offer."
        )
        db.add(notif_student)

        if company_user_id:
            notif_company = models.Notification(
                user_id=company_user_id,
                type="offer",
                message=f"Candidate {student.full_name} has REJECTED the job offer for {drive_title}. You can still extend the offer again or remove the candidate."
            )
            db.add(notif_company)

    db.commit()
    db.refresh(app_obj)
    return format_application_response(app_obj)


@router.post("/{application_id}/remove", response_model=ApplicationDetailOut)
def remove_candidate_from_process(
    application_id: str,
    current_user: models.User = Depends(get_current_role(models.UserRole.company)),
    db: Session = Depends(get_db),
):
    company = db.query(models.Company).filter(models.Company.user_id == current_user.id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company profile not found")

    app_obj = (
        db.query(models.Application)
        .options(
            joinedload(models.Application.drive),
            joinedload(models.Application.student),
        )
        .filter(models.Application.id == application_id)
        .first()
    )
    if not app_obj or not app_obj.drive or app_obj.drive.company_id != company.id:
        raise HTTPException(status_code=403, detail="Application not found or not permitted")

    app_obj.current_stage = models.ApplicationStage.rejected

    log = models.ActivityLog(
        user_id=current_user.id,
        action=f"Candidate {app_obj.student.full_name} removed from recruitment process for {app_obj.drive.title}",
        log_metadata={"drive_id": app_obj.drive_id, "application_id": app_obj.id}
    )
    db.add(log)

    notif = models.Notification(
        user_id=app_obj.student.user_id,
        type="application_update",
        message=f"Your application for {app_obj.drive.title} at {company.company_name} has been concluded."
    )
    db.add(notif)

    db.commit()
    db.refresh(app_obj)
    return format_application_response(app_obj)


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
