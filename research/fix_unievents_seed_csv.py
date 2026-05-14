import csv
import io

FILE_PATH = "research/unievents_seed_candidates.csv"
EXPECTED_COLS = 23

def fix_csv():
    try:
        with open(FILE_PATH, "r", encoding="utf-8") as f:
            reader = csv.reader(f)
            header = next(reader)
            rows = list(reader)
            
        print(f"Original header length: {len(header)}")
        
        fixed_rows = []
        for i, row in enumerate(rows):
            if len(row) < EXPECTED_COLS:
                # Assuming the last element is always seed_purpose
                # and we need to pad before it to reach 23 columns.
                purpose = row[-1]
                data_part = row[:-1]
                padding_needed = EXPECTED_COLS - len(data_part) - 1
                new_row = data_part + ([""] * padding_needed) + [purpose]
                fixed_rows.append(new_row)
                print(f"Fixed row {i+1}: length {len(row)} -> {len(new_row)}")
            elif len(row) > EXPECTED_COLS:
                # Truncate or merge if somehow it's longer (unlikely here)
                fixed_rows.append(row[:EXPECTED_COLS])
                print(f"Truncated row {i+1}: length {len(row)} -> {EXPECTED_COLS}")
            else:
                fixed_rows.append(row)

        with open(FILE_PATH, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(header)
            writer.writerows(fixed_rows)
            
        print(f"Processed {len(fixed_rows)} rows.")
        
        # Validation
        with open(FILE_PATH, "r", encoding="utf-8") as f:
            reader = csv.reader(f)
            new_header = next(reader)
            new_rows = list(reader)
            
        print(f"New header length: {len(new_header)}")
        invalid_rows = [i+1 for i, r in enumerate(new_rows) if len(r) != EXPECTED_COLS]
        print(f"Invalid rows count: {len(invalid_rows)}")
        
        if invalid_rows:
            print(f"Invalid row indices: {invalid_rows}")
            
        participation_types = set(r[5] for r in new_rows)
        statuses = set(r[8] for r in new_rows)
        empty_purpose = [i+1 for i, r in enumerate(new_rows) if not r[22]]
        
        print(f"Unique participation_type: {participation_types}")
        print(f"Unique status: {statuses}")
        print(f"Rows with empty seed_purpose: {empty_purpose}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    fix_csv()
