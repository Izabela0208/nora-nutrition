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

export const getCyclePhase = (lastPeriodStr, cycleLength = 28) => {
  if (!lastPeriodStr) return null;
  const [y, m, d] = lastPeriodStr.split("-").map(Number);
  const last = new Date(y, m - 1, d);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const daysSince = Math.floor((today - last) / 86400000);
  const cl = Math.max(cycleLength || 28, 21);
  const day = (daysSince % cl) + 1;
  if (day <= 5)  return { phase:"menstrual",  day, label:"Menstrual",  color:"#9E5E52", tip:"Spinach, lentils and red meat replenish iron. Avoid caffeine; herbal tea is soothing. Light movement only." };
  if (day <= 13) return { phase:"follicular", day, label:"Follicular", color:"#7A9E8A", tip:"HIIT and strength training are excellent this week. Complex carbs fuel your energy. Add fermented foods." };
  if (day <= 16) return { phase:"ovulatory",  day, label:"Ovulatory",  color:"#C9A96E", tip:"Peak performance window — lift heavy, train hard. Zinc-rich seeds and anti-inflammatory salmon are ideal." };
  return               { phase:"luteal",     day, label:"Luteal",     color:"#B8922A", tip:"Magnesium eases PMS — dark chocolate, nuts, leafy greens. Reduce salt and favour moderate cardio." };
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
