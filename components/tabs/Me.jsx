import { useState, useEffect } from "react";
import { C, card, serif, sans, inp, localDateStr } from "../noraTokens";
import { NoraAvatar, MoonIcon } from "../NoraIcons";
import { SectionHeader, Collapsible } from "../NoraUI";
import AtmosphereBackground from "../AtmosphereBackground";
import { LANGUAGES, useLanguage } from "../../lib/i18n/LanguageContext";

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

const FASTING_PRESETS = [
  { label: "16:8",  start: "12:00", end: "20:00" },
  { label: "14:10", start: "11:00", end: "21:00" },
  { label: "12:12", start: "09:00", end: "21:00" },
];

const fmtDuration = (ms) => {
  const totalMin = Math.max(0, Math.round(ms / 60000));
  const d = Math.floor(totalMin / 1440);
  const h = Math.floor((totalMin % 1440) / 60);
  const m = totalMin % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

const fmtDT = (iso) => new Date(iso).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

const fmtDate = (ymd) => { const [y,m,d] = ymd.split("-").map(Number); return new Date(y,m-1,d).toLocaleDateString([], { month: "short", day: "numeric" }); };

const daysInclusive = (startYmd, endYmd) => {
  const [sy,sm,sd] = startYmd.split("-").map(Number);
  const [ey,em,ed] = endYmd.split("-").map(Number);
  return Math.round((new Date(ey,em-1,ed) - new Date(sy,sm-1,sd)) / 86400000) + 1;
};

// label is a translation key suffix (me.bio.context.<id>) resolved at render time, since
// this list is module-level (outside the component) and can't call the t() hook itself.
const BIO_CONTEXTS = [
  { id: "cycle",         label: "cycle"         },
  { id: "pregnancy",     label: "pregnancy"     },
  { id: "perimenopause", label: "perimenopause" },
  { id: "menopause",     label: "menopause"     },
  { id: "none",          label: "none"          },
];

export default function Me({ profile, saveProfile, targets, resetProfile, signOut, notificationsEnabled, saveNotifications, deleteAccount, fastingEnabled, fastingStart, fastingEnd, saveFastingWindow, fastingMode, fastingExtendedStartAt, fastingExtendedHours, saveExtendedFast, stopExtendedFast, periodLogs, cyclePhase, logPeriodStart, logPeriodEnd, deletePeriodLog, ouraConnected, connectOura, disconnectOura }) {
  const { t, setLanguage } = useLanguage();
  const [form,     setForm]     = useState({ ...profile });
  const [saved,    setSaved]    = useState(false);
  const [fastingOtherOpen, setFastingOtherOpen] = useState(false);
  const [fastingDays,      setFastingDays]      = useState(0);
  const [fastingHours,     setFastingHours]     = useState(36);
  const [fastingStartAt,   setFastingStartAt]   = useState(() => {
    const d = new Date(); d.setSeconds(0,0);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0,16);
  });
  const [fastingAckOpen,   setFastingAckOpen]   = useState(false);
  const [fastingNowTick,   setFastingNowTick]   = useState(() => Date.now());
  const [periodStartDraft, setPeriodStartDraft] = useState(() => localDateStr());
  const [periodEndOpen,    setPeriodEndOpen]    = useState(false);
  const [periodEndDraft,   setPeriodEndDraft]   = useState(() => localDateStr());

  useEffect(() => {
    if (fastingMode !== "extended") return;
    const id = setInterval(() => setFastingNowTick(Date.now()), 60000);
    return () => clearInterval(id);
  }, [fastingMode]);
  const [open,     setOpen]     = useState({ edit: false, about: false });
  const [heightUnit, setHeightUnit] = useState(profile?.heightUnit || "cm");
  const [weightUnit, setWeightUnit] = useState(profile?.weightUnit || "kg");
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
      const sl = localStorage.getItem("nora_sleep");
      if (sl) { const ps = JSON.parse(sl); if (ps.date === localDateStr()) { setSleepHours(ps.hours); setSleepQuality(ps.quality); setSleepSaved(true); } }
    } catch {}
  }, []);

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }));

  // Language applies immediately (global context + Supabase), independent of the shared
  // "Save changes" button below — a UI-affecting setting shouldn't need a second confirming
  // step, and staging it silently in form state (as every other field does) was exactly the
  // bug: the pill looked "selected" right away, but nothing actually changed until Save was
  // pressed. Saves against the last-saved profile, not the in-progress form draft, so it never
  // accidentally persists other unrelated pending edits.
  const selectLanguage = (code) => {
    set("language", code);
    setLanguage(code);
    saveProfile({ ...profile, language: code });
  };

  const saveSleep = () => {
    setSleepSaved(true);
    try { localStorage.setItem("nora_sleep", JSON.stringify({ date: localDateStr(), hours: sleepHours, quality: sleepQuality })); } catch {}
  };

  const toggleGoal = g => {
    const goals = form.goals || [];
    set("goals", goals.includes(g) ? goals.filter(x => x !== g) : [...goals, g]);
  };

  const saveChanges = () => {
    const updated = { ...form, heightUnit, weightUnit, language: activeLanguage };
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

  const confirmDelete = async () => {
    setDeleting(true);
    setDeleteError("");
    const result = await deleteAccount();
    if(!result.ok){
      setDeleting(false);
      setDeleteError(result.error || t("common.error.generic"));
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
  const activeLanguage = LANGUAGES.some(l => l.code === f.language) ? f.language : "en";

  return (
    <div style={{ padding: "24px 20px 100px", display: "flex", flexDirection: "column", gap: 14 }}>
      <AtmosphereBackground/>

      {/* ── Header ───────────────────────────────────────── */}
      <div style={{ background:`linear-gradient(160deg,${C.greenDark} 0%,${C.green} 100%)`, padding:"20px 20px 18px", margin:"-24px -20px 18px", position:"relative", overflow:"hidden" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, flex:1 }}>
          <div style={{ flex:1 }}>
            <h2 style={{ fontFamily:serif, fontSize:21, color:"#FDFAF5", fontWeight:700, margin:0, lineHeight:1.2, letterSpacing:"-0.01em" }}>{t("nav.me")}</h2>
            <p style={{ fontSize:11, color:"rgba(253,250,245,0.55)", margin:0, fontFamily:sans }}>{t("me.header.subtitle")}</p>
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
            <p style={{ fontSize: 12, color: C.muted, margin: "2px 0 6px" }}>{profile?.activity ? t(`me.activityLevel.${profile.activity}`, profile.activity) : ""}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {(profile?.goals || []).slice(0, 3).map(g => (
                <span key={g} style={{ fontSize: 11, backgroundColor: C.greenLight, color: C.green, padding: "3px 8px", borderRadius: 20, border: `1px solid ${C.border}` }}>{t(`me.goal.${g}`, g)}</span>
              ))}
              {(profile?.goals || []).length > 3 && (
                <span style={{ fontSize: 11, color: C.muted }}>+{(profile?.goals || []).length - 3} {t("me.goals.more")}</span>
              )}
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[
            profile?.age    && [t("me.stats.age"),    `${profile.age}y`],
            profile?.sex    && [t("me.stats.sex"),    t(`onboarding.sex.${profile.sex}`, profile.sex)],
            profile?.heightCm && [t("me.stats.height"), `${profile.heightCm} cm`],
            profile?.weightKg && [t("me.stats.weight"), `${profile.weightKg} kg`],
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
          <p style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 10px" }}>{t("me.targets.title")}</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {[[t("me.targets.energy"), `${targets.calories} kcal`], [t("me.targets.protein"), `${targets.protein_g}g`], [t("me.targets.carbs"), `${targets.carbs_g}g`], [t("me.targets.fat"), `${targets.fat_g}g`], [t("me.targets.fibre"), `${targets.fiber_g}g`], [t("me.targets.water"), `${Math.round(targets.water_ml / 100) / 10}L`]].map(([l, v]) => (
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
            <p style={{ fontSize: 11, color: C.muted, margin: "2px 0 0" }}>{t("me.stats.supplementsTaken")}</p>
          </div>
        </div>
      )}

      {/* ── Health Data ──────────────────────────────────────────── */}
      <div style={{ ...card, padding: "16px 18px" }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 14px" }}>{t("me.health.title")}</p>

        {/* Sleep */}
        {!sleepSaved ? (
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 12px" }}>{t("me.sleep.title")}</p>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <input type="number" step="0.5" min="0" max="14" style={{ ...inp, flex: 1 }} placeholder={t("me.sleep.hoursPlaceholder")} value={sleepHours} onChange={e => setSleepHours(e.target.value)}/>
              <div style={{ display: "flex", gap: 4, flex: 2 }}>
                {["poor", "ok", "good", "great"].map(q => (
                  <button key={q} onClick={() => setSleepQuality(q)} style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: `1px solid ${sleepQuality === q ? C.green : C.border}`, backgroundColor: sleepQuality === q ? C.green : C.card, color: sleepQuality === q ? C.bg : C.muted, fontSize: 11, fontWeight: sleepQuality === q ? 600 : 400, cursor: "pointer", textTransform: "capitalize" }}>{t(`me.sleepQuality.${q}`, q)}</button>
                ))}
              </div>
            </div>
            <button onClick={saveSleep} disabled={!sleepHours} style={{ width: "100%", padding: "11px", backgroundColor: sleepHours ? C.green : "#C8D5D1", color: C.bg, border: "none", borderRadius: 9, fontSize: 13, fontWeight: 500, cursor: sleepHours ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <MoonIcon size={13} color={sleepHours ? C.bg : "rgba(255,255,255,0.5)"}/>{t("me.sleep.save")}
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", backgroundColor: C.bg, borderRadius: 10, border: `1px solid ${C.border}` }}>
            <MoonIcon size={14} color={C.slate}/>
            <span style={{ fontSize: 13, color: C.text, flex: 1 }}>{t("me.sleep.summaryLabel")} <strong>{sleepHours}h</strong> · {t(`me.sleepQuality.${sleepQuality}`, sleepQuality)}</span>
            <button onClick={() => setSleepSaved(false)} style={{ fontSize: 11, color: C.muted, background: "none", border: "none", cursor: "pointer" }}>{t("common.edit")}</button>
          </div>
        )}

        {/* Biological personalisation — opt-in, females only */}
        {profile?.sex === "female" && (
          <>
            <div style={{ height: 1, backgroundColor: C.border, margin: "14px 0" }}/>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: profile?.biologicalTrackingEnabled ? 14 : 0 }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em", margin: 0 }}>{t("me.bio.title")}</p>
                <p style={{ fontSize: 11, color: C.muted, margin: "3px 0 0", lineHeight: 1.5 }}>{t("me.bio.femaleDesc")}</p>
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
                      {t(`me.bio.context.${label}`)}
                    </button>
                  ))}
                </div>

                {profile?.biologicalContext === "cycle" && (() => {
                  const logs = (periodLogs || []).slice().sort((a, b) => b.start_date.localeCompare(a.start_date));
                  const ongoing = logs[0] && !logs[0].end_date ? logs[0] : null;
                  const history = logs.slice(0, 6);
                  return (
                    <div style={{ padding: "14px", backgroundColor: C.bg, borderRadius: 10, border: `1px solid ${C.border}` }}>
                      <label style={{ fontSize: 11, color: C.muted, fontWeight: 500, display: "block", marginBottom: 6 }}>
                        {ongoing ? t("me.bio.period.current") : t("me.bio.period.logStart")}
                      </label>

                      {ongoing ? (
                        <div>
                          <p style={{ fontSize: 13, color: C.text, margin: "0 0 10px" }}>{t("me.bio.period.started")} {fmtDate(ongoing.start_date)}</p>
                          {periodEndOpen ? (
                            <div style={{ display: "flex", gap: 8 }}>
                              <input type="date" style={{ ...inp, colorScheme: "light", flex: 1 }} value={periodEndDraft} min={ongoing.start_date} max={localDateStr()} onChange={e => setPeriodEndDraft(e.target.value)}/>
                              <button onClick={() => { logPeriodEnd(ongoing.id, periodEndDraft); setPeriodEndOpen(false); }} style={{ padding: "0 16px", backgroundColor: C.green, color: C.bg, border: "none", borderRadius: 9, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>{t("common.save")}</button>
                            </div>
                          ) : (
                            <button onClick={() => { setPeriodEndDraft(localDateStr()); setPeriodEndOpen(true); }} style={{ width: "100%", padding: "10px", backgroundColor: "transparent", color: C.green, border: `1px solid ${C.green}`, borderRadius: 9, fontSize: 13, cursor: "pointer" }}>
                              {t("me.bio.period.addEndDate")}
                            </button>
                          )}
                        </div>
                      ) : (
                        <div style={{ display: "flex", gap: 8 }}>
                          <input type="date" style={{ ...inp, colorScheme: "light", flex: 1 }} value={periodStartDraft} max={localDateStr()} onChange={e => setPeriodStartDraft(e.target.value)}/>
                          <button onClick={() => logPeriodStart(periodStartDraft)} style={{ padding: "0 16px", backgroundColor: C.green, color: C.bg, border: "none", borderRadius: 9, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>{t("me.bio.period.logStartBtn")}</button>
                        </div>
                      )}

                      {history.length > 0 && (
                        <div style={{ marginTop: 14 }}>
                          <label style={{ fontSize: 10, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 8 }}>{t("me.bio.period.history")}</label>
                          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            {history.map(l => (
                              <div key={l.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                                <span style={{ fontSize: 12, color: C.text }}>
                                  {fmtDate(l.start_date)} – {l.end_date ? fmtDate(l.end_date) : <em style={{ color: C.muted }}>{t("me.bio.period.estimated")}</em>}
                                  <span style={{ color: C.muted }}> · {l.end_date ? `${daysInclusive(l.start_date, l.end_date)}${t("me.bio.period.dayAbbrev")}` : `~5${t("me.bio.period.dayAbbrev")}`}</span>
                                </span>
                                <button onClick={() => deletePeriodLog(l.id)} style={{ background: "none", border: "none", color: C.muted, fontSize: 15, cursor: "pointer", padding: 0, lineHeight: 1 }}>×</button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div style={{ marginTop: 14 }}>
                        <label style={{ fontSize: 11, color: C.muted, fontWeight: 500, display: "block", marginBottom: 6 }}>
                          {t("me.bio.cycleLength.label")} {cyclePhase && !cyclePhase.cycleLengthEstimated ? t("me.bio.cycleLength.refined") : t("me.bio.cycleLength.default")}
                        </label>
                        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                          {[21, 24, 28, 30, 32, 35].map(n => (
                            <button key={n} onClick={() => saveProfile({ ...profile, cycleLength: n })} style={{ padding: "6px 10px", borderRadius: 7, border: `1px solid ${profile?.cycleLength === n ? C.green : C.border}`, backgroundColor: profile?.cycleLength === n ? C.green : C.card, color: profile?.cycleLength === n ? C.bg : C.text, fontSize: 12, cursor: "pointer", fontWeight: profile?.cycleLength === n ? 600 : 400 }}>
                              {n}d
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </>
        )}

        {/* Biological personalisation — opt-in, males only, symmetric to the female path above */}
        {profile?.sex === "male" && (
          <>
            <div style={{ height: 1, backgroundColor: C.border, margin: "14px 0" }}/>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em", margin: 0 }}>{t("me.bio.title")}</p>
                <p style={{ fontSize: 11, color: C.muted, margin: "3px 0 0", lineHeight: 1.5 }}>{t("me.bio.maleDesc")}</p>
              </div>
              <button onClick={() => saveProfile({ ...profile, biologicalTrackingEnabled: !profile.biologicalTrackingEnabled })} style={{ width: 44, height: 24, borderRadius: 12, backgroundColor: profile?.biologicalTrackingEnabled ? C.green : C.border, border: "none", cursor: "pointer", position: "relative", flexShrink: 0, marginLeft: 12 }}>
                <div style={{ width: 18, height: 18, borderRadius: "50%", backgroundColor: "white", position: "absolute", top: 3, left: profile?.biologicalTrackingEnabled ? 23 : 3, transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }}/>
              </button>
            </div>
          </>
        )}

        {/* Fasting window — opt-in, read by the eating window band in My Day */}
        <div style={{ height: 1, backgroundColor: C.border, margin: "14px 0" }}/>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: fastingEnabled ? 14 : 0 }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em", margin: 0 }}>{t("me.fasting.title")}</p>
            <p style={{ fontSize: 11, color: C.muted, margin: "3px 0 0", lineHeight: 1.5 }}>{t("me.fasting.desc")}</p>
          </div>
          <button onClick={() => saveFastingWindow(!fastingEnabled, fastingStart, fastingEnd)} style={{ width: 44, height: 24, borderRadius: 12, backgroundColor: fastingEnabled ? C.green : C.border, border: "none", cursor: "pointer", position: "relative", flexShrink: 0, marginLeft: 12 }}>
            <div style={{ width: 18, height: 18, borderRadius: "50%", backgroundColor: "white", position: "absolute", top: 3, left: fastingEnabled ? 23 : 3, transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }}/>
          </button>
        </div>

        {fastingEnabled && (() => {
          const totalHours = (Number(fastingDays)||0)*24 + (Number(fastingHours)||0);
          const endAt = fastingExtendedStartAt ? new Date(fastingExtendedStartAt).getTime() + (fastingExtendedHours||0)*3600000 : null;
          const remainingMs = endAt ? endAt - fastingNowTick : null;
          const isOtherActive = fastingMode === "extended" || fastingOtherOpen;

          const startExtended = () => {
            saveExtendedFast(totalHours, new Date(fastingStartAt).toISOString());
            setFastingOtherOpen(false); setFastingAckOpen(false);
          };

          return (
            <div style={{ marginTop: 14 }}>
              <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.6, margin: "0 0 12px" }}>
                {t("me.fasting.intro")}
              </p>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                {FASTING_PRESETS.map(({ label, start, end }) => {
                  const active = fastingMode === "recurring" && fastingStart === start && fastingEnd === end;
                  return (
                    <button key={label} onClick={() => { setFastingOtherOpen(false); saveFastingWindow(true, start, end); }} style={{ padding: "7px 12px", borderRadius: 8, border: `1px solid ${active ? C.green : C.border}`, backgroundColor: active ? C.green : C.card, color: active ? C.bg : C.text, fontSize: 12, fontWeight: active ? 500 : 400, cursor: "pointer" }}>
                      {label}
                    </button>
                  );
                })}
                <button onClick={() => setFastingOtherOpen(true)} style={{ padding: "7px 12px", borderRadius: 8, border: `1px solid ${isOtherActive ? C.green : C.border}`, backgroundColor: isOtherActive ? C.green : C.card, color: isOtherActive ? C.bg : C.text, fontSize: 12, fontWeight: isOtherActive ? 500 : 400, cursor: "pointer" }}>
                  {t("me.fasting.other")}
                </button>
              </div>

              {fastingMode === "recurring" && !fastingOtherOpen && (
                <div style={{ padding: "14px", backgroundColor: C.bg, borderRadius: 10, border: `1px solid ${C.border}`, display: "flex", gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 11, color: C.muted, fontWeight: 500, display: "block", marginBottom: 6 }}>{t("me.fasting.eatingStarts")}</label>
                    <input type="time" style={{ ...inp, colorScheme: "light" }} value={fastingStart} onChange={e => saveFastingWindow(fastingEnabled, e.target.value, fastingEnd)}/>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 11, color: C.muted, fontWeight: 500, display: "block", marginBottom: 6 }}>{t("me.fasting.eatingEnds")}</label>
                    <input type="time" style={{ ...inp, colorScheme: "light" }} value={fastingEnd} onChange={e => saveFastingWindow(fastingEnabled, fastingStart, e.target.value)}/>
                  </div>
                </div>
              )}

              {fastingMode === "extended" && !fastingOtherOpen && (
                <div style={{ padding: "14px", backgroundColor: C.bg, borderRadius: 10, border: `1px solid ${C.border}` }}>
                  <p style={{ fontSize: 13, color: C.text, margin: "0 0 4px", fontWeight: 500 }}>
                    {remainingMs > 0
                      ? <>{t("me.fasting.fasting")} · <strong>{fmtDuration(remainingMs)}</strong> {t("me.fasting.remaining")}</>
                      : t("me.fasting.complete")}
                  </p>
                  <p style={{ fontSize: 11, color: C.muted, margin: "0 0 12px" }}>
                    {t("me.fasting.since")} {fmtDT(fastingExtendedStartAt)} · {t("me.fasting.ends")} {fmtDT(new Date(endAt).toISOString())}
                  </p>
                  {(fastingExtendedHours||0) > 72 && (
                    <p style={{ fontSize: 11, color: C.error, lineHeight: 1.6, margin: "0 0 12px", padding: "10px 12px", backgroundColor: C.errorBg, borderRadius: 8 }}>
                      {t("me.fasting.warning72")}
                    </p>
                  )}
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => setFastingOtherOpen(true)} style={{ flex: 1, padding: "10px", backgroundColor: "transparent", color: C.green, border: `1px solid ${C.green}`, borderRadius: 9, fontSize: 12, cursor: "pointer" }}>{t("me.fasting.adjust")}</button>
                    <button onClick={stopExtendedFast} style={{ flex: 1, padding: "10px", backgroundColor: "transparent", color: C.muted, border: `1px solid ${C.border}`, borderRadius: 9, fontSize: 12, cursor: "pointer" }}>{t("me.fasting.endFast")}</button>
                  </div>
                </div>
              )}

              {fastingOtherOpen && (
                <div style={{ padding: "14px", backgroundColor: C.bg, borderRadius: 10, border: `1px solid ${C.border}` }}>
                  <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 11, color: C.muted, fontWeight: 500, display: "block", marginBottom: 6 }}>{t("me.fasting.days")}</label>
                      <input type="number" min="0" max="14" style={inp} value={fastingDays} onChange={e => { setFastingDays(e.target.value); setFastingAckOpen(false); }}/>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 11, color: C.muted, fontWeight: 500, display: "block", marginBottom: 6 }}>{t("me.fasting.hours")}</label>
                      <input type="number" min="0" max="23" style={inp} value={fastingHours} onChange={e => { setFastingHours(e.target.value); setFastingAckOpen(false); }}/>
                    </div>
                  </div>
                  <label style={{ fontSize: 11, color: C.muted, fontWeight: 500, display: "block", marginBottom: 6 }}>{t("me.fasting.start")}</label>
                  <input type="datetime-local" style={{ ...inp, colorScheme: "light", marginBottom: 12 }} value={fastingStartAt} onChange={e => { setFastingStartAt(e.target.value); setFastingAckOpen(false); }}/>

                  <p style={{ fontSize: 12, color: C.muted, margin: "0 0 12px" }}>{t("me.fasting.total")} <strong>{totalHours}h</strong></p>

                  {totalHours > 24 && !fastingAckOpen && (
                    <button onClick={() => setFastingAckOpen(true)} disabled={totalHours<=0} style={{ width: "100%", padding: "12px", backgroundColor: C.green, color: C.bg, border: "none", borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: "pointer", marginBottom: 8 }}>
                      {t("me.fasting.startFasting")}
                    </button>
                  )}

                  {totalHours > 24 && fastingAckOpen && (
                    <div style={{ padding: "12px 14px", backgroundColor: C.errorBg, borderRadius: 10, marginBottom: 8 }}>
                      <p style={{ fontSize: 12, color: C.error, lineHeight: 1.6, margin: "0 0 10px" }}>
                        {totalHours > 72
                          ? t("me.fasting.warning72")
                          : t("me.fasting.warning24")}
                      </p>
                      <button onClick={startExtended} style={{ width: "100%", padding: "11px", backgroundColor: C.green, color: C.bg, border: "none", borderRadius: 9, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
                        {t("me.fasting.acknowledge")}
                      </button>
                    </div>
                  )}

                  {totalHours <= 24 && (
                    <button onClick={startExtended} disabled={totalHours<=0} style={{ width: "100%", padding: "12px", backgroundColor: totalHours>0?C.green:C.border, color: C.bg, border: "none", borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: totalHours>0?"pointer":"not-allowed", marginBottom: 8 }}>
                      {t("me.fasting.startFasting")}
                    </button>
                  )}

                  <button onClick={() => { setFastingOtherOpen(false); setFastingAckOpen(false); }} style={{ width: "100%", background: "none", border: "none", color: C.muted, fontSize: 12, cursor: "pointer", padding: "4px 0" }}>
                    {t("common.cancel")}
                  </button>
                </div>
              )}
            </div>
          );
        })()}

      </div>

      {/* ── Connected apps ──────────────────────────────────────── */}
      <div style={{ ...card, padding: "16px 18px" }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 12px" }}>{t("me.apps.title")}</p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: 13, color: C.text, margin: 0, fontWeight: 500 }}>Oura Ring</p>
            <p style={{ fontSize: 11, color: C.muted, margin: "2px 0 0" }}>{ouraConnected ? t("me.apps.connected") : t("me.apps.ouraDesc")}</p>
          </div>
          <button
            onClick={ouraConnected ? disconnectOura : connectOura}
            style={{ padding: "7px 14px", borderRadius: 20, border: `1px solid ${ouraConnected ? C.border : C.green}`, backgroundColor: ouraConnected ? "transparent" : C.greenLight, color: ouraConnected ? C.muted : C.green, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: sans, whiteSpace: "nowrap" }}
          >
            {ouraConnected ? t("common.disconnect") : t("common.connect")}
          </button>
        </div>
      </div>

      {/* ── Notifications ───────────────────────────────────────── */}
      <div style={{ ...card, padding: "16px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>{t("me.notifications.title")}</p>
          <p style={{ fontSize: 11, color: C.muted, margin: "3px 0 0", lineHeight: 1.5 }}>{t("me.notifications.desc")}</p>
        </div>
        <button onClick={() => saveNotifications(!notificationsEnabled)} style={{ width: 44, height: 24, borderRadius: 12, backgroundColor: notificationsEnabled ? C.green : C.border, border: "none", cursor: "pointer", position: "relative", flexShrink: 0, marginLeft: 12 }}>
          <div style={{ width: 18, height: 18, borderRadius: "50%", backgroundColor: "white", position: "absolute", top: 3, left: notificationsEnabled ? 23 : 3, transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }}/>
        </button>
      </div>

      {/* ── Edit profile ──────────────────────────────────────────── */}
      <div style={{ ...card }}>
        <SectionHeader title={t("me.editProfile.title")} sub={t("me.editProfile.sub")} open={open.edit} onToggle={() => tog("edit")} accent/>
        <Collapsible open={open.edit}>
          <div style={{ padding: "4px 18px 20px", display: "flex", flexDirection: "column", gap: 18 }}>

            {/* Name & Age */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Field label={t("me.field.name")}>
                <input value={f.name || ""} onChange={e => set("name", e.target.value)} style={inputStyle}/>
              </Field>
              <Field label={t("me.field.age")}>
                <input type="number" value={f.age || ""} onChange={e => set("age", e.target.value)} style={inputStyle} min={10} max={120}/>
              </Field>
            </div>

            {/* Sex — stored value (s) stays English; only the button's displayed label is translated */}
            <Field label={t("me.field.sex")}>
              <div style={{ display: "flex", gap: 8 }}>
                {[{ s: "male", l: t("onboarding.sex.male") }, { s: "female", l: t("onboarding.sex.female") }].map(({ s, l }) => (
                  <button key={s} onClick={() => set("sex", s)} style={{ flex: 1, padding: "10px", border: `1.5px solid ${f.sex === s ? C.green : C.border}`, borderRadius: 10, backgroundColor: f.sex === s ? C.green : "transparent", color: f.sex === s ? C.bg : C.muted, fontSize: 13, cursor: "pointer", fontFamily: sans, fontWeight: f.sex === s ? 600 : 400 }}>
                    {l}
                  </button>
                ))}
              </div>
            </Field>

            {/* Height */}
            <Field label={t("me.field.height")}>
              <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                {["cm", "ft"].map(u => (
                  <button key={u} onClick={() => setHeightUnit(u)} style={{ padding: "5px 14px", borderRadius: 8, border: `1px solid ${heightUnit === u ? C.green : C.border}`, backgroundColor: heightUnit === u ? C.greenLight : "transparent", color: heightUnit === u ? C.green : C.muted, fontSize: 12, cursor: "pointer", fontFamily: sans }}>
                    {u}
                  </button>
                ))}
              </div>
              {heightUnit === "cm"
                ? <input type="number" value={f.heightCm || ""} onChange={e => set("heightCm", e.target.value)} style={inputStyle} placeholder={t("me.field.heightCm.placeholder")}/>
                : <div style={{ display: "flex", gap: 8 }}>
                    <input type="number" value={f.heightFt || ""} onChange={e => set("heightFt", e.target.value)} style={{ ...inputStyle, flex: 1 }} placeholder="ft"/>
                    <input type="number" value={f.heightIn || ""} onChange={e => set("heightIn", e.target.value)} style={{ ...inputStyle, flex: 1 }} placeholder="in"/>
                  </div>
              }
            </Field>

            {/* Weight */}
            <Field label={t("me.field.weight")}>
              <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                {["kg", "lbs"].map(u => (
                  <button key={u} onClick={() => setWeightUnit(u)} style={{ padding: "5px 14px", borderRadius: 8, border: `1px solid ${weightUnit === u ? C.green : C.border}`, backgroundColor: weightUnit === u ? C.greenLight : "transparent", color: weightUnit === u ? C.green : C.muted, fontSize: 12, cursor: "pointer", fontFamily: sans }}>
                    {u}
                  </button>
                ))}
              </div>
              {weightUnit === "kg"
                ? <input type="number" value={f.weightKg || ""} onChange={e => set("weightKg", e.target.value)} style={inputStyle} placeholder={t("me.field.weightKg.placeholder")}/>
                : <input type="number" value={f.weightLbs || ""} onChange={e => set("weightLbs", e.target.value)} style={inputStyle} placeholder={t("me.field.weightLbs.placeholder")}/>
              }
            </Field>

            {/* Goals — stored verbatim in profile.goals, same reasoning as OnboardingFlow's GOAL_OPTIONS */}
            <Field label={t("me.field.goals")}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                {GOAL_OPTIONS.map(g => {
                  const selected = (f.goals || []).includes(g);
                  return (
                    <button key={g} onClick={() => toggleGoal(g)} style={{ padding: "7px 12px", borderRadius: 20, border: `1.5px solid ${selected ? C.green : C.border}`, backgroundColor: selected ? C.green : "transparent", color: selected ? C.bg : C.muted, fontSize: 12, cursor: "pointer", fontFamily: sans, fontWeight: selected ? 600 : 400 }}>
                      {t(`me.goal.${g}`, g)}
                    </button>
                  );
                })}
              </div>
            </Field>

            {/* Activity — a.id stored verbatim in profile.activity; a.desc is pure display text */}
            <Field label={t("me.field.activityLevel")}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {ACTIVITY_OPTIONS.map(a => (
                  <button key={a.id} onClick={() => set("activity", a.id)} style={{ padding: "10px 14px", border: `1.5px solid ${f.activity === a.id ? C.green : C.border}`, borderRadius: 10, backgroundColor: f.activity === a.id ? C.greenLight : "transparent", cursor: "pointer", textAlign: "left", fontFamily: sans, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, color: f.activity === a.id ? C.green : C.text, fontWeight: f.activity === a.id ? 600 : 400 }}>{t(`me.activityLevel.${a.id}`, a.id)}</span>
                    <span style={{ fontSize: 11, color: C.muted }}>{t(`me.activity.${a.id}`)}</span>
                  </button>
                ))}
              </div>
            </Field>

            {/* Dietary preferences */}
            <Field label={t("me.field.preferences")}>
              <input value={f.preferences || ""} onChange={e => set("preferences", e.target.value)} style={inputStyle} placeholder={t("me.field.preferences.placeholder")}/>
            </Field>

            {/* Language */}
            <Field label={t("me.field.language")} note={t("me.field.language.note")}>
              <div style={{ display: "flex", gap: 8 }}>
                {LANGUAGES.map(l => (
                  <button key={l.code} onClick={() => selectLanguage(l.code)} style={{ flex: 1, padding: "10px 14px", border: `1.5px solid ${activeLanguage === l.code ? C.green : C.border}`, borderRadius: 10, backgroundColor: activeLanguage === l.code ? C.greenLight : "transparent", cursor: "pointer", fontFamily: sans, fontSize: 13, fontWeight: activeLanguage === l.code ? 600 : 400, color: activeLanguage === l.code ? C.green : C.text }}>
                    {l.label}
                  </button>
                ))}
              </div>
            </Field>

            {/* Save */}
            <button onClick={saveChanges} style={{ width: "100%", padding: "14px", backgroundColor: saved ? C.sage : C.green, color: C.bg, border: "none", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: sans, transition: "background-color 0.3s", letterSpacing: "0.02em" }}>
              {saved ? `✓ ${t("me.save.saved")}` : t("me.save.button")}
            </button>
            <p style={{ fontSize: 11, color: C.muted, textAlign: "center", margin: "-8px 0 0" }}>
              {t("me.save.note")}
            </p>
          </div>
        </Collapsible>
      </div>

      {/* ── About Nora ────────────────────────────────────────────── */}
      <div style={{ ...card }}>
        <SectionHeader title={t("me.about.title")} sub={t("me.about.sub")} open={open.about} onToggle={() => tog("about")} accent/>
        <Collapsible open={open.about}>
          <div style={{ padding: "0 18px 18px" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
              <NoraAvatar size={36}/>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: C.text, margin: 0 }}>Nora</p>
                <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>{t("me.about.role")}</p>
              </div>
            </div>
            <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.75, margin: "0 0 10px" }}>
              {t("me.about.description")}
            </p>
            <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.65, margin: 0 }}>
              {t("me.about.disclaimer")}
            </p>
          </div>
        </Collapsible>
      </div>

      {/* ── Privacy ────────────────────────────────────────────────── */}
      <a
        href="/privacy"
        target="_blank"
        rel="noopener noreferrer"
        style={{ display: "block", width: "100%", boxSizing: "border-box", padding: "13px", backgroundColor: "transparent", border: `1px solid ${C.border}`, borderRadius: 12, fontSize: 13, color: C.text, cursor: "pointer", fontFamily: sans, textAlign: "center", textDecoration: "none" }}
      >
        {t("me.privacy.link")}
      </a>

      {/* ── Restart onboarding ────────────────────────────────────── */}
      <button
        onClick={resetProfile}
        style={{ width: "100%", padding: "13px", backgroundColor: "transparent", border: `1px solid ${C.green}`, borderRadius: 12, fontSize: 13, color: C.green, cursor: "pointer", fontFamily: sans }}
      >
        {t("me.restart.button")}
      </button>
      <p style={{ fontSize: 11, color: C.muted, textAlign: "center", margin: "-6px 0 0", lineHeight: 1.5 }}>
        {t("me.restart.note")}
      </p>

      {/* ── Logout ─────────────────────────────────────────────────── */}
      <button
        onClick={signOut}
        style={{ width: "100%", padding: "13px", backgroundColor: "transparent", border: "none", borderRadius: 12, fontSize: 13, color: C.muted, cursor: "pointer", fontFamily: sans }}
      >
        {t("common.logout")}
      </button>

      {/* ── Delete account ────────────────────────────────────────── */}
      {!deleteOpen ? (
        <button
          onClick={() => { setDeleteOpen(true); setDeleteError(""); }}
          style={{ width: "100%", padding: "13px", backgroundColor: "transparent", border: "none", borderRadius: 12, fontSize: 12, color: C.error, cursor: "pointer", fontFamily: sans }}
        >
          {t("me.delete.button")}
        </button>
      ) : (
        <div style={{ backgroundColor: C.errorBg, border: `1px solid ${C.error}30`, borderRadius: 12, padding: "16px 18px" }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: C.error, margin: "0 0 6px" }}>{t("me.delete.confirmTitle")}</p>
          <p style={{ fontSize: 12, color: C.text, lineHeight: 1.6, margin: "0 0 14px" }}>
            {t("me.delete.confirmDesc")}
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
              {t("common.cancel")}
            </button>
            <button
              onClick={confirmDelete}
              disabled={deleting}
              style={{ flex: 1, padding: "11px", backgroundColor: C.error, border: "none", borderRadius: 10, fontSize: 12, fontWeight: 600, color: "#FDFAF5", cursor: deleting ? "not-allowed" : "pointer", fontFamily: sans }}
            >
              {deleting ? t("me.delete.deleting") : t("me.delete.confirmYes")}
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
