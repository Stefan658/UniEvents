import re
import os

js_path = "research/orar_main.js"
if not os.path.exists(js_path):
    print("JS file not found")
    exit()

with open(js_path, "r", encoding="utf-8") as f:
    text = f.read()

# Look for patterns like /api/... or strings containing sala/sali
strings = re.findall(r'\"([^\"]+)\"', text)
interesting = [s for s in strings if any(k in s.lower() for k in ["api", "sali", "sala", "room", "location", "json"])]

print("Found interesting strings:")
for s in sorted(set(interesting)):
    if len(s) < 100:
        print(s)

# Also look for object keys
keys = re.findall(r'([a-zA-Z0-9_]+):', text)
interesting_keys = [k for k in keys if any(kw in k.lower() for kw in ["sala", "sali", "room"])]
print("\nFound interesting keys:")
for k in sorted(set(interesting_keys)):
    print(k)
