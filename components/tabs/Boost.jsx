import { useState, useEffect } from "react";
import { C, card, serif, sans, localDateStr } from "../noraTokens";
import { PlusIcon, CheckIcon, ChevronIcon } from "../NoraIcons";
import AtmosphereBackground from "../AtmosphereBackground";
import { useLanguage, LANGUAGE_NAMES } from "../../lib/i18n/LanguageContext";

const SUPP_KEY  = "nora_supps_list";
const TAKEN_KEY = "nora_supps_taken";
const RECS_KEY  = "nora_boost_recs";

const PM_PREFIX = "nora_pm_";
const PM_TTL    = 86400000; // 24 h

async function fetchPubMedCached(q, n = 5, fallbacks = []) {
  const key = PM_PREFIX + q.replace(/\W+/g, "_").slice(0, 32);
  try {
    const raw = localStorage.getItem(key);
    if (raw) { const { ts, studies } = JSON.parse(raw); if (Date.now() - ts < PM_TTL) return studies; }
  } catch {}
  try {
    const params = new URLSearchParams({ q, n: String(n) });
    if (fallbacks.length) params.set("fallbacks", fallbacks.join("|"));
    const res   = await fetch(`/api/pubmed?${params}`);
    const data  = await res.json();
    const studies = data.studies || [];
    if (studies.length) { try { localStorage.setItem(key, JSON.stringify({ ts: Date.now(), studies })); } catch {} }
    return studies;
  } catch { return []; }
}

function callClaude(sys, user, maxTokens = 1200) {
  return fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "claude-haiku-4-5-20251001", system: sys, messages: [{ role: "user", content: user }], max_tokens: maxTokens }),
  }).then(r => r.json()).then(d => d.content?.[0]?.text || "");
}

function parseJSON(text) {
  const clean = text.replace(/```json\s*/gi, "").replace(/```/g, "").trim();
  try { return JSON.parse(clean); } catch {}
  const m = clean.match(/\{[\s\S]*\}/);
  if (m) { try { return JSON.parse(m[0]); } catch {} }
  return null;
}

// Safety net independent of the model's compliance: cap list sizes and force the iron
// caution onto any iron-related item, even if the model omitted or reworded it. ironCaution
// is the translated (t()) string — passed in since this runs outside the component/hook.
function capRecs(parsed, ironCaution) {
  const withIronCaution = (item) => (/iron/i.test(item.name || "") ? { ...item, caution: ironCaution } : item);
  return {
    ...parsed,
    deficiencies: (parsed.deficiencies || []).slice(0, 2).map(withIronCaution),
    supplements: (parsed.supplements || []).map(withIronCaution),
    food_alts: (parsed.food_alts || []).slice(0, 6),
  };
}

