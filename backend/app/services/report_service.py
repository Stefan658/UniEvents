from sqlalchemy import func
from backend.app.extensions import db
from backend.app.models.user import User
from backend.app.models.event import Event
from backend.app.models.role import Role
from backend.app.models.feedback import Feedback
from backend.app.models.registration import Registration # New import


def get_summary_report():
    """
    Generates a summary report of the application's data.
    NOTE: This is an assumed implementation based on the existing route.
    """
    total_events = Event.query.count()
    total_users = User.query.count()
    return {
        "total_events": total_events,
        "total_users": total_users,
    }


def get_events_by_organizer_report():
    """
    Generates a report of events grouped by organizer, including those with zero events.
    """
    report_data = (
        db.session.query(
            User.id.label("organizer_id"),
            func.concat(User.first_name, ' ', User.last_name).label("organizer_full_name"),
            User.email.label("organizer_email"),
            func.count(Event.id).label("total_events"),
        )
        .join(Role)
        .outerjoin(Event, User.id == Event.organizer_id)
        .filter(Role.name == "organizer")
        .group_by(User.id, User.first_name, User.last_name, User.email)
        .order_by(func.count(Event.id).desc())
        .all()
    )

    # The query returns a list of Row objects which can be converted to dicts.
    return [row._asdict() for row in report_data]


def get_registrations_by_event_report():
    """
    Generates a report of registrations grouped by event,
    including event details and organizer information.
    Events with zero registrations are also included.
    """
    report_data = (
        db.session.query(
            Event.id.label("event_id"),
            Event.title.label("event_title"),
            User.id.label("organizer_id"),
            func.concat(User.first_name, ' ', User.last_name).label("organizer_full_name"),
            func.count(Registration.id).label("total_registrations"),
        )
        .outerjoin(Registration, Event.id == Registration.event_id) # Use outerjoin to include events with no registrations
        .join(User, Event.organizer_id == User.id) # Join with User to get organizer details
        .group_by(Event.id, Event.title, User.id, User.first_name, User.last_name)
        .order_by(func.count(Registration.id).desc()) # Order by total registrations descending
        .all()
    )
    # Convert SQLAlchemy Row objects to dictionaries
    return [row._asdict() for row in report_data]


def get_feedback_by_event_report():
    """
    Generates a report of feedback grouped by event,
    including event details and aggregated feedback statistics.
    Events with zero feedback are also included.
    """
    report_data = (
        db.session.query(
            Event.id.label("event_id"),
            Event.title.label("event_title"),
            func.count(Feedback.id).label("total_feedbacks"),
            func.avg(Feedback.rating).label("average_rating"),
        )
        .outerjoin(Feedback, Event.id == Feedback.event_id) # Use outerjoin to include events with no feedback
        .group_by(Event.id, Event.title)
        .order_by(func.count(Feedback.id).desc()) # Order by total feedbacks descending
        .all()
    )

    # Process results to handle None for average_rating and round it
    serialized_report = []
    for row in report_data:
        row_dict = row._asdict()
        row_dict['average_rating'] = round(row_dict['average_rating'], 2) if row_dict['average_rating'] is not None else None
        serialized_report.append(row_dict)
    return serialized_report