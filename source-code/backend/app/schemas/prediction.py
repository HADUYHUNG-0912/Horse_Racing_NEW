from typing import Optional
from datetime import datetime
from pydantic import BaseModel

# Prediction schemas
class PredictionBase(BaseModel):
    predicted_rank: int

class PredictionCreate(PredictionBase):
    race_id: int
    horse_id: int

class PredictionUpdate(BaseModel):
    predicted_rank: int

class PredictionOut(PredictionBase):
    id: int
    user_id: int
    race_participant_id: int
    prediction_date: datetime
    status: str # PENDING, Won, Lost
    race_id: Optional[int] = None
    horse_id: Optional[int] = None
    horse_name: Optional[str] = None
    jockey_name: Optional[str] = None
    race_name: Optional[str] = None

    class Config:
        from_attributes = True
