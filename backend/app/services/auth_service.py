from sqlalchemy.orm import Session
from app.repositories.user_repository import user_repository
from app.schemas.auth import UserCreate, UserLogin
from app.models.user import User
from app.core.constants.auth_constants import AuthErrorCodes
from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
)

class AuthService:
    """
    Service class handling authentication business logic (registering users,
    authenticating credentials, and refreshing tokens).
    Equivalent to NestJS AuthService.
    """

    def register_user(self, db: Session, user_in: UserCreate) -> tuple[str, str, User]:
        """
        Register a new user account.
        Raises ValueError if email is already taken.
        """
        existing_user = user_repository.get_by_email(db, user_in.email)
        if existing_user:
            raise ValueError(AuthErrorCodes.EMAIL_ALREADY_EXISTS)

        hashed_password = get_password_hash(user_in.password)
        new_user = user_repository.create(
            db,
            fullName=user_in.fullName,
            email=user_in.email,
            passwordHash=hashed_password
        )

        payload = {"sub": new_user.id, "email": new_user.email, "role": new_user.accountType}
        access_token = create_access_token(data=payload)
        refresh_token = create_refresh_token(data=payload)

        return access_token, refresh_token, new_user

    def authenticate_user(self, db: Session, credentials: UserLogin) -> tuple[str, str, User]:
        """
        Authenticate a user by email and password.
        Raises ValueError for invalid credentials or inactive accounts.
        """
        user = user_repository.get_by_email(db, credentials.email)
        if not user or not user.passwordHash:
            raise ValueError(AuthErrorCodes.INVALID_CREDENTIALS)

        if not verify_password(credentials.password, user.passwordHash):
            raise ValueError(AuthErrorCodes.INVALID_CREDENTIALS)

        if not user.isActive:
            raise ValueError(AuthErrorCodes.INACTIVE_USER)

        # Update last login
        user = user_repository.update_last_login(db, user)

        payload = {"sub": user.id, "email": user.email, "role": user.accountType}
        access_token = create_access_token(data=payload)
        refresh_token = create_refresh_token(data=payload)

        return access_token, refresh_token, user

    def refresh_auth_tokens(self, db: Session, refresh_token: str) -> tuple[str, str, User]:
        """
        Exchange a valid refresh token for a new access and refresh token pair.
        Raises ValueError for invalid, expired, or inactive tokens/accounts.
        """
        payload = decode_refresh_token(refresh_token)
        if not payload:
            raise ValueError(AuthErrorCodes.INVALID_REFRESH_TOKEN)

        user_id = payload.get("sub")
        user = user_repository.get_by_id(db, user_id)
        if not user:
            raise ValueError(AuthErrorCodes.USER_NOT_FOUND)

        if not user.isActive:
            raise ValueError(AuthErrorCodes.INACTIVE_USER)

        iat = payload.get("iat")
        if iat and user.passwordUpdatedAt:
            if iat * 1000 < user.passwordUpdatedAt - 1000:
                raise ValueError(AuthErrorCodes.INVALID_REFRESH_TOKEN)

        new_payload = {"sub": user.id, "email": user.email, "role": user.accountType}
        access_token = create_access_token(data=new_payload)
        refresh_token = create_refresh_token(data=new_payload)

        return access_token, refresh_token, user

    def request_password_reset(self, db: Session, email: str) -> None:
        """
        Request a password reset. Generates a 6-digit verification code,
        saves it in the database, and sends it to the user's email.
        """
        user = user_repository.get_by_email(db, email)
        if not user:
            raise ValueError(AuthErrorCodes.USER_NOT_FOUND)

        import random
        code = f"{random.randint(100000, 999999)}"
        
        user_repository.set_password_reset_code(db, user, code, expires_in_minutes=15)
        
        from app.providers.email_provider import email_provider
        from app.core.constants.email_templates import password_reset_email
        
        email_data = password_reset_email(full_name=user.fullName, code=code)
        email_provider.send(to=user.email, subject=email_data["subject"], html=email_data["html"])

    def verify_password_reset_code(self, db: Session, email: str, code: str) -> None:
        """
        Verify the password reset code for the user.
        Raises ValueError if user not found, code is invalid, or code is expired.
        """
        user = user_repository.get_by_email(db, email)
        if not user:
            raise ValueError(AuthErrorCodes.USER_NOT_FOUND)

        if not user.passwordResetCode or user.passwordResetCode != code:
            raise ValueError(AuthErrorCodes.RESET_CODE_INVALID)

        from app.models.user import generate_timestamp_ms
        if not user.passwordResetExpiresAt or user.passwordResetExpiresAt < generate_timestamp_ms():
            raise ValueError(AuthErrorCodes.RESET_CODE_EXPIRED)

    def reset_password(self, db: Session, email: str, code: str, new_password: str) -> None:
        """
        Verify code and reset the password.
        Raises ValueError if verification fails.
        """
        # First verify the code
        self.verify_password_reset_code(db, email, code)
        
        # Code is valid, update password
        user = user_repository.get_by_email(db, email)
        
        # Hash new password
        from app.core.security import get_password_hash
        hashed_password = get_password_hash(new_password)
        
        user_repository.update_password(db, user, passwordHash=hashed_password)
        user_repository.clear_password_reset_code(db, user)


# Export a single auth service instance
auth_service = AuthService()
