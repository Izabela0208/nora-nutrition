import { useState, useEffect } from "react";
import { C, card, serif, sans, getCyclePhase, getWeekKey } from "../noraTokens";

// ─── WEEKLY THEMES ────────────────────────────────────────────────────────────
const WEEKLY_THEMES = ["Sleep Optimization","Hydration","Movement & Strength","Cold Exposure","Intermittent Fasting","Mindfulness","Sugar-Free Challenge","Morning Routine"];

// ─── DAILY CATEGORIES ─────────────────────────────────────────────────────────
const DAILY_CATEGORIES = ["sleep optimization","afternoon energy","evening wind-down","workout recovery","stress management","gut health","breathwork","cold exposure","fasting","supplement timing","mindfulness","hydration"];

// ─── PUBMED QUERY ARRAYS ──────────────────────────────────────────────────────
const CATEGORY_PUBMED = {
  "sleep optimization":  ["sleep quality health","sleep duration outcomes","sleep intervention humans"],
  "afternoon energy":    ["afternoon fatigue alertness","post-lunch energy performance","circadian afternoon productivity"],
  "evening wind-down":   ["evening relaxation sleep onset","pre-sleep routine health","sleep hygiene intervention"],
  "workout recovery":    ["exercise recovery performance","post-exercise muscle recovery","sport recovery health"],
  "stress management":   ["stress reduction health","cortisol reduction intervention","psychological stress management"],
  "gut health":          ["gut microbiome health","probiotic gut health","intestinal microbiota diet"],
  "breathwork":          ["breathing exercise health","controlled breathing stress","respiratory exercise benefits"],
  "cold exposure":       ["cold water immersion health","cold exposure benefits humans","cold therapy health"],
  "fasting":             ["intermittent fasting health","time restricted eating","caloric restriction humans"],
  "supplement timing":   ["supplement timing health","micronutrient timing","vitamin mineral health outcomes"],
  "mindfulness":         ["mindfulness meditation health","meditation stress wellbeing","mindfulness intervention"],
  "hydration":           ["hydration performance health","water intake health","electrolyte hydration exercise"],
};

// ─── 16 EXPLORE / PROTOCOL CATEGORIES ────────────────────────────────────────
const EXPLORE_CATEGORIES = [
  { id:"sleep",      title:"Sleep",               subtitle:"Anchor your circadian rhythm",         guide:"Fix your wake time first — the same every day including weekends. Your suprachiasmatic nucleus uses this anchor to time cortisol, melatonin, and body temperature with precision. Cool your bedroom to 16–18°C and eliminate all light sources; even 10 lux suppresses melatonin by 50%. No caffeine after noon, no food within 3 hours of bed. These variables compound into measurably deeper sleep within one week.",  protocol:"Fixed wake time · bedroom 16–18°C · complete darkness · no caffeine after noon · last meal 3h before bed" },
  { id:"hydration",  title:"Hydration",           subtitle:"Cellular performance starts here",     guide:"On waking, drink 500ml of water with a pinch of sea salt and a squeeze of lemon. After 7–9 hours without fluid, cells are sodium-depleted; electrolytes are required to carry water across cell membranes. Plain water alone can dilute intracellular electrolytes further. Target 35ml per kg of bodyweight throughout the day, with an additional 500ml per hour of exercise.",                                              protocol:"On waking: 500ml + sea salt + lemon · 35ml/kg daily · +500ml per hour of exercise" },
  { id:"movement",   title:"Movement",            subtitle:"Build strength that lasts decades",    guide:"Two disciplines produce the greatest return: resistance training 2–3 times weekly for muscle mass and bone density, and 150–180 minutes weekly of Zone 2 cardio at conversational pace for mitochondrial density and fat oxidation. Both are independently associated with reduced all-cause mortality. Compound movements — squat, hinge, push, pull — and consistency over decades are the variables that matter most.",   protocol:"Resistance: 2–3x/week, compound movements · Zone 2: 150–180 min/week at full-conversation pace" },
  { id:"nutrition",  title:"Nutrition",           subtitle:"Food as precision medicine",          guide:"Eat 30 different plant varieties each week — the strongest single predictor of microbiome diversity in population studies. Prioritise protein at 1.6–2.2g per kg of bodyweight for muscle protein synthesis. Front-load calories to earlier in the day; insulin sensitivity is highest in the morning. Extra virgin olive oil, dark berries, and green tea are the highest-polyphenol daily additions available.",              protocol:"30 plants/week · protein 1.6–2.2g/kg · larger breakfast and lunch · EVOO + dark berries daily" },
  { id:"breathwork", title:"Breathwork",          subtitle:"The fastest route to calm",           guide:"Box breathing — inhale 4, hold 4, exhale 4, hold 4 — activates the parasympathetic nervous system via vagal stimulation within 2 minutes. For energy: 30 deep Wim Hof breaths followed by an exhale hold floods the brain with oxygen and releases adrenaline naturally. Both require no equipment. Never practise cyclic hyperventilation in water or while driving.",                                                      protocol:"Calm: box 4-4-4-4, 4–6 rounds · Energy: 30 deep breaths + exhale hold, 3 rounds — lying down only, never in water" },
  { id:"cold",       title:"Cold Exposure",       subtitle:"Controlled stress, profound adaptation",guide:"End your shower with 30–60 seconds of cold water. The physiological shock triggers a 200–300% norepinephrine spike and sustained dopamine elevation lasting 2–4 hours. Regular cold exposure improves vascular tone and cold shock protein resilience. Build from 15 seconds, adding 5 seconds daily. Never practise cold water immersion alone in open water.",                                                          protocol:"Cold shower finish: start 15 sec → build to 60+ sec · morning preferred · never immerse in open water alone" },
  { id:"sauna",      title:"Sauna & Heat Therapy",subtitle:"Hormetic heat for cellular resilience",guide:"Heat stress activates heat shock proteins (HSPs), molecular chaperones that repair damaged proteins and reduce aggregation — a mechanism shared with longevity pathways activated by fasting. Sauna sessions of 20 minutes at 80–100°C, 3–4 times weekly, are associated with a 40% reduction in all-cause mortality in Finnish longitudinal studies. Heat also triggers BDNF release and robust growth hormone pulses.",  protocol:"80–100°C · 20 min sessions · 3–4x/week · finish with cool rinse · electrolyte hydration before and after" },
  { id:"fasting",    title:"Fasting",             subtitle:"Metabolic flexibility through timing", guide:"A 14:10 protocol — eating within a 10-hour window such as 9am–7pm — aligns food intake with your circadian cortisol peak and measurably improves insulin sensitivity within 2 weeks. The 14-hour fasting mark initiates autophagy, the cellular recycling of damaged proteins. Break your fast with protein rather than carbohydrates. Contraindicated during pregnancy and for those with an eating disorder history.",      protocol:"14:10: eat 9am–7pm · break fast with protein · water, black coffee, herbal tea only during fast" },
  { id:"stress",     title:"Stress Relief",       subtitle:"Lower cortisol, raise resilience",    guide:"Twenty minutes in a natural setting — park, woodland, or riverside — measurably lowers cortisol, blood pressure, and inflammatory markers without any active effort. This Shinrin-yoku effect has been replicated across dozens of controlled trials. If outdoor access is limited, a gratitude practice of three specific written entries activates the same reward pathways within minutes of writing.",                        protocol:"20 min in nature, no phone, slow pace · or 3 specific gratitude entries, morning or evening" },
  { id:"gut",        title:"Gut Health",          subtitle:"Your second brain, nourished",        guide:"The gut microbiome produces 90% of the body's serotonin and 50% of its dopamine, communicating with the brain via the vagus nerve. Eat one serving of fermented food daily — yogurt, kefir, kimchi, sauerkraut, or kombucha — paired with prebiotic fibre (garlic, leeks, oats, green bananas). Microbiome diversity is the strongest dietary predictor of mood and anxiety outcomes in longitudinal studies.",             protocol:"1 fermented serving daily · pair with prebiotic fibre · 30 plants/week · reduce ultra-processed foods" },
  { id:"supplements",title:"Supplements",         subtitle:"Precision micronutrient support",     guide:"Three supplements have the strongest evidence base: magnesium glycinate (300–400mg before bed) for sleep depth, GABA synthesis, and muscle relaxation; vitamin D3 with K2 for immune, bone, and hormonal function — most adults are deficient; and omega-3 EPA/DHA for cardiovascular and cognitive health. All doses require individual context — consult your doctor before starting.",                                      protocol:"Magnesium glycinate 300–400mg, 30 min before bed · Vitamin D3+K2 and omega-3: test and consult your doctor" },
  { id:"mindfulness",title:"Mindfulness",         subtitle:"Attention as a trainable skill",      guide:"Sit quietly and follow your breath for 10 minutes. Every time your attention wanders — repeatedly, that is expected — return without judgment. Each return strengthens the prefrontal cortex circuits governing attention regulation and emotional resilience. Eight weeks of daily practice produces measurable changes in grey matter density in the insula and prefrontal cortex. No app required.",                              protocol:"10 min daily · same time each day · follow the breath only · each return of attention is the exercise" },
  { id:"light",      title:"Light Exposure",      subtitle:"Set your biological clock daily",     guide:"Step outside within 30 minutes of waking for 10–15 minutes. Low-angle morning light (6–9 AM) activates retinal photoreceptors that signal the suprachiasmatic nucleus, anchoring the cortisol rhythm and building that evening's melatonin reserve. Works on overcast days — outdoor lux is still 10–50× brighter than indoor lighting. In the evening, eliminate screens 90 minutes before bed.",                          protocol:"Outside within 30 min of waking · 6–9 AM only · no sunglasses · 10 min clear / 20 min overcast · screens off 90 min before bed" },
  { id:"icebath",    title:"Ice Bath & Wim Hof",  subtitle:"Ice, breath, and radical cold",       guide:"Combining cyclic hyperventilation with cold water immersion produces a profound adrenaline and norepinephrine surge, with dopamine elevation up to 250% above baseline lasting several hours. Wim Hof Method practitioners show documented voluntary activation of the innate immune system. Start with the breathing practice alone before adding cold water. Never perform breathing exercises in or near water.",               protocol:"Breathing: 30–40 deep breaths + exhale hold, 3 rounds, lying down · Cold: 1–3°C, 2–5 min · Never breathe in water · Never alone" },
  { id:"hormones",   title:"Hormones",            subtitle:"Master your endocrine architecture",  guide:"Hormonal health is downstream of lifestyle — sleep, nutrition, and light exposure regulate cortisol, oestrogen, testosterone, and thyroid function more powerfully than most interventions. Resistance training 3x weekly raises testosterone and GH naturally. Blue light after 9 PM suppresses melatonin and disrupts the entire hormonal cascade. Women benefit from cycle-syncing nutrition and training intensity with their hormonal phases.", protocol:"Fixed wake time · 7–9h sleep · resistance training 3x/week · no blue light 2h before bed · cycle-sync for women" },
  { id:"longevity",  title:"Longevity",           subtitle:"The science of living better, longer",guide:"The four pillars of longevity science converge on the same mechanisms: mTOR inhibition (fasting), NAD+ restoration (exercise), AMPK activation (exercise, cold), and senolytic clearance. Muscle mass is the most predictive biomarker of healthspan beyond age 40. Zone 2 cardio and progressive resistance training together address the largest lifespan-limiting decline: loss of VO2max and muscle mass over time.",     protocol:"Zone 2: 150+ min/week · Resistance: 2–3x/week · Sleep 7–9h · 14–16h fasting window · Test: VO2max, DEXA, blood panel" },
];

