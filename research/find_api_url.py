import re

with open("research/orar_main.js", "r", encoding="utf-8") as f:
    text = f.read()

match = re.search(r'REACT_APP_API_URL_WITHOUT_DATA:\"(.*?)\"', text)
if match:
    print(f"API URL without data: {match.group(1)}")

match = re.search(r'REACT_APP_API_URL:\"(.*?)\"', text)
if match:
    print(f"API URL: {match.group(1)}")

# Look for fetch calls
fetch_calls = re.findall(r'fetch\(\"(.*?)\"\)', text)
print("\nFetch calls:")
for f in set(fetch_calls):
    print(f)
