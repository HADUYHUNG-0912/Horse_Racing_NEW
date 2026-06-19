from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel

# Race Participant schemas
class RaceParticipantBase(BaseModel):
    registration_id: int
    lane_number: int

class RaceParticipantCreate(RaceParticipantBase):
    pass

class RaceParticipantUpdate(BaseModel):
    start_time: Optional[datetime] = None
    finish_time: Optional[datetime] = None
    status: Optional[str] = None # REGISTERED, FINISHED, DNF, DISQUALIFIED

class RaceParticipantOut(RaceParticipantBase):
    id: int
    race_id: int
    start_time: Optional[datetime] = None
    finish_time: Optional[datetime] = None
    status: str
    horse_name: Optional[str] = None
    jockey_name: Optional[str] = None
    horse_id: Optional[int] = None

    class Config:
        from_attributes = True

# Race schemas
class RaceBase(BaseModel):
    name: str
    race_time: datetime
    track_condition: Optional[str] = None
    distance: int # in meters
    referee_id: Optional[int] = None
    status: Optional[str] = "SCHEDULED" # SCHEDULED, RUNNING, COMPLETED

class RaceCreate(RaceBase):
    pass

class RaceUpdate(BaseModel):
    name: Optional[str] = None
    race_time: Optional[datetime] = None
    track_condition: Optional[str] = None
    distance: Optional[int] = None
    referee_id: Optional[int] = None
    status: Optional[str] = None

class RaceOut(RaceBase):
    id: int
    round_id: int
    referee_name: Optional[str] = None
    participants: List[RaceParticipantOut] = []

    class Config:
        from_attributes = True
