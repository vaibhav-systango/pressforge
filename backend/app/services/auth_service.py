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

# Export a single auth service instance
auth_service = AuthService()
