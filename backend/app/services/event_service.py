from datetime import datetime
from backend.app.extensions import db
from backend.app.models.event import Event
from backend.app.models.user import User
from backend.app.models.category import Category
from sqlalchemy.orm import joinedload

def create_event(data):
    """
    Creates a new event after validating the input data.
    """
    # --- Validation ---
    required_fields = [
        "title", "description", "start_at", "end_at", "location",
        "participation_type", "organizer_id", "category_id"
    ]
    for field in required_fields:
        if field not in data or not data[field]:
            raise ValueError(f"'{field}' is a required field.")

    # Validate organizer
    organizer = User.query.get(data['organizer_id'])
    if not organizer:
        raise ValueError(f"Organizer with ID {data['organizer_id']} not found.")
    if not organizer.role or organizer.role.name not in ['organizer', 'admin']:
        raise ValueError("User does not have permission to create events (must be an organizer or admin).")

    # Validate category
    category = Category.query.get(data['category_id'])
    if not category:
        raise ValueError(f"Category with ID {data['category_id']} not found.")

    # Validate dates
    try:
        start_at = datetime.fromisoformat(data['start_at'])
        end_at = datetime.fromisoformat(data['end_at'])
    except (TypeError, ValueError):
        raise ValueError("Invalid date format for 'start_at' or 'end_at'. Please use ISO 8601 format (YYYY-MM-DDTHH:MM:SS).")

    if end_at <= start_at:
        raise ValueError("'end_at' must be after 'start_at'.")

    registration_deadline = None
    if 'registration_deadline' in data and data['registration_deadline']:
        try:
            registration_deadline = datetime.fromisoformat(data['registration_deadline'])
        except (TypeError, ValueError):
            raise ValueError("Invalid date format for 'registration_deadline'. Please use ISO 8601 format (YYYY-MM-DDTHH:MM:SS).")

    # --- Creation ---
    new_event = Event(
        title=data['title'],
        description=data['description'],
        start_at=start_at,
        end_at=end_at,
        location=data['location'],
        participation_type=data['participation_type'],
        organizer_id=data['organizer_id'],
        category_id=data['category_id'],
        registration_link=data.get('registration_link'),
        qr_code_url=data.get('qr_code_url'),
        status=data.get('status', 'active'),
        max_participants=data.get('max_participants'),
        registration_deadline=registration_deadline,
        requires_registration=data.get('requires_registration', False),
        is_free_entry=data.get('is_free_entry', True)
    )

    db.session.add(new_event)
    db.session.commit()

    return new_event


def update_event(event_id, data):
    """
    Updates an existing event with the provided data.
    """
    event = Event.query.get(event_id)
    if not event:
        return None  # Signal to the route that the event was not found

    # --- Validation ---
    # Validate organizer (temporary auth stand-in)
    if 'organizer_id' in data:
        organizer = User.query.get(data['organizer_id'])
        if not organizer:
            raise ValueError(f"Organizer with ID {data['organizer_id']} not found.")
        if not organizer.role or organizer.role.name not in ['organizer', 'admin']:
            raise ValueError("User does not have permission to modify events.")

    # Validate category if provided
    if 'category_id' in data:
        category = Category.query.get(data['category_id'])
        if not category:
            raise ValueError(f"Category with ID {data['category_id']} not found.")
        event.category_id = data['category_id']

    # --- Update Fields ---
    updatable_fields = [
        'title', 'description', 'location', 'participation_type',
        'registration_link', 'qr_code_url', 'status', 'max_participants',
        'requires_registration', 'is_free_entry'
    ]
    for field in updatable_fields:
        if field in data:
            setattr(event, field, data[field])

    # Handle dates separately for parsing
    date_fields = ['start_at', 'end_at', 'registration_deadline']
    for field in date_fields:
        if field in data:
            if data[field]:
                try:
                    setattr(event, field, datetime.fromisoformat(data[field]))
                except (TypeError, ValueError):
                    raise ValueError(f"Invalid date format for '{field}'.")
            else:
                setattr(event, field, None)

    # --- Post-update Validation ---
    if event.end_at and event.start_at and event.end_at <= event.start_at:
        raise ValueError("'end_at' must be after 'start_at'.")

    db.session.commit()
    return event


def delete_event(event_id):
    """Deletes an event by its ID."""
    event = Event.query.get(event_id)
    if not event:
        return False  # Signal that the event was not found

    db.session.delete(event)
    db.session.commit()
    return True


# Define allowed statuses for validation
ALLOWED_EVENT_STATUSES = ["draft", "pending", "active", "cancelled", "archived", "updated"]


def update_event_status(event_id, new_status):
    """
    Updates the status of an existing event.

    Args:
        event_id (int): The ID of the event to update.
        new_status (str): The new status for the event.

    Returns:
        Event: The updated Event object, or None if the event was not found.
    Raises:
        ValueError: If the new_status is invalid.
    """
    event = Event.query.get(event_id)
    if not event:
        return None

    if not isinstance(new_status, str) or new_status.lower() not in ALLOWED_EVENT_STATUSES:
        raise ValueError(f"Invalid status '{new_status}'. Allowed statuses are: {', '.join(ALLOWED_EVENT_STATUSES)}")

    event.status = new_status.lower()
    event.updated_at = datetime.utcnow()
    db.session.commit()
    return event


def search_events(filters):
    """
    Searches and filters events based on provided criteria.

    Args:
        filters (dict): A dictionary of query parameters for filtering.
                        Supported keys: 'title', 'category_id', 'organizer_id',
                        'participation_type', 'status', 'location'.

    Returns:
        list: A list of Event objects matching the criteria.
    Raises:
        ValueError: If a filter parameter has an invalid type.
    """
    query = Event.query.options(joinedload(Event.category), joinedload(Event.organizer))

    if 'title' in filters and filters['title']:
        query = query.filter(Event.title.ilike(f"%{filters['title']}%"))
    if 'category_id' in filters and filters['category_id']:
        try:
            category_id = int(filters['category_id'])
            query = query.filter(Event.category_id == category_id)
        except ValueError:
            raise ValueError("category_id must be an integer.")
    if 'organizer_id' in filters and filters['organizer_id']:
        try:
            organizer_id = int(filters['organizer_id'])
            query = query.filter(Event.organizer_id == organizer_id)
        except ValueError:
            raise ValueError("organizer_id must be an integer.")
    if 'participation_type' in filters and filters['participation_type']:
        query = query.filter(Event.participation_type == filters['participation_type'])
    if 'status' in filters and filters['status']:
        query = query.filter(Event.status == filters['status'])
    if 'location' in filters and filters['location']:
        query = query.filter(Event.location.ilike(f"%{filters['location']}%"))

    query = query.order_by(Event.start_at.desc())
    return query.all()


def get_calendar_events(from_date=None, to_date=None):
    """
    Retrieves events for a calendar view, optionally filtered by a date range.

    An event is included if it overlaps with the given date range.

    Args:
        from_date (datetime, optional): The start of the date range.
        to_date (datetime, optional): The end of the date range.

    Returns:
        list: A list of Event objects.
    """
    query = Event.query

    # Filter by date range if both parameters are provided.
    # The logic includes events that overlap with the given range.
    if from_date and to_date:
        query = query.filter(
            Event.start_at <= to_date,  # Event starts before the range ends
            Event.end_at >= from_date    # Event ends after the range starts
        )

    return query.order_by(Event.start_at.asc()).all()