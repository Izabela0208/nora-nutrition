import { useState, useEffect, useRef } from "react";
import { RadialBarChart, RadialBar, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine } from "recharts";

const NoraAvatar = ({ size = 36 }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="20" r="20" fill="#4ade80"/>
    <circle cx="20" cy="20" r="16" fill="#22c55e"/>
    <path d="M20 10 C20 10 18 14 16 16 C14 18 10 18 10 20 C10 22 14 22 16 24 C18 26 20 30 20 30 C20 30 22 26 24 24 C26 22 30 22 30 20 C30 18 26 18 24 16 C22 14 20 10 20 10Z" fill="#bbf7d0" opacity="0.9"/>
    <circle cx="15" cy="20" r="1.5" fill="white" opacity="0.8"/>
    <circle cx="25" cy="20" r="1.5" fill="white" opacity="0.8"/>
    <path d="M17 24 Q20 26.5 23 24" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
  </svg>
);

const callClaude = async (systemPrompt, userContent) => {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: 1200,
      system: systemPrompt,
      messages: [{ role: "user", content: userContent }],
    }),
  });
  const data = await response.json();
  return data.content?.map(b => b.text || "").join("") || "";
};

const parseJSON = (text) => {
  try {
    return JSON.parse(text.replace(/```json|```/g, "").trim());
  } catch {
    const arr = text.match(/\[[\s\S]*\]/);
    if (arr) { try { return JSON.parse(arr[0]); } catch {} }
    const obj = text.match(/\{[\s\S]*\}/);
    if (obj) return JSON.parse(obj[0]);
    throw new Error("Could not parse JSON");
  }
};

const ProgressRing = ({ value, max, color, label, unit, size = 90 }) => {
  const pct = Math.min((value / max) * 100, 100);
  const r = (size - 14) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-1">
      <div style={{ width: size, height: size }} className="relative">
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f0fdf4" strokeWidth="8"/>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.6s ease" }}/>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-sm font-bold text-gray-800" style={{ lineHeight: 1 }}>{Math.round(value)}</span>
          <span className="text-xs text-gray-400">{unit}</span>
        </div>
      </div>
      <span className="text-xs text-gray-500 font-medium">{label}</span>
      <span className="text-xs text-gray-400">{Math.round(max)} goal</span>
    </div>
  );
};

const BarProgress = ({ value, max, color, label, unit }) => {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 w-12 text-right font-medium">{label}</span>
      <div className="flex-1 h-2.5 bg-green-50 rounded-full overflow-hidden">
        <div style={{ width: `${pct}%`, backgroundColor: color, transition: "width 0.5s ease" }} className="h-full rounded-full"/>
      </div>
      <span className="text-xs text-gray-500 w-16">{Math.round(value)}/{max} {unit}</span>
    </div>
  );
};

const Skeleton = ({ className }) => <div className={`animate-pulse bg-green-100 rounded-xl ${className}`}/>;

const DEMO_ENTRIES = [
  { id: 1, type: "food", name: "Greek yogurt with berries & honey", time: "8:15 AM", mealGroup: "Morning", calories: 210, protein_g: 18, carbs_g: 28, fat_g: 3, fiber_g: 3, emoji: "🍓", notes: "Parfait-style" },
  { id: 2, type: "food", name: "Oat milk latte", time: "8:30 AM", mealGroup: "Morning", calories: 110, protein_g: 2, carbs_g: 18, fat_g: 3, fiber_g: 1, emoji: "☕", notes: "" },
  { id: 3, type: "exercise", name: "Morning run (4km)", time: "7:45 AM", mealGroup: "Morning", calories: -280, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0, emoji: "🏃", notes: "Easy pace" },
  { id: 4, type: "food", name: "Grilled chicken salad with avocado", time: "12:30 PM", mealGroup: "Midday", calories: 420, protein_g: 38, carbs_g: 22, fat_g: 18, fiber_g: 7, emoji: "🥗", notes: "Olive oil dressing" },
  { id: 5, type: "food", name: "Whole grain crackers with hummus", time: "3:30 PM", mealGroup: "Snacks", calories: 180, protein_g: 6, carbs_g: 24, fat_g: 7, fiber_g: 4, emoji: "🧆", notes: "" },
  { id: 6, type: "food", name: "Salmon with roasted veggies & quinoa", time: "7:00 PM", mealGroup: "Evening", calories: 560, protein_g: 42, carbs_g: 48, fat_g: 16, fiber_g: 8, emoji: "🐟", notes: "Lemon herb" },
];

