from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.v1 import auth, horses, jockeys, tournaments, races, results, spectators, admin, referees, owners

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Set up CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify front-end domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(horses.router, prefix=f"{settings.API_V1_STR}/horses", tags=["horses"])
app.include_router(jockeys.router, prefix=f"{settings.API_V1_STR}/jockeys", tags=["jockeys"])
app.include_router(owners.router, prefix=f"{settings.API_V1_STR}/owners", tags=["owners"])
app.include_router(tournaments.router, prefix=f"{settings.API_V1_STR}/tournaments", tags=["tournaments"])
app.include_router(races.router, prefix=f"{settings.API_V1_STR}/races", tags=["races"])
app.include_router(results.router, prefix=f"{settings.API_V1_STR}/results", tags=["results"])
app.include_router(spectators.router, prefix=f"{settings.API_V1_STR}/spectators", tags=["spectators"])
app.include_router(admin.router, prefix=f"{settings.API_V1_STR}/admin", tags=["admin"])
app.include_router(referees.router, prefix=f"{settings.API_V1_STR}/referees", tags=["referees"])

@app.get("/")
def root():
    return {"message": "Welcome to the Horse Racing Tournament Management System API"}
