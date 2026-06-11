"""Dev server for the frontend.

Serves static files from this folder and proxies /api/ and /media/ to the
Django backend on :8000, so the relative `/api/` fetches work and no caching
of ES modules gets in the way (Cache-Control: no-store on everything).
"""
import http.server
import socketserver
import urllib.request
import urllib.error

PORT = 5599
BACKEND = "http://localhost:8000"


class Handler(http.server.SimpleHTTPRequestHandler):
    def _proxy(self, body=None):
        target = BACKEND + self.path
        req = urllib.request.Request(target, data=body, method=self.command)
        for h in ("Content-Type", "Authorization", "Cookie"):
            if h in self.headers:
                req.add_header(h, self.headers[h])
        try:
            with urllib.request.urlopen(req) as resp:
                self.send_response(resp.status)
                for k, v in resp.getheaders():
                    if k.lower() not in ("transfer-encoding", "connection", "content-length"):
                        self.send_header(k, v)
                data = resp.read()
                self.send_header("Content-Length", str(len(data)))
                self.end_headers()
                self.wfile.write(data)
        except urllib.error.HTTPError as e:
            data = e.read()
            self.send_response(e.code)
            self.send_header("Content-Type", e.headers.get("Content-Type", "application/json"))
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)

    def _is_proxy(self):
        return self.path.startswith("/api/") or self.path.startswith("/media/")

    def do_GET(self):
        if self._is_proxy():
            return self._proxy()
        return super().do_GET()

    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length) if length else None
        if self._is_proxy():
            return self._proxy(body)
        self.send_error(405)

    do_PATCH = do_POST
    do_DELETE = do_GET

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, max-age=0")
        super().end_headers()

    def log_message(self, *args):
        pass


socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"Frontend dev server on http://localhost:{PORT}")
    httpd.serve_forever()
