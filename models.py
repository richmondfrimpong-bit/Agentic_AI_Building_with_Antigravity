from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    role = Column(String, default="student") # "admin" or "student"
    full_name = Column(String)
    registration_date = Column(DateTime, default=datetime.now(timezone.utc))

    resources = relationship("Resource", back_populates="uploader")

class Resource(Base):
    __tablename__ = "resources"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(String)
    file_path = Column(String)
    upload_date = Column(DateTime, default=datetime.now(timezone.utc))
    uploader_id = Column(Integer, ForeignKey("users.id"))

    uploader = relationship("User", back_populates="resources")

class Announcement(Base):
    __tablename__ = "announcements"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    content = Column(String)
    post_date = Column(DateTime, default=datetime.now(timezone.utc))
    author_id = Column(Integer, ForeignKey("users.id"))

    author = relationship("User")

class Tutor(Base):
    __tablename__ = "tutors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    bio = Column(String)
    image_path = Column(String)

class WelcomeEmailTemplate(Base):
    """Stores the single customizable welcome email template (only 1 row ever exists)."""
    __tablename__ = "welcome_email_template"

    id = Column(Integer, primary_key=True, index=True)
    subject = Column(String, default="Welcome to KAPEC KNUST — Your Actuarial Journey Starts Here!")
    body = Column(String, default="""Dear {name},

We are thrilled to welcome you to KAPEC KNUST — the premier actuarial coaching center dedicated to your professional success.

Here is what you can do right away:
  • Browse and download study materials in the Resources section.
  • Read the latest announcements on the KAPEC Info board.
  • Reach out directly to any of our expert tutors.

Your journey to actuarial excellence starts today. We are rooting for you every step of the way.

Warm regards,
The KAPEC KNUST Team""")
    last_updated = Column(DateTime, default=datetime.now(timezone.utc), onupdate=datetime.now(timezone.utc))
