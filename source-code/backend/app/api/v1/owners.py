from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.api.deps import get_db, RoleChecker
from app.models.database_models import User
from app.schemas.auth import OwnerProfileDetailOut, OwnerProfileUpdate, OwnerUpcomingRace

router = APIRouter()

@router.get("/profile", response_model=OwnerProfileDetailOut)
def read_owner_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["OWNER"]))
):
    owner = db.execute(
        text(
            """
            SELECT
                u.id AS user_id,
                h.id AS id,
                u.full_name,
                u.email,
                u.phone_number,
                u.avatar,
                h.company_name
            FROM Users u
            INNER JOIN HorseOwnerProfiles h ON h.user_id = u.id
            WHERE u.id = :user_id
            """
        ),
        {"user_id": current_user.id},
    ).mappings().first()
    if not owner:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Owner profile not found")
    return owner

@router.get("/upcoming-races", response_model=List[OwnerUpcomingRace])
def read_owner_upcoming_races(
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["OWNER"]))
):
    current_time = datetime.utcnow()
    races = db.execute(
        text(
            """
            SELECT
                r.id AS race_id,
                r.name AS race_name,
                h.name AS horse_name,
                t.name AS tournament_name,
                r.race_time AS race_date,
                t.location AS location
            FROM Users u
            INNER JOIN HorseOwnerProfiles hp ON hp.user_id = u.id
            INNER JOIN Horses h ON h.owner_id = hp.id
            INNER JOIN Registrations reg ON reg.horse_id = h.id
            INNER JOIN RaceParticipants rp ON rp.registration_id = reg.id
            INNER JOIN Races r ON r.id = rp.race_id
            INNER JOIN Rounds ro ON ro.id = r.round_id
            INNER JOIN Tournaments t ON t.id = ro.tournament_id
            WHERE u.id = :user_id
              AND r.status = 'SCHEDULED'
              AND r.race_time >= :current_time
            ORDER BY r.race_time ASC
            """
        ),
        {"user_id": current_user.id, "current_time": current_time},
    ).mappings().all()

    return races

@router.put("/profile", response_model=OwnerProfileDetailOut)
def update_owner_profile(
    profile_in: OwnerProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["OWNER"]))
):
    update_data = profile_in.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No data provided for update")

    user_updates = []
    user_params = {"user_id": current_user.id}

    if "full_name" in update_data:
        user_updates.append("full_name = :full_name")
        user_params["full_name"] = update_data["full_name"]
    if "phone_number" in update_data:
        user_updates.append("phone_number = :phone_number")
        user_params["phone_number"] = update_data["phone_number"]
    if "avatar" in update_data:
        user_updates.append("avatar = :avatar")
        user_params["avatar"] = update_data["avatar"]

    if user_updates:
        db.execute(
            text(f"UPDATE Users SET {', '.join(user_updates)} WHERE id = :user_id"),
            user_params,
        )

    if "company_name" in update_data:
        db.execute(
            text(
                "UPDATE HorseOwnerProfiles SET company_name = :company_name WHERE user_id = :user_id"
            ),
            {"company_name": update_data["company_name"], "user_id": current_user.id},
        )

    db.commit()

    owner = db.execute(
        text(
            """
            SELECT
                u.id AS user_id,
                h.id AS id,
                u.full_name,
                u.email,
                u.phone_number,
                u.avatar,
                h.company_name
            FROM Users u
            INNER JOIN HorseOwnerProfiles h ON h.user_id = u.id
            WHERE u.id = :user_id
            """
        ),
        {"user_id": current_user.id},
    ).mappings().first()

    if not owner:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Owner profile not found")
    return owner
