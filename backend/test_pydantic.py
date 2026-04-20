from pydantic_settings import BaseSettings
import os
from dotenv import load_dotenv

class Settings(BaseSettings):
    backend_cors_origins: list[str] = ["http://localhost:3000"]
    database_url: str = "placeholder"
    jwt_secret: str = "secret"

    class Config:
        env_file = ".env"

try:
    load_dotenv()
    settings = Settings()
    print(f"CORS Origins: {settings.backend_cors_origins}")
    print(f"Type: {type(settings.backend_cors_origins)}")
except Exception as e:
    print(f"Error: {e}")
