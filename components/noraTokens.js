// ── Design tokens — "Fog & Pine" ──────────────────────────────────────────────
export const C = {
  bg:         "#F4F2ED", // ivory
  card:       "#EDEAE2", // ivory-2
  green:      "#1F2E26", // pine
  greenDark:  "#1E3429",
  greenLight: "#EBF0ED",
  gold:       "#B99A5B",
  goldLight:  "#FAF3E6",
  text:       "#2C2A24", // ink
  muted:      "#5F5C51", // ink-soft
  border:     "#EDEAE2", // ivory-2
  sage:       "#7A9E8A",
  tan:        "#A89070",
  slate:      "#7A9BAE",
  track:      "#E8E2D6",
  error:      "#9E5E52",
  errorBg:    "#F7EDE9",
  amber:      "#B8922A",
  amberBg:    "#FBF3E3",
  // new named tokens (Fog & Pine vocabulary — for the steps ahead)
  pine:       "#1F2E26",
  forest:     "#2A3B31",
  fog:        "#A8B2A9",
  ivory:      "#F4F2ED",
  ivory2:     "#EDEAE2",
  inkSoft:    "#5F5C51",
};

export const card = {
  backgroundColor: C.card,
  border: `1px solid ${C.border}`,
  borderRadius: "16px",
  boxShadow: "0 1px 2px rgba(31,46,38,0.06)",
};

export const serif = "'Cormorant Garamond', Georgia, 'Times New Roman', serif";
export const sans  = "'Inter', system-ui, -apple-system, sans-serif";

export const inp = {
  width:"100%", backgroundColor:C.ivory2, border:`1px solid ${C.border}`,
  borderRadius:10, padding:"11px 14px", fontSize:16, color:C.text,
  fontFamily:sans, transition:"border-color 0.15s ease", outline:"none",
};

export const localDateStr = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;

// Picks a variant from a pool, stable for the day, avoiding the last few days' picks (localStorage-only, per device).
export const pickDailyVariant = (poolKey, pool) => {
  if (typeof window === "undefined" || !pool || pool.length === 0) return pool?.[0];
  if (pool.length === 1) return pool[0];
  const today = localDateStr();
  let history = {};
  try { history = JSON.parse(localStorage.getItem("nora_tip_history") || "{}"); } catch {}
  const entry = history[poolKey];
  if (entry && entry.date === today && pool[entry.idx]) return pool[entry.idx];
  const recent = entry?.recent || [];
  const candidates = pool.map((_, i) => i).filter(i => !recent.includes(i));
  const pickFrom = candidates.length > 0 ? candidates : pool.map((_, i) => i);
  const idx = pickFrom[Math.floor(Math.random() * pickFrom.length)];
  history[poolKey] = { date: today, idx, recent: [idx, ...recent].slice(0, Math.min(3, pool.length - 1)) };
  try { localStorage.setItem("nora_tip_history", JSON.stringify(history)); } catch {}
  return pool[idx];
};

const CYCLE_TIP_POOLS = {
  menstrual: { color:"#9E5E52", label:"Menstrual", tips:[
    "Spinach, lentils and red meat replenish iron. Avoid caffeine; herbal tea is soothing. Light movement only.",
    "Prostaglandins peak now, driving cramps — omega-3-rich fish or a magnesium-rich snack can take the edge off.",
    "Iron losses are highest these days. Pairing plant iron with vitamin C — lentils with citrus — improves absorption.",
    "Gentle movement, like walking or stretching, tends to ease cramping more than pushing through a hard session.",
    "Warmth — a hot water bottle or bath — relaxes uterine muscle and can meaningfully ease period pain.",
  ]},
  follicular: { color:"#7A9E8A", label:"Follicular", tips:[
    "HIIT and strength training are excellent this week. Complex carbs fuel your energy. Add fermented foods.",
    "Rising oestrogen supports higher energy and faster recovery — a good window to progress your training load.",
    "Fermented foods support the oestrobolome, the gut bacteria that help clear and recycle oestrogen efficiently.",
    "This is often the most resilient week of the cycle — a reasonable time to try a new class or harder session.",
    "Complex carbs and lean protein together support the higher energy demands of this rising-oestrogen phase.",
  ]},
  ovulatory: { color:"#C9A96E", label:"Ovulatory", tips:[
    "Peak performance window — lift heavy, train hard. Zinc-rich seeds and anti-inflammatory salmon are ideal.",
    "Strength and coordination often peak around ovulation — a good window for a personal best if you feel ready.",
    "Zinc is heavily used at ovulation — pumpkin seeds, oysters or hemp seeds help replenish it.",
    "Oestrogen peaks now, which can mean higher energy but also more joint laxity — warm up a little longer.",
    "Anti-inflammatory foods — oily fish, olive oil, berries — support the hormonal shift happening this week.",
  ]},
  luteal: { color:"#B8922A", label:"Luteal", tips:[
    "Magnesium eases PMS — dark chocolate, nuts, leafy greens. Reduce salt and favour moderate cardio.",
    "Progesterone rises in this phase, often raising body temperature slightly — training may feel a touch harder.",
    "Cravings tend to increase in the luteal phase — protein and fibre at each meal help blunt the swings.",
    "Reducing sodium and processed food in the week before your period can meaningfully ease bloating.",
    "Sleep can be lighter in the late luteal phase — a consistent wind-down routine matters more than usual now.",
  ]},
};

