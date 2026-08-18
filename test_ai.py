import requests

BASE_URL = "http://127.0.0.1:8000"

def run_tests():
    print("=== STARTING AI/ASSESSMENT 7-STEP TEST SEQUENCE ===")

    # Setup
    print("--- SETUP ---")
    s = requests.Session()

    company_payload = {"email": "ai_company@test.com", "password": "pass", "role": "company", "company_name": "AI Corp"}
    res = s.post(f"{BASE_URL}/auth/signup", json=company_payload)
    if res.status_code != 200:
        # Might already exist
        res = s.post(f"{BASE_URL}/auth/login", data={"username": "ai_company@test.com", "password": "pass"})
    company_token = res.json().get("access_token")
    company_headers = {"Authorization": f"Bearer {company_token}"}

    student_payload = {"email": "ai_student@test.com", "password": "pass", "role": "student", "full_name": "AI Student"}
    res = s.post(f"{BASE_URL}/auth/signup", json=student_payload)
    if res.status_code != 200:
        # Might already exist
        res = s.post(f"{BASE_URL}/auth/login", data={"username": "ai_student@test.com", "password": "pass"})
    student_token = res.json().get("access_token")
    student_headers = {"Authorization": f"Bearer {student_token}"}

    drive_res = s.post(f"{BASE_URL}/drives", json={"title": "AI Engineer", "package": "30 LPA"}, headers=company_headers)
    drive_id = drive_res.json()["id"]
    s.patch(f"{BASE_URL}/drives/{drive_id}", json={"status": "live"}, headers=company_headers)

    app_res = s.post(f"{BASE_URL}/applications", json={"drive_id": drive_id}, headers=student_headers)
    application_id = app_res.json()["id"]
    print(f"Created Application: {application_id} for Drive: {drive_id}")

    print("\n--- 1. As company: create an assessment ---")
    assessment_payload = {
        "drive_id": drive_id,
        "duration_mins": 45,
        "questions": [
            {"question": "What is Python?", "options": ["Snake", "Language", "Car"], "correct_option": 1},
            {"question": "2 + 2 = ?", "options": ["3", "4", "5"], "correct_option": 1},
            {"question": "Capital of France?", "options": ["Berlin", "London", "Paris"], "correct_option": 2}
        ]
    }
    res = s.post(f"{BASE_URL}/assessments", json=assessment_payload, headers=company_headers)
    print(f"Status: {res.status_code}")
    if res.status_code != 201: print(res.json())

    print("\n--- 2. As student: GET the assessment ---")
    res = s.get(f"{BASE_URL}/assessments/drive/{drive_id}", headers=student_headers)
    print(f"Status: {res.status_code}")
    questions = res.json().get("questions", [])
    print(f"Questions returned: {len(questions)}")
    has_correct_option = any("correct_option" in q for q in questions)
    print(f"Is 'correct_option' hidden? {'YES' if not has_correct_option else 'NO'}")

    print("\n--- 3. As student: submit answers (auto-grading) ---")
    submission_payload = {
        "application_id": application_id,
        "answers": [
            {"question_id": 0, "selected_option": 1}, # Right
            {"question_id": 1, "selected_option": 1}, # Right
            {"question_id": 2, "selected_option": 0}  # Wrong (Berlin instead of Paris)
        ]
    }
    res = s.post(f"{BASE_URL}/assessments/submit", json=submission_payload, headers=student_headers)
    print(f"Status: {res.status_code}")
    print(f"Score received: {res.json().get('score')}%")

    print("\n--- 4. As company: schedule an interview ---")
    interview_payload = {
        "application_id": application_id,
        "questions": ["Why React?", "Explain APIs"]
    }
    res = s.post(f"{BASE_URL}/interviews", json=interview_payload, headers=company_headers)
    interview_id = res.json().get("id")
    print(f"Status: {res.status_code}, Interview ID: {interview_id}")

    print("\n--- 5. As student: submit interview transcript ---")
    transcript = "Uh, like, you know, React is a great UI library. I build API endpoints with Python and FastAPI."
    res = s.post(f"{BASE_URL}/interviews/{interview_id}/submit", json={"transcript": transcript}, headers=student_headers)
    print(f"Status: {res.status_code}")
    print(f"AI Sentiment Data: {res.json().get('sentiment_data')}")

    print("\n--- 6. As company: generate the scorecard ---")
    res = s.post(f"{BASE_URL}/scorecards/generate/{application_id}", headers=company_headers)
    print(f"Status: {res.status_code}")
    scorecard = res.json()
    print(f"Overall AI Score: {scorecard.get('overall_ai_score')}")
    print(f"Summary: {scorecard.get('ai_summary')}")
    
    res = s.get(f"{BASE_URL}/applications/{application_id}", headers=company_headers)
    print(f"Application Stage: {res.json().get('current_stage')}")

    print("\n--- 7. As student: GET the scorecard ---")
    res = s.get(f"{BASE_URL}/scorecards/{application_id}", headers=student_headers)
    print(f"Status: {res.status_code}")
    print("Scorecard keys present:", list(res.json().keys()))

    print("\n=== ALL TESTS COMPLETED SUCCESSFULLY! ===")

if __name__ == "__main__":
    try:
        run_tests()
    except Exception as e:
        print(f"Error during tests: {e}")
