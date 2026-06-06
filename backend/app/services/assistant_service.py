import re
import csv
import os
from pathlib import Path
from datetime import datetime, timedelta
from sqlalchemy import or_, and_
from sqlalchemy.orm import joinedload
from backend.app.extensions import db
from backend.app.models.user import User
from backend.app.models.event import Event
from backend.app.models.category import Category
from backend.app.models.registration import Registration
from backend.app.models.feedback import Feedback
from backend.app.services import event_service

# Knowledge Base Cache
_kb_cache = None

def _load_knowledge_base():
    """Loads the USV knowledge base from CSV into memory."""
    global _kb_cache
    if _kb_cache is not None:
        return _kb_cache

    _kb_cache = []
    # Path relative to project root or this file
    possible_paths = [
        Path("backend/test_data/usv_knowledge_base.csv"),
        Path("backend/data/usv_knowledge_base.csv"),
        Path(__file__).parent.parent.parent / "test_data" / "usv_knowledge_base.csv"
    ]

    csv_path = None
    for p in possible_paths:
        if p.exists():
            csv_path = p
            break

    if not csv_path:
        return []

    try:
        with open(csv_path, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                _kb_cache.append(row)
    except Exception:
        # Fail silently
        pass
    
    return _kb_cache

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
    ro_keywords = [
        'ce', 'care', 'sunt', 'evenimente', 'recomanzi', 'saptamana', 'locuri', 
        'pline', 'cariera', 'lista', 'asteptare', 'este', 'exista', 'am', 'mele', 
        'inscrierile', 'inscriere', 'badge', 'badge-uri', 'recompense', 'obtin',
        'arata', 'aratami', 'arata-mi', 'imi', 'cele', 'vreau', 'top', 'sportive',
        'voluntariat', 'cultural', 'stiintific', 'conferinta', 'cum', 'e', 'viata',
        'student', 'in', 'suceava', 'unde', 'pot', 'manca', 'mancare', 'fac',
        'construiesc', 'de', 'la'
    ]
    words = set(re.findall(r'\b\w+\b', text))
    if any(word in ro_keywords for word in words):
        return 'ro'
    return 'en'

def _is_test_event(event):
    """Detects if an event is a technical validation/test event."""
    test_terms = ['waitlist validation', 'validation demo', 'demo event', 'test event']
    title_lower = event.title.lower()
    return any(term in title_lower for term in test_terms)

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
    Rule-based assistant logic refined for enriched corpus.
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
            "Ce workshop-uri IT sunt disponibile?",
            "Ce facultăți are USV?",
            "Ce facilități are campusul?",
            "Ce îmi recomanzi?"
        ]
        empty_msg = "Te rog să pui o întrebare despre UniEvents sau campusul USV."
        fallback_msg = "Nu am înțeles exact întrebarea. Poți întreba despre evenimente populare, noutăți campus, facultăți, carieră sau activități studențești."
        login_req_msg = "Pentru această acțiune personalizată, te rog să te autentifici ca participant."
    else:
        suggestions = [
            "What events are popular?",
            "What IT workshops are available?",
            "What faculties does USV have?",
            "What is student life like in Suceava?",
            "What do you recommend?"
        ]
        empty_msg = "Please type a question about UniEvents or the USV campus."
        fallback_msg = "I did not fully understand the question. You can ask about popular events, campus info, faculties, career, or student activities."
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

    # Helper to match knowledge base
    def match_knowledge():
        kb = _load_knowledge_base()
        best_match = None
        best_score = 0
        
        for row in kb:
            kws_str = row['keywords_ro'] if lang == 'ro' else row['keywords_en']
            kws = [k.strip() for k in kws_str.split(';') if k.strip()]
            score = 0
            
            for kw in kws:
                kw_norm = remove_diacritics(kw).lower()
                if not kw_norm: continue
                
                # Full phrase match in message
                if kw_norm in clean_message:
                    score += len(kw_norm) * 2
                
                # Check for individual words if it's a multi-word keyword
                if ' ' in kw_norm:
                    for part in kw_norm.split():
                        if len(part) > 2 and re.search(rf'\b{re.escape(part)}\b', clean_message):
                            score += len(part)

            if score > best_score:
                best_score = score
                best_match = row
            elif score > 0 and score == best_score and best_match:
                # Tie breaker: prefer official over guidance
                if row.get('confidence') == 'official' and best_match.get('confidence') != 'official':
                    best_match = row

        if best_match and best_score >= 3: # Minimum threshold
            ans = best_match['answer_ro'] if lang == 'ro' else best_match['answer_en']
            
            # Optional source note
            source = best_match.get('source_reference')
            if source:
                note = f"\n\n(Sursă: {source})" if lang == 'ro' else f"\n\n(Source: {source})"
                ans += note
            
            return ans
        return None

    # Base query for upcoming published events
    # We exclude test/validation events from general discovery
    test_event_patterns = ['%waitlist validation%', '%validation demo%', '%demo event%', '%test%']
    
    def get_discovery_query():
        query = Event.query.options(joinedload(Event.category)).filter(
            Event.status == 'published',
            Event.start_at > now
        )
        for pattern in test_event_patterns:
            query = query.filter(Event.title.notilike(pattern))
        return query

    is_student = current_user and current_user.role and current_user.role.name == 'student'

    # PERSONALIZED RULE 1: Recommendations
    if has_keyword(['recommend', 'recommendation', 'suggest', 'for me', 'recomanzi', 'recomandari', 'recomandări', 'pentru mine']):
        if not is_student:
            return {"answer": login_req_msg, "suggestions": suggestions, "events": []}

        recommendations = event_service.get_recommended_events(current_user.id, limit=5)
        # Exclude test events from recommendations too
        events = [_serialize_assistant_event(e) for e in recommendations if not _is_test_event(e)]
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
            if has_keyword(['am i', 'sunt', 'mea']):
                return {"answer": login_req_msg, "suggestions": suggestions, "events": []}
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

        total_confirmed = db.session.query(Registration).filter_by(user_id=current_user.id, status="confirmed").count()
        total_feedback = db.session.query(Feedback).filter_by(user_id=current_user.id).count()

        earned = []
        if total_confirmed >= 3: earned.append("Campus Active")
        if total_feedback >= 1: earned.append("Feedback Contributor")

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

    # RULE CV GUIDANCE: Intent override for KB guidance about CV/Portfolio
    # RULE CV GUIDANCE: Intent override for KB guidance about CV/Portfolio
    cv_guidance_keywords = [
        'cum imi construiesc cv', 'cum imi fac cv', 'construiesc cv', 'fac cv', 'cv-ul', 'cv ul',
        'how do i build my cv', 'how can i build my cv', 'build my resume', 'improve my resume',
        'linkedin profile', 'portfolio'
    ]
    if has_keyword(cv_guidance_keywords):
        kb_answer = match_knowledge()
        if kb_answer:
            return {"answer": kb_answer, "suggestions": suggestions, "events": []}

    # RULE A: Popular / Trending Events

    if has_keyword(['popular', 'populare', 'top', 'asteptate', 'most awaited', 'trending']):
        popular_results = event_service.get_popular_upcoming_events(limit=10)
        # Exclude test events from popular results
        events = [_serialize_assistant_event(e[0]) for e in popular_results if not _is_test_event(e[0])][:5]

        if events:
            answer = "Am găsit câteva evenimente populare în UniEvents." if lang == 'ro' else "I found a few popular upcoming events."
        else:
            answer = "Momentan nu sunt evenimente populare disponibile." if lang == 'ro' else "There are no popular events available at the moment."

        return {"answer": answer, "suggestions": suggestions, "events": events}

    # RULE B: IT / Workshop / Tech
    tech_keywords = [
        'it', 'tech', 'tehnologie', 'tehnologii', 'workshop', 'workshops', 'atelier', 'coding', 
        'software', 'ai', 'inteligenta', 'development', 'developer', 'programming', 'programare', 
        'web', 'cloud', 'cybersecurity', 'securitate', 'react', 'python', 'flask', 'mobile', 
        'flutter', 'robotics', 'robotica', 'embedded', 'iot', 'infrastructure'
    ]
    if has_keyword(tech_keywords):
        # We use explicit word boundaries for short terms like 'it', 'ai' via has_keyword logic
        # For the query, we use explicit matches to ensure relevance
        tech_terms = [
            'tech', 'software', 'coding', 'ai', 'programming', 'programare', 'web', 'cloud', 
            'cybersecurity', 'securitate', 'react', 'python', 'flask', 'flutter', 'iot', 
            'robotics', 'robotica', 'embedded'
        ]
        results = get_discovery_query().join(Category).filter(
            or_(
                Category.name.in_(['Workshop', 'Conference']),
                *[Event.title.ilike(f"%{term}%") for term in tech_terms],
                *[Event.description.ilike(f"%{term}%") for term in tech_terms]
            )
        ).order_by(Event.start_at.asc()).limit(5).all()

        events = [_serialize_assistant_event(e) for e in results]
        if events:
            answer = "Iată câteva evenimente și workshop-uri IT viitoare:" if lang == 'ro' else "Here are some upcoming IT events and workshops:"
        else:
            answer = "Nu am găsit evenimente IT sau workshop-uri momentan." if lang == 'ro' else "I couldn't find any IT events or workshops at the moment."

        return {"answer": answer, "suggestions": suggestions, "events": events}

    # RULE C: Career Events
    career_keywords = [
        'career', 'cariera', 'job', 'joburi', 'angajare', 'internship', 'stagiu', 
        'cv', 'linkedin', 'interview', 'interviu', 'interviuri', 'career fair'
    ]
    if has_keyword(career_keywords):
        career_terms = ['career', 'cariera', 'job', 'internship', 'cv', 'linkedin', 'interview', 'interviu']
        results = get_discovery_query().join(Category).filter(
            or_(
                Category.name == 'Career',
                *[Event.title.ilike(f"%{term}%") for term in career_terms]
            )
        ).order_by(Event.start_at.asc()).limit(5).all()

        events = [_serialize_assistant_event(e) for e in results]
        if events:
            answer = "Acestea sunt evenimentele de carieră și angajare disponibile:" if lang == 'ro' else "Here are the available career and job-related events:"
        else:
            answer = "Momentan nu sunt evenimente de carieră planificate." if lang == 'ro' else "There are no career events scheduled right now."

        return {"answer": answer, "suggestions": suggestions, "events": events}

    # RULE D: Online / Hybrid Events
    if has_keyword(['online', 'virtual', 'remote', 'distanta', 'distanta', 'hibrid', 'hybrid']):
        results = get_discovery_query().filter(
            Event.participation_type.in_(['online', 'hybrid'])
        ).order_by(Event.start_at.asc()).limit(5).all()

        events = [_serialize_assistant_event(e) for e in results]
        if events:
            answer = "Iată evenimentele care pot fi accesate online sau în format hibrid:" if lang == 'ro' else "Here are the events that can be attended online or in hybrid format:"
        else:
            answer = "Nu am găsit evenimente online pentru perioada următoare." if lang == 'ro' else "I couldn't find any online events for the upcoming period."

        return {"answer": answer, "suggestions": suggestions, "events": events}

    # RULE G: Sport Events
    sport_keywords = [
        'sport', 'sports', 'sportive', 'fotbal', 'football', 'baschet', 'basketball', 
        'sah', 'sah', 'chess', 'alergare', 'running', 'tenis', 'tennis', 'yoga'
    ]
    if has_keyword(sport_keywords):
        results = get_discovery_query().join(Category).filter(
            or_(
                Category.name.in_(['Sport', 'Sports']),
                *[Event.title.ilike(f"%{kw}%") for kw in ['sport', 'fotbal', 'baschet', 'sah', 'alergare', 'tenis', 'yoga', 'basketball', 'chess']]
            )
        ).order_by(Event.start_at.asc()).limit(5).all()

        events = [_serialize_assistant_event(e) for e in results]
        if events:
            answer = "Am găsit câteva evenimente sportive viitoare." if lang == 'ro' else "I found a few upcoming sports events."
        else:
            answer = "Nu am găsit evenimente sportive pentru perioada următoare." if lang == 'ro' else "I couldn't find any sports events for the upcoming period."
        return {"answer": answer, "suggestions": suggestions, "events": events}

    # RULE H: Volunteering Events
    vol_keywords = ['voluntariat', 'voluntar', 'volunteering', 'volunteer', 'caritate', 'charity', 'donare', 'donation', 'ecologic', 'eco', 'ong', 'ngo']
    if has_keyword(vol_keywords):
        # We use Category mostly, and very specific keywords for other categories to avoid false positives (like 'eco' matching 'reconnect')
        results = get_discovery_query().join(Category).filter(
            or_(
                Category.name == 'Volunteering',
                Event.title.ilike('%voluntar%'),
                Event.title.ilike('%charity%'),
                Event.title.ilike('%donation%'),
                Event.title.ilike('%donare%'),
                Event.title.ilike('%blood donation%'),
                Event.title.ilike('%eco clean-up%'),
                Event.title.ilike('%ong%'),
                Event.title.ilike('%ngo%')
            )
        ).order_by(Event.start_at.asc()).limit(5).all()

        events = [_serialize_assistant_event(e) for e in results]
        if events:
            answer = "Am găsit câteva oportunități de voluntariat." if lang == 'ro' else "I found a few volunteering opportunities."
        else:
            answer = "Momentan nu sunt oportunități de voluntariat disponibile." if lang == 'ro' else "There are no volunteering opportunities available right now."
        return {"answer": answer, "suggestions": suggestions, "events": events}

    # RULE I: Academic Events
    acad_keywords = ['academic', 'academice', 'research', 'seminar', 'stiintific', 'stiintifice', 'master', 'licenta', 'licenta', 'bachelor', 'thesis', 'cercetare']
    if has_keyword(acad_keywords):
        results = get_discovery_query().join(Category).filter(
            or_(
                Category.name == 'Academic',
                *[Event.title.ilike(f"%{kw}%") for kw in ['academic', 'research', 'seminar', 'stiintific', 'cercetare', 'thesis']]
            )
        ).order_by(Event.start_at.asc()).limit(5).all()

        events = [_serialize_assistant_event(e) for e in results]
        if events:
            answer = "Am găsit câteva evenimente academice viitoare." if lang == 'ro' else "I found a few upcoming academic events."
        else:
            answer = "Nu am găsit evenimente academice programate." if lang == 'ro' else "I couldn't find any scheduled academic events."
        return {"answer": answer, "suggestions": suggestions, "events": events}

    # RULE J: Social / Cultural Events
    social_keywords = [
        'social', 'cultural', 'culturale', 'cultura', 'cultura', 'culture', 'film', 'movie', 
        'teatru', 'theatre', 'theater', 'arta', 'arta', 'art', 'board games', 
        'jocuri', 'networking', 'mixer'
    ]
    if has_keyword(social_keywords):
        results = get_discovery_query().join(Category).filter(
            or_(
                Category.name.in_(['Social', 'Cultural']),
                *[Event.title.ilike(f"%{kw}%") for kw in ['social', 'cultur', 'film', 'teatru', 'arta', 'networking', 'mixer', 'movie']]
            )
        ).order_by(Event.start_at.asc()).limit(5).all()

        events = [_serialize_assistant_event(e) for e in results]
        if events:
            answer = "Am găsit câteva evenimente sociale și culturale." if lang == 'ro' else "I found a few social and cultural events."
        else:
            answer = "Nu am găsit evenimente sociale sau culturale momentan." if lang == 'ro' else "I couldn't find any social or cultural events at the moment."
        return {"answer": answer, "suggestions": suggestions, "events": events}

    # RULE K: Conference Events
    if has_keyword(['conference', 'conferences', 'conferinta', 'conferinte', 'conferințe', 'summit', 'simpozion', 'symposium']):
        results = get_discovery_query().join(Category).filter(
            or_(
                Category.name == 'Conference',
                *[Event.title.ilike(f"%{kw}%") for kw in ['conference', 'conferinta', 'summit', 'simpozion']]
            )
        ).order_by(Event.start_at.asc()).limit(5).all()

        events = [_serialize_assistant_event(e) for e in results]
        if events:
            answer = "Am găsit câteva conferințe viitoare." if lang == 'ro' else "I found a few upcoming conferences."
        else:
            answer = "Momentan nu sunt conferințe planificate." if lang == 'ro' else "There are no conferences planned at the moment."
        return {"answer": answer, "suggestions": suggestions, "events": events}

    # RULE L: Faculty / Organizer queries
    faculties = ['fdsa', 'feaa', 'fefs', 'fia', 'fiesc', 'fimar', 'fig', 'flsc', 'fmsb', 'fs', 'fsed']
    found_faculty = None
    for f in faculties:
        if has_keyword([f]):
            found_faculty = f.upper()
            break
    
    # We only trigger event discovery for faculty if user asks about "events", "organizes", "has"
    # or if no informational keywords like "what is", "despre", "ce este" are present.
    # This helps routing informational queries to the Knowledge Base later.
    event_intent_keywords = [
        'eveniment', 'evenimente', 'organizeaza', 'are', 'disponibile', 'calendar', 'program',
        'events', 'organizes', 'has', 'available', 'schedule'
    ]
    
    if found_faculty and (has_keyword(event_intent_keywords) or not has_keyword(['ce este', 'cine este', 'despre', 'what is', 'who is', 'about'])):
        results = get_discovery_query().join(User, Event.organizer_id == User.id).filter(
            or_(
                Event.title.ilike(f"%{found_faculty}%"),
                Event.description.ilike(f"%{found_faculty}%"),
                User.email.ilike(f"%{found_faculty}%"),
                User.first_name.ilike(f"%{found_faculty}%")
            )
        ).order_by(Event.start_at.asc()).limit(5).all()

        events = [_serialize_assistant_event(e) for e in results]
        if events:
            answer = f"Iată evenimentele asociate cu {found_faculty}:" if lang == 'ro' else f"Here are the events associated with {found_faculty}:"
            return {"answer": answer, "suggestions": suggestions, "events": events}
        # If no events found, we continue to see if Knowledge Base has info about the faculty

    # RULE E: Full / Waitlist
    if has_keyword(['waitlist', 'waiting list', 'full', 'sold out', 'no spaces', 'no seats', 'no spots', 'available spots', 'lista de asteptare', 'asteptare', 'plin', 'pline', 'fara locuri', 'nu mai sunt locuri']):
        answer_ro = "Dacă un eveniment necesită înregistrare și este plin, vei avea opțiunea să apeși pe 'Join Waitlist' (Alătură-te listei de așteptare) pe pagina evenimentului. Te vom notifica dacă se eliberează un loc!"
        answer_en = "If an event requires registration and is full, you will see a 'Join Waitlist' option on the event page. We will notify you if a spot becomes available!"
        answer = answer_ro if lang == 'ro' else answer_en
        return {"answer": answer, "suggestions": suggestions, "events": []}

    # RULE KNOWLEDGE BASE: General information about USV and Suceava
    kb_answer = match_knowledge()
    if kb_answer:
        return {"answer": kb_answer, "suggestions": suggestions, "events": []}

    # Fallback
    return {
        "answer": fallback_msg,
        "suggestions": suggestions,
        "events": []
    }
