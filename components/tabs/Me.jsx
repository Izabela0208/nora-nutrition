import { useState, useEffect } from "react";
import { C, card, serif, sans, inp, localDateStr } from "../noraTokens";
import { NoraAvatar, BotanicalBranch, CheckIcon, HeartIcon, MoonIcon } from "../NoraIcons";
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

const BIO_CONTEXTS = [
  { id: "cycle",         label: "Menstruation"  },
  { id: "pregnancy",     label: "Pregnancy"     },
  { id: "perimenopause", label: "Perimenopause" },
  { id: "menopause",     label: "Menopause"     },
  { id: "none",          label: "Not applicable"},
];

export default function Me({ profile, saveProfile, targets, resetProfile, signOut, notificationsEnabled, saveNotifications, deleteAccount }) {
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
  const [deleteOpen,    setDeleteOpen]    = useState(false);
  const [deleting,      setDeleting]      = useState(false);
  const [deleteError,   setDeleteError]   = useState("");

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

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }));

  const saveSleep = () => {
    setSleepSaved(true);
    try { localStorage.setItem("nora_sleep", JSON.stringify({ date: localDateStr(), hours: sleepHours, quality: sleepQuality })); } catch {}
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
    saveProfile(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const deletePlan = id => {
    const updated = plans.filter(p => p.id !== id);
    setPlans(updated);
    try { localStorage.setItem("nora_saved_items", JSON.stringify(updated)); } catch {}
  };

  const confirmDelete = async () => {
    setDeleting(true);
    setDeleteError("");
    const result = await deleteAccount();
    if(!result.ok){
      setDeleting(false);
      setDeleteError(result.error || "Something went wrong. Please try again.");
    }
    // on success, the session ends and the app returns to the auth screen
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

      {/* ── Header ───────────────────────────────────────── */}
      <div style={{ background:`linear-gradient(160deg,${C.greenDark} 0%,${C.green} 100%)`, padding:"20px 20px 18px", margin:"-24px -20px 18px", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:-8, right:-8, opacity:0.12, pointerEvents:"none" }}>
          <BotanicalBranch width={110}/>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:12, flex:1 }}>
          <NoraAvatar size={36}/>
          <div style={{ flex:1 }}>
            <h2 style={{ fontFamily:serif, fontSize:21, color:"#FDFAF5", fontWeight:700, margin:0, lineHeight:1.2, letterSpacing:"-0.01em" }}>Me</h2>
            <p style={{ fontSize:11, color:"rgba(253,250,245,0.55)", margin:0, fontFamily:sans }}>Profile · Goals · Settings</p>
          </div>
        </div>
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

        {/* Biological personalisation — opt-in, females only */}
        {profile?.sex === "female" && (
          <>
            <div style={{ height: 1, backgroundColor: C.border, margin: "14px 0" }}/>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: profile?.biologicalTrackingEnabled ? 14 : 0 }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em", margin: 0 }}>Biological personalisation</p>
                <p style={{ fontSize: 11, color: C.muted, margin: "3px 0 0", lineHeight: 1.5 }}>Optional. Adapts nutrition guidance to your biological context.</p>
              </div>
              <button onClick={() => saveProfile({ ...profile, biologicalTrackingEnabled: !profile.biologicalTrackingEnabled })} style={{ width: 44, height: 24, borderRadius: 12, backgroundColor: profile?.biologicalTrackingEnabled ? C.green : C.border, border: "none", cursor: "pointer", position: "relative", flexShrink: 0, marginLeft: 12 }}>
                <div style={{ width: 18, height: 18, borderRadius: "50%", backgroundColor: "white", position: "absolute", top: 3, left: profile?.biologicalTrackingEnabled ? 23 : 3, transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }}/>
              </button>
            </div>

            {profile?.biologicalTrackingEnabled && (
              <div style={{ marginTop: 14 }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                  {BIO_CONTEXTS.map(({ id, label }) => (
                    <button key={id} onClick={() => saveProfile({ ...profile, biologicalContext: id })} style={{ padding: "7px 12px", borderRadius: 8, border: `1px solid ${profile?.biologicalContext === id ? C.green : C.border}`, backgroundColor: profile?.biologicalContext === id ? C.green : C.card, color: profile?.biologicalContext === id ? C.bg : C.text, fontSize: 12, fontWeight: profile?.biologicalContext === id ? 500 : 400, cursor: "pointer" }}>
                      {label}
                    </button>
                  ))}
                </div>

                {profile?.biologicalContext === "cycle" && (
                  <div style={{ padding: "14px", backgroundColor: C.bg, borderRadius: 10, border: `1px solid ${C.border}` }}>
                    <label style={{ fontSize: 11, color: C.muted, fontWeight: 500, display: "block", marginBottom: 6 }}>First day of last period</label>
                    <input type="date" style={{ ...inp, colorScheme: "light", marginBottom: 12 }} value={profile?.lastPeriodDate || ""} onChange={e => saveProfile({ ...profile, lastPeriodDate: e.target.value })}/>
                    <label style={{ fontSize: 11, color: C.muted, fontWeight: 500, display: "block", marginBottom: 6 }}>Average cycle length</label>
                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                      {[21, 24, 28, 30, 32, 35].map(n => (
                        <button key={n} onClick={() => saveProfile({ ...profile, cycleLength: n })} style={{ padding: "6px 10px", borderRadius: 7, border: `1px solid ${profile?.cycleLength === n ? C.green : C.border}`, backgroundColor: profile?.cycleLength === n ? C.green : C.card, color: profile?.cycleLength === n ? C.bg : C.text, fontSize: 12, cursor: "pointer", fontWeight: profile?.cycleLength === n ? 600 : 400 }}>
                          {n}d
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Wearables placeholder */}
        <div style={{ marginTop: 14, padding: "12px 14px", backgroundColor: C.bg, borderRadius: 10, border: `1px dashed ${C.border}`, opacity: 0.6 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: C.muted, margin: "0 0 3px" }}>Wearables coming soon</p>
          <p style={{ fontSize: 11, color: C.muted, margin: 0, lineHeight: 1.5 }}>Oura · WHOOP · Apple Watch · Heart rate · HRV</p>
        </div>
      </div>

      {/* ── Notifications ───────────────────────────────────────── */}
      <div style={{ ...card, padding: "16px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>Notifications</p>
          <p style={{ fontSize: 11, color: C.muted, margin: "3px 0 0", lineHeight: 1.5 }}>Preference saved for when reminders launch.</p>
        </div>
        <button onClick={() => saveNotifications(!notificationsEnabled)} style={{ width: 44, height: 24, borderRadius: 12, backgroundColor: notificationsEnabled ? C.green : C.border, border: "none", cursor: "pointer", position: "relative", flexShrink: 0, marginLeft: 12 }}>
          <div style={{ width: 18, height: 18, borderRadius: "50%", backgroundColor: "white", position: "absolute", top: 3, left: notificationsEnabled ? 23 : 3, transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }}/>
        </button>
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
                                    <button onClick={() => setFavRecipe(isExpanded ? null : item.id)} style={{ fontSize: 11, color: C.green, background: "none", border: `1px solid ${C.green}`, borderRadius: 7, padding: "5px 10px", cursor: "pointer", flexShrink: 0, fontFamily: sans }}>
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
        style={{ width: "100%", padding: "13px", backgroundColor: "transparent", border: `1px solid ${C.green}`, borderRadius: 12, fontSize: 13, color: C.green, cursor: "pointer", fontFamily: sans }}
      >
        Restart onboarding
      </button>
      <p style={{ fontSize: 11, color: C.muted, textAlign: "center", margin: "-6px 0 0", lineHeight: 1.5 }}>
        This will clear all your data and targets.
      </p>

      {/* ── Logout ─────────────────────────────────────────────────── */}
      <button
        onClick={signOut}
        style={{ width: "100%", padding: "13px", backgroundColor: "transparent", border: "none", borderRadius: 12, fontSize: 13, color: C.muted, cursor: "pointer", fontFamily: sans }}
      >
        Logout
      </button>

      {/* ── Delete account ────────────────────────────────────────── */}
      {!deleteOpen ? (
        <button
          onClick={() => { setDeleteOpen(true); setDeleteError(""); }}
          style={{ width: "100%", padding: "13px", backgroundColor: "transparent", border: "none", borderRadius: 12, fontSize: 12, color: C.error, cursor: "pointer", fontFamily: sans }}
        >
          Delete account
        </button>
      ) : (
        <div style={{ backgroundColor: C.errorBg, border: `1px solid ${C.error}30`, borderRadius: 12, padding: "16px 18px" }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: C.error, margin: "0 0 6px" }}>Delete your account permanently?</p>
          <p style={{ fontSize: 12, color: C.text, lineHeight: 1.6, margin: "0 0 14px" }}>
            This removes your account and everything tied to it — profile, meals, challenges, settings. This cannot be undone.
          </p>
          {deleteError && (
            <p style={{ fontSize: 12, color: C.error, margin: "0 0 12px" }}>{deleteError}</p>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setDeleteOpen(false)}
              disabled={deleting}
              style={{ flex: 1, padding: "11px", backgroundColor: "transparent", border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 12, color: C.muted, cursor: deleting ? "not-allowed" : "pointer", fontFamily: sans }}
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              disabled={deleting}
              style={{ flex: 1, padding: "11px", backgroundColor: C.error, border: "none", borderRadius: 10, fontSize: 12, fontWeight: 600, color: "#FDFAF5", cursor: deleting ? "not-allowed" : "pointer", fontFamily: sans }}
            >
              {deleting ? "Deleting…" : "Yes, delete permanently"}
            </button>
          </div>
        </div>
      )}
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
