import csv
import os
import sys
from datetime import datetime
from decimal import Decimal
from werkzeug.security import generate_password_hash

# Add project root to sys.path to allow imports from 'backend.*'
sys.path.append(os.getcwd())

from backend.app import create_app
from backend.app.extensions import db
from backend.app.models.role import Role
from backend.app.models.category import Category
from backend.app.models.user import User
from backend.app.models.event import Event

CSV_PATH = "backend/test_data/nearby_event_corpus.csv"

def parse_bool(value):
    if not value:
        return False
    return str(value).lower() == 'true'

def parse_datetime(value):
    if not value or value.strip() == "":
        return None
    try:
        return datetime.strptime(value.strip(), '%Y-%m-%d %H:%M:%S')
    except ValueError:
        return None

def parse_int_or_none(value):
    if not value or str(value).strip() == "":
        return None
    try:
        return int(float(value))
    except (ValueError, TypeError):
        return None

def parse_decimal_or_none(value):
    if not value or str(value).strip() == "":
        return None
    try:
        return Decimal(value)
    except (ValueError, TypeError):
        return None

def get_or_create_category(name, counters):
    if not name:
        name = "General"
    
    category = Category.query.filter_by(name=name).first()
    if not category:
        category = Category(name=name, description=f"Events related to {name}")
        db.session.add(category)
        db.session.flush() # Get ID
        counters['categories_created'] += 1
        print(f"  + Category created: {name}")
    return category

def get_or_create_nearby_organizer(email, role_id, counters):
    user = User.query.filter_by(email=email).first()
    if not user:
        # Infer names from email (e.g., nearby.museum@uni.events -> Museum Organizer)
        name_part = email.split('@')[0] # nearby.museum
        if '.' in name_part:
            prefix, org_name = name_part.split('.', 1)
            first_name = org_name.capitalize()
        else:
            first_name = "Nearby"
            
        last_name = "Organizer"
        
        user = User(
            first_name=first_name,
            last_name=last_name,
            email=email,
            password_hash=generate_password_hash("nearby123"),
            role_id=role_id
        )
        db.session.add(user)
        db.session.flush() # Get ID
        counters['organizers_created'] += 1
        counters['by_organizer'][email] = counters['by_organizer'].get(email, 0)
        print(f"  + Nearby Organizer created: {email} ({first_name} {last_name})")
    return user

def seed_nearby_corpus():
    if not os.path.exists(CSV_PATH):
        print(f"Error: CSV file not found at {CSV_PATH}")
        sys.exit(1)

    app = create_app()
    with app.app_context():
        print(f"--- Starting Uni Nearby Corpus Seeding from {CSV_PATH} ---")
        
        # Resolve organizer role
        organizer_role = Role.query.filter_by(name="organizer").first()
        if not organizer_role:
            print("Error: 'organizer' role not found. Please run main seed first.")
            return

        counters = {
            'processed': 0,
            'organizers_created': 0,
            'categories_created': 0,
            'events_created': 0,
            'events_skipped_existing': 0,
            'rows_skipped_error': 0,
            'by_category': {},
            'by_organizer': {}
        }

        try:
            with open(CSV_PATH, "r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for i, row in enumerate(reader, start=1):
                    counters['processed'] += 1
                    title = row.get('title')
                    start_at_str = row.get('start_at')
                    cat_name = row.get('category_name')
                    org_email = row.get('organizer_email')
                    
                    if not title or not start_at_str or not org_email:
                        print(f"  ! Row {i}: Missing required fields. Skipping.")
                        counters['rows_skipped_error'] += 1
                        continue

                    start_at = parse_datetime(start_at_str)
                    if not start_at:
                        print(f"  ! Row {i} ({title}): Invalid start_at format. Skipping.")
                        counters['rows_skipped_error'] += 1
                        continue

                    # Idempotency check: title + start_at
                    existing_event = Event.query.filter_by(title=title, start_at=start_at).first()
                    if existing_event:
                        counters['events_skipped_existing'] += 1
                        counters['by_category'][cat_name] = counters['by_category'].get(cat_name, 0) + 1
                        # Increment counts for summary even if skipped
                        continue

                    # Resolve dependencies
                    category = get_or_create_category(cat_name, counters)
                    organizer = get_or_create_nearby_organizer(org_email, organizer_role.id, counters)

                    # Create event
                    try:
                        # Append nearby_label to description for traceability if model doesn't support it
                        description = row.get('description', '')
                        nearby_label = row.get('nearby_label')
                        if nearby_label:
                            description += f"\n\n[{nearby_label}]"

                        event = Event(
                            title=title,
                            description=description,
                            start_at=start_at,
                            end_at=parse_datetime(row.get('end_at')),
                            location=row.get('location', 'Suceava'),
                            participation_type=row.get('participation_type', 'on-site'),
                            status=row.get('status', 'published'),
                            max_participants=parse_int_or_none(row.get('max_participants')),
                            registration_deadline=parse_datetime(row.get('registration_deadline')),
                            requires_registration=parse_bool(row.get('requires_registration')),
                            is_free_entry=parse_bool(row.get('is_free_entry')),
                            ticket_price=parse_decimal_or_none(row.get('ticket_price')),
                            online_platform=row.get('online_platform'),
                            online_meeting_url=row.get('online_meeting_url'),
                            registration_link=row.get('registration_link'),
                            organizer_id=organizer.id,
                            category_id=category.id
                        )
                        db.session.add(event)
                        counters['events_created'] += 1
                        counters['by_category'][cat_name] = counters['by_category'].get(cat_name, 0) + 1
                        counters['by_organizer'][org_email] = counters['by_organizer'].get(org_email, 0) + 1
                        print(f"  + Added Nearby Event: {title}")
                        
                    except Exception as row_err:
                        print(f"  ! Row {i} ({title}): Error creating event: {row_err}")
                        counters['rows_skipped_error'] += 1
                        db.session.rollback()

            db.session.commit()
            
            print("\n" + "="*50)
            print("       UNI NEARBY CORPUS SEED SUMMARY")
            print("="*50)
            print(f"Rows processed:             {counters['processed']}")
            print(f"Organizers created:         {counters['organizers_created']}")
            print(f"Categories created:         {counters['categories_created']}")
            print(f"Events created:             {counters['events_created']}")
            print(f"Events skipped (exists):    {counters['events_skipped_existing']}")
            print(f"Rows skipped (errors):      {counters['rows_skipped_error']}")
            print("-" * 50)
            print("Distribution by Category:")
            for cat, count in sorted(counters['by_category'].items()):
                print(f"  - {cat:<15}: {count}")
            print("-" * 50)
            
            # Final verification
            total_nearby = Event.query.join(User).filter(User.email.like('nearby.%')).count()
            print(f"Total Uni Nearby Events in DB: {total_nearby}")
            print("="*50)
            print("Uni Nearby corpus seeding completed successfully!")

        except Exception as e:
            db.session.rollback()
            print(f"\nSeeding failed: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    seed_nearby_corpus()
