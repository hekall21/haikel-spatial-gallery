import fs from 'fs';
import path from 'path';

const photoDir = 'G:/My Drive/FOTO  EKALL';
const videoDir = 'G:/My Drive/MACAM MACAM VIDEO EKALL';
const outputPath = './src/data/mediaCatalog.js';

// Camera & Lens presets for cinematic immersion
const cameraPresets = [
  { camera: 'Sony Alpha A7 IV', lens: 'FE 35mm F1.4 GM', settings: '1/250s • f/1.8 • ISO 200' },
  { camera: 'Fujifilm X-T5', lens: 'XF 23mm F1.4 R LM WR', settings: '1/500s • f/2.0 • ISO 160 (Classic Chrome)' },
  { camera: 'Leica Q3', lens: 'Summilux 28mm f/1.7 ASPH', settings: '1/320s • f/2.8 • ISO 100' },
  { camera: 'Sony FX3 Cinema', lens: 'FE 24-70mm F2.8 GM II', settings: '4K 60fps • S-Log3 • 1/120s' },
  { camera: 'Canon EOS R5', lens: 'RF 50mm F1.2 L USM', settings: '1/400s • f/1.4 • ISO 100' },
  { camera: 'iPhone 15 Pro Max', lens: 'Main 24mm 48MP ProRAW', settings: '1/120s • f/1.78 • ISO 80' },
  { camera: 'Fujifilm GFX 100S II', lens: 'GF 80mm F1.7 R WR', settings: '1/200s • f/2.0 • ISO 100' }
];

const locations = [
  'Jakarta, Indonesia',
  'SCBD Central Park, Jakarta',
  'Bandung Highlands, West Java',
  'Yogyakarta Cultural Heritage',
  'Bali Coastal Shore, Uluwatu',
  'Tokyo Streetscape, Shibuya',
  'Kyoto Night Lights',
  'Shinjuku Golden Gai',
  'Urban Studio Series, Haikel'
];

const photoCategories = ['Street', 'Portrait', 'Cinematic', 'Lifestyle', 'Urban Noir', 'Visual Art'];

