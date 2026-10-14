import json
import re
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.orm.attributes import flag_modified
from app import models, schemas
from app.database import get_db
from app.routers.auth import get_current_user, get_current_role
from app.services.ai_service import (
    analyze_interview,
    transcribe_audio,
    generate_interview_questions,
    extract_text_from_resume_url,
    transcribe_audio_verbose,
    compute_delivery_metrics,
    evaluate_interview_answer,
)

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
        if not existing_interview.questions and payload.questions:
            existing_interview.questions = payload.questions  # type: ignore[assignment]
        elif not existing_interview.questions:
            resume_text = ""
            if getattr(application.student, "resume_url", None):
                resume_text = extract_text_from_resume_url(application.student.resume_url)
            if not resume_text:
                resume_text = ", ".join(application.student.skills) if application.student.skills else "No skills listed"
            gen_res = generate_interview_questions(
                job_title=application.drive.title,
                job_description=application.drive.description or "",
                required_skills=application.drive.eligible_branches or [],
                resume_text=resume_text
            )
            existing_interview.questions = [dict(q) for q in gen_res]  # type: ignore[assignment]
            skills_expected = getattr(gen_res, "skills_expected", []) or (gen_res.get("skills_expected", []) if isinstance(gen_res, dict) else [])
            s_data = dict(existing_interview.sentiment_data or {})
            s_data["skills_expected"] = skills_expected
            existing_interview.sentiment_data = s_data
            flag_modified(existing_interview, "sentiment_data")
        application.current_stage = models.ApplicationStage.ai_interview
        db.commit()
        db.refresh(existing_interview)
        return existing_interview

    questions = payload.questions
    skills_expected = []
    if not questions:
        resume_text = ""
        if getattr(application.student, "resume_url", None):
            resume_text = extract_text_from_resume_url(application.student.resume_url)
        if not resume_text:
            resume_text = ", ".join(application.student.skills) if application.student.skills else "No skills listed"
            
        gen_res = generate_interview_questions(
            job_title=application.drive.title,
            job_description=application.drive.description or "",
            required_skills=application.drive.eligible_branches or [],
            resume_text=resume_text
        )
        questions = [dict(q) for q in gen_res]
        skills_expected = getattr(gen_res, "skills_expected", []) or (gen_res.get("skills_expected", []) if isinstance(gen_res, dict) else [])

    interview = models.Interview(
        application_id=payload.application_id,
        questions=questions,
        answers=[],
        integrity_flags={},
        sentiment_data={"skills_expected": skills_expected},
        scheduled_at=datetime.now(timezone.utc),
    )
    db.add(interview)

    application.current_stage = models.ApplicationStage.ai_interview

    if application.student and application.student.user_id:
        notif = models.Notification(
            user_id=application.student.user_id,
            type="interview",
            message=f"Interview scheduled for {application.drive.title}"
        )
        db.add(notif)

        log = models.ActivityLog(
            user_id=application.student.user_id,
            action=f"Interview scheduled for {application.drive.title}",
            log_metadata={"drive_id": application.drive.id, "application_id": application.id}
        )
        db.add(log)

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

    interviews = (
        db.query(models.Interview)
        .join(models.Application)
        .join(models.Drive)
        .options(
            joinedload(models.Interview.application).joinedload(models.Application.student),
            joinedload(models.Interview.application).joinedload(models.Application.drive),
            joinedload(models.Interview.application).joinedload(models.Application.scorecard),
        )
        .filter(models.Drive.company_id == company.id)
        .order_by(models.Interview.scheduled_at.desc())
        .all()
    )

    result = []
    for interview in interviews:
        student = interview.application.student if interview.application else None
        drive = interview.application.drive if interview.application else None
        scorecard = interview.application.scorecard if interview.application else None
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


