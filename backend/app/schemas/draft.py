from pydantic import BaseModel, Field


class DraftHistoryEntry(BaseModel):
    version: int
    timestamp: str
    action: str
    caption: str | None = None
    liCaption: str | None = None
    feedback: str | None = None
    hashtags: list[str] | None = None
    imageBrief: str | None = None
    liHashtags: list[str] | None = None
    liImageBrief: str | None = None
    imageUrl: str | None = None


class DraftResponse(BaseModel):
    id: str
    workspaceId: str
    prompt: str
    status: str
    platform: str | None = None
    version: int = 1
    scheduledAt: str | None = None
    caption: str | None = None
    hashtags: list[str] = Field(default_factory=list)
    imageBrief: str | None = None
    imageUrl: str | None = None
    liCaption: str | None = None
    liHashtags: list[str] = Field(default_factory=list)
    liImageBrief: str | None = None
    goal: str | None = None
    cta: str | None = None
    visualStyle: str | None = None
    referenceUrls: list[str] = Field(default_factory=list)
    referenceText: str | None = None
    history: list[DraftHistoryEntry] = Field(default_factory=list)
    publishedAt: int | None = None
    externalPostId: str | None = None
    publishError: str | None = None
    createdAt: int | None = None
    updatedAt: int | None = None

    class Config:
        from_attributes = True


class PublishDraftResponse(BaseModel):
    draft: DraftResponse
    platform: str
    externalPostId: str
    publishedAt: int
    message: str


class DraftListResponse(BaseModel):
    drafts: list[DraftResponse]


class CreateDraftRequest(BaseModel):
    workspaceId: str = Field(..., min_length=1)
    prompt: str = Field(..., min_length=1)
    status: str = "draft"
    platform: str | None = None
    version: int = 1
    scheduledAt: str | None = None
    caption: str | None = None
    hashtags: list[str] = Field(default_factory=list)
    imageBrief: str | None = None
    imageUrl: str | None = None
    liCaption: str | None = None
    liHashtags: list[str] = Field(default_factory=list)
    liImageBrief: str | None = None
    goal: str | None = None
    cta: str | None = None
    visualStyle: str | None = None
    referenceUrls: list[str] = Field(default_factory=list)
    referenceText: str | None = None
    history: list[DraftHistoryEntry] = Field(default_factory=list)


class UpdateDraftRequest(BaseModel):
    prompt: str | None = None
    status: str | None = None
    platform: str | None = None
    version: int | None = None
    scheduledAt: str | None = None
    caption: str | None = None
    hashtags: list[str] | None = None
    imageBrief: str | None = None
    imageUrl: str | None = None
    liCaption: str | None = None
    liHashtags: list[str] | None = None
    liImageBrief: str | None = None
    goal: str | None = None
    cta: str | None = None
    visualStyle: str | None = None
    referenceUrls: list[str] | None = None
    referenceText: str | None = None
    history: list[DraftHistoryEntry] | None = None
