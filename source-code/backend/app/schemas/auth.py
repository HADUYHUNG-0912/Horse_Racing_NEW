from typing import Optional, List
from pydantic import BaseModel, EmailStr

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenPayload(BaseModel):
    sub: Optional[str] = None

# Profiles schemas
class JockeyProfileBase(BaseModel):
    bio: Optional[str] = None
    weight: Optional[float] = None
    height: Optional[float] = None
    experience_years: Optional[int] = 0

class JockeyProfileCreate(JockeyProfileBase):
    pass

class JockeyProfileUpdate(JockeyProfileBase):
    pass

class JockeyProfileOut(JockeyProfileBase):
    id: int
    user_id: int
    username: Optional[str] = None
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None

    class Config:
        from_attributes = True

class OwnerProfileBase(BaseModel):
    company_name: Optional[str] = None

class OwnerProfileCreate(OwnerProfileBase):
    pass

class OwnerProfileOut(OwnerProfileBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True

class RefereeProfileBase(BaseModel):
    certification_level: Optional[str] = None

class RefereeProfileCreate(RefereeProfileBase):
    pass

class RefereeProfileOut(RefereeProfileBase):
    id: int
    user_id: int
    full_name: Optional[str] = None

    class Config:
        from_attributes = True

class SpectatorProfileBase(BaseModel):
    favorite_horse_breed: Optional[str] = None
    reward_points: int = 0

class SpectatorProfileCreate(SpectatorProfileBase):
    pass

class SpectatorProfileOut(SpectatorProfileBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True

class SpectatorProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    favorite_horse_breed: Optional[str] = None
    favorite_jockey: Optional[str] = None
    phone_number: Optional[str] = None
    avatar: Optional[str] = None

class SpectatorProfileDetailOut(BaseModel):
    id: int
    username: str
    email: str
    full_name: str
    phone_number: Optional[str] = None
    avatar: Optional[str] = None
    favorite_horse_breed: Optional[str] = None
    favorite_jockey: Optional[str] = None
    reward_points: int
    current_rank: Optional[int] = None
    total_predictions: Optional[int] = 0
    correct_predictions: Optional[int] = 0
    accuracy_rate: Optional[float] = 0.0

    class Config:
        from_attributes = True

# User schemas
class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: str

class UserCreate(UserBase):
    password: str
    role_name: str  # ADMIN, REFEREE, JOCKEY, OWNER, SPECTATOR
    # Profile fields (optional depending on role)
    bio: Optional[str] = None
    weight: Optional[float] = None
    height: Optional[float] = None
    experience_years: Optional[int] = 0
    company_name: Optional[str] = None
    certification_level: Optional[str] = None
    favorite_horse_breed: Optional[str] = None

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    password: Optional[str] = None

class UserStatusUpdate(BaseModel):
    is_active: bool

class UserRoleUpdate(BaseModel):
    role_id: int

class UserOut(UserBase):
    id: int
    role_id: int
    role_name: Optional[str] = None
    is_active: bool
    
    jockey_profile: Optional[JockeyProfileOut] = None
    owner_profile: Optional[OwnerProfileOut] = None
    referee_profile: Optional[RefereeProfileOut] = None
    spectator_profile: Optional[SpectatorProfileOut] = None

    class Config:
        from_attributes = True
