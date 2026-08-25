import http.server
import socketserver
import os
import urllib.parse
import mimetypes
import re

PORT = 5173
PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))
PHOTO_DIR = r"G:\My Drive\FOTO  EKALL"
VIDEO_DIR = r"G:\My Drive\MACAM MACAM VIDEO EKALL"

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=PROJECT_DIR, **kwargs)

    def translate_path(self, path):
        path = urllib.parse.unquote(path.split('?')[0])
        
        if path.startswith('/@media/photos/'):
            rel = path[len('/@media/photos/'):].lstrip('/')
            return os.path.join(PHOTO_DIR, rel)
        elif path.startswith('/@media/videos/'):
            rel = path[len('/@media/videos/'):].lstrip('/')
            return os.path.join(VIDEO_DIR, rel)
        
        return super().translate_path(path)

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        if self.path.endswith('.js') or self.path.endswith('.css') or self.path.endswith('.html') or self.path == '/':
            self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
            self.send_header('Pragma', 'no-cache')
            self.send_header('Expires', '0')
        super().end_headers()

    def do_HEAD(self):
        real_path = self.translate_path(self.path)
        if os.path.isfile(real_path):
            content_type = mimetypes.guess_type(real_path)[0] or 'application/octet-stream'
            self.send_response(200)
            self.send_header('Content-Type', content_type)
            self.send_header('Content-Length', str(os.path.getsize(real_path)))
            self.send_header('Accept-Ranges', 'bytes')
            self.end_headers()
        else:
            super().do_HEAD()

    def do_GET(self):
        real_path = self.translate_path(self.path)
        if os.path.isfile(real_path) and (real_path.endswith('.mp4') or real_path.endswith('.webm')):
            self.send_video_range(real_path)
        elif os.path.isfile(real_path) and any(real_path.lower().endswith(ext) for ext in ['.jpg', '.jpeg', '.png', '.webp', '.gif']):
            self.send_photo_direct(real_path)
        else:
            super().do_GET()

    def send_photo_direct(self, path):
        try:
            file_size = os.path.getsize(path)
            content_type = mimetypes.guess_type(path)[0] or 'image/jpeg'
            self.send_response(200)
            self.send_header('Content-Type', content_type)
            self.send_header('Content-Length', str(file_size))
            self.send_header('Accept-Ranges', 'bytes')
            self.end_headers()
            with open(path, 'rb') as f:
                self.copyfile(f, self.wfile)
        except Exception as e:
            pass

    def send_video_range(self, path):
        try:
            file_size = os.path.getsize(path)
            range_header = self.headers.get('Range', None)
            content_type = mimetypes.guess_type(path)[0] or 'video/mp4'

            max_chunk = 2 * 1024 * 1024  # 2MB max chunk for zero lag

            if not range_header:
                initial_end = min(1572863, file_size - 1)
                length = initial_end + 1
                self.send_response(206)
                self.send_header('Content-Type', content_type)
                self.send_header('Content-Range', f'bytes 0-{initial_end}/{file_size}')
                self.send_header('Content-Length', str(length))
                self.send_header('Accept-Ranges', 'bytes')
                self.send_header('Cache-Control', 'public, max-age=86400')
                self.end_headers()
                with open(path, 'rb') as f:
                    self.wfile.write(f.read(length))
                return

            range_match = re.match(r'bytes=(\d+)-(\d*)', range_header)
            if not range_match:
                self.send_error(416, "Requested Range Not Satisfiable")
                return

            start = int(range_match.group(1))
            end = int(range_match.group(2)) if range_match.group(2) else start + max_chunk - 1
            if end >= file_size:
                end = file_size - 1
            if end - start + 1 > max_chunk:
                end = start + max_chunk - 1
            length = end - start + 1

            self.send_response(206)
            self.send_header('Content-Type', content_type)
            self.send_header('Content-Range', f'bytes {start}-{end}/{file_size}')
            self.send_header('Content-Length', str(length))
            self.send_header('Accept-Ranges', 'bytes')
            self.send_header('Cache-Control', 'public, max-age=86400')
            self.end_headers()

            with open(path, 'rb') as f:
                f.seek(start)
                self.wfile.write(f.read(length))
        except Exception:
            pass

class ThreadedHTTPServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    allow_reuse_address = True

if __name__ == '__main__':
    with ThreadedHTTPServer(("", PORT), CustomHandler) as httpd:
        print(f"Serving at http://localhost:{PORT}")
        httpd.serve_forever()
