from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.core.security import verify_password, get_password_hash, create_access_token
from app.models.database_models import User, Role, JockeyProfile, HorseOwnerProfile, RefereeProfile, SpectatorProfile
from app.schemas.auth import PasswordChangeIn, UserCreate, UserOut, UserDetailOut, Token

router = APIRouter()


def serialize_user_detail(user: User, profile: Optional[object] = None) -> Dict[str, Any]:
    payload = {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "full_name": user.full_name,
        "phone_number": user.phone_number,
        "avatar": user.avatar,
        "role_id": user.role_id,
        "role_name": user.role.name if user.role else None,
        "is_active": user.is_active,
        "created_at": user.created_at,
        "profile": None,
    }

    if profile is not None:
        profile_payload = {}
        for key, value in profile.__dict__.items():
            if key.startswith("_") or key == "user":
                continue
            profile_payload[key] = value

        for extra_key in ("full_name", "email", "phone_number", "avatar"):
            if hasattr(profile, extra_key):
                profile_payload[extra_key] = getattr(profile, extra_key)

        payload["profile"] = profile_payload

    return payload

@router.post("/token", response_model=Token)
def login_for_access_token(
    db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()
):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User account is locked"
        )
    access_token = create_access_token(subject=user.id)
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/register", response_model=UserOut)
def register_user(user_in: UserCreate, db: Session = Depends(get_db)):
    # Check if username exists
    existing_user = db.query(User).filter(User.username == user_in.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    # Check if email exists
    existing_email = db.query(User).filter(User.email == user_in.email).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already exists")
        
    # Get role
    role = db.query(Role).filter(Role.name == user_in.role_name.upper()).first()
    if not role:
        raise HTTPException(status_code=400, detail=f"Role {user_in.role_name} does not exist")
        
    # Create user
    user = User(
        username=user_in.username,
        email=user_in.email,
        full_name=user_in.full_name,
        password_hash=get_password_hash(user_in.password),
        role_id=role.id
    )
    db.add(user)
    db.flush() # Get user.id
    
    # Create role profile
    role_name = role.name
    if role_name == "JOCKEY":
        profile = JockeyProfile(
            user_id=user.id,
            bio=user_in.bio,
            weight=user_in.weight,
            height=user_in.height,
            experience_years=user_in.experience_years or 0
        )
        db.add(profile)
    elif role_name == "OWNER":
        profile = HorseOwnerProfile(
            user_id=user.id,
            company_name=user_in.company_name,
            age=user_in.age,
            experience_years=user_in.experience_years or 0,
            occupation=user_in.occupation,
            address=user_in.address,
            nationality=user_in.nationality,
            social_link=user_in.social_link,
            bio=user_in.bio
        )
        db.add(profile)
    elif role_name == "REFEREE":
        profile = RefereeProfile(
            user_id=user.id,
            certification_level=user_in.certification_level
        )
        db.add(profile)
    elif role_name == "SPECTATOR":
        profile = SpectatorProfile(
            user_id=user.id,
            favorite_horse_breed=user_in.favorite_horse_breed
        )
        db.add(profile)
        
    db.commit()
    db.refresh(user)
    
    # Attach role_name for out schema
    user.role_name = role_name
    return user

@router.get("/me", response_model=UserOut)
def read_users_me(current_user: User = Depends(get_current_user)):
    current_user.role_name = current_user.role.name
    return current_user


@router.put("/change-password")
def change_password(
    password_in: PasswordChangeIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(password_in.old_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Old password is incorrect")

    current_user.password_hash = get_password_hash(password_in.new_password)
    db.commit()
    db.refresh(current_user)
    return {"message": "Password changed successfully"}


@router.get("/users/{user_id}", response_model=UserDetailOut)
def get_user_detail(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    role_name = user.role.name if user.role else None
    profile = None

    if role_name == "JOCKEY":
        profile = db.query(JockeyProfile).filter(JockeyProfile.user_id == user.id).first()
    elif role_name == "OWNER":
        profile = db.query(HorseOwnerProfile).filter(HorseOwnerProfile.user_id == user.id).first()
    elif role_name == "REFEREE":
        profile = db.query(RefereeProfile).filter(RefereeProfile.user_id == user.id).first()
    elif role_name == "SPECTATOR":
        profile = db.query(SpectatorProfile).filter(SpectatorProfile.user_id == user.id).first()

    return serialize_user_detail(user, profile)
