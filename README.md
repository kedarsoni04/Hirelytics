# Hirelytics

**AI-powered campus recruitment platform** — automating resume screening, assessment evaluation, and interview analysis so companies can hire faster and students get fairer, data-backed shortlisting.

🔗 **Live Demo:** https://hirelytics-xi.vercel.app
🔗 **API Docs:** https://hirelytics-gsp0.onrender.com/docs

---

## 🚀 Overview

Hirelytics connects **companies** directly with **student applicants**, using real AI to handle the heavy lifting of early-stage recruitment:

- **AI Resume Matching** — Gemini compares extracted resume text against the job description
- **Auto-Graded Assessments** — proctorable MCQ tests, scored instantly
- **AI Video Interviews** — real audio recording → Groq Whisper transcription → Groq Llama 3 sentiment/confidence analysis
- **AI Candidate Scorecard** — a single weighted score combining resume fit, assessment score, and communication quality
- **Real-time Activity Feed & Notifications** — students and companies both get notified as applications progress

Humans still make the final call — AI narrows the pool and surfaces insight; recruiters decide.

---

## 🧩 Modules

| Module | Description |
|---|---|
| **Student** | Applies to drives, builds a resume, uploads a real PDF, takes AI-proctored assessments and AI video interviews, tracks application status, sees a live activity feed |
| **Company** | Posts job drives, views AI-ranked candidates, reviews AI scorecards, manages a Kanban pipeline, views real hiring analytics |
| **Super Admin** | Verifies/suspends companies, flags/suspends students, monitors platform-wide analytics |

---

## 🔄 Full Workflow

1. **Company** registers → posts a job drive (title, package, eligibility, description) → sets it **live**
2. **Student** registers → browses live drives → applies
3. **AI Resume Screening** — Gemini extracts and compares the student's uploaded resume PDF against the job description, returning a match score + reasoning
4. **Company** creates an **Assessment** (MCQ questions) for the drive
5. **Student** takes the assessment → **auto-graded** instantly on submission
6. **Company** schedules an **AI Interview** for the applicant
7. **Student** takes the interview:
   - Questions are read aloud via browser Text-to-Speech
   - Student records answers via the browser microphone (MediaRecorder)
   - Audio is transcribed via **Groq Whisper**
   - Transcript is analyzed for filler words, technical keywords, confidence, and tone via **Groq Llama 3**
8. **Company** generates the **AI Scorecard** — a weighted composite of resume match, assessment score, and communication score, with AI-generated insights
9. Application auto-advances stages based on score thresholds; company can also manually move candidates through a **Kanban pipeline** (Shortlisted → Interview → Offer → Hired)
10. **Student** sees real-time updates: Dashboard stats, Activity Feed, and Notifications reflect every stage change
11. **Admin** monitors and moderates companies/students platform-wide, with real growth analytics

---

## 📄 Pages (29 total — fully wired, zero mock data)

<details>
<summary><strong>Student Module (13 pages)</strong></summary>

Dashboard · Browse Drives · Drive Detail · Application Tracker · Online Assessment · AI Video Interview · Resume Builder · Profile (with resume upload + skills editor) · Notifications · Settings · Progress (readiness score) · Resources · AI Interview Prep

</details>

<details>
<summary><strong>Company Module (11 pages)</strong></summary>

Dashboard · Post a Drive · Candidate List (AI-ranked) · Candidate Detail / AI Scorecard · Interview Scheduler · Pipeline (Kanban) · Analytics (funnel + charts) · Notifications · Settings

</details>

<details>
<summary><strong>Super Admin Module (5 pages)</strong></summary>

Dashboard · Manage Companies · Manage Students · Platform Analytics · Settings / Logs

</details>

---

## 🛠️ Tech Stack

