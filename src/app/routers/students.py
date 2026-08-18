from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app import models, schemas
from app.database import get_db
from app.routers.auth import get_current_role

router = APIRouter()


# ── Partial-update schema ─────────────────────────────────────────────────────

class StudentProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    college: Optional[str] = None
    branch: Optional[str] = None
    cgpa: Optional[float] = None
    skills: Optional[List[str]] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None


# ── Routes ────────────────────────────────────────────────────────────────────

@router.patch("/me", response_model=schemas.StudentOut)
def update_my_profile(
    data: StudentProfileUpdate,
    current_user: models.User = Depends(get_current_role("student")),
    db: Session = Depends(get_db),
):
    student = (
        db.query(models.Student)
        .filter(models.Student.user_id == current_user.id)
        .first()
    )
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")

    # Apply only the fields that were explicitly provided (exclude_unset)
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(student, field, value)

    db.commit()
    db.refresh(student)
    return student
