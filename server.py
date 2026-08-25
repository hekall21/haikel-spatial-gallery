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
        elif path.startswith('/thumbs/'):
            rel = path[len('/thumbs/'):].lstrip('/')
            return os.path.join(PROJECT_DIR, 'thumbs', rel)
        
        return super().translate_path(path)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Range, Content-Type, Accept-Encoding')
        self.send_header('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges')
        self.end_headers()

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges')
        if self.path.endswith('.js') or self.path.endswith('.css') or self.path.endswith('.html') or self.path == '/':
            self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
            self.send_header('Pragma', 'no-cache')
            self.send_header('Expires', '0')
        super().end_headers()

    def do_HEAD(self):
        real_path = self.translate_path(self.path)
        if os.path.isfile(real_path):
            content_type = mimetypes.guess_type(real_path)[0] or 'application/octet-stream'
            if real_path.endswith('.mp4'):
                content_type = 'video/mp4'
            elif real_path.endswith('.webp'):
                content_type = 'image/webp'
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
        elif os.path.isfile(real_path) and any(real_path.lower().endswith(ext) for ext in ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg']):
            self.send_photo_direct(real_path)
        else:
            super().do_GET()

    def send_photo_direct(self, path):
        try:
            file_size = os.path.getsize(path)
            content_type = mimetypes.guess_type(path)[0] or 'image/jpeg'
            if path.endswith('.webp'):
                content_type = 'image/webp'
            elif path.endswith('.svg'):
                content_type = 'image/svg+xml'
            self.send_response(200)
            self.send_header('Content-Type', content_type)
            self.send_header('Content-Length', str(file_size))
            self.send_header('Accept-Ranges', 'bytes')
            self.send_header('Cache-Control', 'public, max-age=86400')
            self.end_headers()
            with open(path, 'rb') as f:
                self.copyfile(f, self.wfile)
        except Exception:
            pass

    def send_video_range(self, path):
        try:
            file_size = os.path.getsize(path)
            range_header = self.headers.get('Range', None)
            content_type = mimetypes.guess_type(path)[0] or 'video/mp4'
            if path.endswith('.mp4'):
                content_type = 'video/mp4'

            if not range_header:
                self.send_response(200)
                self.send_header('Content-Type', content_type)
                self.send_header('Content-Length', str(file_size))
                self.send_header('Accept-Ranges', 'bytes')
                self.send_header('Cache-Control', 'public, max-age=86400')
                self.end_headers()
                with open(path, 'rb') as f:
                    self.copyfile(f, self.wfile)
                return

            match = re.match(r'bytes=(\d*)-(\d*)', range_header)
            if not match:
                self.send_response(416)
                self.send_header('Content-Range', f'bytes */{file_size}')
                self.end_headers()
                return

            start_str, end_str = match.groups()
            if start_str == '' and end_str != '':
                # Suffix range: -N
                suffix = int(end_str)
                start = max(0, file_size - suffix)
                end = file_size - 1
            elif start_str != '' and end_str == '':
                # N-
                start = int(start_str)
                end = file_size - 1
            elif start_str != '' and end_str != '':
                # N-M
                start = int(start_str)
                end = min(int(end_str), file_size - 1)
            else:
                self.send_response(416)
                self.send_header('Content-Range', f'bytes */{file_size}')
                self.end_headers()
                return

            if start > end or start >= file_size or start < 0:
                self.send_response(416)
                self.send_header('Content-Range', f'bytes */{file_size}')
                self.end_headers()
                return

            length = end - start + 1

            self.send_response(206)
            self.send_header('Content-Type', content_type)
            self.send_header('Content-Range', f'bytes {start}-{end}/{file_size}')
            self.send_header('Content-Length', str(length))
            self.send_header('Accept-Ranges', 'bytes')
            self.send_header('Cache-Control', 'no-cache')
            self.end_headers()

            with open(path, 'rb') as f:
                f.seek(start)
                bytes_left = length
                chunk_size = 64 * 1024
                while bytes_left > 0:
                    read_len = min(chunk_size, bytes_left)
                    buf = f.read(read_len)
                    if not buf:
                        break
                    self.wfile.write(buf)
                    bytes_left -= len(buf)
        except Exception:
            pass

class ThreadedHTTPServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    allow_reuse_address = True

if __name__ == '__main__':
    with ThreadedHTTPServer(("", PORT), CustomHandler) as httpd:
        print(f"Serving at http://localhost:{PORT}")
        httpd.serve_forever()
