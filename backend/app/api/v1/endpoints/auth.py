from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
import uuid

from app.core.database import get_db
from app.models.user import User
from app.core.security import verify_password, get_password_hash, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


class UserRegisterRequest(BaseModel):
    email: str = Field(..., example="analyst@alkame.ai")
    password: str = Field(..., min_length=6, example="password123")
    full_name: Optional[str] = Field(default=None, example="Alex Analyst")


class UserLoginRequest(BaseModel):
    email: str = Field(..., example="analyst@alkame.ai")
    password: str = Field(..., example="password123")


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None
    role: str
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


@router.post("/register", response_model=TokenResponse, summary="Register New User Account")
def register(payload: UserRegisterRequest, db: Session = Depends(get_db)):
    """Registers a new enterprise analyst user and returns a signed JWT access token."""
    existing = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists.")

    user = User(
        id=str(uuid.uuid4()),
        email=payload.email.lower().strip(),
        hashed_password=get_password_hash(payload.password),
        full_name=payload.full_name,
        role="analyst"
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(subject=user.id)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "created_at": user.created_at
        }
    }


@router.post("/login", response_model=TokenResponse, summary="Login User")
def login(payload: UserLoginRequest, db: Session = Depends(get_db)):
    """Authenticates credentials and returns a signed JWT bearer token."""
    user = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    token = create_access_token(subject=user.id)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "created_at": user.created_at
        }
    }


@router.get("/me", response_model=UserResponse, summary="Get Current Authenticated User")
def get_me(current_user: Optional[User] = Depends(get_current_user)):
    """Returns the profile of the current authenticated JWT user."""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated.")
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role,
        "created_at": current_user.created_at
    }
