import requests, json, sys, time

BASE_URL = "http://127.0.0.1:8000"
results = []

def check(label, condition, detail=""):
    status = "PASS" if condition else "FAIL"
    results.append((status, label, detail))
    icon = "OK" if condition else "XX"
    print(f"  [{icon}] {label}" + (f" - {detail}" if detail else ""))
    return condition

def section(title):
    print(f"\n{'='*60}\n  {title}\n{'='*60}")

section("0. HEALTH CHECK")
r = requests.get(f"{BASE_URL}/")
check("Root endpoint 200", r.status_code == 200)
check("Root returns welcome message", "message" in r.json())
r = requests.get(f"{BASE_URL}/docs")
check("OpenAPI docs accessible", r.status_code == 200)

section("1. AUTH ENDPOINTS")
ts = int(time.time())
CEMAIL = f"company_{ts}@gmail.com"
SEMAIL = f"student_{ts}@gmail.com"
AEMAIL = f"admin_{ts}@gmail.com"
PW = "TestPass123"

r = requests.post(f"{BASE_URL}/auth/signup", json={"email": CEMAIL, "password": PW, "role": "company", "company_name": "TechCorp India", "industry": "Technology"})
check("POST /auth/signup (company)", r.status_code == 200, f"status={r.status_code}")
ctok = r.json().get("access_token", "") if r.status_code == 200 else ""
check("Company token received", bool(ctok))
check("Company role in response", r.json().get("role") == "company" if r.status_code == 200 else False)

r = requests.post(f"{BASE_URL}/auth/signup", json={"email": SEMAIL, "password": PW, "role": "student", "full_name": "Rahul Sharma", "college": "IIT Bombay", "branch": "Computer Science", "cgpa": 8.5, "skills": ["Python", "React", "FastAPI", "SQL"]})
check("POST /auth/signup (student)", r.status_code == 200, f"status={r.status_code}")
stok = r.json().get("access_token", "") if r.status_code == 200 else ""
check("Student token received", bool(stok))

r = requests.post(f"{BASE_URL}/auth/signup", json={"email": AEMAIL, "password": PW, "role": "admin", "admin_full_name": "Super Admin"})
check("POST /auth/signup (admin)", r.status_code == 200, f"status={r.status_code}")
atok = r.json().get("access_token", "") if r.status_code == 200 else ""
check("Admin token received", bool(atok))

r = requests.post(f"{BASE_URL}/auth/signup", json={"email": CEMAIL, "password": PW, "role": "company", "company_name": "Dup"})
check("POST /auth/signup duplicate -> 400", r.status_code == 400)

r = requests.post(f"{BASE_URL}/auth/login", json={"email": CEMAIL, "password": PW})
check("POST /auth/login (valid)", r.status_code == 200)
check("Login returns token", "access_token" in r.json())

r = requests.post(f"{BASE_URL}/auth/login", json={"email": CEMAIL, "password": "wrongpass"})
check("POST /auth/login (invalid) -> 401", r.status_code == 401)

CH = {"Authorization": f"Bearer {ctok}"}
SH = {"Authorization": f"Bearer {stok}"}
AH = {"Authorization": f"Bearer {atok}"}

r = requests.get(f"{BASE_URL}/auth/me", headers=CH)
check("GET /auth/me (company)", r.status_code == 200)
check("/me has company_profile", "company_profile" in r.json() if r.status_code == 200 else False)

r = requests.get(f"{BASE_URL}/auth/me", headers=SH)
check("GET /auth/me (student)", r.status_code == 200)
check("/me has student_profile", "student_profile" in r.json() if r.status_code == 200 else False)

r = requests.get(f"{BASE_URL}/auth/me", headers=AH)
check("GET /auth/me (admin)", r.status_code == 200)
check("/me has admin_profile", "admin_profile" in r.json() if r.status_code == 200 else False)

r = requests.get(f"{BASE_URL}/auth/me")
check("GET /auth/me (no token) -> 401/403", r.status_code in [401, 403])

