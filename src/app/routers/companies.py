from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app import models, schemas
from app.database import get_db
from app.routers.auth import get_current_role

router = APIRouter()


class CompanyProfileUpdate(BaseModel):
    company_name: Optional[str] = None
    industry: Optional[str] = None
    logo_url: Optional[str] = None
    notification_prefs: Optional[Dict[str, Any]] = None


@router.get("/me", response_model=schemas.CompanyOut)
def get_my_company(
    current_user: models.User = Depends(get_current_role(models.UserRole.company)),
    db: Session = Depends(get_db),
):
    company = (
        db.query(models.Company)
        .filter(models.Company.user_id == current_user.id)
        .first()
    )
    if not company:
        raise HTTPException(status_code=404, detail="Company profile not found")
    return company


@router.patch("/me", response_model=schemas.CompanyOut)
def update_my_company(
    data: CompanyProfileUpdate,
    current_user: models.User = Depends(get_current_role(models.UserRole.company)),
    db: Session = Depends(get_db),
):
    company = (
        db.query(models.Company)
        .filter(models.Company.user_id == current_user.id)
        .first()
    )
    if not company:
        raise HTTPException(status_code=404, detail="Company profile not found")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(company, field, value)

    db.commit()
    db.refresh(company)
    return company
