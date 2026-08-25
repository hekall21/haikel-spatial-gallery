import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import fs from 'fs';

function serveDriveMediaPlugin() {
  const photoBaseDir = 'G:/My Drive/FOTO  EKALL';
  const videoBaseDir = 'G:/My Drive/MACAM MACAM VIDEO EKALL';

  return {
    name: 'serve-drive-media-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        try {
          const rawUrl = req.url || '';
          const urlPath = decodeURIComponent(rawUrl.split('?')[0]);

          // Handle CORS preflight
          if (req.method === 'OPTIONS') {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type, Accept-Encoding');
            res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges');
            res.statusCode = 204;
            res.end();
            return;
          }

          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges');
          res.setHeader('Accept-Ranges', 'bytes');

          // 0. Serve Thumbs
          if (urlPath.startsWith('/thumbs/')) {
            const relPath = urlPath.replace('/thumbs/', '');
            const filePath = path.join(process.cwd(), 'thumbs', relPath);

            if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
              const stat = fs.statSync(filePath);
              res.setHeader('Content-Type', 'image/webp');
              res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
              if (req.method === 'HEAD') {
                res.setHeader('Content-Length', stat.size);
                res.end();
                return;
              }
              fs.createReadStream(filePath).pipe(res);
              return;
            }
          }

          // 1. Serve Photos
          if (urlPath.startsWith('/@media/photos/')) {
            const relPath = urlPath.replace('/@media/photos/', '');
            const filePath = path.join(photoBaseDir, relPath);

            if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
              const ext = path.extname(filePath).toLowerCase();
              const mimeTypes = {
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png',
                '.webp': 'image/webp',
                '.gif': 'image/gif'
              };
              const stat = fs.statSync(filePath);
              res.setHeader('Content-Type', mimeTypes[ext] || 'image/jpeg');
              res.setHeader('Content-Length', stat.size);
              res.setHeader('Cache-Control', 'public, max-age=86400');
              if (req.method === 'HEAD') {
                res.end();
                return;
              }
              fs.createReadStream(filePath).pipe(res);
              return;
            }
          }

          // 2. Serve Videos with RFC 7233 Range Request streaming
          if (urlPath.startsWith('/@media/videos/')) {
            const relPath = urlPath.replace('/@media/videos/', '');
            const filePath = path.join(videoBaseDir, relPath);

            if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
              const stat = fs.statSync(filePath);
              const fileSize = stat.size;
              const range = req.headers.range;

              res.setHeader('Content-Type', 'video/mp4');
              res.setHeader('Accept-Ranges', 'bytes');

              if (req.method === 'HEAD') {
                res.setHeader('Content-Length', fileSize);
                res.end();
                return;
              }

              if (range) {
                let start = 0;
                let end = fileSize - 1;

                const match = range.match(/bytes=(\d*)-(\d*)/);
                if (match) {
                  if (match[1] === '' && match[2] !== '') {
                    // Suffix range: -N (last N bytes)
                    const suffix = parseInt(match[2], 10);
                    start = Math.max(0, fileSize - suffix);
                    end = fileSize - 1;
                  } else if (match[1] !== '' && match[2] === '') {
                    // Range: N-
                    start = parseInt(match[1], 10);
                    end = fileSize - 1;
                  } else if (match[1] !== '' && match[2] !== '') {
                    // Range: N-M
                    start = parseInt(match[1], 10);
                    end = Math.min(parseInt(match[2], 10), fileSize - 1);
                  }
                }

                if (isNaN(start) || isNaN(end) || start > end || start >= fileSize || start < 0) {
                  res.writeHead(416, {
                    'Content-Range': `bytes */${fileSize}`
                  });
                  res.end();
                  return;
                }

                const chunkSize = (end - start) + 1;

                res.writeHead(206, {
                  'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                  'Accept-Ranges': 'bytes',
                  'Content-Length': chunkSize,
                  'Content-Type': 'video/mp4',
                  'Cache-Control': 'no-cache'
                });

                const stream = fs.createReadStream(filePath, { start, end });
                stream.on('error', (err) => {
                  console.error('[Stream Error]', err);
                  if (!res.headersSent) res.writeHead(500);
                  res.end();
                });
                stream.pipe(res);
                return;
              } else {
                res.writeHead(200, {
                  'Content-Length': fileSize,
                  'Content-Type': 'video/mp4',
                  'Accept-Ranges': 'bytes',
                  'Cache-Control': 'public, max-age=86400'
                });
                const stream = fs.createReadStream(filePath);
                stream.on('error', (err) => {
                  console.error('[Stream Error]', err);
                  if (!res.headersSent) res.writeHead(500);
                  res.end();
                });
                stream.pipe(res);
                return;
              }
            }
          }
        } catch (err) {
          console.error('[Media Serve Error]', err);
        }

        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    serveDriveMediaPlugin()
  ],
  server: {
    port: 5173,
    host: true
  }
});
