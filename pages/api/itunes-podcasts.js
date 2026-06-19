export default async function handler(req, res) {
  const { q } = req.query;
  if (!q) return res.status(200).json([]);

  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 5000);
  try {
    const r = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=podcast&limit=10`,
      { signal: ctrl.signal }
    );
    clearTimeout(timer);
    if (!r.ok) return res.status(200).json([]);
    const data = await r.json();
    const podcasts = (data.results || []).map(p => ({
      id:          String(p.collectionId || ''),
      title:       p.collectionName || '',
      host:        p.artistName || '',
      description: p.description || p.longDescription || '',
      cover:       p.artworkUrl600 || p.artworkUrl100 || null,
      genre:       (p.genres || []).filter(g => g !== 'Podcasts')[0] || '',
      apple_url:   p.collectionViewUrl || '',
      source:      'itunes',
    })).filter(p => p.title);
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).json(podcasts);
  } catch {
    clearTimeout(timer);
    return res.status(200).json([]);
  }
}
