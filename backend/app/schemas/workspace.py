from pydantic import BaseModel, Field


class ScheduleResponse(BaseModel):
    id: str
    workspaceId: str
    platform: str | None = None
    dayOfWeek: str | None = None
    time: str | None = None
    contentType: str | None = None
    label: str | None = None
    datetime: str | None = None
    recurrence: str = "none"
    publishAsDraft: bool = False
    enabled: bool = True
    nextRun: str | None = None

    class Config:
        from_attributes = True


class WorkspaceResponse(BaseModel):
    id: str
    name: str
    website: str | None = None
    description: str | None = None
    industry: str | None = None
    targetAudience: str | None = None
    brandVoice: str | None = None
    logoUrl: str | None = None
    tone: str | None = None
    keywords: list[str] = Field(default_factory=list)
    rules: list[str] = Field(default_factory=list)
    ownerId: str | None = None
    organizationId: str | None = None
    schedules: list[ScheduleResponse] = Field(default_factory=list)
    createdAt: int
    updatedAt: int


class WorkspaceListResponse(BaseModel):
    workspaces: list[WorkspaceResponse]
    activeWorkspaceId: str | None = None


class CreateWorkspaceRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    website: str | None = None
    description: str | None = None
    industry: str | None = None
    targetAudience: str | None = None
    brandVoice: str | None = None
    logoUrl: str | None = None
    tone: str | None = None
    keywords: list[str] = Field(default_factory=list)
    rules: list[str] = Field(default_factory=list)


class UpdateWorkspaceRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    website: str | None = None
    description: str | None = None
    industry: str | None = None
    targetAudience: str | None = None
    brandVoice: str | None = None
    logoUrl: str | None = None
    tone: str | None = None
    keywords: list[str] | None = None
    rules: list[str] | None = None


class SetActiveWorkspaceRequest(BaseModel):
    workspaceId: str | None = None


class ClaimGuestWorkspacesRequest(BaseModel):
    guestSessionId: str = Field(..., min_length=1, max_length=64)


class CreateScheduleRequest(BaseModel):
    platform: str | None = None
    dayOfWeek: str | None = None
    time: str | None = None
    contentType: str | None = None
    label: str | None = None
    datetime: str | None = None
    recurrence: str = "none"
    publishAsDraft: bool = False
    enabled: bool = True
    nextRun: str | None = None


class UpdateScheduleRequest(BaseModel):
    platform: str | None = None
    dayOfWeek: str | None = None
    time: str | None = None
    contentType: str | None = None
    label: str | None = None
    datetime: str | None = None
    recurrence: str | None = None
    publishAsDraft: bool | None = None
    enabled: bool | None = None
    nextRun: str | None = None
