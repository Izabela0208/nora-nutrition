import { useState } from "react";
import { C, card, serif, sans, inp } from "./noraTokens";
import { NoraAvatar } from "./NoraIcons";

const GOAL_OPTIONS = ["Lose weight","Build muscle","Maintain weight","Improve energy","Just be healthier","Be aware of my intakes"];
const ACTIVITIES   = ["Sedentary","Lightly active","Moderately active","Very active","Athlete"];

export default function OnboardingFlow({ onComplete }) {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState({
    name:"", age:"", sex:"", heightCm:"", heightFt:"", heightIn:"",
    weightKg:"", weightLbs:"", heightUnit:"cm", weightUnit:"kg",
    goals:[], activity:"", preferences:"", language:"",
    perimenopause: false, cycleLength: 28,
  });
  const [selectedGoals, setSelectedGoals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const toggleGoal = (g) => setSelectedGoals(prev => prev.includes(g) ? prev.filter(x=>x!==g) : [...prev,g]);

  const isStep0Valid = profile.name.trim() && profile.age;
  const heightOk = profile.heightUnit === "cm" ? profile.heightCm : profile.heightFt;
  const weightOk = profile.weightUnit === "kg" ? profile.weightKg : profile.weightLbs;
  const isStep1Valid = heightOk && weightOk;
  const isStep2Valid = profile.sex && selectedGoals.length > 0 && profile.activity;

  const callClaude = async (sys, user, maxTokens=1200) => {
    const res = await fetch("/api/chat", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body:JSON.stringify({ model:"claude-sonnet-4-5", max_tokens:maxTokens, system:sys, messages:[{role:"user",content:user}] }),
    });
    const data = await res.json();
    return data.content?.map(b=>b.text||"").join("")||"";
  };

  const parseJSON = (text) => {
    try { return JSON.parse(text.replace(/```json|```/g,"").trim()); } catch {
      const a=text.match(/\[[\s\S]*\]/); if(a){try{return JSON.parse(a[0]);}catch{}}
      const o=text.match(/\{[\s\S]*\}/); if(o) return JSON.parse(o[0]);
      throw new Error("parse error");
    }
  };

  const handleSubmit = async () => {
    setLoading(true); setError("");
    try {
      const hCm = profile.heightUnit==="cm" ? profile.heightCm : Math.round(parseInt(profile.heightFt)*30.48+parseInt(profile.heightIn||0)*2.54);
      const wKg = profile.weightUnit==="kg" ? profile.weightKg : Math.round(parseFloat(profile.weightLbs)*0.453592);
      const lang = profile.language.trim();
      const langNote = lang && lang.toLowerCase() !== "english"
        ? ` Respond entirely in ${lang}, including the welcome_message.` : "";
      const text = await callClaude(
        "You are Nora, a warm nutritionist AI. Return ONLY valid JSON, no preamble.",
        `Calculate daily nutrition targets. User: ${profile.name}, sex: ${profile.sex||"not specified"}, age ${profile.age}, height ${hCm}cm, weight ${wKg}kg, goals: ${selectedGoals.join(", ")}, activity: ${profile.activity}, preferences: ${profile.preferences||"none"}${profile.perimenopause?" (perimenopausal)":""}.${langNote} Use Mifflin-St Jeor. Return JSON: { "calories":number, "protein_g":number, "carbs_g":number, "fat_g":number, "fiber_g":number, "water_ml":number, "key_micronutrients":["string"], "welcome_message":"2-3 warm sentences" }`
      );
      const data = parseJSON(text);
      const finalProfile = { ...profile, goals: selectedGoals };
      onComplete(finalProfile, data);
    } catch { setError("Something went wrong. Please try again."); }
    setLoading(false);
  };

  const btnBase = { border:"none", borderRadius:10, padding:"13px 20px", fontFamily:sans, fontSize:14, fontWeight:500, letterSpacing:"0.03em", transition:"background-color 0.15s ease", display:"flex", alignItems:"center", justifyContent:"center", gap:7, minHeight:44 };
  const toggle = (units, active, onChange) => (
    <div style={{ display:"flex", gap:2, backgroundColor:C.greenLight, borderRadius:8, padding:3 }}>
      {units.map(u=>(
        <button key={u} type="button" onClick={()=>onChange(u)} style={{ padding:"4px 12px", borderRadius:6, border:"none", fontSize:12, fontWeight:500, cursor:"pointer", backgroundColor:active===u?"white":C.greenLight, color:active===u?C.green:C.muted, boxShadow:active===u?"0 1px 4px rgba(0,0,0,0.1)":"none", transition:"all 0.15s" }}>{u}</button>
      ))}
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", backgroundColor:C.bg, fontFamily:sans }}>
      {/* Hero */}
      <div style={{ width:"100%", height:240, overflow:"hidden", position:"relative" }}>
        <img src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80&auto=format&fit=crop&crop=top" alt="" loading="lazy"
          style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(to bottom, rgba(30,52,41,0.15) 0%, rgba(245,240,232,1) 96%)" }}/>
        <div style={{ position:"absolute", bottom:0, left:0, right:0, display:"flex", justifyContent:"center", paddingBottom:4 }}>
          <NoraAvatar size={52}/>
        </div>
      </div>

      <div style={{ display:"flex", justifyContent:"center", padding:"0 20px 48px" }}>
      <div style={{ width:"100%", maxWidth:400 }}>

        <div style={{ textAlign:"center", marginBottom:32 }}>
          <h1 style={{ fontFamily:serif, fontSize:30, color:C.green, margin:"12px 0 4px", fontWeight:600, letterSpacing:"-0.01em" }}>Nora</h1>
          <p style={{ color:C.muted, fontSize:13, letterSpacing:"0.05em" }}>Your personal nutrition companion</p>
        </div>

        {/* Step indicators */}
        <div style={{ display:"flex", justifyContent:"center", gap:8, marginBottom:28 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{ height:2, width:i===step?28:12, borderRadius:2, backgroundColor:i<=step?C.gold:C.border, transition:"all 0.3s ease" }}/>
          ))}
        </div>

        <div style={{ ...card, padding:28 }}>

          {/* ── Step 0: Name & Age ─────────────────────────────── */}
          {step === 0 && (
            <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
              <p style={{ fontFamily:serif, fontSize:18, color:C.green, fontWeight:500, margin:0 }}>Let's get acquainted</p>
              <div>
                <label style={{ fontSize:12, color:C.muted, fontWeight:500, letterSpacing:"0.05em", textTransform:"uppercase", display:"block", marginBottom:6 }}>Your name</label>
                <input className="focus-gold" style={inp} placeholder="e.g. Alexandra" value={profile.name} onChange={e=>setProfile(p=>({...p,name:e.target.value}))}
                  onKeyDown={e=>e.key==="Enter"&&isStep0Valid&&setStep(1)}/>
              </div>
              <div>
                <label style={{ fontSize:12, color:C.muted, fontWeight:500, letterSpacing:"0.05em", textTransform:"uppercase", display:"block", marginBottom:6 }}>Age</label>
                <input className="focus-gold" type="number" style={inp} placeholder="e.g. 28" value={profile.age} onChange={e=>setProfile(p=>({...p,age:e.target.value}))}
                  onKeyDown={e=>e.key==="Enter"&&isStep0Valid&&setStep(1)}/>
              </div>
              <button disabled={!isStep0Valid} onClick={()=>setStep(1)} style={{ ...btnBase, width:"100%", backgroundColor:isStep0Valid?C.green:"#C8D5D1", color:C.bg, cursor:isStep0Valid?"pointer":"not-allowed" }}>
                Continue
              </button>
            </div>
          )}

          {/* ── Step 1: Height & Weight ────────────────────────── */}
          {step === 1 && (
            <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
              <p style={{ fontFamily:serif, fontSize:18, color:C.green, fontWeight:500, margin:0 }}>Your measurements</p>

              {/* Height */}
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                  <label style={{ fontSize:12, color:C.muted, fontWeight:500, letterSpacing:"0.05em", textTransform:"uppercase" }}>Height</label>
                  {toggle(["cm","ft"], profile.heightUnit, u=>setProfile(p=>({...p,heightUnit:u})))}
                </div>
                {profile.heightUnit==="cm"
                  ? <input className="focus-gold" type="number" style={inp} placeholder="e.g. 170" value={profile.heightCm} onChange={e=>setProfile(p=>({...p,heightCm:e.target.value}))}/>
                  : <div style={{ display:"flex", gap:8 }}>
                      <input className="focus-gold" type="number" style={{...inp,width:"50%"}} placeholder="Feet" value={profile.heightFt} onChange={e=>setProfile(p=>({...p,heightFt:e.target.value}))}/>
                      <input className="focus-gold" type="number" style={{...inp,width:"50%"}} placeholder="Inches" value={profile.heightIn} onChange={e=>setProfile(p=>({...p,heightIn:e.target.value}))}/>
                    </div>
                }
              </div>

              {/* Weight */}
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                  <label style={{ fontSize:12, color:C.muted, fontWeight:500, letterSpacing:"0.05em", textTransform:"uppercase" }}>Weight</label>
                  {toggle(["kg","lbs"], profile.weightUnit, u=>setProfile(p=>({...p,weightUnit:u})))}
                </div>
                <input className="focus-gold" type="number" style={inp} placeholder={profile.weightUnit==="kg"?"e.g. 68":"e.g. 150"}
                  value={profile.weightUnit==="kg"?profile.weightKg:profile.weightLbs}
                  onChange={e=>setProfile(p=>profile.weightUnit==="kg"?{...p,weightKg:e.target.value}:{...p,weightLbs:e.target.value})}/>
              </div>

              <div style={{ display:"flex", gap:10 }}>
                <button onClick={()=>setStep(0)} style={{ ...btnBase, flex:1, backgroundColor:"transparent", color:C.gold, border:`1px solid ${C.gold}`, cursor:"pointer" }}>← Back</button>
                <button disabled={!isStep1Valid} onClick={()=>setStep(2)} style={{ ...btnBase, flex:2, backgroundColor:isStep1Valid?C.green:"#C8D5D1", color:C.bg, cursor:isStep1Valid?"pointer":"not-allowed" }}>Continue</button>
              </div>
            </div>
          )}

          {/* ── Step 2: Sex, Goals, Lifestyle ─────────────────── */}
          {step === 2 && (
            <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
              <p style={{ fontFamily:serif, fontSize:18, color:C.green, fontWeight:500, margin:0 }}>Goals & lifestyle</p>

              {/* Sex */}
              <div>
                <label style={{ fontSize:12, color:C.muted, fontWeight:500, letterSpacing:"0.05em", textTransform:"uppercase", display:"block", marginBottom:8 }}>Biological sex</label>
                <div style={{ display:"flex", gap:8 }}>
                  {[{v:"female",l:"Female"},{v:"male",l:"Male"}].map(({v,l})=>(
                    <button key={v} type="button" onClick={()=>setProfile(p=>({...p,sex:v}))} style={{ flex:1, padding:"12px", borderRadius:10, border:`1px solid ${profile.sex===v?C.green:C.border}`, backgroundColor:profile.sex===v?C.green:C.card, color:profile.sex===v?C.bg:C.text, fontSize:14, fontWeight:profile.sex===v?500:400, cursor:"pointer", transition:"all 0.15s" }}>{l}</button>
                  ))}
                </div>
                <p style={{ fontSize:11, color:C.muted, margin:"6px 0 0" }}>Used for accurate targets and cycle tracking</p>
              </div>

              {/* Perimenopause — females only */}
              {profile.sex === "female" && (
                <div style={{ padding:"12px 14px", backgroundColor:C.greenLight, borderRadius:10, display:"flex", alignItems:"center", gap:12 }}>
                  <div style={{ flex:1 }}>
                    <p style={{ fontSize:13, color:C.text, fontWeight:500, margin:0 }}>Perimenopausal</p>
                    <p style={{ fontSize:11, color:C.muted, margin:"2px 0 0" }}>Adjusts nutrition targets and recommendations</p>
                  </div>
                  <button type="button" onClick={()=>setProfile(p=>({...p,perimenopause:!p.perimenopause}))} style={{ width:44, height:24, borderRadius:12, backgroundColor:profile.perimenopause?C.green:C.border, border:"none", cursor:"pointer", position:"relative", transition:"background-color 0.2s", flexShrink:0 }}>
                    <div style={{ width:18, height:18, borderRadius:"50%", backgroundColor:"white", position:"absolute", top:3, left:profile.perimenopause?23:3, transition:"left 0.2s", boxShadow:"0 1px 3px rgba(0,0,0,0.2)" }}/>
                  </button>
                </div>
              )}

              {/* Goals */}
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                  <label style={{ fontSize:12, color:C.muted, fontWeight:500, letterSpacing:"0.05em", textTransform:"uppercase" }}>Goals</label>
                  {selectedGoals.length > 0 && <span style={{ fontSize:11, color:C.gold, fontWeight:500 }}>{selectedGoals.length} selected</span>}
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                  {GOAL_OPTIONS.map(g => {
                    const sel = selectedGoals.includes(g);
                    return (
                      <button type="button" key={g} onClick={()=>toggleGoal(g)} style={{ padding:"10px 12px", borderRadius:10, border:`1px solid ${sel?C.green:C.border}`, backgroundColor:sel?C.green:C.card, color:sel?C.bg:C.text, fontSize:13, fontWeight:sel?500:400, cursor:"pointer", textAlign:"left", transition:"all 0.15s ease" }}>
                        {sel && <span style={{ marginRight:5, opacity:0.8 }}>✓</span>}{g}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Activity */}
              <div>
                <label style={{ fontSize:12, color:C.muted, fontWeight:500, letterSpacing:"0.05em", textTransform:"uppercase", display:"block", marginBottom:8 }}>Activity level</label>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                  {ACTIVITIES.map(a=>(
                    <button key={a} onClick={()=>setProfile(p=>({...p,activity:a}))} style={{ padding:"7px 12px", borderRadius:8, border:`1px solid ${profile.activity===a?C.green:C.border}`, backgroundColor:profile.activity===a?C.green:C.card, color:profile.activity===a?C.bg:C.text, fontSize:12, fontWeight:profile.activity===a?500:400, cursor:"pointer", transition:"all 0.15s" }}>{a}</button>
                  ))}
                </div>
              </div>

              {/* Dietary preferences */}
              <div>
                <label style={{ fontSize:12, color:C.muted, fontWeight:500, letterSpacing:"0.05em", textTransform:"uppercase", display:"block", marginBottom:6 }}>Dietary preferences <span style={{ color:C.border, fontSize:11, textTransform:"none", letterSpacing:0 }}>— optional</span></label>
                <input className="focus-gold" style={inp} placeholder="e.g. vegetarian, gluten-free" value={profile.preferences} onChange={e=>setProfile(p=>({...p,preferences:e.target.value}))}/>
              </div>

              {/* Language — free text */}
              <div>
                <label style={{ fontSize:12, color:C.muted, fontWeight:500, letterSpacing:"0.05em", textTransform:"uppercase", display:"block", marginBottom:6 }}>Language <span style={{ color:C.border, fontSize:11, textTransform:"none", letterSpacing:0 }}>— optional</span></label>
                <input className="focus-gold" style={inp} placeholder="English, Română, Español, 中文…" value={profile.language} onChange={e=>setProfile(p=>({...p,language:e.target.value}))}/>
                <p style={{ fontSize:11, color:C.muted, margin:"5px 0 0" }}>Nora will respond in any language you type here</p>
              </div>

              {/* Cycle tracking — females only */}
              {profile.sex === "female" && (
                <div style={{ padding:"14px", backgroundColor:C.goldLight, borderRadius:10, border:`1px solid ${C.gold}30` }}>
                  <p style={{ fontSize:12, fontWeight:600, color:C.amber, margin:"0 0 10px", letterSpacing:"0.04em", textTransform:"uppercase" }}>Cycle tracking</p>
                  <label style={{ fontSize:12, color:C.muted, fontWeight:500, display:"block", marginBottom:6 }}>First day of last period</label>
                  <input type="date" className="focus-gold" style={{...inp, colorScheme:"light", marginBottom:10}} value={profile.lastPeriod||""} onChange={e=>setProfile(p=>({...p,lastPeriod:e.target.value}))}/>
                  <label style={{ fontSize:12, color:C.muted, fontWeight:500, display:"block", marginBottom:6 }}>Average cycle length</label>
                  <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                    {[21,24,28,30,32,35].map(n=>(
                      <button key={n} type="button" onClick={()=>setProfile(p=>({...p,cycleLength:n}))} style={{ padding:"6px 10px", borderRadius:7, border:`1px solid ${profile.cycleLength===n?C.green:C.border}`, backgroundColor:profile.cycleLength===n?C.green:C.card, color:profile.cycleLength===n?C.bg:C.text, fontSize:12, cursor:"pointer", fontWeight:profile.cycleLength===n?600:400, transition:"all 0.15s" }}>{n}d</button>
                    ))}
                  </div>
                </div>
              )}

              {error && <div style={{ padding:"10px 14px", backgroundColor:C.errorBg, border:`1px solid ${C.error}20`, borderRadius:10, fontSize:13, color:C.error }}>{error}</div>}
              <div style={{ display:"flex", gap:10 }}>
                <button onClick={()=>setStep(1)} style={{ ...btnBase, flex:1, backgroundColor:"transparent", color:C.gold, border:`1px solid ${C.gold}`, cursor:"pointer" }}>← Back</button>
                <button disabled={!isStep2Valid||loading} onClick={handleSubmit} style={{ ...btnBase, flex:2, backgroundColor:isStep2Valid&&!loading?C.green:"#C8D5D1", color:C.bg, cursor:isStep2Valid&&!loading?"pointer":"not-allowed" }}>
                  {loading
                    ? <span style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <span style={{ width:14, height:14, border:`2px solid ${C.bg}`, borderTopColor:"transparent", borderRadius:"50%", display:"inline-block", animation:"spin 0.8s linear infinite" }}/>
                        Calculating…
                      </span>
                    : "Calculate my targets"}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
