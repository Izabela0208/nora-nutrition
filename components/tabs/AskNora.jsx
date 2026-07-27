import { useState, useEffect, useMemo, useRef } from "react";
import { C, card, serif, sans } from "../noraTokens";
import { NoraAvatar } from "../NoraIcons";
import AtmosphereBackground from "../AtmosphereBackground";

async function callClaude(msgs, sys, maxTokens = 1000) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      system: sys,
      messages: msgs,
      max_tokens: maxTokens,
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.content?.[0]?.text || "";
}

// Generic fallback pool — fills any pills left after context-specific candidates are applied.
const FALLBACK_POOL = [
  { q: "How can I improve my energy?",    icon: "⚡" },
  { q: "What supplements do I need?",     icon: "💊" },
  { q: "Am I hitting my protein goals?",  icon: "💪" },
  { q: "Give me a healthy snack idea",    icon: "🍎" },
  { q: "What am I missing nutritionally?",icon: "🔍" },
  { q: "What should I eat today?",        icon: "🥗" },
];

// Rotated per day so the same condition doesn't show the same sentence every time.
const MORNING_EMPTY_LOG = [
  { q: "What should I eat today?",        icon: "🥗" },
  { q: "Where should I start today?",     icon: "🥗" },
  { q: "What's a good first meal today?", icon: "🥗" },
];

const EVENING_EMPTY_LOG = [
  { q: "I haven't logged anything today — where should I start?", icon: "🥗" },
  { q: "What should I eat for the rest of today?",                icon: "🥗" },
  { q: "How do I catch up on today's nutrition?",                 icon: "🥗" },
];

const daySeed = () => Math.floor(Date.now() / 86400000);
const pickRotating = (pool, seed) => pool[seed % pool.length];

// Builds exactly 3 suggested pills, prioritising what's actually true right now
// over the generic fallback pool.
function getContextualSuggestions(ctx) {
  const {
    hasLoggedToday, hour, challengeTitle, cyclePhase,
    deficiency, proteinRemainingHigh, waterBelowHalfTarget,
  } = ctx;
  const seed = daySeed();
  const candidates = [];

  if (challengeTitle) {
    candidates.push({ q: `How does today's challenge — ${challengeTitle} — fit into this?`, icon: "🌿" });
  }
  if (cyclePhase) {
    candidates.push({ q: "How is my cycle affecting nutrition today?", icon: "🌙" });
  }
  if (deficiency) {
    candidates.push({ q: `Why is Boost flagging ${deficiency} today?`, icon: "💊" });
  }
  if (!hasLoggedToday && hour < 12) {
    candidates.push(pickRotating(MORNING_EMPTY_LOG, seed));
  } else if (!hasLoggedToday) {
    candidates.push(pickRotating(EVENING_EMPTY_LOG, seed));
  }
  if (proteinRemainingHigh && hour >= 12) {
    candidates.push({ q: "How can I hit my protein target today?", icon: "💪" });
  }
  if (waterBelowHalfTarget && hour >= 18) {
    candidates.push({ q: "How does hydration affect energy this late in the day?", icon: "💧" });
  }

  const picked = candidates.slice(0, 3);
  if (picked.length < 3) {
    const offset = seed % FALLBACK_POOL.length;
    const rotated = [...FALLBACK_POOL.slice(offset), ...FALLBACK_POOL.slice(0, offset)];
    for (const item of rotated) {
      if (picked.length >= 3) break;
      if (!picked.some(p => p.q === item.q)) picked.push(item);
    }
  }
  return picked;
}

// Messages sent to Claude as conversational context — capped so cost/latency stay
// constant no matter how long the stored history grows. Nothing is trimmed in
// Supabase or on screen, only what's sent on each turn.
const CONTEXT_MESSAGE_LIMIT = 20;

