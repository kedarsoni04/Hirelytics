import requests
import uuid

BASE_URL = "http://127.0.0.1:8000"

def test_flow():
    s = requests.Session()
    uid = str(uuid.uuid4())[:8]

    # 1. Signup company
    comp_res = s.post(f"{BASE_URL}/auth/signup", json={
        "email": f"comp_{uid}@test.com",
        "password": "password123",
        "role": "company",
        "company_name": f"TestCorp {uid}"
    })
    print("Company Signup:", comp_res.status_code)
    comp_token = comp_res.json()["access_token"]
    comp_headers = {"Authorization": f"Bearer {comp_token}"}

    # 2. Create and live drive
    drive_res = s.post(f"{BASE_URL}/drives", json={
        "title": "Software Engineer",
        "package": "20 LPA",
        "location": "Remote",
        "min_cgpa": 7.0,
        "eligible_branches": ["CSE"]
    }, headers=comp_headers)
    print("Create Drive:", drive_res.status_code)
    drive_id = drive_res.json()["id"]

    patch_res = s.patch(f"{BASE_URL}/drives/{drive_id}", json={"status": "live"}, headers=comp_headers)
    print("Make Drive Live:", patch_res.status_code)

    # 3. Signup student
    stud_res = s.post(f"{BASE_URL}/auth/signup", json={
        "email": f"stud_{uid}@test.com",
        "password": "password123",
        "role": "student",
        "full_name": f"Test Student {uid}"
    })
    print("Student Signup:", stud_res.status_code)
    stud_token = stud_res.json()["access_token"]
    stud_headers = {"Authorization": f"Bearer {stud_token}"}

    # 4. Student applies
    apply_res = s.post(f"{BASE_URL}/applications", json={"drive_id": drive_id}, headers=stud_headers)
    print("Apply to Drive (POST /applications):", apply_res.status_code, apply_res.json())
    assert apply_res.status_code == 201

    # 5. Student checks applications
    my_res = s.get(f"{BASE_URL}/applications/mine", headers=stud_headers)
    print("Get Applications (GET /applications/mine):", my_res.status_code, my_res.json())
    assert my_res.status_code == 200
    assert len(my_res.json()) >= 1
    assert my_res.json()[0]["drive"]["title"] == "Software Engineer"
    assert my_res.json()[0]["drive"]["company_name"] == f"TestCorp {uid}"

    print("\n✅ Priority 1 Endpoints Verified and Passed!")

if __name__ == "__main__":
    test_flow()
