from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.database_models import RefereeProfile
from app.schemas.auth import RefereeProfileOut

router = APIRouter()

@router.get("/", response_model=List[RefereeProfileOut])
def read_referees(db: Session = Depends(get_db)):
    referees = db.query(RefereeProfile).all()
    for ref in referees:
        ref.full_name = ref.user.full_name if ref.user else None
    return referees
