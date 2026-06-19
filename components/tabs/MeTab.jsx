import { C, card, serif, sans, inp, localDateStr } from "../noraTokens";
import { NoraAvatar, LeafDecor } from "../NoraIcons";

const LANGUAGES = [
  { code:"en", label:"English" },
  { code:"es", label:"Español" },
  { code:"fr", label:"Français" },
  { code:"de", label:"Deutsch" },
  { code:"it", label:"Italiano" },
  { code:"pt", label:"Português" },
  { code:"ro", label:"Română" },
  { code:"pl", label:"Polski" },
  { code:"nl", label:"Nederlands" },
  { code:"sv", label:"Svenska" },
];

export default function MeTab({
  profile, setProfile, targets,
  cycle, setCycle, cycleSaved, setCycleSaved, cyclePhase, saveCycle,
  cycleSymptoms, setCycleSymptoms,
  healthData, setHealthData, healthSaved, setHealthSaved,
  savedMealPlans, setSavedMealPlans,
  setMealPlan,
  resetProfile,
  setEntries, setWaterMl, setCheckin,
  handleLanguageChange,
}) {
  const today = localDateStr();
  const isFemale = profile.sex === "female";

  const handleSaveProfile = () => {
    try { localStorage.setItem("nora_profile", JSON.stringify(profile)); } catch {}
  };

  return (
    <div style={{ padding:"20px 16px 100px", display:"flex", flexDirection:"column", gap:14 }}>

      {/* Section head */}
      <div style={{ marginBottom:4 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <LeafDecor size={18}/>
          <h2 style={{ fontFamily:serif, fontSize:22, color:C.green, fontWeight:600, margin:0 }}>Me</h2>
        </div>
      </div>

      {/* Profile card */}
      <div style={{ ...card, padding:20 }}>
        <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:20 }}>
          <div style={{ width:52, height:52, borderRadius:"50%", backgroundColor:C.green, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, fontWeight:700, color:C.bg, flexShrink:0, fontFamily:sans }}>
            {profile.name?.[0]?.toUpperCase()}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <h3 style={{ fontSize:17, fontWeight:600, color:C.text, margin:0 }}>{profile.name}</h3>
            <p style={{ fontSize:12, color:C.muted, margin:"2px 0 6px" }}>{profile.activity}</p>
            <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
              {profile.goals.map(g=>(
                <span key={g} style={{ fontSize:11, backgroundColor:C.greenLight, color:C.green, padding:"3px 8px", borderRadius:20, border:`1px solid ${C.border}` }}>{g}</span>
              ))}
            </div>
          </div>
        </div>
        {targets && (
          <>
            <p style={{ fontSize:11, fontWeight:600, color:C.muted, textTransform:"uppercase", letterSpacing:"0.06em", margin:"0 0 10px" }}>Daily Targets</p>
            {[
              {label:"Energy",        val:`${targets.calories} kcal`},
              {label:"Protein",       val:`${targets.protein_g} g`},
              {label:"Carbohydrates", val:`${targets.carbs_g} g`},
              {label:"Fat",           val:`${targets.fat_g} g`},
              {label:"Fibre",         val:`${targets.fiber_g} g`},
              {label:"Water",         val:`${Math.round(targets.water_ml/100)/10} L`},
            ].map((item,i,arr)=>(
              <div key={item.label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:i<arr.length-1?`1px solid ${C.border}`:"none" }}>
                <span style={{ fontSize:13, color:C.text }}>{item.label}</span>
                <span style={{ fontSize:13, fontWeight:600, color:C.green }}>{item.val}</span>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Language selector */}
      <div style={{ ...card, padding:20 }}>
        <p style={{ fontSize:14, fontWeight:600, color:C.text, margin:"0 0 4px" }}>Language</p>
        <p style={{ fontSize:12, color:C.muted, margin:"0 0 12px" }}>Nora will respond and display the app in your chosen language</p>
        <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
          {LANGUAGES.map(lang=>(
            <button key={lang.code} onClick={()=>handleLanguageChange(lang.code, lang.label)} style={{ padding:"8px 14px", borderRadius:10, border:`1px solid ${(profile.language||"en")===lang.code?C.green:C.border}`, backgroundColor:(profile.language||"en")===lang.code?C.green:C.card, color:(profile.language||"en")===lang.code?C.bg:C.text, fontSize:13, fontWeight:(profile.language||"en")===lang.code?600:400, cursor:"pointer", transition:"all 0.15s" }}>
              {lang.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cycle tracking — female only */}
      {isFemale && (
        <div style={{ ...card, overflow:"hidden" }}>
          <div style={{ backgroundColor:cyclePhase?cyclePhase.color:C.green, padding:"14px 18px" }}>
            <p style={{ fontSize:14, fontWeight:600, color:"white", margin:0 }}>Cycle Tracking</p>
            {cyclePhase
              ? <p style={{ fontSize:11, color:"rgba(255,255,255,0.75)", margin:"2px 0 0" }}>{cyclePhase.label} phase · day {cyclePhase.day} of {cycle.cycleLength}-day cycle</p>
              : <p style={{ fontSize:11, color:"rgba(255,255,255,0.75)", margin:"2px 0 0" }}>Add your cycle data to unlock phase insights</p>}
          </div>
          <div style={{ padding:16, display:"flex", flexDirection:"column", gap:12 }}>
            <div>
              <label style={{ fontSize:11, color:C.muted, fontWeight:500, textTransform:"uppercase", letterSpacing:"0.05em", display:"block", marginBottom:6 }}>First day of last period</label>
              <input className="focus-gold" type="date" style={{ ...inp, colorScheme:"light" }} value={cycle.lastPeriod} onChange={e=>{ setCycle(p=>({...p,lastPeriod:e.target.value})); setCycleSaved(false); }}/>
            </div>
            <div>
              <label style={{ fontSize:11, color:C.muted, fontWeight:500, textTransform:"uppercase", letterSpacing:"0.05em", display:"block", marginBottom:6 }}>Average cycle length</label>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                {[21,24,28,30,32,35].map(n=>(
                  <button key={n} onClick={()=>setCycle(p=>({...p,cycleLength:n}))} style={{ padding:"8px 12px", borderRadius:8, border:`1px solid ${cycle.cycleLength===n?C.green:C.border}`, backgroundColor:cycle.cycleLength===n?C.green:C.card, color:cycle.cycleLength===n?C.bg:C.text, fontSize:13, cursor:"pointer", fontWeight:cycle.cycleLength===n?600:400, transition:"all 0.15s" }}>{n} days</button>
                ))}
              </div>
            </div>
            {cyclePhase && (
              <div style={{ backgroundColor:C.greenLight, borderRadius:10, padding:"10px 14px" }}>
                <p style={{ fontSize:12, color:C.green, fontWeight:600, margin:"0 0 3px" }}>{cyclePhase.label} phase · day {cyclePhase.day}</p>
                <p style={{ fontSize:12, color:C.muted, margin:0, lineHeight:1.5 }}>{cyclePhase.tip}</p>
              </div>
            )}
            <button onClick={()=>{ saveCycle(cycle); setCycleSaved(true); }} disabled={!cycle.lastPeriod} style={{ width:"100%", padding:"12px", backgroundColor:cycle.lastPeriod?C.green:"#C8D5D1", color:C.bg, border:"none", borderRadius:10, fontSize:13, fontWeight:500, cursor:cycle.lastPeriod?"pointer":"not-allowed" }}>
              {cycleSaved?"Cycle data saved ✓":"Save cycle data"}
            </button>

            {/* Daily symptom tracking */}
            {cycle.lastPeriod && (
              <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:14 }}>
                <p style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.06em", margin:"0 0 12px" }}>Today's symptoms</p>
                {[
                  {key:"energy", label:"Energy", low:"Low", high:"High"},
                  {key:"mood",   label:"Mood",   low:"Low", high:"Great"},
                  {key:"pain",   label:"Pain",   low:"None", high:"Severe"},
                ].map(({key,label,low,high})=>(
                  <div key={key} style={{ marginBottom:12 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                      <span style={{ fontSize:12, fontWeight:500, color:C.text }}>{label}</span>
                      <span style={{ fontSize:11, color:C.muted }}>{cycleSymptoms[key]}/5</span>
                    </div>
                    <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                      <span style={{ fontSize:10, color:C.muted, width:32, textAlign:"right", flexShrink:0 }}>{low}</span>
                      <div style={{ flex:1, display:"flex", gap:4 }}>
                        {[1,2,3,4,5].map(v=>(
                          <button key={v} onClick={()=>{
                            const updated={...cycleSymptoms,[key]:v};
                            setCycleSymptoms(updated);
                            try{localStorage.setItem(`nora_symptoms_${today}`,JSON.stringify(updated));}catch{}
                          }} style={{ flex:1, height:28, borderRadius:6, border:`1px solid ${cycleSymptoms[key]===v?C.green:C.border}`, backgroundColor:cycleSymptoms[key]===v?C.green:C.card, cursor:"pointer", transition:"all 0.15s", fontSize:11, color:cycleSymptoms[key]===v?C.bg:C.muted, fontWeight:cycleSymptoms[key]===v?700:400 }}>{v}</button>
                        ))}
                      </div>
                      <span style={{ fontSize:10, color:C.muted, width:32, flexShrink:0 }}>{high}</span>
                    </div>
                  </div>
                ))}
                <div>
                  <label style={{ fontSize:12, fontWeight:500, color:C.text, display:"block", marginBottom:5 }}>Cravings today</label>
                  <input className="focus-gold" style={{ ...inp, fontSize:13 }} placeholder="e.g. chocolate, salty snacks…" value={cycleSymptoms.cravings} onChange={e=>{
                    const updated={...cycleSymptoms,cravings:e.target.value};
                    setCycleSymptoms(updated);
                    try{localStorage.setItem(`nora_symptoms_${today}`,JSON.stringify(updated));}catch{}
                  }}/>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Health data */}
      <div style={{ ...card, overflow:"hidden" }}>
        <div style={{ padding:"15px 18px", borderBottom:`1px solid ${C.border}` }}>
          <p style={{ fontSize:14, fontWeight:600, color:C.text, margin:0 }}>Health Data</p>
          <p style={{ fontSize:11, color:C.muted, margin:"2px 0 0" }}>Manually sync your activity and sleep</p>
        </div>
        <div style={{ padding:16, display:"flex", flexDirection:"column", gap:12 }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <div>
              <label style={{ fontSize:11, color:C.muted, fontWeight:500, textTransform:"uppercase", letterSpacing:"0.05em", display:"block", marginBottom:5 }}>Steps today</label>
              <input className="focus-gold" type="number" style={inp} placeholder="e.g. 8500" value={healthData.steps} onChange={e=>setHealthData(p=>({...p,steps:e.target.value}))}/>
            </div>
            <div>
              <label style={{ fontSize:11, color:C.muted, fontWeight:500, textTransform:"uppercase", letterSpacing:"0.05em", display:"block", marginBottom:5 }}>Sleep hours</label>
              <input className="focus-gold" type="number" style={inp} placeholder="e.g. 7.5" value={healthData.sleep} onChange={e=>setHealthData(p=>({...p,sleep:e.target.value}))}/>
            </div>
          </div>
          <div>
            <label style={{ fontSize:11, color:C.muted, fontWeight:500, textTransform:"uppercase", letterSpacing:"0.05em", display:"block", marginBottom:5 }}>Sleep quality</label>
            <div style={{ display:"flex", gap:6 }}>
              {["poor","ok","good","great"].map(q=>(
                <button key={q} onClick={()=>setHealthData(p=>({...p,sleepQuality:q}))} style={{ flex:1, padding:"8px 0", borderRadius:8, border:`1px solid ${healthData.sleepQuality===q?C.green:C.border}`, backgroundColor:healthData.sleepQuality===q?C.green:C.card, color:healthData.sleepQuality===q?C.bg:C.muted, fontSize:12, fontWeight:healthData.sleepQuality===q?500:400, cursor:"pointer", textTransform:"capitalize", transition:"all 0.15s" }}>{q}</button>
              ))}
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <div>
              <label style={{ fontSize:11, color:C.muted, fontWeight:500, textTransform:"uppercase", letterSpacing:"0.05em", display:"block", marginBottom:5 }}>Resting HR</label>
              <input className="focus-gold" type="number" style={inp} placeholder="e.g. 62 bpm" value={healthData.heartRate} onChange={e=>setHealthData(p=>({...p,heartRate:e.target.value}))}/>
            </div>
            <div>
              <label style={{ fontSize:11, color:C.muted, fontWeight:500, textTransform:"uppercase", letterSpacing:"0.05em", display:"block", marginBottom:5 }}>Workout min</label>
              <input className="focus-gold" type="number" style={inp} placeholder="e.g. 45" value={healthData.workoutDuration} onChange={e=>setHealthData(p=>({...p,workoutDuration:e.target.value}))}/>
            </div>
          </div>
          <button onClick={()=>setHealthSaved(true)} style={{ width:"100%", padding:"12px", backgroundColor:C.green, color:C.bg, border:"none", borderRadius:10, fontSize:13, fontWeight:500, cursor:"pointer" }}>{healthSaved?"Health data updated ✓":"Save health data"}</button>
        </div>
      </div>

      {/* Reset buttons */}
      <button onClick={()=>{ setEntries([]); setCheckin(""); setWaterMl(0); try{localStorage.removeItem("nora_today_water");localStorage.removeItem("nora_today_entries");}catch{} }} style={{ width:"100%", padding:"13px", backgroundColor:"transparent", border:`1px solid ${C.border}`, borderRadius:12, fontSize:13, color:C.error, cursor:"pointer" }}>Reset today's log</button>
      <button onClick={resetProfile} style={{ width:"100%", padding:"13px", backgroundColor:"transparent", border:`1px solid ${C.border}`, borderRadius:12, fontSize:13, color:C.muted, cursor:"pointer" }}>Change profile</button>

      {/* About */}
      <div style={{ ...card, padding:"18px 20px" }}>
        <div style={{ display:"flex", gap:12, alignItems:"center", marginBottom:10 }}>
          <NoraAvatar size={32}/>
          <div>
            <p style={{ fontSize:14, fontWeight:600, color:C.text, margin:0 }}>About Nora</p>
            <p style={{ fontSize:11, color:C.muted, margin:0 }}>AI Nutrition Companion</p>
          </div>
        </div>
        <p style={{ fontSize:13, color:C.muted, lineHeight:1.7, margin:0 }}>Nora is powered by Claude, Anthropic's AI. She analyses your nutrition data, provides personalised daily targets, and offers warm, evidence-based guidance to help you build healthy habits.</p>
      </div>

    </div>
  );
}
