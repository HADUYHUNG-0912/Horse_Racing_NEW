from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user, RoleChecker
from app.models.database_models import Race, RaceParticipant, Result, Violation, Ranking, Horse, JockeyProfile, Prediction, SpectatorProfile
from app.schemas.result import ResultCreate, ResultOut, ViolationCreate, ViolationOut, RankingOut

router = APIRouter()

def evaluate_predictions_for_completed_race(db: Session, race_id: int):
    predictions = db.query(Prediction).join(RaceParticipant).filter(
        RaceParticipant.race_id == race_id
    ).all()
    
    for pred in predictions:
        part = pred.participant
        result = db.query(Result).filter(Result.race_participant_id == part.id).first()
        if result:
            if pred.predicted_rank == result.rank:
                pred.status = "Won"
                spectator = db.query(SpectatorProfile).filter(SpectatorProfile.user_id == pred.user_id).first()
                if spectator:
                    spectator.earnRewardPoints(10)
            else:
                pred.status = "Lost"

@router.get("/{race_id}/results", response_model=List[ResultOut])
def get_race_results(
    race_id: int,
    db: Session = Depends(get_db)
):
    race = db.query(Race).filter(Race.id == race_id).first()
    if not race:
        raise HTTPException(status_code=404, detail="Race not found")
    
    results = db.query(Result).join(RaceParticipant).filter(
        RaceParticipant.race_id == race_id
    ).order_by(Result.rank).all()
    
    for r in results:
        r.horse_name = r.participant.registration.horse.name
        r.jockey_name = r.participant.registration.jockey.user.full_name
    return results
@router.post("/{race_id}/results", response_model=List[ResultOut])
def record_results(
    race_id: int,
    results_in: List[ResultCreate],
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
            
    # Process results
    created_results = []
    for res_in in results_in:
        part = db.query(RaceParticipant).filter(
            RaceParticipant.id == res_in.race_participant_id,
            RaceParticipant.race_id == race_id
        ).first()
        if not part:
            raise HTTPException(status_code=404, detail=f"Participant {res_in.race_participant_id} not found in this race")
            
        # Check if result already exists
        res = db.query(Result).filter(Result.race_participant_id == part.id).first()
        if res:
            res.rank = res_in.rank
            res.points = res_in.points
            res.notes = res_in.notes
        else:
            res = Result(
                race_participant_id=part.id,
                rank=res_in.rank,
                points=res_in.points,
                notes=res_in.notes
            )
            db.add(res)
            
        part.status = "FINISHED"
        created_results.append(res)
        
    race.status = "COMPLETED"
    evaluate_predictions_for_completed_race(db, race_id)
    db.commit()
    
    # Refresh and recalculate global rankings based on cumulative points
    recalculate_rankings(db)
    
    # Populate extra fields for output
    for r in created_results:
        db.refresh(r)
        r.horse_name = r.participant.registration.horse.name
        r.jockey_name = r.participant.registration.jockey.user.full_name
        
    return created_results

@router.post("/{race_id}/violations", response_model=ViolationOut, status_code=status.HTTP_201_CREATED)
def record_violation(
    race_id: int,
    violation_in: ViolationCreate,
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
            
    part = db.query(RaceParticipant).filter(
        RaceParticipant.id == violation_in.race_participant_id,
        RaceParticipant.race_id == race_id
    ).first()
    if not part:
        raise HTTPException(status_code=404, detail="Participant not found in this race")
        
    violation = Violation(
        race_participant_id=part.id,
        description=violation_in.description,
        penalty=violation_in.penalty,
        fine_amount=violation_in.fine_amount,
        violation_date=datetime.utcnow()
    )
    db.add(violation)
    db.commit()
    db.refresh(violation)
    
    violation.horse_name = part.registration.horse.name
    violation.jockey_name = part.registration.jockey.user.full_name
    return violation

@router.get("/rankings", response_model=List[RankingOut])
def read_rankings(db: Session = Depends(get_db)):
    rankings = db.query(Ranking).order_by(Ranking.entity_type, Ranking.rank).all()
    for rank in rankings:
        if rank.entity_type == "HORSE":
            horse = db.query(Horse).filter(Horse.id == rank.entity_id).first()
            rank.entity_name = horse.name if horse else "Unknown Horse"
        elif rank.entity_type == "JOCKEY":
            jockey = db.query(JockeyProfile).filter(JockeyProfile.id == rank.entity_id).first()
            rank.entity_name = jockey.user.full_name if jockey else "Unknown Jockey"
    return rankings

def recalculate_rankings(db: Session):
    # Fetch all points grouped by Horse
    cursor = db.execute("""
        SELECT reg.horse_id, SUM(res.points) as total_points
        FROM Results res
        JOIN RaceParticipants rp ON res.race_participant_id = rp.id
        JOIN Registrations reg ON rp.registration_id = reg.id
        GROUP BY reg.horse_id
        ORDER BY total_points DESC
    """)
    horse_points = cursor.fetchall()
    
    # Fetch all points grouped by Jockey
    cursor = db.execute("""
        SELECT reg.jockey_id, SUM(res.points) as total_points
        FROM Results res
        JOIN RaceParticipants rp ON res.race_participant_id = rp.id
        JOIN Registrations reg ON rp.registration_id = reg.id
        GROUP BY reg.jockey_id
        ORDER BY total_points DESC
    """)
    jockey_points = cursor.fetchall()
    
    # Delete current rankings
    db.query(Ranking).delete()
    
    # Re-insert Horse rankings
    for idx, (h_id, pts) in enumerate(horse_points):
        rank = Ranking(
            entity_type="HORSE",
            entity_id=h_id,
            points=pts,
            rank=idx + 1,
            updated_at=datetime.utcnow()
        )
        db.add(rank)
        
    # Re-insert Jockey rankings
    for idx, (j_id, pts) in enumerate(jockey_points):
        rank = Ranking(
            entity_type="JOCKEY",
            entity_id=j_id,
            points=pts,
            rank=idx + 1,
            updated_at=datetime.utcnow()
        )
        db.add(rank)
        
    db.commit()
