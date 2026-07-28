import { useState, useEffect } from "react";
import Image from "next/image";
import { C, card, serif, sans, localDateStr, getCyclePhase, getCycleTip, getMaleTip, getWeekKey } from "../noraTokens";
import { SectionHeader, Collapsible } from "../NoraUI";
import { BotanicalBranch } from "../NoraIcons";

// ─── JOURNEY DATA ────────────────────────────────────────────────────────────
const MOTIVATIONAL = [
  "Every day you log is a vote for the person you're becoming.",
  "Progress is built one choice at a time — you're making them.",
  "Consistency is the compound interest of health.",
  "Small daily improvements lead to stunning long-term results.",
  "You're not starting over — you're building on everything you know.",
  "Nourishing yourself is an act of self-respect.",
  "The body achieves what the mind believes.",
];

const CYCLE_NUTRITION = {
  menstrual:  { foods:["Iron-rich foods — lentils, red meat, spinach","Herbal teas to ease cramping","Anti-inflammatory turmeric & ginger"], avoid:"Caffeine and alcohol, which worsen cramping and fatigue." },
  follicular: { foods:["Fermented foods — yoghurt, kefir, kimchi","Complex carbs for rising energy — oats, quinoa","Zinc for hormonal support — pumpkin seeds, chickpeas"], avoid:"Heavy or processed foods that may slow your rising energy." },
  ovulatory:  { foods:["Zinc-rich seeds — hemp, pumpkin","Salmon or sardines for anti-inflammation","Fibre-rich vegetables to support oestrogen clearance"], avoid:"Excess sugar and alcohol during this sensitive window." },
  luteal:     { foods:["Magnesium foods — dark chocolate, almonds, leafy greens","Vitamin B6 — bananas, poultry, avocado","Complex carbs to balance serotonin — sweet potato, brown rice"], avoid:"Salt and processed foods that worsen bloating and mood shifts." },
};

// ─── THRIVE DATA ─────────────────────────────────────────────────────────────
const CATEGORY_PUBMED = {
  "sleep optimization": ["sleep quality health","sleep duration outcomes","sleep intervention humans"],
  "afternoon energy":   ["afternoon fatigue alertness","post-lunch energy performance","circadian afternoon productivity"],
  "evening wind-down":  ["evening relaxation sleep onset","pre-sleep routine health","sleep hygiene intervention"],
  "workout recovery":   ["exercise recovery performance","post-exercise muscle recovery","sport recovery health"],
  "stress management":  ["stress reduction health","cortisol reduction intervention","psychological stress management"],
  "gut health":         ["gut microbiome health","probiotic gut health","intestinal microbiota diet"],
  "breathwork":         ["breathing exercise health","controlled breathing stress","respiratory exercise benefits"],
  "cold exposure":      ["cold water immersion health","cold exposure benefits humans","cold therapy health"],
  "fasting":            ["intermittent fasting health","time restricted eating","caloric restriction humans"],
  "supplement timing":  ["supplement timing health","micronutrient timing","vitamin mineral health outcomes"],
  "mindfulness":        ["mindfulness meditation health","meditation stress wellbeing","mindfulness intervention"],
  "hydration":          ["hydration performance health","water intake health","electrolyte hydration exercise"],
};

// ─── CHALLENGE POOLS ─────────────────────────────────────────────────────────
const CHALLENGE_HISTORY_KEY  = "nora_challenge_history";
const SAVED_CHALLENGES_KEY   = "nora_saved_challenges";

const CHALLENGE_TARGET_DAYS = {
  supplements: 30, sleep: 30, light: 30, nutrition: 21,
  fasting: 21, cold: 14, breathwork: 14, sauna: 14,
  movement: 14, mindfulness: 14, stress: 14, hydration: 14,
};
const getChallengeTargetDays = c => {
  if (c.recommendedDays) return c.recommendedDays;
  const t = (c.title || "").toLowerCase();
  if (t.includes("magnesium") || t.includes("vitamin") || t.includes("omega")) return 30;
  if (t.includes("sunlight") || t.includes("light") || t.includes("circadian")) return 30;
  if (t.includes("fast") || t.includes("16:8") || t.includes("14:10")) return 21;
  if (t.includes("cold") || t.includes("ice")) return 14;
  if (t.includes("breath")) return 14;
  return CHALLENGE_TARGET_DAYS[c.category] || 14;
};

const CHALLENGES_GENERAL = [
  { id:"g01", title:"4-7-8 Breathing Reset", category:"breathwork", difficulty:"Beginner", duration:"8 min", instruction:"Sit upright. Inhale through nose for 4 counts, hold for 7, exhale through mouth for 8. Complete 4 rounds before breakfast. Never practise cyclic hyperventilation near water.", science:"The 8-count exhale activates the vagus nerve, shifting the autonomic nervous system toward parasympathetic dominance within 60 seconds of starting.", pubmedQ:"breathing exercise stress reduction", pubmedFbs:["controlled breathing parasympathetic","4-7-8 breathing health"] },
  { id:"g02", title:"Cold Shower Finish", category:"cold", difficulty:"Beginner", duration:"3 min", instruction:"End your normal shower with 30 seconds of cold water. Breathe steadily through it. Add 10 seconds each session until you reach 90 seconds. Never practise cold immersion alone or in open water.", science:"Cold water triggers a 200-300% norepinephrine spike and sustained dopamine elevation lasting 2-4 hours - longer than most pre-workout supplements.", pubmedQ:"cold water immersion health", pubmedFbs:["cold shower norepinephrine","cold exposure dopamine"] },
  { id:"g03", title:"Sunrise Light Anchor", category:"light", difficulty:"Beginner", duration:"10 min", instruction:"Within 20 minutes of waking, step outside without sunglasses for 10 minutes. No phone. Eyes toward the sky, not directly at the sun. Works on overcast days - outdoor lux is 10-50× brighter than indoors.", science:"Morning photons activate retinal melanopsin cells that signal the suprachiasmatic nucleus, anchoring cortisol rhythm and building that evening's melatonin reserve.", pubmedQ:"morning light circadian rhythm", pubmedFbs:["morning sunlight cortisol","light exposure sleep quality"] },
  { id:"g04", title:"Box Breathing Protocol", category:"breathwork", difficulty:"Beginner", duration:"5 min", instruction:"Inhale 4 counts, hold 4, exhale 4, hold 4. Repeat 6 rounds. Use before any stressful event or as a midday reset at 2-3 PM when energy dips.", science:"Equal-phase breathing activates the parasympathetic nervous system via baroreflex stimulation, reducing cortisol within a single 4-minute session.", pubmedQ:"box breathing parasympathetic", pubmedFbs:["controlled breathing cortisol","breathwork stress"] },
  { id:"g05", title:"14:10 Fasting Window", category:"fasting", difficulty:"Beginner", duration:"All day", instruction:"Eat your first meal at 9 AM and finish by 7 PM. During the fast: water, black coffee, plain herbal tea only. Break your fast with protein, not carbohydrates. Contraindicated in pregnancy and eating disorder history.", science:"14-hour fasting initiates autophagy and aligns food intake with the cortisol peak, measurably improving insulin sensitivity within 2 weeks.", pubmedQ:"intermittent fasting health", pubmedFbs:["time restricted eating insulin","14:10 fasting outcomes"] },
  { id:"g06", title:"Morning Electrolyte Hydration", category:"hydration", difficulty:"Beginner", duration:"2 min", instruction:"Before coffee or food, drink 500ml of water with a pinch of sea salt and a squeeze of lemon. Have the glass ready on your nightstand the night before.", science:"After 7-9 hours without fluid, cells are sodium-depleted. Plain water dilutes intracellular electrolytes; salt enables water to cross cell membranes via sodium-potassium pumps.", pubmedQ:"water intake health morning", pubmedFbs:["hydration electrolytes cells","morning hydration performance"] },
  { id:"g07", title:"20-Minute Nature Walk", category:"stress", difficulty:"Beginner", duration:"20 min", instruction:"Walk in a natural setting - park, woodland, or waterside. Slow pace. No phone, no headphones. Look at trees, water, and the middle distance. This is a reset, not a workout.", science:"Twenty minutes in nature measurably lowers cortisol, blood pressure, and inflammatory markers without any active effort - the Shinrin-yoku effect replicated across dozens of controlled trials.", pubmedQ:"nature walk stress cortisol", pubmedFbs:["shinrin-yoku health","forest bathing cortisol"] },
  { id:"g09", title:"Wim Hof Breathing", category:"breathwork", difficulty:"Intermediate", duration:"15 min", instruction:"Lie down on a bed or floor - NEVER near water. Take 30 deep full breaths in through nose, out through mouth. After the 30th exhale, hold on empty as long as comfortable. Inhale fully, hold 15 sec. Repeat 3 rounds.", science:"Cyclic hyperventilation floods the brain with oxygen and triggers adrenaline release, enabling voluntary immune activation documented in Radboud University trials.", pubmedQ:"Wim Hof breathing method", pubmedFbs:["cyclic hyperventilation immune","breathwork adrenaline"] },
  { id:"g10", title:"Magnesium Before Bed", category:"supplements", difficulty:"Beginner", duration:"2 min", instruction:"Take 300-400mg of magnesium glycinate 30 minutes before bed tonight. Use glycinate form - oxide does not effectively cross the blood-brain barrier. Consult your doctor before starting.", science:"Magnesium activates GABA receptors in the brain, reducing neuronal excitability and measurably increasing slow-wave sleep depth in double-blind trials.", pubmedQ:"magnesium sleep quality", pubmedFbs:["magnesium glycinate GABA sleep","magnesium supplement insomnia"] },
  { id:"g11", title:"Zone 2 Cardio Session", category:"movement", difficulty:"Intermediate", duration:"30 min", instruction:"Walk briskly, jog, cycle, or row at a pace where you can speak in full sentences but find it slightly uncomfortable to sing. Maintain for 30 continuous minutes. Heart rate ~60-70% of max.", science:"Zone 2 intensity maximises mitochondrial biogenesis and fat oxidation - the primary adaptations linked to reduced all-cause mortality in longitudinal data.", pubmedQ:"Zone 2 cardio mitochondria", pubmedFbs:["low intensity cardio fat oxidation","aerobic exercise mitochondria"] },
  { id:"g12", title:"Digital Sunset at 9 PM", category:"light", difficulty:"Beginner", duration:"All evening", instruction:"At 9 PM, switch all screens to night mode or wear amber-tinted glasses. At 10 PM, put all screens away. Replace with reading, conversation, or gentle stretching.", science:"Even 10 lux of blue-enriched light after dark suppresses melatonin by 50%. Eliminating blue light 90 minutes before bed advances sleep onset by an average of 24 minutes.", pubmedQ:"blue light sleep melatonin", pubmedFbs:["screen exposure sleep onset","evening light melatonin"] },
  { id:"g13", title:"Specific Gratitude Journal", category:"mindfulness", difficulty:"Beginner", duration:"5 min", instruction:"Tonight before sleep, write three specific things you're grateful for. Not general ('family') but specific ('my colleague covered for me today'). Specificity activates reward circuitry in a way general statements do not.", science:"Writing specific gratitude activates the medial prefrontal cortex and ventral striatum - the same reward pathways targeted by clinical antidepressants - within minutes of writing.", pubmedQ:"gratitude journaling mental health", pubmedFbs:["gratitude intervention wellbeing","positive psychology writing"] },
  { id:"g14", title:"Compound Strength Session", category:"movement", difficulty:"Intermediate", duration:"40 min", instruction:"3 sets each: goblet squat, Romanian deadlift, push-ups, bent-over row. 8-12 reps, 90-second rest between sets. Controlled tempo - 2 seconds down, pause, 1 second up.", science:"Compound multi-joint movements elevate testosterone and growth hormone for 15-30 minutes post-session and stimulate muscle protein synthesis for 24-48 hours.", pubmedQ:"resistance training testosterone", pubmedFbs:["compound exercise hormones","strength training muscle"] },
  { id:"g15", title:"Sauna Protocol", category:"sauna", difficulty:"Intermediate", duration:"25 min", instruction:"20 minutes at 80-100°C. Finish with a cool rinse. Drink 500ml electrolyte water before entering. Avoid if pregnant or have cardiovascular conditions - consult your doctor.", science:"Sauna activates heat shock proteins that repair misfolded cellular proteins. Three to four sessions weekly correlate with 40% lower all-cause mortality in 20-year Finnish follow-up data.", pubmedQ:"sauna health benefits longevity", pubmedFbs:["heat therapy cardiovascular","sauna mortality Finland"] },
  { id:"g16", title:"10-Minute Body Scan", category:"mindfulness", difficulty:"Beginner", duration:"10 min", instruction:"Lie flat or sit comfortably. Close eyes. Starting from the top of your head, slowly bring attention to each body part downward to your toes. Spend 5-10 seconds on each area. No judgement, no fixing.", science:"Body scan meditation activates the insula and reduces default mode network activity, measurably lowering anxiety scores in 8-week MBSR trials.", pubmedQ:"body scan meditation anxiety", pubmedFbs:["mindfulness body scan MBSR","meditation insula"] },
  { id:"g17", title:"Synbiotic Breakfast", category:"nutrition", difficulty:"Beginner", duration:"15 min", instruction:"Eat one fermented food - yogurt, kefir, kimchi, sauerkraut, or kombucha - paired with a prebiotic fibre source: oats, garlic, leeks, green banana, or asparagus. Do this before any other food.", science:"Combining live cultures with prebiotic fibre creates a synbiotic effect, measurably increasing microbiome diversity after 2 weeks of daily intake.", pubmedQ:"fermented food probiotics gut", pubmedFbs:["synbiotic prebiotic microbiome","fermented food health"] },
  { id:"g18", title:"10 Minutes Barefoot Grounding", category:"stress", difficulty:"Beginner", duration:"10 min", instruction:"Step outside barefoot onto grass, soil, or sand for 10 minutes. Stand or walk slowly. No phone. Notice texture and temperature underfoot. Morning or evening works equally well.", science:"Direct skin-earth contact normalises cortisol circadian rhythm and reduces inflammatory markers in controlled trials - proposed mechanism is free-electron transfer from earth's surface.", pubmedQ:"earthing grounding health", pubmedFbs:["barefoot grounding inflammation","earthing cortisol"] },
  { id:"g19", title:"Cold Face Immersion", category:"cold", difficulty:"Beginner", duration:"3 min", instruction:"Fill a bowl with cold water and a handful of ice. Hold face submerged for 15-30 seconds. Lift. Breathe. Repeat twice. Ideal at noon as a midday cognitive reset.", science:"Cold water on the face triggers the dive reflex - immediate heart rate reduction of 10-25% - activating the parasympathetic nervous system faster than any breathing technique.", pubmedQ:"face cold immersion dive reflex", pubmedFbs:["cold water face parasympathetic","trigeminocardiac reflex"] },
  { id:"g20", title:"No-Phone First Hour", category:"mindfulness", difficulty:"Beginner", duration:"60 min", instruction:"Tonight, set tomorrow's alarm on a separate device. When you wake, do not touch your phone for 60 minutes. Drink water, get morning light, eat, stretch - all before checking messages.", science:"Checking a phone within the first hour spikes cortisol before the natural morning peak resolves, disrupting the adrenal arc that governs energy and immune function all day.", pubmedQ:"morning phone use cortisol stress", pubmedFbs:["smartphone stress hormones","digital media cortisol"] },
  { id:"g21", title:"Protein-First Lunch", category:"nutrition", difficulty:"Beginner", duration:"30 min", instruction:"At lunch, eat your protein source first - chicken, fish, eggs, legumes, or tofu - before any carbohydrates. Aim for 30-40g of protein. Put utensils down between bites.", science:"Protein consumed before carbohydrates blunts postprandial glucose spikes by 28-37% via incretin hormone stimulation, reducing afternoon energy crashes.", pubmedQ:"protein first meal glucose insulin", pubmedFbs:["protein carbohydrate order blood sugar","incretin protein"] },
  { id:"g22", title:"Foam Roll & Mobility Flow", category:"movement", difficulty:"Beginner", duration:"15 min", instruction:"Spend 2 minutes foam rolling each: thoracic spine, hips/glutes, hamstrings. Then 5 minutes of world's greatest stretch, hip 90/90 sit, and shoulder circles. Do before exercise or as an evening wind-down.", science:"Myofascial release reduces delayed onset muscle soreness by 30% and improves range of motion through viscoelastic changes in fascia - effects peak 24-48 hours post-session.", pubmedQ:"foam rolling flexibility mobility", pubmedFbs:["myofascial release performance","foam rolling recovery"] },
  { id:"g23", title:"Afternoon NSDR Reset", category:"stress", difficulty:"Beginner", duration:"20 min", instruction:"At 1-3 PM, lie flat with eyes closed and listen to a Non-Sleep Deep Rest or yoga nidra protocol. 20 minutes minimum. Set an alarm. Do not attempt to sleep.", science:"NSDR restores dopamine in the striatum by 65% and replenishes cognitive capacity equivalent to correcting partial sleep deprivation - validated by Stanford neuroplasticity research.", pubmedQ:"yoga nidra brain recovery", pubmedFbs:["NSDR restoration","yoga nidra dopamine"] },
  { id:"g24", title:"16:8 Fasting Window", category:"fasting", difficulty:"Intermediate", duration:"All day", instruction:"Eat only between 12 PM and 8 PM today. Break your fast with a protein-rich meal - not juice or fruit alone. Water, black coffee, plain herbal tea before noon. Contraindicated in pregnancy and eating disorder history.", science:"16 hours fasting reliably triggers autophagy and activates AMPK - the cellular energy sensor linked to mitochondrial biogenesis and metabolic flexibility.", pubmedQ:"16:8 intermittent fasting metabolism", pubmedFbs:["16 hour fast autophagy","AMPK fasting activation"] },
  { id:"g25", title:"Sleep Temperature Optimisation", category:"sleep", difficulty:"Beginner", duration:"All night", instruction:"Set bedroom to 16-19°C tonight. Wear light clothing or nothing. If you can't control room temperature, keep feet outside the covers - the hands and feet are the body's primary heat-loss surfaces.", science:"Core body temperature must drop 1-3°C to initiate and maintain deep sleep. Even a 2°C room temperature reduction increases slow-wave sleep by an average of 20 minutes.", pubmedQ:"sleep temperature thermoregulation", pubmedFbs:["cool bedroom sleep quality","body temperature sleep"] },
  { id:"g27", title:"Pre-Bed Casein Protein", category:"nutrition", difficulty:"Beginner", duration:"5 min", instruction:"Eat 30-40g of casein protein or 200g of Greek yogurt 30-45 minutes before bed tonight. Casein digests slowly, releasing amino acids throughout the night during muscle repair cycles.", science:"Pre-sleep protein ingestion increases overnight muscle protein synthesis by 22% and improves morning fat oxidation without disrupting sleep onset or architecture.", pubmedQ:"pre-sleep protein muscle synthesis", pubmedFbs:["casein protein before bed","nocturnal protein metabolism"] },
  { id:"g28", title:"Post-Dinner Walk", category:"movement", difficulty:"Beginner", duration:"15 min", instruction:"Within 30 minutes of finishing dinner tonight, take a 15-minute walk at easy pace. Flat terrain. This is blood glucose management, not exercise.", science:"A 15-minute post-meal walk lowers postprandial glucose spikes by 30-37% and reduces glucose variability throughout the night, improving next-morning insulin sensitivity.", pubmedQ:"post-meal walk glucose", pubmedFbs:["exercise after eating blood sugar","walking postprandial glucose"] },
  { id:"g29", title:"Progressive Muscle Relaxation", category:"stress", difficulty:"Beginner", duration:"12 min", instruction:"Lie flat. Starting at feet - tense each muscle group hard for 5 seconds, then release completely. Move upward: calves, thighs, abdomen, hands, arms, shoulders, face. Finish with 3 slow full breaths.", science:"PMR reduces cortisol and adrenaline and activates the parasympathetic nervous system within one session. In clinical trials it reduces pre-procedural anxiety more effectively than medication in some populations.", pubmedQ:"progressive muscle relaxation anxiety", pubmedFbs:["PMR stress reduction","muscle relaxation cortisol"] },
  { id:"g30", title:"Mindful Meal - No Screens", category:"mindfulness", difficulty:"Beginner", duration:"20 min", instruction:"Choose one meal today to eat with no screens, no reading, no music. Sit down. Before eating, take 3 slow breaths. Eat at half your normal speed. Put utensils down between every 3 bites.", science:"Mindful eating activates the cephalic phase response - salivary amylase, digestive enzymes, and gastric acid triggered by sensory attention to food - improving nutrient extraction by up to 15%.", pubmedQ:"mindful eating digestion health", pubmedFbs:["cephalic phase digestion","slow eating satiety"] },
  { id:"g31", title:"HIIT Tabata", category:"movement", difficulty:"Advanced", duration:"20 min", instruction:"8 rounds of 20 seconds maximum effort (burpees, sprints, or bike) followed by 10 seconds rest. Warm up 5 minutes first, cool down 5 minutes. Only if no cardiovascular conditions - consult your doctor.", science:"20-second maximal efforts trigger EPOC that elevates metabolism for 24-36 hours and produces equivalent cardiovascular adaptation to 45 minutes of moderate cardio.", pubmedQ:"HIIT high intensity interval training", pubmedFbs:["Tabata protocol outcomes","interval training cardiovascular"] },
  { id:"g32", title:"Omega-3 with Largest Meal", category:"supplements", difficulty:"Beginner", duration:"2 min", instruction:"Take 2-3g of EPA + DHA (combined) with your largest meal today. Look for triglyceride-form fish oil or algae-based omega-3. Consult your doctor before starting, especially if on blood thinners.", science:"EPA and DHA incorporate into neuronal membranes within 6-8 weeks, measurably reducing inflammatory cytokines IL-6 and CRP and improving cognitive processing speed in meta-analyses.", pubmedQ:"omega-3 EPA DHA inflammation", pubmedFbs:["fish oil cognitive health","omega 3 cardiovascular"] },
  { id:"g33", title:"25g Protein at Every Meal", category:"nutrition", difficulty:"Beginner", duration:"All day", instruction:"At every meal today, include at least 25g of protein before adding carbohydrates. Breakfast: eggs or yogurt. Lunch and dinner: meat, fish, tofu, or legumes as the centrepiece.", science:"Muscle protein synthesis requires ~3g of leucine per meal as a trigger - achievable at approximately 25-30g total protein. Below this threshold, the anabolic signal is not activated.", pubmedQ:"protein synthesis leucine threshold", pubmedFbs:["protein per meal muscle","leucine muscle protein"] },
  { id:"g34", title:"No-Alcohol 48 Hours", category:"nutrition", difficulty:"Intermediate", duration:"48 hours", instruction:"From now, abstain completely from alcohol for 48 hours. Replace with sparkling water with lime, kombucha, or herbal tea. Note sleep quality on both nights.", science:"Even 1-2 drinks suppress REM sleep by 24% and fragment deep sleep architecture, with measurable effects at blood alcohol concentration as low as 0.02%.", pubmedQ:"alcohol sleep quality REM", pubmedFbs:["alcohol sleep disruption","ethanol sleep architecture"] },
  { id:"g35", title:"Nasal Breathing Hour", category:"breathwork", difficulty:"Beginner", duration:"60 min", instruction:"For the next hour, breathe only through your nose. Tongue resting on the roof of your mouth (not teeth). Mouth sealed. Notice when you revert - just return each time without judgement.", science:"Nasal breathing produces nitric oxide that vasodilates blood vessels, filters pathogens, and maintains 50% higher blood oxygen saturation than mouth breathing at rest.", pubmedQ:"nasal breathing nitric oxide health", pubmedFbs:["mouth breathing vs nasal","nasal respiration oxygen"] },
  { id:"g36", title:"Anti-Inflammatory Dinner", category:"nutrition", difficulty:"Beginner", duration:"45 min", instruction:"Tonight build dinner around: fatty fish (salmon, sardines, mackerel) OR walnuts, 2+ colourful vegetables, olive oil as the cooking fat, and turmeric with black pepper (fat activates curcumin absorption).", science:"Omega-3, polyphenols, and curcumin simultaneously reduce NF-κB signalling - the master inflammatory regulator - with synergistic effects greater than any single compound alone.", pubmedQ:"anti-inflammatory diet health", pubmedFbs:["Mediterranean diet inflammation","omega-3 polyphenol anti-inflammatory"] },
  { id:"g37", title:"Single-Leg Balance Hold", category:"movement", difficulty:"Beginner", duration:"5 min", instruction:"While brushing teeth or waiting for coffee, balance on one leg for 30 seconds each side. Eyes open first, then closed once comfortable. Track your seconds - improvement happens within days.", science:"Single-leg balance under 10 seconds predicts 10-year mortality in adults over 51 more strongly than cardiovascular fitness metrics. Daily practice builds proprioception and prevents falls.", pubmedQ:"single leg balance mortality longevity", pubmedFbs:["balance proprioception aging","postural stability health"] },
  { id:"g38", title:"Vitamin D + K2 Protocol", category:"supplements", difficulty:"Beginner", duration:"2 min", instruction:"Take 2000-4000 IU of vitamin D3 with K2 (MK-7) alongside a fat-containing meal today. Test 25-OH-D levels before adjusting dose - consult your doctor. Optimal range is 40-60 ng/mL.", science:"Vitamin D3 acts as a hormone, regulating 2000+ genes. Deficiency - present in 42% of adults - is independently associated with increased all-cause mortality and impaired immune function.", pubmedQ:"vitamin D3 supplementation health", pubmedFbs:["vitamin D deficiency immune","D3 K2 outcomes"] },
  { id:"g39", title:"Expressive Writing Reset", category:"mindfulness", difficulty:"Beginner", duration:"10 min", instruction:"Set a 10-minute timer. Write continuously about whatever is occupying your mind - without stopping to edit. When the timer ends, close the notebook. Do not reread today.", science:"Expressive writing externalises working memory load from the prefrontal cortex, measurably reducing rumination and improving task-switching performance within a single session.", pubmedQ:"expressive writing working memory", pubmedFbs:["journaling stress mental health","writing emotional processing"] },
  { id:"g40", title:"Three-Minute Ice-Cold Immersion", category:"cold", difficulty:"Advanced", duration:"5 min", instruction:"Submerge to shoulders in ice water at 1-15°C for 3 minutes. Breathe steadily - do not hyperventilate before entering. Exit if shivering becomes uncontrollable. Warm up by moving actively. NEVER alone or in open water.", science:"Three minutes at <15°C produces sustained norepinephrine elevation of +300% and dopamine increase of +250% above baseline lasting 3-6 hours - the longest neurochemical window of any biohacking protocol.", pubmedQ:"cold water immersion norepinephrine dopamine", pubmedFbs:["ice bath neurochemistry","cold immersion mental health"] },
  { id:"g41", title:"30-Plant Week Challenge", category:"nutrition", difficulty:"Intermediate", duration:"All week", recommendedDays:7, instruction:"Count every distinct plant you eat today - vegetables, fruits, legumes, grains, herbs, spices, nuts, seeds each count separately. Aim for 6-8 unique plants today. Track toward 30 this week.", science:"30 plant varieties per week is the strongest single dietary predictor of microbiome diversity - and diversity predicts mood, immunity, and metabolic health.", pubmedQ:"plant diversity microbiome health", pubmedFbs:["gut microbiome diet variety","plant based microbiome"] },
  { id:"g42", title:"Fixed Wake Time - 7 Days", category:"sleep", difficulty:"Intermediate", duration:"All week", recommendedDays:7, instruction:"Set a single wake time and hold it every day this week, including weekends. No exceptions. Allow sleep time to vary but not wake time. The first 3 days may feel harder; by day 5 the system recalibrates.", science:"The suprachiasmatic nucleus uses wake-time consistency to synchronise melatonin, cortisol, and insulin rhythms. Variable wake times disrupt these rhythms as severely as crossing two time zones.", pubmedQ:"sleep consistency circadian health", pubmedFbs:["fixed wake time sleep quality","social jetlag health"] },
  { id:"g43", title:"15-Minute Phone-Free Walk", category:"movement", difficulty:"Beginner", duration:"15 min", instruction:"Walk for 15 minutes outdoors, phone left at home or in a bag, screen off. No podcasts or calls - just walking and noticing your surroundings.", science:"Walking without a phone lets attention settle into the wandering, restorative mode linked to lower rumination and better mood - an effect measurably reduced when attention is split with a screen.", pubmedQ:"walking attention restoration mood", pubmedFbs:["walking cognitive restoration","nature walk mood"] },
  { id:"g44", title:"Morning Stretch, 5 Minutes", category:"movement", difficulty:"Beginner", duration:"5 min", instruction:"Before checking your phone, spend 5 minutes on simple stretches - neck rolls, shoulder circles, a forward fold, a gentle spinal twist. Move slowly, breathe normally throughout.", science:"Morning stretching increases blood flow to stiff tissue and raises core temperature gradually, improving joint range of motion for the rest of the day more than stretching cold later on.", pubmedQ:"morning stretching flexibility mobility", pubmedFbs:["stretching joint mobility","morning exercise routine"] },
  { id:"g45", title:"Take the Stairs Today", category:"movement", difficulty:"Beginner", duration:"All day", instruction:"Choose stairs over the lift or escalator every time today, no exceptions if physically able. Even 2-3 flights count.", science:"Stair climbing is vigorous-intensity exercise minute for minute - short bouts accumulated through the day measurably improve cardiorespiratory fitness in sedentary adults over several weeks.", pubmedQ:"stair climbing cardiorespiratory fitness", pubmedFbs:["stair climbing exercise intensity","incidental physical activity health"] },
  { id:"g46", title:"Water Before Coffee", category:"hydration", difficulty:"Beginner", duration:"2 min", instruction:"Drink a full glass of water (about 300ml) before your first coffee or tea of the day. Keep a glass by the kettle as a visual reminder.", science:"Hours of overnight fasting leave the body mildly dehydrated on waking; rehydrating first supports alertness and softens the sharp cortisol response caffeine can trigger on an empty, dehydrated stomach.", pubmedQ:"morning hydration cortisol alertness", pubmedFbs:["hydration cognitive performance","morning water intake health"] },
  { id:"g47", title:"2 Litres of Water Today", category:"hydration", difficulty:"Beginner", duration:"All day", instruction:"Aim for roughly 2 litres of water spread across the day. A bottle you refill and track (2-3 refills) makes this easier than trying to gauge it by feel.", science:"Even mild dehydration of 1-2% body weight measurably impairs concentration, mood, and short-term memory - effects most people don't notice until intake is corrected.", pubmedQ:"mild dehydration cognitive performance mood", pubmedFbs:["hydration status cognition","water intake mood"] },
  { id:"g48", title:"No Screens, Last 30 Minutes", category:"sleep", difficulty:"Beginner", duration:"30 min", instruction:"Stop looking at phone, tablet, or TV screens for the final 30 minutes before bed. Read on paper, stretch, or simply wind down in dim light instead.", science:"Blue-enriched light from screens suppresses melatonin release by up to 50% at typical viewing distances, delaying the body's natural signal to prepare for sleep - even at low brightness.", pubmedQ:"screen light melatonin suppression sleep", pubmedFbs:["blue light melatonin evening","screen time sleep onset"] },
  { id:"g49", title:"Fixed Bedtime Tonight", category:"sleep", difficulty:"Beginner", duration:"1 night", instruction:"Pick a bedtime and get into bed within 15 minutes of it tonight, regardless of how you feel. Set a gentle reminder an hour beforehand to start winding down.", science:"Consistent sleep timing anchors circadian rhythm as strongly as sleep duration itself - irregular bedtimes are independently linked to poorer metabolic and mood outcomes even when total sleep hours are adequate.", pubmedQ:"sleep timing consistency circadian health", pubmedFbs:["bedtime regularity health outcomes","sleep schedule variability"] },
  { id:"g50", title:"Three Good Things Today", category:"mindfulness", difficulty:"Beginner", duration:"5 min", instruction:"Before bed, write down three specific things that went well today, however small, and one sentence on why each mattered to you.", science:"This is one of the most replicated positive-psychology exercises - practised for even one week, it produces measurable increases in wellbeing and reductions in depressive symptoms lasting months.", pubmedQ:"three good things gratitude wellbeing intervention", pubmedFbs:["gratitude journaling depression","positive psychology intervention wellbeing"] },
  { id:"g51", title:"Three Breaths Before Eating", category:"mindfulness", difficulty:"Beginner", duration:"1 min", instruction:"Before your next meal, pause and take three slow breaths - in through the nose, out through the mouth - before picking up your fork.", science:"A brief pause before eating shifts the body out of a stressed state and into rest-and-digest mode, supporting better digestion and naturally slower, more attentive eating.", pubmedQ:"pre-meal breathing parasympathetic digestion", pubmedFbs:["mindful eating digestion","breathing vagal tone meals"] },
  { id:"g52", title:"Call Someone You Care About", category:"social", difficulty:"Beginner", duration:"10 min", instruction:"Call - don't text - someone you care about but haven't spoken to in a while. No agenda needed, just genuine conversation.", science:"Voice calls produce stronger feelings of connection than text-based messages even at equal content, likely through vocal cues text cannot carry - and social connection is one of the strongest predictors of long-term wellbeing in longitudinal research.", pubmedQ:"voice call social connection wellbeing", pubmedFbs:["social connection communication mode","phone call wellbeing loneliness"] },
  { id:"g53", title:"Phone-Free Meal With Someone", category:"social", difficulty:"Beginner", duration:"20 min", instruction:"Share one meal today with someone else, phones face-down and out of reach for the whole meal. Just conversation.", science:"The mere presence of a phone on the table measurably reduces conversation quality and feelings of closeness between people, even when it's not being used - an effect known as the 'phubbing' cost.", pubmedQ:"phone presence conversation quality closeness", pubmedFbs:["phubbing relationship satisfaction","device presence social interaction"] },
  { id:"g54", title:"One Hour Without Social Media", category:"digital", difficulty:"Beginner", duration:"1 hour", instruction:"Pick one hour today and don't open any social media app, even 'just to check'. Leave your phone in another room if that's what it takes.", science:"Even short abstinence from social media reduces self-reported anxiety and improves mood within days in controlled studies, likely by interrupting the intermittent-reward loop that keeps pulling attention back.", pubmedQ:"social media abstinence anxiety mood", pubmedFbs:["social media break wellbeing","digital detox mental health"] },
  { id:"g55", title:"Phone-Free First Hour", category:"digital", difficulty:"Beginner", duration:"1 hour", instruction:"Don't touch your phone for the first hour after waking. Keep it in another room overnight if that's what it takes.", science:"Checking phones immediately on waking primes the brain into a reactive, external-demand mode before it has had a chance to set its own intentions for the day - a pattern linked to higher reported stress.", pubmedQ:"morning phone use stress attention", pubmedFbs:["smartphone morning routine stress","phone use upon waking"] },
];

