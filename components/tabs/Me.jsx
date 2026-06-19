import { useState, useEffect } from "react";
import { C, card, serif, sans, inp, localDateStr } from "../noraTokens";
import { NoraAvatar, LeafDecor, CheckIcon, HeartIcon, MoonIcon } from "../NoraIcons";
import { SectionHeader, Collapsible } from "../NoraUI";

const GOAL_OPTIONS = [
  "Lose weight", "Build muscle", "Improve energy", "Better sleep",
  "Eat healthier", "Gut health", "Hormonal balance", "Longevity",
  "Athletic performance", "Mental clarity", "Reduce inflammation", "Detox",
];

const ACTIVITY_OPTIONS = [
  { id: "Sedentary",         desc: "Desk work, little movement" },
  { id: "Lightly active",    desc: "1–2 workouts per week" },
  { id: "Moderately active", desc: "3–4 workouts per week" },
  { id: "Very active",       desc: "5–6 workouts per week" },
  { id: "Extremely active",  desc: "Daily intense training" },
];

const PHASE_INFO = {
  Menstrual:  { energy: "Low — prioritise rest",              mood: "Introspective, possibly tender",  nutrition: "Iron-rich foods, herbal tea, ease off caffeine" },
  Follicular: { energy: "Rising — good for new starts",       mood: "Optimistic and creative",          nutrition: "Complex carbs, fermented foods, leafy greens"   },
  Ovulatory:  { energy: "Peak — optimal for performance",     mood: "Sociable and confident",           nutrition: "Zinc-rich seeds, anti-inflammatory foods"       },
  Luteal:     { energy: "Steady — prefer gentle movement",    mood: "Grounding, watch for PMS",        nutrition: "Magnesium, dark chocolate, reduce salt"         },
};

