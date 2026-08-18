from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app import models, schemas
from app.database import get_db
from app.routers.auth import get_current_user, get_current_role
from app.services.ai_service import analyze_interview

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

    db.commit()
    db.refresh(interview)
    return interview
