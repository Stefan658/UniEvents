import hashlib
import uuid
from datetime import datetime
from werkzeug.security import generate_password_hash

from backend.app import create_app
from backend.app.extensions import db
from backend.app.models.user import User
from backend.app.models.role import Role
from backend.app.models.event import Event
from backend.app.models.registration import Registration
from backend.app.models.feedback import Feedback

# --- CONFIGURATION ---

# 30 Students
STUDENT_DATA = [
    ("Andrei", "Popescu"), ("Maria", "Ionescu"), ("Stefan", "Constantin"), ("Elena", "Dumitru"),
    ("Alexandru", "Stan"), ("Ioana", "Stoica"), ("Gabriel", "Gheorghe"), ("Ana", "Matei"),
    ("Mihai", "Sandu"), ("Cristina", "Preda"), ("Dan", "Nica"), ("Laura", "Enache"),
    ("Robert", "Vasile"), ("Adina", "Munteanu"), ("Victor", "Filip"), ("Simona", "Dinu"),
    ("Paul", "Georgescu"), ("Roxana", "Tudor"), ("George", "Iacob"), ("Alina", "Luca"),
    ("Adrian", "Mihailescu"), ("Diana", "Moldovan"), ("Bogdan", "Pavel"), ("Carmen", "Rosu"),
    ("Florin", "Diaconu"), ("Anca", "Serban"), ("Vlad", "Olaru"), ("Mihaela", "Barbu"),
    ("Ionut", "Voinea"), ("Sonia", "Dragomir")
]

# 10 Staff/Professors
STAFF_DATA = [
    ("Ion", "Ionescu", "usv.ro"), ("Vasile", "Gliga", "usv.ro"), ("Elena", "Murgu", "usv.ro"),
    ("Marius", "Balan", "eed.usv.ro"), ("Anca", "Vaduva", "eed.usv.ro"), ("Cornel", "Pintea", "eed.usv.ro"),
    ("Dumitru", "Dan", "usm.ro"), ("Lidia", "Micu", "usm.ro"), ("Radu", "Iliescu", "usv.ro"),
    ("Georgeta", "Pop", "usv.ro")
]

# (Title, Target Probability 0-100)
POPULAR_UPCOMING = [
    ("USV Career Fair 2026", 80),
    ("Tech Startup Weekend", 70),
    ("AI in Modern Software Development", 60),
    ("Advanced Web Dev Bootcamp", 40),
    ("Cloud Computing and Infrastructure", 50)
]

OTHER_UPCOMING = [
    ("Neurodiversitatea în mediul academic", 20),
    ("Simpozion: Digitalizarea în Educație", 15),
    ("Cybersecurity Workshop: Defense Strategies", 25),
    ("Mobile App Development with Flutter", 20),
    ("CV Writing and Interview Skills", 15),
    ("Summer Internship Opportunities", 20),
    ("Folklore Night: Traditional Dances", 25),
    ("USV Spring Marathon", 30),
    ("Inter-Faculty Chess Championship", 15),
    ("Eco Clean-up: Green Campus", 20),
    ("Youth Policy Summit 2026", 15)
]

PAST_EVENTS = [
    ("Past: Intro to Python for Beginners", 70),
    ("Past: History Symposium 2026", 60),
    ("Past Hackathon: Web Innovation", 50),
    ("Cafeneaua științei: Scena ca laborator de creație", 40),
    ("Past: Winter Gala Celebration", 50),
    ("Movie Screening: European Cinema", 45)
]

FEEDBACK_COMMENTS = [
    "Excelent eveniment! Foarte bine organizat.",
    "Very informative session. Loved the speakers.",
    "O experiență utilă, aș reveni oricând.",
    "Great workshop, although it could have been longer.",
    "Mi-a plăcut foarte mult locația și atmosfera.",
    "The content was top-notch. Thanks USV!",
    "Un eveniment necesar în comunitatea noastră.",
    "Good presentation skills and clear explanations.",
    "Sper să se mai organizeze astfel de workshop-uri.",
    "Perfect for beginners, very clear and structured."
]

# --- HELPERS ---

def get_deterministic_bool(user_email, event_title, probability, salt=""):
    """Returns True if the user should be included for this event based on a hash."""
    key = f"{user_email}:{event_title}:{salt}"
    hash_val = int(hashlib.md5(key.encode()).hexdigest(), 16)
    return (hash_val % 100) < probability

def get_deterministic_rating(user_email, event_title):
    key = f"{user_email}:{event_title}:rating"
    hash_val = int(hashlib.md5(key.encode()).hexdigest(), 16)
    # Ratings 3-5, biased towards 4-5
    choices = [3, 4, 4, 4, 5, 5, 5, 5, 5]
    return choices[hash_val % len(choices)]

def get_deterministic_comment(user_email, event_title):
    key = f"{user_email}:{event_title}:comment"
    hash_val = int(hashlib.md5(key.encode()).hexdigest(), 16)
    return FEEDBACK_COMMENTS[hash_val % len(FEEDBACK_COMMENTS)]

def get_student_role():
    return Role.query.filter_by(name="student").first()

def get_or_create_participant(first_name, last_name, email, role_id, counters):
    user = User.query.filter_by(email=email).first()
    if not user:
        user = User(
            first_name=first_name,
            last_name=last_name,
            email=email,
            password_hash="google-oauth-placeholder",
            role_id=role_id
        )
        db.session.add(user)
        db.session.flush()
        counters['users_created'] += 1
    counters['users_processed'] += 1
    return user