section("2. DRIVES ENDPOINTS")
r = requests.post(f"{BASE_URL}/drives", headers=CH, json={"title": "Software Engineer - Backend", "description": "Python FastAPI PostgreSQL REST APIs cloud deployment. Looking for 2+ years experienced engineers.", "package": "25-35 LPA", "location": "Bangalore", "min_cgpa": 7.0, "eligible_branches": ["Computer Science", "Information Technology"], "max_backlogs": 0, "selection_stages": ["resume", "assessment", "ai_interview", "hr"]})
check("POST /drives (company)", r.status_code == 201, f"status={r.status_code}")
drive = r.json() if r.status_code == 201 else {}
drive_id = drive.get("id", "")
check("Drive ID received", bool(drive_id))
check("Drive status is draft", drive.get("status") == "draft")

r = requests.post(f"{BASE_URL}/drives", headers=SH, json={"title": "Test"})
check("POST /drives (student) -> 403", r.status_code == 403)

r = requests.get(f"{BASE_URL}/drives", headers=SH)
check("GET /drives (live drives list)", r.status_code == 200)
before = len(r.json())

r = requests.get(f"{BASE_URL}/drives/company/mine", headers=CH)
check("GET /drives/company/mine", r.status_code == 200)
check("Mine drives contains created drive", any(d["id"] == drive_id for d in r.json()) if r.status_code == 200 else False)

r = requests.patch(f"{BASE_URL}/drives/{drive_id}", headers=CH, json={"status": "live"})
check("PATCH /drives/{id} (set live)", r.status_code == 200)
check("Drive status now live", r.json().get("status") == "live" if r.status_code == 200 else False)

r = requests.get(f"{BASE_URL}/drives/{drive_id}", headers=SH)
check("GET /drives/{id}", r.status_code == 200)
check("Drive details correct", r.json().get("title") == "Software Engineer - Backend" if r.status_code == 200 else False)

r = requests.get(f"{BASE_URL}/drives", headers=SH)
check("GET /drives lists live drive", len(r.json()) > before if r.status_code == 200 else False)

r = requests.get(f"{BASE_URL}/drives?branch=Computer+Science", headers=SH)
check("GET /drives?branch= filter", r.status_code == 200)

r = requests.get(f"{BASE_URL}/drives/company/analytics", headers=CH)
check("GET /drives/company/analytics", r.status_code == 200)
check("Analytics has funnel data", "funnel" in r.json() if r.status_code == 200 else False)
check("Analytics has total_applicants", "total_applicants" in r.json() if r.status_code == 200 else False)

r = requests.get(f"{BASE_URL}/drives/00000000-0000-0000-0000-000000000000", headers=SH)
check("GET /drives/{bad-id} -> 404", r.status_code == 404)

section("3. APPLICATIONS ENDPOINTS")
r = requests.post(f"{BASE_URL}/applications", headers=SH, json={"drive_id": drive_id})
check("POST /applications (student applies)", r.status_code == 201, f"status={r.status_code}")
app_obj = r.json() if r.status_code == 201 else {}
app_id = app_obj.get("id", "")
check("Application ID received", bool(app_id))
check("Application stage is applied", app_obj.get("current_stage") == "applied")

r = requests.post(f"{BASE_URL}/applications", headers=SH, json={"drive_id": drive_id})
check("POST /applications duplicate -> 400", r.status_code == 400)

r = requests.post(f"{BASE_URL}/applications", headers=CH, json={"drive_id": drive_id})
check("POST /applications (company) -> 403", r.status_code == 403)

r = requests.get(f"{BASE_URL}/applications/mine", headers=SH)
check("GET /applications/mine", r.status_code == 200)
check("Mine contains application", any(a["id"] == app_id for a in r.json()) if r.status_code == 200 else False)

r = requests.get(f"{BASE_URL}/applications/drive/{drive_id}", headers=CH)
check("GET /applications/drive/{id} (company)", r.status_code == 200)
check("Drive applications contains ours", any(a["id"] == app_id for a in r.json()) if r.status_code == 200 else False)

r = requests.get(f"{BASE_URL}/applications/drive/{drive_id}", headers=SH)
check("GET /applications/drive/{id} (student) -> 403", r.status_code == 403)