// bioCat: "cycle" (menstrual-phase-specific — follicular/luteal/ovulation/menstruation/PMS), "peri"
// (perimenopause/menopause-specific), "general" (applies regardless). Filtered below so a
// perimenopause/menopause user never sees cycle-phase-specific challenges (e.g. "Ovulatory Strength
// Peak" makes no physiological sense without regular ovulation).
const CHALLENGES_FEMALE = [
  { id:"f01", bioCat:"cycle", phase:["follicular"], title:"Follicular Phase Energy Walk", category:"movement", difficulty:"Beginner", duration:"20 min", instruction:"During your follicular phase (days 1-14), take a brisk 20-minute walk in the morning. Your rising oestrogen increases pain tolerance and energy - this is the ideal phase to push intensity.", science:"Oestrogen activates dopamine receptors and enhances muscle glycogen storage in the follicular phase. Exercise performance and recovery capacity are measurably higher in this phase.", pubmedQ:"follicular phase exercise performance", pubmedFbs:["oestrogen exercise capacity","menstrual cycle training"] },
  { id:"f02", bioCat:"cycle", phase:["menstrual"], title:"Iron-Rich Recovery Meal", category:"nutrition", difficulty:"Beginner", duration:"30 min", instruction:"During menstruation, eat red meat, lentils, or spinach alongside a vitamin C source - orange, bell pepper, or strawberries. Avoid tea and coffee within 2 hours of this meal (they block iron).", science:"Menstrual blood loss depletes iron stores monthly. Pairing plant iron with vitamin C converts non-haem iron to the haem form, tripling absorption rate and preventing energy dips from low ferritin.", pubmedQ:"iron absorption vitamin C menstruation", pubmedFbs:["iron deficiency women menstrual","haem iron women health"] },
  { id:"f03", bioCat:"cycle", phase:["follicular","luteal"], title:"Seed Cycling Protocol", category:"nutrition", difficulty:"Beginner", duration:"5 min", instruction:"Follicular phase (days 1-14): 1 tbsp ground flaxseeds + 1 tbsp pumpkin seeds at breakfast. Luteal phase (days 15-28): switch to 1 tbsp ground sesame seeds + 1 tbsp sunflower seeds daily.", science:"Flaxseed lignans modulate oestrogen receptor activity; pumpkin seed zinc supports progesterone production. Sesame and sunflower provide selenium and vitamin E that support the corpus luteum.", pubmedQ:"seed cycling hormonal balance women", pubmedFbs:["flaxseed oestrogen","pumpkin seed zinc progesterone"] },
  { id:"f04", bioCat:"cycle", phase:["luteal"], title:"Luteal Phase Wind-Down", category:"sleep", difficulty:"Beginner", duration:"30 min", instruction:"In your luteal phase (days 15-28), start your evening wind-down 30 minutes earlier. Reduce high-intensity training. Eat a magnesium-rich snack before bed - dark chocolate with almonds or a banana.", science:"Progesterone metabolites act on GABA receptors, but their sedating effect is disrupted by blue light and cortisol spikes. Earlier wind-down prevents the progesterone-withdrawal insomnia of late luteal phase.", pubmedQ:"luteal phase sleep progesterone", pubmedFbs:["progesterone sleep quality women","late luteal insomnia"] },
  { id:"f05", bioCat:"general", title:"Adaptogen Morning Tonic", category:"supplements", difficulty:"Beginner", duration:"5 min", instruction:"Stir into warm water: ½ tsp ashwagandha, ½ tsp maca root, 1 tsp raw honey, ½ tsp cinnamon. Drink before breakfast. Take for 4-8 weeks then rest 2 weeks. Consult your doctor before starting.", science:"Ashwagandha reduces cortisol by 27% and supports adrenal function in double-blind trials. Maca root improves hormonal balance through hypothalamic-pituitary axis modulation.", pubmedQ:"ashwagandha cortisol women", pubmedFbs:["maca root hormonal health","adaptogen stress women"] },
  { id:"f06", bioCat:"cycle", phase:["ovulatory"], title:"Ovulatory Strength Peak", category:"movement", difficulty:"Advanced", duration:"45 min", instruction:"During ovulation (around days 12-16): schedule your most demanding workout - heavier weights, higher reps, or longest run. You are at peak strength and pain tolerance. Use this 3-4 day window.", science:"Oestrogen peaks at ovulation, binding to muscle receptors to enhance force production and glycogen utilisation. This is the single phase where women measurably outperform their cycle average.", pubmedQ:"ovulation exercise peak performance women", pubmedFbs:["oestrogen peak strength","ovulatory phase capacity"] },
  { id:"f07", bioCat:"cycle", phase:["luteal","menstrual"], title:"PMS Magnesium Protocol", category:"supplements", difficulty:"Beginner", duration:"2 min", instruction:"From day 15 through menstruation, take 300-400mg magnesium glycinate at bedtime. Eat 2 squares of 85%+ dark chocolate daily - it contains ~50mg magnesium and reduces cortisol. Consult your doctor.", science:"Magnesium deficiency worsens PMS symptoms including cramps, mood fluctuations, and breast tenderness. Supplementation reduces PMS severity scores by 34% after 2 cycles in clinical trials.", pubmedQ:"magnesium PMS premenstrual syndrome", pubmedFbs:["magnesium PMS women","magnesium menstrual cramps"] },
  { id:"f08", bioCat:"cycle", phase:["menstrual"], title:"Anti-Cramp Ginger Tea", category:"nutrition", difficulty:"Beginner", duration:"10 min", instruction:"During menstruation: steep 5-8 slices of fresh ginger in boiling water for 10 minutes. Add honey and lemon. Drink 2-3 cups throughout the day starting the first day of cramps.", science:"Ginger inhibits prostaglandin synthesis as effectively as 250mg ibuprofen in clinical trials for primary dysmenorrhea, reducing uterine muscle cramping without gastrointestinal side effects.", pubmedQ:"ginger dysmenorrhea menstrual cramps", pubmedFbs:["ginger anti-inflammatory prostaglandins","ginger ibuprofen pain"] },
  { id:"f09", bioCat:"cycle", phase:["follicular","luteal"], title:"Cycle-Synced Carbohydrates", category:"nutrition", difficulty:"Intermediate", duration:"All day", instruction:"Follicular phase (days 1-14): moderate carbs, higher protein. Luteal phase (days 15-28): increase complex carbs by 15-20% - sweet potato, oats, brown rice. This matches your elevated metabolic rate.", science:"Resting metabolic rate rises by 5-10% in the luteal phase due to progesterone's thermogenic effects. Aligned carbohydrate intake maintains serotonin precursors and prevents the cravings that follow energy crashes.", pubmedQ:"menstrual cycle nutrition carbohydrate", pubmedFbs:["luteal phase metabolism women","cycle syncing diet"] },
  { id:"f10", bioCat:"peri", title:"Perimenopause Resistance Training", category:"movement", difficulty:"Intermediate", duration:"40 min", instruction:"Three times per week, lift weights heavy enough that the last 2 reps of each set are difficult. Focus on hip hinges, squats, and rows (8-10 rep sets). This is the most evidence-based intervention for perimenopause.", science:"Oestrogen loss accelerates bone density loss and muscle wasting. Resistance training 3×/week maintains bone mineral density independently of hormone therapy in perimenopausal women.", pubmedQ:"resistance training perimenopause bone density", pubmedFbs:["menopause exercise muscle","oestrogen decline strength training"] },
  { id:"f11", bioCat:"general", title:"Spearmint Tea for Androgens", category:"nutrition", difficulty:"Beginner", duration:"5 min", instruction:"Drink 2 cups of spearmint tea daily (morning and evening). Steep 5 minutes. Particularly useful if you experience excess androgen symptoms - acne, hirsutism, or PCOS-related concerns.", science:"Spearmint contains compounds that inhibit 5α-reductase and reduce free testosterone. In double-blind trials, 2 cups daily reduced androgen levels and improved hormonal markers in women with PCOS.", pubmedQ:"spearmint tea androgen PCOS", pubmedFbs:["spearmint testosterone women","spearmint hormonal acne"] },
  { id:"f12", bioCat:"general", title:"Oestrogen Clearance Dinner", category:"nutrition", difficulty:"Beginner", duration:"45 min", instruction:"Build dinner around cruciferous vegetables - broccoli, cauliflower, Brussels sprouts, or kale - lightly cooked. Add 1 tbsp ground flaxseed. These support the liver's Phase II oestrogen detoxification pathway.", science:"DIM from cruciferous vegetables supports hepatic oestrogen metabolism, preventing oestrogen recirculation from the gut and reducing oestrogen dominance symptoms over 4-8 weeks.", pubmedQ:"cruciferous vegetables oestrogen metabolism", pubmedFbs:["DIM estrogen detox women","liver oestrogen clearance"] },
];

// cyclePhase is the resolved getCyclePhase() result (or null). It is the single signal that
// already covers: tracking disabled, perimenopause, menopause, and stale/unknown phase — in all
// those cases only non-cycle (peri + general) challenges are shown. When a phase IS known, cycle
// challenges are further restricted to ones tagged for that exact phase (see `phase` on each item).
const femalePoolFor = (cyclePhase) => {
  const nonCycle = CHALLENGES_FEMALE.filter(c => c.bioCat !== "cycle");
  if (!cyclePhase) return nonCycle;
  const phaseMatched = CHALLENGES_FEMALE.filter(c => c.bioCat === "cycle" && c.phase?.includes(cyclePhase.phase));
  return [...nonCycle, ...phaseMatched];
};

