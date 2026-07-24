import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import OnboardingFlow from "./OnboardingFlow";
import AuthScreen from "./auth/AuthScreen";
import MyDay    from "./tabs/MyDay";
import Eat      from "./tabs/Eat";
import Ritual   from "./tabs/Ritual";
import Boost    from "./tabs/Boost";
import AskNora  from "./tabs/AskNora";
import Me       from "./tabs/Me";
import { C, card, serif, sans, localDateStr, getCyclePhase } from "./noraTokens";
import { NoraAvatar, TabIcon } from "./NoraIcons";
import { useAuthSession } from "../lib/useAuthSession";
import { supabase } from "../lib/supabase";

const TABS = [
  { id:"myday",   label:"My Day"  },
  { id:"eat",     label:"Eat"     },
  { id:"ritual",  label:"Ritual"  },
  { id:"boost",   label:"Boost"   },
  { id:"asknora", label:"Ask Nora"},
  { id:"me",      label:"Me"      },
];

// profile (JS, camelCase) ⇄ profiles row (Supabase, snake_case)
const profileToRow = (p, t, userId) => {
  const heightCm = p.heightUnit === "cm"
    ? Number(p.heightCm) || null
    : Math.round((Number(p.heightFt||0)*12 + Number(p.heightIn||0)) * 2.54) || null;
  const weightKg = p.weightUnit === "kg"
    ? Number(p.weightKg) || null
    : Math.round(Number(p.weightLbs||0) * 0.453592) || null;
  return {
    user_id: userId,
    name: p.name || null,
    age: p.age ? Number(p.age) : null,
    sex: p.sex || null,
    height_cm: heightCm,
    height_unit: p.heightUnit || "cm",
    weight_kg: weightKg,
    weight_unit: p.weightUnit || "kg",
    goals: p.goals || [],
    activity: p.activity || null,
    preferences: p.preferences || null,
    language: p.language || null,
    targets: t || null,
    biological_tracking_enabled: !!p.biologicalTrackingEnabled,
    biological_context: p.biologicalContext || "none",
    last_period_date: p.lastPeriodDate || null,
    cycle_length: p.cycleLength || 28,
    cycle_regularity: p.cycleRegularity || null,
    updated_at: new Date().toISOString(),
  };
};

const rowToProfile = (row) => ({
  name: row.name || "",
  age: row.age ?? "",
  sex: row.sex || "",
  heightCm: row.height_cm ?? "",
  heightUnit: row.height_unit || "cm",
  weightKg: row.weight_kg ?? "",
  weightUnit: row.weight_unit || "kg",
  goals: row.goals || [],
  activity: row.activity || "",
  preferences: row.preferences || "",
  language: row.language || "",
  biologicalTrackingEnabled: !!row.biological_tracking_enabled,
  biologicalContext: row.biological_context || "none",
  lastPeriodDate: row.last_period_date || "",
  cycleLength: row.cycle_length || 28,
  cycleRegularity: row.cycle_regularity || "",
});

// consecutive days ending today (or yesterday, if today has no completion yet)
const calcRitualStreak = (dates) => {
  const set = new Set(dates);
  const d = new Date();
  if (!set.has(localDateStr(d))) d.setDate(d.getDate() - 1);
  let streak = 0;
  while (set.has(localDateStr(d))) { streak++; d.setDate(d.getDate() - 1); }
  return streak;
};

// today's local-midnight → tomorrow's local-midnight, as ISO strings (for logged_at range queries)
const todayRangeISO = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start.getTime() + 86400000);
  return { start: start.toISOString(), end: end.toISOString() };
};

// Current week, Monday-reset — used by the Weekly Biohack Report (Ritual).
const weekRangeISO = () => {
  const now = new Date();
  const dow = now.getDay(); // 0=Sun..6=Sat
  const diffToMonday = dow === 0 ? 6 : dow - 1;
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday);
  const end = new Date(monday.getTime() + 7 * 86400000);
  return { start: monday.toISOString(), end: end.toISOString() };
};

