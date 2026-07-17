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

// Picks a stable-for-the-day index from a pool of given length, avoiding the last few days' picks
// (localStorage-only, per device). Sharing a poolKey across two parallel pools (e.g. a short My Day
// version and a long Ritual version of the same theme) keeps them in sync for the day, so the same
// theme never shows twice — once short, once explained — without literally repeating the sentence.
export const pickDailyIndex = (poolKey, poolLength) => {
  if (typeof window === "undefined" || !poolLength || poolLength <= 0) return 0;
  if (poolLength === 1) return 0;
  const today = localDateStr();
  let history = {};
  try { history = JSON.parse(localStorage.getItem("nora_tip_history") || "{}"); } catch {}
  const entry = history[poolKey];
  if (entry && entry.date === today && entry.idx < poolLength) return entry.idx;
  const recent = (entry?.recent || []).filter(i => i < poolLength);
  const candidates = Array.from({ length: poolLength }, (_, i) => i).filter(i => !recent.includes(i));
  const pickFrom = candidates.length > 0 ? candidates : Array.from({ length: poolLength }, (_, i) => i);
  const idx = pickFrom[Math.floor(Math.random() * pickFrom.length)];
  history[poolKey] = { date: today, idx, recent: [idx, ...recent].slice(0, Math.min(3, poolLength - 1)) };
  try { localStorage.setItem("nora_tip_history", JSON.stringify(history)); } catch {}
  return idx;
};

// Picks a variant (text) from a pool, using the same daily-stable, anti-repeat logic as pickDailyIndex.
export const pickDailyVariant = (poolKey, pool) => pool?.[pickDailyIndex(poolKey, pool?.length || 0)];

