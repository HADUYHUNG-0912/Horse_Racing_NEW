from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db, RoleChecker
from app.models.database_models import RefereeProfile, User
from app.schemas.auth import RefereeProfileOut, RefereeProfileDetailOut, RefereeProfileUpdate

router = APIRouter()

@router.get("/", response_model=List[RefereeProfileOut])
def read_referees(db: Session = Depends(get_db)):
    referees = db.query(RefereeProfile).all()
    for ref in referees:
        ref.full_name = ref.user.full_name if ref.user else None
    return referees

@router.get("/profile", response_model=RefereeProfileDetailOut)
def get_referee_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["REFEREE"]))
):
    referee = db.query(RefereeProfile).filter(RefereeProfile.user_id == current_user.id).first()
    if not referee:
        raise HTTPException(status_code=404, detail="Referee profile not found")
    
    return RefereeProfileDetailOut(
        id=referee.id,
        user_id=referee.user_id,
        username=current_user.username,
        email=current_user.email,
        full_name=current_user.full_name,
        phone_number=current_user.phone_number,
        avatar=current_user.avatar,
        certification_level=referee.certification_level
    )

@router.put("/profile", response_model=RefereeProfileDetailOut)
def update_referee_profile(
    profile_update: RefereeProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["REFEREE"]))
):
    referee = db.query(RefereeProfile).filter(RefereeProfile.user_id == current_user.id).first()
    if not referee:
        raise HTTPException(status_code=404, detail="Referee profile not found")
        
    if profile_update.full_name is not None and profile_update.full_name.strip():
        current_user.full_name = profile_update.full_name.strip()
    if profile_update.email is not None:
        # Check if email is already taken by another user
        existing = db.query(User).filter(User.email == profile_update.email, User.id != current_user.id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email đã được sử dụng bởi tài khoản khác")
        current_user.email = profile_update.email
    if profile_update.phone_number is not None:
        current_user.phone_number = profile_update.phone_number
    if profile_update.avatar is not None:
        current_user.avatar = profile_update.avatar
    if profile_update.certification_level is not None:
        referee.certification_level = profile_update.certification_level
        
    db.commit()
    db.refresh(current_user)
    db.refresh(referee)
    
    return RefereeProfileDetailOut(
        id=referee.id,
        user_id=referee.user_id,
        username=current_user.username,
        email=current_user.email,
        full_name=current_user.full_name,
        phone_number=current_user.phone_number,
        avatar=current_user.avatar,
        certification_level=referee.certification_level
    )
