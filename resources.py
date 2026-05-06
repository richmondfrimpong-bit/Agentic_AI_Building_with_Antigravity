import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import User, Resource
from schemas import ResourceResponse
from auth import get_current_active_user, get_current_admin_user

router = APIRouter(prefix="/resources", tags=["resources"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload", response_model=ResourceResponse)
def upload_resource(
    title: str = Form(...),
    description: str = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    file_location = f"{UPLOAD_DIR}/{file.filename}"
    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    new_resource = Resource(
        title=title,
        description=description,
        file_path=file_location,
        uploader_id=current_user.id
    )
    db.add(new_resource)
    db.commit()
    db.refresh(new_resource)
    return new_resource

@router.get("/", response_model=List[ResourceResponse])
def list_resources(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    # Both students and admins can view the list of resources
    resources = db.query(Resource).offset(skip).limit(limit).all()
    return resources

@router.get("/download/{resource_id}")
def download_resource(resource_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    resource = db.query(Resource).filter(Resource.id == resource_id).first()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    
    if not os.path.exists(resource.file_path):
        raise HTTPException(status_code=404, detail="File not found on server")
        
    return FileResponse(path=resource.file_path, filename=os.path.basename(resource.file_path), media_type='application/octet-stream')

@router.delete("/{resource_id}")
def delete_resource(resource_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin_user)):
    resource = db.query(Resource).filter(Resource.id == resource_id).first()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    
    if os.path.exists(resource.file_path):
        os.remove(resource.file_path)
        
    db.delete(resource)
    db.commit()
    return {"message": "Resource deleted successfully"}
