import http.server
import socketserver
import os
import urllib.parse
import mimetypes
import re
import json

PORT = 5173
PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))
PHOTO_DIR = r"G:\My Drive\FOTO  EKALL"
VIDEO_DIR = r"G:\My Drive\MACAM MACAM VIDEO EKALL"
DB_FILE = os.path.join(PROJECT_DIR, "data", "gallery_store.json")

os.makedirs(os.path.dirname(DB_FILE), exist_ok=True)

# Helper to load and save server-side persistent database
def load_server_db():
    if os.path.exists(DB_FILE):
        try:
            with open(DB_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {"likes": {}, "views": {}, "watch_history": {}}

def save_server_db(data):
    try:
        with open(DB_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        print(f"[DB Save Error] {e}")

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
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, HEAD, OPTIONS')
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
        url_path = self.path.split('?')[0]

        # REST Database API Endpoints
        if url_path == '/@api/stats':
            self.send_json_response(self.get_db_stats())
            return
        elif url_path == '/@api/media':
            self.send_json_response(self.get_db_media())
            return

        real_path = self.translate_path(self.path)
        if os.path.isfile(real_path) and (real_path.endswith('.mp4') or real_path.endswith('.webm')):
            self.send_video_range(real_path)
        elif os.path.isfile(real_path) and any(real_path.lower().endswith(ext) for ext in ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg']):
            self.send_photo_direct(real_path)
        else:
            super().do_GET()

    def do_POST(self):
        url_path = self.path.split('?')[0]
        length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(length).decode('utf-8') if length > 0 else '{}'
        try:
            payload = json.loads(body)
        except Exception:
            payload = {}

        if url_path == '/@api/likes':
            media_id = payload.get('id')
            action = payload.get('action', 'like')
            if media_id:
                db = load_server_db()
                cur = db.get('likes', {}).get(media_id, 0)
                new_likes = cur + 1 if action == 'like' else max(0, cur - 1)
                db.setdefault('likes', {})[media_id] = new_likes
                save_server_db(db)
                self.send_json_response({'success': True, 'id': media_id, 'likes': new_likes})
                return
        elif url_path == '/@api/views':
            media_id = payload.get('id')
            if media_id:
                db = load_server_db()
                cur = db.get('views', {}).get(media_id, 0)
                db.setdefault('views', {})[media_id] = cur + 1
                save_server_db(db)
                self.send_json_response({'success': True, 'id': media_id, 'views': cur + 1})
                return

        self.send_json_response({'success': False, 'error': 'Invalid endpoint'}, status=404)

    def send_json_response(self, data, status=200):
        resp = json.dumps(data).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(resp)))
        self.end_headers()
        self.wfile.write(resp)

    def get_db_stats(self):
        db = load_server_db()
        return {
            'status': 'online',
            'database': 'SQLite/JSON Enterprise DB',
            'serverTime': '2026 WIB',
            'totalLikes': sum(db.get('likes', {}).values()),
            'totalViews': sum(db.get('views', {}).values())
        }

    def get_db_media(self):
        db = load_server_db()
        return {
            'success': True,
            'serverLikes': db.get('likes', {}),
            'serverViews': db.get('views', {})
        }

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
                suffix = int(end_str)
                start = max(0, file_size - suffix)
                end = file_size - 1
            elif start_str != '' and end_str == '':
                start = int(start_str)
                end = file_size - 1
            elif start_str != '' and end_str != '':
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
        print(f"Server with Database REST API running at http://localhost:{PORT}")
        httpd.serve_forever()
