from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app import models, schemas
from app.database import get_db
from app.routers.auth import get_current_role, get_current_user

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


@router.get("/company/analytics")
def get_company_analytics(
    current_user: models.User = Depends(get_current_role(models.UserRole.company)),
    db: Session = Depends(get_db),
):
    company = db.query(models.Company).filter(models.Company.user_id == current_user.id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company profile not found")

    drives = db.query(models.Drive).filter(models.Drive.company_id == company.id).all()
    total_drives = len(drives)
    drive_ids = [d.id for d in drives]

    if not drive_ids:
        return {
            "total_applicants": 0,
            "total_drives": 0,
            "shortlist_rate": 0.0,
            "applicants_per_drive": [],
            "funnel": {
                "applied": 0,
                "screened": 0,
                "shortlisted": 0,
                "interviewed": 0,
                "offered": 0,
                "hired": 0,
            },
        }

    applications = db.query(models.Application).filter(models.Application.drive_id.in_(drive_ids)).all()
    total_applicants = len(applications)

    drive_app_count = {}
    for d in drives:
        drive_app_count[d.id] = {"title": d.title, "name": d.title, "count": 0, "applicants": 0}
    for app in applications:
        if app.drive_id in drive_app_count:
            drive_app_count[app.drive_id]["count"] += 1
            drive_app_count[app.drive_id]["applicants"] += 1

    applicants_per_drive = list(drive_app_count.values())

    funnel = {
        "applied": total_applicants,
        "screened": sum(1 for a in applications if a.current_stage != models.ApplicationStage.applied),
        "shortlisted": sum(1 for a in applications if a.current_stage in [models.ApplicationStage.shortlisted, models.ApplicationStage.hr_round, models.ApplicationStage.offered, models.ApplicationStage.hired]),
        "interviewed": sum(1 for a in applications if a.current_stage in [models.ApplicationStage.ai_interview, models.ApplicationStage.hr_round, models.ApplicationStage.offered, models.ApplicationStage.hired]),
        "offered": sum(1 for a in applications if a.current_stage in [models.ApplicationStage.offered, models.ApplicationStage.hired]),
        "hired": sum(1 for a in applications if a.current_stage == models.ApplicationStage.hired),
    }

    shortlist_rate = round((funnel["shortlisted"] / total_applicants * 100), 1) if total_applicants > 0 else 0.0

    return {
        "total_applicants": total_applicants,
        "total_drives": total_drives,
        "shortlist_rate": shortlist_rate,
        "applicants_per_drive": applicants_per_drive,
        "funnel": funnel,
    }


@router.get("", response_model=List[schemas.DriveOut])
@router.get("/", response_model=List[schemas.DriveOut])
def get_drives(
    branch: Optional[str] = Query(None, description="Filter by eligible branch"),
    min_cgpa: Optional[float] = Query(None, description="Filter by max required minimum CGPA"),
    current_user: models.User = Depends(get_current_user),
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
def get_drive_by_id(drive_id: str, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
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
