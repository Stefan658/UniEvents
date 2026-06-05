import re
from datetime import datetime
from sqlalchemy import or_
from sqlalchemy.orm import joinedload
from backend.app.extensions import db
from backend.app.models.event import Event
from backend.app.models.category import Category
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
    ro_keywords = ['ce', 'care', 'sunt', 'evenimente', 'recomanzi', 'saptamana', 'locuri', 'pline', 'cariera', 'lista', 'asteptare', 'este', 'exista']
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
            "Ce evenimente online sunt disponibile?",
            "Ce workshop-uri IT sunt disponibile?",
            "Ce evenimente au listă de așteptare?"
        ]
        empty_msg = "Te rog să pui o întrebare despre UniEvents."
        fallback_msg = "Nu am înțeles exact întrebarea. Poți întreba despre evenimente populare, evenimente online, workshop-uri IT, carieră sau lista de așteptare."
    else:
        suggestions = [
            "What events are popular?",
            "What online events are available?",
            "What IT workshops are available?",
            "Which events have a waitlist?"
        ]
        empty_msg = "Please type a question about UniEvents."
        fallback_msg = "I did not fully understand the question. You can ask about popular events, online events, IT workshops, career events, or waitlists."

    if not clean_message:
        return {"answer": empty_msg, "suggestions": suggestions, "events": []}

    now = datetime.utcnow()
    answer = ""
    events = []

    # Helper for base query
    base_query = Event.query.options(joinedload(Event.category)).filter(
        Event.status == 'published',
        Event.start_at > now
    )

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