export default function AskNora({ profile, targets, entries, waterMl, cyclePhase, activeChallenges, messages, sendMessage, clearMessages }) {
  const [input,     setInput]     = useState("");
  const [loading,   setLoading]   = useState(false);
  const [supps,     setSupps]     = useState([]);
  const [boostRecs, setBoostRecs] = useState(null);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => {
    try { const s = localStorage.getItem("nora_supps_list"); setSupps(s ? JSON.parse(s) : []); } catch {}
    try {
      const br = localStorage.getItem("nora_boost_recs");
      if (br) { const p = JSON.parse(br); if (p.recs) setBoostRecs(p.recs); }
    } catch {}
  }, []);

  useEffect(() => {
    if (bottomRef.current) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }), 80);
    }
  }, [messages, loading]);

  const buildSystem = () => {
    const food      = entries.filter(e => e.type === "food");
    const totalCal  = food.reduce((s, e) => s + (e.calories  || 0), 0);
    const totalPro  = food.reduce((s, e) => s + (e.protein_g || 0), 0);
    const totalCarb = food.reduce((s, e) => s + (e.carbs_g   || 0), 0);
    const totalFat  = food.reduce((s, e) => s + (e.fat_g     || 0), 0);
    const totalFib  = food.reduce((s, e) => s + (e.fiber_g   || 0), 0);

    const tCal  = targets?.calories  || 2000;
    const tPro  = targets?.protein_g || 150;
    const tCarb = targets?.carbs_g   || 200;
    const tFat  = targets?.fat_g     || 65;
    const tFib  = targets?.fiber_g   || 30;
    const tWat  = targets?.water_ml  || 2000;

    const foodLog = food.length > 0
      ? food.map(e => {
          const parts = [`~${e.calories || 0} kcal`, `~${e.protein_g || 0}g protein`];
          if (e.carbs_g != null) parts.push(`~${e.carbs_g}g carbs`);
          if (e.fat_g   != null) parts.push(`~${e.fat_g}g fat`);
          if (e.fiber_g != null) parts.push(`~${e.fiber_g}g fibre`);
          return `• ${e.name} (${parts.join(", ")})`;
        }).join("\n")
      : "Nothing logged yet today.";

    const remCal  = Math.max(0, tCal  - Math.round(totalCal));
    const remPro  = Math.max(0, tPro  - Math.round(totalPro));
    const remCarb = Math.max(0, tCarb - Math.round(totalCarb));
    const remFat  = Math.max(0, tFat  - Math.round(totalFat));
    const remFib  = Math.max(0, tFib  - Math.round(totalFib));
    const remWat  = Math.max(0, tWat  - waterMl);

    const suppList  = supps.map(s => s.name).join(", ") || "none";
    const cycleInfo = cyclePhase ? `${cyclePhase.label} phase, day ${cyclePhase.day}. ${cyclePhase.tip}` : "Not applicable";
    // profile.perimenopause never existed as a field — the real signal is
    // biologicalContext, opt-in via biologicalTrackingEnabled.
    const bioNote = !profile?.biologicalTrackingEnabled ? ""
      : profile?.biologicalContext === "perimenopause" ? " (perimenopausal)"
      : profile?.biologicalContext === "menopause" ? " (postmenopausal)"
      : "";

    const challengeTitle = activeChallenges?.[0]?.title?.replace(/^✦ For Her - |^✦ For Him - /, "") || null;
    const now = new Date();
    const hour = now.getHours();
    const timeOfDay = hour < 5 ? "night" : hour < 12 ? "morning" : hour < 17 ? "afternoon" : hour < 21 ? "evening" : "night";
    const localTime = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const lang = (profile?.language || "English").trim();
    const langLine = lang.toLowerCase() !== "english"
      ? `\nCRITICAL: Respond entirely in ${lang}. Do not use English unless a word has absolutely no translation.`
      : "";

    let boostSection = "";
    if (boostRecs && !boostRecs._error) {
      const defs = boostRecs.deficiencies || [];
      if (defs.length > 0) {
        boostSection = "\nNUTRITIONAL GAPS (today's Boost analysis):\n" +
          defs.map(d => `• ${d.emoji || ""}${d.name}: ${d.reason || ""}`).join("\n");
      }
    }

    return `You are Nora — an elegant, evidence-based nutrition companion. You speak with precision and warmth. You have full access to this user's profile, daily food log, macro targets, and nutritional gap analysis.

USER PROFILE:
• Name: ${profile?.name || "User"} | Age: ${profile?.age || "—"} | Sex: ${profile?.sex || "—"}${bioNote}
• Activity: ${profile?.activity || "not specified"} | Goals: ${(profile?.goals || []).join(", ") || "general health"}
• Dietary preferences: ${profile?.preferences || "none stated"}

DAILY TARGETS:
• Calories: ${tCal} kcal | Protein: ${tPro}g | Carbs: ${tCarb}g | Fat: ${tFat}g | Fibre: ${tFib}g | Water: ${Math.round(tWat / 100) / 10}L

TODAY'S FOOD LOG:
${foodLog}
• Totals logged: ${Math.round(totalCal)} kcal | ${Math.round(totalPro)}g protein | ${Math.round(totalCarb)}g carbs | ${Math.round(totalFat)}g fat | ${Math.round(totalFib)}g fibre
• Water: ${Math.round(waterMl / 100) / 10}L | Supplements: ${suppList}

REMAINING TO TARGET:
• ${remCal} kcal | ${remPro}g protein | ${remCarb}g carbs | ${remFat}g fat | ${remFib}g fibre | ${Math.round(remWat / 100) / 10}L water
${boostSection}
CYCLE STATUS: ${cycleInfo}
TODAY'S CHALLENGE: ${challengeTitle || "None active"}
LOCAL TIME: ${localTime} (${timeOfDay})

ACCURACY RULES (non-negotiable):
- Ground all nutrition claims in established science (USDA, NHS, peer-reviewed guidelines). Never fabricate specific numbers.
- Nutritional values in the food log are user-logged estimates, not lab measurements — reflect this when citing them.
- If uncertain about something, say so clearly: "I'm not certain, but…" or "Current evidence suggests…"
- Do not invent studies, statistics, or micronutrient amounts you cannot verify with confidence.

PERSONALISATION BY SEX/BIOLOGICAL CONTEXT: use Sex and the biological context above (perimenopausal/postmenopausal, or the cycle status below) to genuinely shape nutrition guidance when relevant — don't just acknowledge them as demographic facts. Iron needs are strongly tied to menstrual blood loss: weight iron considerations higher for users actively cycling, but not by default for men or for perimenopausal/postmenopausal users unless the food log itself clearly lacks iron. For perimenopausal/postmenopausal users, bone health (calcium, vitamin D, weight-bearing movement) deserves more weight given accelerated bone density loss after oestrogen decline. Never invent claims beyond established science, and never bring this up unprompted if it isn't relevant to the user's actual question.

SAFETY RULES (non-negotiable):
- Never diagnose conditions, interpret lab results, or suggest medications.
- For symptoms, health conditions, or medication questions: briefly acknowledge, then recommend consulting a qualified healthcare provider.
- Clearly flag anything outside nutrition scope: "That's a medical question — I'd recommend speaking with your doctor."

RESPONSE STYLE:
- Elegant and precise. No filler phrases ("Great question!", "Absolutely!"). No unnecessary padding.
- 2–4 short paragraphs. Use **bold** for key figures and recommendations.
- Reference ${profile?.name || "the user"}'s actual logged data — never give generic advice when specific data is available.
- Use bullet or numbered lists only when presenting 3 or more items.
- Acknowledge what is going well before suggesting improvements.
- End with one concrete, specific action they can take today.${langLine}`;
  };

  const send = async (text) => {
    const userText = (text || input).trim();
    if (!userText || loading) return;
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";

    // Context sent to Claude is capped; full history still persists in Supabase.
    const context = [...messages.slice(-CONTEXT_MESSAGE_LIMIT), { role: "user", content: userText }]
      .map(m => ({ role: m.role, content: m.content }));
    setLoading(true);
    await sendMessage("user", userText);

    try {
      const reply = await callClaude(context, buildSystem(), 1000);
      await sendMessage("assistant", reply);
    } catch {
      await sendMessage("assistant", "I'm having a little trouble right now. Please try again in a moment.");
    }
    setLoading(false);
  };

  const suggestions = useMemo(() => {
    const food = entries.filter(e => e.type === "food");
    const totalPro = food.reduce((s, e) => s + (e.protein_g || 0), 0);
    const tPro = targets?.protein_g || 150;
    const tWat = targets?.water_ml  || 2000;
    const hour = new Date().getHours();
    const firstDeficiency = boostRecs && !boostRecs._error
      ? (boostRecs.deficiencies || [])[0]
      : null;

    return getContextualSuggestions({
      hasLoggedToday: food.length > 0,
      hour,
      challengeTitle: activeChallenges?.[0]?.title?.replace(/^✦ For Her - |^✦ For Him - /, "") || null,
      cyclePhase,
      deficiency: firstDeficiency?.name || null,
      proteinRemainingHigh: (tPro - totalPro) > tPro * 0.5,
      waterBelowHalfTarget: waterMl < tWat * 0.5,
    });
  }, [entries, targets, waterMl, cyclePhase, boostRecs, activeChallenges]);

  const showSuggestions = messages.length === 0;

  return (
    <>
      <style>{`
        @keyframes bounce { 0%,80%,100%{transform:translateY(0);opacity:.3} 40%{transform:translateY(-6px);opacity:1} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
      <AtmosphereBackground/>

      {/* Scrollable content — bottom padding clears fixed input + tab bar */}
      <div style={{ paddingBottom: 152 }}>

        {/* Header */}
        <div style={{ background: `linear-gradient(160deg,${C.greenDark} 0%,${C.green} 100%)`, padding: "20px 20px 18px", position: "relative", overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontFamily: serif, fontSize: 21, color: "#FDFAF5", fontWeight: 700, margin: 0, lineHeight: 1.2, letterSpacing: "-0.01em" }}>Ask Nora</h2>
              <p style={{ fontSize: 11, color: "rgba(253,250,245,0.55)", margin: 0, fontFamily: sans }}>Your personal nutrition companion</p>
            </div>
            {messages.length > 0 && (
              <button onClick={clearMessages} style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, padding: "6px 12px", fontSize: 11, color: "rgba(253,250,245,0.8)", cursor: "pointer", fontFamily: sans, letterSpacing: "0.03em", flexShrink: 0 }}>
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "16px 16px 0", display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Welcome + suggestions */}
          {showSuggestions && (
            <div style={{ animation: "fadeUp 0.4s ease" }}>
              <div style={{ backgroundColor: C.card, borderRadius: 16, border: `1px solid ${C.border}`, borderTop: `1px solid ${C.muted}`, padding: "22px 20px 20px", textAlign: "center", marginBottom: 14, position: "relative", overflow: "hidden" }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
                  <NoraAvatar size={48}/>
                </div>
                <p style={{ fontFamily: serif, fontSize: 19, color: C.green, fontWeight: 700, margin: "0 0 6px" }}>
                  Hello, {profile?.name || "there"} ✦
                </p>
                <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.7, margin: 0, fontFamily: sans }}>
                  I know your goals, today's food log, and your targets.<br/>Ask me anything about your nutrition.
                </p>
              </div>

              <p style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, margin: "0 0 10px", paddingLeft: 2, fontFamily: sans }}>Suggested questions</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {suggestions.map((s, i) => (
                  <button key={i} onClick={() => send(s.q)}
                    style={{ width: "100%", padding: "12px 15px", backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: 12, fontSize: 13, color: C.text, cursor: "pointer", textAlign: "left", fontFamily: sans, display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 17, flexShrink: 0 }}>{s.icon}</span>
                    <span>{s.q}</span>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ marginLeft:"auto", flexShrink:0 }}>
                      <path d="M3 6h6M7 4l2 2-2 2" stroke={C.muted} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message bubbles */}
          {messages.map((msg, i) => (
            <div key={msg.id ?? i} style={{ display: "flex", flexDirection: msg.role === "user" ? "row-reverse" : "row", gap: 8, alignItems: "flex-end", animation: "fadeUp 0.3s ease" }}>
              {msg.role === "assistant" && (
                <div style={{ flexShrink: 0, marginBottom: 2 }}><NoraAvatar size={26}/></div>
              )}
              <div style={{
                maxWidth: "85%",
                padding: msg.role === "user" ? "12px 15px" : "14px 16px",
                borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                backgroundColor: msg.role === "user" ? C.green : C.card,
                border: msg.role === "assistant" ? `1px solid ${C.border}` : "none",
                borderLeft: msg.role === "assistant" ? `2px solid ${C.muted}` : undefined,
                fontSize: 13,
                color: msg.role === "user" ? "#FDFAF5" : C.text,
                lineHeight: 1.75,
                wordBreak: "break-word",
                boxShadow: "0 1px 6px rgba(28,43,38,0.06)",
              }}>
                {msg.role === "assistant"
                  ? <FormattedText text={msg.content}/>
                  : <span style={{ fontFamily: sans }}>{msg.content}</span>}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
              <NoraAvatar size={26}/>
              <div style={{ padding: "14px 18px", backgroundColor: C.card, border: `1px solid ${C.border}`, borderLeft: `2px solid ${C.muted}`, borderRadius: "18px 18px 18px 4px" }}>
                <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                  {[0, 1, 2].map(j => (
                    <div key={j} style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: C.muted, animation: `bounce 1.3s ease-in-out ${j * 0.22}s infinite` }}/>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef}/>
        </div>
      </div>

      {/* Fixed chat input */}
      <div style={{ position: "fixed", bottom: 60, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, backgroundColor: "rgba(245,240,232,0.97)", borderTop: `1px solid ${C.border}`, padding: "10px 16px 12px", zIndex: 9, backdropFilter: "blur(8px)", boxSizing: "border-box" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => { setInput(e.target.value); e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 108) + "px"; }}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder={`Ask Nora anything${profile?.language && profile.language.toLowerCase() !== "english" ? ` — replies in ${profile.language}` : ""}…`}
            rows={1}
            style={{ flex:1, border:`1px solid ${C.border}`, borderRadius:12, padding:"11px 14px", fontSize:14, color:C.text, backgroundColor:"#FDFAF5", outline:"none", resize:"none", fontFamily:sans, lineHeight:1.5, overflow:"hidden", minHeight:44, maxHeight:108, boxSizing:"border-box" }}
          />
          <button onClick={() => send()} disabled={!input.trim() || loading}
            style={{ width:44, height:44, flexShrink:0, borderRadius:12, backgroundColor:input.trim()&&!loading?C.green:C.track, border:"none", cursor:input.trim()&&!loading?"pointer":"not-allowed", display:"flex", alignItems:"center", justifyContent:"center", transition:"background-color 0.2s" }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M15.5 2.5L2 8l5.5 1.5 1.5 6 6.5-13Z" stroke={input.trim()&&!loading?"#FDFAF5":C.muted} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        <p style={{ fontSize: 10, color: C.muted, textAlign: "center", margin: "5px 0 0", fontFamily: sans }}>Enter to send · Shift+Enter for new line</p>
      </div>
    </>
  );
}

// ─── TEXT RENDERER ────────────────────────────────────────────────────────────
function FormattedText({ text }) {
  const paragraphs = text.split(/\n\n+/);
  return (
    <div style={{ fontFamily: serif, fontStyle: "italic", fontWeight: 500 }}>
      {paragraphs.map((para, pi) => {
        const lines = para.split("\n");
        return (
          <div key={pi} style={{ marginBottom: pi < paragraphs.length - 1 ? 10 : 0 }}>
            {lines.map((line, li) => {
              if (!line.trim()) return null;
              const numMatch = line.match(/^(\d+)\.\s(.+)/);
              if (numMatch) return (
                <div key={li} style={{ display:"flex", gap:6, marginBottom:3 }}>
                  <span style={{ color:C.green, fontWeight:700, minWidth:16, flexShrink:0 }}>{numMatch[1]}.</span>
                  <span><Inline text={numMatch[2]}/></span>
                </div>
              );
              if (/^[-•]\s/.test(line)) return (
                <div key={li} style={{ display:"flex", gap:7, marginBottom:3 }}>
                  <span style={{ color:C.green, flexShrink:0 }}>·</span>
                  <span><Inline text={line.replace(/^[-•]\s/,"")}/></span>
                </div>
              );
              return <p key={li} style={{ margin:"0 0 2px" }}><Inline text={line}/></p>;
            })}
          </div>
        );
      })}
    </div>
  );
}

function Inline({ text }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return (
    <span>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) return <strong key={i} style={{ fontWeight:700, color:C.green }}>{part.slice(2,-2)}</strong>;
        if (part.startsWith("*")  && part.endsWith("*"))  return <em key={i}>{part.slice(1,-1)}</em>;
        return part;
      })}
    </span>
  );
}
