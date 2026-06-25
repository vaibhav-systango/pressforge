from pydantic import BaseModel, EmailStr, Field
from app.models.user import AccountType

class UserCreate(BaseModel):
    """Schema for signing up a new user."""
    fullName: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=30, description="Password must be at least 8 characters")

class UserLogin(BaseModel):
    """Schema for user login credentials."""
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    """Schema representing the sanitized user data returned to clients."""
    id: str
    fullName: str
    email: EmailStr
    accountType: str
    isActive: bool
    lastLogin: int | None = None
    createdAt: int
    updatedAt: int

    class Config:
        from_attributes = True

class Token(BaseModel):
    """Schema for the returned authentication tokens and user info."""
    accessToken: str
    refreshToken: str
    tokenType: str = "bearer"
    user: UserResponse

class TokenRefreshRequest(BaseModel):
    """Schema to request a new access token using a refresh token."""
    refreshToken: str
