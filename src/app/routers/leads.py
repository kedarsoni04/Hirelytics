from datetime import datetime, timezone
import time
from collections import defaultdict
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db

router = APIRouter()

# In-memory rate limiting: ip -> list of float timestamps
_ip_rate_limits: dict[str, list[float]] = defaultdict(list)


def get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return "127.0.0.1"


def enforce_rate_limit(ip: str):
    now = time.time()
    window = 3600.0  # 1 hour
    # Filter submissions within last hour
    timestamps = [t for t in _ip_rate_limits[ip] if now - t < window]
    if len(timestamps) >= 5:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Maximum 5 submissions per IP per hour.",
        )
    timestamps.append(now)
    _ip_rate_limits[ip] = timestamps


@router.post("", status_code=status.HTTP_201_CREATED)
@router.post("/", status_code=status.HTTP_201_CREATED)
def submit_lead(
    lead_in: schemas.LeadCreate,
    request: Request,
    db: Session = Depends(get_db),
):
    ip = get_client_ip(request)
    enforce_rate_limit(ip)

    # Honeypot: if filled, return 200 silently and do not save to DB
    if (lead_in.hp_website and lead_in.hp_website.strip()) or (lead_in.website and lead_in.website.strip()):
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={"message": "Lead submitted successfully", "status": "ok"},
        )

    db_lead = models.Lead(
        name=lead_in.name,
        work_email=str(lead_in.work_email),
        company=lead_in.company,
        role=lead_in.role,
        company_size=lead_in.company_size,
        hires_per_year=lead_in.hires_per_year,
        message=lead_in.message,
        source=lead_in.source or "web",
        ip=ip,
    )
    db.add(db_lead)
    db.commit()
    db.refresh(db_lead)

    return {
        "id": db_lead.id,
        "name": db_lead.name,
        "work_email": db_lead.work_email,
        "company": db_lead.company,
        "role": db_lead.role,
        "company_size": db_lead.company_size,
        "hires_per_year": db_lead.hires_per_year,
        "message": db_lead.message,
        "source": db_lead.source,
        "ip": db_lead.ip,
        "created_at": db_lead.created_at.isoformat() if db_lead.created_at else None,
    }
