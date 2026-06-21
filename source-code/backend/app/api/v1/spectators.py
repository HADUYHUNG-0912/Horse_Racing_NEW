from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user, RoleChecker
from app.models.database_models import Prediction, RaceParticipant, Result, Race, Registration, SpectatorProfile
from app.schemas.prediction import PredictionCreate, PredictionOut

router = APIRouter()

@router.post("/predictions", response_model=PredictionOut, status_code=status.HTTP_201_CREATED)
def make_prediction(
    pred_in: PredictionCreate,
    db: Session = Depends(get_db),
    current_user = Depends(RoleChecker(["SPECTATOR"]))
):
    # Verify participant exists by joining with Registration
    part = db.query(RaceParticipant).join(Registration).filter(
        RaceParticipant.race_id == pred_in.race_id,
        Registration.horse_id == pred_in.horse_id
    ).first()
    if not part:
        raise HTTPException(status_code=404, detail="Race participant not found for specified race and horse")
        
    # Check if participant's race is already completed (cannot predict completed races)
    if part.race.status == "COMPLETED":
        raise HTTPException(status_code=400, detail="Cannot make prediction on a completed race")
        
    # Check if spectator has already made a prediction for this race
    dup = db.query(Prediction).join(RaceParticipant).filter(
        Prediction.user_id == current_user.id,
        RaceParticipant.race_id == part.race_id
    ).first()
    if dup:
        raise HTTPException(status_code=400, detail="You have already made a prediction for this race")
        
    prediction = Prediction(
        user_id=current_user.id,
        race_participant_id=part.id,
        predicted_rank=pred_in.predicted_rank,
        status="PENDING"
    )
    db.add(prediction)
    db.commit()
    db.refresh(prediction)
    
    prediction.race_id = part.race_id
    prediction.horse_id = part.registration.horse_id
    prediction.horse_name = part.registration.horse.name
    prediction.jockey_name = part.registration.jockey.user.full_name
    prediction.race_name = part.race.name
    return prediction

@router.get("/predictions", response_model=List[PredictionOut])
def read_predictions(
    db: Session = Depends(get_db),
    current_user = Depends(RoleChecker(["SPECTATOR"]))
):
    preds = db.query(Prediction).filter(Prediction.user_id == current_user.id).all()
    
    # Process prediction outcomes dynamically based on results
    for p in preds:
        part = p.participant
        p.race_id = part.race_id
        p.horse_id = part.registration.horse_id
        p.horse_name = part.registration.horse.name
        p.jockey_name = part.registration.jockey.user.full_name
        p.race_name = part.race.name
        
        # If prediction is pending and race is completed, evaluate it
        if p.status == "PENDING" and part.race.status == "COMPLETED":
            result = db.query(Result).filter(Result.race_participant_id == part.id).first()
            if result:
                if result.rank == p.predicted_rank:
                    p.status = "Won"
                    spectator = db.query(SpectatorProfile).filter(SpectatorProfile.user_id == p.user_id).first()
                    if spectator:
                        spectator.earnRewardPoints(10)
                else:
                    p.status = "Lost"
                db.commit() # Save evaluated status
                
    return preds