export default function Boost({ profile, targets, entries, cyclePhase }) {
  const { t, language } = useLanguage();
  const ironCaution = t("boost.ironCaution");
  const [supps,       setSupps]       = useState([]);
  const [taken,       setTaken]       = useState({});
  const [newSupp,     setNewSupp]     = useState("");
  const [adding,      setAdding]      = useState(false);
  const [recs,        setRecs]        = useState(null);
  const [recsLoading, setRecsLoading] = useState(false);
  const [recsFoodCount, setRecsFoodCount] = useState(null); // foodEntries.length when recs was last generated — lets the UI flag stale analysis
  const [citations,   setCitations]   = useState({});
  const [suppOpen,    setSuppOpen]    = useState(false);

  // profile.perimenopause never existed as a field — the real signal is
  // biologicalContext, opt-in via biologicalTrackingEnabled.
  const bioNote = !profile?.biologicalTrackingEnabled ? ""
    : profile?.biologicalContext === "perimenopause" ? " (perimenopausal)"
    : profile?.biologicalContext === "menopause" ? " (postmenopausal)"
    : "";

  const foodEntries   = entries.filter(e => e.type === "food");
  const mealGroups    = [...new Set(foodEntries.map(e => e.mealGroup || "").filter(Boolean))];
  const distinctMeals = mealGroups.length;
  const totalCal   = foodEntries.reduce((s, e) => s + (e.calories  || 0), 0);
  const totalPro   = foodEntries.reduce((s, e) => s + (e.protein_g || 0), 0);
  const totalCarb  = foodEntries.reduce((s, e) => s + (e.carbs_g   || 0), 0);
  const totalFat   = foodEntries.reduce((s, e) => s + (e.fat_g     || 0), 0);
  const totalFibre = foodEntries.reduce((s, e) => s + (e.fiber_g   || 0), 0);

  // Load supplements + taken + restore cached recs
  useEffect(() => {
    try { const s = localStorage.getItem(SUPP_KEY);  setSupps(s ? JSON.parse(s) : []); } catch {}
    try {
      const t = localStorage.getItem(TAKEN_KEY);
      if (t) { const p = JSON.parse(t); if (p.date === localDateStr()) setTaken(p.taken || {}); }
    } catch {}
    try {
      const r = localStorage.getItem(RECS_KEY);
      // Compares against profile?.language (prop, resolved synchronously) rather than the
      // language context: this effect runs once on mount, and the context's sync-from-profile
      // effect in NutritionApp.jsx hasn't necessarily committed yet at that exact moment —
      // comparing against context here would risk a false "mismatch" discarding a valid cache.
      if (r) { const p = JSON.parse(r); if (p.date === localDateStr() && p.language === (profile?.language || "en") && p.recs && !p.recs._error) { const capped = capRecs(p.recs, ironCaution); setRecs(capped); setRecsFoodCount(p.foodCount ?? null); loadCitations(capped); } }
    } catch {}
  }, []);

  const saveSupps  = list => { setSupps(list); try { localStorage.setItem(SUPP_KEY, JSON.stringify(list)); } catch {} };
  const saveTaken  = t    => { setTaken(t);   try { localStorage.setItem(TAKEN_KEY, JSON.stringify({ date: localDateStr(), taken: t })); } catch {} };

  const addSupp    = () => { const n = newSupp.trim(); if (!n) return; saveSupps([...supps, { id: Date.now(), name: n }]); setNewSupp(""); setAdding(false); };
  const deleteSupp = id  => saveSupps(supps.filter(s => s.id !== id));
  const toggleTaken= id  => saveTaken({ ...taken, [id]: !taken[id] });
  const addToList  = name => { if (supps.some(s => s.name.toLowerCase() === name.toLowerCase())) return; saveSupps([...supps, { id: Date.now(), name }]); };

  const loadRecs = async () => {
    setRecsLoading(true);
    const foodLog  = foodEntries.map(e => `${e.name} (${e.calories||0} kcal, ${e.protein_g||0}g pro, ${e.carbs_g||0}g carb, ${e.fat_g||0}g fat, ${e.fiber_g||0}g fibre)`).join("\n") || "none";
    const suppList = supps.map(s => s.name).join(", ") || "none";
    const cyc      = cyclePhase ? `Cycle phase: ${cyclePhase.label}, day ${cyclePhase.day}.` : "";
    const langName = LANGUAGE_NAMES[language] || "English";
    const langLine = language && language !== "en"
      ? `\nCRITICAL: Write all "reason", "caution" and "note" text entirely in ${langName}. Do not use English unless a word has absolutely no translation. EXCEPTION: keep every "name" field (in "deficiencies", "supplements", and the "for" field in "food_alts") in English exactly as shown in the example — these are matched elsewhere in the app and must not be translated. The "food" field in "food_alts" should be in ${langName}.`
      : "";

    const sys = `You are a clinical nutritionist. Nora's philosophy is food first: whole foods are always the primary recommendation, supplements are a secondary, purely informational mention — never a dosing instruction. Return a 3-section JSON assessment — no markdown, no extra text.

Return ONLY this JSON structure:
{
  "deficiencies": [
    {"name":"Iron","emoji":"🩸","reason":"Few iron-rich foods today","caution":"Don't supplement iron without a blood test first — excess iron can be harmful. Ask a doctor."},
    {"name":"Zinc","emoji":"🦪","reason":"Few seeds, nuts or shellfish today"},
    {"name":"Folate","emoji":"🥬","reason":"Limited leafy greens or legumes today"}
  ],
  "food_alts": [
    {"for":"Iron","food":"Lentils, spinach, red meat","emoji":"🥩","note":"Pair with vitamin C to absorb better"},
    {"for":"Vitamin D3","food":"Eggs, fatty fish, 15 min sun","emoji":"🥚"},
    {"for":"Magnesium","food":"Pumpkin seeds, leafy greens, dark chocolate","emoji":"🌰"},
    {"for":"Omega-3","food":"Salmon, walnuts, flaxseed","emoji":"🐟"}
  ],
  "supplements": [
    {"name":"Vitamin D3","emoji":"☀️","reason":"Often low from diet or sun alone"},
    {"name":"Magnesium Glycinate","emoji":"🌙","reason":"Commonly linked to sleep and muscle relaxation","caution":"Ask a doctor first if you have kidney disease"},
    {"name":"Omega-3 (EPA/DHA)","emoji":"🐟","reason":"Commonly linked to heart and brain health","caution":"Ask a doctor first if you take blood thinners"}
  ]
}

SECTION 1 — deficiencies: Analyse today's food log for likely micronutrient gaps. Focus on Iron, Zinc, B12, Calcium, Folate, Vitamin C, Potassium, Fibre. Max 2 items, only the most relevant one or two. Reason: one short clause, under 8 words, no dosage or supplement suggestion — food gaps only. If a gap is Iron, you MUST include the exact "caution" text shown above, verbatim. If no gaps: empty array []. CRITICAL: if today's food log has 0 items (no meals logged at all), you MUST return deficiencies as an empty array [] — there is no log to analyse, so no specific gap can be claimed. Do NOT infer a gap from demographic, profile or cycle-phase signals alone when the log is empty; that would misrepresent a data-free case as an actual finding from today's meals. food_alts and supplements may still be evaluated from the profile in that case (per their own sections below) — only deficiencies requires actual logged food to say anything.
Sex and biological context (see profile below) change which gaps are actually likely — apply this, don't just note the demographic: iron deficiency risk from diet is strongly tied to menstrual blood loss, so weight Iron as a likely gap for users actively cycling, but do NOT default to flagging Iron for men or for perimenopausal/postmenopausal users unless the food log itself is clearly iron-poor — menstrual loss no longer applies to them, so it's a much less likely gap by default. For perimenopausal/postmenopausal users, weight Calcium more heavily instead — bone density loss accelerates once oestrogen declines.

SECTION 2 — food_alts: Nora's PRIMARY recommendation, food first. Provide one whole-food entry for EVERY item in deficiencies AND for every item you keep in "supplements" below (normally 3-5 total) — real foods (can list a few options comma-separated), one short absorption/prep tip under 8 words if useful. Never a pill. MUST respect the user's dietary preferences (see profile below) — never suggest a food that conflicts with them. Example: if the profile says vegetarian or vegan, never suggest red meat, poultry or fish for Iron — suggest lentils, spinach, tofu, chickpeas, fortified cereals instead. If preferences are "none" or empty, no restriction applies.

SECTION 3 — supplements: Consider exactly three candidates, in this order — Vitamin D3, Magnesium Glycinate, Omega-3 (EPA/DHA) — but this is a PERSONALISED assessment, not a fixed list. For each one, judge from THIS user's profile (age, sex, biological context, activity, goals, dietary preferences) and today's food log whether it's actually worth a brief mention. Sex and biological context should genuinely shape the "reason", not just be acknowledged: for perimenopausal/postmenopausal users, Vitamin D3's reason may reference bone health specifically (oestrogen decline accelerates bone loss) rather than a generic line; for men, don't reach for menstrual-related framing at all. If today's log (or an obvious profile signal, e.g. daily fatty fish, very high activity, a goal that makes one nutrient irrelevant) shows a candidate is already reasonably covered or clearly not a priority for this person, OMIT it entirely from the array — do not force all three. Keep only the ones genuinely worth mentioning; it is normal and expected for this to be 1, 2 or 3 items depending on the person. For every item you DO keep: "reason" must reference something concrete and specific to this person (their age bracket, activity level, a stated goal, dietary preference, or what's missing from today's meals) — never a generic, identical-for-everyone sentence. Dietary preferences matter especially for Omega-3: a vegetarian/vegan profile typically gets little direct EPA/DHA from food, which is worth reflecting in "reason". NEVER include a numeric dose, amount, unit (IU, mg, mcg) or a specific time of day (morning/evening/etc) — not in "reason", not anywhere. "caution" is included ONLY for Magnesium (kidney disease) or Omega-3 (blood thinners), worded close to the reference example — never invent new cautions or add one to Vitamin D3.

Never recommend anything the user is already taking: ${suppList}. Never suggest supplementing iron directly, food sources only. Never phrase anything as a personalised medical recommendation — general information only.${langLine}`;

    const user = `Profile: ${profile?.name}, ${profile?.age}y, ${profile?.sex}${bioNote}.
Goals: ${(profile?.goals || []).join(", ")}.
Activity: ${profile?.activity}.
Dietary preferences: ${profile?.preferences || "none"}.
${cyc}

Today's macros: ${Math.round(totalCal)}/${targets?.calories||2000} kcal · protein ${Math.round(totalPro)}/${targets?.protein_g||150}g · carbs ${Math.round(totalCarb)}g · fat ${Math.round(totalFat)}g · fibre ${Math.round(totalFibre)}g

Today's food log (${foodEntries.length} items across ${distinctMeals} meals):
${foodLog}`;

    try {
      const text   = await callClaude(sys, user, 1200);
      const parsed = parseJSON(text);
      if (parsed && Array.isArray(parsed.supplements)) {
        const capped = capRecs(parsed, ironCaution);
        setRecs(capped);
        setRecsFoodCount(foodEntries.length);
        try { localStorage.setItem(RECS_KEY, JSON.stringify({ date: localDateStr(), language, recs: capped, foodCount: foodEntries.length })); } catch {}
        loadCitations(capped);
      } else {
        setRecs({ _error: true });
      }
    } catch {
      setRecs({ _error: true });
    }
    setRecsLoading(false);
  };

  const loadCitations = (recsData) => {
    const items = [
      ...(recsData.deficiencies || []).map(d => ({
        name: d.name,
        q: d.name,
        fbs: [`${d.name} deficiency`, `${d.name} nutrition health`],
      })),
      ...(recsData.supplements || []).map(u => ({
        name: u.name,
        q: u.name.split(" (")[0],
        fbs: [`${u.name.split(" ")[0]} supplement`, `${u.name.split(" ")[0]} health benefits`],
      })),
    ];
    Promise.allSettled(
      items.map(({ name, q, fbs }) =>
        fetchPubMedCached(q, 5, fbs).then(studies => ({ name, studies }))
      )
    ).then(results => {
      const map = {};
      results.forEach(r => { if (r.status === "fulfilled") map[r.value.name] = r.value.studies; });
      setCitations(map);
    });
  };

  const handleRefresh = () => {
    setRecs(null);
    setCitations({});
    setSuppOpen(false);
    try { localStorage.removeItem(RECS_KEY); } catch {}
    loadRecs();
  };

  const takenCount    = supps.filter(s => taken[s.id]).length;

  return (
    <div style={{ padding: "24px 20px 100px", display: "flex", flexDirection: "column", gap: 16 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <AtmosphereBackground/>
      <div style={{ background:`linear-gradient(160deg,${C.greenDark} 0%,${C.green} 100%)`, padding:"20px 20px 18px", margin:"-24px -20px 18px", position:"relative", overflow:"hidden" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, flex:1 }}>
          <div style={{ flex:1 }}>
            <h2 style={{ fontFamily:serif, fontSize:21, color:"#FDFAF5", fontWeight:700, margin:0, lineHeight:1.2, letterSpacing:"-0.01em" }}>{t("nav.boost")}</h2>
            <p style={{ fontSize:11, color:"rgba(253,250,245,0.55)", margin:0, fontFamily:sans }}>{t("boost.header.subtitle")}</p>
          </div>
        </div>
      </div>

      {/* ── MY SUPPLEMENTS ─────────────────────────────────────── */}
      <div style={{ ...card }}>
        <div style={{ padding: "15px 18px 14px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ width: 20, height: 2, backgroundColor: C.muted, borderRadius: 2, marginBottom: 6 }}/>
            <p style={{ fontFamily: serif, fontSize: 16, fontWeight: 600, color: C.text, margin: 0 }}>{t("boost.mySupplements.title")}</p>
            <p style={{ fontSize: 11, color: C.muted, margin: "3px 0 0" }}>
              {supps.length === 0 ? t("boost.mySupplements.addBelow") : `${takenCount}/${supps.length} ${t("boost.mySupplements.takenToday")}`}
            </p>
          </div>
          <button onClick={() => setAdding(a => !a)} style={{ width: 34, height: 34, borderRadius: "50%", backgroundColor: adding ? C.greenLight : C.green, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "background-color 0.15s" }}>
            <PlusIcon size={13} color={adding ? C.green : C.bg}/>
          </button>
        </div>

        {adding && (
          <div style={{ padding: "10px 14px", borderBottom: `1px solid ${C.border}`, display: "flex", gap: 8 }}>
            <input value={newSupp} onChange={e => setNewSupp(e.target.value)} onKeyDown={e => { if(e.key==="Enter") addSupp(); if(e.key==="Escape") setAdding(false); }} placeholder={t("boost.mySupplements.placeholder")} autoFocus style={{ flex:1, border:`1px solid ${C.border}`, borderRadius:8, padding:"9px 12px", fontSize:14, color:C.text, backgroundColor:C.bg, outline:"none", fontFamily:sans }}/>
            <button onClick={addSupp} style={{ padding:"9px 14px", backgroundColor:C.green, color:C.bg, border:"none", borderRadius:8, fontSize:13, cursor:"pointer", fontWeight:500, fontFamily:sans }}>{t("boost.add")}</button>
          </div>
        )}

        {supps.length === 0 ? (
          <div style={{ padding: "28px 18px", textAlign: "center" }}>
            <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.6, margin: 0 }}>{t("boost.mySupplements.empty1")}<br/>{t("boost.mySupplements.empty2")}</p>
          </div>
        ) : (
          <div>
            {supps.map((s, i) => (
              <div key={s.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"13px 18px", borderBottom:i<supps.length-1?`1px solid ${C.border}`:"none" }}>
                <button onClick={() => toggleTaken(s.id)} style={{ width:27, height:27, borderRadius:"50%", border:`2px solid ${taken[s.id]?C.green:C.border}`, backgroundColor:taken[s.id]?C.green:"transparent", cursor:"pointer", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.2s" }}>
                  {taken[s.id] && <CheckIcon size={12} color={C.bg}/>}
                </button>
                <span style={{ flex:1, fontSize:14, color:taken[s.id]?C.muted:C.text, textDecoration:taken[s.id]?"line-through":"none", transition:"all 0.2s" }}>{s.name}</span>
                <button onClick={() => deleteSupp(s.id)} style={{ fontSize:15, color:C.muted, background:"none", border:"none", cursor:"pointer", padding:"2px 4px", opacity:0.5, lineHeight:1 }}>×</button>
              </div>
            ))}
          </div>
        )}

        {supps.length > 0 && (
          <div style={{ padding: "10px 18px 14px" }}>
            <div style={{ height:4, backgroundColor:C.track, borderRadius:4, overflow:"hidden" }}>
              <div style={{ height:"100%", width:`${(takenCount/supps.length)*100}%`, backgroundColor:takenCount===supps.length?C.green:C.gold, borderRadius:4, transition:"width 0.4s ease" }}/>
            </div>
          </div>
        )}
      </div>

      {/* ── NORA'S ANALYSIS ────────────────────────────────────── */}
      <div style={{ ...card }}>
        <div style={{ padding:"15px 18px 14px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <div style={{ width:20, height:2, backgroundColor:C.muted, borderRadius:2, marginBottom:6 }}/>
            <p style={{ fontFamily:serif, fontSize:16, fontWeight:600, color:C.text, margin:0 }}>{t("boost.analysis.title")}</p>
            <p style={{ fontSize:11, color:C.muted, margin:"3px 0 0" }}>{t("boost.analysis.subtitle")}</p>
          </div>
          {recs && !recs._error && !recsLoading && (
            <button onClick={handleRefresh} style={{ fontSize:11, color:C.green, background:"none", border:`1px solid ${C.green}`, borderRadius:20, padding:"5px 10px", cursor:"pointer", whiteSpace:"nowrap" }}>{t("boost.refresh")}</button>
          )}
        </div>

        {/* Stale-analysis hint — new meals logged since this analysis was generated. No silent
            auto-recompute: the user decides when to spend another AI call, via Refresh. */}
        {recs && !recs._error && !recsLoading && recsFoodCount != null && foodEntries.length !== recsFoodCount && (
          <div style={{ margin:"12px 18px 0", padding:"10px 14px", backgroundColor:C.amberBg, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"space-between", gap:10 }}>
            <p style={{ fontSize:12, color:C.amber, margin:0, lineHeight:1.5 }}>{t("boost.staleData")}</p>
            <button onClick={handleRefresh} style={{ fontSize:11, color:C.amber, background:"none", border:`1px solid ${C.amber}`, borderRadius:20, padding:"5px 10px", cursor:"pointer", whiteSpace:"nowrap", flexShrink:0 }}>{t("boost.refresh")}</button>
          </div>
        )}

        {/* Generate analysis button — always visible */}
        {!recsLoading && !recs && (
          <div style={{ padding:"24px 18px", textAlign:"center" }}>
            <p style={{ fontSize:30, margin:"0 0 10px" }}>🔬</p>
            <p style={{ fontSize:14, fontWeight:600, color:C.text, margin:"0 0 6px", fontFamily:serif }}>
              {foodEntries.length > 0 ? t("boost.analysis.ready") : t("boost.analysis.generate")}
            </p>
            <p style={{ fontSize:13, color:C.muted, lineHeight:1.65, margin:"0 0 18px" }}>
              {foodEntries.length > 0
                ? `${foodEntries.length} ${foodEntries.length !== 1 ? t("boost.analysis.mealsLogged") : t("boost.analysis.mealLogged")}${distinctMeals > 0 ? ` ${t("boost.analysis.acrossGroups")} ${distinctMeals} ${t("boost.analysis.mealGroups")}` : ""}`
                : t("boost.analysis.noMeals")}
            </p>
            <button onClick={loadRecs} style={{ width:"100%", padding:"14px", backgroundColor:C.green, color:C.bg, border:"none", borderRadius:12, fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:sans, letterSpacing:"0.02em" }}>
              {t("boost.analysis.generate")}
            </button>
          </div>
        )}

        {/* Loading */}
        {recsLoading && (
          <div style={{ padding:"28px 18px", textAlign:"center" }}>
            <div style={{ width:26, height:26, border:`2px solid ${C.border}`, borderTopColor:C.green, borderRadius:"50%", animation:"spin 0.9s linear infinite", margin:"0 auto 12px" }}/>
            <p style={{ color:C.muted, fontSize:13, margin:0 }}>{t("boost.analysis.analysing")}</p>
          </div>
        )}

        {/* Error */}
        {!recsLoading && recs?._error && (
          <div style={{ padding:"22px 18px", textAlign:"center" }}>
            <p style={{ color:C.muted, fontSize:13, margin:"0 0 14px" }}>{t("boost.analysis.error")}</p>
            <button onClick={() => { setRecs(null); loadRecs(); }} style={{ padding:"10px 18px", backgroundColor:C.green, color:C.bg, border:"none", borderRadius:10, fontSize:13, cursor:"pointer", fontFamily:sans }}>{t("boost.tryAgain")}</button>
          </div>
        )}

        {/* Results — 3 sections */}
        {!recsLoading && recs && !recs._error && (
          <div style={{ padding:"14px 18px 18px" }}>

            {/* SECTION 1 — Deficiencies */}
            <SectionLabel icon="🔍">{t("boost.gaps.title")}</SectionLabel>
            <p style={{ fontSize:11, color:C.muted, margin:"-4px 0 10px", lineHeight:1.55, fontFamily:sans }}>{t("boost.gaps.disclaimer")}</p>
            {recs.deficiencies?.length > 0 ? (
              recs.deficiencies.map((d, i) => <DefCard key={i} def={d} studies={citations[d.name] || []} t={t}/>)
            ) : foodEntries.length === 0 ? (
              <div style={{ backgroundColor:C.bg, borderRadius:12, padding:"12px 14px", marginBottom:8, border:`1px solid ${C.border}` }}>
                <p style={{ fontSize:13, color:C.muted, margin:0 }}>{t("boost.gaps.emptyLog")}</p>
              </div>
            ) : (
              <div style={{ backgroundColor:C.greenLight, borderRadius:12, padding:"12px 14px", marginBottom:8, border:`1px solid ${C.green}20` }}>
                <p style={{ fontSize:13, color:C.green, margin:0, fontWeight:500 }}>✓ {t("boost.gaps.none")}</p>
              </div>
            )}

            {/* SECTION 2 — Food sources (Nora's primary recommendation) */}
            {recs.food_alts?.length > 0 && (
              <>
                <SectionLabel icon="🥗" top>{t("boost.foodSources.title")}</SectionLabel>
                <p style={{ fontSize:11, color:C.muted, margin:"-4px 0 10px", lineHeight:1.55, fontFamily:sans }}>{t("boost.foodSources.subtitle")}</p>
                {recs.food_alts.map((a, i) => <FoodAltCard key={i} alt={a} t={t}/>)}
                <p style={{ fontSize:11, color:C.muted, fontStyle:"italic", margin:"8px 0 0", lineHeight:1.6, fontFamily:serif, borderLeft:`2px solid ${C.gold}`, paddingLeft:10 }}>
                  ✦ {t("boost.foodSources.note")}
                </p>
              </>
            )}

            {/* SECTION 3 — Supplements: collapsed by default, brief mention only, never a dosing instruction */}
            {recs.supplements?.length > 0 && (
              <div style={{ marginTop:14 }}>
                <button onClick={() => setSuppOpen(v => !v)} style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between", background:"none", border:"none", padding:0, cursor:"pointer", textAlign:"left" }}>
                  <div>
                    <SectionLabel icon="💊">{t("boost.supplements.title")}</SectionLabel>
                    {!suppOpen && (
                      <p style={{ fontSize:11, color:C.muted, margin:"-4px 0 0", fontFamily:sans }}>
                        {recs.supplements.length} {t("boost.supplements.basedOnDay")}
                      </p>
                    )}
                  </div>
                  <ChevronIcon open={suppOpen} size={15} color={C.muted}/>
                </button>
                {suppOpen && (
                  <div style={{ marginTop:8 }}>
                    <p style={{ fontSize:11, color:C.muted, margin:"0 0 10px", lineHeight:1.55, fontFamily:sans }}>{t("boost.supplements.disclaimer")}</p>
                    {recs.supplements.map((r, i) => (
                      <SuppCard key={i} rec={r} studies={citations[r.name] || []} onAdd={() => addToList(r.name)} alreadyAdded={supps.some(s => s.name.toLowerCase() === r.name.toLowerCase())} t={t}/>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <p style={{ fontSize:11, color:C.muted, textAlign:"center", lineHeight:1.6, padding:"0 16px" }}>
        {t("boost.footerDisclaimer")}
      </p>
    </div>
  );
}

function SectionLabel({ icon, children, top }) {
  return (
    <p style={{ fontSize:10, color:C.muted, textTransform:"uppercase", letterSpacing:"0.08em", fontWeight:700, margin:`${top?14:4}px 0 10px`, fontFamily:sans, display:"flex", alignItems:"center", gap:5 }}>
      <span>{icon}</span>{children}
    </p>
  );
}

function StudyCitations({ studies, t }) {
  const [open, setOpen] = useState(false);
  if (!studies?.length) return null;
  const shown = open ? studies : studies.slice(0, 2);
  return (
    <div style={{ marginTop:8, paddingTop:8, borderTop:`1px solid ${C.border}` }}>
      <p style={{ fontSize:9, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.08em", margin:"0 0 6px", fontFamily:sans }}>
        📚 {studies.length} {studies.length===1 ? t("boost.citations.study") : t("boost.citations.studies")}
      </p>
      {shown.map((s, i) => (
        <a key={s.id||i} href={s.url||`https://pubmed.ncbi.nlm.nih.gov/${s.id}/`} target="_blank" rel="noopener noreferrer"
          style={{ display:"block", textDecoration:"none", marginBottom:i<shown.length-1?8:0 }}>
          <p style={{ fontSize:11, color:C.text, margin:"0 0 2px", lineHeight:1.45, fontFamily:sans }}>{s.title}</p>
          <p style={{ fontSize:10, color:C.muted, margin:0, fontFamily:sans }}>
            {[s.authors,s.journal,s.year].filter(Boolean).join(" · ")}
            {s.url && <span style={{ color:C.green, marginLeft:6, fontWeight:500 }}>↗ {t("boost.citations.readOnPubMed")}</span>}
          </p>
        </a>
      ))}
      {studies.length > 2 && (
        <button onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
          style={{ marginTop:5, fontSize:10, color:C.green, background:"none", border:"none", padding:0, cursor:"pointer", fontFamily:sans, fontWeight:500 }}>
          {open ? `▲ ${t("boost.citations.showLess")}` : `▼ ${studies.length-2} ${t("boost.citations.more")}`}
        </button>
      )}
    </div>
  );
}

function CautionNote({ text }) {
  if (!text) return null;
  return (
    <p style={{ fontSize:11, color:C.muted, fontStyle:"italic", margin:"6px 0 0", lineHeight:1.5, borderLeft:`2px solid ${C.border}`, paddingLeft:8 }}>{text}</p>
  );
}

function SuppCard({ rec, studies, onAdd, alreadyAdded, t }) {
  return (
    <div style={{ backgroundColor:C.card, borderRadius:12, padding:"13px 14px", marginBottom:8, border:`1px solid ${C.border}` }}>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:10 }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:4 }}>
            <span style={{ fontSize:16, lineHeight:1 }}>{rec.emoji || "💊"}</span>
            <p style={{ fontSize:14, fontWeight:600, color:C.text, margin:0 }}>{t(`eat.nutrient.${rec.name}`, rec.name)}</p>
          </div>
          <p style={{ fontSize:12, color:C.muted, margin:"0 0 5px", lineHeight:1.5 }}>{rec.reason}</p>
          <CautionNote text={rec.caution}/>
          <StudyCitations studies={studies} t={t}/>
        </div>
        <button onClick={onAdd} disabled={alreadyAdded} style={{ flexShrink:0, padding:"7px 11px", backgroundColor:alreadyAdded?C.greenLight:C.green, color:alreadyAdded?C.sage:C.bg, border:"none", borderRadius:8, fontSize:11, cursor:alreadyAdded?"default":"pointer", fontFamily:sans, fontWeight:600, whiteSpace:"nowrap" }}>
          {alreadyAdded ? `✓ ${t("boost.added")}` : `+ ${t("boost.myList")}`}
        </button>
      </div>
    </div>
  );
}

function DefCard({ def, studies, t }) {
  return (
    <div style={{ backgroundColor:C.card, borderRadius:12, padding:"13px 14px", marginBottom:8, border:`1px solid ${C.border}` }}>
      <div style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
        <span style={{ fontSize:20, flexShrink:0, lineHeight:1.3, marginTop:1 }}>{def.emoji || "⚠️"}</span>
        <div style={{ flex:1 }}>
          <p style={{ fontSize:14, fontWeight:600, color:C.text, margin:"0 0 3px" }}>{t(`eat.nutrient.${def.name}`, def.name)}</p>
          <p style={{ fontSize:12, color:C.muted, margin:0, lineHeight:1.5 }}>{def.reason}</p>
          <CautionNote text={def.caution}/>
          <StudyCitations studies={studies} t={t}/>
        </div>
      </div>
    </div>
  );
}

function FoodAltCard({ alt, t }) {
  return (
    <div style={{ backgroundColor:C.card, borderRadius:12, padding:"13px 14px", marginBottom:8, border:`1px solid ${C.border}`, borderLeft:`3px solid ${C.muted}` }}>
      <p style={{ fontSize:10, fontWeight:700, color:C.green, textTransform:"uppercase", letterSpacing:"0.08em", margin:"0 0 6px", fontFamily:sans }}>{t("boost.insteadOf")} {t(`eat.nutrient.${alt.for}`, alt.for)}</p>
      <div style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
        <span style={{ fontSize:20, flexShrink:0, lineHeight:1.3, marginTop:1 }}>{alt.emoji || "🥗"}</span>
        <div style={{ flex:1 }}>
          <p style={{ fontSize:14, fontWeight:600, color:C.text, margin:"0 0 3px", fontFamily:serif }}>{alt.food}</p>
          {alt.note && <p style={{ fontSize:12, color:C.muted, margin:0, lineHeight:1.5, fontFamily:sans }}>{alt.note}</p>}
        </div>
      </div>
    </div>
  );
}