**Frontend**
- Next.js (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- lucide-react (icons) · Recharts (charts) · Framer Motion (micro-interactions)
- Deployed on **Vercel**

**Backend**
- FastAPI (Python)
- SQLAlchemy + PostgreSQL (hosted on **Neon**)
- JWT authentication (`python-jose` + `bcrypt`)
- Deployed on **Render**

**AI / Services**
- **Google Gemini** — resume-to-JD matching, scorecard reasoning
- **Groq (Llama 3)** — interview transcript sentiment/confidence analysis
- **Groq Whisper** — speech-to-text for interview audio
- **Browser SpeechSynthesis API** — reads interview questions aloud (free, no API cost)
- **Cloudinary** — resume PDF storage
- **pdfplumber** — resume text extraction for AI matching

---

## 🎨 Design System

- **Primary:** Indigo `#4F46E5`
- **AI Accent:** Violet `#8B5CF6` / `#EDE9FE` — flags anything AI-generated (scores, badges, insights)
- **Success:** Emerald `#10B981` / `#D1FAE5`
- **Danger:** Rose `#F43F5E` — scoped to destructive actions only
- **Admin Shell:** Slate `#111827` — visually distinguishes the Admin portal
- Shared components: `AppSidebar`, `TopNavbar`, `DataTable`, `ChipInput`, `CheckableCard` — all role-aware and reused across every module

---

## 📂 Project Structure

> ⚠️ **Note:** the FastAPI backend lives *inside* `src/app/` alongside the Next.js
> route folders (not in a separate top-level backend directory). This is an
> unconventional layout — it happened organically during development — but
> it works and is what's deployed. Keep this in mind when running backend
> commands: you `cd src` and run `uvicorn app.main:app`, treating `app/` as
> the Python package.

```
Hirelytics/
├── .env                    # backend secrets (gitignored)
├── .env.local              # frontend env vars (gitignored)
├── .gitignore
├── package.json
└── src/
    └── app/                       # Next.js App Router root — ALSO the FastAPI package root
        ├── (student)/              # Student module routes (Next.js)
        ├── (company)/              # Company module routes (Next.js)
        ├── (admin)/                # Super Admin module routes (Next.js)
        ├── (focus)/                # Distraction-free routes: assessment, interview (Next.js)
        ├── login/ signup/          # Auth pages (Next.js)
        ├── layout.tsx / page.tsx   # Next.js root layout
        ├── main.py                 # FastAPI entrypoint
        ├── models.py                # SQLAlchemy models
        ├── schemas.py                # Pydantic schemas
        ├── database.py               # DB session setup
        ├── routers/
        │   ├── auth.py
        │   ├── students.py
        │   ├── companies.py
        │   ├── drives.py
        │   ├── applications.py
        │   ├── assessments.py
        │   ├── interviews.py
        │   ├── scorecards.py
        │   ├── notifications.py
        │   └── admin.py
        └── services/
            ├── ai_service.py         # Gemini + Groq calls
            └── storage_service.py    # Cloudinary
    ├── components/
    │   ├── ui/               # Shared, reusable UI primitives
    │   ├── layout/            # AppSidebar, TopNavbar
    │   ├── resume/            # Resume builder & preview
    │   ├── interview/         # AI interview UI (camera, recorder)
    │   └── assessment/        # Test screen, timer, question palette
    └── lib/
        ├── api.ts             # Typed API client
        └── auth-context.tsx   # Global auth state
```

---

## ⚙️ Running the Project Locally

### Prerequisites
- Node.js (v18+)
- Python 3.11+
- A free [Neon](https://neon.tech) Postgres database
- API keys: [Google Gemini](https://ai.google.dev), [Groq](https://console.groq.com), [Cloudinary](https://cloudinary.com)

### 1. Clone and install frontend dependencies
```bash
git clone <your-repo-url>
cd Hirelytics
npm install
```

### 2. Install backend dependencies
```bash
cd src/app
python -m pip install -r requirements.txt
cd ../..
```
> `requirements.txt` sits alongside `main.py` in `src/app/`.

### 3. Set up environment variables

Create **`.env`** in the project root (backend config):
```env
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
JWT_SECRET_KEY=<generate with: python -c "import secrets; print(secrets.token_hex(32))">
GEMINI_API_KEY=your_gemini_key
GROQ_API_KEY=your_groq_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
FRONTEND_URL=http://localhost:3000
```

Create **`.env.local`** in the project root (frontend config):
```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

> ⚠️ Both files are gitignored — never commit real secrets.

### 4. Run the backend
```bash
cd src
python -m uvicorn app.main:app --reload
```
Run this from `src/` (not `src/app/`) — `app` is treated as the Python package, so `app.main:app` resolves to `src/app/main.py`.

Backend runs at `http://127.0.0.1:8000` — Swagger docs at `http://127.0.0.1:8000/docs`

> If port 8000 is blocked (common on Windows), use `--port 8080` and update `NEXT_PUBLIC_API_URL` accordingly.

### 5. Run the frontend
In a separate terminal, from the project root:
```bash
npm run dev
```
Frontend runs at `http://localhost:3000`

### 6. Try it out
1. Go to `http://localhost:3000/signup` → create a **Company** account → post a drive → set it **live**
2. Open an incognito window → sign up as a **Student** → browse drives → apply
3. As the company: create an assessment → schedule an interview
4. As the student: take the assessment → take the AI interview (allow microphone access)
5. As the company: generate the AI scorecard → move the candidate through the pipeline

---

## 🚀 Deployment

- **Frontend:** [Vercel](https://vercel.com) → live at `https://hirelytics-xi.vercel.app`
  Set `NEXT_PUBLIC_API_URL` to the Render backend URL in Vercel's Environment Variables.
- **Backend:** [Render](https://render.com) → live at `https://hirelytics-gsp0.onrender.com`
  Set all `.env` variables listed above in Render's Environment tab, plus `FRONTEND_URL` set to `https://hirelytics-xi.vercel.app` (not localhost).
- **Database:** [Neon](https://neon.tech) — free tier Postgres, works out of the box with the connection string in `DATABASE_URL`

---

## 🔒 Security Notes

- JWTs expire after 24 hours; no hardcoded fallback secret — the backend refuses to start without `JWT_SECRET_KEY` set
- CORS is restricted to the actual frontend origin (no wildcard)
- Passwords hashed with `bcrypt`
- Role-based access control enforced on every protected route (`get_current_role` dependency)
- Ownership checks prevent one company from viewing/editing another company's drives or candidates

---

## 📌 Known Limitations / Future Work

- JWT stored in `localStorage` (acceptable for demo; production should migrate to httpOnly cookies)
- No email verification on signup
- Resume PDF text extraction may fail on scanned/image-based PDFs (falls back to skills-based matching)
- No rate limiting on AI API calls yet

---

## 👤 Author

Built by **Kedar Soni** — [kedarsoni.in](https://kedarsoni.in)