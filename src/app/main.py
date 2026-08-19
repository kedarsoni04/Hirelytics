from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import SQLAlchemyError
import os

from app.database import init_db
from app.routers import auth, drives, applications, assessments, interviews, scorecards, students, notifications, companies, admin

app = FastAPI(
    title="Hirelytics Backend",
    description="FastAPI backend for Hirelytics platform",
    version="1.0.0"
)

# CORS setup
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

# Deduplicate origins (FRONTEND_URL may equal the localhost default)
_origins = list(dict.fromkeys([FRONTEND_URL, "http://localhost:3000"]))

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handlers
@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError):
    import traceback
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"message": "An internal database error occurred.", "detail": str(exc)},
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    import traceback
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"message": "An internal server error occurred.", "detail": str(exc)},
    )

# Initialize database tables
@app.on_event("startup")
def startup_event():
    required_keys = ["GEMINI_API_KEY", "GROQ_API_KEY", "CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"]
    missing_keys = [key for key in required_keys if not os.getenv(key)]
    if missing_keys:
        print(f"WARNING: Missing AI/Cloud API keys: {', '.join(missing_keys)}. Some features will degrade gracefully.")
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
app.include_router(companies.router, prefix="/companies", tags=["companies"])
app.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
app.include_router(admin.router, prefix="/admin", tags=["admin"])

@app.get("/")
def read_root():
    return {"message": "Welcome to Hirelytics API"}

