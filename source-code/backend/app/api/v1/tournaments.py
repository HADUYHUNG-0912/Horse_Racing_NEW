from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user, RoleChecker
from app.models.database_models import (
    Tournament, Round, Registration, Horse, JockeyProfile,
    HorseOwnerProfile, Prize, Award, Result, RaceParticipant
)
from app.schemas.tournament import (
    TournamentCreate, TournamentUpdate, TournamentOut,
    RoundCreate, RoundOut,
    RegistrationCreate, RegistrationOut, RegistrationUpdate
)
from app.schemas.prize import PrizeCreate, PrizeUpdate, PrizeOut, AwardOut
from app.core.timezone_utils import get_vietnam_now_naive

router = APIRouter()

# ===========================================================================
# Tournament CRUD
# ===========================================================================

@router.get("/", response_model=List[TournamentOut])
def read_tournaments(
    db: Session = Depends(get_db),
    page: int = Query(default=1, ge=1, description="Trang hiện tại (bắt đầu từ 1)"),
    limit: int = Query(default=20, ge=1, le=100, description="Số bản ghi mỗi trang"),
    status_filter: Optional[str] = Query(default=None, description="Lọc theo status (UPCOMING, ACTIVE, COMPLETED, CANCELLED)"),
    search: Optional[str] = Query(default=None, description="Tìm kiếm theo tên giải đấu")
):
    """Lấy danh sách tournament. Hỗ trợ phân trang, lọc theo status và tìm kiếm theo tên."""
    query = db.query(Tournament)
    
    # Lọc theo status
    if status_filter:
        query = query.filter(Tournament.status == status_filter.upper())
    
    # Tìm kiếm theo tên
    if search:
        query = query.filter(Tournament.name.ilike(f"%{search}%"))
    
    # Sắp xếp (cần thiết cho MSSQL khi dùng OFFSET)
    query = query.order_by(Tournament.id)
    
    # Phân trang
    offset = (page - 1) * limit
    tournaments = query.offset(offset).limit(limit).all()
    
    return tournaments


@router.post("/", response_model=TournamentOut, status_code=status.HTTP_201_CREATED)
def create_tournament(
    tournament_in: TournamentCreate,
    db: Session = Depends(get_db),
    current_user = Depends(RoleChecker(["ADMIN"]))
):
    # Validate that end_date >= start_date
    if tournament_in.end_date < tournament_in.start_date:
        raise HTTPException(status_code=400, detail="End date must be greater than or equal to start date")
    
    tournament = Tournament(
        name=tournament_in.name,
        description=tournament_in.description,
        start_date=tournament_in.start_date,
        end_date=tournament_in.end_date,
        location=tournament_in.location,
        status=tournament_in.status
    )
    db.add(tournament)
    db.commit()
    db.refresh(tournament)
    return tournament


@router.post("/{id}/rounds", response_model=RoundOut, status_code=status.HTTP_201_CREATED)
def create_round(
    id: int,
    round_in: RoundCreate,
    db: Session = Depends(get_db),
    current_user = Depends(RoleChecker(["ADMIN"]))
):
    tournament = db.query(Tournament).filter(Tournament.id == id).first()
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")
        
    round_obj = Round(
        tournament_id=id,
        name=round_in.name,
        sequence=round_in.sequence
    )
    db.add(round_obj)
    db.commit()
    db.refresh(round_obj)
    return round_obj