@router.post("/schedule", response_model=schemas.InterviewOut)
def schedule_candidate_interview(
    payload: schemas.InterviewScheduleRequest,
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
        if not interview.questions:
            resume_text = ""
            if getattr(application.student, "resume_url", None):
                resume_text = extract_text_from_resume_url(application.student.resume_url)
            if not resume_text:
                resume_text = ", ".join(application.student.skills) if application.student.skills else "No skills listed"
            gen_res = generate_interview_questions(
                job_title=application.drive.title,
                job_description=application.drive.description or "",
                required_skills=application.drive.eligible_branches or [],
                resume_text=resume_text
            )
            interview.questions = [dict(q) for q in gen_res]  # type: ignore[assignment]
            skills_expected = getattr(gen_res, "skills_expected", []) or (gen_res.get("skills_expected", []) if isinstance(gen_res, dict) else [])
            s_data = dict(interview.sentiment_data or {})
            s_data["skills_expected"] = skills_expected
            interview.sentiment_data = s_data
            flag_modified(interview, "sentiment_data")
    else:
        resume_text = ""
        if getattr(application.student, "resume_url", None):
            resume_text = extract_text_from_resume_url(application.student.resume_url)
        if not resume_text:
            resume_text = ", ".join(application.student.skills) if application.student.skills else "No skills listed"
            
        gen_res = generate_interview_questions(
            job_title=application.drive.title,
            job_description=application.drive.description or "",
            required_skills=application.drive.eligible_branches or [],
            resume_text=resume_text
        )
        questions = [dict(q) for q in gen_res]
        skills_expected = getattr(gen_res, "skills_expected", []) or (gen_res.get("skills_expected", []) if isinstance(gen_res, dict) else [])
        
        interview = models.Interview(
            application_id=payload.application_id,
            questions=questions,
            answers=[],
            integrity_flags={},
            sentiment_data={"skills_expected": skills_expected},
            scheduled_at=payload.scheduled_at,
        )
        db.add(interview)

    application.current_stage = models.ApplicationStage.ai_interview

    if application.student and application.student.user_id:
        notif = models.Notification(
            user_id=application.student.user_id,
            type="interview",
            message=f"Interview scheduled for {application.drive.title} on {payload.scheduled_at.strftime('%b %d, %Y at %I:%M %p')}"
        )
        db.add(notif)

        log = models.ActivityLog(
            user_id=application.student.user_id,
            action=f"Interview scheduled for {application.drive.title} on {payload.scheduled_at.strftime('%b %d, %Y at %I:%M %p')}",
            log_metadata={"drive_id": application.drive.id, "application_id": application.id}
        )
        db.add(log)

    db.commit()
    db.refresh(interview)
    return interview


@router.get("/application/{application_id}")
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

        safe_questions = []
        for q in (interview.questions or []):
            if isinstance(q, dict):
                safe_q = {k: v for k, v in q.items() if k not in ["rubric", "expected_skills"]}
                safe_questions.append(safe_q)
            else:
                safe_questions.append(q)

        return {
            "id": str(interview.id),
            "application_id": str(interview.application_id),
            "questions": safe_questions,
            "transcript": interview.transcript,
            "video_url": interview.video_url,
            "sentiment_data": interview.sentiment_data,
            "proctor_flags": interview.proctor_flags,
            "scheduled_at": interview.scheduled_at,
            "completed_at": interview.completed_at,
        }

    elif current_user.role == models.UserRole.company:
        company = db.query(models.Company).filter(models.Company.user_id == current_user.id).first()
        if not company or interview.application.drive.company_id != company.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not permitted")

        return {
            "id": str(interview.id),
            "application_id": str(interview.application_id),
            "questions": interview.questions or [],
            "answers": interview.answers or [],
            "integrity_flags": interview.integrity_flags or {},
            "transcript": interview.transcript,
            "video_url": interview.video_url,
            "sentiment_data": interview.sentiment_data,
            "proctor_flags": interview.proctor_flags,
            "scheduled_at": interview.scheduled_at,
            "completed_at": interview.completed_at,
        }

    return interview


@router.post("/{interview_id}/answer")
async def answer_interview_question(
    interview_id: str,
    question_id: Any = Form(...),
    transcript: Optional[str] = Form(None),
    audio: Optional[UploadFile] = File(None),
    duration_sec: float = Form(0.0),
    response_latency_ms: float = Form(0.0),
    integrity_events: Optional[str] = Form("[]"),
    current_user: models.User = Depends(get_current_role(models.UserRole.student)),
    db: Session = Depends(get_db),
):
    student = db.query(models.Student).filter(models.Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")

    interview = db.query(models.Interview).filter(models.Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    if interview.application.student_id != student.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation not permitted. You can only answer your own interviews."
        )

    if interview.completed_at is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Interview already completed"
        )

    questions = list(interview.questions or [])
    current_q = None
    for q in questions:
        if str(q.get("id")) == str(question_id):
            current_q = q
            break

    if not current_q:
        try:
            idx = int(question_id)
            if 0 <= idx < len(questions):
                current_q = questions[idx]
            elif 1 <= idx <= len(questions):
                current_q = questions[idx - 1]
        except Exception:
            pass

    if not current_q:
        current_q = {
            "id": question_id,
            "question": "Interview Question",
            "category": "technical",
            "rubric": {"key_points": [], "red_flags": []},
            "expected_skills": []
        }

    # Transcribe audio if provided, else use transcript fallback
    verbatim_transcript = transcript or ""
    words_metadata = []

    if audio and audio.filename:
        try:
            audio_bytes = await audio.read()
            if audio_bytes:
                whisper_res = transcribe_audio_verbose(audio_bytes, audio.filename)
                if whisper_res.get("text"):
                    verbatim_transcript = whisper_res["text"]
                words_metadata = whisper_res.get("words", [])
        except Exception as e:
            print(f"Audio transcription error: {e}")

    # Compute delivery metrics in code
    delivery_metrics = compute_delivery_metrics(
        transcript=verbatim_transcript,
        duration_sec=duration_sec,
        response_latency_ms=response_latency_ms,
        words=words_metadata
    )

    # ONE Groq llama-3.3-70b-versatile call
    evaluation = evaluate_interview_answer(
        question=current_q,
        transcript=verbatim_transcript,
        delivery_metrics=delivery_metrics
    )

    # Follow-up rule (enforce in code, not only in the prompt):
    # Only for technical/problem_solving questions, only if the answer is vague
    # or misses most key points, never for a question that is itself a follow-up,
    # max 3 follow-ups per interview.
    is_tech = current_q.get("category") in ["technical", "problem_solving"]
    is_self_follow_up = bool(current_q.get("is_follow_up", False)) or (current_q.get("parent_id") is not None)
    existing_follow_ups = sum(1 for q in questions if q.get("is_follow_up"))

    rubric_score = float(evaluation.get("rubric_score", 70.0))
    key_points = current_q.get("rubric", {}).get("key_points", []) if isinstance(current_q.get("rubric"), dict) else []
    num_missed = len(evaluation.get("key_points_missed", []))
    num_covered = len(evaluation.get("key_points_covered", []))
    word_count = delivery_metrics.get("word_count", 0)

    is_vague = (word_count < 20)
    misses_most_keys = bool(key_points and num_missed > num_covered)
    is_low_score = (rubric_score < 60.0)

    # A strong, specific answer with high score (>=70) and >=20 words is neither vague nor missing most key points
    if rubric_score >= 70.0 and word_count >= 20 and not misses_most_keys:
        is_vague_or_misses = False
    else:
        is_vague_or_misses = (
            is_vague or
            misses_most_keys or
            is_low_score or
            bool(evaluation.get("needs_follow_up"))
        )

    should_follow_up = (
        is_tech and
        not is_self_follow_up and
        existing_follow_ups < 3 and
        is_vague_or_misses
    )

    follow_up_q_obj = None
    if should_follow_up:
        words_snippet = evaluation.get("evidence_quote") or ""
        if not words_snippet or len(words_snippet.strip()) < 3:
            t_words = verbatim_transcript.strip().split()
            words_snippet = " ".join(t_words[:6]) if t_words else "your answer"

        fu_text = evaluation.get("follow_up_question")
        words_in_transcript = [w.lower() for w in re.findall(r'\b\w{3,}\b', verbatim_transcript)]
        if not fu_text or not any(w in fu_text.lower() for w in words_in_transcript):
            clean_snip = words_snippet.replace('"', '').replace("'", "")
            fu_text = f"You mentioned '{clean_snip}'. Could you elaborate in more detail on how that was implemented and what challenges you faced?"

        all_int_ids = [int(q.get("id")) for q in questions if str(q.get("id", "")).isdigit()]
        new_qid = (max(all_int_ids) if all_int_ids else len(questions)) + 1

        follow_up_q_obj = {
            "id": new_qid,
            "question": fu_text,
            "category": current_q.get("category"),
            "rubric": {
                "key_points": current_q.get("rubric", {}).get("key_points", []) if isinstance(current_q.get("rubric"), dict) else [],
                "red_flags": current_q.get("rubric", {}).get("red_flags", []) if isinstance(current_q.get("rubric"), dict) else []
            },
            "expected_skills": list(current_q.get("expected_skills", [])),
            "is_follow_up": True,
            "parent_id": current_q.get("id"),
        }
        questions.append(follow_up_q_obj)
        interview.questions = questions
        flag_modified(interview, "questions")

    parsed_events = []
    if integrity_events:
        try:
            parsed_events = json.loads(integrity_events)
            if not isinstance(parsed_events, list):
                parsed_events = [parsed_events]
        except Exception:
            parsed_events = []

    answer_record = {
        "question_id": current_q.get("id"),
        "category": current_q.get("category"),
        "transcript": verbatim_transcript,
        "delivery_metrics": delivery_metrics,
        "evaluation": evaluation,
        "integrity_events": parsed_events,
    }
    answers = list(interview.answers or [])
    answers.append(answer_record)
    interview.answers = answers
    flag_modified(interview, "answers")
    db.commit()
    db.refresh(interview)

    if follow_up_q_obj:
        next_question = {
            "id": follow_up_q_obj["id"],
            "question": follow_up_q_obj["question"],
            "category": follow_up_q_obj["category"],
            "is_follow_up": True
        }
        done = False
    else:
        answered_ids = {str(a.get("question_id")) for a in answers}
        next_q = None
        for q in interview.questions:
            if str(q.get("id")) not in answered_ids:
                next_q = {
                    "id": q.get("id"),
                    "question": q.get("question"),
                    "category": q.get("category"),
                    "is_follow_up": bool(q.get("is_follow_up", False))
                }
                break

        if next_q:
            next_question = next_q
            done = False
        else:
            next_question = None
            done = True

    return {
        "transcript": verbatim_transcript,
        "next_question": next_question,
        "done": done
    }


@router.post("/{interview_id}/complete")
def complete_interview(
    interview_id: str,
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
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Operation not permitted. You can only complete your own interviews.")

    answers = list(interview.answers or [])

    # Technical score
    tech_rubric_scores = [
        float(a["evaluation"]["rubric_score"])
        for a in answers
        if a.get("category") in ["technical", "problem_solving"]
        and isinstance(a.get("evaluation"), dict)
        and a["evaluation"].get("rubric_score") is not None
    ]
    if tech_rubric_scores:
        technical_score = round(sum(tech_rubric_scores) / len(tech_rubric_scores), 2)
    else:
        all_scores = [
            float(a["evaluation"]["rubric_score"])
            for a in answers
            if isinstance(a.get("evaluation"), dict)
            and a["evaluation"].get("rubric_score") is not None
        ]
        technical_score = round(sum(all_scores) / len(all_scores), 2) if all_scores else 70.0

    # Soft skills & delivery score
    comm_scores = [
        float(a["evaluation"]["communication_score"])
        for a in answers
        if isinstance(a.get("evaluation"), dict)
        and a["evaluation"].get("communication_score") is not None
    ]
    mean_comm = (sum(comm_scores) / len(comm_scores)) if comm_scores else 70.0

    wpms = [
        float(a["delivery_metrics"]["wpm"])
        for a in answers
        if isinstance(a.get("delivery_metrics"), dict)
        and float(a["delivery_metrics"].get("wpm", 0)) > 0
    ]
    mean_wpm = (sum(wpms) / len(wpms)) if wpms else 135.0
    pace_penalty = 0.0
    if mean_wpm < 110.0:
        pace_penalty = min(20.0, (110.0 - mean_wpm) * 0.3)
    elif mean_wpm > 170.0:
        pace_penalty = min(20.0, (mean_wpm - 170.0) * 0.3)

    pauses_over_2s_total = sum(
        int(a.get("delivery_metrics", {}).get("pauses_over_2s", 0))
        for a in answers
    )
    max_pause = max([
        float(a.get("delivery_metrics", {}).get("longest_pause_sec", 0.0))
        for a in answers
    ] or [0.0])
    pause_penalty = min(20.0, pauses_over_2s_total * 2.0 + (max(0.0, max_pause - 2.0) * 1.5))

    total_fillers = sum(
        int(a.get("delivery_metrics", {}).get("filler_count", 0))
        for a in answers
    )
    total_words = sum(
        int(a.get("delivery_metrics", {}).get("word_count", 0))
        for a in answers
    )
    filler_rate = (total_fillers / total_words * 100.0) if total_words > 0 else 0.0
    filler_penalty = 0.0
    if filler_rate > 3.0:
        filler_penalty = min(20.0, (filler_rate - 3.0) * 3.0)

    delivery_penalties = pace_penalty + pause_penalty + filler_penalty
    delivery_score = round(max(40.0, min(100.0, 100.0 - delivery_penalties)), 2)

    soft_skills_score = round(0.8 * mean_comm + 0.2 * delivery_score, 2)
    confidence_score = soft_skills_score

    # Overall tone
    tones = [
        str(a["evaluation"]["tone"]).lower()
        for a in answers
        if isinstance(a.get("evaluation"), dict) and a["evaluation"].get("tone")
    ]
    if tones:
        from collections import Counter
        overall_tone = Counter(tones).most_common(1)[0][0]
    else:
        overall_tone = "confident" if total_fillers <= 3 else "neutral"

    # Skills matching & keyword matches
    skills_expected = (interview.sentiment_data or {}).get("skills_expected", [])
    if not skills_expected:
        if interview.application and interview.application.drive:
            skills_expected = interview.application.drive.eligible_branches or []
    if not skills_expected:
        skills_expected = ["Communication", "Problem Solving", "Technical Competencies"]

    full_transcript = " ".join([str(a.get("transcript", "")) for a in answers]).lower()

    ALIASES = {
        "js": ["javascript", "js"],
        "javascript": ["javascript", "js"],
        "ts": ["typescript", "ts"],
        "typescript": ["typescript", "ts"],
        "py": ["python", "py"],
        "python": ["python", "py"],
        "react": ["react", "reactjs", "react.js"],
        "reactjs": ["react", "reactjs", "react.js"],
        "nextjs": ["nextjs", "next.js"],
        "next.js": ["nextjs", "next.js"],
        "postgres": ["postgres", "postgresql"],
        "postgresql": ["postgres", "postgresql"],
        "node": ["node", "nodejs", "node.js"],
        "nodejs": ["node", "nodejs", "node.js"],
        "mongo": ["mongo", "mongodb"],
        "mongodb": ["mongo", "mongodb"],
        "docker": ["docker", "container", "containers"],
        "fastapi": ["fastapi", "fast api"],
        "sql": ["sql", "database"],
    }

    skills_demonstrated = []
    skills_missing = []
    for skill in skills_expected:
        s_clean = skill.strip().lower()
        patterns = ALIASES.get(s_clean, [s_clean])
        matched = False
        for pat in patterns:
            if re.search(r'\b' + re.escape(pat) + r'\b', full_transcript):
                matched = True
                break
        if matched:
            skills_demonstrated.append(skill)
        else:
            skills_missing.append(skill)

    tech_keywords = ["react", "python", "api", "database", "algorithm", "cloud", "fastapi", "sql", "git", "docker", "rest"]
    keyword_matches = list(skills_demonstrated)
    for kw in tech_keywords:
        if re.search(r'\b' + re.escape(kw) + r'\b', full_transcript) and kw not in keyword_matches:
            keyword_matches.append(kw)

    # Integrity flags
    tab_switches = 0
    focus_losses = 0
    fullscreen_exits = 0
    camera_off_events = 0
    for a in answers:
        events = a.get("integrity_events", [])
        if isinstance(events, list):
            for ev in events:
                if isinstance(ev, dict):
                    etype = str(ev.get("type", "")).lower()
                    if "tab" in etype or "visibility" in etype:
                        tab_switches += 1
                    elif "focus" in etype or "blur" in etype:
                        focus_losses += 1
                    elif "fullscreen" in etype:
                        fullscreen_exits += 1
                    elif "camera" in etype or "video" in etype:
                        camera_off_events += 1

    integrity_flags = {
        "tab_switches": tab_switches,
        "focus_losses": focus_losses,
        "fullscreen_exits": fullscreen_exits,
        "camera_off_events": camera_off_events
    }
    interview.integrity_flags = integrity_flags
    flag_modified(interview, "integrity_flags")

    # Update sentiment_data
    sentiment_data = dict(interview.sentiment_data or {})
    sentiment_data.update({
        "technical_score": technical_score,
        "soft_skills_score": soft_skills_score,
        "confidence_score": confidence_score,
        "delivery_score": delivery_score,
        "tone": overall_tone,
        "filler_word_count": total_fillers,
        "keyword_matches": keyword_matches,
        "skills_demonstrated": skills_demonstrated,
        "skills_missing": skills_missing,
        "skills_expected": skills_expected,
    })
    interview.sentiment_data = sentiment_data
    flag_modified(interview, "sentiment_data")

    if not interview.transcript:
        interview.transcript = "\n\n".join([
            f"Question {i+1} ({a.get('category')}): {a.get('transcript')}"
            for i, a in enumerate(answers)
        ])

    is_first_completion = (interview.completed_at is None)
    if is_first_completion:
        interview.completed_at = datetime.now(timezone.utc)
        interview.application.current_stage = models.ApplicationStage.ai_interview

        action_label = f"Completed AI interview for {interview.application.drive.title}"
        log = models.ActivityLog(
            user_id=current_user.id,
            action=action_label,
            log_metadata={"drive_id": interview.application.drive.id, "application_id": interview.application.id}
        )
        db.add(log)

        notif = models.Notification(
            user_id=current_user.id,
            type="ai_result_ready",
            message=f"Your AI interview for {interview.application.drive.title} was analyzed"
        )
        db.add(notif)

        if (
            interview.application
            and interview.application.drive
            and interview.application.drive.company
            and interview.application.drive.company.user_id
        ):
            student_name = student.full_name or "A candidate"
            drive_title = interview.application.drive.title or "campus drive"
            notif_company = models.Notification(
                user_id=interview.application.drive.company.user_id,
                type="interview",
                message=f"{student_name} completed their AI interview for {drive_title}"
            )
            db.add(notif_company)

    db.commit()
    db.refresh(interview)
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

    sentiment_data = analyze_interview(payload.transcript, interview.questions)
    flags = payload.proctor_flags or []

    interview.transcript = payload.transcript
    interview.sentiment_data = sentiment_data
    interview.proctor_flags = flags
    interview.completed_at = datetime.now(timezone.utc)
    
    # Optionally move application stage
    interview.application.current_stage = models.ApplicationStage.ai_interview

    action_label = f"Completed AI interview for {interview.application.drive.title}"
    if any(isinstance(f, dict) and f.get("type") == "tab_switch" for f in flags):
        action_label = f"AI interview terminated due to tab-switch violation for {interview.application.drive.title}"

    log = models.ActivityLog(
        user_id=current_user.id,
        action=action_label,
        log_metadata={"drive_id": interview.application.drive.id, "application_id": interview.application.id, "proctor_flags": flags}
    )
    db.add(log)
    
    notif = models.Notification(
        user_id=current_user.id,
        type="ai_result_ready",
        message=f"Your AI interview for {interview.application.drive.title} was analyzed"
    )
    db.add(notif)

    # Notify Company
    if (
        interview.application
        and interview.application.drive
        and interview.application.drive.company
        and interview.application.drive.company.user_id
    ):
        student_name = student.full_name or "A candidate"
        drive_title = interview.application.drive.title or "campus drive"
        notif_company = models.Notification(
            user_id=interview.application.drive.company.user_id,
            type="interview",
            message=f"{student_name} completed their AI interview for {drive_title}"
        )
        db.add(notif_company)

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
