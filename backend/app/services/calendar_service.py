from datetime import datetime
import uuid

def generate_ics(event, method="PUBLISH"):
    """
    Generates a basic .ics calendar file content for an event.
    Uses string formatting to avoid external dependencies.
    """
    dtstamp = datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")
    dtstart = event.start_at.strftime("%Y%m%dT%H%M%SZ")
    dtend = event.end_at.strftime("%Y%m%dT%H%M%SZ")
    
    # Escape some characters for ICS format
    summary = event.title.replace(",", "\\,").replace(";", "\\;")
    description = (event.description or "").replace(",", "\\,").replace(";", "\\;").replace("\n", "\\n")
    location = (event.location or "").replace(",", "\\,").replace(";", "\\;")
    
    uid = f"event-{event.id}-{uuid.uuid4()}@uni-events.ro"
    
    status = "CONFIRMED"
    if method == "CANCEL":
        status = "CANCELLED"

    ics_lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//UniEvents//NONSGML Event Management//EN",
        f"METHOD:{method}",
        "BEGIN:VEVENT",
        f"UID:{uid}",
        f"DTSTAMP:{dtstamp}",
        f"DTSTART:{dtstart}",
        f"DTEND:{dtend}",
        f"SUMMARY:{summary}",
        f"DESCRIPTION:{description}",
        f"LOCATION:{location}",
        f"STATUS:{status}",
        "END:VEVENT",
        "END:VCALENDAR"
    ]
    
    return "\r\n".join(ics_lines).encode("utf-8")