@router.post("/{id}/register", response_model=RegistrationOut, status_code=status.HTTP_201_CREATED)
def register_for_tournament(
    id: int,
    reg_in: RegistrationCreate,
    db: Session = Depends(get_db),
    current_user = Depends(RoleChecker(["OWNER"]))
):
    tournament = db.query(Tournament).filter(Tournament.id == id).first()
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")
        
    # Check owner profile
    owner = db.query(HorseOwnerProfile).filter(HorseOwnerProfile.user_id == current_user.id).first()
    if not owner:
        raise HTTPException(status_code=400, detail="Owner profile not found")
        
    # Check horse ownership
    horse = db.query(Horse).filter(Horse.id == reg_in.horse_id, Horse.owner_id == owner.id).first()
    if not horse:
        raise HTTPException(status_code=400, detail="Horse not found or does not belong to owner")
        
    # Check jockey exists
    jockey = db.query(JockeyProfile).filter(JockeyProfile.id == reg_in.jockey_id).first()
    if not jockey:
        raise HTTPException(status_code=404, detail="Jockey not found")
        
    # Check duplicate registration
    dup = db.query(Registration).filter(
        Registration.tournament_id == id,
        Registration.horse_id == reg_in.horse_id
    ).first()
    if dup:
        raise HTTPException(status_code=400, detail="Horse is already registered for this tournament")
        
    registration = Registration(
        tournament_id=id,
        horse_id=reg_in.horse_id,
        jockey_id=reg_in.jockey_id,
        status="PENDING"
    )
    db.add(registration)
    db.commit()
    db.refresh(registration)
    return registration


@router.get("/{id}/registrations", response_model=List[RegistrationOut])
def read_registrations(id: int, db: Session = Depends(get_db)):
    regs = db.query(Registration).filter(Registration.tournament_id == id).all()
    # Populate names for response model helper
    for r in regs:
        r.horse_name = r.horse.name
        r.jockey_name = r.jockey.user.full_name
    return regs


@router.put("/registrations/{reg_id}", response_model=RegistrationOut)
def update_registration_status(
    reg_id: int,
    reg_update: RegistrationUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(RoleChecker(["ADMIN"]))
):
    reg = db.query(Registration).filter(Registration.id == reg_id).first()
    if not reg:
        raise HTTPException(status_code=404, detail="Registration not found")
        
    reg.status = reg_update.status.upper()
    db.commit()
    db.refresh(reg)
    reg.horse_name = reg.horse.name
    reg.jockey_name = reg.jockey.user.full_name
    return reg


@router.put("/{id}", response_model=TournamentOut)
def update_tournament(
    id: int,
    tournament_update: TournamentUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(RoleChecker(["ADMIN"]))
):
    tournament = db.query(Tournament).filter(Tournament.id == id).first()
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")
    
    # Prepare dates for validation
    new_start_date = tournament_update.start_date if tournament_update.start_date is not None else tournament.start_date
    new_end_date = tournament_update.end_date if tournament_update.end_date is not None else tournament.end_date
    
    # Validate that end_date >= start_date
    if new_end_date < new_start_date:
        raise HTTPException(status_code=400, detail="End date must be greater than or equal to start date")
        
    if tournament_update.name is not None:
        tournament.name = tournament_update.name
    if tournament_update.description is not None:
        tournament.description = tournament_update.description
    if tournament_update.start_date is not None:
        tournament.start_date = tournament_update.start_date
    if tournament_update.end_date is not None:
        tournament.end_date = tournament_update.end_date
    if tournament_update.location is not None:
        tournament.location = tournament_update.location
    if tournament_update.status is not None:
        tournament.status = tournament_update.status
        
    db.commit()
    db.refresh(tournament)
    return tournament


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tournament(
    id: int,
    db: Session = Depends(get_db),
    current_user = Depends(RoleChecker(["ADMIN"]))
):
    tournament = db.query(Tournament).filter(Tournament.id == id).first()
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")
        
    db.delete(tournament)
    db.commit()
    return None


# ===========================================================================
# Tournament Status Transition
# ===========================================================================

VALID_STATUS_TRANSITIONS = {
    "UPCOMING": ["ACTIVE", "CANCELLED"],
    "ACTIVE":   ["COMPLETED", "CANCELLED"],
    "COMPLETED": [],
    "CANCELLED": [],
}

class TournamentStatusUpdate:
    """Pydantic-free helper (used inline via Body)."""
    pass

from pydantic import BaseModel

class StatusUpdateIn(BaseModel):
    new_status: str


