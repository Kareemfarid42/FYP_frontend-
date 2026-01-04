# backend/routers/auth.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta
import models
import schemas
from database import get_db
from security import hash_password, verify_password, create_access_token
from config import settings
from utils.validation import sanitize_email

router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post("/login", response_model=schemas.Token)
def login(
    user_login: schemas.UserLogin,
    db: Session = Depends(get_db)
):
    """
    Login endpoint - authenticate user and return JWT token
    
    Supports:
    - Test account: test@example.com / t3$T
    - Registered users from database
    """
    
    # Sanitize email
    try:
        email = sanitize_email(user_login.email)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    
    # Find user in database
    user = db.query(models.User).filter(models.User.email == email).first()
    
    if not user:
        # Check if it's the test account (backward compatibility)
        if email == "test@example.com" and user_login.password == "t3$T":
            # Create test user if doesn't exist
            hashed_password = hash_password("t3$T")
            user = models.User(
                email="test@example.com",
                password_hash=hashed_password
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
    
    # Verify password
    if not verify_password(user_login.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


@router.post("/register", response_model=schemas.Token, status_code=status.HTTP_201_CREATED)
def register(
    user_register: schemas.UserRegister,
    db: Session = Depends(get_db)
):
    """
    Register new user endpoint
    
    Password requirements:
    - At least 8 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one number
    - At least one special character
    """
    
    # Sanitize email
    try:
        email = sanitize_email(user_register.email)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    
    # Check if user already exists
    existing_user = db.query(models.User).filter(models.User.email == email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered. Please use a different email or login."
        )
    
    # Hash password
    try:
        hashed_password = hash_password(user_register.password)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process password. Please try again."
        )
    
    # Create user
    try:
        user = models.User(
            email=email,
            password_hash=hashed_password
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user. Please try again."
        )
    
    # Create access token (auto-login after registration)
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


@router.post("/google", response_model=schemas.Token)
def google_oauth(
    # TODO: Add Google OAuth parameters
    db: Session = Depends(get_db)
):
    """
    Google OAuth login endpoint
    To be implemented in future
    """
    
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Google OAuth not yet implemented"
    )


@router.post("/logout")
def logout():
    """
    Logout endpoint
    Since we're using JWT, logout is handled client-side by removing the token
    This endpoint is just for consistency and future server-side token blacklisting
    """
    
    return {
        "message": "Successfully logged out"
    }