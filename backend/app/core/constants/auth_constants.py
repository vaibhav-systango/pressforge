class AuthErrorCodes:
    EMAIL_ALREADY_EXISTS = "EMAIL_ALREADY_EXISTS"
    INVALID_CREDENTIALS = "INVALID_CREDENTIALS"
    INACTIVE_USER = "INACTIVE_USER"
    INVALID_REFRESH_TOKEN = "INVALID_REFRESH_TOKEN"
    USER_NOT_FOUND = "USER_NOT_FOUND"
    RESET_CODE_EXPIRED = "RESET_CODE_EXPIRED"
    RESET_CODE_INVALID = "RESET_CODE_INVALID"

class AuthErrorMessages:
    EMAIL_ALREADY_EXISTS = "A user with this email address already exists."
    INVALID_CREDENTIALS = "Incorrect email or password."
    INACTIVE_USER = "User account is inactive."
    INVALID_REFRESH_TOKEN = "Invalid or expired refresh token."
    USER_NOT_FOUND = "User not found."
    RESET_CODE_EXPIRED = "The verification code has expired."
    RESET_CODE_INVALID = "The verification code is incorrect."
