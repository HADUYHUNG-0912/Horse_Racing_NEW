from typing import Optional
from datetime import datetime
from pydantic import BaseModel

# Horse schemas
class HorseBase(BaseModel):
    name: str
    age: int
    breed: str
    gender: str

class HorseCreate(HorseBase):
    pass

class HorseUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    breed: Optional[str] = None
    gender: Optional[str] = None

class HorseOut(HorseBase):
    id: int
    owner_id: int

    class Config:
        from_attributes = True

# Jockey Invitation schemas
class JockeyInvitationBase(BaseModel):
    jockey_id: int
    horse_id: int
    tournament_id: int
    message: Optional[str] = None

class JockeyInvitationCreate(JockeyInvitationBase):
    pass

class JockeyInvitationUpdate(BaseModel):
    status: str # ACCEPTED, REJECTED

class JockeyInvitationOut(JockeyInvitationBase):
    id: int
    owner_id: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
