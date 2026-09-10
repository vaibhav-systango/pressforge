class LinkedInErrorCodes:
    LINKEDIN_NOT_CONFIGURED = "LINKEDIN_NOT_CONFIGURED"
    INVALID_OAUTH_STATE = "INVALID_OAUTH_STATE"
    TOKEN_EXCHANGE_FAILED = "TOKEN_EXCHANGE_FAILED"
    PROFILE_FETCH_FAILED = "PROFILE_FETCH_FAILED"
    ACCOUNT_NOT_FOUND = "ACCOUNT_NOT_FOUND"
    ACCOUNT_NOT_OWNED = "ACCOUNT_NOT_OWNED"
    ORG_MEMBERSHIP_REQUIRED = "ORG_MEMBERSHIP_REQUIRED"
    ACCOUNT_NOT_CONNECTED = "ACCOUNT_NOT_CONNECTED"
    TOKEN_EXPIRED = "TOKEN_EXPIRED"
    TOKEN_REVOKED = "TOKEN_REVOKED"
    PUBLISH_FAILED = "PUBLISH_FAILED"
    EMPTY_CAPTION = "EMPTY_CAPTION"
    IMAGE_UPLOAD_FAILED = "IMAGE_UPLOAD_FAILED"


class LinkedInErrorMessages:
    LINKEDIN_NOT_CONFIGURED = "LinkedIn connection is not configured. Contact your administrator."
    INVALID_OAUTH_STATE = "Invalid OAuth state. Please try connecting again."
    TOKEN_EXCHANGE_FAILED = "Failed to exchange authorization code with LinkedIn."
    PROFILE_FETCH_FAILED = "Failed to fetch LinkedIn profile."
    ACCOUNT_NOT_FOUND = "LinkedIn account not found."
    ACCOUNT_NOT_OWNED = "You do not have permission to access this LinkedIn account."
    ORG_MEMBERSHIP_REQUIRED = "You must be a member of this organization."
    ACCOUNT_NOT_CONNECTED = "Connect your LinkedIn account before publishing."
    TOKEN_EXPIRED = "Your LinkedIn connection has expired. Please reconnect LinkedIn in Settings."
    TOKEN_REVOKED = "Your LinkedIn connection was revoked. Please reconnect LinkedIn in Settings."
    PUBLISH_FAILED = "Failed to publish to LinkedIn. Please try again."
    EMPTY_CAPTION = "LinkedIn caption is empty. Add a caption before publishing."
    IMAGE_UPLOAD_FAILED = "Failed to upload image to LinkedIn. Try publishing without an image."


LINKEDIN_CONNECT_SCOPES = [
    "openid",
    "profile",
    "email",
    "w_member_social",
]

TOKEN_REFRESH_BUFFER_SECONDS = 7 * 24 * 60 * 60
