import os
from datetime import datetime, timedelta, timezone
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
import bcrypt
from jose import JWTError, jwt
from pydantic import BaseModel

from app import models, schemas
from app.database import get_db

router = APIRouter()

# JWT Setup
SECRET_KEY = os.getenv("JWT_SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("JWT_SECRET_KEY environment variable is required")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 24 * 60  # 24 hours

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def hash_password(plain: str) -> str:
    pwd_bytes = plain.encode("utf-8")[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    pwd_bytes = plain.encode("utf-8")[:72]
    hashed_bytes = hashed.encode("utf-8")
    return bcrypt.checkpw(pwd_bytes, hashed_bytes)

def create_access_token(user_id: str, role: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"sub": user_id, "role": role, "exp": expire}
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


# Extension schema for Signup to include profiles (flat and nested)
class SignupPayload(schemas.UserSignup):
    # Student fields (flat)
    full_name: Optional[str] = None
    college: Optional[str] = None
    branch: Optional[str] = None
    cgpa: Optional[float] = None
    skills: Optional[List[str]] = []
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None

    # Company fields (flat)
    company_name: Optional[str] = None
    industry: Optional[str] = None

    # Admin fields (flat)
    admin_full_name: Optional[str] = None

    # Nested profiles support
    student_profile: Optional[schemas.StudentCreate] = None
    company_profile: Optional[schemas.CompanyCreate] = None


@router.post("/signup", response_model=schemas.Token)
def signup(payload: SignupPayload, db: Session = Depends(get_db)):
    # Check if user exists
    existing_user = db.query(models.User).filter(models.User.email == payload.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create the User row
    new_user = models.User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        role=payload.role
    )
    db.add(new_user)
    db.flush()  # to get new_user.id for the profile

    # Create matching profile
    if payload.role == models.UserRole.student:
        full_name = payload.full_name or (payload.student_profile.full_name if payload.student_profile else None)
        if not full_name:
            raise HTTPException(status_code=400, detail="full_name is required for student role")

        college = payload.college or (payload.student_profile.college if payload.student_profile else None)
        branch = payload.branch or (payload.student_profile.branch if payload.student_profile else None)
        cgpa = payload.cgpa if payload.cgpa is not None else (payload.student_profile.cgpa if payload.student_profile else None)
        skills = payload.skills if payload.skills is not None else (payload.student_profile.skills if payload.student_profile else [])
        linkedin_url = payload.linkedin_url or (payload.student_profile.linkedin_url if payload.student_profile else None)
        github_url = payload.github_url or (payload.student_profile.github_url if payload.student_profile else None)
        portfolio_url = payload.portfolio_url or (payload.student_profile.portfolio_url if payload.student_profile else None)

        student = models.Student(
            user_id=new_user.id,
            full_name=full_name,
            college=college,
            branch=branch,
            cgpa=cgpa,
            skills=skills,
            linkedin_url=linkedin_url,
            github_url=github_url,
            portfolio_url=portfolio_url
        )
        db.add(student)
    elif payload.role == models.UserRole.company:
        company_name = payload.company_name or (payload.company_profile.company_name if payload.company_profile else None)
        if not company_name:
            raise HTTPException(status_code=400, detail="company_name is required for company role")
        industry = payload.industry or (payload.company_profile.industry if payload.company_profile else None)

        company = models.Company(
            user_id=new_user.id,
            company_name=company_name,
            industry=industry
        )
        db.add(company)
    elif payload.role == models.UserRole.admin:
        admin_full_name = payload.admin_full_name or payload.full_name
        if not admin_full_name:
            raise HTTPException(status_code=400, detail="admin_full_name or full_name is required for admin role")

        admin = models.Admin(
            user_id=new_user.id,
            full_name=admin_full_name
        )
        db.add(admin)

    db.commit()

    # Generate token
    token = create_access_token(user_id=new_user.id, role=new_user.role.value if hasattr(new_user.role, 'value') else str(new_user.role))
    return {"access_token": token, "token_type": "bearer", "role": new_user.role}


@router.post("/login", response_model=schemas.Token)
def login(payload: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    token = create_access_token(user_id=user.id, role=user.role.value)
    return {"access_token": token, "token_type": "bearer", "role": user.role}


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None:
        raise credentials_exception
    return user


def get_current_role(required_role: models.UserRole | str):
    def role_dependency(current_user: models.User = Depends(get_current_user)):
        req_val = required_role.value if hasattr(required_role, "value") else str(required_role)
        user_val = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
        if user_val != req_val:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation not permitted. Required role: {req_val}"
            )
        return current_user
    return role_dependency


@router.get("/me")
def get_me(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Return user with profile depending on role
    result = {
        "id": current_user.id,
        "email": current_user.email,
        "role": current_user.role,
        "is_active": current_user.is_active,
        "created_at": current_user.created_at
    }
    
    if current_user.role == models.UserRole.student:
        student = db.query(models.Student).filter(models.Student.user_id == current_user.id).first()
        if student:
            result["student_profile"] = schemas.StudentOut.model_validate(student).model_dump()
    elif current_user.role == models.UserRole.company:
        company = db.query(models.Company).filter(models.Company.user_id == current_user.id).first()
        if company:
            result["company_profile"] = schemas.CompanyOut.model_validate(company).model_dump()
    elif current_user.role == models.UserRole.admin:
        admin = db.query(models.Admin).filter(models.Admin.user_id == current_user.id).first()
        if admin:
            result["admin_profile"] = {
                "id": admin.id,
                "full_name": admin.full_name,
                "admin_role": admin.admin_role
            }
            
    return result
