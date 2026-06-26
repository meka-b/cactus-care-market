import os
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base

# Use DATABASE_URL from environment, fallback to a default for local testing if needed
DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql+asyncpg://yesil_admin@localhost:5432/yesil_dukkan")

# Create the async engine
engine = create_async_engine(DATABASE_URL, echo=False)

# Create a configured "Session" class
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

# Declarative base class for models
Base = declarative_base()

async def init_db():
    import db_models
    async with engine.begin() as conn:
        # Create all tables
        await conn.run_sync(Base.metadata.create_all)

# Dependency to get the DB session
async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
