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

    # Configuration for Pydantic Settings
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"  # Ignore any other environment variables
    )

settings = Settings()
