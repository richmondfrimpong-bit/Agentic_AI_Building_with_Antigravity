import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import User, Tutor
from schemas import TutorResponse
from auth import get_current_active_user, get_current_admin_user

router = APIRouter(prefix="/tutors", tags=["tutors"])

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPLOAD_DIR = os.path.join(BASE_DIR, "frontend", "static", "images")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/", response_model=TutorResponse)
def create_tutor(
    name: str = Form(...),
    email: str = Form(...),
    bio: str = Form(...),
    image: UploadFile = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    db_tutor = db.query(Tutor).filter(Tutor.email == email).first()
    if db_tutor:
        raise HTTPException(status_code=400, detail="Tutor email already exists")

    image_path = None
    if image:
        file_location = os.path.join(UPLOAD_DIR, image.filename)
        with open(file_location, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        image_path = f"/static/images/{image.filename}"

    new_tutor = Tutor(
        name=name,
        email=email,
        bio=bio,
        image_path=image_path
    )
    db.add(new_tutor)
    db.commit()
    db.refresh(new_tutor)
    return new_tutor

@router.get("/", response_model=List[TutorResponse])
def get_tutors(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    tutors = db.query(Tutor).offset(skip).limit(limit).all()
    return tutors

@router.delete("/{tutor_id}")
def delete_tutor(tutor_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin_user)):
    tutor = db.query(Tutor).filter(Tutor.id == tutor_id).first()
    if not tutor:
        raise HTTPException(status_code=404, detail="Tutor not found")
    
    db.delete(tutor)
    db.commit()
    return {"message": "Tutor deleted successfully"}
