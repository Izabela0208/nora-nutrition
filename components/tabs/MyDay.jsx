import { useState, useEffect, useRef } from "react";
import { C, card, serif, sans, inp, localDateStr, pickDailyVariant, getMaleTip, getDailyFact } from "../noraTokens";
import { LeafDecor, DropIcon, CheckIcon, SparkleIcon, CameraIcon, EditIcon } from "../NoraIcons";
import AtmosphereBackground from "../AtmosphereBackground";
import { BrowserMultiFormatReader, BarcodeFormat } from "@zxing/browser";

const MovementIcon = ({ size = 15, color = C.sage }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <path d="M1.5 10.5h2.8l1.7-4 2 7 1.7-5.5 1.3 2.5h3.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const callClaude = async (sys, user, maxTokens=800) => {
  const res = await fetch("/api/chat", {
    method:"POST", headers:{"Content-Type":"application/json"},
    body:JSON.stringify({ model:"claude-sonnet-4-5", max_tokens:maxTokens, system:sys, messages:[{role:"user",content:user}] }),
  });
  const data = await res.json();
  return data.content?.map(b=>b.text||"").join("")||"";
};

const parseJSON = (text) => {
  try { return JSON.parse(text.replace(/```json|```/g,"").trim()); } catch {
    const o=text.match(/\{[\s\S]*\}/); if(o) return JSON.parse(o[0]);
    throw new Error("parse error");
  }
};

const HORMONAL_TIPS = [
  { tip: "Pair iron-rich foods with vitamin C to triple absorption. Spinach with lemon, lentils with tomato, or red meat with peppers — the combination is far more effective than either alone." },
  { tip: "Ginger is as effective as ibuprofen for menstrual cramps in several clinical trials. Try 1g of fresh ginger in warm water or ginger tea starting 2 days before your period." },
  { tip: "Oestrogen rises in the follicular phase, boosting energy and resilience. This is your prime window for high-intensity training, new challenges and social plans — lean into it." },
  { tip: "Fermented foods like kefir, yoghurt and kimchi support the oestrobolome — the gut bacteria that regulate oestrogen metabolism. One serving daily improves hormonal clearance over time." },
  { tip: "Zinc supports follicular development and is heavily used at ovulation. Pumpkin seeds, hemp seeds and oysters are excellent sources — aim for one zinc-rich food daily around mid-cycle." },
  { tip: "EPA and DHA from fatty fish reduce prostaglandins — the compounds that trigger menstrual cramps. Two servings of salmon, mackerel or sardines weekly can reduce pain intensity over time." },
  { tip: "Magnesium levels drop in the luteal phase, worsening mood, cravings and sleep. Dark chocolate, almonds and leafy greens are the richest sources — aim for one daily in the week before your period." },
  { tip: "Progesterone and oestrogen fluctuations in the luteal phase increase water retention. Reducing sodium, processed foods and alcohol in the 7 days before your period can significantly ease bloating." },
  { tip: "In the follicular phase (days 1–14), 1 tbsp each of ground flaxseed and pumpkin seeds daily may support oestrogen production. Flax lignans act as natural oestrogen modulators." },
  { tip: "In the luteal phase (days 15–28), 1 tbsp each of sesame and sunflower seeds daily provides zinc and selenium to support progesterone. Consistent use over 3 cycles may improve PMS." },
  { tip: "Flaxseeds, soy, chickpeas and lentils contain phytoestrogens — plant compounds that weakly bind oestrogen receptors, helping to ease perimenopausal symptoms and moderate oestrogen dominance." },
  { tip: "Dietary fibre binds excess oestrogen in the gut for excretion. Insufficient fibre allows oestrogen to be reabsorbed, worsening hormonal symptoms. Aim for 25–35g daily from vegetables and legumes." },
  { tip: "Vitamin B6 is essential for progesterone synthesis and reduces PMS-related anxiety and low mood. Avocado, banana, chicken, tuna and pistachio nuts are among the richest food sources." },
  { tip: "Blood sugar spikes trigger cortisol, which disrupts oestrogen and progesterone. Front-loading protein and fat before carbohydrates at each meal blunts the glucose response and supports hormonal rhythm." },
  { tip: "Iodine deficiency impairs thyroid hormone production, which regulates metabolism and cycle regularity. Seaweed, iodised salt, eggs and dairy are reliable sources — but never megadose; excess is equally harmful." },
  { tip: "Just 1–2 Brazil nuts daily provides your full selenium requirement. Selenium protects the thyroid from oxidative damage and supports T4-to-T3 conversion — eating more offers no additional benefit." },
  { tip: "Vitamin D receptors are present in the ovaries, uterus and pituitary. Deficiency links to irregular cycles and reduced fertility. A blood test is the only reliable guide — 2000 IU daily is a safe maintenance dose." },
  { tip: "Progesterone has a natural sedative effect, peaking in the luteal phase. Disrupted sleep lowers progesterone, which worsens PMS and cycle irregularity. Protecting 7–9 hours is directly hormonal medicine." },
  { tip: "Chronic stress raises cortisol, which competes with progesterone for the same receptor sites. This relative progesterone deficiency contributes to heavy periods and mood swings. Stress reduction is hormonal care." },
  { tip: "Calcium supplementation reduces PMS severity by up to 48% in clinical studies. Dairy, fortified plant milks, tinned fish with bones, tofu and broccoli are the best food sources — aim for 1000mg daily." },
  { tip: "Folate supports DNA synthesis in the rapidly dividing uterine lining. Dark leafy greens, lentils and avocado are the richest sources — particularly important for cycle regularity and egg quality." },
  { tip: "Zinc inhibits 5-alpha reductase, reducing conversion of testosterone to DHT and lowering sebum production. Hormonal breakouts often respond well to consistent zinc intake from pumpkin seeds or whole foods." },
  { tip: "Myo-inositol and D-chiro-inositol improve insulin sensitivity and have strong evidence for restoring cycle regularity. Found naturally in citrus fruits, beans and whole grains — or available as supplements." },
  { tip: "Ashwagandha has robust evidence for reducing cortisol by 15–25% in chronically stressed adults. Lower cortisol directly supports progesterone levels and helps regulate the hormonal rhythm." },
  { tip: "Maca root contains unique alkaloids that act on the hypothalamus-pituitary axis, supporting hormonal balance without acting as a phytoestrogen. Small trials show benefits for mood, energy and libido." },
  { tip: "Two cups of spearmint tea daily has been shown in clinical trials to reduce free testosterone in women with elevated androgens. A simple, caffeine-free daily ritual with measurable hormonal effects." },
  { tip: "Evening primrose oil is rich in gamma-linolenic acid (GLA), which can reduce breast tenderness, period pain and skin inflammation. Most studies used 1–3g daily in the second half of the cycle." },
  { tip: "Melatonin regulates LH surges and ovulation timing. Blue light from screens after 9 pm suppresses melatonin and can disrupt ovulation and cycle length. Dim warm lighting in the evening protects this rhythm." },
  { tip: "In the follicular phase, train harder — oestrogen supports performance and recovery. In the luteal phase, intensity feels harder due to elevated progesterone and core temperature. Honouring this shift reduces burnout." },
  { tip: "Oestrogen decline after 40 accelerates bone loss. Weight-bearing exercise and resistance training are the most effective interventions — calcium and vitamin D support the process, but movement drives bone formation." },
  { tip: "Phytoestrogens from soy, flaxseed and red clover may reduce hot flash frequency. Studies show greatest benefit in women with more frequent flushes. Avoid common triggers: caffeine, alcohol and hot rooms." },
  { tip: "Progesterone decline in perimenopause disrupts sleep architecture. A cooler bedroom (16–18°C), no screens 90 min before bed, and magnesium glycinate before sleep all measurably improve sleep quality." },
  { tip: "The gut microbiome regulates oestrogen recycling. Constipation allows oestrogen to be reabsorbed. Daily fermented foods and adequate fibre keep this enterohepatic cycle moving and hormones in better balance." },
  { tip: "Prostaglandins drive period pain and are amplified by inflammatory foods. Reducing refined sugar and processed oils while increasing polyphenols and omega-3 is one of the most powerful dietary levers for cycle pain." },
  { tip: "Curcumin in turmeric inhibits NF-kB, a key inflammatory pathway activated during menstruation. Adding turmeric with black pepper and a healthy fat daily may reduce period-related inflammation over time." },
  { tip: "Dehydration concentrates prostaglandins in uterine tissue and worsens cramping. Electrolyte-balanced water — a pinch of sea salt and lemon — hydrates cells more effectively than plain water alone." },
];

const PHASE_EXTRAS = {
  menstrual:  { foods: ["Iron: lentils, red meat, dark leafy greens", "Ginger tea for cramps"], exercise: "Yoga · gentle walking" },
  follicular: { foods: ["Fermented foods: kefir, yoghurt, kimchi", "Complex carbs: oats, quinoa"], exercise: "HIIT · strength training" },
  ovulatory:  { foods: ["Zinc: pumpkin seeds, hemp seeds", "Anti-inflammatory: salmon, sardines"], exercise: "Peak performance: lift heavy" },
  luteal:     { foods: ["Magnesium: dark chocolate, almonds", "B6: banana, avocado, poultry"], exercise: "Moderate cardio · pilates" },
};


const detectWater = (input) => {
  const s = input.toLowerCase().trim();
  const isDrink = /\b(water|h2o|hydrat|drink|drank|fluid|apa|ap[ăa]|agua|tea|ceai|coffee|cafea|latte|espresso|juice|suc|herbal|matcha)\b/.test(s);
  if (!isDrink) return null;
  const glass = s.match(/(\d+(?:\.\d+)?)\s*(?:glass(?:es)?|cup(?:s)?|pahar(?:e)?)/);
  if (glass) return Math.round(parseFloat(glass[1])*250);
  const ml = s.match(/(\d+(?:\.\d+)?)\s*ml/);
  if (ml) return Math.round(parseFloat(ml[1]));
  const litre = s.match(/(\d+(?:\.\d+)?)\s*(?:l\b|liter(?:s)?|litre(?:s)?)/);
  if (litre) return Math.round(parseFloat(litre[1])*1000);
  return "prompt";
};