// ─── READING LIST ─────────────────────────────────────────────────────────────
const BOOK_GROUPS = [
  { category:"Sleep",          books:[{ id:"sl1", title:"Why We Sleep",              author:"Matthew Walker",      desc:"How poor sleep accelerates every disease process — the case for prioritising rest above all else.",                            colSpan:1 },{ id:"sl2", title:"Sleep Smarter",              author:"Shawn Stevenson",     desc:"21 proven strategies for deeper, more restorative sleep and a sharper mind.",                                             colSpan:1 }]},
  { category:"Breathwork",     books:[{ id:"bw1", title:"Breath",                    author:"James Nestor",        desc:"The lost art and science of breathing — why how you breathe shapes health more than any diet.",                            colSpan:2 },{ id:"bw2", title:"The Oxygen Advantage",       author:"Patrick McKeown",     desc:"Scientifically proven breathing techniques for a healthier, faster, leaner body.",                                        colSpan:1 },{ id:"bw3", title:"The Wim Hof Method",         author:"Wim Hof",             desc:"Activate your full human potential through breathing, cold exposure, and commitment.",                                     colSpan:1 }]},
  { category:"Cold & Heat",    books:[{ id:"ch1", title:"What Doesn't Kill Us",      author:"Scott Carney",        desc:"How freezing water and extreme altitude can restore our lost evolutionary strength.",                                       colSpan:2 }]},
  { category:"Longevity",      books:[{ id:"lo1", title:"Outlive",                   author:"Peter Attia",         desc:"Medicine 3.0 — the science and art of maximising healthspan, not just lifespan.",                                         colSpan:2 },{ id:"lo2", title:"Lifespan",                    author:"David Sinclair",      desc:"A radical new theory of ageing — and why we don't have to accept it.",                                                    colSpan:1 },{ id:"lo3", title:"The Longevity Diet",         author:"Valter Longo",        desc:"Stem cell activation and regeneration to slow ageing through precision nutrition.",                                        colSpan:1 },{ id:"lo4", title:"The Circadian Code",         author:"Satchin Panda",       desc:"Transform your health by aligning food, sleep, and light to your internal body clock.",                                   colSpan:2 }]},
  { category:"Nutrition",      books:[{ id:"nu1", title:"How Not to Die",            author:"Michael Greger",      desc:"Foods scientifically proven to prevent and reverse the leading causes of death.",                                           colSpan:1 },{ id:"nu2", title:"Food",                      author:"Mark Hyman",          desc:"What the heck should I eat? A clear, evidence-based guide to navigating modern food.",                                    colSpan:1 },{ id:"nu3", title:"Grain Brain",               author:"David Perlmutter",    desc:"The surprising truth about wheat, carbs, and sugar as your brain's silent killers.",                                      colSpan:2 },{ id:"nu4", title:"Genius Foods",              author:"Max Lugavere",        desc:"Become smarter and more productive while protecting your brain for life.",                                                 colSpan:1 },{ id:"nu5", title:"The Plant Paradox",         author:"Steven Gundry",       desc:"The hidden dangers in so-called healthy foods that cause disease and weight gain.",                                        colSpan:1 }]},
  { category:"Fasting",        books:[{ id:"fa1", title:"The Complete Guide to Fasting",author:"Jason Fung",       desc:"Heal your body through intermittent, alternate-day, and extended fasting.",                                                colSpan:1 },{ id:"fa2", title:"The Obesity Code",          author:"Jason Fung",          desc:"Unlocking the true mechanisms of weight loss — why conventional advice fails.",                                            colSpan:1 },{ id:"fa3", title:"Fast. Feast. Repeat.",      author:"Gin Stephens",        desc:"The comprehensive guide to the Delay, Don't Deny intermittent fasting lifestyle.",                                        colSpan:2 }]},
  { category:"Biohacking",     books:[{ id:"bi1", title:"Boundless",                 author:"Ben Greenfield",      desc:"The world's most comprehensive guide to upgrading brain, body, and spirit.",                                               colSpan:2 },{ id:"bi2", title:"The Bulletproof Diet",     author:"Dave Asprey",         desc:"Lose fat, reclaim energy and focus — a foundational biohacking blueprint.",                                               colSpan:1 },{ id:"bi3", title:"Super Human",              author:"Dave Asprey",         desc:"The Bulletproof plan to age backward and substantially extend healthy years.",                                             colSpan:1 }]},
  { category:"Movement",       books:[{ id:"mo1", title:"Spark",                     author:"John Ratey",          desc:"The revolutionary new science of exercise and its profound effect on the brain.",                                           colSpan:1 },{ id:"mo2", title:"Born to Run",             author:"Christopher McDougall",desc:"A hidden tribe, superathletes, and the greatest race the world has never seen.",                                            colSpan:1 },{ id:"mo3", title:"Exercised",               author:"Daniel Lieberman",    desc:"Why something we never evolved to do voluntarily is healthy and rewarding.",                                               colSpan:2 }]},
  { category:"Gut Health",     books:[{ id:"gu1", title:"Fiber Fueled",              author:"Will Bulsiewicz",     desc:"Plant-based programme for weight loss, health restoration, and microbiome optimisation.",                                   colSpan:1 },{ id:"gu2", title:"Brain Maker",             author:"David Perlmutter",    desc:"The power of gut microbes to heal and protect your brain — for life.",                                                    colSpan:1 }]},
  { category:"Mindfulness",    books:[{ id:"mi1", title:"The Body Keeps the Score",  author:"Bessel van der Kolk", desc:"How trauma reshapes the body and brain — and the paths to healing.",                                                       colSpan:2 },{ id:"mi2", title:"Full Catastrophe Living",  author:"Jon Kabat-Zinn",      desc:"Using mindfulness meditation to face stress, pain, and chronic illness.",                                                  colSpan:1 },{ id:"mi3", title:"Lost Connections",         author:"Johann Hari",         desc:"Uncovering the real causes of depression — and the unexpected solutions.",                                                 colSpan:1 }]},
  { category:"Women's Health", books:[{ id:"wh1", title:"In the Flo",               author:"Alisa Vitti",         desc:"Unlock your hormonal advantage and revolutionise food, fitness, and energy by cycle phase.",                               colSpan:1 },{ id:"wh2", title:"The Hormone Cure",        author:"Sara Gottfried",      desc:"Reclaim balance, sleep, sex drive, and vitality naturally with the Gottfried Protocol.",                                  colSpan:1 }]},
  { category:"Ancestral Health",books:[{ id:"an1", title:"Primal Blueprint",         author:"Mark Sisson",         desc:"Reprogram your genes for effortless weight loss, vibrant health, and boundless energy.",                                   colSpan:1 },{ id:"an2", title:"The Paleo Solution",      author:"Robb Wolf",           desc:"The original human diet — lose fat, regain health, and build real strength.",                                             colSpan:1 }]},
];