const CHALLENGES_MALE = [
  { id:"m01", title:"Morning Testosterone Window", category:"movement", difficulty:"Intermediate", duration:"30 min", instruction:"Between 6-10 AM when testosterone peaks: 5 sets of heavy compound movements - deadlifts, squats, or bench press at 80-90% of max. Short rest: 90 seconds between sets. Then end with a cold shower.", science:"Morning testosterone is 20-30% higher than evening. Heavy compound lifts at this window amplify the testosterone response 3-4× more than afternoon training in controlled trials.", pubmedQ:"testosterone morning exercise peak", pubmedFbs:["compound lifts testosterone","morning training hormones men"] },
  { id:"m02", title:"Creatine Daily Protocol", category:"supplements", difficulty:"Beginner", duration:"2 min", instruction:"Take 5g of creatine monohydrate daily with breakfast. No loading phase needed. Take every day - not just training days. Effects accumulate over 28 days of consistent use. Consult your doctor first.", science:"Creatine increases phosphocreatine resynthesis, enabling 5-15% more reps at equivalent loads and accelerating neuromuscular recovery. The most studied performance supplement with the strongest safety record.", pubmedQ:"creatine monohydrate performance", pubmedFbs:["creatine supplementation men muscle","creatine cognitive"] },
  { id:"m03", title:"Zinc-Rich Meal", category:"nutrition", difficulty:"Beginner", duration:"All day", instruction:"Eat oysters, red meat, or pumpkin seeds today. Add a handful of pumpkin seeds to lunch. If supplementing zinc: 25-45mg zinc bisglycinate at dinner, not morning (zinc competes with copper). Consult your doctor.", science:"Zinc is a co-factor in testosterone synthesis. Deficiency directly suppresses serum testosterone; supplementation restores levels suppressed by intense training in athletic populations.", pubmedQ:"zinc testosterone men", pubmedFbs:["zinc deficiency testosterone","zinc supplementation hormones men"] },
  { id:"m04", title:"Sprint Protocol", category:"movement", difficulty:"Advanced", duration:"20 min", instruction:"After a 5-minute warm-up jog: 6 rounds of 30-second flat-out sprints with 90-second walk recovery. Cool down 5 minutes. Perform on grass or a track - not a treadmill.", science:"Short maximal sprints produce the highest acute testosterone and growth hormone response of any cardiovascular exercise - superior to steady-state cardio for hormonal outcomes in men under 50.", pubmedQ:"sprint interval testosterone growth hormone", pubmedFbs:["HIIT testosterone men","sprint training GH"] },
  { id:"m05", title:"Testosterone Sleep Protocol", category:"sleep", difficulty:"Beginner", duration:"All night", instruction:"Tonight: bedroom below 18°C, completely dark, sleep 7.5-9 hours. No alcohol. No food within 3 hours of bed. Set a consistent wake time. The majority of daily testosterone is produced during NREM stage 3.", science:"95% of daily testosterone production occurs during sleep. Men sleeping fewer than 5 hours show testosterone levels equivalent to someone 15 years older.", pubmedQ:"testosterone sleep production men", pubmedFbs:["sleep deprivation testosterone","testosterone circadian sleep"] },
  { id:"m06", title:"Vitamin D for Testosterone", category:"supplements", difficulty:"Beginner", duration:"2 min", instruction:"Take 4000 IU vitamin D3 + K2 (MK-7) with your largest meal. Test 25-OH-D levels first - target 50-70 ng/mL. Consult your doctor before supplementing above 4000 IU.", science:"Vitamin D receptors are found in Leydig cells (testicular testosterone-producing cells). Men deficient in vitamin D have 65% lower testosterone than those with optimal levels.", pubmedQ:"vitamin D testosterone men", pubmedFbs:["vitamin D deficiency testosterone","D3 supplementation men"] },
  { id:"m07", title:"Post-Workout Anabolic Window", category:"nutrition", difficulty:"Beginner", duration:"30 min", instruction:"Within 90 minutes of any training session, eat 40-50g of protein with 50-80g of carbohydrates. Ideal: 250g chicken + rice + vegetables, or a protein shake with banana and oats.", science:"Leucine content above 3g - achievable at 40g total protein - maximises mTOR activation and muscle protein synthesis rates. The 90-minute post-exercise window is the most effective delivery time.", pubmedQ:"post-exercise protein muscle recovery", pubmedFbs:["anabolic window protein timing","mTOR leucine post workout"] },
  { id:"m08", title:"Heavy Deadlift Day", category:"movement", difficulty:"Advanced", duration:"45 min", instruction:"Warm up with 5 reps at 50%, 5 reps at 70%, then 3 sets of 5 at 85% of one-rep max. Rest 3-5 minutes between heavy sets. Focus on bracing, neutral spine, and full hip extension at the top.", science:"The deadlift recruits more total muscle mass than any single exercise. Large-muscle-group loading produces the greatest post-exercise testosterone and growth hormone spike in men.", pubmedQ:"deadlift testosterone muscle", pubmedFbs:["compound lift hormone response","heavy lifting GH men"] },
  { id:"m09", title:"Ashwagandha for Performance", category:"supplements", difficulty:"Beginner", duration:"2 min", instruction:"Take 600mg of KSM-66 ashwagandha extract with dinner tonight. Take consistently for 8-12 weeks. Consult your doctor before starting, especially if on thyroid medication or sedatives.", science:"KSM-66 ashwagandha increases testosterone by 15-17%, reduces cortisol by 27%, and increases VO2max by 6% in double-blind placebo-controlled trials in men.", pubmedQ:"ashwagandha testosterone cortisol men", pubmedFbs:["KSM-66 performance men","ashwagandha strength training"] },
  { id:"m10", title:"VO2max Interval Session", category:"movement", difficulty:"Advanced", duration:"35 min", instruction:"4 rounds of: 3 minutes at 90-95% max effort (running, rowing, or cycling), then 3 minutes easy recovery. Warm up 5 min, cool down 5 min. Work intervals should feel very hard.", science:"VO2max is the single strongest predictor of all-cause mortality in men - stronger than smoking status, BMI, or blood pressure. Intervals at 90%+ intensity are the most time-efficient way to raise it.", pubmedQ:"VO2max interval training mortality men", pubmedFbs:["maximal oxygen uptake exercise","aerobic capacity longevity men"] },
  { id:"m11", title:"Cortisol Management Protocol", category:"stress", difficulty:"Beginner", duration:"20 min", instruction:"Identify your single largest stressor. Spend 10 minutes writing what is within your control and what is not. For each controllable factor, write one concrete action. Then do 5 rounds of box breathing.", science:"Chronic elevated cortisol directly inhibits Leydig cell function, suppressing testosterone synthesis. Men with high cortisol have 30-50% lower testosterone in cross-sectional studies.", pubmedQ:"cortisol testosterone men stress", pubmedFbs:["chronic stress testosterone","cortisol Leydig cells"] },
  { id:"m12", title:"Saturated Fat for Hormones", category:"nutrition", difficulty:"Beginner", duration:"All day", instruction:"Include 2-3 servings of healthy saturated fats today: grass-fed beef, 4+ whole eggs, or full-fat dairy. Dietary cholesterol is the direct precursor to testosterone synthesis.", science:"Dietary cholesterol is converted to pregnenolone in adrenal and testicular cells - the precursor to testosterone, cortisol, and progesterone. Men on very low-fat diets consistently show lower total testosterone.", pubmedQ:"dietary fat testosterone men cholesterol", pubmedFbs:["low fat diet testosterone","saturated fat hormone"] },
];

// Picks a stable-for-the-week variant, using the same anti-repeat rotation and storage as the
// daily pickDailyIndex/pickDailyVariant (noraTokens) — just keyed by ISO week instead of by day.
const pickWeeklyVariant = (poolKey, pool, weekKey) => {
  if (typeof window === "undefined" || !pool || pool.length === 0) return pool?.[0];
  if (pool.length === 1) return pool[0];
  let history = {};
  try { history = JSON.parse(localStorage.getItem("nora_tip_history") || "{}"); } catch {}
  const entry = history[poolKey];
  if (entry && entry.date === weekKey && pool[entry.idx]) return pool[entry.idx];
  const recent = entry?.recent || [];
  const candidates = pool.map((_, i) => i).filter(i => !recent.includes(i));
  const pickFrom = candidates.length > 0 ? candidates : pool.map((_, i) => i);
  const idx = pickFrom[Math.floor(Math.random() * pickFrom.length)];
  history[poolKey] = { date: weekKey, idx, recent: [idx, ...recent].slice(0, Math.min(3, pool.length - 1)) };
  try { localStorage.setItem("nora_tip_history", JSON.stringify(history)); } catch {}
  return pool[idx];
};

// Nora's voice, by how the week went — warm at every level, never guilt-tripping the quiet weeks.
const WEEKLY_REPORT_MESSAGES = {
  low: [
    "A quieter week — that's alright. Tomorrow is a fresh page, not a deadline.",
    "Some weeks ask more of us than others. What matters is that you're still here.",
    "A slow week isn't a lost one. Small returns count as much as big ones.",
    "You don't owe this week an explanation. Pick one thing to return to, and start there.",
    "Consistency isn't unbroken — it's what you come back to. This week, come back gently.",
  ],
  medium: [
    "A steady week — more days met than missed. That's the shape real habits take.",
    "You showed up more often than not this week. That's worth noticing.",
    "Good rhythm this week, even with a few gaps. Gaps are normal; the pattern is what counts.",
    "You're building something here — not perfect, but persistent. That's the harder, better thing.",
    "A solid week overall. The days that didn't go to plan don't undo the ones that did.",
  ],
  high: [
    "A strong week — most days met, across the board. Well built.",
    "This is what consistency looks like when it's working. Notice how it felt.",
    "A full week, nearly end to end. That's not luck — that's a pattern you made.",
    "You held the line all week. Let that be evidence for the weeks that feel harder.",
    "A quietly excellent week. Nothing flashy — just shown up, day after day.",
  ],
};

const EXPLORE_QUERIES = {
  sleep:       { q:"sleep quality",              fbs:["sleep health adults","sleep duration outcomes"] },
  hydration:   { q:"water intake health",        fbs:["hydration performance","dehydration effects"] },
  movement:    { q:"exercise health benefits",   fbs:["physical activity","resistance training"] },
  nutrition:   { q:"whole food diet",            fbs:["nutrition health","plant based diet health"] },
  breathwork:  { q:"breathing exercise",         fbs:["controlled breathing","breathwork benefits"] },
  cold:        { q:"cold water immersion",       fbs:["cold exposure health","cryotherapy benefits"] },
  sauna:       { q:"sauna health",               fbs:["heat therapy","sauna cardiovascular"] },
  fasting:     { q:"intermittent fasting",       fbs:["time restricted eating","caloric restriction"] },
  stress:      { q:"stress reduction",           fbs:["cortisol management","stress intervention"] },
  gut:         { q:"gut microbiome",             fbs:["probiotics health","fermented foods gut"] },
  supplements: { q:"vitamin D supplementation", fbs:["magnesium benefits","omega-3 health"] },
  mindfulness: { q:"mindfulness meditation",    fbs:["meditation health","mindfulness intervention"] },
  light:       { q:"circadian light therapy",    fbs:["morning light health","phototherapy"] },
  icebath:     { q:"cold water immersion",       fbs:["ice bath health","cold therapy"] },
  hormones:    { q:"hormonal health",            fbs:["endocrine function","hormone optimization"] },
  longevity:   { q:"longevity aging",            fbs:["healthspan intervention","aging prevention"] },
};

const EXPLORE_CATEGORIES = [
  { id:"sleep",      title:"Sleep",               subtitle:"Anchor your circadian rhythm",          colSpan:2, guide:"Fix your wake time first - the same every day including weekends. Your suprachiasmatic nucleus uses this anchor to time cortisol, melatonin, and body temperature with precision. Cool your bedroom to 16-18°C and eliminate all light sources; even 10 lux suppresses melatonin by 50%. No caffeine after noon, no food within 3 hours of bed. These variables compound into measurably deeper sleep within one week.", protocol:"Fixed wake time · bedroom 16-18°C · complete darkness · no caffeine after noon · last meal 3h before bed" },
  { id:"hydration",  title:"Hydration",           subtitle:"Cellular performance starts here",      colSpan:1, guide:"On waking, drink 500ml of water with a pinch of sea salt and a squeeze of lemon. After 7-9 hours without fluid, cells are sodium-depleted; electrolytes are required to carry water across cell membranes. Plain water alone can dilute intracellular electrolytes further. Target 35ml per kg of bodyweight throughout the day, with an additional 500ml per hour of exercise.", protocol:"On waking: 500ml + sea salt + lemon · 35ml/kg daily · +500ml per hour of exercise" },
  { id:"movement",   title:"Movement",            subtitle:"Build strength that lasts decades",     colSpan:1, guide:"Two disciplines produce the greatest return: resistance training 2-3 times weekly for muscle mass and bone density, and 150-180 minutes weekly of Zone 2 cardio at conversational pace for mitochondrial density and fat oxidation. Both are independently associated with reduced all-cause mortality. Compound movements - squat, hinge, push, pull - and consistency over decades are the variables that matter most.", protocol:"Resistance: 2-3x/week, compound movements · Zone 2: 150-180 min/week at full-conversation pace" },
  { id:"nutrition",  title:"Nutrition",           subtitle:"Food as precision medicine",            colSpan:2, guide:"Eat 30 different plant varieties each week - the strongest single predictor of microbiome diversity in population studies. Prioritise protein at 1.6-2.2g per kg of bodyweight for muscle protein synthesis. Front-load calories to earlier in the day; insulin sensitivity is highest in the morning. Extra virgin olive oil, dark berries, and green tea are the highest-polyphenol daily additions available.", protocol:"30 plants/week · protein 1.6-2.2g/kg · larger breakfast and lunch · EVOO + dark berries daily" },
  { id:"breathwork", title:"Breathwork",          subtitle:"The fastest route to calm",             colSpan:1, guide:"Box breathing - inhale 4, hold 4, exhale 4, hold 4 - activates the parasympathetic nervous system via vagal stimulation within 2 minutes. For energy: 30 deep Wim Hof breaths followed by an exhale hold floods the brain with oxygen and releases adrenaline naturally. Both require no equipment. Never practise cyclic hyperventilation in water or while driving.", protocol:"Calm: box 4-4-4-4, 4-6 rounds · Energy: 30 deep breaths + exhale hold, 3 rounds - lying down only, never in water" },
  { id:"cold",       title:"Cold Exposure",       subtitle:"Controlled stress, profound adaptation", colSpan:1, guide:"End your shower with 30-60 seconds of cold water. The physiological shock triggers a 200-300% norepinephrine spike and sustained dopamine elevation lasting 2-4 hours. Regular cold exposure improves vascular tone and cold shock protein resilience. Build from 15 seconds, adding 5 seconds daily. Never practise cold water immersion alone in open water.", protocol:"Cold shower finish: start 15 sec → build to 60+ sec · morning preferred · never immerse in open water alone" },
  { id:"sauna",      title:"Sauna & Heat Therapy",subtitle:"Hormetic heat for cellular resilience",  colSpan:2, guide:"Heat stress activates heat shock proteins (HSPs), molecular chaperones that repair damaged proteins and reduce aggregation - a mechanism shared with longevity pathways activated by fasting. Sauna sessions of 20 minutes at 80-100°C, 3-4 times weekly, are associated with a 40% reduction in all-cause mortality in Finnish longitudinal studies. Heat also triggers BDNF release and robust growth hormone pulses.", protocol:"80-100°C · 20 min sessions · 3-4x/week · finish with cool rinse · electrolyte hydration before and after" },
  { id:"fasting",    title:"Fasting",             subtitle:"Metabolic flexibility through timing",   colSpan:1, guide:"A 14:10 protocol - eating within a 10-hour window such as 9am-7pm - aligns food intake with your circadian cortisol peak and measurably improves insulin sensitivity within 2 weeks. The 14-hour fasting mark initiates autophagy, the cellular recycling of damaged proteins. Break your fast with protein rather than carbohydrates. Contraindicated during pregnancy and for those with an eating disorder history.", protocol:"14:10: eat 9am-7pm · break fast with protein · water, black coffee, herbal tea only during fast" },
  { id:"stress",     title:"Stress Relief",       subtitle:"Lower cortisol, raise resilience",       colSpan:1, guide:"Twenty minutes in a natural setting - park, woodland, or riverside - measurably lowers cortisol, blood pressure, and inflammatory markers without any active effort. This Shinrin-yoku effect has been replicated across dozens of controlled trials. If outdoor access is limited, a gratitude practice of three specific written entries activates the same reward pathways within minutes of writing.", protocol:"20 min in nature, no phone, slow pace · or 3 specific gratitude entries, morning or evening" },
  { id:"gut",        title:"Gut Health",          subtitle:"Your second brain, nourished",           colSpan:2, guide:"The gut microbiome produces 90% of the body's serotonin and 50% of its dopamine, communicating with the brain via the vagus nerve. Eat one serving of fermented food daily - yogurt, kefir, kimchi, sauerkraut, or kombucha - paired with prebiotic fibre (garlic, leeks, oats, green bananas). Microbiome diversity is the strongest dietary predictor of mood and anxiety outcomes in longitudinal studies.", protocol:"1 fermented serving daily · pair with prebiotic fibre · 30 plants/week · reduce ultra-processed foods" },
  { id:"supplements",title:"Supplements",         subtitle:"Precision micronutrient support",        colSpan:1, guide:"Three supplements have the strongest evidence base: magnesium glycinate (300-400mg before bed) for sleep depth, GABA synthesis, and muscle relaxation; vitamin D3 with K2 for immune, bone, and hormonal function - most adults are deficient; and omega-3 EPA/DHA for cardiovascular and cognitive health. All doses require individual context - consult your doctor before starting.", protocol:"Magnesium glycinate 300-400mg, 30 min before bed · Vitamin D3+K2 and omega-3: test and consult your doctor" },
  { id:"mindfulness",title:"Mindfulness",         subtitle:"Attention as a trainable skill",         colSpan:1, guide:"Sit quietly and follow your breath for 10 minutes. Every time your attention wanders - repeatedly, that is expected - return without judgment. Each return strengthens the prefrontal cortex circuits governing attention regulation and emotional resilience. Eight weeks of daily practice produces measurable changes in grey matter density in the insula and prefrontal cortex. No app required.", protocol:"10 min daily · same time each day · follow the breath only · each return of attention is the exercise" },
  { id:"light",      title:"Light Exposure",      subtitle:"Set your biological clock daily",        colSpan:2, guide:"Step outside within 30 minutes of waking for 10-15 minutes. Low-angle morning light (6-9 AM) activates retinal photoreceptors that signal the suprachiasmatic nucleus, anchoring the cortisol rhythm and building that evening's melatonin reserve. Works on overcast days - outdoor lux is still 10-50× brighter than indoor lighting. In the evening, eliminate screens 90 minutes before bed.", protocol:"Outside within 30 min of waking · 6-9 AM only · no sunglasses · 10 min clear / 20 min overcast · screens off 90 min before bed" },
  { id:"icebath",    title:"Ice Bath & Wim Hof",  subtitle:"Ice, breath, and radical cold",          colSpan:1, guide:"Combining cyclic hyperventilation with cold water immersion produces a profound adrenaline and norepinephrine surge, with dopamine elevation up to 250% above baseline lasting several hours. Wim Hof Method practitioners show documented voluntary activation of the innate immune system. Start with the breathing practice alone before adding cold water. Never perform breathing exercises in or near water.", protocol:"Breathing: 30-40 deep breaths + exhale hold, 3 rounds, lying down · Cold: 1-3°C, 2-5 min · Never breathe in water · Never alone" },
  { id:"hormones",   title:"Hormones",            subtitle:"Master your endocrine architecture",     colSpan:1, guide:"Hormonal health is downstream of lifestyle - sleep, nutrition, and light exposure regulate cortisol, oestrogen, testosterone, and thyroid function more powerfully than most interventions. Resistance training 3x weekly raises testosterone and GH naturally. Blue light after 9 PM suppresses melatonin and disrupts the entire hormonal cascade. Women benefit from cycle-syncing nutrition and training intensity with their hormonal phases.", protocol:"Fixed wake time · 7-9h sleep · resistance training 3x/week · no blue light 2h before bed · cycle-sync for women" },
  { id:"longevity",  title:"Longevity",           subtitle:"The science of living better, longer",   colSpan:2, guide:"The four pillars of longevity science converge on the same mechanisms: mTOR inhibition (fasting), NAD+ restoration (exercise), AMPK activation (exercise, cold), and senolytic clearance. Muscle mass is the most predictive biomarker of healthspan beyond age 40. Zone 2 cardio and progressive resistance training together address the largest lifespan-limiting decline: loss of VO2max and muscle mass over time.", protocol:"Zone 2: 150+ min/week · Resistance: 2-3x/week · Sleep 7-9h · 14-16h fasting window · Test: VO2max, DEXA, blood panel" },
];

const BOOK_GROUPS = [
  { category:"Sleep",          books:[{ id:"sl1", title:"Why We Sleep",              author:"Matthew Walker",       desc:"How poor sleep accelerates every disease process - the case for prioritising rest above all else.",                          colSpan:1 },{ id:"sl2", title:"Sleep Smarter",              author:"Shawn Stevenson",      desc:"21 proven strategies for deeper, more restorative sleep and a sharper mind.",                                           colSpan:1 }]},
  { category:"Breathwork",     books:[{ id:"bw1", title:"Breath",                    author:"James Nestor",         desc:"The lost art and science of breathing - why how you breathe shapes health more than any diet.",                          colSpan:2 },{ id:"bw2", title:"The Oxygen Advantage",       author:"Patrick McKeown",      desc:"Scientifically proven breathing techniques for a healthier, faster, leaner body.",                                       colSpan:1 },{ id:"bw3", title:"The Wim Hof Method",         author:"Wim Hof",              desc:"Activate your full human potential through breathing, cold exposure, and commitment.",                                    colSpan:1 }]},
  { category:"Cold & Heat",    books:[{ id:"ch1", title:"What Doesn't Kill Us",      author:"Scott Carney",         desc:"How freezing water and extreme altitude can restore our lost evolutionary strength.",                                      colSpan:2 }]},
  { category:"Longevity",      books:[{ id:"lo1", title:"Outlive",                   author:"Peter Attia",          desc:"Medicine 3.0 - the science and art of maximising healthspan, not just lifespan.",                                        colSpan:2 },{ id:"lo2", title:"Lifespan",                    author:"David Sinclair",       desc:"A radical new theory of ageing - and why we don't have to accept it.",                                                   colSpan:1 },{ id:"lo3", title:"The Longevity Diet",         author:"Valter Longo",         desc:"Stem cell activation and regeneration to slow ageing through precision nutrition.",                                       colSpan:1 },{ id:"lo4", title:"The Circadian Code",         author:"Satchin Panda",        desc:"Transform your health by aligning food, sleep, and light to your internal body clock.",                                  colSpan:2 }]},
  { category:"Nutrition",      books:[{ id:"nu1", title:"How Not to Die",            author:"Michael Greger",       desc:"Foods scientifically proven to prevent and reverse the leading causes of death.",                                          colSpan:1 },{ id:"nu2", title:"Food",                      author:"Mark Hyman",           desc:"What the heck should I eat? A clear, evidence-based guide to navigating modern food.",                                   colSpan:1 },{ id:"nu3", title:"Grain Brain",               author:"David Perlmutter",     desc:"The surprising truth about wheat, carbs, and sugar as your brain's silent killers.",                                     colSpan:2 },{ id:"nu4", title:"Genius Foods",              author:"Max Lugavere",         desc:"Become smarter and more productive while protecting your brain for life.",                                                colSpan:1 },{ id:"nu5", title:"The Plant Paradox",         author:"Steven Gundry",        desc:"The hidden dangers in so-called healthy foods that cause disease and weight gain.",                                       colSpan:1 }]},
  { category:"Fasting",        books:[{ id:"fa1", title:"The Complete Guide to Fasting",author:"Jason Fung",        desc:"Heal your body through intermittent, alternate-day, and extended fasting.",                                               colSpan:1 },{ id:"fa2", title:"The Obesity Code",          author:"Jason Fung",           desc:"Unlocking the true mechanisms of weight loss - why conventional advice fails.",                                           colSpan:1 },{ id:"fa3", title:"Fast. Feast. Repeat.",      author:"Gin Stephens",         desc:"The comprehensive guide to the Delay, Don't Deny intermittent fasting lifestyle.",                                       colSpan:2 }]},
  { category:"Biohacking",     books:[{ id:"bi1", title:"Boundless",                 author:"Ben Greenfield",       desc:"The world's most comprehensive guide to upgrading brain, body, and spirit.",                                              colSpan:2 },{ id:"bi2", title:"The Bulletproof Diet",     author:"Dave Asprey",          desc:"Lose fat, reclaim energy and focus - a foundational biohacking blueprint.",                                              colSpan:1 },{ id:"bi3", title:"Super Human",              author:"Dave Asprey",          desc:"The Bulletproof plan to age backward and substantially extend healthy years.",                                            colSpan:1 }]},
  { category:"Movement",       books:[{ id:"mo1", title:"Spark",                     author:"John Ratey",           desc:"The revolutionary new science of exercise and its profound effect on the brain.",                                          colSpan:1 },{ id:"mo2", title:"Born to Run",             author:"Christopher McDougall",desc:"A hidden tribe, superathletes, and the greatest race the world has never seen.",                                           colSpan:1 },{ id:"mo3", title:"Exercised",               author:"Daniel Lieberman",     desc:"Why something we never evolved to do voluntarily is healthy and rewarding.",                                              colSpan:2 }]},
  { category:"Gut Health",     books:[{ id:"gu1", title:"Fiber Fueled",              author:"Will Bulsiewicz",      desc:"Plant-based programme for weight loss, health restoration, and microbiome optimisation.",                                  colSpan:1 },{ id:"gu2", title:"Brain Maker",             author:"David Perlmutter",     desc:"The power of gut microbes to heal and protect your brain - for life.",                                                   colSpan:1 }]},
  { category:"Mindfulness",    books:[{ id:"mi1", title:"The Body Keeps the Score",  author:"Bessel van der Kolk",  desc:"How trauma reshapes the body and brain - and the paths to healing.",                                                      colSpan:2 },{ id:"mi2", title:"Full Catastrophe Living",  author:"Jon Kabat-Zinn",       desc:"Using mindfulness meditation to face stress, pain, and chronic illness.",                                                 colSpan:1 },{ id:"mi3", title:"Lost Connections",         author:"Johann Hari",          desc:"Uncovering the real causes of depression - and the unexpected solutions.",                                                colSpan:1 }]},
  { category:"Women's Health", books:[{ id:"wh1", title:"In the Flo",               author:"Alisa Vitti",          desc:"Unlock your hormonal advantage and revolutionise food, fitness, and energy by cycle phase.",                              colSpan:1 },{ id:"wh2", title:"The Hormone Cure",        author:"Sara Gottfried",       desc:"Reclaim balance, sleep, sex drive, and vitality naturally with the Gottfried Protocol.",                                 colSpan:1 }]},
  { category:"Ancestral Health",books:[{ id:"an1", title:"Primal Blueprint",         author:"Mark Sisson",          desc:"Reprogram your genes for effortless weight loss, vibrant health, and boundless energy.",                                  colSpan:1 },{ id:"an2", title:"The Paleo Solution",      author:"Robb Wolf",            desc:"The original human diet - lose fat, regain health, and build real strength.",                                            colSpan:1 }]},
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };
const getSeason = () => { const m = new Date().getMonth(); if(m>=2&&m<=4)return"spring"; if(m>=5&&m<=7)return"summer"; if(m>=8&&m<=10)return"autumn"; return"winter"; };

