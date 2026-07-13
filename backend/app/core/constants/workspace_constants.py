class WorkspaceErrorCodes:
    WORKSPACE_NOT_FOUND = "WORKSPACE_NOT_FOUND"
    ACCESS_DENIED = "ACCESS_DENIED"
    ACTIVE_WORKSPACE_NOT_FOUND = "ACTIVE_WORKSPACE_NOT_FOUND"
    SCHEDULE_NOT_FOUND = "SCHEDULE_NOT_FOUND"
    INVALID_WORKSPACE_NAME = "INVALID_WORKSPACE_NAME"
    GUEST_SESSION_REQUIRED = "GUEST_SESSION_REQUIRED"
    WORKSPACE_NAME_CONFLICT = "WORKSPACE_NAME_CONFLICT"
    CLIENT_NOT_FOUND = "CLIENT_NOT_FOUND"


class WorkspaceErrorMessages:
    WORKSPACE_NOT_FOUND = "Workspace not found."
    ACCESS_DENIED = "You do not have access to this workspace."
    ACTIVE_WORKSPACE_NOT_FOUND = "The selected workspace does not exist or is not accessible."
    SCHEDULE_NOT_FOUND = "Schedule not found."
    INVALID_WORKSPACE_NAME = "Workspace name is required."
    GUEST_SESSION_REQUIRED = "X-Guest-Session-Id header is required when creating a workspace without authentication."
    WORKSPACE_NAME_CONFLICT = "You already have a workspace with a similar name."
    CLIENT_NOT_FOUND = "Client not found in this organization."
