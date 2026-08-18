from typing import List, Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app import models, schemas
from app.database import get_db
from app.routers.auth import get_current_user, get_current_role

router = APIRouter()

@router.post("", response_model=schemas.AssessmentOut, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=schemas.AssessmentOut, status_code=status.HTTP_201_CREATED)
def create_assessment(
    payload: schemas.AssessmentCreate,
    current_user: models.User = Depends(get_current_role(models.UserRole.company)),
    db: Session = Depends(get_db)
):
    company = db.query(models.Company).filter(models.Company.user_id == current_user.id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company profile not found")

    drive = db.query(models.Drive).filter(models.Drive.id == payload.drive_id).first()
    if not drive:
        raise HTTPException(status_code=404, detail="Drive not found")
    
    if drive.company_id != company.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Operation not permitted. You can only create assessments for your own drives.")

    existing = db.query(models.Assessment).filter(models.Assessment.drive_id == payload.drive_id).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An assessment already exists for this drive")

    questions_data = [q.model_dump() for q in payload.questions]
    
    assessment = models.Assessment(
        drive_id=payload.drive_id,
        questions=questions_data,
        duration_mins=payload.duration_mins
    )
    db.add(assessment)
    db.commit()
    db.refresh(assessment)
    return assessment


@router.get("/drive/{drive_id}", response_model=schemas.AssessmentOut)
def get_assessment_for_drive(
    drive_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    assessment = db.query(models.Assessment).filter(models.Assessment.drive_id == drive_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    if current_user.role == models.UserRole.student:
        # Hide correct_option
        safe_questions = []
        for i, q in enumerate(assessment.questions):
            safe_q = {k: v for k, v in q.items() if k != "correct_option"}
            safe_q["id"] = i # Provide an index ID for the frontend to submit answers
            safe_questions.append(safe_q)
        
        return schemas.AssessmentOut(
            id=assessment.id,
            drive_id=assessment.drive_id,
            questions=safe_questions,
            duration_mins=assessment.duration_mins
        )
    
    # If company or admin, add index ID for consistency, but keep correct_option
    full_questions = []
    for i, q in enumerate(assessment.questions):
        full_q = q.copy()
        full_q["id"] = i
        full_questions.append(full_q)
    
    return schemas.AssessmentOut(
        id=assessment.id,
        drive_id=assessment.drive_id,
        questions=full_questions,
        duration_mins=assessment.duration_mins
    )


@router.post("/submit", response_model=schemas.AssessmentSubmissionOut, status_code=status.HTTP_201_CREATED)
def submit_assessment(
    payload: schemas.AssessmentSubmissionCreate,
    current_user: models.User = Depends(get_current_role(models.UserRole.student)),
    db: Session = Depends(get_db)
):
    student = db.query(models.Student).filter(models.Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")

    application = db.query(models.Application).filter(models.Application.id == payload.application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    if application.student_id != student.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Operation not permitted. You can only submit your own assessments.")

    existing_sub = db.query(models.AssessmentSubmission).filter(models.AssessmentSubmission.application_id == payload.application_id).first()
    if existing_sub:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A submission already exists for this application")

    assessment = db.query(models.Assessment).filter(models.Assessment.drive_id == application.drive_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found for this drive")

    # Auto-grade
    correct_count = 0
    total_questions = len(assessment.questions)
    
    if total_questions > 0:
        for answer in payload.answers:
            q_id = answer.get("question_id")
            selected_option = answer.get("selected_option")
            
            if q_id is not None and 0 <= q_id < total_questions:
                if selected_option == assessment.questions[q_id].get("correct_option"):
                    correct_count += 1
                    
        score = (correct_count / total_questions) * 100.0
    else:
        score = 0.0

    submission = models.AssessmentSubmission(
        application_id=payload.application_id,
        answers=payload.answers,
        score=score,
        proctor_flags=payload.proctor_flags or []
    )
    db.add(submission)

    # Move application stage
    application.current_stage = models.ApplicationStage.assessment
    db.commit()
    db.refresh(submission)
    return submission


@router.get("/submission/{application_id}", response_model=schemas.AssessmentSubmissionOut)
def get_submission(
    application_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    submission = db.query(models.AssessmentSubmission).filter(models.AssessmentSubmission.application_id == application_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    # Permission check
    if current_user.role == models.UserRole.student:
        student = db.query(models.Student).filter(models.Student.user_id == current_user.id).first()
        if not student or submission.application.student_id != student.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not permitted")
    elif current_user.role == models.UserRole.company:
        company = db.query(models.Company).filter(models.Company.user_id == current_user.id).first()
        if not company or submission.application.drive.company_id != company.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not permitted")
            
    return submission
