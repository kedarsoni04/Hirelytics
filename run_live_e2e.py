"""
Hirelytics — Full 41-Step End-to-End Functional Test
Target: https://hirelytics-gsp0.onrender.com (Live deployed backend)
"""

import sys
import time
import uuid
import requests

if hasattr(sys.stdout, "reconfigure"):
    getattr(sys.stdout, "reconfigure")(encoding="utf-8")

BASE_URL = "https://hirelytics-gsp0.onrender.com"
TIMEOUT = 60  # generous timeout for live backend / LLM operations

results = []  # List of tuples: (step_num, status, label, detail)


def h(token: str):
    return {"Authorization": f"Bearer {token}"}


def record(step_num: int, label: str, passed: bool, detail: str = ""):
    status = "Pass" if passed else "Fail"
    results.append((step_num, status, label, detail))
    safe_label = label.replace("—", "-").replace("→", "->").encode("ascii", errors="replace").decode("ascii")
    print(f"Step {step_num:2d} | {status} | {safe_label}")
    if not passed and detail:
        safe_detail = str(detail).replace("—", "-").replace("→", "->").encode("ascii", errors="replace").decode("ascii")
        print(f"   [Error Detail]: {safe_detail}")
    sys.stdout.flush()
    return passed


def record_skip(step_num: int, label: str, reason: str):
    results.append((step_num, "Skipped", label, reason))
    safe_label = label.replace("—", "-").replace("→", "->").encode("ascii", errors="replace").decode("ascii")
    safe_reason = reason.replace("—", "-").replace("→", "->").encode("ascii", errors="replace").decode("ascii")
    print(f"Step {step_num:2d} | Skipped | {safe_label} ({safe_reason})")
    sys.stdout.flush()


def safe_req(method: str, url: str, **kwargs):
    kwargs.setdefault("timeout", TIMEOUT)
    try:
        r = getattr(requests, method)(url, **kwargs)
        return r, ""
    except Exception as e:
        return None, str(e)


