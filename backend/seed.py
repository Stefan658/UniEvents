import datetime
from backend.app import create_app
from backend.app.extensions import db
from backend.app.models.role import Role
from backend.app.models.category import Category
from backend.app.models.user import User
from backend.app.models.event import Event
from werkzeug.security import generate_password_hash, check_password_hash


def seed_test_organizer_user():
    """Inițializează un utilizator organizator de test dacă acesta nu există."""
    print("\n--- Inițializare Utilizator Organizator de Test ---")
    organizer_role = Role.query.filter_by(name="organizer").first()
    if not organizer_role:
        print("- Rolul 'organizer' nu există. Asigură-te că rulezi seed_roles() mai întâi.")
        return None

    test_organizer_email = "organizer.demo@uni.events"
    test_organizer = User.query.filter_by(email=test_organizer_email).first()
    
    # Parola dorită pentru organizator și hash-ul ei
    password = "organizer123"
    hashed_password = generate_password_hash(password)

    if test_organizer:
        # Actualizează parola dacă hash-ul existent nu corespunde parolei dorite
        if not check_password_hash(test_organizer.password_hash, password):
            test_organizer.password_hash = hashed_password
            db.session.add(test_organizer) # Marchează pentru actualizare
            print(f"- Actualizat parola pentru utilizatorul organizator de test: '{test_organizer_email}'")
        else:
            print(f"- Utilizatorul organizator de test '{test_organizer_email}' există deja cu parola corectă. Se omite.")
        return test_organizer
    else:
        test_organizer = User(
            first_name="Test",
            last_name="Organizer",
            email=test_organizer_email,
            password_hash=hashed_password,  # Folosește hash-ul generat
            role_id=organizer_role.id,
        )
        db.session.add(test_organizer)
        db.session.flush() # Asigură că ID-ul utilizatorului este disponibil imediat
        print(f"+ S-a adăugat utilizatorul organizator de test: '{test_organizer_email}'")
        return test_organizer


def seed_test_student_user():
    """Inițializează un utilizator student de test dacă acesta nu există."""
    print("\n--- Inițializare Utilizator Student de Test ---")
    student_role = Role.query.filter_by(name="student").first()
    if not student_role:
        print("- Rolul 'student' nu există. Asigură-te că rulezi seed_roles() mai întâi.")
        return None

    test_student_email = "test.student@uni.events"
    test_student = User.query.filter_by(email=test_student_email).first()

    if test_student:
        print(f"- Utilizatorul student de test '{test_student_email}' există deja. Se omite.")
        return test_student
    else:
        test_student = User(
            first_name="Test",
            last_name="Student",
            email=test_student_email,
            password_hash="pbkdf2:sha256:150000$dummyhash$dummyhash",  # Hash placeholder
            role_id=student_role.id,
        )
        db.session.add(test_student)
        db.session.flush() # Asigură că ID-ul utilizatorului este disponibil imediat
        print(f"+ S-a adăugat utilizatorul student de test: '{test_student_email}'")
        return test_student


def seed_test_admin_user():
    """Inițializează un utilizator admin de test dacă acesta nu există."""
    print("\n--- Inițializare Utilizator Admin de Test ---")
    admin_role = Role.query.filter_by(name="admin").first()
    if not admin_role:
        print("- Rolul 'admin' nu există. Asigură-te că rulezi seed_roles() mai întâi.")
        return None

    test_admin_email = "admin.demo@uni.events"
    test_admin = User.query.filter_by(email=test_admin_email).first()
    
    # Parola dorită pentru admin și hash-ul ei
    password = "admin123"
    hashed_password = generate_password_hash(password)

    if test_admin:
        # Actualizează parola dacă hash-ul existent nu corespunde parolei dorite
        if not check_password_hash(test_admin.password_hash, password):
            test_admin.password_hash = hashed_password
            db.session.add(test_admin) # Marchează pentru actualizare
            print(f"- Actualizat parola pentru utilizatorul admin de test: '{test_admin_email}'")
        else:
            print(f"- Utilizatorul admin de test '{test_admin_email}' există deja cu parola corectă. Se omite.")
        return test_admin
    else:
        test_admin = User(
            first_name="Test",
            last_name="Admin",
            email=test_admin_email,
            password_hash=hashed_password,  # Folosește hash-ul generat
            role_id=admin_role.id,
        )
        db.session.add(test_admin)
        db.session.flush() # Asigură că ID-ul utilizatorului este disponibil imediat
        print(f"+ S-a adăugat utilizatorul admin de test: '{test_admin_email}'")
        return test_admin


