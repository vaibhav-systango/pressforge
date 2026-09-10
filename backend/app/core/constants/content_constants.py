class ContentErrorCodes:
    GEMINI_NOT_CONFIGURED = "GEMINI_NOT_CONFIGURED"
    GENERATION_FAILED = "GENERATION_FAILED"
    WORKSPACE_NOT_FOUND = "WORKSPACE_NOT_FOUND"
    ACCESS_DENIED = "ACCESS_DENIED"
    INVALID_PROMPT = "INVALID_PROMPT"


class ContentErrorMessages:
    GEMINI_NOT_CONFIGURED = "AI generation is not configured. Set GEMINI_API_KEY."
    GENERATION_FAILED = "Content generation failed. Please try again."
    WORKSPACE_NOT_FOUND = "Workspace not found."
    ACCESS_DENIED = "You do not have access to this workspace."
    INVALID_PROMPT = "A content brief / prompt is required."


class DraftErrorCodes:
    DRAFT_NOT_FOUND = "DRAFT_NOT_FOUND"
    WORKSPACE_NOT_FOUND = "WORKSPACE_NOT_FOUND"
    ACCESS_DENIED = "ACCESS_DENIED"
    INVALID_PAYLOAD = "INVALID_PAYLOAD"
    NOT_APPROVED = "NOT_APPROVED"
    ALREADY_PUBLISHED = "ALREADY_PUBLISHED"


class DraftErrorMessages:
    DRAFT_NOT_FOUND = "Draft not found."
    WORKSPACE_NOT_FOUND = "Workspace not found."
    ACCESS_DENIED = "You do not have access to this draft."
    INVALID_PAYLOAD = "Invalid draft payload."
    NOT_APPROVED = "Draft must be approved before publishing."
    ALREADY_PUBLISHED = "Draft has already been published."
