from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user, RoleChecker
from app.models.database_models import Prediction, RaceParticipant, Result, Race
from app.schemas.prediction import PredictionCreate, PredictionOut

router = APIRouter()

@router.post("/predictions", response_model=PredictionOut, status_code=status.HTTP_201_CREATED)
def make_prediction(
    pred_in: PredictionCreate,
    db: Session = Depends(get_db),
    current_user = Depends(RoleChecker(["SPECTATOR"]))
):
    # Verify participant exists
    part = db.query(RaceParticipant).filter(RaceParticipant.id == pred_in.race_participant_id).first()
    if not part:
        raise HTTPException(status_code=404, detail="Race participant not found")
        
    # Check if participant's race is already completed (cannot predict completed races)
    if part.race.status == "COMPLETED":
        raise HTTPException(status_code=400, detail="Cannot make prediction on a completed race")
        
    # Check if spectator has already made a prediction on this participant
    dup = db.query(Prediction).filter(
        Prediction.user_id == current_user.id,
        Prediction.race_participant_id == pred_in.race_participant_id
    ).first()
    if dup:
        raise HTTPException(status_code=400, detail="You have already made a prediction for this participant")
        
    prediction = Prediction(
        user_id=current_user.id,
        race_participant_id=pred_in.race_participant_id,
        predicted_rank=pred_in.predicted_rank,
        status="PENDING"
    )
    db.add(prediction)
    db.commit()
    db.refresh(prediction)
    
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
        p.horse_name = part.registration.horse.name
        p.jockey_name = part.registration.jockey.user.full_name
        p.race_name = part.race.name
        
        # If prediction is pending and race is completed, evaluate it
        if p.status == "PENDING" and part.race.status == "COMPLETED":
            result = db.query(Result).filter(Result.race_participant_id == part.id).first()
            if result:
                if result.rank == p.predicted_rank:
                    p.status = "CORRECT"
                else:
                    p.status = "INCORRECT"
                db.commit() # Save evaluated status
                
    return preds
