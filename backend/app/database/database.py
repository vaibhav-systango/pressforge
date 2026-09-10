from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.core.config import settings

# Create database engine
# Note: For PostgreSQL, psycopg2 is used as the driver by default via postgresql:// URI
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,  # Checks connection health before query execution
    pool_size=10,        # Max connection pool size, similar to typeorm's max connections
    max_overflow=20      # Extra connections allowed beyond pool_size
)

# Create a session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Declarative base class for models (SQLAlchemy 2.0 style)
class Base(DeclarativeBase):
    pass

# Dependency injector for database session management
def get_db() -> Generator:
    """
    Dependency function to yield a database session.
    Automatically closes the session after the request is finished.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
