from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.user import User
from app.core.constants.permission_constants import PermissionErrorCodes
from app.core.permission_guard import (
    extract_org_id_from_path,
    get_required_permissions,
    resolve_rbac_role,
    get_role_permission_names,
    permission_http_exception,
)
from app.core.security import decode_access_token
from app.repositories.user_repository import user_repository

# Configure HTTPBearer scheme to parse 'Authorization: Bearer <token>' headers
reusable_oauth2 = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(reusable_oauth2),
    db: Session = Depends(get_db)
) -> User:
    """
    Extracts the JWT token from the Authorization header,
    validates it, and fetches the associated active user from the database.
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = user_repository.get_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found or deleted"
        )

    if not user.isActive:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User account is inactive"
        )

    return user


def check_account_types(allowed_types: list[str]):
    """
    Dependency factory to check if the current user's account type is authorized.

    Usage:
    @router.get("/admin-only", dependencies=[Depends(check_account_types(["ORG_ADMIN", "ORG_OWNER"]))])
    """
    async def checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.accountType not in allowed_types:
            raise permission_http_exception(PermissionErrorCodes.INSUFFICIENT_PERMISSION)
        return current_user
    return checker


async def permission_guard(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> User:
    """
    Looks up required permissions for the current route from the
    route_permissions table and verifies the user's role has them.
    """
    required_permissions = get_required_permissions(
        db,
        request.method,
        request.url.path,
    )
    if not required_permissions:
        return current_user

    org_id = request.path_params.get("org_id") or extract_org_id_from_path(request.url.path)

    role_resolution = resolve_rbac_role(
        db,
        current_user,
        org_id,
    )
    if role_resolution.error_code:
        raise permission_http_exception(role_resolution.error_code)

    assigned_permissions = get_role_permission_names(db, role_resolution.role_name)
    if any(permission not in assigned_permissions for permission in required_permissions):
        raise permission_http_exception(PermissionErrorCodes.INSUFFICIENT_PERMISSION)

    return current_user