const scaleCycleBoundaries = (periodLength, cycleLength) => {
  const scale = cycleLength / 28;
  const follicularEnd = periodLength + Math.round(8 * scale);
  const ovulatoryEnd   = follicularEnd + Math.round(3 * scale);
  return { follicularEnd, ovulatoryEnd };
};

// periodLogs: array of { id, start_date: "YYYY-MM-DD", end_date: "YYYY-MM-DD"|null }, any order.
export const getCyclePhase = (periodLogs, fallbackCycleLength = 28) => {
  const logs = (periodLogs || []).filter(l => l.start_date).slice().sort((a, b) => b.start_date.localeCompare(a.start_date));
  if (logs.length === 0) return null;

  const toDate = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
  const daysBetween = (a, b) => Math.round((toDate(a) - toDate(b)) / 86400000);

  const mostRecent = logs[0];

  const completed = logs.filter(l => l.end_date).slice(0, 6);
  const periodLengthEstimated = completed.length === 0;
  const periodLength = periodLengthEstimated
    ? 5
    : Math.round(completed.reduce((s, l) => s + (daysBetween(l.end_date, l.start_date) + 1), 0) / completed.length);

  const gaps = [];
  for (let i = 0; i < logs.length - 1 && i < 6; i++) gaps.push(daysBetween(logs[i].start_date, logs[i + 1].start_date));
  const cycleLengthEstimated = gaps.length === 0;
  const cycleLength = Math.max(cycleLengthEstimated
    ? (fallbackCycleLength || 28)
    : Math.round(gaps.reduce((s, g) => s + g, 0) / gaps.length), 21);

  const today = new Date();
  const todayStr = localDateStr(today);
  const daysSince = daysBetween(todayStr, mostRecent.start_date);
  const day = daysSince + 1;

  const { follicularEnd, ovulatoryEnd } = scaleCycleBoundaries(periodLength, cycleLength);
  const phase = day <= periodLength ? "menstrual" : day <= follicularEnd ? "follicular" : day <= ovulatoryEnd ? "ovulatory" : "luteal";
  const meta = CYCLE_TIP_POOLS[phase];

  const predictedNextStart = (() => {
    const d = toDate(mostRecent.start_date);
    d.setDate(d.getDate() + cycleLength);
    return localDateStr(d);
  })();

  return {
    phase, day, label: meta.label, color: meta.color,
    tip: pickDailyVariant(`cycle_${phase}`, meta.tips),
    periodLength, periodLengthEstimated,
    cycleLength, cycleLengthEstimated,
    predictedNextStart,
    currentLogId: mostRecent.id,
    currentLogEndDate: mostRecent.end_date || null,
  };
};

