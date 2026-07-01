from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session
from sqlalchemy import text

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
        
    time_until_race = part.race.race_time - get_vietnam_now_naive()
    if time_until_race < timedelta(minutes=15):
        raise HTTPException(status_code=400, detail="Predictions can only be made up to 15 minutes before the race starts")
        
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
    current_user = Depends(RoleChecker(["SPECTATOR"])),
    page: int = Query(default=1, ge=1, description="Trang hiện tại"),
    limit: int = Query(default=50, ge=1, le=100, description="Số bản ghi mỗi trang")
):
    offset = (page - 1) * limit
    preds = db.query(Prediction).filter(
        Prediction.user_id == current_user.id
    ).order_by(Prediction.prediction_date.desc()).offset(offset).limit(limit).all()
    
    # Process prediction outcomes dynamically based on results
    for p in preds:
        part = p.participant
        p.race_id = part.race_id
        p.horse_id = part.registration.horse_id
        p.horse_name = part.registration.horse.name
        p.jockey_name = part.registration.jockey.user.full_name
        p.race_name = part.race.name
                
    return preds

@router.get("/leaderboard")
def get_leaderboard(
    db: Session = Depends(get_db),
    page: int = Query(default=1, ge=1, description="Trang hiện tại"),
    limit: int = Query(default=10, ge=1, le=50, description="Số bản ghi mỗi trang (tối đa 50)"),
):
    """
    Leaderboard spectators – xếp hạng theo reward_points.
    Công khai, không cần đăng nhập.
    Trả về rank, username, full_name, reward_points, total_predictions, accuracy_rate.
    """
    total_spectators = db.query(func.count(SpectatorProfile.id)).scalar()

    offset = (page - 1) * limit
    spectators = (
        db.query(SpectatorProfile)
        .order_by(SpectatorProfile.reward_points.desc(), SpectatorProfile.id.asc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    result = []
    for idx, s in enumerate(spectators):
        global_rank = offset + idx + 1

        # Thống kê predictions của spectator
        total_preds = (
            db.query(func.count(Prediction.id))
            .filter(Prediction.user_id == s.user_id)
            .scalar()
        )
        correct_preds = (
            db.query(func.count(Prediction.id))
            .filter(Prediction.user_id == s.user_id, Prediction.status == "Won")
            .scalar()
        )
        evaluated = (
            db.query(func.count(Prediction.id))
            .filter(Prediction.user_id == s.user_id, Prediction.status.in_(["Won", "Lost"]))
            .scalar()
        )
        accuracy = round(correct_preds / evaluated * 100, 1) if evaluated > 0 else 0.0

        result.append({
            "rank": global_rank,
            "spectator_id": s.id,
            "username": s.user.username,
            "full_name": s.user.full_name,
            "reward_points": s.reward_points,
            "total_predictions": total_preds,
            "correct_predictions": correct_preds,
            "accuracy_rate": accuracy,
            "favorite_horse_breed": s.favorite_horse_breed,
        })

    return {
        "page": page,
        "limit": limit,
        "total": total_spectators,
        "data": result,
    }


@router.get("/rankings", response_model=List[SpectatorProfileDetailOut])
def get_top_spectators(tournament_id: Optional[int] = None, db: Session = Depends(get_db)):
    if tournament_id:
        # Calculate points per user for this tournament
        user_stats = db.execute(text("""
            SELECT TOP 10 p.user_id, 
                   COUNT(p.id) as total_preds,
                   SUM(CASE WHEN p.status = 'Won' THEN 1 ELSE 0 END) as correct_preds
            FROM Predictions p
            JOIN RaceParticipants rp ON p.race_participant_id = rp.id
            JOIN Registrations reg ON rp.registration_id = reg.id
            WHERE reg.tournament_id = :tid
            GROUP BY p.user_id
            ORDER BY correct_preds DESC
        """), {"tid": tournament_id}).fetchall()
        
        res = []
        for us in user_stats:
            s = db.query(SpectatorProfile).filter(SpectatorProfile.user_id == us.user_id).first()
            if s:
                correct = int(us.correct_preds) if us.correct_preds else 0
                total = int(us.total_preds) if us.total_preds else 0
                res.append(SpectatorProfileDetailOut(
                    id=s.id,
                    username=s.user.username,
                    email=s.user.email,
                    full_name=s.user.full_name,
                    phone_number=s.user.phone_number,
                    avatar=s.user.avatar,
                    favorite_horse_breed=s.favorite_horse_breed,
                    favorite_jockey=s.favorite_jockey,
                    reward_points=correct * 10,
                    total_predictions=total,
                    correct_predictions=correct
                ))
        return res
    else:
        top_spectators = db.query(SpectatorProfile).order_by(SpectatorProfile.reward_points.desc()).limit(10).all()
        res = []
        for s in top_spectators:
            preds = db.query(Prediction).filter(Prediction.user_id == s.user_id).all()
            total_preds = len(preds)
            correct_preds = len([p for p in preds if p.status == "Won"])
            
            res.append(SpectatorProfileDetailOut(
                id=s.id,
                username=s.user.username,
                email=s.user.email,
                full_name=s.user.full_name,
                phone_number=s.user.phone_number,
                avatar=s.user.avatar,
                favorite_horse_breed=s.favorite_horse_breed,
                favorite_jockey=s.favorite_jockey,
                reward_points=s.reward_points,
                total_predictions=total_preds,
                correct_predictions=correct_preds
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
        raise HTTPException(status_code=400, detail="Trận đấu đã bắt đầu, không thể dự đoán")
        
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
        gender=spectator.gender,
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
    if profile_update.gender is not None:
        spectator.gender = profile_update.gender
        
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
        gender=spectator.gender,
        reward_points=spectator.reward_points,
        current_rank=current_rank,
        total_predictions=total_predictions,
        accuracy_rate=round(accuracy_rate, 1)
    )