r = requests.get(f"{BASE_URL}/applications/{app_id}", headers=SH)
check("GET /applications/{id} (student)", r.status_code == 200)

r = requests.patch(f"{BASE_URL}/applications/{app_id}/stage", headers=CH, json={"current_stage": "shortlisted"})
check("PATCH /applications/{id}/stage (shortlist)", r.status_code == 200)
check("Stage updated to shortlisted", r.json().get("current_stage") == "shortlisted" if r.status_code == 200 else False)

requests.patch(f"{BASE_URL}/applications/{app_id}/stage", headers=CH, json={"current_stage": "applied"})

section("4. ASSESSMENTS ENDPOINTS")
aq_payload = {"drive_id": drive_id, "duration_mins": 30, "questions": [{"question": "What is a REST API?", "options": ["A protocol", "An architectural style", "A database", "A server"], "correct_option": 1}, {"question": "Which Python framework is fastest?", "options": ["Django", "Flask", "FastAPI", "Pyramid"], "correct_option": 2}, {"question": "SQL stands for?", "options": ["Structured Query Language", "Simple Query Logic", "Server Query Layer", "Sequential"], "correct_option": 0}, {"question": "CRUD stands for?", "options": ["Create Read Update Delete", "Copy Read Upload Delete", "Create Retrieve Update Drop", "None"], "correct_option": 0}]}
r = requests.post(f"{BASE_URL}/assessments", headers=CH, json=aq_payload)
check("POST /assessments (company creates)", r.status_code == 201, f"status={r.status_code}")
asmt = r.json() if r.status_code == 201 else {}
asmt_id = asmt.get("id", "")
check("Assessment ID received", bool(asmt_id))

r = requests.post(f"{BASE_URL}/assessments", headers=CH, json=aq_payload)
check("POST /assessments duplicate -> 409", r.status_code == 409)

r = requests.get(f"{BASE_URL}/assessments/drive/{drive_id}", headers=SH)
check("GET /assessments/drive/{id} (student)", r.status_code == 200)
sq = r.json().get("questions", [])
has_co = any("correct_option" in q for q in sq)
check("correct_option HIDDEN from student", not has_co, f"visible={has_co}")

r = requests.get(f"{BASE_URL}/assessments/drive/{drive_id}", headers=CH)
check("GET /assessments/drive/{id} (company)", r.status_code == 200)
cq = r.json().get("questions", [])
has_co2 = any("correct_option" in q for q in cq)
check("correct_option VISIBLE to company", has_co2)

r = requests.post(f"{BASE_URL}/assessments/submit", headers=SH, json={"application_id": app_id, "answers": [{"question_id": 0, "selected_option": 1}, {"question_id": 1, "selected_option": 2}, {"question_id": 2, "selected_option": 0}, {"question_id": 3, "selected_option": 1}]})
check("POST /assessments/submit", r.status_code == 201, f"status={r.status_code}")
sub = r.json() if r.status_code == 201 else {}
score = sub.get("score")
check("Auto-graded score returned", score is not None)
check("Score is 75% (3/4 correct)", abs(float(score) - 75.0) < 0.1 if score else False, f"score={score}")

r = requests.post(f"{BASE_URL}/assessments/submit", headers=SH, json={"application_id": app_id, "answers": []})
check("POST /assessments/submit duplicate -> 409", r.status_code == 409)

r = requests.get(f"{BASE_URL}/assessments/submission/{app_id}", headers=SH)
check("GET /assessments/submission/{app_id}", r.status_code == 200)
check("Submission score matches", abs(float(r.json().get("score", 0)) - 75.0) < 0.1 if r.status_code == 200 else False)

