"""
Hirelytics — Full 41-Step End-to-End Test
Hits: https://hirelytics-gsp0.onrender.com (live deployed backend)
"""

import sys
import time
import uuid
import json
import requests

BASE_URL = "https://hirelytics-gsp0.onrender.com"

# ─────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────
results = []
step_num = 0
TIMEOUT = 45  # seconds per request (Render may be cold)


def h(token):
    return {"Authorization": f"Bearer {token}"}


def check(label, passed, detail=""):
    global step_num
    step_num += 1
    status = "PASS" if passed else "FAIL"
    results.append((step_num, status, label, detail))
    icon = "OK" if passed else "XX"
    line = f"  Step {step_num:2d} [{icon}] {label}"
    if not passed and detail:
        # Truncate very long error blobs
        d = str(detail)[:400]
        line += f"\n         ERROR: {d}"
    print(line)
    return passed


def safe_req(method, url, **kwargs):
    """Wrapper that returns (response, error_str). error_str is '' on success."""
    kwargs.setdefault("timeout", TIMEOUT)
    try:
        r = getattr(requests, method)(url, **kwargs)
        return r, ""
    except Exception as e:
        return None, str(e)


# ─────────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────────
def run():
    global step_num
    uid = str(uuid.uuid4())[:8]
    print(f"\n{'='*64}")
    print(f"  HIRELYTICS 41-STEP E2E TEST  |  uid={uid}")
    print(f"  Backend: {BASE_URL}")
    print(f"{'='*64}\n")

    # ── SETUP: unique emails ───────────────────────────────────────
    comp_email  = f"e2e_co_{uid}@corp.io"
    comp_pass   = "TestPass1!"
    stud_email  = f"e2e_st_{uid}@uni.ac.in"
    stud_pass   = "TestPass2@"
    comp2_email = f"e2e_co2_{uid}@rival.io"
    comp2_pass  = "TestPass3#"
    admin_email = f"e2e_admin_{uid}@hirelytics.io"
    admin_pass  = "AdminPass4$"

    comp_token  = stud_token = comp2_token = admin_token = ""
    drive_id = app_id = interview_id = assessment_id = scorecard_app_id = ""
    comp_id = stud_user_id = comp2_id = ""

    print("── AUTH FLOW ──────────────────────────────────────────────")

    # Step 1 — Signup company
    r, err = safe_req("post", f"{BASE_URL}/auth/signup", json={
        "email": comp_email, "password": comp_pass,
        "role": "company", "company_name": f"E2E Corp {uid}"
    })
    ok = r is not None and r.status_code == 200 and "access_token" in (r.json() if r else {})
    if ok:
        comp_token = r.json()["access_token"]
    check("Signup company → 200 + token", ok,
          err or (r.text if r and not ok else ""))

    # Step 2 — Signup student
    r, err = safe_req("post", f"{BASE_URL}/auth/signup", json={
        "email": stud_email, "password": stud_pass,
        "role": "student", "full_name": f"Test Student {uid}"
    })
    ok = r is not None and r.status_code == 200 and "access_token" in (r.json() if r else {})
    if ok:
        stud_token = r.json()["access_token"]
    check("Signup student → 200 + token", ok,
          err or (r.text if r and not ok else ""))

    # Step 3 — Login company correct credentials
    r, err = safe_req("post", f"{BASE_URL}/auth/login", json={
        "email": comp_email, "password": comp_pass
    })
    ok = r is not None and r.status_code == 200 and "access_token" in (r.json() if r else {})
    check("Login company → 200", ok, err or (r.text if r and not ok else ""))

    # Step 4 — Login student correct credentials
    r, err = safe_req("post", f"{BASE_URL}/auth/login", json={
        "email": stud_email, "password": stud_pass
    })
    ok = r is not None and r.status_code == 200 and "access_token" in (r.json() if r else {})
    check("Login student → 200", ok, err or (r.text if r and not ok else ""))

    # Step 5 — Login with wrong password → 401
    r, err = safe_req("post", f"{BASE_URL}/auth/login", json={
        "email": comp_email, "password": "wrongpassword"
    })
    ok = r is not None and r.status_code == 401
    check("Login wrong password → 401", ok,
          err or (f"Got {r.status_code}: {r.text}" if r and not ok else ""))

    # Step 6 — GET /auth/me for both
    r, err = safe_req("get", f"{BASE_URL}/auth/me", headers=h(comp_token))
    ok = r is not None and r.status_code == 200 and r.json().get("role") in ("company", "UserRole.company")
    if ok:
        comp_profile = r.json().get("company_profile", {})
        comp_id = comp_profile.get("id", "")
    check("GET /auth/me company → correct role", ok,
          err or (r.text if r and not ok else ""))

    r, err = safe_req("get", f"{BASE_URL}/auth/me", headers=h(stud_token))
    ok = r is not None and r.status_code == 200 and r.json().get("role") in ("student", "UserRole.student")
    if ok:
        stud_user_id = r.json().get("id", "")
    check("GET /auth/me student → correct role", ok,
          err or (r.text if r and not ok else ""))

    # Step 7 — PATCH /students/me then confirm via GET /auth/me
    patch_data = {"full_name": f"Updated Student {uid}", "skills": ["Python", "FastAPI", "SQL"]}
    r, err = safe_req("patch", f"{BASE_URL}/students/me", headers=h(stud_token), json=patch_data)
    ok = r is not None and r.status_code == 200
    if ok:
        # Confirm persisted
        r2, _ = safe_req("get", f"{BASE_URL}/auth/me", headers=h(stud_token))
        sp = r2.json().get("student_profile", {}) if r2 and r2.status_code == 200 else {}
        ok = sp.get("full_name") == patch_data["full_name"] and sp.get("skills") == patch_data["skills"]
        if not ok:
            check("PATCH /students/me + confirm persisted", False,
                  f"Persisted profile: {sp}")
        else:
            check("PATCH /students/me + confirm persisted", True)
    else:
        check("PATCH /students/me + confirm persisted", False,
              err or (r.text if r else ""))

    print("\n── DRIVE + APPLICATION FLOW ───────────────────────────────")

    # Step 8 — Company POST /drives → 201, status=draft
    r, err = safe_req("post", f"{BASE_URL}/drives", headers=h(comp_token), json={
        "title": f"E2E Backend Engineer {uid}",
        "description": "Python/FastAPI role for E2E testing",
        "package": "20 LPA",
        "location": "Remote",
        "min_cgpa": 7.0,
        "eligible_branches": ["CSE", "IT"],
        "max_backlogs": 1
    })
    ok = r is not None and r.status_code == 201 and r.json().get("status") in ("draft", "DriveStatus.draft")
    if ok:
        drive_id = r.json()["id"]
    check("POST /drives → 201 status=draft", ok,
          err or (r.text if r and not ok else ""))

    # Step 9 — PATCH /drives/{id} status=live → 200
    r, err = safe_req("patch", f"{BASE_URL}/drives/{drive_id}", headers=h(comp_token),
                      json={"status": "live"})
    ok = r is not None and r.status_code == 200 and r.json().get("status") in ("live", "DriveStatus.live")
    check("PATCH /drives/{id} → status=live", ok,
          err or (r.text if r and not ok else ""))

    # Step 10 — Student GET /drives → new drive appears
    r, err = safe_req("get", f"{BASE_URL}/drives", headers=h(stud_token))
    ok = r is not None and r.status_code == 200 and any(d["id"] == drive_id for d in r.json())
    check("GET /drives student → new drive appears", ok,
          err or (f"drive_id={drive_id} not found in list" if r and not ok else ""))

    # Step 11 — Student POST /applications → 201
    r, err = safe_req("post", f"{BASE_URL}/applications", headers=h(stud_token),
                      json={"drive_id": drive_id})
    ok = r is not None and r.status_code == 201
    if ok:
        app_id = r.json()["id"]
    check("POST /applications → 201", ok,
          err or (r.text if r and not ok else ""))

    # Step 12 — Duplicate application → 400
    r, err = safe_req("post", f"{BASE_URL}/applications", headers=h(stud_token),
                      json={"drive_id": drive_id})
    ok = r is not None and r.status_code == 400 and "already" in r.json().get("detail", "").lower()
    check("Duplicate POST /applications → 400 'already applied'", ok,
          err or (f"Got {r.status_code}: {r.text}" if r and not ok else ""))

    # Step 13 — Company GET /applications/drive/{driveId} → student appears with profile
    r, err = safe_req("get", f"{BASE_URL}/applications/drive/{drive_id}", headers=h(comp_token))
    ok = r is not None and r.status_code == 200
    if ok:
        apps = r.json()
        found = any(a.get("student", {}).get("full_name", "").startswith("Updated Student") for a in apps)
        ok = found
        check("GET /applications/drive/{id} → student with profile", ok,
              "Student not found in list" if not ok else "")
    else:
        check("GET /applications/drive/{id} → student with profile", False,
              err or r.text)

    # Step 14 — Second company → 403 on first company's drive
    r2_signup, _ = safe_req("post", f"{BASE_URL}/auth/signup", json={
        "email": comp2_email, "password": comp2_pass,
        "role": "company", "company_name": f"Rival Corp {uid}"
    })
    if r2_signup and r2_signup.status_code == 200:
        comp2_token = r2_signup.json()["access_token"]
        r, err = safe_req("get", f"{BASE_URL}/applications/drive/{drive_id}", headers=h(comp2_token))
        ok = r is not None and r.status_code == 403
        check("Other company GET /applications/drive/{id} → 403", ok,
              err or (f"Got {r.status_code}: {r.text}" if r and not ok else ""))
    else:
        check("Other company GET /applications/drive/{id} → 403", False,
              "Could not signup second company")

    print("\n── ASSESSMENT FLOW ────────────────────────────────────────")

    # Step 15 — Company POST /assessments (3 MCQs) → 201
    # correct_option is an INTEGER index into the options list (per AssessmentQuestion schema)
    mcq_questions = [
        {"question": "What does HTTP stand for?",
         "options": ["HyperText Transfer Protocol", "High Transfer Text Protocol",
                     "HyperText Transit Protocol", "Home Transfer Text Protocol"],
         "correct_option": 0},   # index 0 = "HyperText Transfer Protocol"
        {"question": "Which Python keyword defines a function?",
         "options": ["func", "def", "fn", "define"],
         "correct_option": 1},   # index 1 = "def"
        {"question": "What is the time complexity of binary search?",
         "options": ["O(n)", "O(n^2)", "O(log n)", "O(1)"],
         "correct_option": 2},   # index 2 = "O(log n)"
    ]
    r, err = safe_req("post", f"{BASE_URL}/assessments", headers=h(comp_token), json={
        "drive_id": drive_id,
        "questions": mcq_questions,
        "duration_mins": 30
    })
    ok = r is not None and r.status_code == 201
    if ok:
        assessment_id = r.json()["id"]
    check("POST /assessments (3 MCQs) → 201", ok,
          err or (f"HTTP {r.status_code}: {r.text}" if r and not ok else ""))

    # Step 16 — Student GET /assessments/drive/{driveId} → correct_option hidden
    r, err = safe_req("get", f"{BASE_URL}/assessments/drive/{drive_id}", headers=h(stud_token))
    ok = r is not None and r.status_code == 200
    if ok:
        qs = r.json().get("questions", [])
        has_correct = any("correct_option" in q for q in qs)
        ok = not has_correct
        check("GET /assessments/drive → correct_option HIDDEN for student", ok,
              "correct_option found in student response!" if not ok else "")
    else:
        check("GET /assessments/drive → correct_option HIDDEN for student", False,
              err or r.text)

    # Step 17 — Student POST /assessments/submit → auto-graded
    # Q0: select index 0 (correct), Q1: select index 1 (correct), Q2: select index 0 (wrong, correct=2) → 2/3 = 66.67%
    answers = [
        {"question_id": 0, "selected_option": 0},  # correct (index 0)
        {"question_id": 1, "selected_option": 1},  # correct (index 1)
        {"question_id": 2, "selected_option": 0},  # wrong (correct is index 2)
    ]
    r, err = safe_req("post", f"{BASE_URL}/assessments/submit", headers=h(stud_token), json={
        "application_id": app_id,
        "answers": answers,
        "proctor_flags": []
    })
    ok = r is not None and r.status_code == 201
    if ok:
        submitted_score = r.json().get("score")
        expected_score = (2 / 3) * 100
        score_correct = submitted_score is not None and abs(float(submitted_score) - expected_score) < 0.1
        ok = score_correct
        check(f"POST /assessments/submit → 201 + correct score ({expected_score:.2f}%)", ok,
              f"Got score={submitted_score}" if not ok else "")
    else:
        check("POST /assessments/submit → 201 + correct score", False,
              err or (r.text if r else ""))

    # Step 18 — Company GET /assessments/submission/{applicationId} → score visible
    r, err = safe_req("get", f"{BASE_URL}/assessments/submission/{app_id}", headers=h(comp_token))
    ok = r is not None and r.status_code == 200 and r.json().get("score") is not None
    check("GET /assessments/submission/{appId} → score visible to company", ok,
          err or (r.text if r and not ok else ""))

    print("\n── INTERVIEW FLOW ─────────────────────────────────────────")

    # Step 19 — Company POST /interviews (no custom questions) → 201, 6 questions with category tags
    r, err = safe_req("post", f"{BASE_URL}/interviews", headers=h(comp_token), json={
        "application_id": app_id
    })
    ok = r is not None and r.status_code == 201
    if ok:
        interview_id = r.json()["id"]
        qs = r.json().get("questions", [])
        expected_categories = {"intro", "technical", "problem_solving", "soft_skill", "closing"}
        found_cats = {q.get("category", "").lower() for q in qs if isinstance(q, dict)}
        cat_ok = len(qs) == 6 and len(found_cats.intersection(expected_categories)) >= 4
        ok = cat_ok
        check(f"POST /interviews → 201 + 6 Qs with categories (got {len(qs)}, cats={found_cats})",
              ok, f"Expected 6 Qs with category tags, got {len(qs)} Qs, cats={found_cats}" if not ok else "")
    else:
        check("POST /interviews → 201 + 6 questions with categories", False,
              err or (r.text if r else ""))

    # Step 20 — Student GET /interviews/application/{applicationId} → 6 questions
    r, err = safe_req("get", f"{BASE_URL}/interviews/application/{app_id}", headers=h(stud_token))
    ok = r is not None and r.status_code == 200 and len(r.json().get("questions", [])) == 6
    check("GET /interviews/application/{id} → 6 questions returned", ok,
          err or (f"Got {len(r.json().get('questions',[]))} questions" if r and not ok else ""))

    # Step 21 — Transcribe — SKIP (no real audio file in test context)
    results.append((step_num + 1, "SKIP", "POST /interviews/transcribe (real audio)", "No audio file available in automated test context"))
    step_num += 1
    print(f"  Step {step_num:2d} [~] POST /interviews/transcribe — SKIPPED (no audio file)")

    # Step 22 — Student POST /interviews/{id}/submit with realistic transcript
    transcript = (
        "Um, so I have been working with Python for about three years. "
        "I am, uh, very familiar with FastAPI and SQLAlchemy. "
        "I built RESTful APIs and microservices. "
        "I think, um, asynchronous programming with asyncio is quite powerful. "
        "I have deployed to Docker containers and used PostgreSQL extensively. "
        "Problem solving is important — I use data structures like trees and graphs. "
        "I am confident in my technical skills and enjoy teamwork. "
        "Machine learning with scikit-learn is something I explored as well."
    )
    r, err = safe_req("post", f"{BASE_URL}/interviews/{interview_id}/submit",
                      headers=h(stud_token), json={"transcript": transcript})
    ok = r is not None and r.status_code == 200
    if ok:
        sentiment = r.json().get("sentiment_data", {})
        filler_ok = "filler_word_count" in sentiment and isinstance(sentiment["filler_word_count"], (int, float))
        kw_ok = "keyword_matches" in sentiment
        conf_ok = "confidence_score" in sentiment and sentiment["confidence_score"] is not None
        tone_ok = "tone" in sentiment and sentiment["tone"] is not None
        all_ok = filler_ok and kw_ok and conf_ok and tone_ok
        missing = [k for k, v in [("filler_word_count", filler_ok), ("keyword_matches", kw_ok),
                                   ("confidence_score", conf_ok), ("tone", tone_ok)] if not v]
        check("POST /interviews/{id}/submit → filler/keywords/confidence/tone computed",
              all_ok, f"Missing fields: {missing}; sentiment={sentiment}" if not all_ok else "")
    else:
        check("POST /interviews/{id}/submit → sentiment data computed", False,
              err or (r.text if r else ""))

    print("\n── SCORECARD FLOW ─────────────────────────────────────────")

    # Step 23 — Company POST /scorecards/generate/{applicationId} → 201
    r, err = safe_req("post", f"{BASE_URL}/scorecards/generate/{app_id}", headers=h(comp_token))
    ok = r is not None and r.status_code == 201
    overall_ai_score = None
    if ok:
        sc = r.json()
        scorecard_app_id = app_id
        cats = {
            "resume_match_score": sc.get("resume_match_score"),
            "assessment_score": sc.get("assessment_score"),
            "communication_score": sc.get("communication_score"),
            "overall_ai_score": sc.get("overall_ai_score"),
        }
        all_present = all(v is not None for v in cats.values())
        scores = [float(v) for v in cats.values() if v is not None]
        not_identical = len(set(round(s, 1) for s in scores)) > 1 if len(scores) >= 3 else True
        ok = all_present and not_identical
        overall_ai_score = sc.get("overall_ai_score")
        check("POST /scorecards/generate → 201 + 4 unique category scores",
              ok, f"Scores: {cats}" if not ok else "")
    else:
        check("POST /scorecards/generate → 201 + 4 unique category scores", False,
              err or (r.text if r else ""))

    # Step 24 — Verify overall_ai_score is plausible weighted average
    if overall_ai_score is not None:
        r2, _ = safe_req("get", f"{BASE_URL}/scorecards/{app_id}", headers=h(comp_token))
        if r2 and r2.status_code == 200:
            sc = r2.json()
            overall = float(sc.get("overall_ai_score", -1) or -1)
            ok = 0 <= overall <= 100
            check(f"overall_ai_score={overall:.1f} is plausible weighted avg (0–100)", ok,
                  f"overall_ai_score out of range: {overall}" if not ok else "")
        else:
            check("overall_ai_score is plausible weighted average", False,
                  "Could not fetch scorecard for verification")
    else:
        check("overall_ai_score is plausible weighted average", False,
              "overall_ai_score was None from generate step")

    # Step 25 — Generate scorecard for application missing assessment/interview → 400
    r_fresh_stud, _ = safe_req("post", f"{BASE_URL}/auth/signup", json={
        "email": f"e2e_fresh_{uid}@uni.io", "password": "Fresh123!",
        "role": "student", "full_name": f"Fresh Student {uid}"
    })
    fresh_stud_token = r_fresh_stud.json().get("access_token") if r_fresh_stud and r_fresh_stud.status_code == 200 else None
    if fresh_stud_token:
        r_app2, _ = safe_req("post", f"{BASE_URL}/applications", headers=h(fresh_stud_token),
                              json={"drive_id": drive_id})
        if r_app2 and r_app2.status_code == 201:
            fresh_app_id = r_app2.json()["id"]
            r, err = safe_req("post", f"{BASE_URL}/scorecards/generate/{fresh_app_id}", headers=h(comp_token))
            ok = r is not None and r.status_code == 400
            check("Scorecard generate without assessment/interview → 400", ok,
                  err or (f"Got {r.status_code}: {r.text}" if r and not ok else ""))
        else:
            check("Scorecard generate without assessment/interview → 400", False,
                  "Could not create fresh application for test")
    else:
        check("Scorecard generate without assessment/interview → 400", False,
              "Could not signup fresh student for test")

    # Step 26 — Student GET /scorecards/{applicationId} → 200
    r, err = safe_req("get", f"{BASE_URL}/scorecards/{app_id}", headers=h(stud_token))
    ok = r is not None and r.status_code == 200
    check("Student GET /scorecards/{appId} → 200", ok,
          err or (r.text if r and not ok else ""))

    # Step 27 — Different company GET /scorecards/{applicationId} → 403
    r, err = safe_req("get", f"{BASE_URL}/scorecards/{app_id}", headers=h(comp2_token))
    ok = r is not None and r.status_code == 403
    check("Different company GET /scorecards/{appId} → 403", ok,
          err or (f"Got {r.status_code}: {r.text}" if r and not ok else ""))

    print("\n── PIPELINE + NOTIFICATIONS ───────────────────────────────")

    # Step 28 — PATCH /applications/{id}/stage → shortlisted
    r, err = safe_req("patch", f"{BASE_URL}/applications/{app_id}/stage",
                      headers=h(comp_token), json={"current_stage": "shortlisted"})
    ok = r is not None and r.status_code == 200
    check("PATCH /applications/{id}/stage → shortlisted", ok,
          err or (r.text if r and not ok else ""))

    # Step 29 — Student GET /notifications/mine → shortlisted notification exists
    r, err = safe_req("get", f"{BASE_URL}/notifications/mine", headers=h(stud_token))
    ok = r is not None and r.status_code == 200
    if ok:
        notifs = r.json()
        shortlisted_notif = any(
            "shortlist" in (n.get("message", "") + n.get("type", "")).lower()
            for n in notifs
        )
        ok = shortlisted_notif
        check("Student GET /notifications/mine → shortlisted notification", ok,
              f"No shortlist notification found in {[n.get('message') for n in notifs[:5]]}" if not ok else "")
    else:
        check("Student GET /notifications/mine → shortlisted notification", False,
              err or r.text)

    # Step 30 — Company GET /notifications/mine → assessment + interview completion events
    r, err = safe_req("get", f"{BASE_URL}/notifications/mine", headers=h(comp_token))
    ok = r is not None and r.status_code == 200
    if ok:
        notifs = r.json()
        has_assessment = any("assessment" in n.get("message", "").lower() for n in notifs)
        has_interview = any("interview" in n.get("message", "").lower() for n in notifs)
        ok = has_assessment and has_interview
        check("Company GET /notifications/mine → assessment + interview events", ok,
              f"has_assessment={has_assessment}, has_interview={has_interview}; messages={[n.get('message') for n in notifs[:6]]}" if not ok else "")
    else:
        check("Company GET /notifications/mine → assessment + interview events", False,
              err or r.text)

    # Step 31 — GET /notifications/unread-count for both → accurate
    rs, _ = safe_req("get", f"{BASE_URL}/notifications/unread-count", headers=h(stud_token))
    rc, _ = safe_req("get", f"{BASE_URL}/notifications/unread-count", headers=h(comp_token))
    ok = (rs is not None and rs.status_code == 200 and "count" in rs.json() and
          rc is not None and rc.status_code == 200 and "count" in rc.json())
    stud_unread = rs.json().get("count", -1) if rs and rs.status_code == 200 else -1
    comp_unread = rc.json().get("count", -1) if rc and rc.status_code == 200 else -1
    check(f"GET /notifications/unread-count → stud={stud_unread}, comp={comp_unread}", ok,
          "Failed to get unread counts" if not ok else "")

    # Step 32 — PATCH /notifications/read-all for student → unread-count drops to 0
    r, err = safe_req("patch", f"{BASE_URL}/notifications/read-all", headers=h(stud_token))
    ok = r is not None and r.status_code == 200
    if ok:
        r2, _ = safe_req("get", f"{BASE_URL}/notifications/unread-count", headers=h(stud_token))
        new_count = r2.json().get("count", -1) if r2 and r2.status_code == 200 else -1
        ok = new_count == 0
        check("PATCH /notifications/read-all → unread-count drops to 0", ok,
              f"Count after read-all = {new_count}" if not ok else "")
    else:
        check("PATCH /notifications/read-all → unread-count drops to 0", False,
              err or r.text)

    print("\n── STUDENT STATS ──────────────────────────────────────────")

    # Step 33 — GET /students/me/stats → applications_sent=1, ai_score matches scorecard
    r, err = safe_req("get", f"{BASE_URL}/students/me/stats", headers=h(stud_token))
    ok = r is not None and r.status_code == 200
    if ok:
        stats = r.json()
        apps_sent_ok = stats.get("applications_sent") == 1
        ai_score_val = stats.get("ai_score")
        ai_score_ok = ai_score_val is not None
        if overall_ai_score is not None and ai_score_ok:
            ai_score_matches = abs(float(ai_score_val) - float(overall_ai_score)) <= 1
        else:
            ai_score_matches = ai_score_ok
        ok = apps_sent_ok and ai_score_matches
        check(f"GET /students/me/stats → apps_sent=1, ai_score≈{overall_ai_score}", ok,
              f"applications_sent={stats.get('applications_sent')}, ai_score={ai_score_val}, expected_ai≈{overall_ai_score}" if not ok else "")
    else:
        check("GET /students/me/stats → applications_sent=1, ai_score", False,
              err or r.text)

    # Step 34 — GET /students/me/activity → entries for apply, assessment, interview, shortlist
    r, err = safe_req("get", f"{BASE_URL}/students/me/activity", headers=h(stud_token))
    ok = r is not None and r.status_code == 200
    if ok:
        acts = r.json()
        actions = " ".join(a.get("action", "").lower() for a in acts)
        has_apply = "applied" in actions
        has_assess = "assessment" in actions or "scored" in actions
        has_interview = "interview" in actions
        has_shortlist = "shortlist" in actions
        ok = has_apply and has_assess and has_interview and has_shortlist
        check("GET /students/me/activity → apply/assessment/interview/shortlist events",
              ok, f"has_apply={has_apply}, has_assess={has_assess}, has_interview={has_interview}, has_shortlist={has_shortlist}" if not ok else "")
    else:
        check("GET /students/me/activity → activity entries exist", False,
              err or r.text)

    print("\n── ADMIN FLOW ─────────────────────────────────────────────")

    # Step 35 — Signup admin → login
    r, err = safe_req("post", f"{BASE_URL}/auth/signup", json={
        "email": admin_email, "password": admin_pass,
        "role": "admin", "full_name": f"E2E Admin {uid}"
    })
    ok = r is not None and r.status_code == 200
    if ok:
        admin_token = r.json()["access_token"]
    check("Signup admin → 200 + token", ok,
          err or (r.text if r and not ok else ""))

    # Step 36 — GET /admin/companies → test company appears
    r, err = safe_req("get", f"{BASE_URL}/admin/companies", headers=h(admin_token))
    ok = r is not None and r.status_code == 200
    if ok:
        companies = r.json()
        # Also try to find comp_id from admin list if not already found
        if not comp_id:
            for c in companies:
                if c.get("name") == f"E2E Corp {uid}":
                    comp_id = c["id"]
                    break
        found = any(f"E2E Corp {uid}" == c.get("name", "") for c in companies)
        ok = found
        check("GET /admin/companies → test company appears", ok,
              f"E2E Corp {uid} not found in {[c.get('name') for c in companies[:5]]}" if not ok else "")
    else:
        check("GET /admin/companies → test company appears", False,
              err or r.text)

    # Step 37 — PATCH /admin/companies/{id}/status → verified
    if comp_id:
        r, err = safe_req("patch", f"{BASE_URL}/admin/companies/{comp_id}/status",
                          headers=h(admin_token), json={"status": "verified"})
        ok = r is not None and r.status_code == 200
        check("PATCH /admin/companies/{id}/status → verified", ok,
              err or (r.text if r and not ok else ""))
    else:
        check("PATCH /admin/companies/{id}/status → verified", False,
              "Could not determine company ID")

    # Step 38 — GET /admin/students → test student appears
    r, err = safe_req("get", f"{BASE_URL}/admin/students", headers=h(admin_token))
    ok = r is not None and r.status_code == 200
    if ok:
        students = r.json()
        found = any(f"Updated Student {uid}" == s.get("name", "") for s in students)
        ok = found
        check("GET /admin/students → test student appears", ok,
              f"Updated Student {uid} not found in {[s.get('name') for s in students[:5]]}" if not ok else "")
    else:
        check("GET /admin/students → test student appears", False,
              err or r.text)

    # Step 39 — GET /admin/dashboard/stats → counts include test data
    r, err = safe_req("get", f"{BASE_URL}/admin/dashboard/stats", headers=h(admin_token))
    ok = r is not None and r.status_code == 200
    if ok:
        stats_data = r.json()
        stats_list = stats_data.get("stats", [])
        has_data = any(s.get("value", 0) > 0 for s in stats_list)
        ok = has_data
        check("GET /admin/dashboard/stats → counts include test data", ok,
              f"All stats zero or missing: {stats_list}" if not ok else "")
    else:
        check("GET /admin/dashboard/stats → counts include test data", False,
              err or r.text)

    # Step 40 — Non-admin user tries /admin/* → 403
    r, err = safe_req("get", f"{BASE_URL}/admin/companies", headers=h(stud_token))
    ok = r is not None and r.status_code == 403
    check("Non-admin user GET /admin/companies → 403", ok,
          err or (f"Got {r.status_code}: {r.text}" if r and not ok else ""))

    print("\n── CLEANUP CHECK ──────────────────────────────────────────")

    # Step 41 — GET /drives still shows seeded drives beyond just the test drive
    r, err = safe_req("get", f"{BASE_URL}/drives", headers=h(stud_token))
    ok = r is not None and r.status_code == 200
    if ok:
        all_drives = r.json()
        has_other_drives = any(d["id"] != drive_id for d in all_drives)
        ok = has_other_drives
        check(f"GET /drives → seeded drives still present (total={len(all_drives)})", ok,
              "Only the test drive found; seeded data may be missing" if not ok else "")
    else:
        check("GET /drives → seeded drives still present", False,
              err or r.text)

    # ─────────────────────────────────────────────────────────────
    # Summary
    # ─────────────────────────────────────────────────────────────
    print(f"\n{'='*64}")
    passed = sum(1 for _, s, _, _ in results if s == "PASS")
    failed = sum(1 for _, s, _, _ in results if s == "FAIL")
    skipped = sum(1 for _, s, _, _ in results if s == "SKIP")
    total_run = passed + failed

    print(f"  RESULT: {passed}/{total_run} passed  |  {failed} failed  |  {skipped} skipped")
    print(f"{'='*64}")

    if failed > 0:
        print("\n── FAILURES DETAIL ────────────────────────────────────────")
        for n, s, label, detail in results:
            if s == "FAIL":
                print(f"  Step {n:2d} FAIL: {label}")
                if detail:
                    print(f"           {detail}")

    if skipped > 0:
        print("\n── SKIPPED ────────────────────────────────────────────────")
        for n, s, label, detail in results:
            if s == "SKIP":
                print(f"  Step {n:2d} SKIP: {label}")
                if detail:
                    print(f"           {detail}")

    print()


if __name__ == "__main__":
    run()
