from functools import cached_property
from pathlib import Path

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    PROJECT_NAME: str = "Pressforge API"
    API_V1_STR: str = "/api/v1"

    # Database Configuration
    DATABASE_URL: str = Field(
        default="postgresql://postgres:postgres@localhost:5432/pressforge",
        description="PostgreSQL Database Connection URI",
    )

    # JWT Configuration
    JWT_SECRET: str = Field(
        default="your-super-secret-access-token-key-change-in-production",
        description="JWT Secret key for Access Token signing",
    )
    JWT_REFRESH_SECRET: str = Field(
        default="your-super-secret-refresh-token-key-change-in-production",
        description="JWT Secret key for Refresh Token signing",
    )
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(
        default=60,
        description="Access Token lifespan in minutes",
    )
    REFRESH_TOKEN_EXPIRE_DAYS: int = Field(
        default=1,
        description="Refresh Token lifespan in days",
    )
    INVITE_TOKEN_SECRET: str = Field(
        default="your-super-secret-invite-token-key-change-in-production",
        description="JWT Secret key for Invite Token signing",
    )
    INVITE_TOKEN_EXPIRE_DAYS: int = Field(
        default=7,
        description="Invite Token lifespan in days",
    )

    # Email / SendGrid Configuration
    SENDGRID_API_KEY: str = Field(default="")
    SENDGRID_FROM: str = Field(default="noreply@pressforge.io")

    # Public app URLs — set per environment via .env / deployment secrets.
    # Local example:  FRONTEND_URL=http://localhost:3000
    #                 PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
    # Deployed example: FRONTEND_URL=https://app.yourdomain.com
    #                   PUBLIC_API_BASE_URL=https://api.yourdomain.com/api/v1
    FRONTEND_URL: str = Field(
        ...,
        description="Public frontend origin (no trailing slash). Used for OAuth return redirects and invite links.",
    )
    PUBLIC_API_BASE_URL: str = Field(
        ...,
        description=(
            "Public backend API base including /api/v1 (no trailing slash). "
            "Must be reachable by LinkedIn/Meta for OAuth callbacks."
        ),
    )
    # Optional override. If unset, derived as {PUBLIC_API_BASE_URL}/social
    SOCIAL_OAUTH_CALLBACK_BASE: str | None = Field(
        default=None,
        description="Optional OAuth callback base override. Defaults to PUBLIC_API_BASE_URL/social.",
    )

    # Cloudinary (KYC document storage)
    CLOUDINARY_CLOUD_NAME: str = Field(default="", description="Cloudinary cloud name")
    CLOUDINARY_API_KEY: str = Field(default="", description="Cloudinary API key")
    CLOUDINARY_API_SECRET: str = Field(default="", description="Cloudinary API secret")
    CLOUDINARY_KYC_FOLDER: str = Field(default="pressforge/kyc", description="Cloudinary folder for KYC uploads")
    CLOUDINARY_BRAND_ASSETS_FOLDER: str = Field(
        default="pressforge/brand_assets",
        description="Cloudinary folder for brand assets uploads",
    )
    CLOUDINARY_GENERATED_FOLDER: str = Field(
        default="pressforge/generated",
        description="Cloudinary folder for AI-generated images",
    )

    # AI content generation
    GEMINI_API_KEY: str = Field(default="", description="Google Gemini API key for content generation")
    GEMINI_MODEL: str = Field(default="gemini-3.5-flash", description="Gemini model id")
    GEMINI_FALLBACK_MODEL: str = Field(
        default="gemini-3.1-flash-lite",
        description="Fallback Gemini model id",
    )

    # Image generation — Qwen-Image is the preferred self-hosted renderer. The
    # configured endpoint must implement OpenAI's POST /v1/images/generations
    # response format. If it is unset or unavailable, Pollinations Flux is used.
    QWEN_IMAGE_API_URL: str = Field(
        default="",
        description="OpenAI-compatible Qwen-Image generation endpoint URL",
    )
    QWEN_IMAGE_API_KEY: str = Field(
        default="",
        description="Optional bearer token for the Qwen-Image endpoint",
    )
    QWEN_IMAGE_MODEL: str = Field(
        default="Qwen-Image",
        description="Model identifier exposed by the self-hosted Qwen endpoint",
    )
    QWEN_IMAGE_TIMEOUT_SECONDS: float = Field(
        default=120.0,
        description="Timeout for one Qwen-Image render request",
    )
    ALIBABA_DASHSCOPE_API_KEY: str = Field(
        default="",
        description="Alibaba Cloud Model Studio API key for native Qwen-Image calls",
    )
    ALIBABA_WORKSPACE_ID: str = Field(
        default="",
        description="Alibaba Cloud Model Studio workspace ID",
    )
    ALIBABA_REGION: str = Field(
        default="ap-southeast-1",
        description="Alibaba Model Studio region: ap-southeast-1 (Singapore) or cn-beijing",
    )
    ALIBABA_QWEN_IMAGE_MODEL: str = Field(
        default="qwen-image-2.0-pro",
        description="Alibaba Model Studio Qwen image model ID",
    )

    # Social OAuth token encryption
    TOKEN_ENCRYPTION_KEY: str = Field(
        default="",
        description="Fernet key (or secret used to derive one) for OAuth token encryption",
    )

    # Meta / Instagram OAuth
    META_APP_ID: str = Field(default="")
    META_APP_SECRET: str = Field(default="")
    META_API_VERSION: str = Field(default="v17.0")
    META_WEBHOOK_VERIFY_TOKEN: str = Field(default="")

    # LinkedIn OAuth
    LINKEDIN_CLIENT_ID: str = Field(default="")
    LINKEDIN_CLIENT_SECRET: str = Field(default="")

    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @field_validator("FRONTEND_URL", "PUBLIC_API_BASE_URL", mode="before")
    @classmethod
    def _strip_trailing_slash(cls, value: object) -> object:
        if isinstance(value, str):
            return value.rstrip("/")
        return value

    @field_validator("SOCIAL_OAUTH_CALLBACK_BASE", mode="before")
    @classmethod
    def _normalize_oauth_callback_base(cls, value: object) -> object:
        if value is None or value == "":
            return None
        if isinstance(value, str):
            return value.rstrip("/")
        return value

    @cached_property
    def oauth_callback_base(self) -> str:
        """Canonical OAuth callback base used by LinkedIn/Meta services."""
        if self.SOCIAL_OAUTH_CALLBACK_BASE:
            return self.SOCIAL_OAUTH_CALLBACK_BASE
        return f"{self.PUBLIC_API_BASE_URL}/social"


settings = Settings()
