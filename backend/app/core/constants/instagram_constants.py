class InstagramErrorCodes:
    META_NOT_CONFIGURED = "META_NOT_CONFIGURED"
    INVALID_OAUTH_STATE = "INVALID_OAUTH_STATE"
    OAUTH_STATE_EXPIRED = "OAUTH_STATE_EXPIRED"
    TOKEN_EXCHANGE_FAILED = "TOKEN_EXCHANGE_FAILED"
    NO_INSTAGRAM_BUSINESS_ACCOUNT = "NO_INSTAGRAM_BUSINESS_ACCOUNT"
    ACCOUNT_NOT_FOUND = "ACCOUNT_NOT_FOUND"
    ACCOUNT_NOT_OWNED = "ACCOUNT_NOT_OWNED"
    ACCOUNT_NOT_ACTIVE = "ACCOUNT_NOT_ACTIVE"
    ORG_MEMBERSHIP_REQUIRED = "ORG_MEMBERSHIP_REQUIRED"
    TOKEN_REFRESH_FAILED = "TOKEN_REFRESH_FAILED"
    ACCOUNT_NOT_CONNECTED = "ACCOUNT_NOT_CONNECTED"
    TOKEN_EXPIRED = "TOKEN_EXPIRED"
    TOKEN_REVOKED = "TOKEN_REVOKED"
    PUBLISH_FAILED = "PUBLISH_FAILED"
    EMPTY_CAPTION = "EMPTY_CAPTION"
    IMAGE_REQUIRED = "IMAGE_REQUIRED"


class InstagramErrorMessages:
    META_NOT_CONFIGURED = "Instagram connection is not configured. Contact your administrator."
    INVALID_OAUTH_STATE = "Invalid OAuth state. Please try connecting again."
    OAUTH_STATE_EXPIRED = "OAuth session expired. Please try connecting again."
    TOKEN_EXCHANGE_FAILED = "Failed to exchange authorization code with Meta."
    NO_INSTAGRAM_BUSINESS_ACCOUNT = (
        "No Instagram Business or Creator account found. "
        "Link your Instagram account to a Facebook Page and try again."
    )
    ACCOUNT_NOT_FOUND = "Instagram account not found."
    ACCOUNT_NOT_OWNED = "You do not have permission to access this Instagram account."
    ACCOUNT_NOT_ACTIVE = "Instagram account is not active. Please reconnect."
    ORG_MEMBERSHIP_REQUIRED = "You must be a member of this organization."
    TOKEN_REFRESH_FAILED = "Failed to refresh Instagram access token."
    ACCOUNT_NOT_CONNECTED = "Connect your Instagram account before publishing."
    TOKEN_EXPIRED = "Your Instagram connection has expired. Please reconnect Instagram in Settings."
    TOKEN_REVOKED = "Your Instagram connection was revoked. Please reconnect Instagram in Settings."
    PUBLISH_FAILED = "Failed to publish to Instagram. Please try again."
    EMPTY_CAPTION = "Instagram caption is empty. Add a caption before publishing."
    IMAGE_REQUIRED = "Instagram requires an image to publish."


# Scopes required for Connect with Instagram (profile + account discovery only)
INSTAGRAM_CONNECT_SCOPES = [
    "instagram_basic",
    "pages_show_list",
    "pages_read_engagement",
]

LONG_LIVED_TOKEN_TTL_SECONDS = 60 * 24 * 60 * 60
TOKEN_REFRESH_BUFFER_SECONDS = 7 * 24 * 60 * 60