export default function NutritionApp() {
  const [phase, setPhase] = useState("onboarding");
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState({
    name: "", age: "", heightCm: "", heightFt: "", heightIn: "",
    weightKg: "", weightLbs: "", heightUnit: "cm", weightUnit: "kg",
    goals: [], activity: "", preferences: "",
  });
  const [targets, setTargets] = useState(null);
  const [welcomeMsg, setWelcomeMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("today");
  const [entries, setEntries] = useState([]);
  const [waterMl, setWaterMl] = useState(0);
  const [logMode, setLogMode] = useState("text");
  const [logInput, setLogInput] = useState("");
  const [logLoading, setLogLoading] = useState(false);
  const [logError, setLogError] = useState("");
  const [greeting, setGreeting] = useState("");
  const [greetingLoading, setGreetingLoading] = useState(false);
  const [checkin, setCheckin] = useState("");
  const [checkinLoading, setCheckinLoading] = useState(false);
  const [weeklyReport, setWeeklyReport] = useState(null);
  const [weeklyLoading, setWeeklyLoading] = useState(false);
  const [meals, setMeals] = useState([]);
  const [mealsLoading, setMealsLoading] = useState(false);
  const [mealsError, setMealsError] = useState("");
  const [healthData, setHealthData] = useState({ steps: "", sleep: "", sleepQuality: "ok", heartRate: "", workoutType: "", workoutDuration: "" });
  const [healthSaved, setHealthSaved] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [history, setHistory] = useState([]);
  const [selectedGoals, setSelectedGoals] = useState([]);
  const fileRef = useRef();

  const foodEntries = entries.filter(e => e.type === "food");
  const exerciseEntries = entries.filter(e => e.type === "exercise");
  const totalCals = foodEntries.reduce((s, e) => s + (e.calories || 0), 0);
  const burnedCals = exerciseEntries.reduce((s, e) => s + Math.abs(e.calories || 0), 0);
  const netCals = totalCals - burnedCals;
  const totalProtein = foodEntries.reduce((s, e) => s + (e.protein_g || 0), 0);
  const totalCarbs = foodEntries.reduce((s, e) => s + (e.carbs_g || 0), 0);
  const totalFat = foodEntries.reduce((s, e) => s + (e.fat_g || 0), 0);
  const totalFiber = foodEntries.reduce((s, e) => s + (e.fiber_g || 0), 0);
  const goalsStr = profile.goals.join(", ");

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split("T")[0];
    const isToday = i === 6;
    const rec = !isToday ? history.find(r => r.date === dateStr) : null;
    return {
      day: ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d.getDay()],
      date: dateStr, isToday,
      calories: isToday ? Math.round(netCals) : (rec?.calories || 0),
      protein: isToday ? Math.round(totalProtein) : (rec?.protein || 0),
      carbs: isToday ? Math.round(totalCarbs) : (rec?.carbs || 0),
      fat: isToday ? Math.round(totalFat) : (rec?.fat || 0),
      waterMl: isToday ? waterMl : (rec?.waterMl || 0),
      entryCount: isToday ? entries.length : (rec?.entryCount || 0),
    };
  });

  const streak = (() => {
    let n = 0;
    const today = new Date().toISOString().split("T")[0];
    for (let i = 0; i < 30; i++) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const ds = d.toISOString().split("T")[0];
      const ec = ds === today ? entries.length : (history.find(r => r.date === ds)?.entryCount || 0);
      if (ec > 0) n++;
      else if (ds !== today) break;
    }
    return n;
  })();

  const daysWithData = last7Days.filter(d => d.calories > 0);
  const avg = (key) => daysWithData.length > 0 ? Math.round(daysWithData.reduce((s, d) => s + (d[key] || 0), 0) / daysWithData.length) : 0;

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const h = localStorage.getItem("nora_history");
      if (h) setHistory(JSON.parse(h));
      const p = localStorage.getItem("nora_profile");
      const t = localStorage.getItem("nora_targets");
      if (p && t) {
        const parsed = JSON.parse(p);
        if (parsed.goal && !parsed.goals) { parsed.goals = [parsed.goal]; delete parsed.goal; }
        if (!Array.isArray(parsed.goals)) parsed.goals = [];
        setProfile(parsed);
        setTargets(JSON.parse(t));
        setPhase("app");
      }
    } catch {}
  }, []);

  // Auto-save today's snapshot
  useEffect(() => {
    if (phase !== "app" || !targets) return;
    const today = new Date().toISOString().split("T")[0];
    const rec = { date: today, calories: Math.round(netCals), protein: Math.round(totalProtein), carbs: Math.round(totalCarbs), fat: Math.round(totalFat), fiber: Math.round(totalFiber), waterMl, entryCount: entries.length };
    setHistory(prev => {
      const updated = [...prev.filter(r => r.date !== today), rec];
      try { localStorage.setItem("nora_history", JSON.stringify(updated.slice(-30))); } catch {}
      return updated;
    });
  }, [entries, waterMl, phase]);

  // Persist profile/targets when entering app
  useEffect(() => {
    if (phase === "app" && targets) {
      try {
        localStorage.setItem("nora_profile", JSON.stringify(profile));
        localStorage.setItem("nora_targets", JSON.stringify(targets));
      } catch {}
    }
  }, [phase]);

  useEffect(() => {
    if (phase === "app" && activeTab === "today" && !greeting) fetchGreeting();
  }, [phase, activeTab]);

  const fetchGreeting = async () => {
    setGreetingLoading(true);
    try {
      const health = healthSaved ? `Health: steps=${healthData.steps}, sleep=${healthData.sleep}h (${healthData.sleepQuality}), HR=${healthData.heartRate}bpm.` : "";
      const text = await callClaude(
        "You are Nora, a warm nutritionist AI. 1-2 sentences max. Never mention your own name.",
        `User: ${profile.name}, goals: ${goalsStr}, activity: ${profile.activity}. Time: ${new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}. ${health} Short personalised greeting + one actionable tip.`
      );
      setGreeting(text);
    } catch { setGreeting("Ready to make today a great nutrition day? Let's do this! 🌿"); }
    setGreetingLoading(false);
  };

  const handleOnboardingSubmit = async () => {
    setLoading(true); setError("");
    try {
      const heightCm = profile.heightUnit === "cm" ? profile.heightCm : Math.round(parseInt(profile.heightFt) * 30.48 + parseInt(profile.heightIn || 0) * 2.54);
      const weightKg = profile.weightUnit === "kg" ? profile.weightKg : Math.round(parseFloat(profile.weightLbs) * 0.453592);
      const goalsForSubmit = selectedGoals.join(", ");
      const text = await callClaude(
        "You are Nora, a warm nutritionist AI. Return ONLY valid JSON, no preamble.",
        `Calculate daily nutrition targets. User: ${profile.name}, age ${profile.age}, height ${heightCm}cm, weight ${weightKg}kg, goals: ${goalsForSubmit}, activity: ${profile.activity}, preferences: ${profile.preferences || "none"}. Use Mifflin-St Jeor. Return JSON: { "calories": number, "protein_g": number, "carbs_g": number, "fat_g": number, "fiber_g": number, "water_ml": number, "key_micronutrients": ["string"], "welcome_message": "2-3 warm sentences" }`
      );
      const data = parseJSON(text);
      setTargets(data);
      setProfile(p => ({ ...p, goals: selectedGoals }));
      setWelcomeMsg(data.welcome_message || `Welcome ${profile.name}! Let's build great habits together.`);
      setPhase("welcome");
    } catch { setError("Something went wrong calculating your targets. Please try again."); }
    setLoading(false);
  };

  const handleLogText = async () => {
    if (!logInput.trim()) return;
    setLogLoading(true); setLogError("");
    try {
      const text = await callClaude(
        "You are a nutrition AI. Return ONLY valid JSON.",
        `Parse: "${logInput}". Return JSON: { "type": "food"|"exercise", "name": "string", "time": "H:MM AM", "mealGroup": "Morning"|"Midday"|"Snacks"|"Evening", "calories": number (negative for exercise), "protein_g": number, "carbs_g": number, "fat_g": number, "fiber_g": number, "notes": "string", "emoji": "emoji" }`
      );
      const entry = parseJSON(text);
      setEntries(prev => [...prev, { ...entry, id: Date.now() }]);
      setLogInput("");
    } catch { setLogError("Couldn't parse that. Try rephrasing."); }
    setLogLoading(false);
  };

  const handleLogImage = async () => {
    if (!imageFile) return;
    setLogLoading(true); setLogError("");
    try {
      const base64 = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result.split(",")[1]); r.onerror = rej; r.readAsDataURL(imageFile); });
      const content = [
        { type: "image", source: { type: "base64", media_type: imageFile.type, data: base64 } },
        { type: "text", text: `Identify food. Return ONLY valid JSON: { "type": "food", "name": "string", "time": "${new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}", "mealGroup": "Snacks", "calories": number, "protein_g": number, "carbs_g": number, "fat_g": number, "fiber_g": number, "notes": "string", "emoji": "emoji" }` }
      ];
      const text = await callClaude("You are a nutrition AI with vision. Return ONLY valid JSON.", content);
      setEntries(prev => [...prev, { ...parseJSON(text), id: Date.now() }]);
      setImageFile(null);
    } catch { setLogError("Couldn't read the image. Try a clearer photo."); }
    setLogLoading(false);
  };

  const handleCheckin = async () => {
    setCheckinLoading(true); setCheckin("");
    try {
      const summary = `Cal: ${Math.round(netCals)}/${targets?.calories}, P: ${Math.round(totalProtein)}/${targets?.protein_g}g, C: ${Math.round(totalCarbs)}/${targets?.carbs_g}g, Fat: ${Math.round(totalFat)}/${targets?.fat_g}g, Water: ${waterMl}/${targets?.water_ml}ml. Logged: ${entries.map(e => e.name).join(", ")}.`;
      const health = healthSaved ? `Health: steps=${healthData.steps}, sleep=${healthData.sleep}h.` : "";
      const text = await callClaude(
        "You are Nora. Be encouraging, use we/let's. 2-3 sentences.",
        `${profile.name}'s day. Goals: ${goalsStr}. ${summary} ${health} Warm check-in.`
      );
      setCheckin(text);
    } catch { setCheckin("You're doing wonderfully — every mindful choice adds up! 🌿"); }
    setCheckinLoading(false);
  };

  const handleGetMeals = async () => {
    setMealsLoading(true); setMealsError("");
    try {
      const remCal = Math.max(0, Math.round((targets?.calories || 0) - netCals));
      const remProt = Math.max(0, Math.round((targets?.protein_g || 0) - totalProtein));
      const remCarb = Math.max(0, Math.round((targets?.carbs_g || 0) - totalCarbs));
      const remFat = Math.max(0, Math.round((targets?.fat_g || 0) - totalFat));
      const text = await callClaude(
        "You are Nora. Return ONLY a valid JSON array, no preamble or markdown.",
        `Suggest 4 meals for ${profile.name}. Goals: ${goalsStr}. Preferences: ${profile.preferences || "none"}. Remaining today: ~${remCal} kcal, protein ${remProt}g, carbs ${remCarb}g, fat ${remFat}g. Return array: [{ "name": "string", "emoji": "single emoji", "prepTime": "X min", "mealGroup": "Morning"|"Midday"|"Snacks"|"Evening", "calories": number, "protein_g": number, "carbs_g": number, "fat_g": number, "fiber_g": number, "ingredients": ["short string"], "tip": "one-line tip" }]`
      );
      const data = parseJSON(text);
      setMeals(Array.isArray(data) ? data : (data.meals || []));
    } catch { setMealsError("Couldn't get suggestions. Please try again."); }
    setMealsLoading(false);
  };

  const addMealToLog = (meal) => {
    const h = new Date().getHours();
    const mealGroup = meal.mealGroup || (h < 11 ? "Morning" : h < 15 ? "Midday" : h < 18 ? "Snacks" : "Evening");
    setEntries(prev => [...prev, { id: Date.now(), type: "food", name: meal.name, time: new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}), mealGroup, calories: meal.calories, protein_g: meal.protein_g, carbs_g: meal.carbs_g, fat_g: meal.fat_g, fiber_g: meal.fiber_g || 0, emoji: meal.emoji, notes: "From Nora's suggestions" }]);
    setActiveTab("today");
  };

  const handleWeeklyReport = async () => {
    setWeeklyLoading(true); setWeeklyReport(null);
    try {
      const weekSummary = last7Days.filter(d => d.calories > 0).map(d => `${d.day}: ${d.calories} kcal`).join(", ");
      const text = await callClaude(
        "You are Nora. Return ONLY valid JSON.",
        `Weekly report for ${profile.name}, goals: ${goalsStr}. Target: ${targets?.calories} kcal/day. Data: ${weekSummary || "just started"}. Foods today: ${entries.filter(e=>e.type==="food").map(e=>e.name).join(", ") || "various"}. Return JSON: { "headline": "uplifting sentence", "wins": ["w1","w2","w3"], "suggestions": ["s1","s2"], "fun_fact": "nutrition fact" }`
      );
      setWeeklyReport(parseJSON(text));
    } catch {
      setWeeklyReport({ headline: "You showed up this week — that's what matters!", wins: ["Tracked consistently", "Balanced your macros", "Stayed hydrated"], suggestions: ["Try adding more leafy greens", "Consider a mid-morning snack"], fun_fact: "Salmon is one of the best sources of omega-3 fatty acids!" });
    }
    setWeeklyLoading(false);
  };

  const mealGroups = ["Morning", "Midday", "Snacks", "Evening"];
  const groupedEntries = mealGroups.reduce((acc, g) => { acc[g] = entries.filter(e => e.mealGroup === g); return acc; }, {});

  const resetProfile = () => {
    try { localStorage.removeItem("nora_profile"); localStorage.removeItem("nora_targets"); } catch {}
    setProfile({ name:"",age:"",heightCm:"",heightFt:"",heightIn:"",weightKg:"",weightLbs:"",heightUnit:"cm",weightUnit:"kg",goals:[],activity:"",preferences:"" });
    setTargets(null); setEntries([]); setWaterMl(0); setGreeting(""); setCheckin(""); setStep(0); setSelectedGoals([]); setPhase("onboarding");
  };

  // ─── ONBOARDING ───────────────────────────────────────────────────────────
  if (phase === "onboarding") {
    const goalOptions = ["Lose weight","Build muscle","Maintain weight","Improve energy","Just be healthier","Be aware of my intakes"];
    const activities = ["Sedentary","Lightly active","Moderately active","Very active","Athlete"];
    const isStep0Valid = profile.name.trim() && profile.age;
    const isStep1Valid = profile.heightUnit === "cm" ? profile.heightCm : profile.heightFt;
    const isStep2Valid = (profile.weightUnit === "kg" ? profile.weightKg : profile.weightLbs) && selectedGoals.length > 0 && profile.activity;
    const toggleGoal = (g) => setSelectedGoals(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);

    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center mb-8">
            <NoraAvatar size={56}/>
            <h1 className="text-3xl font-bold text-gray-800 mt-3" style={{fontFamily:"'Georgia',serif"}}>Nora</h1>
            <p className="text-gray-500 text-sm mt-1">Your personal nutrition companion</p>
          </div>
          <div className="flex justify-center gap-2 mb-6">
            {[0,1,2].map(i => <div key={i} className={`h-2 rounded-full transition-all ${i <= step ? "bg-green-500 w-6" : "bg-green-200 w-2"}`}/>)}
          </div>
          <div className="bg-white rounded-3xl shadow-xl p-6 border border-green-100">
            {step === 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-800">Let's get to know you 👋</h2>
                <div>
                  <label className="text-sm text-gray-500 font-medium">Your name</label>
                  <input className="w-full mt-1 px-4 py-3 rounded-xl border border-green-100 bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-300 text-gray-800" placeholder="E.g. Alex" value={profile.name} onChange={e => setProfile(p => ({...p,name:e.target.value}))}/>
                </div>
                <div>
                  <label className="text-sm text-gray-500 font-medium">Age</label>
                  <input type="number" className="w-full mt-1 px-4 py-3 rounded-xl border border-green-100 bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-300 text-gray-800" placeholder="E.g. 28" value={profile.age} onChange={e => setProfile(p => ({...p,age:e.target.value}))}/>
                </div>
                <button disabled={!isStep0Valid} onClick={() => setStep(1)} className="w-full py-3 bg-green-500 hover:bg-green-600 disabled:opacity-40 text-white font-semibold rounded-xl transition-all">Continue →</button>
              </div>
            )}
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-800">Your measurements</h2>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm text-gray-500 font-medium">Height</label>
                    <div className="flex gap-1 bg-green-50 rounded-lg p-1">
                      {["cm","ft"].map(u => <button key={u} onClick={() => setProfile(p => ({...p,heightUnit:u}))} className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${profile.heightUnit===u?"bg-white shadow text-green-700":"text-gray-400"}`}>{u}</button>)}
                    </div>
                  </div>
                  {profile.heightUnit === "cm"
                    ? <input type="number" className="w-full px-4 py-3 rounded-xl border border-green-100 bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-300" placeholder="E.g. 170" value={profile.heightCm} onChange={e => setProfile(p => ({...p,heightCm:e.target.value}))}/>
                    : <div className="flex gap-2"><input type="number" className="w-1/2 px-4 py-3 rounded-xl border border-green-100 bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-300" placeholder="Feet" value={profile.heightFt} onChange={e => setProfile(p => ({...p,heightFt:e.target.value}))}/><input type="number" className="w-1/2 px-4 py-3 rounded-xl border border-green-100 bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-300" placeholder="Inches" value={profile.heightIn} onChange={e => setProfile(p => ({...p,heightIn:e.target.value}))}/></div>
                  }
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setStep(0)} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold rounded-xl">← Back</button>
                  <button disabled={!isStep1Valid} onClick={() => setStep(2)} className="flex-1 py-3 bg-green-500 hover:bg-green-600 disabled:opacity-40 text-white font-semibold rounded-xl">Continue →</button>
                </div>
              </div>
            )}
            {step === 2 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-800">Goals & lifestyle</h2>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm text-gray-500 font-medium">Weight</label>
                    <div className="flex gap-1 bg-green-50 rounded-lg p-1">
                      {["kg","lbs"].map(u => <button key={u} onClick={() => setProfile(p => ({...p,weightUnit:u}))} className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${profile.weightUnit===u?"bg-white shadow text-green-700":"text-gray-400"}`}>{u}</button>)}
                    </div>
                  </div>
                  <input type="number" className="w-full px-4 py-3 rounded-xl border border-green-100 bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-300" placeholder={profile.weightUnit==="kg"?"E.g. 68":"E.g. 150"} value={profile.weightUnit==="kg"?profile.weightKg:profile.weightLbs} onChange={e => setProfile(p => profile.weightUnit==="kg"?{...p,weightKg:e.target.value}:{...p,weightLbs:e.target.value})}/>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-gray-500 font-medium">Goals</label>
                    <span className="text-xs text-gray-400">Select all that apply</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {goalOptions.map(g => {
                      const selected = selectedGoals.includes(g);
                      return (
                        <button type="button" key={g} onClick={() => toggleGoal(g)} className={`px-3 py-2 rounded-xl text-sm font-medium border transition-all text-left ${selected ? "bg-green-500 text-white border-green-500" : "bg-green-50 text-gray-600 border-green-100 hover:border-green-300"}`}>
                          {selected && <span className="mr-1">✓</span>}{g}
                        </button>
                      );
                    })}
                  </div>
                  {selectedGoals.length > 0 && <p className="text-xs text-green-600 mt-1 font-medium">{selectedGoals.length} goal{selectedGoals.length > 1 ? "s" : ""} selected</p>}
                </div>
                <div>
                  <label className="text-sm text-gray-500 font-medium block mb-2">Activity level</label>
                  <div className="flex flex-wrap gap-2">
                    {activities.map(a => <button key={a} onClick={() => setProfile(p => ({...p,activity:a}))} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${profile.activity===a?"bg-green-500 text-white border-green-500":"bg-green-50 text-gray-600 border-green-100 hover:border-green-300"}`}>{a}</button>)}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-500 font-medium">Dietary preferences (optional)</label>
                  <input className="w-full mt-1 px-4 py-3 rounded-xl border border-green-100 bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-300 text-sm" placeholder="E.g. vegetarian, gluten-free..." value={profile.preferences} onChange={e => setProfile(p => ({...p,preferences:e.target.value}))}/>
                </div>
                {error && <div className="text-red-500 text-sm bg-red-50 p-3 rounded-xl">{error} <button onClick={handleOnboardingSubmit} className="ml-2 underline font-medium">Retry</button></div>}
                <div className="flex gap-2">
                  <button onClick={() => setStep(1)} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold rounded-xl">← Back</button>
                  <button disabled={!isStep2Valid || loading} onClick={handleOnboardingSubmit} className="flex-1 py-3 bg-green-500 hover:bg-green-600 disabled:opacity-40 text-white font-semibold rounded-xl transition-all">
                    {loading ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> Calculating...</span> : "Get my targets ✨"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── WELCOME ──────────────────────────────────────────────────────────────
  if (phase === "welcome") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-green-100 text-center">
            <NoraAvatar size={64}/>
            <h2 className="text-2xl font-bold text-gray-800 mt-4" style={{fontFamily:"'Georgia',serif"}}>Hi {profile.name}! 🌿</h2>
            <p className="text-gray-600 mt-3 leading-relaxed">{welcomeMsg}</p>
            {targets && (
              <div className="mt-6 grid grid-cols-2 gap-3 text-left">
                {[
                  {label:"Calories",val:`${targets.calories} kcal`,icon:"🔥"},
                  {label:"Protein",val:`${targets.protein_g}g`,icon:"💪"},
                  {label:"Carbs",val:`${targets.carbs_g}g`,icon:"🌾"},
                  {label:"Fat",val:`${targets.fat_g}g`,icon:"🥑"},
                  {label:"Fiber",val:`${targets.fiber_g}g`,icon:"🥦"},
                  {label:"Water",val:`${Math.round(targets.water_ml/1000*10)/10}L`,icon:"💧"},
                ].map(item => (
                  <div key={item.label} className="bg-green-50 rounded-2xl p-3 flex items-center gap-3">
                    <span className="text-xl">{item.icon}</span>
                    <div>
                      <div className="text-xs text-gray-400 font-medium">{item.label}</div>
                      <div className="text-sm font-bold text-gray-800">{item.val}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setPhase("app")} className="mt-6 w-full py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-2xl text-lg transition-all shadow-lg shadow-green-200">Let's start tracking! 🚀</button>
          </div>
        </div>
      </div>
    );
  }

  // ─── MAIN APP ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto relative" style={{fontFamily:"'system-ui',sans-serif"}}>

      {/* TODAY */}
      {activeTab === "today" && (
        <div className="flex-1 overflow-y-auto pb-24 pt-4 px-4 space-y-4">
          <div className="bg-white rounded-2xl p-4 border border-green-100 shadow-sm flex gap-3">
            <NoraAvatar size={40}/>
            <div className="flex-1">
              {greetingLoading ? <><Skeleton className="h-4 w-full mb-2"/><Skeleton className="h-4 w-3/4"/></> : (
                <p className="text-sm text-gray-700 leading-relaxed">{greeting || "Ready to track your day? You've got this! 🌿"}</p>
              )}
            </div>
          </div>

          {healthSaved && (
            <div className="bg-gradient-to-r from-teal-50 to-emerald-50 rounded-2xl p-4 border border-teal-100 grid grid-cols-4 gap-2 text-center">
              {[{icon:"👟",label:"Steps",val:healthData.steps||"—"},{icon:"😴",label:"Sleep",val:healthData.sleep?`${healthData.sleep}h`:"—"},{icon:"❤️",label:"HR",val:healthData.heartRate?`${healthData.heartRate}bpm`:"—"},{icon:"🏋️",label:"Workout",val:healthData.workoutDuration?`${healthData.workoutDuration}m`:"—"}].map(item => (
                <div key={item.label}><div className="text-lg">{item.icon}</div><div className="text-xs font-bold text-gray-700">{item.val}</div><div className="text-xs text-gray-400">{item.label}</div></div>
              ))}
            </div>
          )}

          {targets && (
            <div className="bg-white rounded-2xl p-5 border border-green-100 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="font-bold text-gray-800">Today's Progress</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Net {Math.round(netCals)} kcal · {burnedCals > 0 ? `🔥 ${burnedCals} burned` : "log exercise to earn more"}</p>
                </div>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">{Math.round((netCals/targets.calories)*100)}%</span>
              </div>
              <div className="flex justify-around mb-4">
                <ProgressRing value={netCals} max={targets.calories} color="#22c55e" label="Calories" unit="kcal" size={88}/>
                <ProgressRing value={totalProtein} max={targets.protein_g} color="#0ea5e9" label="Protein" unit="g" size={88}/>
                <ProgressRing value={totalCarbs} max={targets.carbs_g} color="#f59e0b" label="Carbs" unit="g" size={88}/>
                <ProgressRing value={totalFat} max={targets.fat_g} color="#a78bfa" label="Fat" unit="g" size={88}/>
              </div>
              <div className="space-y-2.5 pt-2 border-t border-gray-50">
                <BarProgress value={totalFiber} max={targets.fiber_g} color="#10b981" label="Fiber" unit="g"/>
                <BarProgress value={waterMl} max={targets.water_ml} color="#38bdf8" label="Water" unit="ml"/>
                <div className="flex items-center gap-2 pl-16">
                  {[150,250,500].map(ml => (
                    <button key={ml} onClick={() => setWaterMl(w => Math.min(w + ml, targets.water_ml * 2))} className="px-2.5 py-1 text-xs rounded-lg bg-sky-50 text-sky-600 border border-sky-100 hover:bg-sky-100 font-medium transition-all">+{ml}ml</button>
                  ))}
                  {waterMl > 0 && <button onClick={() => setWaterMl(0)} className="text-xs text-gray-300 hover:text-gray-400 ml-auto transition-colors">↺ reset</button>}
                </div>
              </div>
            </div>
          )}

          {entries.length === 0 && (
            <button onClick={() => setEntries(DEMO_ENTRIES)} className="w-full py-3 border-2 border-dashed border-green-200 rounded-2xl text-sm text-green-600 font-medium hover:bg-green-50 transition-all">✨ Load demo data to explore</button>
          )}

          <div className="bg-white rounded-2xl border border-green-100 shadow-sm overflow-hidden">
            <div className="flex border-b border-gray-50">
              {["text","photo"].map(mode => (
                <button key={mode} onClick={() => setLogMode(mode)} className={`flex-1 py-3 text-sm font-medium transition-all ${logMode===mode?"bg-green-50 text-green-700 border-b-2 border-green-500":"text-gray-400"}`}>
                  {mode==="text"?"📝 Type entry":"📷 Upload photo"}
                </button>
              ))}
            </div>
            <div className="p-4">
              {logMode === "text" ? (
                <div className="flex gap-2">
                  <input className="flex-1 px-4 py-3 rounded-xl bg-green-50 border border-green-100 text-sm focus:outline-none focus:ring-2 focus:ring-green-300" placeholder='E.g. "scrambled eggs" or "30 min run"' value={logInput} onChange={e => setLogInput(e.target.value)} onKeyDown={e => e.key==="Enter" && handleLogText()}/>
                  <button onClick={handleLogText} disabled={logLoading || !logInput.trim()} className="px-4 py-3 bg-green-500 hover:bg-green-600 disabled:opacity-40 text-white rounded-xl text-sm font-bold transition-all">
                    {logLoading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"/> : "Add"}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div onClick={() => fileRef.current?.click()} className="border-2 border-dashed border-green-200 rounded-xl p-6 text-center cursor-pointer hover:bg-green-50 transition-all">
                    {imageFile ? <p className="text-sm text-green-700 font-medium">📷 {imageFile.name}</p> : <><p className="text-2xl mb-1">📸</p><p className="text-sm text-gray-400">Tap to upload a food photo</p></>}
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => setImageFile(e.target.files[0])}/>
                  </div>
                  {imageFile && <button onClick={handleLogImage} disabled={logLoading} className="w-full py-3 bg-green-500 text-white rounded-xl font-medium disabled:opacity-40">{logLoading?"Analysing...":"Analyse & Log 🔍"}</button>}
                </div>
              )}
              {logError && <p className="text-red-500 text-xs mt-2 bg-red-50 p-2 rounded-lg">{logError} <button onClick={() => setLogError("")} className="underline ml-1">Dismiss</button></p>}
            </div>
          </div>

          {entries.length > 0 && (
            <div className="space-y-3">
              {mealGroups.filter(g => groupedEntries[g]?.length > 0).map(group => (
                <div key={group}>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">{group}</h4>
                  <div className="bg-white rounded-2xl border border-green-100 shadow-sm divide-y divide-gray-50">
                    {groupedEntries[group].map(entry => (
                      <div key={entry.id} className="p-3 flex items-center gap-3">
                        <span className="text-2xl">{entry.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{entry.name}</p>
                          <p className="text-xs text-gray-400">{entry.time}{entry.notes ? ` · ${entry.notes}` : ""}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-bold ${entry.type==="exercise"?"text-green-600":"text-gray-700"}`}>{entry.type==="exercise"?`-${Math.abs(entry.calories)}`:entry.calories} kcal</p>
                          {entry.type==="food" && <p className="text-xs text-gray-400">P:{Math.round(entry.protein_g)}g C:{Math.round(entry.carbs_g)}g F:{Math.round(entry.fat_g)}g</p>}
                        </div>
                        <button onClick={() => setEntries(prev => prev.filter(e => e.id !== entry.id))} className="text-gray-200 hover:text-red-400 ml-1 text-lg transition-colors">×</button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pb-2">
            <button onClick={handleCheckin} disabled={checkinLoading || entries.length === 0} className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:opacity-40 text-white font-semibold rounded-2xl shadow-lg shadow-green-200 transition-all">
              {checkinLoading ? "Nora is checking in..." : "💬 How am I doing?"}
            </button>
            {checkin && (
              <div className="mt-3 bg-white rounded-2xl p-4 border border-green-100 shadow-sm flex gap-3">
                <NoraAvatar size={36}/>
                <p className="text-sm text-gray-700 leading-relaxed flex-1">{checkin}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MEALS */}
      {activeTab === "meals" && (
        <div className="flex-1 overflow-y-auto pb-24 pt-4 px-4 space-y-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800" style={{fontFamily:"'Georgia',serif"}}>Meal Ideas</h2>
            <p className="text-sm text-gray-400 mt-1">Personalised suggestions based on your goals and remaining macros</p>
          </div>

          {targets && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-100">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Remaining today</p>
              <div className="grid grid-cols-4 gap-2 text-center">
                {[
                  {label:"Calories",val:Math.max(0,Math.round(targets.calories-netCals)),unit:"kcal",color:"text-green-600"},
                  {label:"Protein",val:Math.max(0,Math.round(targets.protein_g-totalProtein)),unit:"g",color:"text-sky-600"},
                  {label:"Carbs",val:Math.max(0,Math.round(targets.carbs_g-totalCarbs)),unit:"g",color:"text-amber-600"},
                  {label:"Fat",val:Math.max(0,Math.round(targets.fat_g-totalFat)),unit:"g",color:"text-purple-600"},
                ].map(item => (
                  <div key={item.label}>
                    <p className={`text-sm font-bold ${item.color}`}>{item.val}<span className="text-xs">{item.unit}</span></p>
                    <p className="text-xs text-gray-400">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button onClick={handleGetMeals} disabled={mealsLoading} className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:opacity-40 text-white font-semibold rounded-2xl shadow-lg shadow-green-200 transition-all">
            {mealsLoading ? "Finding ideas for you..." : meals.length > 0 ? "🔄 Refresh suggestions" : "✨ Get meal suggestions"}
          </button>

          {mealsLoading && <div className="space-y-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-36 w-full"/>)}</div>}
          {mealsError && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-xl">{mealsError} <button onClick={handleGetMeals} className="underline ml-1">Retry</button></p>}

          {meals.map((meal, i) => (
            <div key={i} className="bg-white rounded-2xl border border-green-100 shadow-sm p-4">
              <div className="flex items-start gap-3 mb-3">
                <span className="text-3xl leading-none">{meal.emoji}</span>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-gray-800 leading-tight">{meal.name}</h3>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full whitespace-nowrap shrink-0">⏱ {meal.prepTime}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-3 mt-1.5 text-xs">
                    <span className="text-green-600 font-bold">{meal.calories} kcal</span>
                    <span className="text-sky-600">P: {meal.protein_g}g</span>
                    <span className="text-amber-600">C: {meal.carbs_g}g</span>
                    <span className="text-purple-600">F: {meal.fat_g}g</span>
                  </div>
                </div>
              </div>
              {meal.ingredients?.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Ingredients</p>
                  <p className="text-xs text-gray-600 leading-relaxed">{meal.ingredients.join(" · ")}</p>
                </div>
              )}
              {meal.tip && (
                <div className="flex gap-2 items-start mb-3">
                  <NoraAvatar size={18}/>
                  <p className="text-xs text-gray-500 italic flex-1">{meal.tip}</p>
                </div>
              )}
              <button onClick={() => addMealToLog(meal)} className="w-full py-2.5 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-xl transition-all">+ Log this meal</button>
            </div>
          ))}

          {meals.length === 0 && !mealsLoading && (
            <div className="text-center py-12 text-gray-400">
              <p className="text-5xl mb-3">🍽️</p>
              <p className="text-sm">Tap above for personalised meal ideas</p>
            </div>
          )}
        </div>
      )}

      {/* PROGRESS */}
      {activeTab === "progress" && (
        <div className="flex-1 overflow-y-auto pb-24 pt-4 px-4 space-y-4">
          <h2 className="text-2xl font-bold text-gray-800" style={{fontFamily:"'Georgia',serif"}}>Progress</h2>

          <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl p-4 border border-orange-100 flex items-center gap-4">
            <span className="text-4xl">🔥</span>
            <div>
              <p className="text-2xl font-bold text-gray-800">{streak} day{streak !== 1 ? "s" : ""}</p>
              <p className="text-sm text-gray-500">{streak >= 7 ? "Amazing streak!" : streak >= 3 ? "Great momentum!" : streak > 0 ? "Keep it going!" : "Start logging to build your streak"}</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-xs text-gray-400">Days logged</p>
              <p className="text-lg font-bold text-gray-700">{last7Days.filter(d => d.calories > 0).length}<span className="text-xs text-gray-400">/7</span></p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-green-100 shadow-sm">
            <h3 className="text-sm font-bold text-gray-600 mb-4">Calories vs Target (7 days)</h3>
            <div className="flex items-end justify-between gap-1 h-32">
              {last7Days.map(d => {
                const h = targets ? Math.round((d.calories / targets.calories) * 100) : 0;
                const color = h === 0 ? "#e5e7eb" : h <= 105 ? "#22c55e" : h <= 120 ? "#f59e0b" : "#f87171";
                return (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full relative flex items-end" style={{height:96}}>
                      <div style={{height:`${Math.min(h||0,150)}%`,backgroundColor:color,transition:"height 0.5s ease"}} className="w-full rounded-t-lg"/>
                      {targets && <div className="absolute w-full border-t-2 border-dashed border-gray-200" style={{bottom:"66.67%"}}/>}
                    </div>
                    <span className={`text-xs font-medium ${d.isToday?"text-green-600 font-bold":"text-gray-400"}`}>{d.day}</span>
                    {d.calories > 0 && <span className="text-xs text-gray-400">{Math.round(d.calories/100)/10}k</span>}
                  </div>
                );
              })}
            </div>
            <div className="flex gap-3 mt-3 text-xs text-gray-400">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-400 inline-block"/>On target</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-400 inline-block"/>Slightly over</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-300 inline-block"/>Over</span>
            </div>
          </div>

          {targets && (
            <div className="bg-white rounded-2xl p-5 border border-green-100 shadow-sm">
              <h3 className="text-sm font-bold text-gray-600 mb-3">7-day averages {daysWithData.length === 0 && <span className="text-gray-400 font-normal text-xs">(no data yet)</span>}</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  {label:"Avg Calories",val:`${avg("calories")} kcal`,icon:"🔥",target:`${targets.calories} kcal`},
                  {label:"Avg Protein",val:`${avg("protein")}g`,icon:"💪",target:`${targets.protein_g}g`},
                  {label:"Avg Carbs",val:`${avg("carbs")}g`,icon:"🌾",target:`${targets.carbs_g}g`},
                  {label:"Avg Fat",val:`${avg("fat")}g`,icon:"🥑",target:`${targets.fat_g}g`},
                ].map(item => (
                  <div key={item.label} className="bg-green-50 rounded-xl p-3 flex items-center gap-2">
                    <span className="text-lg">{item.icon}</span>
                    <div>
                      <div className="text-xs text-gray-400">{item.label}</div>
                      <div className="text-sm font-bold text-gray-800">{daysWithData.length > 0 ? item.val : "—"}</div>
                      <div className="text-xs text-gray-400">target: {item.target}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {targets && daysWithData.length > 0 && (
            <div className="bg-white rounded-2xl p-5 border border-sky-100 shadow-sm">
              <h3 className="text-sm font-bold text-gray-600 mb-3">💧 Hydration this week</h3>
              <div className="space-y-2">
                {last7Days.slice().reverse().filter(d => d.isToday || d.waterMl > 0 || d.entryCount > 0).slice(0,5).map(d => (
                  <div key={d.date} className="flex items-center gap-3">
                    <span className={`text-xs w-8 ${d.isToday?"text-green-600 font-bold":"text-gray-400"}`}>{d.day}</span>
                    <div className="flex-1 h-2 bg-sky-50 rounded-full overflow-hidden">
                      <div style={{width:`${Math.min((d.waterMl/(targets.water_ml||1))*100,100)}%`,backgroundColor:"#38bdf8",transition:"width 0.5s"}} className="h-full rounded-full"/>
                    </div>
                    <span className="text-xs text-gray-500 w-12 text-right">{d.waterMl > 0 ? `${(d.waterMl/1000).toFixed(1)}L` : "—"}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button onClick={handleWeeklyReport} disabled={weeklyLoading} className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:opacity-40 text-white font-semibold rounded-2xl shadow-lg shadow-green-200 transition-all">
            {weeklyLoading ? "Generating your report..." : "📊 Generate Weekly Report"}
          </button>

          {weeklyLoading && <div className="bg-white rounded-2xl p-5 border border-green-100 space-y-3"><Skeleton className="h-5 w-full"/><Skeleton className="h-4 w-3/4"/><Skeleton className="h-4 w-5/6"/></div>}
          {weeklyReport && (
            <div className="bg-white rounded-2xl border border-green-100 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-5 flex gap-3 items-start">
                <NoraAvatar size={40}/>
                <div>
                  <p className="text-white font-bold text-sm">Weekly Report from Nora</p>
                  <p className="text-green-100 text-sm mt-1">{weeklyReport.headline}</p>
                </div>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-green-600 uppercase tracking-wider mb-2">🏆 Your wins</h4>
                  {weeklyReport.wins?.map((w,i) => <p key={i} className="text-sm text-gray-700 flex gap-2 mb-1"><span className="text-green-500">✓</span>{w}</p>)}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-2">💡 For next week</h4>
                  {weeklyReport.suggestions?.map((s,i) => <p key={i} className="text-sm text-gray-700 flex gap-2 mb-1"><span className="text-amber-500">→</span>{s}</p>)}
                </div>
                <div className="bg-green-50 rounded-xl p-3">
                  <h4 className="text-xs font-bold text-green-600 uppercase tracking-wider mb-1">🌿 Fun fact</h4>
                  <p className="text-sm text-gray-700">{weeklyReport.fun_fact}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ME */}
      {activeTab === "me" && (
        <div className="flex-1 overflow-y-auto pb-24 pt-4 px-4 space-y-4">
          <h2 className="text-2xl font-bold text-gray-800" style={{fontFamily:"'Georgia',serif"}}>Profile</h2>

          <div className="bg-white rounded-2xl p-5 border border-green-100 shadow-sm">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center text-2xl font-bold text-white">{profile.name[0]?.toUpperCase()}</div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-800 text-lg">{profile.name}</h3>
                <p className="text-sm text-gray-400">{profile.activity}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {profile.goals.map(g => <span key={g} className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{g}</span>)}
                </div>
              </div>
            </div>
            {targets && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Daily Targets</h4>
                {[
                  {label:"Calories",val:`${targets.calories} kcal`,color:"bg-green-100 text-green-800"},
                  {label:"Protein",val:`${targets.protein_g}g`,color:"bg-sky-100 text-sky-800"},
                  {label:"Carbohydrates",val:`${targets.carbs_g}g`,color:"bg-amber-100 text-amber-800"},
                  {label:"Fat",val:`${targets.fat_g}g`,color:"bg-purple-100 text-purple-800"},
                  {label:"Fiber",val:`${targets.fiber_g}g`,color:"bg-emerald-100 text-emerald-800"},
                  {label:"Water",val:`${Math.round(targets.water_ml/100)/10}L`,color:"bg-blue-100 text-blue-800"},
                ].map(item => (
                  <div key={item.label} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                    <span className="text-sm text-gray-600">{item.label}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${item.color}`}>{item.val}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-green-100 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-teal-50 to-emerald-50 px-5 py-4 border-b border-green-100">
              <h3 className="font-bold text-gray-700">🔗 Health Data</h3>
              <p className="text-xs text-gray-400 mt-0.5">Manually sync your activity and sleep</p>
            </div>
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-gray-500 font-medium">Steps today</label><input type="number" className="w-full mt-1 px-3 py-2.5 rounded-xl border border-green-100 bg-green-50 text-sm focus:outline-none focus:ring-2 focus:ring-green-300" placeholder="E.g. 8500" value={healthData.steps} onChange={e => setHealthData(p => ({...p,steps:e.target.value}))}/></div>
                <div><label className="text-xs text-gray-500 font-medium">Sleep (hours)</label><input type="number" className="w-full mt-1 px-3 py-2.5 rounded-xl border border-green-100 bg-green-50 text-sm focus:outline-none focus:ring-2 focus:ring-green-300" placeholder="E.g. 7.5" value={healthData.sleep} onChange={e => setHealthData(p => ({...p,sleep:e.target.value}))}/></div>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Sleep quality</label>
                <div className="flex gap-2 mt-1">
                  {["poor","ok","good","great"].map(q => <button key={q} onClick={() => setHealthData(p => ({...p,sleepQuality:q}))} className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all capitalize ${healthData.sleepQuality===q?"bg-green-500 text-white border-green-500":"bg-green-50 text-gray-500 border-green-100"}`}>{q}</button>)}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-gray-500 font-medium">Resting HR (bpm)</label><input type="number" className="w-full mt-1 px-3 py-2.5 rounded-xl border border-green-100 bg-green-50 text-sm focus:outline-none focus:ring-2 focus:ring-green-300" placeholder="E.g. 62" value={healthData.heartRate} onChange={e => setHealthData(p => ({...p,heartRate:e.target.value}))}/></div>
                <div><label className="text-xs text-gray-500 font-medium">Workout (min)</label><input type="number" className="w-full mt-1 px-3 py-2.5 rounded-xl border border-green-100 bg-green-50 text-sm focus:outline-none focus:ring-2 focus:ring-green-300" placeholder="E.g. 45" value={healthData.workoutDuration} onChange={e => setHealthData(p => ({...p,workoutDuration:e.target.value}))}/></div>
              </div>
              <button onClick={() => { setHealthSaved(true); fetchGreeting(); }} className="w-full py-3 bg-teal-500 hover:bg-teal-600 text-white font-medium rounded-xl text-sm transition-all">{healthSaved ? "✓ Health data updated" : "Save health data"}</button>
            </div>
          </div>

          <button onClick={() => { setEntries([]); setCheckin(""); setWaterMl(0); }} className="w-full py-3 border border-red-200 text-red-500 rounded-2xl text-sm font-medium hover:bg-red-50 transition-all">🗑️ Reset today's log</button>
          <button onClick={resetProfile} className="w-full py-3 border border-gray-200 text-gray-500 rounded-2xl text-sm font-medium hover:bg-gray-50 transition-all">↩ Change profile / restart onboarding</button>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-5 border border-green-100">
            <div className="flex items-center gap-3 mb-3"><NoraAvatar size={36}/><div><h3 className="font-bold text-gray-800">About Nora</h3><p className="text-xs text-gray-400">AI Nutrition Companion</p></div></div>
            <p className="text-sm text-gray-600 leading-relaxed">Nora is powered by Claude, Anthropic's AI. She analyses your nutrition data, provides personalised targets, and offers warm, evidence-based guidance. Nora is not a medical professional — always consult a registered dietitian for clinical advice.</p>
          </div>
        </div>
      )}

      {/* TAB BAR */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white/95 backdrop-blur border-t border-green-100 px-2 py-2 flex justify-around z-10">
        {[
          {id:"today",icon:"☀️",label:"Today"},
          {id:"meals",icon:"🍽️",label:"Meals"},
          {id:"progress",icon:"📈",label:"Progress"},
          {id:"me",icon:"👤",label:"Me"},
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex flex-col items-center gap-0.5 px-4 py-1 rounded-xl transition-all ${activeTab===tab.id?"text-green-600":"text-gray-400"}`}>
            <span className="text-xl">{tab.icon}</span>
            <span className={`text-xs font-medium ${activeTab===tab.id?"text-green-600":"text-gray-400"}`}>{tab.label}</span>
            {activeTab===tab.id && <span className="w-1 h-1 rounded-full bg-green-500"/>}
          </button>
        ))}
      </div>
    </div>
  );
}
