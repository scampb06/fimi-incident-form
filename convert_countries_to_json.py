import re
import json

# Read file contents
filename = 'opencti_countries.txt'
with open(filename, 'r', encoding='utf-8') as f:
    raw_text = f.read()

# Match code, name pairs (2-3 letter codes possible)
pattern = re.compile(r'(\b[A-Z]{2,3}\b),\s([\w\-\.\(\)\' ]+)', re.UNICODE)
matches = pattern.findall(raw_text)

# Convert to JSON structure
json_data = [{ "id": code.strip(), "name": name.strip() } for code, name in matches]

# Output as JSON file
json_filename = 'countries.json'
with open(json_filename, 'w', encoding='utf-8') as fout:
    json.dump(json_data, fout, indent=2, ensure_ascii=False)

# Show first few entries and count
print(json_data[:5])
print(len(json_data))