const fmtRemaining = (ms) => {
  const totalMin = Math.max(0, Math.round(ms / 60000));
  const d = Math.floor(totalMin / 1440);
  const h = Math.floor((totalMin % 1440) / 60);
  const m = totalMin % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

export default function MyDay({ profile, targets, entries, logMeal, updateMeal, deleteMeal, clearTodayMeals, waterMl, setWaterMl, cyclePhase, activeChallenges, checkInChallenge, setActiveTab, fastingEnabled, fastingStart, fastingEnd, fastingMode, fastingExtendedStartAt, fastingExtendedHours, logWaterEntry }) {
  const [greeting,          setGreeting]          = useState("");
  const [greetingLoad,      setGreetingLoad]      = useState(false);
  const [greetingDone,      setGreetingDone]      = useState(false);
  const [logInput,          setLogInput]          = useState("");
  const [logLoading,        setLogLoading]        = useState(false);
  const [logError,          setLogError]          = useState("");
  const [photoMode,         setPhotoMode]         = useState(false);
  const [imageFile,         setImageFile]         = useState(null);
  const [logToast,          setLogToast]          = useState(null);
  const [showOtherWater,    setShowOtherWater]    = useState(false);
  const [customWaterMl,     setCustomWaterMl]     = useState("");
  const [waterToast,        setWaterToast]        = useState("");
  const [eveningSummary,    setEveningSummary]    = useState("");
  const [eveningSummaryLoad,setEveningSummaryLoad]= useState(false);
  const [editingId,         setEditingId]         = useState(null);
  const [editFields,        setEditFields]        = useState({});
  const [barcodeOpen,       setBarcodeOpen]       = useState(false);
  const [barcodeLoad,       setBarcodeLoad]       = useState(false);
  const [barcodeResult,     setBarcodeResult]     = useState(null);
  const [barcodeGrams,      setBarcodeGrams]      = useState("100");
  const [barcodeError,      setBarcodeError]      = useState("");
  const [manualBarcode,     setManualBarcode]     = useState("");
  const [cameraActive,      setCameraActive]      = useState(false);
  const [plateMode,        setPlateMode]        = useState(false);
  const [platePreviewUrl,  setPlatePreviewUrl]  = useState(null);
  const [plateLoad,        setPlateLoad]        = useState(false);
  const [plateFoodData,    setPlateFoodData]    = useState([]);
  const [plateError,       setPlateError]       = useState("");
  const [editPortions,     setEditPortions]     = useState({});
  const [healthData,       setHealthData]        = useState({});
  const [showCycleInvite,  setShowCycleInvite]   = useState(false);

  const fileRef         = useRef();
  const toastTimer      = useRef();
  const videoRef        = useRef(null);
  const streamRef       = useRef(null);
  const scanControlsRef = useRef(null);
  const plateFileRef    = useRef(null);

  const isFemale     = profile?.sex === "female";
  const isMale       = profile?.sex === "male";
  const isPeri       = profile?.biologicalTrackingEnabled && profile?.biologicalContext === "perimenopause";
  const foodE        = entries.filter(e=>e.type==="food");
  const exerE        = entries.filter(e=>e.type==="exercise");
  const totalCal     = foodE.reduce((s,e)=>s+(e.calories||0),0);
  const burnedCal    = exerE.reduce((s,e)=>s+Math.abs(e.calories||0),0);
  const netCal       = totalCal - burnedCal;
  const totalPro     = foodE.reduce((s,e)=>s+(e.protein_g||0),0);
  const totalCarb    = foodE.reduce((s,e)=>s+(e.carbs_g||0),0);
  const totalFat     = foodE.reduce((s,e)=>s+(e.fat_g||0),0);
  const h            = new Date().getHours();
  const isEvening    = h >= 18;
  const maleTip      = (isMale && profile?.biologicalTrackingEnabled) ? getMaleTip("short") : null;

  // Invitatie discreta, o singura data, pentru femei care nu au activat personalizarea
  // biologica deloc — dupa ce se afiseaza o data, tacere completa (nu mai reapare).
  useEffect(()=>{
    if(!isFemale || profile?.biologicalTrackingEnabled) return;
    try {
      if(localStorage.getItem("nora_cycle_invite_seen")) return;
      setShowCycleInvite(true);
      localStorage.setItem("nora_cycle_invite_seen","1");
    } catch {}
  },[isFemale, profile?.biologicalTrackingEnabled]);

  useEffect(()=>{
    if(!isEvening) return;
    try {
      const ev=localStorage.getItem("nora_evening_reflection");
      if(ev){
        const d=JSON.parse(ev);
        if(d.date===localDateStr())setEveningSummary(d.text);
      }
    } catch{}
  },[]);

  useEffect(()=>{
    if(!greetingDone&&profile){setGreetingDone(true);fetchGreeting();}
  },[profile]);

  useEffect(()=>{
    if(profile&&isEvening&&!eveningSummary&&!eveningSummaryLoad) fetchEveningSummary();
  },[profile,isEvening]);

  useEffect(()=>{
    try{const hd=localStorage.getItem("nora_health");if(hd)setHealthData(JSON.parse(hd));}catch{}
  },[]);

  const closePlateModal = () => {
    if (platePreviewUrl) URL.revokeObjectURL(platePreviewUrl);
    setPlateMode(false); setPlatePreviewUrl(null); setPlateFoodData([]);
    setPlateError(""); setEditPortions({}); setPlateLoad(false);
  };

  const handlePlatePhoto = async (file) => {
    const url = URL.createObjectURL(file);
    setPlatePreviewUrl(url); setPlateMode(true); setPlateLoad(true);
    setPlateError(""); setPlateFoodData([]); setEditPortions({});
    try {
      const b64 = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result.split(",")[1]);
        r.onerror = rej;
        r.readAsDataURL(file);
      });
      const raw = await callClaude(
        "You are a professional nutritionist. Return only valid JSON, no extra text.",
        [
          { type:"image", source:{ type:"base64", media_type:file.type, data:b64 } },
          { type:"text",  text:'Analyze this food photo. Identify every food item visible, estimate the portion size in grams for each item, then calculate total calories, protein, carbohydrates and fat. Be as accurate as possible. Return ONLY a JSON object with no extra text: {"foods": [{"name": "string", "portion_grams": number, "kcal": number, "protein_g": number, "carbs_g": number, "fat_g": number}], "totals": {"kcal": number, "protein_g": number, "carbs_g": number, "fat_g": number}}' },
        ],
        1500
      );
      const parsed = parseJSON(raw);
      const enriched = await Promise.all((parsed.foods || []).map(async (food) => {
        try {
          const r = await fetch(`/api/food-search?query=${encodeURIComponent(food.name)}`);
          const d = await r.json();
          const usda = (d.results || []).find(x => x.source === "USDA");
          if (usda && usda.per100g) {
            const factor = food.portion_grams / 100;
            const p = usda.per100g;
            return { ...food, kcal: Math.round((p.kcal||0)*factor), protein_g: Math.round((p.protein||0)*factor*10)/10, carbs_g: Math.round((p.carbs||0)*factor*10)/10, fat_g: Math.round((p.fat||0)*factor*10)/10, per100g: p, source: "USDA" };
          }
        } catch {}
        return { ...food, source: "AI estimate" };
      }));
      setPlateFoodData(enriched);
      setEditPortions(Object.fromEntries(enriched.map((f, i) => [i, String(f.portion_grams)])));
    } catch {
      setPlateError("Couldn't analyse this photo. Try a clearer image with good lighting.");
    }
    setPlateLoad(false);
  };

  const logPlateMeal = () => {
    const adjusted = plateFoodData.map((food, i) => {
      const grams = Math.max(1, parseFloat(editPortions[i]) || food.portion_grams);
      if (grams === food.portion_grams) return food;
      const factor = food.per100g ? grams / 100 : grams / food.portion_grams;
      const p = food.per100g || {};
      return {
        ...food, portion_grams: grams,
        kcal:      food.per100g ? Math.round((p.kcal||0)*factor)          : Math.round(food.kcal*(grams/food.portion_grams)),
        protein_g: food.per100g ? Math.round((p.protein||0)*factor*10)/10 : Math.round(food.protein_g*(grams/food.portion_grams)*10)/10,
        carbs_g:   food.per100g ? Math.round((p.carbs||0)*factor*10)/10   : Math.round(food.carbs_g*(grams/food.portion_grams)*10)/10,
        fat_g:     food.per100g ? Math.round((p.fat||0)*factor*10)/10     : Math.round(food.fat_g*(grams/food.portion_grams)*10)/10,
      };
    });
    const totalKcal = Math.round(adjusted.reduce((s, f) => s + (f.kcal||0), 0));
    const totalPro  = Math.round(adjusted.reduce((s, f) => s + (f.protein_g||0), 0) * 10) / 10;
    const totalCarb = Math.round(adjusted.reduce((s, f) => s + (f.carbs_g||0), 0) * 10) / 10;
    const totalFat  = Math.round(adjusted.reduce((s, f) => s + (f.fat_g||0), 0) * 10) / 10;
    const name      = adjusted.map(f => f.name).join(", ");
    const hh = new Date().getHours();
    const mg = hh < 11 ? "Morning" : hh < 15 ? "Midday" : hh < 18 ? "Snacks" : "Evening";
    const entry = {
      id: Date.now(), type: "food", source: "photo",
      name: `Plate: ${name.length > 55 ? name.slice(0, 52) + "…" : name}`,
      time: new Date().toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" }),
      mealGroup: mg, calories: totalKcal,
      protein_g: totalPro, carbs_g: totalCarb, fat_g: totalFat,
      fiber_g: 0, notes: `Photo analysis · ${adjusted.length} item${adjusted.length !== 1 ? "s" : ""}`,
    };
    logMeal(entry);
    setLogToast({ entry, msg: `Plate logged · ${totalKcal} kcal · tap to adjust` });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setLogToast(null), 6000);
    closePlateModal();
  };

  const stopBarcodeCamera = () => {
    if (scanControlsRef.current) { scanControlsRef.current.stop(); scanControlsRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    setCameraActive(false);
  };

  const lookupBarcode = async (code) => {
    console.log("[Nora][barcode DEBUG] lookupBarcode called with code:", code); // TEMPORAR — de șters după diagnostic
    setBarcodeLoad(true); setBarcodeError(""); setBarcodeResult(null); setBarcodeGrams("100");
    stopBarcodeCamera();
    // Try Open Food Facts first (free, no key)
    try {
      const offRes  = await fetch(`https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(code)}.json`);
      const offData = await offRes.json();
      console.log("[Nora][barcode DEBUG] OFF response — status:", offData.status, "product_name:", offData.product?.product_name); // TEMPORAR
      if (offData.status === 1 && offData.product?.product_name) {
        const p   = offData.product;
        const nut = p.nutriments || {};
        console.log("[Nora][barcode DEBUG] OFF nutriments used:", { kcal: nut["energy-kcal_100g"], protein: nut["proteins_100g"], carbs: nut["carbohydrates_100g"], fat: nut["fat_100g"], nutrition_data_per: p.nutrition_data_per, serving_size: p.serving_size }); // TEMPORAR
        setBarcodeResult({
          name:        p.product_name?.trim() || "Unknown product",
          brand:       p.brands?.split(",")[0]?.trim() || null,
          image:       p.image_front_url || p.image_url || null,
          nutriScore:  p.nutriscore_grade?.toUpperCase() || null,
          ingredients: p.ingredients_text || p.ingredients_text_en || null,
          kcal:        Math.round(nut["energy-kcal_100g"] || 0),
          protein:     Math.round((nut["proteins_100g"]        || 0) * 10) / 10,
          carbs:       Math.round((nut["carbohydrates_100g"]   || 0) * 10) / 10,
          fat:         Math.round((nut["fat_100g"]             || 0) * 10) / 10,
          source:      "Open Food Facts",
        });
        setBarcodeLoad(false);
        return;
      }
    } catch (e) {
      console.log("[Nora][barcode DEBUG] OFF fetch threw:", e?.name, e?.message); // TEMPORAR
    }
    // Fallback: USDA FoodData Central (Branded dataType only — the only one with barcodes)
    try {
      const r    = await fetch(`/api/food-search?barcode=${encodeURIComponent(code)}`);
      const d    = await r.json();
      const item = (d.results || []).find(x => x.source === "USDA");
      console.log("[Nora][barcode DEBUG] USDA fallback — results:", d.results?.length || 0, "matched:", !!item, "errors:", d.errors); // TEMPORAR
      if (item) {
        const p = item.per100g || {};
        setBarcodeResult({
          name: item.name, brand: item.brand || null, image: null,
          nutriScore: null, ingredients: null,
          kcal: p.kcal || 0, protein: p.protein || 0, carbs: p.carbs || 0, fat: p.fat || 0,
          source: "USDA",
        });
        setBarcodeLoad(false);
        return;
      }
    } catch (e) {
      console.log("[Nora][barcode DEBUG] USDA fallback fetch threw:", e?.name, e?.message); // TEMPORAR
    }
    console.log("[Nora][barcode DEBUG] not found in OFF or USDA — showing error"); // TEMPORAR
    setBarcodeError("Product not found. Try entering the barcode again or log manually.");
    setBarcodeLoad(false);
  };

  const startBarcodeCamera = async () => {
    setBarcodeError("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setBarcodeError("Camera not available. Enter the barcode number manually below.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 } },
      });
      console.log("[Nora][barcode DEBUG] camera stream obtained, track settings:", stream.getVideoTracks()[0]?.getSettings()); // TEMPORAR — de șters după diagnostic
      // Best-effort: force continuous autofocus so close-up barcodes stay sharp. Supported on
      // Chrome/Android; Safari doesn't expose this API at all, so it's silently skipped there.
      const [videoTrack] = stream.getVideoTracks();
      try {
        const caps = videoTrack.getCapabilities?.();
        if (caps?.focusMode?.includes("continuous")) {
          await videoTrack.applyConstraints({ advanced: [{ focusMode: "continuous" }] });
          console.log("[Nora][barcode DEBUG] applied continuous focus mode"); // TEMPORAR
        } else {
          console.log("[Nora][barcode DEBUG] continuous focus mode not offered by this camera:", caps?.focusMode); // TEMPORAR
        }
      } catch (e) {
        console.log("[Nora][barcode DEBUG] applyConstraints(focusMode) failed:", e?.name, e?.message); // TEMPORAR
      }
      streamRef.current = stream;
      setCameraActive(true);
      // Two rAF ticks ensure the <video> element is in the DOM before we attach.
      // ZXing (not the native BarcodeDetector) does the decoding so this works on Safari/iOS too.
      requestAnimationFrame(() => requestAnimationFrame(async () => {
        if (!videoRef.current) { console.log("[Nora][barcode DEBUG] videoRef not mounted, aborting"); return; } // TEMPORAR
        const codeReader = new BrowserMultiFormatReader();
        codeReader.possibleFormats = [
          BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A,
          BarcodeFormat.UPC_E, BarcodeFormat.CODE_128, BarcodeFormat.CODE_39,
        ];
        try {
          scanControlsRef.current = await codeReader.decodeFromStream(stream, videoRef.current, (result, err) => {
            if (result) {
              console.log("[Nora][barcode DEBUG] decoded:", result.getText(), result.getBarcodeFormat?.()); // TEMPORAR
              scanControlsRef.current?.stop();
              scanControlsRef.current = null;
              lookupBarcode(result.getText());
            } else if (err && err.name !== "NotFoundException") {
              console.log("[Nora][barcode DEBUG] decode error:", err.name, err.message); // TEMPORAR
            }
          });
          console.log("[Nora][barcode DEBUG] decoder attached, video frame size:", videoRef.current.videoWidth, "x", videoRef.current.videoHeight); // TEMPORAR
        } catch (e) {
          console.log("[Nora][barcode DEBUG] decodeFromStream threw:", e?.name, e?.message); // TEMPORAR
        }
      }));
    } catch (e) {
      console.log("[Nora][barcode DEBUG] getUserMedia failed:", e?.name, e?.message); // TEMPORAR
      setBarcodeError("Camera access denied. Enter the barcode number manually below.");
    }
  };

  const closeBarcodeModal = () => {
    stopBarcodeCamera();
    setBarcodeOpen(false); setBarcodeResult(null); setBarcodeGrams("100"); setBarcodeError(""); setManualBarcode(""); setBarcodeLoad(false);
  };

  const logBarcodeProduct = () => {
    if (!barcodeResult) return;
    const grams  = Math.max(1, parseFloat(barcodeGrams) || 100);
    const factor = grams / 100;
    const hh = new Date().getHours();
    const mg = hh < 11 ? "Morning" : hh < 15 ? "Midday" : hh < 18 ? "Snacks" : "Evening";
    const entry = {
      id: Date.now(), type: "food", source: "barcode",
      name: barcodeResult.name + (barcodeResult.brand ? ` (${barcodeResult.brand})` : ""),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      mealGroup: mg, calories: Math.round(barcodeResult.kcal * factor),
      protein_g: Math.round(barcodeResult.protein * factor * 10) / 10,
      carbs_g:   Math.round(barcodeResult.carbs   * factor * 10) / 10,
      fat_g:     Math.round(barcodeResult.fat     * factor * 10) / 10,
      fiber_g: 0, notes: `${grams}g · barcode scan`, estimated: false,
    };
    logMeal(entry);
    setLogToast({ entry, msg: `${barcodeResult.name} (~${entry.calories} kcal) · tap to adjust` });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setLogToast(null), 6000);
    closeBarcodeModal();
  };

  const fetchGreeting = async()=>{
    setGreetingLoad(true);
    try{
      const g = await callClaude(
        "You are Nora, a warm nutritionist AI. 1–2 sentences. Never say your own name.",
        `User: ${profile?.name}, goals: ${(profile?.goals||[]).join(", ")}, activity: ${profile?.activity}. Time: ${h<12?"morning":h<17?"afternoon":"evening"}. Personalised greeting + one actionable tip.`
      );
      setGreeting(g);
    }catch{setGreeting(`Let's make today count, ${profile?.name}.`);}
    setGreetingLoad(false);
  };

  const fetchEveningSummary = async()=>{
    setEveningSummaryLoad(true);
    try{
      const dataStr = entries.length > 0
        ? `Cal today:${Math.round(netCal)}/${targets?.calories||2000}, P:${Math.round(totalPro)}g/${targets?.protein_g||150}g, Water:${waterMl}ml/${targets?.water_ml||2500}ml, ${entries.length} items logged.`
        : "Nothing logged today.";
      const userPrompt = `Evening reflection for ${profile?.name}. Goals:${(profile?.goals||[]).join(", ")}. ${dataStr} Write 2–3 warm sentences that close the day: a gentle look back at how it went (acknowledge wins, note any gaps without judgement — or if nothing was logged, a soft closing thought instead of a reminder), then a small thought or intention to carry into tomorrow.`;
      const t=await callClaude(
        "You are Nora, a warm and knowledgeable nutrition coach. Write a closing reflection for the end of the day — retrospective in tone, looking back and gently ahead to tomorrow. Never a tip, a reminder, or a call to action. 2–3 sentences only. Use the user's name.",
        userPrompt
      );
      setEveningSummary(t);
      try{localStorage.setItem("nora_evening_reflection",JSON.stringify({date:localDateStr(),text:t}));}catch{}
    }catch{}
    setEveningSummaryLoad(false);
  };

  const addWater=(ml)=>{
    setWaterMl(w=>Math.min(w+ml,(targets?.water_ml||3000)*2));
    setWaterToast(`+${ml>=1000?(ml/1000).toFixed(1)+"L":ml+"ml"} added`);
    setTimeout(()=>setWaterToast(""),2800);
    logWaterEntry?.(ml);
  };

  const handleLogText=async()=>{
    const input=logInput.trim(); if(!input) return;
    const water=detectWater(input);
    if(water==="prompt"){setShowOtherWater(true);setLogInput("");return;}
    if(water!==null){addWater(water);setLogInput("");return;}
    setLogLoading(true);setLogError("");
    try{
      const now2=new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});
      const mg=h<11?"Morning":h<15?"Midday":h<18?"Snacks":"Evening";
      const t=await callClaude(
        "You are a nutrition AI. Return ONLY valid JSON.",
        `Parse: "${input}". Assume a standard single serving if no quantity. Return JSON: {"type":"food"|"exercise","name":"string","time":"${now2}","mealGroup":"${mg}","calories":number,"protein_g":number,"carbs_g":number,"fat_g":number,"fiber_g":number,"notes":"brief portion e.g. 1 cup, 100g"}`
      );
      const parsed=parseJSON(t);
      const entry={...parsed,id:Date.now(),source:"manual",estimated:true};
      logMeal(entry);
      setLogInput("");
      if(parsed.type==="food"){
        const portion=parsed.notes?`${parsed.notes} · `:"";
        setLogToast({entry,msg:`${portion}${parsed.name} (~${parsed.calories} kcal) · tap to adjust`});
        if(toastTimer.current) clearTimeout(toastTimer.current);
        toastTimer.current=setTimeout(()=>setLogToast(null),6000);
      }
    }catch{setLogError("Couldn't parse that. Try again.");}
    setLogLoading(false);
  };

  const handleLogImage=async()=>{
    if(!imageFile) return;
    setLogLoading(true);setLogError("");
    try{
      const b64=await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result.split(",")[1]);r.onerror=rej;r.readAsDataURL(imageFile);});
      const mg=h<11?"Morning":h<15?"Midday":h<18?"Snacks":"Evening";
      const t=await callClaude("You are a nutrition AI with vision. Return ONLY valid JSON.",[
        {type:"image",source:{type:"base64",media_type:imageFile.type,data:b64}},
        {type:"text",text:`Identify food. Return JSON: {"type":"food","name":"string","time":"${new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}","mealGroup":"${mg}","calories":number,"protein_g":number,"carbs_g":number,"fat_g":number,"fiber_g":number,"notes":"string"}`},
      ],600);
      const parsed=parseJSON(t);
      const entry={...parsed,id:Date.now(),source:"photo",estimated:true};
      logMeal(entry);
      setImageFile(null);setPhotoMode(false);
      setLogToast({entry,msg:`${parsed.name} (~${parsed.calories} kcal) · tap to adjust`});
      if(toastTimer.current) clearTimeout(toastTimer.current);
      toastTimer.current=setTimeout(()=>setLogToast(null),6000);
    }catch{setLogError("Couldn't read the image. Try a clearer photo.");}
    setLogLoading(false);
  };

  const startEdit=(e)=>{setEditingId(e.id);setEditFields({name:e.name,calories:String(e.calories),protein_g:String(e.protein_g||0),carbs_g:String(e.carbs_g||0),fat_g:String(e.fat_g||0),notes:e.notes||""});};
  const saveEdit=(id)=>{updateMeal(id,{...editFields,calories:Number(editFields.calories),protein_g:Number(editFields.protein_g),carbs_g:Number(editFields.carbs_g),fat_g:Number(editFields.fat_g),estimated:false});setEditingId(null);};
  const mealGroups=["Morning","Midday","Snacks","Evening"];
  const grouped=mealGroups.reduce((a,g)=>({...a,[g]:entries.filter(e=>e.mealGroup===g&&e.type!=="exercise")}),{});

  return (
    <div style={{padding:"16px 16px 100px",display:"flex",flexDirection:"column",gap:12}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}@keyframes dotPulse{0%,80%,100%{opacity:0.3;transform:scale(0.8)}40%{opacity:1;transform:scale(1)}}@keyframes scanLine{0%,100%{top:0}50%{top:calc(100% - 2px)}}`}</style>
      <AtmosphereBackground/>

      {/* Greeting card — Nora message identity: pine card, no avatar */}
      <div style={{position:"relative",borderRadius:18,overflow:"hidden",backgroundColor:C.green,boxShadow:"0 4px 20px rgba(31,46,38,0.20)",padding:"20px 20px 22px"}}>
        <div style={{position:"relative"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,marginBottom:6}}>
            <p style={{fontSize:9,fontWeight:700,color:"rgba(168,178,169,0.85)",textTransform:"uppercase",letterSpacing:"0.12em",margin:0}}>{h<12?"Morning":h<17?"Afternoon":"Evening"} · {profile?.name}</p>
          </div>
          {greetingLoad
            ? <div style={{display:"flex",gap:5,paddingTop:2}}>{[0,1,2].map(j=><span key={j} style={{width:5,height:5,borderRadius:"50%",backgroundColor:"rgba(244,242,237,0.4)",display:"inline-block",animation:`dotPulse 1.2s ease ${j*0.2}s infinite`}}/>)}</div>
            : <p style={{fontFamily:serif,fontSize:15,fontWeight:500,color:C.ivory,lineHeight:1.65,margin:0,fontStyle:"italic"}}>{greeting||`Good ${h<12?"morning":h<17?"afternoon":"evening"}, ${profile?.name}.`}</p>
          }
        </div>
      </div>

      {/* Health summary */}
      {Object.keys(healthData).length>0&&(
        <div style={{...card,padding:"14px 16px"}}>
          <p style={{fontSize:9,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.1em",margin:"0 0 10px"}}>Today's health</p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8,textAlign:"center"}}>
            {[{label:"Steps",val:healthData.steps||"—"},{label:"Sleep",val:healthData.sleep?`${healthData.sleep}h`:"—"},{label:"HR",val:healthData.heartRate?`${healthData.heartRate}`:"—"},{label:"Workout",val:healthData.workoutDuration?`${healthData.workoutDuration}m`:"—"}].map(item=>(
              <div key={item.label}>
                <div style={{fontFamily:serif,fontSize:16,fontWeight:600,color:C.green}}>{item.val}</div>
                <div style={{fontSize:9,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em",marginTop:2}}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Today's Progress */}
      {targets&&(
        <div style={{position:"relative",borderRadius:18,overflow:"hidden",backgroundColor:C.card,boxShadow:"0 4px 20px rgba(27,58,45,0.10)",border:"1px solid rgba(155,123,42,0.18)"}}>
          <div style={{position:"relative",padding:"22px 20px 20px"}}>
            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:22}}>
              <div>
                <p style={{fontSize:10,fontWeight:700,color:"rgba(139,107,30,0.75)",textTransform:"uppercase",letterSpacing:"0.12em",margin:"0 0 6px"}}>Today's progress</p>
                <div style={{display:"flex",alignItems:"baseline",gap:7}}>
                  <p style={{fontFamily:serif,fontSize:42,fontWeight:600,color:"#1C3D2B",margin:0,lineHeight:1}}>{Math.round(netCal)}</p>
                  <p style={{fontSize:15,color:"rgba(28,61,43,0.42)",margin:0}}>kcal</p>
                </div>
                <p style={{fontSize:11,color:"rgba(28,61,43,0.38)",margin:"5px 0 0"}}>of {targets.calories} target{burnedCal>0?` · ${burnedCal} burned`:""}</p>
              </div>
              <div style={{backgroundColor:"rgba(155,123,42,0.10)",border:"1px solid rgba(155,123,42,0.22)",borderRadius:14,padding:"11px 14px",textAlign:"center",flexShrink:0}}>
                <p style={{fontFamily:serif,fontSize:26,fontWeight:700,color:"#8A6B1E",margin:0,lineHeight:1}}>{Math.min(Math.round((netCal/(targets.calories||2000))*100),999)}%</p>
                <p style={{fontSize:9,color:"rgba(139,107,30,0.55)",margin:"3px 0 0",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em"}}>of goal</p>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px 16px"}}>
              {[
                {label:"Protein",value:totalPro, max:targets.protein_g,color:"#8A6B1E",unit:"g"},
                {label:"Carbs",  value:totalCarb,max:targets.carbs_g,  color:"#5A8C6E",unit:"g"},
                {label:"Fat",    value:totalFat, max:targets.fat_g,    color:"#4A7A6A",unit:"g"},
                {label:"Water",  value:waterMl,  max:targets.water_ml, color:"#4A7090",unit:"ml"},
              ].map(({label,value,max,color,unit})=>{
                const pct=Math.min(max>0?(value/max)*100:0,100);
                const disp=unit==="ml"&&value>=1000?(value/1000).toFixed(1)+"L":Math.round(value)+unit;
                const maxDisp=unit==="ml"?Math.round((max||0)/1000)+"L":Math.round(max||0)+unit;
                return(
                  <div key={label}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:5}}>
                      <span style={{fontSize:9,fontWeight:700,color:"rgba(28,61,43,0.45)",textTransform:"uppercase",letterSpacing:"0.06em"}}>{label}</span>
                      <span style={{fontSize:12,fontWeight:700,color:"#1C3D2B"}}>{disp}<span style={{fontSize:9,color:"rgba(28,61,43,0.35)",fontWeight:400}}>/{maxDisp}</span></span>
                    </div>
                    <div style={{height:3,backgroundColor:"rgba(28,61,43,0.10)",borderRadius:3,overflow:"hidden"}}>
                      <div style={{width:`${pct}%`,height:"100%",backgroundColor:color,borderRadius:3,transition:"width 0.7s cubic-bezier(0.4,0,0.2,1)"}}/>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}


        {/* Today's challenge — quick view only, data from active_challenges, no duplicated logic */}
        {activeChallenges&&activeChallenges.length>0&&(
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {activeChallenges.map(ac=>{
              const checkedIn=ac.checkIns.includes(localDateStr());
              return(
                <div key={ac.instanceId} style={{...card,padding:"14px 16px",display:"flex",alignItems:"center",gap:12}}>
                  <button
                    onClick={()=>{if(!checkedIn)checkInChallenge(ac.instanceId);}}
                    disabled={checkedIn}
                    style={{width:26,height:26,borderRadius:"50%",border:`1.5px solid ${checkedIn?C.green:C.border}`,backgroundColor:checkedIn?C.green:"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:checkedIn?"default":"pointer",flexShrink:0,padding:0}}>
                    {checkedIn&&<CheckIcon size={13} color={C.bg}/>}
                  </button>
                  <div style={{flex:1,minWidth:0}}>
                    <p style={{fontSize:9,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em",margin:"0 0 2px"}}>Today's challenge</p>
                    <p style={{fontFamily:serif,fontSize:14,fontWeight:600,color:C.text,margin:0,lineHeight:1.3,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{ac.title.replace(/^✦ For Her - |^✦ For Him - /,"")}</p>
                  </div>
                  <button onClick={()=>setActiveTab("ritual")} style={{background:"none",border:"none",color:C.green,fontSize:11,fontWeight:600,cursor:"pointer",padding:0,flexShrink:0,fontFamily:sans,whiteSpace:"nowrap"}}>
                    Ritual →
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Eating window — always visible, independent of the fasting toggle; extended fast (>24h) shows a countdown instead */}
        {fastingMode==="extended" ? (() => {
          const endAt = fastingExtendedStartAt ? new Date(fastingExtendedStartAt).getTime() + (fastingExtendedHours||0)*3600000 : null;
          const remainingMs = endAt!==null ? endAt - Date.now() : null;
          return (
            <div style={{...card,padding:"12px 16px",borderLeft:`3px solid ${C.green}`}}>
              <p style={{fontSize:12,color:C.text,margin:0,lineHeight:1.5}}>
                {remainingMs>0
                  ? <>Fasting · <strong>{fmtRemaining(remainingMs)}</strong> remaining</>
                  : "Fast complete ✓"}
              </p>
            </div>
          );
        })() : (
          <EatingWindowBand fastingStart={fastingStart} fastingEnd={fastingEnd} setActiveTab={setActiveTab}/>
        )}

        {/* Notifications */}
        {waterToast&&<div style={{...card,padding:"12px 16px",display:"flex",alignItems:"center",gap:10,backgroundColor:C.greenLight,border:`1px solid ${C.sage}40`,animation:"fadeIn 0.2s ease"}}><DropIcon size={16} color={C.slate}/><span style={{fontSize:13,color:C.green,fontWeight:500}}>{waterToast}</span></div>}
        {logToast&&<div onClick={()=>{startEdit(logToast.entry);setLogToast(null);clearTimeout(toastTimer.current);}} style={{...card,padding:"12px 16px",display:"flex",alignItems:"center",gap:10,backgroundColor:C.greenLight,border:`1px solid ${C.sage}40`,animation:"fadeIn 0.2s ease",cursor:"pointer"}}><CheckIcon size={14} color={C.sage}/><span style={{fontSize:13,color:C.green,fontWeight:500,flex:1}}>{logToast.msg}</span><EditIcon size={13} color={C.muted}/></div>}

        {/* Log input */}
        <div style={{...card,padding:"14px"}}>
          <div style={{display:"flex",gap:8,marginBottom:photoMode&&imageFile?10:0}}>
            <input style={{...inp,flex:1}} placeholder={logLoading?"Analysing…":"Log food, drink, or exercise…"} value={logInput} disabled={logLoading||photoMode} onChange={e=>setLogInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!logLoading)handleLogText();}}/>
            <button onClick={()=>plateFileRef.current?.click()} title="Analyse plate photo" style={{width:44,height:44,borderRadius:10,border:`1px solid ${C.border}`,backgroundColor:C.card,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <CameraIcon size={16} color={C.muted}/>
            </button>
            <button onClick={()=>{setBarcodeOpen(true);startBarcodeCamera();}} title="Scan barcode" style={{width:44,height:44,borderRadius:10,border:`1px solid ${barcodeOpen?C.green:C.border}`,backgroundColor:barcodeOpen?`${C.green}18`:C.card,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M2 6V3.5A1.5 1.5 0 0 1 3.5 2H6" stroke={barcodeOpen?C.green:C.muted} strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M14 2h2.5A1.5 1.5 0 0 1 18 3.5V6" stroke={barcodeOpen?C.green:C.muted} strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M18 14v2.5A1.5 1.5 0 0 1 16.5 18H14" stroke={barcodeOpen?C.green:C.muted} strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M6 18H3.5A1.5 1.5 0 0 1 2 16.5V14" stroke={barcodeOpen?C.green:C.muted} strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="6" y1="8" x2="6" y2="12" stroke={barcodeOpen?C.green:C.muted} strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="8.5" y1="8" x2="8.5" y2="12" stroke={barcodeOpen?C.green:C.muted} strokeWidth="2" strokeLinecap="round"/>
                <line x1="11" y1="8" x2="11" y2="12" stroke={barcodeOpen?C.green:C.muted} strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="13.5" y1="8" x2="13.5" y2="12" stroke={barcodeOpen?C.green:C.muted} strokeWidth="1" strokeLinecap="round"/>
              </svg>
            </button>
            <button onClick={handleLogText} disabled={logLoading||!logInput.trim()||photoMode} style={{width:44,height:44,borderRadius:10,backgroundColor:logLoading||!logInput.trim()||photoMode?"#C8D5D1":C.green,border:"none",cursor:logLoading||!logInput.trim()||photoMode?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"background-color 0.15s"}}>
              {logLoading?<span style={{width:16,height:16,border:`2px solid ${C.bg}`,borderTopColor:"transparent",borderRadius:"50%",display:"inline-block",animation:"spin 0.8s linear infinite"}}/>:<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M14 2L2 6.5l5 1.5 1.5 5L14 2Z" stroke={C.bg} strokeWidth="1.4" strokeLinejoin="round"/></svg>}
            </button>
          </div>
          <input type="file" accept="image/*" ref={fileRef} style={{display:"none"}} onChange={e=>{if(e.target.files?.[0]){setImageFile(e.target.files[0]);setPhotoMode(true);}}}/>
          <input type="file" accept="image/*" ref={plateFileRef} style={{display:"none"}} onChange={e=>{if(e.target.files?.[0])handlePlatePhoto(e.target.files[0]);}}/>
          {photoMode&&imageFile&&(
            <div style={{display:"flex",gap:8,alignItems:"center",padding:"10px 12px",backgroundColor:C.card,borderRadius:10,border:`1px solid ${C.border}`}}>
              <span style={{fontSize:13,color:C.amber,fontWeight:500,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{imageFile.name}</span>
              <button onClick={handleLogImage} disabled={logLoading} style={{padding:"8px 14px",backgroundColor:logLoading?"#C8D5D1":C.green,color:C.bg,border:"none",borderRadius:8,fontSize:12,fontWeight:500,cursor:logLoading?"not-allowed":"pointer"}}>{logLoading?"Analysing…":"Analyse"}</button>
              <button onClick={()=>{setImageFile(null);setPhotoMode(false);}} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:18}}>×</button>
            </div>
          )}
          {logError&&<p style={{fontSize:12,color:C.error,margin:"8px 0 0"}}>{logError}</p>}
        </div>

        {/* Water tracker */}
        <div style={{...card,padding:"14px 16px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <div style={{display:"flex",alignItems:"center",gap:6}}><DropIcon size={16} color={C.slate}/><span style={{fontFamily:serif,fontSize:13,fontWeight:600,color:C.text}}>Water · {waterMl>=1000?(waterMl/1000).toFixed(1)+"L":waterMl+"ml"} / {targets?Math.round(targets.water_ml/1000)+"L":"2.5L"}</span></div>
            <span style={{fontSize:11,color:C.slate,fontWeight:500}}>{targets?Math.round((waterMl/(targets.water_ml||2500))*100):0}%</span>
          </div>
          <div style={{height:4,backgroundColor:C.track,borderRadius:10,marginBottom:10,overflow:"hidden"}}><div style={{width:`${Math.min((waterMl/(targets?.water_ml||2500))*100,100)}%`,height:"100%",backgroundColor:C.slate,borderRadius:10,transition:"width 0.6s ease"}}/></div>
          <div style={{display:"flex",gap:6}}>
            {[150,250,500].map(ml=><button key={ml} onClick={()=>addWater(ml)} style={{flex:1,padding:"9px 0",borderRadius:9,border:`1px solid ${C.green}`,backgroundColor:"transparent",color:C.green,fontSize:12,fontWeight:500,cursor:"pointer"}}>+{ml}ml</button>)}
            <button onClick={()=>setShowOtherWater(v=>!v)} style={{flex:1,padding:"9px 0",borderRadius:9,border:`1px solid ${C.green}`,backgroundColor:"transparent",color:C.green,fontSize:12,cursor:"pointer"}}>Other</button>
          </div>
          {showOtherWater&&(
            <div style={{display:"flex",gap:6,marginTop:8,animation:"fadeIn 0.2s ease"}}>
              <input type="number" min="1" max="5000" placeholder="Amount in ml" value={customWaterMl} onChange={e=>setCustomWaterMl(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&Number(customWaterMl)>0){addWater(Number(customWaterMl));setCustomWaterMl("");setShowOtherWater(false);}}} style={{...inp,flex:1}}/>
              <button onClick={()=>{if(Number(customWaterMl)>0){addWater(Number(customWaterMl));setCustomWaterMl("");setShowOtherWater(false);}}} style={{padding:"10px 16px",backgroundColor:customWaterMl?C.green:C.track,color:customWaterMl?C.bg:C.muted,border:"none",borderRadius:9,fontSize:13,fontWeight:500,cursor:customWaterMl?"pointer":"not-allowed",transition:"background-color 0.15s"}}>Add</button>
            </div>
          )}
        </div>

        {/* Food log */}
        {entries.length>0&&(
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <LeafDecor size={16}/>
              <h3 style={{fontFamily:serif,fontSize:18,color:C.green,fontWeight:600,margin:0}}>Today's log</h3>
              <button onClick={clearTodayMeals} style={{marginLeft:"auto",fontSize:11,color:C.error,background:"none",border:"none",cursor:"pointer"}}>Clear all</button>
            </div>
            {mealGroups.map(group=>{
              const items=grouped[group]||[];
              if(!items.length) return null;
              return(
                <div key={group} style={{...card,overflow:"hidden"}}>
                  <div style={{padding:"9px 14px 7px",borderBottom:`1px solid ${C.border}`}}><span style={{fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em"}}>{group}</span></div>
                  {items.map((entry,idx)=>(
                    <div key={entry.id}>
                      {idx>0&&<div style={{height:1,backgroundColor:C.border,margin:"0 14px"}}/>}
                      {editingId===entry.id?(
                        <div style={{padding:"12px 14px",display:"flex",flexDirection:"column",gap:8}}>
                          <input style={inp} value={editFields.name} onChange={e=>setEditFields(f=>({...f,name:e.target.value}))} placeholder="Name"/>
                          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:6}}>
                            {[["calories","kcal"],["protein_g","prot"],["carbs_g","carbs"],["fat_g","fat"]].map(([k,l])=>(
                              <div key={k}><label style={{fontSize:10,color:C.muted,display:"block",marginBottom:3}}>{l}</label><input type="number" style={{...inp,padding:"8px 10px",fontSize:13}} value={editFields[k]} onChange={e=>setEditFields(f=>({...f,[k]:e.target.value}))}/></div>
                            ))}
                          </div>
                          <input style={inp} value={editFields.notes} onChange={e=>setEditFields(f=>({...f,notes:e.target.value}))} placeholder="Portion notes"/>
                          <div style={{display:"flex",gap:8}}>
                            <button onClick={()=>saveEdit(entry.id)} style={{flex:2,padding:"10px",backgroundColor:C.green,color:C.bg,border:"none",borderRadius:9,fontSize:13,fontWeight:500,cursor:"pointer"}}>Save</button>
                            <button onClick={()=>setEditingId(null)} style={{flex:1,padding:"10px",backgroundColor:"transparent",color:C.green,border:`1px solid ${C.green}`,borderRadius:9,fontSize:13,cursor:"pointer"}}>Cancel</button>
                          </div>
                        </div>
                      ):(
                        <div style={{padding:"10px 14px",display:"flex",alignItems:"center",gap:10}}>
                          <div style={{width:6,height:6,borderRadius:"50%",backgroundColor:C.gold,flexShrink:0}}/>
                          <div style={{flex:1,minWidth:0}}>
                            <p style={{fontSize:13,color:C.text,fontWeight:500,margin:0,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{entry.name}</p>
                            {entry.notes&&<p style={{fontSize:11,color:C.muted,margin:"1px 0 0"}}>{entry.notes}</p>}
                          </div>
                          <span style={{fontSize:13,fontWeight:600,color:C.text,flexShrink:0}}>{Math.abs(Math.round(entry.calories))}<span style={{fontSize:11,color:C.muted,fontWeight:400}}> kcal{entry.estimated?" ~":""}</span></span>
                          <button onClick={()=>startEdit(entry)} style={{background:"none",border:"none",cursor:"pointer",padding:4,flexShrink:0}}><EditIcon size={13} color={C.muted}/></button>
                          <button onClick={()=>deleteMeal(entry.id)} style={{background:"none",border:"none",cursor:"pointer",padding:4,color:C.muted,fontSize:16,lineHeight:1,flexShrink:0}}>×</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}

        {/* Movement — exercise entries, separate from meals (no mealGroup dependency) */}
        {exerE.length>0&&(
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <MovementIcon size={15} color={C.sage}/>
              <h3 style={{fontFamily:serif,fontSize:18,color:C.green,fontWeight:600,margin:0}}>Movement</h3>
              <span style={{marginLeft:"auto",fontSize:12,fontWeight:600,color:C.sage}}>−{Math.round(burnedCal)} kcal today</span>
            </div>
            <div style={{...card,overflow:"hidden"}}>
              {exerE.map((entry,idx)=>(
                <div key={entry.id}>
                  {idx>0&&<div style={{height:1,backgroundColor:C.border,margin:"0 14px"}}/>}
                  {editingId===entry.id?(
                    <div style={{padding:"12px 14px",display:"flex",flexDirection:"column",gap:8}}>
                      <input style={inp} value={editFields.name} onChange={e=>setEditFields(f=>({...f,name:e.target.value}))} placeholder="Name"/>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:6}}>
                        {[["calories","kcal"],["protein_g","prot"],["carbs_g","carbs"],["fat_g","fat"]].map(([k,l])=>(
                          <div key={k}><label style={{fontSize:10,color:C.muted,display:"block",marginBottom:3}}>{l}</label><input type="number" style={{...inp,padding:"8px 10px",fontSize:13}} value={editFields[k]} onChange={e=>setEditFields(f=>({...f,[k]:e.target.value}))}/></div>
                        ))}
                      </div>
                      <input style={inp} value={editFields.notes} onChange={e=>setEditFields(f=>({...f,notes:e.target.value}))} placeholder="Duration / notes"/>
                      <div style={{display:"flex",gap:8}}>
                        <button onClick={()=>saveEdit(entry.id)} style={{flex:2,padding:"10px",backgroundColor:C.green,color:C.bg,border:"none",borderRadius:9,fontSize:13,fontWeight:500,cursor:"pointer"}}>Save</button>
                        <button onClick={()=>setEditingId(null)} style={{flex:1,padding:"10px",backgroundColor:"transparent",color:C.green,border:`1px solid ${C.green}`,borderRadius:9,fontSize:13,cursor:"pointer"}}>Cancel</button>
                      </div>
                    </div>
                  ):(
                    <div style={{padding:"10px 14px",display:"flex",alignItems:"center",gap:10}}>
                      <div style={{width:6,height:6,borderRadius:"50%",backgroundColor:C.sage,flexShrink:0}}/>
                      <div style={{flex:1,minWidth:0}}>
                        <p style={{fontSize:13,color:C.text,fontWeight:500,margin:0,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{entry.name}</p>
                        {entry.notes&&<p style={{fontSize:11,color:C.muted,margin:"1px 0 0"}}>{entry.notes}</p>}
                      </div>
                      <span style={{fontSize:13,fontWeight:600,color:C.sage,flexShrink:0}}>−{Math.abs(Math.round(entry.calories))}<span style={{fontSize:11,color:C.muted,fontWeight:400}}> kcal{entry.estimated?" ~":""}</span></span>
                      <button onClick={()=>startEdit(entry)} style={{background:"none",border:"none",cursor:"pointer",padding:4,flexShrink:0}}><EditIcon size={13} color={C.muted}/></button>
                      <button onClick={()=>deleteMeal(entry.id)} style={{background:"none",border:"none",cursor:"pointer",padding:4,color:C.muted,fontSize:16,lineHeight:1,flexShrink:0}}>×</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Circadian tip */}
        <CircadianCard/>

        {/* Biological insight — opt-in only, one per user: cycle, perimenopause or male rhythm */}
        {isFemale&&cyclePhase&&(
          <div style={{...card,padding:"16px 18px",borderLeft:`3px solid ${cyclePhase.color}`}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
              <p style={{fontFamily:serif,fontSize:13,fontWeight:600,color:cyclePhase.color,margin:0}}>{cyclePhase.label} Phase</p>
              <span style={{fontSize:10,color:cyclePhase.color,backgroundColor:`${cyclePhase.color}18`,padding:"2px 9px",borderRadius:20,fontWeight:600,letterSpacing:"0.04em"}}>Day {cyclePhase.day}{(cyclePhase.periodLengthEstimated||cyclePhase.cycleLengthEstimated)&&" (est.)"}</span>
            </div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,marginBottom:4}}>
              <p style={{fontSize:9,fontWeight:700,color:cyclePhase.color,textTransform:"uppercase",letterSpacing:"0.08em",margin:0}}>✦ Cycle Insight</p>
            </div>
            <p style={{fontFamily:serif,fontSize:12,color:C.text,margin:0,lineHeight:1.6}}>{cyclePhase.tip}</p>
          </div>
        )}
        {isFemale&&isPeri&&(
          <div style={{...card,padding:"10px 14px",borderLeft:`2px solid ${C.muted}`}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,marginBottom:3}}>
              <p style={{fontSize:10,fontWeight:700,color:C.amber,textTransform:"uppercase",letterSpacing:"0.05em",margin:0}}>Hormonal balance</p>
            </div>
            <p style={{fontSize:11,color:C.muted,margin:0,lineHeight:1.45,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{pickDailyVariant("perimenopause_tip",HORMONAL_TIPS).tip}</p>
          </div>
        )}
        {isMale&&maleTip&&(
          <div style={{...card,padding:"10px 14px",borderLeft:`2px solid ${C.muted}`}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,marginBottom:3}}>
              <p style={{fontSize:10,fontWeight:700,color:C.green,textTransform:"uppercase",letterSpacing:"0.05em",margin:0}}>{maleTip.icon} {maleTip.title}</p>
            </div>
            <p style={{fontSize:11,color:C.muted,margin:0,lineHeight:1.45,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{maleTip.tip}</p>
          </div>
        )}
        {showCycleInvite&&(
          <div style={{...card,padding:"10px 14px",borderLeft:`2px solid ${C.muted}`}}>
            <button onClick={()=>setActiveTab("me")} style={{display:"flex",alignItems:"center",justifyContent:"space-between",width:"100%",background:"none",border:"none",padding:0,cursor:"pointer",textAlign:"left"}}>
              <span style={{fontSize:11,color:C.muted,lineHeight:1.5}}>Nora poate ține cont de ritmul tău — activează din Me →</span>
            </button>
          </div>
        )}

        {/* Today's Tip — general life/health, for everyone, independent of Biological personalisation */}
        <div style={{...card,padding:"10px 14px",borderLeft:`2px solid ${C.gold}60`}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,marginBottom:3}}>
            <p style={{fontSize:9,fontWeight:700,color:C.gold,textTransform:"uppercase",letterSpacing:"0.08em",margin:0}}>✦ Today's Tip</p>
          </div>
          <p style={{fontSize:11,color:C.muted,margin:0,lineHeight:1.45,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{getDailyFact()}</p>
        </div>

        {/* Evening reflection — closing the day, only after ~18:00 — Nora message identity: pine card, no avatar */}
        {isEvening&&eveningSummaryLoad&&(
          <div style={{...card,padding:"20px 22px",backgroundColor:C.green,border:"none",boxShadow:"0 4px 20px rgba(31,46,38,0.20)"}}>
            <div style={{display:"flex",gap:5}}>
              {[0,1,2].map(j=><div key={j} style={{width:6,height:6,borderRadius:"50%",backgroundColor:"rgba(244,242,237,0.5)",animation:`dotPulse 1.2s ease ${j*0.2}s infinite`}}/>)}
            </div>
          </div>
        )}
        {isEvening&&eveningSummary&&(
          <div style={{...card,padding:"20px 22px",animation:"fadeIn 0.4s ease",backgroundColor:C.green,border:"none",boxShadow:"0 4px 20px rgba(31,46,38,0.20)"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,marginBottom:10}}>
              <p style={{fontSize:9,fontWeight:700,color:"rgba(168,178,169,0.85)",textTransform:"uppercase",letterSpacing:"0.12em",margin:0}}>Evening Reflection</p>
            </div>
            <p style={{fontFamily:serif,fontSize:15,fontWeight:500,color:C.ivory,lineHeight:1.75,margin:0,fontStyle:"italic"}}>{eveningSummary}</p>
          </div>
        )}

      {/* ── Plate analysis modal ── */}
      {plateMode&&(
        <div style={{position:"fixed",inset:0,backgroundColor:"rgba(0,0,0,0.72)",zIndex:300,display:"flex",flexDirection:"column"}}>
          <div style={{marginTop:56,flex:1,display:"flex",flexDirection:"column",backgroundColor:C.card,borderRadius:"22px 22px 0 0",overflow:"hidden"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 18px 12px",borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
              <div>
                <p style={{fontSize:16,fontWeight:700,color:C.text,margin:0,fontFamily:serif}}>Plate Analysis</p>
                <p style={{fontSize:12,color:C.muted,margin:"2px 0 0"}}>Claude Vision · USDA cross-reference</p>
              </div>
              <button onClick={closePlateModal} style={{width:32,height:32,borderRadius:"50%",border:`1px solid ${C.border}`,background:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,color:C.muted,lineHeight:1}}>×</button>
            </div>
            <div style={{overflowY:"auto",flex:1,padding:"14px 16px 32px"}}>
              {platePreviewUrl&&(
                <div style={{width:"100%",height:200,borderRadius:16,overflow:"hidden",marginBottom:14,backgroundColor:"#000",flexShrink:0}}>
                  <img src={platePreviewUrl} alt="Plate" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                </div>
              )}
              {plateLoad&&(
                <div style={{textAlign:"center",padding:"36px 0"}}>
                  <div style={{width:36,height:36,border:`3px solid ${C.border}`,borderTopColor:C.green,borderRadius:"50%",animation:"spin 0.8s linear infinite",margin:"0 auto 16px"}}/>
                  <p style={{fontSize:14,fontWeight:600,color:C.text,margin:"0 0 4px"}}>Analysing your plate…</p>
                  <p style={{fontSize:12,color:C.muted,margin:0}}>Claude Vision · USDA cross-reference</p>
                </div>
              )}
              {plateError&&!plateLoad&&(
                <div style={{backgroundColor:"#FFF0F0",borderRadius:12,padding:"14px 16px",border:"1px solid #FFCCCC",marginBottom:14}}>
                  <p style={{fontSize:13,color:C.error,margin:"0 0 10px"}}>{plateError}</p>
                  <button onClick={()=>{setPlateError("");plateFileRef.current?.click();}} style={{fontSize:12,color:C.green,background:"none",border:"none",cursor:"pointer",fontWeight:500,padding:0}}>Try another photo →</button>
                </div>
              )}
              {plateFoodData.length>0&&!plateLoad&&(()=>{
                const adjusted=plateFoodData.map((food,i)=>{
                  const grams=Math.max(1,parseFloat(editPortions[i])||food.portion_grams);
                  if(grams===food.portion_grams) return food;
                  const factor=food.per100g?grams/100:grams/food.portion_grams;
                  const p=food.per100g||{};
                  return{...food,portion_grams:grams,
                    kcal:      food.per100g?Math.round((p.kcal||0)*factor)         :Math.round(food.kcal*(grams/food.portion_grams)),
                    protein_g: food.per100g?Math.round((p.protein||0)*factor*10)/10:Math.round(food.protein_g*(grams/food.portion_grams)*10)/10,
                    carbs_g:   food.per100g?Math.round((p.carbs||0)*factor*10)/10  :Math.round(food.carbs_g*(grams/food.portion_grams)*10)/10,
                    fat_g:     food.per100g?Math.round((p.fat||0)*factor*10)/10    :Math.round(food.fat_g*(grams/food.portion_grams)*10)/10,
                  };
                });
                const totK=Math.round(adjusted.reduce((s,f)=>s+(f.kcal||0),0));
                const totP=Math.round(adjusted.reduce((s,f)=>s+(f.protein_g||0),0)*10)/10;
                const totC=Math.round(adjusted.reduce((s,f)=>s+(f.carbs_g||0),0)*10)/10;
                const totF=Math.round(adjusted.reduce((s,f)=>s+(f.fat_g||0),0)*10)/10;
                return(
                  <>
                    <p style={{fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em",margin:"0 0 10px"}}>Foods identified</p>
                    {adjusted.map((food,i)=>(
                      <div key={i} style={{...card,padding:"12px 14px",marginBottom:8,animation:"fadeIn 0.2s ease"}}>
                        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:8,marginBottom:8}}>
                          <div style={{flex:1,minWidth:0}}>
                            <p style={{fontSize:14,fontWeight:600,color:C.text,margin:"0 0 2px"}}>{food.name}</p>
                            {food.source==="USDA"&&<span style={{fontSize:9,fontWeight:700,color:C.green,backgroundColor:`${C.green}12`,borderRadius:5,padding:"2px 5px",letterSpacing:"0.04em",textTransform:"uppercase"}}>USDA</span>}
                          </div>
                          <span style={{fontSize:16,fontWeight:700,color:C.green,flexShrink:0}}>{food.kcal} kcal</span>
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <span style={{fontSize:12,color:C.muted,flexShrink:0}}>Portion:</span>
                          <input type="number" min="1" max="2000" value={editPortions[i]||""} onChange={e=>setEditPortions(p=>({...p,[i]:e.target.value}))} style={{...inp,width:68,textAlign:"center",padding:"6px 8px",fontSize:13}} placeholder={String(food.portion_grams)}/>
                          <span style={{fontSize:12,color:C.muted}}>g</span>
                          <div style={{marginLeft:"auto",display:"flex",gap:8,flexShrink:0}}>
                            <span style={{fontSize:11,color:C.muted}}>{food.protein_g}g P</span>
                            <span style={{fontSize:11,color:C.muted}}>{food.carbs_g}g C</span>
                            <span style={{fontSize:11,color:C.muted}}>{food.fat_g}g F</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div style={{...card,padding:"14px 16px",marginTop:6,marginBottom:14}}>
                      <p style={{fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em",margin:"0 0 10px"}}>Total meal</p>
                      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6}}>
                        {[{label:"Calories",value:totK,unit:"kcal",color:C.green},{label:"Protein",value:totP,unit:"g",color:C.gold},{label:"Carbs",value:totC,unit:"g",color:C.amber},{label:"Fat",value:totF,unit:"g",color:C.sage}].map(m=>(
                          <div key={m.label} style={{backgroundColor:C.bg,borderRadius:10,padding:"9px 4px",textAlign:"center",border:`1px solid ${C.border}`}}>
                            <p style={{fontSize:15,fontWeight:700,color:m.color,margin:0,lineHeight:1}}>{m.value}</p>
                            <p style={{fontSize:9,color:C.muted,margin:"3px 0 0"}}>{m.label}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <button onClick={logPlateMeal} style={{width:"100%",padding:"14px",backgroundColor:C.green,color:C.bg,border:"none",borderRadius:14,fontSize:15,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8l4 4 6-6" stroke={C.bg} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      Log this meal
                    </button>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ── Barcode scanner modal ── */}
      {barcodeOpen && (
        <div style={{position:"fixed",inset:0,backgroundColor:"rgba(0,0,0,0.72)",zIndex:300,display:"flex",flexDirection:"column"}} onClick={closeBarcodeModal}>
          <div onClick={e=>e.stopPropagation()} style={{marginTop:56,flex:1,display:"flex",flexDirection:"column",backgroundColor:C.card,borderRadius:"22px 22px 0 0",overflow:"hidden"}}>
            {/* Header */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 18px 12px",borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
              <div>
                <p style={{fontSize:16,fontWeight:700,color:C.text,margin:0}}>Scan Barcode</p>
                <p style={{fontSize:12,color:C.muted,margin:"2px 0 0"}}>Open Food Facts · USDA FoodData Central</p>
              </div>
              <button onClick={closeBarcodeModal} style={{width:32,height:32,borderRadius:"50%",border:`1px solid ${C.border}`,background:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,color:C.muted,lineHeight:1}}>×</button>
            </div>

            <div style={{overflowY:"auto",flex:1,padding:"14px 16px 32px"}}>
              {/* Camera viewfinder */}
              {cameraActive && !barcodeResult && !barcodeLoad && (
                <div style={{position:"relative",borderRadius:16,overflow:"hidden",marginBottom:14,backgroundColor:"#000",aspectRatio:"4/3"}}>
                  <video ref={videoRef} autoPlay playsInline muted style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>
                  {/* Scan frame + animated line */}
                  <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <div style={{width:"72%",height:"34%",border:`2px solid ${C.gold}`,borderRadius:10,position:"relative",overflow:"hidden"}}>
                      <div style={{position:"absolute",left:0,right:0,height:2,backgroundColor:C.gold,opacity:0.8,animation:"scanLine 2s ease-in-out infinite"}}/>
                    </div>
                  </div>
                  <div style={{position:"absolute",bottom:10,left:0,right:0,textAlign:"center"}}>
                    <span style={{fontSize:12,color:"#fff",backgroundColor:"rgba(0,0,0,0.55)",padding:"4px 14px",borderRadius:20}}>Scanning automatically…</span>
                  </div>
                </div>
              )}

              {/* Manual barcode entry */}
              {!barcodeResult && (
                <div style={{marginBottom:14}}>
                  <p style={{fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em",margin:"0 0 8px"}}>
                    {cameraActive ? "Or enter barcode manually" : "Enter barcode number"}
                  </p>
                  <div style={{display:"flex",gap:8}}>
                    <input type="number" placeholder="e.g. 5000112637922" value={manualBarcode}
                      onChange={e=>setManualBarcode(e.target.value)}
                      onKeyDown={e=>{if(e.key==="Enter"&&manualBarcode.length>=8) lookupBarcode(manualBarcode);}}
                      style={{...inp,flex:1,appearance:"textfield"}}/>
                    <button onClick={()=>{if(manualBarcode.length>=8) lookupBarcode(manualBarcode);}}
                      disabled={manualBarcode.length<8||barcodeLoad}
                      style={{padding:"10px 16px",backgroundColor:manualBarcode.length>=8?C.green:"#C8D5D1",color:C.bg,border:"none",borderRadius:9,fontSize:13,fontWeight:500,cursor:manualBarcode.length>=8?"pointer":"not-allowed"}}>
                      Look up
                    </button>
                  </div>
                </div>
              )}

              {/* Loading */}
              {barcodeLoad && (
                <div style={{textAlign:"center",padding:"36px 0"}}>
                  <div style={{width:28,height:28,border:`2.5px solid ${C.border}`,borderTopColor:C.green,borderRadius:"50%",animation:"spin 0.8s linear infinite",margin:"0 auto 12px"}}/>
                  <p style={{fontSize:13,color:C.muted,margin:0}}>Looking up product…</p>
                </div>
              )}

              {/* Error */}
              {barcodeError && !barcodeLoad && (
                <div style={{backgroundColor:`${C.error}14`,borderRadius:12,padding:"14px 16px",marginBottom:14,animation:"fadeIn 0.2s ease"}}>
                  <p style={{fontSize:13,color:C.error,margin:"0 0 8px"}}>{barcodeError}</p>
                  <button onClick={()=>{setBarcodeError("");setManualBarcode("");startBarcodeCamera();}} style={{fontSize:12,color:C.green,background:"none",border:"none",cursor:"pointer",padding:0,fontWeight:600}}>Try scanning again</button>
                </div>
              )}

              {/* Product result */}
              {barcodeResult && !barcodeLoad && (() => {
                const gramsNum = Math.max(1, parseFloat(barcodeGrams) || 100);
                const factor   = gramsNum / 100;
                return (
                <div style={{animation:"fadeIn 0.25s ease"}}>
                  {barcodeResult.image && (
                    <div style={{width:"100%",height:180,borderRadius:14,overflow:"hidden",marginBottom:14}}>
                      <img src={barcodeResult.image} alt={barcodeResult.name} style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>{e.target.parentNode.style.display="none";}}/>
                    </div>
                  )}
                  <div style={{...card,padding:"16px",marginBottom:10}}>
                    {/* Name + Nutri-Score */}
                    <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:10,marginBottom:12}}>
                      <div style={{flex:1,minWidth:0}}>
                        {barcodeResult.brand && <p style={{fontSize:11,color:C.muted,margin:"0 0 3px"}}>{barcodeResult.brand}</p>}
                        <p style={{fontSize:16,fontWeight:700,color:C.text,margin:"0 0 3px",lineHeight:1.3}}>{barcodeResult.name}</p>
                        <p style={{fontSize:11,color:C.muted,margin:0}}>per 100g · {barcodeResult.source}</p>
                      </div>
                      {barcodeResult.nutriScore && (() => {
                        const bg={A:"#00803E",B:"#85BB2F",C:"#FFCC00",D:"#FF6600",E:"#FF0000"}[barcodeResult.nutriScore]||C.muted;
                        return(
                          <div style={{backgroundColor:bg,borderRadius:10,padding:"6px 10px",textAlign:"center",flexShrink:0,minWidth:44}}>
                            <p style={{fontSize:8,fontWeight:700,color:"#fff",margin:"0 0 1px",letterSpacing:"0.05em",textTransform:"uppercase"}}>Nutri</p>
                            <p style={{fontSize:22,fontWeight:900,color:"#fff",margin:0,lineHeight:1}}>{barcodeResult.nutriScore}</p>
                          </div>
                        );
                      })()}
                    </div>
                    {/* Amount consumed */}
                    <div style={{marginBottom:12}}>
                      <p style={{fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",margin:"0 0 6px"}}>Amount consumed</p>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <input type="number" value={barcodeGrams} onChange={e=>setBarcodeGrams(e.target.value)} style={{...inp,width:90,flexShrink:0}}/>
                        <span style={{fontSize:13,color:C.muted}}>grams</span>
                      </div>
                    </div>
                    {/* Macros — scaled to amount consumed */}
                    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginBottom:12}}>
                      {[
                        {label:"Calories",value:Math.round(barcodeResult.kcal*factor),unit:"kcal",color:C.green},
                        {label:"Protein", value:Math.round(barcodeResult.protein*factor*10)/10,unit:"g", color:C.gold},
                        {label:"Carbs",   value:Math.round(barcodeResult.carbs*factor*10)/10,unit:"g",   color:C.amber},
                        {label:"Fat",     value:Math.round(barcodeResult.fat*factor*10)/10,unit:"g",     color:C.sage},
                      ].map(m=>(
                        <div key={m.label} style={{backgroundColor:C.bg,borderRadius:10,padding:"9px 4px",textAlign:"center",border:`1px solid ${C.border}`}}>
                          <p style={{fontSize:15,fontWeight:700,color:m.color,margin:0,lineHeight:1}}>{m.value}</p>
                          <p style={{fontSize:9,color:C.muted,margin:"3px 0 0"}}>{m.label}</p>
                        </div>
                      ))}
                    </div>
                    {/* Ingredients */}
                    {barcodeResult.ingredients && (
                      <div style={{marginBottom:12}}>
                        <p style={{fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",margin:"0 0 6px"}}>Ingredients</p>
                        <p style={{fontSize:11,color:C.text,margin:0,lineHeight:1.65,backgroundColor:C.bg,borderRadius:9,padding:"10px 12px",border:`1px solid ${C.border}`}}>{barcodeResult.ingredients}</p>
                      </div>
                    )}
                    {/* Log button */}
                    <button onClick={logBarcodeProduct} style={{width:"100%",padding:"13px",backgroundColor:C.green,color:C.bg,border:"none",borderRadius:12,fontSize:14,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8l4 4 6-6" stroke={C.bg} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      Add to today's log
                    </button>
                  </div>
                  <button onClick={()=>{setBarcodeResult(null);setBarcodeGrams("100");setBarcodeError("");setManualBarcode("");startBarcodeCamera();}} style={{width:"100%",padding:"12px",backgroundColor:"transparent",color:C.green,border:`1.5px solid ${C.green}`,borderRadius:12,fontSize:13,fontWeight:500,cursor:"pointer"}}>
                    Scan another product
                  </button>
                </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function parseTimeToH(timeStr) {
  if (!timeStr) return null;
  const m = timeStr.match(/(\d+):(\d+)(?::\d+)?\s*(AM|PM)?/i);
  if (!m) return null;
  let h = parseInt(m[1]);
  const min = parseInt(m[2]);
  const ampm = m[3]?.toUpperCase();
  if (ampm === "PM" && h < 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  return h + min / 60;
}

const CIRCADIAN_TIP_POOLS = {
  overnightRest: { icon:"🌙", title:"Overnight rest", tips:[
    "Quality sleep is when your body rebuilds and hormones reset. Protect this recovery window.",
    "Growth hormone peaks in early deep sleep — a consistent bedtime does more for recovery than any supplement.",
    "Core body temperature drops to enable deep sleep. A cool, dark room supports this more than most people realise.",
    "Blood sugar naturally stabilises overnight when sleep is uninterrupted — screens and late snacks work against it.",
    "The glymphatic system clears metabolic waste from the brain almost exclusively during deep sleep.",
  ]},
  wakeLight: { icon:"🌅", title:"Wake & light", tips:[
    "Step outside within 30 min of sunrise — natural light anchors your circadian clock and boosts serotonin.",
    "Morning light exposure sets your cortisol rhythm for the whole day — even a cloudy sky provides enough lux.",
    "Ten minutes of outdoor light beats any indoor bulb for circadian signalling — intensity matters more than duration indoors.",
    "Delaying morning light exposure pushes your whole sleep-wake cycle later — consistency here compounds over weeks.",
    "Pairing morning light with movement — even just a short walk — amplifies the alertness signal to your brain.",
  ]},
  breakfast: { icon:"🍳", title:"Breakfast window", tips:[
    "Eat within 60 min of waking. Protein at breakfast stabilises blood sugar and curbs cravings all day.",
    "A protein-forward breakfast blunts the mid-morning energy dip better than a carb-heavy one.",
    "Breaking your fast with fibre and protein — not just carbohydrate — steadies insulin response for hours.",
    "Eggs, yoghurt or legumes at breakfast support satiety longer than cereal or pastries alone.",
    "The first meal sets the tone for glucose control for the rest of the day — starting with protein helps.",
  ]},
  peakMetabolism: { icon:"☀️", title:"Peak metabolism", tips:[
    "Your body processes nutrients most efficiently now — make this your most nutritious meal.",
    "Insulin sensitivity tends to peak around midday, making this a good window for your largest meal.",
    "Digestive enzyme activity is typically highest in this window — a heavier, nutrient-dense meal is well tolerated now.",
    "Core temperature and metabolic rate run slightly higher at midday, supporting efficient nutrient processing.",
    "This is a strong window for protein-dense meals — muscle protein synthesis responds well to midday intake.",
  ]},
  afternoonFuel: { icon:"🌤", title:"Afternoon fuel", tips:[
    "A protein + complex-carb snack prevents the 3 pm energy dip. Avoid refined sugar.",
    "Blood sugar dips naturally in the early afternoon — pairing protein with fibre softens the drop.",
    "A handful of nuts or seeds with fruit is a steadier afternoon choice than something sugary.",
    "Caffeine after 2 pm can still be circulating at bedtime — worth timing your last cup earlier.",
    "A short walk after an afternoon snack helps shuttle glucose into muscle instead of storage.",
  ]},
  dinnerWindow: { icon:"🌆", title:"Dinner window", tips:[
    "Aim to finish eating 2–3 hours before sleep to support melatonin and deeper rest.",
    "A lighter dinner, eaten earlier, tends to produce more restorative sleep than a late, heavy one.",
    "Melatonin production is suppressed by digestion — an earlier dinner gives your body a head start on winding down.",
    "Complex carbs at dinner, in modest portions, can support serotonin and an easier transition to sleep.",
    "Alcohol with dinner fragments sleep architecture later in the night, even when it feels relaxing at first.",
  ]},
  windDown: { icon:"🌇", title:"Wind down", tips:[
    "Dim lights and reduce screen brightness. Melatonin production begins as light fades.",
    "Blue light in the evening is the strongest signal that delays melatonin — warmer, dimmer light helps it along.",
    "A short walk or light stretching now supports digestion without the stimulation of a full workout.",
    "Herbal tea — chamomile or valerian — can be part of a calming wind-down ritual without caffeine's disruption.",
    "Keeping the bedroom cooler in this window primes the body-temperature drop that deep sleep depends on.",
  ]},
  overnightFast: { icon:"🌙", title:"Overnight fast", tips:[
    "Water and herbal tea support cellular recovery without breaking your metabolic reset.",
    "The overnight fast gives digestion a genuine rest — most of the repair work happening now doesn't need fuel.",
    "If thirst wakes you, water is enough — a full glass rarely disrupts sleep the way food does.",
    "This window is when autophagy — the body's cellular clean-up process — is thought to be most active.",
    "Staying hydrated before bed, not during the night, avoids disrupting sleep with bathroom trips.",
  ]},
};

const circadianTipFromKey = (key) => {
  const pool = CIRCADIAN_TIP_POOLS[key];
  return { icon: pool.icon, title: pool.title, tip: pickDailyVariant(`circadian_${key}`, pool.tips) };
};

function computeCircadianTip(srH, ssH) {
  const now = new Date();
  const h = now.getHours() + now.getMinutes() / 60;
  const dayLen = ssH - srH;
  if (h < srH - 0.5) return circadianTipFromKey("overnightRest");
  if (h < srH + 0.75) return circadianTipFromKey("wakeLight");
  if (h < srH + 2.5)  return circadianTipFromKey("breakfast");
  if (h < srH + dayLen * 0.45) return circadianTipFromKey("peakMetabolism");
  if (h < srH + dayLen * 0.62) return circadianTipFromKey("afternoonFuel");
  if (h < ssH)                  return circadianTipFromKey("dinnerWindow");
  if (h < ssH + 1.5)            return circadianTipFromKey("windDown");
  return                               circadianTipFromKey("overnightFast");
}

function getFallbackCircadianTip() {
  const h = new Date().getHours() + new Date().getMinutes() / 60;
  if (h >= 6  && h < 10) return circadianTipFromKey("breakfast");
  if (h >= 10 && h < 14) return circadianTipFromKey("peakMetabolism");
  if (h >= 14 && h < 17) return circadianTipFromKey("afternoonFuel");
  if (h >= 17 && h < 21) return circadianTipFromKey("dinnerWindow");
  return                        circadianTipFromKey("overnightFast");
}

function EatingWindowBand({ fastingStart, fastingEnd, setActiveTab }) {
  const now  = new Date();
  const nowH = now.getHours() + now.getMinutes() / 60;

  const [sh, sm] = fastingStart.split(":").map(Number);
  const [eh, em] = fastingEnd.split(":").map(Number);
  const eatStart = sh + sm / 60;
  const eatEnd   = eh + em / 60;
  const bedtime  = eatEnd + 1.5;

  const TL_START = 5, TL_END = 24;
  const span = TL_END - TL_START;
  const pct  = (hh) => Math.max(0, Math.min(100, ((hh - TL_START) / span) * 100));

  const fmtH = (hh) => {
    const hr  = Math.floor(hh) % 24;
    const min = Math.round((hh % 1) * 60);
    const lbl = hr === 0 ? 12 : hr > 12 ? hr - 12 : hr;
    return min > 0 ? `${lbl}:${String(min).padStart(2,"0")}${hr < 12 ? "am":"pm"}` : `${lbl}${hr < 12 ? "am":"pm"}`;
  };

  const nowPct      = pct(nowH);
  const eatStartPct = pct(eatStart);
  const eatEndPct   = pct(eatEnd);
  const bedtimePct  = pct(bedtime);

  return (
    <div style={{ ...card, padding: "14px 16px", borderLeft: `3px solid ${C.green}`, animation: "fadeIn 0.3s ease" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: C.green, textTransform: "uppercase", letterSpacing: "0.07em", margin: 0 }}>
          🌆 Eating Window
        </p>
        <button onClick={() => setActiveTab("me")} style={{ background: "none", border: "none", color: C.muted, fontSize: 10, cursor: "pointer", padding: 0, fontFamily: sans, textDecoration: "underline", textUnderlineOffset: 2, whiteSpace: "nowrap" }}>
          Fasting settings →
        </button>
      </div>

      {/* Bar */}
      <div style={{ position: "relative", marginBottom: 6 }}>
        <div style={{ height: 12, borderRadius: 8, backgroundColor: C.track, position: "relative", overflow: "hidden" }}>
          {/* Green: eat freely */}
          <div style={{
            position: "absolute", top: 0, height: "100%",
            left: `${eatStartPct}%`, width: `${eatEndPct - eatStartPct}%`,
            background: `linear-gradient(90deg, ${C.green}BB, ${C.green}EE)`,
          }}/>
          {/* Slate: wind-down caution */}
          <div style={{
            position: "absolute", top: 0, height: "100%",
            left: `${eatEndPct}%`, width: `${bedtimePct - eatEndPct}%`,
            background: `linear-gradient(90deg, ${C.slate}99, ${C.slate}CC)`,
          }}/>
        </div>
        {/* Current-time needle */}
        <div style={{
          position: "absolute", top: -4, height: 20, width: 2,
          left: `${nowPct}%`, transform: "translateX(-50%)",
          backgroundColor: C.text, borderRadius: 1, zIndex: 3,
        }}/>
        <div style={{
          position: "absolute", top: "50%", width: 10, height: 10,
          left: `${nowPct}%`, transform: "translate(-50%, -50%)",
          borderRadius: "50%", backgroundColor: C.text,
          border: `2px solid ${C.card}`, zIndex: 4,
        }}/>
      </div>

      {/* Time labels */}
      <div style={{ position: "relative", height: 16, marginBottom: 10 }}>
        {[[eatStart, fmtH(eatStart)], [eatEnd, fmtH(eatEnd)], [bedtime, fmtH(bedtime)]].map(([hh, lbl]) => (
          <span key={hh} style={{
            position: "absolute", left: `${pct(hh)}%`,
            transform: "translateX(-50%)", fontSize: 9,
            color: C.muted, letterSpacing: "0.02em", whiteSpace: "nowrap",
          }}>{lbl}</span>
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 14 }}>
        {[
          { color: C.green, label: "Eat freely" },
          { color: C.slate, label: "Wind down" },
          { color: C.track, label: "Overnight fast", border: `1px solid ${C.border}` },
        ].map(({ color, label, border }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: color, border }}/>
            <span style={{ fontSize: 10, color: C.muted }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CircadianCard() {
  const [tip, setTip] = useState(null);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const cached = (() => {
      try { const s = localStorage.getItem("nora_circadian"); if (s) { const d = JSON.parse(s); if (d.date === today) return d; } } catch {}
      return null;
    })();

    if (cached) {
      setTip(computeCircadianTip(cached.srH, cached.ssH));
      return;
    }

    if (!navigator.geolocation) { setTip(getFallbackCircadianTip()); return; }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res  = await fetch(`https://api.sunrisesunset.io/json?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}`);
          const data = await res.json();
          if (data.status === "OK") {
            const srH = parseTimeToH(data.results.sunrise);
            const ssH = parseTimeToH(data.results.sunset);
            if (srH && ssH) {
              try { localStorage.setItem("nora_circadian", JSON.stringify({ date: today, srH, ssH })); } catch {}
              setTip(computeCircadianTip(srH, ssH));
              return;
            }
          }
        } catch {}
        setTip(getFallbackCircadianTip());
      },
      () => setTip(getFallbackCircadianTip()),
      { timeout: 5000, maximumAge: 86400000 }
    );
  }, []);

  if (!tip) return null;

  return (
    <div style={{ ...card, padding: "14px 16px", borderLeft: `3px solid ${C.slate}`, animation: "fadeIn 0.3s ease" }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: C.slate, textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 5px" }}>
        {tip.icon} {tip.title}
      </p>
      <p style={{ fontSize: 13, color: C.text, lineHeight: 1.55, margin: 0 }}>{tip.tip}</p>
    </div>
  );
}

