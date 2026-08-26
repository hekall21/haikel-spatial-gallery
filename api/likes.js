export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method === 'POST') {
    const { id, action } = req.body || {};
    return res.status(200).json({
      success: true,
      id: id || '',
      action: action || 'like',
      timestamp: Date.now()
    });
  }

  return res.status(200).json({ success: true });
}
