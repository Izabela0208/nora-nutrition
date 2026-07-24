import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "../../../lib/supabase";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return res.status(401).json({ error: "Missing access token" });

  const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const { data: userData, error } = await anon.auth.getUser(token);
  if (error || !userData?.user) return res.status(401).json({ error: "Invalid session" });

  const { data: row } = await supabaseAdmin().from("oura_tokens").select("connected_at").eq("user_id", userData.user.id).maybeSingle();

  return res.status(200).json({ connected: !!row, connectedAt: row?.connected_at || null });
}
