import os
import re
import json
import csv
import requests
import time

URLS_FILE = "research/usv_event_urls.txt"
CSV_FILE = "research/usv_events_raw_research.csv"
POSTERS_DIR = "research/posters/"

def download_image(url, uuid, extension):
    if not url:
        return ""
    
    local_filename = f"{uuid}{extension}"
    local_path = os.path.join(POSTERS_DIR, local_filename)
    
    try:
        response = requests.get(url, stream=True, timeout=10)
        if response.status_code == 200:
            with open(local_path, 'wb') as f:
                for chunk in response.iter_content(1024):
                    f.write(chunk)
            return local_path
    except Exception as e:
        print(f"Failed to download {url}: {e}")
    
    return ""

def extract_event_data(url):
    print(f"Processing: {url}")
    uuid = url.split('/')[-1]
    
    try:
        response = requests.get(url, timeout=15)
        
        # Check for auth redirect
        if "auth/signin" in response.url:
            return {
                "source_site": "evenimente.usv.ro",
                "event_url": url,
                "uuid": uuid,
                "notes": "Auth required - Redirected to signin",
                "source_confidence": "low"
            }
        
        if response.status_code != 200:
            return {
                "source_site": "evenimente.usv.ro",
                "event_url": url,
                "uuid": uuid,
                "notes": f"HTTP Error {response.status_code}",
                "source_confidence": "low"
            }

        # Extract __NEXT_DATA__
        match = re.search(r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>', response.text, re.S)
        if not match:
            return {
                "source_site": "evenimente.usv.ro",
                "event_url": url,
                "uuid": uuid,
                "notes": "No __NEXT_DATA__ found",
                "source_confidence": "low"
            }

        data = json.loads(match.group(1))
        
        # Next.js structure might vary, but usually props.pageProps.event
        props = data.get("props", {})
        page_props = props.get("pageProps", {})
        event = page_props.get("event")
        
        if not event:
            # Try to find it elsewhere in the state
            # Sometimes it's in a different path depending on how the page is structured
            return {
                "source_site": "evenimente.usv.ro",
                "event_url": url,
                "uuid": uuid,
                "notes": "Event data not found in __NEXT_DATA__",
                "source_confidence": "low"
            }

        # Extract fields
        title = event.get("title", "")
        category_obj = event.get("category", {})
        category = category_obj.get("name", "") if isinstance(category_obj, dict) else ""
        
        start_date = event.get("startDate", "") # Often ISO
        
        # Simple extraction if it's a string
        date_str = ""
        time_str = ""
        if start_date:
            if "T" in start_date:
                parts = start_date.split("T")
                date_str = parts[0]
                time_str = parts[1][:5]
            else:
                date_str = start_date
        
        location = event.get("location", "")
        description = event.get("description", "")
        # Strip HTML if present
        description = re.sub(r'<[^>]+>', '', description).strip()
        # Keep it concise
        if len(description) > 300:
            description = description[:297] + "..."
            
        organizer_obj = event.get("organizer", {})
        organizer = organizer_obj.get("name", "") if isinstance(organizer_obj, dict) else ""
        
        registration_url = event.get("registrationUrl", "")
        online_url = event.get("onlineMeetingUrl", "") # Might be different field name
        
        poster_url = event.get("posterUrl", "")
        if not poster_url and event.get("imageUrl"):
             poster_url = event.get("imageUrl")
        
        # API URL might be different from web URL
        if poster_url and poster_url.startswith("/"):
            poster_url = "https://evenimenteapi.usv.ro" + poster_url
        elif poster_url and not poster_url.startswith("http"):
            poster_url = "https://evenimenteapi.usv.ro/uploads/events/images/" + poster_url

        poster_local = ""
        if poster_url:
            ext = ".jpg" # default
            if ".png" in poster_url.lower(): ext = ".png"
            elif ".webp" in poster_url.lower(): ext = ".webp"
            elif ".jpeg" in poster_url.lower(): ext = ".jpeg"
            
            poster_local = download_image(poster_url, uuid, ext)

        # Participation type
        participation = "Physical"
        if online_url:
            participation = "Hybrid" if location else "Online"
        elif "online" in str(location).lower():
            participation = "Online"

        return {
            "source_site": "evenimente.usv.ro",
            "event_url": url,
            "uuid": uuid,
            "title": title,
            "category": category,
            "date_str": date_str,
            "time_str": time_str,
            "location": location,
            "participation_type_raw": participation,
            "description": description,
            "organizer": organizer,
            "registration_url": registration_url,
            "online_url": online_url,
            "poster_image_url": poster_url,
            "poster_local_path": poster_local,
            "source_confidence": "high",
            "notes": ""
        }

    except Exception as e:
        return {
            "source_site": "evenimente.usv.ro",
            "event_url": url,
            "uuid": uuid,
            "notes": f"Error: {str(e)}",
            "source_confidence": "low"
        }

def main():
    if not os.path.exists(URLS_FILE):
        print(f"Error: {URLS_FILE} not found")
        return

    with open(URLS_FILE, "r") as f:
        urls = [line.strip() for line in f if line.strip()]

    results = []
    for url in urls:
        data = extract_event_data(url)
        results.append(data)
        time.sleep(1) # Be nice

    columns = [
        "source_site", "event_url", "uuid", "title", "category", 
        "date_str", "time_str", "location", "participation_type_raw", 
        "description", "organizer", "registration_url", "online_url", 
        "poster_image_url", "poster_local_path", "source_confidence", "notes"
    ]

    with open(CSV_FILE, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=columns)
        writer.writeheader()
        for row in results:
            # Ensure all keys exist
            full_row = {col: row.get(col, "") for col in columns}
            writer.writerow(full_row)

    print(f"Done! Created {CSV_FILE}")

if __name__ == "__main__":
    main()