function run() {
  const mediaList = [];
  let idCounter = 1;

  // 1. Scan Photos
  if (fs.existsSync(photoDir)) {
    const photoFiles = fs.readdirSync(photoDir)
      .filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

    photoFiles.forEach((file, index) => {
      const preset = cameraPresets[index % cameraPresets.length];
      const loc = locations[index % locations.length];
      const category = photoCategories[index % photoCategories.length];
      const numMatch = file.match(/\d+/);
      const numStr = numMatch ? numMatch[0].padStart(3, '0') : String(index + 1).padStart(3, '0');
      
      const aspectRatios = ['4/5', '3/4', '16/9', '4/5', '1/1'];
      const aspectRatio = aspectRatios[index % aspectRatios.length];

      mediaList.push({
        id: `photo-${numStr}`,
        type: 'image',
        rawFilename: file,
        title: `Haikel Visual Moment #${numStr}`,
        category: category,
        tags: [category, 'Photography', 'Haikel Collection', 'Noir Aesthetics'],
        mediaUrl: `/@media/photos/${encodeURIComponent(file)}`,
        downloadUrl: `/@media/photos/${encodeURIComponent(file)}`,
        thumbnailUrl: `/@media/photos/${encodeURIComponent(file)}`,
        aspectRatio: aspectRatio,
        camera: preset.camera,
        lens: preset.lens,
        settings: preset.settings,
        location: loc,
        date: `2025-2026`,
        story: `Tangkap momen otentik dan pencahayaan sinematik dengan tone kontras khas kurasi Haikel.`,
        featured: index < 12 || index % 15 === 0,
        likes: 12 + ((index * 7) % 89),
        views: 140 + ((index * 37) % 650)
      });
    });
  }

  // 2. Scan Videos (Root & TEMPLATE_DAN_EDITAN)
  if (fs.existsSync(videoDir)) {
    function scanVideosInDir(currentDir, relativePrefix = '', subCategory = '') {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        const relPath = relativePrefix ? `${relativePrefix}/${entry.name}` : entry.name;
        if (entry.isDirectory()) {
          scanVideosInDir(fullPath, relPath, entry.name.includes('TEMPLATE') ? 'Template & Edits' : 'Reel');
        } else if (/\.(mp4|mov|webm)$/i.test(entry.name)) {
          const isTemplate = relPath.includes('TEMPLATE_DAN_EDITAN') || entry.name.includes('TEMPLATE');
          const cat = isTemplate ? 'Motion Edit & Template' : 'Cinematic Reel';
          const numMatch = entry.name.match(/\d+/);
          const numStr = numMatch ? numMatch[0].padStart(3, '0') : String(idCounter).padStart(3, '0');
          const preset = cameraPresets[(idCounter + 2) % cameraPresets.length];
          const loc = locations[idCounter % locations.length];

          mediaList.push({
            id: `video-${numStr}-${isTemplate ? 'tpl' : 'raw'}`,
            type: 'video',
            rawFilename: entry.name,
            subDir: relativePrefix,
            title: isTemplate ? `Motion Template & Cut #${numStr}` : `Cinematic Reel Series #${numStr}`,
            category: cat,
            tags: [cat, 'Video', 'Reel', isTemplate ? 'CapCut / Premiere Edit' : 'RAW 4K Footage'],
            mediaUrl: `/@media/videos/${encodeURI(relPath.replace(/\\/g, '/'))}`,
            downloadUrl: `/@media/videos/${encodeURI(relPath.replace(/\\/g, '/'))}`,
            thumbnailUrl: '',
            aspectRatio: isTemplate ? '9/16' : (idCounter % 3 === 0 ? '9/16' : '16/9'),
            camera: 'Sony FX3 / iPhone 15 Pro Log',
            lens: 'FE 24-70mm F2.8 GM II',
            settings: isTemplate ? '4K 60fps • S-Log3 • Color Graded' : '1080p/4K ProRes 60fps',
            location: loc,
            date: `2025-2026`,
            story: isTemplate 
              ? `Karya video editan & template dinamis dengan sinkronisasi ritme musik dan motion graphic.` 
              : `Footage sinematik berkualitas tinggi yang mendokumentasikan atmosfer visual secara mendalam.`,
            featured: idCounter % 4 === 0,
            likes: 45 + ((idCounter * 11) % 150),
            views: 320 + ((idCounter * 49) % 1200)
          });
          idCounter++;
        }
      }
    }

    scanVideosInDir(videoDir);
  }

  const fileContent = `// Auto-generated Catalog of Haikel Spatial Gallery
// Total Photos: ${mediaList.filter(m => m.type === 'image').length}
// Total Videos: ${mediaList.filter(m => m.type === 'video').length}
// Total Media: ${mediaList.length}

export const initialMediaCatalog = ${JSON.stringify(mediaList, null, 2)};

export const galleryCategories = [
  { id: 'all', label: 'All Works', count: ${mediaList.length} },
  { id: 'photos', label: 'Photos HD', count: ${mediaList.filter(m => m.type === 'image').length} },
  { id: 'videos', label: 'Videos & Reels', count: ${mediaList.filter(m => m.type === 'video').length} },
  { id: 'featured', label: 'Featured ✦', count: ${mediaList.filter(m => m.featured).length} },
  { id: 'edits', label: 'Motion Edits & Templates', count: ${mediaList.filter(m => m.category.includes('Template') || m.category.includes('Motion')).length} },
  { id: 'street', label: 'Street & Urban', count: ${mediaList.filter(m => m.category.includes('Street') || m.category.includes('Urban')).length} },
  { id: 'portrait', label: 'Portrait & Style', count: ${mediaList.filter(m => m.category.includes('Portrait')).length} }
];
`;

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, fileContent, 'utf-8');
  console.log(`Generated catalog with ${mediaList.length} items at ${outputPath}`);
}

run();