// entry (JS, camelCase, used by Eat/MyDay) ⇄ meals row (Supabase, snake_case)
const entryToRow = (e, userId) => ({
  user_id: userId,
  name: e.name,
  type: e.type || "food",
  meal_group: e.mealGroup || null,
  calories: e.calories ?? 0,
  protein_g: e.protein_g ?? 0,
  carbs_g: e.carbs_g ?? 0,
  fat_g: e.fat_g ?? 0,
  fiber_g: e.fiber_g ?? 0,
  source: e.source || "manual",
  notes: e.notes || null,
  estimated: e.estimated !== false,
});

// active challenge (JS, camelCase, used by Ritual) ⇄ active_challenges + challenge_completions rows (Supabase)
const rowToActiveChallenge = (row, checkIns) => ({
  instanceId: row.id,
  id: row.challenge_id,
  title: row.title,
  instruction: row.instruction || "",
  difficulty: row.difficulty || "",
  duration: row.duration || "",
  label: row.label || null,
  category: row.category || "",
  startDate: row.start_date,
  targetDays: row.target_days,
  checkIns,
});

const rowToEntry = (row) => ({
  id: row.id,
  type: row.type || "food",
  name: row.name,
  time: new Date(row.logged_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  mealGroup: row.meal_group,
  calories: row.calories || 0,
  protein_g: row.protein_g || 0,
  carbs_g: row.carbs_g || 0,
  fat_g: row.fat_g || 0,
  fiber_g: row.fiber_g || 0,
  notes: row.notes || "",
  estimated: row.estimated,
});

export default function NutritionApp() {
  const router = useRouter();
  const { session, loading: authLoading, signOut } = useAuthSession();
  const [phase,      setPhase]      = useState("onboarding");
  const [profile,    setProfile]    = useState(null);
  const [targets,    setTargets]    = useState(null);
  const [welcomeMsg, setWelcomeMsg] = useState("");
  const [activeTab,  setActiveTab]  = useState("myday");
  const [entries,    setEntries]    = useState([]);
  const [activeChallenges, setActiveChallenges] = useState([]);
  const [completionDates, setCompletionDates] = useState([]);
  const [periodLogs, setPeriodLogs] = useState([]);
  const [weekMeals, setWeekMeals] = useState([]);
  const [weekWaterLogs, setWeekWaterLogs] = useState([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [fastingEnabled, setFastingEnabled] = useState(false);
  const [fastingStart,   setFastingStart]   = useState("09:00");
  const [fastingEnd,     setFastingEnd]     = useState("21:00");
  const [fastingMode,             setFastingMode]             = useState("recurring");
  const [fastingExtendedStartAt,  setFastingExtendedStartAt]  = useState(null);
  const [fastingExtendedHours,    setFastingExtendedHours]    = useState(null);
  const [ouraConnected,   setOuraConnected]   = useState(false);
  const [ouraConnectedAt, setOuraConnectedAt] = useState(null);
  const [waterMl,    setWaterMl]    = useState(0);
  const [askNoraMessages, setAskNoraMessages] = useState([]);
  const [history,    setHistory]    = useState({});
  const [profileLoading,  setProfileLoading]  = useState(true);
  const [localImportData, setLocalImportData] = useState(null);

  // Restore today's water + history (still localStorage — migrates in a later sub-step)
  useEffect(()=>{
    try {
      const today=localDateStr();
      const wd=localStorage.getItem("nora_today_water");
      if(wd){const pw=JSON.parse(wd);if(pw.date===today)setWaterMl(pw.ml);}
      const hd=localStorage.getItem("nora_history");
      if(hd)setHistory(JSON.parse(hd));
    }catch{}
  },[]);

  // Load profile + targets from Supabase for the logged-in user
  useEffect(()=>{
    if(authLoading) return;
    if(!session){ setProfileLoading(false); return; }

    let cancelled = false;
    (async () => {
      setProfileLoading(true);
      const { data: row } = await supabase.from("profiles").select("*").eq("user_id", session.user.id).maybeSingle();
      if(cancelled) return;
      if(row){
        setProfile(rowToProfile(row));
        setTargets(row.targets || null);
        const { start, end } = todayRangeISO();
        const { data: mealRows } = await supabase.from("meals").select("*").eq("user_id", session.user.id).gte("logged_at", start).lt("logged_at", end).order("logged_at", { ascending: true });
        if(!cancelled) setEntries((mealRows || []).map(rowToEntry));

        const { start: weekStart, end: weekEnd } = weekRangeISO();
        const { data: weekMealRows } = await supabase.from("meals").select("type, logged_at").eq("user_id", session.user.id).eq("type", "food").gte("logged_at", weekStart).lt("logged_at", weekEnd);
        if(!cancelled) setWeekMeals(weekMealRows || []);
        const { data: weekWaterRows } = await supabase.from("water_logs").select("amount_ml, logged_at").eq("user_id", session.user.id).gte("logged_at", weekStart).lt("logged_at", weekEnd);
        if(!cancelled) setWeekWaterLogs(weekWaterRows || []);

        const { data: acRows } = await supabase.from("active_challenges").select("*").eq("user_id", session.user.id);
        const { data: ccRows } = await supabase.from("challenge_completions").select("challenge_id, completed_date").eq("user_id", session.user.id);
        if(!cancelled){
          const checkInsByChallenge = {};
          (ccRows || []).forEach(r => { (checkInsByChallenge[r.challenge_id] ||= []).push(r.completed_date); });
          setActiveChallenges((acRows || []).map(row =>
            rowToActiveChallenge(row, (checkInsByChallenge[row.challenge_id] || []).filter(d => d >= row.start_date))
          ));
          setCompletionDates([...new Set((ccRows || []).map(r => r.completed_date))]);
        }

        const { data: plRows } = await supabase.from("period_logs").select("id, start_date, end_date").eq("user_id", session.user.id).order("start_date", { ascending: false }).limit(12);
        if(!cancelled) setPeriodLogs(plRows || []);

        const { data: settingsRow } = await supabase.from("user_settings").select("notifications_enabled, fasting_enabled, fasting_start, fasting_end, fasting_mode, fasting_extended_start_at, fasting_extended_hours").eq("user_id", session.user.id).maybeSingle();
        if(!cancelled){
          setNotificationsEnabled(settingsRow ? settingsRow.notifications_enabled : true);
          setFastingEnabled(settingsRow?.fasting_enabled || false);
          setFastingStart(settingsRow?.fasting_start || "09:00");
          setFastingEnd(settingsRow?.fasting_end || "21:00");
          setFastingMode(settingsRow?.fasting_mode || "recurring");
          setFastingExtendedStartAt(settingsRow?.fasting_extended_start_at || null);
          setFastingExtendedHours(settingsRow?.fasting_extended_hours || null);
        }

        const { data: chatRows } = await supabase.from("ask_nora_messages").select("id, role, content").eq("user_id", session.user.id).order("created_at", { ascending: true });
        if(!cancelled) setAskNoraMessages((chatRows || []).map(r => ({ id: r.id, role: r.role, content: r.content })));

        try {
          const ouraRes = await fetch("/api/oura/status", { headers: { Authorization: `Bearer ${session.access_token}` } });
          const ouraData = await ouraRes.json();
          if(!cancelled){ setOuraConnected(!!ouraData.connected); setOuraConnectedAt(ouraData.connectedAt || null); }
        } catch {}

        setPhase("app");
      } else {
        try {
          const p=localStorage.getItem("nora_profile");
          const t=localStorage.getItem("nora_targets");
          if(p&&t){
            const parsed=JSON.parse(p);
            if(parsed.goal&&!parsed.goals){parsed.goals=[parsed.goal];delete parsed.goal;}
            if(!Array.isArray(parsed.goals)) parsed.goals=[];
            setLocalImportData({ profile:parsed, targets:JSON.parse(t) });
            setPhase("import");
          } else {
            setPhase("onboarding");
          }
        } catch { setPhase("onboarding"); }
      }
      setProfileLoading(false);
    })();

    return () => { cancelled = true; };
  },[session, authLoading]);

  // Landing back from the Oura OAuth redirect (/?oura=connected|error)
  useEffect(() => {
    if(!router.isReady) return;
    const { oura } = router.query;
    if(!oura) return;
    if(oura === "connected" && session?.access_token){
      (async () => {
        try {
          const res = await fetch("/api/oura/status", { headers: { Authorization: `Bearer ${session.access_token}` } });
          const data = await res.json();
          setOuraConnected(!!data.connected); setOuraConnectedAt(data.connectedAt || null);
        } catch {}
      })();
      setActiveTab("me");
    }
    router.replace("/", undefined, { shallow: true });
  }, [router.isReady, router.query, session]);

  // Persist water
  useEffect(()=>{
    if(phase!=="app") return;
    try{localStorage.setItem("nora_today_water",JSON.stringify({date:localDateStr(),ml:waterMl}));}catch{}
  },[waterMl]);

  // Save today's summary to history whenever entries or water changes
  useEffect(()=>{
    if(phase!=="app") return;
    try{
      const today=localDateStr();
      const calories=entries.filter(e=>e.type==="food").reduce((s,e)=>s+(e.calories||0),0);
      const protein=entries.filter(e=>e.type==="food").reduce((s,e)=>s+(e.protein_g||0),0);
      if(calories===0&&waterMl===0) return;
      const updated={...history,[today]:{calories,protein,waterMl}};
      setHistory(updated);
      localStorage.setItem("nora_history",JSON.stringify(updated));
    }catch{}
  },[entries,waterMl]);

  const logMeal = async (entry) => {
    const tempId = entry.id ?? `temp-${Date.now()}`;
    const optimistic = { ...entry, id: tempId, type: entry.type || "food", time: entry.time || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
    setEntries(prev => [...prev, optimistic]);
    if(!session?.user?.id) return;
    const row = entryToRow(entry, session.user.id);
    const { data } = await supabase.from("meals").insert(row).select().single();
    if(data) setEntries(prev => prev.map(e => e.id === tempId ? rowToEntry(data) : e));
  };

  // Side-effect only — local waterMl state is updated directly in MyDay's addWater.
  // Persists history for the Weekly Biohack Report (Ritual); doesn't affect today's live total.
  const logWaterEntry = async (ml) => {
    if(!session?.user?.id) return;
    await supabase.from("water_logs").insert({ user_id: session.user.id, amount_ml: ml });
  };

  const sendAskNoraMessage = async (role, content) => {
    const tempId = `temp-${Date.now()}-${Math.random()}`;
    setAskNoraMessages(prev => [...prev, { id: tempId, role, content }]);
    if(!session?.user?.id) return;
    const { data } = await supabase.from("ask_nora_messages").insert({ user_id: session.user.id, role, content }).select("id, role, content").single();
    if(!data) return;
    setAskNoraMessages(prev => prev.map(m => m.id === tempId ? data : m));
  };

  const clearAskNoraMessages = async () => {
    setAskNoraMessages([]);
    if(!session?.user?.id) return;
    await supabase.from("ask_nora_messages").delete().eq("user_id", session.user.id);
  };

  const updateMeal = async (id, patch) => {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, ...patch } : e));
    if(!session?.user?.id) return;
    const row = {};
    if(patch.name !== undefined) row.name = patch.name;
    if(patch.calories !== undefined) row.calories = patch.calories;
    if(patch.protein_g !== undefined) row.protein_g = patch.protein_g;
    if(patch.carbs_g !== undefined) row.carbs_g = patch.carbs_g;
    if(patch.fat_g !== undefined) row.fat_g = patch.fat_g;
    if(patch.notes !== undefined) row.notes = patch.notes;
    if(patch.estimated !== undefined) row.estimated = patch.estimated;
    await supabase.from("meals").update(row).eq("id", id);
  };

  const deleteMeal = async (id) => {
    setEntries(prev => prev.filter(e => e.id !== id));
    if(!session?.user?.id) return;
    await supabase.from("meals").delete().eq("id", id);
  };

  const clearTodayMeals = async () => {
    setEntries([]);
    if(!session?.user?.id) return;
    const { start, end } = todayRangeISO();
    await supabase.from("meals").delete().eq("user_id", session.user.id).gte("logged_at", start).lt("logged_at", end);
  };

  const startChallenge = async (challenge, targetDays) => {
    if(!session?.user?.id) return;
    if(activeChallenges.some(ac => ac.id === challenge.id)) return;
    const row = {
      user_id: session.user.id,
      challenge_id: challenge.id,
      title: challenge.title || challenge.name || "",
      instruction: challenge.instruction || challenge.action || "",
      difficulty: challenge.difficulty || "",
      duration: challenge.duration || "",
      category: challenge.category || "",
      label: challenge.label || null,
      target_days: targetDays,
      start_date: localDateStr(),
    };
    const { data } = await supabase.from("active_challenges").insert(row).select().single();
    if(data) setActiveChallenges(prev => [...prev, rowToActiveChallenge(data, [])]);
  };

  const checkInChallenge = async (instanceId) => {
    const ac = activeChallenges.find(a => a.instanceId === instanceId);
    if(!ac || !session?.user?.id) return;
    const today = localDateStr();
    if(ac.checkIns.includes(today)) return;
    setActiveChallenges(prev => prev.map(a => a.instanceId === instanceId ? { ...a, checkIns: [...a.checkIns, today] } : a));
    setCompletionDates(prev => prev.includes(today) ? prev : [...prev, today]);
    await supabase.from("challenge_completions").upsert(
      { user_id: session.user.id, challenge_id: ac.id, completed_date: today },
      { onConflict: "user_id,challenge_id,completed_date", ignoreDuplicates: true }
    );
  };

  const uncheckInChallenge = async (instanceId) => {
    const ac = activeChallenges.find(a => a.instanceId === instanceId);
    if(!ac || !session?.user?.id) return;
    const today = localDateStr();
    if(!ac.checkIns.includes(today)) return;
    setActiveChallenges(prev => prev.map(a => a.instanceId === instanceId ? { ...a, checkIns: a.checkIns.filter(d => d !== today) } : a));
    await supabase.from("challenge_completions").delete()
      .eq("user_id", session.user.id).eq("challenge_id", ac.id).eq("completed_date", today);
    const { data: remaining } = await supabase.from("challenge_completions").select("id").eq("user_id", session.user.id).eq("completed_date", today).limit(1);
    if(!remaining || remaining.length === 0) setCompletionDates(prev => prev.filter(d => d !== today));
  };

  const markChallengeDone = async (challenge) => {
    if(!session?.user?.id || !challenge) return;
    const today = localDateStr();
    setCompletionDates(prev => prev.includes(today) ? prev : [...prev, today]);
    await supabase.from("challenge_completions").upsert(
      { user_id: session.user.id, challenge_id: challenge.id, completed_date: today },
      { onConflict: "user_id,challenge_id,completed_date", ignoreDuplicates: true }
    );
  };

  const abandonChallenge = async (instanceId) => {
    setActiveChallenges(prev => prev.filter(a => a.instanceId !== instanceId));
    if(!session?.user?.id) return;
    await supabase.from("active_challenges").delete().eq("id", instanceId);
  };

  const logPeriodStart = async (startDate) => {
    if(!session?.user?.id) return;
    const { data } = await supabase.from("period_logs").insert({ user_id: session.user.id, start_date: startDate }).select().single();
    if(data) setPeriodLogs(prev => [data, ...prev].sort((a,b) => b.start_date.localeCompare(a.start_date)));
  };

  const logPeriodEnd = async (logId, endDate) => {
    setPeriodLogs(prev => prev.map(l => l.id === logId ? { ...l, end_date: endDate } : l));
    if(!session?.user?.id) return;
    await supabase.from("period_logs").update({ end_date: endDate }).eq("id", logId);
  };

  const deletePeriodLog = async (logId) => {
    setPeriodLogs(prev => prev.filter(l => l.id !== logId));
    if(!session?.user?.id) return;
    await supabase.from("period_logs").delete().eq("id", logId);
  };

  const saveNotifications = async (enabled) => {
    setNotificationsEnabled(enabled);
    if(!session?.user?.id) return;
    await supabase.from("user_settings").upsert({ user_id: session.user.id, notifications_enabled: enabled, updated_at: new Date().toISOString() });
  };

  const saveFastingWindow = async (enabled, start, end) => {
    setFastingEnabled(enabled); setFastingStart(start); setFastingEnd(end); setFastingMode("recurring");
    if(!session?.user?.id) return;
    await supabase.from("user_settings").upsert({ user_id: session.user.id, fasting_enabled: enabled, fasting_start: start, fasting_end: end, fasting_mode: "recurring", updated_at: new Date().toISOString() });
  };

  const saveExtendedFast = async (hours, startAtISO) => {
    setFastingEnabled(true); setFastingMode("extended"); setFastingExtendedStartAt(startAtISO); setFastingExtendedHours(hours);
    if(!session?.user?.id) return;
    await supabase.from("user_settings").upsert({ user_id: session.user.id, fasting_enabled: true, fasting_mode: "extended", fasting_extended_start_at: startAtISO, fasting_extended_hours: hours, updated_at: new Date().toISOString() });
  };

  const stopExtendedFast = async () => {
    await saveFastingWindow(fastingEnabled, fastingStart, fastingEnd);
  };

  const connectOura = () => {
    if(!session?.access_token) return;
    window.location.href = `/api/oura/authorize?token=${encodeURIComponent(session.access_token)}`;
  };

  const disconnectOura = async () => {
    if(!session?.access_token) return;
    try {
      await fetch("/api/oura/disconnect", { method: "POST", headers: { Authorization: `Bearer ${session.access_token}` } });
      setOuraConnected(false); setOuraConnectedAt(null);
    } catch {}
  };

  const deleteAccount = async () => {
    if(!session?.access_token) return { ok: false, error: "No active session." };
    try {
      const res = await fetch("/api/delete-account", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      if(!res.ok) return { ok: false, error: data.error || "Something went wrong." };
      await signOut();
      return { ok: true };
    } catch {
      return { ok: false, error: "Something went wrong." };
    }
  };

  const saveProfile = async (newProfile, newTargets) => {
    const t = newTargets !== undefined ? newTargets : targets;
    setProfile(newProfile);
    setTargets(t);
    if(!session?.user?.id) return;
    const row = profileToRow(newProfile, t, session.user.id);
    await supabase.from("profiles").upsert(row);
  };

  const handleOnboardingComplete=(finalProfile,data)=>{
    setWelcomeMsg(data.welcome_message||`Welcome, ${finalProfile.name}. Let's build great habits together.`);
    saveProfile(finalProfile, data);
    setPhase("welcome");
  };

  const handleImportLocalData = () => {
    if(!localImportData) return;
    const { profile: importedProfile, targets: importedTargets } = localImportData;
    saveProfile(importedProfile, importedTargets);
    try {
      const ed = localStorage.getItem("nora_today_entries");
      if(ed){
        const parsed = JSON.parse(ed);
        if(parsed.date === localDateStr() && Array.isArray(parsed.entries)){
          parsed.entries.forEach(e => logMeal({ ...e, source: e.source || "manual" }));
        }
      }
    } catch {}
    setLocalImportData(null);
    setPhase("app");
  };

  const resetProfile=()=>{
    ["nora_today_water","nora_today_entries","nora_sleep","nora_history","nora_supps_list","nora_supps_taken","nora_boost_recs","nora_smoothie","nora_evening_reflection"].forEach(k=>{try{localStorage.removeItem(k);}catch{}});
    setProfile(null);setTargets(null);setWelcomeMsg("");setEntries([]);setActiveChallenges([]);setCompletionDates([]);setPeriodLogs([]);setNotificationsEnabled(true);setFastingEnabled(false);setFastingStart("09:00");setFastingEnd("21:00");setFastingMode("recurring");setFastingExtendedStartAt(null);setFastingExtendedHours(null);setWaterMl(0);setHistory({});setPhase("onboarding");
  };

  // Cycle phase — only when the user opted in and chose "Menstruation" as context
  const cyclePhase = (profile?.sex === "female" && profile?.biologicalTrackingEnabled && profile?.biologicalContext === "cycle")
    ? getCyclePhase(periodLogs, profile?.cycleLength || 28)
    : null;

  // ── Auth ────────────────────────────────────────────────────────
  if(authLoading) return <div style={{minHeight:"100vh",backgroundColor:C.bg}}/>;
  if(!session) return <AuthScreen/>;
  if(profileLoading) return <div style={{minHeight:"100vh",backgroundColor:C.bg}}/>;

  // ── Import local data (found on this device, no account data yet) ─
  if(phase==="import") return (
    <div style={{minHeight:"100vh",backgroundColor:C.bg,fontFamily:sans,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{width:"100%",maxWidth:400}}>
        <div style={{...card,padding:"32px 28px",textAlign:"center"}}>
          <h2 style={{fontFamily:serif,fontSize:22,color:C.green,margin:"0 0 10px",fontWeight:600}}>Welcome back</h2>
          <p style={{color:C.muted,fontSize:14,lineHeight:1.7,marginBottom:24}}>
            We found data from a previous session on this device. Would you like to bring it into your account?
          </p>
          <button onClick={handleImportLocalData} style={{width:"100%",backgroundColor:C.green,color:C.bg,border:"none",borderRadius:12,padding:"15px",fontSize:15,fontWeight:500,cursor:"pointer",letterSpacing:"0.03em",marginBottom:10}}>
            Import my data
          </button>
          <button onClick={()=>{setLocalImportData(null);setPhase("onboarding");}} style={{width:"100%",backgroundColor:"transparent",color:C.muted,border:"none",borderRadius:12,padding:"12px",fontSize:13,cursor:"pointer"}}>
            Start fresh instead
          </button>
        </div>
      </div>
    </div>
  );

  // ── Onboarding ──────────────────────────────────────────────────
  if(phase==="onboarding") return <OnboardingFlow onComplete={handleOnboardingComplete}/>;

  // ── Welcome ─────────────────────────────────────────────────────
  if(phase==="welcome") return (
    <div style={{minHeight:"100vh",backgroundColor:C.bg,fontFamily:sans}}>
      <div style={{width:"100%",height:220,overflow:"hidden",position:"relative"}}>
        <img src="https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&q=80&auto=format&fit=crop" alt="" loading="lazy" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
        <div style={{position:"absolute",inset:0,background:"linear-gradient(to bottom,rgba(30,52,41,0.2) 0%,rgba(245,240,232,1) 95%)"}}/>
        <div style={{position:"absolute",bottom:0,left:0,right:0,display:"flex",justifyContent:"center",paddingBottom:4}}><NoraAvatar size={56}/></div>
      </div>
      <div style={{display:"flex",justifyContent:"center",padding:"0 20px 48px"}}>
      <div style={{width:"100%",maxWidth:400}}>
        <div style={{...card,padding:"24px 28px 28px",textAlign:"center"}}>
          <h2 style={{fontFamily:serif,fontSize:24,color:C.green,margin:"0 0 10px",fontWeight:600}}>Welcome, {profile?.name}</h2>
          <p style={{color:C.muted,fontSize:14,lineHeight:1.7,marginBottom:24}}>{welcomeMsg}</p>
          {targets&&(
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:24}}>
              {[["Energy",`${targets.calories} kcal`],["Protein",`${targets.protein_g} g`],["Carbs",`${targets.carbs_g} g`],["Fat",`${targets.fat_g} g`],["Fibre",`${targets.fiber_g} g`],["Water",`${Math.round(targets.water_ml/100)/10} L`]].map(([l,v])=>(
                <div key={l} style={{backgroundColor:C.greenLight,borderRadius:12,padding:"12px 14px",textAlign:"left"}}>
                  <div style={{fontSize:11,color:C.muted,fontWeight:500,letterSpacing:"0.05em",textTransform:"uppercase",marginBottom:3}}>{l}</div>
                  <div style={{fontSize:15,fontWeight:600,color:C.green}}>{v}</div>
                </div>
              ))}
            </div>
          )}
          <button onClick={()=>setPhase("app")} style={{width:"100%",backgroundColor:C.green,color:C.bg,border:"none",borderRadius:12,padding:"15px",fontSize:15,fontWeight:500,cursor:"pointer",letterSpacing:"0.03em"}}>Begin tracking</button>
        </div>
      </div>
      </div>
    </div>
  );

  // ── Main app ────────────────────────────────────────────────────
  const sharedProps = { profile, targets, entries, logMeal, updateMeal, deleteMeal, clearTodayMeals, waterMl, setWaterMl, cyclePhase, logWaterEntry };

  const ritualStreak = calcRitualStreak(completionDates);

  const tabContent = {
    myday:   <MyDay {...sharedProps} activeChallenges={activeChallenges} checkInChallenge={checkInChallenge} setActiveTab={setActiveTab} fastingEnabled={fastingEnabled} fastingStart={fastingStart} fastingEnd={fastingEnd} fastingMode={fastingMode} fastingExtendedStartAt={fastingExtendedStartAt} fastingExtendedHours={fastingExtendedHours}/>,
    eat:     <Eat     profile={profile} targets={targets} entries={entries} logMeal={logMeal} cyclePhase={cyclePhase}/>,
    ritual:  <Ritual  profile={profile} targets={targets} entries={entries} waterMl={waterMl} cyclePhase={cyclePhase} periodLogs={periodLogs} activeChallenges={activeChallenges} startChallenge={startChallenge} checkInChallenge={checkInChallenge} uncheckInChallenge={uncheckInChallenge} abandonChallenge={abandonChallenge} ritualStreak={ritualStreak} markChallengeDone={markChallengeDone} weekMeals={weekMeals} weekWaterLogs={weekWaterLogs} completionDates={completionDates} fastingStart={fastingStart} fastingEnd={fastingEnd}/>,
    boost:   <Boost   profile={profile} targets={targets} entries={entries} cyclePhase={cyclePhase}/>,
    asknora: <AskNora profile={profile} targets={targets} entries={entries} waterMl={waterMl} cyclePhase={cyclePhase} activeChallenges={activeChallenges} messages={askNoraMessages} sendMessage={sendAskNoraMessage} clearMessages={clearAskNoraMessages}/>,
    me:      <Me      profile={profile} saveProfile={saveProfile} targets={targets} resetProfile={resetProfile} signOut={signOut} notificationsEnabled={notificationsEnabled} saveNotifications={saveNotifications} deleteAccount={deleteAccount} fastingEnabled={fastingEnabled} fastingStart={fastingStart} fastingEnd={fastingEnd} saveFastingWindow={saveFastingWindow} fastingMode={fastingMode} fastingExtendedStartAt={fastingExtendedStartAt} fastingExtendedHours={fastingExtendedHours} saveExtendedFast={saveExtendedFast} stopExtendedFast={stopExtendedFast} periodLogs={periodLogs} cyclePhase={cyclePhase} logPeriodStart={logPeriodStart} logPeriodEnd={logPeriodEnd} deletePeriodLog={deletePeriodLog} ouraConnected={ouraConnected} ouraConnectedAt={ouraConnectedAt} connectOura={connectOura} disconnectOura={disconnectOura}/>,
  };

  return (
    <div style={{minHeight:"100vh",maxWidth:480,margin:"0 auto",position:"relative",fontFamily:sans}}>
      {tabContent[activeTab]}
      {/* Tab bar */}
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,backgroundColor:"rgba(250,250,247,0.96)",borderTop:`1px solid ${C.border}`,padding:"6px 0 10px",display:"flex",justifyContent:"space-around",zIndex:10,backdropFilter:"blur(8px)"}}>
        {TABS.map(tab=>{
          const active=activeTab===tab.id;
          return(
            <button key={tab.id} onClick={()=>setActiveTab(tab.id)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"4px 2px",borderRadius:10,border:"none",backgroundColor:"transparent",cursor:"pointer",transition:"all 0.15s",flex:1,minWidth:0}}>
              <TabIcon id={tab.id} active={active}/>
              <span style={{fontSize:8,fontWeight:active?600:400,color:active?C.green:C.muted,letterSpacing:"0.02em",whiteSpace:"nowrap"}}>{tab.label}</span>
              {active&&<div style={{width:14,height:2,borderRadius:2,backgroundColor:C.gold}}/>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
