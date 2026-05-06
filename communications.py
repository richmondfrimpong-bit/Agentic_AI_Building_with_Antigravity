from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from schemas import ContactForm, BroadcastEmail, WelcomeTemplateUpdate, WelcomeTemplateResponse
from auth import get_current_active_user, get_current_admin_user
from models import User, WelcomeEmailTemplate
import random

router = APIRouter(prefix="/communications", tags=["communications"])

MOTIVATIONAL_QUOTES = [
    "The secret of getting ahead is getting started. - Mark Twain",
    "It always seems impossible until it's done. - Nelson Mandela",
    "Don't watch the clock; do what it does. Keep going. - Sam Levenson",
    "Success is not final, failure is not fatal: it is the courage to continue that counts. - Winston Churchill",
    "The future depends on what you do today. - Mahatma Gandhi"
]

# ──────────────────────────────────────────
# Helper: Core mock email sender
# ──────────────────────────────────────────
def _send_mock_email(to: str, subject: str, body: str, from_label: str = "KAPEC KNUST <no-reply@kapecknust.com>"):
    """
    Central email dispatcher. Replace the print() calls below with
    your real SMTP / SendGrid / Gmail API integration when ready.
    """
    print("\n" + "="*55)
    print(f"  📧  MOCK EMAIL")
    print("="*55)
    print(f"  To      : {to}")
    print(f"  From    : {from_label}")
    print(f"  Subject : {subject}")
    print("-"*55)
    print(body)
    print("="*55 + "\n")


# ──────────────────────────────────────────
# Helper: Get or seed the welcome template
# ──────────────────────────────────────────
def get_or_seed_template(db: Session) -> WelcomeEmailTemplate:
    template = db.query(WelcomeEmailTemplate).first()
    if not template:
        template = WelcomeEmailTemplate()
        db.add(template)
        db.commit()
        db.refresh(template)
    return template


# ──────────────────────────────────────────
# Quote endpoint (public)
# ──────────────────────────────────────────
@router.get("/quote")
def get_quote():
    return {"quote": random.choice(MOTIVATIONAL_QUOTES)}


# ──────────────────────────────────────────
# Contact a specific tutor
# ──────────────────────────────────────────
def _contact_tutor_task(email_to: str, subject: str, message: str, sender_email: str, student_name: str):
    _send_mock_email(
        to=email_to,
        subject=f"[Student Message] {subject}",
        body=f"Message from: {student_name} <{sender_email}>\n\n{message}",
        from_label=f"{student_name} via KAPEC KNUST <no-reply@kapecknust.com>"
    )

@router.post("/contact-tutor")
def contact_tutor(
    form: ContactForm,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_user)
):
    background_tasks.add_task(
        _contact_tutor_task,
        email_to=form.tutor_email,
        subject=form.subject,
        message=form.message,
        sender_email=current_user.email,
        student_name=form.student_name
    )
    return {"message": "Email has been dispatched to the tutor."}


# ──────────────────────────────────────────
# Broadcast email to ALL users (admin only)
# ──────────────────────────────────────────
def _broadcast_task(recipients: List[str], subject: str, message: str):
    print(f"\n🚀  BROADCAST: Sending to {len(recipients)} recipients...")
    for email in recipients:
        _send_mock_email(to=email, subject=subject, body=message)
    print(f"✅  BROADCAST COMPLETE: {len(recipients)} emails dispatched.\n")

@router.post("/broadcast")
def broadcast_email(
    payload: BroadcastEmail,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    users = db.query(User).all()
    if not users:
        raise HTTPException(status_code=404, detail="No users found to email.")
    recipient_emails = [u.email for u in users]
    background_tasks.add_task(
        _broadcast_task,
        recipients=recipient_emails,
        subject=payload.subject,
        message=payload.message
    )
    return {"message": f"Broadcast queued for {len(recipient_emails)} recipients."}


# ──────────────────────────────────────────
# Welcome Email Template CRUD (admin only)
# ──────────────────────────────────────────
@router.get("/welcome-template", response_model=WelcomeTemplateResponse)
def get_welcome_template(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    return get_or_seed_template(db)

@router.put("/welcome-template", response_model=WelcomeTemplateResponse)
def update_welcome_template(
    update: WelcomeTemplateUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    template = get_or_seed_template(db)
    template.subject = update.subject
    template.body = update.body
    db.commit()
    db.refresh(template)
    return template


# ──────────────────────────────────────────
# Internal helper called by users router on registration
# ──────────────────────────────────────────
def send_welcome_email(user_name: str, user_email: str, db: Session):
    template = get_or_seed_template(db)
    personalized_body = template.body.replace("{name}", user_name)
    _send_mock_email(
        to=user_email,
        subject=template.subject,
        body=personalized_body
    )
