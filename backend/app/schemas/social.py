from pydantic import BaseModel


class ConnectResponse(BaseModel):
    authorizationUrl: str
    platform: str


class SocialAccountResponse(BaseModel):
    id: str
    userId: str
    organizationId: str | None = None
    platform: str
    externalAccountId: str
    username: str | None = None
    displayName: str | None = None
    profilePictureUrl: str | None = None
    facebookPageId: str | None = None
    status: str
    connectedAt: int
    tokenExpiresAt: int | None = None

    class Config:
        from_attributes = True


class SocialConnectionResponse(BaseModel):
    platform: str
    connected: bool
    account: SocialAccountResponse | None = None
