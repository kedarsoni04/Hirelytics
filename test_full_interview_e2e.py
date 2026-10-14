import sys
import os
import json
from fastapi.testclient import TestClient

# Add src to path
sys.path.insert(0, os.path.join(os.getcwd(), "src"))

from app.main import app
from app.database import SessionLocal, get_db
from app import models
from app.routers.auth import create_access_token

def test_full_interview_flow():
    client = TestClient(app)
    db = SessionLocal()

    print("=== STEP 1: Setup Test Student, Company, Drive, and Application ===")
    company_user = db.query(models.User).filter(models.User.email == "company_test_e2e@hirelytics.com").first()
    if not company_user:
        company_user = models.User(email="company_test_e2e@hirelytics.com", password_hash="hashed", role=models.UserRole.company)
        db.add(company_user)
        db.commit()
        db.refresh(company_user)

    company = db.query(models.Company).filter(models.Company.user_id == company_user.id).first()
    if not company:
        company = models.Company(user_id=company_user.id, company_name="TechCorp E2E")
        db.add(company)
        db.commit()
        db.refresh(company)

    drive = db.query(models.Drive).filter(models.Drive.company_id == company.id).first()
    if not drive:
        drive = models.Drive(company_id=company.id, title="Backend Engineer", description="Python and Postgres", status=models.DriveStatus.live)
        db.add(drive)
        db.commit()
        db.refresh(drive)

    student_user = db.query(models.User).filter(models.User.email == "student_test_e2e@hirelytics.com").first()
    if not student_user:
        student_user = models.User(email="student_test_e2e@hirelytics.com", password_hash="hashed", role=models.UserRole.student)
        db.add(student_user)
        db.commit()
        db.refresh(student_user)

    student = db.query(models.Student).filter(models.Student.user_id == student_user.id).first()
    if not student:
        student = models.Student(user_id=student_user.id, full_name="Alice E2E", skills=["Python", "SQL"])
        db.add(student)
        db.commit()
        db.refresh(student)

    app_record = db.query(models.Application).filter(models.Application.student_id == student.id, models.Application.drive_id == drive.id).first()
    if not app_record:
        app_record = models.Application(drive_id=drive.id, student_id=student.id, current_stage=models.ApplicationStage.ai_interview)
        db.add(app_record)
        db.commit()
        db.refresh(app_record)

    # Clean previous interviews for this application if any
    db.query(models.Interview).filter(models.Interview.application_id == app_record.id).delete()
    db.commit()

    # Schedule interview
    interview = models.Interview(
        application_id=app_record.id,
        questions=[
            {
                "id": 1,
                "question": "How do you optimize slow database queries in PostgreSQL?",
                "category": "technical",
                "rubric": {
                    "key_points": ["EXPLAIN ANALYZE", "Indexes (B-tree)", "Query rewriting", "Vacuuming"],
                    "red_flags": ["No knowledge of indexing"]
                },
                "expected_skills": ["SQL", "PostgreSQL", "Database Optimization"]
            },
            {
                "id": 2,
                "question": "Tell me about a time you had a disagreement with a team member.",
                "category": "behavioral",
                "rubric": {
                    "key_points": ["Active listening", "Finding common ground", "Constructive resolution"],
                    "red_flags": ["Blaming others"]
                },
                "expected_skills": ["Conflict Resolution", "Collaboration"]
            }
        ],
        answers=[],
        integrity_flags={},
        sentiment_data={}
    )
    db.add(interview)
    db.commit()
    db.refresh(interview)
    interview_id = str(interview.id)

    student_token = create_access_token(str(student_user.id), "student")
    company_token = create_access_token(str(company_user.id), "company")

    print("=== STEP 2: Candidate Checks Interview Info (GET /interviews/application/{app_id}) ===")
    get_res = client.get(
        f"/interviews/application/{app_record.id}",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert get_res.status_code == 200, f"Get interview failed: {get_res.text}"
    candidate_view = get_res.json()
    # Confirm candidate NEVER sees rubrics, expected_skills, or answers
    for q in candidate_view["questions"]:
        assert "rubric" not in q, f"Leaked rubric to candidate: {q}"
        assert "expected_skills" not in q, f"Leaked expected_skills to candidate: {q}"
    print("[PASS] Candidate GET response safely hides rubrics, scores, and expected skills.")

    print("=== STEP 3: Candidate submits deliberately vague technical answer ===")
    vague_answer = "I used database and it was fast."
    answer_res = client.post(
        f"/interviews/{interview_id}/answer",
        headers={"Authorization": f"Bearer {student_token}"},
        data={
            "question_id": "1",
            "transcript": vague_answer,
            "duration_sec": 4.5,
            "response_latency_ms": 1200.0,
            "integrity_events": json.dumps([
                {"type": "tab_switch", "timestamp": "2026-10-14T03:00:00Z"},
                {"type": "window_blur", "timestamp": "2026-10-14T03:00:10Z"}
            ])
        }
    )
    assert answer_res.status_code == 200, f"Answer failed: {answer_res.text}"
    ans_data = answer_res.json()
    print("Answer response keys:", list(ans_data.keys()))

    # Verify candidate NEVER sees scores in /answer response
    assert "rubric_score" not in ans_data, "Leaked rubric_score to candidate in /answer response"
    assert "evaluation" not in ans_data, "Leaked evaluation to candidate in /answer response"
    print("[PASS] Candidate /answer response hides scores and internal evaluations.")

    # Verify a follow-up question appears
    next_q = ans_data.get("next_question")
    assert next_q is not None, "Expected next question, got None"
    print(f"Next question received: ID={next_q.get('id')}, is_follow_up={next_q.get('is_follow_up')}")
    assert next_q.get("is_follow_up") is True, f"Expected follow-up question, got: {next_q}"
    assert "database" in next_q.get("question").lower() or "you mentioned" in next_q.get("question").lower(), f"Unexpected follow-up: {next_q}"
    print("[PASS] Deliberately vague answer triggered an AI follow-up question as required!")

    print("=== STEP 4: Candidate answers follow-up question ===")
    follow_up_ans = client.post(
        f"/interviews/{interview_id}/answer",
        headers={"Authorization": f"Bearer {student_token}"},
        data={
            "question_id": str(next_q["id"]),
            "transcript": "We created B-tree composite indexes and ran EXPLAIN ANALYZE to optimize the query execution plan.",
            "duration_sec": 12.0,
            "response_latency_ms": 800.0,
            "integrity_events": "[]"
        }
    )
    assert follow_up_ans.status_code == 200
    next_q2 = follow_up_ans.json().get("next_question")
    print(f"After follow-up, next question ID: {next_q2.get('id') if next_q2 else 'None'}")
    assert next_q2 is not None and str(next_q2.get("id")) == "2", f"Expected question 2, got {next_q2}"

    print("=== STEP 5: Candidate answers final behavioral question ===")
    q2_ans = client.post(
        f"/interviews/{interview_id}/answer",
        headers={"Authorization": f"Bearer {student_token}"},
        data={
            "question_id": "2",
            "transcript": "I had a disagreement on architecture. We held a meeting, listened to each other's points, and agreed on a hybrid compromise.",
            "duration_sec": 18.0,
            "response_latency_ms": 1100.0,
            "integrity_events": json.dumps([
                {"type": "fullscreen_exit", "timestamp": "2026-10-14T03:01:00Z"}
            ])
        }
    )
    assert q2_ans.status_code == 200
    q2_data = q2_ans.json()
    assert q2_data.get("done") is True, f"Expected done=True, got: {q2_data}"
    print("[PASS] All questions answered, done=True received.")

    print("=== STEP 6: Candidate completes interview (POST /interviews/{id}/complete) ===")
    complete_res = client.post(
        f"/interviews/{interview_id}/complete",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert complete_res.status_code == 200, f"Complete failed: {complete_res.text}"
    print("[PASS] Interview completion recorded successfully.")

    print("=== STEP 7: Company views Interview Evidence (GET /interviews/application/{app_id}) ===")
    company_view_res = client.get(
        f"/interviews/application/{app_record.id}",
        headers={"Authorization": f"Bearer {company_token}"}
    )
    assert company_view_res.status_code == 200, f"Company get interview failed: {company_view_res.text}"
    company_data = company_view_res.json()

    answers = company_data.get("answers", [])
    print(f"Answers count in Evidence: {len(answers)}")
    assert len(answers) == 3, f"Expected 3 answered questions (including follow-up), got {len(answers)}"

    # Check answered questions have rubric score, key points covered/missed, delivery metrics, evidence quote
    ans1 = answers[0]
    assert ans1.get("evaluation") is not None, "Missing evaluation in answer 1"
    assert "rubric_score" in ans1["evaluation"], "Missing rubric_score in answer 1"
    assert "evidence_quote" in ans1["evaluation"], "Missing evidence_quote in answer 1"
    assert "key_points_covered" in ans1["evaluation"], "Missing key_points_covered in answer 1"
    assert "key_points_missed" in ans1["evaluation"], "Missing key_points_missed in answer 1"
    assert ans1.get("delivery_metrics") is not None, "Missing delivery_metrics in answer 1"
    print(f"Answer 1 evaluation: score={ans1['evaluation']['rubric_score']}, quote='{ans1['evaluation']['evidence_quote']}'")

    # Check follow-up question answer
    ans_fu = answers[1]
    assert ans_fu.get("evaluation") is not None, "Missing evaluation in follow-up answer"
    print(f"Follow-up answer evaluation: score={ans_fu['evaluation']['rubric_score']}, quote='{ans_fu['evaluation']['evidence_quote']}'")

    # Check integrity flags
    integrity_flags = company_data.get("integrity_flags", {})
    print("Integrity flags:", integrity_flags)
    assert integrity_flags.get("tab_switches", 0) >= 1, f"Expected tab_switches >= 1, got: {integrity_flags}"
    assert integrity_flags.get("focus_losses", 0) >= 1, f"Expected focus_losses >= 1, got: {integrity_flags}"
    assert integrity_flags.get("fullscreen_exits", 0) >= 1, f"Expected fullscreen_exits >= 1, got: {integrity_flags}"

    # Check sentiment data skills demonstrated / missing
    sentiment = company_data.get("sentiment_data", {})
    print("Skills demonstrated:", sentiment.get("skills_demonstrated"))
    print("Skills missing:", sentiment.get("skills_missing"))
    assert "skills_demonstrated" in sentiment, "Missing skills_demonstrated in sentiment_data"
    assert "skills_missing" in sentiment, "Missing skills_missing in sentiment_data"

    print("\n==========================================")
    print("ALL TESTS PASSED SUCCESSFULLY! 100% VERIFIED.")
    print("==========================================")

if __name__ == "__main__":
    test_full_interview_flow()
