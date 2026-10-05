#!/usr/bin/env python3
"""
The Garden of Almira - a tiny local web server (Python 3 standard library only).

    python3 server.py        then open  http://localhost:8765
"""
import mimetypes, os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

PUBLIC = os.path.join(os.path.dirname(os.path.abspath(__file__)), "public")
PORT = int(os.environ.get("PORT", "8765"))


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=PUBLIC, **kw)

    def log_message(self, fmt, *args):   # keep the terminal quiet
        pass


mimetypes.add_type("application/javascript", ".js")

if __name__ == "__main__":
    srv = ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
    print(f"\n  The Garden of Almira is blooming at  http://localhost:{PORT}\n  (Ctrl+C to stop)\n")
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        print("\n  Goodnight, garden.")
