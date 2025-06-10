from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

# Get the database URL from environment variables or use SQLite as default
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./social_media.db")

# Create a SQLAlchemy engine
engine = create_engine(DATABASE_URL)

# Create a SessionLocal class for database sessions
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create a Base class for declarative models
Base = declarative_base()

# Dependency to get the database session
def get_db():
    db = SessionLocal()
    
    # Return the database session
    db_session = db
    
    yield db_session
    
    # Close the database session after use
    db_session.close()