def seed_test_event():
    """Inițializează un singur eveniment de test dacă acesta nu există."""
    print("\n--- Inițializare Eveniment de Test ---")

    organizer_user = seed_test_organizer_user()
    if not organizer_user:
        print("- Nu s-a putut crea/găsi un utilizator organizator. Evenimentul de test nu poate fi adăugat.")
        return

    academic_category = Category.query.filter_by(name="Academic").first()
    if not academic_category:
        print("- Categoria 'Academic' nu există. Asigură-te că rulezi seed_categories() mai întâi.")
        return

    test_event_title = "Workshop de Introducere în AI"
    test_event = Event.query.filter_by(title=test_event_title).first()

    if test_event:
        print(f"- Evenimentul de test '{test_event_title}' există deja. Se omite.")
    else:
        now = datetime.datetime.utcnow()
        start_time = now + datetime.timedelta(days=7)
        end_time = start_time + datetime.timedelta(hours=3) # Evenimentul durează 3 ore
        registration_deadline = start_time - datetime.timedelta(days=2) # Deadline-ul este cu 2 zile înainte de start

        event = Event(
            title=test_event_title,
            description="Un workshop interactiv despre fundamentele inteligenței artificiale și aplicațiile sale practice.",
            start_at=start_time,
            end_at=end_time,
            location="Sala C201, Facultatea de Inginerie",
            participation_type="on-site",
            registration_link="https://forms.gle/testevent",
            qr_code_url=None,
            status="active",
            organizer_id=organizer_user.id,
            category_id=academic_category.id,
            max_participants=50,
            registration_deadline=registration_deadline,
            requires_registration=True,
            is_free_entry=True,
        )
        db.session.add(event)
        print(f"+ S-a adăugat evenimentul de test: '{test_event_title}'")


def seed_roles():
    """Inițializează baza de date cu roluri inițiale dacă acestea nu există."""
    print("--- Inițializare Roluri ---")
    roles_to_seed = ["student", "organizer", "admin"]

    for role_name in roles_to_seed:
        if Role.query.filter_by(name=role_name).first():
            print(f"- Rolul '{role_name}' există deja. Se omite.")
        else:
            role = Role(name=role_name)
            db.session.add(role)
            print(f"+ S-a adăugat rolul: '{role_name}'")


def seed_categories():
    """Inițializează baza de date cu categorii inițiale dacă acestea nu există."""
    print("\n--- Inițializare Categorii ---")
    categories_to_seed = [
        {
            "name": "Academic",
            "description": "Evenimente legate de activități academice, precum workshop-uri, prelegeri și seminarii.",
        },
        {
            "name": "Career",
            "description": "Evenimente axate pe dezvoltarea carierei, inclusiv târguri de joburi și sesiuni de networking.",
        },
        {
            "name": "Sports",
            "description": "Evenimente sportive, competiții și activități de fitness.",
        },
        {
            "name": "Volunteering",
            "description": "Oportunități de a contribui la comunitate și la cauze sociale.",
        },
        {
            "name": "Social",
            "description": "Întâlniri sociale, petreceri și evenimente culturale pentru a socializa.",
        },
    ]

    for cat_data in categories_to_seed:
        if Category.query.filter_by(name=cat_data["name"]).first():
            print(f"- Categoria '{cat_data['name']}' există deja. Se omite.")
        else:
            category = Category(
                name=cat_data["name"], description=cat_data.get("description", "")
            )
            db.session.add(category)
            print(f"+ S-a adăugat categoria: '{cat_data['name']}'")


def main():
    """Funcția principală pentru a rula procesul de inițializare."""
    print("Se pornește inițializarea bazei de date...")
    app = create_app()

    with app.app_context():
        try:
            seed_roles()
            seed_categories()
            seed_test_admin_user()   # Adăugăm utilizatorul admin de test
            seed_test_student_user() # Adăugăm utilizatorul student de test
            seed_test_event()  # Adăugăm evenimentul de test
            db.session.commit()
            print("\nInițializarea bazei de date s-a finalizat cu succes!")
        except Exception as e:
            db.session.rollback()
            print(f"\nInițializarea bazei de date a eșuat: {e}")
            raise


if __name__ == "__main__":
    main()
