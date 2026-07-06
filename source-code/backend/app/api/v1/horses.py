from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user, RoleChecker
from app.models.database_models import Horse, HorseOwnerProfile
from app.schemas.horse import HorseCreate, HorseOut, HorseUpdate

router = APIRouter()

@router.get("/", response_model=List[HorseOut])
def read_horses(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    owner_id: Optional[int] = None
):
    query = db.query(Horse)

    # If OWNER, only show their own horses
    if current_user.role.name == "OWNER":
        owner_profile = db.query(HorseOwnerProfile).filter(HorseOwnerProfile.user_id == current_user.id).first()
        if not owner_profile:
            raise HTTPException(status_code=400, detail="Owner profile not found")
        query = query.filter(Horse.owner_id == owner_profile.id)
    elif owner_id is not None:
        # Other roles can filter by owner_id optionally
        query = query.filter(Horse.owner_id == owner_id)
            
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

    # Kiểm tra tuổi ngựa (Task 4 - Thuỳ Anh): chỉ cho phép từ 2 đến 10 tuổi
    if horse_in.age < 2 or horse_in.age > 10:
        raise HTTPException(status_code=400, detail="Tuổi ngựa phải từ 2 đến 10 năm")
        
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


@router.put("/{id}", response_model=HorseOut)
def update_horse(
    id: int,
    horse_in: HorseUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(RoleChecker(["OWNER"]))
):
    """Cập nhật thông tin ngựa. Chỉ chủ sở hữu mới được sửa."""
    owner_profile = db.query(HorseOwnerProfile).filter(HorseOwnerProfile.user_id == current_user.id).first()
    if not owner_profile:
        raise HTTPException(status_code=400, detail="Owner profile not found")

    horse = db.query(Horse).filter(Horse.id == id, Horse.owner_id == owner_profile.id).first()
    if not horse:
        raise HTTPException(status_code=404, detail="Không tìm thấy ngựa hoặc bạn không có quyền sửa")

    update_data = horse_in.model_dump(exclude_unset=True)

    # Kiểm tra tuổi ngựa nếu có cập nhật age
    if "age" in update_data and update_data["age"] is not None:
        if update_data["age"] < 2 or update_data["age"] > 10:
            raise HTTPException(status_code=400, detail="Tuổi ngựa phải từ 2 đến 10 năm")

    for field, value in update_data.items():
        setattr(horse, field, value)

    db.commit()
    db.refresh(horse)
    return horse


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_horse(
    id: int,
    db: Session = Depends(get_db),
    current_user = Depends(RoleChecker(["OWNER"]))
):
    """Xóa ngựa. Chỉ chủ sở hữu mới được xóa."""
    owner_profile = db.query(HorseOwnerProfile).filter(HorseOwnerProfile.user_id == current_user.id).first()
    if not owner_profile:
        raise HTTPException(status_code=400, detail="Owner profile not found")

    horse = db.query(Horse).filter(Horse.id == id, Horse.owner_id == owner_profile.id).first()
    if not horse:
        raise HTTPException(status_code=404, detail="Không tìm thấy ngựa hoặc bạn không có quyền xóa")

    db.delete(horse)
    db.commit()
    return None