export const DAILY_FACTS = [
  "Iron absorbs best alongside vitamin C — try spinach with lemon.",
  "Magnesium supports over 300 enzymatic reactions in your body.",
  "Your gut microbiome can influence your mood via the gut-brain axis.",
  "Omega-3 fatty acids reduce inflammation and support heart health.",
  "Protein keeps you fuller for longer than carbohydrates or fat.",
  "Vitamin D is synthesised by your skin when exposed to sunlight.",
  "Dark leafy greens are among the richest sources of folate.",
  "Staying hydrated improves cognitive function and mood.",
  "Fibre feeds beneficial gut bacteria, supporting immunity.",
  "Sleep deprivation raises cortisol and increases sugar cravings.",
  "Zinc is crucial for immune function and wound healing.",
  "Eating slowly improves digestion and helps you feel satisfied sooner.",
  "Calcium from food is better absorbed than from supplements.",
  "B12 is found almost exclusively in animal products — vegans should supplement.",
  "Colourful vegetables contain different antioxidants — eat the rainbow.",
  "Caffeine blocks adenosine receptors, temporarily reducing fatigue.",
  "Fermented foods like yoghurt and kefir support gut microbiome diversity.",
  "Anti-inflammatory foods include berries, fatty fish, olive oil and turmeric.",
  "Potassium helps regulate blood pressure and muscle function.",
  "Eating protein at breakfast reduces afternoon snacking urges.",
  "Prebiotics found in onions, garlic and oats feed probiotic bacteria.",
  "Chewing each bite thoroughly aids digestion and reduces bloating.",
  "Iodine from seaweed and dairy supports thyroid hormone production.",
  "Complex carbs provide a slower, steadier energy release than simple sugars.",
  "Selenium, found in Brazil nuts, is a powerful antioxidant.",
  "Drinking water before meals can reduce caloric intake naturally.",
  "Lutein and zeaxanthin from leafy greens protect eye health.",
  "Exercise increases BDNF — a protein that supports brain health.",
  "Turmeric's curcumin is more bioavailable when eaten with black pepper.",
  "Adequate sleep is one of the most powerful tools for body composition.",
];

export const getDailyFact = () => {
  const now = new Date();
  const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
  return DAILY_FACTS[dayOfYear % DAILY_FACTS.length];
};

export const getWeekKey = () => {
  const d = new Date();
  const jan1 = new Date(d.getFullYear(), 0, 1);
  return `${d.getFullYear()}-W${Math.ceil((Math.floor((d - jan1) / 86400000) + jan1.getDay() + 1) / 7)}`;
};

export const PLAN_SECTIONS = [
  { group:"Morning", label:"Breakfast", color: "#B8922A" },
  { group:"Midday",  label:"Lunch",     color: "#2D4A3E" },
  { group:"Snacks",  label:"Snack",     color: "#7A9BAE" },
  { group:"Evening", label:"Dinner",    color: "#5A4A7A" },
  { group:"Dessert", label:"Dessert",   color: "#C9A96E" },
];

export const DEMO_ENTRIES = [
  { id:1, type:"food",     name:"Greek yogurt with berries", time:"8:15 AM", mealGroup:"Morning", calories:210, protein_g:18, carbs_g:28, fat_g:3,  fiber_g:3,  notes:"Honey & granola",      estimated:true  },
  { id:2, type:"food",     name:"Oat milk latte",            time:"8:30 AM", mealGroup:"Morning", calories:110, protein_g:2,  carbs_g:18, fat_g:3,  fiber_g:1,  notes:"",                    estimated:true  },
  { id:3, type:"exercise", name:"Morning run · 4 km",        time:"7:45 AM", mealGroup:"Morning", calories:-280,protein_g:0,  carbs_g:0,  fat_g:0,  fiber_g:0,  notes:"Easy pace",           estimated:false },
  { id:4, type:"food",     name:"Grilled chicken salad",     time:"12:30 PM",mealGroup:"Midday",  calories:420, protein_g:38, carbs_g:22, fat_g:18, fiber_g:7,  notes:"Avocado & olive oil", estimated:false },
  { id:5, type:"food",     name:"Crackers with hummus",      time:"3:30 PM", mealGroup:"Snacks",  calories:180, protein_g:6,  carbs_g:24, fat_g:7,  fiber_g:4,  notes:"Whole grain",         estimated:true  },
  { id:6, type:"food",     name:"Salmon with roasted veg",   time:"7:00 PM", mealGroup:"Evening", calories:560, protein_g:42, carbs_g:48, fat_g:16, fiber_g:8,  notes:"Quinoa & lemon herb", estimated:false },
];
