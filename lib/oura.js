import { supabaseAdmin } from "./supabase";

const AUTHORIZE_URL = "https://cloud.ouraring.com/oauth/authorize";
const TOKEN_URL = "https://api.ouraring.com/oauth/token";
const API_BASE = "https://api.ouraring.com/v2/usercollection";
const SCOPE = "personal daily";

// Testing aid, no real Oura account/credentials needed: OURA_MOCK=1 skips the
// real OAuth roundtrip and the real API calls, and fills in fictional data
// instead. Never set this in production.
export function isMockMode() {
  return process.env.OURA_MOCK === "1";
}

function randScore(min, max) {
  return Math.round(min + Math.random() * (max - min));
}

function mockDailyRows(userId, days) {
  const rows = [];
  const now = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const day = d.toISOString().slice(0, 10);
    const synced_at = new Date().toISOString();
    rows.push({ user_id: userId, date: day, data_type: "sleep",      score: randScore(65, 92), raw: { day, mock: true }, synced_at });
    rows.push({ user_id: userId, date: day, data_type: "activity",   score: randScore(55, 95), raw: { day, mock: true }, synced_at });
    rows.push({ user_id: userId, date: day, data_type: "readiness",  score: randScore(60, 90), raw: { day, mock: true }, synced_at });
  }
  return rows;
}

export function buildAuthorizeUrl(state) {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.OURA_CLIENT_ID,
    redirect_uri: process.env.OURA_REDIRECT_URI,
    scope: SCOPE,
    state,
  });
  return `${AUTHORIZE_URL}?${params.toString()}`;
}

async function requestToken(body) {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.OURA_CLIENT_ID,
      client_secret: process.env.OURA_CLIENT_SECRET,
      ...body,
    }),
  });
  if (!res.ok) throw new Error(`Oura token request failed: ${res.status} ${await res.text()}`);
  return res.json();
}

export async function exchangeCodeForToken(code) {
  return requestToken({
    grant_type: "authorization_code",
    code,
    redirect_uri: process.env.OURA_REDIRECT_URI,
  });
}

async function refreshToken(refresh_token) {
  return requestToken({ grant_type: "refresh_token", refresh_token });
}

export async function saveTokens(userId, tokens) {
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
  await supabaseAdmin().from("oura_tokens").upsert({
    user_id: userId,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: expiresAt,
    scope: tokens.scope || SCOPE,
    updated_at: new Date().toISOString(),
  });
}

// Refresh tokens are single-use — every call here must persist the new
// refresh_token Oura returns, or the next refresh will fail.
export async function getValidAccessToken(userId) {
  const { data: row } = await supabaseAdmin().from("oura_tokens").select("*").eq("user_id", userId).maybeSingle();
  if (!row) return null;
  if (isMockMode()) return row.access_token;

  const expiresInMs = new Date(row.expires_at).getTime() - Date.now();
  if (expiresInMs > 60_000) return row.access_token;

  const tokens = await refreshToken(row.refresh_token);
  await saveTokens(userId, tokens);
  return tokens.access_token;
}

export async function disconnectOura(userId) {
  await supabaseAdmin().from("oura_tokens").delete().eq("user_id", userId);
}

async function fetchOuraDay(accessToken, path, startDate, endDate) {
  const params = new URLSearchParams({ start_date: startDate, end_date: endDate });
  const res = await fetch(`${API_BASE}/${path}?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Oura ${path} request failed: ${res.status}`);
  const data = await res.json();
  return data.data || [];
}

// Pulls the last `days` of sleep/activity/readiness and upserts into oura_daily_data.
export async function syncUserData(userId, days = 7) {
  if (isMockMode()) {
    const rows = mockDailyRows(userId, days);
    await supabaseAdmin().from("oura_daily_data").upsert(rows, { onConflict: "user_id,date,data_type" });
    return rows.length;
  }

  const accessToken = await getValidAccessToken(userId);
  if (!accessToken) throw new Error("Not connected to Oura");

  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - days);
  const startDate = start.toISOString().slice(0, 10);
  const endDate = end.toISOString().slice(0, 10);

  const [sleep, activity, readiness] = await Promise.all([
    fetchOuraDay(accessToken, "daily_sleep", startDate, endDate),
    fetchOuraDay(accessToken, "daily_activity", startDate, endDate),
    fetchOuraDay(accessToken, "daily_readiness", startDate, endDate),
  ]);

  const rows = [
    ...sleep.map(d => ({ user_id: userId, date: d.day, data_type: "sleep", score: d.score ?? null, raw: d, synced_at: new Date().toISOString() })),
    ...activity.map(d => ({ user_id: userId, date: d.day, data_type: "activity", score: d.score ?? null, raw: d, synced_at: new Date().toISOString() })),
    ...readiness.map(d => ({ user_id: userId, date: d.day, data_type: "readiness", score: d.score ?? null, raw: d, synced_at: new Date().toISOString() })),
  ];

  if (rows.length) {
    await supabaseAdmin().from("oura_daily_data").upsert(rows, { onConflict: "user_id,date,data_type" });
  }
  return rows.length;
}
