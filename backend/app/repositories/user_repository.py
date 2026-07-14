from sqlalchemy.orm import Session
from app.models.user import User, AccountType, generate_timestamp_ms
from app.models.user_profile import UserProfile

class UserRepository:

    def get_by_id(self, db: Session, user_id: str) -> User | None:
        """Fetch a single active user by their unique ULID."""
        return db.query(User).filter(User.id == user_id, User.deletedAt.is_(None)).first()

    def get_by_email(self, db: Session, email: str) -> User | None:
        """Fetch a single active user by their email address (lowercased and stripped)."""
        normalized_email = email.lower().strip()
        return db.query(User).filter(User.email == normalized_email, User.deletedAt.is_(None)).first()

    def create(
        self, 
        db: Session, 
        *, 
        fullName: str, 
        email: str, 
        passwordHash: str, 
        accountType: str = AccountType.UNASSIGNED.value
    ) -> User:
        """Create and persist a new user record in the database with lowercased email."""
        normalized_email = email.lower().strip()
        db_user = User(
            fullName=fullName,
            email=normalized_email,
            passwordHash=passwordHash,
            accountType=accountType
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user

    def update_last_login(self, db: Session, user: User) -> User:
        """Update the user's last login timestamp to the current time."""
        user.lastLogin = generate_timestamp_ms()
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    def create_user_profile(
        self,
        db: Session,
        *,
        userId: str,
        primaryGoal: str,
        contentThemes: list[str],
        website: str | None = None
    ) -> UserProfile:
        """Create and persist a user profile."""
        profile = UserProfile(
            userId=userId,
            primaryGoal=primaryGoal,
            contentThemes=contentThemes,
            website=website
        )
        db.add(profile)
        db.flush()  # Use flush to participate in transactional operations without premature commit
        return profile

    def update_onboarding_status(
        self,
        db: Session,
        user: User,
        onboarding_status: str,
        account_type: str
    ) -> User:
        """Update user's onboarding status and account type."""
        user.onboardingStatus = onboarding_status
        user.accountType = account_type
        db.add(user)
        db.flush()
        return user

    def update_profile(self, db: Session, user: User, *, fullName: str) -> User:
        """Update the user's profile details."""
        user.fullName = fullName
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    def update_password(self, db: Session, user: User, *, passwordHash: str) -> User:
        """Update the user's password hash and update the passwordUpdatedAt timestamp."""
        user.passwordHash = passwordHash
        user.passwordUpdatedAt = generate_timestamp_ms()
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    def delete_user(self, db: Session, user: User) -> User:
        """Soft delete the user record."""
        user.isDeleted = True
        user.isActive = False
        user.deletedAt = generate_timestamp_ms()
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

# Export a single repository instance to be imported across routers and services
user_repository = UserRepository()

