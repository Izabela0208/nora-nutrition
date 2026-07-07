import { useState, useEffect } from "react";
import { C, card, serif, sans, localDateStr } from "../noraTokens";
import { PlusIcon, CheckIcon, BotanicalBranch, NoraAvatar } from "../NoraIcons";

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

export default function Boost({ profile, targets, entries, cyclePhase }) {
  const [supps,       setSupps]       = useState([]);
  const [taken,       setTaken]       = useState({});
  const [newSupp,     setNewSupp]     = useState("");
  const [adding,      setAdding]      = useState(false);
  const [recs,        setRecs]        = useState(null);
  const [recsLoading, setRecsLoading] = useState(false);
  const [citations,   setCitations]   = useState({});

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
      if (r) { const p = JSON.parse(r); if (p.date === localDateStr() && p.recs) { setRecs(p.recs); loadCitations(p.recs); } }
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

    const sys = `You are a clinical nutritionist. Return a 3-section JSON assessment — no markdown, no extra text.

Return ONLY this JSON structure:
{
  "deficiencies": [
    {"name":"Iron","emoji":"🩸","reason":"No red meat, lentils or leafy greens in today's meals"}
  ],
  "universal": [
    {"name":"Vitamin D3","dose":"2000 IU","timing":"morning","emoji":"☀️","reason":"Most adults are deficient year-round; essential for immunity, mood and bone health"},
    {"name":"Magnesium Glycinate","dose":"300 mg","timing":"evening","emoji":"🌙","reason":"Supports deep sleep, muscle relaxation and 300+ enzymatic reactions"},
    {"name":"Omega-3 (EPA/DHA)","dose":"1000 mg","timing":"evening","emoji":"🐟","reason":"Reduces inflammation, supports cardiovascular and brain health — difficult to obtain from diet alone"}
  ],
  "food_alts": [
    {"for":"Iron","food":"30g cooked chicken liver","emoji":"🥩","note":"Pan-fry with olive oil for 5 min — covers 60% of daily iron needs"},
    {"for":"Vitamin D3","food":"2 eggs + 15 min morning sun","emoji":"🥚","note":"Eggs provide dietary D3; skin synthesises up to 10,000 IU with direct sunlight"}
  ]
}

SECTION 1 — deficiencies: Analyse today's food log for likely micronutrient gaps. Focus on Iron, Zinc, B12, Calcium, Folate, Vitamin C, Potassium, Fibre. Max 4 items. If no gaps: empty array [].

SECTION 2 — universal: ALWAYS include exactly these three regardless of diet: Vitamin D3 (morning), Magnesium Glycinate (evening), Omega-3 EPA/DHA (evening). These are universally beneficial. Do not omit or replace them.
Timing rules: morning = Vitamin D3, B12, Iron, Zinc, B Complex. Evening = Magnesium, Omega-3, Calcium.

SECTION 3 — food_alts: For EVERY item in deficiencies AND every item in universal, provide one whole food alternative with exact quantity and brief preparation note. The "for" field must exactly match the name from the other sections. Max 8 total.

Never recommend anything the user is already taking: ${suppList}.`;

    const user = `Profile: ${profile?.name}, ${profile?.age}y, ${profile?.sex}${profile?.perimenopause ? " (perimenopausal)" : ""}.
Goals: ${(profile?.goals || []).join(", ")}.
Activity: ${profile?.activity}.
${cyc}

Today's macros: ${Math.round(totalCal)}/${targets?.calories||2000} kcal · protein ${Math.round(totalPro)}/${targets?.protein_g||150}g · carbs ${Math.round(totalCarb)}g · fat ${Math.round(totalFat)}g · fibre ${Math.round(totalFibre)}g

Today's food log (${foodEntries.length} items across ${distinctMeals} meals):
${foodLog}`;

    try {
      const text   = await callClaude(sys, user, 1200);
      const parsed = parseJSON(text);
      if (parsed && Array.isArray(parsed.universal)) {
        setRecs(parsed);
        try { localStorage.setItem(RECS_KEY, JSON.stringify({ date: localDateStr(), recs: parsed })); } catch {}
        loadCitations(parsed);
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
      ...(recsData.universal || []).map(u => ({
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
    try { localStorage.removeItem(RECS_KEY); } catch {}
    loadRecs();
  };

  const takenCount    = supps.filter(s => taken[s.id]).length;
  const univMorning   = recs?.universal?.filter(r => r.timing === "morning") || [];
  const univEvening   = recs?.universal?.filter(r => r.timing === "evening") || [];

  return (
    <div style={{ padding: "24px 20px 100px", display: "flex", flexDirection: "column", gap: 16 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ background:`linear-gradient(160deg,${C.greenDark} 0%,${C.green} 100%)`, padding:"20px 20px 18px", margin:"-24px -20px 18px", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:-8, right:-8, opacity:0.12, pointerEvents:"none" }}>
          <BotanicalBranch width={110}/>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:12, flex:1 }}>
          <NoraAvatar size={36}/>
          <div style={{ flex:1 }}>
            <h2 style={{ fontFamily:serif, fontSize:21, color:"#FDFAF5", fontWeight:700, margin:0, lineHeight:1.2, letterSpacing:"-0.01em" }}>Boost</h2>
            <p style={{ fontSize:11, color:"rgba(253,250,245,0.55)", margin:0, fontFamily:sans }}>Supplements & personalised recommendations</p>
          </div>
        </div>
      </div>

      {/* ── MY SUPPLEMENTS ─────────────────────────────────────── */}
      <div style={{ ...card }}>
        <div style={{ padding: "15px 18px 14px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ width: 20, height: 2, backgroundColor: C.muted, borderRadius: 2, marginBottom: 6 }}/>
            <p style={{ fontFamily: serif, fontSize: 16, fontWeight: 600, color: C.text, margin: 0 }}>My Supplements</p>
            <p style={{ fontSize: 11, color: C.muted, margin: "3px 0 0" }}>
              {supps.length === 0 ? "Add your stack below" : `${takenCount}/${supps.length} taken today`}
            </p>
          </div>
          <button onClick={() => setAdding(a => !a)} style={{ width: 34, height: 34, borderRadius: "50%", backgroundColor: adding ? C.greenLight : C.green, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "background-color 0.15s" }}>
            <PlusIcon size={13} color={adding ? C.green : C.bg}/>
          </button>
        </div>

        {adding && (
          <div style={{ padding: "10px 14px", borderBottom: `1px solid ${C.border}`, display: "flex", gap: 8 }}>
            <input value={newSupp} onChange={e => setNewSupp(e.target.value)} onKeyDown={e => { if(e.key==="Enter") addSupp(); if(e.key==="Escape") setAdding(false); }} placeholder="e.g. Vitamin D3 2000 IU" autoFocus style={{ flex:1, border:`1px solid ${C.border}`, borderRadius:8, padding:"9px 12px", fontSize:14, color:C.text, backgroundColor:C.bg, outline:"none", fontFamily:sans }}/>
            <button onClick={addSupp} style={{ padding:"9px 14px", backgroundColor:C.green, color:C.bg, border:"none", borderRadius:8, fontSize:13, cursor:"pointer", fontWeight:500, fontFamily:sans }}>Add</button>
          </div>
        )}

        {supps.length === 0 ? (
          <div style={{ padding: "28px 18px", textAlign: "center" }}>
            <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.6, margin: 0 }}>No supplements added yet.<br/>Tap + to begin your stack.</p>
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
            <p style={{ fontFamily:serif, fontSize:16, fontWeight:600, color:C.text, margin:0 }}>Nora's Analysis</p>
            <p style={{ fontSize:11, color:C.muted, margin:"3px 0 0" }}>Deficiencies · essential supplements · food alternatives</p>
          </div>
          {recs && !recs._error && !recsLoading && (
            <button onClick={handleRefresh} style={{ fontSize:11, color:C.green, background:"none", border:`1px solid ${C.green}`, borderRadius:20, padding:"5px 10px", cursor:"pointer", whiteSpace:"nowrap" }}>Refresh</button>
          )}
        </div>

        {/* Generate analysis button — always visible */}
        {!recsLoading && !recs && (
          <div style={{ padding:"24px 18px", textAlign:"center" }}>
            <p style={{ fontSize:30, margin:"0 0 10px" }}>🔬</p>
            <p style={{ fontSize:14, fontWeight:600, color:C.text, margin:"0 0 6px", fontFamily:serif }}>
              {foodEntries.length > 0 ? "Ready to analyse" : "Generate analysis"}
            </p>
            <p style={{ fontSize:13, color:C.muted, lineHeight:1.65, margin:"0 0 18px" }}>
              {foodEntries.length > 0
                ? `${foodEntries.length} meal${foodEntries.length !== 1 ? "s" : ""} logged${distinctMeals > 0 ? ` across ${distinctMeals} meal groups` : ""}`
                : "No meals logged yet — Nora will provide universal recommendations"}
            </p>
            <button onClick={loadRecs} style={{ width:"100%", padding:"14px", backgroundColor:C.green, color:C.bg, border:"none", borderRadius:12, fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:sans, letterSpacing:"0.02em" }}>
              Generate analysis
            </button>
          </div>
        )}

        {/* Loading */}
        {recsLoading && (
          <div style={{ padding:"28px 18px", textAlign:"center" }}>
            <div style={{ width:26, height:26, border:`2px solid ${C.border}`, borderTopColor:C.green, borderRadius:"50%", animation:"spin 0.9s linear infinite", margin:"0 auto 12px" }}/>
            <p style={{ color:C.muted, fontSize:13, margin:0 }}>Analysing today's nutrition…</p>
          </div>
        )}

        {/* Error */}
        {!recsLoading && recs?._error && (
          <div style={{ padding:"22px 18px", textAlign:"center" }}>
            <p style={{ color:C.muted, fontSize:13, margin:"0 0 14px" }}>Could not generate analysis. Please try again.</p>
            <button onClick={() => { setRecs(null); loadRecs(); }} style={{ padding:"10px 18px", backgroundColor:C.green, color:C.bg, border:"none", borderRadius:10, fontSize:13, cursor:"pointer", fontFamily:sans }}>Try again</button>
          </div>
        )}

        {/* Results — 3 sections */}
        {!recsLoading && recs && !recs._error && (
          <div style={{ padding:"14px 18px 18px" }}>

            {/* SECTION 1 — Deficiencies */}
            <SectionLabel icon="🔍">Nutritional Gaps Today</SectionLabel>
            {recs.deficiencies?.length > 0 ? (
              recs.deficiencies.map((d, i) => <DefCard key={i} def={d} studies={citations[d.name] || []}/>)
            ) : (
              <div style={{ backgroundColor:C.greenLight, borderRadius:12, padding:"12px 14px", marginBottom:8, border:`1px solid ${C.green}20` }}>
                <p style={{ fontSize:13, color:C.green, margin:0, fontWeight:500 }}>✓ Great variety today — no significant gaps detected from your meals.</p>
              </div>
            )}

            {/* SECTION 2 — Universal supplements */}
            <SectionLabel icon="💊" top>Essential Daily Supplements</SectionLabel>
            <p style={{ fontSize:11, color:C.muted, margin:"-4px 0 10px", lineHeight:1.55, fontFamily:sans }}>Beneficial regardless of diet — recommended for most adults.</p>
            {univMorning.length > 0 && (
              <>
                <TimingChip timing="morning"/>
                {univMorning.map((r, i) => (
                  <SuppCard key={i} rec={r} studies={citations[r.name] || []} onAdd={() => addToList(r.name)} alreadyAdded={supps.some(s => s.name.toLowerCase() === r.name.toLowerCase())}/>
                ))}
              </>
            )}
            {univEvening.length > 0 && (
              <>
                <TimingChip timing="evening"/>
                {univEvening.map((r, i) => (
                  <SuppCard key={i} rec={r} studies={citations[r.name] || []} onAdd={() => addToList(r.name)} alreadyAdded={supps.some(s => s.name.toLowerCase() === r.name.toLowerCase())}/>
                ))}
              </>
            )}

            {/* SECTION 3 — Food alternatives */}
            {recs.food_alts?.length > 0 && (
              <>
                <SectionLabel icon="🥗" top>Whole Food Alternatives</SectionLabel>
                <p style={{ fontSize:11, color:C.muted, margin:"-4px 0 10px", lineHeight:1.55, fontFamily:sans }}>Get the same nutrients from whole foods instead.</p>
                {recs.food_alts.map((a, i) => <FoodAltCard key={i} alt={a}/>)}
                <p style={{ fontSize:11, color:C.muted, fontStyle:"italic", margin:"8px 0 0", lineHeight:1.6, fontFamily:serif, borderLeft:`2px solid ${C.gold}`, paddingLeft:10 }}>
                  ✦ Whole foods provide nutrients in their most bioavailable form alongside co-factors that aid absorption
                </p>
              </>
            )}
          </div>
        )}
      </div>

      <p style={{ fontSize:11, color:C.muted, textAlign:"center", lineHeight:1.6, padding:"0 16px" }}>
        For informational purposes only. Consult a healthcare professional before starting any supplement.
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

function TimingChip({ timing }) {
  const morning = timing === "morning";
  return (
    <div style={{ display:"inline-flex", alignItems:"center", gap:5, backgroundColor: morning ? "#FBF3E3" : "#EEF3EF", borderRadius:20, padding:"3px 10px", marginBottom:8 }}>
      <span style={{ fontSize:11 }}>{morning ? "☀️" : "🌙"}</span>
      <span style={{ fontSize:10, fontWeight:700, color: morning ? C.amber : C.green, fontFamily:sans, textTransform:"uppercase", letterSpacing:"0.06em" }}>
        {morning ? "Take tomorrow morning" : "You can take tonight"}
      </span>
    </div>
  );
}

function StudyCitations({ studies }) {
  const [open, setOpen] = useState(false);
  if (!studies?.length) return null;
  const shown = open ? studies : studies.slice(0, 2);
  return (
    <div style={{ marginTop:8, paddingTop:8, borderTop:`1px solid ${C.border}` }}>
      <p style={{ fontSize:9, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.08em", margin:"0 0 6px", fontFamily:sans }}>
        📚 {studies.length} peer-reviewed {studies.length===1?"study":"studies"}
      </p>
      {shown.map((s, i) => (
        <a key={s.id||i} href={s.url||`https://pubmed.ncbi.nlm.nih.gov/${s.id}/`} target="_blank" rel="noopener noreferrer"
          style={{ display:"block", textDecoration:"none", marginBottom:i<shown.length-1?8:0 }}>
          <p style={{ fontSize:11, color:C.text, margin:"0 0 2px", lineHeight:1.45, fontFamily:sans }}>{s.title}</p>
          <p style={{ fontSize:10, color:C.muted, margin:0, fontFamily:sans }}>
            {[s.authors,s.journal,s.year].filter(Boolean).join(" · ")}
            {s.url && <span style={{ color:C.gold, marginLeft:6, fontWeight:500 }}>↗ Read on PubMed</span>}
          </p>
        </a>
      ))}
      {studies.length > 2 && (
        <button onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
          style={{ marginTop:5, fontSize:10, color:C.green, background:"none", border:"none", padding:0, cursor:"pointer", fontFamily:sans, fontWeight:500 }}>
          {open ? "▲ Show less" : `▼ ${studies.length-2} more`}
        </button>
      )}
    </div>
  );
}

function SuppCard({ rec, studies, onAdd, alreadyAdded }) {
  return (
    <div style={{ backgroundColor:C.bg, borderRadius:12, padding:"13px 14px", marginBottom:8, border:`1px solid ${C.border}` }}>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:10 }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:4 }}>
            <span style={{ fontSize:16, lineHeight:1 }}>{rec.emoji || "💊"}</span>
            <p style={{ fontSize:14, fontWeight:600, color:C.text, margin:0 }}>{rec.name}</p>
          </div>
          <p style={{ fontSize:12, color:C.muted, margin:"0 0 5px", lineHeight:1.5 }}>{rec.reason}</p>
          {rec.dose && (
            <span style={{ fontSize:11, fontWeight:700, color:C.sage, backgroundColor:C.greenLight, borderRadius:20, padding:"2px 8px" }}>{rec.dose}</span>
          )}
          <StudyCitations studies={studies}/>
        </div>
        <button onClick={onAdd} disabled={alreadyAdded} style={{ flexShrink:0, padding:"7px 11px", backgroundColor:alreadyAdded?C.greenLight:C.green, color:alreadyAdded?C.sage:C.bg, border:"none", borderRadius:8, fontSize:11, cursor:alreadyAdded?"default":"pointer", fontFamily:sans, fontWeight:600, whiteSpace:"nowrap" }}>
          {alreadyAdded ? "✓ Added" : "+ My list"}
        </button>
      </div>
    </div>
  );
}

function DefCard({ def, studies }) {
  return (
    <div style={{ backgroundColor:C.bg, borderRadius:12, padding:"13px 14px", marginBottom:8, border:`1px solid ${C.border}` }}>
      <div style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
        <span style={{ fontSize:20, flexShrink:0, lineHeight:1.3, marginTop:1 }}>{def.emoji || "⚠️"}</span>
        <div style={{ flex:1 }}>
          <p style={{ fontSize:14, fontWeight:600, color:C.text, margin:"0 0 3px" }}>{def.name}</p>
          <p style={{ fontSize:12, color:C.muted, margin:0, lineHeight:1.5 }}>{def.reason}</p>
          <StudyCitations studies={studies}/>
        </div>
      </div>
    </div>
  );
}

function FoodAltCard({ alt }) {
  return (
    <div style={{ backgroundColor:C.bg, borderRadius:12, padding:"13px 14px", marginBottom:8, border:`1px solid ${C.border}`, borderLeft:`3px solid ${C.muted}` }}>
      <p style={{ fontSize:10, fontWeight:700, color:C.gold, textTransform:"uppercase", letterSpacing:"0.08em", margin:"0 0 6px", fontFamily:sans }}>Instead of {alt.for}</p>
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
