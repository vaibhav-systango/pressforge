from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.user import User
from app.models.role import Role
from app.models.permission import Permission
from app.models.role_permission import RolePermission
from app.models.route_permission import RoutePermission
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
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action"
            )
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

    Usage:
    @router.get("/me", dependencies=[Depends(permission_guard)])
    """
    route_permissions = (
        db.query(Permission.name)
        .join(RoutePermission, RoutePermission.permissionId == Permission.id)
        .filter(
            RoutePermission.method == request.method,
            RoutePermission.path == request.url.path
        )
        .all()
    )
    required_permissions = [p.name for p in route_permissions]

    if not required_permissions:
        return current_user

    role = db.query(Role).filter(Role.name == current_user.accountType).first()
    if not role:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found for this user")

    assigned_permissions = (
        db.query(Permission.name)
        .join(RolePermission, RolePermission.permissionId == Permission.id)
        .filter(RolePermission.roleId == role.id)
        .all()
    )
    assigned_names = {p.name for p in assigned_permissions}

    missing = [p for p in required_permissions if p not in assigned_names]
    if missing:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to perform this action"
        )
    return current_user
