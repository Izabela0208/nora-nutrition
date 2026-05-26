import { useState, useEffect, useRef } from "react";

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  bg:         "#F5F0E8",
  card:       "#FAFAF7",
  green:      "#2D4A3E",
  greenDark:  "#1E3429",
  greenLight: "#EBF0ED",
  gold:       "#C9A96E",
  goldLight:  "#FAF3E6",
  text:       "#1C2B26",
  muted:      "#7A8C86",
  border:     "#E2DAD0",
  sage:       "#7A9E8A",
  tan:        "#A89070",
  slate:      "#7A9BAE",
  track:      "#E8E2D6",
  error:      "#9E5E52",
  errorBg:    "#F7EDE9",
  amber:      "#B8922A",
  amberBg:    "#FBF3E3",
};

const card = {
  backgroundColor: C.card,
  border: `1px solid ${C.border}`,
  borderRadius: "16px",
  boxShadow: "0 2px 12px rgba(28,43,38,0.06)",
};

const serif = "'Playfair Display', Georgia, 'Times New Roman', serif";
const sans  = "'system-ui', '-apple-system', sans-serif";

// ── SVG components ────────────────────────────────────────────────────────────

const NoraAvatar = ({ size = 36 }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <circle cx="20" cy="20" r="20" fill={C.green}/>
    <path d="M20 8 C20 8 14 14 14 20 C14 26 17 30 20 32 C23 30 26 26 26 20 C26 14 20 8 20 8Z" fill={C.gold} opacity="0.85"/>
    <line x1="20" y1="10" x2="20" y2="31" stroke={C.card} strokeWidth="0.7" strokeLinecap="round" opacity="0.45"/>
    <path d="M15.5 18 Q20 16 24.5 18" stroke={C.card} strokeWidth="0.7" strokeLinecap="round" fill="none" opacity="0.4"/>
    <path d="M15 23 Q20 21 25 23" stroke={C.card} strokeWidth="0.7" strokeLinecap="round" fill="none" opacity="0.35"/>
  </svg>
);

const LeafDecor = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <path d="M10 18C10 18 4 13 4 8a6 6 0 0 1 12 0c0 5-6 10-6 10Z" fill={C.gold} opacity="0.35"/>
    <line x1="10" y1="18" x2="10" y2="6" stroke={C.gold} strokeWidth="0.8" strokeLinecap="round" opacity="0.3"/>
    <path d="M7.5 12 Q10 10.5 12.5 12" stroke={C.gold} strokeWidth="0.7" strokeLinecap="round" fill="none" opacity="0.35"/>
    <path d="M8 9 Q10 7.5 12 9" stroke={C.gold} strokeWidth="0.7" strokeLinecap="round" fill="none" opacity="0.28"/>
  </svg>
);

const TabIcon = ({ id, active }) => {
  const color = active ? C.green : C.muted;
  const w = 1.4;
  if (id === "today") return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="3.5" stroke={color} strokeWidth={w}/>
      <path d="M10 2v2.5M10 15.5V18M2 10h2.5M15.5 10H18M4.4 4.4l1.77 1.77M12.83 12.83l1.77 1.77M4.4 15.6l1.77-1.77M12.83 7.17l1.77-1.77" stroke={color} strokeWidth={w} strokeLinecap="round"/>
    </svg>
  );
  if (id === "meals") return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M6 2v5a4 4 0 0 0 4 4v7" stroke={color} strokeWidth={w} strokeLinecap="round"/>
      <path d="M14 2v16" stroke={color} strokeWidth={w} strokeLinecap="round"/>
      <path d="M11.5 2c0 2-1 4-3.5 4S4.5 4 4.5 2" stroke={color} strokeWidth={w} strokeLinecap="round"/>
    </svg>
  );
  if (id === "supplements") return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M10 18C10 18 3 12 3 7a7 7 0 0 1 14 0c0 5-7 11-7 11Z" stroke={color} strokeWidth={w} strokeLinejoin="round" fill="none"/>
      <line x1="10" y1="18" x2="10" y2="5" stroke={color} strokeWidth={w * 0.7} strokeLinecap="round" opacity="0.6"/>
    </svg>
  );
  if (id === "progress") return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <polyline points="2,16 6,10 10,13 14,7 18,4" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
  if (id === "me") return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="7" r="3" stroke={color} strokeWidth={w}/>
      <path d="M3.5 18c0-3.59 2.91-6.5 6.5-6.5s6.5 2.91 6.5 6.5" stroke={color} strokeWidth={w} strokeLinecap="round"/>
    </svg>
  );
  return null;
};

const FlameIcon = ({ size = 14, color = C.muted }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <path d="M8 14C8 14 3 10 3 6.5c0-2.5 2-4.5 4-4.5-1 1.5-0.5 3 1 4 0-1.5 1-3 2-4 0 2.5 2 4 2 6C12 10 10 14 8 14Z" stroke={color} strokeWidth="1.2" strokeLinejoin="round" fill="none"/>
  </svg>
);

const DropIcon = ({ size = 14, color = C.slate }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <path d="M8 2 C8 2 3 7 3 10.5a5 5 0 0 0 10 0C13 7 8 2 8 2Z" stroke={color} strokeWidth="1.2" strokeLinejoin="round" fill="none"/>
  </svg>
);

// ── Shared UI components ──────────────────────────────────────────────────────

const ProgressRing = ({ value, max, color, label, unit, size = 86 }) => {
  const pct = Math.min((value / max) * 100, 100);
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-1">
      <div style={{ width: size, height: size }} className="relative">
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.track} strokeWidth="7"/>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="7"
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.7s cubic-bezier(0.4,0,0.2,1)" }}/>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-semibold text-gray-800" style={{ fontSize: 13, lineHeight: 1, color: C.text }}>{Math.round(value)}</span>
          <span style={{ fontSize: 10, color: C.muted, marginTop: 1 }}>{unit}</span>
        </div>
      </div>
      <span style={{ fontSize: 11, color: C.muted, fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: 10, color: C.track === C.track ? C.muted : C.muted, opacity: 0.7 }}>/{Math.round(max)}</span>
    </div>
  );
};

const BarProgress = ({ value, max, color, label, unit }) => {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="flex items-center gap-3">
      <span style={{ fontSize: 11, color: C.muted, width: 36, textAlign: "right", fontWeight: 500 }}>{label}</span>
      <div style={{ flex: 1, height: 5, backgroundColor: C.track, borderRadius: 10, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, backgroundColor: color, height: "100%", borderRadius: 10, transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)" }}/>
      </div>
      <span style={{ fontSize: 11, color: C.muted, width: 72 }}>{Math.round(value)}/{max} {unit}</span>
    </div>
  );
};

const Skeleton = ({ className }) => (
  <div className={`animate-pulse rounded-xl ${className}`} style={{ backgroundColor: C.track }}/>
);

const Divider = () => (
  <div style={{ height: 1, backgroundColor: C.border, margin: "4px 0" }}/>
);

// ── Demo data ─────────────────────────────────────────────────────────────────

const DEMO_ENTRIES = [
  { id:1, type:"food",     name:"Greek yogurt with berries", time:"8:15 AM", mealGroup:"Morning", calories:210, protein_g:18, carbs_g:28, fat_g:3,  fiber_g:3, emoji:"🍓", notes:"Honey & granola" },
  { id:2, type:"food",     name:"Oat milk latte",            time:"8:30 AM", mealGroup:"Morning", calories:110, protein_g:2,  carbs_g:18, fat_g:3,  fiber_g:1, emoji:"☕", notes:"" },
  { id:3, type:"exercise", name:"Morning run · 4 km",        time:"7:45 AM", mealGroup:"Morning", calories:-280, protein_g:0, carbs_g:0,  fat_g:0,  fiber_g:0, emoji:"→",  notes:"Easy pace" },
  { id:4, type:"food",     name:"Grilled chicken salad",     time:"12:30 PM",mealGroup:"Midday",  calories:420, protein_g:38, carbs_g:22, fat_g:18, fiber_g:7, emoji:"🥗", notes:"Avocado & olive oil" },
  { id:5, type:"food",     name:"Crackers with hummus",      time:"3:30 PM", mealGroup:"Snacks",  calories:180, protein_g:6,  carbs_g:24, fat_g:7,  fiber_g:4, emoji:"·",  notes:"Whole grain" },
  { id:6, type:"food",     name:"Salmon with roasted veg",   time:"7:00 PM", mealGroup:"Evening", calories:560, protein_g:42, carbs_g:48, fat_g:16, fiber_g:8, emoji:"🐟", notes:"Quinoa & lemon herb" },
];

// ── Main component ────────────────────────────────────────────────────────────

