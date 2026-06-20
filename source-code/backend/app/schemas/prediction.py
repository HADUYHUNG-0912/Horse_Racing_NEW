from typing import Optional
from datetime import datetime
from pydantic import BaseModel

# Prediction schemas
class PredictionBase(BaseModel):
    race_participant_id: int
    predicted_rank: int

class PredictionCreate(PredictionBase):
    pass

class PredictionOut(PredictionBase):
    id: int
    user_id: int
    prediction_date: datetime
    status: str # PENDING, CORRECT, INCORRECT
    horse_name: Optional[str] = None
    jockey_name: Optional[str] = None
    race_name: Optional[str] = None

    class Config:
        from_attributes = True
