import { supabaseAdmin } from "../../../lib/supabase";
import { exchangeCodeForToken, saveTokens, syncUserData } from "../../../lib/oura";

const STATE_TTL_MS = 10 * 60 * 1000;

export default async function handler(req, res) {
  const { code, state, error: ouraError } = req.query;

  if (ouraError || !code || !state) {
    res.writeHead(302, { Location: "/?oura=error" });
    return res.end();
  }

  const admin = supabaseAdmin();
  const { data: stateRow } = await admin.from("oura_oauth_states").select("*").eq("state", state).maybeSingle();
  if (stateRow) await admin.from("oura_oauth_states").delete().eq("state", state);

  const expired = !stateRow || Date.now() - new Date(stateRow.created_at).getTime() > STATE_TTL_MS;
  if (expired) {
    res.writeHead(302, { Location: "/?oura=error" });
    return res.end();
  }

  try {
    const tokens = await exchangeCodeForToken(code);
    await saveTokens(stateRow.user_id, tokens);
    try { await syncUserData(stateRow.user_id); } catch { /* initial sync is best-effort */ }
    res.writeHead(302, { Location: "/?oura=connected" });
  } catch {
    res.writeHead(302, { Location: "/?oura=error" });
  }
  res.end();
}
