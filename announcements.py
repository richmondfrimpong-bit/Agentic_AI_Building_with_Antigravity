from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import User, Announcement
from schemas import AnnouncementCreate, AnnouncementResponse
from auth import get_current_active_user, get_current_admin_user

router = APIRouter(prefix="/announcements", tags=["announcements"])

@router.post("/", response_model=AnnouncementResponse)
def create_announcement(
    announcement: AnnouncementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    new_announcement = Announcement(
        title=announcement.title,
        content=announcement.content,
        author_id=current_user.id
    )
    db.add(new_announcement)
    db.commit()
    db.refresh(new_announcement)
    return new_announcement

@router.get("/", response_model=List[AnnouncementResponse])
def get_announcements(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    announcements = db.query(Announcement).order_by(Announcement.post_date.desc()).offset(skip).limit(limit).all()
    return announcements
