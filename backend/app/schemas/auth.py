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
    onboardingStatus: str
    isActive: bool
    lastLogin: int | None = None
    createdAt: int
    updatedAt: int
    organizationId: str | None = None
    organizationRole: str | None = None
    organizationName: str | None = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    """Schema for the returned authentication tokens and user info."""
    accessToken: str
    refreshToken: str
    tokenType: str = "bearer"
    user: UserResponse
    organizationId: str | None = None

class TokenRefreshRequest(BaseModel):
    """Schema to request a new access token using a refresh token."""
    refreshToken: str

class SetPasswordRequest(BaseModel):
    """Schema for setting a permanent password."""
    newPassword: str = Field(..., min_length=8, max_length=30)

class ProfileUpdateRequest(BaseModel):
    """Schema for updating user profile info."""
    fullName: str = Field(..., min_length=1, max_length=100)

class PasswordUpdateRequest(BaseModel):
    """Schema for changing a user password."""
    currentPassword: str
    newPassword: str = Field(..., min_length=8, max_length=30)

class OrganizationUpdateRequest(BaseModel):
    """Schema for updating organization name."""
    name: str = Field(..., min_length=1, max_length=100)

