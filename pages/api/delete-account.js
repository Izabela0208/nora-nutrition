import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "../../lib/supabase";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return res.status(401).json({ error: "Missing access token" });

  const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const { data: userData, error: userError } = await anon.auth.getUser(token);
  if (userError || !userData?.user) return res.status(401).json({ error: "Invalid session" });

  const { error: deleteError } = await supabaseAdmin().auth.admin.deleteUser(userData.user.id);
  if (deleteError) return res.status(500).json({ error: deleteError.message });

  return res.status(200).json({ ok: true });
}