const DEFAULT_LOCATION = { city: "Bucharest", lat: 44.4268, lng: 26.1025 };

// Local sunrise/sunset calculation (NOAA solar position formula) — no external API, no key.
// Returns the same shape CircadianTimeline already expects: sunrise/sunset/solar_noon as "H:MM AM/PM".
const calcSunTimes = (lat, lng, date) => {
  const toJulian = d => d.getTime() / 86400000 + 2440587.5;
  const fromJulian = jd => new Date((jd - 2440587.5) * 86400000);
  const J = toJulian(date);
  const n = Math.floor(J - 2451545.0 + 0.0008);
  const Jstar = n - lng / 360;
  const M = (357.5291 + 0.98560028 * Jstar) % 360;
  const Mrad = M * Math.PI / 180;
  const Ceq = 1.9148*Math.sin(Mrad) + 0.0200*Math.sin(2*Mrad) + 0.0003*Math.sin(3*Mrad);
  const lambda = (M + Ceq + 180 + 102.9372) % 360;
  const lambdaRad = lambda * Math.PI / 180;
  const Jtransit = 2451545.0 + Jstar + 0.0053*Math.sin(Mrad) - 0.0069*Math.sin(2*lambdaRad);
  const sinDelta = Math.sin(lambdaRad) * Math.sin(23.4397*Math.PI/180);
  const delta = Math.asin(sinDelta);
  const latRad = lat * Math.PI / 180;
  const cosOmega = (Math.sin(-0.83*Math.PI/180) - Math.sin(latRad)*Math.sin(delta)) / (Math.cos(latRad)*Math.cos(delta));
  const omega = Math.acos(Math.max(-1, Math.min(1, cosOmega))) * 180 / Math.PI;
  const Jset  = 2451545.0 + (omega/360 + Jstar) + 0.0053*Math.sin(Mrad) - 0.0069*Math.sin(2*lambdaRad);
  const Jrise = Jtransit - (Jset - Jtransit);

  const fmt = jd => fromJulian(jd).toLocaleTimeString("en-US", { hour:"numeric", minute:"2-digit" });
  return { sunrise: fmt(Jrise), sunset: fmt(Jset), solar_noon: fmt(Jtransit) };
};

// City name from GPS coords — free, keyless, built for client-side calls (unlike Nominatim, which
// asks apps to proxy through a server). Coordinates are rounded to ~city precision before sending.
const reverseGeocodeCity = async (lat, lng) => {
  const rLat = Math.round(lat * 100) / 100;
  const rLng = Math.round(lng * 100) / 100;
  // Calling api-bdc.io directly (not api.bigdatacloud.net) — that domain 307-redirects here,
  // and skipping the redirect avoids any browser/network quirks with following it.
  const url = `https://api-bdc.io/data/reverse-geocode-client?latitude=${rLat}&longitude=${rLng}&localityLanguage=en`;
  try {
    const res = await fetch(url);
    console.log("[Nora][location DEBUG] reverse geocode HTTP status:", res.status);
    if (!res.ok) return null;
    const data = await res.json();
    console.log("[Nora][location DEBUG] reverse geocode response:", data);
    return data.city || data.locality || data.principalSubdivision || null;
  } catch (e) {
    console.log("[Nora][location DEBUG] reverse geocode threw:", e?.name, e?.message);
    return null;
  }
};

const callClaude = async (sys, user) => {
  const res = await fetch("/api/chat", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ model:"claude-haiku-4-5-20251001", max_tokens:400, system:sys, messages:[{ role:"user", content:user }] }) });
  const data = await res.json();
  return data.content?.map(b => b.text||"").join("")||"";
};

const PM_PREFIX = "nora_pm_";
const PM_TTL    = 86400000; // 24 h

const fetchPubMed = async (q, n = 15, fallbacks = []) => {
  const key = PM_PREFIX + q.replace(/\W+/g, "_").slice(0, 32);
  try {
    const raw = localStorage.getItem(key);
    if (raw) { const { ts, studies } = JSON.parse(raw); if (Date.now() - ts < PM_TTL) return { studies }; }
  } catch {}
  try {
    const params = new URLSearchParams({ q, n: String(n) });
    if (fallbacks.length) params.set("fallbacks", fallbacks.join("|"));
    const r = await fetch(`/api/pubmed?${params}`);
    if (!r.ok) return { studies: [] };
    const data    = await r.json();
    const studies = data.studies || [];
    if (studies.length) { try { localStorage.setItem(key, JSON.stringify({ ts: Date.now(), studies })); } catch {} }
    return { studies };
  } catch { return { studies: [] }; }
};

const tryParseJSON = text => {
  const clean = text.replace(/```json\s*/gi,"").replace(/```/g,"").trim();
  try { return JSON.parse(clean); } catch { const m = clean.match(/\{[\s\S]*\}/); if(m){ try{ return JSON.parse(m[0]); }catch{} } return null; }
};

const getFallbackChallenge = (sex, usedIds, cyclePhase) => {
  const pool = [
    ...CHALLENGES_GENERAL,
    ...(sex === "female" ? femalePoolFor(cyclePhase) : []),
    ...(sex === "male"   ? CHALLENGES_MALE   : []),
  ].filter(c => !usedIds.has(c.id));
  const src = pool.length > 0 ? pool : CHALLENGES_GENERAL;
  const seed = parseInt(todayStr().replace(/-/g,""));
  return src[seed % src.length];
};

// ─── CATEGORY ICONS ──────────────────────────────────────────────────────────
function CategoryIcon({ id, size=22, color="#1F2E26" }) {
  const p = { stroke:color, strokeWidth:"1.4", strokeLinecap:"round", strokeLinejoin:"round", fill:"none" };
  const s = { width:size, height:size, viewBox:"0 0 24 24", fill:"none" };
  switch(id) {
    case "sleep":       return <svg {...s}><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z" {...p}/></svg>;
    case "hydration":   return <svg {...s}><path d="M12 3L6.5 11.5C5 13.5 5 16.5 7 18.5S11 20.5 12 20.5 17 20 19 18s2-5 .5-7L12 3Z" {...p}/><path d="M9 16.5Q12 15 15 16.5" {...p} strokeWidth="1"/></svg>;
    case "movement":    return <svg {...s}><path d="M5 20Q10 15 14 13Q19 11 21 5" {...p}/><path d="M14 13Q11.5 9 15 5" {...p} strokeWidth="1.1"/><path d="M14 13Q18.5 12 20 17" {...p} strokeWidth="1.1"/></svg>;
    case "nutrition":   return <svg {...s}><path d="M12 21C12 21 4 17 4 10C4 7.8 5.8 6 8 6C9.6 6 11 7 12 8.5C13 7 14.4 6 16 6C18.2 6 20 7.8 20 10C20 17 12 21 12 21Z" {...p}/><path d="M12 8.5V21" {...p} strokeWidth="1"/></svg>;
    case "breathwork":  return <svg {...s}><path d="M3 12Q7.5 7 12 12Q16.5 17 21 12" {...p}/><path d="M3 12Q7.5 4 12 12Q16.5 20 21 12" {...p} strokeWidth="1"/><circle cx="12" cy="12" r="1.8" {...p} strokeWidth="1"/></svg>;
    case "cold":        return <svg {...s}><line x1="12" y1="3" x2="12" y2="21" {...p} strokeWidth="1.2"/><line x1="3" y1="12" x2="21" y2="12" {...p} strokeWidth="1.2"/><line x1="6" y1="6" x2="18" y2="18" {...p} strokeWidth="1.2"/><line x1="18" y1="6" x2="6" y2="18" {...p} strokeWidth="1.2"/><circle cx="12" cy="12" r="2.5" {...p} strokeWidth="1"/></svg>;
    case "sauna":       return <svg {...s}><path d="M5 21h14" {...p} strokeWidth="1.2"/><path d="M7 17Q9 13 7 9" {...p}/><path d="M12 17Q14 13 12 9" {...p}/><path d="M17 17Q19 13 17 9" {...p}/></svg>;
    case "fasting":     return <svg {...s}><path d="M8.5 3h7L14 10.5h-4L8.5 3Z" {...p}/><path d="M10 10.5l-2 10h8l-2-10" {...p}/><path d="M9.5 7h5" {...p} strokeWidth="1"/><path d="M10.5 15.5Q12 17.5 13.5 15.5" {...p} strokeWidth="1"/></svg>;
    case "stress":      return <svg {...s}><path d="M6 3.5Q12 2 14 7.5Q16 13 12 16Q8.5 19 12 21.5" {...p}/><path d="M4 9Q6 8 8.5 9" {...p} strokeWidth="1"/><path d="M14.5 12.5Q16.5 11.5 19 12.5" {...p} strokeWidth="1"/></svg>;
    case "gut":         return <svg {...s}><path d="M12 3C8 3 5 6 5 9.5C5 12.5 7 14.5 9.5 14.5C11.5 14.5 13 13 13 11C13 9 14 8 15.5 8C17 8 18 9 18 11C18 14.5 15.5 18 12 21" {...p}/></svg>;
    case "supplements": return <svg {...s}><path d="M8 9.5C8 7 9.8 5 12 5C14.2 5 16 7 16 9.5V14.5C16 17 14.2 19 12 19C9.8 19 8 17 8 14.5V9.5Z" {...p}/><line x1="8" y1="12" x2="16" y2="12" {...p} strokeWidth="1.2"/></svg>;
    case "mindfulness": return <svg {...s}><path d="M12 12Q9 9 9 6.5C9 4.6 10.3 3 12 3C13.7 3 15 4.6 15 6.5C15 9 12 12 12 12Z" {...p}/><path d="M12 12Q15.5 10 18 11.5C19.5 12.5 19 14 18 15C16 16.5 12 15.5 12 15.5" {...p} strokeWidth="1.1"/><path d="M12 12Q8.5 10 6 11.5C4.5 12.5 5 14 6 15C8 16.5 12 15.5 12 15.5" {...p} strokeWidth="1.1"/><line x1="12" y1="15.5" x2="12" y2="21" {...p} strokeWidth="1.1"/></svg>;
    case "light":       return <svg {...s}><circle cx="12" cy="12" r="4" {...p}/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8" {...p} strokeWidth="1.2"/></svg>;
    case "icebath":     return <svg {...s}><path d="M12 3L7 12C5.5 14.5 6 18 9 19.5S15 19.5 17 17S16 9 12 3Z" {...p}/><line x1="12" y1="9" x2="12" y2="17" {...p} strokeWidth="0.9"/><line x1="9.2" y1="11" x2="14.8" y2="15" {...p} strokeWidth="0.9"/><line x1="14.8" y1="11" x2="9.2" y2="15" {...p} strokeWidth="0.9"/></svg>;
    case "hormones":    return <svg {...s}><circle cx="12" cy="4.5" r="2.5" {...p}/><circle cx="5.5" cy="17" r="2.5" {...p}/><circle cx="18.5" cy="17" r="2.5" {...p}/><path d="M11 6.8L7.2 14.6" {...p} strokeWidth="1.1"/><path d="M13 6.8L16.8 14.6" {...p} strokeWidth="1.1"/><path d="M8 17h8" {...p} strokeWidth="1.1"/></svg>;
    case "longevity":   return <svg {...s}><path d="M9 3Q12 6 9 9Q6 12 9 15Q12 18 9 21" {...p} strokeWidth="1.2"/><path d="M15 3Q12 6 15 9Q18 12 15 15Q12 18 15 21" {...p} strokeWidth="1.2"/><line x1="9" y1="6" x2="15" y2="6" {...p} strokeWidth="0.9"/><line x1="9" y1="12" x2="15" y2="12" {...p} strokeWidth="0.9"/><line x1="9" y1="18" x2="15" y2="18" {...p} strokeWidth="0.9"/></svg>;
    default: return null;
  }
}

