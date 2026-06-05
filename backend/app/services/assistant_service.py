import re
from datetime import datetime, timedelta
from sqlalchemy import or_
from sqlalchemy.orm import joinedload
from backend.app.extensions import db
from backend.app.models.event import Event
from backend.app.models.category import Category
from backend.app.models.registration import Registration
from backend.app.models.feedback import Feedback
from backend.app.services import event_service

def remove_diacritics(text):
    """Replaces Romanian diacritics with base characters."""
    mapping = {
        'ă': 'a', 'â': 'a', 'î': 'i', 'ș': 's', 'ş': 's', 'ț': 't', 'ţ': 't',
        'Ă': 'a', 'Â': 'a', 'Î': 'i', 'Ș': 's', 'Ş': 's', 'Ț': 't', 'Ţ': 't'
    }
    for k, v in mapping.items():
        text = text.replace(k, v)
    return text

def detect_language(text):
    """Simple heuristic to detect if the query is in Romanian."""
    ro_keywords = ['ce', 'care', 'sunt', 'evenimente', 'recomanzi', 'saptamana', 'locuri', 'pline', 'cariera', 'lista', 'asteptare', 'este', 'exista', 'am', 'mele', 'inscrierile', 'inscriere', 'badge', 'badge-uri', 'recompense', 'obtin']
    words = set(re.findall(r'\b\w+\b', text))
    if any(word in ro_keywords for word in words):
        return 'ro'
    return 'en'

def _serialize_assistant_event(event):
    """Compact serialization for the assistant response."""
    return {
        "id": event.id,
        "title": event.title,
        "category_name": event.category.name if getattr(event, 'category', None) else None,
        "start_at": event.start_at.isoformat() if event.start_at else None,
        "location": event.location,
        "participation_type": event.participation_type
    }

