import os
import re

dir_path = r"c:\Users\Pushpak\Desktop\vidrut_frontend"

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Update top nav links
    content = re.sub(r'<a([^>]*?)>Dashboard</a>', r'<a\1 href="index.html">Dashboard</a>', content)
    content = re.sub(r'<a([^>]*?)>About Us</a>', r'<a\1 href="about.html">About Us</a>', content)
    content = re.sub(r'<a([^>]*?)>Courses</a>', r'<a\1 href="catalog.html">Courses</a>', content)
    content = re.sub(r'<a([^>]*?)>Certificates</a>', r'<a\1 href="verify.html">Certificates</a>', content)

    # Clean up duplicate hrefs from the regex sub (since original had href="#")
    content = re.sub(r'href="#"\s*href="', 'href="', content)
    content = re.sub(r'href="([^"]+)"\s*href="#"', r'href="\1"', content)

    # Update login buttons (Login and Sign Up buttons don't have href, they are <button>. We should change them to <a> or add onclick)
    content = content.replace('<button class="px-6 py-2 text-on-surface font-label-md text-label-md hover:bg-white/5 transition-all">Login</button>',
                              '<a href="login.html" class="px-6 py-2 text-on-surface font-label-md text-label-md hover:bg-white/5 transition-all inline-block text-center">Login</a>')
    
    content = content.replace('<button class="px-6 py-2 bg-primary-fixed-dim text-on-primary font-label-md text-label-md rounded-lg active:scale-95 transition-transform command-glow">Sign Up</button>',
                              '<a href="login.html" class="px-6 py-2 bg-primary-fixed-dim text-on-primary font-label-md text-label-md rounded-lg active:scale-95 transition-transform command-glow inline-block text-center">Sign Up</a>')

    # Update sidebar in dashboard
    # The sidebar links in dashboard.html are just icons + text.
    # We can just replace href="#" with appropriate links in dashboard specifically.
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

for filename in os.listdir(dir_path):
    if filename.endswith(".html"):
        process_file(os.path.join(dir_path, filename))

print("Links updated.")