@router.put("/{id}/status", response_model=TournamentOut)
def change_tournament_status(
    id: int,
    body: StatusUpdateIn,
    db: Session = Depends(get_db),
    current_user = Depends(RoleChecker(["ADMIN"]))
):
    """
    Chuyển trạng thái Tournament.
    - UPCOMING → ACTIVE → COMPLETED | CANCELLED
    - Khi chuyển sang COMPLETED, tự động chạy logic trao giải (Awards).
    """
    tournament = db.query(Tournament).filter(Tournament.id == id).first()
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")

    new_status = body.new_status.upper()
    current_status = (tournament.status or "UPCOMING").upper()

    allowed = VALID_STATUS_TRANSITIONS.get(current_status, [])
    if new_status not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Không thể chuyển từ '{current_status}' sang '{new_status}'. "
                   f"Trạng thái hợp lệ tiếp theo: {allowed}"
        )

    tournament.status = new_status

    # ----- Tự động trao giải khi COMPLETED -----
    if new_status == "COMPLETED":
        _auto_award(db, tournament)

    db.commit()
    db.refresh(tournament)
    return tournament


# ===========================================================================
# Auto-Award Logic (nội bộ)
# ===========================================================================

def _auto_award(db: Session, tournament: Tournament) -> None:
    """
    Tính tổng điểm cho mỗi Registration trong tournament và
    trao giải cho các hạng tương ứng với Prizes đã định nghĩa.
    """
    prizes = (
        db.query(Prize)
        .filter(Prize.tournament_id == tournament.id)
        .order_by(Prize.position)
        .all()
    )
    if not prizes:
        return  # Không có prize nào được thiết lập → bỏ qua

    # Lấy tổng điểm theo từng registration trong tournament
    rows = db.execute(text("""
        SELECT reg.id AS registration_id, COALESCE(SUM(res.points), 0) AS total_points
        FROM Registrations reg
        JOIN RaceParticipants rp ON rp.registration_id = reg.id
        JOIN Results res ON res.race_participant_id = rp.id
        WHERE reg.tournament_id = :tid
          AND reg.status = 'APPROVED'
        GROUP BY reg.id
        ORDER BY total_points DESC
    """), {"tid": tournament.id}).fetchall()

    # Nếu không có kết quả nào, xếp hạng dựa trên registrations đã approved
    if not rows:
        approved_regs = (
            db.query(Registration)
            .filter(
                Registration.tournament_id == tournament.id,
                Registration.status == "APPROVED"
            )
            .all()
        )
        rows = [(r.id, 0) for r in approved_regs]

    # Xóa awards cũ của tournament này (nếu có – re-run safe)
    old_awards = (
        db.query(Award)
        .join(Prize)
        .filter(Prize.tournament_id == tournament.id)
        .all()
    )
    for aw in old_awards:
        db.delete(aw)

    # Trao giải
    now = get_vietnam_now_naive()
    for prize in prizes:
        idx = prize.position - 1  # 0-based index
        if idx >= len(rows):
            break  # Không đủ số người để trao giải này

        reg_id, total_pts = rows[idx]
        award = Award(
            prize_id=prize.id,
            registration_id=reg_id,
            awarded_at=now,
            total_points=int(total_pts),
            notes=f"Tự động trao giải khi tournament '{tournament.name}' hoàn thành."
        )
        db.add(award)


# ===========================================================================
# Prizes CRUD – /tournaments/{id}/prizes
# ===========================================================================

@router.get("/{id}/prizes", response_model=List[PrizeOut])
def get_prizes(id: int, db: Session = Depends(get_db)):
    """Lấy danh sách giải thưởng của tournament (public)."""
    tournament = db.query(Tournament).filter(Tournament.id == id).first()
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")

    prizes = (
        db.query(Prize)
        .filter(Prize.tournament_id == id)
        .order_by(Prize.position)
        .all()
    )

    result = []
    for p in prizes:
        item = PrizeOut.model_validate(p)
        if p.award:
            reg = p.award.registration
            item.awarded_to_horse = reg.horse.name
            item.awarded_to_jockey = reg.jockey.user.full_name
            item.awarded_total_points = p.award.total_points
        result.append(item)
    return result