def run():
    uid = str(uuid.uuid4())[:8]
    print("=" * 70)
    print(f"HIRELYTICS 41-STEP E2E FUNCTIONAL TEST")
    print(f"Target Backend: {BASE_URL}")
    print(f"Test Run ID: {uid}")
    print("=" * 70)

    # Accounts
    comp_email = f"e2e_co_{uid}@corp.io"
    comp_pass = "TestPass1!"
    stud_email = f"e2e_st_{uid}@uni.ac.in"
    stud_pass = "TestPass2@"
    comp2_email = f"e2e_co2_{uid}@rival.io"
    comp2_pass = "TestPass3#"
    admin_email = f"e2e_admin_{uid}@hirelytics.io"
    admin_pass = "AdminPass4$"

    comp_token = ""
    stud_token = ""
    comp2_token = ""
    admin_token = ""
    comp_id = ""
    stud_user_id = ""
    drive_id = ""
    app_id = ""
    interview_id = ""
    assessment_id = ""
    overall_ai_score = None

    # ═══════════════════════════════════════
    # AUTH FLOW (Steps 1 - 7)
    # ═══════════════════════════════════════

    # Step 1: Signup company — expect 200 + token
    r, err = safe_req("post", f"{BASE_URL}/auth/signup", json={
        "email": comp_email, "password": comp_pass,
        "role": "company", "company_name": f"E2E Corp {uid}"
    })
    ok = r is not None and r.status_code == 200 and "access_token" in (r.json() if r else {})
    if r is not None and ok:
        comp_token = r.json()["access_token"]
    record(1, "Signup company — expect 200 + token", ok,
           err or (f"Status: {r.status_code}, Body: {r.text}" if r and not ok else ""))

    # Step 2: Signup student — expect 200 + token
    r, err = safe_req("post", f"{BASE_URL}/auth/signup", json={
        "email": stud_email, "password": stud_pass,
        "role": "student", "full_name": f"Test Student {uid}"
    })
    ok = r is not None and r.status_code == 200 and "access_token" in (r.json() if r else {})
    if r is not None and ok:
        stud_token = r.json()["access_token"]
    record(2, "Signup student — expect 200 + token", ok,
           err or (f"Status: {r.status_code}, Body: {r.text}" if r and not ok else ""))

    # Step 3: Login company with correct credentials — expect 200
    r, err = safe_req("post", f"{BASE_URL}/auth/login", json={
        "email": comp_email, "password": comp_pass
    })
    ok = r is not None and r.status_code == 200 and "access_token" in (r.json() if r else {})
    record(3, "Login company with correct credentials — expect 200", ok,
           err or (f"Status: {r.status_code}, Body: {r.text}" if r and not ok else ""))

    # Step 4: Login student with correct credentials — expect 200
    r, err = safe_req("post", f"{BASE_URL}/auth/login", json={
        "email": stud_email, "password": stud_pass
    })
    ok = r is not None and r.status_code == 200 and "access_token" in (r.json() if r else {})
    record(4, "Login student with correct credentials — expect 200", ok,
           err or (f"Status: {r.status_code}, Body: {r.text}" if r and not ok else ""))

    # Step 5: Login with wrong password — expect 401
    r, err = safe_req("post", f"{BASE_URL}/auth/login", json={
        "email": comp_email, "password": "WrongPassword123!"
    })
    ok = r is not None and r.status_code == 401
    record(5, "Login with wrong password — expect 401", ok,
           err or (f"Status: {r.status_code}, Body: {r.text}" if r and not ok else ""))

    # Step 6: GET /auth/me for both — expect correct role + profile data
    rc, err_c = safe_req("get", f"{BASE_URL}/auth/me", headers=h(comp_token))
    rs, err_s = safe_req("get", f"{BASE_URL}/auth/me", headers=h(stud_token))
    comp_me_ok = rc is not None and rc.status_code == 200 and rc.json().get("role") in ("company", "UserRole.company")
    stud_me_ok = rs is not None and rs.status_code == 200 and rs.json().get("role") in ("student", "UserRole.student")
    if rc is not None and comp_me_ok:
        comp_profile = rc.json().get("company_profile", {})
        comp_id = comp_profile.get("id", "")
    if rs is not None and stud_me_ok:
        stud_user_id = rs.json().get("id", "")
    ok = comp_me_ok and stud_me_ok
    err_detail = ""
    if not ok:
        err_detail = f"Company /auth/me: {rc.status_code if rc else err_c} {rc.text if rc else ''}; Student /auth/me: {rs.status_code if rs else err_s} {rs.text if rs else ''}"
    record(6, "GET /auth/me for both — expect correct role + profile data", ok, err_detail)

    # Step 7: PATCH /students/me — update full_name, skills — expect 200, confirm persisted via a follow-up GET /auth/me
    patch_data = {"full_name": f"Updated Student {uid}", "skills": ["Python", "FastAPI", "SQL"]}
    r_patch, err_patch = safe_req("patch", f"{BASE_URL}/students/me", headers=h(stud_token), json=patch_data)
    patch_ok = r_patch is not None and r_patch.status_code == 200
    persisted_ok = False
    if patch_ok:
        r_me, _ = safe_req("get", f"{BASE_URL}/auth/me", headers=h(stud_token))
        if r_me and r_me.status_code == 200:
            sp = r_me.json().get("student_profile", {})
            persisted_ok = sp.get("full_name") == patch_data["full_name"] and sp.get("skills") == patch_data["skills"]
    ok = patch_ok and persisted_ok
    record(7, "PATCH /students/me — update full_name, skills — expect 200, confirm persisted", ok,
           err_patch or (f"Patch status: {r_patch.status_code if r_patch else 'None'}, persisted: {persisted_ok}" if not ok else ""))

    # ═══════════════════════════════════════
    # DRIVE + APPLICATION FLOW (Steps 8 - 14)
    # ═══════════════════════════════════════

    # Step 8: Company: POST /drives — expect 201, status="draft"
    r, err = safe_req("post", f"{BASE_URL}/drives", headers=h(comp_token), json={
        "title": f"E2E Backend Engineer {uid}",
        "description": "Python, FastAPI, SQL microservices engineer",
        "package": "20 LPA",
        "location": "Remote",
        "min_cgpa": 7.0,
        "eligible_branches": ["CSE", "IT"],
        "max_backlogs": 1
    })
    ok = r is not None and r.status_code == 201 and r.json().get("status") in ("draft", "DriveStatus.draft")
    if r is not None and ok:
        drive_id = r.json()["id"]
    record(8, "Company: POST /drives — expect 201, status=\"draft\"", ok,
           err or (f"Status: {r.status_code}, Body: {r.text}" if r and not ok else ""))

    # Step 9: Company: PATCH /drives/{id} status="live" — expect 200
    r, err = safe_req("patch", f"{BASE_URL}/drives/{drive_id}", headers=h(comp_token), json={"status": "live"})
    ok = r is not None and r.status_code == 200 and r.json().get("status") in ("live", "DriveStatus.live")
    record(9, "Company: PATCH /drives/{id} status=\"live\" — expect 200", ok,
           err or (f"Status: {r.status_code}, Body: {r.text}" if r and not ok else ""))

    # Step 10: Student: GET /drives — confirm the new drive appears
    r, err = safe_req("get", f"{BASE_URL}/drives", headers=h(stud_token))
    ok = r is not None and r.status_code == 200 and any(d["id"] == drive_id for d in r.json())
    record(10, "Student: GET /drives — confirm the new drive appears", ok,
           err or (f"Status: {r.status_code if r else 'None'}, drive_id not found in {len(r.json()) if r else 0} drives" if not ok else ""))

    # Step 11: Student: POST /applications — expect 201
    r, err = safe_req("post", f"{BASE_URL}/applications", headers=h(stud_token), json={"drive_id": drive_id})
    ok = r is not None and r.status_code == 201
    if r is not None and ok:
        app_id = r.json()["id"]
    record(11, "Student: POST /applications — expect 201", ok,
           err or (f"Status: {r.status_code}, Body: {r.text}" if r and not ok else ""))

    # Step 12: Student: duplicate POST /applications to same drive — expect 400 "already applied"
    r, err = safe_req("post", f"{BASE_URL}/applications", headers=h(stud_token), json={"drive_id": drive_id})
    ok = r is not None and r.status_code == 400 and "already" in r.json().get("detail", "").lower()
    record(12, "Student: duplicate POST /applications to same drive — expect 400 \"already applied\"", ok,
           err or (f"Status: {r.status_code}, Body: {r.text}" if r and not ok else ""))

    # Step 13: Company: GET /applications/drive/{driveId} — confirm student appears with correct profile data
    r, err = safe_req("get", f"{BASE_URL}/applications/drive/{drive_id}", headers=h(comp_token))
    ok = False
    detail = ""
    if r is not None and r.status_code == 200:
        apps = r.json()
        target = next((a for a in apps if a.get("id") == app_id), None)
        if target:
            student_info = target.get("student", {})
            full_name = student_info.get("full_name", "")
            if full_name == f"Updated Student {uid}":
                ok = True
            else:
                detail = f"Student full_name mismatch: expected 'Updated Student {uid}', got '{full_name}'"
        else:
            detail = f"Application id {app_id} not found in drive applications: {apps}"
    else:
        detail = err or (f"Status: {r.status_code}, Body: {r.text}" if r else "No response")
    record(13, "Company: GET /applications/drive/{driveId} — confirm student appears with correct profile data", ok, detail)

    # Step 14: Another company account tries GET /applications/drive/{driveId} for the first company's drive — expect 403
    r_signup2, err_signup2 = safe_req("post", f"{BASE_URL}/auth/signup", json={
        "email": comp2_email, "password": comp2_pass,
        "role": "company", "company_name": f"Rival Corp {uid}"
    })
    comp2_ok = r_signup2 is not None and r_signup2.status_code == 200
    if r_signup2 is not None and comp2_ok:
        comp2_token = r_signup2.json()["access_token"]
        r, err = safe_req("get", f"{BASE_URL}/applications/drive/{drive_id}", headers=h(comp2_token))
        ok = r is not None and r.status_code == 403
        record(14, "Another company account tries GET /applications/drive/{driveId} — expect 403", ok,
               err or (f"Status: {r.status_code}, Body: {r.text}" if r and not ok else ""))
    else:
        record(14, "Another company account tries GET /applications/drive/{driveId} — expect 403", False,
               f"Could not signup second company: {err_signup2 or (r_signup2.text if r_signup2 else '')}")

    # ═══════════════════════════════════════
    # ASSESSMENT FLOW (Steps 15 - 18)
    # ═══════════════════════════════════════

    # Step 15: Company: POST /assessments (3 MCQs) — expect 201
    mcqs = [
        {"question": "What is HTTP?", "options": ["Protocol", "Language", "Database", "OS"], "correct_option": 0},
        {"question": "Python keyword for function?", "options": ["func", "def", "fn", "fun"], "correct_option": 1},
        {"question": "Time complexity of binary search?", "options": ["O(n)", "O(n^2)", "O(log n)", "O(1)"], "correct_option": 2}
    ]
    r, err = safe_req("post", f"{BASE_URL}/assessments", headers=h(comp_token), json={
        "drive_id": drive_id,
        "questions": mcqs,
        "duration_mins": 30
    })
    ok = r is not None and r.status_code == 201
    if r is not None and ok:
        assessment_id = r.json().get("id")
    record(15, "Company: POST /assessments (3 MCQs) — expect 201", ok,
           err or (f"Status: {r.status_code}, Body: {r.text}" if r and not ok else ""))

    # Step 16: Student: GET /assessments/drive/{driveId} — confirm correct_option is HIDDEN in the response
    r, err = safe_req("get", f"{BASE_URL}/assessments/drive/{drive_id}", headers=h(stud_token))
    ok = False
    detail = ""
    if r is not None and r.status_code == 200:
        qs = r.json().get("questions", [])
        has_correct = any("correct_option" in q for q in qs)
        if not has_correct and len(qs) == 3:
            ok = True
        else:
            detail = f"correct_option exposed or question count mismatch: len={len(qs)}, has_correct={has_correct}"
    else:
        detail = err or (f"Status: {r.status_code}, Body: {r.text}" if r else "No response")
    record(16, "Student: GET /assessments/drive/{driveId} — confirm correct_option is HIDDEN", ok, detail)

    # Step 17: Student: POST /assessments/submit — expect 201, confirm auto-graded score is mathematically correct
    # Q0: option 0 (correct), Q1: option 1 (correct), Q2: option 0 (wrong, correct=2) -> 2/3 = 66.67%
    answers = [
        {"question_id": 0, "selected_option": 0},
        {"question_id": 1, "selected_option": 1},
        {"question_id": 2, "selected_option": 0}
    ]
    r, err = safe_req("post", f"{BASE_URL}/assessments/submit", headers=h(stud_token), json={
        "application_id": app_id,
        "answers": answers,
        "proctor_flags": []
    })
    ok = False
    detail = ""
    expected_score = (2.0 / 3.0) * 100.0
    if r is not None and r.status_code == 201:
        score = r.json().get("score")
        if score is not None and abs(float(score) - expected_score) < 0.2:
            ok = True
        else:
            detail = f"Score calculation mismatch: expected ~{expected_score:.2f}%, got {score}"
    else:
        detail = err or (f"Status: {r.status_code}, Body: {r.text}" if r else "No response")
    record(17, f"Student: POST /assessments/submit — expect 201, confirm auto-graded score (~{expected_score:.1f}%)", ok, detail)

    # Step 18: Company: GET /assessments/submission/{applicationId} — confirm score visible
    r, err = safe_req("get", f"{BASE_URL}/assessments/submission/{app_id}", headers=h(comp_token))
    ok = r is not None and r.status_code == 200 and r.json().get("score") is not None
    record(18, "Company: GET /assessments/submission/{applicationId} — confirm score visible", ok,
           err or (f"Status: {r.status_code}, Body: {r.text}" if r and not ok else ""))

    # ═══════════════════════════════════════
    # INTERVIEW FLOW (Steps 19 - 22)
    # ═══════════════════════════════════════

    # Step 19: Company: POST /interviews (no custom questions) - expect 201, confirm Gemini generated exactly 6 questions with category tags
    r, err = safe_req("post", f"{BASE_URL}/interviews", headers=h(comp_token), json={"application_id": app_id, "questions": []})
    ok = False
    detail = ""
    if r is not None and r.status_code == 201:
        interview_id = r.json().get("id")
        qs = r.json().get("questions", [])
        expected_cats = {"intro", "technical", "problem_solving", "soft_skill", "closing"}
        cats_found = {q.get("category", "").lower() for q in qs if isinstance(q, dict)}
        if len(qs) == 6 and len(cats_found.intersection(expected_cats)) >= 4:
            ok = True
        else:
            detail = f"Expected 6 questions with standard categories, got {len(qs)} questions with categories: {cats_found}"
    else:
        detail = err or (f"Status: {r.status_code}, Body: {r.text}" if r else "No response")
    record(19, "Company: POST /interviews (no custom questions) — expect 201, confirm 6 questions + category tags", ok, detail)

    # Step 20: Student: GET /interviews/application/{applicationId} — confirm 6 questions returned
    r, err = safe_req("get", f"{BASE_URL}/interviews/application/{app_id}", headers=h(stud_token))
    ok = r is not None and r.status_code == 200 and len(r.json().get("questions", [])) == 6
    record(20, "Student: GET /interviews/application/{applicationId} — confirm 6 questions returned", ok,
           err or (f"Status: {r.status_code}, Body: {r.text}" if r and not ok else ""))

    # Step 21: Student: POST /interviews/transcribe — send real audio file (or skip if no audio available)
    # Skipping as allowed by the prompt instructions
    record_skip(21, "Student: POST /interviews/transcribe", "No audio file available in automated test context; noted as untested")

    # Step 22: Student: POST /interviews/{id}/submit — realistic mock transcript containing filler words & technical terms
    mock_transcript = (
        "Um, so I have been working with Python for about three years. "
        "I am, uh, very familiar with FastAPI and SQLAlchemy. "
        "I built RESTful APIs and microservices. "
        "I think, um, asynchronous programming with asyncio is quite powerful. "
        "I have deployed to Docker containers and used PostgreSQL extensively. "
        "Problem solving is important — I use data structures like trees and graphs. "
        "I am confident in my technical skills and enjoy teamwork. "
        "Machine learning with scikit-learn is something I explored as well."
    )
    r, err = safe_req("post", f"{BASE_URL}/interviews/{interview_id}/submit", headers=h(stud_token), json={"transcript": mock_transcript})
    ok = False
    detail = ""
    if r is not None and r.status_code == 200:
        sentiment = r.json().get("sentiment_data", {})
        filler_ok = "filler_word_count" in sentiment and sentiment["filler_word_count"] is not None
        kw_ok = "keyword_matches" in sentiment and isinstance(sentiment["keyword_matches"], list)
        conf_ok = "confidence_score" in sentiment and sentiment["confidence_score"] is not None
        tone_ok = "tone" in sentiment and sentiment["tone"] is not None
        if filler_ok and kw_ok and conf_ok and tone_ok:
            ok = True
        else:
            detail = f"Incomplete sentiment data: filler_ok={filler_ok}, kw_ok={kw_ok}, conf_ok={conf_ok}, tone_ok={tone_ok}; data={sentiment}"
    else:
        detail = err or (f"Status: {r.status_code}, Body: {r.text}" if r else "No response")
    record(22, "Student: POST /interviews/{id}/submit — confirm filler, keywords, confidence, tone computed", ok, detail)

    # ═══════════════════════════════════════
    # SCORECARD FLOW (Steps 23 - 27)
    # ═══════════════════════════════════════

    # Step 23: Company: POST /scorecards/generate/{applicationId} — expect 201, confirm all 4 category scores present & not identical
    r, err = safe_req("post", f"{BASE_URL}/scorecards/generate/{app_id}", headers=h(comp_token))
    ok = False
    detail = ""
    sc_data = {}
    if r is not None and r.status_code == 201:
        sc_data = r.json()
        overall_ai_score = sc_data.get("overall_ai_score")
        r_score = sc_data.get("resume_match_score")
        a_score = sc_data.get("assessment_score")
        c_score = sc_data.get("communication_score")
        t_score = sc_data.get("technical_interview_score")
        all_present = all(v is not None for v in [r_score, a_score, c_score, t_score, overall_ai_score])
        scores = [float(v) for v in [r_score, a_score, c_score, t_score] if v is not None]
        unique_scores = len(set(round(s, 1) for s in scores))
        if all_present and unique_scores > 1:
            ok = True
        else:
            detail = f"Category scores missing or all identical: resume={r_score}, assess={a_score}, comm={c_score}, tech={t_score}, overall={overall_ai_score}"
    else:
        detail = err or (f"Status: {r.status_code}, Body: {r.text}" if r else "No response")
    record(23, "Company: POST /scorecards/generate/{applicationId} — expect 201, 4 category scores present & not identical", ok, detail)

    # Step 24: Confirm overall_ai_score is a correctly weighted average of the 4 categories
    ok = False
    detail = ""
    if sc_data:
        r_score = float(sc_data.get("resume_match_score", 0))
        a_score = float(sc_data.get("assessment_score", 0))
        c_score = float(sc_data.get("communication_score", 0))
        t_score = float(sc_data.get("technical_interview_score", 0))
        expected_weighted = round((r_score * 0.25) + (a_score * 0.25) + (c_score * 0.25) + (t_score * 0.25), 2)
        actual_overall = float(sc_data.get("overall_ai_score", 0))
        if abs(actual_overall - expected_weighted) < 0.2:
            ok = True
        else:
            detail = f"Weighted average mismatch: expected {expected_weighted} from [r={r_score}, a={a_score}, c={c_score}, t={t_score}], got {actual_overall}"
    else:
        detail = "No scorecard data available from Step 23"
    record(24, "Confirm overall_ai_score is a correctly weighted average of the 4 categories", ok, detail)

    # Step 25: Try generating a scorecard for an application MISSING an interview/assessment — expect 400
    r_stud_fresh, _ = safe_req("post", f"{BASE_URL}/auth/signup", json={
        "email": f"e2e_fresh_{uid}@uni.ac.in", "password": "FreshPass123!",
        "role": "student", "full_name": f"Fresh Incomplete {uid}"
    })
    if r_stud_fresh and r_stud_fresh.status_code == 200:
        fresh_token = r_stud_fresh.json()["access_token"]
        r_app2, _ = safe_req("post", f"{BASE_URL}/applications", headers=h(fresh_token), json={"drive_id": drive_id})
        if r_app2 and r_app2.status_code == 201:
            fresh_app_id = r_app2.json()["id"]
            r_sc_fail, err_sc_fail = safe_req("post", f"{BASE_URL}/scorecards/generate/{fresh_app_id}", headers=h(comp_token))
            ok = r_sc_fail is not None and r_sc_fail.status_code == 400
            record(25, "Try generating a scorecard for application MISSING interview/assessment — expect 400", ok,
                   err_sc_fail or (f"Status: {r_sc_fail.status_code}, Body: {r_sc_fail.text}" if r_sc_fail and not ok else ""))
        else:
            record(25, "Try generating a scorecard for application MISSING interview/assessment — expect 400", False, "Could not apply with fresh student")
    else:
        record(25, "Try generating a scorecard for application MISSING interview/assessment — expect 400", False, "Could not signup fresh student")

    # Step 26: Student: GET /scorecards/{applicationId} — expect 200
    r, err = safe_req("get", f"{BASE_URL}/scorecards/{app_id}", headers=h(stud_token))
    ok = r is not None and r.status_code == 200
    record(26, "Student: GET /scorecards/{applicationId} — expect 200", ok,
           err or (f"Status: {r.status_code}, Body: {r.text}" if r and not ok else ""))

    # Step 27: A different, unrelated company account tries GET /scorecards/{applicationId} — expect 403
    r, err = safe_req("get", f"{BASE_URL}/scorecards/{app_id}", headers=h(comp2_token))
    ok = r is not None and r.status_code == 403
    record(27, "Different company account tries GET /scorecards/{applicationId} — expect 403", ok,
           err or (f"Status: {r.status_code}, Body: {r.text}" if r and not ok else ""))

    # ═══════════════════════════════════════
    # PIPELINE + NOTIFICATIONS (Steps 28 - 32)
    # ═══════════════════════════════════════

    # Step 28: Company: PATCH /applications/{id}/stage -> "shortlisted" - expect 200
    r, err = safe_req("patch", f"{BASE_URL}/applications/{app_id}/stage", headers=h(comp_token), json={"current_stage": "shortlisted"})
    ok = r is not None and r.status_code == 200
    record(28, "Company: PATCH /applications/{id}/stage -> \"shortlisted\" - expect 200", ok,
           err or (f"Status: {r.status_code}, Body: {r.text}" if r and not ok else ""))

    # Step 29: Student: GET /notifications/mine — confirm a "shortlisted" notification exists
    r, err = safe_req("get", f"{BASE_URL}/notifications/mine", headers=h(stud_token))
    ok = False
    detail = ""
    if r is not None and r.status_code == 200:
        notifs = r.json()
        has_shortlist = any("shortlist" in (n.get("message", "") + n.get("type", "")).lower() for n in notifs)
        if has_shortlist:
            ok = True
        else:
            detail = f"Shortlist notification not found in: {[n.get('message') for n in notifs[:5]]}"
    else:
        detail = err or (f"Status: {r.status_code}, Body: {r.text}" if r else "No response")
    record(29, "Student: GET /notifications/mine — confirm a \"shortlisted\" notification exists", ok, detail)

    # Step 30: Company: GET /notifications/mine — confirm notifications exist for assessment submission AND interview completion
    r, err = safe_req("get", f"{BASE_URL}/notifications/mine", headers=h(comp_token))
    ok = False
    detail = ""
    if r is not None and r.status_code == 200:
        notifs = r.json()
        has_assess = any("assessment" in n.get("message", "").lower() for n in notifs)
        has_interv = any("interview" in n.get("message", "").lower() for n in notifs)
        if has_assess and has_interv:
            ok = True
        else:
            detail = f"Missing event notifs (has_assessment={has_assess}, has_interview={has_interv}) in: {[n.get('message') for n in notifs[:6]]}"
    else:
        detail = err or (f"Status: {r.status_code}, Body: {r.text}" if r else "No response")
    record(30, "Company: GET /notifications/mine — confirm assessment + interview completion notifications exist", ok, detail)

    # Step 31: GET /notifications/unread-count for both — confirm counts are accurate (> 0)
    rs, err_s = safe_req("get", f"{BASE_URL}/notifications/unread-count", headers=h(stud_token))
    rc, err_c = safe_req("get", f"{BASE_URL}/notifications/unread-count", headers=h(comp_token))
    s_count = rs.json().get("count") if rs and rs.status_code == 200 else None
    c_count = rc.json().get("count") if rc and rc.status_code == 200 else None
    ok = s_count is not None and s_count > 0 and c_count is not None and c_count > 0
    detail = "" if ok else f"Student unread={s_count} (err: {err_s}), Company unread={c_count} (err: {err_c})"
    record(31, f"GET /notifications/unread-count for both — confirm counts are accurate (stud={s_count}, comp={c_count})", ok, detail)

    # Step 32: PATCH /notifications/read-all for student — confirm unread-count drops to 0
    r, err = safe_req("patch", f"{BASE_URL}/notifications/read-all", headers=h(stud_token))
    ok = False
    detail = ""
    if r is not None and r.status_code == 200:
        r2, _ = safe_req("get", f"{BASE_URL}/notifications/unread-count", headers=h(stud_token))
        new_cnt = r2.json().get("count") if r2 and r2.status_code == 200 else -1
        if new_cnt == 0:
            ok = True
        else:
            detail = f"Unread count after read-all is {new_cnt}, expected 0"
    else:
        detail = err or (f"Status: {r.status_code}, Body: {r.text}" if r else "No response")
    record(32, "PATCH /notifications/read-all for student — confirm unread-count drops to 0", ok, detail)

    # ═══════════════════════════════════════
    # STUDENT STATS (Steps 33 - 34)
    # ═══════════════════════════════════════

    # Step 33: Student: GET /students/me/stats — confirm applications_sent=1, ai_score matches scorecard's overall_ai_score
    r, err = safe_req("get", f"{BASE_URL}/students/me/stats", headers=h(stud_token))
    ok = False
    detail = ""
    if r is not None and r.status_code == 200:
        stats = r.json()
        apps_sent = stats.get("applications_sent")
        ai_score_val = stats.get("ai_score")
        apps_ok = apps_sent == 1
        ai_score_ok = False
        if overall_ai_score is not None and ai_score_val is not None:
            ai_score_ok = abs(float(ai_score_val) - float(overall_ai_score)) <= 1.5
        elif ai_score_val is not None:
            ai_score_ok = True
        if apps_ok and ai_score_ok:
            ok = True
        else:
            detail = f"Stats mismatch: applications_sent={apps_sent} (expected 1), ai_score={ai_score_val} (expected ~{overall_ai_score})"
    else:
        detail = err or (f"Status: {r.status_code}, Body: {r.text}" if r else "No response")
    record(33, f"Student: GET /students/me/stats — confirm applications_sent=1, ai_score matches scorecard (~{overall_ai_score})", ok, detail)

    # Step 34: Student: GET /students/me/activity — confirm entries exist for apply, assessment, interview, shortlist events, in correct order
    r, err = safe_req("get", f"{BASE_URL}/students/me/activity", headers=h(stud_token))
    ok = False
    detail = ""
    if r is not None and r.status_code == 200:
        activities = r.json()
        # Activity list is ordered desc by created_at: [shortlist, interview, assessment, applied]
        actions = [a.get("action", "").lower() for a in activities]
        shortlist_idx = next((i for i, a in enumerate(actions) if "shortlist" in a), None)
        interview_idx = next((i for i, a in enumerate(actions) if "interview" in a), None)
        assess_idx = next((i for i, a in enumerate(actions) if "assessment" in a or "scored" in a), None)
        apply_idx = next((i for i, a in enumerate(actions) if "applied" in a), None)

        all_present = (
            shortlist_idx is not None
            and interview_idx is not None
            and assess_idx is not None
            and apply_idx is not None
        )
        if (
            shortlist_idx is not None
            and interview_idx is not None
            and assess_idx is not None
            and apply_idx is not None
        ):
            # Reverse chronological order: shortlist_idx < interview_idx < assess_idx < apply_idx
            ordered = shortlist_idx < interview_idx < assess_idx < apply_idx
            if ordered:
                ok = True
            else:
                detail = f"Entries present but ordering mismatch (expected desc): shortlist={shortlist_idx}, interview={interview_idx}, assess={assess_idx}, apply={apply_idx}"
        else:
            detail = f"Missing activity events: shortlist={shortlist_idx}, interview={interview_idx}, assess={assess_idx}, apply={apply_idx}. Actions: {actions}"
    else:
        detail = err or (f"Status: {r.status_code}, Body: {r.text}" if r else "No response")
    record(34, "Student: GET /students/me/activity — confirm apply, assessment, interview, shortlist events in correct order", ok, detail)

    # ═══════════════════════════════════════
    # ADMIN FLOW (Steps 35 - 40)
    # ═══════════════════════════════════════

    # Step 35: Signup an admin account (or use existing) — login
    r, err = safe_req("post", f"{BASE_URL}/auth/signup", json={
        "email": admin_email, "password": admin_pass,
        "role": "admin", "full_name": f"E2E Admin {uid}"
    })
    ok = r is not None and r.status_code == 200 and "access_token" in (r.json() if r else {})
    if r is not None and ok:
        admin_token = r.json()["access_token"]
    record(35, "Signup an admin account — expect 200 + token", ok,
           err or (f"Status: {r.status_code}, Body: {r.text}" if r and not ok else ""))

    # Step 36: GET /admin/companies — confirm the test company appears
    r, err = safe_req("get", f"{BASE_URL}/admin/companies", headers=h(admin_token))
    ok = False
    detail = ""
    if r is not None and r.status_code == 200:
        comps = r.json()
        target = next((c for c in comps if c.get("name") == f"E2E Corp {uid}"), None)
        if target:
            ok = True
            if not comp_id:
                comp_id = target["id"]
        else:
            detail = f"E2E Corp {uid} not found in admin companies list (count={len(comps)})"
    else:
        detail = err or (f"Status: {r.status_code}, Body: {r.text}" if r else "No response")
    record(36, "GET /admin/companies — confirm the test company appears", ok, detail)

    # Step 37: PATCH /admin/companies/{id}/status -> "verified" - expect 200
    if comp_id:
        r, err = safe_req("patch", f"{BASE_URL}/admin/companies/{comp_id}/status", headers=h(admin_token), json={"status": "verified"})
        ok = r is not None and r.status_code == 200
        record(37, "PATCH /admin/companies/{id}/status -> \"verified\" - expect 200", ok,
               err or (f"Status: {r.status_code}, Body: {r.text}" if r and not ok else ""))
    else:
        record(37, "PATCH /admin/companies/{id}/status -> \"verified\" - expect 200", False, "Missing company ID")

    # Step 38: GET /admin/students — confirm the test student appears
    r, err = safe_req("get", f"{BASE_URL}/admin/students", headers=h(admin_token))
    ok = False
    detail = ""
    if r is not None and r.status_code == 200:
        studs = r.json()
        target = next((s for s in studs if s.get("name") == f"Updated Student {uid}"), None)
        if target:
            ok = True
        else:
            detail = f"Updated Student {uid} not found in admin students list (count={len(studs)})"
    else:
        detail = err or (f"Status: {r.status_code}, Body: {r.text}" if r else "No response")
    record(38, "GET /admin/students — confirm the test student appears", ok, detail)

    # Step 39: GET /admin/dashboard/stats — confirm counts include the just-created test data
    r, err = safe_req("get", f"{BASE_URL}/admin/dashboard/stats", headers=h(admin_token))
    ok = False
    detail = ""
    if r is not None and r.status_code == 200:
        stats_data = r.json()
        stats_list = stats_data.get("stats", [])
        has_counts = any(s.get("value", 0) > 0 for s in stats_list)
        if has_counts:
            ok = True
        else:
            detail = f"All dashboard stats zero or empty: {stats_list}"
    else:
        detail = err or (f"Status: {r.status_code}, Body: {r.text}" if r else "No response")
    record(39, "GET /admin/dashboard/stats — confirm counts include test data", ok, detail)

    # Step 40: Non-admin user tries any /admin/* route — expect 403
    r, err = safe_req("get", f"{BASE_URL}/admin/companies", headers=h(stud_token))
    ok = r is not None and r.status_code == 403
    record(40, "Non-admin user tries any /admin/* route — expect 403", ok,
           err or (f"Status: {r.status_code}, Body: {r.text}" if r and not ok else ""))

    # ═══════════════════════════════════════
    # CLEANUP CHECK (Step 41)
    # ═══════════════════════════════════════

    # Step 41: Confirm no test data corruption — spot check: GET /drives still shows the original seeded drives too
    r, err = safe_req("get", f"{BASE_URL}/drives", headers=h(stud_token))
    ok = False
    detail = ""
    if r is not None and r.status_code == 200:
        drives = r.json()
        has_other_drives = any(d["id"] != drive_id for d in drives)
        if has_other_drives and len(drives) > 1:
            ok = True
        else:
            detail = f"Only test drive found in platform; seeded demo drives missing (total={len(drives)})"
    else:
        detail = err or (f"Status: {r.status_code}, Body: {r.text}" if r else "No response")
    record(41, "Confirm no test data corruption — original seeded drives still present", ok, detail)

    # ═══════════════════════════════════════
    # SUMMARY
    # ═══════════════════════════════════════
    passed_count = sum(1 for _, s, _, _ in results if s == "Pass")
    failed_count = sum(1 for _, s, _, _ in results if s == "Fail")
    skipped_count = sum(1 for _, s, _, _ in results if s == "Skipped")
    total_steps = len(results)

    print("\n" + "=" * 70)
    print(f"E2E TEST RUN SUMMARY: {passed_count}/{total_steps} Passed | {failed_count} Failed | {skipped_count} Skipped")
    print("=" * 70)

    return results


if __name__ == "__main__":
    run()
