from pydantic import BaseModel, EmailStr, Field
from app.models.organization_member import OrganizationRole


class InviteUserRequest(BaseModel):
    email: EmailStr
    fullName: str = Field(..., min_length=1, max_length=100)
    role: OrganizationRole


class InviteUserResponse(BaseModel):
    id: str
    email: str
    fullName: str
    role: str
    status: str
    expiresAt: int
    createdAt: int

    class Config:
        from_attributes = True


class AcceptInvitationRequest(BaseModel):
    token: str
    password: str = Field(..., min_length=8, max_length=30)


class ClientResponse(BaseModel):
    id: str
    name: str
    email: str
    status: str
    role: str
    expiresAt: int | None = None
    isAccepted: bool
    workspaceId: str | None = None
    plan: str | None = "Free"

    class Config:
        from_attributes = True


class InvitableRoleResponse(BaseModel):
    value: str
    label: str
