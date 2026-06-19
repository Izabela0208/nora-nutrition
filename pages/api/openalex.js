export default async function handler(req, res) {
  const { q } = req.query;
  if (!q) return res.status(200).json([]);

  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 3000);
  try {
    const r = await fetch(
      `https://api.openalex.org/works?search=${encodeURIComponent(q)}&filter=is_oa:true&per_page=5&mailto=izabela.necsoiu@yahoo.com`,
      { signal: ctrl.signal }
    );
    clearTimeout(timer);
    if (!r.ok) return res.status(200).json([]);
    const data = await r.json();
    const papers = (data.results || [])
      .filter(p => p.title)
      .map(p => ({
        id:      p.id,
        title:   p.title,
        authors: (p.authorships || []).slice(0, 2)
          .map(a => a.author?.display_name).filter(Boolean).join(', '),
        year:    p.publication_year ? String(p.publication_year) : '',
        doi:     p.doi ? p.doi.replace('https://doi.org/', '') : '',
        url:     p.open_access?.oa_url || p.doi || `https://openalex.org/${p.id}`,
        source:  'openalex',
      }));
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).json(papers);
  } catch {
    clearTimeout(timer);
    return res.status(200).json([]);
  }
}
