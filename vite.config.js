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
              res.setHeader('Content-Type', mimeTypes[ext] || 'image/jpeg');
              res.setHeader('Cache-Control', 'public, max-age=86400');
              fs.createReadStream(filePath).pipe(res);
              return;
            }
          }

          // 2. Serve Videos with Optimized Range Request Streaming (Zero-Lag 1-2MB Chunks)
          if (urlPath.startsWith('/@media/videos/')) {
            const relPath = urlPath.replace('/@media/videos/', '');
            const filePath = path.join(videoBaseDir, relPath);

            if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
              const stat = fs.statSync(filePath);
              const fileSize = stat.size;
              const range = req.headers.range;

              if (range) {
                const parts = range.replace(/bytes=/, "").split("-");
                const start = parseInt(parts[0], 10);
                const maxChunk = 2 * 1024 * 1024; // 2MB max chunk for instant playback start
                let end = parts[1] ? parseInt(parts[1], 10) : start + maxChunk - 1;
                if (end >= fileSize) end = fileSize - 1;
                if (end - start + 1 > maxChunk) end = start + maxChunk - 1;
                const chunkSize = (end - start) + 1;

                res.writeHead(206, {
                  'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                  'Accept-Ranges': 'bytes',
                  'Content-Length': chunkSize,
                  'Content-Type': 'video/mp4',
                  'Cache-Control': 'public, max-age=86400',
                  'Access-Control-Allow-Origin': '*'
                });

                const stream = fs.createReadStream(filePath, { start, end });
                stream.pipe(res);
                return;
              } else {
                // Initial request - Send first 1.5MB for instant preview
                const initialEnd = Math.min(1.5 * 1024 * 1024 - 1, fileSize - 1);
                const chunkSize = initialEnd + 1;
                res.writeHead(206, {
                  'Content-Range': `bytes 0-${initialEnd}/${fileSize}`,
                  'Content-Length': chunkSize,
                  'Content-Type': 'video/mp4',
                  'Accept-Ranges': 'bytes',
                  'Cache-Control': 'public, max-age=86400',
                  'Access-Control-Allow-Origin': '*'
                });
                const stream = fs.createReadStream(filePath, { start: 0, end: initialEnd });
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
    host: true,
    allowedHosts: true
  }
});
