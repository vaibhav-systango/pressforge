import enum
import time
import ulid
from sqlalchemy import Column, String, Text, Boolean, BigInteger, Enum
from app.database.database import Base

def generate_ulid() -> str:
    return str(ulid.ULID())

def generate_timestamp_ms() -> int:
    return int(time.time() * 1000)

class AccountType(str, enum.Enum):
    UNASSIGNED = "UNASSIGNED"
    INDIVIDUAL = "INDIVIDUAL"
    ORGANIZATION = "ORGANIZATION"

class OnboardingStatus(str, enum.Enum):
    NOT_STARTED = "NOT_STARTED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"

class User(Base):
    __tablename__ = "users"

    id = Column(String(26), primary_key=True, default=generate_ulid, index=True)
    fullName = Column(String, nullable=False)
    email = Column(String, nullable=False, unique=True, index=True)
    passwordHash = Column(Text, nullable=True)
    accountType = Column(
        String,
        nullable=False,
        default=AccountType.INDIVIDUAL,
        index=True
    )
    onboardingStatus = Column(
        String,
        nullable=False,
        default=OnboardingStatus.NOT_STARTED.value,
        index=True
    )
    profileImage = Column(Text, nullable=True)
    isActive = Column(Boolean, nullable=False, default=True, index=True)
    lastLogin = Column(BigInteger, nullable=True)
    createdAt = Column(BigInteger, nullable=False, default=generate_timestamp_ms)
    updatedAt = Column(BigInteger, nullable=False, default=generate_timestamp_ms, onupdate=generate_timestamp_ms)
    deletedAt = Column(BigInteger, nullable=True)
