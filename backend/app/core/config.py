from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

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

    # Configuration for Pydantic Settings
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"  # Ignore any other environment variables
    )

settings = Settings()
