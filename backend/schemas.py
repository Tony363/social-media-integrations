from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Dict, Any
from datetime import datetime


# User schemas
class UserBase(BaseModel):
    username: str
    email: str


class UserCreate(UserBase):
    password: str


class UserResponse(UserBase):
    id: int
    is_active: bool = True
    created_at: datetime

    class Config:
        orm_mode = True


# Token schemas
class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None


# Social Account schemas
class SocialAccountBase(BaseModel):
    platform: str
    active: bool = True


class SocialAccountCreate(SocialAccountBase):
    api_key: str
    profile_key: Optional[str] = None


class SocialAccountResponse(SocialAccountBase):
    id: int
    user_id: int
    api_key: str  # In a production environment, you might want to hide this
    profile_key: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True


# Post schemas
class PostBase(BaseModel):
    content: str
    platforms: List[str]
    media_urls: Optional[List[str]] = None
    schedule_date: Optional[datetime] = None


class PostCreate(PostBase):
    pass


class PostResponse(PostBase):
    id: int
    ayrshare_post_id: Optional[str] = None
    status: str
    created_at: datetime

    class Config:
        orm_mode = True


# General message response
class Message(BaseModel):
    message: str