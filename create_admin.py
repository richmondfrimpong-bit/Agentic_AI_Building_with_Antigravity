import sys
import os

# Add the parent directory to the path so we can import from backend
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import SessionLocal, engine, Base
from models import User
from auth import get_password_hash

def create_initial_admin():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    admin_email = "admin@kapecknust.com"
    admin_password = "adminpassword123"
    
    db_user = db.query(User).filter(User.email == admin_email).first()
    if db_user:
        print("Admin user already exists.")
        db.close()
        return

    hashed_password = get_password_hash(admin_password)
    new_user = User(
        email=admin_email,
        full_name="System Administrator",
        password_hash=hashed_password,
        role="admin"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    print(f"Admin user created successfully!")
    print(f"Email: {admin_email}")
    print(f"Password: {admin_password}")
    db.close()

if __name__ == "__main__":
    create_initial_admin()
