from typing import Optional
from datetime import datetime
from pydantic import BaseModel

# Result schemas
class ResultBase(BaseModel):
    race_participant_id: int
    rank: int
    points: int
    notes: Optional[str] = None

class ResultCreate(ResultBase):
    pass

class ResultOut(ResultBase):
    id: int
    horse_name: Optional[str] = None
    jockey_name: Optional[str] = None

    class Config:
        from_attributes = True

# Violation schemas
class ViolationBase(BaseModel):
    race_participant_id: int
    description: str
    penalty: Optional[str] = None
    fine_amount: Optional[float] = 0.0

class ViolationCreate(ViolationBase):
    pass

class ViolationOut(ViolationBase):
    id: int
    violation_date: datetime
    horse_name: Optional[str] = None
    jockey_name: Optional[str] = None

    class Config:
        from_attributes = True

# Ranking schemas
class RankingOut(BaseModel):
    id: int
    entity_type: str # 'HORSE' or 'JOCKEY'
    entity_id: int
    entity_name: Optional[str] = None
    points: int
    rank: int
    updated_at: datetime

    class Config:
        from_attributes = True
