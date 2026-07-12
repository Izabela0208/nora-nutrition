import { supabaseAdmin } from "../../lib/supabase";

export default async function handler(req, res) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.authorization || "";
    if (auth !== `Bearer ${secret}`) return res.status(401).json({ ok: false });
  }

  const { error } = await supabaseAdmin().from("profiles").select("user_id").limit(1);
  if (error) return res.status(500).json({ ok: false, error: error.message });

  return res.status(200).json({ ok: true, pinged_at: new Date().toISOString() });
}
