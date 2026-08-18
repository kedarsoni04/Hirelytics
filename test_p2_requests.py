import requests
import uuid

BASE_URL = "http://127.0.0.1:8000"

def test_priority_2():
    s = requests.Session()
    uid = str(uuid.uuid4())[:8]

    # 1. Company signup
    comp_res = s.post(f"{BASE_URL}/auth/signup", json={
        "email": f"p2_company_{uid}@test.com",
        "password": "password123",
        "role": "company",
        "company_name": f"P2 Tech {uid}"
    })
    assert comp_res.status_code == 200, comp_res.text
    comp_token = comp_res.json()["access_token"]
    comp_headers = {"Authorization": f"Bearer {comp_token}"}

    # 2. Company posts a drive
    drive_res = s.post(f"{BASE_URL}/drives", json={
        "title": "Backend Architect",
        "package": "32 LPA",
        "location": "Hyderabad",
        "min_cgpa": 8.0,
        "eligible_branches": ["CSE", "ECE"]
    }, headers=comp_headers)
    assert drive_res.status_code == 201, drive_res.text
    drive_id = drive_res.json()["id"]

    # Set drive live
    patch_drive_res = s.patch(f"{BASE_URL}/drives/{drive_id}", json={"status": "live"}, headers=comp_headers)
    assert patch_drive_res.status_code == 200, patch_drive_res.text

    # 3. Student signup & profile
    stud_res = s.post(f"{BASE_URL}/auth/signup", json={
        "email": f"p2_student_{uid}@test.com",
        "password": "password123",
        "role": "student",
        "full_name": f"Alex Morgan {uid}"
    })
    assert stud_res.status_code == 200, stud_res.text
    stud_token = stud_res.json()["access_token"]
    stud_headers = {"Authorization": f"Bearer {stud_token}"}

    # Student updates profile details (cgpa, branch, college, skills)
    prof_res = s.patch(f"{BASE_URL}/students/me", json={
        "college": "IIT Bombay",
        "branch": "Computer Science",
        "cgpa": 9.2,
        "skills": ["Python", "FastAPI", "React", "PostgreSQL"]
    }, headers=stud_headers)
    assert prof_res.status_code == 200, prof_res.text

    # 4. Student applies to drive
    apply_res = s.post(f"{BASE_URL}/applications", json={"drive_id": drive_id}, headers=stud_headers)
    assert apply_res.status_code == 201, apply_res.text
    app_id = apply_res.json()["id"]

    # 5. Company gets Candidate List (GET /applications/drive/{driveId})
    drive_apps_res = s.get(f"{BASE_URL}/applications/drive/{drive_id}", headers=comp_headers)
    assert drive_apps_res.status_code == 200, drive_apps_res.text
    candidates = drive_apps_res.json()
    assert len(candidates) >= 1
    cand = next((c for c in candidates if c["id"] == app_id), None)
    assert cand is not None
    assert cand["student"]["full_name"] == f"Alex Morgan {uid}"
    assert cand["student"]["college"] == "IIT Bombay"
    assert cand["student"]["cgpa"] == 9.2
    assert "FastAPI" in cand["student"]["skills"]
    print("PASS: GET /applications/drive/{driveId} candidate list")

    # 6. Company gets Candidate Detail (GET /applications/{id})
    detail_res = s.get(f"{BASE_URL}/applications/{app_id}", headers=comp_headers)
    assert detail_res.status_code == 200, detail_res.text
    app_detail = detail_res.json()
    assert app_detail["id"] == app_id
    assert app_detail["drive"]["title"] == "Backend Architect"
    assert app_detail["student"]["full_name"] == f"Alex Morgan {uid}"
    print("PASS: GET /applications/{application_id} candidate detail")

    # 7. Company updates application stage (PATCH /applications/{id}/stage)
    # Shortlist
    stage_res = s.patch(f"{BASE_URL}/applications/{app_id}/stage", json={"current_stage": "shortlisted"}, headers=comp_headers)
    assert stage_res.status_code == 200, stage_res.text
    assert stage_res.json()["current_stage"] == "shortlisted"
    print("PASS: PATCH /applications/{id}/stage to shortlisted")

    # Move to AI Interview
    stage_res2 = s.patch(f"{BASE_URL}/applications/{app_id}/stage", json={"current_stage": "ai_interview"}, headers=comp_headers)
    assert stage_res2.status_code == 200, stage_res2.text
    assert stage_res2.json()["current_stage"] == "ai_interview"
    print("PASS: PATCH /applications/{id}/stage to ai_interview")

    # Move to Offered
    stage_res3 = s.patch(f"{BASE_URL}/applications/{app_id}/stage", json={"current_stage": "offered"}, headers=comp_headers)
    assert stage_res3.status_code == 200, stage_res3.text
    assert stage_res3.json()["current_stage"] == "offered"
    print("PASS: PATCH /applications/{id}/stage to offered")

    print("\nALL PRIORITY 2 TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_priority_2()