section("5. INTERVIEWS + AI (Question Gen & Sentiment)")
print("  [INFO] Company creating interview - AI generates questions via Gemini...")
r = requests.post(f"{BASE_URL}/interviews", headers=CH, json={"application_id": app_id, "questions": []})
check("POST /interviews (AI question generation)", r.status_code == 201, f"status={r.status_code}")
iv = r.json() if r.status_code == 201 else {}
iv_id = iv.get("id", "")
check("Interview ID received", bool(iv_id))
qs = iv.get("questions", [])
check("AI generated >= 6 questions", len(qs) >= 6, f"got {len(qs)} questions")
check("Questions have question field", all("question" in q for q in qs) if qs else False)
check("Questions have category field", all("category" in q for q in qs) if qs else False)
cats = {q.get("category") for q in qs}
check("Has intro + technical categories", "intro" in cats and "technical" in cats, f"cats={cats}")

r = requests.post(f"{BASE_URL}/interviews", headers=CH, json={"application_id": app_id, "questions": []})
check("POST /interviews duplicate -> 409", r.status_code == 409)

r = requests.get(f"{BASE_URL}/interviews/application/{app_id}", headers=SH)
check("GET /interviews/application/{id} (student)", r.status_code == 200)
check("Interview has questions", len(r.json().get("questions", [])) >= 1 if r.status_code == 200 else False)

r = requests.get(f"{BASE_URL}/interviews/company/scheduled", headers=CH)
check("GET /interviews/company/scheduled", r.status_code == 200)
check("Scheduled list has our interview", any(i.get("id") == iv_id for i in r.json()) if r.status_code == 200 else False)

transcript = "Question 1: Walk through resume. Answer: I graduated from IIT Bombay with 8.5 CGPA. Worked on Python FastAPI projects building REST APIs with PostgreSQL database. Also cloud deployment on AWS. Question 2: REST API experience. Answer: I have extensive experience with REST APIs and FastAPI, understanding async programming, dependency injection, and Pydantic schemas. I have built APIs handling thousands of requests. Question 3: Scalable system design. Answer: Microservices architecture with load balancers, Redis caching, Kafka message queue, database sharding. Question 4: Team disagreements. Answer: I believe in open communication and data-driven decisions to find consensus. Question 5: Why this role. Answer: Aligns perfectly with my Python API cloud skills. I am excited about technical challenges. Question 6: Technical depth. Answer: I use algorithm optimizations and cProfile for bottlenecks. For SQL I analyze EXPLAIN plans and add appropriate indexes."

print("  [INFO] Student submitting transcript - Groq AI analyzing sentiment...")
r = requests.post(f"{BASE_URL}/interviews/{iv_id}/submit", headers=SH, json={"transcript": transcript})
check("POST /interviews/{id}/submit", r.status_code == 200, f"status={r.status_code}")
si = r.json() if r.status_code == 200 else {}
sent = si.get("sentiment_data", {})
check("Sentiment data returned", bool(sent))
check("Sentiment has confidence_score", "confidence_score" in sent)
check("Sentiment has technical_score", "technical_score" in sent)
check("Sentiment has tone", "tone" in sent)
check("Sentiment has communication_quality", "communication_quality" in sent)
check("Sentiment has key_strengths", "key_strengths" in sent)
check("Confidence score in 0-100", 0 <= float(sent.get("confidence_score", -1)) <= 100 if sent else False, f"val={sent.get('confidence_score')}")
check("Technical score in 0-100", 0 <= float(sent.get("technical_score", -1)) <= 100 if sent else False, f"val={sent.get('technical_score')}")
print(f"  [AI] confidence={sent.get('confidence_score')}, technical={sent.get('technical_score')}, tone={sent.get('tone')}, quality={sent.get('communication_quality')}")

r = requests.post(f"{BASE_URL}/interviews/{iv_id}/submit", headers=SH, json={"transcript": "test"})
check("POST /interviews/{id}/submit again -> 400", r.status_code == 400)

