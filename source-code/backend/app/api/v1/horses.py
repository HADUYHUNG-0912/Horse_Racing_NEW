from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user, RoleChecker
from app.models.database_models import Horse, HorseOwnerProfile
from app.schemas.horse import HorseCreate, HorseOut

router = APIRouter()

@router.get("/", response_model=List[HorseOut])
def read_horses(
    db: Session = Depends(get_db),
    owner_id: Optional[int] = None,
    current_user = Depends(get_current_user)
):
    query = db.query(Horse)
    if owner_id:
        query = query.filter(Horse.owner_id == owner_id)
    elif current_user.role.name == "OWNER":
        # Owner defaults to seeing their own horses
        owner_profile = db.query(HorseOwnerProfile).filter(HorseOwnerProfile.user_id == current_user.id).first()
        if owner_profile:
            query = query.filter(Horse.owner_id == owner_profile.id)
            
    return query.all()

@router.post("/", response_model=HorseOut, status_code=status.HTTP_201_CREATED)
def create_horse(
    horse_in: HorseCreate,
    db: Session = Depends(get_db),
    current_user = Depends(RoleChecker(["OWNER"]))
):
    owner_profile = db.query(HorseOwnerProfile).filter(HorseOwnerProfile.user_id == current_user.id).first()
    if not owner_profile:
        raise HTTPException(status_code=400, detail="Owner profile not found")
        
    horse = Horse(
        name=horse_in.name,
        age=horse_in.age,
        breed=horse_in.breed,
        gender=horse_in.gender,
        owner_id=owner_profile.id
    )
    db.add(horse)
    db.commit()
    db.refresh(horse)
    return horse
