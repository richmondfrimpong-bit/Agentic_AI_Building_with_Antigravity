from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List

class UserBase(BaseModel):
    email: EmailStr
    full_name: str

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    role: str
    registration_date: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    role: str
    full_name: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

class ResourceBase(BaseModel):
    title: str
    description: Optional[str] = None

class ResourceCreate(ResourceBase):
    pass

class ResourceResponse(ResourceBase):
    id: int
    file_path: str
    upload_date: datetime
    uploader_id: int

    class Config:
        from_attributes = True

class ContactForm(BaseModel):
    tutor_email: EmailStr
    student_name: str
    subject: str
    message: str

class AnnouncementBase(BaseModel):
    title: str
    content: str

class AnnouncementCreate(AnnouncementBase):
    pass

class AnnouncementResponse(AnnouncementBase):
    id: int
    post_date: datetime
    author_id: int

    class Config:
        from_attributes = True

class TutorBase(BaseModel):
    name: str
    email: EmailStr
    bio: str

class TutorCreate(TutorBase):
    pass

class TutorResponse(TutorBase):
    id: int
    image_path: Optional[str] = None

    class Config:
        from_attributes = True

class BroadcastEmail(BaseModel):
    subject: str
    message: str

class WelcomeTemplateUpdate(BaseModel):
    subject: str
    body: str

class WelcomeTemplateResponse(BaseModel):
    subject: str
    body: str
    last_updated: datetime

    class Config:
        from_attributes = True