// ─── EXPLORE GRID ────────────────────────────────────────────────────────────
function ExploreGrid() {
  const [expanded, setExpanded] = useState(null);
  const [studyMap, setStudyMap] = useState({});
  const exp = EXPLORE_CATEGORIES.find(c => c.id === expanded);

  useEffect(() => {
    if (!expanded || studyMap[expanded]?.loaded) return;
    const cfg = EXPLORE_QUERIES[expanded];
    if (!cfg) return;
    setStudyMap(prev => ({ ...prev, [expanded]: { studies:[], loading:true, loaded:false } }));
    fetchPubMed(cfg.q, 15, cfg.fbs)
      .then(data => setStudyMap(prev => ({ ...prev, [expanded]: { studies:data.studies||[], loading:false, loaded:true } })))
      .catch(() => setStudyMap(prev => ({ ...prev, [expanded]: { studies:[], loading:false, loaded:true } })));
  }, [expanded]);

  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
        {EXPLORE_CATEGORIES.map((cat, i) => {
          const isFirst = i === 0;
          const isWide = cat.colSpan === 2;
          const isActive = cat.id === expanded;

          if (isFirst) {
            return (
              <div key={cat.id} onClick={() => setExpanded(isActive ? null : cat.id)}
                style={{ gridColumn:"span 2", background:`linear-gradient(145deg,${C.green} 0%,${C.greenDark} 100%)`, borderRadius:16, padding:"20px 20px 18px", cursor:"pointer", position:"relative", overflow:"hidden", border:`1px solid ${isActive ? C.gold : "transparent"}` }}>
                <div style={{ position:"absolute", top:-10, right:-10, opacity:0.12, pointerEvents:"none" }}>
                  <BotanicalBranch width={130}/>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
                  <div style={{ width:40, height:40, borderRadius:11, backgroundColor:"rgba(201,169,110,0.2)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <CategoryIcon id={cat.id} size={22} color={C.gold}/>
                  </div>
                  <div>
                    <p style={{ fontFamily:serif, fontSize:18, fontWeight:700, color:"#FDFAF5", margin:0, lineHeight:1.1 }}>{cat.title}</p>
                    <p style={{ fontSize:11, color:"rgba(253,250,245,0.6)", margin:0 }}>{cat.subtitle}</p>
                  </div>
                  <div style={{ marginLeft:"auto", width:18, height:18, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ transform:isActive?"rotate(180deg)":"none", transition:"transform 0.2s" }}>
                      <path d="M3 5l4 4 4-4" stroke="rgba(253,250,245,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
                <p style={{ fontSize:12, color:"rgba(253,250,245,0.7)", lineHeight:1.65, margin:0, fontFamily:sans }}>
                  {cat.guide.split(". ").slice(0,2).join(". ")}.
                </p>
              </div>
            );
          }

          if (isWide) {
            return (
              <div key={cat.id} onClick={() => setExpanded(isActive ? null : cat.id)}
                style={{ gridColumn:"span 2", ...card, padding:"14px 16px", cursor:"pointer", display:"flex", alignItems:"center", gap:13, borderTop: isActive ? `2px solid ${C.green}` : `1px solid ${C.border}`, transition:"border-color 0.15s" }}>
                <div style={{ width:40, height:40, borderRadius:11, backgroundColor: isActive ? C.greenLight : C.card, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"background 0.15s" }}>
                  <CategoryIcon id={cat.id} size={21} color={isActive ? C.green : C.muted}/>
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontFamily:serif, fontSize:14, fontWeight:700, color: isActive ? C.green : C.muted, margin:"0 0 2px", lineHeight:1.2 }}>{cat.title}</p>
                  <p style={{ fontSize:11, color:C.muted, margin:0, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", fontFamily:sans }}>{cat.subtitle}</p>
                </div>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink:0, transform:isActive?"rotate(180deg)":"none", transition:"transform 0.2s" }}>
                  <path d="M3 5l4 4 4-4" stroke={C.muted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            );
          }

          return (
            <div key={cat.id} onClick={() => setExpanded(isActive ? null : cat.id)}
              style={{ gridColumn:"span 1", ...card, padding:"14px 12px", cursor:"pointer", display:"flex", flexDirection:"column", gap:7, minHeight:108, borderTop: isActive ? `2px solid ${C.green}` : `1px solid ${C.border}`, transition:"border-color 0.15s" }}>
              <div style={{ width:34, height:34, borderRadius:9, backgroundColor: isActive ? C.greenLight : C.card, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <CategoryIcon id={cat.id} size={18} color={isActive ? C.green : C.muted}/>
              </div>
              <p style={{ fontFamily:serif, fontSize:13, fontWeight:700, color: isActive ? C.green : C.muted, margin:0, lineHeight:1.2 }}>{cat.title}</p>
              <p style={{ fontSize:10, color:C.muted, margin:0, lineHeight:1.45, fontFamily:sans }}>{cat.subtitle}</p>
            </div>
          );
        })}
      </div>

      {exp && (
        <div style={{ marginTop:10, backgroundColor:C.bg, borderRadius:14, border:`1px solid ${C.border}`, borderTop:`2px solid ${C.green}`, padding:"18px 18px 16px", animation:"fadeIn 0.2s ease" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
            <div style={{ width:32, height:32, borderRadius:8, backgroundColor:C.greenLight, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <CategoryIcon id={exp.id} size={17} color={C.green}/>
            </div>
            <p style={{ fontFamily:serif, fontSize:16, fontWeight:700, color:C.green, margin:0 }}>{exp.title}</p>
            <button onClick={() => setExpanded(null)} style={{ marginLeft:"auto", background:"none", border:"none", color:C.muted, fontSize:18, cursor:"pointer", lineHeight:1, padding:"0 2px" }}>{"\u00D7"}</button>
          </div>
          <p style={{ fontSize:13, color:C.text, lineHeight:1.82, margin:"0 0 14px", fontFamily:sans }}>{exp.guide}</p>
          <div style={{ padding:"11px 14px", backgroundColor:C.card, borderRadius:10, borderLeft:`2px solid ${C.green}` }}>
            <p style={{ fontSize:9, fontWeight:700, color:C.green, textTransform:"uppercase", letterSpacing:"0.1em", margin:"0 0 4px", fontFamily:sans }}>Protocol</p>
            <p style={{ fontSize:12, color:C.text, lineHeight:1.72, margin:0, fontFamily:sans }}>{exp.protocol}</p>
          </div>

          {/* PubMed research */}
          {studyMap[exp.id]?.loading && (
            <div style={{ marginTop:10, padding:"11px 14px", backgroundColor:C.card, borderRadius:10, border:`1px solid ${C.border}` }}>
              <p style={{ fontSize:11, color:C.muted, margin:0, fontStyle:"italic", fontFamily:sans }}>Loading research.</p>
            </div>
          )}
          {!studyMap[exp.id]?.loading && studyMap[exp.id]?.studies?.length > 0 && (
            <div style={{ marginTop:10, padding:"13px 14px", backgroundColor:C.card, borderRadius:10, border:`1px solid ${C.border}` }}>
              <p style={{ fontSize:9, fontWeight:700, color:C.green, textTransform:"uppercase", letterSpacing:"0.1em", margin:"0 0 10px", fontFamily:sans }}>
                {"\uD83D\uDD2C"} Research {"\u00B7"} {studyMap[exp.id].studies.length} studies
              </p>
              {studyMap[exp.id].studies.map((s, i) => {
                const notLast = i < studyMap[exp.id].studies.length - 1;
                return (
                  <a key={s.id||i} href={s.url||`https://pubmed.ncbi.nlm.nih.gov/${s.id}/`} target="_blank" rel="noopener noreferrer"
                    style={{ display:"block", textDecoration:"none", paddingBottom:notLast?10:0, marginBottom:notLast?10:0, borderBottom:notLast?`1px solid ${C.border}`:"none" }}>
                    <p style={{ fontSize:12, color:C.text, margin:"0 0 3px", lineHeight:1.5, fontFamily:sans }}>{s.title}</p>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:8 }}>
                      <p style={{ fontSize:10, color:C.muted, margin:0, flex:1, lineHeight:1.4, fontFamily:sans }}>
                        {[s.authors,s.journal,s.year].filter(Boolean).join(" \u00B7 ")}
                      </p>
                      <span style={{ fontSize:10, color:C.green, fontWeight:600, flexShrink:0, fontFamily:sans }}>{"\u2197"} PubMed</span>
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── READING LIST ────────────────────────────────────────────────────────────
function ReadingList() {
  return (
    <div style={{ marginBottom:8 }}>
      {BOOK_GROUPS.map(group => (
        <div key={group.category} style={{ marginBottom:20 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, margin:"0 0 9px 1px" }}>
            <span style={{ fontSize:9, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.1em", fontFamily:sans, whiteSpace:"nowrap" }}>{group.category}</span>
            <div style={{ flex:1, height:1, backgroundColor:C.border }}/>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            {group.books.map(book => (
              <div key={book.id} style={{ gridColumn:book.colSpan===2?"span 2":"span 1", ...card, border:`1px solid ${book.colSpan===2 ? C.green+"40" : C.border}`, padding:book.colSpan===2?"15px 17px":"13px 13px", display:"flex", flexDirection:"column", gap:5 }}>
                <span style={{ display:"inline-block", fontSize:9, fontWeight:700, color:C.green, textTransform:"uppercase", letterSpacing:"0.08em", backgroundColor:C.greenLight, borderRadius:4, padding:"2px 6px", alignSelf:"flex-start", fontFamily:sans }}>{group.category}</span>
                <p style={{ fontFamily:serif, fontSize:book.colSpan===2?15:13, fontWeight:700, color:C.text, margin:0, lineHeight:1.25 }}>{book.title}</p>
                <p style={{ fontSize:11, color:C.muted, margin:0, fontStyle:"italic", fontFamily:serif }}>{book.author}</p>
                <p style={{ fontSize:11, color:C.muted, margin:0, lineHeight:1.55, fontFamily:sans }}>{book.desc}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── LIBRARY DATA ────────────────────────────────────────────────────────────
const LEVEL_BADGE = {
  beginner:     { bg:"#D1FAE5", c:"#065F46" },
  intermediate: { bg:"#FEF3C7", c:"#92400E" },
  advanced:     { bg:"#FDECEA", c:"#991B1B" },
};

const CAT_COLOR = {
  "Sleep":{"bg":"#1E2D4A","fg":"#94B4D4"}, "Longevity":{"bg":"#1E3A2A","fg":"#80B890"},
  "Nutrition":{"bg":"#3A2010","fg":"#C49060"}, "Breathwork":{"bg":"#1A3A4A","fg":"#88C4D8"},
  "Biohacking":{"bg":"#142A1E","fg":"#70AA80"}, "Exercise":{"bg":"#2A1E0E","fg":"#A87848"},
  "Mental Health":{"bg":"#281A36","fg":"#A898C8"}, "Gut Health":{"bg":"#281A0E","fg":"#A87040"},
  "Mindfulness":{"bg":"#2E1A36","fg":"#B898D0"}, "Behavior Change":{"bg":"#1A2E3A","fg":"#78A8C0"},
  "default":{"bg":"#1F2E26","fg":"#B99A5B"},
};

function StarRating({ rating }) {
  const full = Math.floor(rating || 0);
  const half = ((rating || 0) % 1) >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return (
    <span style={{ fontSize:11, letterSpacing:1 }}>
      <span style={{ color:C.gold }}>{"\u2605".repeat(full)}</span>
      <span style={{ color:C.gold, fontSize:10 }}>{half ? "\u00BD" : ""}</span>
      <span style={{ color:C.border }}>{"\u2606".repeat(empty)}</span>
      <span style={{ color:C.muted, fontSize:10, marginLeft:4, fontFamily:sans }}>{rating}</span>
    </span>
  );
}

const LIBRARY_ARTICLE_QUERIES = {
  circadian: { label:"Circadian",  q:"circadian rhythm health outcomes",          fbs:["chronobiology health","circadian clock biology"] },
  sleep:     { label:"Sleep",      q:"sleep quality intervention humans",          fbs:["sleep health adults","sleep optimisation RCT"] },
  longevity: { label:"Longevity",  q:"longevity aging intervention lifestyle",     fbs:["healthspan aging","lifespan extension human"] },
  nutrition: { label:"Nutrition",  q:"dietary pattern healthspan meta-analysis",   fbs:["Mediterranean diet mortality","whole food nutrition"] },
  cold:      { label:"Cold & Heat",q:"cold water immersion health benefits human", fbs:["sauna health mortality","heat therapy benefits"] },
  fasting:   { label:"Fasting",    q:"intermittent fasting clinical trial humans", fbs:["time restricted eating insulin","autophagy fasting"] },
};

const SOURCE_BADGE={
  pubmed:          {label:"PubMed",          bg:"#EFF6FF",fg:"#2563EB"},
  semanticscholar: {label:"Semantic Scholar", bg:"#F0FDF4",fg:"#16A34A"},
  openalex:        {label:"OpenAlex",         bg:"#FAF5FF",fg:"#9333EA"},
};

function dedupArticles(arr){
  const seen=new Set();
  return arr.filter(a=>{
    const key=a.doi||(a.title||'').toLowerCase().replace(/[^a-z0-9]/g,'').slice(0,50);
    if(!key||seen.has(key))return false;
    seen.add(key);
    return true;
  });
}

// ─── LIBRARY MODAL ───────────────────────────────────────────────────────────
function LibraryModal({ onClose }) {
  const [tab,     setTab]     = useState("books");
  const [books,   setBooks]   = useState([]);
  const [concepts,setConcepts]= useState([]);
  const [pods,    setPods]    = useState([]);
  const [busy,    setBusy]    = useState({ books:true, concepts:true, podcasts:true });
  const [bookSearch,setBookSearch]=useState(""); const [bookCat,setBookCat]=useState("All"); const [bookLevel,setBookLevel]=useState("All");
  const [conSearch,setConSearch]=useState(""); const [conLevel,setConLevel]=useState("All"); const [conCat,setConCat]=useState("All"); const [expanded,setExpanded]=useState(null);
  const [podSearch,setPodSearch]=useState(""); const [podCat,setPodCat]=useState("All");
  const [artPubmed,setArtPubmed]=useState([]); const [artSS,setArtSS]=useState([]); const [artOA,setArtOA]=useState([]);
  const [artBusy,setArtBusy]=useState({pubmed:false,ss:false,oa:false}); const [artExamine,setArtExamine]=useState(null);
  const [artCat,setArtCat]=useState("circadian"); const [artInput,setArtInput]=useState(""); const [artQuery,setArtQuery]=useState("");
  const [gbResults,setGbResults]=useState([]); const [gbLoading,setGbLoading]=useState(false);
  const [itunesResults,setItunesResults]=useState([]); const [itunesLoading,setItunesLoading]=useState(false);

  useEffect(()=>{
    Promise.all([
      fetch("/api/library/books").then(r=>r.json()).catch(()=>[]),
      fetch("/api/library/concepts").then(r=>r.json()).catch(()=>[]),
      fetch("/api/library/podcasts").then(r=>r.json()).catch(()=>[]),
    ]).then(([b,c,p])=>{
      setBooks(Array.isArray(b)?b:[]); setConcepts(Array.isArray(c)?c:[]); setPods(Array.isArray(p)?p:[]);
      setBusy({books:false,concepts:false,podcasts:false});
    });
  },[]);

  useEffect(()=>{
    if(tab!=="articles") return;
    const q=artQuery||LIBRARY_ARTICLE_QUERIES[artCat]?.q; if(!q) return;
    const fbs=artQuery?[]:(LIBRARY_ARTICLE_QUERIES[artCat]?.fbs||[]);
    setArtPubmed([]); setArtSS([]); setArtOA([]);
    setArtBusy({pubmed:true,ss:true,oa:true});
    const qLow=q.toLowerCase();
    const SUPP=['magnesium','vitamin d','vitamin-d','omega-3','omega3','zinc','nad+','nmn','ashwagandha','creatine','melatonin','vitamin c','vitamin b12','iron','calcium','collagen','quercetin','berberine','resveratrol','coq10','lions mane'];
    const suppHit=SUPP.find(s=>qLow.includes(s));
    setArtExamine(suppHit?suppHit.replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,''):null);
    fetchPubMed(q,10,fbs)
      .then(d=>{setArtPubmed((d.studies||[]).map(a=>({...a,source:'pubmed'})));setArtBusy(p=>({...p,pubmed:false}));})
      .catch(()=>setArtBusy(p=>({...p,pubmed:false})));
    fetch('/api/semantic-scholar?q='+encodeURIComponent(q))
      .then(r=>r.ok?r.json():[]).then(d=>{setArtSS(Array.isArray(d)?d:[]);setArtBusy(p=>({...p,ss:false}));})
      .catch(()=>setArtBusy(p=>({...p,ss:false})));
    fetch('/api/openalex?q='+encodeURIComponent(q))
      .then(r=>r.ok?r.json():[]).then(d=>{setArtOA(Array.isArray(d)?d:[]);setArtBusy(p=>({...p,oa:false}));})
      .catch(()=>setArtBusy(p=>({...p,oa:false})));
  },[tab,artCat,artQuery]);

  useEffect(()=>{
    if(tab!=="books") return;
    if(bookSearch.length<3){setGbResults([]);return;}
    const t=setTimeout(()=>{
      setGbLoading(true);
      fetch('/api/google-books?q='+encodeURIComponent(bookSearch))
        .then(r=>r.ok?r.json():[]).then(d=>{setGbResults(Array.isArray(d)?d:[]);setGbLoading(false);})
        .catch(()=>setGbLoading(false));
    },700);
    return ()=>clearTimeout(t);
  },[tab,bookSearch]);

  const fBooks=books.filter(b=>{const q=bookSearch.toLowerCase();const ok=!q||[b.title,b.author,b.description,...(b.tags||[])].some(s=>s?.toLowerCase().includes(q));return ok&&(bookCat==="All"||b.category===bookCat)&&(bookLevel==="All"||b.level===bookLevel);});
  const fCons=concepts.filter(c=>{const q=conSearch.toLowerCase();const ok=!q||[c.title,c.summary,c.body,...(c.tags||[])].some(s=>s?.toLowerCase().includes(q));return ok&&(conLevel==="All"||c.level===conLevel)&&(conCat==="All"||c.category===conCat);});
  const fPods=pods.filter(p=>{const q=podSearch.toLowerCase();const ok=!q||[p.title,p.host,p.description,...(p.tags||[])].some(s=>s?.toLowerCase().includes(q));return ok&&(podCat==="All"||p.category===podCat);});
  const bookCats=["All",...new Set(books.map(b=>b.category).filter(Boolean))].sort();
  const conCats=["All",...new Set(concepts.map(c=>c.category).filter(Boolean))].sort();
  const podCats=["All",...new Set(pods.map(p=>p.category).filter(Boolean))].sort();
  const artAnyBusy=artBusy.pubmed||artBusy.ss||artBusy.oa;
  const artLoading=artAnyBusy;
  const articles=dedupArticles([...artPubmed,...artSS,...artOA]);
  const supabaseTitlesLC=new Set(fBooks.map(b=>b.title.toLowerCase()));
  const filteredGb=gbResults.filter(b=>!supabaseTitlesLC.has(b.title.toLowerCase()));
  const searchItunes=()=>{
    const q=podSearch||'nutrition health';
    setItunesLoading(true); setItunesResults([]);
    fetch('/api/itunes-podcasts?q='+encodeURIComponent(q))
      .then(r=>r.ok?r.json():[]).then(d=>{setItunesResults(Array.isArray(d)?d:[]);setItunesLoading(false);})
      .catch(()=>setItunesLoading(false));
  };
  const LEVELS=["All","beginner","intermediate","advanced"];
  const colFor=b=>CAT_COLOR[b.category]||CAT_COLOR.default;
  const initials=t=>t.split(" ").slice(0,2).map(w=>w[0]?.toUpperCase()||"").join("");
  const Skel=()=>(<div style={{padding:"20px 0"}}>{[90,70,80,60,75].map((w,i)=><div key={i} style={{height:11,width:`${w}%`,backgroundColor:C.border,borderRadius:4,marginBottom:12,opacity:0.4}}/>)}<p style={{fontSize:11,color:C.muted,fontFamily:sans,textAlign:"center",fontStyle:"italic"}}>Loading from database{"\u2026"}</p></div>);
  const Pills=({options,value,onChange})=>(<div style={{display:"flex",gap:5,overflowX:"auto",paddingBottom:4,flexShrink:0}}>{options.map(opt=>{const active=value===opt;const badge=LEVEL_BADGE[opt];return(<button key={opt} onClick={()=>onChange(opt)} style={{padding:"4px 11px",borderRadius:20,border:`1px solid ${active?(badge?.c||C.green):C.border}`,backgroundColor:active?(badge?.bg||C.greenLight):"transparent",color:active?(badge?.c||C.green):C.muted,fontSize:10,fontWeight:active?700:400,cursor:"pointer",fontFamily:sans,whiteSpace:"nowrap",flexShrink:0}}>{opt==="All"?"All":opt.charAt(0).toUpperCase()+opt.slice(1)}</button>);})}</div>);
  const SBar=({value,onChange,placeholder})=>(<div style={{position:"relative",marginBottom:10}}><input type="text" placeholder={placeholder} value={value} onChange={e=>onChange(e.target.value)} style={{width:"100%",padding:"9px 32px 9px 34px",borderRadius:10,border:`1px solid ${C.border}`,backgroundColor:C.card,fontSize:12,fontFamily:sans,color:C.text,outline:"none",boxSizing:"border-box"}}/><svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}}><circle cx="5.5" cy="5.5" r="4" stroke={C.muted} strokeWidth="1.3"/><path d="M9 9l2 2" stroke={C.muted} strokeWidth="1.3" strokeLinecap="round"/></svg>{value&&<button onClick={()=>onChange("")} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:C.muted,fontSize:15,cursor:"pointer",lineHeight:1,padding:0}}>x</button>}</div>);
  const TABS=[{id:"books",icon:"\uD83D\uDCDA",label:"Books"},{id:"concepts",icon:"\uD83E\uDDE0",label:"Concepts"},{id:"podcasts",icon:"\uD83C\uDF99\uFE0F",label:"Podcasts"},{id:"articles",icon:"\uD83D\uDCF0",label:"Articles"}];

  return (
    <div style={{position:"fixed",inset:0,backgroundColor:"rgba(14,28,20,0.88)",zIndex:400,display:"flex",flexDirection:"column"}}>
      <div style={{flex:1,backgroundColor:C.card,display:"flex",flexDirection:"column",animation:"slideUp 0.28s ease",overflowY:"hidden"}}>
        <div style={{padding:"18px 20px 0",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
            <div>
              <p style={{fontFamily:serif,fontSize:22,fontWeight:700,color:C.green,margin:0,letterSpacing:"-0.01em"}}>{"\u2726"} Library</p>
              <p style={{fontSize:11,color:C.muted,margin:"2px 0 0",fontFamily:sans}}>Biohacking knowledge collection</p>
            </div>
            <button onClick={onClose} style={{width:34,height:34,borderRadius:"50%",border:`1px solid ${C.border}`,backgroundColor:"transparent",color:C.muted,fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1}}>x</button>
          </div>
          <div style={{display:"flex",borderBottom:`2px solid ${C.border}`,gap:0}}>
            {TABS.map(t=>(
              <button key={t.id} onClick={()=>{setTab(t.id);setExpanded(null);}}
                style={{flex:1,padding:"10px 4px",border:"none",borderBottom:tab===t.id?`2px solid ${C.green}`:"2px solid transparent",marginBottom:-2,backgroundColor:"transparent",color:tab===t.id?C.green:C.muted,fontSize:11,fontWeight:tab===t.id?700:400,cursor:"pointer",fontFamily:sans,transition:"color 0.15s"}}>
                <span style={{display:"block",fontSize:15,lineHeight:1,marginBottom:3}}>{t.icon}</span>{t.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"16px 20px 48px"}}>

          {tab==="books"&&(
            <div>
              <SBar value={bookSearch} onChange={setBookSearch} placeholder="Search title, author?"/>
              <div style={{marginBottom:6}}><Pills options={LEVELS} value={bookLevel} onChange={setBookLevel}/></div>
              <div style={{display:"flex",gap:5,marginBottom:14,overflowX:"auto",paddingBottom:4}}>{bookCats.map(cat=>(<button key={cat} onClick={()=>setBookCat(cat)} style={{padding:"4px 11px",borderRadius:20,border:`1px solid ${bookCat===cat?C.green:C.border}`,backgroundColor:bookCat===cat?C.green:"transparent",color:bookCat===cat?"#FDFAF5":C.muted,fontSize:10,fontWeight:bookCat===cat?700:400,cursor:"pointer",fontFamily:sans,whiteSpace:"nowrap",flexShrink:0}}>{cat}</button>))}</div>
              {busy.books?<Skel/>:(
                <>{/* books list */}
                  {fBooks.map((b,i)=>{const col=colFor(b);return(
                    <div key={b.id} style={{display:"flex",gap:14,paddingBottom:20,marginBottom:20,borderBottom:i<fBooks.length-1?`1px solid ${C.border}`:"none"}}>
                      <div style={{width:52,height:70,borderRadius:6,backgroundColor:col.bg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:"2px 3px 10px rgba(0,0,0,0.2)",borderLeft:`3px solid ${col.fg}44`}}>
                        <span style={{fontFamily:serif,fontSize:14,fontWeight:700,color:col.fg,letterSpacing:"-0.03em"}}>{initials(b.title)}</span>
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:"flex",gap:5,marginBottom:4,flexWrap:"wrap",alignItems:"center"}}>
                          {b.level&&<span style={{fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:8,fontFamily:sans,backgroundColor:LEVEL_BADGE[b.level]?.bg||C.bg,color:LEVEL_BADGE[b.level]?.c||C.muted}}>{b.level.charAt(0).toUpperCase()+b.level.slice(1)}</span>}
                          {b.year&&<span style={{fontSize:9,color:C.muted,fontFamily:sans}}>{b.year}</span>}
                        </div>
                        <p style={{fontFamily:serif,fontSize:14,fontWeight:700,color:C.green,margin:"0 0 2px",lineHeight:1.3}}>{b.title}</p>
                        <p style={{fontSize:12,color:C.muted,margin:"0 0 4px",fontFamily:serif,fontStyle:"italic"}}>{b.author}</p>
                        {b.rating&&<StarRating rating={b.rating}/>}
                        <p style={{fontSize:12,color:C.text,lineHeight:1.7,margin:"6px 0 8px",fontFamily:sans}}>{b.description}</p>
                        {b.key_takeaway&&<p style={{fontSize:11,color:C.green,fontFamily:sans,fontStyle:"italic",margin:"0 0 10px",padding:"8px 12px",backgroundColor:C.greenLight,borderRadius:8,lineHeight:1.6}}>{"\uD83D\uDCA1"} {b.key_takeaway}</p>}
                      </div>
                    </div>
                  );})}
                </>
              )}
              {bookSearch.length>=3&&(
                <div style={{marginTop:24}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
                    <div style={{flex:1,height:1,backgroundColor:C.border}}/>
                    <span style={{fontSize:10,color:C.muted,fontFamily:sans,whiteSpace:"nowrap",padding:"0 8px"}}>From Google Books</span>
                    <div style={{flex:1,height:1,backgroundColor:C.border}}/>
                  </div>
                  {gbLoading&&<div style={{textAlign:"center",padding:"16px 0"}}><p style={{fontSize:11,color:C.muted,fontFamily:sans,fontStyle:"italic"}}>Searching Google Books{"…"}</p></div>}
                  {!gbLoading&&filteredGb.map((b,i)=>(
                    <div key={b.id} style={{display:"flex",gap:14,paddingBottom:18,marginBottom:18,borderBottom:i<filteredGb.length-1?`1px solid ${C.border}`:"none"}}>
                      {b.cover?(<img src={b.cover} alt={b.title} style={{width:52,height:70,objectFit:"cover",borderRadius:6,flexShrink:0,boxShadow:"2px 3px 10px rgba(0,0,0,0.2)"}}/>):(<div style={{width:52,height:70,borderRadius:6,backgroundColor:C.greenLight,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{fontFamily:serif,fontSize:14,fontWeight:700,color:C.green}}>{initials(b.title)}</span></div>)}
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:"flex",gap:5,marginBottom:4,alignItems:"center"}}>
                          <span style={{fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:8,fontFamily:sans,backgroundColor:"#F0FDF4",color:"#16A34A"}}>Google Books</span>
                          {b.year&&<span style={{fontSize:9,color:C.muted,fontFamily:sans}}>{b.year}</span>}
                        </div>
                        <p style={{fontFamily:serif,fontSize:14,fontWeight:700,color:C.green,margin:"0 0 2px",lineHeight:1.3}}>{b.title}</p>
                        <p style={{fontSize:12,color:C.muted,margin:"0 0 4px",fontFamily:serif,fontStyle:"italic"}}>{b.author}</p>
                        {b.description&&<p style={{fontSize:12,color:C.text,lineHeight:1.7,margin:0,fontFamily:sans}}>{b.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab==="concepts"&&(
            <div>
              <SBar value={conSearch} onChange={setConSearch} placeholder="Search concepts, tags?"/>
              <div style={{marginBottom:8}}><Pills options={LEVELS} value={conLevel} onChange={setConLevel}/></div>
              <div style={{display:"flex",gap:5,marginBottom:14,overflowX:"auto",paddingBottom:4}}>{conCats.map(cat=>(<button key={cat} onClick={()=>setConCat(cat)} style={{padding:"4px 11px",borderRadius:20,border:`1px solid ${conCat===cat?C.green:C.border}`,backgroundColor:conCat===cat?C.green:"transparent",color:conCat===cat?"#FDFAF5":C.muted,fontSize:10,fontWeight:conCat===cat?700:400,cursor:"pointer",fontFamily:sans,whiteSpace:"nowrap",flexShrink:0}}>{cat}</button>))}</div>
              {busy.concepts?<Skel/>:(
                <>{/* concepts list */}
                  {fCons.map((c,i)=>{const isOpen=expanded===c.id;const badge=LEVEL_BADGE[c.level]||{bg:C.bg,c:C.muted};return(
                    <div key={c.id} style={{paddingTop:i>0?14:0,paddingBottom:14,borderBottom:i<fCons.length-1?`1px solid ${C.border}`:"none"}}>
                      <div onClick={()=>setExpanded(isOpen?null:c.id)} style={{cursor:"pointer"}}>
                        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5,flexWrap:"wrap"}}>
                          <span style={{fontSize:9,fontWeight:700,padding:"2px 8px",borderRadius:8,fontFamily:sans,backgroundColor:badge.bg,color:badge.c}}>{c.level?.charAt(0).toUpperCase()+(c.level?.slice(1)||"")}</span>
                          <span style={{fontSize:9,color:C.green,backgroundColor:C.greenLight,padding:"2px 8px",borderRadius:8,fontFamily:sans}}>{c.category}</span>
                          <span style={{marginLeft:"auto",fontSize:16,color:C.muted,transform:isOpen?"rotate(180deg)":"rotate(0deg)",transition:"transform 0.2s"}}>{"\u25BE"}</span>
                        </div>
                        <p style={{fontFamily:serif,fontSize:14,fontWeight:700,color:C.green,margin:"0 0 4px"}}>{c.title}</p>
                        <p style={{fontSize:12,color:C.text,lineHeight:1.7,margin:0,fontFamily:sans}}>{c.summary}</p>
                      </div>
                      {isOpen&&(
                        <div style={{marginTop:12,animation:"fadeIn 0.18s ease"}}>
                          <p style={{fontSize:12,color:C.text,lineHeight:1.8,fontFamily:sans,margin:"0 0 12px"}}>{c.body}</p>
                          {c.key_points?.length>0&&(
                            <div style={{backgroundColor:C.greenLight,borderRadius:10,padding:"10px 14px"}}>
                              <p style={{fontSize:10,fontWeight:700,color:C.green,textTransform:"uppercase",letterSpacing:"0.08em",margin:"0 0 8px",fontFamily:sans}}>Key Points</p>
                              {c.key_points.map((pt,j)=><p key={j} style={{fontSize:12,color:C.text,margin:"0 0 5px",fontFamily:sans,lineHeight:1.6,paddingLeft:12,position:"relative"}}><span style={{position:"absolute",left:0,color:C.green}}>{"\u25B8"}</span>{pt}</p>)}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );})}
                </>
              )}
            </div>
          )}

          {tab==="podcasts"&&(
            <div>
              <SBar value={podSearch} onChange={setPodSearch} placeholder="Search podcasts?"/>
              <div style={{display:"flex",gap:5,marginBottom:14,overflowX:"auto",paddingBottom:4}}>{podCats.map(cat=>(<button key={cat} onClick={()=>setPodCat(cat)} style={{padding:"4px 11px",borderRadius:20,border:`1px solid ${podCat===cat?C.green:C.border}`,backgroundColor:podCat===cat?C.green:"transparent",color:podCat===cat?"#FDFAF5":C.muted,fontSize:10,fontWeight:podCat===cat?700:400,cursor:"pointer",fontFamily:sans,whiteSpace:"nowrap",flexShrink:0}}>{cat}</button>))}</div>
              {busy.podcasts?<Skel/>:(
                <>{/* podcasts list */}
                  {fPods.map((pod,i)=>(
                    <div key={pod.id} style={{paddingBottom:20,marginBottom:20,borderBottom:i<fPods.length-1?`1px solid ${C.border}`:"none"}}>
                      <div style={{display:"flex",gap:12,marginBottom:10}}>
                        <div style={{width:46,height:46,borderRadius:13,backgroundColor:C.greenLight,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:22}}>{"\uD83C\uDF99\uFE0F"}</div>
                        <div style={{flex:1,minWidth:0}}>
                          <p style={{fontFamily:serif,fontSize:15,fontWeight:700,color:C.green,margin:"0 0 2px",lineHeight:1.2}}>{pod.title}</p>
                          <p style={{fontSize:11,color:C.muted,margin:"0 0 4px",fontFamily:serif,fontStyle:"italic"}}>{pod.host}</p>
                          <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                            <span style={{fontSize:9,color:C.muted,fontFamily:sans,backgroundColor:C.bg,border:`1px solid ${C.border}`,padding:"1px 7px",borderRadius:10}}>{pod.category}</span>
                            {pod.frequency&&<span style={{fontSize:9,color:C.muted,fontFamily:sans,backgroundColor:C.bg,border:`1px solid ${C.border}`,padding:"1px 7px",borderRadius:10}}>{pod.frequency}</span>}
                            {pod.avg_duration&&<span style={{fontSize:9,color:C.muted,fontFamily:sans,backgroundColor:C.bg,border:`1px solid ${C.border}`,padding:"1px 7px",borderRadius:10}}>~{pod.avg_duration}/ep</span>}
                          </div>
                        </div>
                      </div>
                      <p style={{fontSize:12,color:C.text,lineHeight:1.72,margin:"0 0 8px",fontFamily:sans}}>{pod.description}</p>
                      {pod.top_episodes?.length>0&&(
                        <div style={{backgroundColor:C.bg,borderRadius:8,padding:"8px 12px",marginBottom:10}}>
                          <p style={{fontSize:9,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em",margin:"0 0 6px",fontFamily:sans}}>Top Episodes</p>
                          {pod.top_episodes.map((ep,j)=><p key={j} style={{fontSize:11,color:C.text,margin:"0 0 3px",fontFamily:sans}}>{"\u25B8"} {ep}</p>)}
                        </div>
                      )}
                      <div style={{display:"flex",gap:8}}>
                        {pod.spotify_url&&<a href={pod.spotify_url} target="_blank" rel="noopener noreferrer" style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:5,padding:"9px 0",backgroundColor:"#1DB954",color:"#fff",borderRadius:10,textDecoration:"none",fontSize:11,fontWeight:600,fontFamily:sans}}>{"\u266B"} Spotify</a>}
                        {pod.apple_url&&<a href={pod.apple_url} target="_blank" rel="noopener noreferrer" style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:5,padding:"9px 0",backgroundColor:"#7A3BB9",color:"#fff",borderRadius:10,textDecoration:"none",fontSize:11,fontWeight:600,fontFamily:sans}}>{"\uD83C\uDFA7"} Apple</a>}
                      </div>
                    </div>
                  ))}
                </>
              )}
              <div style={{marginTop:16,paddingTop:16,borderTop:`1px solid ${C.border}`}}>
                <button onClick={searchItunes} disabled={itunesLoading}
                  style={{width:"100%",padding:"11px",backgroundColor:itunesLoading?C.muted:C.green,color:"#FDFAF5",border:"none",borderRadius:10,fontSize:12,fontWeight:600,cursor:itunesLoading?"not-allowed":"pointer",fontFamily:sans,marginBottom:itunesResults.length?16:0}}>
                  {itunesLoading?"… Searching iTunes":"🎧 Search more podcasts"}
                </button>
                {itunesResults.map((pod,i)=>(
                  <div key={pod.id||i} style={{display:"flex",gap:12,paddingBottom:18,marginBottom:18,borderBottom:i<itunesResults.length-1?`1px solid ${C.border}`:"none"}}>
                    {pod.cover?(<img src={pod.cover} alt={pod.title} style={{width:56,height:56,objectFit:"cover",borderRadius:13,flexShrink:0}}/>):(<div style={{width:56,height:56,borderRadius:13,backgroundColor:C.greenLight,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:22}}>{"🎙️"}</div>)}
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",gap:5,marginBottom:4,alignItems:"center"}}>
                        <span style={{fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:8,fontFamily:sans,backgroundColor:"#F0F9FF",color:"#0369A1"}}>iTunes</span>
                        {pod.genre&&<span style={{fontSize:9,color:C.muted,fontFamily:sans,backgroundColor:C.bg,border:`1px solid ${C.border}`,padding:"1px 7px",borderRadius:10}}>{pod.genre}</span>}
                      </div>
                      <p style={{fontFamily:serif,fontSize:14,fontWeight:700,color:C.green,margin:"0 0 2px",lineHeight:1.2}}>{pod.title}</p>
                      <p style={{fontSize:11,color:C.muted,margin:"0 0 4px",fontFamily:serif,fontStyle:"italic"}}>{pod.host}</p>
                      {pod.description&&<p style={{fontSize:12,color:C.text,lineHeight:1.7,margin:"0 0 6px",fontFamily:sans}}>{pod.description.slice(0,200)}{pod.description.length>200?"…":""}</p>}
                      {pod.apple_url&&<a href={pod.apple_url} target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:4,padding:"6px 12px",backgroundColor:"#7A3BB9",color:"#fff",borderRadius:8,textDecoration:"none",fontSize:11,fontWeight:600,fontFamily:sans}}>{"🎧"} Apple Podcasts</a>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab==="articles"&&(
            <div>
              <form onSubmit={e=>{e.preventDefault();if(artInput.trim()){setArtQuery(artInput.trim());setArtCat("");}}} style={{display:"flex",gap:8,marginBottom:14}}>
                <div style={{position:"relative",flex:1}}>
                  <input type="text" placeholder="Search medical literature? (e.g. magnesium sleep)" value={artInput} onChange={e=>setArtInput(e.target.value)}
                    style={{width:"100%",padding:"9px 12px 9px 34px",borderRadius:10,border:`1px solid ${C.border}`,backgroundColor:C.card,fontSize:12,fontFamily:sans,color:C.text,outline:"none",boxSizing:"border-box"}}/>
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}}>
                    <circle cx="5.5" cy="5.5" r="4" stroke={C.muted} strokeWidth="1.3"/>
                    <path d="M9 9l2 2" stroke={C.muted} strokeWidth="1.3" strokeLinecap="round"/>
                  </svg>
                </div>
                <button type="submit" style={{padding:"9px 14px",backgroundColor:C.green,color:"#FDFAF5",border:"none",borderRadius:10,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:sans,flexShrink:0}}>Search</button>
              </form>
              {artQuery&&<button onClick={()=>{setArtQuery("");setArtInput("");setArtCat("circadian");}} style={{fontSize:10,color:C.muted,background:"none",border:`1px solid ${C.border}`,borderRadius:20,padding:"3px 10px",cursor:"pointer",fontFamily:sans,marginBottom:12}}>x Clear</button>}
              {!artQuery&&(
                <div style={{display:"flex",gap:6,marginBottom:16,overflowX:"auto",paddingBottom:4}}>
                  {Object.entries(LIBRARY_ARTICLE_QUERIES).map(([key,val])=>(
                    <button key={key} onClick={()=>setArtCat(key)}
                      style={{padding:"6px 14px",borderRadius:20,border:`1px solid ${artCat===key?C.green:C.border}`,backgroundColor:artCat===key?C.green:"transparent",color:artCat===key?"#FDFAF5":C.muted,fontSize:11,fontWeight:artCat===key?600:400,cursor:"pointer",fontFamily:sans,whiteSpace:"nowrap",flexShrink:0,transition:"background 0.15s"}}>
                      {val.label}
                    </button>
                  ))}
                </div>
              )}
              {(artBusy.pubmed||artBusy.ss||artBusy.oa)&&(
                <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>
                  {artBusy.pubmed&&<span style={{fontSize:10,fontFamily:sans,backgroundColor:"#EFF6FF",color:"#2563EB",padding:"4px 12px",borderRadius:10}}>PubMed{"\u2026"}</span>}
                  {artBusy.ss&&<span style={{fontSize:10,fontFamily:sans,backgroundColor:"#F0FDF4",color:"#16A34A",padding:"4px 12px",borderRadius:10}}>Semantic Scholar{"\u2026"}</span>}
                  {artBusy.oa&&<span style={{fontSize:10,fontFamily:sans,backgroundColor:"#FAF5FF",color:"#9333EA",padding:"4px 12px",borderRadius:10}}>OpenAlex{"\u2026"}</span>}
                </div>
              )}
              {artExamine&&(
                <div style={{padding:"14px 16px",backgroundColor:"#FFF7ED",borderRadius:12,marginBottom:16,border:"1px solid #FDBA74"}}>
                  <span style={{fontSize:9,fontWeight:700,padding:"2px 8px",borderRadius:8,fontFamily:sans,backgroundColor:"#FFF7ED",color:"#EA580C",border:"1px solid #FDBA74"}}>Examine.com</span>
                  <p style={{fontFamily:serif,fontSize:14,fontWeight:700,color:"#C2410C",margin:"8px 0 4px"}}>{artExamine.split('-').map(w=>w.charAt(0).toUpperCase()+w.slice(1)).join(' ')} {"\u2014"} Evidence Summary</p>
                  <p style={{fontSize:12,color:C.text,lineHeight:1.7,margin:"0 0 8px",fontFamily:sans}}>Evidence-based supplement research with clinical trial breakdowns.</p>
                  <a href={"https://examine.com/supplements/"+artExamine+"/"} target="_blank" rel="noopener noreferrer" style={{fontSize:11,fontWeight:600,color:"#EA580C",fontFamily:sans}}>{"\u2197"} View on Examine.com</a>
                </div>
              )}
              {!artLoading&&articles.length===0&&!artExamine&&(<div style={{textAlign:"center",padding:"36px 0"}}><p style={{fontSize:13,color:C.muted,fontFamily:sans}}>No articles found. Try a different search or category.</p></div>)}
              {articles.map((a,i)=>{const badge=SOURCE_BADGE[a.source]||{label:a.source||"Article",bg:"#F9FAFB",fg:C.muted};return(
                <a key={(a.id||'')+i} href={a.url||`https://pubmed.ncbi.nlm.nih.gov/${a.id}/`} target="_blank" rel="noopener noreferrer"
                  style={{display:"block",textDecoration:"none",paddingBottom:16,marginBottom:16,borderBottom:i<articles.length-1?`1px solid ${C.border}`:"none"}}>
                  <div style={{display:"flex",gap:5,alignItems:"center",marginBottom:4,flexWrap:"wrap"}}>
                    <span style={{fontSize:9,fontWeight:700,padding:"2px 8px",borderRadius:8,fontFamily:sans,backgroundColor:badge.bg,color:badge.fg}}>{badge.label}</span>
                    {a.year&&<span style={{fontSize:9,color:C.muted,fontFamily:sans}}>{a.year}</span>}
                  </div>
                  <p style={{fontSize:13,fontWeight:600,color:C.green,margin:"0 0 5px",lineHeight:1.55,fontFamily:serif}}>{a.title}</p>
                  <p style={{fontSize:11,color:C.muted,margin:"0 0 6px",fontFamily:sans}}>{[a.authors,a.journal].filter(Boolean).join(" \u00B7 ")}</p>
                  <span style={{fontSize:10,color:badge.fg,fontWeight:600,fontFamily:sans}}>{"\u2197"} Read article</span>
                </a>
              );})}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ─── SAVED CHALLENGES MODAL ──────────────────────────────────────────────────
function SavedModal({ saved, activeIds, onClose, onRemove, onStart }) {
  return (
    <div style={{ position:"fixed", inset:0, backgroundColor:"rgba(45,74,62,0.55)", zIndex:300, display:"flex", alignItems:"flex-end" }} onClick={onClose}>
      <div style={{ width:"100%", maxHeight:"88vh", backgroundColor:C.card, borderRadius:"20px 20px 0 0", display:"flex", flexDirection:"column", animation:"slideUp 0.28s ease" }} onClick={e => e.stopPropagation()}>
        <div style={{ padding:"14px 20px 0", flexShrink:0 }}>
          <div style={{ width:40, height:3, backgroundColor:"#E2DAD0", borderRadius:2, margin:"0 auto 16px" }}/>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:4 }}>
            <p style={{ fontFamily:serif, fontSize:19, fontWeight:700, color:C.green, margin:0 }}>Saved Challenges</p>
            <button onClick={onClose} style={{ background:"none", border:"none", color:C.muted, fontSize:22, cursor:"pointer", lineHeight:1, padding:"0 4px" }}>{"\u00D7"}</button>
          </div>
          <p style={{ fontSize:12, color:C.muted, margin:"0 0 14px", fontFamily:sans }}>{saved.length} {saved.length===1?"challenge":"challenges"} saved {"\u00B7"} start any time</p>
          <div style={{ height:1, backgroundColor:"#E2DAD0" }}/>
        </div>
        <div style={{ overflowY:"auto", padding:"4px 20px 36px" }}>
          {saved.length === 0 ? (
            <div style={{ padding:"40px 0", textAlign:"center" }}>
              <p style={{ fontFamily:serif, fontSize:15, color:C.muted, margin:"0 0 6px" }}>No saved challenges yet</p>
              <p style={{ fontSize:12, color:C.muted, fontFamily:sans }}>Tap the bookmark icon on any daily challenge to save it here.</p>
            </div>
          ) : saved.map((c, i) => (
            <div key={c.id} style={{ paddingTop:18, paddingBottom:18, borderBottom: i < saved.length-1 ? `1px solid #E2DAD0` : "none" }}>
              <p style={{ fontFamily:serif, fontSize:16, fontWeight:700, color:C.green, margin:"0 0 6px", lineHeight:1.3 }}>
                {c.title}
              </p>
              <div style={{ display:"flex", gap:5, marginBottom:8, flexWrap:"wrap" }}>
                {c.difficulty && (
                  <span style={{ fontSize:9, fontWeight:600, padding:"2px 8px", borderRadius:10, fontFamily:sans,
                    backgroundColor: c.difficulty==="Beginner" ? C.greenLight : c.difficulty==="Advanced" ? "#FDECEA" : C.goldLight,
                    color:           c.difficulty==="Beginner" ? C.green     : c.difficulty==="Advanced" ? "#C0392B"  : C.gold }}>
                    {c.difficulty}
                  </span>
                )}
                {c.duration && <span style={{ fontSize:9, color:C.muted, padding:"2px 8px", borderRadius:10, fontFamily:sans, backgroundColor:C.bg, border:`1px solid #E2DAD0` }}>{"\u23F1"} {c.duration}</span>}
                <span style={{ fontSize:9, color:C.muted, padding:"2px 8px", borderRadius:10, fontFamily:sans, backgroundColor:C.bg, border:`1px solid #E2DAD0` }}>{getChallengeTargetDays(c)}-day commitment</span>
              </div>
              <p style={{ fontSize:12, color:C.text, lineHeight:1.65, margin:"0 0 14px", fontFamily:sans }}>{c.instruction || c.action}</p>
              <div style={{ display:"flex", gap:8 }}>
                {activeIds?.has(c.id) ? (
                  <div style={{ flex:1, padding:"11px 0", textAlign:"center", backgroundColor:C.bg, border:`1px solid #E2DAD0`, borderRadius:11, fontSize:12, fontWeight:600, color:C.muted, fontFamily:serif }}>
                    Already active
                  </div>
                ) : (
                  <button onClick={() => onStart(c)} style={{ flex:1, padding:"11px 0", backgroundColor:C.green, color:"#FDFAF5", border:"none", borderRadius:11, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:serif }}>
                    Start Challenge {"\u2192"}
                  </button>
                )}
                <button onClick={() => onRemove(c.id)} style={{ padding:"11px 16px", backgroundColor:"transparent", color:C.muted, border:`1px solid #E2DAD0`, borderRadius:11, fontSize:11, cursor:"pointer", fontFamily:sans }}>
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── START CHALLENGE MODAL ───────────────────────────────────────────────────
function StartModal({ challenge, onStart, onClose }) {
  const suggested = getChallengeTargetDays(challenge);
  const options   = [7, 14, 21, 30];
  return (
    <div style={{ position:"fixed", inset:0, backgroundColor:"rgba(45,74,62,0.55)", zIndex:300, display:"flex", alignItems:"flex-end" }} onClick={onClose}>
      <div style={{ width:"100%", backgroundColor:C.card, borderRadius:"20px 20px 0 0", padding:"20px 24px 44px", animation:"slideUp 0.28s ease" }} onClick={e => e.stopPropagation()}>
        <div style={{ width:40, height:3, backgroundColor:"#E2DAD0", borderRadius:2, margin:"0 auto 20px" }}/>
        <p style={{ fontFamily:serif, fontSize:19, fontWeight:700, color:C.green, margin:"0 0 4px" }}>Start Challenge</p>
        <p style={{ fontSize:13, color:C.muted, margin:"0 0 20px", fontFamily:sans }}>{challenge.title}</p>
        <p style={{ fontSize:10, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.09em", margin:"0 0 10px", fontFamily:sans }}>Choose your commitment</p>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:18 }}>
          {options.map(d => {
            const isRec = d === suggested;
            return (
              <button key={d} onClick={() => onStart(challenge, d)}
                style={{ padding:"14px 0", borderRadius:14, fontFamily:serif, fontSize:15, fontWeight:700, cursor:"pointer",
                  border:`2px solid ${isRec ? C.green : "#E2DAD0"}`,
                  backgroundColor: isRec ? C.greenLight : "transparent",
                  color: isRec ? C.green : C.muted }}>
                {d} days
                {isRec && <span style={{ display:"block", fontSize:9, fontWeight:600, color:C.green, fontFamily:sans, letterSpacing:"0.05em", textTransform:"uppercase", marginTop:2 }}>Recommended</span>}
              </button>
            );
          })}
        </div>
        <button onClick={onClose} style={{ width:"100%", padding:"13px 0", border:`1px solid #E2DAD0`, borderRadius:12, backgroundColor:"transparent", color:C.muted, fontSize:13, cursor:"pointer", fontFamily:sans }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── CIRCADIAN TIMELINE ───────────────────────────────────────────────────────
const parseHour = str => {
  if (!str) return null;
  const m = str.match(/(\d+):(\d+)(?::\d+)?\s*(AM|PM)/i);
  if (!m) return null;
  let h = parseInt(m[1]);
  const mn = parseInt(m[2]);
  if (m[3].toUpperCase() === "PM" && h !== 12) h += 12;
  if (m[3].toUpperCase() === "AM" && h === 12) h = 0;
  return h + mn / 60;
};
const fmtHour = h => {
  if (h == null) return "";
  const hr = Math.floor(h), mn = Math.round((h - Math.floor(h)) * 60);
  const ap = hr >= 12 ? "PM" : "AM";
  const dh = hr === 0 ? 12 : hr > 12 ? hr - 12 : hr;
  return `${dh}:${String(mn).padStart(2, "0")} ${ap}`;
};
const fmtHourShort = h => {
  if (h == null) return "";
  const hr = Math.floor(h), mn = Math.round((h - Math.floor(h)) * 60);
  const ap = hr >= 12 ? "PM" : "AM";
  const dh = hr === 0 ? 12 : hr > 12 ? hr - 12 : hr;
  return mn > 0 ? `${dh}:${String(mn).padStart(2, "0")} ${ap}` : `${dh} ${ap}`;
};
function TLSunIcon({ size = 15, col }) {
  const c = col || C.gold;
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="3" stroke={c} strokeWidth="1.4"/>
      <line x1="8" y1="1" x2="8" y2="3.2" stroke={c} strokeWidth="1.3" strokeLinecap="round"/>
      <line x1="8" y1="12.8" x2="8" y2="15" stroke={c} strokeWidth="1.3" strokeLinecap="round"/>
      <line x1="1" y1="8" x2="3.2" y2="8" stroke={c} strokeWidth="1.3" strokeLinecap="round"/>
      <line x1="12.8" y1="8" x2="15" y2="8" stroke={c} strokeWidth="1.3" strokeLinecap="round"/>
      <line x1="3.4" y1="3.4" x2="4.9" y2="4.9" stroke={c} strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="11.1" y1="11.1" x2="12.6" y2="12.6" stroke={c} strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="12.6" y1="3.4" x2="11.1" y2="4.9" stroke={c} strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="4.9" y1="11.1" x2="3.4" y2="12.6" stroke={c} strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}
function TLMoonIcon({ size = 13, col }) {
  const c = col || C.gold;
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <path d="M11.5 9.5A6 6 0 0 1 4.5 2.5a6 6 0 1 0 7 7z" stroke={c} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function CircadianTimeline({ sun, geoError, entries, locationLabel, onRetryLocation }) {
  const now  = new Date();
  const nowH = now.getHours() + now.getMinutes() / 60;
  const srH  = parseHour(sun?.sunrise)    ?? 6.5;
  const ssH  = parseHour(sun?.sunset)     ?? 20.5;
  const snH  = parseHour(sun?.solar_noon) ?? ((srH + ssH) / 2);
  const dlH  = ssH - srH;
  const uvbS = Math.max(srH + 1.5, snH - dlH * 0.28);
  const uvbE = Math.min(ssH - 1.5, snH + dlH * 0.28);

  const TL_S = 4, TL_E = 24, TL_SPAN = TL_E - TL_S;
  const p = h => Math.max(0, Math.min(100, (h - TL_S) / TL_SPAN * 100));

  const sr = p(srH), ss = p(ssH), sn = p(snH), nw = p(nowH);
  const uvbSP = p(uvbS), uvbEP = p(uvbE);

  const raw = [0, sr - 5, sr, (sr + sn) / 2, sn, (sn + ss) / 2, ss, Math.min(100, ss + 5), 100];
  const gs  = raw.reduce((acc, v) => {
    const prev = acc.length ? acc[acc.length - 1] : -Infinity;
    return [...acc, Math.max(prev + 0.5, Math.min(100, v))];
  }, []);
  const GRAD_COLORS = ["#0D1B12","#1B3A2D","#C9884A","#F0DCA0","#FEEFC4","#F0DCA0","#C9884A","#1B3A2D","#0D1B12"];
  const gradient = `linear-gradient(to right,${GRAD_COLORS.map((c,i)=>`${c} ${gs[i].toFixed(1)}%`).join(",")})`;

  // Rhythm factor calculations
  const wakeH   = 7.0;
  const bedH    = 23.0;
  const cafCutH = bedH - 8.5;   // 2:30 PM — clears caffeine before bed
  const peakS   = wakeH + 3;    // 10 AM
  const peakE   = wakeH + 5;    // 12 PM

  const todayFood = (entries || []).filter(e => e.type === "food");
  let eatWindow = "—";
  if (todayFood.length > 0) {
    const times = todayFood.map(e => {
      const d = new Date(typeof e.id === "number" ? e.id : Date.now());
      return d.getHours() + d.getMinutes() / 60;
    }).filter(t => t >= 0 && t < 24);
    if (times.length > 0) {
      const first = Math.min(...times), last = Math.max(...times);
      eatWindow = first === last ? fmtHourShort(first) : `${fmtHourShort(first)}–${fmtHourShort(last)}`;
    }
  }

  const rhythmItems = [
    { icon: "☕", label: "Caffeine cutoff", time: fmtHourShort(cafCutH) },
    { icon: "🍽️", label: "Eating window",  time: eatWindow },
    { icon: "⚡", label: "Energy peak",    time: `${fmtHourShort(peakS)}–${fmtHourShort(peakE)}` },
    { icon: "🌙", label: "Wind-down",      time: fmtHourShort(bedH - 2) },
  ];

  const getPhase = () => {
    if (nowH < srH - 0.5)  return { label:"Night · Rest & Recovery",        sub:"Sleep is your most powerful recovery tool right now." };
    if (nowH < srH + 0.75) return { label:"Golden Dawn · Morning Light",     sub:"Step outside now — morning photons anchor your circadian clock for the day." };
    if (nowH < uvbS)        return { label:"Morning · Low UV",                sub:"UV is minimal. Safe and ideal for outdoor activity." };
    if (nowH < snH - 0.5)  return { label:"Rising UV · Vitamin D Window",    sub:"Ideal 15–20 min of direct sunlight now for optimal vitamin D synthesis." };
    if (nowH < snH + 0.5)  return { label:"Peak UV · Seek Shade",            sub:"UV index is at its highest. Limit prolonged unprotected exposure." };
    if (nowH < uvbE)        return { label:"Declining UV · Still Beneficial", sub:"UV remains effective for vitamin D — intensity decreasing through the afternoon." };
    if (nowH < ssH - 0.75) return { label:"Afternoon · Low UV",              sub:"UV is minimal. Excellent time for outdoor exercise or a gentle walk." };
    if (nowH < ssH + 0.5)  return { label:"Golden Hour · Ideal Outdoors",    sub:"Warm evening light — perfect for a walk, breathwork, or outdoor wind-down." };
    return                       { label:"Evening · Wind Down",               sub:"Reduce blue light now to let melatonin rise naturally for deeper sleep." };
  };
  const phase = getPhase();
  const isDay = nowH >= srH && nowH <= ssH;
  const ticks = [4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24];

  const [infoSeen,  setInfoSeen]  = useState(false);
  const [showInfo,  setShowInfo]  = useState(false);
  const [activeTip, setActiveTip] = useState(null);

  useEffect(() => {
    try { if (localStorage.getItem("nora_circ_info_seen")) setInfoSeen(true); } catch {}
  }, []);

  const handleInfo = e => {
    e.stopPropagation();
    setActiveTip(null);
    if (!infoSeen) {
      setInfoSeen(true);
      try { localStorage.setItem("nora_circ_info_seen", "1"); } catch {}
    }
    setShowInfo(v => !v);
  };

  const handleZone = (zone, e) => {
    e.stopPropagation();
    setShowInfo(false);
    setActiveTip(prev => prev === zone ? null : zone);
  };

  const dismiss = () => { setActiveTip(null); setShowInfo(false); };

  return (
    <div onClick={dismiss} style={{ padding:"0 18px 18px" }}>
      {/* Timeline */}
      <div style={{ position:"relative", paddingTop:22, paddingBottom:36 }}>
        {/* (i) button — top-right corner */}
        <button
          onClick={handleInfo}
          style={{ position:"absolute", top:0, right:0, width:17, height:17, borderRadius:"50%", border:`1px solid ${C.border}`, backgroundColor:C.card, color:C.muted, fontSize:9, fontFamily:sans, fontStyle:"italic", fontWeight:600, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", zIndex:20, lineHeight:1, padding:0 }}
        >
          i
        </button>

        {/* Info tooltip card (first-use or re-opened) */}
        {showInfo && (
          <div onClick={e => e.stopPropagation()} style={{ position:"absolute", top:0, left:0, right:22, backgroundColor:C.card, border:`1px solid ${C.border}`, borderRadius:9, padding:"10px 13px", zIndex:15, boxShadow:"0 4px 16px rgba(27,58,45,0.12)" }}>
            <p style={{ fontSize:11, color:C.text, margin:"0 0 7px", lineHeight:1.7, fontFamily:sans }}>
              The <b>green zones</b> show safe outdoor time — morning and afternoon. The <b>gold midday band</b> marks peak UV, best kept brief.
            </p>
            <button onClick={e => { e.stopPropagation(); setShowInfo(false); }} style={{ fontSize:10, color:C.muted, background:"none", border:"none", cursor:"pointer", padding:0, fontFamily:sans }}>Dismiss</button>
          </div>
        )}

        {/* Sun icon above bar at sunrise */}
        {sr > 2 && sr < 93 && (
          <div style={{ position:"absolute", top:0, left:`${sr}%`, transform:"translateX(-50%)", display:"flex", flexDirection:"column", alignItems:"center", gap:1 }}>
            <TLSunIcon size={14}/>
            <div style={{ width:1, height:6, backgroundColor:`${C.gold}50` }}/>
          </div>
        )}
        {/* Moon icon above bar at sunset */}
        {ss > 4 && ss < 95 && (
          <div style={{ position:"absolute", top:1, left:`${ss}%`, transform:"translateX(-50%)", display:"flex", flexDirection:"column", alignItems:"center", gap:1 }}>
            <TLMoonIcon size={13}/>
            <div style={{ width:1, height:5, backgroundColor:`${C.gold}50` }}/>
          </div>
        )}

        {/* Zone tap tooltip — floats above bar in the icon-row space */}
        {activeTip === "safe" && (
          <div style={{ position:"absolute", top:2, left:`${(sr + uvbSP) / 2}%`, transform:"translateX(-50%)", backgroundColor:C.green, color:"#FDFAF5", fontSize:9, fontFamily:sans, fontWeight:600, padding:"2px 8px", borderRadius:5, whiteSpace:"nowrap", pointerEvents:"none", zIndex:12, boxShadow:"0 1px 6px rgba(27,58,45,0.2)" }}>
            Safe exposure · {fmtHour(srH)}–{fmtHour(uvbS)} & {fmtHour(uvbE)}–{fmtHour(ssH)}
          </div>
        )}
        {activeTip === "peak" && (
          <div style={{ position:"absolute", top:2, left:`${sn}%`, transform:"translateX(-50%)", backgroundColor:C.amber, color:"#FDFAF5", fontSize:9, fontFamily:sans, fontWeight:600, padding:"2px 8px", borderRadius:5, whiteSpace:"nowrap", pointerEvents:"none", zIndex:12, boxShadow:"0 1px 6px rgba(154,112,32,0.3)" }}>
            Peak UV · {fmtHour(uvbS)}–{fmtHour(uvbE)} · Limit time outdoors
          </div>
        )}

        {/* Gradient bar */}
        <div style={{ height:36, borderRadius:10, background:gradient, position:"relative", overflow:"hidden", boxShadow:"0 2px 14px rgba(13,27,18,0.28)" }}>
          {/* Safe zone — full daylight band, tappable */}
          <div onClick={e => handleZone("safe", e)} style={{ position:"absolute", top:0, bottom:0, left:`${sr}%`, width:`${Math.max(0,ss-sr)}%`, background:"rgba(45,74,62,0.10)", cursor:"pointer" }}/>
          {/* Peak UV zone — midday band, tappable, sits on top */}
          {uvbS < uvbE && (
            <div onClick={e => handleZone("peak", e)} style={{ position:"absolute", top:4, bottom:4, left:`${uvbSP}%`, width:`${Math.max(0,uvbEP-uvbSP)}%`, background:"rgba(184,146,42,0.28)", borderRadius:6, cursor:"pointer" }}/>
          )}
          {/* Solar noon dot */}
          <div style={{ position:"absolute", top:"50%", left:`${sn}%`, transform:"translate(-50%,-50%)", width:5, height:5, borderRadius:"50%", backgroundColor:`${C.gold}90`, boxShadow:`0 0 5px ${C.gold}`, pointerEvents:"none" }}/>
          {/* Now indicator */}
          {nw >= 0 && nw <= 100 && (
            <div style={{ position:"absolute", top:0, bottom:0, left:`${nw}%`, width:2, backgroundColor:isDay?"rgba(27,58,45,0.85)":"rgba(253,250,245,0.8)", pointerEvents:"none" }}>
              <div style={{ position:"absolute", top:-1, left:"50%", transform:"translateX(-50%)", width:8, height:8, borderRadius:"50%", backgroundColor:isDay?C.green:"#FDFAF5", border:`2px solid ${C.gold}`, boxShadow:`0 0 6px ${C.gold}60` }}/>
            </div>
          )}
        </div>

        {/* Now label below bar */}
        {nw > 5 && nw < 93 && !activeTip && (
          <div style={{ position:"absolute", bottom:18, left:`${nw}%`, transform:"translateX(-50%)", fontSize:9, fontWeight:700, color:C.green, whiteSpace:"nowrap", fontFamily:sans, letterSpacing:"0.04em" }}>
            Now · {fmtHour(nowH)}
          </div>
        )}
        {/* Hour ticks */}
        {ticks.map(h => {
          const xp = p(h);
          return (
            <div key={h} style={{ position:"absolute", bottom:0, left:`${xp}%`, transform:"translateX(-50%)" }}>
              <span style={{ fontSize:9, color:C.muted, fontFamily:sans, lineHeight:1 }}>{h === 24 ? "12 AM" : h === 12 ? "12 PM" : h < 12 ? `${h} AM` : `${h - 12} PM`}</span>
            </div>
          );
        })}
      </div>
      {/* Legend */}
      <div style={{ display:"flex", gap:18, marginTop:12, justifyContent:"center" }}>
        <div style={{ display:"flex", alignItems:"center", gap:5 }}>
          <div style={{ width:9, height:9, borderRadius:"50%", backgroundColor:C.green, flexShrink:0 }}/>
          <span style={{ fontSize:10, color:C.muted, fontFamily:sans }}>Safe exposure</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:5 }}>
          <div style={{ width:9, height:9, borderRadius:"50%", backgroundColor:C.amber, flexShrink:0 }}/>
          <span style={{ fontSize:10, color:C.muted, fontFamily:sans }}>Peak UV — limit time outdoors</span>
        </div>
      </div>

      {/* Rhythm status bar */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:7, marginTop:16 }}>
        {rhythmItems.map(item => (
          <div key={item.label} style={{ backgroundColor:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:"9px 5px 8px", display:"flex", flexDirection:"column", alignItems:"center", gap:3, textAlign:"center" }}>
            <span style={{ fontSize:13, lineHeight:1 }}>{item.icon}</span>
            <span style={{ fontFamily:serif, fontSize:10, fontWeight:600, color:C.green, lineHeight:1.3, letterSpacing:"-0.01em" }}>{item.time}</span>
            <span style={{ fontSize:8.5, color:C.muted, fontFamily:sans, lineHeight:1.3 }}>{item.label}</span>
          </div>
        ))}
      </div>

      {/* Phase status card — explanatory detail, below the timeline */}
      <div style={{ backgroundColor:C.bg, borderLeft:`3px solid ${C.green}`, borderRadius:"0 12px 12px 0", border:`1px solid ${C.border}`, padding:"12px 16px 11px", marginTop:16 }}>
        <p style={{ fontFamily:serif, fontSize:14, fontWeight:600, color:C.green, margin:"0 0 3px", letterSpacing:"-0.01em" }}>{phase.label}</p>
        <p style={{ fontSize:12, color:C.amber, margin:0, lineHeight:1.6, fontFamily:sans }}>{phase.sub}</p>
        {sun && (
          <div style={{ display:"flex", gap:16, marginTop:9, flexWrap:"wrap" }}>
            <span style={{ fontSize:11, color:C.muted, fontFamily:sans, display:"flex", alignItems:"center", gap:4 }}><TLSunIcon size={11}/> Sunrise {fmtHour(srH)}</span>
            <span style={{ fontSize:11, color:C.muted, fontFamily:sans, display:"flex", alignItems:"center", gap:4 }}><TLMoonIcon size={10}/> Sunset {fmtHour(ssH)}</span>
            <span style={{ fontSize:11, color:C.muted, fontFamily:sans }}>◇ Solar noon {fmtHour(snH)}</span>
          </div>
        )}
        {locationLabel && (
          <p style={{ fontSize:10, color:C.muted, margin:"7px 0 0", fontFamily:sans, letterSpacing:"0.02em" }}>
            {locationLabel}
            {geoError && (
              <>
                {" · "}
                <button onClick={e => { e.stopPropagation(); onRetryLocation?.(); }} style={{ fontSize:10, color:C.green, background:"none", border:"none", padding:0, cursor:"pointer", fontFamily:sans, textDecoration:"underline", fontWeight:600 }}>
                  Enable location
                </button>
                {" for your exact times"}
              </>
            )}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function Ritual({ profile, targets, entries, waterMl, cyclePhase, periodLogs, activeChallenges, startChallenge, checkInChallenge, uncheckInChallenge, abandonChallenge, ritualStreak, markChallengeDone, weekMeals, weekWaterLogs, completionDates, fastingStart, fastingEnd }) {
  const [biohack,        setBiohack]        = useState(null);
  const [loading,        setLoading]        = useState(false);
  const [loadingStatus,  setLoadingStatus]  = useState("");
  const [citOpen,        setCitOpen]        = useState(false);
  const [done,           setDone]           = useState(false);
  const [savedChallenges,setSavedChallenges]= useState([]);
  const [savedOpen,      setSavedOpen]      = useState(false);
  const [startModal,     setStartModal]     = useState(null);
  const [libraryOpen,    setLibraryOpen]    = useState(false);
  const [open,           setOpen]           = useState({ cycle:true, male:true, circadian:true, active: activeChallenges.length>0 });
  const [sun,            setSun]            = useState(null);
  const [geoError,       setGeoError]       = useState(false);
  const [locationLabel,  setLocationLabel]  = useState(null);
  const [isNarrowBg,     setIsNarrowBg]     = useState(false);

  // Alege varianta portret/landscape a imaginii de fundal atmosferic, dupa latimea ecranului.
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    setIsNarrowBg(mq.matches);
    const handler = (e) => setIsNarrowBg(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const tog = k => setOpen(p => ({ ...p, [k]: !p[k] }));

  const localCyclePhase = cyclePhase || ((profile?.sex==="female" && profile?.biologicalTrackingEnabled && profile?.biologicalContext==="cycle") ? getCyclePhase(periodLogs, profile?.cycleLength||28) : null);

  // Weekly Biohack Report — Monday-reset consistency grid (food/water/challenge) + numbers + message.
  // Structured as a `rows` array so a 4th row (movement/smartwatch) is just another entry, later.
  const weekKey = getWeekKey();
  const weekDateStrs = (() => {
    const now = new Date();
    const dow = now.getDay();
    const diffToMonday = dow === 0 ? 6 : dow - 1;
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday); d.setDate(d.getDate() + i);
      return localDateStr(d);
    });
  })();

  const [fsH, fsM] = (fastingStart || "09:00").split(":").map(Number);
  const [feH, feM] = (fastingEnd || "21:00").split(":").map(Number);
  const eatWinStart = fsH + fsM / 60, eatWinEnd = feH + feM / 60;

  const foodDone = weekDateStrs.map(ds => (weekMeals || []).some(m => {
    const d = new Date(m.logged_at);
    if (localDateStr(d) !== ds) return false;
    const h = d.getHours() + d.getMinutes() / 60;
    return eatWinStart <= eatWinEnd ? (h >= eatWinStart && h < eatWinEnd) : (h >= eatWinStart || h < eatWinEnd);
  }));

  const weekWaterTarget = targets?.water_ml || 2500;
  const waterDone = weekDateStrs.map(ds => {
    const total = (weekWaterLogs || []).filter(w => localDateStr(new Date(w.logged_at)) === ds).reduce((s, w) => s + (w.amount_ml || 0), 0);
    return total >= weekWaterTarget;
  });

  const challengeDateSet = new Set(completionDates || []);
  const challengeDone = weekDateStrs.map(ds => challengeDateSet.has(ds));

  const weekRows = [
    { key: "food",      label: "Food",      data: foodDone },
    { key: "water",     label: "Water",     data: waterDone },
    { key: "challenge", label: "Challenge", data: challengeDone },
  ];

  const todayIdx = Math.max(0, weekDateStrs.indexOf(localDateStr()));
  const weekRangeLabel = (() => {
    const monday = new Date(weekDateStrs[0] + "T00:00:00");
    const sunday = new Date(weekDateStrs[6] + "T00:00:00");
    return monday.getMonth() === sunday.getMonth()
      ? `${monday.toLocaleDateString("en-US", { month:"long" })} ${monday.getDate()} – ${sunday.getDate()}`
      : `${monday.toLocaleDateString("en-US", { month:"short" })} ${monday.getDate()} – ${sunday.toLocaleDateString("en-US", { month:"short" })} ${sunday.getDate()}`;
  })();

  const challengeDaysThisWeek = challengeDone.filter(Boolean).length;
  const weekTicks = foodDone.filter(Boolean).length + waterDone.filter(Boolean).length + challengeDaysThisWeek;
  const weekRatio = weekTicks / 21;
  const weekTier = weekRatio < 0.34 ? "low" : weekRatio < 0.67 ? "medium" : "high";
  const weeklyMessage = pickWeeklyVariant(`weekly_report_msg_${weekTier}`, WEEKLY_REPORT_MESSAGES[weekTier], weekKey);
  // Weekly goals now live inside the normal Daily Challenge pool (see CHALLENGES_GENERAL) — this
  // slot just reflects real Active Challenges, or disappears entirely when there are none.
  const activeSorted = [...activeChallenges].sort((a, b) => (b.startDate || "").localeCompare(a.startDate || ""));

  // Circadian clock: real sunrise/sunset from device location, computed locally (NOAA solar formula,
  // no external API). Falls back to a default city if geolocation is denied/unavailable.
  // Raw GPS coordinates are cached locally for the day only, never sent to Supabase.
  const resolveLocation = (skipCache = false) => {
    const today = todayStr();
    const useCoords = (lat, lng, label, source, persist = true) => {
      const times = calcSunTimes(lat, lng, new Date());
      setSun(times);
      setLocationLabel(label);
      if (persist) {
        try { localStorage.setItem("nora_ritual_location", JSON.stringify({ date: today, lat, lng, label, source })); } catch {}
      } else {
        console.log("[Nora][location DEBUG] not caching — city lookup failed, will retry next session");
      }
    };

    if (!skipCache) {
      let cached = null;
      try { const c = localStorage.getItem("nora_ritual_location"); if (c) { const d = JSON.parse(c); if (d.date === today) cached = d; } } catch {}
      if (cached) { console.log("[Nora][location DEBUG] using today's cache:", cached); useCoords(cached.lat, cached.lng, cached.label, cached.source); return; }
    }

    if (!navigator.geolocation) {
      console.log("[Nora][location DEBUG] navigator.geolocation is unavailable (insecure context or unsupported browser)");
      setGeoError(true);
      useCoords(DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lng, `${DEFAULT_LOCATION.city} (default)`, "default");
      return;
    }
    console.log("[Nora][location DEBUG] calling navigator.geolocation.getCurrentPosition…");
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude:lat, longitude:lng } = pos.coords;
        console.log("[Nora][location DEBUG] geolocation success:", lat, lng);
        const city = await reverseGeocodeCity(lat, lng);
        console.log("[Nora][location DEBUG] reverse geocode result:", city);
        setGeoError(false);
        useCoords(lat, lng, city || "Your location", "gps", !!city);
      },
      err => {
        console.log("[Nora][location DEBUG] geolocation error:", err.code, err.message);
        setGeoError(true);
        useCoords(DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lng, `${DEFAULT_LOCATION.city} (default)`, "default");
      }
    );
  };

  useEffect(() => { resolveLocation(false); }, []);

  // Biohack challenge init
  useEffect(() => {
    try { const s = localStorage.getItem(SAVED_CHALLENGES_KEY);   if (s) setSavedChallenges(JSON.parse(s));   } catch {}
    const today = todayStr();
    try {
      const td = localStorage.getItem("nora_daily_biohack");
      if (td) {
        const cached = JSON.parse(td);
        if (cached.date === today && cached.challenge?.title) {
          setBiohack(cached.challenge);
          setDone(cached.done || false);
          return;
        }
      }
    } catch {}
    generate([]);
  }, []);

  const generate = async (rejected = []) => {
    setLoading(true); setCitOpen(false); setLoadingStatus("Selecting today's challenge.");
    const sex = profile?.sex;

    let hist60 = [];
    try { const h = localStorage.getItem(CHALLENGE_HISTORY_KEY); if (h) hist60 = JSON.parse(h); } catch {}
    const usedIds    = new Set(hist60.slice(-60).map(e => e.id));
    const rejectedSet = new Set(rejected);

    const fullPool = [
      ...CHALLENGES_GENERAL,
      ...(sex === "female" ? femalePoolFor(localCyclePhase) : []),
      ...(sex === "male"   ? CHALLENGES_MALE   : []),
    ];
    const available = fullPool.filter(c => !usedIds.has(c.id) && !rejectedSet.has(c.id));

    let challenge = null;

    if (available.length > 0) {
      const seed = parseInt(todayStr().replace(/-/g, "")) + rejected.length * 7919;
      challenge = available[seed % available.length];
    } else {
      setLoadingStatus("Generating a new challenge.");
      const goalsStr = (profile?.goals || []).join(", ") || "general health";
      const isPeriOrMeno = profile?.biologicalTrackingEnabled && (profile?.biologicalContext === "perimenopause" || profile?.biologicalContext === "menopause");
      const genderCtx = sex === "female" && isPeriOrMeno ? "Female user, perimenopausal/menopausal. Women's wellness content welcome, but NEVER menstrual-cycle-phase content (no follicular/luteal/ovulation framing) — she does not have regular ovulation. Perimenopause/menopause-relevant content (bone density, hot flashes, sleep) is welcome instead."
        : sex === "female" ? "Female user. Women's wellness content is welcome."
        : sex === "male" ? "Male user. Men's performance content is welcome."
        : "No gender specified. General content only - no hormonal or gender-specific advice.";
      try {
        const raw = await callClaude(
          `You are a precision wellness expert. Return ONLY valid JSON. Safety rules: cold exposure - never alone in open water; fasting - contraindicated in pregnancy; supplements - always say "consult your doctor". Gender rule: women's hormonal content ONLY for female users; testosterone/muscle content ONLY for male users.`,
          `Create ONE unique biohacking challenge.\n${genderCtx} Goals: ${goalsStr}.\nReturn ONLY: {"id":"ai-${Date.now()}","title":"Challenge Title","category":"breathwork","difficulty":"Beginner","duration":"10 min","instruction":"Precise steps with exact timing and any safety note.","science":"One mechanism sentence.","label":null}`
        );
        const parsed = tryParseJSON(raw);
        if (parsed?.title) challenge = parsed;
      } catch {}
      if (!challenge) challenge = getFallbackChallenge(sex, usedIds, localCyclePhase);
    }

    setLoadingStatus("Searching research database.");
    const studies = challenge.pubmedQ
      ? (await fetchPubMed(challenge.pubmedQ, 10, challenge.pubmedFbs || [])).studies || []
      : [];

    const final = { ...challenge, studies };
    setBiohack(final); setDone(false); setLoadingStatus("");

    if (!hist60.find(e => e.date === todayStr())) {
      const updated = [...hist60, { date: todayStr(), id: challenge.id }].slice(-60);
      try { localStorage.setItem(CHALLENGE_HISTORY_KEY, JSON.stringify(updated)); } catch {}
    }
    try { localStorage.setItem("nora_daily_biohack", JSON.stringify({ date: todayStr(), challenge: final, done: false, rejected })); } catch {}
    setLoading(false);
  };

  const markDone = () => {
    setDone(true);
    markChallengeDone(biohack);
    try { const td = localStorage.getItem("nora_daily_biohack"); if (td) localStorage.setItem("nora_daily_biohack", JSON.stringify({ ...JSON.parse(td), done: true })); } catch {}
  };

  const notForMe = async () => {
    let rejected = [];
    try { const td = localStorage.getItem("nora_daily_biohack"); if (td) rejected = JSON.parse(td).rejected || []; } catch {}
    if (biohack) rejected = [...rejected, biohack.id || biohack.title];
    setBiohack(null); await generate(rejected);
  };

  const isSaved = biohack ? savedChallenges.some(c => c.id === biohack.id) : false;
  const activeIds = new Set(activeChallenges.map(ac => ac.id));
  const biohackActive = biohack ? activeIds.has(biohack.id) : false;

  const toggleSave = () => {
    if (!biohack) return;
    const next = isSaved
      ? savedChallenges.filter(c => c.id !== biohack.id)
      : [...savedChallenges, biohack];
    setSavedChallenges(next);
    try { localStorage.setItem(SAVED_CHALLENGES_KEY, JSON.stringify(next)); } catch {}
  };

  const removeSaved = id => {
    const next = savedChallenges.filter(c => c.id !== id);
    setSavedChallenges(next);
    try { localStorage.setItem(SAVED_CHALLENGES_KEY, JSON.stringify(next)); } catch {}
  };

  const handleStartChallenge = (challenge, targetDays) => {
    setStartModal(null); setSavedOpen(false);
    startChallenge(challenge, targetDays);
  };

  const getAcStreak = ac => {
    let streak = 0;
    const checkSet = new Set(ac.checkIns);
    const d = new Date();
    for (let i = 0; i < ac.targetDays + 1; i++) {
      const ds = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
      if (checkSet.has(ds)) { streak++; d.setDate(d.getDate() - 1); }
      else break;
    }
    return streak;
  };

  return (
    <div style={{ padding:"24px 20px 100px", display:"flex", flexDirection:"column", gap:16, minHeight:"100vh" }}>
      <style>{`
        @keyframes fadeIn  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideUp { from{transform:translateY(100%)} to{transform:translateY(0)} }

      `}</style>

      {/* Fundal atmosferic fix, in spatele cardurilor — intensitate finala aleasa (fosta "varianta C").
          zIndex:-1 (nu 0!) — altfel, fiind element pozitionat, s-ar picta DUPA cardurile fara
          position proprie (position:static implicit), aparand DEASUPRA lor. Cu -1 picteaza inaintea
          oricarui continut al paginii, indiferent daca acel continut are sau nu position setat. */}
      <div style={{ position:"fixed", inset:0, zIndex:-1, pointerEvents:"none" }}>
        <Image
          src={isNarrowBg ? "/images/atmosphere/fog-1-portrait.jpg" : "/images/atmosphere/fog-1.jpg"}
          alt=""
          fill
          unoptimized
          sizes="100vw"
          style={{
            objectFit: "cover",
            objectPosition: isNarrowBg ? "50% 50%" : "50% 75%",
            filter: "blur(3px) saturate(0.95) brightness(1.3)",
            opacity: 0.42,
          }}
        />
      </div>

      {/* Saved challenges modal */}
      {savedOpen && (
        <SavedModal
          saved={savedChallenges}
          activeIds={activeIds}
          onClose={() => setSavedOpen(false)}
          onRemove={removeSaved}
          onStart={c => setStartModal(c)}
        />
      )}

      {/* Start challenge duration picker */}
      {startModal && (
        <StartModal
          challenge={startModal}
          onStart={handleStartChallenge}
          onClose={() => setStartModal(null)}
        />
      )}

      {/* Library modal */}
      {libraryOpen && <LibraryModal onClose={() => setLibraryOpen(false)} />}

      <div style={{ background:`linear-gradient(160deg,${C.greenDark} 0%,${C.green} 100%)`, padding:"20px 20px 18px", margin:"-24px -20px 18px", position:"relative", overflow:"hidden" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, flex:1 }}>
          <div style={{ flex:1 }}>
            <h2 style={{ fontFamily:serif, fontSize:21, color:"#FDFAF5", fontWeight:700, margin:0, lineHeight:1.2, letterSpacing:"-0.01em" }}>Ritual</h2>
            <p style={{ fontSize:11, color:"rgba(253,250,245,0.55)", margin:0, fontFamily:sans }}>Biohacking · Circadian · Protocols</p>
          </div>
        </div>
      </div>

      {/* ─── 1. CIRCADIAN CLOCK — hero, top of tab ──────────────────────────────── */}
      <div style={{ ...card }}>
        <SectionHeader
          title="Circadian Rhythm"
          sub="24-hour sun & UV timeline"
          open={open.circadian}
          onToggle={() => tog("circadian")}
          accent
        />
        <Collapsible open={open.circadian}>
          <CircadianTimeline sun={sun} geoError={geoError} entries={entries} locationLabel={locationLabel} onRetryLocation={() => resolveLocation(true)}/>
        </Collapsible>
      </div>


      {/* ─── 2. DAILY CHALLENGE — unified (was: Today's Focus banner + separate card) ── */}
      <div style={{ backgroundColor:C.card, borderRadius:16, border:`1px solid ${C.border}`, borderTop:`1px solid ${C.muted}`, boxShadow:"0 2px 20px rgba(45,74,62,0.08)", overflow:"hidden", position:"relative" }}>
        <div style={{ padding:"14px 20px 12px", display:"flex", justifyContent:"space-between", alignItems:"center", borderBottom:`1px solid ${C.border}` }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:9, fontWeight:700, color:C.green, textTransform:"uppercase", letterSpacing:"0.12em", fontFamily:sans }}>Daily Challenge</span>
            {biohack?.category && <span style={{ fontSize:9, fontWeight:600, color:C.muted, backgroundColor:C.bg, border:`1px solid ${C.border}`, borderRadius:20, padding:"2px 8px", textTransform:"capitalize" }}>{biohack.category}</span>}
          </div>
          {ritualStreak > 0 && <span style={{ fontSize:11, color:C.muted, fontFamily:sans }}>{ritualStreak}-day streak {ritualStreak>=7?"🔥":"⚡"}</span>}
        </div>
        {loading ? (
          <div style={{ padding:"20px 20px 22px" }}>
            {[62,100,90,76].map((w,i) => <div key={i} style={{ height:i===0?22:12, width:`${w}%`, backgroundColor:C.track, borderRadius:5, marginBottom:i===0?16:8 }}/>)}
            <div style={{ height:40, backgroundColor:C.track, borderRadius:10, marginTop:8 }}/>
            {loadingStatus && <p style={{ fontSize:11, color:C.muted, margin:"12px 0 0", textAlign:"center", fontFamily:sans, fontStyle:"italic" }}>{loadingStatus}</p>}
          </div>
        ) : biohack ? (
          <div style={{ padding:"18px 20px 20px", animation:"fadeIn 0.35s ease" }}>

            {/* Title */}
            <p style={{ fontFamily:serif, fontSize:20, fontWeight:700, color:C.green, margin:"0 0 8px", lineHeight:1.25, letterSpacing:"-0.01em" }}>
              {biohack.title || biohack.name}
            </p>

            {/* Difficulty + Duration chips */}
            <div style={{ display:"flex", gap:6, marginBottom:12, flexWrap:"wrap" }}>
              {biohack.difficulty && (
                <span style={{ fontSize:10, fontWeight:600, padding:"3px 10px", borderRadius:20, fontFamily:sans,
                  backgroundColor: biohack.difficulty==="Beginner" ? C.greenLight : biohack.difficulty==="Advanced" ? "#FDECEA" : C.goldLight,
                  color:           biohack.difficulty==="Beginner" ? C.green     : biohack.difficulty==="Advanced" ? "#C0392B"  : C.gold }}>
                  {biohack.difficulty}
                </span>
              )}
              {biohack.duration && (
                <span style={{ fontSize:10, fontWeight:500, padding:"3px 10px", borderRadius:20, fontFamily:sans, backgroundColor:C.bg, color:C.muted, border:`1px solid ${C.border}` }}>
                  ⏱ {biohack.duration}
                </span>
              )}
            </div>

            {/* Instruction */}
            <p style={{ fontSize:13, color:C.text, lineHeight:1.85, margin:"0 0 12px", fontFamily:sans }}>
              {biohack.instruction || biohack.action}
            </p>

            {/* Science explanation */}
            <div style={{ borderLeft:`2px solid ${C.green}`, paddingLeft:13, margin:"0 0 14px" }}>
              <p style={{ fontSize:12, color:C.muted, lineHeight:1.75, margin:0, fontStyle:"italic", fontFamily:serif }}>
                {biohack.science || biohack.why}
              </p>
            </div>

            {/* PubMed citations */}
            {"studies" in (biohack||{}) && (
              <div style={{ margin:"0 0 18px" }}>
                {biohack.studies?.length > 0 ? (
                  <>
                    <button onClick={() => setCitOpen(o => !o)} style={{ display:"flex", alignItems:"center", gap:6, background:"none", border:"none", padding:0, cursor:"pointer" }}>
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><rect x="1.5" y="2" width="10" height="9" rx="1.5" stroke={C.muted} strokeWidth="1.1"/><path d="M3.5 5.5h6M3.5 7.5h4" stroke={C.muted} strokeWidth="1" strokeLinecap="round"/></svg>
                      <span style={{ fontSize:11, color:C.muted, fontFamily:sans }}>Based on {biohack.studies.length} peer-reviewed {biohack.studies.length===1?"study":"studies"}</span>
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ transition:"transform 0.18s", transform:citOpen?"rotate(180deg)":"none" }}><path d="M2 3.5l3 3 3-3" stroke={C.muted} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                    {citOpen && (
                      <div style={{ marginTop:10, padding:"12px 13px", backgroundColor:C.card, borderRadius:10, border:`1px solid ${C.border}` }}>
                        {biohack.studies.map((s,i) => (
                          <a key={s.id||i} href={s.url||`https://pubmed.ncbi.nlm.nih.gov/${s.id}/`} target="_blank" rel="noopener noreferrer"
                            style={{ display:"block", textDecoration:"none", marginBottom:i<biohack.studies.length-1?8:0 }}>
                            <p style={{ fontSize:11, color:C.text, margin:"0 0 2px", lineHeight:1.45, fontFamily:sans }}>{i+1}. {s.title}</p>
                            <p style={{ fontSize:10, color:C.muted, margin:0, fontFamily:sans }}>
                              {[s.authors,s.journal,s.year].filter(Boolean).join(" · ")}
                              <span style={{ color:C.green, marginLeft:5, fontWeight:500 }}>↗ PubMed</span>
                            </p>
                          </a>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <p style={{ fontSize:11, color:C.green, margin:0, fontStyle:"italic", fontFamily:serif, letterSpacing:"0.02em" }}>✦ Based on established clinical research · Always consult your healthcare provider</p>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              <div style={{ display:"flex", gap:8 }}>
                {biohackActive ? (
                  <div style={{ flex:1, padding:"13px 0", textAlign:"center", backgroundColor:C.bg, border:`1px solid ${C.border}`, borderRadius:12, fontSize:12, fontWeight:600, color:C.muted, fontFamily:serif }}>
                    Already active
                  </div>
                ) : (
                  <button onClick={() => setStartModal(biohack)}
                    style={{ flex:1, padding:"13px 0", backgroundColor:C.green, color:"#FDFAF5", border:"none", borderRadius:12, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:serif }}>
                    Start Challenge →
                  </button>
                )}
                <button onClick={notForMe}
                  style={{ flex:1, padding:"13px 0", backgroundColor:"transparent", color:C.muted, border:`1px solid ${C.border}`, borderRadius:12, fontSize:11, cursor:"pointer", fontFamily:sans }}>
                  Not for me
                </button>
                <button onClick={toggleSave} title={isSaved ? "Unsave" : "Save challenge"}
                  style={{ width:46, height:46, display:"flex", alignItems:"center", justifyContent:"center", backgroundColor: isSaved ? C.greenLight : "transparent", border:`1px solid ${isSaved ? C.green : C.border}`, borderRadius:12, cursor:"pointer", flexShrink:0, transition:"background 0.15s,border-color 0.15s" }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill={isSaved ? C.green : "none"}>
                    <path d="M3 2h10a1 1 0 0 1 1 1v11l-6-3-6 3V3a1 1 0 0 1 1-1z" stroke={isSaved ? C.green : C.muted} strokeWidth="1.3" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* ─── 3. ACTIVE CHALLENGES — collapsible, compact ────────────────────────── */}
      <div style={{ ...card }}>
        <SectionHeader title="Active Challenges" sub={activeChallenges.length>0 ? `${activeChallenges.length} in progress` : "None yet — start one above"} open={open.active} onToggle={() => tog("active")} accent/>
        <Collapsible open={open.active}>
          <div style={{ padding:"0 18px 18px", display:"flex", flexDirection:"column", gap:8 }}>
            {activeChallenges.length===0 ? (
              <p style={{ fontSize:12, color:C.muted, fontFamily:sans, margin:0 }}>Start today's challenge above to begin tracking a streak here.</p>
            ) : activeChallenges.map(ac => {
              const today      = todayStr();
              const checkedIn  = ac.checkIns.includes(today);
              const completed  = ac.checkIns.length >= ac.targetDays;
              const pct        = Math.min(ac.checkIns.length / ac.targetDays, 1);
              const acStreak   = getAcStreak(ac);
              const streakMsg  = completed
                ? "All done - outstanding commitment."
                : acStreak >= 14 ? `${acStreak} days in a row - exceptional`
                : acStreak >= 7  ? `${acStreak}-day streak - you're building a real habit`
                : acStreak >= 3  ? `${acStreak} days in - keep the momentum`
                : checkedIn      ? "Checked in today - well done"
                : acStreak === 1 ? "1-day start - check in tomorrow to build your streak"
                : "Check in each day to build your streak";
              return (
                <div key={ac.instanceId} style={{ backgroundColor:C.card, borderRadius:12, border:`1px solid ${C.border}`, padding:"12px 14px" }}>
                  {completed ? (
                    <div style={{ textAlign:"center", padding:"6px 0 4px" }}>
                      <div style={{ fontSize:26, marginBottom:6 }}>🏆</div>
                      <p style={{ fontFamily:serif, fontSize:15, fontWeight:700, color:C.gold, margin:"0 0 2px" }}>Challenge Complete!</p>
                      <p style={{ fontSize:11, color:C.muted, margin:"0 0 12px", fontFamily:sans }}>
                        {ac.title} · {ac.targetDays} days
                      </p>
                      <button onClick={() => abandonChallenge(ac.instanceId)}
                        style={{ padding:"7px 18px", backgroundColor:"transparent", color:C.muted, border:`1px solid ${C.border}`, borderRadius:9, fontSize:11, cursor:"pointer", fontFamily:sans }}>
                        Dismiss
                      </button>
                    </div>
                  ) : (
                    <>
                      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:8 }}>
                        <div style={{ flex:1 }}>
                          <p style={{ fontFamily:serif, fontSize:14, fontWeight:700, color:C.green, margin:"0 0 2px", lineHeight:1.3 }}>
                            {ac.title}
                          </p>
                          <p style={{ fontSize:10, color:C.muted, margin:0, fontFamily:sans }}>
                            Day {ac.checkIns.length} of {ac.targetDays} · started {ac.startDate}
                          </p>
                        </div>
                        <button onClick={() => abandonChallenge(ac.instanceId)} title="Abandon"
                          style={{ background:"none", border:"none", color:C.muted, fontSize:16, cursor:"pointer", padding:"0 2px", flexShrink:0, lineHeight:1 }}>×</button>
                      </div>

                      <div style={{ height:5, backgroundColor:C.track, borderRadius:3, marginBottom:5, overflow:"hidden" }}>
                        <div style={{ height:5, width:`${pct*100}%`, background:`linear-gradient(90deg,${C.green},${C.gold})`, borderRadius:3, transition:"width 0.5s ease" }}/>
                      </div>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                        <span style={{ fontSize:9, color: acStreak >= 3 ? C.green : C.muted, fontFamily:sans, fontStyle: acStreak === 0 && !checkedIn ? "italic" : "normal" }}>{streakMsg}</span>
                        <span style={{ fontSize:9, color:C.muted, fontFamily:sans }}>{Math.round(pct*100)}%</span>
                      </div>

                      {checkedIn ? (
                        <button onClick={() => uncheckInChallenge(ac.instanceId)} title="Tap to undo"
                          style={{ width:"100%", padding:"8px 12px", backgroundColor:C.greenLight, borderRadius:9, border:`1px solid ${C.green}30`, textAlign:"center", cursor:"pointer" }}>
                          <p style={{ fontSize:11, fontWeight:600, color:C.green, margin:0, fontFamily:serif }}>✓ Checked in today <span style={{ fontWeight:400, color:C.muted, fontFamily:sans }}>· tap to undo</span></p>
                        </button>
                      ) : (
                        <button onClick={() => checkInChallenge(ac.instanceId)}
                          style={{ width:"100%", padding:"10px 0", backgroundColor:C.green, color:"#FDFAF5", border:"none", borderRadius:10, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:serif }}>
                          Check in today
                        </button>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </Collapsible>
      </div>

      {/* ─── 4. WEEKLY BIOHACK REPORT ───────────────────────────────────────────── */}
      <div style={{ ...card, padding:"24px 22px 26px" }}>
        {/* Header — editorial, matches the Circadian Rhythm title language */}
        <p style={{ fontFamily:serif, fontSize:19, fontWeight:600, color:C.text, margin:"0 0 4px", lineHeight:1.2 }}>Weekly Report</p>
        <p style={{ fontSize:9, color:C.muted, margin:"0 0 26px", fontFamily:sans, textTransform:"uppercase", letterSpacing:"0.14em" }}>{weekRangeLabel}</p>

        {/* Grid — dots, generous air, today marked with a thin gold underline (the card's one gold accent) */}
        <div style={{ display:"flex", flexDirection:"column", gap:15, marginBottom:28 }}>
          <div style={{ display:"flex", alignItems:"center" }}>
            <div style={{ width:60 }}/>
            {["M","T","W","T","F","S","S"].map((d, i) => (
              <div key={i} style={{ flex:1, textAlign:"center", opacity: i > todayIdx ? 0.35 : 1 }}>
                <span style={{ fontSize:9, color:C.muted, fontFamily:sans, letterSpacing:"0.03em" }}>{d}</span>
                <div style={{ height:1.5, width:12, backgroundColor: i === todayIdx ? C.gold : "transparent", margin:"4px auto 0", borderRadius:1 }}/>
              </div>
            ))}
          </div>
          {weekRows.map(row => (
            <div key={row.key} style={{ display:"flex", alignItems:"center" }}>
              <div style={{ width:60, fontSize:9, color:C.muted, textTransform:"uppercase", letterSpacing:"0.06em", fontFamily:sans }}>{row.label}</div>
              {row.data.map((done, i) => (
                <div key={i} style={{ flex:1, display:"flex", justifyContent:"center", opacity: i > todayIdx ? 0.3 : 1 }}>
                  <div style={{ width: done ? 7 : 4, height: done ? 7 : 4, borderRadius:"50%", backgroundColor: done ? C.green : C.border, border:"none", opacity: done ? 1 : 0.55 }}/>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Numbers — typographic row, no card boxes, no fractions (what was done, not what's owed) */}
        <div style={{ display:"flex", alignItems:"stretch", marginBottom:26 }}>
          <div style={{ flex:1, textAlign:"center" }}>
            <p style={{ fontFamily:serif, fontSize:27, fontWeight:600, color:C.text, margin:0, lineHeight:1 }}>{challengeDaysThisWeek}</p>
            <p style={{ fontSize:9, color:C.muted, margin:"7px 0 0", textTransform:"uppercase", letterSpacing:"0.08em", fontFamily:sans }}>Days shaped</p>
          </div>
          <div style={{ width:1, backgroundColor:C.border }}/>
          <div style={{ flex:1, textAlign:"center" }}>
            <p style={{ fontFamily:serif, fontSize:27, fontWeight:600, color:C.text, margin:0, lineHeight:1 }}>{ritualStreak}</p>
            <p style={{ fontSize:9, color:C.muted, margin:"7px 0 0", textTransform:"uppercase", letterSpacing:"0.08em", fontFamily:sans }}>Day streak</p>
          </div>
        </div>

        {/* Active challenges — every one in progress, not just the latest; nothing shown if none */}
        {activeSorted.length > 0 && (
          <div style={{ margin:"-10px 0 26px", display:"flex", flexDirection:"column", gap:6 }}>
            {activeSorted.map(ac => (
              <p key={ac.instanceId} style={{ fontSize:11, color:C.muted, margin:0, textAlign:"center", fontFamily:sans, lineHeight:1.6 }}>
                <span style={{ color:C.text, fontWeight:600 }}>{ac.title}</span> — day {ac.checkIns.length} of {ac.targetDays}
              </p>
            ))}
          </div>
        )}

        {/* Nora's message — the emotional close */}
        <p style={{ fontFamily:serif, fontSize:15, fontStyle:"italic", color:C.text, lineHeight:1.8, margin:0, borderLeft:`3px solid ${C.green}`, paddingLeft:16 }}>
          {weeklyMessage}
        </p>
      </div>

      {/* ─── 5. CYCLE PHASE / HORMONAL RHYTHM — opt-in, mutually exclusive by sex ── */}
      {profile?.sex==="female" && localCyclePhase && (
        <div style={{ ...card }}>
          <SectionHeader title="Cycle Phase Insights" sub={`${localCyclePhase.label} phase · Day ${localCyclePhase.day}${localCyclePhase.periodLengthEstimated||localCyclePhase.cycleLengthEstimated?" (estimated)":""}`} open={open.cycle} onToggle={() => tog("cycle")} accent/>
          <Collapsible open={open.cycle}>
            <div style={{ padding:"0 18px 18px" }}>
              <div style={{ borderLeft:`3px solid ${localCyclePhase.color}`, paddingLeft:12, marginBottom:16 }}>
                <p style={{ fontSize:13, color:C.text, lineHeight:1.7, margin:0 }}>{getCycleTip(localCyclePhase.phase, "long")}</p>
              </div>
              <p style={{ fontSize:11, fontWeight:600, color:C.muted, textTransform:"uppercase", letterSpacing:"0.06em", margin:"0 0 8px" }}>Best foods this phase</p>
              {(CYCLE_NUTRITION[localCyclePhase.phase]?.foods||[]).map((f,i,arr) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 0", borderBottom:i<arr.length-1?`1px solid ${C.border}`:"none" }}>
                  <div style={{ width:5, height:5, borderRadius:"50%", backgroundColor:localCyclePhase.color, flexShrink:0 }}/>
                  <span style={{ fontSize:13, color:C.text }}>{f}</span>
                </div>
              ))}
              {CYCLE_NUTRITION[localCyclePhase.phase]?.avoid && (
                <div style={{ backgroundColor:C.errorBg, borderRadius:10, padding:"10px 12px", marginTop:12 }}>
                  <p style={{ fontSize:12, color:C.error, margin:0, lineHeight:1.6 }}><strong>Limit:</strong> {CYCLE_NUTRITION[localCyclePhase.phase].avoid}</p>
                </div>
              )}
            </div>
          </Collapsible>
        </div>
      )}

      {profile?.sex==="male" && profile?.biologicalTrackingEnabled && (() => {
        const maleTip = getMaleTip("long");
        return (
          <div style={{ ...card }}>
            <SectionHeader title="Hormonal Rhythm" sub={`${maleTip.icon} ${maleTip.title}`} open={open.male} onToggle={() => tog("male")} accent/>
            <Collapsible open={open.male}>
              <div style={{ padding:"0 18px 18px" }}>
                <div style={{ borderLeft:`3px solid ${C.green}`, paddingLeft:12 }}>
                  <p style={{ fontSize:13, color:C.text, lineHeight:1.7, margin:0 }}>{maleTip.tip}</p>
                </div>
              </div>
            </Collapsible>
          </div>
        );
      })()}

      {/* ─── 6. LIBRARY + SAVED ─────────────────────────────────────────────────── */}
      <div style={{ display:"flex", gap:8 }}>
        <button onClick={() => setLibraryOpen(true)}
          style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:6, padding:"11px 0", backgroundColor:C.card, border:`1px solid ${C.green}40`, borderRadius:12, cursor:"pointer", fontFamily:serif, fontSize:13, fontWeight:600, color:C.green }}>
          ✦ Library
        </button>
        <button onClick={() => setSavedOpen(true)}
          style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:6, padding:"11px 0", backgroundColor: savedChallenges.length > 0 ? C.greenLight : C.card, border:`1px solid ${savedChallenges.length > 0 ? C.green : C.border}`, borderRadius:12, cursor:"pointer", fontFamily:serif, fontSize:13, fontWeight:600, color: savedChallenges.length > 0 ? C.green : C.muted }}>
          Saved{savedChallenges.length > 0 ? ` (${savedChallenges.length})` : ""}
        </button>
      </div>

    </div>

  );
}

