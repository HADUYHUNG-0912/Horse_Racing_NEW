from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user, RoleChecker
from app.models.database_models import JockeyProfile, HorseOwnerProfile, JockeyInvitation, Horse, User
from app.schemas.auth import JockeyProfileOut
from app.schemas.horse import JockeyInvitationCreate, JockeyInvitationOut, JockeyInvitationUpdate

router = APIRouter()

@router.get("/", response_model=List[JockeyProfileOut])
def read_jockeys(db: Session = Depends(get_db)):
    # Fetch all jockey profiles
    jockeys = db.query(JockeyProfile).all()
    return jockeys

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
