import os
import re

directories_to_scan = ['.', './views', './public']

global_replacements = {
    "Dr. Elena Volkov": "Dr. Pushpadant Jain",
    "Chief Aerospace Engineer": "Faculty Coordinator",
    "Marcus Thorne": "Dr. Balaguru",
    "Avionics Expert": "SMEC Dean",
    "Sarah Jenkins": "Dr. Jeet",
    "Flight Dynamics Lead": "workshop Lead Cordinator"
}

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content

    # Global replacements
    for old, new in global_replacements.items():
        content = content.replace(old, new)

    # Footer replacements
    def footer_replacer(match):
        footer_content = match.group(0)
        footer_content = footer_content.replace("Vidrut Aerospace", "Vidrut Drones")
        # Ensure we only replace the year in the copyright context or just blindly 2024 to 2025
        footer_content = footer_content.replace("2024", "2025")
        return footer_content
        
    # Replace within footer tags. The re.DOTALL makes . match newlines.
    content = re.sub(r'<footer.*?</footer>', footer_replacer, content, flags=re.DOTALL | re.IGNORECASE)

    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")

for root, dirs, files in os.walk('.'):
    if 'node_modules' in root:
        continue
    for file in files:
        if file.endswith('.html') or file.endswith('.ejs'):
            filepath = os.path.join(root, file)
            process_file(filepath)

print("Replacement complete.")