// short: one sentence, actionable, for My Day. long: 2-3 sentences, explains the "why", for Ritual.
// Same index in both arrays = same underlying theme, just at different depth — keeps the two tabs
// thematically in sync (via a shared pickDailyIndex key) instead of literally repeating text.
const CYCLE_TIP_POOLS = {
  menstrual: { color:"#9E5E52", label:"Menstrual",
    short:[
      "Spinach, lentils and red meat replenish iron. Avoid caffeine; herbal tea is soothing. Light movement only.",
      "Prostaglandins peak now, driving cramps — omega-3-rich fish or a magnesium-rich snack can take the edge off.",
      "Iron losses are highest these days. Pairing plant iron with vitamin C — lentils with citrus — improves absorption.",
      "Gentle movement, like walking or stretching, tends to ease cramping more than pushing through a hard session.",
      "Warmth — a hot water bottle or bath — relaxes uterine muscle and can meaningfully ease period pain.",
    ],
    long:[
      "Menstrual blood loss draws down your iron stores, and low iron shows up as fatigue before it shows up on a blood test. Iron from plants — lentils, spinach — absorbs far better alongside vitamin C, roughly tripling uptake. Caffeine does the opposite: it binds iron in the gut, which is why herbal tea is the better choice this week.",
      "Prostaglandins are the hormone-like compounds that trigger your uterus to contract and shed its lining — the more your body produces, the stronger the cramps. Omega-3 fats compete with the same pathway that produces prostaglandins, which is the mechanism behind fish or flaxseed easing period pain over time, not just in the moment.",
      "Because iron absorption is already working against you during heavier flow days, pairing sources matters more than usual. Vitamin C converts iron into a form your gut absorbs far more readily — a simple combination with an outsized effect on the days you're losing the most.",
      "It feels counterintuitive, but low-intensity movement increases blood flow to the pelvis and can genuinely reduce cramp intensity, where high-intensity training adds physical stress on top of what your body is already managing. This is one of the few weeks where less can do more.",
      "Heat works on period pain through a real mechanism: it increases local blood flow and relaxes the smooth muscle of the uterus that's contracting to cause cramps. Studies comparing heat to over-the-counter pain relief have found comparable effectiveness for period pain specifically.",
    ],
  },
  follicular: { color:"#7A9E8A", label:"Follicular",
    short:[
      "HIIT and strength training are excellent this week. Complex carbs fuel your energy. Add fermented foods.",
      "Rising oestrogen supports higher energy and faster recovery — a good window to progress your training load.",
      "Fermented foods support the oestrobolome, the gut bacteria that help clear and recycle oestrogen efficiently.",
      "This is often the most resilient week of the cycle — a reasonable time to try a new class or harder session.",
      "Complex carbs and lean protein together support the higher energy demands of this rising-oestrogen phase.",
    ],
    long:[
      "Oestrogen rises steadily through the follicular phase, improving glucose uptake in muscle and supporting faster recovery between sessions. This is genuinely one of the better windows in your cycle to push training volume or intensity.",
      "Recovery capacity tracks fairly closely with oestrogen — as it rises through this phase, tissue repair and glycogen replenishment both tend to run more efficiently. It's less that you can push harder in the moment and more that you bounce back faster between sessions.",
      "The oestrobolome is the subset of gut bacteria that can reactivate oestrogen your liver has already flagged for excretion. A more diverse, fermented-food-supported microbiome means more efficient oestrogen metabolism — which matters for hormonal balance well beyond this one week.",
      "Pain tolerance and perceived exertion both tend to improve as oestrogen rises, which is part of why the same workout can feel easier now than during your period. It's a reasonable window to test where your current limits actually are.",
      "Rising oestrogen increases insulin sensitivity, meaning your muscles take up glucose from carbohydrate more efficiently right now. Complex carbs paired with protein support both the higher energy expenditure this phase invites and the repair that follows it.",
    ],
  },
  ovulatory: { color:"#C9A96E", label:"Ovulatory",
    short:[
      "Peak performance window — lift heavy, train hard. Zinc-rich seeds and anti-inflammatory salmon are ideal.",
      "Strength and coordination often peak around ovulation — a good window for a personal best if you feel ready.",
      "Zinc is heavily used at ovulation — pumpkin seeds, oysters or hemp seeds help replenish it.",
      "Oestrogen peaks now, which can mean higher energy but also more joint laxity — warm up a little longer.",
      "Anti-inflammatory foods — oily fish, olive oil, berries — support the hormonal shift happening this week.",
    ],
    long:[
      "Oestrogen reaches its cycle peak just before ovulation, coinciding with measurable improvements in strength output and neuromuscular coordination in several studies. It's a legitimate window to attempt heavier lifts, provided your warm-up accounts for the joint laxity below.",
      "The combination of peak oestrogen and a small testosterone rise around ovulation is thought to explain why many women report their best strength performances in this window. It isn't universal, but if you've been building toward something, this is a sensible week to test it.",
      "Zinc plays a direct role in the hormonal cascade that triggers ovulation and supports the corpus luteum afterward — your body's demand for it rises specifically around this point in the cycle, making replenishment through food more relevant now than at other times.",
      "Oestrogen affects ligament laxity and peaks right around ovulation — a well-documented factor in higher ACL injury rates seen in female athletes during this window. A longer warm-up isn't caution for its own sake; it's a reasonable response to a real physiological shift.",
      "The transition from the oestrogen peak into early progesterone rise can bring a short window of low-grade inflammation for some. Anti-inflammatory foods won't prevent this shift, but they support the body through it without adding extra burden.",
    ],
  },
  luteal: { color:"#B8922A", label:"Luteal",
    short:[
      "Magnesium eases PMS — dark chocolate, nuts, leafy greens. Reduce salt and favour moderate cardio.",
      "Progesterone rises in this phase, often raising body temperature slightly — training may feel a touch harder.",
      "Cravings tend to increase in the luteal phase — protein and fibre at each meal help blunt the swings.",
      "Reducing sodium and processed food in the week before your period can meaningfully ease bloating.",
      "Sleep can be lighter in the late luteal phase — a consistent wind-down routine matters more than usual now.",
    ],
    long:[
      "Magnesium is used up faster when progesterone is high, and low magnesium is linked to worse PMS symptoms — irritability, cramping and disrupted sleep among them. Replenishing it through food across the whole luteal phase, not just when symptoms hit, is where the evidence is strongest.",
      "Progesterone raises basal body temperature by roughly 0.3–0.5°C in the luteal phase — one of the more reliable signs ovulation has occurred. That same thermal shift is part of why moderate training can feel subjectively harder even when your fitness hasn't changed.",
      "Falling oestrogen and rising progesterone in the late luteal phase are linked to lower serotonin activity, part of the biological basis for stronger carbohydrate cravings before your period. Protein and fibre slow digestion and blunt the blood sugar swings that make cravings feel more urgent.",
      "Progesterone promotes sodium and fluid retention, the direct mechanism behind luteal-phase bloating — it isn't just perception. Cutting extra sodium from processed food won't eliminate it, but it removes one compounding factor.",
      "The temperature rise from progesterone can fragment sleep in the second half of the luteal phase, particularly in the two or three nights before your period starts. A cooler room and a consistent wind-down routine tend to matter more here than at other points in the cycle.",
    ],
  },
};

