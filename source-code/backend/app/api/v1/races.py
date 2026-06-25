from typing import List, Optional
from datetime import timedelta, datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user, RoleChecker
from app.models.database_models import Race, Round, RaceParticipant, Registration, RefereeProfile, RaceInspection
from app.schemas.race import RaceCreate, RaceOut, RaceUpdate, RaceParticipantCreate, RaceParticipantOut, RaceInspectionCreate, RaceInspectionOut

router = APIRouter()

@router.get("/", response_model=List[RaceOut])
def read_races(
    db: Session = Depends(get_db),
    page: int = Query(default=1, ge=1, description="Trang hiện tại (bắt đầu từ 1)"),
    limit: int = Query(default=20, ge=1, le=100, description="Số bản ghi mỗi trang"),
    status_filter: Optional[str] = Query(default=None, description="Lọc theo status (SCHEDULED, ONGOING, RESULTS_ENTERED, COMPLETED)"),
    search: Optional[str] = Query(default=None, description="Tìm kiếm theo tên trận đua")
):
    """Lấy danh sách trận đua. Hỗ trợ phân trang, lọc theo status và tìm kiếm."""
    query = db.query(Race)
    
    # Lọc theo status
    if status_filter:
        query = query.filter(Race.status == status_filter.upper())
    
    # Tìm kiếm theo tên
    if search:
        query = query.filter(Race.name.ilike(f"%{search}%"))
    
    # Sắp xếp (cần thiết cho MSSQL khi dùng OFFSET)
    query = query.order_by(Race.id)
    
    # Phân trang
    offset = (page - 1) * limit
    races = query.offset(offset).limit(limit).all()
    
    # Populate extra fields for response schemas
    for race in races:
        if race.referee:
            race.referee_name = race.referee.user.full_name
        for p in race.participants:
            p.horse_name = p.registration.horse.name
            p.jockey_name = p.registration.jockey.user.full_name
            p.horse_id = p.registration.horse_id
    return races

@router.get("/assigned-to-me", response_model=List[RaceOut])
def read_assigned_races(
    db: Session = Depends(get_db),
    current_user = Depends(RoleChecker(["REFEREE", "ADMIN"]))
):
    if current_user.role.name == "REFEREE":
        ref_profile = current_user.referee_profile
        if not ref_profile:
            raise HTTPException(status_code=404, detail="Referee profile not found for this user")
        races = db.query(Race).filter(Race.referee_id == ref_profile.id).all()
    else:
        ref_profile = current_user.referee_profile
        if ref_profile:
            races = db.query(Race).filter(Race.referee_id == ref_profile.id).all()
        else:
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
        
    # Check if referee exists if provided and verify no conflicts
    if race_in.referee_id:
        ref = db.query(RefereeProfile).filter(RefereeProfile.id == race_in.referee_id).first()
        if not ref:
            raise HTTPException(status_code=404, detail="Referee profile not found")
        
        # Check referee schedule conflict (within 2 hours)
        ref_conflict = db.query(Race).filter(
            Race.referee_id == race_in.referee_id,
            Race.race_time >= race_in.race_time - timedelta(hours=2),
            Race.race_time <= race_in.race_time + timedelta(hours=2)
        ).first()
        if ref_conflict:
            raise HTTPException(status_code=400, detail="Referee has a conflicting schedule within 2 hours of this race time")
            
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
        new_time = race_update.race_time
        # Check conflicts for all participants
        for p in race.participants:
            horse_conflicts = db.query(Race).join(RaceParticipant).join(Registration).filter(
                Registration.horse_id == p.registration.horse_id,
                Race.id != id,
                Race.race_time >= new_time - timedelta(hours=2),
                Race.race_time <= new_time + timedelta(hours=2)
            ).first()
            if horse_conflicts:
                raise HTTPException(status_code=400, detail=f"Horse {p.registration.horse.name} has a conflicting schedule")
                
            jockey_conflicts = db.query(Race).join(RaceParticipant).join(Registration).filter(
                Registration.jockey_id == p.registration.jockey_id,
                Race.id != id,
                Race.race_time >= new_time - timedelta(hours=2),
                Race.race_time <= new_time + timedelta(hours=2)
            ).first()
            if jockey_conflicts:
                raise HTTPException(status_code=400, detail=f"Jockey {p.registration.jockey.user.full_name} has a conflicting schedule")
        
        if race.referee_id:
            ref_conflict = db.query(Race).filter(
                Race.referee_id == race.referee_id,
                Race.id != id,
                Race.race_time >= new_time - timedelta(hours=2),
                Race.race_time <= new_time + timedelta(hours=2)
            ).first()
            if ref_conflict:
                raise HTTPException(status_code=400, detail="Current referee has a conflicting schedule at this new time")
                
        race.race_time = new_time
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
        
    ref_conflict = db.query(Race).filter(
        Race.referee_id == referee_id,
        Race.id != id,
        Race.race_time >= race.race_time - timedelta(hours=2),
        Race.race_time <= race.race_time + timedelta(hours=2)
    ).first()
    if ref_conflict:
        raise HTTPException(status_code=400, detail="Referee has a conflicting schedule")
        
    race.referee_id = referee_id
    db.commit()
    db.refresh(race)
    race.referee_name = ref.user.full_name
    return race

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_race(
    id: int,
    db: Session = Depends(get_db),
    current_user = Depends(RoleChecker(["ADMIN"]))
):
    race = db.query(Race).filter(Race.id == id).first()
    if not race:
        raise HTTPException(status_code=404, detail="Race not found")
        
    db.delete(race)
    db.commit()
    return None

@router.post("/{race_id}/inspection", response_model=RaceInspectionOut, status_code=status.HTTP_201_CREATED)
def record_inspection(
    race_id: int,
    inspection_in: RaceInspectionCreate,
    db: Session = Depends(get_db),
    current_user = Depends(RoleChecker(["REFEREE", "ADMIN"]))
):
    race = db.query(Race).filter(Race.id == race_id).first()
    if not race:
        raise HTTPException(status_code=404, detail="Race not found")
        
    # Verify referee assignment if role is REFEREE
    if current_user.role.name == "REFEREE":
        ref_profile = current_user.referee_profile
        if not ref_profile or race.referee_id != ref_profile.id:
            raise HTTPException(status_code=403, detail="You are not assigned as the referee for this race")
            
    # Verify race status is SCHEDULED
    if race.status != "SCHEDULED":
        raise HTTPException(status_code=400, detail="Can only perform inspections on scheduled races")
        
    # Check if inspection already exists
    existing = db.query(RaceInspection).filter(RaceInspection.race_id == race_id).first()
    if existing:
        existing.weather = inspection_in.weather
        existing.track_condition = inspection_in.track_condition
        existing.horse_health = inspection_in.horse_health
        inspection = existing
    else:
        inspection = RaceInspection(
            race_id=race_id,
            weather=inspection_in.weather,
            track_condition=inspection_in.track_condition,
            horse_health=inspection_in.horse_health
        )
        db.add(inspection)
        
    # Automatically sync the race track_condition with the inspected track condition if provided
    if inspection_in.track_condition:
        race.track_condition = inspection_in.track_condition
        
    db.commit()
    db.refresh(inspection)
    return inspection
