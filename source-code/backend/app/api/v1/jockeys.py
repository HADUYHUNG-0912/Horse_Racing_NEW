from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import EmailStr
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user, RoleChecker
from app.models.database_models import JockeyProfile, HorseOwnerProfile, JockeyInvitation, Horse, User
from app.schemas.auth import JockeyProfileOut, JockeyProfileUpdate
from app.schemas.horse import JockeyInvitationCreate, JockeyInvitationOut, JockeyInvitationUpdate

router = APIRouter()

@router.get("/", response_model=List[JockeyProfileOut])
def read_jockeys(db: Session = Depends(get_db)):
    jockeys = db.query(JockeyProfile).all()
    for jockey in jockeys:
        jockey.username = jockey.user.username if jockey.user else None
        jockey.full_name = jockey.user.full_name if jockey.user else None
        jockey.email = jockey.user.email if jockey.user else None
    return jockeys


# FIX (Task 4 - Lưu hồ sơ cá nhân): bổ sung response schema mở rộng để trả thêm
# email (thuộc bảng Users, không thuộc JockeyProfiles) cùng các field của profile.
# JockeyProfileOut gốc không có email nên không dùng được trực tiếp cho route này.
class JockeyProfileWithEmailOut(JockeyProfileOut):
    email: Optional[EmailStr] = None


# FIX: schema payload riêng cho việc lưu hồ sơ, gồm field của JockeyProfiles
# (weight, experience_years, bio) + email (sẽ được dùng để update bảng Users).
# Không có "phone" vì cột này chưa tồn tại trong JockeyProfiles.
class JockeyProfileSaveIn(JockeyProfileUpdate):
    email: Optional[EmailStr] = None


@router.get("/profile", response_model=JockeyProfileWithEmailOut)
def read_my_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["JOCKEY"]))
):
    """Lấy hồ sơ cá nhân của Jockey hiện tại (dùng để load form Task 4)."""
    jockey = db.query(JockeyProfile).filter(JockeyProfile.user_id == current_user.id).first()
    if not jockey:
        raise HTTPException(status_code=404, detail="Jockey profile not found")

    # Gộp thêm email từ bảng Users vào response trả về cho frontend
    result = JockeyProfileWithEmailOut.model_validate(jockey)
    result.email = current_user.email
    return result


@router.put("/profile", response_model=JockeyProfileWithEmailOut)
def update_my_profile(
    profile_in: JockeyProfileSaveIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["JOCKEY"]))
):
    """
    Cập nhật hồ sơ cá nhân của Jockey hiện tại (Task 4).
    FIX: route này thay thế hoàn toàn việc dùng localStorage ở frontend.
    Ghi xuống Database thật (bảng JockeyProfiles + Users) để Chủ ngựa/Admin
    có thể xem được hồ sơ, và tránh lỗi Hydration Mismatch của Next.js.
    """
    jockey = db.query(JockeyProfile).filter(JockeyProfile.user_id == current_user.id).first()
    if not jockey:
        raise HTTPException(status_code=404, detail="Jockey profile not found")

    update_data = profile_in.model_dump(exclude_unset=True, exclude={"email"})
    for field, value in update_data.items():
        setattr(jockey, field, value)

    # Email thuộc bảng Users, cập nhật riêng nếu có gửi lên
    if profile_in.email is not None:
        existing = db.query(User).filter(User.email == profile_in.email, User.id != current_user.id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email đã được sử dụng bởi tài khoản khác")
        current_user.email = profile_in.email

    db.commit()
    db.refresh(jockey)
    db.refresh(current_user)

    result = JockeyProfileWithEmailOut.model_validate(jockey)
    result.email = current_user.email
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
    invitation.owner_name = invitation.owner.user.full_name if invitation.owner and invitation.owner.user else f"Chủ #{invitation.owner_id}"
    invitation.horse_name = invitation.horse.name if invitation.horse else f"Ngựa #{invitation.horse_id}"
    invitation.tournament_name = invitation.tournament.name if invitation.tournament else f"Giải #{invitation.tournament_id}"
    invitation.jockey_name = invitation.jockey.user.full_name if invitation.jockey and invitation.jockey.user else f"Jockey #{invitation.jockey_id}"
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
        invs = db.query(JockeyInvitation).filter(JockeyInvitation.owner_id == owner.id).all()
    elif current_user.role.name == "JOCKEY":
        jockey = db.query(JockeyProfile).filter(JockeyProfile.user_id == current_user.id).first()
        if not jockey:
            return []
        invs = db.query(JockeyInvitation).filter(JockeyInvitation.jockey_id == jockey.id).all()
    else:
        raise HTTPException(status_code=403, detail="Not authorized to view invitations")

    for i in invs:
        i.owner_name = i.owner.user.full_name if i.owner and i.owner.user else f"Chủ #{i.owner_id}"
        i.horse_name = i.horse.name if i.horse else f"Ngựa #{i.horse_id}"
        i.tournament_name = i.tournament.name if i.tournament else f"Giải #{i.tournament_id}"
        i.jockey_name = i.jockey.user.full_name if i.jockey and i.jockey.user else f"Jockey #{i.jockey_id}"
    return invs

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
    invitation.owner_name = invitation.owner.user.full_name if invitation.owner and invitation.owner.user else f"Chủ #{invitation.owner_id}"
    invitation.horse_name = invitation.horse.name if invitation.horse else f"Ngựa #{invitation.horse_id}"
    invitation.tournament_name = invitation.tournament.name if invitation.tournament else f"Giải #{invitation.tournament_id}"
    invitation.jockey_name = invitation.jockey.user.full_name if invitation.jockey and invitation.jockey.user else f"Jockey #{invitation.jockey_id}"
    return invitation