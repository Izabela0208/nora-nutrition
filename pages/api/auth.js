export default function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { password } = req.body || {};
  const expected = process.env.SITE_PASSWORD;
  if (!expected) return res.status(200).json({ ok: true }); // gate disabled if env not set
  if (password === expected) return res.status(200).json({ ok: true });
  return res.status(401).json({ ok: false });
}
