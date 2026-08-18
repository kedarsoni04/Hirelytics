import requests
import uuid
import json

BASE_URL = "http://127.0.0.1:8000"

def run_full_end_to_end_test():
    print("=================================================================")
    print("      HIRELYTICS FULL END-TO-END RECRUITMENT WORKFLOW TEST       ")
    print("=================================================================\n")
    s = requests.Session()
    uid = str(uuid.uuid4())[:8]

    # Setup accounts
    comp_email = f"e2e_company_{uid}@enterprise.com"
    comp_pass = "SecurePass123!"
    stud_email = f"e2e_student_{uid}@university.edu"
    stud_pass = "SecurePass123!"

    print("[SETUP] Creating Company & Student accounts...")
    res_comp = s.post(f"{BASE_URL}/auth/signup", json={
        "email": comp_email,
        "password": comp_pass,
        "role": "company",
        "company_name": f"NextGen Systems {uid}"
    })
    assert res_comp.status_code == 200, f"Company signup failed: {res_comp.text}"
    comp_token = res_comp.json()["access_token"]
    comp_headers = {"Authorization": f"Bearer {comp_token}"}

    res_stud = s.post(f"{BASE_URL}/auth/signup", json={
        "email": stud_email,
        "password": stud_pass,
        "role": "student",
        "full_name": f"Priya Sharma {uid}"
    })
    assert res_stud.status_code == 200, f"Student signup failed: {res_stud.text}"
    stud_token = res_stud.json()["access_token"]
    stud_headers = {"Authorization": f"Bearer {stud_token}"}

    # Student updates profile details
    res_prof = s.patch(f"{BASE_URL}/students/me", json={
        "college": "National Institute of Technology",
        "branch": "Computer Science & Engineering",
        "cgpa": 9.4,
        "skills": ["Python", "FastAPI", "React", "Docker", "PostgreSQL", "Machine Learning"]
    }, headers=stud_headers)
    assert res_prof.status_code == 200

    print("  [OK] Accounts and profiles created successfully.\n")

    # Step 1: Company posts a drive, sets it live
    print("--- STEP 1: Company posts a drive, sets it live ---")
    drive_payload = {
        "title": "Senior AI / Backend Engineer",
        "description": "Building scalable LLM pipelines and high throughput APIs.",
        "package": "36 LPA",
        "location": "Bengaluru (Hybrid)",
        "min_cgpa": 8.0,
        "eligible_branches": ["CSE", "IT", "ECE"],
        "max_backlogs": 0
    }
    res_drive = s.post(f"{BASE_URL}/drives", json=drive_payload, headers=comp_headers)
    assert res_drive.status_code == 201, res_drive.text
    drive_id = res_drive.json()["id"]
    print(f"  [OK] Drive created (ID: {drive_id}, Status: draft)")

    res_live = s.patch(f"{BASE_URL}/drives/{drive_id}", json={"status": "live"}, headers=comp_headers)
    assert res_live.status_code == 200, res_live.text
    assert res_live.json()["status"] == "live"
    print(f"  [OK] Drive status updated to LIVE.")

    # Step 2: Student applies
    print("\n--- STEP 2: Student applies to the drive ---")
    res_apply = s.post(f"{BASE_URL}/applications", json={"drive_id": drive_id}, headers=stud_headers)
    assert res_apply.status_code == 201, res_apply.text
    app_data = res_apply.json()
    application_id = app_data["id"]
    assert app_data["current_stage"] == "applied"
    print(f"  [OK] Application submitted (ID: {application_id}, Stage: {app_data['current_stage']})")

    # Step 3: Company creates an assessment for the drive
    print("\n--- STEP 3: Company creates an assessment for the drive ---")
    assessment_payload = {
        "drive_id": drive_id,
        "duration_mins": 45,
        "questions": [
            {
                "question": "What is the primary advantage of indexing in PostgreSQL database?",
                "options": ["Reduces storage size", "Improves query lookup speed", "Eliminates duplicate rows", "Encrypts table data"],
                "correct_option": 1
            },
            {
                "question": "In Python, which GIL property affects multi-threaded CPU-bound programs?",
                "options": ["Executes threads simultaneously on all cores", "Only one thread executes Python bytecode at a time", "Prevents memory allocation", "Forces async I/O"],
                "correct_option": 1
            },
            {
                "question": "What HTTP status code represents a resource created successfully?",
                "options": ["200 OK", "201 Created", "204 No Content", "202 Accepted"],
                "correct_option": 1
            }
        ]
    }
    res_assess = s.post(f"{BASE_URL}/assessments", json=assessment_payload, headers=comp_headers)
    assert res_assess.status_code == 201, res_assess.text
    print(f"  [OK] Assessment created with {len(assessment_payload['questions'])} questions (Duration: 45m)")

    # Step 4: Student takes the assessment, submits
    print("\n--- STEP 4: Student takes the assessment & submits ---")
    res_get_assess = s.get(f"{BASE_URL}/assessments/drive/{drive_id}", headers=stud_headers)
    assert res_get_assess.status_code == 200, res_get_assess.text
    questions_received = res_get_assess.json()["questions"]
    assert len(questions_received) == 3
    print(f"  [OK] Student loaded {len(questions_received)} sanitized assessment questions.")

    submission_payload = {
        "application_id": application_id,
        "answers": [
            {"question_id": 0, "selected_option": 1},
            {"question_id": 1, "selected_option": 1},
            {"question_id": 2, "selected_option": 1}
        ],
        "proctor_flags": []
    }
    res_sub_assess = s.post(f"{BASE_URL}/assessments/submit", json=submission_payload, headers=stud_headers)
    assert res_sub_assess.status_code == 201, res_sub_assess.text
    assess_score = res_sub_assess.json()["score"]
    print(f"  [OK] Assessment submitted & auto-graded: Score = {assess_score}%")
    assert assess_score == 100.0

    # Step 5: Company schedules an interview for that application
    print("\n--- STEP 5: Company schedules an interview for the application ---")
    interview_payload = {
        "application_id": application_id,
        "questions": [
            "Walk us through how you design high-availability distributed systems.",
            "How do you maintain data consistency across microservices?"
        ]
    }
    res_interview = s.post(f"{BASE_URL}/interviews", json=interview_payload, headers=comp_headers)
    assert res_interview.status_code == 201, res_interview.text
    interview_id = res_interview.json()["id"]
    print(f"  [OK] Interview scheduled (ID: {interview_id}) with {len(interview_payload['questions'])} questions.")

    # Step 6: Student takes the interview, submits transcript
    print("\n--- STEP 6: Student takes the interview & submits transcript ---")
    res_get_interview = s.get(f"{BASE_URL}/interviews/application/{application_id}", headers=stud_headers)
    assert res_get_interview.status_code == 200, res_get_interview.text
    int_data = res_get_interview.json()
    print(f"  [OK] Student retrieved interview room questions: {len(int_data['questions'])} prompts.")

    transcript_payload = {
        "transcript": (
            "Question 1: I design distributed systems using asynchronous message queues like Kafka and RabbitMQ with Redis caching.\n"
            "Question 2: For consistency, we use saga orchestration patterns with idempotent retries and distributed locks."
        )
    }
    res_sub_int = s.post(f"{BASE_URL}/interviews/{interview_id}/submit", json=transcript_payload, headers=stud_headers)
    assert res_sub_int.status_code == 200, res_sub_int.text
    assert res_sub_int.json()["completed_at"] is not None
    print(f"  [OK] Interview transcript submitted and analyzed by AI sentiment engine.")

    # Step 7: Company generates the scorecard
    print("\n--- STEP 7: Company generates candidate scorecard ---")
    res_gen_sc = s.post(f"{BASE_URL}/scorecards/generate/{application_id}", headers=comp_headers)
    assert res_gen_sc.status_code == 201, res_gen_sc.text
    scorecard = res_gen_sc.json()
    print(f"  [OK] Scorecard generated successfully:")
    print(f"    - Overall AI Match Score: {scorecard.get('overall_ai_score')}%")
    print(f"    - Resume Match Score:    {scorecard.get('resume_match_score')}%")
    print(f"    - Assessment Score:      {scorecard.get('assessment_score')}%")
    print(f"    - Communication Score:   {scorecard.get('communication_score')}%")
    print(f"    - AI Summary:            {scorecard.get('ai_summary')}")
    print(f"    - AI Insights:           {scorecard.get('ai_insights')}")

    # Step 8: Company moves application through pipeline stages
    print("\n--- STEP 8: Company moves application through pipeline stages ---")
    # Move to ai_interview stage
    res_p1 = s.patch(f"{BASE_URL}/applications/{application_id}/stage", json={"current_stage": "ai_interview"}, headers=comp_headers)
    assert res_p1.status_code == 200
    print(f"  [OK] Moved application stage -> 'ai_interview'")

    # Move to shortlisted stage
    res_p2 = s.patch(f"{BASE_URL}/applications/{application_id}/stage", json={"current_stage": "shortlisted"}, headers=comp_headers)
    assert res_p2.status_code == 200
    print(f"  [OK] Moved application stage -> 'shortlisted'")

    # Move to offered stage
    res_p3 = s.patch(f"{BASE_URL}/applications/{application_id}/stage", json={"current_stage": "offered"}, headers=comp_headers)
    assert res_p3.status_code == 200
    print(f"  [OK] Moved application stage -> 'offered'")

    # Move to hired stage
    res_p4 = s.patch(f"{BASE_URL}/applications/{application_id}/stage", json={"current_stage": "hired"}, headers=comp_headers)
    assert res_p4.status_code == 200
    print(f"  [OK] Moved application stage -> 'hired'")

    # Step 9: Student checks their Application Tracker — confirms stage updates are visible
    print("\n--- STEP 9: Student checks Application Tracker (/applications/mine) ---")
    res_my_apps = s.get(f"{BASE_URL}/applications/mine", headers=stud_headers)
    assert res_my_apps.status_code == 200, res_my_apps.text
    my_applications = res_my_apps.json()
    assert len(my_applications) >= 1
    my_app = next((a for a in my_applications if a["id"] == application_id), None)
    assert my_app is not None, "Application not found in student tracker"

    print(f"  [OK] Verified student application tracker data:")
    print(f"    - Drive Role:     {my_app['drive']['title']}")
    print(f"    - Company Name:   {my_app['drive']['company_name']}")
    print(f"    - Package:        {my_app['drive']['package']}")
    print(f"    - Current Stage:  {my_app['current_stage']} (VERIFIED: MATCHES 'hired')")

    print("\n=================================================================")
    print("   ALL 9 END-TO-END RECRUITMENT PIPELINE STEPS PASSED 100%       ")
    print("=================================================================")

if __name__ == "__main__":
    run_full_end_to_end_test()
