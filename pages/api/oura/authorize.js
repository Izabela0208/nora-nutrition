import { randomBytes } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "../../../lib/supabase";
import { buildAuthorizeUrl, isMockMode, saveTokens, syncUserData } from "../../../lib/oura";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  const token = req.query.token;
  if (!token) return res.status(401).send("Missing access token");

  const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const { data: userData, error } = await anon.auth.getUser(token);
  if (error || !userData?.user) return res.status(401).send("Invalid session");

  // Testing aid: skips the real Oura OAuth roundtrip entirely, writes a fake
  // token + fictional daily data directly. See lib/oura.js isMockMode().
  if (isMockMode()) {
    await saveTokens(userData.user.id, { access_token: "mock_access_token", refresh_token: "mock_refresh_token", expires_in: 86400, scope: "personal daily" });
    try { await syncUserData(userData.user.id); } catch { /* best-effort */ }
    res.writeHead(302, { Location: "/?oura=connected" });
    return res.end();
  }

  const state = randomBytes(24).toString("hex");
  await supabaseAdmin().from("oura_oauth_states").insert({ state, user_id: userData.user.id });

  res.writeHead(302, { Location: buildAuthorizeUrl(state) });
  res.end();
}
