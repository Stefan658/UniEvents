import datetime
from backend.app import create_app
from backend.app.extensions import db
from backend.app.models.role import Role
from backend.app.models.category import Category
from backend.app.models.user import User
from backend.app.models.event import Event
from backend.app.models.registration import Registration
from backend.app.models.feedback import Feedback
from backend.app.models.material import Material
from werkzeug.security import generate_password_hash


def seed_roles():
    """Initializes roles if they do not exist."""
    print("--- Initializing Roles ---")
    roles_to_seed = ["student", "organizer", "admin"]
    count = 0
    for role_name in roles_to_seed:
        if not Role.query.filter_by(name=role_name).first():
            role = Role(name=role_name)
            db.session.add(role)
            print(f"+ Added role: '{role_name}'")
            count += 1
        else:
            print(f"- Role '{role_name}' already exists.")
    return count


def seed_categories():
    """Initializes categories if they do not exist."""
    print("\n--- Initializing Categories ---")
    categories_to_seed = [
        {"name": "Workshop", "description": "Hands-on learning sessions."},
        {"name": "Conference", "description": "Large scale academic or professional gatherings."},
        {"name": "Career", "description": "Job fairs, networking, and professional development."},
        {"name": "Sport", "description": "Athletic events and competitions."},
        {"name": "Volunteering", "description": "Community service and social causes."},
        {"name": "Social", "description": "Social gatherings and networking."},
        {"name": "Academic", "description": "Lectures, seminars, and academic workshops."}
    ]
    count = 0
    for cat_data in categories_to_seed:
        if not Category.query.filter_by(name=cat_data["name"]).first():
            category = Category(name=cat_data["name"], description=cat_data["description"])
            db.session.add(category)
            print(f"+ Added category: '{cat_data['name']}'")
            count += 1
        else:
            print(f"- Category '{cat_data['name']}' already exists.")
    return count


def seed_users():
    """Initializes demo users."""
    print("\n--- Initializing Demo Users ---")
    roles = {role.name: role.id for role in Role.query.all()}
    
    users_to_seed = [
        {
            "first_name": "Admin",
            "last_name": "User",
            "email": "admin@uni.events",
            "password": "admin123",
            "role": "admin"
        },
        {
            "first_name": "Organizer",
            "last_name": "User",
            "email": "organizer@uni.events",
            "password": "organizer123",
            "role": "organizer"
        },
        {
            "first_name": "Student",
            "last_name": "User",
            "email": "student@student.usv.ro",
            "password": "student123", # Password not usually used for student but good for seed
            "role": "student"
        }
    ]
    
    count = 0
    for user_data in users_to_seed:
        user = User.query.filter_by(email=user_data["email"]).first()
        if not user:
            user = User(
                first_name=user_data["first_name"],
                last_name=user_data["last_name"],
                email=user_data["email"],
                password_hash=generate_password_hash(user_data["password"]),
                role_id=roles[user_data["role"]]
            )
            db.session.add(user)
            print(f"+ Added user: '{user_data['email']}' ({user_data['role']})")
            count += 1
        else:
            print(f"- User '{user_data['email']}' already exists.")
    return count


def seed_events():
    """Initializes demo events."""
    print("\n--- Initializing Demo Events ---")
    organizer = User.query.filter_by(email="organizer@uni.events").first()
    categories = {cat.name: cat.id for cat in Category.query.all()}
    
    if not organizer:
        print("! Organizer not found. Skipping events.")
        return 0

    now = datetime.datetime.utcnow()
    
    events_to_seed = [
        {
            "title": "Introduction to React Workshop",
            "description": "Learn the basics of React.js in this hands-on workshop.",
            "start_at": now + datetime.timedelta(days=7, hours=10),
            "end_at": now + datetime.timedelta(days=7, hours=14),
            "location": "Lab 101, Building C",
            "participation_type": "on-site",
            "category": "Workshop",
            "max_participants": 20,
            "requires_registration": True,
            "status": "active"
        },
        {
            "title": "Annual Tech Conference 2026",
            "description": "A conference featuring speakers from top tech companies.",
            "start_at": now + datetime.timedelta(days=30, hours=9),
            "end_at": now + datetime.timedelta(days=32, hours=17),
            "location": "University Auditorium",
            "participation_type": "hybrid",
            "category": "Conference",
            "max_participants": 500,
            "requires_registration": True,
            "status": "active"
        },
        {
            "title": "Career Fair Spring 2026",
            "description": "Connect with potential employers and find your dream job.",
            "start_at": now + datetime.timedelta(days=14, hours=10),
            "end_at": now + datetime.timedelta(days=14, hours=16),
            "location": "Main Hall",
            "participation_type": "on-site",
            "category": "Career",
            "max_participants": 1000,
            "requires_registration": False,
            "status": "active"
        },
        {
            "title": "Inter-Faculty Football Tournament",
            "description": "Come support your faculty's football team!",
            "start_at": now + datetime.timedelta(days=5, hours=16),
            "end_at": now + datetime.timedelta(days=5, hours=20),
            "location": "University Sports Ground",
            "participation_type": "on-site",
            "category": "Sport",
            "max_participants": None,
            "requires_registration": False,
            "status": "active"
        },
        {
            "title": "Local Community Clean-up",
            "description": "Join us in making our city cleaner and greener.",
            "start_at": now + datetime.timedelta(days=10, hours=8),
            "end_at": now + datetime.timedelta(days=10, hours=13),
            "location": "City Park Entrance",
            "participation_type": "on-site",
            "category": "Volunteering",
            "max_participants": 50,
            "requires_registration": True,
            "status": "active"
        },
        {
            "title": "Past Hackathon: Web Innovation",
            "description": "A look back at our last successful hackathon.",
            "start_at": now - datetime.timedelta(days=10, hours=9),
            "end_at": now - datetime.timedelta(days=8, hours=18),
            "location": "Innovation Hub",
            "participation_type": "on-site",
            "category": "Workshop",
            "max_participants": 100,
            "requires_registration": True,
            "status": "active"
        }
    ]
    
    count = 0
    for event_data in events_to_seed:
        if not Event.query.filter_by(title=event_data["title"]).first():
            event = Event(
                title=event_data["title"],
                description=event_data["description"],
                start_at=event_data["start_at"],
                end_at=event_data["end_at"],
                location=event_data["location"],
                participation_type=event_data["participation_type"],
                organizer_id=organizer.id,
                category_id=categories[event_data["category"]],
                max_participants=event_data["max_participants"],
                requires_registration=event_data["requires_registration"],
                status=event_data["status"],
                is_free_entry=True
            )
            db.session.add(event)
            print(f"+ Added event: '{event_data['title']}'")
            count += 1
        else:
            print(f"- Event '{event_data['title']}' already exists.")
    return count


