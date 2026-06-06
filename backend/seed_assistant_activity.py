import os
import sys
import csv
import random
import uuid
import hashlib
from datetime import datetime

# Add project root to sys.path
sys.path.append(os.getcwd())

from backend.app import create_app
from backend.app.extensions import db
from backend.app.models.user import User
from backend.app.models.role import Role
from backend.app.models.event import Event
from backend.app.models.category import Category
from backend.app.models.registration import Registration

CSV_PATH = "backend/test_data/assistant_event_corpus.csv"

def get_deterministic_bool(user_email, event_title, probability, salt="activity"):
    key = f"{user_email}:{event_title}:{salt}"
    hash_val = int(hashlib.md5(key.encode()).hexdigest(), 16)
    return (hash_val % 100) < probability

def seed_assistant_activity():
    if not os.path.exists(CSV_PATH):
        print(f"Error: CSV file not found at {CSV_PATH}")
        sys.exit(1)

    # Load titles from CSV
    assistant_titles = set()
    try:
        with open(CSV_PATH, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                assistant_titles.add(row['title'])
    except Exception as e:
        print(f"Error reading CSV: {e}")
        sys.exit(1)

    app = create_app()
    with app.app_context():
        print(f"--- Starting Assistant Activity Seeding for {len(assistant_titles)} events ---")

        # 1. Ensure student role exists
        student_role = Role.query.filter_by(name="student").first()
        if not student_role:
            print("Error: 'student' role not found.")
            return

        # 2. Get or create student users
        existing_students = User.query.filter_by(role_id=student_role.id).all()
        students = list(existing_students)
        
        # Ensure at least 60 students for diversity
        if len(students) < 60:
            print(f"  - Creating extra demo students (current: {len(students)})")
            for i in range(len(students), 60):
                email = f"assistant.student{i+1:02d}@student.usv.ro"
                user = User.query.filter_by(email=email).first()
                if not user:
                    user = User(
                        first_name=f"Assistant",
                        last_name=f"Student {i+1:02d}",
                        email=email,
                        password_hash="google-oauth-placeholder",
                        role_id=student_role.id
                    )
                    db.session.add(user)
                    students.append(user)
            db.session.flush()

        # 3. Identify Events
        events = Event.query.filter(Event.title.in_(assistant_titles)).all()
        print(f"  - Found {len(events)} events in database matching CSV titles.")

        counters = {
            'events_processed': 0,
            'reg_created': 0,
            'reg_skipped': 0,
            'confirmed': 0,
            'waitlisted': 0,
            'cancelled': 0
        }

        # Categories for profiling
        categories = {cat.name: cat.id for cat in Category.query.all()}
        
        # Select some students for specific profiles
        profile_students = {
            'IT': students[0] if len(students) > 0 else None,
            'Career': students[1] if len(students) > 1 else None,
            'Sport': students[2] if len(students) > 2 else None,
            'Volunteering': students[3] if len(students) > 3 else None,
            'Academic': students[4] if len(students) > 4 else None,
            'test.student': User.query.filter_by(email='test.student@student.usv.ro').first()
        }

        for event in events:
            counters['events_processed'] += 1
            
            # Determine target registrations based on category/title
            cat_name = event.category.name
            target_confirmed = 10
            
            if cat_name in ['Workshop', 'Academic']:
                target_confirmed = 20
            elif cat_name in ['Career', 'Conference']:
                target_confirmed = 45
            elif cat_name in ['Social', 'Sport']:
                target_confirmed = 15
            
            # Add some randomness to target
            seed_val = int(hashlib.md5(event.title.encode()).hexdigest(), 16)
            target_confirmed = max(5, target_confirmed + (seed_val % 21) - 10)
            
            # Cap by max_participants
            if event.max_participants:
                target_confirmed = min(target_confirmed, event.max_participants)

            current_confirmed = Registration.query.filter_by(event_id=event.id, status='confirmed').count()
            
            # Shuffle students for each event but deterministically based on event title
            event_students = list(students)
            random.Random(event.title).shuffle(event_students)

            # A. Fill confirmed registrations
            for student in event_students:
                if current_confirmed >= target_confirmed:
                    break
                
                # Use deterministic bool to decide if this student registers
                # Higher probability for popular categories
                prob = 40
                if cat_name in ['Workshop', 'Career']: prob = 60
                
                # PROFILE OVERRIDES
                if profile_students['IT'] and student.id == profile_students['IT'].id and cat_name == 'Workshop': prob = 95
                if profile_students['Career'] and student.id == profile_students['Career'].id and cat_name == 'Career': prob = 95
                if profile_students['Sport'] and student.id == profile_students['Sport'].id and cat_name == 'Sport': prob = 95
                if profile_students['Volunteering'] and student.id == profile_students['Volunteering'].id and cat_name == 'Volunteering': prob = 95
                if profile_students['test.student'] and student.id == profile_students['test.student'].id:
                    # test.student registers for 20% of assistant events
                    prob = 20

                if get_deterministic_bool(student.email, event.title, prob):
                    existing = Registration.query.filter_by(user_id=student.id, event_id=event.id).first()
                    if not existing:
                        reg = Registration(
                            user_id=student.id,
                            event_id=event.id,
                            status='confirmed',
                            ticket_code=str(uuid.uuid4())
                        )
                        db.session.add(reg)
                        counters['reg_created'] += 1
                        counters['confirmed'] += 1
                        current_confirmed += 1
                    else:
                        counters['reg_skipped'] += 1

            # B. Handle Waitlist for low capacity events
            if event.max_participants and event.max_participants <= 5:
                # Ensure it's full first
                if current_confirmed < event.max_participants:
                    for student in event_students:
                        if current_confirmed >= event.max_participants: break
                        existing = Registration.query.filter_by(user_id=student.id, event_id=event.id).first()
                        if not existing:
                            reg = Registration(user_id=student.id, event_id=event.id, status='confirmed', ticket_code=str(uuid.uuid4()))
                            db.session.add(reg)
                            counters['reg_created'] += 1
                            counters['confirmed'] += 1
                            current_confirmed += 1

                # Add 1-3 waitlisted
                waitlist_target = (seed_val % 3) + 1
                current_waitlist = Registration.query.filter_by(event_id=event.id, status='waitlisted').count()
                for student in event_students:
                    if current_waitlist >= waitlist_target: break
                    existing = Registration.query.filter_by(user_id=student.id, event_id=event.id).first()
                    if not existing:
                        reg = Registration(user_id=student.id, event_id=event.id, status='waitlisted', ticket_code=None)
                        db.session.add(reg)
                        counters['reg_created'] += 1
                        counters['waitlisted'] += 1
                        current_waitlist += 1

            # C. Randomly add some cancelled registrations (very low probability)
            if get_deterministic_bool(event.title, "global", 15, salt="cancelled_gen"):
                for student in event_students:
                    if get_deterministic_bool(student.email, event.title, 2, salt="is_cancelled"):
                        existing = Registration.query.filter_by(user_id=student.id, event_id=event.id).first()
                        if not existing:
                            reg = Registration(user_id=student.id, event_id=event.id, status='cancelled', ticket_code=None)
                            db.session.add(reg)
                            counters['reg_created'] += 1
                            counters['cancelled'] += 1
                            break # Only one per event for now

        db.session.commit()

        # Print Summary
        print("\n" + "="*50)
        print("       ASSISTANT ACTIVITY SEED SUMMARY")
        print("="*50)
        print(f"Events Processed:           {counters['events_processed']}")
        print(f"Total Registrations Created: {counters['reg_created']}")
        print(f"Total Registrations Skipped: {counters['reg_skipped']}")
        print("-" * 50)
        print(f"Confirmed Created:          {counters['confirmed']}")
        print(f"Waitlisted Created:         {counters['waitlisted']}")
        print(f"Cancelled Created:          {counters['cancelled']}")
        print("-" * 50)
        
        # Top 10 Popular from this corpus
        print("Top 10 Assistant Corpus Events by Confirmed Registrations:")
        top_events = db.session.query(
            Event.title, db.func.count(Registration.id).label('total')
        ).join(Registration).filter(
            Event.title.in_(assistant_titles),
            Registration.status == 'confirmed'
        ).group_by(Event.id).order_by(db.text('total DESC')).limit(10).all()
        
        for title, count in top_events:
            print(f"  - {title}: {count}")

        print("\nSample User Activity Profiles:")
        for name, user in profile_students.items():
            if user:
                count = Registration.query.filter_by(user_id=user.id).count()
                print(f"  - {name} ({user.email}): {count} total registrations")

        print("="*50)
        print("Assistant activity seeding completed successfully!")

if __name__ == "__main__":
    seed_assistant_activity()