section("6. SCORECARDS + AI (Full Pipeline)")
print("  [INFO] Generating AI scorecard - Gemini resume match + Groq interview analysis...")
r = requests.post(f"{BASE_URL}/scorecards/generate/{app_id}", headers=CH)
check("POST /scorecards/generate/{app_id}", r.status_code == 201, f"status={r.status_code}")
sc = r.json() if r.status_code == 201 else {}
check("Scorecard ID returned", "id" in sc)
check("resume_match_score present", sc.get("resume_match_score") is not None)
check("assessment_score present", sc.get("assessment_score") is not None)
check("communication_score present", sc.get("communication_score") is not None)
check("technical_interview_score present", sc.get("technical_interview_score") is not None)
check("overall_ai_score present", sc.get("overall_ai_score") is not None)
check("ai_summary present", bool(sc.get("ai_summary")))
check("ai_insights is list", isinstance(sc.get("ai_insights"), list))
check("ai_insights non-empty", len(sc.get("ai_insights", [])) >= 1)
check("Assessment score is 75%", abs(float(sc.get("assessment_score", 0)) - 75.0) < 0.1, f"score={sc.get('assessment_score')}")
check("Overall score in 0-100", 0 <= float(sc.get("overall_ai_score", -1)) <= 100, f"overall={sc.get('overall_ai_score')}")
print(f"\n  [Scorecard] resume={sc.get('resume_match_score')}, assessment={sc.get('assessment_score')}, comms={sc.get('communication_score')}, tech={sc.get('technical_interview_score')}, overall={sc.get('overall_ai_score')}")
print(f"  [Summary]  {sc.get('ai_summary')}")
print(f"  [Insights] {len(sc.get('ai_insights', []))} items")

r2 = requests.post(f"{BASE_URL}/scorecards/generate/{app_id}", headers=CH)
check("POST /scorecards/generate again (idempotent update)", r2.status_code == 201)

r = requests.get(f"{BASE_URL}/scorecards/{app_id}", headers=SH)
check("GET /scorecards/{app_id} (student)", r.status_code == 200)
check("Student sees overall_ai_score", r.json().get("overall_ai_score") is not None if r.status_code == 200 else False)

r = requests.get(f"{BASE_URL}/scorecards/{app_id}", headers=AH)
check("GET /scorecards/{app_id} (admin)", r.status_code == 200)

r = requests.get(f"{BASE_URL}/scorecards/00000000-0000-0000-0000-000000000000", headers=CH)
check("GET /scorecards/{bad-id} -> 404", r.status_code == 404)

section("7. STUDENTS ENDPOINTS")
r = requests.patch(f"{BASE_URL}/students/me", headers=SH, json={"cgpa": 9.0, "skills": ["Python", "React", "FastAPI", "PostgreSQL", "Docker"], "linkedin_url": "https://linkedin.com/in/rahul", "github_url": "https://github.com/rahul"})
check("PATCH /students/me", r.status_code == 200)
check("CGPA updated to 9.0", r.json().get("cgpa") == 9.0 if r.status_code == 200 else False)

r = requests.get(f"{BASE_URL}/students/me/activity", headers=SH)
check("GET /students/me/activity", r.status_code == 200)
check("Activity log is list", isinstance(r.json(), list) if r.status_code == 200 else False)

r = requests.get(f"{BASE_URL}/students/me/stats", headers=SH)
check("GET /students/me/stats", r.status_code == 200)
st = r.json() if r.status_code == 200 else {}
check("Stats has applications_sent", "applications_sent" in st)
check("Stats has shortlisted", "shortlisted" in st)
check("Stats has ai_score", "ai_score" in st)
check("applications_sent >= 1", st.get("applications_sent", 0) >= 1)

r = requests.patch(f"{BASE_URL}/students/me", headers=CH, json={"cgpa": 5.0})
check("PATCH /students/me (company) -> 403", r.status_code == 403)

section("8. COMPANIES ENDPOINTS")
r = requests.get(f"{BASE_URL}/companies/me", headers=CH)
check("GET /companies/me", r.status_code == 200)
check("Company name correct", r.json().get("company_name") == "TechCorp India" if r.status_code == 200 else False)

r = requests.patch(f"{BASE_URL}/companies/me", headers=CH, json={"industry": "FinTech", "company_name": "TechCorp FinTech"})
check("PATCH /companies/me", r.status_code == 200)
check("Industry updated to FinTech", r.json().get("industry") == "FinTech" if r.status_code == 200 else False)

r = requests.get(f"{BASE_URL}/companies/me", headers=SH)
check("GET /companies/me (student) -> 403", r.status_code == 403)

