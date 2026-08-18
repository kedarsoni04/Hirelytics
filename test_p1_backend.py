from fastapi.testclient import TestClient
from src.app.main import app

client = TestClient(app)

def test_priority_1_flow():
    import uuid
    uid = str(uuid.uuid4())[:8]
    company_res = client.post("/auth/signup", json={
        "email": f"p1_company_{uid}@example.com",
        "password": "password123",
        "role": "company",
        "company_name": f"P1 Corp {uid}"
    })
    assert company_res.status_code == 200, company_res.text
    company_token = company_res.json()["access_token"]
    company_headers = {"Authorization": f"Bearer {company_token}"}

    drive_res = client.post("/drives", json={
        "title": "Fullstack Developer",
        "package": "24 LPA",
        "location": "Bengaluru",
        "min_cgpa": 7.5,
        "eligible_branches": ["CSE", "IT"]
    }, headers=company_headers)
    assert drive_res.status_code == 201, drive_res.text
    drive_id = drive_res.json()["id"]

    # Set drive live
    patch_res = client.patch(f"/drives/{drive_id}", json={"status": "live"}, headers=company_headers)
    assert patch_res.status_code == 200, patch_res.text

    # 2. Signup student
    student_res = client.post("/auth/signup", json={
        "email": f"p1_student_{uid}@example.com",
        "password": "password123",
        "role": "student",
        "full_name": f"P1 Student {uid}"
    })
    assert student_res.status_code == 200, student_res.text
    student_token = student_res.json()["access_token"]
    student_headers = {"Authorization": f"Bearer {student_token}"}

    # 3. Student applies to drive (POST /applications)
    apply_res = client.post("/applications", json={"drive_id": drive_id}, headers=student_headers)
    assert apply_res.status_code == 201, apply_res.text
    app_data = apply_res.json()
    assert app_data["drive_id"] == drive_id
    assert app_data["current_stage"] == "applied"
    app_id = app_data["id"]

    # 4. Student gets their applications (GET /applications/mine)
    my_apps_res = client.get("/applications/mine", headers=student_headers)
    assert my_apps_res.status_code == 200, my_apps_res.text
    apps_list = my_apps_res.json()
    assert len(apps_list) >= 1
    found = next((a for a in apps_list if a["id"] == app_id), None)
    assert found is not None
    assert found["drive"]["title"] == "Fullstack Developer"
    assert found["drive"]["company_name"] == f"P1 Corp {uid}"
    assert found["current_stage"] == "applied"

    print("PRIORITY 1 BACKEND TEST PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_priority_1_flow()