export default function Me({ profile, setProfile, targets, resetProfile }) {
  const [form,     setForm]     = useState({ ...profile });
  const [saved,    setSaved]    = useState(false);
  const [plans,    setPlans]    = useState([]);
  const [open,     setOpen]     = useState({ edit: false, plans: false, about: false });
  const [heightUnit, setHeightUnit] = useState(profile?.heightUnit || "cm");
  const [weightUnit, setWeightUnit] = useState(profile?.weightUnit || "kg");
  const [favRecipe, setFavRecipe] = useState(null);
  const [favIngChk, setFavIngChk] = useState({});
  const [sleepHours,   setSleepHours]   = useState("");
  const [sleepQuality, setSleepQuality] = useState("ok");
  const [sleepSaved,   setSleepSaved]   = useState(false);
  const [periodLog,    setPeriodLog]    = useState({ periods: [] });

  const tog = k => setOpen(p => ({ ...p, [k]: !p[k] }));

  useEffect(() => {
    setForm({ ...profile });
    setHeightUnit(profile?.heightUnit || "cm");
    setWeightUnit(profile?.weightUnit || "kg");
  }, [profile]);

  useEffect(() => {
    try {
      // Prefer unified saved items; fall back to legacy saved plans
      const si = localStorage.getItem("nora_saved_items");
      if (si) { setPlans(JSON.parse(si)); return; }
      const sp = localStorage.getItem("nora_saved_plans");
      if (sp) setPlans(JSON.parse(sp).map(p => ({ id: p.id, date: p.date, type: "day_plan", label: `Plan — ${p.date}`, data: p.plan })));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      const sl = localStorage.getItem("nora_sleep");
      if (sl) { const ps = JSON.parse(sl); if (ps.date === localDateStr()) { setSleepHours(ps.hours); setSleepQuality(ps.quality); setSleepSaved(true); } }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      const pl = localStorage.getItem("nora_period_log");
      if (pl) setPeriodLog(JSON.parse(pl));
    } catch {}
  }, []);

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }));

  const saveSleep = () => {
    setSleepSaved(true);
    try { localStorage.setItem("nora_sleep", JSON.stringify({ date: localDateStr(), hours: sleepHours, quality: sleepQuality })); } catch {}
  };

  const parseDate = s => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };

  const logPeriodStart = () => {
    const today = localDateStr();
    const periods = [...(periodLog.periods || []), { start: today, end: null }];
    const updated = { periods };
    setPeriodLog(updated);
    try { localStorage.setItem("nora_period_log", JSON.stringify(updated)); } catch {}
    const newProfile = { ...profile, lastPeriod: today, cycleRegularity: "Regular", perimenopause: false };
    if (periods.length >= 2) {
      const diff = Math.floor((parseDate(today) - parseDate(periods[periods.length - 2].start)) / 86400000);
      if (diff >= 21 && diff <= 45) newProfile.cycleLength = diff;
    }
    setProfile(newProfile);
    try { localStorage.setItem("nora_profile", JSON.stringify(newProfile)); } catch {}
  };

  const removePeriodEntry = () => {
    const periods = (periodLog.periods || []).slice(0, -1);
    const updated = { periods };
    setPeriodLog(updated);
    try { localStorage.setItem("nora_period_log", JSON.stringify(updated)); } catch {}
    const newProfile = { ...profile };
    if (periods.length > 0) { newProfile.lastPeriod = periods[periods.length - 1].start; } else { delete newProfile.lastPeriod; }
    setProfile(newProfile);
    try { localStorage.setItem("nora_profile", JSON.stringify(newProfile)); } catch {}
  };

  const logPeriodEnd = () => {
    const periods = [...(periodLog.periods || [])];
    if (periods.length === 0) return;
    periods[periods.length - 1] = { ...periods[periods.length - 1], end: localDateStr() };
    const updated = { periods };
    setPeriodLog(updated);
    try { localStorage.setItem("nora_period_log", JSON.stringify(updated)); } catch {}
  };

  const toggleGoal = g => {
    const goals = form.goals || [];
    set("goals", goals.includes(g) ? goals.filter(x => x !== g) : [...goals, g]);
  };

  const saveChanges = () => {
    const updated = { ...form, heightUnit, weightUnit };
    // Sync computed cm/lbs values
    if (heightUnit === "cm" && form.heightCm) {
      updated.heightCm = Number(form.heightCm);
    } else if (heightUnit === "ft") {
      const cm = Math.round((Number(form.heightFt || 0) * 12 + Number(form.heightIn || 0)) * 2.54);
      updated.heightCm = cm;
    }
    if (weightUnit === "kg" && form.weightKg) {
      updated.weightKg = Number(form.weightKg);
      updated.weightLbs = Math.round(updated.weightKg * 2.205);
    } else if (weightUnit === "lbs" && form.weightLbs) {
      updated.weightLbs = Number(form.weightLbs);
      updated.weightKg  = Math.round(updated.weightLbs / 2.205);
    }
    setProfile(updated);
    try { localStorage.setItem("nora_profile", JSON.stringify(updated)); } catch {}
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const deletePlan = id => {
    const updated = plans.filter(p => p.id !== id);
    setPlans(updated);
    try { localStorage.setItem("nora_saved_items", JSON.stringify(updated)); } catch {}
  };

  const takenCount  = (() => {
    try {
      const t = localStorage.getItem("nora_supps_taken");
      if (!t) return 0;
      const p = JSON.parse(t);
      if (p.date !== localDateStr()) return 0;
      return Object.values(p.taken || {}).filter(Boolean).length;
    } catch { return 0; }
  })();

  const suppCount = (() => {
    try {
      const s = localStorage.getItem("nora_supps_list");
      return s ? JSON.parse(s).length : 0;
    } catch { return 0; }
  })();

  const f = form;
  const lang = (profile?.language || "English").trim();

  return (
    <div style={{ padding: "24px 20px 100px", display: "flex", flexDirection: "column", gap: 14 }}>

      {/* ── Profile summary ───────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <LeafDecor size={18}/>
        <h2 style={{ fontFamily: serif, fontSize: 22, color: C.green, fontWeight: 600, margin: 0 }}>Me</h2>
      </div>

      {/* Avatar card */}
      <div style={{ ...card, padding: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
          <div style={{ width: 54, height: 54, borderRadius: "50%", backgroundColor: C.green, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700, color: C.bg, flexShrink: 0 }}>
            {profile?.name?.[0]?.toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: C.text, margin: 0 }}>{profile?.name}</h3>
            <p style={{ fontSize: 12, color: C.muted, margin: "2px 0 6px" }}>{profile?.activity}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {(profile?.goals || []).slice(0, 3).map(g => (
                <span key={g} style={{ fontSize: 11, backgroundColor: C.greenLight, color: C.green, padding: "3px 8px", borderRadius: 20, border: `1px solid ${C.border}` }}>{g}</span>
              ))}
              {(profile?.goals || []).length > 3 && (
                <span style={{ fontSize: 11, color: C.muted }}>+{(profile?.goals || []).length - 3} more</span>
              )}
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[
            profile?.age    && ["Age",    `${profile.age}y`],
            profile?.sex    && ["Sex",    profile.sex],
            profile?.heightCm && ["Height", `${profile.heightCm} cm`],
            profile?.weightKg && ["Weight", `${profile.weightKg} kg`],
          ].filter(Boolean).map(([l, v]) => (
            <div key={l} style={{ backgroundColor: C.bg, borderRadius: 8, padding: "6px 11px", border: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 10, color: C.muted }}>{l}: </span>
              <span style={{ fontSize: 12, color: C.text, fontWeight: 600, textTransform: "capitalize" }}>{v}</span>
            </div>
          ))}
        </div>

      </div>

      {/* Daily targets */}
      {targets && (
        <div style={{ ...card, padding: "16px 20px" }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 10px" }}>Daily Targets</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {[["Energy", `${targets.calories} kcal`], ["Protein", `${targets.protein_g}g`], ["Carbs", `${targets.carbs_g}g`], ["Fat", `${targets.fat_g}g`], ["Fibre", `${targets.fiber_g}g`], ["Water", `${Math.round(targets.water_ml / 100) / 10}L`]].map(([l, v]) => (
              <div key={l} style={{ backgroundColor: C.bg, borderRadius: 10, padding: "10px 12px", border: `1px solid ${C.border}` }}>
                <p style={{ fontSize: 10, color: C.muted, margin: "0 0 2px", fontWeight: 500 }}>{l}</p>
                <p style={{ fontSize: 13, fontWeight: 700, color: C.green, margin: 0 }}>{v}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Today's stats */}
      {suppCount > 0 && (
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ ...card, flex: 1, padding: "14px 16px", textAlign: "center" }}>
            <p style={{ fontSize: 22, fontWeight: 700, color: C.green, margin: 0, fontFamily: serif }}>{takenCount}/{suppCount}</p>
            <p style={{ fontSize: 11, color: C.muted, margin: "2px 0 0" }}>Supplements taken</p>
          </div>
          <div style={{ ...card, flex: 1, padding: "14px 16px", textAlign: "center" }}>
            <p style={{ fontSize: 22, fontWeight: 700, color: C.green, margin: 0, fontFamily: serif }}>{plans.length}</p>
            <p style={{ fontSize: 11, color: C.muted, margin: "2px 0 0" }}>Saved meal plans</p>
          </div>
        </div>
      )}

      {/* ── Health Data ──────────────────────────────────────────── */}
      <div style={{ ...card, padding: "16px 18px" }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 14px" }}>Health Data</p>

        {/* Sleep */}
        {!sleepSaved ? (
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 12px" }}>Last night's sleep</p>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <input type="number" step="0.5" min="0" max="14" style={{ ...inp, flex: 1 }} placeholder="Hours e.g. 7.5" value={sleepHours} onChange={e => setSleepHours(e.target.value)}/>
              <div style={{ display: "flex", gap: 4, flex: 2 }}>
                {["poor", "ok", "good", "great"].map(q => (
                  <button key={q} onClick={() => setSleepQuality(q)} style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: `1px solid ${sleepQuality === q ? C.green : C.border}`, backgroundColor: sleepQuality === q ? C.green : C.card, color: sleepQuality === q ? C.bg : C.muted, fontSize: 11, fontWeight: sleepQuality === q ? 600 : 400, cursor: "pointer", textTransform: "capitalize" }}>{q}</button>
                ))}
              </div>
            </div>
            <button onClick={saveSleep} disabled={!sleepHours} style={{ width: "100%", padding: "11px", backgroundColor: sleepHours ? C.green : "#C8D5D1", color: C.bg, border: "none", borderRadius: 9, fontSize: 13, fontWeight: 500, cursor: sleepHours ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <MoonIcon size={13} color={sleepHours ? C.bg : "rgba(255,255,255,0.5)"}/>Save sleep
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", backgroundColor: C.bg, borderRadius: 10, border: `1px solid ${C.border}` }}>
            <MoonIcon size={14} color={C.slate}/>
            <span style={{ fontSize: 13, color: C.text, flex: 1 }}>Sleep: <strong>{sleepHours}h</strong> · {sleepQuality}</span>
            <button onClick={() => setSleepSaved(false)} style={{ fontSize: 11, color: C.muted, background: "none", border: "none", cursor: "pointer" }}>Edit</button>
          </div>
        )}

        {/* Menstrual tracking (females only) */}
        {profile?.sex === "female" && (() => {
          const periods = periodLog.periods || [];
          const todayMs = (() => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()).getTime(); })();
          let cycleData = { state: "no_data" };
          if (periods.length > 0) {
            const lastP = periods[periods.length - 1];
            const lastStartMs = parseDate(lastP.start).getTime();
            const daysSinceStart = Math.floor((todayMs - lastStartMs) / 86400000);
            if (daysSinceStart >= 60) {
              cycleData = Number(profile?.age) >= 45
                ? { state: "perimenopause", daysSinceStart }
                : { state: "gentle_prompt", daysSinceStart };
            } else {
              let cycleLength = 28;
              if (periods.length >= 2) {
                const diff = Math.floor((lastStartMs - parseDate(periods[periods.length - 2].start).getTime()) / 86400000);
                if (diff >= 21 && diff <= 45) cycleLength = diff;
              }
              const currentDay = daysSinceStart + 1;
              let phaseName, phaseColor, phaseColorLight;
              if (currentDay <= 5)       { phaseName = "Menstrual";  phaseColor = "#9E5E52"; phaseColorLight = "#9E5E5215"; }
              else if (currentDay <= 13) { phaseName = "Follicular"; phaseColor = "#7A9E8A"; phaseColorLight = "#7A9E8A15"; }
              else if (currentDay <= 16) { phaseName = "Ovulatory";  phaseColor = "#C9A96E"; phaseColorLight = "#C9A96E15"; }
              else                       { phaseName = "Luteal";     phaseColor = "#B8922A"; phaseColorLight = "#B8922A15"; }
              const nextMs = lastStartMs + cycleLength * 86400000;
              const daysUntil = Math.round((nextMs - todayMs) / 86400000);
              const nextDate = new Date(nextMs);
              const nextStr = `${nextDate.getDate()} ${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][nextDate.getMonth()]}`;
              cycleData = { state: "active", phaseName, phaseColor, phaseColorLight, currentDay, cycleLength, nextStr, daysUntil };
            }
          }
          const lastEntry = periods.length > 0 ? periods[periods.length - 1] : null;
          const canEnd = lastEntry && !lastEntry.end;
          return (
            <>
              <div style={{ height: 1, backgroundColor: C.border, margin: "14px 0" }}/>
              <p style={{ fontSize: 12, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 10px" }}>Menstrual cycle</p>
              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <button onClick={logPeriodStart} style={{ flex: 1, padding: "10px 0", borderRadius: 9, border: `1.5px solid ${C.green}`, backgroundColor: C.green, color: C.bg, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  Period started today
                </button>
                <button onClick={logPeriodEnd} disabled={!canEnd} style={{ flex: 1, padding: "10px 0", borderRadius: 9, border: `1.5px solid ${canEnd ? C.border : C.border}`, backgroundColor: "transparent", color: canEnd ? C.muted : C.border, fontSize: 12, fontWeight: 500, cursor: canEnd ? "pointer" : "not-allowed" }}>
                  Period ended today
                </button>
              </div>
              {lastEntry && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "0 0 10px" }}>
                  <p style={{ fontSize: 11, color: C.muted, margin: 0, lineHeight: 1.4 }}>
                    Last logged: {lastEntry.start}{lastEntry.end ? ` → ${lastEntry.end}` : " (ongoing)"}
                  </p>
                  <button onClick={removePeriodEntry} title="Remove last entry" style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: C.muted, padding: "2px 6px", borderRadius: 6, textDecoration: "underline", flexShrink: 0 }}>undo</button>
                </div>
              )}
              {cycleData.state === "active" && (
                <div style={{ backgroundColor: cycleData.phaseColorLight, borderRadius: 12, padding: "14px 16px", border: `1px solid ${cycleData.phaseColor}35` }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: cycleData.phaseColor, textTransform: "uppercase", letterSpacing: "0.06em" }}>{cycleData.phaseName}</span>
                      <span style={{ fontSize: 11, color: C.muted, marginLeft: 8 }}>Day {cycleData.currentDay} of ~{cycleData.cycleLength}</span>
                    </div>
                    {cycleData.daysUntil >= 0 && (
                      <span style={{ fontSize: 10, color: C.muted, backgroundColor: C.card, borderRadius: 6, padding: "3px 8px", border: `1px solid ${C.border}` }}>
                        Next ~{cycleData.nextStr}
                      </span>
                    )}
                  </div>
                  {[["Energy", PHASE_INFO[cycleData.phaseName].energy], ["Mood", PHASE_INFO[cycleData.phaseName].mood], ["Nutrition", PHASE_INFO[cycleData.phaseName].nutrition]].map(([label, val]) => (
                    <div key={label} style={{ display: "flex", gap: 8, marginBottom: 5 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: cycleData.phaseColor, minWidth: 54, paddingTop: 2, flexShrink: 0 }}>{label}</span>
                      <span style={{ fontSize: 12, color: C.text, lineHeight: 1.45 }}>{val}</span>
                    </div>
                  ))}
                </div>
              )}
              {cycleData.state === "perimenopause" && (
                <div style={{ backgroundColor: C.goldLight, borderRadius: 12, padding: "13px 16px", border: `1px solid ${C.gold}40` }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: C.amber, margin: "0 0 4px" }}>Hormonal transition detected</p>
                  <p style={{ fontSize: 12, color: C.text, lineHeight: 1.55, margin: 0 }}>No period logged in {cycleData.daysSinceStart} days. Nora adapts your nutrition to support hormonal balance during this phase.</p>
                </div>
              )}
              {cycleData.state === "gentle_prompt" && (
                <div style={{ backgroundColor: C.bg, borderRadius: 12, padding: "12px 16px", border: `1px solid ${C.border}` }}>
                  <p style={{ fontSize: 13, color: C.muted, margin: 0, lineHeight: 1.55 }}>Haven't logged a period in a while — everything okay? Tap "Period started today" when your next cycle begins.</p>
                </div>
              )}
              {cycleData.state === "no_data" && (
                <p style={{ fontSize: 12, color: C.muted, margin: 0, lineHeight: 1.55 }}>Log your period to track your cycle, see your current phase and get personalised nutrition guidance.</p>
              )}
            </>
          );
        })()}

        {/* Wearables placeholder */}
        <div style={{ marginTop: 14, padding: "12px 14px", backgroundColor: C.bg, borderRadius: 10, border: `1px dashed ${C.border}`, opacity: 0.6 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: C.muted, margin: "0 0 3px" }}>Wearables coming soon</p>
          <p style={{ fontSize: 11, color: C.muted, margin: 0, lineHeight: 1.5 }}>Oura · WHOOP · Apple Watch · Heart rate · HRV</p>
        </div>
      </div>

      {/* ── Edit profile ──────────────────────────────────────────── */}
      <div style={{ ...card }}>
        <SectionHeader title="Edit Profile" sub="Update your details to improve Nora's advice" open={open.edit} onToggle={() => tog("edit")} accent/>
        <Collapsible open={open.edit}>
          <div style={{ padding: "4px 18px 20px", display: "flex", flexDirection: "column", gap: 18 }}>

            {/* Name & Age */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Field label="Name">
                <input value={f.name || ""} onChange={e => set("name", e.target.value)} style={inputStyle}/>
              </Field>
              <Field label="Age">
                <input type="number" value={f.age || ""} onChange={e => set("age", e.target.value)} style={inputStyle} min={10} max={120}/>
              </Field>
            </div>

            {/* Sex */}
            <Field label="Sex">
              <div style={{ display: "flex", gap: 8 }}>
                {["male", "female"].map(s => (
                  <button key={s} onClick={() => set("sex", s)} style={{ flex: 1, padding: "10px", border: `1.5px solid ${f.sex === s ? C.green : C.border}`, borderRadius: 10, backgroundColor: f.sex === s ? C.green : "transparent", color: f.sex === s ? C.bg : C.muted, fontSize: 13, cursor: "pointer", fontFamily: sans, fontWeight: f.sex === s ? 600 : 400, textTransform: "capitalize" }}>
                    {s}
                  </button>
                ))}
              </div>
            </Field>

            {/* Height */}
            <Field label="Height">
              <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                {["cm", "ft"].map(u => (
                  <button key={u} onClick={() => setHeightUnit(u)} style={{ padding: "5px 14px", borderRadius: 8, border: `1px solid ${heightUnit === u ? C.green : C.border}`, backgroundColor: heightUnit === u ? C.greenLight : "transparent", color: heightUnit === u ? C.green : C.muted, fontSize: 12, cursor: "pointer", fontFamily: sans }}>
                    {u}
                  </button>
                ))}
              </div>
              {heightUnit === "cm"
                ? <input type="number" value={f.heightCm || ""} onChange={e => set("heightCm", e.target.value)} style={inputStyle} placeholder="e.g. 170"/>
                : <div style={{ display: "flex", gap: 8 }}>
                    <input type="number" value={f.heightFt || ""} onChange={e => set("heightFt", e.target.value)} style={{ ...inputStyle, flex: 1 }} placeholder="ft"/>
                    <input type="number" value={f.heightIn || ""} onChange={e => set("heightIn", e.target.value)} style={{ ...inputStyle, flex: 1 }} placeholder="in"/>
                  </div>
              }
            </Field>

            {/* Weight */}
            <Field label="Weight">
              <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                {["kg", "lbs"].map(u => (
                  <button key={u} onClick={() => setWeightUnit(u)} style={{ padding: "5px 14px", borderRadius: 8, border: `1px solid ${weightUnit === u ? C.green : C.border}`, backgroundColor: weightUnit === u ? C.greenLight : "transparent", color: weightUnit === u ? C.green : C.muted, fontSize: 12, cursor: "pointer", fontFamily: sans }}>
                    {u}
                  </button>
                ))}
              </div>
              {weightUnit === "kg"
                ? <input type="number" value={f.weightKg || ""} onChange={e => set("weightKg", e.target.value)} style={inputStyle} placeholder="e.g. 65"/>
                : <input type="number" value={f.weightLbs || ""} onChange={e => set("weightLbs", e.target.value)} style={inputStyle} placeholder="e.g. 143"/>
              }
            </Field>

            {/* Goals */}
            <Field label="Goals">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                {GOAL_OPTIONS.map(g => {
                  const selected = (f.goals || []).includes(g);
                  return (
                    <button key={g} onClick={() => toggleGoal(g)} style={{ padding: "7px 12px", borderRadius: 20, border: `1.5px solid ${selected ? C.green : C.border}`, backgroundColor: selected ? C.green : "transparent", color: selected ? C.bg : C.muted, fontSize: 12, cursor: "pointer", fontFamily: sans, fontWeight: selected ? 600 : 400 }}>
                      {g}
                    </button>
                  );
                })}
              </div>
            </Field>

            {/* Activity */}
            <Field label="Activity Level">
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {ACTIVITY_OPTIONS.map(a => (
                  <button key={a.id} onClick={() => set("activity", a.id)} style={{ padding: "10px 14px", border: `1.5px solid ${f.activity === a.id ? C.green : C.border}`, borderRadius: 10, backgroundColor: f.activity === a.id ? C.greenLight : "transparent", cursor: "pointer", textAlign: "left", fontFamily: sans, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, color: f.activity === a.id ? C.green : C.text, fontWeight: f.activity === a.id ? 600 : 400 }}>{a.id}</span>
                    <span style={{ fontSize: 11, color: C.muted }}>{a.desc}</span>
                  </button>
                ))}
              </div>
            </Field>

            {/* Dietary preferences */}
            <Field label="Dietary preferences">
              <input value={f.preferences || ""} onChange={e => set("preferences", e.target.value)} style={inputStyle} placeholder="e.g. vegetarian, no gluten, nut allergy…"/>
            </Field>

            {/* Language */}
            <Field label="Language" note="AI chat, meal plans and recommendations adapt to your language">
              <input value={f.language || ""} onChange={e => set("language", e.target.value)} style={inputStyle} placeholder="English, Română, Español, 中文, Français…"/>
              {lang.toLowerCase() !== "english" && lang.length > 0 && (
                <p style={{ fontSize: 11, color: C.sage, margin: "6px 0 0", fontWeight: 500 }}>
                  ✓ AI content will respond in {lang}. Navigation labels remain in English.
                </p>
              )}
            </Field>

            {/* Save */}
            <button onClick={saveChanges} style={{ width: "100%", padding: "14px", backgroundColor: saved ? C.sage : C.green, color: C.bg, border: "none", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: sans, transition: "background-color 0.3s", letterSpacing: "0.02em" }}>
              {saved ? "✓ Changes saved" : "Save changes"}
            </button>
            <p style={{ fontSize: 11, color: C.muted, textAlign: "center", margin: "-8px 0 0" }}>
              Targets will update next time you regenerate a meal plan.
            </p>
          </div>
        </Collapsible>
      </div>

      {/* ── Saved Items ──────────────────────────────────────────── */}
      <div style={{ ...card }}>
        <SectionHeader title="Saved Items" sub={plans.length > 0 ? `${plans.length} item${plans.length !== 1 ? "s" : ""} from the Eat tab` : "Save meals, plans & more from the Eat tab"} open={open.plans} onToggle={() => tog("plans")} accent/>
        <Collapsible open={open.plans}>
          <div style={{ padding: "0 18px 18px" }}>
            {plans.length === 0 ? (
              <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>Nothing saved yet. Generate meal plans, smoothies, shots or desserts in the Eat tab and tap Save.</p>
            ) : (
              (() => {
                const TYPE_LABELS = { day_plan: "Day Plans", meal: "Meals", smoothie: "Smoothies", shot: "Shots", dessert: "Desserts" };
                const byType = plans.reduce((acc, item) => {
                  const k = item.type || "day_plan"; if (!acc[k]) acc[k] = []; acc[k].push(item); return acc;
                }, {});
                return (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {Object.entries(byType).map(([type, items]) => (
                      <div key={type}>
                        <p style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" }}>{TYPE_LABELS[type] || type}</p>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {items.map(item => {
                            const meal = item.data || {};
                            const isExpanded = favRecipe === item.id;
                            if (type === "meal") {
                              return (
                                <div key={item.id} style={{ backgroundColor: C.bg, borderRadius: 12, border: `1px solid ${C.border}`, overflow: "hidden" }}>
                                  <div style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                                    <HeartIcon size={16} color="#C8847A" filled/>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <p style={{ fontFamily: serif, fontSize: 14, fontWeight: 600, color: C.text, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.label}</p>
                                      <p style={{ fontSize: 11, color: C.muted, margin: "1px 0 0" }}>~{meal.calories || 0} kcal · ~{meal.protein_g || 0}g protein</p>
                                    </div>
                                    <button onClick={() => setFavRecipe(isExpanded ? null : item.id)} style={{ fontSize: 11, color: C.gold, background: "none", border: `1px solid ${C.gold}`, borderRadius: 7, padding: "5px 10px", cursor: "pointer", flexShrink: 0, fontFamily: sans }}>
                                      {isExpanded ? "Close" : "Recipe"}
                                    </button>
                                    <button onClick={() => { const updated = plans.filter(p => p.id !== item.id); setPlans(updated); try { localStorage.setItem("nora_saved_items", JSON.stringify(updated)); } catch {} }} style={{ fontSize: 17, color: C.muted, background: "none", border: "none", cursor: "pointer", padding: "0 2px", opacity: 0.5, lineHeight: 1, flexShrink: 0 }}>×</button>
                                  </div>
                                  {isExpanded && (
                                    <div style={{ borderTop: `1px solid ${C.border}`, padding: "14px 14px 16px", backgroundColor: "#fafaf7" }}>
                                      {meal.image && (
                                        <div style={{ height: 160, borderRadius: 9, overflow: "hidden", marginBottom: 14 }}>
                                          <img src={meal.image} alt={meal.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy"/>
                                        </div>
                                      )}
                                      {(meal.ingredients || []).length > 0 && (
                                        <div style={{ marginBottom: 14 }}>
                                          <p style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" }}>Ingredients</p>
                                          {(meal.ingredients || []).map((ing, i) => {
                                            const name = typeof ing === "string" ? ing : ing.item;
                                            const amt  = typeof ing === "string" ? "" : ing.amount;
                                            const ck   = !!(favIngChk[`${item.id}_${i}`]);
                                            return (
                                              <div key={i} onClick={() => setFavIngChk(p => ({ ...p, [`${item.id}_${i}`]: !p[`${item.id}_${i}`] }))} style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 0", cursor: "pointer", borderBottom: i < meal.ingredients.length - 1 ? `1px solid ${C.border}` : "none", opacity: ck ? 0.45 : 1 }}>
                                                <div style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${ck ? C.green : C.border}`, backgroundColor: ck ? C.green : "transparent", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                  {ck && <CheckIcon size={9} color={C.bg}/>}
                                                </div>
                                                <span style={{ fontSize: 13, color: C.text, flex: 1, textDecoration: ck ? "line-through" : "none" }}>{name}</span>
                                                {amt && <span style={{ fontSize: 12, color: C.muted, flexShrink: 0 }}>{amt}</span>}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}
                                      {(meal.steps || []).length > 0 && (
                                        <div>
                                          <p style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 10px" }}>Instructions</p>
                                          {meal.steps.map((step, i) => (
                                            <div key={i} style={{ display: "flex", gap: 12, marginBottom: 10 }}>
                                              <div style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, backgroundColor: C.green, color: C.bg, fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{i + 1}</div>
                                              <p style={{ fontSize: 13, color: C.text, lineHeight: 1.6, margin: 0, paddingTop: 2 }}>{step}</p>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            }
                            return (
                              <div key={item.id} style={{ backgroundColor: C.bg, borderRadius: 10, padding: "12px 14px", border: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 10 }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <p style={{ fontSize: 13, fontWeight: 600, color: C.text, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {item.label || (item.plan ? `Plan — ${item.date}` : item.date)}
                                  </p>
                                  <p style={{ fontSize: 11, color: C.muted, margin: "1px 0 0" }}>{item.date}</p>
                                </div>
                                <button onClick={() => deletePlan(item.id)} style={{ fontSize: 18, color: C.muted, background: "none", border: "none", cursor: "pointer", padding: "0 2px", lineHeight: 1, opacity: 0.5, flexShrink: 0 }}>×</button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()
            )}
          </div>
        </Collapsible>
      </div>

      {/* ── About Nora ────────────────────────────────────────────── */}
      <div style={{ ...card }}>
        <SectionHeader title="About Nora" sub="Powered by Claude AI" open={open.about} onToggle={() => tog("about")} accent/>
        <Collapsible open={open.about}>
          <div style={{ padding: "0 18px 18px" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
              <NoraAvatar size={36}/>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: C.text, margin: 0 }}>Nora</p>
                <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>AI Nutrition Companion</p>
              </div>
            </div>
            <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.75, margin: "0 0 10px" }}>
              Nora is powered by Claude, Anthropic's AI. She analyses your nutrition data, provides personalised daily targets, and offers warm, evidence-based guidance to help you build healthy habits.
            </p>
            <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.65, margin: 0 }}>
              All advice is for informational purposes only. Consult a qualified healthcare professional for medical concerns.
            </p>
          </div>
        </Collapsible>
      </div>

      {/* ── Restart onboarding ────────────────────────────────────── */}
      <button
        onClick={resetProfile}
        style={{ width: "100%", padding: "13px", backgroundColor: "transparent", border: `1px solid ${C.gold}`, borderRadius: 12, fontSize: 13, color: C.gold, cursor: "pointer", fontFamily: sans }}
      >
        Restart onboarding
      </button>
      <p style={{ fontSize: 11, color: C.muted, textAlign: "center", margin: "-6px 0 0", lineHeight: 1.5 }}>
        This will clear all your data and targets.
      </p>
    </div>
  );
}

function Field({ label, note, children }) {
  return (
    <div>
      <p style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 7px" }}>{label}</p>
      {note && <p style={{ fontSize: 11, color: C.muted, margin: "-3px 0 7px", lineHeight: 1.5 }}>{note}</p>}
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%",
  backgroundColor: C.bg,
  border: `1px solid ${C.border}`,
  borderRadius: 10,
  padding: "11px 14px",
  fontSize: 14,
  color: C.text,
  outline: "none",
  fontFamily: sans,
  boxSizing: "border-box",
};
