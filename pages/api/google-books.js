export default async function handler(req, res) {
  const { q } = req.query;
  if (!q) return res.status(200).json([]);

  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 5000);
  try {
    const r = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=6&printType=books&langRestrict=en`,
      { signal: ctrl.signal }
    );
    clearTimeout(timer);
    if (!r.ok) return res.status(200).json([]);
    const data = await r.json();
    const books = (data.items || []).map(item => {
      const info = item.volumeInfo || {};
      const desc = info.description || '';
      return {
        id:          item.id,
        title:       info.title || '',
        author:      (info.authors || []).join(', '),
        year:        info.publishedDate ? info.publishedDate.slice(0, 4) : '',
        description: desc.length > 280 ? desc.slice(0, 280) + '…' : desc,
        cover:       info.imageLinks?.thumbnail?.replace('http:', 'https:') || null,
        source:      'google_books',
      };
    }).filter(b => b.title);
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).json(books);
  } catch {
    clearTimeout(timer);
    return res.status(200).json([]);
  }
}
