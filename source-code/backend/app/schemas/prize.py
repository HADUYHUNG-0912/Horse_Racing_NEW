from typing import Optional
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Prize schemas
# ---------------------------------------------------------------------------

class PrizeBase(BaseModel):
    position: int = Field(..., ge=1, description="Hạng được trao giải (1 = nhất, 2 = nhì, ...)")
    title: str = Field(..., max_length=100, description="Tên giải thưởng")
    prize_value: Optional[Decimal] = Field(default=Decimal("0.00"), description="Giá trị giải thưởng")
    description: Optional[str] = None


class PrizeCreate(PrizeBase):
    pass


class PrizeUpdate(BaseModel):
    position: Optional[int] = Field(default=None, ge=1)
    title: Optional[str] = Field(default=None, max_length=100)
    prize_value: Optional[Decimal] = None
    description: Optional[str] = None


class PrizeOut(PrizeBase):
    id: int
    tournament_id: int
    created_at: datetime

    # Thông tin award đã được trao (nếu có)
    awarded_to_horse: Optional[str] = None      # tên ngựa được nhận giải
    awarded_to_jockey: Optional[str] = None     # tên jockey được nhận giải
    awarded_total_points: Optional[int] = None  # tổng điểm khi nhận giải

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Award schemas
# ---------------------------------------------------------------------------

class AwardOut(BaseModel):
    id: int
    prize_id: int
    registration_id: int
    awarded_at: datetime
    total_points: int
    notes: Optional[str] = None

    # Thông tin prize
    prize_title: Optional[str] = None
    prize_position: Optional[int] = None
    prize_value: Optional[Decimal] = None

    # Thông tin registration
    horse_name: Optional[str] = None
    jockey_name: Optional[str] = None

    class Config:
        from_attributes = True
