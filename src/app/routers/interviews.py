from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app import models, schemas
from app.database import get_db
from app.routers.auth import get_current_user, get_current_role
from app.services.ai_service import analyze_interview, transcribe_audio
from fastapi import UploadFile, File

router = APIRouter()

@router.post("", response_model=schemas.InterviewOut, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=schemas.InterviewOut, status_code=status.HTTP_201_CREATED)
def create_interview(
    payload: schemas.InterviewCreate,
    current_user: models.User = Depends(get_current_role(models.UserRole.company)),
    db: Session = Depends(get_db)
):
    company = db.query(models.Company).filter(models.Company.user_id == current_user.id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company profile not found")

    application = db.query(models.Application).filter(models.Application.id == payload.application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    if not application.drive or application.drive.company_id != company.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not permitted")

    existing_interview = db.query(models.Interview).filter(models.Interview.application_id == payload.application_id).first()
    if existing_interview:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An interview already exists for this application")

    questions = payload.questions
    if not questions:
        questions = [
            "Tell me about a challenging technical project you worked on and how you overcame the obstacles.",
            "Describe a time you had to learn a new technology quickly. How did you approach it?",
            "How do you handle disagreements with team members on technical decisions?",
            "What is your approach to testing and ensuring code quality?"
        ]

    interview = models.Interview(
        application_id=payload.application_id,
        questions=questions,
        scheduled_at=datetime.utcnow(),
    )
    db.add(interview)
    db.commit()
    db.refresh(interview)
    return interview


@router.get("/company/scheduled")
def get_company_scheduled_interviews(
    current_user: models.User = Depends(get_current_role(models.UserRole.company)),
    db: Session = Depends(get_db),
):
    company = db.query(models.Company).filter(models.Company.user_id == current_user.id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company profile not found")

    company_drives = db.query(models.Drive).filter(models.Drive.company_id == company.id).all()
    drive_ids = [d.id for d in company_drives]
    if not drive_ids:
        return []

    interviews = (
        db.query(models.Interview)
        .join(models.Application, models.Interview.application_id == models.Application.id)
        .join(models.Drive, models.Application.drive_id == models.Drive.id)
        .join(models.Student, models.Application.student_id == models.Student.id)
        .filter(models.Drive.id.in_(drive_ids))
        .order_by(models.Interview.scheduled_at.desc())
        .all()
    )

    result = []
    for interview in interviews:
        student = interview.application.student
        drive = interview.application.drive
        scorecard = interview.application.scorecard
        result.append({
            "id": interview.id,
            "application_id": interview.application_id,
            "student_id": student.id if student else None,
            "student_name": student.full_name if student else "Unknown Candidate",
            "college": student.college if student else None,
            "branch": student.branch if student else None,
            "drive_id": drive.id if drive else None,
            "drive_title": drive.title if drive else "Recruitment Drive",
            "scheduled_at": interview.scheduled_at,
            "completed_at": interview.completed_at,
            "status": "completed" if interview.completed_at else "scheduled",
            "ai_score": float(scorecard.overall_ai_score) if scorecard and scorecard.overall_ai_score is not None else None,
        })
    return result


class InterviewScheduleRequest(schemas.BaseModel):
    application_id: str
    scheduled_at: datetime
    notes: Optional[str] = None


@router.post("/schedule")
def schedule_candidate_interview(
    payload: InterviewScheduleRequest,
    current_user: models.User = Depends(get_current_role(models.UserRole.company)),
    db: Session = Depends(get_db),
):
    company = db.query(models.Company).filter(models.Company.user_id == current_user.id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company profile not found")

    application = db.query(models.Application).filter(models.Application.id == payload.application_id).first()
    if not application or not application.drive or application.drive.company_id != company.id:
        raise HTTPException(status_code=403, detail="Application not found or not permitted")

    interview = db.query(models.Interview).filter(models.Interview.application_id == payload.application_id).first()
    if interview:
        interview.scheduled_at = payload.scheduled_at
    else:
        interview = models.Interview(
            application_id=payload.application_id,
            questions=[
                "Tell me about a challenging technical project you worked on and how you overcame the obstacles.",
                "Describe a time you had to learn a new technology quickly. How did you approach it?",
                "How do you handle disagreements with team members on technical decisions?",
                "What is your approach to testing and ensuring code quality?"
            ],
            scheduled_at=payload.scheduled_at,
        )
        db.add(interview)

    notif = models.Notification(
        user_id=application.student.user_id,
        type="interview",
        message=f"Interview scheduled for {application.drive.title} on {payload.scheduled_at.strftime('%b %d, %Y at %I:%M %p')}"
    )
    db.add(notif)

    db.commit()
    db.refresh(interview)
    return interview


@router.get("/application/{application_id}", response_model=schemas.InterviewOut)
def get_interview(
    application_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    interview = db.query(models.Interview).filter(models.Interview.application_id == application_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    # Permission check
    if current_user.role == models.UserRole.student:
        student = db.query(models.Student).filter(models.Student.user_id == current_user.id).first()
        if not student or interview.application.student_id != student.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not permitted")
    elif current_user.role == models.UserRole.company:
        company = db.query(models.Company).filter(models.Company.user_id == current_user.id).first()
        if not company or interview.application.drive.company_id != company.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not permitted")
            
    return interview


@router.post("/{interview_id}/submit", response_model=schemas.InterviewOut)
def submit_interview(
    interview_id: str,
    payload: schemas.InterviewSubmit,
    current_user: models.User = Depends(get_current_role(models.UserRole.student)),
    db: Session = Depends(get_db)
):
    student = db.query(models.Student).filter(models.Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")

    interview = db.query(models.Interview).filter(models.Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    if interview.application.student_id != student.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Operation not permitted. You can only submit your own interviews.")

    if interview.completed_at is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Interview already submitted")

    sentiment_data = analyze_interview(payload.transcript)

    interview.transcript = payload.transcript
    interview.sentiment_data = sentiment_data
    interview.completed_at = datetime.utcnow()
    
    # Optionally move application stage
    interview.application.current_stage = models.ApplicationStage.ai_interview

    log = models.ActivityLog(
        user_id=current_user.id,
        action=f"Completed AI interview for {interview.application.drive.title}",
        log_metadata={"drive_id": interview.application.drive.id, "application_id": interview.application.id}
    )
    db.add(log)
    
    notif = models.Notification(
        user_id=current_user.id,
        type="ai_result_ready",
        message=f"Your AI interview for {interview.application.drive.title} was analyzed"
    )
    db.add(notif)

    db.commit()
    db.refresh(interview)
    return interview

@router.post("/transcribe")
def transcribe_interview_audio(
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_role(models.UserRole.student))
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded")
    
    try:
        audio_bytes = file.file.read()
        transcript = transcribe_audio(audio_bytes, file.filename)
        return {"transcript": transcript}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
