import { useState, useEffect } from "react";
import OnboardingFlow from "./OnboardingFlow";
import MyDay    from "./tabs/MyDay";
import Eat      from "./tabs/Eat";
import Ritual   from "./tabs/Ritual";
import Boost    from "./tabs/Boost";
import AskNora  from "./tabs/AskNora";
import Me       from "./tabs/Me";
import { C, card, serif, sans, localDateStr, getCyclePhase } from "./noraTokens";
import { NoraAvatar, TabIcon } from "./NoraIcons";

const TABS = [
  { id:"myday",   label:"My Day"  },
  { id:"eat",     label:"Eat"     },
  { id:"ritual",  label:"Ritual"  },
  { id:"boost",   label:"Boost"   },
  { id:"asknora", label:"Ask Nora"},
  { id:"me",      label:"Me"      },
];

export default function NutritionApp() {
  const [phase,      setPhase]      = useState("onboarding");
  const [profile,    setProfile]    = useState(null);
  const [targets,    setTargets]    = useState(null);
  const [welcomeMsg, setWelcomeMsg] = useState("");
  const [activeTab,  setActiveTab]  = useState("myday");
  const [entries,    setEntries]    = useState([]);
  const [waterMl,    setWaterMl]    = useState(0);
  const [history,    setHistory]    = useState({});

  // Restore session
  useEffect(()=>{
    try {
      const p=localStorage.getItem("nora_profile");
      const t=localStorage.getItem("nora_targets");
      if(p&&t){
        const parsed=JSON.parse(p);
        if(parsed.goal&&!parsed.goals){parsed.goals=[parsed.goal];delete parsed.goal;}
        if(!Array.isArray(parsed.goals)) parsed.goals=[];
        setProfile(parsed); setTargets(JSON.parse(t)); setPhase("app");
      }
      const today=localDateStr();
      const wd=localStorage.getItem("nora_today_water");
      if(wd){const pw=JSON.parse(wd);if(pw.date===today)setWaterMl(pw.ml);}
      const ed=localStorage.getItem("nora_today_entries");
      if(ed){const pe=JSON.parse(ed);if(pe.date===today)setEntries(pe.entries);}
      const hd=localStorage.getItem("nora_history");
      if(hd)setHistory(JSON.parse(hd));
    }catch{}
  },[]);

  // Persist water
  useEffect(()=>{
    if(phase!=="app") return;
    try{localStorage.setItem("nora_today_water",JSON.stringify({date:localDateStr(),ml:waterMl}));}catch{}
  },[waterMl]);

  // Persist entries
  useEffect(()=>{
    if(phase!=="app") return;
    try{localStorage.setItem("nora_today_entries",JSON.stringify({date:localDateStr(),entries}));}catch{}
  },[entries]);

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

  const handleOnboardingComplete=(finalProfile,data)=>{
    setProfile(finalProfile); setTargets(data);
    setWelcomeMsg(data.welcome_message||`Welcome, ${finalProfile.name}. Let's build great habits together.`);
    try{localStorage.setItem("nora_profile",JSON.stringify(finalProfile));localStorage.setItem("nora_targets",JSON.stringify(data));}catch{}
    setPhase("welcome");
  };

  const resetProfile=()=>{
    ["nora_profile","nora_targets","nora_today_water","nora_today_entries","nora_sleep","nora_history","nora_supps_list","nora_supps_taken","nora_boost_recs","nora_smoothie","nora_evening_summary"].forEach(k=>{try{localStorage.removeItem(k);}catch{}});
    setProfile(null);setTargets(null);setWelcomeMsg("");setEntries([]);setWaterMl(0);setHistory({});setPhase("onboarding");
  };

  // Cycle phase — skip if cycle is absent (perimenopause/absent mode)
  const cyclePhase = (profile?.sex === "female" && profile?.cycleRegularity !== "Absent")
    ? getCyclePhase(profile?.lastPeriod, profile?.cycleLength || 28)
    : null;

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
  const sharedProps = { profile, targets, entries, setEntries, waterMl, setWaterMl, cyclePhase };

  const tabContent = {
    myday:   <MyDay {...sharedProps}/>,
    eat:     <Eat     profile={profile} targets={targets} entries={entries} setEntries={setEntries} cyclePhase={cyclePhase}/>,
    ritual:  <Ritual  profile={profile} targets={targets} entries={entries} waterMl={waterMl} cyclePhase={cyclePhase}/>,
    boost:   <Boost   profile={profile} targets={targets} entries={entries} cyclePhase={cyclePhase}/>,
    asknora: <AskNora profile={profile} targets={targets} entries={entries} waterMl={waterMl} cyclePhase={cyclePhase}/>,
    me:      <Me      profile={profile} setProfile={setProfile} targets={targets} resetProfile={resetProfile}/>,
  };

  return (
    <div style={{minHeight:"100vh",backgroundColor:C.bg,maxWidth:480,margin:"0 auto",position:"relative",fontFamily:sans}}>
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
