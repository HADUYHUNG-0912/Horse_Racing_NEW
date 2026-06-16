from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, RoleChecker
from app.models.database_models import User, Role
from app.schemas.auth import UserOut, UserStatusUpdate, UserRoleUpdate

router = APIRouter()

@router.get("/users", response_model=List[UserOut])
def get_all_users(
    db: Session = Depends(get_db),
    current_user = Depends(RoleChecker(["ADMIN"]))
):
    users = db.query(User).all()
    for u in users:
        u.role_name = u.role.name
    return users

@router.put("/users/{id}/status", response_model=UserOut)
def update_user_status(
    id: int,
    status_update: UserStatusUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(RoleChecker(["ADMIN"]))
):
    user = db.query(User).filter(User.id == id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.is_active = status_update.is_active
    db.commit()
    db.refresh(user)
    user.role_name = user.role.name
    return user

@router.put("/users/{id}/role", response_model=UserOut)
def update_user_role(
    id: int,
    role_update: UserRoleUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(RoleChecker(["ADMIN"]))
):
    user = db.query(User).filter(User.id == id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    role = db.query(Role).filter(Role.id == role_update.role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
        
    user.role_id = role.id
    db.commit()
    db.refresh(user)
    user.role_name = role.name
    return user
