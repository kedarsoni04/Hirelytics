from typing import List, Any, Dict, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified
from app import models, schemas
from app.database import get_db
from app.routers.auth import get_current_user, get_current_role
from app.services import ai_service

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
        duration_mins=payload.duration_mins,
        assessment_start=payload.assessment_start,
        assessment_end=payload.assessment_end,
    )
    db.add(assessment)
    db.commit()
    db.refresh(assessment)

    full_questions = []
    for i, q in enumerate(assessment.questions or []):
        full_q = q.copy() if isinstance(q, dict) else dict(q)
        full_q["id"] = i
        full_questions.append(full_q)

    return schemas.AssessmentOut(
        id=str(assessment.id),
        drive_id=str(assessment.drive_id),
        questions=full_questions,
        duration_mins=int(assessment.duration_mins or 30),
        assessment_start=assessment.assessment_start,
        assessment_end=assessment.assessment_end,
    )


@router.put("/drive/{drive_id}", response_model=schemas.AssessmentOut)
def update_assessment_for_drive(
    drive_id: str,
    payload: schemas.AssessmentUpdate,
    current_user: models.User = Depends(get_current_role(models.UserRole.company)),
    db: Session = Depends(get_db)
):
    company = db.query(models.Company).filter(models.Company.user_id == current_user.id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company profile not found")

    drive = db.query(models.Drive).filter(models.Drive.id == drive_id).first()
    if not drive:
        raise HTTPException(status_code=404, detail="Drive not found")

    if drive.company_id != company.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Operation not permitted. You can only update assessments for your own drives.")

    assessment = db.query(models.Assessment).filter(models.Assessment.drive_id == drive_id).first()
    questions_data = [q.model_dump() for q in payload.questions]

    if not assessment:
        assessment = models.Assessment(
            drive_id=drive_id,
            questions=questions_data,
            duration_mins=payload.duration_mins or 30,
            assessment_start=payload.assessment_start,
            assessment_end=payload.assessment_end,
        )
        db.add(assessment)
    else:
        assessment.questions = questions_data  # type: ignore[assignment]  # SQLAlchemy JSONB instrumented attr accepts list at runtime
        flag_modified(assessment, "questions")
        if payload.duration_mins is not None:
            assessment.duration_mins = payload.duration_mins  # type: ignore[assignment]  # SQLAlchemy Column instrumented attr accepts int at runtime
        if payload.assessment_start is not None:
            assessment.assessment_start = payload.assessment_start  # type: ignore[assignment]
        if payload.assessment_end is not None:
            assessment.assessment_end = payload.assessment_end  # type: ignore[assignment]

    db.commit()
    db.refresh(assessment)

    full_questions = []
    for i, q in enumerate(assessment.questions or []):
        full_q = q.copy() if isinstance(q, dict) else dict(q)
        full_q["id"] = i
        full_questions.append(full_q)

    return schemas.AssessmentOut(
        id=str(assessment.id),
        drive_id=str(assessment.drive_id),
        questions=full_questions,
        duration_mins=int(assessment.duration_mins or 30),
        assessment_start=assessment.assessment_start,
        assessment_end=assessment.assessment_end,
    )


@router.post("/generate-from-file", response_model=schemas.AssessmentGeneratedOut)
async def generate_assessment_from_file(
    file: UploadFile = File(...),
    drive_id: str = Form(...),
    num_questions: int = Form(10),
    custom_job_description: Optional[str] = Form(None),
    current_user: models.User = Depends(get_current_role(models.UserRole.company)),
    db: Session = Depends(get_db)
):
    company = db.query(models.Company).filter(models.Company.user_id == current_user.id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company profile not found")

    drive = db.query(models.Drive).filter(models.Drive.id == drive_id).first()
    if not drive:
        raise HTTPException(status_code=404, detail="Drive not found")

    if drive.company_id != company.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Operation not permitted")

    filename = file.filename or "upload"
    allowed_exts = (".pdf", ".csv", ".txt")
    if not any(filename.lower().endswith(ext) for ext in allowed_exts):
        raise HTTPException(status_code=400, detail="Only PDF, CSV, or TXT files are supported.")

    file_bytes = await file.read()
    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    if len(file_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds maximum limit of 10MB.")

    target_count = max(1, min(50, int(num_questions)))

    jd = custom_job_description.strip() if custom_job_description and custom_job_description.strip() else ""
    if not jd:
        jd_parts = [drive.title or ""]
        if drive.description:
            jd_parts.append(drive.description)
        jd = "\n".join(jd_parts)

    generated = ai_service.generate_assessment_questions_from_file(
        file_bytes=file_bytes,
        filename=filename,
        job_description=jd,
        num_questions=target_count
    )

    questions_out = [
        schemas.AssessmentQuestion(
            question=q["question"],
            options=q["options"],
            correct_option=q["correct_option"]
        )
        for q in generated
    ]

    return schemas.AssessmentGeneratedOut(
        questions=questions_out,
        count=len(questions_out),
        source_filename=filename
    )


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
        # Enforce the assessment timeline for students
        now = datetime.now(timezone.utc)

        # Before assessment_start: not available yet (registration may still be open)
        if assessment.assessment_start:
            start = assessment.assessment_start
            if start.tzinfo is None:
                start = start.replace(tzinfo=timezone.utc)
            if now < start:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Assessment window has not opened yet. It opens at {start.isoformat()}"
                )

        # After assessment_end: window has closed
        if assessment.assessment_end:
            end = assessment.assessment_end
            if end.tzinfo is None:
                end = end.replace(tzinfo=timezone.utc)
            if now > end:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Assessment window has closed. The deadline to take the assessment has passed."
                )

        # Hide correct_option
        safe_questions = []
        for i, q in enumerate(assessment.questions or []):
            safe_q = {k: v for k, v in q.items() if k != "correct_option"} if isinstance(q, dict) else {}
            safe_q["id"] = i  # Provide an index ID for the frontend to submit answers
            safe_questions.append(safe_q)

        return schemas.AssessmentOut(
            id=str(assessment.id),
            drive_id=str(assessment.drive_id),
            questions=safe_questions,
            duration_mins=int(assessment.duration_mins or 30),
            assessment_start=assessment.assessment_start,
            assessment_end=assessment.assessment_end,
        )

    # If company or admin, add index ID for consistency, but keep correct_option
    full_questions = []
    for i, q in enumerate(assessment.questions or []):
        full_q = q.copy() if isinstance(q, dict) else dict(q)
        full_q["id"] = i
        full_questions.append(full_q)

    return schemas.AssessmentOut(
        id=str(assessment.id),
        drive_id=str(assessment.drive_id),
        questions=full_questions,
        duration_mins=int(assessment.duration_mins or 30),
        assessment_start=assessment.assessment_start,
        assessment_end=assessment.assessment_end,
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

    # Enforce assessment timeline for submission
    now = datetime.now(timezone.utc)
    if assessment.assessment_start:
        start = assessment.assessment_start
        if start.tzinfo is None:
            start = start.replace(tzinfo=timezone.utc)
        if now < start:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Assessment window has not opened yet. You cannot submit before the window opens."
            )
    if assessment.assessment_end:
        end = assessment.assessment_end
        if end.tzinfo is None:
            end = end.replace(tzinfo=timezone.utc)
        if now > end:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Assessment window has closed. Submissions are no longer accepted."
            )

    # Auto-grade
    correct_count = 0
    raw_questions = assessment.questions or []
    total_questions = len(raw_questions)

    if total_questions > 0:
        for answer in payload.answers:
            q_id = answer.get("question_id")
            selected_option = answer.get("selected_option")

            if q_id is not None and 0 <= q_id < total_questions:
                q_item = raw_questions[q_id]
                if isinstance(q_item, dict) and selected_option == q_item.get("correct_option"):
                    correct_count += 1

        score = round((correct_count / total_questions) * 100.0, 1)
    else:
        score = 0.0

    submission = models.AssessmentSubmission(
        application_id=payload.application_id,
        answers=payload.answers,
        score=score,
        proctor_flags=payload.proctor_flags or []
    )
    db.add(submission)
    db.flush()
    
    log = models.ActivityLog(
        user_id=current_user.id,
        action=f"Completed assessment for {application.drive.title} — scored {score}%",
        log_metadata={"drive_id": application.drive.id, "application_id": application.id}
    )
    db.add(log)
    
    notif = models.Notification(
        user_id=current_user.id,
        type="ai_result_ready",
        message=f"Your assessment for {application.drive.title} was scored: {score}%"
    )
    db.add(notif)

    # Notify Company
    if (
        application.drive
        and application.drive.company
        and application.drive.company.user_id
    ):
        notif_company = models.Notification(
            user_id=application.drive.company.user_id,
            type="application_update",
            message=f"New assessment submission from {student.full_name} for {application.drive.title}"
        )
        db.add(notif_company)

    # Move application stage
    application.current_stage = models.ApplicationStage.assessment  # type: ignore[assignment]
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
