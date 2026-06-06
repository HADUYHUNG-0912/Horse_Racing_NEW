from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user, RoleChecker
from app.models.database_models import Race, Round, RaceParticipant, Registration, RefereeProfile
from app.schemas.race import RaceCreate, RaceOut, RaceUpdate, RaceParticipantCreate, RaceParticipantOut

router = APIRouter()

@router.get("/", response_model=List[RaceOut])
def read_races(db: Session = Depends(get_db)):
    races = db.query(Race).all()
    # Populate extra fields for response schemas
    for race in races:
        if race.referee:
            race.referee_name = race.referee.user.full_name
        for p in race.participants:
            p.horse_name = p.registration.horse.name
            p.jockey_name = p.registration.jockey.user.full_name
    return races

@router.post("/rounds/{round_id}/races", response_model=RaceOut, status_code=status.HTTP_201_CREATED)
def create_race(
    round_id: int,
    race_in: RaceCreate,
    db: Session = Depends(get_db),
    current_user = Depends(RoleChecker(["ADMIN"]))
):
    round_obj = db.query(Round).filter(Round.id == round_id).first()
    if not round_obj:
        raise HTTPException(status_code=404, detail="Round not found")
        
    # Check if referee exists if provided
    if race_in.referee_id:
        ref = db.query(RefereeProfile).filter(RefereeProfile.id == race_in.referee_id).first()
        if not ref:
            raise HTTPException(status_code=404, detail="Referee profile not found")
            
    race = Race(
        round_id=round_id,
        name=race_in.name,
        race_time=race_in.race_time,
        track_condition=race_in.track_condition,
        distance=race_in.distance,
        referee_id=race_in.referee_id,
        status=race_in.status
    )
    db.add(race)
    db.commit()
    db.refresh(race)
    return race

@router.post("/{id}/participants", response_model=RaceParticipantOut, status_code=status.HTTP_201_CREATED)
def add_participant(
    id: int,
    part_in: RaceParticipantCreate,
    db: Session = Depends(get_db),
    current_user = Depends(RoleChecker(["ADMIN"]))
):
    race = db.query(Race).filter(Race.id == id).first()
    if not race:
        raise HTTPException(status_code=404, detail="Race not found")
        
    # Verify registration exists and is APPROVED
    reg = db.query(Registration).filter(Registration.id == part_in.registration_id).first()
    if not reg:
        raise HTTPException(status_code=404, detail="Registration not found")
    if reg.status != "APPROVED":
        raise HTTPException(status_code=400, detail="Only approved registrations can be added to races")
        
    # Check if lane is already occupied in this race
    dup_lane = db.query(RaceParticipant).filter(
        RaceParticipant.race_id == id,
        RaceParticipant.lane_number == part_in.lane_number
    ).first()
    if dup_lane:
        raise HTTPException(status_code=400, detail=f"Lane {part_in.lane_number} is already occupied")
        
    # Check if horse is already registered in this race
    dup_part = db.query(RaceParticipant).filter(
        RaceParticipant.race_id == id,
        RaceParticipant.registration_id == part_in.registration_id
    ).first()
    if dup_part:
        raise HTTPException(status_code=400, detail="This horse is already a participant in this race")
        
    part = RaceParticipant(
        race_id=id,
        registration_id=part_in.registration_id,
        lane_number=part_in.lane_number,
        status="REGISTERED"
    )
    db.add(part)
    db.commit()
    db.refresh(part)
    
    part.horse_name = reg.horse.name
    part.jockey_name = reg.jockey.user.full_name
    return part

@router.put("/{id}/schedule", response_model=RaceOut)
def schedule_race(
    id: int,
    race_update: RaceUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(RoleChecker(["ADMIN"]))
):
    race = db.query(Race).filter(Race.id == id).first()
    if not race:
        raise HTTPException(status_code=404, detail="Race not found")
        
    if race_update.name is not None:
        race.name = race_update.name
    if race_update.race_time is not None:
        race.race_time = race_update.race_time
    if race_update.track_condition is not None:
        race.track_condition = race_update.track_condition
    if race_update.distance is not None:
        race.distance = race_update.distance
    if race_update.status is not None:
        race.status = race_update.status
        
    db.commit()
    db.refresh(race)
    if race.referee:
        race.referee_name = race.referee.user.full_name
    return race

@router.put("/{id}/assign-referee", response_model=RaceOut)
def assign_referee(
    id: int,
    referee_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(RoleChecker(["ADMIN"]))
):
    race = db.query(Race).filter(Race.id == id).first()
    if not race:
        raise HTTPException(status_code=404, detail="Race not found")
        
    ref = db.query(RefereeProfile).filter(RefereeProfile.id == referee_id).first()
    if not ref:
        raise HTTPException(status_code=404, detail="Referee not found")
        
    race.referee_id = referee_id
    db.commit()
    db.refresh(race)
    race.referee_name = ref.user.full_name
    return race
