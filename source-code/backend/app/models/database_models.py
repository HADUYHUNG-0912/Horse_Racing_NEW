import datetime
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Date, Numeric, Text, Boolean, Unicode, UnicodeText
from sqlalchemy.orm import relationship
from app.core.database import Base

class Role(Base):
    __tablename__ = 'Roles'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False, unique=True)
    
    users = relationship("User", back_populates="role")

class User(Base):
    __tablename__ = 'Users'
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), nullable=False, unique=True)
    password_hash = Column(String(255), nullable=False)
    email = Column(String(100), nullable=False, unique=True)
    full_name = Column(Unicode(100), nullable=False)
    phone_number = Column(String(20), nullable=True)
    avatar = Column(String(255), nullable=True)
    role_id = Column(Integer, ForeignKey('Roles.id'), nullable=False)
    is_active = Column(Boolean, default=True)
    
    role = relationship("Role", back_populates="users")
    
    jockey_profile = relationship("JockeyProfile", uselist=False, back_populates="user", cascade="all, delete-orphan")
    owner_profile = relationship("HorseOwnerProfile", uselist=False, back_populates="user", cascade="all, delete-orphan")
    referee_profile = relationship("RefereeProfile", uselist=False, back_populates="user", cascade="all, delete-orphan")
    spectator_profile = relationship("SpectatorProfile", uselist=False, back_populates="user", cascade="all, delete-orphan")
    predictions = relationship("Prediction", back_populates="user", cascade="all, delete-orphan")

class JockeyProfile(Base):
    __tablename__ = 'JockeyProfiles'
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('Users.id', ondelete="CASCADE"), nullable=False, unique=True)
    bio = Column(UnicodeText, nullable=True)
    weight = Column(Numeric(5, 2), nullable=True)
    height = Column(Numeric(5, 2), nullable=True)
    experience_years = Column(Integer, default=0)
    
    user = relationship("User", back_populates="jockey_profile")
    registrations = relationship("Registration", back_populates="jockey")
    invitations = relationship("JockeyInvitation", back_populates="jockey")

class HorseOwnerProfile(Base):
    __tablename__ = 'HorseOwnerProfiles'
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('Users.id', ondelete="CASCADE"), nullable=False, unique=True)
    company_name = Column(Unicode(100), nullable=True)
    
    user = relationship("User", back_populates="owner_profile")
    horses = relationship("Horse", back_populates="owner", cascade="all, delete-orphan")
    invitations = relationship("JockeyInvitation", back_populates="owner")

class RefereeProfile(Base):
    __tablename__ = 'RefereeProfiles'
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('Users.id', ondelete="CASCADE"), nullable=False, unique=True)
    certification_level = Column(Unicode(50), nullable=True)
    
    user = relationship("User", back_populates="referee_profile")
    races = relationship("Race", back_populates="referee")

class SpectatorProfile(Base):
    __tablename__ = 'SpectatorProfiles'
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('Users.id', ondelete="CASCADE"), nullable=False, unique=True)
    favorite_horse_breed = Column(Unicode(50), nullable=True)
    favorite_jockey = Column(Unicode(100), nullable=True)
    gender = Column(Unicode(20), nullable=True)
    reward_points = Column(Integer, default=0, nullable=False)
    
    user = relationship("User", back_populates="spectator_profile")

    def earnRewardPoints(self, points: int = 10):
        if self.reward_points is None:
            self.reward_points = 0
        self.reward_points += points

class Horse(Base):
    __tablename__ = 'Horses'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(Unicode(100), nullable=False)
    age = Column(Integer, nullable=False)
    breed = Column(Unicode(100), nullable=False)
    gender = Column(String(10), nullable=False)
    owner_id = Column(Integer, ForeignKey('HorseOwnerProfiles.id', ondelete="CASCADE"), nullable=False)
    
    owner = relationship("HorseOwnerProfile", back_populates="horses")
    registrations = relationship("Registration", back_populates="horse")
    invitations = relationship("JockeyInvitation", back_populates="horse")

