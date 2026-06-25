import os

def load_dotenv():
    for path in [".env", "source-code/backend/.env", "../.env", "../../.env"]:
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        key, val = line.split("=", 1)
                        os.environ[key.strip()] = val.strip().strip("'\"")
            break

load_dotenv()

class Settings:
    PROJECT_NAME: str = "Horse Racing Tournament Management System"
    API_V1_STR: str = "/api/v1"
    
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-key-change-in-production-1234567890")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # SQLEXPRESS connection string cho máy của bạn
    # Sử dụng dấu gạch chéo xuôi '/' để Python không bao giờ bị lỗi đọc chuỗi (bản chất SQL Server hiểu tốt cả / và \)
    SQL_SERVER_HOST: str = os.getenv("SQL_SERVER_HOST", r"(localdb)\MSSQLLocalDB")
    SQL_SERVER_DB: str = os.getenv("SQL_SERVER_DB", "HorseRacing")
   
    @property
    def DATABASE_URL(self) -> str:
        # Standard connection string for SQLAlchemy with pyodbc
        connection_uri = (
            f"mssql+pyodbc://{self.SQL_SERVER_HOST}/{self.SQL_SERVER_DB}"
            "?driver=ODBC+Driver+17+for+SQL+Server"
            "&trusted_connection=yes"
            "&Encrypt=no"
            "&TrustServerCertificate=yes"
        )
        return connection_uri

settings = Settings()