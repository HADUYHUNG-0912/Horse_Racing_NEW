from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Create engine with pre-ping to verify connections are still active
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    # SQL Server doesn't support pool_recycle or other settings in the same way, pool_pre_ping is enough
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