export const getCycleTip = (phase, style = "short") => {
  const meta = CYCLE_TIP_POOLS[phase];
  if (!meta) return "";
  const idx = pickDailyIndex(`cycle_${phase}`, meta.short.length);
  return (meta[style] || meta.short)[idx] ?? meta.short[idx];
};

// short: one sentence for My Day. long: 2-3 sentences, explains the mechanism, for Ritual.
const MALE_TIP_POOLS = {
  strength: { icon:"💪", title:"Strength window",
    short:[
      "Morning testosterone peaks — optimal for heavy lifts. Fuel with a protein-rich breakfast 1–2 hours before training.",
      "Grip strength and reaction time are typically sharper in the morning — a good window for technical lifts.",
      "Training fasted or fed both work, but a small protein hit beforehand supports better bar speed under load.",
      "Morning strength sessions tend to carry lower injury risk once a proper warm-up raises core temperature.",
      "Creatine timing matters less than consistency — daily intake, any time, sustains muscle phosphocreatine stores.",
    ],
    long:[
      "Testosterone follows a clear daily rhythm, typically 20–30% higher within an hour or two of waking than in the evening. This peak supports both force production and recovery signalling, which is the physiological basis for treating morning as a strong default window for your heaviest lifts.",
      "Motor unit recruitment and reaction time both show measurable circadian variation, and morning tends to favour precision over raw output for most people. Technical or skill-heavy lifts — where form matters as much as load — often benefit from this earlier window.",
      "Whether you train fasted comes down to preference more than performance for most sessions under an hour. Where protein beforehand does help is bar speed and power output under heavier loads, likely through better amino acid availability during the lift itself.",
      "Core temperature is naturally lower first thing in the morning, and tissue is measurably stiffer until it rises — which is exactly what a proper warm-up addresses. Skipping it, not the time of day itself, is where morning training risk actually comes from.",
      "Creatine works by saturating your muscle's phosphocreatine stores over days to weeks, not by an acute dose before training. What predicts results in the research is consistent daily intake — the exact time of day you take it barely moves the needle.",
    ],
  },
  cardio: { icon:"🏃", title:"Cardio peak",
    short:[
      "Core temperature and reaction time peak now. Great for HIIT or endurance. Load up on complex carbs beforehand.",
      "Lung function and aerobic capacity are measurably higher in the afternoon than first thing in the morning.",
      "A carb-inclusive meal 2–3 hours before cardio tops up glycogen without the sluggishness of eating too close to training.",
      "Afternoon heat tolerance is higher — a good window for harder conditioning work if you train outdoors.",
      "Perceived exertion tends to feel lower in the afternoon for the same actual effort — useful for pushing pace work.",
    ],
    long:[
      "Core body temperature rises through the day and typically peaks in the late afternoon, and warmer muscle tissue contracts more efficiently with less risk of strain. Combined with faster reaction time in this window, it's a reasonable case for scheduling your hardest conditioning work here if your day allows it.",
      "Lung function, measured as FEV1, follows a documented circadian pattern and tends to run meaningfully higher in the late afternoon than in early morning. For endurance work specifically, that translates to more oxygen delivered per breath at the same effort level.",
      "Muscle glycogen — your primary fuel for sustained hard effort — takes roughly 2–3 hours to be digested and stored from a carbohydrate-containing meal. Eating too close to training leaves fuel still in the gut rather than the muscle, the usual cause of that heavy, sluggish feeling.",
      "Heat tolerance improves as the day goes on, tracking the same core-temperature rhythm that peaks in the afternoon. If you're training outdoors in warm conditions, your body is genuinely better equipped for it now than first thing in the morning.",
      "Rate of perceived exertion — how hard an effort feels, independent of what your heart rate is actually doing — tends to be lower in the afternoon for a given workload. It's a real perceptual shift, not just motivation, and part of why afternoon sessions often produce better pace or power numbers.",
    ],
  },
  recovery: { icon:"🔄", title:"Recovery window",
    short:[
      "Muscle repair happens post-workout. Prioritise protein and magnesium-rich foods; quality sleep completes the cycle.",
      "Evening protein intake supports overnight muscle protein synthesis nearly as well as daytime meals.",
      "Magnesium-rich foods in the evening — leafy greens, nuts, seeds — may ease muscle tension going into sleep.",
      "A short mobility or stretching session now can reduce next-day stiffness more than static rest alone.",
      "Tart cherry juice has modest evidence for reducing exercise-induced muscle soreness when taken in the evening.",
    ],
    long:[
      "Muscle protein synthesis stays elevated for roughly 24–48 hours after resistance training, not just in the first hour or two — the old idea of a narrow post-workout 'window' has largely been revised. What matters more across that time is total daily protein and genuinely restorative sleep, since growth hormone release is concentrated in deep sleep.",
      "Research comparing protein timing across the day has found an evening dose — including right before bed — supports overnight muscle protein synthesis about as effectively as intake earlier in the day, provided total daily protein is adequate. The old rule about avoiding protein late in the day doesn't hold up well against the data.",
      "Magnesium is a cofactor in the process that lets muscle fibres relax after contracting — genuinely low magnesium can contribute to cramping and a sense of persistent tension. Food sources in the evening won't work instantly, but consistent intake supports this relaxation process over time.",
      "Static stretching and light mobility increase blood flow to worked tissue without adding further mechanical stress, the likely mechanism behind reduced next-day stiffness compared with doing nothing at all. It's a low-cost addition with a modest, fairly consistent benefit.",
      "Tart cherries are unusually concentrated in anthocyanins, compounds with measurable anti-inflammatory activity in several small trials on exercise-induced muscle soreness. The effect size is modest and the evidence isn't large-scale, but it's one of the better-supported food-based recovery aids that exists.",
    ],
  },
  restRepair: { icon:"🌙", title:"Rest & repair",
    short:[
      "Avoid heavy meals after 9 pm. Your body detoxes and rebuilds during deep sleep — protect that window.",
      "Testosterone production is closely tied to deep sleep — cutting sleep short has a measurable next-day cost.",
      "A cool, dark room supports the testosterone and growth hormone release that happens overnight.",
      "Late-night alcohol blunts the deep sleep stages where most physical recovery happens.",
      "Consistent sleep and wake times matter more for hormonal recovery than total hours alone.",
    ],
    long:[
      "Digestion competes with the body's overnight repair processes for blood flow and metabolic resources — a heavy meal close to bedtime doesn't just risk poorer sleep, it can delay the deeper sleep stages where most physical restoration happens. Finishing eating a few hours before bed gives your body a cleaner runway into that recovery window.",
      "The majority of daily testosterone release happens during sleep, concentrated in the deep and REM stages. Research restricting sleep to five hours a night in young healthy men found testosterone levels drop measurably within about a week — this isn't a small or theoretical effect.",
      "Both testosterone and growth hormone release are tied to deep sleep, and deep sleep itself is highly sensitive to light and temperature. A cooler room supports the core-temperature drop your body needs to enter deep sleep, the mechanical reason this environment matters as much as duration.",
      "Alcohol can make falling asleep feel easier, but it suppresses REM sleep and fragments the deeper stages later in the night — exactly the stages most tied to hormonal recovery and tissue repair. The cost tends to show up the next day even when total sleep hours look normal.",
      "Circadian research consistently finds that irregular sleep timing disrupts hormonal patterns even when total sleep duration stays the same. Going to bed and waking at consistent times is one of the higher-leverage, lowest-effort changes for hormonal recovery — more so than chasing an extra hour on an inconsistent schedule.",
    ],
  },
};

