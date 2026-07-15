from pydantic import BaseModel, Field


class GenerateContentRequest(BaseModel):
    workspaceId: str = Field(..., min_length=1)
    prompt: str = Field(..., min_length=1)
    platforms: list[str] = Field(default_factory=lambda: ["instagram"])
    goal: str | None = None
    cta: str | None = None
    visualStyle: str | None = None
    referenceUrls: list[str] = Field(default_factory=list)
    referenceText: str | None = None
    brandName: str | None = None
    tone: str | None = None
    keywords: list[str] | None = None
    targetAudience: str | None = None
    brandVoice: str | None = None
    description: str | None = None
    rules: list[str] | None = None


class ContentVariation(BaseModel):
    id: str
    name: str
    caption: str
    hashtags: list[str] = Field(default_factory=list)
    imageBrief: str = ""
    liCaption: str = ""
    liHashtags: list[str] = Field(default_factory=list)
    liImageBrief: str = ""
    imageUrl: str | None = None


class GenerateContentResponse(BaseModel):
    variations: list[ContentVariation]
    prompt: str
    imageWarning: str | None = None
