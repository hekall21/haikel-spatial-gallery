import confetti from 'canvas-confetti';
import { soundEngine } from './soundEngine';

export async function downloadMediaDirect(item, onProgress) {
  try {
    soundEngine.playClick();
    if (onProgress) onProgress({ status: 'fetching', progress: 10 });

    const url = item.downloadUrl || item.mediaUrl;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const contentLength = response.headers.get('content-length');
    const total = contentLength ? parseInt(contentLength, 10) : 0;
    
    let loaded = 0;
    const reader = response.body.getReader();
    const chunks = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      loaded += value.length;
      if (total > 0 && onProgress) {
        const percent = Math.min(Math.round((loaded / total) * 100), 98);
        onProgress({ status: 'downloading', progress: percent });
      }
    }

    if (onProgress) onProgress({ status: 'processing', progress: 99 });

    // Determine extension
    const mimeType = item.type === 'video' ? 'video/mp4' : 'image/jpeg';
    const blob = new Blob(chunks, { type: mimeType });
    const blobUrl = URL.createObjectURL(blob);

    // Sanitize title for filename
    const cleanTitle = (item.title || 'Visual_Work')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .replace(/_+/g, '_');
    
    const ext = item.type === 'video' ? 'mp4' : 'jpg';
    const filename = `Haikel_Gallery_${cleanTitle}_${item.type === 'video' ? '4K' : 'HD'}.${ext}`;

    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 2000);

    // Celebrate with audio and confetti
    soundEngine.playDownloadSuccess();
    confetti({
      particleCount: 45,
      spread: 60,
      origin: { y: 0.85 },
      colors: ['#38bdf8', '#e6e5e5', '#f59e0b']
    });

    if (onProgress) onProgress({ status: 'completed', progress: 100 });
    return { success: true, filename };
  } catch (error) {
    console.error('Download error:', error);
    if (onProgress) onProgress({ status: 'error', error: error.message });
    throw error;
  }
}
