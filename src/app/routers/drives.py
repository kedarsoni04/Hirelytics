from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app import models, schemas
from app.database import get_db
from app.routers.auth import get_current_role

router = APIRouter()


class DriveUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    package: Optional[str] = None
    location: Optional[str] = None
    min_cgpa: Optional[float] = None
    eligible_branches: Optional[List[str]] = None
    max_backlogs: Optional[int] = None
    selection_stages: Optional[List[str]] = None
    status: Optional[models.DriveStatus] = None
    deadline: Optional[datetime] = None


@router.post("", response_model=schemas.DriveOut, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=schemas.DriveOut, status_code=status.HTTP_201_CREATED)
def create_drive(
    payload: schemas.DriveCreate,
    current_user: models.User = Depends(get_current_role(models.UserRole.company)),
    db: Session = Depends(get_db),
):
    company = db.query(models.Company).filter(models.Company.user_id == current_user.id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company profile not found")

    drive = models.Drive(
        company_id=company.id,
        title=payload.title,
        description=payload.description,
        package=payload.package,
        location=payload.location,
        min_cgpa=payload.min_cgpa,
        eligible_branches=payload.eligible_branches or [],
        max_backlogs=payload.max_backlogs if payload.max_backlogs is not None else 0,
        selection_stages=payload.selection_stages or ["resume", "assessment", "ai_interview", "hr"],
        status=models.DriveStatus.draft,
        deadline=payload.deadline,
    )
    db.add(drive)
    db.commit()
    db.refresh(drive)
    return drive


@router.get("/company/mine", response_model=List[schemas.DriveOut])
def get_my_drives(
    current_user: models.User = Depends(get_current_role(models.UserRole.company)),
    db: Session = Depends(get_db),
):
    company = db.query(models.Company).filter(models.Company.user_id == current_user.id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company profile not found")

    drives = (
        db.query(models.Drive)
        .filter(models.Drive.company_id == company.id)
        .order_by(models.Drive.created_at.desc())
        .all()
    )
    return drives


@router.get("", response_model=List[schemas.DriveOut])
@router.get("/", response_model=List[schemas.DriveOut])
def get_drives(
    branch: Optional[str] = Query(None, description="Filter by eligible branch"),
    min_cgpa: Optional[float] = Query(None, description="Filter by max required minimum CGPA"),
    db: Session = Depends(get_db),
):
    query = db.query(models.Drive).filter(models.Drive.status == models.DriveStatus.live)

    if min_cgpa is not None:
        query = query.filter(
            (models.Drive.min_cgpa == None) | (models.Drive.min_cgpa <= min_cgpa)  # noqa: E711
        )

    if branch:
        query = query.filter(models.Drive.eligible_branches.contains([branch]))

    drives = query.order_by(models.Drive.created_at.desc()).all()
    return drives


@router.get("/{drive_id}", response_model=schemas.DriveOut)
def get_drive_by_id(drive_id: str, db: Session = Depends(get_db)):
    drive = db.query(models.Drive).filter(models.Drive.id == drive_id).first()
    if not drive:
        raise HTTPException(status_code=404, detail="Drive not found")
    return drive


@router.patch("/{drive_id}", response_model=schemas.DriveOut)
def update_drive(
    drive_id: str,
    payload: DriveUpdate,
    current_user: models.User = Depends(get_current_role(models.UserRole.company)),
    db: Session = Depends(get_db),
):
    company = db.query(models.Company).filter(models.Company.user_id == current_user.id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company profile not found")

    drive = db.query(models.Drive).filter(models.Drive.id == drive_id).first()
    if not drive:
        raise HTTPException(status_code=404, detail="Drive not found")

    if drive.company_id != company.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation not permitted. You can only edit your own drives.",
        )

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(drive, field, value)

    db.commit()
    db.refresh(drive)
    return drive