// ─── SCORE SYSTEM ─────────────────────────────────────────────────────────────
const getDailyScores = () => {
  const d = new Date();
  const n = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  const rng = (s) => { const x = Math.abs(Math.sin(n * 127.1 + s * 311.7) * 43758.5); return x - Math.floor(x); };
  return {
    sleep:      Math.round(48 + rng(1) * 44),
    hydration:  Math.round(52 + rng(2) * 43),
    movement:   Math.round(38 + rng(3) * 52),
    nutrition:  Math.round(46 + rng(4) * 48),
    breathwork: Math.round(56 + rng(5) * 39),
    cold:       Math.round(28 + rng(6) * 57),
    sauna:      Math.round(32 + rng(7) * 53),
  };
};
const DAILY_SCORES = getDailyScores();

const scoreColor = (s) => s >= 80 ? "#00C896" : s >= 65 ? "#27AE82" : s >= 50 ? "#F59E0B" : "#EF5350";
const scoreLabel = (s) => s >= 80 ? "Optimal" : s >= 65 ? "Good" : s >= 50 ? "Fair" : "Needs work";

const SCORE_CATS = [
  { id:"sleep",     emoji:"😴", label:"Sleep" },
  { id:"hydration", emoji:"💧", label:"Hydration" },
  { id:"movement",  emoji:"🏃", label:"Movement" },
  { id:"nutrition", emoji:"🥗", label:"Nutrition" },
  { id:"breathwork",emoji:"🌬️", label:"Breathwork" },
  { id:"cold",      emoji:"❄️",  label:"Cold" },
  { id:"sauna",     emoji:"🔥", label:"Sauna" },
];

const FOCUS_CAT_MAP = {
  "sleep optimization":"sleep", "afternoon energy":"movement", "evening wind-down":"sleep",
  "workout recovery":"movement", "stress management":"breathwork", "gut health":"nutrition",
  "breathwork":"breathwork", "cold exposure":"cold", "fasting":"nutrition",
  "supplement timing":"nutrition", "mindfulness":"breathwork", "hydration":"hydration",
};

