"""Auth API"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta
from jose import jwt
from app.core.config import settings

router = APIRouter()

class AppleSignInRequest(BaseModel):
    id_token: str
    authorization_code: str
    user_identifier: Optional[str] = None
    email: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user_id: str
    subscription_tier: str

def create_token(user_id: str, tier: str = "free") -> str:
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": user_id, "tier": tier, "exp": expire}
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

@router.post("/apple", response_model=TokenResponse)
async def apple_sign_in(request: AppleSignInRequest):
    """Sign in with Apple"""
    user_id = request.user_identifier or f"apple_{request.id_token[:8]}"
    return {
        "access_token": create_token(user_id),
        "refresh_token": create_token(user_id),
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "user_id": user_id,
        "subscription_tier": "free",
    }

@router.post("/google", response_model=TokenResponse)
async def google_sign_in(id_token: str):
    """Sign in with Google"""
    user_id = f"google_{id_token[:8]}"
    return {
        "access_token": create_token(user_id),
        "refresh_token": create_token(user_id),
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "user_id": user_id,
        "subscription_tier": "free",
    }
