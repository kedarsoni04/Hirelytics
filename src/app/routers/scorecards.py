from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app import models, schemas
from app.database import get_db
from app.routers.auth import get_current_user, get_current_role
from app.services.ai_service import generate_scorecard

router = APIRouter()

@router.post("/generate/{application_id}", response_model=schemas.ScorecardOut, status_code=status.HTTP_201_CREATED)
def generate_scorecard_endpoint(
    application_id: str,
    current_user: models.User = Depends(get_current_role(models.UserRole.company)),
    db: Session = Depends(get_db)
):
    company = db.query(models.Company).filter(models.Company.user_id == current_user.id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company profile not found")

    application = db.query(models.Application).filter(models.Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    if not application.drive or application.drive.company_id != company.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not permitted to generate scorecard for this application")

    submission = db.query(models.AssessmentSubmission).filter(models.AssessmentSubmission.application_id == application_id).first()
    if not submission:
        raise HTTPException(status_code=400, detail="Cannot generate scorecard: Assessment submission is missing")

    interview = db.query(models.Interview).filter(models.Interview.application_id == application_id).first()
    if not interview or not interview.completed_at:
        raise HTTPException(status_code=400, detail="Cannot generate scorecard: Interview is missing or not completed")

    # Generate mock AI data
    scorecard_data = generate_scorecard(
        student=application.student,
        assessment_score=float(submission.score or 0.0),
        interview_data=interview.sentiment_data or {}
    )

    # Check if exists
    scorecard = db.query(models.Scorecard).filter(models.Scorecard.application_id == application_id).first()
    if scorecard:
        # Update
        for key, value in scorecard_data.items():
            setattr(scorecard, key, value)
    else:
        # Create
        scorecard = models.Scorecard(
            application_id=application_id,
            **scorecard_data
        )
        db.add(scorecard)

    # Move application stage if overall score > 70
    if scorecard.overall_ai_score and scorecard.overall_ai_score > 70.0:
        application.current_stage = models.ApplicationStage.shortlisted

    db.commit()
    db.refresh(scorecard)
    return scorecard


@router.get("/{application_id}", response_model=schemas.ScorecardOut)
def get_scorecard(
    application_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    scorecard = db.query(models.Scorecard).filter(models.Scorecard.application_id == application_id).first()
    if not scorecard:
        raise HTTPException(status_code=404, detail="Scorecard not found or not generated yet")

    # Permission check
    if current_user.role == models.UserRole.student:
        student = db.query(models.Student).filter(models.Student.user_id == current_user.id).first()
        if not student or scorecard.application.student_id != student.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not permitted")
    elif current_user.role == models.UserRole.company:
        company = db.query(models.Company).filter(models.Company.user_id == current_user.id).first()
        if not company or scorecard.application.drive.company_id != company.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not permitted")

    return scorecard
