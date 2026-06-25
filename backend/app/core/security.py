from datetime import datetime, timedelta, timezone
import bcrypt
import jwt
from app.core.config import settings

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain text password against a bcrypt hash."""
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    """Generate a bcrypt hash of a password."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """Create a signed JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm="HS256")

def create_refresh_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """Create a signed JWT refresh token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.JWT_REFRESH_SECRET, algorithm="HS256")

def decode_access_token(token: str) -> dict | None:
    """Decode and validate a JWT access token."""
    try:
        return jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
    except jwt.PyJWTError:
        return None

def decode_refresh_token(token: str) -> dict | None:
    """Decode and validate a JWT refresh token."""
    try:
        return jwt.decode(token, settings.JWT_REFRESH_SECRET, algorithms=["HS256"])
    except jwt.PyJWTError:
        return None
