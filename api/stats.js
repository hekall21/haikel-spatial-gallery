export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  return res.status(200).json({
    status: 'online',
    system: 'Haikel Spatial Gallery Cloud Engine',
    totalMedia: 235,
    totalVideos: 45,
    totalPhotos: 190,
    timestamp: new Date().toISOString()
  });
}
