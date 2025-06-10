from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
import os
from dotenv import load_dotenv
import httpx
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from fastapi.responses import JSONResponse

from database import get_db, engine
import models
import schemas

# Create all tables
models.Base.metadata.create_all(bind=engine)

load_dotenv()

app = FastAPI(title="Social Media Integration API")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# JWT Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-for-jwt")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Ayrshare API base URL
AYRSHARE_BASE_URL = "https://api.ayrshare.com/api"


# JWT token functions
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    return pwd_context.hash(password)


def authenticate_user(db: Session, username: str, password: str):
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user or not verify_password(password, user.hashed_password):
        return False
    return user


async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Decode the JWT token
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    username: str = payload.get("sub")
    if username is None:
        raise credentials_exception
    
    # Get the user from the database
    user = db.query(models.User).filter(models.User.username == username).first()
    if user is None:
        raise credentials_exception
    return user


# Auth endpoints
@app.post("/token", response_model=schemas.Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


# User management endpoints
@app.post("/users/", response_model=schemas.UserResponse)
async def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # Check if username already exists
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    # Create new user
    hashed_password = get_password_hash(user.password)
    db_user = models.User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@app.get("/users/me/", response_model=schemas.UserResponse)
async def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user


# Social Media Account Management
@app.post("/social-accounts/", response_model=schemas.SocialAccountResponse)
async def create_social_account(
    account: schemas.SocialAccountCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check if account for this platform already exists for the user
    existing_account = db.query(models.SocialAccount).filter(
        models.SocialAccount.user_id == current_user.id,
        models.SocialAccount.platform == account.platform
    ).first()
    
    if existing_account:
        raise HTTPException(
            status_code=400,
            detail=f"An account for {account.platform} already exists for this user"
        )
    
    # Create new social account
    new_account = models.SocialAccount(
        user_id=current_user.id,
        platform=account.platform,
        api_key=account.api_key,
        profile_key=account.profile_key,
        active=True
    )
    db.add(new_account)
    db.commit()
    db.refresh(new_account)
    return new_account


@app.get("/social-accounts/", response_model=List[schemas.SocialAccountResponse])
async def get_social_accounts(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(models.SocialAccount).filter(models.SocialAccount.user_id == current_user.id).all()


@app.delete("/social-accounts/{account_id}", response_model=schemas.Message)
async def delete_social_account(
    account_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    account = db.query(models.SocialAccount).filter(
        models.SocialAccount.id == account_id,
        models.SocialAccount.user_id == current_user.id
    ).first()
    
    if not account:
        raise HTTPException(status_code=404, detail="Social account not found")
    
    db.delete(account)
    db.commit()
    return {"message": "Social account deleted successfully"}


# Ayrshare API integration endpoints
@app.post("/posts/", response_model=schemas.PostResponse)
async def create_post(
    post_data: schemas.PostCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Get user's social account for Ayrshare
    social_account = db.query(models.SocialAccount).filter(
        models.SocialAccount.user_id == current_user.id,
        models.SocialAccount.active == True
    ).first()
    
    if not social_account:
        raise HTTPException(
            status_code=400,
            detail="No active social media account found. Please connect your account first."
        )
    
    # Create the post through Ayrshare API
    headers = {
        "Authorization": f"Bearer {social_account.api_key}",
    }
    
    # Add profile key if available
    if social_account.profile_key:
        headers["Profile-Key"] = social_account.profile_key
    
    # Prepare the post data
    ayrshare_post_data = {
        "post": post_data.content,
        "platforms": post_data.platforms
    }
    
    # Add media URLs if provided
    if post_data.media_urls and len(post_data.media_urls) > 0:
        ayrshare_post_data["mediaUrls"] = post_data.media_urls
    
    # Add schedule if provided
    if post_data.schedule_date:
        ayrshare_post_data["scheduleDate"] = post_data.schedule_date.isoformat()
    
    # Send the request to Ayrshare API
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{AYRSHARE_BASE_URL}/post",
            headers=headers,
            json=ayrshare_post_data,
            timeout=30.0
        )
    
    if response.status_code != 200:
        raise HTTPException(
            status_code=response.status_code,
            detail=f"Error from Ayrshare API: {response.text}"
        )
    
    # Create post record in database
    api_response = response.json()
    new_post = models.Post(
        user_id=current_user.id,
        content=post_data.content,
        platforms=",".join(post_data.platforms),
        media_urls=",".join(post_data.media_urls) if post_data.media_urls else None,
        schedule_date=post_data.schedule_date,
        ayrshare_post_id=api_response.get("id"),
        status="scheduled" if post_data.schedule_date else "published",
        response_data=str(api_response)
    )
    
    db.add(new_post)
    db.commit()
    db.refresh(new_post)
    
    return {
        "id": new_post.id,
        "content": new_post.content,
        "platforms": new_post.platforms.split(",") if new_post.platforms else [],
        "media_urls": new_post.media_urls.split(",") if new_post.media_urls else [],
        "schedule_date": new_post.schedule_date,
        "ayrshare_post_id": new_post.ayrshare_post_id,
        "status": new_post.status,
        "created_at": new_post.created_at
    }


@app.get("/posts/", response_model=List[schemas.PostResponse])
async def get_posts(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    posts = db.query(models.Post).filter(models.Post.user_id == current_user.id).order_by(models.Post.created_at.desc()).all()
    
    result = []
    for post in posts:
        result.append({
            "id": post.id,
            "content": post.content,
            "platforms": post.platforms.split(",") if post.platforms else [],
            "media_urls": post.media_urls.split(",") if post.media_urls else [],
            "schedule_date": post.schedule_date,
            "ayrshare_post_id": post.ayrshare_post_id,
            "status": post.status,
            "created_at": post.created_at
        })
    
    return result


@app.delete("/posts/{post_id}", response_model=schemas.Message)
async def delete_post(
    post_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Get the post
    post = db.query(models.Post).filter(
        models.Post.id == post_id,
        models.Post.user_id == current_user.id
    ).first()
    
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Get user's social account
    social_account = db.query(models.SocialAccount).filter(
        models.SocialAccount.user_id == current_user.id,
        models.SocialAccount.active == True
    ).first()
    
    if not social_account:
        raise HTTPException(status_code=400, detail="No active social media account found")
    
    # Delete from Ayrshare API if it has an Ayrshare ID
    if post.ayrshare_post_id:
        headers = {
            "Authorization": f"Bearer {social_account.api_key}",
        }
        
        if social_account.profile_key:
            headers["Profile-Key"] = social_account.profile_key
        
        async with httpx.AsyncClient() as client:
            response = await client.delete(
                f"{AYRSHARE_BASE_URL}/post/{post.ayrshare_post_id}",
                headers=headers,
                timeout=30.0
            )
        
        # If deletion fails on Ayrshare but it's not found, we'll still delete locally
        if response.status_code != 200 and "not found" not in response.text.lower():
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Error deleting post from Ayrshare API: {response.text}"
            )
    
    # Delete the post from our database
    db.delete(post)
    db.commit()
    
    return {"message": "Post deleted successfully"}


@app.get("/platforms", response_model=List[str])
async def get_supported_platforms():
    """Return a list of supported social media platforms by Ayrshare"""
    return [
        "bluesky", "facebook", "gmb", "instagram", "linkedin", 
        "pinterest", "reddit", "snapchat", "telegram", "threads", 
        "tiktok", "twitter", "youtube"
    ]


@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)