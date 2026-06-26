from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from datetime import timedelta
from app.core.timezone_utils import get_vietnam_now_naive
from app.api.deps import get_db, get_current_user, RoleChecker
from app.models.database_models import Prediction, RaceParticipant, Result, Race, Registration, SpectatorProfile, User
from app.schemas.prediction import PredictionCreate, PredictionOut, PredictionUpdate
from app.schemas.auth import SpectatorProfileUpdate, SpectatorProfileDetailOut

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
        
    # Check if race has started based on time
    if get_vietnam_now_naive() > part.race.race_time:
        raise HTTPException(status_code=400, detail="Prediction is closed because the race has already started.")
        
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

@router.get("/rankings", response_model=List[SpectatorProfileDetailOut])
def get_top_spectators(db: Session = Depends(get_db)):
    top_spectators = db.query(SpectatorProfile).order_by(SpectatorProfile.reward_points.desc()).limit(10).all()
    res = []
    for s in top_spectators:
        res.append(SpectatorProfileDetailOut(
            id=s.id,
            username=s.user.username,
            email=s.user.email,
            full_name=s.user.full_name,
            phone_number=s.user.phone_number,
            avatar=s.user.avatar,
            favorite_horse_breed=s.favorite_horse_breed,
            favorite_jockey=s.favorite_jockey,
            reward_points=s.reward_points
        ))
    return res

@router.put("/predictions/{prediction_id}", response_model=PredictionOut)
def update_prediction(
    prediction_id: int,
    pred_update: PredictionUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(RoleChecker(["SPECTATOR"]))
):
    prediction = db.query(Prediction).filter(
        Prediction.id == prediction_id,
        Prediction.user_id == current_user.id
    ).first()
    if not prediction:
        raise HTTPException(status_code=404, detail="Prediction not found")
        
    if prediction.status != "PENDING":
        raise HTTPException(status_code=400, detail="Cannot edit a prediction that is no longer pending")
        
    part = prediction.participant
    if part.race.status != "SCHEDULED":
        raise HTTPException(status_code=400, detail="Cannot edit prediction after race has started")
        
    if get_vietnam_now_naive() > part.race.race_time:
        raise HTTPException(status_code=400, detail="Prediction is closed because the race has already started.")
        
    time_until_race = part.race.race_time - get_vietnam_now_naive()
    if time_until_race < timedelta(minutes=15):
        raise HTTPException(status_code=400, detail="Modifications are only allowed up to 15 minutes before the race starts")
        
    prediction.predicted_rank = pred_update.predicted_rank
    db.commit()
    db.refresh(prediction)
    
    prediction.race_id = part.race_id
    prediction.horse_id = part.registration.horse_id
    prediction.horse_name = part.registration.horse.name
    prediction.jockey_name = part.registration.jockey.user.full_name
    prediction.race_name = part.race.name
    return prediction

@router.delete("/predictions/{prediction_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_prediction(
    prediction_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(RoleChecker(["SPECTATOR"]))
):
    prediction = db.query(Prediction).filter(
        Prediction.id == prediction_id,
        Prediction.user_id == current_user.id
    ).first()
    if not prediction:
        raise HTTPException(status_code=404, detail="Prediction not found")
        
    if prediction.status != "PENDING":
        raise HTTPException(status_code=400, detail="Cannot delete a prediction that is no longer pending")
        
    part = prediction.participant
    if part.race.status != "SCHEDULED":
        raise HTTPException(status_code=400, detail="Cannot delete prediction after race has started")
        
    time_until_race = part.race.race_time - get_vietnam_now_naive()
    if time_until_race < timedelta(minutes=15):
        raise HTTPException(status_code=400, detail="Deletions are only allowed up to 15 minutes before the race starts")
        
    db.delete(prediction)
    db.commit()
    return None

@router.get("/profile", response_model=SpectatorProfileDetailOut)
def get_spectator_profile(
    db: Session = Depends(get_db),
    current_user = Depends(RoleChecker(["SPECTATOR"]))
):
    spectator = db.query(SpectatorProfile).filter(SpectatorProfile.user_id == current_user.id).first()
    if not spectator:
        raise HTTPException(status_code=404, detail="Spectator profile not found")
        
    # Calculate stats
    total_predictions = db.query(Prediction).filter(Prediction.user_id == current_user.id).count()
    evaluated_preds = db.query(Prediction).filter(
        Prediction.user_id == current_user.id,
        Prediction.status.in_(["Won", "Lost"])
    ).all()
    correct_preds = sum(1 for p in evaluated_preds if p.status == "Won")
    accuracy_rate = (correct_preds / len(evaluated_preds) * 100) if evaluated_preds else 0.0
    
    # Calculate current rank
    higher_points_count = db.query(SpectatorProfile).filter(
        SpectatorProfile.reward_points > spectator.reward_points
    ).count()
    current_rank = higher_points_count + 1
        
    return SpectatorProfileDetailOut(
        id=spectator.id,
        username=current_user.username,
        email=current_user.email,
        full_name=current_user.full_name,
        phone_number=current_user.phone_number,
        avatar=current_user.avatar,
        favorite_horse_breed=spectator.favorite_horse_breed,
        favorite_jockey=spectator.favorite_jockey,
        reward_points=spectator.reward_points,
        current_rank=current_rank,
        total_predictions=total_predictions,
        accuracy_rate=round(accuracy_rate, 1)
    )

@router.put("/profile", response_model=SpectatorProfileDetailOut)
def update_spectator_profile(
    profile_update: SpectatorProfileUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(RoleChecker(["SPECTATOR"]))
):
    spectator = db.query(SpectatorProfile).filter(SpectatorProfile.user_id == current_user.id).first()
    if not spectator:
        raise HTTPException(status_code=404, detail="Spectator profile not found")
        
    if profile_update.full_name is not None:
        current_user.full_name = profile_update.full_name
    if profile_update.phone_number is not None:
        current_user.phone_number = profile_update.phone_number
    if profile_update.avatar is not None:
        current_user.avatar = profile_update.avatar
    if profile_update.favorite_horse_breed is not None:
        spectator.favorite_horse_breed = profile_update.favorite_horse_breed
    if profile_update.favorite_jockey is not None:
        spectator.favorite_jockey = profile_update.favorite_jockey
        
    db.commit()
    db.refresh(current_user)
    db.refresh(spectator)
    
    # Calculate stats
    total_predictions = db.query(Prediction).filter(Prediction.user_id == current_user.id).count()
    evaluated_preds = db.query(Prediction).filter(
        Prediction.user_id == current_user.id,
        Prediction.status.in_(["Won", "Lost"])
    ).all()
    correct_preds = sum(1 for p in evaluated_preds if p.status == "Won")
    accuracy_rate = (correct_preds / len(evaluated_preds) * 100) if evaluated_preds else 0.0
    
    # Calculate current rank
    higher_points_count = db.query(SpectatorProfile).filter(
        SpectatorProfile.reward_points > spectator.reward_points
    ).count()
    current_rank = higher_points_count + 1
    
    return SpectatorProfileDetailOut(
        id=spectator.id,
        username=current_user.username,
        email=current_user.email,
        full_name=current_user.full_name,
        phone_number=current_user.phone_number,
        avatar=current_user.avatar,
        favorite_horse_breed=spectator.favorite_horse_breed,
        favorite_jockey=spectator.favorite_jockey,
        reward_points=spectator.reward_points,
        current_rank=current_rank,
        total_predictions=total_predictions,
        accuracy_rate=round(accuracy_rate, 1)
    )