def handle_assistant_message(message, current_user=None):
    """
    Rule-based assistant logic.
    Returns answer, suggestions, and events.
    """
    if not message or not isinstance(message, str):
        message = ""

    # Normalization
    clean_message = remove_diacritics(message).strip().lower()

    # Language Detection
    lang = detect_language(clean_message)

    # Suggestions based on language
    if lang == 'ro':
        suggestions = [
            "Ce evenimente sunt populare?",
            "Ce îmi recomanzi?",
            "Ce evenimente am săptămâna asta?",
            "Ce badge-uri am?"
        ]
        empty_msg = "Te rog să pui o întrebare despre UniEvents."
        fallback_msg = "Nu am înțeles exact întrebarea. Poți întreba despre evenimente populare, evenimente online, workshop-uri IT, carieră sau lista de așteptare."
        login_req_msg = "Pentru această acțiune personalizată, te rog să te autentifici ca participant."
    else:
        suggestions = [
            "What events are popular?",
            "What do you recommend?",
            "What events do I have this week?",
            "What badges do I have?"
        ]
        empty_msg = "Please type a question about UniEvents."
        fallback_msg = "I did not fully understand the question. You can ask about popular events, online events, IT workshops, career events, or waitlists."
        login_req_msg = "Please log in as a participant to see personalized information."

    if not clean_message:
        return {"answer": empty_msg, "suggestions": suggestions, "events": []}

    now = datetime.utcnow()
    answer = ""
    events = []

    # Helper for exact word or phrase matching
    def has_keyword(keywords):
        for kw in keywords:
            # For single words, use strict word boundaries to prevent substring issues (e.g. 'ai' in 'available')
            if ' ' not in kw:
                if re.search(rf'\b{re.escape(kw)}\b', clean_message):
                    return True
            # For multi-word phrases, a simple substring check is often safer and more robust
            else:
                if kw in clean_message:
                    return True
        return False

    # Helper for base query
    base_query = Event.query.options(joinedload(Event.category)).filter(
        Event.status == 'published',
        Event.start_at > now
    )

    is_student = current_user and current_user.role and current_user.role.name == 'student'

    # PERSONALIZED RULE 1: Recommendations
    if has_keyword(['recommend', 'recommendation', 'suggest', 'for me', 'recomanzi', 'recomandari', 'recomandări', 'pentru mine']):
        if not is_student:
            return {"answer": login_req_msg, "suggestions": suggestions, "events": []}

        recommendations = event_service.get_recommended_events(current_user.id, limit=5)
        events = [_serialize_assistant_event(e) for e in recommendations]
        if events:
            answer = "Ți-am găsit câteva evenimente recomandate pe baza participărilor tale." if lang == 'ro' else "I found a few events recommended based on your participation history."
        else:
            answer = "Nu am suficiente date încă pentru a-ți oferi recomandări personalizate. Înscrie-te la câteva evenimente pentru a primi sugestii mai relevante." if lang == 'ro' else "I do not have enough history yet to offer personalized recommendations. Join a few events to get more relevant suggestions."

        return {"answer": answer, "suggestions": suggestions, "events": events}

    # PERSONALIZED RULE 2: My events this week
    if has_keyword(['my events', 'my registrations', 'this week', 'have i', 'evenimentele mele', 'saptamana asta', 'săptămâna asta', 'ce evenimente am', 'inscrierile mele', 'înscrierile mele']):
        if not is_student:
            return {"answer": login_req_msg, "suggestions": suggestions, "events": []}

        week_end = now + timedelta(days=7)
        results = (
            db.session.query(Event)
            .join(Registration, Registration.event_id == Event.id)
            .filter(Registration.user_id == current_user.id)
            .filter(Registration.status == "confirmed")
            .filter(Event.start_at >= now)
            .filter(Event.start_at <= week_end)
            .order_by(Event.start_at.asc())
            .limit(5)
            .all()
        )

        events = [_serialize_assistant_event(e) for e in results]
        if events:
            answer = "Acestea sunt evenimentele tale confirmate din următoarele 7 zile." if lang == 'ro' else "These are your confirmed events for the next 7 days."
        else:
            answer = "Nu ai evenimente confirmate în următoarele 7 zile." if lang == 'ro' else "You do not have confirmed events in the next 7 days."

        return {"answer": answer, "suggestions": suggestions, "events": events}

    # PERSONALIZED RULE 4 (Checking before general waitlist): My waitlist
    if has_keyword(['my waitlist', 'waitlisted', 'am i on a waitlist', 'sunt pe lista', 'lista mea de asteptare']):
        if not is_student:
            # For waitlist, if they ask generally, they might still get the general rule. 
            # But if they ask "AM I", they should get login req.
            if has_keyword(['am i', 'sunt', 'mea']):
                return {"answer": login_req_msg, "suggestions": suggestions, "events": []}
            # Else fall through to general waitlist rule
        else:
            results = (
                db.session.query(Event)
                .join(Registration, Registration.event_id == Event.id)
                .filter(Registration.user_id == current_user.id)
                .filter(Registration.status == "waitlisted")
                .filter(Event.start_at > now)
                .order_by(Event.start_at.asc())
                .limit(5)
                .all()
            )
            events = [_serialize_assistant_event(e) for e in results]
            if events:
                answer = "Ești pe lista de așteptare pentru următoarele evenimente:" if lang == 'ro' else "You are on the waitlist for the following events:"
            else:
                answer = "Nu ești pe lista de așteptare pentru niciun eveniment viitor." if lang == 'ro' else "You are not on the waitlist for any upcoming events."

            return {"answer": answer, "suggestions": suggestions, "events": events}

    # PERSONALIZED RULE 3: My badges
    if has_keyword(['badge', 'reward', 'earn', 'recompense', 'obtin', 'obtine', 'castig', 'câștig']):
        if not is_student:
            return {"answer": login_req_msg, "suggestions": suggestions, "events": []}

        # Summary logic similar to users.py
        total_confirmed = db.session.query(Registration).filter_by(user_id=current_user.id, status="confirmed").count()
        total_feedback = db.session.query(Feedback).filter_by(user_id=current_user.id).count()

        earned = []
        if total_confirmed >= 3: earned.append("Campus Active")
        if total_feedback >= 1: earned.append("Feedback Contributor")

        # Category summary
        cat_counts = db.session.query(Category.name, db.func.count(Registration.id))\
            .join(Event, Event.category_id == Category.id)\
            .join(Registration, Registration.event_id == Event.id)\
            .filter(Registration.user_id == current_user.id)\
            .filter(Registration.status == "confirmed")\
            .group_by(Category.name).all()

        counts = {name: count for name, count in cat_counts}
        if counts.get("Career", 0) >= 1: earned.append("Career Starter")
        if counts.get("Volunteering", 0) >= 1: earned.append("Volunteer Spirit")
        if counts.get("Sport", 0) >= 1: earned.append("Sports Participant")
        if (counts.get("Workshop", 0) + counts.get("Conference", 0)) >= 2: earned.append("Tech Explorer")

        if lang == 'ro':
            answer = f"Ai {total_confirmed} înscrieri confirmate și {total_feedback} feedback-uri trimise."
            if earned:
                answer += f" Badge-uri obținute: {', '.join(earned)}."
            else:
                answer += " Încă nu ai obținut badge-uri, dar ești pe drumul cel bun!"
        else:
            answer = f"You have {total_confirmed} confirmed registrations and {total_feedback} submitted feedback entries."
            if earned:
                answer += f" Earned badges: {', '.join(earned)}."
            else:
                answer += " You haven't earned any badges yet, but you're on the right track!"

        return {"answer": answer, "suggestions": suggestions, "events": []}

    # RULE A: Popular Events
    if has_keyword(['popular', 'populare', 'top', 'asteptate', 'most awaited']):
        popular_results = event_service.get_popular_upcoming_events(limit=5)
        # popular_results is a list of tuples (Event, count)
        events = [_serialize_assistant_event(e[0]) for e in popular_results]

        if events:
            answer = "Am găsit câteva evenimente populare în UniEvents." if lang == 'ro' else "I found a few popular upcoming events."
        else:
            answer = "Momentan nu sunt evenimente populare disponibile." if lang == 'ro' else "There are no popular events available at the moment."

        return {"answer": answer, "suggestions": suggestions, "events": events}

    # RULE B: IT / Workshop / Tech
    if has_keyword(['it', 'tech', 'tehnologie', 'tehnologii', 'workshop', 'atelier', 'coding', 'software', 'ai', 'inteligenta']):
        results = base_query.join(Category).filter(
            or_(
                Category.name.in_(['Workshop', 'Conference']),
                Event.title.ilike('%tech%'),
                Event.title.ilike('%it%'),
                Event.title.ilike('%software%')
            )
        ).order_by(Event.start_at.asc()).limit(5).all()

        events = [_serialize_assistant_event(e) for e in results]
        if events:
            answer = "Iată câteva evenimente și workshop-uri IT viitoare:" if lang == 'ro' else "Here are some upcoming IT events and workshops:"
        else:
            answer = "Nu am găsit evenimente IT sau workshop-uri momentan." if lang == 'ro' else "I couldn't find any IT events or workshops at the moment."

        return {"answer": answer, "suggestions": suggestions, "events": events}

    # RULE C: Career Events
    if has_keyword(['career', 'cariera', 'job', 'joburi', 'angajare', 'internship', 'stagiu']):
        results = base_query.join(Category).filter(
            or_(
                Category.name == 'Career',
                Event.title.ilike('%career%'),
                Event.title.ilike('%cariera%'),
                Event.title.ilike('%job%')
            )
        ).order_by(Event.start_at.asc()).limit(5).all()

        events = [_serialize_assistant_event(e) for e in results]
        if events:
            answer = "Acestea sunt evenimentele de carieră și angajare disponibile:" if lang == 'ro' else "Here are the available career and job-related events:"
        else:
            answer = "Momentan nu sunt evenimente de carieră planificate." if lang == 'ro' else "There are no career events scheduled right now."

        return {"answer": answer, "suggestions": suggestions, "events": events}

    # RULE D: Online Events
    if has_keyword(['online', 'virtual', 'remote', 'distanta']):
        results = base_query.filter(
            Event.participation_type.in_(['online', 'hybrid'])
        ).order_by(Event.start_at.asc()).limit(5).all()

        events = [_serialize_assistant_event(e) for e in results]
        if events:
            answer = "Iată evenimentele care pot fi accesate online sau în format hibrid:" if lang == 'ro' else "Here are the events that can be attended online or in hybrid format:"
        else:
            answer = "Nu am găsit evenimente online pentru perioada următoare." if lang == 'ro' else "I couldn't find any online events for the upcoming period."

        return {"answer": answer, "suggestions": suggestions, "events": events}

    # RULE E: Full / Waitlist
    if has_keyword(['full', 'waitlist', 'waiting list', 'no spaces', 'spots', 'seats', 'available spots', 'plin', 'pline', 'lista de asteptare', 'asteptare', 'locuri', 'disponibil', 'disponibile']):
        answer_ro = "Dacă un eveniment necesită înregistrare și este plin, vei avea opțiunea să apeși pe 'Join Waitlist' (Alătură-te listei de așteptare) pe pagina evenimentului. Te vom notifica dacă se eliberează un loc!"
        answer_en = "If an event requires registration and is full, you will see a 'Join Waitlist' option on the event page. We will notify you if a spot becomes available!"
        answer = answer_ro if lang == 'ro' else answer_en
        return {"answer": answer, "suggestions": suggestions, "events": []}

    # RULE F: FIESC
    if has_keyword(['fiesc']):
        results = base_query.filter(
            or_(
                Event.title.ilike('%fiesc%'),
                Event.description.ilike('%fiesc%')
            )
        ).order_by(Event.start_at.asc()).limit(5).all()

        events = [_serialize_assistant_event(e) for e in results]
        if events:
            answer = "Iată evenimentele asociate cu FIESC:" if lang == 'ro' else "Here are the events associated with FIESC:"
        else:
            answer = "Momentan nu am găsit evenimente viitoare organizate de sau asociate cu FIESC." if lang == 'ro' else "I couldn't find any upcoming events associated with FIESC at the moment."

        return {"answer": answer, "suggestions": suggestions, "events": events}

    # Fallback
    return {
        "answer": fallback_msg,
        "suggestions": suggestions,
        "events": []
    }