const FOCUS_META = {
  sleep:      { emoji:"😴", title:"Sleep",        insight:"Consistent wake time anchors your circadian rhythm more powerfully than any supplement. Cool, dark room plus no screens 90 min before bed have the highest leverage on sleep quality and depth." },
  hydration:  { emoji:"💧", title:"Hydration",    insight:"On waking, 500ml with a pinch of sea salt replenishes electrolytes lost overnight. Plain water alone can dilute intracellular sodium — the body needs minerals to transport fluid across cell membranes." },
  movement:   { emoji:"🏃", title:"Movement",     insight:"Zone 2 cardio builds mitochondrial density and fat-oxidation capacity. Paired with resistance training 2–3x weekly, it represents the highest-leverage combination for longevity and metabolic health." },
  nutrition:  { emoji:"🥗", title:"Nutrition",    insight:"Target 30 different plant varieties this week. This single metric is the strongest predictor of microbiome diversity found in large population studies — and diversity predicts mood, immunity, and metabolic health." },
  breathwork: { emoji:"🌬️", title:"Breathwork",  insight:"Four rounds of box breathing — 4 counts in, hold, out, hold — activates the parasympathetic nervous system within 2 minutes. No equipment, no cost, and measurable reductions in cortisol within a single session." },
  cold:       { emoji:"❄️",  title:"Cold Exposure",insight:"Ending your shower with 30–60 seconds of cold water triggers a 200–300% norepinephrine spike. The dopamine elevation that follows outlasts the cold stimulus by 2–4 hours — longer than any pre-workout." },
  sauna:      { emoji:"🔥", title:"Sauna",        insight:"Three 20-minute sessions at 80–100°C weekly activate heat shock proteins that repair damaged cellular proteins. Finnish longitudinal data links this frequency to 40% lower all-cause mortality." },
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
};
const yesterday = () => {
  const d = new Date(); d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
};
const getSeason = () => { const m = new Date().getMonth(); if (m>=2&&m<=4)return"spring"; if(m>=5&&m<=7)return"summer"; if(m>=8&&m<=10)return"autumn"; return"winter"; };
const getWeekIndex = () => { const key = getWeekKey(); const n = parseInt(key.split("W")[1])||1; return (n-1) % WEEKLY_THEMES.length; };

const callClaude = async (sys, user) => {
  const res = await fetch("/api/chat", {
    method:"POST", headers:{"Content-Type":"application/json"},
    body:JSON.stringify({ model:"claude-haiku-4-5-20251001", max_tokens:400, system:sys, messages:[{ role:"user", content:user }] }),
  });
  const data = await res.json();
  return data.content?.map(b => b.text||"").join("")||"";
};

const fetchPubMed = async (query) => {
  try { const r = await fetch(`/api/pubmed?n=5&q=${encodeURIComponent(query)}`); if (!r.ok) return null; return await r.json(); } catch { return null; }
};

const tryParseJSON = (text) => {
  const clean = text.replace(/```json\s*/gi,"").replace(/```/g,"").trim();
  try { return JSON.parse(clean); } catch { const m = clean.match(/\{[\s\S]*\}/); if (m) { try { return JSON.parse(m[0]); } catch {} } return null; }
};

const fallbackPractice = (avoid=[]) => {
  const pool = EXPLORE_CATEGORIES.filter(c => !avoid.includes(c.title));
  const c = (pool.length>0?pool:EXPLORE_CATEGORIES)[Math.floor(Math.random()*Math.max(pool.length,1))];
  return { name:c.title, action:c.guide.split(". ").slice(0,2).join(". ")+".", why:c.subtitle };
};

// ─── CATEGORY ICONS ───────────────────────────────────────────────────────────
function CategoryIcon({ id, size=22, color="#2D4A3E" }) {
  const p = { stroke:color, strokeWidth:"1.4", strokeLinecap:"round", strokeLinejoin:"round", fill:"none" };
  const s = { width:size, height:size, viewBox:"0 0 24 24", fill:"none" };
  switch(id) {
    case "sleep":      return <svg {...s}><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z" {...p}/></svg>;
    case "hydration":  return <svg {...s}><path d="M12 3L6.5 11.5C5 13.5 5 16.5 7 18.5S11 20.5 12 20.5 17 20 19 18s2-5 .5-7L12 3Z" {...p}/><path d="M9 16.5Q12 15 15 16.5" {...p} strokeWidth="1"/></svg>;
    case "movement":   return <svg {...s}><path d="M5 20Q10 15 14 13Q19 11 21 5" {...p}/><path d="M14 13Q11.5 9 15 5" {...p} strokeWidth="1.1"/><path d="M14 13Q18.5 12 20 17" {...p} strokeWidth="1.1"/></svg>;
    case "nutrition":  return <svg {...s}><path d="M12 21C12 21 4 17 4 10C4 7.8 5.8 6 8 6C9.6 6 11 7 12 8.5C13 7 14.4 6 16 6C18.2 6 20 7.8 20 10C20 17 12 21 12 21Z" {...p}/><path d="M12 8.5V21" {...p} strokeWidth="1"/></svg>;
    case "breathwork": return <svg {...s}><path d="M3 12Q7.5 7 12 12Q16.5 17 21 12" {...p}/><path d="M3 12Q7.5 4 12 12Q16.5 20 21 12" {...p} strokeWidth="1"/><circle cx="12" cy="12" r="1.8" {...p} strokeWidth="1"/></svg>;
    case "cold":       return <svg {...s}><line x1="12" y1="3" x2="12" y2="21" {...p} strokeWidth="1.2"/><line x1="3" y1="12" x2="21" y2="12" {...p} strokeWidth="1.2"/><line x1="6" y1="6" x2="18" y2="18" {...p} strokeWidth="1.2"/><line x1="18" y1="6" x2="6" y2="18" {...p} strokeWidth="1.2"/><circle cx="12" cy="12" r="2.5" {...p} strokeWidth="1"/></svg>;
    case "sauna":      return <svg {...s}><path d="M5 21h14" {...p} strokeWidth="1.2"/><path d="M7 17Q9 13 7 9" {...p}/><path d="M12 17Q14 13 12 9" {...p}/><path d="M17 17Q19 13 17 9" {...p}/></svg>;
    case "fasting":    return <svg {...s}><path d="M8.5 3h7L14 10.5h-4L8.5 3Z" {...p}/><path d="M10 10.5l-2 10h8l-2-10" {...p}/><path d="M9.5 7h5" {...p} strokeWidth="1"/><path d="M10.5 15.5Q12 17.5 13.5 15.5" {...p} strokeWidth="1"/></svg>;
    case "stress":     return <svg {...s}><path d="M6 3.5Q12 2 14 7.5Q16 13 12 16Q8.5 19 12 21.5" {...p}/><path d="M4 9Q6 8 8.5 9" {...p} strokeWidth="1"/><path d="M14.5 12.5Q16.5 11.5 19 12.5" {...p} strokeWidth="1"/></svg>;
    case "gut":        return <svg {...s}><path d="M12 3C8 3 5 6 5 9.5C5 12.5 7 14.5 9.5 14.5C11.5 14.5 13 13 13 11C13 9 14 8 15.5 8C17 8 18 9 18 11C18 14.5 15.5 18 12 21" {...p}/></svg>;
    case "supplements":return <svg {...s}><path d="M8 9.5C8 7 9.8 5 12 5C14.2 5 16 7 16 9.5V14.5C16 17 14.2 19 12 19C9.8 19 8 17 8 14.5V9.5Z" {...p}/><line x1="8" y1="12" x2="16" y2="12" {...p} strokeWidth="1.2"/></svg>;
    case "mindfulness":return <svg {...s}><path d="M12 12Q9 9 9 6.5C9 4.6 10.3 3 12 3C13.7 3 15 4.6 15 6.5C15 9 12 12 12 12Z" {...p}/><path d="M12 12Q15.5 10 18 11.5C19.5 12.5 19 14 18 15C16 16.5 12 15.5 12 15.5" {...p} strokeWidth="1.1"/><path d="M12 12Q8.5 10 6 11.5C4.5 12.5 5 14 6 15C8 16.5 12 15.5 12 15.5" {...p} strokeWidth="1.1"/><line x1="12" y1="15.5" x2="12" y2="21" {...p} strokeWidth="1.1"/></svg>;
    case "light":      return <svg {...s}><circle cx="12" cy="12" r="4" {...p}/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8" {...p} strokeWidth="1.2"/></svg>;
    case "icebath":    return <svg {...s}><path d="M12 3L7 12C5.5 14.5 6 18 9 19.5S15 19.5 17 17S16 9 12 3Z" {...p}/><line x1="12" y1="9" x2="12" y2="17" {...p} strokeWidth="0.9"/><line x1="9.2" y1="11" x2="14.8" y2="15" {...p} strokeWidth="0.9"/><line x1="14.8" y1="11" x2="9.2" y2="15" {...p} strokeWidth="0.9"/></svg>;
    case "hormones":   return <svg {...s}><circle cx="12" cy="4.5" r="2.5" {...p}/><circle cx="5.5" cy="17" r="2.5" {...p}/><circle cx="18.5" cy="17" r="2.5" {...p}/><path d="M11 6.8L7.2 14.6" {...p} strokeWidth="1.1"/><path d="M13 6.8L16.8 14.6" {...p} strokeWidth="1.1"/><path d="M8 17h8" {...p} strokeWidth="1.1"/></svg>;
    case "longevity":  return <svg {...s}><path d="M9 3Q12 6 9 9Q6 12 9 15Q12 18 9 21" {...p} strokeWidth="1.2"/><path d="M15 3Q12 6 15 9Q18 12 15 15Q12 18 15 21" {...p} strokeWidth="1.2"/><line x1="9" y1="6" x2="15" y2="6" {...p} strokeWidth="0.9"/><line x1="9" y1="12" x2="15" y2="12" {...p} strokeWidth="0.9"/><line x1="9" y1="18" x2="15" y2="18" {...p} strokeWidth="0.9"/></svg>;
    default: return null;
  }
}

