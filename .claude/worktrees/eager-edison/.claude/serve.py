import os
import sys
from http.server import HTTPServer, SimpleHTTPRequestHandler

DIRECTORY = "/Users/paulwhite/Library/Mobile Documents/com~apple~CloudDocs/Code/UX-Portfolio/.claude/worktrees/eager-edison"
PORT = 3000

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

os.chdir(DIRECTORY)
httpd = HTTPServer(("", PORT), Handler)
print(f"Serving on http://localhost:{PORT}", flush=True)
httpd.serve_forever()
