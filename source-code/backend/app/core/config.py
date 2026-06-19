import os

class Settings:
    PROJECT_NAME: str = "Horse Racing Tournament Management System"
    API_V1_STR: str = "/api/v1"
    
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-key-change-in-production-1234567890")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # SQLEXPRESS connection string
    # We use mssql+pyodbc with SQL Server driver
    SQL_SERVER_HOST: str = os.getenv("SQL_SERVER_HOST", "localhost")
    SQL_SERVER_DB: str = os.getenv("SQL_SERVER_DB", "HorseRacing")
    
    @property
    def DATABASE_URL(self) -> str:
        # Standard connection string for SQLAlchemy with pyodbc
        # We need Encrypt=no and TrustServerCertificate=yes for local SQLEXPRESS development
        connection_uri = (
            f"mssql+pyodbc://@{self.SQL_SERVER_HOST}/{self.SQL_SERVER_DB}"
            "?driver=ODBC+Driver+17+for+SQL+Server"
            "&trusted_connection=yes"
            "&Encrypt=no"
            "&TrustServerCertificate=yes"
        )
        return connection_uri

settings = Settings()
