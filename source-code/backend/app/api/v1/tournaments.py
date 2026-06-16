from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user, RoleChecker
from app.models.database_models import Tournament, Round, Registration, Horse, JockeyProfile, HorseOwnerProfile
from app.schemas.tournament import (
    TournamentCreate, TournamentUpdate, TournamentOut,
    RoundCreate, RoundOut,
    RegistrationCreate, RegistrationOut, RegistrationUpdate
)

router = APIRouter()

@router.get("/", response_model=List[TournamentOut])
def read_tournaments(db: Session = Depends(get_db)):
    return db.query(Tournament).all()

@router.post("/", response_model=TournamentOut, status_code=status.HTTP_201_CREATED)
def create_tournament(
    tournament_in: TournamentCreate,
    db: Session = Depends(get_db),
    current_user = Depends(RoleChecker(["ADMIN"]))
):
    tournament = Tournament(
        name=tournament_in.name,
        description=tournament_in.description,
        start_date=tournament_in.start_date,
        end_date=tournament_in.end_date,
        location=tournament_in.location,
        status=tournament_in.status
    )
    db.add(tournament)
    db.commit()
    db.refresh(tournament)
    return tournament

@router.post("/{id}/rounds", response_model=RoundOut, status_code=status.HTTP_201_CREATED)
def create_round(
    id: int,
    round_in: RoundCreate,
    db: Session = Depends(get_db),
    current_user = Depends(RoleChecker(["ADMIN"]))
):
    tournament = db.query(Tournament).filter(Tournament.id == id).first()
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")
        
    round_obj = Round(
        tournament_id=id,
        name=round_in.name,
        sequence=round_in.sequence
    )
    db.add(round_obj)
    db.commit()
    db.refresh(round_obj)
    return round_obj

@router.post("/{id}/register", response_model=RegistrationOut, status_code=status.HTTP_201_CREATED)
def register_for_tournament(
    id: int,
    reg_in: RegistrationCreate,
    db: Session = Depends(get_db),
    current_user = Depends(RoleChecker(["OWNER"]))
):
    tournament = db.query(Tournament).filter(Tournament.id == id).first()
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")
        
    # Check owner profile
    owner = db.query(HorseOwnerProfile).filter(HorseOwnerProfile.user_id == current_user.id).first()
    if not owner:
        raise HTTPException(status_code=400, detail="Owner profile not found")
        
    # Check horse ownership
    horse = db.query(Horse).filter(Horse.id == reg_in.horse_id, Horse.owner_id == owner.id).first()
    if not horse:
        raise HTTPException(status_code=400, detail="Horse not found or does not belong to owner")
        
    # Check jockey exists
    jockey = db.query(JockeyProfile).filter(JockeyProfile.id == reg_in.jockey_id).first()
    if not jockey:
        raise HTTPException(status_code=404, detail="Jockey not found")
        
    # Check duplicate registration
    dup = db.query(Registration).filter(
        Registration.tournament_id == id,
        Registration.horse_id == reg_in.horse_id
    ).first()
    if dup:
        raise HTTPException(status_code=400, detail="Horse is already registered for this tournament")
        
    registration = Registration(
        tournament_id=id,
        horse_id=reg_in.horse_id,
        jockey_id=reg_in.jockey_id,
        status="PENDING"
    )
    db.add(registration)
    db.commit()
    db.refresh(registration)
    return registration

@router.get("/{id}/registrations", response_model=List[RegistrationOut])
def read_registrations(id: int, db: Session = Depends(get_db)):
    regs = db.query(Registration).filter(Registration.tournament_id == id).all()
    # Populate names for response model helper
    for r in regs:
        r.horse_name = r.horse.name
        r.jockey_name = r.jockey.user.full_name
    return regs

@router.put("/registrations/{reg_id}", response_model=RegistrationOut)
def update_registration_status(
    reg_id: int,
    reg_update: RegistrationUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(RoleChecker(["ADMIN"]))
):
    reg = db.query(Registration).filter(Registration.id == reg_id).first()
    if not reg:
        raise HTTPException(status_code=404, detail="Registration not found")
        
    reg.status = reg_update.status.upper()
    db.commit()
    db.refresh(reg)
    reg.horse_name = reg.horse.name
    reg.jockey_name = reg.jockey.user.full_name
    return reg

@router.put("/{id}", response_model=TournamentOut)
def update_tournament(
    id: int,
    tournament_update: TournamentUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(RoleChecker(["ADMIN"]))
):
    tournament = db.query(Tournament).filter(Tournament.id == id).first()
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")
        
    if tournament_update.name is not None:
        tournament.name = tournament_update.name
    if tournament_update.description is not None:
        tournament.description = tournament_update.description
    if tournament_update.start_date is not None:
        tournament.start_date = tournament_update.start_date
    if tournament_update.end_date is not None:
        tournament.end_date = tournament_update.end_date
    if tournament_update.location is not None:
        tournament.location = tournament_update.location
    if tournament_update.status is not None:
        tournament.status = tournament_update.status
        
    db.commit()
    db.refresh(tournament)
    return tournament

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tournament(
    id: int,
    db: Session = Depends(get_db),
    current_user = Depends(RoleChecker(["ADMIN"]))
):
    tournament = db.query(Tournament).filter(Tournament.id == id).first()
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")
        
    db.delete(tournament)
    db.commit()
    return None