section("9. NOTIFICATIONS ENDPOINTS")
r = requests.get(f"{BASE_URL}/notifications/mine", headers=SH)
check("GET /notifications/mine (student)", r.status_code == 200)
notifs = r.json() if r.status_code == 200 else []
check("Student has notifications", len(notifs) >= 1, f"count={len(notifs)}")
nid = notifs[0]["id"] if notifs else None

r = requests.get(f"{BASE_URL}/notifications/unread-count", headers=SH)
check("GET /notifications/unread-count", r.status_code == 200)
check("Unread count is int", isinstance(r.json().get("count"), int) if r.status_code == 200 else False)

if nid:
    r = requests.patch(f"{BASE_URL}/notifications/{nid}/read", headers=SH)
    check("PATCH /notifications/{id}/read", r.status_code == 200)
    check("Notification marked read", r.json().get("is_read") == True if r.status_code == 200 else False)

r = requests.patch(f"{BASE_URL}/notifications/read-all", headers=SH)
check("PATCH /notifications/read-all", r.status_code == 200)

section("10. ADMIN ENDPOINTS")
r = requests.get(f"{BASE_URL}/admin/dashboard/stats", headers=AH)
check("GET /admin/dashboard/stats", r.status_code == 200)
sd = r.json() if r.status_code == 200 else {}
check("Has stats array", "stats" in sd)
check("Has pendingCompanies", "pendingCompanies" in sd)
check("Has recentActivity", "recentActivity" in sd)
check("Stats has 4 items", len(sd.get("stats", [])) == 4)

r = requests.get(f"{BASE_URL}/admin/analytics", headers=AH)
check("GET /admin/analytics", r.status_code == 200)
check("Has growth data", "growth" in r.json() if r.status_code == 200 else False)
check("Has topCompanies", "topCompanies" in r.json() if r.status_code == 200 else False)

r = requests.get(f"{BASE_URL}/admin/students", headers=AH)
check("GET /admin/students", r.status_code == 200)
check("Students list returned", isinstance(r.json(), list) if r.status_code == 200 else False)
all_students = r.json() if r.status_code == 200 else []
if all_students:
    sid = all_students[0]["id"]
    r2 = requests.patch(f"{BASE_URL}/admin/students/{sid}/status", headers=AH, json={"status": "active"})
    check("PATCH /admin/students/{id}/status", r2.status_code == 200)

r = requests.get(f"{BASE_URL}/admin/companies", headers=AH)
check("GET /admin/companies", r.status_code == 200)
check("Companies list returned", isinstance(r.json(), list) if r.status_code == 200 else False)
all_companies = r.json() if r.status_code == 200 else []
if all_companies:
    cid2 = all_companies[0]["id"]
    r2 = requests.patch(f"{BASE_URL}/admin/companies/{cid2}/status", headers=AH, json={"status": "verified"})
    check("PATCH /admin/companies/{id}/status (verified)", r2.status_code == 200)
    r3 = requests.patch(f"{BASE_URL}/admin/companies/{cid2}/status", headers=AH, json={"status": "bad_status"})
    check("PATCH /admin/companies/{id}/status (invalid) -> 400", r3.status_code == 400)

r = requests.get(f"{BASE_URL}/admin/students", headers=SH)
check("GET /admin/students (student) -> 403", r.status_code == 403)
r = requests.get(f"{BASE_URL}/admin/companies", headers=CH)
check("GET /admin/companies (company) -> 403", r.status_code == 403)

section("FINAL SUMMARY")
total = len(results)
passed = sum(1 for r in results if r[0] == "PASS")
failed = sum(1 for r in results if r[0] == "FAIL")
print(f"\n  Total Tests : {total}")
print(f"  PASSED      : {passed}")
print(f"  FAILED      : {failed}")
print(f"  Pass Rate   : {round(passed/total*100, 1)}%\n")
if failed > 0:
    print("  FAILED TESTS:")
    for status, label, detail in results:
        if status == "FAIL":
            print(f"    XX {label}" + (f" - {detail}" if detail else ""))
    sys.exit(1)
else:
    print("  ALL TESTS PASSED!")
    sys.exit(0)

