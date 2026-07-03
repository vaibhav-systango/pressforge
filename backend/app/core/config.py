from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

BASE_DIR = Path(__file__).resolve().parents[2]

class Settings(BaseSettings):
    PROJECT_NAME: str = "Pressforge API"
    API_V1_STR: str = "/api/v1"
    
    # Database Configuration
    DATABASE_URL: str = Field(
        default="postgresql://postgres:postgres@localhost:5432/pressforge",
        description="PostgreSQL Database Connection URI"
    )

    # JWT Configuration
    JWT_SECRET: str = Field(
        default="your-super-secret-access-token-key-change-in-production",
        description="JWT Secret key for Access Token signing"
    )
    JWT_REFRESH_SECRET: str = Field(
        default="your-super-secret-refresh-token-key-change-in-production",
        description="JWT Secret key for Refresh Token signing"
    )
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(
        default=60,
        description="Access Token lifespan in minutes"
    )
    REFRESH_TOKEN_EXPIRE_DAYS: int = Field(
        default=7,
        description="Refresh Token lifespan in days"
    )
    INVITE_TOKEN_SECRET: str = Field(
        default="your-super-secret-invite-token-key-change-in-production",
        description="JWT Secret key for Invite Token signing"
    )
    INVITE_TOKEN_EXPIRE_DAYS: int = Field(
        default=7,
        description="Invite Token lifespan in days"
    )

    # Email / SendGrid Configuration
    SENDGRID_API_KEY: str = Field(default="")
    SENDGRID_FROM: str = Field(default="noreply@pressforge.io")

    # Frontend
    FRONTEND_URL: str = Field(default="http://localhost:3000")

    # Configuration for Pydantic Settings
    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore"  # Ignore any other environment variables
    )

settings = Settings()
