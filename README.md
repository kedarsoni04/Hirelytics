# Hirelytics

**AI-powered campus recruitment platform** — automating resume screening, assessment evaluation, and interview analysis so companies can hire faster and students get fairer, data-backed shortlisting.

> Built as a college placement-drive project. Frontend-first prototype with mock data; AI/backend logic to be wired in.

---

## 🚀 Overview

Hirelytics connects **companies** directly with **student applicants**, using AI to handle the heavy lifting of early-stage recruitment:

- **AI Resume Screening** — scores and ranks candidates against job descriptions
- **AI Online Assessment** — proctored, auto-graded aptitude/domain tests
- **AI Video Interview Analysis** — evaluates speech, confidence, sentiment, and keyword relevance
- **AI Candidate Scorecard** — a single view combining resume fit %, test score, and communication score for recruiters

Humans still make the final call — AI narrows the pool and surfaces insight, recruiters decide.

---

## 🧩 Modules

| Module | Description |
|---|---|
| **Student / Interviewee** | Applies to drives, builds resume, takes AI-proctored assessments and AI video interviews, tracks application status |
| **Company / Recruiter** | Posts job drives, views AI-ranked candidates, reviews AI scorecards, manages pipeline & offers |
| **Super Admin** | Onboards and manages companies & students, monitors platform-wide analytics and system logs |

---

## 📄 Pages (29 total)

<details>
<summary><strong>Student Module (13 pages)</strong></summary>

- Landing / Login / Signup
- Dashboard
- Browse Drives
- Job/Drive Detail
- Application Tracker
- Online Assessment (proctored test screen)
- AI Video Interview
- Resume Builder
- Profile
- Notifications
- Settings

</details>

<details>
<summary><strong>Company Module (11 pages)</strong></summary>

- Login / Signup
- Dashboard
- Post a Drive / JD
- Candidate List (AI-ranked)
- Candidate Detail / AI Scorecard
- Interview Scheduler
- Shortlist / Offer Management (Kanban pipeline)
- Analytics / Reports
- Notifications
- Settings

</details>

<details>
<summary><strong>Super Admin Module (5 pages)</strong></summary>

- Dashboard
- Manage Companies
- Manage Students
- Platform Analytics
- Settings / Logs

</details>

---

## 🔄 Workflow

1. Company registers → posts a job drive with eligibility criteria (CGPA, branch, skills)
2. Student applies → uploads resume
3. **AI screens the resume** → auto-scores and ranks against the JD
4. **AI proctors an online assessment** (aptitude / domain MCQs, auto-graded)
5. **AI conducts a video interview** → analyzes speech-to-text, confidence, sentiment, keyword relevance
6. AI generates a **Candidate Scorecard** (resume fit %, test score, communication score, overall rating)
7. Company reviews AI-ranked candidates → shortlists for a final human interview
8. Interview scheduled → offer extended → student notified
9. Analytics dashboard tracks hiring funnel and platform-wide placement stats

---

## 🛠️ Tech Stack

- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **Icons:** lucide-react
- **Charts:** Recharts
- **Animation:** Framer Motion (subtle micro-interactions only)

> Current build is **frontend-only** — all data is mocked (`mock-data.ts`). No backend, auth, or real AI inference is connected yet.

---

## 🎨 Design System

- **Primary:** Indigo `#4F46E5`
- **AI Accent:** Violet `#8B5CF6` / `#EDE9FE` — used to visually flag anything AI-generated (scores, badges, insights)
- **Success:** Emerald `#10B981` / `#D1FAE5`
- **Danger:** Rose `#F43F5E` — scoped strictly to destructive actions (e.g. Delete Account)
- **Admin Shell:** Slate `#111827` — distinguishes the Super Admin portal from Student/Company views
- Rounded-xl cards, soft shadows, consistent 8px spacing scale, single typography scale

Shared components: `AppSidebar`, `TopNavbar`, `DataTable`, `ChipInput`, `CheckableCard` — all role-aware (`student` / `company` / `admin`) and reused across every module.

---

## 📂 Project Structure

```
src/
├── app/
│   ├── (student)/       # Student module routes
│   ├── (company)/       # Company module routes
│   └── (admin)/         # Super Admin module routes
├── components/
│   ├── ui/               # Shared, reusable UI primitives
│   ├── layout/            # AppSidebar, TopNavbar
│   ├── resume/            # Resume builder & preview
│   ├── interview/         # AI interview UI (camera, controls)
│   ├── assessment/        # Test screen, timer, question palette
│   └── design-system/     # Color palette & component showcase
└── lib/
    └── mock-data.ts       # All mock/dummy data
```

---

## 🧠 What's Mocked vs Real

| Feature | Status |
|---|---|
| UI/UX for all 3 modules | ✅ Fully built |
| Navigation & routing | ✅ Working |
| Resume/AI scoring, sentiment analysis | 🔶 Mocked (static UI states) |
| Assessment proctoring (face/tab detection) | 🔶 UI only |
| Authentication | ⬜ Not implemented |
| Backend / database | ⬜ Not implemented |
| Real AI model integration | ⬜ Not implemented |

---

## 📌 Next Steps

- [ ] Connect a backend (Node.js/Express or similar) + database
- [ ] Add authentication (student / company / admin roles)
- [ ] Integrate resume parsing & JD-matching (NLP)
- [ ] Integrate real assessment auto-grading engine
- [ ] Integrate AI interview analysis (speech-to-text + sentiment scoring)
- [ ] Add real proctoring (face detection, tab-switch tracking)

---

## 👤 Author

Built by **Kedar Soni** — [kedarsoni.in](https://kedarsoni.in)