def seed_registrations():
    """Initializes demo registrations."""
    print("\n--- Initializing Demo Registrations ---")
    student = User.query.filter_by(email="student@student.usv.ro").first()
    events = Event.query.filter_by(requires_registration=True).limit(3).all()
    
    if not student or not events:
        print("! Student or events not found. Skipping registrations.")
        return 0
    
    count = 0
    for event in events:
        if not Registration.query.filter_by(user_id=student.id, event_id=event.id).first():
            reg = Registration(
                user_id=student.id,
                event_id=event.id,
                status="confirmed"
            )
            db.session.add(reg)
            print(f"+ Registered student for event: '{event.title}'")
            count += 1
        else:
            print(f"- Registration for student at '{event.title}' already exists.")
    return count


def seed_feedback():
    """Initializes demo feedback."""
    print("\n--- Initializing Demo Feedback ---")
    student = User.query.filter_by(email="student@student.usv.ro").first()
    past_event = Event.query.filter(Event.end_at < datetime.datetime.utcnow()).first()
    
    if not student or not past_event:
        print("! Student or past event not found. Skipping feedback.")
        return 0
    
    count = 0
    if not Feedback.query.filter_by(user_id=student.id, event_id=past_event.id).first():
        feedback = Feedback(
            user_id=student.id,
            event_id=past_event.id,
            rating=5,
            comment="Great event! I learned a lot."
        )
        db.session.add(feedback)
        print(f"+ Added feedback for event: '{past_event.title}'")
        count += 1
    else:
        print(f"- Feedback for event '{past_event.title}' already exists.")
    return count


def seed_materials():
    """Initializes demo materials."""
    print("\n--- Initializing Demo Materials ---")
    organizer = User.query.filter_by(email="organizer@uni.events").first()
    events = Event.query.limit(2).all()
    
    if not organizer or not events:
        print("! Organizer or events not found. Skipping materials.")
        return 0
    
    count = 0
    for event in events:
        file_name = f"Presentation_{event.id}.pdf"
        if not Material.query.filter_by(event_id=event.id, file_name=file_name).first():
            material = Material(
                event_id=event.id,
                uploader_id=organizer.id,
                file_url=f"https://example.com/materials/{file_name}",
                file_name=file_name,
                file_type="application/pdf"
            )
            db.session.add(material)
            print(f"+ Added material for event: '{event.title}'")
            count += 1
        else:
            print(f"- Material '{file_name}' for event '{event.title}' already exists.")
    return count


def main():
    """Main function to run the seed process."""
    print("Starting database seeding...")
    app = create_app()

    with app.app_context():
        try:
            # Roles and Categories first as they are needed by others
            seed_roles()
            seed_categories()
            db.session.commit()
            
            # Users
            seed_users()
            db.session.commit()
            
            # Events
            seed_events()
            db.session.commit()
            
            # Registrations, Feedback, Materials
            seed_registrations()
            seed_feedback()
            seed_materials()
            db.session.commit()
            
            print("\nDatabase seeding completed successfully!")
            
            # Print Summary
            print("\n" + "="*30)
            print("       SEED SUMMARY")
            print("="*30)
            print(f"Users:         {User.query.count()}")
            print(f"Categories:    {Category.query.count()}")
            print(f"Events:        {Event.query.count()}")
            print(f"Registrations: {Registration.query.count()}")
            print(f"Feedback:      {Feedback.query.count()}")
            print(f"Materials:     {Material.query.count()}")
            print("="*30)
            
        except Exception as e:
            db.session.rollback()
            print(f"\nDatabase seeding failed: {e}")
            import traceback
            traceback.print_exc()


if __name__ == "__main__":
    main()