// ─── CIRCULAR SCORE RING ──────────────────────────────────────────────────────
function CircularScore({ score, size = 130 }) {
  const r = 50, c = size / 2, circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(score, 100) / 100);
  const col = scoreColor(score);
  const scale = size / 120;
  return (
    <div style={{ position:"relative", width:size, height:size, flexShrink:0 }}>
      <svg width={size} height={size} viewBox="0 0 120 120" style={{ position:"absolute", transform:"rotate(-90deg)" }}>
        <circle cx="60" cy="60" r={r} fill="none" stroke="#F0F2F5" strokeWidth="9"/>
        <circle cx="60" cy="60" r={r} fill="none" stroke={col} strokeWidth="9"
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}/>
      </svg>
      <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
        <span style={{ fontFamily:serif, fontSize:Math.round(36 * scale), fontWeight:700, color:"#111827", lineHeight:1 }}>{score}</span>
        <span style={{ fontSize:Math.round(10 * scale), color:"#9CA3AF", fontFamily:sans, marginTop:2 }}>/ 100</span>
      </div>
    </div>
  );
}

// ─── SECTION LABEL ────────────────────────────────────────────────────────────
function SL({ children, first }) {
  return (
    <p style={{ fontSize:11, fontWeight:700, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:"0.1em", margin:`${first ? 0 : 28}px 0 10px 1px`, fontFamily:sans }}>
      {children}
    </p>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function Thrive({ profile }) {
  const [biohack,       setBiohack]       = useState(null);
  const [loading,       setLoading]       = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("");
  const [citOpen,       setCitOpen]       = useState(false);
  const [done,          setDone]          = useState(false);
  const [streak,        setStreak]        = useState(0);
  const [expandedProt,  setExpandedProt]  = useState(null);

  const cyclePhase = (profile?.sex==="female" && profile?.cycleRegularity!=="Absent") ? getCyclePhase(profile?.lastPeriod, profile?.cycleLength||28) : null;
  const weekTheme  = WEEKLY_THEMES[getWeekIndex()];

  // today's focus
  const dn = new Date();
  const dayOfYear = Math.floor((dn - new Date(dn.getFullYear(),0,0)) / 86400000);
  const todayDailyCat = DAILY_CATEGORIES[dayOfYear % DAILY_CATEGORIES.length];
  const focusKey   = FOCUS_CAT_MAP[todayDailyCat] || "sleep";
  const focusMeta  = FOCUS_META[focusKey];
  const focusScore = DAILY_SCORES[focusKey] || 70;
  const overall    = Math.round(
    DAILY_SCORES.sleep*0.25 + DAILY_SCORES.hydration*0.15 + DAILY_SCORES.movement*0.20 +
    DAILY_SCORES.nutrition*0.20 + DAILY_SCORES.breathwork*0.10 + DAILY_SCORES.cold*0.05 + DAILY_SCORES.sauna*0.05
  );

  useEffect(() => {
    const today = todayStr();
    try {
      const sd = localStorage.getItem("nora_biohack_streak");
      if (sd) { const { count, lastDate } = JSON.parse(sd); if (lastDate===today||lastDate===yesterday()) setStreak(count); }
      const td = localStorage.getItem("nora_daily_biohack");
      if (td) {
        const cached = JSON.parse(td);
        if (cached.date===today) {
          if ("studies" in (cached.practice||{})) { setBiohack(cached.practice); setDone(cached.done||false); return; }
          localStorage.removeItem("nora_daily_biohack");
        }
      }
    } catch {}
    generate([]);
  }, []);

  const generate = async (rejected=[]) => {
    setLoading(true); setCitOpen(false); setLoadingStatus("Searching research database…");
    let used = [];
    try { const u = localStorage.getItem("nora_biohack_used"); if (u) used=JSON.parse(u); } catch {}
    const avoid    = [...used.slice(-20), ...rejected];
    const goalsStr = (profile?.goals||[]).join(", ") || "general health";
    const cycleCtx = cyclePhase ? ` Cycle: ${cyclePhase.label}.` : "";
    const season   = getSeason();
    const todayCategory = DAILY_CATEGORIES[dayOfYear % DAILY_CATEGORIES.length];
    const queryList = CATEGORY_PUBMED[todayCategory] || [`${todayCategory} health`];
    let studies = [];
    for (const q of queryList) {
      const data = await fetchPubMed(q);
      if ((data?.studies?.length||0) > studies.length) studies = data.studies||[];
      if (studies.length >= 2) break;
    }
    const researchCtx = studies.length > 0
      ? `\n\nPeer-reviewed research:\n${studies.map((s,i)=>`${i+1}. "${s.title}" — ${s.journal}${s.year?`, ${s.year}`:""}`).join("\n")}`
      : "\n\nNo PubMed studies retrieved. Use training knowledge carefully.";
    setLoadingStatus("Generating your tip…");
    let practice = null;
    try {
      const raw = await callClaude(
        `You are a precision wellness expert following Huberman/Attia/Patrick protocols. Return ONLY valid JSON.

SAFETY RULES:
- Morning light: 6–9 AM only. Never recommend unprotected outdoor eye exposure after 9 AM.
- Cold exposure: always note never practise alone in open water.
- Fasting: note contraindicated in pregnancy and eating disorder history.
- Supplements: never give a dose without "consult your doctor first".`,
        `Generate ONE specific wellness practice for today.
User: goals=${goalsStr}, season=${season}.${cycleCtx}
Today's focus: ${todayCategory}. Week: ${weekTheme}.
Avoid (recently used): ${avoid.join(", ")||"none"}.${researchCtx}
Rules: doable TODAY · precise timing · mechanism from research · all safety rules obeyed.
Return ONLY: {"name":"Practice Name","action":"Precise protocol with timing, duration, and any safety note.","why":"One sentence — specific mechanism from the research."}`
      );
      const parsed = tryParseJSON(raw);
      if (parsed?.name && parsed?.action && parsed?.why) practice = { ...parsed, citations:studies.length, studies };
    } catch {}
    if (!practice) practice = { ...fallbackPractice(avoid), citations:studies.length, studies };
    setBiohack(practice); setDone(false); setLoadingStatus("");
    try {
      localStorage.setItem("nora_daily_biohack", JSON.stringify({ date:todayStr(), practice, done:false, rejected }));
      localStorage.setItem("nora_biohack_used", JSON.stringify([...used, practice.name].slice(-30)));
    } catch {}
    setLoading(false);
  };

  const markDone = () => {
    setDone(true);
    const today=todayStr(), yest=yesterday();
    let newCount=1;
    try { const sd=localStorage.getItem("nora_biohack_streak"); if(sd){const{count,lastDate}=JSON.parse(sd); if(lastDate===yest)newCount=count+1; else if(lastDate===today)newCount=count;} } catch {}
    setStreak(newCount);
    try {
      localStorage.setItem("nora_biohack_streak", JSON.stringify({ count:newCount, lastDate:todayStr() }));
      const td=localStorage.getItem("nora_daily_biohack");
      if(td) localStorage.setItem("nora_daily_biohack", JSON.stringify({ ...JSON.parse(td), done:true }));
    } catch {}
  };

  const notForMe = async () => {
    let rejected=[];
    try { const td=localStorage.getItem("nora_daily_biohack"); if(td) rejected=JSON.parse(td).rejected||[]; } catch {}
    if (biohack) rejected=[...rejected, biohack.name];
    setBiohack(null);
    await generate(rejected);
  };

  const shadow  = "0 1px 4px rgba(0,0,0,0.04), 0 4px 20px rgba(0,0,0,0.07)";
  const radius  = 20;

  return (
    <div style={{ backgroundColor:"#F4F6F8", minHeight:"100vh", paddingBottom:100 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* ── Header */}
      <div style={{ background:"linear-gradient(160deg,#1A3028 0%,#2D4A3E 100%)", padding:"24px 20px 20px" }}>
        <h2 style={{ fontFamily:serif, fontSize:22, color:"#F5F0E8", fontWeight:700, margin:"0 0 3px", letterSpacing:"-0.02em" }}>Thrive</h2>
        <p style={{ fontSize:12, color:"rgba(245,240,232,0.5)", margin:0, fontFamily:sans }}>Biohacking · science-backed performance</p>
      </div>

      <div style={{ padding:"20px 16px 0" }}>

        {/* ══ 1. TODAY'S FOCUS ══════════════════════════════════════════════ */}
        <SL first>Today's Focus</SL>
        <div style={{ background:"linear-gradient(145deg,#1A3028 0%,#2D4A3E 55%,#1E3A2F 100%)", borderRadius:radius, boxShadow:"0 4px 24px rgba(45,74,62,0.28)", marginBottom:0, overflow:"hidden" }}>
          <div style={{ padding:"22px 22px 20px" }}>
            {/* Category row */}
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
              <span style={{ fontSize:28, lineHeight:1 }}>{focusMeta.emoji}</span>
              <p style={{ fontFamily:serif, fontSize:22, fontWeight:700, color:"#FFFFFF", margin:0, letterSpacing:"-0.02em" }}>{focusMeta.title}</p>
              <span style={{ marginLeft:"auto", fontSize:10, fontWeight:700, color:"rgba(255,255,255,0.4)", fontFamily:sans, letterSpacing:"0.1em", textTransform:"uppercase", background:"rgba(255,255,255,0.1)", padding:"3px 8px", borderRadius:20 }}>
                {weekTheme}
              </span>
            </div>
            {/* Insight */}
            <p style={{ fontSize:13, color:"rgba(255,255,255,0.72)", lineHeight:1.75, margin:"0 0 20px", fontFamily:sans }}>
              {focusMeta.insight}
            </p>
            {/* Score row */}
            <div style={{ marginBottom:18 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:7 }}>
                <span style={{ fontSize:11, color:"rgba(255,255,255,0.45)", fontFamily:sans, letterSpacing:"0.06em", textTransform:"uppercase" }}>Today's Score</span>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <span style={{ fontSize:18, fontWeight:700, color:"#C9A96E", fontFamily:serif, lineHeight:1 }}>{focusScore}</span>
                  <span style={{ fontSize:11, color:"rgba(255,255,255,0.45)", fontFamily:sans }}>· {scoreLabel(focusScore)}</span>
                </div>
              </div>
              <div style={{ height:4, backgroundColor:"rgba(255,255,255,0.12)", borderRadius:2, overflow:"hidden" }}>
                <div style={{ height:4, width:`${focusScore}%`, background:"linear-gradient(90deg,#C9A96E,#E2C07A)", borderRadius:2 }}/>
              </div>
            </div>
            {/* CTA */}
            <button
              onClick={() => { setExpandedProt(focusKey); const el=document.getElementById("thrive-protocols"); if(el) el.scrollIntoView({behavior:"smooth"}); }}
              style={{ width:"100%", padding:"14px 0", background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.22)", borderRadius:14, color:"#FFFFFF", fontSize:14, fontWeight:500, fontFamily:serif, cursor:"pointer", letterSpacing:"0.02em" }}
            >
              Explore Protocol →
            </button>
          </div>
        </div>

        {/* ══ 2. BIOHACKING SCORE ══════════════════════════════════════════ */}
        <SL>Biohacking Score</SL>
        <div style={{ backgroundColor:"#FFFFFF", borderRadius:radius, boxShadow:shadow, padding:"24px 22px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:22 }}>
            <CircularScore score={overall} size={120}/>
            <div style={{ flex:1 }}>
              <p style={{ fontFamily:serif, fontSize:24, fontWeight:700, color:"#111827", margin:"0 0 4px", lineHeight:1, letterSpacing:"-0.02em" }}>
                {scoreLabel(overall)}
              </p>
              <p style={{ fontSize:12, color:"#6B7280", margin:"0 0 14px", lineHeight:1.6, fontFamily:sans }}>
                Calculated from sleep, hydration, nutrition, movement, and recovery habits.
              </p>
              <div style={{ display:"inline-flex", alignItems:"center", gap:6, backgroundColor: scoreColor(overall)+"18", borderRadius:20, padding:"5px 12px" }}>
                <div style={{ width:7, height:7, borderRadius:"50%", backgroundColor:scoreColor(overall), flexShrink:0 }}/>
                <span style={{ fontSize:12, fontWeight:600, color:scoreColor(overall), fontFamily:sans }}>{overall} / 100</span>
              </div>
            </div>
          </div>
        </div>

        {/* ══ 3. CATEGORY SCORES ═══════════════════════════════════════════ */}
        <SL>Categories</SL>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:8 }}>
          {SCORE_CATS.map((cat, i) => {
            const s = DAILY_SCORES[cat.id] || 60;
            const isLast = i === SCORE_CATS.length - 1;
            return (
              <div key={cat.id} style={{ gridColumn: isLast ? "span 3" : "span 1", backgroundColor:"#FFFFFF", borderRadius:14, boxShadow:shadow, padding: isLast ? "14px 18px" : "14px 11px", display:"flex", flexDirection: isLast ? "row" : "column", alignItems: isLast ? "center" : "flex-start", gap: isLast ? 14 : 0 }}>
                {isLast ? (
                  <>
                    <span style={{ fontSize:22 }}>{cat.emoji}</span>
                    <div style={{ flex:1 }}>
                      <p style={{ fontSize:12, fontWeight:600, color:"#374151", margin:"0 0 5px", fontFamily:sans }}>{cat.label}</p>
                      <div style={{ height:3, backgroundColor:"#F3F4F6", borderRadius:2 }}>
                        <div style={{ height:3, width:`${s}%`, backgroundColor:scoreColor(s), borderRadius:2 }}/>
                      </div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <p style={{ fontSize:20, fontWeight:700, color:"#111827", margin:0, fontFamily:serif, lineHeight:1 }}>{s}</p>
                      <p style={{ fontSize:9, color:"#9CA3AF", margin:"2px 0 0", fontFamily:sans, textTransform:"uppercase", letterSpacing:"0.04em" }}>{scoreLabel(s)}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <span style={{ fontSize:18, marginBottom:8 }}>{cat.emoji}</span>
                    <p style={{ fontSize:19, fontWeight:700, color:"#111827", margin:"0 0 2px", fontFamily:serif, lineHeight:1 }}>{s}</p>
                    <p style={{ fontSize:9, color:"#9CA3AF", margin:"0 0 8px", fontFamily:sans, textTransform:"uppercase", letterSpacing:"0.03em", lineHeight:1.2 }}>{cat.label}</p>
                    <div style={{ width:"100%", height:3, backgroundColor:"#F3F4F6", borderRadius:2 }}>
                      <div style={{ height:3, width:`${s}%`, backgroundColor:scoreColor(s), borderRadius:2 }}/>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* ══ 4. PROTOCOLS ═════════════════════════════════════════════════ */}
        <div id="thrive-protocols">
          <SL>Protocols</SL>
          <ProtocolsAccordion expanded={expandedProt} onToggle={setExpandedProt}/>
        </div>

        {/* ══ 5. TIP OF THE DAY ════════════════════════════════════════════ */}
        <SL>Tip of the Day</SL>
        <div style={{ backgroundColor:"#FFFFFF", borderRadius:radius, boxShadow:shadow, overflow:"hidden", marginBottom:0 }}>
          {/* Label row */}
          <div style={{ padding:"16px 20px 13px", display:"flex", justifyContent:"space-between", alignItems:"center", borderBottom:"1px solid #F3F4F6" }}>
            <span style={{ fontSize:10, fontWeight:700, color:"#C9A96E", textTransform:"uppercase", letterSpacing:"0.12em", fontFamily:sans }}>AI-Generated · PubMed-Grounded</span>
            {streak > 0 && <span style={{ fontSize:12, color:"#6B7280", fontFamily:sans }}>{streak}-day streak</span>}
          </div>

          {loading ? (
            <div style={{ padding:"22px 20px 24px" }}>
              {[62, 100, 90, 76].map((w, i) => (
                <div key={i} style={{ height: i===0 ? 24 : 13, width:`${w}%`, backgroundColor:"#F3F4F6", borderRadius:6, marginBottom: i===0 ? 18 : 9 }}/>
              ))}
              <div style={{ height:44, backgroundColor:"#F3F4F6", borderRadius:12, marginTop:10 }}/>
              {loadingStatus && <p style={{ fontSize:11, color:"#9CA3AF", margin:"14px 0 0", textAlign:"center", fontFamily:sans, fontStyle:"italic" }}>{loadingStatus}</p>}
            </div>
          ) : biohack ? (
            <div style={{ padding:"20px 20px 22px", animation:"fadeIn 0.35s ease" }}>
              <p style={{ fontFamily:serif, fontSize:22, fontWeight:700, color:"#111827", margin:"0 0 12px", lineHeight:1.2, letterSpacing:"-0.02em" }}>
                {biohack.name}
              </p>
              <p style={{ fontSize:14, color:"#374151", lineHeight:1.85, margin:"0 0 14px", fontFamily:sans }}>
                {biohack.action}
              </p>
              <div style={{ borderLeft:"2px solid #C9A96E", paddingLeft:14, margin:"0 0 16px" }}>
                <p style={{ fontSize:13, color:"#6B7280", lineHeight:1.75, margin:0, fontStyle:"italic", fontFamily:serif }}>
                  {biohack.why}
                </p>
              </div>

              {"studies" in (biohack||{}) && (
                <div style={{ margin:"0 0 20px" }}>
                  {biohack.studies.length > 0 ? (
                    <>
                      <button onClick={() => setCitOpen(o=>!o)} style={{ display:"flex", alignItems:"center", gap:6, background:"none", border:"none", padding:0, cursor:"pointer" }}>
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ flexShrink:0 }}>
                          <rect x="1.5" y="2" width="10" height="9" rx="1.5" stroke="#9CA3AF" strokeWidth="1.1"/>
                          <path d="M3.5 5.5h6M3.5 7.5h4" stroke="#9CA3AF" strokeWidth="1" strokeLinecap="round"/>
                        </svg>
                        <span style={{ fontSize:11, color:"#9CA3AF", fontFamily:sans }}>
                          Based on {biohack.citations} peer-reviewed {biohack.citations===1?"study":"studies"}
                        </span>
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ transition:"transform 0.18s", transform:citOpen?"rotate(180deg)":"none" }}>
                          <path d="M2 3.5l3 3 3-3" stroke="#9CA3AF" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      {citOpen && (
                        <div style={{ marginTop:10, padding:"13px 14px", backgroundColor:"#F9FAFB", borderRadius:10, border:"1px solid #F3F4F6" }}>
                          {biohack.studies.map((s,i) => (
                            <p key={s.id||i} style={{ fontSize:11, color:"#374151", margin:i<biohack.studies.length-1?"0 0 8px":0, lineHeight:1.55, fontFamily:sans }}>
                              {i+1}. {s.title}
                              <span style={{ color:"#9CA3AF" }}> — <em>{s.journal}</em>{s.year?`, ${s.year}`:""}</span>
                            </p>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <p style={{ fontSize:11, color:"#C9A96E", margin:0, fontStyle:"italic", fontFamily:serif, letterSpacing:"0.02em" }}>
                      ✦ Based on established clinical research · Always consult your healthcare provider
                    </p>
                  )}
                </div>
              )}

              {done ? (
                <div style={{ padding:"15px 18px", backgroundColor:"#F0FFF8", borderRadius:13, border:"1px solid #C6F6E5", textAlign:"center" }}>
                  <p style={{ fontSize:14, fontWeight:600, color:"#065F46", margin:"0 0 2px", fontFamily:serif }}>✓ Practice complete</p>
                  <p style={{ fontSize:11, color:"#6B7280", margin:0, fontFamily:sans }}>{streak>1?`${streak}-day streak — keep going`:"Great start — come back tomorrow"}</p>
                </div>
              ) : (
                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={markDone} style={{ flex:3, padding:"14px 0", backgroundColor:"#2D4A3E", color:"#FFFFFF", border:"none", borderRadius:13, fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:serif }}>Done ✓</button>
                  <button onClick={notForMe} style={{ flex:4, padding:"14px 0", backgroundColor:"transparent", color:"#9CA3AF", border:"1px solid #E5E7EB", borderRadius:13, fontSize:11, cursor:"pointer", fontFamily:sans, lineHeight:1.4 }}>Not for me → alternative</button>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* ══ READING LIST ════════════════════════════════════════════════ */}
        <SL>Reading List</SL>
        <ReadingList/>

      </div>
    </div>
  );
}

// ─── PROTOCOLS ACCORDION ─────────────────────────────────────────────────────
function ProtocolsAccordion({ expanded, onToggle }) {
  const shadow = "0 1px 4px rgba(0,0,0,0.04), 0 4px 20px rgba(0,0,0,0.07)";
  return (
    <div style={{ backgroundColor:"#FFFFFF", borderRadius:20, boxShadow:shadow, overflow:"hidden" }}>
      {EXPLORE_CATEGORIES.map((c, i) => {
        const isOpen = c.id === expanded;
        const isLast = i === EXPLORE_CATEGORIES.length - 1;
        return (
          <div key={c.id}>
            <button
              onClick={() => onToggle(isOpen ? null : c.id)}
              style={{ width:"100%", display:"flex", alignItems:"center", gap:13, padding:"15px 18px", background:"none", border:"none", cursor:"pointer", textAlign:"left", borderBottom: isLast && !isOpen ? "none" : "1px solid #F3F4F6" }}
            >
              <div style={{ width:36, height:36, borderRadius:10, backgroundColor: isOpen ? "#EEF3EF" : "#F9FAFB", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"background 0.15s" }}>
                <CategoryIcon id={c.id} size={19} color={isOpen ? "#2D4A3E" : "#6B7280"}/>
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontFamily:serif, fontSize:15, fontWeight:600, color: isOpen ? "#111827" : "#374151", margin:"0 0 2px", lineHeight:1.2 }}>{c.title}</p>
                <p style={{ fontSize:12, color:"#9CA3AF", margin:0, fontFamily:sans, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{c.subtitle}</p>
              </div>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink:0, transition:"transform 0.2s", transform:isOpen?"rotate(180deg)":"none" }}>
                <path d="M4 6l4 4 4-4" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {isOpen && (
              <div style={{ padding:"0 18px 18px", borderBottom: isLast ? "none" : "1px solid #F3F4F6", animation:"fadeIn 0.18s ease" }}>
                <p style={{ fontSize:13, color:"#4B5563", lineHeight:1.85, margin:"0 0 13px", fontFamily:sans }}>
                  {c.guide}
                </p>
                <div style={{ padding:"11px 14px", backgroundColor:"#F0F7F3", borderRadius:12, borderLeft:"2px solid #2D4A3E" }}>
                  <p style={{ fontSize:10, fontWeight:700, color:"#2D4A3E", textTransform:"uppercase", letterSpacing:"0.1em", margin:"0 0 4px", fontFamily:sans }}>Protocol</p>
                  <p style={{ fontSize:12, color:"#6B7280", margin:0, lineHeight:1.7, fontFamily:sans }}>{c.protocol}</p>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── READING LIST ─────────────────────────────────────────────────────────────
function ReadingList() {
  const shadow = "0 1px 4px rgba(0,0,0,0.04), 0 4px 20px rgba(0,0,0,0.07)";
  return (
    <div style={{ marginBottom:20 }}>
      {BOOK_GROUPS.map(group => (
        <div key={group.category} style={{ marginBottom:20 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, margin:"0 0 9px 1px" }}>
            <span style={{ fontSize:10, fontWeight:700, color:"#6B7280", textTransform:"uppercase", letterSpacing:"0.1em", fontFamily:sans, whiteSpace:"nowrap" }}>{group.category}</span>
            <div style={{ flex:1, height:1, backgroundColor:"#E5E7EB" }}/>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            {group.books.map(book => (
              <div key={book.id} style={{ gridColumn:book.colSpan===2?"span 2":"span 1", backgroundColor:"#FFFFFF", borderRadius:14, boxShadow:shadow, border:`1px solid ${book.colSpan===2?"rgba(201,169,110,0.3)":"#F3F4F6"}`, padding:book.colSpan===2?"15px 17px":"13px 13px", display:"flex", flexDirection:"column", gap:5 }}>
                <span style={{ display:"inline-block", fontSize:9, fontWeight:700, color:"#2D4A3E", textTransform:"uppercase", letterSpacing:"0.08em", backgroundColor:"#EEF3EF", borderRadius:4, padding:"2px 6px", alignSelf:"flex-start", fontFamily:sans }}>
                  {group.category}
                </span>
                <p style={{ fontFamily:serif, fontSize:book.colSpan===2?15:13, fontWeight:700, color:"#111827", margin:0, lineHeight:1.25 }}>{book.title}</p>
                <p style={{ fontSize:11, color:"#9CA3AF", margin:0, fontStyle:"italic", fontFamily:serif }}>{book.author}</p>
                <p style={{ fontSize:11, color:"#6B7280", margin:0, lineHeight:1.55, fontFamily:sans }}>{book.desc}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
