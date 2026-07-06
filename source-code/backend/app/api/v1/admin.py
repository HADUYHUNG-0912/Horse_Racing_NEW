from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_db, RoleChecker
from app.models.database_models import (
    User, Role, Tournament, Race, Horse, JockeyProfile,
    Registration, Prediction, SpectatorProfile, Result,
    RaceParticipant, Ranking, Prize, Award
)
from app.schemas.auth import UserOut, UserStatusUpdate, UserRoleUpdate

router = APIRouter()


# ===========================================================================
# User management
# ===========================================================================

@router.get("/users", response_model=List[UserOut])
def get_all_users(
    db: Session = Depends(get_db),
    current_user = Depends(RoleChecker(["ADMIN"])),
    page: int = Query(default=1, ge=1, description="Trang hiện tại (bắt đầu từ 1)"),
    limit: int = Query(default=20, ge=1, le=100, description="Số bản ghi mỗi trang"),
    search: Optional[str] = Query(default=None, description="Tìm theo username, email hoặc full_name"),
    role_filter: Optional[str] = Query(default=None, description="Lọc theo tên role (JOCKEY, OWNER, ...)"),
    is_active: Optional[bool] = Query(default=None, description="Lọc theo trạng thái active"),
):
    """
    Lấy danh sách người dùng (không bao gồm ADMIN).
    Hỗ trợ phân trang, tìm kiếm, lọc theo role và trạng thái.
    """
    query = db.query(User).join(Role).filter(Role.name != "ADMIN")

    # Tìm kiếm
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (User.username.ilike(search_term)) |
            (User.email.ilike(search_term)) |
            (User.full_name.ilike(search_term))
        )

    # Lọc theo role
    if role_filter:
        query = query.filter(Role.name == role_filter.upper())

    # Lọc theo trạng thái
    if is_active is not None:
        query = query.filter(User.is_active == is_active)

    # Sắp xếp (cần thiết cho MSSQL khi dùng OFFSET)
    query = query.order_by(User.id)
    
    # Phân trang
    offset = (page - 1) * limit
    users = query.offset(offset).limit(limit).all()

    for u in users:
        u.role_name = u.role.name
    return users


@router.put("/users/{id}/status", response_model=UserOut)
def update_user_status(
    id: int,
    status_update: UserStatusUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(RoleChecker(["ADMIN"]))
):
    user = db.query(User).filter(User.id == id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.role.name == "ADMIN":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Không thể thay đổi trạng thái tài khoản ADMIN")
        
    user.is_active = status_update.is_active
    db.commit()
    db.refresh(user)
    user.role_name = user.role.name
    return user


@router.put("/users/{id}/role", response_model=UserOut)
def update_user_role(
    id: int,
    role_update: UserRoleUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(RoleChecker(["ADMIN"]))
):
    user = db.query(User).filter(User.id == id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    role = db.query(Role).filter(Role.id == role_update.role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
        
    user.role_id = role.id
    db.commit()
    db.refresh(user)
    user.role_name = role.name
    return user


# ===========================================================================
# Admin Stats – GET /admin/stats
# ===========================================================================

@router.get("/stats")
def get_admin_stats(
    db: Session = Depends(get_db),
    current_user = Depends(RoleChecker(["ADMIN"]))
):
    """
    Thống kê tổng quan hệ thống dành cho Admin:
    - Tổng số users, tournaments, races, horses
    - Phân bố tournament theo status
    - Top 5 jockeys theo tổng điểm
    - Thống kê dự đoán (predictions)
    - Tổng số giải thưởng (prizes) và đã trao (awards)
    """
    # --- Tổng số entities ---
    total_users = db.query(func.count(User.id)).scalar()
    total_tournaments = db.query(func.count(Tournament.id)).scalar()
    total_races = db.query(func.count(Race.id)).scalar()
    total_horses = db.query(func.count(Horse.id)).scalar()
    total_jockeys = db.query(func.count(JockeyProfile.id)).scalar()
    total_registrations = db.query(func.count(Registration.id)).scalar()
    total_prizes = db.query(func.count(Prize.id)).scalar()
    total_awards = db.query(func.count(Award.id)).scalar()

    # --- Phân bố user theo role ---
    role_dist_rows = (
        db.query(Role.name, func.count(User.id))
        .join(User, User.role_id == Role.id)
        .group_by(Role.name)
        .all()
    )
    users_by_role = {row[0]: row[1] for row in role_dist_rows}

    # --- Phân bố tournament theo status ---
    tournament_status_rows = (
        db.query(Tournament.status, func.count(Tournament.id))
        .group_by(Tournament.status)
        .all()
    )
    tournaments_by_status = {row[0]: row[1] for row in tournament_status_rows}

    # --- Phân bố race theo status ---
    race_status_rows = (
        db.query(Race.status, func.count(Race.id))
        .group_by(Race.status)
        .all()
    )
    races_by_status = {row[0]: row[1] for row in race_status_rows}

    # --- Top 5 jockeys theo tổng điểm ---
    top_jockeys_rows = (
        db.query(Ranking)
        .filter(Ranking.entity_type == "JOCKEY")
        .order_by(Ranking.rank)
        .limit(5)
        .all()
    )
    top_jockeys = []
    for r in top_jockeys_rows:
        jockey = db.query(JockeyProfile).filter(JockeyProfile.id == r.entity_id).first()
        if jockey:
            top_jockeys.append({
                "jockey_id": jockey.id,
                "full_name": jockey.user.full_name,
                "username": jockey.user.username,
                "rank": r.rank,
                "total_points": r.points,
            })

    # --- Top 5 horses theo tổng điểm ---
    top_horses_rows = (
        db.query(Ranking)
        .filter(Ranking.entity_type == "HORSE")
        .order_by(Ranking.rank)
        .limit(5)
        .all()
    )
    top_horses = []
    for r in top_horses_rows:
        horse = db.query(Horse).filter(Horse.id == r.entity_id).first()
        if horse:
            top_horses.append({
                "horse_id": horse.id,
                "name": horse.name,
                "breed": horse.breed,
                "rank": r.rank,
                "total_points": r.points,
            })

    # --- Thống kê predictions ---
    total_predictions = db.query(func.count(Prediction.id)).scalar()
    correct_predictions = (
        db.query(func.count(Prediction.id))
        .filter(Prediction.status == "Won")
        .scalar()
    )
    pending_predictions = (
        db.query(func.count(Prediction.id))
        .filter(Prediction.status == "PENDING")
        .scalar()
    )
    global_accuracy = (
        round(correct_predictions / (total_predictions - pending_predictions) * 100, 1)
        if (total_predictions - pending_predictions) > 0
        else 0.0
    )

    return {
        "summary": {
            "total_users": total_users,
            "total_tournaments": total_tournaments,
            "total_races": total_races,
            "total_horses": total_horses,
            "total_jockeys": total_jockeys,
            "total_registrations": total_registrations,
            "total_prizes": total_prizes,
            "total_awards": total_awards,
        },
        "users_by_role": users_by_role,
        "tournaments_by_status": tournaments_by_status,
        "races_by_status": races_by_status,
        "top_jockeys": top_jockeys,
        "top_horses": top_horses,
        "predictions": {
            "total": total_predictions,
            "correct": correct_predictions,
            "pending": pending_predictions,
            "global_accuracy_rate": global_accuracy,
        },
    }
