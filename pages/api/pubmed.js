const BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";
const UA   = { "User-Agent": "Nora-Nutrition-App/1.0 (izabela.necsoiu@yahoo.com)" };

async function ncbiGet(url) {
  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const r = await fetch(url, { headers: UA, signal: ctrl.signal });
    clearTimeout(timer);
    return r.ok ? await r.json() : null;
  } catch { clearTimeout(timer); return null; }
}

export default async function handler(req, res) {
  const { q, n = "10", fallbacks = "" } = req.query;
  if (!q) return res.status(200).json({ count: 0, studies: [] });

  const retmax  = Math.min(parseInt(n) || 10, 20);
  const queries = [q, ...fallbacks.split("|").filter(Boolean)];

  // Try each query until one returns results
  let ids = [];
  for (const query of queries) {
    const data = await ncbiGet(
      `${BASE}/esearch.fcgi?db=pubmed&retmode=json&sort=relevance&retmax=${retmax}&term=${encodeURIComponent(query)}`
    );
    ids = data?.esearchresult?.idlist || [];
    if (ids.length) break;
  }

  if (!ids.length) {
    res.setHeader("Cache-Control", "public, s-maxage=3600");
    return res.status(200).json({ count: 0, studies: [] });
  }

  const summary = await ncbiGet(
    `${BASE}/esummary.fcgi?db=pubmed&retmode=json&id=${ids.join(",")}`
  );
  const result = summary?.result || {};

  const studies = ids.map(id => {
    const s = result[id];
    if (!s?.title) return null;
    return {
      id,
      title:   s.title.replace(/\.$/, ""),
      journal: s.source || "",
      year:    s.pubdate ? s.pubdate.slice(0, 4) : "",
      authors: (s.authors || []).slice(0, 2).map(a => a.name).join(", "),
      url:     `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
    };
  }).filter(Boolean);

  res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=604800");
  return res.status(200).json({ count: studies.length, studies });
}
