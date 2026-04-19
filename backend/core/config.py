from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    backend_cors_origins: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    database_url: str
    jwt_secret: str
    jwt_expires_in: int = 7 * 24 * 60 * 60  # 7 days in seconds by default

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()
