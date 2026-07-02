from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, text
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user, RoleChecker
from app.models.database_models import Race, RaceParticipant, Result, Violation, Ranking, Horse, JockeyProfile, Prediction, SpectatorProfile, Registration, Round, Tournament
from app.schemas.result import ResultCreate, ResultOut, ViolationCreate, ViolationOut, RankingOut
from app.core.timezone_utils import get_vietnam_now_naive

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
        
    race.status = "RESULTS_ENTERED"
    db.commit()
    
    # Populate extra fields for output
    for r in created_results:
        db.refresh(r)
        r.horse_name = r.participant.registration.horse.name
        r.jockey_name = r.participant.registration.jockey.user.full_name
        
    return created_results

@router.post("/{race_id}/results/confirm")
def confirm_results(
    race_id: int,
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
            
    # Check if race results have been entered
    if race.status != "RESULTS_ENTERED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Race results have not been entered yet or race is already completed"
        )
        
    race.status = "COMPLETED"
    evaluate_predictions_for_completed_race(db, race_id)
    db.commit()
    
    # Recalculate global rankings based on cumulative points
    recalculate_rankings(db)
    
    return {"message": "Results confirmed successfully", "race_id": race_id, "status": "COMPLETED"}

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
        violation_date=get_vietnam_now_naive()
    )
    db.add(violation)
    db.commit()
    db.refresh(violation)
    
    violation.horse_name = part.registration.horse.name
    violation.jockey_name = part.registration.jockey.user.full_name
    return violation

@router.get("/rankings", response_model=List[RankingOut])
def read_rankings(db: Session = Depends(get_db), tournament_id: Optional[int] = None):
    if tournament_id is not None:
        tournament = db.query(Tournament).filter(Tournament.id == tournament_id).first()
        if not tournament:
            raise HTTPException(status_code=404, detail="Tournament not found")

        horse_points = (
            db.query(
                Registration.horse_id,
                func.coalesce(func.sum(Result.points), 0).label("total_points")
            )
            .join(RaceParticipant, Registration.id == RaceParticipant.registration_id)
            .join(Result, RaceParticipant.id == Result.race_participant_id)
            .join(Race, RaceParticipant.race_id == Race.id)
            .join(Round, Race.round_id == Round.id)
            .filter(Round.tournament_id == tournament_id)
            .group_by(Registration.horse_id)
            .order_by(text("total_points DESC"))
            .all()
        )

        jockey_points = (
            db.query(
                Registration.jockey_id,
                func.coalesce(func.sum(Result.points), 0).label("total_points")
            )
            .join(RaceParticipant, Registration.id == RaceParticipant.registration_id)
            .join(Result, RaceParticipant.id == Result.race_participant_id)
            .join(Race, RaceParticipant.race_id == Race.id)
            .join(Round, Race.round_id == Round.id)
            .filter(Round.tournament_id == tournament_id)
            .group_by(Registration.jockey_id)
            .order_by(text("total_points DESC"))
            .all()
        )

        rankings = []
        for idx, (horse_id, points) in enumerate(horse_points, start=1):
            horse = db.query(Horse).filter(Horse.id == horse_id).first()
            rankings.append(RankingOut(
                id=idx,
                entity_type="HORSE",
                entity_id=horse_id,
                entity_name=horse.name if horse else "Unknown Horse",
                points=int(points or 0),
                rank=idx,
                updated_at=get_vietnam_now_naive()
            ))

        for idx, (jockey_id, points) in enumerate(jockey_points, start=1):
            jockey = db.query(JockeyProfile).filter(JockeyProfile.id == jockey_id).first()
            rankings.append(RankingOut(
                id=idx + 1000,
                entity_type="JOCKEY",
                entity_id=jockey_id,
                entity_name=jockey.user.full_name if jockey and jockey.user else "Unknown Jockey",
                points=int(points or 0),
                rank=idx,
                updated_at=get_vietnam_now_naive()
            ))

        return rankings

    rankings = db.query(Ranking).order_by(Ranking.entity_type, Ranking.rank).all()
    for rank in rankings:
        if rank.entity_type == "HORSE":
            horse = db.query(Horse).filter(Horse.id == rank.entity_id).first()
            rank.entity_name = horse.name if horse else "Unknown Horse"
        elif rank.entity_type == "JOCKEY":
            jockey = db.query(JockeyProfile).filter(JockeyProfile.id == rank.entity_id).first()
            rank.entity_name = jockey.user.full_name if jockey else "Unknown Jockey"
    return rankings

def recalculate_rankings(db: Session, tournament_id: Optional[int] = None):
    # Fetch all points grouped by Horse
    horse_query = text("""
        SELECT reg.horse_id, SUM(res.points) as total_points
        FROM Results res
        JOIN RaceParticipants rp ON res.race_participant_id = rp.id
        JOIN Registrations reg ON rp.registration_id = reg.id
        JOIN RaceParticipants rp2 ON rp2.id = rp.id
        JOIN Races r ON r.id = rp2.race_id
        JOIN Rounds rd ON rd.id = r.round_id
    """)
    if tournament_id is not None:
        horse_query = text(f"""
            {horse_query.text}
            WHERE rd.tournament_id = {tournament_id}
            GROUP BY reg.horse_id
            ORDER BY total_points DESC
        """)
    else:
        horse_query = text(f"""
            {horse_query.text}
            GROUP BY reg.horse_id
            ORDER BY total_points DESC
        """)
    cursor = db.execute(horse_query)
    horse_points = cursor.fetchall()
    
    # Fetch all points grouped by Jockey
    jockey_query = text("""
        SELECT reg.jockey_id, SUM(res.points) as total_points
        FROM Results res
        JOIN RaceParticipants rp ON res.race_participant_id = rp.id
        JOIN Registrations reg ON rp.registration_id = reg.id
        JOIN RaceParticipants rp2 ON rp2.id = rp.id
        JOIN Races r ON r.id = rp2.race_id
        JOIN Rounds rd ON rd.id = r.round_id
    """)
    if tournament_id is not None:
        jockey_query = text(f"""
            {jockey_query.text}
            WHERE rd.tournament_id = {tournament_id}
            GROUP BY reg.jockey_id
            ORDER BY total_points DESC
        """)
    else:
        jockey_query = text(f"""
            {jockey_query.text}
            GROUP BY reg.jockey_id
            ORDER BY total_points DESC
        """)
    cursor = db.execute(jockey_query)
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
            updated_at=get_vietnam_now_naive()
        )
        db.add(rank)
        
    # Re-insert Jockey rankings
    for idx, (j_id, pts) in enumerate(jockey_points):
        rank = Ranking(
            entity_type="JOCKEY",
            entity_id=j_id,
            points=pts,
            rank=idx + 1,
            updated_at=get_vietnam_now_naive()
        )
        db.add(rank)
        
    db.commit()
