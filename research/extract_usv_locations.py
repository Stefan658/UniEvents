import requests
import csv
import os

RAW_CSV = "research/usv_locations_raw_research.csv"
UNIEVENTS_CSV = "research/unievents_locations.csv"
API_URL = "https://orar.usv.ro/orar/vizualizare/data/sali.php?json"

def fetch_data():
    try:
        response = requests.get(API_URL, timeout=15)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Error fetching data: {e}")
        return []

def map_location_type(name):
    name = name.lower() if name else ""
    if any(k in name for k in ["lab", "lb", "laborator"]):
        return "laboratory"
    if any(k in name for k in ["sala", "aula", "amfiteatru"]):
        return "auditorium" if "aula" in name or "amf" in name else "room"
    if any(k in name for k in ["sport", "sala sport", "patinoar", "teren"]):
        return "sports"
    return "room" # default

def main():
    data = fetch_data()
    if not data:
        print("No data extracted.")
        return

    # Raw Research CSV
    raw_columns = ["source_site", "location_code", "location_name", "location_type", "faculty_or_area", "building", "notes"]
    raw_rows = []

    for item in data:
        if not item.get("name"): continue # Skip the null entry
        
        name = item.get("name", "")
        short_name = item.get("shortName", "")
        building = item.get("buildingName", "")
        
        raw_rows.append({
            "source_site": "orar.usv.ro",
            "location_code": short_name,
            "location_name": name,
            "location_type": map_location_type(name),
            "faculty_or_area": "", # Not directly in this API
            "building": building,
            "notes": f"ID: {item.get('id')}, Capacitate: {item.get('capacitate')}"
        })

    with open(RAW_CSV, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=raw_columns)
        writer.writeheader()
        writer.writerows(raw_rows)

    # UniEvents Locations CSV
    ue_columns = ["location_key", "display_name", "location_type", "building", "is_online", "is_external", "source_reference", "notes"]
    ue_rows = []

    # Map extracted rooms
    for row in raw_rows:
        ue_rows.append({
            "location_key": row["location_code"].lower().replace(" ", "_"),
            "display_name": row["location_name"],
            "location_type": row["location_type"],
            "building": row["building"],
            "is_online": "false",
            "is_external": "false",
            "source_reference": "orar.usv.ro",
            "notes": row["notes"]
        })

    # Add manual options
    manual_options = [
        {"key": "online_google_meet", "name": "Online — Google Meet", "type": "online", "online": "true"},
        {"key": "online_ms_teams", "name": "Online — Microsoft Teams", "type": "online", "online": "true"},
        {"key": "online_zoom", "name": "Online — Zoom", "type": "online", "online": "true"},
        {"key": "online_discord", "name": "Online — Discord", "type": "online", "online": "true"},
        {"key": "hybrid_meet", "name": "Hybrid — Campus USV + Google Meet", "type": "hybrid", "online": "true"},
        {"key": "external", "name": "External Location", "type": "external", "online": "false", "ext": "true"},
        {"key": "other", "name": "Other / Custom location", "type": "unknown", "online": "false"}
    ]

    for opt in manual_options:
        ue_rows.append({
            "location_key": opt["key"],
            "display_name": opt["name"],
            "location_type": opt["type"],
            "building": "",
            "is_online": opt["online"],
            "is_external": opt.get("ext", "false"),
            "source_reference": "manual",
            "notes": "Added for flexibility"
        })

    with open(UNIEVENTS_CSV, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=ue_columns)
        writer.writeheader()
        writer.writerows(ue_rows)

    print(f"Extracted {len(raw_rows)} locations.")
    print(f"Created {RAW_CSV} and {UNIEVENTS_CSV}")

if __name__ == "__main__":
    main()
