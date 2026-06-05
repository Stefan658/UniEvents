import csv
import os
import sys
from pathlib import Path
from datetime import datetime, timedelta

# Add project root to sys.path to allow imports from 'backend.*'
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.app import create_app
from backend.app.extensions import db
from backend.app.models.user import User
from backend.app.models.role import Role
from backend.app.models.event import Event
from backend.app.models.category import Category
from backend.app.models.registration import Registration
from backend.app.services import registration_service

def validate_waitlist():
    app = create_app()
    csv_path = SCRIPT_DIR / 'test_data' / 'waitlist_validation.csv'

    with app.app_context():
        try:
            print("--- Starting Waitlist CSV Validation ---")
            
            # 1. Ensure student role exists
            student_role = Role.query.filter_by(name='student').first()
            if not student_role:
                print("[ERROR] 'student' role not found. Run basic seed first.")
                sys.exit(1)

            # 2. Ensure an organizer exists for the test event
            organizer = User.query.filter(User.role.has(name='organizer')).first()
            if not organizer:
                # Create a dummy organizer if none exists
                organizer_role = Role.query.filter_by(name='organizer').first()
                organizer = User(
                    first_name="Validation",
                    last_name="Organizer",
                    email="waitlist.org@uni.events",
                    password_hash="placeholder",
                    role_id=organizer_role.id
                )
                db.session.add(organizer)
                db.session.flush()

            # 3. Ensure category exists
            category = Category.query.first()
            if not category:
                category = Category(name="Academic", description="Validation Category")
                db.session.add(category)
                db.session.flush()

            # 4. Ensure the validation event exists
            event_title = "Waitlist Validation Demo Event"
            event = Event.query.filter_by(title=event_title).first()
            if not event:
                event = Event(
                    title=event_title,
                    description="Automated validation of waitlist logic.",
                    start_at=datetime.utcnow() + timedelta(days=30),
                    end_at=datetime.utcnow() + timedelta(days=30, hours=2),
                    location="Validation Lab",
                    participation_type="on-site",
                    status="published",
                    requires_registration=True,
                    max_participants=3,
                    organizer_id=organizer.id,
                    category_id=category.id,
                    is_free_entry=True
                )
                db.session.add(event)
                db.session.flush()
                print(f"[INFO] Created event: {event_title}")
            else:
                # Reset capacity just in case it was modified
                event.max_participants = 3
                event.requires_registration = True
                event.status = "published"
                print(f"[INFO] Found existing event: {event_title}")

            # 5. Idempotency: Reset registrations for THIS event only
            num_deleted = Registration.query.filter_by(event_id=event.id).delete()
            db.session.commit()
            if num_deleted > 0:
                print(f"[INFO] Cleared {num_deleted} existing registrations for validation event.")

            # 6. Process CSV
            results = []
            with open(csv_path, mode='r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    email = row['email']
                    first_name = row['first_name']
                    last_name = row['last_name']
                    expected = row['expected_status']

                    # Ensure user exists
                    user = User.query.filter_by(email=email).first()
                    if not user:
                        user = User(
                            first_name=first_name,
                            last_name=last_name,
                            email=email,
                            password_hash="placeholder",
                            role_id=student_role.id
                        )
                        db.session.add(user)
                        db.session.flush()
                    
                    # Apply registration using the real service
                    try:
                        reg, email_status = registration_service.create_registration(user.id, event.id)
                        actual = reg.status
                        
                        is_pass = actual == expected
                        status_tag = "[PASS]" if is_pass else "[FAIL]"
                        print(f"{status_tag} {email} | expected={expected} | actual={actual}")
                        
                        results.append(is_pass)
                    except Exception as e:
                        print(f"[FAIL] {email} | Error during registration: {str(e)}")
                        results.append(False)

            # 7. Summary
            total = len(results)
            passed = sum(1 for r in results if r)
            
            # Final counts from DB
            final_confirmed = Registration.query.filter_by(event_id=event.id, status='confirmed').count()
            final_waitlisted = Registration.query.filter_by(event_id=event.id, status='waitlisted').count()

            print("\n--- Validation Summary ---")
            print(f"Confirmed Count:  {final_confirmed}")
            print(f"Waitlisted Count: {final_waitlisted}")
            print(f"Result:           {passed} / {total} passed")
            
            if passed == total and total > 0:
                print("\nWAITLIST VALIDATION PASSED")
            else:
                print("\nWAITLIST VALIDATION FAILED")
                sys.exit(1)

        except Exception as e:
            db.session.rollback()
            print(f"\n[ERROR] Validation failed with unexpected error: {e}")
            import traceback
            traceback.print_exc()
            sys.exit(1)

if __name__ == "__main__":
    validate_waitlist()