@router.post("/{id}/prizes", response_model=PrizeOut, status_code=status.HTTP_201_CREATED)
def create_prize(
    id: int,
    prize_in: PrizeCreate,
    db: Session = Depends(get_db),
    current_user = Depends(RoleChecker(["ADMIN"]))
):
    """Tạo giải thưởng mới cho tournament (Admin only)."""
    tournament = db.query(Tournament).filter(Tournament.id == id).first()
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")

    if tournament.status == "COMPLETED":
        raise HTTPException(
            status_code=400,
            detail="Không thể thêm giải thưởng cho tournament đã hoàn thành"
        )

    # Kiểm tra trùng position
    dup = db.query(Prize).filter(
        Prize.tournament_id == id,
        Prize.position == prize_in.position
    ).first()
    if dup:
        raise HTTPException(
            status_code=400,
            detail=f"Đã tồn tại giải thưởng cho hạng {prize_in.position} trong tournament này"
        )

    prize = Prize(
        tournament_id=id,
        position=prize_in.position,
        title=prize_in.title,
        prize_value=prize_in.prize_value,
        description=prize_in.description
    )
    db.add(prize)
    db.commit()
    db.refresh(prize)
    return PrizeOut.model_validate(prize)


@router.put("/{id}/prizes/{prize_id}", response_model=PrizeOut)
def update_prize(
    id: int,
    prize_id: int,
    prize_in: PrizeUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(RoleChecker(["ADMIN"]))
):
    """Cập nhật thông tin giải thưởng (Admin only)."""
    tournament = db.query(Tournament).filter(Tournament.id == id).first()
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")

    if tournament.status == "COMPLETED":
        raise HTTPException(
            status_code=400,
            detail="Không thể sửa giải thưởng của tournament đã hoàn thành"
        )

    prize = db.query(Prize).filter(
        Prize.id == prize_id,
        Prize.tournament_id == id
    ).first()
    if not prize:
        raise HTTPException(status_code=404, detail="Prize not found")

    # Kiểm tra trùng position (nếu đổi)
    if prize_in.position is not None and prize_in.position != prize.position:
        dup = db.query(Prize).filter(
            Prize.tournament_id == id,
            Prize.position == prize_in.position,
            Prize.id != prize_id
        ).first()
        if dup:
            raise HTTPException(
                status_code=400,
                detail=f"Đã tồn tại giải thưởng cho hạng {prize_in.position}"
            )
        prize.position = prize_in.position

    if prize_in.title is not None:
        prize.title = prize_in.title
    if prize_in.prize_value is not None:
        prize.prize_value = prize_in.prize_value
    if prize_in.description is not None:
        prize.description = prize_in.description

    db.commit()
    db.refresh(prize)
    return PrizeOut.model_validate(prize)


@router.delete("/{id}/prizes/{prize_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_prize(
    id: int,
    prize_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(RoleChecker(["ADMIN"]))
):
    """Xóa giải thưởng (Admin only). Không thể xóa nếu đã trao giải."""
    tournament = db.query(Tournament).filter(Tournament.id == id).first()
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")

    prize = db.query(Prize).filter(
        Prize.id == prize_id,
        Prize.tournament_id == id
    ).first()
    if not prize:
        raise HTTPException(status_code=404, detail="Prize not found")

    if prize.award:
        raise HTTPException(
            status_code=400,
            detail="Không thể xóa giải thưởng đã được trao. Hãy đổi status tournament trước."
        )

    db.delete(prize)
    db.commit()
    return None


# ===========================================================================
# Awards – xem danh sách giải đã trao của tournament
# ===========================================================================

@router.get("/{id}/awards", response_model=List[AwardOut])
def get_awards(id: int, db: Session = Depends(get_db)):
    """Lấy danh sách giải đã được trao của tournament (public)."""
    tournament = db.query(Tournament).filter(Tournament.id == id).first()
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")

    awards = (
        db.query(Award)
        .join(Prize)
        .filter(Prize.tournament_id == id)
        .order_by(Prize.position)
        .all()
    )

    result = []
    for aw in awards:
        item = AwardOut.model_validate(aw)
        item.prize_title = aw.prize.title
        item.prize_position = aw.prize.position
        item.prize_value = aw.prize.prize_value
        item.horse_name = aw.registration.horse.name
        item.jockey_name = aw.registration.jockey.user.full_name
        result.append(item)
    return result