class Tournament(Base):
    __tablename__ = 'Tournaments'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(Unicode(150), nullable=False)
    description = Column(UnicodeText, nullable=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    location = Column(Unicode(150), nullable=True)
    status = Column(String(50), default="UPCOMING") # UPCOMING, ACTIVE, COMPLETED
    
    rounds = relationship("Round", back_populates="tournament", cascade="all, delete-orphan")
    registrations = relationship("Registration", back_populates="tournament", cascade="all, delete-orphan")
    invitations = relationship("JockeyInvitation", back_populates="tournament", cascade="all, delete-orphan")

class Round(Base):
    __tablename__ = 'Rounds'
    
    id = Column(Integer, primary_key=True, index=True)
    tournament_id = Column(Integer, ForeignKey('Tournaments.id', ondelete="CASCADE"), nullable=False)
    name = Column(Unicode(100), nullable=False)
    sequence = Column(Integer, nullable=False)
    
    tournament = relationship("Tournament", back_populates="rounds")
    races = relationship("Race", back_populates="round", cascade="all, delete-orphan")

class Race(Base):
    __tablename__ = 'Races'
    
    id = Column(Integer, primary_key=True, index=True)
    round_id = Column(Integer, ForeignKey('Rounds.id', ondelete="CASCADE"), nullable=False)
    name = Column(Unicode(100), nullable=False)
    race_time = Column(DateTime, nullable=False)
    track_condition = Column(Unicode(100), nullable=True)
    distance = Column(Integer, nullable=False) # in meters
    referee_id = Column(Integer, ForeignKey('RefereeProfiles.id', ondelete="SET NULL"), nullable=True)
    status = Column(String(50), default="SCHEDULED") # SCHEDULED, RUNNING, COMPLETED
    
    round = relationship("Round", back_populates="races")
    referee = relationship("RefereeProfile", back_populates="races")
    participants = relationship("RaceParticipant", back_populates="race", cascade="all, delete-orphan")
    inspection = relationship("RaceInspection", uselist=False, back_populates="race", cascade="all, delete-orphan")

class Registration(Base):
    __tablename__ = 'Registrations'
    
    id = Column(Integer, primary_key=True, index=True)
    tournament_id = Column(Integer, ForeignKey('Tournaments.id', ondelete="CASCADE"), nullable=False)
    horse_id = Column(Integer, ForeignKey('Horses.id'), nullable=False)
    jockey_id = Column(Integer, ForeignKey('JockeyProfiles.id'), nullable=False)
    status = Column(String(50), default="PENDING") # PENDING, APPROVED, REJECTED
    registration_date = Column(DateTime, default=datetime.datetime.utcnow)
    
    tournament = relationship("Tournament", back_populates="registrations")
    horse = relationship("Horse", back_populates="registrations")
    jockey = relationship("JockeyProfile", back_populates="registrations")
    race_participants = relationship("RaceParticipant", back_populates="registration", cascade="all, delete-orphan")

class JockeyInvitation(Base):
    __tablename__ = 'JockeyInvitations'
    
    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey('HorseOwnerProfiles.id'), nullable=False)
    jockey_id = Column(Integer, ForeignKey('JockeyProfiles.id'), nullable=False)
    horse_id = Column(Integer, ForeignKey('Horses.id'), nullable=False)
    tournament_id = Column(Integer, ForeignKey('Tournaments.id'), nullable=False)
    message = Column(UnicodeText, nullable=True)
    status = Column(String(50), default="PENDING") # PENDING, ACCEPTED, REJECTED
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    owner = relationship("HorseOwnerProfile", back_populates="invitations")
    jockey = relationship("JockeyProfile", back_populates="invitations")
    horse = relationship("Horse", back_populates="invitations")
    tournament = relationship("Tournament", back_populates="invitations")

class RaceParticipant(Base):
    __tablename__ = 'RaceParticipants'
    
    id = Column(Integer, primary_key=True, index=True)
    race_id = Column(Integer, ForeignKey('Races.id', ondelete="CASCADE"), nullable=False)
    registration_id = Column(Integer, ForeignKey('Registrations.id'), nullable=False)
    lane_number = Column(Integer, nullable=False)
    start_time = Column(DateTime, nullable=True)
    finish_time = Column(DateTime, nullable=True)
    status = Column(String(50), default="REGISTERED") # REGISTERED, FINISHED, DNF, DISQUALIFIED
    
    race = relationship("Race", back_populates="participants")
    registration = relationship("Registration", back_populates="race_participants")
    result = relationship("Result", uselist=False, back_populates="participant", cascade="all, delete-orphan")
    violations = relationship("Violation", back_populates="participant", cascade="all, delete-orphan")
    predictions = relationship("Prediction", back_populates="participant", cascade="all, delete-orphan")

class Result(Base):
    __tablename__ = 'Results'
    
    id = Column(Integer, primary_key=True, index=True)
    race_participant_id = Column(Integer, ForeignKey('RaceParticipants.id', ondelete="CASCADE"), nullable=False, unique=True)
    rank = Column(Integer, nullable=False)
    points = Column(Integer, nullable=False, default=0)
    notes = Column(UnicodeText, nullable=True)
    
    participant = relationship("RaceParticipant", back_populates="result")

class Violation(Base):
    __tablename__ = 'Violations'
    
    id = Column(Integer, primary_key=True, index=True)
    race_participant_id = Column(Integer, ForeignKey('RaceParticipants.id', ondelete="CASCADE"), nullable=False)
    description = Column(UnicodeText, nullable=False)
    penalty = Column(Unicode(100), nullable=True)
    fine_amount = Column(Numeric(10, 2), default=0.00)
    violation_date = Column(DateTime, default=datetime.datetime.utcnow)
    
    participant = relationship("RaceParticipant", back_populates="violations")

class Ranking(Base):
    __tablename__ = 'Rankings'
    
    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(String(20), nullable=False) # 'HORSE' or 'JOCKEY'
    entity_id = Column(Integer, nullable=False)
    points = Column(Integer, nullable=False, default=0)
    rank = Column(Integer, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)

class Prediction(Base):
    __tablename__ = 'Predictions'
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('Users.id', ondelete="CASCADE"), nullable=False)
    race_participant_id = Column(Integer, ForeignKey('RaceParticipants.id'), nullable=False)
    predicted_rank = Column(Integer, nullable=False)
    prediction_date = Column(DateTime, default=datetime.datetime.utcnow)
    status = Column(String(50), default="PENDING") # PENDING, Won, Lost
    
    user = relationship("User", back_populates="predictions")
    participant = relationship("RaceParticipant", back_populates="predictions")

class RaceInspection(Base):
    __tablename__ = 'RaceInspections'
    
    id = Column(Integer, primary_key=True, index=True)
    race_id = Column(Integer, ForeignKey('Races.id', ondelete="CASCADE"), nullable=False, unique=True)
    weather = Column(Unicode(255), nullable=True)
    track_condition = Column(Unicode(255), nullable=True)
    horse_health = Column(UnicodeText, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    race = relationship("Race", back_populates="inspection")
