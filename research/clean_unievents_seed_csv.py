import csv

FILE_PATH = "research/unievents_seed_candidates.csv"
HEADER = [
    "title", "description", "start_at", "end_at", "location", 
    "participation_type", "category_name", "organizer_email", "status", 
    "max_participants", "registration_deadline", "requires_registration", 
    "is_free_entry", "ticket_price", "online_platform", "online_meeting_url", 
    "registration_link", "poster_image_url", "poster_local_path", 
    "source_reference", "source_event_url", "source_uuid", "seed_purpose"
]

def clean_csv():
    # We'll use the data from the previous turns to reconstruct it perfectly.
    # I will read the current (partially fixed) file and enforce the fields.
    
    rows = []
    with open(FILE_PATH, "r", encoding="utf-8") as f:
        reader = csv.reader(f)
        header = next(reader)
        for row in reader:
            rows.append(row)
            
    cleaned_rows = []
    for row in rows:
        # Enforce 23 columns. 
        # If it was 22 or 24, we try to keep the first 22 and the last one as purpose.
        if len(row) != len(HEADER):
            purpose = row[-1]
            # Take up to index 21 (22nd col)
            base = row[:22]
            # Pad if needed
            while len(base) < 22:
                base.append("")
            new_row = base + [purpose]
            cleaned_rows.append(new_row)
        else:
            cleaned_rows.append(row)

    with open(FILE_PATH, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(HEADER)
        writer.writerows(cleaned_rows)

    print(f"Final validation of {FILE_PATH}:")
    with open(FILE_PATH, "r", encoding="utf-8") as f:
        reader = csv.reader(f)
        h = next(reader)
        print(f"Header: {len(h)} columns")
        count = 0
        for i, r in enumerate(reader):
            if len(r) != 23:
                print(f"Error at row {i+1}: {len(r)} columns")
            count += 1
        print(f"Total rows: {count}")

if __name__ == "__main__":
    clean_csv()
