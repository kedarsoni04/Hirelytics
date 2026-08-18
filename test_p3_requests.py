import requests
import uuid

BASE_URL = "http://127.0.0.1:8000"

def test_priority_3_and_4():
    s = requests.Session()
    uid = str(uuid.uuid4())[:8]

    # 1. Company signup
    comp_res = s.post(f"{BASE_URL}/auth/signup", json={
        "email": f"p3_comp_{uid}@test.com",
        "password": "password123",
        "role": "company",
        "company_name": f"P3 Innovations {uid}"
    })
    assert comp_res.status_code == 200, comp_res.text
    comp_token = comp_res.json()["access_token"]
    comp_headers = {"Authorization": f"Bearer {comp_token}"}

    # 2. Company posts live drive
    drive_res = s.post(f"{BASE_URL}/drives", json={
        "title": "AI Systems Engineer",
        "package": "28 LPA",
        "location": "Bengaluru",
        "min_cgpa": 7.5,
        "eligible_branches": ["CSE", "IT"]
    }, headers=comp_headers)
    assert drive_res.status_code == 201, drive_res.text
    drive_id = drive_res.json()["id"]

    patch_res = s.patch(f"{BASE_URL}/drives/{drive_id}", json={"status": "live"}, headers=comp_headers)
    assert patch_res.status_code == 200, patch_res.text

    # 3. Student signup & profile
    stud_res = s.post(f"{BASE_URL}/auth/signup", json={
        "email": f"p3_stud_{uid}@test.com",
        "password": "password123",
        "role": "student",
        "full_name": f"Jordan Lee {uid}"
    })
    assert stud_res.status_code == 200, stud_res.text
    stud_token = stud_res.json()["access_token"]
    stud_headers = {"Authorization": f"Bearer {stud_token}"}

    # Student updates profile
    s.patch(f"{BASE_URL}/students/me", json={
        "college": "BITS Pilani",
        "branch": "Computer Science",
        "cgpa": 8.9,
        "skills": ["Python", "PyTorch", "FastAPI", "Docker"]
    }, headers=stud_headers)

    # 4. Student applies to drive
    app_res = s.post(f"{BASE_URL}/applications", json={"drive_id": drive_id}, headers=stud_headers)
    assert app_res.status_code == 201, app_res.text
    app_id = app_res.json()["id"]
    print("PASS: Student applied to drive (app_id:", app_id, ")")

    # 5. Company creates assessment for drive
    assess_res = s.post(f"{BASE_URL}/assessments", json={
        "drive_id": drive_id,
        "duration_mins": 30,
        "questions": [
            {
                "question": "What is the time complexity of searching in a balanced BST?",
                "options": ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
                "correct_option": 1
            },
            {
                "question": "Which Python keyword defines an asynchronous function?",
                "options": ["def async", "async def", "async func", "function async"],
                "correct_option": 1
            }
        ]
    }, headers=comp_headers)
    assert assess_res.status_code == 201, assess_res.text
    print("PASS: POST /assessments (Created assessment for drive)")

    # 6. Student loads assessment questions (GET /assessments/drive/{drive_id})
    get_assess_res = s.get(f"{BASE_URL}/assessments/drive/{drive_id}", headers=stud_headers)
    assert get_assess_res.status_code == 200, get_assess_res.text
    assess_data = get_assess_res.json()
    assert len(assess_data["questions"]) == 2
    # Verify correct_option is stripped for student
    assert "correct_option" not in assess_data["questions"][0]
    print("PASS: GET /assessments/drive/{drive_id} (Student retrieved questions safely)")

    # 7. Student submits assessment answers (POST /assessments/submit)
    sub_res = s.post(f"{BASE_URL}/assessments/submit", json={
        "application_id": app_id,
        "answers": [
            {"question_id": 0, "selected_option": 1},
            {"question_id": 1, "selected_option": 1}
        ],
        "proctor_flags": []
    }, headers=stud_headers)
    assert sub_res.status_code == 201, sub_res.text
    assert sub_res.json()["score"] == 100.0
    print("PASS: POST /assessments/submit (Scored 100%)")

    # 8. Company schedules interview for application (POST /interviews)
    interview_res = s.post(f"{BASE_URL}/interviews", json={
        "application_id": app_id,
        "questions": [
            "Explain how you designed your most recent backend service.",
            "How do you handle model latency in production inference?"
        ]
    }, headers=comp_headers)
    assert interview_res.status_code == 201, interview_res.text
    interview_id = interview_res.json()["id"]
    print("PASS: POST /interviews (Scheduled interview:", interview_id, ")")

    # 9. Student retrieves interview questions (GET /interviews/application/{application_id})
    get_int_res = s.get(f"{BASE_URL}/interviews/application/{app_id}", headers=stud_headers)
    assert get_int_res.status_code == 200, get_int_res.text
    assert len(get_int_res.json()["questions"]) == 2
    print("PASS: GET /interviews/application/{application_id}")

    # 10. Student finishes interview (POST /interviews/{interview_id}/submit)
    sub_int_res = s.post(f"{BASE_URL}/interviews/{interview_id}/submit", json={
        "transcript": "Question 1: I designed an async FastAPI architecture.\nQuestion 2: We quantized the weights and added a caching layer."
    }, headers=stud_headers)
    assert sub_int_res.status_code == 200, sub_int_res.text
    assert sub_int_res.json()["completed_at"] is not None
    print("PASS: POST /interviews/{interview_id}/submit")

    # 11. Company generates scorecard (POST /scorecards/generate/{application_id})
    gen_sc_res = s.post(f"{BASE_URL}/scorecards/generate/{app_id}", headers=comp_headers)
    assert gen_sc_res.status_code == 201, gen_sc_res.text
    scorecard = gen_sc_res.json()
    assert scorecard["overall_ai_score"] is not None
    print("PASS: POST /scorecards/generate/{application_id} (Overall Score:", scorecard["overall_ai_score"], ")")

    # 12. Company views scorecard (GET /scorecards/{application_id})
    get_sc_res = s.get(f"{BASE_URL}/scorecards/{app_id}", headers=comp_headers)
    assert get_sc_res.status_code == 200, get_sc_res.text
    assert get_sc_res.json()["id"] == scorecard["id"]
    print("PASS: GET /scorecards/{application_id}")

    print("\nALL PRIORITY 3 & 4 TESTS PASSED COMPLETELY!")

if __name__ == "__main__":
    test_priority_3_and_4()
