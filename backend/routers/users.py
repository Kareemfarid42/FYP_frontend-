# backend/routers/users.py

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import models
import schemas
from database import get_db
from dependencies import get_current_user

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=schemas.UserResponse)
def get_current_user_info(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get current authenticated user's information
    """
    return current_user


@router.get("/me/automata-count")
def get_user_automata_count(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get count of automata created by current user
    """
    count = db.query(models.Automata).filter(
        models.Automata.user_id == current_user.id
    ).count()
    
    return {
        "user_id": current_user.id,
        "email": current_user.email,
        "automata_count": count
    }