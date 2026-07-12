from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, Literal, Optional, List
from pydantic import BaseModel, EmailStr

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenPayload(BaseModel):
    sub: Optional[str] = None

    model_config = {"extra": "ignore"}

# Profiles schemas
class JockeyProfileBase(BaseModel):
    bio: Optional[str] = None
    weight: Optional[float] = None
    height: Optional[float] = None
    experience_years: Optional[int] = 0
    phone: Optional[str] = None
    gender: Optional[str] = None

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

    model_config = {"from_attributes": True, "arbitrary_types_allowed": True}

class OwnerProfileBase(BaseModel):
    company_name: Optional[str] = None
    age: Optional[int] = None
    experience_years: Optional[int] = 0
    occupation: Optional[str] = None
    address: Optional[str] = None
    nationality: Optional[str] = None
    social_link: Optional[str] = None
    bio: Optional[str] = None

class OwnerProfileCreate(OwnerProfileBase):
    pass

class OwnerProfileOut(OwnerProfileBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True

class OwnerProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    avatar: Optional[str] = None
    company_name: Optional[str] = None
    age: Optional[int] = None
    experience_years: Optional[int] = None
    occupation: Optional[str] = None
    address: Optional[str] = None
    nationality: Optional[str] = None
    social_link: Optional[str] = None
    bio: Optional[str] = None

class OwnerProfileDetailOut(OwnerProfileBase):
    id: int
    user_id: int
    full_name: str
    email: EmailStr
    phone_number: Optional[str] = None
    avatar: Optional[str] = None
    company_name: Optional[str] = None
    age: Optional[int] = None
    experience_years: Optional[int] = 0
    occupation: Optional[str] = None
    address: Optional[str] = None
    nationality: Optional[str] = None
    social_link: Optional[str] = None
    bio: Optional[str] = None

    class Config:
        from_attributes = True

class OwnerUpcomingRace(BaseModel):
    race_id: int
    race_name: str
    horse_name: str
    tournament_name: str
    race_date: datetime
    location: Optional[str] = None

    class Config:
        from_attributes = True

class OwnerResultHistory(BaseModel):
    id: int
    rank: Optional[int] = None
    points: Optional[int] = None
    notes: Optional[str] = None
    horse_name: str
    race_name: str
    tournament_name: str
    race_date: datetime
    violations: Optional[str] = None
    violation_count: int = 0

    class Config:
        from_attributes = True

class OwnerAwardOut(BaseModel):
    tournament_name: str
    horse_name: str
    jockey_name: str
    rank: int
    title: str
    prize_value: Optional[Decimal] = None
    notes: Optional[str] = None

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
    gender: Optional[str] = None

class SpectatorProfileDetailOut(BaseModel):
    id: int
    username: str
    email: str
    full_name: str
    phone_number: Optional[str] = None
    avatar: Optional[str] = None
    favorite_horse_breed: Optional[str] = None
    favorite_jockey: Optional[str] = None
    gender: Optional[str] = None
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
    role_name: Literal["SPECTATOR", "OWNER", "JOCKEY", "REFEREE"]  # Public registration - no ADMIN/ORGANIZER
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


# ── Phase 5 — Admin/Auth schemas ──────────────────────────────────────────────

class PasswordChangeIn(BaseModel):
    """Schema cho tính năng đổi mật khẩu (Phase 5 — Tính năng 1.1)."""
    old_password: str
    new_password: str


class UserDetailOut(BaseModel):
    """Schema chi tiết người dùng bao gồm profile theo role (Phase 5 — Tính năng 1.2)."""
    id: int
    username: str
    email: EmailStr
    full_name: str
    phone_number: Optional[str] = None
    avatar: Optional[str] = None
    role_id: int
    role_name: Optional[str] = None
    is_active: bool
    created_at: Optional[datetime] = None
    profile: Optional[Dict[str, Any]] = None

    model_config = {"from_attributes": True, "arbitrary_types_allowed": True}


class AdminUserCreate(BaseModel):
    """Schema tạo tài khoản Admin/Organizer nội bộ (chỉ ADMIN mới dùng được)."""
    username: str
    email: EmailStr
    full_name: str
    password: str
    role_name: Literal["ADMIN", "ORGANIZER"]
