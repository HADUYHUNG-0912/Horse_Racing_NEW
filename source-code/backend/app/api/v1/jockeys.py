from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import EmailStr
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user, RoleChecker
from app.models.database_models import JockeyProfile, HorseOwnerProfile, JockeyInvitation, Horse, Tournament, User
from app.schemas.auth import JockeyProfileOut, JockeyProfileUpdate
from app.schemas.horse import JockeyInvitationCreate, JockeyInvitationOut, JockeyInvitationUpdate

router = APIRouter()

@router.get("/", response_model=List[JockeyProfileOut])
def read_jockeys(db: Session = Depends(get_db)):
    # Fetch all jockey profiles
    jockeys = db.query(JockeyProfile).all()
    return jockeys


# FIX (Task 4 - Lưu hồ sơ cá nhân): bổ sung response schema mở rộng để trả thêm
# email và full_name (thuộc bảng Users, không thuộc JockeyProfiles).
class JockeyProfileWithEmailOut(JockeyProfileOut):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None


# Schema payload cho việc lưu hồ sơ: gồm field của JockeyProfiles
# (weight, height, experience_years, bio) + email và full_name từ bảng Users.
class JockeyProfileSaveIn(JockeyProfileUpdate):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None


@router.get("/profile", response_model=JockeyProfileWithEmailOut)
def read_my_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["JOCKEY"]))
):
    """Lấy hồ sơ cá nhân của Jockey hiện tại (dùng để load form Task 4)."""
    jockey = db.query(JockeyProfile).filter(JockeyProfile.user_id == current_user.id).first()
    if not jockey:
        raise HTTPException(status_code=404, detail="Jockey profile not found")

    result = JockeyProfileWithEmailOut.model_validate(jockey)
    result.email = current_user.email
    result.full_name = current_user.full_name
    return result


@router.put("/profile", response_model=JockeyProfileWithEmailOut)
def update_my_profile(
    profile_in: JockeyProfileSaveIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["JOCKEY"]))
):
    """
    Cập nhật hồ sơ cá nhân của Jockey hiện tại (Task 4).
    Ghi xuống Database thật (bảng JockeyProfiles + Users).
    Các field thuộc JockeyProfiles: weight, height, experience_years, bio.
    Các field thuộc Users: email, full_name.
    """
    jockey = db.query(JockeyProfile).filter(JockeyProfile.user_id == current_user.id).first()
    if not jockey:
        raise HTTPException(status_code=404, detail="Jockey profile not found")

    # Cập nhật các field thuộc bảng JockeyProfiles
    update_data = profile_in.model_dump(
        exclude_unset=True,
        exclude={"email", "full_name"}  # 2 field này thuộc bảng Users, xử lý riêng bên dưới
    )
    for field, value in update_data.items():
        setattr(jockey, field, value)

    # Cập nhật email nếu có thay đổi, kiểm tra trùng với tài khoản khác
    if profile_in.email is not None:
        existing = db.query(User).filter(User.email == profile_in.email, User.id != current_user.id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email đã được sử dụng bởi tài khoản khác")
        current_user.email = profile_in.email

    # Cập nhật full_name nếu có
    if profile_in.full_name is not None and profile_in.full_name.strip():
        current_user.full_name = profile_in.full_name.strip()

    db.commit()
    db.refresh(jockey)
    db.refresh(current_user)

    result = JockeyProfileWithEmailOut.model_validate(jockey)
    result.email = current_user.email
    result.full_name = current_user.full_name
    return result


@router.post("/invite", response_model=JockeyInvitationOut, status_code=status.HTTP_201_CREATED)
def invite_jockey(
    invite_in: JockeyInvitationCreate,
    db: Session = Depends(get_db),
    current_user = Depends(RoleChecker(["OWNER"]))
):
    owner = db.query(HorseOwnerProfile).filter(HorseOwnerProfile.user_id == current_user.id).first()
    if not owner:
        raise HTTPException(status_code=400, detail="Owner profile not found")
        
    # Verify horse exists and belongs to the owner
    horse = db.query(Horse).filter(Horse.id == invite_in.horse_id, Horse.owner_id == owner.id).first()
    if not horse:
        raise HTTPException(status_code=404, detail="Horse not found or does not belong to owner")
        
    # Verify jockey profile exists
    jockey = db.query(JockeyProfile).filter(JockeyProfile.id == invite_in.jockey_id).first()
    if not jockey:
        raise HTTPException(status_code=404, detail="Jockey profile not found")

    # Verify tournament exists
    tournament = db.query(Tournament).filter(Tournament.id == invite_in.tournament_id).first()
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")

    # ----- CHECK 1 (raw SQL): 1 horse only 1 jockey per tournament -----
    sql_check_horse = text("""
        SELECT COUNT(*) FROM JockeyInvitations
        WHERE horse_id = :horse_id
          AND tournament_id = :tournament_id
          AND status = 'PENDING'
    """)
    result_horse = db.execute(sql_check_horse, {
        "horse_id": invite_in.horse_id,
        "tournament_id": invite_in.tournament_id,
    }).scalar()
    if result_horse and result_horse > 0:
        raise HTTPException(status_code=400, detail="Ngựa này đã có jockey trong giải đấu")

    # ----- CHECK 2 (raw SQL): 1 jockey only 1 horse per tournament -----
    sql_check_jockey = text("""
        SELECT COUNT(*) FROM JockeyInvitations
        WHERE jockey_id = :jockey_id
          AND tournament_id = :tournament_id
          AND status = 'PENDING'
    """)
    result_jockey = db.execute(sql_check_jockey, {
        "jockey_id": invite_in.jockey_id,
        "tournament_id": invite_in.tournament_id,
    }).scalar()
    if result_jockey and result_jockey > 0:
        raise HTTPException(status_code=400, detail="Jockey này đã được mời trong giải đấu")

    # Create invitation
    invitation = JockeyInvitation(
        owner_id=owner.id,
        jockey_id=invite_in.jockey_id,
        horse_id=invite_in.horse_id,
        tournament_id=invite_in.tournament_id,
        message=invite_in.message,
        status="PENDING"
    )
    db.add(invitation)
    db.commit()
    db.refresh(invitation)
    return invitation

@router.get("/invitations", response_model=List[JockeyInvitationOut])
def read_invitations(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    if current_user.role.name == "OWNER":
        owner = db.query(HorseOwnerProfile).filter(HorseOwnerProfile.user_id == current_user.id).first()
        if not owner:
            return []
        return db.query(JockeyInvitation).filter(JockeyInvitation.owner_id == owner.id).all()
    elif current_user.role.name == "JOCKEY":
        jockey = db.query(JockeyProfile).filter(JockeyProfile.user_id == current_user.id).first()
        if not jockey:
            return []
        return db.query(JockeyInvitation).filter(JockeyInvitation.jockey_id == jockey.id).all()
    else:
        raise HTTPException(status_code=403, detail="Not authorized to view invitations")

@router.put("/invitations/{id}", response_model=JockeyInvitationOut)
def update_invitation(
    id: int,
    invite_in: JockeyInvitationUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(RoleChecker(["JOCKEY"]))
):
    jockey = db.query(JockeyProfile).filter(JockeyProfile.user_id == current_user.id).first()
    if not jockey:
        raise HTTPException(status_code=400, detail="Jockey profile not found")
        
    invitation = db.query(JockeyInvitation).filter(JockeyInvitation.id == id, JockeyInvitation.jockey_id == jockey.id).first()
    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation not found")
        
    invitation.status = invite_in.status.upper()
    db.commit()
    db.refresh(invitation)
    return invitation
