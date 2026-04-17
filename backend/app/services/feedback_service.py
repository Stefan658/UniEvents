from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import joinedload
from backend.app.extensions import db
from backend.app.models.user import User # Needed for joinedload in get_feedback_by_id
from sqlalchemy import func # Import func for aggregate functions
from backend.app.models.feedback import Feedback
from backend.app.models.event import Event


def create_feedback(user_id, event_id, rating, comment):
    """Creează o nouă înregistrare de feedback în baza de date."""
    try:
        new_feedback = Feedback(
            user_id=user_id,
            event_id=event_id,
            rating=rating,
            comment=comment,
        )
        db.session.add(new_feedback)
        db.session.commit()
        return new_feedback
    except IntegrityError:
        db.session.rollback()
        # Adăugăm un prefix specific pentru a indica o eroare de duplicat
        raise ValueError("FeedbackDuplicateError: Feedback-ul pentru acest utilizator și eveniment există deja.")


def get_all_feedback():
    """
    Retrieves all feedback entries, eagerly loading associated user and event data.
    """
    feedback_list = Feedback.query.options(
        joinedload(Feedback.user),
        joinedload(Feedback.event)
    ).order_by(Feedback.created_at.desc()).all()
    return feedback_list


def get_feedback_for_event(event_id):
    """
    Retrieves all feedback for a specific event.

    Args:
        event_id (int): The ID of the event.

    Returns:
        list | None: A list of Feedback objects if the event is found, otherwise None.
    """
    # First, check if the event exists.
    event = Event.query.get(event_id)
    if not event:
        return None  # Signal to the route that the event was not found.

    # Query for feedback, joining user details for serialization.
    feedback_list = (
        Feedback.query.options(joinedload(Feedback.user))
        .filter(Feedback.event_id == event_id)
        .order_by(Feedback.created_at.desc())
        .all()
    )
    return feedback_list


def get_feedback_summary_for_event(event_id):
    """
    Calculates a summary of feedback for a specific event.
    Returns None if the event does not exist.
    """
    event = Event.query.get(event_id)
    if not event:
        return None  # Indicate event not found

    # Query for feedback summary statistics
    summary_data = db.session.query(
        func.count(Feedback.id).label('total_feedbacks'),
        func.avg(Feedback.rating).label('average_rating'),
        func.min(Feedback.rating).label('min_rating'),
        func.max(Feedback.rating).label('max_rating')
    ).filter(Feedback.event_id == event_id).one_or_none()

    # Handle case where there is no feedback for the event
    total_feedbacks = summary_data.total_feedbacks if summary_data else 0
    average_rating = round(summary_data.average_rating, 2) if summary_data and summary_data.average_rating is not None else None
    min_rating = summary_data.min_rating if summary_data and summary_data.min_rating is not None else None
    max_rating = summary_data.max_rating if summary_data and summary_data.max_rating is not None else None

    return {
        "event_id": event.id,
        "event_title": event.title,
        "total_feedbacks": total_feedbacks,
        "average_rating": average_rating,
        "min_rating": min_rating,
        "max_rating": max_rating,
    }


def get_feedback_by_id(feedback_id):
    """
    Retrieves a single feedback entry by its ID, with associated user and event.
    """
    return Feedback.query.options(
        joinedload(Feedback.user),
        joinedload(Feedback.event)
    ).get(feedback_id)


def update_feedback(feedback_id, data):
    """
    Updates an existing feedback entry.
    Allows updating 'rating' and 'comment'.
    """
    # Eager load the user relationship for serialization in the route
    feedback_entry = Feedback.query.options(joinedload(Feedback.user)).get(feedback_id)
    if not feedback_entry:
        return None  # Indicate that the feedback was not found

    update_made = False
    if 'rating' in data and data['rating'] is not None:
        rating = data['rating']
        if not isinstance(rating, int) or not (1 <= rating <= 5):
            raise ValueError("Rating-ul trebuie să fie un număr întreg între 1 și 5.")
        feedback_entry.rating = rating
        update_made = True

    if 'comment' in data and data['comment'] is not None:
        feedback_entry.comment = data['comment']
        update_made = True

    if not update_made:
        raise ValueError("Payload-ul este gol sau nu conține câmpuri valide pentru actualizare (rating, comment).")

    db.session.commit()
    return feedback_entry


def delete_feedback(feedback_id):
    """
    Deletes a feedback entry by its ID.
    """
    feedback_entry = Feedback.query.get(feedback_id)
    if not feedback_entry:
        return False  # Indicate that the feedback was not found

    db.session.delete(feedback_entry)
    db.session.commit()
    return True  # Indicate success