export const getMaleTipKey = () => {
  const h = new Date().getHours();
  return h>=5&&h<12 ? "strength" : h>=12&&h<18 ? "cardio" : h>=18&&h<22 ? "recovery" : "restRepair";
};

export const getMaleTip = (style = "short") => {
  const key = getMaleTipKey();
  const meta = MALE_TIP_POOLS[key];
  const idx = pickDailyIndex(`male_${key}`, meta.short.length);
  return { icon: meta.icon, title: meta.title, tip: (meta[style] || meta.short)[idx] ?? meta.short[idx] };
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
  const avgPeriodLength = periodLengthEstimated
    ? 5
    : Math.round(completed.reduce((s, l) => s + (daysBetween(l.end_date, l.start_date) + 1), 0) / completed.length);

  // If the current/most recent period already has a logged end_date, that's ground truth for
  // where its menstrual phase actually ended — use it instead of the historical average so the
  // phase updates the moment the user logs the end, regardless of past cycle lengths.
  const actualCurrentPeriodLength = mostRecent.end_date ? daysBetween(mostRecent.end_date, mostRecent.start_date) + 1 : null;
  const periodLength = actualCurrentPeriodLength ?? avgPeriodLength;
  const periodLengthEstimated_final = actualCurrentPeriodLength != null ? false : periodLengthEstimated;

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
    tip: getCycleTip(phase, "short"),
    periodLength, periodLengthEstimated: periodLengthEstimated_final,
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