def count_confirmed_registrations(event_id):
    return Registration.query.filter_by(event_id=event_id, status="confirmed").count()

def safe_create_registration(user, event, status, counters):
    existing = Registration.query.filter_by(user_id=user.id, event_id=event.id).first()
    if existing:
        counters['reg_skipped_existing'] += 1
        return existing

    # Check capacity
    if status == "confirmed" and event.max_participants is not None:
        current_count = count_confirmed_registrations(event.id)
        if current_count >= event.max_participants:
            counters['reg_skipped_capacity'] += 1
            return None

    reg = Registration(
        user_id=user.id,
        event_id=event.id,
        status=status,
        ticket_code=str(uuid.uuid4())
    )
    db.session.add(reg)
    counters['reg_created'] += 1
    return reg

def safe_create_feedback(user, event, counters):
    existing = Feedback.query.filter_by(user_id=user.id, event_id=event.id).first()
    if existing:
        counters['fb_skipped_existing'] += 1
        return existing

    feedback = Feedback(
        user_id=user.id,
        event_id=event.id,
        rating=get_deterministic_rating(user.email, event.title),
        comment=get_deterministic_comment(user.email, event.title)
    )
    db.session.add(feedback)
    counters['fb_created'] += 1
    return feedback

# --- MAIN SEED ---

def seed_activity():
    app = create_app()
    with app.app_context():
        print("--- Starting Deterministic Realistic Activity Seeding ---")
        
        student_role = get_student_role()
        if not student_role:
            print("Error: 'student' role not found. Run basic seed first.")
            return

        now = datetime.utcnow()
        counters = {
            'users_processed': 0, 'users_created': 0,
            'reg_created': 0, 'reg_skipped_existing': 0, 'reg_skipped_capacity': 0,
            'fb_created': 0, 'fb_skipped_existing': 0,
            'missing_events': []
        }

        # 1. Create Participants
        participants = []
        
        # Students
        for first, last in STUDENT_DATA:
            email = f"{first.lower()}.{last.lower()}@student.usv.ro"
            user = get_or_create_participant(first, last, email, student_role.id, counters)
            participants.append(user)
            
        # Staff
        for first, last, domain in STAFF_DATA:
            email = f"{first.lower()}.{last.lower()}@{domain}"
            user = get_or_create_participant(first, last, email, student_role.id, counters)
            participants.append(user)

        db.session.flush()

        # 2. Activity Simulation
        all_target_events = [
            (POPULAR_UPCOMING, "confirmed"),
            (OTHER_UPCOMING, "dynamic"), # 10% cancelled
            (PAST_EVENTS, "past")
        ]

        for event_list, type_str in all_target_events:
            for title, prob in event_list:
                # Use order_by(Event.id) to be deterministic if multiple events have same title
                event = Event.query.filter_by(title=title).order_by(Event.id).first()
                if not event:
                    # Try partial match for past events if exact fails
                    if type_str == "past":
                        event = Event.query.filter(Event.title.ilike(f"%{title}%")).order_by(Event.id).first()
                    
                if not event:
                    if title not in counters['missing_events']:
                        counters['missing_events'].append(title)
                    continue

                for p in participants:
                    if get_deterministic_bool(p.email, event.title, prob):
                        if type_str == "dynamic":
                            # 10% cancelled
                            status = "confirmed" if get_deterministic_bool(p.email, event.title, 90, salt="status") else "cancelled"
                            safe_create_registration(p, event, status, counters)
                        elif type_str == "past":
                            if event.end_at < now:
                                reg = safe_create_registration(p, event, "confirmed", counters)
                                if reg and reg.status == "confirmed":
                                    # 70% of participants leave feedback
                                    if get_deterministic_bool(p.email, event.title, 70, salt="feedback"):
                                        safe_create_feedback(p, event, counters)
                        else:
                            # Popular Upcoming
                            safe_create_registration(p, event, "confirmed", counters)

        db.session.commit()

        # --- SUMMARY ---
        print("\n" + "="*40)
        print("       ACTIVITY SEED SUMMARY")
        print("="*40)
        print(f"Participants Processed:  {counters['users_processed']}")
        print(f"Participants Created:    {counters['users_created']}")
        print(f"Registrations Created:   {counters['reg_created']}")
        print(f"Registrations Existing:  {counters['reg_skipped_existing']}")
        print(f"Registrations Cap Hit:   {counters['reg_skipped_capacity']}")
        print(f"Feedback Created:        {counters['fb_created']}")
        print(f"Feedback Existing:       {counters['fb_skipped_existing']}")
        if counters['missing_events']:
            print(f"Missing Target Events:   {', '.join(counters['missing_events'])}")
        
        # Most Popular (Top 5)
        print("\nTop 5 Most Popular Events (Confirmed):")
        top_events = db.session.query(
            Event.title, db.func.count(Registration.id).label('total')
        ).join(Registration).filter(Registration.status == "confirmed").group_by(Event.id).order_by(db.text('total DESC')).limit(5).all()
        
        for title, count in top_events:
            print(f"  - {title}: {count}")
        
        print("="*40)
        print("Database activity seeding completed!")

if __name__ == "__main__":
    seed_activity()
