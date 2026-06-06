from typing import Optional, List
from datetime import date, datetime
from pydantic import BaseModel

# Round schemas
class RoundBase(BaseModel):
    name: str
    sequence: int

class RoundCreate(RoundBase):
    pass

class RoundOut(RoundBase):
    id: int
    tournament_id: int

    class Config:
        from_attributes = True

# Tournament schemas
class TournamentBase(BaseModel):
    name: str
    description: Optional[str] = None
    start_date: date
    end_date: date
    location: Optional[str] = None
    status: Optional[str] = "UPCOMING" # UPCOMING, ACTIVE, COMPLETED

class TournamentCreate(TournamentBase):
    pass

class TournamentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    location: Optional[str] = None
    status: Optional[str] = None

class TournamentOut(TournamentBase):
    id: int
    rounds: List[RoundOut] = []

    class Config:
        from_attributes = True

# Registration schemas
class RegistrationBase(BaseModel):
    tournament_id: int
    horse_id: int
    jockey_id: int

class RegistrationCreate(RegistrationBase):
    pass

class RegistrationUpdate(BaseModel):
    status: str # PENDING, APPROVED, REJECTED

class RegistrationOut(RegistrationBase):
    id: int
    status: str
    registration_date: datetime
    horse_name: Optional[str] = None
    jockey_name: Optional[str] = None

    class Config:
        from_attributes = True
