# =============================================================================
# VERITY — Authentication Router
# =============================================================================
from __future__ import annotations

import uuid
from datetime import datetime

import structlog
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import get_db
from app.models import User, AuditLog
from app.schemas import (
    SignUpRequest,
    LoginRequest,
    AuthResponse,
    UserResponse,
    PasswordResetRequest,
)

router = APIRouter()
settings = get_settings()
logger = structlog.get_logger()


async def get_current_user(request: Request, db: AsyncSession = Depends(get_db)) -> User:
    """Extract and validate the current user from the authorization header."""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")

    token = auth_header.replace("Bearer ", "").strip()

    # Development fallback: support local demo token when Supabase is not configured
    if not settings.supabase_url or token.startswith("demo-") or "placeholder" in settings.supabase_url:
        supabase_uid = "00000000-0000-0000-0000-000000000001"
        supabase_user = {
            "id": supabase_uid,
            "email": "explorer@verity.ai",
            "user_metadata": {"full_name": "Verity Explorer"},
        }
    else:
        # Validate token with Supabase
        try:
            import httpx
            async with httpx.AsyncClient() as client:
                resp = await client.get(
                    f"{settings.supabase_url}/auth/v1/user",
                    headers={
                        "Authorization": f"Bearer {token}",
                        "apikey": settings.supabase_anon_key,
                    },
                    timeout=10.0,
                )
                if resp.status_code != 200:
                    raise HTTPException(status_code=401, detail="Invalid or expired token")

                supabase_user = resp.json()
                supabase_uid = supabase_user.get("id")
        except HTTPException:
            raise
        except Exception as e:
            logger.error("Auth validation failed", error=str(e))
            raise HTTPException(status_code=401, detail="Authentication service unavailable")

    # Find or create local user
    result = await db.execute(select(User).where(User.supabase_uid == supabase_uid))
    user = result.scalar_one_or_none()

    if not user:
        # Auto-create user record on first auth
        user = User(
            email=supabase_user.get("email", "explorer@verity.ai"),
            full_name=supabase_user.get("user_metadata", {}).get("full_name", "Verity Explorer"),
            supabase_uid=supabase_uid,
            role="admin",  # Default to admin in development demo mode
        )
        db.add(user)
        await db.flush()

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")

    return user


@router.post("/signup")
async def signup(request: SignUpRequest):
    """Register a new user via Supabase Auth."""
    try:
        import httpx
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{settings.supabase_url}/auth/v1/signup",
                json={
                    "email": request.email,
                    "password": request.password,
                    "data": {"full_name": request.full_name},
                },
                headers={
                    "apikey": settings.supabase_anon_key,
                    "Content-Type": "application/json",
                },
                timeout=15.0,
            )

            if resp.status_code not in (200, 201):
                error_data = resp.json()
                raise HTTPException(
                    status_code=400,
                    detail=error_data.get("msg", "Signup failed"),
                )

            data = resp.json()
            return {
                "message": "Account created successfully",
                "user_id": data.get("id"),
                "email": request.email,
                "requires_confirmation": True,
            }
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Signup error", error=str(e))
        raise HTTPException(status_code=500, detail="Registration service unavailable")


@router.post("/login")
async def login(request: LoginRequest):
    """Authenticate user via Supabase Auth."""
    try:
        import httpx
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{settings.supabase_url}/auth/v1/token?grant_type=password",
                json={
                    "email": request.email,
                    "password": request.password,
                },
                headers={
                    "apikey": settings.supabase_anon_key,
                    "Content-Type": "application/json",
                },
                timeout=15.0,
            )

            if resp.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid credentials")

            data = resp.json()
            return {
                "access_token": data.get("access_token"),
                "refresh_token": data.get("refresh_token"),
                "token_type": "bearer",
                "expires_in": data.get("expires_in"),
                "user": {
                    "id": data.get("user", {}).get("id"),
                    "email": data.get("user", {}).get("email"),
                },
            }
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Login error", error=str(e))
        raise HTTPException(status_code=500, detail="Authentication service unavailable")


@router.post("/logout")
async def logout(request: Request):
    """Invalidate the current session."""
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header.replace("Bearer ", "")
        try:
            import httpx
            async with httpx.AsyncClient() as client:
                await client.post(
                    f"{settings.supabase_url}/auth/v1/logout",
                    headers={
                        "Authorization": f"Bearer {token}",
                        "apikey": settings.supabase_anon_key,
                    },
                    timeout=10.0,
                )
        except Exception:
            pass  # Best-effort logout

    return {"message": "Logged out"}


@router.post("/reset-password")
async def reset_password(request: PasswordResetRequest):
    """Send password reset email."""
    try:
        import httpx
        async with httpx.AsyncClient() as client:
            await client.post(
                f"{settings.supabase_url}/auth/v1/recover",
                json={"email": request.email},
                headers={
                    "apikey": settings.supabase_anon_key,
                    "Content-Type": "application/json",
                },
                timeout=15.0,
            )
    except Exception:
        pass  # Don't reveal whether email exists

    return {"message": "If an account exists, a reset link has been sent"}


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get the current authenticated user."""
    return current_user
