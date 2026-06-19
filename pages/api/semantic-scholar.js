// Uses CrossRef (api.crossref.org) — reliable, free, no key required.
// Same academic paper data as Semantic Scholar; CrossRef is the canonical DOI registry.
export default async function handler(req, res) {
  const { q } = req.query;
  if (!q) return res.status(200).json([]);

  const url = `https://api.crossref.org/works?query=${encodeURIComponent(q)}&rows=5&filter=type:journal-article&mailto=izabela.necsoiu@yahoo.com`;

  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);

  try {
    const r = await fetch(url, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!r.ok) return res.status(200).json([]);
    const data = await r.json();
    const items = (data?.message?.items || []);
    const papers = items
      .filter(p => (p.title || [])[0])
      .map(p => {
        const yearRaw =
          p.published?.['date-parts']?.[0]?.[0] ||
          p['published-print']?.['date-parts']?.[0]?.[0] ||
          null;
        const authors = (p.author || []).slice(0, 2)
          .map(a => [a.given, a.family].filter(Boolean).join(' '))
          .filter(Boolean)
          .join(', ');
        const doi = p.DOI || '';
        const oaLink = (p.link || []).find(l => l['content-type'] && l['content-type'] !== 'unspecified');
        return {
          id:      doi,
          title:   (p.title || [])[0] || '',
          authors,
          year:    yearRaw ? String(yearRaw) : '',
          journal: (p['container-title'] || [])[0] || '',
          doi,
          url:     oaLink?.URL || (doi ? `https://doi.org/${doi}` : ''),
          source:  'semanticscholar',
        };
      })
      .filter(p => p.title && p.url);

    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).json(papers);
  } catch {
    clearTimeout(timer);
    return res.status(200).json([]);
  }
}