export default function NutritionApp() {
  const [phase, setPhase] = useState("onboarding");
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState({
    name:"", age:"", heightCm:"", heightFt:"", heightIn:"",
    weightKg:"", weightLbs:"", heightUnit:"cm", weightUnit:"kg",
    goals:[], activity:"", preferences:"",
  });
  const [targets,       setTargets]       = useState(null);
  const [welcomeMsg,    setWelcomeMsg]    = useState("");
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState("");
  const [activeTab,     setActiveTab]     = useState("today");
  const [entries,       setEntries]       = useState([]);
  const [waterMl,       setWaterMl]       = useState(0);
  const [logMode,       setLogMode]       = useState("text");
  const [logInput,      setLogInput]      = useState("");
  const [logLoading,    setLogLoading]    = useState(false);
  const [logError,      setLogError]      = useState("");
  const [greeting,      setGreeting]      = useState("");
  const [greetingLoad,  setGreetingLoad]  = useState(false);
  const [checkin,       setCheckin]       = useState("");
  const [checkinLoad,   setCheckinLoad]   = useState(false);
  const [weeklyReport,  setWeeklyReport]  = useState(null);
  const [weeklyLoad,    setWeeklyLoad]    = useState(false);
  const [meals,         setMeals]         = useState([]);
  const [mealsLoad,     setMealsLoad]     = useState(false);
  const [mealsError,    setMealsError]    = useState("");
  const [healthData,    setHealthData]    = useState({ steps:"", sleep:"", sleepQuality:"ok", heartRate:"", workoutDuration:"" });
  const [healthSaved,   setHealthSaved]   = useState(false);
  const [imageFile,     setImageFile]     = useState(null);
  const [history,       setHistory]       = useState([]);
  const [selectedGoals, setSelectedGoals] = useState([]);
  // Barcode
  const [barcodeInput,  setBarcodeInput]  = useState("");
  const [barcodeResult, setBarcodeResult] = useState(null);
  const [barcodeLoad,   setBarcodeLoad]   = useState(false);
  const [barcodeError,  setBarcodeError]  = useState("");
  // Supplements
  const [supRecs,       setSupRecs]       = useState([]);
  const [supWarnings,   setSupWarnings]   = useState([]);
  const [supOverall,    setSupOverall]    = useState("");
  const [supLoad,       setSupLoad]       = useState(false);
  const [userSupps,     setUserSupps]     = useState([]);
  const [newSupName,    setNewSupName]    = useState("");
  const [newSupDose,    setNewSupDose]    = useState("");
  const fileRef        = useRef();
  const barcodeFileRef = useRef();

  // ── Derived values ──────────────────────────────────────────────────────────
  const foodE   = entries.filter(e => e.type === "food");
  const exerE   = entries.filter(e => e.type === "exercise");
  const totalCal  = foodE.reduce((s,e) => s + (e.calories||0), 0);
  const burnedCal = exerE.reduce((s,e) => s + Math.abs(e.calories||0), 0);
  const netCal    = totalCal - burnedCal;
  const totalPro  = foodE.reduce((s,e) => s + (e.protein_g||0), 0);
  const totalCarb = foodE.reduce((s,e) => s + (e.carbs_g||0), 0);
  const totalFat  = foodE.reduce((s,e) => s + (e.fat_g||0), 0);
  const totalFib  = foodE.reduce((s,e) => s + (e.fiber_g||0), 0);
  const goalsStr  = profile.goals.join(", ");

  const last7 = Array.from({ length:7 }, (_,i) => {
    const d = new Date(); d.setDate(d.getDate() - (6-i));
    const ds = d.toISOString().split("T")[0];
    const isToday = i === 6;
    const rec = !isToday ? history.find(r => r.date === ds) : null;
    return {
      day: ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d.getDay()],
      date: ds, isToday,
      calories: isToday ? Math.round(netCal)   : (rec?.calories||0),
      protein:  isToday ? Math.round(totalPro)  : (rec?.protein||0),
      carbs:    isToday ? Math.round(totalCarb) : (rec?.carbs||0),
      fat:      isToday ? Math.round(totalFat)  : (rec?.fat||0),
      waterMl:  isToday ? waterMl              : (rec?.waterMl||0),
      entryCount: isToday ? entries.length     : (rec?.entryCount||0),
    };
  });

  const streak = (() => {
    let n = 0;
    const today = new Date().toISOString().split("T")[0];
    for (let i = 0; i < 30; i++) {
      const d = new Date(); d.setDate(d.getDate()-i);
      const ds = d.toISOString().split("T")[0];
      const ec = ds === today ? entries.length : (history.find(r => r.date===ds)?.entryCount||0);
      if (ec > 0) n++; else if (ds !== today) break;
    }
    return n;
  })();

  const daysWithData = last7.filter(d => d.calories > 0);
  const avg = (k) => daysWithData.length > 0 ? Math.round(daysWithData.reduce((s,d)=>s+(d[k]||0),0)/daysWithData.length) : 0;

  // ── Effects ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const h = localStorage.getItem("nora_history");
      if (h) setHistory(JSON.parse(h));
      const p = localStorage.getItem("nora_profile");
      const t = localStorage.getItem("nora_targets");
      if (p && t) {
        const parsed = JSON.parse(p);
        if (parsed.goal && !parsed.goals) { parsed.goals=[parsed.goal]; delete parsed.goal; }
        if (!Array.isArray(parsed.goals)) parsed.goals=[];
        setProfile(parsed); setTargets(JSON.parse(t)); setPhase("app");
      }
      const sd = localStorage.getItem("nora_user_supps");
      if (sd) {
        const ps = JSON.parse(sd);
        setUserSupps(ps.date===today ? ps.list : ps.list.map(s=>({...s,taken:false})));
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (phase!=="app"||!targets) return;
    const today = new Date().toISOString().split("T")[0];
    const rec = { date:today, calories:Math.round(netCal), protein:Math.round(totalPro), carbs:Math.round(totalCarb), fat:Math.round(totalFat), fiber:Math.round(totalFib), waterMl, entryCount:entries.length };
    setHistory(prev => {
      const updated = [...prev.filter(r=>r.date!==today), rec];
      try { localStorage.setItem("nora_history", JSON.stringify(updated.slice(-30))); } catch {}
      return updated;
    });
  }, [entries, waterMl, phase]);

  useEffect(() => {
    if (phase==="app"&&targets) {
      try { localStorage.setItem("nora_profile",JSON.stringify(profile)); localStorage.setItem("nora_targets",JSON.stringify(targets)); } catch {}
    }
  }, [phase]);

  useEffect(() => {
    if (phase==="app"&&activeTab==="today"&&!greeting) fetchGreeting();
  }, [phase, activeTab]);

  // ── Helpers ─────────────────────────────────────────────────────────────────
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

  const saveUserSupps = (list) => {
    const today = new Date().toISOString().split("T")[0];
    try { localStorage.setItem("nora_user_supps", JSON.stringify({list,date:today})); } catch {}
  };

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const fetchGreeting = async () => {
    setGreetingLoad(true);
    try {
      const hr = new Date().getHours();
      const text = await callClaude(
        "You are Nora, a warm nutritionist AI. 1-2 sentences max. Never mention your own name.",
        `User: ${profile.name}, goals: ${goalsStr}, activity: ${profile.activity}. Time: ${hr<12?"morning":hr<17?"afternoon":"evening"}. Short personalised greeting + one actionable tip.`
      );
      setGreeting(text);
    } catch { setGreeting("Ready to make today count? Let's track with intention."); }
    setGreetingLoad(false);
  };

  const handleOnboardingSubmit = async () => {
    setLoading(true); setError("");
    try {
      const hCm = profile.heightUnit==="cm" ? profile.heightCm : Math.round(parseInt(profile.heightFt)*30.48+parseInt(profile.heightIn||0)*2.54);
      const wKg = profile.weightUnit==="kg" ? profile.weightKg : Math.round(parseFloat(profile.weightLbs)*0.453592);
      const text = await callClaude(
        "You are Nora, a warm nutritionist AI. Return ONLY valid JSON, no preamble.",
        `Calculate daily nutrition targets. User: ${profile.name}, age ${profile.age}, height ${hCm}cm, weight ${wKg}kg, goals: ${selectedGoals.join(", ")}, activity: ${profile.activity}, preferences: ${profile.preferences||"none"}. Use Mifflin-St Jeor. Return JSON: { "calories":number, "protein_g":number, "carbs_g":number, "fat_g":number, "fiber_g":number, "water_ml":number, "key_micronutrients":["string"], "welcome_message":"2-3 warm sentences" }`
      );
      const data = parseJSON(text);
      setTargets(data);
      setProfile(p=>({...p,goals:selectedGoals}));
      setWelcomeMsg(data.welcome_message||`Welcome, ${profile.name}. Let's build great habits together.`);
      setPhase("welcome");
    } catch { setError("Something went wrong. Please try again."); }
    setLoading(false);
  };

  const handleLogText = async () => {
    if (!logInput.trim()) return;
    setLogLoading(true); setLogError("");
    try {
      const text = await callClaude("You are a nutrition AI. Return ONLY valid JSON.",
        `Parse: "${logInput}". Return JSON: { "type":"food"|"exercise", "name":"string", "time":"H:MM AM", "mealGroup":"Morning"|"Midday"|"Snacks"|"Evening", "calories":number (negative for exercise), "protein_g":number, "carbs_g":number, "fat_g":number, "fiber_g":number, "notes":"string", "emoji":"emoji" }`
      );
      setEntries(prev=>[...prev,{...parseJSON(text),id:Date.now()}]);
      setLogInput("");
    } catch { setLogError("Couldn't parse that. Please rephrase."); }
    setLogLoading(false);
  };

  const handleLogImage = async () => {
    if (!imageFile) return;
    setLogLoading(true); setLogError("");
    try {
      const b64 = await new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result.split(",")[1]); r.onerror=rej; r.readAsDataURL(imageFile); });
      const content = [
        { type:"image", source:{type:"base64",media_type:imageFile.type,data:b64} },
        { type:"text", text:`Identify food. Return ONLY valid JSON: { "type":"food", "name":"string", "time":"${new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}", "mealGroup":"Snacks", "calories":number, "protein_g":number, "carbs_g":number, "fat_g":number, "fiber_g":number, "notes":"string", "emoji":"emoji" }` }
      ];
      const text = await callClaude("You are a nutrition AI with vision. Return ONLY valid JSON.", content);
      setEntries(prev=>[...prev,{...parseJSON(text),id:Date.now()}]);
      setImageFile(null);
    } catch { setLogError("Couldn't read the image. Try a clearer photo."); }
    setLogLoading(false);
  };

  const handleBarcodeSearch = async (code) => {
    if (!code.trim()) return;
    setBarcodeLoad(true); setBarcodeError(""); setBarcodeResult(null);
    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${code.trim()}.json`);
      const data = await res.json();
      if (data.status===1&&data.product) {
        const p=data.product, n=p.nutriments||{};
        setBarcodeResult({
          name: p.product_name||p.product_name_en||"Unknown product",
          brand: p.brands||"",
          calories: Math.round(n["energy-kcal_100g"]||n["energy-kcal"]||0),
          protein_g: Math.round((n.proteins_100g||0)*10)/10,
          carbs_g: Math.round((n.carbohydrates_100g||0)*10)/10,
          fat_g: Math.round((n.fat_100g||0)*10)/10,
          fiber_g: Math.round((n.fiber_100g||0)*10)/10,
          serving_size: p.serving_size||"per 100 g",
          nutriscore: p.nutriscore_grade?.toLowerCase()||null,
          image: p.image_small_url||null,
        });
      } else {
        setBarcodeError("Product not found. Try entering the barcode manually.");
      }
    } catch { setBarcodeError("Network error. Please check your connection."); }
    setBarcodeLoad(false);
  };

  const handleBarcodeCapture = async (file) => {
    if (!file) return;
    if (!("BarcodeDetector" in window)) {
      setBarcodeError("Automatic detection is not supported on this browser. Please enter the barcode number manually.");
      return;
    }
    setBarcodeLoad(true); setBarcodeError(""); setBarcodeResult(null);
    try {
      const bitmap = await createImageBitmap(file);
      const detector = new window.BarcodeDetector({ formats:["ean_13","ean_8","upc_a","upc_e","code_128"] });
      const barcodes = await detector.detect(bitmap);
      bitmap.close();
      if (barcodes.length>0) {
        const code = barcodes[0].rawValue;
        setBarcodeInput(code);
        const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${code}.json`);
        const data = await res.json();
        if (data.status===1&&data.product) {
          const p=data.product, n=p.nutriments||{};
          setBarcodeResult({ name:p.product_name||"Unknown product", brand:p.brands||"", calories:Math.round(n["energy-kcal_100g"]||0), protein_g:Math.round((n.proteins_100g||0)*10)/10, carbs_g:Math.round((n.carbohydrates_100g||0)*10)/10, fat_g:Math.round((n.fat_100g||0)*10)/10, fiber_g:Math.round((n.fiber_100g||0)*10)/10, serving_size:p.serving_size||"per 100 g", nutriscore:p.nutriscore_grade?.toLowerCase()||null, image:p.image_small_url||null });
        } else { setBarcodeError("Product not found in database."); }
      } else { setBarcodeError("No barcode detected. Please enter the number manually."); }
    } catch { setBarcodeError("Could not process image. Please enter the barcode manually."); }
    setBarcodeLoad(false);
  };

  const handleAddBarcode = (r) => {
    const h = new Date().getHours();
    setEntries(prev=>[...prev,{
      id:Date.now(), type:"food",
      name:r.name+(r.brand?` — ${r.brand}`:""),
      time:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),
      mealGroup:h<11?"Morning":h<15?"Midday":h<18?"Snacks":"Evening",
      calories:r.calories, protein_g:r.protein_g, carbs_g:r.carbs_g,
      fat_g:r.fat_g, fiber_g:r.fiber_g, emoji:"·", notes:"Scanned product",
    }]);
    setBarcodeResult(null); setBarcodeInput("");
  };

  const handleCheckin = async () => {
    setCheckinLoad(true); setCheckin("");
    try {
      const summary = `Cal:${Math.round(netCal)}/${targets?.calories}, P:${Math.round(totalPro)}/${targets?.protein_g}g, C:${Math.round(totalCarb)}/${targets?.carbs_g}g, Fat:${Math.round(totalFat)}/${targets?.fat_g}g, Water:${waterMl}/${targets?.water_ml}ml. Logged:${entries.map(e=>e.name).join(", ")}.`;
      const text = await callClaude("You are Nora. Be encouraging, use we/let's. 2-3 sentences.",
        `${profile.name}'s day. Goals:${goalsStr}. ${summary} Warm check-in.`);
      setCheckin(text);
    } catch { setCheckin("You're doing wonderfully — every mindful choice adds up."); }
    setCheckinLoad(false);
  };

  const handleGetMeals = async () => {
    setMealsLoad(true); setMealsError("");
    try {
      const rCal=Math.max(0,Math.round((targets?.calories||0)-netCal));
      const rPro=Math.max(0,Math.round((targets?.protein_g||0)-totalPro));
      const rCarb=Math.max(0,Math.round((targets?.carbs_g||0)-totalCarb));
      const rFat=Math.max(0,Math.round((targets?.fat_g||0)-totalFat));
      const text = await callClaude("You are Nora. Return ONLY a valid JSON array, no preamble.",
        `Suggest 4 meals for ${profile.name}. Goals:${goalsStr}. Preferences:${profile.preferences||"none"}. Remaining:~${rCal}kcal, protein ${rPro}g, carbs ${rCarb}g, fat ${rFat}g. Return:[{"name":"string","emoji":"emoji","prepTime":"X min","mealGroup":"Morning"|"Midday"|"Snacks"|"Evening","calories":number,"protein_g":number,"carbs_g":number,"fat_g":number,"fiber_g":number,"ingredients":["string"],"tip":"string"}]`
      );
      const data=parseJSON(text);
      setMeals(Array.isArray(data)?data:(data.meals||[]));
    } catch { setMealsError("Unable to retrieve suggestions. Please try again."); }
    setMealsLoad(false);
  };

  const addMealToLog = (meal) => {
    const h=new Date().getHours();
    const mg=meal.mealGroup||(h<11?"Morning":h<15?"Midday":h<18?"Snacks":"Evening");
    setEntries(prev=>[...prev,{id:Date.now(),type:"food",name:meal.name,time:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),mealGroup:mg,calories:meal.calories,protein_g:meal.protein_g,carbs_g:meal.carbs_g,fat_g:meal.fat_g,fiber_g:meal.fiber_g||0,emoji:meal.emoji,notes:"From Nora's suggestions"}]);
    setActiveTab("today");
  };

  const handleGetSupRecs = async () => {
    setSupLoad(true); setSupRecs([]); setSupWarnings([]); setSupOverall("");
    try {
      const log=foodE.map(e=>e.name).join(", ")||"nothing logged yet";
      const macros=`calories:${Math.round(netCal)}/${targets?.calories}, protein:${Math.round(totalPro)}g/${targets?.protein_g}g, fiber:${Math.round(totalFib)}g/${targets?.fiber_g}g`;
      const curr=userSupps.length>0?userSupps.map(s=>`${s.name}${s.dose?` ${s.dose}`:""}`).join(", "):"none";
      const text = await callClaude("You are Nora, a nutrition AI. Return ONLY valid JSON, no preamble.",
        `Analyse today's nutrition for ${profile.name}. Goals:${goalsStr}. Preferences:${profile.preferences||"none"}. Foods today:${log}. Macros:${macros}. Currently taking:${curr}. Identify nutritional gaps and recommend supplements. Warn about any absorption conflicts or interactions. Return JSON: { "recommendations":[{"name":"string","dose":"string","reason":"string","priority":"high"|"medium"|"low"}], "warnings":["string"], "overall":"1-2 warm sentences on their nutritional gaps today" }`,
        1500
      );
      const data=parseJSON(text);
      setSupRecs(data.recommendations||[]);
      setSupWarnings(data.warnings||[]);
      setSupOverall(data.overall||"");
    } catch { setSupOverall("Unable to analyse at this time. Please try again."); }
    setSupLoad(false);
  };

  const addRecommendedSupp = (rec) => {
    if (userSupps.find(s=>s.name.toLowerCase()===rec.name.toLowerCase())) return;
    const updated=[...userSupps,{id:Date.now(),name:rec.name,dose:rec.dose||"",taken:false}];
    setUserSupps(updated); saveUserSupps(updated);
  };

  const addUserSupp = () => {
    if (!newSupName.trim()) return;
    const updated=[...userSupps,{id:Date.now(),name:newSupName.trim(),dose:newSupDose.trim(),taken:false}];
    setUserSupps(updated); saveUserSupps(updated);
    setNewSupName(""); setNewSupDose("");
  };

  const toggleSupp = (id) => {
    const updated=userSupps.map(s=>s.id===id?{...s,taken:!s.taken}:s);
    setUserSupps(updated); saveUserSupps(updated);
  };

  const removeSupp = (id) => {
    const updated=userSupps.filter(s=>s.id!==id);
    setUserSupps(updated); saveUserSupps(updated);
  };

  const handleWeeklyReport = async () => {
    setWeeklyLoad(true); setWeeklyReport(null);
    try {
      const ws=last7.filter(d=>d.calories>0).map(d=>`${d.day}:${d.calories}kcal`).join(", ");
      const text = await callClaude("You are Nora. Return ONLY valid JSON.",
        `Weekly report for ${profile.name}, goals:${goalsStr}. Target:${targets?.calories}kcal/day. Data:${ws||"just started"}. Today's foods:${foodE.map(e=>e.name).join(", ")||"various"}. Return JSON:{"headline":"uplifting sentence","wins":["w1","w2","w3"],"suggestions":["s1","s2"],"fun_fact":"nutrition fact"}`
      );
      setWeeklyReport(parseJSON(text));
    } catch {
      setWeeklyReport({headline:"You showed up this week — that's what matters.",wins:["Tracked consistently","Balanced your macros","Stayed hydrated"],suggestions:["Try adding more leafy greens","Consider a mid-morning snack"],fun_fact:"Salmon is one of the finest sources of omega-3 fatty acids."});
    }
    setWeeklyLoad(false);
  };

  const resetProfile = () => {
    try { localStorage.removeItem("nora_profile"); localStorage.removeItem("nora_targets"); } catch {}
    setProfile({name:"",age:"",heightCm:"",heightFt:"",heightIn:"",weightKg:"",weightLbs:"",heightUnit:"cm",weightUnit:"kg",goals:[],activity:"",preferences:""});
    setTargets(null); setEntries([]); setWaterMl(0); setGreeting(""); setCheckin(""); setStep(0); setSelectedGoals([]); setPhase("onboarding");
  };

  const mealGroups = ["Morning","Midday","Snacks","Evening"];
  const grouped    = mealGroups.reduce((a,g)=>{a[g]=entries.filter(e=>e.mealGroup===g);return a;},{});

  // ── Shared input style ───────────────────────────────────────────────────────
  const inp = {
    width:"100%", backgroundColor:C.card, border:`1px solid ${C.border}`,
    borderRadius:10, padding:"11px 14px", fontSize:14, color:C.text,
    fontFamily:sans, transition:"border-color 0.15s ease",
  };

  // ── ONBOARDING ───────────────────────────────────────────────────────────────
  if (phase === "onboarding") {
    const goalOptions = ["Lose weight","Build muscle","Maintain weight","Improve energy","Just be healthier","Be aware of my intakes"];
    const activities  = ["Sedentary","Lightly active","Moderately active","Very active","Athlete"];
    const isStep0Valid = profile.name.trim() && profile.age;
    const isStep1Valid = profile.heightUnit==="cm" ? profile.heightCm : profile.heightFt;
    const isStep2Valid = (profile.weightUnit==="kg"?profile.weightKg:profile.weightLbs) && selectedGoals.length>0 && profile.activity;
    const toggleGoal   = (g) => setSelectedGoals(prev => prev.includes(g)?prev.filter(x=>x!==g):[...prev,g]);

    return (
      <div style={{ minHeight:"100vh", backgroundColor:C.bg, display:"flex", alignItems:"center", justifyContent:"center", padding:20, fontFamily:sans }}>
        <div style={{ width:"100%", maxWidth:400 }}>
          {/* Logo */}
          <div style={{ textAlign:"center", marginBottom:40 }}>
            <NoraAvatar size={52}/>
            <h1 style={{ fontFamily:serif, fontSize:28, color:C.green, margin:"10px 0 4px", fontWeight:600 }}>Nora</h1>
            <p style={{ color:C.muted, fontSize:13, letterSpacing:"0.04em" }}>Your personal nutrition companion</p>
          </div>

          {/* Step indicators */}
          <div style={{ display:"flex", justifyContent:"center", gap:8, marginBottom:28 }}>
            {[0,1,2].map(i => (
              <div key={i} style={{ height:2, width: i===step?28:12, borderRadius:2, backgroundColor: i<=step?C.gold:C.border, transition:"all 0.3s ease" }}/>
            ))}
          </div>

          <div style={{ ...card, padding:28 }}>
            {step === 0 && (
              <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
                <div>
                  <p style={{ fontFamily:serif, fontSize:18, color:C.green, fontWeight:500, marginBottom:16 }}>Let's get acquainted</p>
                </div>
                <div>
                  <label style={{ fontSize:12, color:C.muted, fontWeight:500, letterSpacing:"0.05em", textTransform:"uppercase", display:"block", marginBottom:6 }}>Your name</label>
                  <input className="focus-gold" style={inp} placeholder="e.g. Alexandra" value={profile.name} onChange={e=>setProfile(p=>({...p,name:e.target.value}))}/>
                </div>
                <div>
                  <label style={{ fontSize:12, color:C.muted, fontWeight:500, letterSpacing:"0.05em", textTransform:"uppercase", display:"block", marginBottom:6 }}>Age</label>
                  <input className="focus-gold" type="number" style={inp} placeholder="e.g. 28" value={profile.age} onChange={e=>setProfile(p=>({...p,age:e.target.value}))}/>
                </div>
                <button disabled={!isStep0Valid} onClick={()=>setStep(1)} style={{ backgroundColor:isStep0Valid?C.green:"#C8D5D1", color:C.bg, border:"none", borderRadius:10, padding:"13px 20px", fontFamily:sans, fontSize:14, fontWeight:500, cursor:isStep0Valid?"pointer":"not-allowed", letterSpacing:"0.03em", transition:"background-color 0.15s ease" }}>
                  Continue
                </button>
              </div>
            )}

            {step === 1 && (
              <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
                <p style={{ fontFamily:serif, fontSize:18, color:C.green, fontWeight:500 }}>Your measurements</p>
                <div>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                    <label style={{ fontSize:12, color:C.muted, fontWeight:500, letterSpacing:"0.05em", textTransform:"uppercase" }}>Height</label>
                    <div style={{ display:"flex", gap:2, backgroundColor:C.greenLight, borderRadius:8, padding:3 }}>
                      {["cm","ft"].map(u=>(
                        <button key={u} onClick={()=>setProfile(p=>({...p,heightUnit:u}))} style={{ padding:"4px 12px", borderRadius:6, border:"none", fontSize:12, fontWeight:500, cursor:"pointer", backgroundColor:profile.heightUnit===u?"white":C.greenLight, color:profile.heightUnit===u?C.green:C.muted, boxShadow:profile.heightUnit===u?"0 1px 4px rgba(0,0,0,0.1)":"none", transition:"all 0.15s" }}>{u}</button>
                      ))}
                    </div>
                  </div>
                  {profile.heightUnit==="cm"
                    ? <input className="focus-gold" type="number" style={inp} placeholder="e.g. 170" value={profile.heightCm} onChange={e=>setProfile(p=>({...p,heightCm:e.target.value}))}/>
                    : <div style={{ display:"flex", gap:8 }}>
                        <input className="focus-gold" type="number" style={{...inp,width:"50%"}} placeholder="Feet" value={profile.heightFt} onChange={e=>setProfile(p=>({...p,heightFt:e.target.value}))}/>
                        <input className="focus-gold" type="number" style={{...inp,width:"50%"}} placeholder="Inches" value={profile.heightIn} onChange={e=>setProfile(p=>({...p,heightIn:e.target.value}))}/>
                      </div>
                  }
                </div>
                <div style={{ display:"flex", gap:10 }}>
                  <button onClick={()=>setStep(0)} style={{ flex:1, backgroundColor:C.greenLight, color:C.green, border:"none", borderRadius:10, padding:"13px", fontSize:14, fontWeight:500, cursor:"pointer" }}>← Back</button>
                  <button disabled={!isStep1Valid} onClick={()=>setStep(2)} style={{ flex:2, backgroundColor:isStep1Valid?C.green:"#C8D5D1", color:C.bg, border:"none", borderRadius:10, padding:"13px", fontSize:14, fontWeight:500, cursor:isStep1Valid?"pointer":"not-allowed" }}>Continue</button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
                <p style={{ fontFamily:serif, fontSize:18, color:C.green, fontWeight:500 }}>Goals & lifestyle</p>
                <div>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                    <label style={{ fontSize:12, color:C.muted, fontWeight:500, letterSpacing:"0.05em", textTransform:"uppercase" }}>Weight</label>
                    <div style={{ display:"flex", gap:2, backgroundColor:C.greenLight, borderRadius:8, padding:3 }}>
                      {["kg","lbs"].map(u=>(
                        <button key={u} onClick={()=>setProfile(p=>({...p,weightUnit:u}))} style={{ padding:"4px 12px", borderRadius:6, border:"none", fontSize:12, fontWeight:500, cursor:"pointer", backgroundColor:profile.weightUnit===u?"white":C.greenLight, color:profile.weightUnit===u?C.green:C.muted, boxShadow:profile.weightUnit===u?"0 1px 4px rgba(0,0,0,0.1)":"none", transition:"all 0.15s" }}>{u}</button>
                      ))}
                    </div>
                  </div>
                  <input className="focus-gold" type="number" style={inp} placeholder={profile.weightUnit==="kg"?"e.g. 68":"e.g. 150"} value={profile.weightUnit==="kg"?profile.weightKg:profile.weightLbs} onChange={e=>setProfile(p=>profile.weightUnit==="kg"?{...p,weightKg:e.target.value}:{...p,weightLbs:e.target.value})}/>
                </div>
                <div>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                    <label style={{ fontSize:12, color:C.muted, fontWeight:500, letterSpacing:"0.05em", textTransform:"uppercase" }}>Goals</label>
                    {selectedGoals.length>0 && <span style={{ fontSize:11, color:C.gold, fontWeight:500 }}>{selectedGoals.length} selected</span>}
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                    {goalOptions.map(g => {
                      const sel=selectedGoals.includes(g);
                      return (
                        <button type="button" key={g} onClick={()=>toggleGoal(g)} style={{ padding:"10px 12px", borderRadius:10, border:`1px solid ${sel?C.green:C.border}`, backgroundColor:sel?C.green:C.card, color:sel?C.bg:C.text, fontSize:13, fontWeight:sel?500:400, cursor:"pointer", textAlign:"left", transition:"all 0.15s ease" }}>
                          {sel && <span style={{ marginRight:5, opacity:0.8 }}>✓</span>}{g}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize:12, color:C.muted, fontWeight:500, letterSpacing:"0.05em", textTransform:"uppercase", display:"block", marginBottom:8 }}>Activity level</label>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                    {activities.map(a=>(
                      <button key={a} onClick={()=>setProfile(p=>({...p,activity:a}))} style={{ padding:"7px 12px", borderRadius:8, border:`1px solid ${profile.activity===a?C.green:C.border}`, backgroundColor:profile.activity===a?C.green:C.card, color:profile.activity===a?C.bg:C.text, fontSize:12, fontWeight:profile.activity===a?500:400, cursor:"pointer", transition:"all 0.15s" }}>{a}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize:12, color:C.muted, fontWeight:500, letterSpacing:"0.05em", textTransform:"uppercase", display:"block", marginBottom:6 }}>Dietary preferences <span style={{ color:C.border }}>— optional</span></label>
                  <input className="focus-gold" style={inp} placeholder="e.g. vegetarian, gluten-free" value={profile.preferences} onChange={e=>setProfile(p=>({...p,preferences:e.target.value}))}/>
                </div>
                {error && <div style={{ padding:"10px 14px", backgroundColor:C.errorBg, border:`1px solid ${C.error}20`, borderRadius:10, fontSize:13, color:C.error }}>{error}</div>}
                <div style={{ display:"flex", gap:10 }}>
                  <button onClick={()=>setStep(1)} style={{ flex:1, backgroundColor:C.greenLight, color:C.green, border:"none", borderRadius:10, padding:"13px", fontSize:14, fontWeight:500, cursor:"pointer" }}>← Back</button>
                  <button disabled={!isStep2Valid||loading} onClick={handleOnboardingSubmit} style={{ flex:2, backgroundColor:isStep2Valid&&!loading?C.green:"#C8D5D1", color:C.bg, border:"none", borderRadius:10, padding:"13px", fontSize:14, fontWeight:500, cursor:isStep2Valid&&!loading?"pointer":"not-allowed", transition:"background-color 0.15s" }}>
                    {loading
                      ? <span style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
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
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── WELCOME ──────────────────────────────────────────────────────────────────
  if (phase === "welcome") {
    return (
      <div style={{ minHeight:"100vh", backgroundColor:C.bg, display:"flex", alignItems:"center", justifyContent:"center", padding:20, fontFamily:sans }}>
        <div style={{ width:"100%", maxWidth:400 }}>
          <div style={{ ...card, padding:32, textAlign:"center" }}>
            <NoraAvatar size={56}/>
            <h2 style={{ fontFamily:serif, fontSize:22, color:C.green, margin:"14px 0 10px", fontWeight:600 }}>Welcome, {profile.name}</h2>
            <p style={{ color:C.muted, fontSize:14, lineHeight:1.7, marginBottom:24 }}>{welcomeMsg}</p>
            {targets && (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:24 }}>
                {[
                  {label:"Energy",   val:`${targets.calories} kcal`},
                  {label:"Protein",  val:`${targets.protein_g} g`},
                  {label:"Carbs",    val:`${targets.carbs_g} g`},
                  {label:"Fat",      val:`${targets.fat_g} g`},
                  {label:"Fibre",    val:`${targets.fiber_g} g`},
                  {label:"Water",    val:`${Math.round(targets.water_ml/100)/10} L`},
                ].map(item=>(
                  <div key={item.label} style={{ backgroundColor:C.greenLight, borderRadius:12, padding:"12px 14px", textAlign:"left" }}>
                    <div style={{ fontSize:11, color:C.muted, fontWeight:500, letterSpacing:"0.05em", textTransform:"uppercase", marginBottom:3 }}>{item.label}</div>
                    <div style={{ fontSize:15, fontWeight:600, color:C.green }}>{item.val}</div>
                  </div>
                ))}
              </div>
            )}
            <button onClick={()=>setPhase("app")} style={{ width:"100%", backgroundColor:C.green, color:C.bg, border:"none", borderRadius:12, padding:"15px", fontSize:15, fontWeight:500, cursor:"pointer", letterSpacing:"0.03em" }}>
              Begin tracking
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── MAIN APP ─────────────────────────────────────────────────────────────────
  const secHead = (title, sub) => (
    <div style={{ marginBottom:20 }}>
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <LeafDecor size={18}/>
        <h2 style={{ fontFamily:serif, fontSize:22, color:C.green, fontWeight:600, margin:0 }}>{title}</h2>
      </div>
      {sub && <p style={{ color:C.muted, fontSize:13, marginTop:4, marginLeft:26 }}>{sub}</p>}
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", backgroundColor:C.bg, maxWidth:480, margin:"0 auto", position:"relative", fontFamily:sans }}>
      <style>{`@keyframes spin { to { transform:rotate(360deg); } } @keyframes fadeIn { from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)} }`}</style>

      {/* TODAY ─────────────────────────────────────────────────────────────── */}
      {activeTab === "today" && (
        <div style={{ padding:"20px 16px 100px", display:"flex", flexDirection:"column", gap:14 }}>
          {/* Greeting */}
          <div style={{ ...card, padding:"18px 20px", display:"flex", gap:14, alignItems:"flex-start" }}>
            <NoraAvatar size={38}/>
            <div style={{ flex:1 }}>
              {greetingLoad
                ? <><Skeleton className="h-3 w-full mb-2"/><Skeleton className="h-3 w-3/4"/></>
                : <p style={{ fontSize:14, color:C.text, lineHeight:1.65, margin:0 }}>{greeting||"Ready to track your day with intention."}</p>
              }
            </div>
          </div>

          {/* Health summary */}
          {healthSaved && (
            <div style={{ ...card, padding:"14px 16px", display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:8, textAlign:"center" }}>
              {[{label:"Steps",val:healthData.steps||"—"},{label:"Sleep",val:healthData.sleep?`${healthData.sleep}h`:"—"},{label:"HR",val:healthData.heartRate?`${healthData.heartRate}`:("—")},{label:"Workout",val:healthData.workoutDuration?`${healthData.workoutDuration}m`:"—"}].map(item=>(
                <div key={item.label}>
                  <div style={{ fontSize:14, fontWeight:600, color:C.green }}>{item.val}</div>
                  <div style={{ fontSize:10, color:C.muted, textTransform:"uppercase", letterSpacing:"0.05em" }}>{item.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Progress rings */}
          {targets && (
            <div style={{ ...card, padding:"20px 16px 18px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
                <div>
                  <h3 style={{ fontSize:14, fontWeight:600, color:C.text, margin:0 }}>Today's progress</h3>
                  <p style={{ fontSize:12, color:C.muted, margin:"3px 0 0" }}>
                    Net {Math.round(netCal)} kcal
                    {burnedCal>0 ? ` · ${burnedCal} kcal burned` : ""}
                  </p>
                </div>
                <span style={{ fontSize:11, color:C.gold, fontWeight:600, backgroundColor:C.goldLight, padding:"4px 10px", borderRadius:20, border:`1px solid ${C.gold}40` }}>
                  {Math.round((netCal/targets.calories)*100)}%
                </span>
              </div>
              <div style={{ display:"flex", justifyContent:"space-around", marginBottom:18 }}>
                <ProgressRing value={netCal}     max={targets.calories}  color={C.green} label="Energy"  unit="kcal"/>
                <ProgressRing value={totalPro}   max={targets.protein_g} color={C.gold}  label="Protein" unit="g"/>
                <ProgressRing value={totalCarb}  max={targets.carbs_g}   color={C.sage}  label="Carbs"   unit="g"/>
                <ProgressRing value={totalFat}   max={targets.fat_g}     color={C.tan}   label="Fat"     unit="g"/>
              </div>
              <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:14, display:"flex", flexDirection:"column", gap:10 }}>
                <BarProgress value={totalFib} max={targets.fiber_g} color={C.green} label="Fibre" unit="g"/>
                <BarProgress value={waterMl}  max={targets.water_ml} color={C.slate} label="Water" unit="ml"/>
                <div style={{ display:"flex", gap:6, paddingLeft:48, marginTop:2 }}>
                  {[150,250,500].map(ml=>(
                    <button key={ml} onClick={()=>setWaterMl(w=>Math.min(w+ml,targets.water_ml*2))} style={{ padding:"5px 10px", fontSize:11, borderRadius:8, border:`1px solid ${C.border}`, backgroundColor:C.card, color:C.slate, cursor:"pointer", fontWeight:500, transition:"all 0.15s" }}>
                      +{ml} ml
                    </button>
                  ))}
                  {waterMl>0 && <button onClick={()=>setWaterMl(0)} style={{ marginLeft:"auto", fontSize:11, color:C.muted, background:"none", border:"none", cursor:"pointer", opacity:0.6 }}>reset</button>}
                </div>
              </div>
            </div>
          )}

          {/* Demo prompt */}
          {entries.length===0 && (
            <button onClick={()=>setEntries(DEMO_ENTRIES)} style={{ width:"100%", padding:"14px", backgroundColor:"transparent", border:`1.5px dashed ${C.border}`, borderRadius:12, fontSize:13, color:C.muted, cursor:"pointer", letterSpacing:"0.02em" }}>
              Load demo data to explore the app
            </button>
          )}

          {/* Log input */}
          <div style={{ ...card, overflow:"hidden" }}>
            <div style={{ display:"flex", borderBottom:`1px solid ${C.border}` }}>
              {[{id:"text",label:"Type"},{id:"photo",label:"Photo"},{id:"barcode",label:"Scan"}].map(({id,label})=>(
                <button key={id} onClick={()=>{setLogMode(id);setBarcodeResult(null);setBarcodeError("");}} style={{ flex:1, padding:"13px 0", fontSize:13, fontWeight:logMode===id?600:400, color:logMode===id?C.green:C.muted, backgroundColor:"transparent", border:"none", cursor:"pointer", borderBottom:logMode===id?`2px solid ${C.gold}`:"2px solid transparent", letterSpacing:"0.03em", transition:"all 0.15s" }}>{label}</button>
              ))}
            </div>
            <div style={{ padding:16 }}>
              {logMode === "text" && (
                <div style={{ display:"flex", gap:8 }}>
                  <input className="focus-gold" style={{...inp,flex:1}} placeholder='e.g. "two scrambled eggs" or "30 min run"' value={logInput} onChange={e=>setLogInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogText()}/>
                  <button onClick={handleLogText} disabled={logLoading||!logInput.trim()} style={{ padding:"11px 18px", backgroundColor:logLoading||!logInput.trim()?"#C8D5D1":C.green, color:C.bg, border:"none", borderRadius:10, fontSize:13, fontWeight:500, cursor:logLoading||!logInput.trim()?"not-allowed":"pointer", minWidth:60 }}>
                    {logLoading ? <span style={{ width:14,height:14,border:`2px solid ${C.bg}`,borderTopColor:"transparent",borderRadius:"50%",display:"inline-block",animation:"spin 0.8s linear infinite" }}/> : "Add"}
                  </button>
                </div>
              )}
              {logMode === "photo" && (
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  <div onClick={()=>fileRef.current?.click()} style={{ border:`1.5px dashed ${C.border}`, borderRadius:12, padding:"24px", textAlign:"center", cursor:"pointer", transition:"background-color 0.15s" }}>
                    {imageFile
                      ? <p style={{ fontSize:13, color:C.green, margin:0 }}>{imageFile.name}</p>
                      : <><p style={{ fontSize:24, margin:"0 0 6px" }}>⬆</p><p style={{ fontSize:13, color:C.muted, margin:0 }}>Tap to upload a food photo</p></>
                    }
                    <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={e=>setImageFile(e.target.files[0])}/>
                  </div>
                  {imageFile && <button onClick={handleLogImage} disabled={logLoading} style={{ padding:"12px", backgroundColor:logLoading?"#C8D5D1":C.green, color:C.bg, border:"none", borderRadius:10, fontSize:13, fontWeight:500, cursor:logLoading?"not-allowed":"pointer" }}>{logLoading?"Analysing…":"Analyse & log"}</button>}
                </div>
              )}
              {logMode === "barcode" && (
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  <div style={{ display:"flex", gap:8 }}>
                    <input className="focus-gold" type="text" inputMode="numeric" style={{...inp,flex:1}} placeholder="Enter barcode number…" value={barcodeInput} onChange={e=>setBarcodeInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleBarcodeSearch(barcodeInput)}/>
                    <button onClick={()=>handleBarcodeSearch(barcodeInput)} disabled={barcodeLoad||!barcodeInput.trim()} style={{ padding:"11px 18px", backgroundColor:barcodeLoad||!barcodeInput.trim()?"#C8D5D1":C.green, color:C.bg, border:"none", borderRadius:10, fontSize:13, fontWeight:500, cursor:barcodeLoad||!barcodeInput.trim()?"not-allowed":"pointer", minWidth:72 }}>
                      {barcodeLoad ? <span style={{ width:14,height:14,border:`2px solid ${C.bg}`,borderTopColor:"transparent",borderRadius:"50%",display:"inline-block",animation:"spin 0.8s linear infinite" }}/> : "Search"}
                    </button>
                  </div>
                  <div onClick={()=>barcodeFileRef.current?.click()} style={{ border:`1.5px dashed ${C.border}`, borderRadius:12, padding:"16px", textAlign:"center", cursor:"pointer" }}>
                    <p style={{ fontSize:13, color:C.muted, margin:0 }}>Photograph a barcode to scan</p>
                    <p style={{ fontSize:11, color:C.border, margin:"3px 0 0" }}>Works in Chrome & Edge on Android</p>
                    <input ref={barcodeFileRef} type="file" accept="image/*" capture="environment" style={{ display:"none" }} onChange={e=>{ if(e.target.files[0]) handleBarcodeCapture(e.target.files[0]); }}/>
                  </div>
                  {barcodeError && <p style={{ fontSize:12, color:C.error, backgroundColor:C.errorBg, padding:"10px 12px", borderRadius:10, margin:0 }}>{barcodeError}</p>}
                  {barcodeLoad && <Skeleton className="h-28 w-full"/>}
                  {barcodeResult && !barcodeLoad && (
                    <div style={{ backgroundColor:C.greenLight, border:`1px solid ${C.border}`, borderRadius:12, padding:14, animation:"fadeIn 0.25s ease" }}>
                      <div style={{ display:"flex", gap:12, marginBottom:12 }}>
                        {barcodeResult.image && <img src={barcodeResult.image} alt="" style={{ width:52,height:52,objectFit:"contain",borderRadius:8,backgroundColor:"white",border:`1px solid ${C.border}` }}/>}
                        <div style={{ flex:1, minWidth:0 }}>
                          <p style={{ fontSize:14, fontWeight:600, color:C.text, margin:"0 0 2px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{barcodeResult.name}</p>
                          {barcodeResult.brand && <p style={{ fontSize:12, color:C.muted, margin:"0 0 4px" }}>{barcodeResult.brand}</p>}
                          {barcodeResult.nutriscore && (
                            <span style={{ display:"inline-block", fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:20, backgroundColor: barcodeResult.nutriscore==="a"?C.green:barcodeResult.nutriscore==="b"?C.sage:barcodeResult.nutriscore==="c"?C.gold:barcodeResult.nutriscore==="d"?"#B8922A":C.error, color:"white", letterSpacing:"0.05em" }}>
                              NUTRI-SCORE {barcodeResult.nutriscore.toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:6, marginBottom:10 }}>
                        {[{l:"Energy",v:`${barcodeResult.calories}kcal`},{l:"Protein",v:`${barcodeResult.protein_g}g`},{l:"Carbs",v:`${barcodeResult.carbs_g}g`},{l:"Fat",v:`${barcodeResult.fat_g}g`}].map(m=>(
                          <div key={m.l} style={{ backgroundColor:"white", borderRadius:8, padding:"8px 6px", textAlign:"center", border:`1px solid ${C.border}` }}>
                            <p style={{ fontSize:12, fontWeight:600, color:C.green, margin:0 }}>{m.v}</p>
                            <p style={{ fontSize:10, color:C.muted, margin:"2px 0 0", textTransform:"uppercase", letterSpacing:"0.04em" }}>{m.l}</p>
                          </div>
                        ))}
                      </div>
                      <p style={{ fontSize:11, color:C.muted, margin:"0 0 10px" }}>{barcodeResult.serving_size}</p>
                      <button onClick={()=>handleAddBarcode(barcodeResult)} style={{ width:"100%", padding:"11px", backgroundColor:C.green, color:C.bg, border:"none", borderRadius:10, fontSize:13, fontWeight:500, cursor:"pointer" }}>Log this product</button>
                    </div>
                  )}
                </div>
              )}
              {logError && <p style={{ fontSize:12, color:C.error, margin:"10px 0 0", backgroundColor:C.errorBg, padding:"8px 12px", borderRadius:8 }}>{logError} <button onClick={()=>setLogError("")} style={{ background:"none",border:"none",color:C.error,cursor:"pointer",textDecoration:"underline",fontSize:12 }}>Dismiss</button></p>}
            </div>
          </div>

          {/* Entry list */}
          {entries.length > 0 && (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {mealGroups.filter(g=>grouped[g]?.length>0).map(group=>(
                <div key={group}>
                  <p style={{ fontSize:11, fontWeight:600, color:C.muted, textTransform:"uppercase", letterSpacing:"0.07em", margin:"0 0 8px 2px" }}>{group}</p>
                  <div style={{ ...card, overflow:"hidden" }}>
                    {grouped[group].map((entry, idx) => (
                      <div key={entry.id}>
                        {idx>0 && <Divider/>}
                        <div style={{ padding:"12px 14px", display:"flex", alignItems:"center", gap:12 }}>
                          <span style={{ fontSize:20, flexShrink:0 }}>{entry.emoji}</span>
                          <div style={{ flex:1, minWidth:0 }}>
                            <p style={{ fontSize:13, fontWeight:500, color:C.text, margin:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{entry.name}</p>
                            <p style={{ fontSize:11, color:C.muted, margin:"2px 0 0" }}>{entry.time}{entry.notes?` · ${entry.notes}`:""}</p>
                          </div>
                          <div style={{ textAlign:"right", flexShrink:0 }}>
                            <p style={{ fontSize:13, fontWeight:600, color:entry.type==="exercise"?C.sage:C.text, margin:0 }}>{entry.type==="exercise"?`−${Math.abs(entry.calories)}`:entry.calories} kcal</p>
                            {entry.type==="food" && <p style={{ fontSize:10, color:C.muted, margin:"1px 0 0" }}>P {Math.round(entry.protein_g)}  C {Math.round(entry.carbs_g)}  F {Math.round(entry.fat_g)}</p>}
                          </div>
                          <button onClick={()=>setEntries(prev=>prev.filter(e=>e.id!==entry.id))} style={{ background:"none",border:"none",color:C.border,cursor:"pointer",fontSize:18,lineHeight:1,padding:2,flexShrink:0,transition:"color 0.15s" }}>×</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Check-in */}
          <div>
            <button onClick={handleCheckin} disabled={checkinLoad||entries.length===0} style={{ width:"100%", padding:"15px", backgroundColor:checkinLoad||entries.length===0?"#C8D5D1":C.green, color:C.bg, border:"none", borderRadius:12, fontSize:14, fontWeight:500, cursor:checkinLoad||entries.length===0?"not-allowed":"pointer", letterSpacing:"0.02em", transition:"background-color 0.15s" }}>
              {checkinLoad ? "Nora is reviewing your day…" : "How am I doing?"}
            </button>
            {checkin && (
              <div style={{ ...card, padding:"16px 18px", display:"flex", gap:12, marginTop:12, animation:"fadeIn 0.3s ease" }}>
                <NoraAvatar size={34}/>
                <p style={{ fontSize:14, color:C.text, lineHeight:1.65, margin:0, flex:1 }}>{checkin}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MEALS ──────────────────────────────────────────────────────────────── */}
      {activeTab === "meals" && (
        <div style={{ padding:"20px 16px 100px" }}>
          {secHead("Meal Ideas","Personalised suggestions based on your goals and remaining macros")}

          {/* Remaining */}
          {targets && (
            <div style={{ ...card, padding:"16px", marginBottom:14 }}>
              <p style={{ fontSize:11, fontWeight:600, color:C.muted, textTransform:"uppercase", letterSpacing:"0.06em", margin:"0 0 12px" }}>Remaining today</p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:6, textAlign:"center" }}>
                {[
                  {l:"Energy",  v:Math.max(0,Math.round(targets.calories-netCal)),  u:"kcal", col:C.green},
                  {l:"Protein", v:Math.max(0,Math.round(targets.protein_g-totalPro)),u:"g",    col:C.gold},
                  {l:"Carbs",   v:Math.max(0,Math.round(targets.carbs_g-totalCarb)), u:"g",    col:C.sage},
                  {l:"Fat",     v:Math.max(0,Math.round(targets.fat_g-totalFat)),    u:"g",    col:C.tan},
                ].map(item=>(
                  <div key={item.l}>
                    <p style={{ fontSize:15, fontWeight:600, color:item.col, margin:0 }}>{item.v}<span style={{ fontSize:11 }}>{item.u}</span></p>
                    <p style={{ fontSize:10, color:C.muted, margin:"2px 0 0", textTransform:"uppercase", letterSpacing:"0.05em" }}>{item.l}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button onClick={handleGetMeals} disabled={mealsLoad} style={{ width:"100%", padding:"15px", backgroundColor:mealsLoad?"#C8D5D1":C.green, color:C.bg, border:"none", borderRadius:12, fontSize:14, fontWeight:500, cursor:mealsLoad?"not-allowed":"pointer", marginBottom:14, letterSpacing:"0.02em", transition:"background-color 0.15s" }}>
            {mealsLoad ? "Finding ideas for you…" : meals.length>0 ? "Refresh suggestions" : "Get meal suggestions"}
          </button>

          {mealsLoad && <div style={{ display:"flex", flexDirection:"column", gap:10 }}>{[1,2,3,4].map(i=><Skeleton key={i} className="h-36 w-full"/>)}</div>}
          {mealsError && <p style={{ fontSize:13, color:C.error, backgroundColor:C.errorBg, padding:"12px 14px", borderRadius:10, marginBottom:12 }}>{mealsError}</p>}

          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {meals.map((meal,i)=>(
              <div key={i} style={{ ...card, padding:18 }}>
                <div style={{ display:"flex", gap:12, marginBottom:12 }}>
                  <span style={{ fontSize:28, flexShrink:0, lineHeight:1 }}>{meal.emoji}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:8 }}>
                      <h3 style={{ fontSize:15, fontWeight:600, color:C.text, margin:0, lineHeight:1.3 }}>{meal.name}</h3>
                      <span style={{ fontSize:11, color:C.muted, whiteSpace:"nowrap", backgroundColor:C.greenLight, padding:"3px 8px", borderRadius:8, border:`1px solid ${C.border}`, flexShrink:0 }}>{meal.prepTime}</span>
                    </div>
                    <div style={{ display:"flex", gap:12, marginTop:6, fontSize:12 }}>
                      <span style={{ color:C.green, fontWeight:600 }}>{meal.calories} kcal</span>
                      <span style={{ color:C.muted }}>P {meal.protein_g}g</span>
                      <span style={{ color:C.muted }}>C {meal.carbs_g}g</span>
                      <span style={{ color:C.muted }}>F {meal.fat_g}g</span>
                    </div>
                  </div>
                </div>
                {meal.ingredients?.length>0 && (
                  <div style={{ marginBottom:10 }}>
                    <p style={{ fontSize:10, fontWeight:600, color:C.muted, textTransform:"uppercase", letterSpacing:"0.06em", margin:"0 0 5px" }}>Ingredients</p>
                    <p style={{ fontSize:12, color:C.muted, margin:0, lineHeight:1.6 }}>{meal.ingredients.join("  ·  ")}</p>
                  </div>
                )}
                {meal.tip && (
                  <div style={{ display:"flex", gap:10, alignItems:"flex-start", marginBottom:14, padding:"10px 12px", backgroundColor:C.greenLight, borderRadius:10 }}>
                    <NoraAvatar size={18}/>
                    <p style={{ fontSize:12, color:C.muted, fontStyle:"italic", margin:0, flex:1, lineHeight:1.5 }}>{meal.tip}</p>
                  </div>
                )}
                <button onClick={()=>addMealToLog(meal)} style={{ width:"100%", padding:"11px", backgroundColor:C.green, color:C.bg, border:"none", borderRadius:10, fontSize:13, fontWeight:500, cursor:"pointer" }}>Log this meal</button>
              </div>
            ))}
          </div>

          {meals.length===0&&!mealsLoad && (
            <div style={{ textAlign:"center", padding:"48px 0", color:C.muted }}>
              <p style={{ fontSize:32, marginBottom:8 }}>🌿</p>
              <p style={{ fontSize:14 }}>Tap above for personalised meal ideas</p>
            </div>
          )}
        </div>
      )}

      {/* SUPPLEMENTS ────────────────────────────────────────────────────────── */}
      {activeTab === "supplements" && (
        <div style={{ padding:"20px 16px 100px" }}>
          {secHead("Supplements","AI-powered recommendations from your daily nutrition")}

          {/* Nora's analysis */}
          <div style={{ ...card, overflow:"hidden", marginBottom:14 }}>
            <div style={{ backgroundColor:C.green, padding:"16px 18px", display:"flex", gap:12, alignItems:"center" }}>
              <NoraAvatar size={34}/>
              <div>
                <p style={{ fontSize:14, fontWeight:600, color:C.bg, margin:0 }}>Nora's Recommendations</p>
                <p style={{ fontSize:11, color:"rgba(245,240,232,0.65)", margin:"2px 0 0" }}>Based on today's food log and nutritional gaps</p>
              </div>
            </div>
            <div style={{ padding:16, display:"flex", flexDirection:"column", gap:10 }}>
              {supLoad && <div style={{ display:"flex", flexDirection:"column", gap:8 }}><Skeleton className="h-16 w-full"/><Skeleton className="h-16 w-full"/><Skeleton className="h-16 w-full"/></div>}

              {!supLoad && supOverall && (
                <div style={{ display:"flex", gap:10, backgroundColor:C.greenLight, borderRadius:10, padding:"12px 14px" }}>
                  <NoraAvatar size={22}/>
                  <p style={{ fontSize:13, color:C.text, fontStyle:"italic", lineHeight:1.6, margin:0, flex:1 }}>{supOverall}</p>
                </div>
              )}

              {!supLoad && supWarnings.length>0 && (
                <div style={{ backgroundColor:C.amberBg, border:`1px solid ${C.gold}40`, borderRadius:10, padding:"12px 14px" }}>
                  <p style={{ fontSize:11, fontWeight:700, color:C.amber, textTransform:"uppercase", letterSpacing:"0.06em", margin:"0 0 8px" }}>Interactions & Cautions</p>
                  {supWarnings.map((w,i)=>(
                    <p key={i} style={{ fontSize:13, color:C.amber, margin:"4px 0 0", lineHeight:1.5 }}>· {w}</p>
                  ))}
                </div>
              )}

              {!supLoad && supRecs.map((rec,i)=>{
                const borderCol = rec.priority==="high"?C.error:rec.priority==="medium"?C.gold:C.sage;
                const isAdded = userSupps.some(s=>s.name.toLowerCase()===rec.name.toLowerCase());
                return (
                  <div key={i} style={{ borderRadius:10, border:`1px solid ${C.border}`, borderLeft:`3px solid ${borderCol}`, padding:"12px 14px", backgroundColor:C.card }}>
                    <div style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                          <span style={{ fontSize:13, fontWeight:600, color:C.text }}>{rec.name}</span>
                          {rec.dose && <span style={{ fontSize:11, color:C.muted }}>{rec.dose}</span>}
                        </div>
                        <p style={{ fontSize:12, color:C.muted, margin:0, lineHeight:1.5 }}>{rec.reason}</p>
                      </div>
                      <button onClick={()=>addRecommendedSupp(rec)} disabled={isAdded} style={{ padding:"5px 10px", borderRadius:8, border:`1px solid ${isAdded?C.sage:C.border}`, backgroundColor:isAdded?C.greenLight:C.card, color:isAdded?C.sage:C.muted, fontSize:11, fontWeight:500, cursor:isAdded?"default":"pointer", flexShrink:0, transition:"all 0.15s" }}>
                        {isAdded?"Added ✓":"+ Add"}
                      </button>
                    </div>
                  </div>
                );
              })}

              {!supLoad && supRecs.length===0 && !supOverall && (
                <p style={{ fontSize:13, color:C.muted, textAlign:"center", padding:"16px 0", margin:0 }}>
                  {foodE.length===0 ? "Log some food first, then analyse your nutritional gaps." : "Tap below to receive personalised supplement guidance."}
                </p>
              )}

              <button onClick={handleGetSupRecs} disabled={supLoad} style={{ width:"100%", padding:"13px", backgroundColor:supLoad?"#C8D5D1":C.green, color:C.bg, border:"none", borderRadius:10, fontSize:13, fontWeight:500, cursor:supLoad?"not-allowed":"pointer", letterSpacing:"0.02em", transition:"background-color 0.15s" }}>
                {supLoad ? "Analysing your nutrition…" : supRecs.length>0 ? "Re-analyse" : "Analyse my nutrition gaps"}
              </button>
            </div>
          </div>

          {/* My supplements */}
          <div style={{ ...card, overflow:"hidden" }}>
            <div style={{ padding:"15px 18px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div>
                <p style={{ fontSize:14, fontWeight:600, color:C.text, margin:0 }}>My Daily Supplements</p>
                <p style={{ fontSize:11, color:C.muted, margin:"2px 0 0" }}>
                  {userSupps.length===0 ? "None added yet" : `${userSupps.filter(s=>s.taken).length} of ${userSupps.length} taken today`}
                </p>
              </div>
              {userSupps.length>0 && userSupps.every(s=>s.taken) && (
                <span style={{ fontSize:11, color:C.sage, fontWeight:600, backgroundColor:C.greenLight, padding:"4px 10px", borderRadius:20, border:`1px solid ${C.sage}40` }}>All taken</span>
              )}
            </div>
            <div style={{ padding:16, display:"flex", flexDirection:"column", gap:10 }}>
              <div style={{ display:"flex", gap:8 }}>
                <input className="focus-gold" style={{...inp,flex:1}} placeholder="Supplement name (e.g. Vitamin D)" value={newSupName} onChange={e=>setNewSupName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addUserSupp()}/>
                <input className="focus-gold" style={{...inp,width:72}} placeholder="Dose" value={newSupDose} onChange={e=>setNewSupDose(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addUserSupp()}/>
                <button onClick={addUserSupp} disabled={!newSupName.trim()} style={{ padding:"11px 14px", backgroundColor:newSupName.trim()?C.green:"#C8D5D1", color:C.bg, border:"none", borderRadius:10, fontSize:17, fontWeight:500, cursor:newSupName.trim()?"pointer":"not-allowed", lineHeight:1 }}>+</button>
              </div>

              {userSupps.length===0
                ? <p style={{ fontSize:13, color:C.muted, textAlign:"center", padding:"16px 0", margin:0 }}>Add your supplements above, or tap "+ Add" on a recommendation.</p>
                : <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                    {userSupps.map(s=>(
                      <div key={s.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"11px 12px", borderRadius:10, border:`1px solid ${s.taken?C.sage:C.border}`, backgroundColor:s.taken?C.greenLight:C.card, transition:"all 0.2s ease" }}>
                        <button type="button" onClick={()=>toggleSupp(s.id)} style={{ width:22, height:22, borderRadius:"50%", border:`1.5px solid ${s.taken?C.sage:C.border}`, backgroundColor:s.taken?C.sage:"transparent", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", flexShrink:0, transition:"all 0.2s ease", color:"white", fontSize:11, fontWeight:700 }}>
                          {s.taken && "✓"}
                        </button>
                        <div style={{ flex:1, minWidth:0 }}>
                          <span style={{ fontSize:13, fontWeight:500, color:s.taken?C.muted:C.text, textDecoration:s.taken?"line-through":"none" }}>{s.name}</span>
                          {s.dose && <span style={{ fontSize:11, color:C.muted, marginLeft:8 }}>{s.dose}</span>}
                        </div>
                        <button onClick={()=>removeSupp(s.id)} style={{ background:"none", border:"none", color:C.border, cursor:"pointer", fontSize:18, lineHeight:1, padding:2, flexShrink:0, transition:"color 0.15s" }}>×</button>
                      </div>
                    ))}
                  </div>
              }
            </div>
          </div>
        </div>
      )}

      {/* PROGRESS ───────────────────────────────────────────────────────────── */}
      {activeTab === "progress" && (
        <div style={{ padding:"20px 16px 100px", display:"flex", flexDirection:"column", gap:14 }}>
          {secHead("Progress")}

          {/* Streak */}
          <div style={{ ...card, padding:"18px 20px", display:"flex", alignItems:"center", gap:16 }}>
            <div style={{ width:52, height:52, borderRadius:14, backgroundColor:C.goldLight, border:`1px solid ${C.gold}30`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <FlameIcon size={22} color={C.gold}/>
            </div>
            <div style={{ flex:1 }}>
              <p style={{ fontFamily:serif, fontSize:22, fontWeight:600, color:C.text, margin:0 }}>{streak} <span style={{ fontSize:14, fontWeight:400, color:C.muted }}>day{streak!==1?"s":""}</span></p>
              <p style={{ fontSize:12, color:C.muted, margin:"2px 0 0" }}>{streak>=7?"Exceptional streak":streak>=3?"Fine momentum":streak>0?"Keep going":"Begin logging to build your streak"}</p>
            </div>
            <div style={{ textAlign:"right" }}>
              <p style={{ fontSize:22, fontWeight:600, color:C.green, margin:0 }}>{last7.filter(d=>d.calories>0).length}<span style={{ fontSize:12, color:C.muted, fontWeight:400 }}>/7</span></p>
              <p style={{ fontSize:10, color:C.muted, margin:"2px 0 0", textTransform:"uppercase", letterSpacing:"0.05em" }}>Days logged</p>
            </div>
          </div>

          {/* 7-day chart */}
          <div style={{ ...card, padding:"20px 16px" }}>
            <p style={{ fontSize:12, fontWeight:600, color:C.muted, textTransform:"uppercase", letterSpacing:"0.06em", margin:"0 0 16px" }}>Energy · 7 days</p>
            <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", gap:4, height:100 }}>
              {last7.map(d => {
                const h = targets ? Math.round((d.calories/targets.calories)*100) : 0;
                const col = h===0?C.track:h<=105?C.green:h<=120?C.gold:C.error;
                return (
                  <div key={d.date} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                    <div style={{ width:"100%", position:"relative", display:"flex", alignItems:"flex-end", height:80 }}>
                      <div style={{ width:"100%", height:`${Math.min(h||0,150)}%`, backgroundColor:col, borderRadius:"4px 4px 0 0", transition:"height 0.6s cubic-bezier(0.4,0,0.2,1)" }}/>
                      {targets && <div style={{ position:"absolute", width:"100%", borderTop:`1px dashed ${C.border}`, bottom:"66.67%" }}/>}
                    </div>
                    <span style={{ fontSize:10, color:d.isToday?C.green:C.muted, fontWeight:d.isToday?700:400 }}>{d.day}</span>
                    {d.calories>0 && <span style={{ fontSize:9, color:C.muted }}>{Math.round(d.calories/100)/10}k</span>}
                  </div>
                );
              })}
            </div>
            <div style={{ display:"flex", gap:12, marginTop:12, flexWrap:"wrap" }}>
              {[{col:C.green,label:"On target"},{col:C.gold,label:"Slightly over"},{col:C.error,label:"Over"}].map(item=>(
                <div key={item.label} style={{ display:"flex", alignItems:"center", gap:4 }}>
                  <div style={{ width:10, height:10, borderRadius:3, backgroundColor:item.col }}/>
                  <span style={{ fontSize:10, color:C.muted }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Averages */}
          {targets && (
            <div style={{ ...card, padding:"18px 16px" }}>
              <p style={{ fontSize:12, fontWeight:600, color:C.muted, textTransform:"uppercase", letterSpacing:"0.06em", margin:"0 0 14px" }}>7-day averages {daysWithData.length===0&&<span style={{ fontWeight:400, textTransform:"none" }}>— no data yet</span>}</p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                {[
                  {label:"Avg Energy",  val:`${avg("calories")} kcal`, target:`${targets.calories} kcal`},
                  {label:"Avg Protein", val:`${avg("protein")}g`,      target:`${targets.protein_g}g`},
                  {label:"Avg Carbs",   val:`${avg("carbs")}g`,        target:`${targets.carbs_g}g`},
                  {label:"Avg Fat",     val:`${avg("fat")}g`,          target:`${targets.fat_g}g`},
                ].map(item=>(
                  <div key={item.label} style={{ backgroundColor:C.greenLight, borderRadius:12, padding:"12px 14px" }}>
                    <p style={{ fontSize:11, color:C.muted, margin:"0 0 4px", textTransform:"uppercase", letterSpacing:"0.05em" }}>{item.label}</p>
                    <p style={{ fontSize:16, fontWeight:600, color:C.green, margin:0 }}>{daysWithData.length>0?item.val:"—"}</p>
                    <p style={{ fontSize:10, color:C.muted, margin:"2px 0 0" }}>Target: {item.target}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hydration */}
          {targets && daysWithData.length>0 && (
            <div style={{ ...card, padding:"18px 16px" }}>
              <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:14 }}>
                <DropIcon size={14} color={C.slate}/>
                <p style={{ fontSize:12, fontWeight:600, color:C.muted, textTransform:"uppercase", letterSpacing:"0.06em", margin:0 }}>Hydration · this week</p>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {last7.slice().reverse().filter(d=>d.isToday||d.waterMl>0||d.entryCount>0).slice(0,5).map(d=>(
                  <div key={d.date} style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <span style={{ fontSize:11, color:d.isToday?C.green:C.muted, width:28, fontWeight:d.isToday?700:400 }}>{d.day}</span>
                    <div style={{ flex:1, height:5, backgroundColor:C.track, borderRadius:6, overflow:"hidden" }}>
                      <div style={{ width:`${Math.min((d.waterMl/(targets.water_ml||1))*100,100)}%`, backgroundColor:C.slate, height:"100%", borderRadius:6, transition:"width 0.5s ease" }}/>
                    </div>
                    <span style={{ fontSize:11, color:C.muted, width:36, textAlign:"right" }}>{d.waterMl>0?`${(d.waterMl/1000).toFixed(1)}L`:"—"}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Weekly report */}
          <button onClick={handleWeeklyReport} disabled={weeklyLoad} style={{ width:"100%", padding:"15px", backgroundColor:weeklyLoad?"#C8D5D1":C.green, color:C.bg, border:"none", borderRadius:12, fontSize:14, fontWeight:500, cursor:weeklyLoad?"not-allowed":"pointer", letterSpacing:"0.02em", transition:"background-color 0.15s" }}>
            {weeklyLoad ? "Generating your report…" : "Generate weekly report"}
          </button>

          {weeklyLoad && <div style={{ ...card, padding:20, display:"flex", flexDirection:"column", gap:10 }}><Skeleton className="h-4 w-full"/><Skeleton className="h-4 w-3/4"/><Skeleton className="h-4 w-5/6"/></div>}
          {weeklyReport && (
            <div style={{ ...card, overflow:"hidden", animation:"fadeIn 0.3s ease" }}>
              <div style={{ backgroundColor:C.green, padding:"18px 20px", display:"flex", gap:14 }}>
                <NoraAvatar size={38}/>
                <div>
                  <p style={{ fontSize:12, color:"rgba(245,240,232,0.6)", margin:"0 0 4px", textTransform:"uppercase", letterSpacing:"0.06em" }}>Weekly Report</p>
                  <p style={{ fontSize:14, color:C.bg, lineHeight:1.5, margin:0 }}>{weeklyReport.headline}</p>
                </div>
              </div>
              <div style={{ padding:20, display:"flex", flexDirection:"column", gap:16 }}>
                <div>
                  <p style={{ fontSize:11, fontWeight:700, color:C.sage, textTransform:"uppercase", letterSpacing:"0.07em", margin:"0 0 8px" }}>Wins this week</p>
                  {weeklyReport.wins?.map((w,i)=><p key={i} style={{ fontSize:13, color:C.text, margin:"4px 0", display:"flex", gap:8 }}><span style={{ color:C.sage }}>✓</span>{w}</p>)}
                </div>
                <Divider/>
                <div>
                  <p style={{ fontSize:11, fontWeight:700, color:C.gold, textTransform:"uppercase", letterSpacing:"0.07em", margin:"0 0 8px" }}>For next week</p>
                  {weeklyReport.suggestions?.map((s,i)=><p key={i} style={{ fontSize:13, color:C.text, margin:"4px 0", display:"flex", gap:8 }}><span style={{ color:C.gold }}>→</span>{s}</p>)}
                </div>
                <div style={{ backgroundColor:C.greenLight, borderRadius:10, padding:"12px 14px" }}>
                  <p style={{ fontSize:10, fontWeight:700, color:C.green, textTransform:"uppercase", letterSpacing:"0.07em", margin:"0 0 5px" }}>Did you know</p>
                  <p style={{ fontSize:13, color:C.text, margin:0, lineHeight:1.6 }}>{weeklyReport.fun_fact}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ME ─────────────────────────────────────────────────────────────────── */}
      {activeTab === "me" && (
        <div style={{ padding:"20px 16px 100px", display:"flex", flexDirection:"column", gap:14 }}>
          {secHead("Profile")}

          {/* Profile card */}
          <div style={{ ...card, padding:"20px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:20 }}>
              <div style={{ width:52, height:52, borderRadius:"50%", backgroundColor:C.green, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, fontWeight:700, color:C.bg, flexShrink:0 }}>{profile.name[0]?.toUpperCase()}</div>
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
                  <div key={item.label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom: i<arr.length-1?`1px solid ${C.border}`:"none" }}>
                    <span style={{ fontSize:13, color:C.text }}>{item.label}</span>
                    <span style={{ fontSize:13, fontWeight:600, color:C.green }}>{item.val}</span>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Health data */}
          <div style={{ ...card, overflow:"hidden" }}>
            <div style={{ padding:"15px 18px", borderBottom:`1px solid ${C.border}` }}>
              <p style={{ fontSize:14, fontWeight:600, color:C.text, margin:0 }}>Health Data</p>
              <p style={{ fontSize:11, color:C.muted, margin:"2px 0 0" }}>Manually sync your activity and sleep</p>
            </div>
            <div style={{ padding:16, display:"flex", flexDirection:"column", gap:12 }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                <div><label style={{ fontSize:11, color:C.muted, fontWeight:500, textTransform:"uppercase", letterSpacing:"0.05em", display:"block", marginBottom:5 }}>Steps today</label><input className="focus-gold" type="number" style={inp} placeholder="e.g. 8500" value={healthData.steps} onChange={e=>setHealthData(p=>({...p,steps:e.target.value}))}/></div>
                <div><label style={{ fontSize:11, color:C.muted, fontWeight:500, textTransform:"uppercase", letterSpacing:"0.05em", display:"block", marginBottom:5 }}>Sleep hours</label><input className="focus-gold" type="number" style={inp} placeholder="e.g. 7.5" value={healthData.sleep} onChange={e=>setHealthData(p=>({...p,sleep:e.target.value}))}/></div>
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
                <div><label style={{ fontSize:11, color:C.muted, fontWeight:500, textTransform:"uppercase", letterSpacing:"0.05em", display:"block", marginBottom:5 }}>Resting HR</label><input className="focus-gold" type="number" style={inp} placeholder="e.g. 62 bpm" value={healthData.heartRate} onChange={e=>setHealthData(p=>({...p,heartRate:e.target.value}))}/></div>
                <div><label style={{ fontSize:11, color:C.muted, fontWeight:500, textTransform:"uppercase", letterSpacing:"0.05em", display:"block", marginBottom:5 }}>Workout min</label><input className="focus-gold" type="number" style={inp} placeholder="e.g. 45" value={healthData.workoutDuration} onChange={e=>setHealthData(p=>({...p,workoutDuration:e.target.value}))}/></div>
              </div>
              <button onClick={()=>setHealthSaved(true)} style={{ width:"100%", padding:"12px", backgroundColor:C.green, color:C.bg, border:"none", borderRadius:10, fontSize:13, fontWeight:500, cursor:"pointer", letterSpacing:"0.02em" }}>{healthSaved?"Health data updated":"Save health data"}</button>
            </div>
          </div>

          {/* Reset buttons */}
          <button onClick={()=>{setEntries([]);setCheckin("");setWaterMl(0);}} style={{ width:"100%", padding:"13px", backgroundColor:"transparent", border:`1px solid ${C.border}`, borderRadius:12, fontSize:13, color:C.error, cursor:"pointer", letterSpacing:"0.02em" }}>Reset today's log</button>
          <button onClick={resetProfile} style={{ width:"100%", padding:"13px", backgroundColor:"transparent", border:`1px solid ${C.border}`, borderRadius:12, fontSize:13, color:C.muted, cursor:"pointer", letterSpacing:"0.02em" }}>Change profile</button>

          {/* About */}
          <div style={{ ...card, padding:"18px 20px" }}>
            <div style={{ display:"flex", gap:12, alignItems:"center", marginBottom:10 }}>
              <NoraAvatar size={32}/>
              <div>
                <p style={{ fontSize:14, fontWeight:600, color:C.text, margin:0 }}>About Nora</p>
                <p style={{ fontSize:11, color:C.muted, margin:0 }}>AI Nutrition Companion</p>
              </div>
            </div>
            <p style={{ fontSize:13, color:C.muted, lineHeight:1.7, margin:0 }}>Nora is powered by Claude, Anthropic's AI. She analyses your nutrition data, provides personalised daily targets, and offers warm, evidence-based guidance. Nora is not a medical professional — always consult a registered dietitian for clinical advice.</p>
          </div>
        </div>
      )}

      {/* TAB BAR ────────────────────────────────────────────────────────────── */}
      <div style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:480, backgroundColor:"rgba(250,250,247,0.96)", borderTop:`1px solid ${C.border}`, padding:"8px 4px 10px", display:"flex", justifyContent:"space-around", zIndex:10, backdropFilter:"blur(8px)" }}>
        {[
          {id:"today",      label:"Today"},
          {id:"meals",      label:"Meals"},
          {id:"supplements",label:"Supps"},
          {id:"progress",   label:"Progress"},
          {id:"me",         label:"Me"},
        ].map(tab=>{
          const active = activeTab===tab.id;
          return (
            <button key={tab.id} onClick={()=>setActiveTab(tab.id)} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:3, padding:"6px 10px", borderRadius:10, border:"none", backgroundColor:"transparent", cursor:"pointer", transition:"all 0.15s" }}>
              <TabIcon id={tab.id} active={active}/>
              <span style={{ fontSize:10, fontWeight:active?600:400, color:active?C.green:C.muted, letterSpacing:"0.03em" }}>{tab.label}</span>
              {active && <div style={{ width:16, height:2, borderRadius:2, backgroundColor:C.gold }}/>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
