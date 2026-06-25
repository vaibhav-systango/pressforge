from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.user import User
from app.core.security import decode_access_token
from app.repositories.user_repository import user_repository

# Configure HTTPBearer scheme to parse 'Authorization: Bearer <token>' headers
reusable_oauth2 = HTTPBearer(auto_error=False)

async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(reusable_oauth2),
    db: Session = Depends(get_db)
) -> User:
    """
    Dependency that extracts the JWT token from the Authorization header,
    validates it, and fetches the associated active user from the database.
    Equivalent to NestJS JwtAuthGuard / JwtStrategy.
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
        
    # Query database for the user using repository
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
    Equivalent to NestJS RoleGuard / Roles decorator.
    
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
