from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import init_db
from app.routers import auth, drives, applications, assessments, interviews, scorecards, students

app = FastAPI(
    title="Hirelytics Backend",
    description="FastAPI backend for Hirelytics platform",
    version="1.0.0"
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database tables
@app.on_event("startup")
def startup_event():
    try:
        init_db()
        print("Database initialized successfully.")
    except Exception as e:
        print(f"Warning: Could not connect to database on startup: {e}")

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(drives.router, prefix="/drives", tags=["drives"])
app.include_router(applications.router, prefix="/applications", tags=["applications"])
app.include_router(assessments.router, prefix="/assessments", tags=["assessments"])
app.include_router(interviews.router, prefix="/interviews", tags=["interviews"])
app.include_router(scorecards.router, prefix="/scorecards", tags=["scorecards"])
app.include_router(students.router, prefix="/students", tags=["students"])

@app.get("/")
def read_root():
    return {"message": "Welcome to Hirelytics API"}

