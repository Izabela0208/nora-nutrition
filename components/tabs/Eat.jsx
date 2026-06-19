import { useState, useEffect, useRef } from "react";
import { C, card, serif, sans, inp, localDateStr } from "../noraTokens";
import { LeafDecor, SparkleIcon, CheckIcon, HeartIcon } from "../NoraIcons";
import { SectionHeader, Collapsible, Btn, GoldTag } from "../NoraUI";
import juicesData from "../../data/juices.json";
import dessertsData from "../../data/desserts.json";

const JUICE_CATS = ["Detox & Cleanse","Energy & Performance","Anti-Inflammatory","Immunity Boost","Skin & Beauty","Digestive Health","Weight Management","Brain & Focus","Heart Health","Hormonal Balance"];
const DESSERT_CATS = ["No-Bake","Frozen","Baked","Mousse & Pudding","Energy Balls","Fruit-Based"];

const G = {
  forest:    "#1B3A2D",
  forestMid: "#2D5A45",
  ivory:     "#FAF7F2",
  gold:      "#C9A84C",
  goldLight: "#FBF5E6",
  amber:     "#9A7020",
  sage:      "#7A9E8A",
  muted:     "#8C9E97",
  border:    "#DDD7CC",
  text:      "#1C2B26",
  card:      "#FFFFFF",
  error:     "#9E5E52",
  errorBg:   "#F7EDE9",
};

const SECTIONS = [
  { id: "plan",     label: "Today's Plan",  icon: "🍽️" },
  { id: "week",     label: "Week Prep",     icon: "📅" },
  { id: "smoothie", label: "Smoothies",     icon: "🥤" },
  { id: "shot",     label: "Morning Shots", icon: "⚡" },
  { id: "juice",    label: "Fresh Juices",  icon: "🍊" },
  { id: "dessert",  label: "Desserts",      icon: "🍫" },
  { id: "search",   label: "Search Foods",  icon: "🔍" },
  { id: "saved",    label: "Saved",         icon: "🔖" },
];

const callClaude = async (sys, user, maxTokens = 1200) => {
  const res = await fetch("/api/chat", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: maxTokens, system: sys, messages: [{ role: "user", content: user }] }),
  });
  const data = await res.json();
  return data.content?.map(b => b.text || "").join("") || "";
};

const parseJSON = (text) => {
  const clean = text.replace(/```json\s*/gi, "").replace(/```/g, "").trim();
  try { return JSON.parse(clean); } catch {
    const a = clean.match(/\[[\s\S]*\]/); if (a) { try { return JSON.parse(a[0]); } catch {} }
    const o = clean.match(/\{[\s\S]*\}/); if (o) { try { return JSON.parse(o[0]); } catch {} }
    throw new Error("parse failed");
  }
};

const PLAN_ORDER  = ["Breakfast", "Lunch", "Snack", "Dinner"];
const MEAL_CARD   = {
  Breakfast: { accent: "#B0922E" },
  Lunch:     { accent: "#2D5A45" },
  Dinner:    { accent: "#1B3A2D" },
  Snack:     { accent: "#7A9E8A" },
  Dessert:   { accent: "#C8847A" },
};
const TYPE_LABELS = { day_plan: "Day Plans", meal: "Meals", smoothie: "Smoothies", shot: "Shots", dessert: "Desserts" };

const SHOP_CATS = ["Proteins","Vegetables","Fruits","Dairy","Grains","Pantry & Other"];
const SHOP_CAT_RX = [
  { cat:"Proteins",   rx:/chicken|beef|salmon|tuna|fish|shrimp|turkey|lamb|pork|egg|tofu|tempeh|lentil|chickpea|bean|mince|steak|cod|tilapia|sardine|anchov|protein|meat/ },
  { cat:"Vegetables", rx:/spinach|kale|broccoli|carrot|onion|garlic|tomato|pepper|zucchini|courgette|lettuce|cucumber|mushroom|asparagus|celery|cauliflower|cabbage|leek|scallion|arugula|radish|aubergine|eggplant|sweetcorn|pea|artichok/ },
  { cat:"Fruits",     rx:/apple|banana|berr|mango|orange|lemon|lime|avocado|grape|peach|pear|strawberr|blueberr|raspberr|cherry|melon|pineapple|pomegranate|kiwi|apricot|plum|fig|date/ },
  { cat:"Dairy",      rx:/milk|cheese|yogurt|yoghurt|cream|butter|kefir|mozzarella|parmesan|cheddar|feta|ricotta|ghee/ },
  { cat:"Grains",     rx:/\brice\b|pasta|oat|quinoa|bread|flour|barley|couscous|tortilla|noodle|farro|bulgur|wheat|rye|cereal|cracker/ },
];
const categorizIng = (name) => {
  const n = name.toLowerCase();
  for (const { cat, rx } of SHOP_CAT_RX) if (rx.test(n)) return cat;
  return "Pantry & Other";
};

const INGR_STRIP = /\b(diced|chopped|minced|sliced|fresh|dried|frozen|cooked|raw|washed|peeled|crushed|grated|shredded|torn|halved|quartered|cubed|whole|boneless|skinless|lean|ground|pitted|seeded|rinsed|drained|canned|roasted|toasted|blanched|trimmed|cut|about|approximately|large|medium|small)\b/gi;
const normIngKey = (name) =>
  name.toLowerCase().replace(/[^a-z ]/g,"").replace(INGR_STRIP,"")
    .replace(/\s+/g," ").trim().split(" ").filter(Boolean).slice(0,3).join(" ");

const normUnit = (u) => {
  const s = u.toLowerCase().trim();
  if (["g","gram","grams"].includes(s)) return "g";
  if (["kg","kilogram","kilograms"].includes(s)) return "kg";
  if (["ml","milliliter","milliliters","millilitre","millilitres"].includes(s)) return "ml";
  if (["l","liter","liters","litre","litres"].includes(s)) return "l";
  if (["oz","ounce","ounces"].includes(s)) return "oz";
  if (["lb","lbs","pound","pounds"].includes(s)) return "lb";
  if (["tsp","teaspoon","teaspoons"].includes(s)) return "tsp";
  if (["tbsp","tablespoon","tablespoons"].includes(s)) return "tbsp";
  if (s.startsWith("cup")) return "cup";
  if (["clove","cloves"].includes(s)) return "clove";
  if (["can","cans"].includes(s)) return "can";
  if (["piece","pieces"].includes(s)) return "piece";
  return s;
};

const combineAmounts = (amounts) => {
  if (!amounts.length) return null;
  const byUnit = {};
  amounts.forEach(a => {
    const m = String(a).trim().match(/^([\d.\/\s]+)\s*(.{0,25})$/);
    if (m) {
      let num = 0;
      const ns = m[1].trim();
      if (ns.includes("/")) { const [n,d] = ns.split("/").map(Number); num = d ? n/d : 0; }
      else num = parseFloat(ns) || 0;
      const unit = normUnit(m[2].trim());
      if (!byUnit[unit]) byUnit[unit] = 0;
      byUnit[unit] += num;
    }
  });
  return Object.entries(byUnit).map(([u,v]) => `${Math.round(v*10)/10}${u?" "+u:""}`).join(", ") || null;
};

const buildShopCats = (days) => {
  const merged = {};
  days.forEach(day => {
    ["breakfast","lunch","dinner","snack"].forEach(mk => {
      (day[mk]?.ingredients || []).forEach(ing => {
        const name = (typeof ing === "string" ? ing : (ing.item || "")).trim();
        const amount = typeof ing === "string" ? "" : (ing.amount || "");
        if (name.length < 2) return;
        const key = normIngKey(name); if (!key) return;
        if (!merged[key]) merged[key] = { display: name, amounts: [], category: categorizIng(name) };
        if (amount) merged[key].amounts.push(amount);
      });
    });
  });
  const cats = {};
  Object.values(merged).forEach(({ display, amounts, category }) => {
    if (!cats[category]) cats[category] = [];
    cats[category].push({ name: display, qty: combineAmounts(amounts) });
  });
  return cats;
};

const PLAN_GROUPS_DAY = ["Breakfast", "Lunch", "Dinner"];
const DAY_KEYS  = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"];
const DAY_NAMES = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

const parseDiet = (prefs = "") => {
  const p = prefs.toLowerCase();
  if (p.includes("vegan"))      return "vegan";
  if (p.includes("vegetarian")) return "vegetarian";
  if (p.includes("gluten"))     return "gluten free";
  if (p.includes("keto"))       return "ketogenic";
  if (p.includes("paleo"))      return "paleo";
  if (p.includes("dairy"))      return "dairy free";
  return "";
};

const getNutrient = (recipe, name) =>
  Math.round(recipe.nutrition?.nutrients?.find(x => x.name === name)?.amount || 0);

const spoonacularToMeal = (recipe, mealGroup) => ({
  name:        recipe.title,
  emoji:       { Breakfast:"🍳", Lunch:"🥗", Dinner:"🍽️", Snack:"🍎" }[mealGroup] || "🍽️",
  mealGroup,
  image:       recipe.image || null,
  spoonId:     recipe.id,
  prepTime:    recipe.readyInMinutes ? `${recipe.readyInMinutes} min` : null,
  calories:    getNutrient(recipe, "Calories"),
  protein_g:   getNutrient(recipe, "Protein"),
  carbs_g:     getNutrient(recipe, "Carbohydrates"),
  fat_g:       getNutrient(recipe, "Fat"),
  fiber_g:     getNutrient(recipe, "Fiber"),
  ingredients: (recipe.extendedIngredients || []).map(ing => ({
    item:   ing.nameClean || ing.name || "",
    amount: `${ing.amount ? ing.amount : ""}${ing.unit ? " " + ing.unit : ""}`.trim(),
  })),
  steps: (recipe.analyzedInstructions?.[0]?.steps || []).map(s => s.step),
  tip:   null,
  source: "spoonacular",
});

const QUOTA_ERR = "QUOTA_EXCEEDED";
const fetchBulk = async (ids) => {
  const map = {};
  for (let i = 0; i < ids.length; i += 10) {
    const batch = ids.slice(i, i + 10);
    const r = await fetch(`/api/recipes?bulk=true&ids=${batch.join(",")}`);
    if (r.status === 402) throw new Error(QUOTA_ERR);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const data = await r.json();
    (Array.isArray(data) ? data : []).forEach(recipe => { map[recipe.id] = recipe; });
  }
  return map;
};

const Spinner = () => (
  <span style={{ width:14, height:14, border:`2px solid ${G.ivory}`, borderTopColor:"transparent", borderRadius:"50%", display:"inline-block", animation:"spin 0.8s linear infinite" }}/>
);

const MacroStrip = ({ kcal, pro, carbs, fat }) => (
  <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginTop:4 }}>
    {[
      { v: kcal,         l: "kcal", c: G.forest    },
      { v: `${pro}g`,    l: "prot", c: G.forestMid },
      { v: `${carbs}g`,  l: "carb", c: G.gold      },
      { v: `${fat}g`,    l: "fat",  c: G.amber      },
    ].map(({ v, l, c }) => (
      <span key={l} style={{ fontSize:10, color:c, background:`${c}18`, borderRadius:4, padding:"2px 6px", fontWeight:700, whiteSpace:"nowrap" }}>
        {v} <span style={{ fontWeight:400, opacity:0.7 }}>{l}</span>
      </span>
    ))}
  </div>
);

const IngList = ({ ingredients, checked, onToggle, accentColor }) => (
  <>
    {(ingredients || []).map((ing, i) => {
      const item   = typeof ing === "string" ? ing : ing.item;
      const amount = typeof ing === "string" ? "" : ing.amount;
      const ck = !!checked[i];
      const color = accentColor || G.forest;
      return (
        <div key={i} onClick={() => onToggle(i)} style={{ display:"flex", alignItems:"center", gap:9, padding:"7px 0", cursor:"pointer", opacity: ck ? 0.4 : 1, borderBottom: i < ingredients.length-1 ? `1px solid ${G.border}` : "none" }}>
          <div style={{ width:16, height:16, borderRadius:4, border:`1.5px solid ${ck ? color : G.border}`, backgroundColor: ck ? color : "transparent", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
            {ck && <CheckIcon size={10} color={G.ivory}/>}
          </div>
          <span style={{ fontSize:13, color:G.text, flex:1, textDecoration: ck ? "line-through" : "none" }}>{item}</span>
          {amount && <span style={{ fontSize:12, color:G.muted, flexShrink:0 }}>{amount}</span>}
        </div>
      );
    })}
  </>
);

const DESSERT_CAT_COLORS = { "No-Bake":"#7A9E8A","Frozen":"#5B8DD9","Baked":"#C9A84C","Mousse & Pudding":"#C8847A","Energy Balls":"#2D5A45","Fruit-Based":"#9A7020" };

const DessertCard = ({ dessert, isSaved, onToggleSave, ingChecked, onIngToggle }) => {
  const catColor = DESSERT_CAT_COLORS[dessert.category] || G.forest;
  return (
    <details style={{ backgroundColor:G.card, borderRadius:16, border:`1px solid ${G.border}`, overflow:"hidden", boxShadow:"0 1px 5px rgba(27,58,45,0.05)" }}>
      <summary style={{ display:"block", listStyle:"none", cursor:"pointer" }}>
        <div style={{ height:2.5, backgroundColor:catColor }}/>
        <div style={{ display:"flex", alignItems:"stretch" }}>
          <div style={{ flex:1, padding:"13px 0 13px 14px", display:"flex", alignItems:"flex-start", gap:10 }}>
            <span style={{ fontSize:22, flexShrink:0, lineHeight:1.3 }}>{dessert.emoji}</span>
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ fontFamily:"'Playfair Display', Georgia, serif", fontSize:15, fontWeight:600, color:G.text, margin:"0 0 2px", lineHeight:1.3 }}>{dessert.name}</p>
              <p style={{ fontSize:11, color:G.muted, margin:"0 0 5px" }}>{dessert.category} · {dessert.prep_time} min · {dessert.servings} servings</p>
              <MacroStrip kcal={dessert.kcal} pro={dessert.macros.protein_g} carbs={dessert.macros.carbs_g} fat={dessert.macros.fat_g}/>
              <p style={{ fontSize:9, color:G.muted, margin:"3px 0 0", fontFamily:"'Inter', 'Helvetica Neue', Arial, sans-serif" }}>per serving</p>
            </div>
          </div>
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"0 14px", gap:10, flexShrink:0 }}>
            <button onClick={e => { e.stopPropagation(); e.preventDefault(); onToggleSave(); }} style={{ background:"none", border:"none", cursor:"pointer", padding:4 }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill={isSaved ? G.gold : "none"} stroke={isSaved ? G.gold : G.muted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2h12a1 1 0 0 1 1 1v14l-7-3.5L2 17V3a1 1 0 0 1 1-1z"/></svg>
            </button>
            <svg className="card-chevron" width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 5l5 5 5-5" stroke={G.muted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </summary>
      <div style={{ borderTop:`1px solid ${G.border}`, padding:"16px 16px 18px" }}>
        <p style={{ fontSize:11, fontWeight:700, color:G.muted, textTransform:"uppercase", letterSpacing:"0.07em", margin:"0 0 10px" }}>Ingredients <span style={{ fontWeight:400, textTransform:"none", letterSpacing:0 }}>({dessert.servings} servings)</span></p>
        <div style={{ marginBottom:14 }}>
          {(dessert.ingredients||[]).map((ing, i) => {
            const k = `${dessert.id}_${i}`; const ck = !!(ingChecked[k]);
            return (
              <div key={i} onClick={() => onIngToggle(k)} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", cursor:"pointer", borderBottom: i < dessert.ingredients.length-1 ? `1px solid ${G.border}` : "none", opacity: ck ? 0.4 : 1 }}>
                <div style={{ width:17, height:17, borderRadius:4, border:`1.5px solid ${ck ? catColor : G.border}`, backgroundColor: ck ? catColor : "transparent", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  {ck && <CheckIcon size={10} color={G.ivory}/>}
                </div>
                <span style={{ fontSize:13, color:G.text, flex:1, textDecoration: ck ? "line-through" : "none" }}>{ing.item}</span>
                <span style={{ fontSize:12, color:G.muted, flexShrink:0 }}>{ing.amount_display}</span>
              </div>
            );
          })}
        </div>
        {(dessert.steps||[]).length > 0 && (
          <div style={{ marginBottom:14 }}>
            <p style={{ fontSize:11, fontWeight:700, color:G.muted, textTransform:"uppercase", letterSpacing:"0.07em", margin:"0 0 10px" }}>Instructions</p>
            {dessert.steps.map((step, i) => (
              <div key={i} style={{ display:"flex", gap:11, marginBottom:10 }}>
                <div style={{ width:22, height:22, borderRadius:"50%", flexShrink:0, backgroundColor:catColor, color:G.ivory, fontSize:11, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center" }}>{i+1}</div>
                <p style={{ fontSize:13, color:G.text, lineHeight:1.6, margin:0, paddingTop:2 }}>{step}</p>
              </div>
            ))}
          </div>
        )}
        {(dessert.benefits||[]).length > 0 && (
          <div style={{ marginBottom: dessert.tip ? 14 : 0 }}>
            <p style={{ fontSize:11, fontWeight:700, color:G.muted, textTransform:"uppercase", letterSpacing:"0.07em", margin:"0 0 8px" }}>Benefits</p>
            {dessert.benefits.map((b, i) => (
              <div key={i} style={{ display:"flex", gap:8, marginBottom:5 }}>
                <span style={{ color:G.gold, flexShrink:0, fontSize:16, marginTop:-2 }}>·</span>
                <p style={{ fontSize:13, color:G.text, lineHeight:1.55, margin:0 }}>{b}</p>
              </div>
            ))}
          </div>
        )}
        {dessert.tip && (
          <div style={{ padding:"10px 14px", backgroundColor:G.goldLight, borderLeft:`3px solid ${G.gold}`, borderRadius:"0 9px 9px 0", marginTop: dessert.benefits?.length ? 12 : 0 }}>
            <p style={{ fontSize:12, color:G.amber, margin:0, lineHeight:1.6 }}>💡 {dessert.tip}</p>
          </div>
        )}
      </div>
    </details>
  );
};

const getFoodMeta = (name) => {
  const n = (name || "").toLowerCase();
  if (/chicken|beef|pork|lamb|turkey|meat|steak|sausage|bacon|ham|veal|duck|bison|venison/.test(n)) return { emoji:"🥩", bg:"linear-gradient(145deg,#F5E6E0,#EDD5C8)" };
  if (/salmon|tuna|cod|fish|shrimp|prawn|seafood|sardine|anchov|tilapia|halibut|crab|lobster/.test(n)) return { emoji:"🐟", bg:"linear-gradient(145deg,#DFF0F5,#C8DDE8)" };
  if (/apple|banana|orange|berr|grape|mango|peach|pear|cherry|lemon|lime|melon|strawberr|blueberr|raspberr|kiwi|pineapple|fruit/.test(n)) return { emoji:"🍎", bg:"linear-gradient(145deg,#F5E8EC,#EDD5DC)" };
  if (/broccoli|spinach|kale|lettuce|carrot|vegetable|veggie|tomato|cucumber|pepper|onion|garlic|celery|asparagus|zucchini|salad|cabbage|cauliflower/.test(n)) return { emoji:"🥦", bg:"linear-gradient(145deg,#E3EFE7,#C8DDD0)" };
  if (/milk|cheese|yogurt|yoghurt|dairy|cream|butter|whey|ricotta|cottage|mozzarella|cheddar/.test(n)) return { emoji:"🥛", bg:"linear-gradient(145deg,#EEF4F8,#D8E8F0)" };
  if (/bread|wheat|oat|rice|pasta|noodle|grain|cereal|flour|barley|rye|quinoa|bagel|tortilla|cracker/.test(n)) return { emoji:"🌾", bg:"linear-gradient(145deg,#F5F0E0,#EDE4C0)" };
  if (/egg/.test(n)) return { emoji:"🥚", bg:"linear-gradient(145deg,#F5F2E0,#EDE8C0)" };
  if (/almond|walnut|cashew|pistachio|peanut|pecan|hazelnut|nut|seed|hemp|flax|chia|sunflower/.test(n)) return { emoji:"🥜", bg:"linear-gradient(145deg,#F0EAE0,#E4D8C0)" };
  if (/avocado|olive/.test(n)) return { emoji:"🥑", bg:"linear-gradient(145deg,#E5EDE0,#C8DCC0)" };
  if (/chocolate|cocoa|candy|cake|cookie|biscuit|dessert|brownie|muffin/.test(n)) return { emoji:"🍫", bg:"linear-gradient(145deg,#F0E8E0,#E4D0BC)" };
  if (/coffee|tea|juice|smoothie|drink|shake|beverage|soda|water/.test(n)) return { emoji:"☕", bg:"linear-gradient(145deg,#EEE8E0,#E0D4C0)" };
  if (/bean|lentil|legume|chickpea|soy|tofu|tempeh|edamame|hummus/.test(n)) return { emoji:"🫘", bg:"linear-gradient(145deg,#EAEAE0,#DDDDC0)" };
  return { emoji:"🥗", bg:"linear-gradient(145deg,#E8EDE8,#D0DDD0)" };
};

const FoodResultCard = ({ food, onClick }) => {
  const meta = getFoodMeta(food.name);
  const p = food.per100g || {};
  const srcColor = food.source === "USDA" ? G.forest : food.source === "Recipe" ? G.forestMid : G.amber;
  const srcLabel = food.source === "USDA" ? "USDA" : food.source === "Recipe" ? "Recipe" : "Open Food Facts";
  return (
    <div onClick={onClick} style={{ backgroundColor:G.card, borderRadius:16, border:`1px solid ${G.border}`, overflow:"hidden", cursor:"pointer", boxShadow:"0 2px 10px rgba(27,58,45,0.08)", display:"flex", flexDirection:"column" }}>
      {/* Image */}
      <div style={{ width:"100%", height:120, position:"relative", overflow:"hidden", flexShrink:0 }}>
        {food.image && (
          <img src={food.image} alt={food.name} loading="lazy"
            style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}
            onError={e => { e.target.style.display = "none"; e.target.nextElementSibling && (e.target.nextElementSibling.style.display = "flex"); }}/>
        )}
        <div style={{ width:"100%", height:"100%", background:meta.bg, display: food.image ? "none" : "flex", alignItems:"center", justifyContent:"center" }}>
          <span style={{ fontSize:44, lineHeight:1, filter:"drop-shadow(0 2px 6px rgba(0,0,0,0.1))" }}>{meta.emoji}</span>
        </div>
        <span style={{ position:"absolute", top:8, left:8, fontSize:9, fontWeight:700, letterSpacing:"0.05em", color:srcColor, backgroundColor:"rgba(250,247,242,0.93)", borderRadius:5, padding:"3px 7px" }}>
          {srcLabel}
        </span>
      </div>
      {/* Text */}
      <div style={{ padding:"10px 12px 12px", flex:1, display:"flex", flexDirection:"column" }}>
        {food.brand && <p style={{ fontSize:10, color:G.muted, margin:"0 0 2px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{food.brand}</p>}
        <p style={{ fontFamily:"'Playfair Display', Georgia, serif", fontSize:14, fontWeight:600, color:G.text, margin:"0 0 8px", lineHeight:1.35, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>{food.name}</p>
        <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginTop:"auto" }}>
          {p.kcal != null && <span style={{ fontSize:11, fontWeight:700, color:G.forest, backgroundColor:`${G.forest}10`, borderRadius:6, padding:"3px 7px" }}>{p.kcal} kcal</span>}
          {p.protein != null && <span style={{ fontSize:11, fontWeight:600, color:"#4A8C5C", backgroundColor:"#4A8C5C12", borderRadius:6, padding:"3px 7px" }}>{p.protein}g P</span>}
          {p.carbs != null && <span style={{ fontSize:11, fontWeight:600, color:G.amber, backgroundColor:`${G.amber}15`, borderRadius:6, padding:"3px 7px" }}>{p.carbs}g C</span>}
          {p.fat != null && <span style={{ fontSize:11, fontWeight:600, color:"#C8847A", backgroundColor:"#C8847A12", borderRadius:6, padding:"3px 7px" }}>{p.fat}g F</span>}
        </div>
        <p style={{ fontSize:9, color:G.muted, margin:"5px 0 0", letterSpacing:"0.02em" }}>{food.perLabel || "per 100g"}</p>
      </div>
    </div>
  );
};


const JuiceCard = ({ juice, isSaved, onToggleSave, ingChecked, onIngToggle }) => (
  <details style={{ backgroundColor:G.card, borderRadius:16, border:`1px solid ${G.border}`, overflow:"hidden", boxShadow:"0 1px 5px rgba(27,58,45,0.05)" }}>
    <summary style={{ display:"flex", alignItems:"stretch", listStyle:"none", cursor:"pointer" }}>
      <div style={{ flex:1, padding:"14px 0 14px 16px", display:"flex", alignItems:"flex-start", gap:12 }}>
        <span style={{ fontSize:24, flexShrink:0, lineHeight:1.2 }}>{juice.emoji}</span>
        <div style={{ flex:1, minWidth:0 }}>
          <p style={{ fontFamily:"'Playfair Display', Georgia, serif", fontSize:16, fontWeight:600, color:G.text, margin:"0 0 3px", lineHeight:1.3 }}>{juice.name}</p>
          <p style={{ fontSize:11, color:G.muted, margin:"0 0 5px" }}>{juice.category} · {juice.prep_time} min</p>
          <MacroStrip kcal={juice.kcal} pro={(juice.macros||{}).protein_g||0} carbs={(juice.macros||{}).carbs_g||0} fat={(juice.macros||{}).fat_g||0}/>
        </div>
      </div>
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"0 14px", gap:10, flexShrink:0 }}>
        <button onClick={e => { e.stopPropagation(); e.preventDefault(); onToggleSave(); }} title={isSaved ? "Remove" : "Save"} style={{ background:"none", border:"none", cursor:"pointer", padding:4 }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill={isSaved ? G.gold : "none"} stroke={isSaved ? G.gold : G.muted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 2h12a1 1 0 0 1 1 1v14l-7-3.5L2 17V3a1 1 0 0 1 1-1z"/>
          </svg>
        </button>
        <svg className="card-chevron" width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2 5l5 5 5-5" stroke={G.muted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </summary>
    <div style={{ borderTop:`1px solid ${G.border}`, padding:"16px 16px 18px" }}>
      <p style={{ fontSize:11, fontWeight:700, color:G.muted, textTransform:"uppercase", letterSpacing:"0.07em", margin:"0 0 10px" }}>Ingredients</p>
      <div style={{ marginBottom:16 }}>
        {(juice.ingredients || []).map((ing, i) => {
          const ck = !!(ingChecked[`${juice.id}_${i}`]);
          return (
            <div key={i} onClick={() => onIngToggle(`${juice.id}_${i}`)} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", cursor:"pointer", borderBottom: i < juice.ingredients.length-1 ? `1px solid ${G.border}` : "none", opacity: ck ? 0.4 : 1 }}>
              <div style={{ width:17, height:17, borderRadius:4, border:`1.5px solid ${ck ? G.forest : G.border}`, backgroundColor: ck ? G.forest : "transparent", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                {ck && <CheckIcon size={10} color={G.ivory}/>}
              </div>
              <span style={{ fontSize:13, color:G.text, flex:1, textDecoration: ck ? "line-through" : "none" }}>{ing.item}</span>
              <span style={{ fontSize:12, color:G.muted, flexShrink:0 }}>{ing.amount_display}</span>
            </div>
          );
        })}
      </div>
      {(juice.vitamins_minerals || []).length > 0 && (
        <div style={{ marginBottom:14 }}>
          <p style={{ fontSize:11, fontWeight:700, color:G.muted, textTransform:"uppercase", letterSpacing:"0.07em", margin:"0 0 8px" }}>Key Nutrients</p>
          <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
            {juice.vitamins_minerals.map((v, i) => (
              <span key={i} style={{ fontSize:11, color:G.forest, backgroundColor:`${G.forest}10`, border:`1px solid ${G.forest}20`, borderRadius:6, padding:"3px 8px", fontWeight:500 }}>{v}</span>
            ))}
          </div>
        </div>
      )}
      {(juice.benefits || []).length > 0 && (
        <div style={{ marginBottom: juice.tip ? 14 : 0 }}>
          <p style={{ fontSize:11, fontWeight:700, color:G.muted, textTransform:"uppercase", letterSpacing:"0.07em", margin:"0 0 8px" }}>Benefits</p>
          {juice.benefits.map((b, i) => (
            <div key={i} style={{ display:"flex", gap:9, marginBottom:6 }}>
              <span style={{ color:G.gold, flexShrink:0, fontSize:16, marginTop:-2 }}>·</span>
              <p style={{ fontSize:13, color:G.text, lineHeight:1.6, margin:0 }}>{b}</p>
            </div>
          ))}
        </div>
      )}
      {juice.tip && (
        <div style={{ padding:"10px 14px", backgroundColor:G.goldLight, borderLeft:`3px solid ${G.gold}`, borderRadius:"0 9px 9px 0", marginTop:12 }}>
          <p style={{ fontSize:12, color:G.amber, margin:0, lineHeight:1.6 }}>💡 {juice.tip}</p>
        </div>
      )}
    </div>
  </details>
);

export default function Eat({ profile, targets, entries, setEntries, cyclePhase }) {
  const toastTimer = useRef(null);

  const [activeSection, setActiveSection] = useState(null);
  const setSection = (id) => setActiveSection(s => s === id ? null : id);
  const [logToast, setLogToast] = useState(null);

  // Today's plan
  const [mealPlan,      setMealPlan]      = useState(null);
  const [mealPlanLoad,  setMealPlanLoad]  = useState(false);
  const [mealPlanError, setMealPlanError] = useState("");
  const [expandedMeal,  setExpandedMeal]  = useState(null);
  const [ingChecked,    setIngChecked]    = useState({});
  const [loggedMeals,   setLoggedMeals]   = useState({});
  const [planSaved,     setPlanSaved]     = useState(false);
  const [planGoal,      setPlanGoal]      = useState("maintain"); // "lose" | "maintain" | "gain"
  const [planMeta,      setPlanMeta]      = useState(null);
  const [planCustomKcal,setPlanCustomKcal]= useState("");
  const [planUseCustom, setPlanUseCustom] = useState(false);
  const [altLoading,    setAltLoading]    = useState({});

  const [weekGoal,      setWeekGoal]      = useState("maintain");
  const [weekMeta,      setWeekMeta]      = useState(null);
  const [weekCustomKcal,setWeekCustomKcal]= useState("");
  const [weekUseCustom, setWeekUseCustom] = useState(false);
  const [weekAltLoading,setWeekAltLoading]= useState({});

  // 7-day prep
  const [weekPlan,       setWeekPlan]       = useState(null);
  const [weekPlanLoad,   setWeekPlanLoad]   = useState(false);
  const [weekError,      setWeekError]      = useState("");
  const [weekProgress,   setWeekProgress]   = useState("");
  const [openWeekDay,    setOpenWeekDay]    = useState(null);
  const [shopChecked,    setShopChecked]    = useState({});
  const [recipeModal,    setRecipeModal]    = useState(null);
  const [weekMealLogged, setWeekMealLogged] = useState({});
  const [recipeIngChk,   setRecipeIngChk]   = useState({});

  // Smoothies
  const [smoothie,       setSmoothie]       = useState(null);
  const [smoothieLoad,   setSmoothieLoad]   = useState(false);
  const [shownSmoothies, setShownSmoothies] = useState([]);
  const [smoothieLogged, setSmoothieLogged] = useState(false);
  const [smoothieIngChk, setSmoothieIngChk] = useState({});
  const [smoothieSaved,  setSmoothieSaved]  = useState(false);

  // Shots
  const [currentShot, setCurrentShot] = useState(null);
  const [shotLoad,    setShotLoad]    = useState(false);
  const [shotError,   setShotError]   = useState("");
  const [shownShots,  setShownShots]  = useState([]);
  const [shotLogged,  setShotLogged]  = useState(false);
  const [shotIngChk,  setShotIngChk]  = useState({});
  const [shotSaved,   setShotSaved]   = useState(false);

  // Desserts
  const [dessert,       setDessert]       = useState(null);
  const [dessertLoad,   setDessertLoad]   = useState(false);
  const [shownDesserts, setShownDesserts] = useState([]);
  const [dessertLogged, setDessertLogged] = useState(false);
  const [dessertIngChk, setDessertIngChk] = useState({});
  const [dessertSaved,  setDessertSaved]  = useState(false);

  // Fresh Juices
  const [juiceSearch,   setJuiceSearch]   = useState("");
  const [juiceCat,      setJuiceCat]      = useState("all");
  const [juiceIngChk,   setJuiceIngChk]   = useState({});
  const [juiceLimit,    setJuiceLimit]    = useState(5);
  const [savedJuices,   setSavedJuices]   = useState([]);

  // Saved items
  const [savedItems,    setSavedItems]    = useState([]);
  const [expandedSaved, setExpandedSaved] = useState({});

  // Static desserts browse
  const [dessertSearch,        setDessertSearch]        = useState("");
  const [dessertCatFilter,     setDessertCatFilter]     = useState("all");
  const [savedDesserts,        setSavedDesserts]        = useState([]);
  const [dessertIngChkStatic,  setDessertIngChkStatic]  = useState({});
  const [showAIDessert,        setShowAIDessert]        = useState(false);
  const [dessertLimit,         setDessertLimit]         = useState(5);

  // Food search
  const [foodQuery,      setFoodQuery]      = useState("");
  const [foodResults,    setFoodResults]    = useState([]);
  const [foodSearchLoad, setFoodSearchLoad] = useState(false);
  const [foodSearchError,setFoodSearchError]= useState("");
  const [foodSearchDone, setFoodSearchDone] = useState(false);
  const [selectedFood,   setSelectedFood]   = useState(null);
  const [servingSize,    setServingSize]    = useState(100);
  const [isCustomServing,setIsCustomServing]= useState(false);
  const [customServingInput, setCustomServingInput] = useState("");

  useEffect(() => {
    try {
      const si = localStorage.getItem("nora_saved_items");
      if (si) setSavedItems(JSON.parse(si));

      const sj = localStorage.getItem("nora_saved_juices");
      if (sj) setSavedJuices(JSON.parse(sj));

      const sdess = localStorage.getItem("nora_saved_desserts");
      if (sdess) setSavedDesserts(JSON.parse(sdess));

      const sm = localStorage.getItem("nora_smoothie");
      if (sm) { const d = JSON.parse(sm); if (d.date === localDateStr()) { const s = d.data; if (s?.ingredients && typeof s.ingredients[0] === "string") s.ingredients = s.ingredients.map(x => ({ item: x, amount: "" })); setSmoothie(s); } }

      const sh = localStorage.getItem("nora_shot");
      if (sh) { const d = JSON.parse(sh); if (d.date === localDateStr()) { const s = d.data; if (s?.ingredients && typeof s.ingredients[0] === "string") s.ingredients = s.ingredients.map(x => ({ item: x, amount: "" })); setCurrentShot(s); } }

      const wp = localStorage.getItem("nora_week_plan");
      if (wp) setWeekPlan(JSON.parse(wp));

      const wm = localStorage.getItem("nora_week_meta");
      if (wm) { try { const d = JSON.parse(wm); if (d.weekGoal) setWeekGoal(d.weekGoal); if (d.weekMeta) setWeekMeta(d.weekMeta); } catch {} }

      const tp = localStorage.getItem("nora_today_plan");
      if (tp) {
        const d = JSON.parse(tp);
        if (d.date === localDateStr()) {
          setMealPlan(d.plan || null);
          setLoggedMeals(d.loggedMeals || {});
          setPlanSaved(d.planSaved || false);
          if (d.planGoal) setPlanGoal(d.planGoal);
          if (d.planMeta) setPlanMeta(d.planMeta);
        }
      }
    } catch {}
  }, []);

  useEffect(() => { setJuiceLimit(5); }, [juiceCat, juiceSearch]);
  useEffect(() => { setDessertLimit(5); }, [dessertCatFilter, dessertSearch]);

  const today = () => localDateStr();
  const goalsStr = (profile?.goals || []).join(", ");
  const cycleCtx = cyclePhase ? `Cycle: ${cyclePhase.label}. ` : "";
  const tCal = targets ? Math.round(targets.calories)  : 2000;
  const tPro = targets ? Math.round(targets.protein_g) : 150;

  const showToast = (calories) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setLogToast(`Added to today's log! +${calories} kcal`);
    toastTimer.current = setTimeout(() => setLogToast(null), 3000);
  };

  const addToLog = (item) => {
    const h = new Date().getHours();
    const mg = h < 11 ? "Morning" : h < 15 ? "Midday" : h < 18 ? "Snacks" : "Evening";
    setEntries(prev => [...prev, {
      id: Date.now(), type: "food", name: item.name,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      mealGroup: mg, calories: item.calories || 0, protein_g: item.protein_g || 0,
      carbs_g: item.carbs_g || 0, fat_g: item.fat_g || 0, fiber_g: item.fiber_g || 0,
      notes: item.notes || "From Nora", estimated: true,
    }]);
    showToast(item.calories || 0);
  };

  const saveItem = (type, label, data) => {
    const item = { id: Date.now(), date: new Date().toLocaleDateString(), type, label, data };
    const updated = [item, ...savedItems].slice(0, 50);
    setSavedItems(updated);
    try { localStorage.setItem("nora_saved_items", JSON.stringify(updated)); } catch {}
    if (type === "day_plan") {
      try {
        const sp = JSON.parse(localStorage.getItem("nora_saved_plans") || "[]");
        const upd = [{ id: item.id, date: item.date, plan: data }, ...sp].slice(0, 5);
        localStorage.setItem("nora_saved_plans", JSON.stringify(upd));
      } catch {}
    }
  };

  const deleteSavedItem = (id) => {
    const updated = savedItems.filter(i => i.id !== id);
    setSavedItems(updated);
    try { localStorage.setItem("nora_saved_items", JSON.stringify(updated)); } catch {}
  };

  const toggleMealFavourite = (meal) => {
    const idx = savedItems.findIndex(i => i.type === "meal" && i.data?.name === meal.name);
    const updated = idx >= 0
      ? savedItems.filter((_, j) => j !== idx)
      : [{ id: Date.now(), date: new Date().toLocaleDateString(), type: "meal", label: meal.name, data: meal }, ...savedItems].slice(0, 50);
    setSavedItems(updated);
    try { localStorage.setItem("nora_saved_items", JSON.stringify(updated)); } catch {}
  };

  const toggleIng = (key, idx) =>
    setIngChecked(p => ({ ...p, [key]: { ...(p[key] || {}), [idx]: !((p[key] || {})[idx]) } }));

  const toggleSavedJuice = (id) => {
    const updated = savedJuices.includes(id) ? savedJuices.filter(x => x !== id) : [...savedJuices, id];
    setSavedJuices(updated);
    try { localStorage.setItem("nora_saved_juices", JSON.stringify(updated)); } catch {}
  };

  const toggleSavedDessert = (id) => {
    const updated = savedDesserts.includes(id) ? savedDesserts.filter(x => x !== id) : [...savedDesserts, id];
    setSavedDesserts(updated);
    try { localStorage.setItem("nora_saved_desserts", JSON.stringify(updated)); } catch {}
  };

  const searchFoods = async (q) => {
    const query = (q || foodQuery).trim();
    if (!query) return;
    setFoodSearchLoad(true); setFoodSearchError(""); setFoodResults([]); setFoodSearchDone(false);
    const getNutr = (recipe, name) => {
      const n = (recipe.nutrition?.nutrients || []).find(x => x.name === name);
      return n ? Math.round(n.amount * 10) / 10 : null;
    };
    try {
      const res  = await fetch(`/api/recipes?query=${encodeURIComponent(query)}&number=12&_t=${Date.now()}`);
      const data = await res.json();
      const recipes = (data.results || []).filter(r => r.id).map(r => ({
        id:                `recipe_${r.id}`,
        name:              r.title || "",
        source:            "Recipe",
        image:             r.image || null,
        brand:             null,
        perLabel:          "per serving",
        readyMinutes:      r.readyInMinutes || null,
        servings:          r.servings || null,
        recipeIngredients: (r.extendedIngredients || []).map(i => ({
          original: i.original || `${i.amount} ${i.unit} ${i.name}`,
        })),
        recipeSteps: (r.analyzedInstructions?.[0]?.steps || []).map(s => ({
          number: s.number,
          step:   s.step,
        })),
        per100g: {
          kcal:    getNutr(r, "Calories"),
          protein: getNutr(r, "Protein"),
          carbs:   getNutr(r, "Carbohydrates"),
          fat:     getNutr(r, "Fat"),
        },
      }));
      setFoodResults(recipes);
      setFoodSearchDone(true);
    } catch {
      setFoodSearchError("Search failed. Please try again.");
    }
    setFoodSearchLoad(false);
  };

  const openFoodDetail = async (food) => {
    setSelectedFood({ ...food, loadingDetail: food.source === "USDA" });
    setServingSize(100); setIsCustomServing(false); setCustomServingInput("");
    if (food.source === "USDA") {
      try {
        const r = await fetch(`/api/food-search?fdcId=${food.id}`);
        const data = await r.json();
        if (data.detail) setSelectedFood({ ...data.detail, loadingDetail: false });
        else setSelectedFood(prev => ({ ...prev, loadingDetail: false }));
      } catch {
        setSelectedFood(prev => ({ ...prev, loadingDetail: false }));
      }
    }
  };

  // ── TODAY'S PLAN ─────────────────────────────────────────────────
  const GOAL_LABELS = { lose: "weight loss", maintain: "maintenance", gain: "weight/muscle gain" };
  const GOAL_ADJ    = { lose: -500, maintain: 0, gain: 300 };
  const GOAL_DESC   = { lose: "500 kcal daily deficit", maintain: "maintenance calories", gain: "300 kcal daily surplus" };

  const genPlan = async () => {
    if (mealPlanLoad) return;
    setMealPlanLoad(true); setMealPlanError(""); setExpandedMeal(null); setPlanSaved(false); setLoggedMeals({}); setPlanMeta(null);
    const diet    = parseDiet(profile?.preferences || "");
    const baseCal = Math.round(targets?.calories || 2000);
    const adjCal  = planUseCustom && planCustomKcal
      ? Math.max(800, parseInt(planCustomKcal) || baseCal)
      : Math.max(1200, baseCal + (GOAL_ADJ[planGoal] || 0));
    const meta    = { planGoal, goalLabel: GOAL_LABELS[planGoal], goalDesc: planUseCustom ? "custom target" : GOAL_DESC[planGoal], adjCal, baseCal };
    try {
      const planParams = new URLSearchParams({ mealplan: "true", timeFrame: "day", targetCalories: String(adjCal), _t: String(Date.now()) });
      if (diet) planParams.set("diet", diet);
      const planRes = await fetch(`/api/recipes?${planParams}`);
      if (planRes.status === 402) throw new Error(QUOTA_ERR);
      if (!planRes.ok) throw new Error(`HTTP ${planRes.status}`);
      const planData = await planRes.json();
      const meals = planData.meals || [];
      if (!meals.length) throw new Error("empty");
      const recipeMap = await fetchBulk(meals.map(m => m.id));
      const plan = meals.map((m, idx) => {
        const recipe = recipeMap[m.id];
        return recipe ? spoonacularToMeal(recipe, PLAN_GROUPS_DAY[idx] || "Dinner") : null;
      }).filter(Boolean);
      if (plan.length >= 2) {
        setMealPlan(plan);
        setPlanMeta(meta);
        setIngChecked({});
        try { localStorage.setItem("nora_today_plan", JSON.stringify({ date: localDateStr(), plan, loggedMeals: {}, planSaved: false, planGoal, planMeta: meta })); } catch {}
      } else {
        setMealPlanError("Meal plan generation temporarily unavailable, please try again later.");
      }
    } catch {
      setMealPlanError("Meal plan generation temporarily unavailable, please try again later.");
    }
    setMealPlanLoad(false);
  };

  const savePlan = () => {
    if (!mealPlan || planSaved) return;
    saveItem("day_plan", `Plan — ${new Date().toLocaleDateString()}`, mealPlan);
    setPlanSaved(true);
    try { const tp = localStorage.getItem("nora_today_plan"); if (tp) localStorage.setItem("nora_today_plan", JSON.stringify({ ...JSON.parse(tp), planSaved: true })); } catch {}
  };

  // ── 7-DAY PLAN ───────────────────────────────────────────────────
  const genWeek = async () => {
    if (weekPlanLoad) return;
    setWeekPlanLoad(true); setOpenWeekDay(null); setShopChecked({});
    setWeekError(""); setWeekProgress("Generating meal plan…"); setWeekPlan(null); setWeekMeta(null);
    try { localStorage.removeItem("nora_week_plan"); } catch {}
    const diet    = parseDiet(profile?.preferences || "");
    const baseCal = Math.round(targets?.calories || 2000);
    const adjCal  = weekUseCustom && weekCustomKcal
      ? Math.max(800, parseInt(weekCustomKcal) || baseCal)
      : Math.max(1200, baseCal + (GOAL_ADJ[weekGoal] || 0));
    const meta    = { weekGoal, goalLabel: GOAL_LABELS[weekGoal], goalDesc: weekUseCustom ? "custom target" : GOAL_DESC[weekGoal], adjCal, baseCal };
    try {
      const planParams = new URLSearchParams({ mealplan: "true", timeFrame: "week", targetCalories: String(adjCal), _t: String(Date.now()) });
      if (diet) planParams.set("diet", diet);
      const planRes = await fetch(`/api/recipes?${planParams}`);
      if (planRes.status === 402) throw new Error(QUOTA_ERR);
      if (!planRes.ok) throw new Error(`HTTP ${planRes.status}`);
      const planData = await planRes.json();
      const week = planData.week || {};
      const allIds = [];
      DAY_KEYS.forEach(key => (week[key]?.meals || []).forEach(m => allIds.push(m.id)));
      if (!allIds.length) throw new Error("empty");
      setWeekProgress("Fetching recipe details…");
      const recipeMap = await fetchBulk(allIds);
      const days = DAY_KEYS.map((key, di) => {
        const planMeals = week[key]?.meals || [];
        const [b, l, d] = planMeals.map((m, mi) => {
          const r = recipeMap[m.id];
          return r ? spoonacularToMeal(r, PLAN_GROUPS_DAY[mi] || "Dinner") : null;
        });
        return {
          day: DAY_NAMES[di],
          breakfast: b || null,
          lunch:     l || null,
          dinner:    d || null,
          snack:     null,
          calories_est: (b?.calories||0) + (l?.calories||0) + (d?.calories||0),
        };
      });
      const shopping_categories = buildShopCats(days);
      const result = { days, shopping_categories, prep_tips: [] };
      setWeekPlan(result);
      setWeekMeta(meta);
      setWeekProgress("");
      try { localStorage.setItem("nora_week_plan", JSON.stringify(result)); } catch {}
      try { localStorage.setItem("nora_week_meta", JSON.stringify({ weekGoal, weekMeta: meta })); } catch {}
    } catch {
      setWeekError("Meal plan generation temporarily unavailable, please try again later.");
      setWeekProgress("");
    }
    setWeekPlanLoad(false);
  };

  // ── MEAL ALTERNATIVE (single replacement) ────────────────────────
  const genMealAlt = async (group) => {
    setAltLoading(prev => ({ ...prev, [group]: true }));
    const spoonType = { Breakfast:"breakfast", Lunch:"main course", Dinner:"main course", Snack:"snack" }[group] || "main course";
    const diet      = parseDiet(profile?.preferences || "");
    const offset    = Math.floor(Math.random() * 60);
    try {
      const params = new URLSearchParams({ type: spoonType, number: "5", offset: String(offset), _t: String(Date.now()) });
      if (diet) params.append("diet", diet);
      const r = await fetch(`/api/recipes?${params}`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      const results = (data.results || []).filter(x => x.id);
      if (!results.length) throw new Error("empty");
      const chosen  = results[Math.floor(Math.random() * results.length)];
      const newMeal = spoonacularToMeal(chosen, group);
      setMealPlan(prev => {
        const updated = prev.map(m => m.mealGroup === group ? newMeal : m);
        try {
          const tp = localStorage.getItem("nora_today_plan");
          if (tp) { const d = JSON.parse(tp); localStorage.setItem("nora_today_plan", JSON.stringify({ ...d, plan: updated })); }
        } catch {}
        return updated;
      });
      setExpandedMeal(null);
    } catch { /* keep existing meal on failure */ }
    setAltLoading(prev => ({ ...prev, [group]: false }));
  };

  const genWeekMealAlt = async (dayName, mealType) => {
    const altKey   = `${dayName}_${mealType}`;
    setWeekAltLoading(prev => ({ ...prev, [altKey]: true }));
    const spoonType = { breakfast:"breakfast", lunch:"main course", dinner:"main course", snack:"snack" }[mealType] || "main course";
    const diet      = parseDiet(profile?.preferences || "");
    const offset    = Math.floor(Math.random() * 60);
    try {
      const params = new URLSearchParams({ type: spoonType, number: "5", offset: String(offset), _t: String(Date.now()) });
      if (diet) params.append("diet", diet);
      const r = await fetch(`/api/recipes?${params}`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      const results = (data.results || []).filter(x => x.id);
      if (!results.length) throw new Error("empty");
      const chosen  = results[Math.floor(Math.random() * results.length)];
      const mgMap   = { breakfast:"Breakfast", lunch:"Lunch", dinner:"Dinner", snack:"Snack" };
      const newMeal = spoonacularToMeal(chosen, mgMap[mealType] || "Dinner");
      setWeekPlan(prev => {
        const days = prev.days.map(d => {
          if (d.day !== dayName) return d;
          const upd = { ...d, [mealType]: newMeal };
          upd.calories_est = (upd.breakfast?.calories||0) + (upd.lunch?.calories||0) + (upd.dinner?.calories||0);
          return upd;
        });
        const result = { ...prev, days, shopping_categories: buildShopCats(days) };
        try { localStorage.setItem("nora_week_plan", JSON.stringify(result)); } catch {}
        return result;
      });
    } catch { /* keep existing meal on failure */ }
    setWeekAltLoading(prev => ({ ...prev, [altKey]: false }));
  };

  const openWeekRecipe = (dayName, mealType, meal) => {
    const key = `${dayName}_${mealType}`;
    const ingredients = (meal.ingredients || []).map(ing =>
      typeof ing === "string" ? { item: ing, amount: "" } : ing
    );
    setRecipeModal({ dayName, mealType, meal, key, loading: false, ingredients, steps: meal.steps || [] });
  };

  // ── SMOOTHIE ─────────────────────────────────────────────────────
  const genSmoothie = async () => {
    setSmoothieLoad(true); setSmoothieLogged(false); setSmoothieSaved(false); setSmoothieIngChk({});
    try {
      const excl = shownSmoothies.length > 0 ? ` Not:[${shownSmoothies.slice(-5).join(",")}].` : "";
      const t = await callClaude(
        "Return ONLY valid JSON, no markdown.",
        `One smoothie recipe. Goals:${goalsStr||"balanced"}. Prefs:${profile?.preferences||"none"}. ${cycleCtx}${excl}Return: {"name":"str","emoji":"🥤","ingredients":[{"item":"str","amount":"str"}],"method":"str","calories":num,"protein_g":num,"carbs_g":num,"fat_g":num,"tip":"str"}`,
        480
      );
      const data = parseJSON(t);
      if (data.ingredients && typeof data.ingredients[0] === "string") data.ingredients = data.ingredients.map(s => ({ item: s, amount: "" }));
      setSmoothie(data);
      setShownSmoothies(prev => [...prev, data.name]);
      try { localStorage.setItem("nora_smoothie", JSON.stringify({ date: today(), data })); } catch {}
    } catch {}
    setSmoothieLoad(false);
  };

  // ── SHOT ─────────────────────────────────────────────────────────
  const genShot = async () => {
    setShotLoad(true); setShotLogged(false); setShotSaved(false); setShotIngChk({}); setShotError("");
    try {
      const excl = shownShots.length > 0 ? ` Not:[${shownShots.slice(-5).join(",")}].` : "";
      const t = await callClaude(
        "Return ONLY valid JSON, no markdown, no extra text.",
        `One morning wellness shot. Goals:${goalsStr||"energy"}. ${cycleCtx}${excl}Return exactly: {"name":"str","emoji":"str","ingredients":[{"item":"str","amount":"str"}],"benefit":"str","calories":num,"protein_g":num,"carbs_g":num,"fat_g":num}`,
        500
      );
      if (!t || !t.trim()) throw new Error("empty");
      const data = parseJSON(t);
      if (!data || !data.name) throw new Error("invalid");
      if (data.ingredients && typeof data.ingredients[0] === "string") data.ingredients = data.ingredients.map(s => ({ item: s, amount: "" }));
      setCurrentShot(data);
      setShownShots(prev => [...prev, data.name]);
      try { localStorage.setItem("nora_shot", JSON.stringify({ date: today(), data })); } catch {}
    } catch {
      setShotError("Couldn't generate a shot right now. Please try again.");
    }
    setShotLoad(false);
  };

  // ── DESSERT ───────────────────────────────────────────────────────
  const genDessert = async () => {
    setDessertLoad(true); setDessertLogged(false); setDessertSaved(false); setDessertIngChk({});
    try {
      const excl = shownDesserts.length > 0 ? ` Not:[${shownDesserts.slice(-5).join(",")}].` : "";
      const t = await callClaude(
        "Return ONLY valid JSON, no markdown.",
        `One healthy dessert using only natural sweeteners (honey, dates, maple syrup, or fruit). Goals:${goalsStr||"balanced"}. Prefs:${profile?.preferences||"none"}. ${cycleCtx}${excl}Return: {"name":"str","emoji":"str","ingredients":[{"item":"str","amount":"str"}],"steps":["str"],"calories":num,"protein_g":num,"carbs_g":num,"fat_g":num,"fiber_g":num,"tip":"str"}`,
        600
      );
      const data = parseJSON(t);
      setDessert(data);
      setShownDesserts(prev => [...prev, data.name]);
    } catch {}
    setDessertLoad(false);
  };

  const savedByType = savedItems.reduce((acc, item) => {
    const k = item.type || "other"; if (!acc[k]) acc[k] = []; acc[k].push(item); return acc;
  }, {});

  // ── RENDER ────────────────────────────────────────────────────────
  const juiceQ = juiceSearch.toLowerCase();
  const filteredJuices = juicesData.filter(j => {
    const matchCat = juiceCat === "all" || j.category === juiceCat;
    const matchQ = !juiceQ || j.name.toLowerCase().includes(juiceQ) || j.category.toLowerCase().includes(juiceQ) || (j.benefits||[]).some(b => b.toLowerCase().includes(juiceQ)) || (j.ingredients||[]).some(i => i.item.toLowerCase().includes(juiceQ));
    return matchCat && matchQ;
  });
  const savedJuiceObjects = savedJuices.map(id => juicesData.find(j => j.id === id)).filter(Boolean);

  const GBtn = ({ onClick, disabled, children }) => (
    <button onClick={onClick} disabled={!!disabled} style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, width:"100%", padding:"14px", backgroundColor: disabled ? `${G.forest}80` : G.forest, color:G.ivory, border:"none", borderRadius:14, fontSize:14, fontWeight:600, fontFamily:sans, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.8 : 1 }}>
      {children}
    </button>
  );

  const STitleStyle = { fontFamily:serif, fontSize:22, fontWeight:600, color:G.text, margin:"18px 0 8px", letterSpacing:"-0.01em" };
  const SDescStyle  = { fontSize:13, color:G.muted, margin:"0 0 18px", lineHeight:1.65 };

  return (
    <div style={{ backgroundColor:G.ivory, minHeight:"100%", paddingBottom:100 }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes toastIn { from { opacity:0; transform:translateX(-50%) translateY(12px) } to { opacity:1; transform:translateX(-50%) translateY(0) } }
        @keyframes sectionIn { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
        .eat-scroll::-webkit-scrollbar { display:none }
        details summary { list-style: none; }
        details summary::-webkit-details-marker { display: none; }
        .card-chevron { transition: transform 0.25s; }
        details[open] .card-chevron { transform: rotate(180deg); }
      `}</style>

      {/* Toast */}
      {logToast && (
        <div style={{ position:"fixed", bottom:88, left:"50%", transform:"translateX(-50%)", zIndex:200, backgroundColor:G.forest, color:G.ivory, padding:"11px 18px", borderRadius:14, display:"flex", alignItems:"center", gap:9, boxShadow:"0 4px 24px rgba(27,58,45,0.35)", animation:"toastIn 0.25s ease", whiteSpace:"nowrap", pointerEvents:"none" }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="9" fill="rgba(255,255,255,0.2)"/><path d="M5 9.5l2.8 2.8 5-5.6" stroke={G.ivory} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <span style={{ fontSize:13, fontWeight:500 }}>{logToast}</span>
        </div>
      )}

      {/* Recipe modal */}
      {recipeModal && (
        <div onClick={() => setRecipeModal(null)} style={{ position:"fixed", inset:0, backgroundColor:"rgba(27,58,45,0.55)", zIndex:100, display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
          <div onClick={e => e.stopPropagation()} style={{ width:"100%", maxWidth:480, backgroundColor:G.ivory, borderRadius:"20px 20px 0 0", maxHeight:"90vh", display:"flex", flexDirection:"column", overflow:"hidden" }}>
            {recipeModal.meal.image && (
              <div style={{ width:"100%", height:200, overflow:"hidden", position:"relative", flexShrink:0 }}>
                <img src={recipeModal.meal.image} alt={recipeModal.meal.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} loading="lazy"/>
                <button onClick={() => setRecipeModal(null)} style={{ position:"absolute", top:10, right:10, width:32, height:32, borderRadius:"50%", border:"none", backgroundColor:"rgba(0,0,0,0.45)", cursor:"pointer", fontSize:18, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center" }}>×</button>
              </div>
            )}
            <div style={{ padding:"16px 20px 14px", borderBottom:`1px solid ${G.border}`, display:"flex", alignItems:"flex-start", gap:12, flexShrink:0 }}>
              <div style={{ flex:1, minWidth:0 }}>
                <span style={{ fontSize:10, fontWeight:700, color:G.muted, textTransform:"uppercase", letterSpacing:"0.06em" }}>{recipeModal.dayName} · {recipeModal.mealType}</span>
                <p style={{ fontFamily:serif, fontSize:17, fontWeight:600, color:G.text, margin:"3px 0 2px", lineHeight:1.2 }}>{recipeModal.meal.emoji} {recipeModal.meal.name}</p>
                <p style={{ fontSize:11, color:G.muted, margin:0 }}>~{recipeModal.meal.calories} kcal · ~{recipeModal.meal.protein_g}g protein</p>
              </div>
              {!recipeModal.meal.image && (
                <button onClick={() => setRecipeModal(null)} style={{ width:32, height:32, borderRadius:"50%", border:`1px solid ${G.border}`, background:"none", cursor:"pointer", fontSize:20, color:G.muted, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>×</button>
              )}
            </div>
            <div style={{ overflowY:"auto", padding:"16px 20px 32px" }}>
              {recipeModal.loading ? (
                <div style={{ textAlign:"center", padding:"32px 0" }}>
                  <div style={{ width:28, height:28, border:`2.5px solid ${G.border}`, borderTopColor:G.forest, borderRadius:"50%", animation:"spin 0.9s linear infinite", margin:"0 auto 12px" }}/>
                  <p style={{ fontSize:13, color:G.muted, margin:0 }}>Fetching recipe…</p>
                </div>
              ) : (
                <>
                  {(recipeModal.ingredients || []).length > 0 && (
                    <div style={{ marginBottom:20 }}>
                      <p style={{ fontSize:11, fontWeight:700, color:G.muted, textTransform:"uppercase", letterSpacing:"0.05em", margin:"0 0 10px" }}>Ingredients</p>
                      <IngList ingredients={recipeModal.ingredients} checked={recipeIngChk} onToggle={i => setRecipeIngChk(p => ({ ...p, [`${recipeModal.key}_${i}`]: !p[`${recipeModal.key}_${i}`] }))} accentColor={G.forest}/>
                    </div>
                  )}
                  {(recipeModal.steps || []).length > 0 && (
                    <div style={{ marginBottom:20 }}>
                      <p style={{ fontSize:11, fontWeight:700, color:G.muted, textTransform:"uppercase", letterSpacing:"0.05em", margin:"0 0 10px" }}>Instructions</p>
                      {recipeModal.steps.map((step, i) => (
                        <div key={i} style={{ display:"flex", gap:12, marginBottom:12 }}>
                          <div style={{ width:24, height:24, borderRadius:"50%", flexShrink:0, marginTop:1, backgroundColor:G.forest, color:G.ivory, fontSize:11, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center" }}>{i+1}</div>
                          <p style={{ fontSize:14, color:G.text, lineHeight:1.65, margin:0, paddingTop:2 }}>{step}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {(recipeModal.ingredients||[]).length===0 && (recipeModal.steps||[]).length===0 && (
                    <p style={{ fontSize:13, color:G.muted, textAlign:"center", padding:"20px 0" }}>Recipe not available.</p>
                  )}
                </>
              )}
              {!recipeModal.loading && (
                <button onClick={() => { addToLog({ name:recipeModal.meal.name, calories:recipeModal.meal.calories||0, protein_g:recipeModal.meal.protein_g||0, carbs_g:recipeModal.meal.carbs_g||0, fat_g:recipeModal.meal.fat_g||0, fiber_g:0, notes:`Week prep — ${recipeModal.dayName}` }); setWeekMealLogged(p => ({ ...p, [`${recipeModal.dayName}_${recipeModal.mealType}`]:true })); setRecipeModal(null); }} style={{ width:"100%", padding:"14px", backgroundColor:G.forest, color:G.ivory, border:"none", borderRadius:12, fontSize:14, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8l4 4 6-6" stroke={G.ivory} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Log this meal
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Food Detail Modal */}
      {selectedFood && (() => {
        const sf = selectedFood;
        const calc = sf.source === "Recipe"
          ? (v) => v == null ? null : +(v || 0).toFixed(1)
          : (v) => v == null ? null : +(v * servingSize / 100).toFixed(1);
        const SERVING_PRESETS = [50, 100, 150, 200];
        const p = sf.per100g || {};
        const hasDetail = !sf.loadingDetail && sf.allNutrients?.length > 0;
        return (
          <div onClick={() => setSelectedFood(null)} style={{ position:"fixed", inset:0, backgroundColor:"rgba(27,58,45,0.6)", zIndex:200, display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
            <div onClick={e => e.stopPropagation()} style={{ width:"100%", maxWidth:480, backgroundColor:G.ivory, borderRadius:"22px 22px 0 0", maxHeight:"92vh", display:"flex", flexDirection:"column", overflow:"hidden" }}>
              {/* Handle */}
              <div style={{ display:"flex", justifyContent:"center", padding:"10px 0 0", flexShrink:0 }}><div style={{ width:36, height:4, borderRadius:2, backgroundColor:G.border }}/></div>
              {/* Image */}
              {sf.image ? (
                <div style={{ width:"100%", height:200, overflow:"hidden", flexShrink:0, backgroundColor:`${G.forest}10` }}>
                  <img src={sf.image} alt={sf.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} loading="lazy" onError={e => { e.target.parentNode.style.display = "none"; }}/>
                </div>
              ) : (
                <div style={{ width:"100%", height:120, flexShrink:0, backgroundColor:`${G.forest}0A`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <svg width="52" height="52" viewBox="0 0 52 52" fill="none"><circle cx="26" cy="26" r="26" fill={`${G.forest}12`}/><path d="M16 32c0-5.5 4.5-10 10-10s10 4.5 10 10" stroke={G.forest} strokeWidth="2" strokeLinecap="round"/><circle cx="26" cy="19" r="3" fill={G.forest} opacity="0.4"/><path d="M20 26l3 3 9-9" stroke={G.gold} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7"/></svg>
                </div>
              )}
              {/* Header */}
              <div style={{ padding:"14px 20px 12px", borderBottom:`1px solid ${G.border}`, flexShrink:0 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:10 }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <span style={{ fontSize:10, fontWeight:700, color: sf.source==="USDA" ? G.forest : sf.source==="Recipe" ? G.forestMid : G.amber, backgroundColor: sf.source==="USDA" ? `${G.forest}12` : sf.source==="Recipe" ? `${G.forestMid}12` : `${G.amber}18`, borderRadius:4, padding:"2px 7px" }}>{sf.source==="USDA" ? "USDA FoodData" : sf.source==="Recipe" ? "Recipe" : "Open Food Facts"}</span>
                    {sf.brand && <span style={{ fontSize:11, color:G.muted, marginLeft:8 }}>{sf.brand}</span>}
                    <p style={{ fontFamily:"'Playfair Display', Georgia, serif", fontSize:17, fontWeight:600, color:G.text, margin:"6px 0 0", lineHeight:1.25 }}>{sf.name}</p>
                    {sf.category && <p style={{ fontSize:11, color:G.muted, margin:"3px 0 0" }}>{sf.category}</p>}
                  </div>
                  <button onClick={() => setSelectedFood(null)} style={{ width:30, height:30, borderRadius:"50%", border:`1px solid ${G.border}`, background:"none", cursor:"pointer", fontSize:18, color:G.muted, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>×</button>
                </div>
                {/* Serving size selector */}
                {sf.source !== "Recipe" && <div style={{ marginTop:14 }}>
                  <p style={{ fontSize:11, fontWeight:700, color:G.muted, textTransform:"uppercase", letterSpacing:"0.06em", margin:"0 0 8px" }}>Serving size</p>
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                    {SERVING_PRESETS.map(g => (
                      <button key={g} onClick={() => { setServingSize(g); setIsCustomServing(false); setCustomServingInput(""); }} style={{ padding:"6px 13px", borderRadius:8, border:`1.5px solid ${!isCustomServing && servingSize===g ? G.forest : G.border}`, backgroundColor: !isCustomServing && servingSize===g ? G.forest : "transparent", color: !isCustomServing && servingSize===g ? G.ivory : G.text, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:sans }}>{g}g</button>
                    ))}
                    <button onClick={() => { setIsCustomServing(true); setCustomServingInput(String(servingSize)); }} style={{ padding:"6px 13px", borderRadius:8, border:`1.5px solid ${isCustomServing ? G.forest : G.border}`, backgroundColor: isCustomServing ? G.forest : "transparent", color: isCustomServing ? G.ivory : G.text, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:sans }}>Custom</button>
                    {isCustomServing && (
                      <input type="number" min="1" max="2000" value={customServingInput} onChange={e => { setCustomServingInput(e.target.value); const v = parseInt(e.target.value); if (v > 0) setServingSize(v); }} style={{ width:70, padding:"6px 10px", borderRadius:8, border:`1.5px solid ${G.forest}`, fontSize:12, color:G.text, fontFamily:sans, textAlign:"center", outline:"none" }} placeholder="g"/>
                    )}
                  </div>
                </div>}
              </div>
              {/* Nutrition panel */}
              <div style={{ overflowY:"auto", padding:"16px 20px 32px" }}>
                {sf.loadingDetail ? (
                  <div style={{ textAlign:"center", padding:"32px 0" }}>
                    <div style={{ width:26, height:26, border:`2.5px solid ${G.border}`, borderTopColor:G.forest, borderRadius:"50%", animation:"spin 0.9s linear infinite", margin:"0 auto 12px" }}/>
                    <p style={{ fontSize:13, color:G.muted, margin:0 }}>Fetching full nutrition data…</p>
                  </div>
                ) : (
                  <>
                    {/* Big kcal */}
                    <div style={{ textAlign:"center", padding:"18px 0 16px", borderBottom:`1px solid ${G.border}`, marginBottom:16 }}>
                      <p style={{ fontFamily:"'Playfair Display', Georgia, serif", fontSize:44, fontWeight:700, color:G.forest, margin:0, lineHeight:1 }}>{calc(p.kcal) ?? 0}</p>
                      <p style={{ fontSize:12, color:G.muted, margin:"4px 0 0" }}>kcal · {sf.source === "Recipe" ? "per serving" : `${servingSize}g serving`}</p>
                    </div>
                    {/* Macros row */}
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:8, marginBottom:20 }}>
                      {[
                        { label:"Protein",  value:calc(p.protein),  unit:"g", color:G.forest    },
                        { label:"Carbs",    value:calc(p.carbs),    unit:"g", color:G.gold       },
                        { label:"Fat",      value:calc(p.fat),      unit:"g", color:G.amber      },
                        { label:"Fibre",    value:calc(p.fiber),    unit:"g", color:G.sage       },
                      ].map(({ label, value, unit, color }) => (
                        <div key={label} style={{ backgroundColor:G.card, borderRadius:12, padding:"11px 8px", textAlign:"center", border:`1px solid ${G.border}` }}>
                          <p style={{ fontSize:18, fontWeight:700, color, margin:"0 0 2px" }}>{value ?? "—"}<span style={{ fontSize:11 }}>{value != null ? unit : ""}</span></p>
                          <p style={{ fontSize:10, color:G.muted, margin:0 }}>{label}</p>
                        </div>
                      ))}
                    </div>
                    {/* Recipe meta row */}
                    {sf.source === "Recipe" && (sf.readyMinutes || sf.servings) && (
                      <div style={{ display:"flex", gap:8, marginBottom:18, flexWrap:"wrap" }}>
                        {sf.readyMinutes && <span style={{ fontSize:12, color:G.forest, backgroundColor:`${G.forest}10`, borderRadius:8, padding:"5px 12px", fontWeight:500 }}>⏱ {sf.readyMinutes} min</span>}
                        {sf.servings && <span style={{ fontSize:12, color:G.forest, backgroundColor:`${G.forest}10`, borderRadius:8, padding:"5px 12px", fontWeight:500 }}>🍽 {sf.servings} servings</span>}
                      </div>
                    )}
                    {/* Recipe structured ingredients */}
                    {sf.source === "Recipe" && sf.recipeIngredients?.length > 0 && (
                      <div style={{ marginBottom:18 }}>
                        <p style={{ fontSize:11, fontWeight:700, color:G.muted, textTransform:"uppercase", letterSpacing:"0.06em", margin:"0 0 10px" }}>Ingredients</p>
                        <div style={{ backgroundColor:G.card, borderRadius:12, border:`1px solid ${G.border}`, overflow:"hidden" }}>
                          {sf.recipeIngredients.map((ing, i) => (
                            <div key={i} style={{ padding:"9px 14px", borderBottom: i < sf.recipeIngredients.length - 1 ? `1px solid ${G.border}` : "none", display:"flex", alignItems:"center", gap:10 }}>
                              <span style={{ width:5, height:5, borderRadius:"50%", backgroundColor:G.forest, flexShrink:0, display:"inline-block", opacity:0.4 }}/>
                              <span style={{ fontSize:12, color:G.text, lineHeight:1.4 }}>{ing.original}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* USDA / OFF plain-text ingredients */}
                    {sf.source !== "Recipe" && sf.ingredients && (
                      <div style={{ marginBottom:18 }}>
                        <p style={{ fontSize:11, fontWeight:700, color:G.muted, textTransform:"uppercase", letterSpacing:"0.06em", margin:"0 0 10px" }}>Ingredients</p>
                        <div style={{ backgroundColor:G.card, borderRadius:12, border:`1px solid ${G.border}`, padding:"12px 14px" }}>
                          <p style={{ fontSize:12, color:G.text, margin:0, lineHeight:1.7 }}>{sf.ingredients}</p>
                        </div>
                      </div>
                    )}
                    {/* Recipe cooking steps */}
                    {sf.source === "Recipe" && sf.recipeSteps?.length > 0 && (
                      <div style={{ marginBottom:18 }}>
                        <p style={{ fontSize:11, fontWeight:700, color:G.muted, textTransform:"uppercase", letterSpacing:"0.06em", margin:"0 0 12px" }}>Instructions</p>
                        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                          {sf.recipeSteps.map((s, i) => (
                            <div key={i} style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
                              <span style={{ width:26, height:26, borderRadius:"50%", backgroundColor:`${G.forest}14`, color:G.forest, fontSize:11, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:1 }}>{s.number}</span>
                              <p style={{ fontSize:13, color:G.text, margin:0, lineHeight:1.65 }}>{s.step}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Secondary nutrients */}
                    {[
                      { label:"Sugar",     value:calc(p.sugar),     unit:"g"  },
                      { label:"Sodium",    value:calc(p.sodium),    unit:"mg" },
                      { label:"Fibre",     value:calc(p.fiber),     unit:"g"  },
                      { label:"Calcium",   value:calc(p.calcium),   unit:"mg" },
                      { label:"Iron",      value:calc(p.iron),      unit:"mg" },
                      { label:"Vitamin C", value:calc(p.vitaminC),  unit:"mg" },
                      { label:"Vitamin D", value:calc(p.vitaminD),  unit:"IU" },
                      { label:"Vitamin A", value:calc(p.vitaminA),  unit:"µg" },
                      { label:"Potassium", value:calc(p.potassium), unit:"mg" },
                      { label:"Magnesium", value:calc(p.magnesium), unit:"mg" },
                      { label:"Zinc",      value:calc(p.zinc),      unit:"mg" },
                    ].filter(n => n.value != null && n.value > 0).length > 0 && (
                      <div style={{ marginBottom:18 }}>
                        <p style={{ fontSize:11, fontWeight:700, color:G.muted, textTransform:"uppercase", letterSpacing:"0.06em", margin:"0 0 10px" }}>Vitamins & Minerals</p>
                        <div style={{ backgroundColor:G.card, borderRadius:12, border:`1px solid ${G.border}`, overflow:"hidden" }}>
                          {[
                            { label:"Sugar",     value:calc(p.sugar),     unit:"g"  },
                            { label:"Sodium",    value:calc(p.sodium),    unit:"mg" },
                            { label:"Calcium",   value:calc(p.calcium),   unit:"mg" },
                            { label:"Iron",      value:calc(p.iron),      unit:"mg" },
                            { label:"Vitamin C", value:calc(p.vitaminC),  unit:"mg" },
                            { label:"Vitamin D", value:calc(p.vitaminD),  unit:"IU" },
                            { label:"Vitamin A", value:calc(p.vitaminA),  unit:"µg" },
                            { label:"Potassium", value:calc(p.potassium), unit:"mg" },
                            { label:"Magnesium", value:calc(p.magnesium), unit:"mg" },
                            { label:"Zinc",      value:calc(p.zinc),      unit:"mg" },
                          ].filter(n => n.value != null && n.value > 0).map((n, i, arr) => (
                            <div key={n.label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 14px", borderBottom: i < arr.length-1 ? `1px solid ${G.border}` : "none" }}>
                              <span style={{ fontSize:13, color:G.text }}>{n.label}</span>
                              <span style={{ fontSize:13, fontWeight:600, color:G.forest }}>{n.value}{n.unit}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Action buttons */}
                    <div style={{ display:"flex", gap:8 }}>
                      {(() => {
                        const isSaved = savedItems.some(i => i.type === "food" && i.label === sf.name);
                        return (
                          <button onClick={() => { if (!isSaved) saveItem("food", sf.name, { id:sf.id, name:sf.name, source:sf.source, brand:sf.brand, per100g:sf.per100g, image:sf.image }); }} style={{ width:50, height:50, borderRadius:13, border:`1.5px solid ${isSaved ? G.gold : G.border}`, backgroundColor: isSaved ? `${G.gold}15` : "transparent", cursor: isSaved ? "default" : "pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                            <svg width="18" height="18" viewBox="0 0 18 18" fill={isSaved ? G.gold : "none"} stroke={isSaved ? G.gold : G.muted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2h12a1 1 0 0 1 1 1v14l-7-3.5L2 17V3a1 1 0 0 1 1-1z"/></svg>
                          </button>
                        );
                      })()}
                      <button onClick={() => { addToLog({ name:sf.name, calories:calc(p.kcal)||0, protein_g:calc(p.protein)||0, carbs_g:calc(p.carbs)||0, fat_g:calc(p.fat)||0, fiber_g:calc(p.fiber)||0, notes: sf.source === "Recipe" ? "1 serving · recipe" : `Food search — ${servingSize}g` }); setSelectedFood(null); }} style={{ flex:1, padding:"14px", backgroundColor:G.forest, color:G.ivory, border:"none", borderRadius:13, fontSize:14, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8l4 4 6-6" stroke={G.ivory} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        {sf.source === "Recipe" ? "Log to diary" : `Log ${servingSize}g to diary`}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Header */}
      <div style={{ backgroundColor:G.forest, padding:"26px 20px 22px", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", right:-28, top:-28, width:130, height:130, borderRadius:"50%", backgroundColor:"rgba(255,255,255,0.03)" }}/>
        <div style={{ position:"absolute", right:24, bottom:-16, width:70, height:70, borderRadius:"50%", backgroundColor:"rgba(201,168,76,0.07)" }}/>
        <div style={{ position:"relative" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:5 }}>
            <LeafDecor size={18}/>
            <h2 style={{ fontFamily:serif, fontSize:24, color:G.ivory, fontWeight:600, margin:0, letterSpacing:"-0.01em" }}>Eat</h2>
          </div>
          <p style={{ fontSize:11, color:`${G.ivory}55`, margin:0, letterSpacing:"0.07em", textTransform:"uppercase" }}>Nourishment · Wellness · Vitality</p>
        </div>
      </div>

      {/* Section pills */}
      <div className="eat-scroll" style={{ overflowX:"auto", display:"flex", gap:7, padding:"14px 16px 10px", WebkitOverflowScrolling:"touch" }}>
        {SECTIONS.filter(s => s.id !== "saved" || savedItems.length > 0).map(s => {
          const isActive = activeSection === s.id;
          return (
            <button key={s.id} onClick={() => setSection(s.id)} style={{ flexShrink:0, display:"flex", alignItems:"center", gap:5, padding:"8px 15px", borderRadius:50, border:`1.5px solid ${isActive ? G.forest : G.border}`, backgroundColor: isActive ? G.forest : G.card, color: isActive ? G.ivory : G.text, fontSize:12, fontWeight: isActive ? 600 : 400, fontFamily:sans, cursor:"pointer", transition:"all 0.18s ease", whiteSpace:"nowrap", boxShadow: isActive ? "0 3px 10px rgba(27,58,45,0.22)" : "none" }}>
              <span style={{ fontSize:13 }}>{s.icon}</span>{s.label}
            </button>
          );
        })}
      </div>

      {/* Section content */}
      <div style={{ padding:"0 16px" }}>

        {/* Empty state */}
        {!activeSection && (
          <div style={{ textAlign:"center", padding:"56px 20px 40px" }}>
            <div style={{ width:72, height:72, borderRadius:"50%", backgroundColor:`${G.forest}0D`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px" }}>
              <LeafDecor size={32}/>
            </div>
            <p style={{ fontFamily:serif, fontSize:20, color:G.text, margin:"0 0 10px", fontWeight:600 }}>What would you like today?</p>
            <p style={{ fontSize:13, color:G.muted, margin:0, lineHeight:1.8 }}>Select a category above to explore your<br/>personalised nutrition options.</p>
          </div>
        )}

        {/* ── TODAY'S PLAN ── */}
        {activeSection === "plan" && (
          <div style={{ animation:"sectionIn 0.22s ease", paddingBottom:28 }}>
            <p style={STitleStyle}>Today's Plan</p>
            <p style={SDescStyle}>Personalised meals for your day{cyclePhase ? `, ${cyclePhase.label.toLowerCase()} phase` : ""}.</p>

            {/* Goal selector */}
            {!mealPlanLoad && (
              <>
                <div style={{ display:"flex", gap:7, marginBottom:8 }}>
                  {[
                    { id:"lose",     label:"Lose weight" },
                    { id:"maintain", label:"Maintain"    },
                    { id:"gain",     label:"Gain muscle" },
                  ].map(g => {
                    const active = planGoal === g.id;
                    return (
                      <button key={g.id} onClick={() => setPlanGoal(g.id)} style={{ flex:1, padding:"10px 4px", borderRadius:11, border:`1.5px solid ${active ? G.forest : G.border}`, backgroundColor: active ? G.forest : "transparent", color: active ? G.ivory : G.muted, fontSize:12, fontWeight: active ? 600 : 400, cursor:"pointer", fontFamily:sans, transition:"all 0.15s", lineHeight:1.3, textAlign:"center" }}>
                        {g.label}
                      </button>
                    );
                  })}
                </div>
                {/* Custom kcal override */}
                <div style={{ marginBottom:14 }}>
                  <button onClick={() => { setPlanUseCustom(s => !s); if (planUseCustom) setPlanCustomKcal(""); }} style={{ background:"none", border:"none", cursor:"pointer", fontSize:11, color:planUseCustom ? G.forest : G.muted, fontFamily:sans, padding:"2px 0 6px", display:"flex", alignItems:"center", gap:5 }}>
                    <span style={{ fontSize:13 }}>{planUseCustom ? "▾" : "▸"}</span>
                    {planUseCustom ? "Custom kcal target active" : "Set custom kcal target"}
                  </button>
                  {planUseCustom && (
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <input type="number" min="800" max="6000" step="50" value={planCustomKcal} onChange={e => setPlanCustomKcal(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && planCustomKcal) genPlan(); }} placeholder={`Default: ${Math.max(1200, tCal + (GOAL_ADJ[planGoal]||0))}`} style={{ flex:1, padding:"9px 12px", border:`1.5px solid ${G.forest}`, borderRadius:9, fontSize:13, color:G.text, fontFamily:sans, outline:"none", backgroundColor:G.card }}/>
                      <button onClick={() => { if (planCustomKcal) genPlan(); }} disabled={!planCustomKcal} style={{ padding:"9px 13px", borderRadius:9, border:"none", backgroundColor: planCustomKcal ? G.forest : G.border, color: planCustomKcal ? G.ivory : G.muted, fontSize:13, fontWeight:600, cursor: planCustomKcal ? "pointer" : "not-allowed", fontFamily:sans, flexShrink:0, transition:"all 0.15s" }}>✓</button>
                    </div>
                  )}
                </div>
              </>
            )}

            {!mealPlan && !mealPlanLoad && !mealPlanError && (
              <GBtn onClick={genPlan}><SparkleIcon size={15} color={G.ivory}/>Generate today's plan</GBtn>
            )}
            {mealPlanLoad && (
              <div style={{ display:"flex", flexDirection:"column", gap:10, marginTop:8 }}>
                {[1,2,3].map(i => <div key={i} style={{ height:88, backgroundColor:G.border, borderRadius:18, opacity:0.3+i*0.15 }}/>)}
              </div>
            )}
            {mealPlanError && !mealPlanLoad && (
              <div style={{ padding:"16px", backgroundColor:G.errorBg, border:`1px solid ${G.error}25`, borderRadius:14, margin:"4px 0" }}>
                <p style={{ fontSize:13, color:G.error, margin:"0 0 12px", lineHeight:1.6, textAlign:"center" }}>{mealPlanError}</p>
                <button onClick={genPlan} style={{ width:"100%", padding:"11px", backgroundColor:"transparent", color:G.gold, border:`1.5px solid ${G.gold}`, borderRadius:10, fontSize:13, fontWeight:500, cursor:"pointer", fontFamily:sans }}>Try again</button>
              </div>
            )}
            {mealPlan && !mealPlanLoad && (
              <>
                {/* Nutrition summary + transparency */}
                {planMeta && (() => {
                  const totalKcal  = mealPlan.reduce((s, m) => s + (m.calories  || 0), 0);
                  const totalPro   = mealPlan.reduce((s, m) => s + (m.protein_g || 0), 0);
                  const totalCarbs = mealPlan.reduce((s, m) => s + (m.carbs_g   || 0), 0);
                  const totalFat   = mealPlan.reduce((s, m) => s + (m.fat_g     || 0), 0);
                  return (
                    <div style={{ backgroundColor:G.goldLight, border:`1px solid ${G.gold}50`, borderRadius:14, padding:"14px 16px", marginBottom:16 }}>
                      <div style={{ display:"flex", alignItems:"baseline", gap:8, marginBottom:12 }}>
                        <span style={{ fontFamily:serif, fontSize:14, fontWeight:600, color:G.forest }}>Daily total</span>
                        <span style={{ fontSize:10, color:G.muted, fontFamily:sans }}>{mealPlan.length} meals</span>
                      </div>
                      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6, marginBottom:12 }}>
                        {[
                          { label:"kcal",    value:Math.round(totalKcal),           color:G.forest    },
                          { label:"protein", value:`${Math.round(totalPro)}g`,      color:G.forestMid },
                          { label:"carbs",   value:`${Math.round(totalCarbs)}g`,    color:G.gold      },
                          { label:"fat",     value:`${Math.round(totalFat)}g`,      color:G.amber     },
                        ].map(({ label, value, color }) => (
                          <div key={label} style={{ backgroundColor:G.card, borderRadius:9, padding:"9px 5px", textAlign:"center", border:`1px solid ${G.border}` }}>
                            <p style={{ fontFamily:serif, fontSize:15, fontWeight:700, color, margin:"0 0 2px", lineHeight:1 }}>{value}</p>
                            <p style={{ fontSize:9, color:G.muted, margin:0, textTransform:"uppercase", letterSpacing:"0.05em", fontFamily:sans }}>{label}</p>
                          </div>
                        ))}
                      </div>
                      <p style={{ fontSize:11, color:G.amber, margin:0, lineHeight:1.55, fontFamily:sans }}>
                        Based on your profile: <b>{planMeta.adjCal} kcal</b> target for {planMeta.goalLabel} — {planMeta.goalDesc}
                      </p>
                    </div>
                  );
                })()}
                <div style={{ display:"flex", flexDirection:"column", gap:12, marginTop:4 }}>
                  {PLAN_ORDER.map(group => {
                    const meal = mealPlan.find(m => m.mealGroup === group);
                    if (!meal) return null;
                    const isOpen   = expandedMeal === group;
                    const color    = (MEAL_CARD[group] || MEAL_CARD.Snack).accent;
                    const mealKey  = `${group}_${meal.name}`;
                    const ingState = ingChecked[mealKey] || {};
                    const isLogged = !!loggedMeals[group];
                    const isFav    = savedItems.some(i => i.type === "meal" && i.data?.name === meal.name);
                    return (
                      <div key={group} style={{ backgroundColor:G.card, borderRadius:18, overflow:"hidden", border:`1px solid ${G.border}`, boxShadow:"0 1px 6px rgba(27,58,45,0.05)" }}>
                        <div style={{ height:3, backgroundColor:color }}/>
                        <div style={{ padding:"13px 16px 0", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                          <span style={{ fontSize:10, fontWeight:700, color, textTransform:"uppercase", letterSpacing:"0.12em" }}>{group}</span>
                          <button onClick={() => toggleMealFavourite(meal)} style={{ border:"none", background:"none", cursor:"pointer", padding:4 }}>
                            <HeartIcon size={17} color={isFav ? "#C8847A" : G.muted} filled={isFav}/>
                          </button>
                        </div>
                        <div style={{ padding:"5px 16px 3px" }}>
                          <p style={{ fontFamily:serif, fontSize:19, fontWeight:600, color:G.text, margin:0, lineHeight:1.25 }}>{meal.name}</p>
                        </div>
                        <div style={{ padding:"3px 16px 13px" }}>
                          <MacroStrip kcal={meal.calories} pro={meal.protein_g} carbs={meal.carbs_g} fat={meal.fat_g}/>
                          {meal.prepTime && <span style={{ fontSize:11, color:G.muted, marginTop:5, display:"block" }}>{meal.prepTime}</span>}
                        </div>
                        {meal.image && !isOpen && (
                          <div style={{ height:180, overflow:"hidden" }}>
                            <img src={meal.image} alt={meal.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} loading="lazy"/>
                          </div>
                        )}
                        <div style={{ padding: isOpen ? "13px 16px 0" : "14px 16px 16px", display:"flex", gap:8 }}>
                          <button onClick={() => setExpandedMeal(isOpen ? null : group)} style={{ flex:1, padding:"11px", backgroundColor: isOpen ? color : "transparent", color: isOpen ? G.ivory : color, border:`1.5px solid ${color}`, borderRadius:10, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:sans, transition:"all 0.15s" }}>
                            {isOpen ? "Close" : "View Recipe"}
                          </button>
                          <button onClick={() => { if (!isLogged) { addToLog({ ...meal, notes:"From Nora's plan" }); setLoggedMeals(p => ({ ...p, [group]:true })); }}} style={{ flex:1, padding:"11px", backgroundColor: isLogged ? `${color}18` : color, color: isLogged ? color : G.ivory, border:"none", borderRadius:10, fontSize:13, fontWeight:600, cursor: isLogged ? "default" : "pointer", fontFamily:sans, display:"flex", alignItems:"center", justifyContent:"center", gap:6, transition:"all 0.2s" }}>
                            {isLogged ? <><CheckIcon size={12} color={color}/>Logged</> : "Log meal"}
                          </button>
                          <button onClick={() => genMealAlt(group)} disabled={!!altLoading[group]} title="Generate alternative" style={{ width:44, padding:"11px", borderRadius:10, border:`1.5px solid ${G.border}`, background:"none", cursor: altLoading[group] ? "not-allowed" : "pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:17, color:G.muted, opacity: altLoading[group] ? 0.5 : 1 }}>
                            {altLoading[group] ? <Spinner/> : "↻"}
                          </button>
                        </div>
                        {isOpen && (
                          <div style={{ margin:"13px 16px 16px", padding:"16px", backgroundColor:G.ivory, borderRadius:12, border:`1px solid ${G.border}` }}>
                            {meal.image && <div style={{ height:200, borderRadius:10, overflow:"hidden", marginBottom:22 }}><img src={meal.image} alt={meal.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} loading="lazy"/></div>}
                            {(meal.ingredients||[]).length > 0 && (
                              <div style={{ marginBottom:18 }}>
                                <p style={{ fontSize:11, fontWeight:700, color:G.muted, textTransform:"uppercase", letterSpacing:"0.07em", margin:"0 0 10px" }}>Ingredients</p>
                                {(meal.ingredients||[]).map((ing, i) => {
                                  const item = typeof ing === "string" ? ing : ing.item;
                                  const amt  = typeof ing === "string" ? "" : ing.amount;
                                  const ck   = !!(ingState[i]);
                                  return (
                                    <div key={i} onClick={() => toggleIng(mealKey, i)} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 0", cursor:"pointer", borderBottom: i < meal.ingredients.length-1 ? `1px solid ${G.border}` : "none", opacity: ck ? 0.45 : 1 }}>
                                      <div style={{ width:18, height:18, borderRadius:5, border:`1.5px solid ${ck ? color : G.border}`, backgroundColor: ck ? color : "transparent", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                                        {ck && <CheckIcon size={10} color={G.ivory}/>}
                                      </div>
                                      <span style={{ fontSize:14, color:G.text, flex:1, textDecoration: ck ? "line-through" : "none" }}>{item}</span>
                                      {amt && <span style={{ fontSize:13, color:G.muted, flexShrink:0 }}>{amt}</span>}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                            {(meal.steps||[]).length > 0 && (
                              <div style={{ marginBottom:16 }}>
                                <p style={{ fontSize:11, fontWeight:700, color:G.muted, textTransform:"uppercase", letterSpacing:"0.07em", margin:"0 0 12px" }}>Instructions</p>
                                {meal.steps.map((step, i) => (
                                  <div key={i} style={{ display:"flex", gap:14, marginBottom:14 }}>
                                    <div style={{ width:24, height:24, borderRadius:"50%", flexShrink:0, backgroundColor:color, color:G.ivory, fontSize:12, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center" }}>{i+1}</div>
                                    <p style={{ fontSize:14, color:G.text, lineHeight:1.65, margin:0, paddingTop:2 }}>{step}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                            {meal.tip && (
                              <div style={{ padding:"10px 14px", backgroundColor:G.goldLight, borderLeft:`3px solid ${G.gold}`, borderRadius:"0 9px 9px 0", marginBottom:12 }}>
                                <p style={{ fontSize:12, color:G.amber, margin:0, lineHeight:1.55 }}>💡 {meal.tip}</p>
                              </div>
                            )}
                            <button onClick={() => setExpandedMeal(null)} style={{ width:"100%", padding:"11px", backgroundColor:"transparent", color:G.muted, border:`1px solid ${G.border}`, borderRadius:10, fontSize:13, cursor:"pointer", fontFamily:sans, marginTop:4 }}>Close</button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div style={{ display:"flex", gap:8, marginTop:14 }}>
                  <button onClick={genPlan} style={{ flex:1, padding:"12px", backgroundColor:"transparent", color:G.forest, border:`1.5px solid ${G.forest}`, borderRadius:12, fontSize:13, fontWeight:500, cursor:"pointer", fontFamily:sans, display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                    <SparkleIcon size={13} color={G.forest}/>New plan
                  </button>
                  <button onClick={savePlan} style={{ flex:1, padding:"12px", backgroundColor: planSaved ? `${G.forest}14` : G.forest, color: planSaved ? G.forest : G.ivory, border:"none", borderRadius:12, fontSize:13, fontWeight:500, cursor: planSaved ? "default" : "pointer", fontFamily:sans }}>
                    {planSaved ? "Saved ✓" : "Save plan"}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── WEEK PREP ── */}
        {activeSection === "week" && (
          <div style={{ animation:"sectionIn 0.22s ease", paddingBottom:28 }}>
            <p style={STitleStyle}>7-Day Prep</p>
            <p style={SDescStyle}>Personalised to your calorie target{profile?.preferences ? ` · ${profile.preferences}` : ""}. Breakfast, lunch & dinner for 7 days.</p>

            {/* Goal selector */}
            {!weekPlanLoad && (
              <>
                <div style={{ display:"flex", gap:7, marginBottom:8 }}>
                  {[
                    { id:"lose",     label:"Lose weight" },
                    { id:"maintain", label:"Maintain"    },
                    { id:"gain",     label:"Gain muscle" },
                  ].map(g => {
                    const active = weekGoal === g.id;
                    return (
                      <button key={g.id} onClick={() => setWeekGoal(g.id)} style={{ flex:1, padding:"10px 4px", borderRadius:11, border:`1.5px solid ${active ? G.forest : G.border}`, backgroundColor: active ? G.forest : "transparent", color: active ? G.ivory : G.muted, fontSize:12, fontWeight: active ? 600 : 400, cursor:"pointer", fontFamily:sans, transition:"all 0.15s", lineHeight:1.3, textAlign:"center" }}>
                        {g.label}
                      </button>
                    );
                  })}
                </div>
                {/* Custom kcal override */}
                <div style={{ marginBottom:14 }}>
                  <button onClick={() => { setWeekUseCustom(s => !s); if (weekUseCustom) setWeekCustomKcal(""); }} style={{ background:"none", border:"none", cursor:"pointer", fontSize:11, color:weekUseCustom ? G.forest : G.muted, fontFamily:sans, padding:"2px 0 6px", display:"flex", alignItems:"center", gap:5 }}>
                    <span style={{ fontSize:13 }}>{weekUseCustom ? "▾" : "▸"}</span>
                    {weekUseCustom ? "Custom kcal target active" : "Set custom kcal target"}
                  </button>
                  {weekUseCustom && (
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <input type="number" min="800" max="6000" step="50" value={weekCustomKcal} onChange={e => setWeekCustomKcal(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && weekCustomKcal) genWeek(); }} placeholder={`Default: ${Math.max(1200, tCal + (GOAL_ADJ[weekGoal]||0))}`} style={{ flex:1, padding:"9px 12px", border:`1.5px solid ${G.forest}`, borderRadius:9, fontSize:13, color:G.text, fontFamily:sans, outline:"none", backgroundColor:G.card }}/>
                      <button onClick={() => { if (weekCustomKcal) genWeek(); }} disabled={!weekCustomKcal} style={{ padding:"9px 13px", borderRadius:9, border:"none", backgroundColor: weekCustomKcal ? G.forest : G.border, color: weekCustomKcal ? G.ivory : G.muted, fontSize:13, fontWeight:600, cursor: weekCustomKcal ? "pointer" : "not-allowed", fontFamily:sans, flexShrink:0, transition:"all 0.15s" }}>✓</button>
                    </div>
                  )}
                </div>
              </>
            )}

            <GBtn onClick={genWeek} disabled={weekPlanLoad}>
              {weekPlanLoad ? <><Spinner/>Building your week…</> : <><SparkleIcon size={15} color={G.ivory}/>{weekPlan ? "New week plan" : "Generate week plan"}</>}
            </GBtn>
            {weekError && <p style={{ fontSize:12, color:G.error, textAlign:"center", margin:"10px 0 0" }}>{weekError}</p>}
            {weekPlanLoad && weekProgress && <p style={{ fontSize:12, color:G.muted, textAlign:"center", margin:"10px 0 0", fontStyle:"italic" }}>{weekProgress}</p>}

            {weekPlan && (
              <>
                {weekMeta && (() => {
                  const days = weekPlan.days || [];
                  const avgKcal = days.length > 0
                    ? Math.round(days.reduce((s, d) => s + (d.calories_est || 0), 0) / days.length)
                    : 0;
                  const totalPro   = days.reduce((s, d) => s + (d.breakfast?.protein_g||0) + (d.lunch?.protein_g||0) + (d.dinner?.protein_g||0), 0);
                  const totalCarbs = days.reduce((s, d) => s + (d.breakfast?.carbs_g||0)   + (d.lunch?.carbs_g||0)   + (d.dinner?.carbs_g||0),   0);
                  const totalFat   = days.reduce((s, d) => s + (d.breakfast?.fat_g||0)     + (d.lunch?.fat_g||0)     + (d.dinner?.fat_g||0),     0);
                  const avgPro   = days.length > 0 ? Math.round(totalPro   / days.length) : 0;
                  const avgCarbs = days.length > 0 ? Math.round(totalCarbs / days.length) : 0;
                  const avgFat   = days.length > 0 ? Math.round(totalFat   / days.length) : 0;
                  return (
                    <div style={{ backgroundColor:G.goldLight, border:`1px solid ${G.gold}50`, borderRadius:14, padding:"14px 16px", marginTop:16, marginBottom:4 }}>
                      <div style={{ display:"flex", alignItems:"baseline", gap:8, marginBottom:12 }}>
                        <span style={{ fontFamily:serif, fontSize:14, fontWeight:600, color:G.forest }}>Daily average</span>
                        <span style={{ fontSize:10, color:G.muted, fontFamily:sans }}>{days.length} days</span>
                      </div>
                      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6, marginBottom:12 }}>
                        {[
                          { label:"kcal",    value:avgKcal,           color:G.forest    },
                          { label:"protein", value:`${avgPro}g`,      color:G.forestMid },
                          { label:"carbs",   value:`${avgCarbs}g`,    color:G.gold      },
                          { label:"fat",     value:`${avgFat}g`,      color:G.amber     },
                        ].map(({ label, value, color }) => (
                          <div key={label} style={{ backgroundColor:G.card, borderRadius:9, padding:"9px 5px", textAlign:"center", border:`1px solid ${G.border}` }}>
                            <p style={{ fontFamily:serif, fontSize:15, fontWeight:700, color, margin:"0 0 2px", lineHeight:1 }}>{value}</p>
                            <p style={{ fontSize:9, color:G.muted, margin:0, textTransform:"uppercase", letterSpacing:"0.05em", fontFamily:sans }}>{label}</p>
                          </div>
                        ))}
                      </div>
                      <p style={{ fontSize:11, color:G.amber, margin:0, lineHeight:1.55, fontFamily:sans }}>
                        Based on your profile: <b>{weekMeta.adjCal} kcal</b> target for {weekMeta.goalLabel} — {weekMeta.goalDesc}
                      </p>
                    </div>
                  );
                })()}

                <div style={{ marginTop:20, display:"flex", flexDirection:"column", gap:6 }}>
                  {(weekPlan.days||[]).map(day => {
                    const isDayOpen = openWeekDay === day.day;
                    return (
                      <div key={day.day} style={{ backgroundColor:G.card, border:`1px solid ${G.border}`, borderRadius:14, overflow:"hidden", boxShadow:"0 1px 4px rgba(27,58,45,0.04)" }}>
                        <button onClick={() => setOpenWeekDay(isDayOpen ? null : day.day)} style={{ width:"100%", padding:"14px 16px", display:"flex", justifyContent:"space-between", alignItems:"center", background:"none", border:"none", cursor:"pointer" }}>
                          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                            <div style={{ width:6, height:6, borderRadius:"50%", backgroundColor: isDayOpen ? G.gold : G.border }}/>
                            <span style={{ fontFamily:serif, fontSize:16, fontWeight:600, color:G.text }}>{day.day}</span>
                          </div>
                          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                            <span style={{ fontSize:11, color:G.muted }}>~{day.calories_est} kcal</span>
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ transition:"transform 0.25s", transform: isDayOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
                              <path d="M2 5l5 5 5-5" stroke={G.muted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                        </button>
                        {isDayOpen && (
                          <div style={{ borderTop:`1px solid ${G.border}`, padding:"12px", display:"flex", flexDirection:"column", gap:8 }}>
                            {["breakfast","lunch","dinner","snack"].map(mk => {
                              const m = day[mk]; if (!m) return null;
                              const col = { breakfast:G.gold, lunch:G.forestMid, dinner:G.forest, snack:G.sage }[mk] || G.forest;
                              const logKey = `${day.day}_${mk}`;
                              const logged = !!weekMealLogged[logKey];
                              return (
                                <div key={mk} style={{ backgroundColor:G.ivory, borderRadius:12, border:`1px solid ${G.border}`, overflow:"hidden" }}>
                                  {m.image && <div style={{ width:"100%", height:160, overflow:"hidden" }}><img src={m.image} alt={m.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} loading="lazy"/></div>}
                                  <div style={{ padding:"11px 13px" }}>
                                    <span style={{ fontSize:10, fontWeight:700, color:col, textTransform:"capitalize", letterSpacing:"0.04em" }}>{mk}</span>
                                    <p style={{ fontFamily:serif, fontSize:14, fontWeight:600, color:G.text, margin:"3px 0 3px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{m.emoji} {m.name}</p>
                                    <MacroStrip kcal={m.calories} pro={m.protein_g} carbs={m.carbs_g} fat={m.fat_g}/>
                                    <div style={{ display:"flex", gap:8, marginTop:8 }}>
                                      <button onClick={() => openWeekRecipe(day.day, mk, m)} style={{ fontSize:11, color:col, background:"none", border:`1.5px solid ${col}40`, borderRadius:7, padding:"5px 10px", cursor:"pointer", fontWeight:600, fontFamily:sans }}>Recipe</button>
                                      <button onClick={() => { if (!logged) { addToLog({ name:m.name, calories:m.calories||0, protein_g:m.protein_g||0, carbs_g:m.carbs_g||0, fat_g:m.fat_g||0, fiber_g:0, notes:`Week prep — ${day.day}` }); setWeekMealLogged(p => ({ ...p, [logKey]:true })); } }} style={{ fontSize:11, color: logged ? G.sage : G.forest, background:"none", border:`1.5px solid ${logged ? G.sage : G.forest}40`, borderRadius:7, padding:"5px 10px", cursor: logged ? "default" : "pointer", fontWeight:600, fontFamily:sans }}>{logged ? "✓ Logged" : "Log"}</button>
                                      <button onClick={() => genWeekMealAlt(day.day, mk)} disabled={!!weekAltLoading[`${day.day}_${mk}`]} title="Generate alternative" style={{ width:34, borderRadius:7, border:`1.5px solid ${G.border}`, background:"none", cursor: weekAltLoading[`${day.day}_${mk}`] ? "not-allowed" : "pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:15, color:G.muted, opacity: weekAltLoading[`${day.day}_${mk}`] ? 0.5 : 1, padding:"5px" }}>
                                        {weekAltLoading[`${day.day}_${mk}`] ? <Spinner/> : "↻"}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {weekPlan.shopping_categories && Object.keys(weekPlan.shopping_categories).length > 0 && (
                  <div style={{ marginTop:24 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                      <p style={{ fontFamily:serif, fontSize:18, fontWeight:600, color:G.text, margin:0 }}>Shopping List</p>
                      <div style={{ display:"flex", gap:6 }}>
                        <button onClick={() => setShopChecked({})} style={{ fontSize:11, color:G.gold, background:"none", border:`1px solid ${G.gold}`, borderRadius:8, padding:"5px 10px", cursor:"pointer", fontFamily:sans }}>Clear</button>
                        <button onClick={() => {
                          const cats = weekPlan.shopping_categories;
                          const text = SHOP_CATS.filter(c => cats[c]?.length).map(cat =>
                            `${cat}:\n${cats[cat].map(i => `  • ${i.name}${i.qty ? " — "+i.qty : ""}`).join("\n")}`
                          ).join("\n\n");
                          try { navigator.clipboard.writeText(text); } catch {}
                        }} style={{ fontSize:11, color:G.gold, background:"none", border:`1px solid ${G.gold}`, borderRadius:8, padding:"5px 10px", cursor:"pointer", fontFamily:sans }}>Copy</button>
                      </div>
                    </div>
                    {SHOP_CATS.filter(cat => weekPlan.shopping_categories[cat]?.length > 0).map(cat => {
                      const items = weekPlan.shopping_categories[cat];
                      return (
                        <div key={cat} style={{ marginBottom:14 }}>
                          <p style={{ fontSize:10, fontWeight:700, color:G.muted, textTransform:"uppercase", letterSpacing:"0.09em", margin:"0 0 7px 2px" }}>{cat}</p>
                          <div style={{ backgroundColor:G.card, borderRadius:12, border:`1px solid ${G.border}`, overflow:"hidden" }}>
                            {items.map((item, i) => {
                              const k = `shop_${cat}_${item.name}`; const checked = !!shopChecked[k];
                              return (
                                <div key={i} onClick={() => setShopChecked(p => ({ ...p, [k]:!p[k] }))} style={{ display:"flex", alignItems:"center", gap:10, padding:"11px 14px", borderBottom: i < items.length-1 ? `1px solid ${G.border}` : "none", cursor:"pointer", opacity: checked ? 0.4 : 1 }}>
                                  <div style={{ width:18, height:18, borderRadius:5, border:`1.5px solid ${checked ? G.forest : G.border}`, backgroundColor: checked ? G.forest : "transparent", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                                    {checked && <CheckIcon size={11} color={G.ivory}/>}
                                  </div>
                                  <span style={{ fontSize:13, color:G.text, textDecoration: checked ? "line-through" : "none", flex:1 }}>{item.name}</span>
                                  {item.qty && <span style={{ fontSize:12, color:G.muted, flexShrink:0 }}>{item.qty}</span>}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── SMOOTHIES ── */}
        {activeSection === "smoothie" && (
          <div style={{ animation:"sectionIn 0.22s ease", paddingBottom:28 }}>
            <p style={STitleStyle}>Smoothies</p>
            <p style={SDescStyle}>Personalised to your goals{cyclePhase ? ` and your ${cyclePhase.label.toLowerCase()} phase` : ""}.</p>
            {!smoothie && !smoothieLoad && (
              <GBtn onClick={genSmoothie}><span style={{ fontSize:16 }}>🥤</span>Generate smoothie</GBtn>
            )}
            {smoothieLoad && <div style={{ height:120, backgroundColor:G.border, borderRadius:18, marginTop:8, opacity:0.4 }}/>}
            {smoothie && !smoothieLoad && (
              <div style={{ backgroundColor:`${G.forestMid}10`, borderRadius:18, padding:"18px", border:`1px solid ${G.forestMid}20` }}>
                <div style={{ marginBottom:14 }}>
                  <p style={{ fontFamily:serif, fontSize:19, fontWeight:600, color:G.forest, margin:"0 0 3px" }}>{smoothie.emoji} {smoothie.name}</p>
                  <MacroStrip kcal={smoothie.calories} pro={smoothie.protein_g} carbs={smoothie.carbs_g||0} fat={smoothie.fat_g||0}/>
                </div>
                <p style={{ fontSize:11, fontWeight:700, color:G.sage, textTransform:"uppercase", letterSpacing:"0.05em", margin:"0 0 10px" }}>Ingredients</p>
                <IngList ingredients={smoothie.ingredients||[]} checked={smoothieIngChk} onToggle={i => setSmoothieIngChk(p => ({ ...p, [i]:!p[i] }))} accentColor={G.forest}/>
                {smoothie.method && <div style={{ marginTop:12, padding:"10px 13px", backgroundColor:`${G.forest}0C`, borderRadius:10 }}><p style={{ fontSize:13, color:G.forest, margin:0, lineHeight:1.55 }}>{smoothie.method}</p></div>}
                {smoothie.tip && <div style={{ marginTop:10, padding:"9px 13px", backgroundColor:G.goldLight, borderLeft:`3px solid ${G.gold}`, borderRadius:"0 9px 9px 0" }}><p style={{ fontSize:12, color:G.amber, margin:0, lineHeight:1.55 }}>💡 {smoothie.tip}</p></div>}
                <div style={{ display:"flex", gap:8, marginTop:14 }}>
                  <button onClick={() => { if (!smoothieLogged) { addToLog({ name:smoothie.name, calories:smoothie.calories, protein_g:smoothie.protein_g, carbs_g:smoothie.carbs_g||0, fat_g:smoothie.fat_g||0, fiber_g:0, notes:"Smoothie" }); setSmoothieLogged(true); } }} style={{ flex:2, padding:"11px", backgroundColor: smoothieLogged ? `${G.forest}15` : G.forest, color: smoothieLogged ? G.forest : G.ivory, border:"none", borderRadius:11, fontSize:13, fontWeight:600, cursor: smoothieLogged ? "default" : "pointer", fontFamily:sans, display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                    {smoothieLogged ? <><CheckIcon size={12} color={G.forest}/>Logged</> : "Log this"}
                  </button>
                  <button onClick={() => { toggleMealFavourite({ ...smoothie, mealGroup:"Smoothie", type:"smoothie" }); setSmoothieSaved(!smoothieSaved); }} style={{ width:44, padding:"11px", backgroundColor: smoothieSaved ? "#F8EEEC" : "transparent", border:`1.5px solid ${smoothieSaved ? "#C8847A40" : G.border}`, borderRadius:11, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <HeartIcon size={16} color={smoothieSaved ? "#C8847A" : G.muted} filled={smoothieSaved}/>
                  </button>
                  <button onClick={genSmoothie} style={{ flex:1, padding:"11px", backgroundColor:"transparent", color:G.gold, border:`1.5px solid ${G.gold}`, borderRadius:11, fontSize:13, fontWeight:500, cursor:"pointer", fontFamily:sans, display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>
                    <SparkleIcon size={12} color={G.gold}/>New
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── MORNING SHOTS ── */}
        {activeSection === "shot" && (
          <div style={{ animation:"sectionIn 0.22s ease", paddingBottom:28 }}>
            <p style={STitleStyle}>Morning Shots</p>
            <p style={SDescStyle}>A concentrated wellness shot for energy, immunity or focus.</p>
            {!currentShot && !shotLoad && !shotError && (
              <GBtn onClick={genShot}><span style={{ fontSize:16 }}>⚡</span>Generate shot recipe</GBtn>
            )}
            {shotLoad && <div style={{ height:90, backgroundColor:G.border, borderRadius:18, marginTop:8, opacity:0.4 }}/>}
            {shotError && !shotLoad && !currentShot && (
              <div style={{ padding:"14px 16px", backgroundColor:G.errorBg, borderRadius:14, marginTop:8 }}>
                <p style={{ fontSize:13, color:G.error, margin:"0 0 12px", lineHeight:1.6 }}>{shotError}</p>
                <button onClick={genShot} style={{ width:"100%", padding:"11px", backgroundColor:"transparent", color:G.gold, border:`1.5px solid ${G.gold}`, borderRadius:10, fontSize:13, fontWeight:500, cursor:"pointer", fontFamily:sans }}>Try again</button>
              </div>
            )}
            {currentShot && !shotLoad && (
              <div style={{ backgroundColor:G.card, borderRadius:18, padding:"16px", border:`1px solid ${G.border}`, boxShadow:"0 1px 6px rgba(27,58,45,0.06)" }}>
                <div style={{ marginBottom:12 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:9, marginBottom:4 }}>
                    <span style={{ fontSize:22 }}>{currentShot.emoji}</span>
                    <p style={{ fontFamily:serif, fontSize:17, fontWeight:600, color:G.text, margin:0, flex:1 }}>{currentShot.name}</p>
                  </div>
                  <MacroStrip kcal={currentShot.calories||25} pro={currentShot.protein_g||0} carbs={currentShot.carbs_g||0} fat={currentShot.fat_g||0}/>
                </div>
                <p style={{ fontSize:11, fontWeight:700, color:G.muted, textTransform:"uppercase", letterSpacing:"0.05em", margin:"0 0 10px" }}>Ingredients</p>
                <IngList ingredients={currentShot.ingredients||[]} checked={shotIngChk} onToggle={i => setShotIngChk(p => ({ ...p, [i]:!p[i] }))} accentColor={G.forest}/>
                {currentShot.benefit && <p style={{ fontSize:13, color:G.forest, margin:"10px 0 0", lineHeight:1.55, fontStyle:"italic" }}>{currentShot.benefit}</p>}
                <div style={{ display:"flex", gap:8, marginTop:14 }}>
                  <button onClick={() => { if (!shotLogged) { addToLog({ name:currentShot.name, calories:currentShot.calories||25, protein_g:currentShot.protein_g||0, carbs_g:currentShot.carbs_g||0, fat_g:currentShot.fat_g||0, fiber_g:0, notes:"Morning shot" }); setShotLogged(true); } }} style={{ flex:2, padding:"11px", backgroundColor: shotLogged ? `${G.forest}15` : G.forest, color: shotLogged ? G.forest : G.ivory, border:"none", borderRadius:11, fontSize:13, fontWeight:600, cursor: shotLogged ? "default" : "pointer", fontFamily:sans, display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                    {shotLogged ? <><CheckIcon size={12} color={G.forest}/>Logged</> : "Log this"}
                  </button>
                  <button onClick={() => { toggleMealFavourite({ ...currentShot, mealGroup:"Shot" }); setShotSaved(!shotSaved); }} style={{ width:44, padding:"11px", backgroundColor: shotSaved ? "#F8EEEC" : "transparent", border:`1.5px solid ${shotSaved ? "#C8847A40" : G.border}`, borderRadius:11, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <HeartIcon size={16} color={shotSaved ? "#C8847A" : G.muted} filled={shotSaved}/>
                  </button>
                  <button onClick={genShot} style={{ flex:1, padding:"11px", backgroundColor:"transparent", color:G.gold, border:`1.5px solid ${G.gold}`, borderRadius:11, fontSize:13, fontWeight:500, cursor:"pointer", fontFamily:sans, display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>
                    <SparkleIcon size={12} color={G.gold}/>New
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── FRESH JUICES ── */}
        {activeSection === "juice" && (
          <div style={{ animation:"sectionIn 0.22s ease", paddingBottom:28 }}>
            <p style={STitleStyle}>Fresh Juices</p>

            {savedJuiceObjects.length > 0 && (
              <div style={{ marginBottom:22 }}>
                <p style={{ fontSize:11, fontWeight:700, color:G.gold, textTransform:"uppercase", letterSpacing:"0.07em", margin:"0 0 10px", display:"flex", alignItems:"center", gap:5 }}>
                  <svg width="12" height="12" viewBox="0 0 18 18" fill={G.gold} stroke={G.gold} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2h12a1 1 0 0 1 1 1v14l-7-3.5L2 17V3a1 1 0 0 1 1-1z"/></svg>
                  Saved
                </p>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {savedJuiceObjects.map(juice => (
                    <JuiceCard key={juice.id} juice={juice} isSaved={savedJuices.includes(juice.id)} onToggleSave={() => toggleSavedJuice(juice.id)} ingChecked={juiceIngChk} onIngToggle={key => setJuiceIngChk(p => ({ ...p, [key]:!p[key] }))}/>
                  ))}
                </div>
                <div style={{ height:1, backgroundColor:G.border, margin:"18px 0 6px" }}/>
              </div>
            )}

            <div style={{ position:"relative", marginBottom:12 }}>
              <svg style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }} width="15" height="15" viewBox="0 0 15 15" fill="none">
                <circle cx="6.5" cy="6.5" r="5" stroke={G.muted} strokeWidth="1.5"/><path d="M10.5 10.5l3 3" stroke={G.muted} strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <input type="text" placeholder="Search juices, ingredients or benefits…" value={juiceSearch} onChange={e => setJuiceSearch(e.target.value)} style={{ width:"100%", boxSizing:"border-box", paddingLeft:38, paddingRight: juiceSearch ? 36 : 14, paddingTop:11, paddingBottom:11, border:`1.5px solid ${G.border}`, borderRadius:12, fontSize:13, color:G.text, backgroundColor:G.card, fontFamily:sans, outline:"none" }}/>
              {juiceSearch && <button onClick={() => setJuiceSearch("")} style={{ position:"absolute", right:11, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", fontSize:16, color:G.muted, padding:2 }}>×</button>}
            </div>

            <div className="eat-scroll" style={{ display:"flex", gap:6, overflowX:"auto", paddingBottom:10, marginBottom:6 }}>
              {["all", ...JUICE_CATS].map(cat => {
                const active = juiceCat === cat;
                return (
                  <button key={cat} onClick={() => setJuiceCat(cat)} style={{ flexShrink:0, padding:"6px 12px", borderRadius:50, fontSize:11, fontWeight: active ? 600 : 400, cursor:"pointer", border:`1.5px solid ${active ? G.forest : G.border}`, backgroundColor: active ? G.forest : "transparent", color: active ? G.ivory : G.muted, fontFamily:sans, whiteSpace:"nowrap", transition:"all 0.15s" }}>
                    {cat === "all" ? "All" : cat}
                  </button>
                );
              })}
            </div>

            <p style={{ fontSize:11, color:G.muted, margin:"0 0 12px", textAlign:"right" }}>{filteredJuices.length} recipe{filteredJuices.length !== 1 ? "s" : ""}</p>

            {filteredJuices.length === 0 ? (
              <div style={{ textAlign:"center", padding:"28px 0" }}>
                <p style={{ fontSize:14, color:G.muted }}>No juices match your search.</p>
                <button onClick={() => { setJuiceSearch(""); setJuiceCat("all"); }} style={{ marginTop:12, fontSize:12, color:G.gold, background:"none", border:`1.5px solid ${G.gold}`, borderRadius:9, padding:"7px 16px", cursor:"pointer", fontFamily:sans }}>Clear filters</button>
              </div>
            ) : (
              <>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {filteredJuices.slice(0, juiceLimit).map(juice => (
                    <JuiceCard key={juice.id} juice={juice} isSaved={savedJuices.includes(juice.id)} onToggleSave={() => toggleSavedJuice(juice.id)} ingChecked={juiceIngChk} onIngToggle={key => setJuiceIngChk(p => ({ ...p, [key]:!p[key] }))}/>
                  ))}
                </div>
                {filteredJuices.length > juiceLimit && (
                  <button onClick={() => setJuiceLimit(n => n + 6)} style={{ width:"100%", marginTop:10, padding:"12px", backgroundColor:"transparent", color:G.forest, border:`1.5px solid ${G.forest}`, borderRadius:12, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:sans }}>
                    Generate more ({filteredJuices.length - juiceLimit} remaining)
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {/* ── DESSERTS ── */}
        {activeSection === "dessert" && (() => {
          const dQ = dessertSearch.toLowerCase();
          const filteredDesserts = dessertsData.filter(d => {
            const matchCat = dessertCatFilter === "all" || d.category === dessertCatFilter;
            const matchQ = !dQ || d.name.toLowerCase().includes(dQ) || d.category.toLowerCase().includes(dQ) || (d.benefits||[]).some(b => b.toLowerCase().includes(dQ)) || (d.ingredients||[]).some(i => i.item.toLowerCase().includes(dQ));
            return matchCat && matchQ;
          });
          const savedDessertObjects = savedDesserts.map(id => dessertsData.find(d => d.id === id)).filter(Boolean);
          return (
            <div style={{ animation:"sectionIn 0.22s ease", paddingBottom:28 }}>
              <p style={STitleStyle}>Desserts</p>
              <p style={SDescStyle}>80+ healthy recipes naturally sweetened with dates, honey, fruit or maple syrup.</p>

              {/* Saved desserts */}
              {savedDessertObjects.length > 0 && (
                <div style={{ marginBottom:20 }}>
                  <p style={{ fontSize:11, fontWeight:700, color:G.gold, textTransform:"uppercase", letterSpacing:"0.07em", margin:"0 0 10px", display:"flex", alignItems:"center", gap:5 }}>
                    <svg width="12" height="12" viewBox="0 0 18 18" fill={G.gold} stroke={G.gold} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2h12a1 1 0 0 1 1 1v14l-7-3.5L2 17V3a1 1 0 0 1 1-1z"/></svg>
                    Saved
                  </p>
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    {savedDessertObjects.map(d => (
                      <DessertCard key={d.id} dessert={d} isSaved={true} onToggleSave={() => toggleSavedDessert(d.id)} ingChecked={dessertIngChkStatic} onIngToggle={k => setDessertIngChkStatic(p => ({ ...p, [k]:!p[k] }))}/>
                    ))}
                  </div>
                  <div style={{ height:1, backgroundColor:G.border, margin:"18px 0 6px" }}/>
                </div>
              )}

              {/* Search */}
              <div style={{ position:"relative", marginBottom:10 }}>
                <svg style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }} width="15" height="15" viewBox="0 0 15 15" fill="none">
                  <circle cx="6.5" cy="6.5" r="5" stroke={G.muted} strokeWidth="1.5"/><path d="M10.5 10.5l3 3" stroke={G.muted} strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <input type="text" placeholder="Search desserts…" value={dessertSearch} onChange={e => setDessertSearch(e.target.value)} style={{ width:"100%", boxSizing:"border-box", paddingLeft:36, paddingRight: dessertSearch ? 34 : 12, paddingTop:11, paddingBottom:11, border:`1.5px solid ${G.border}`, borderRadius:12, fontSize:13, color:G.text, backgroundColor:G.card, fontFamily:sans, outline:"none" }}/>
                {dessertSearch && <button onClick={() => setDessertSearch("")} style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", fontSize:17, color:G.muted, padding:2 }}>×</button>}
              </div>

              {/* Category filter */}
              <div className="eat-scroll" style={{ display:"flex", gap:6, overflowX:"auto", paddingBottom:10, marginBottom:8 }}>
                {["all", ...DESSERT_CATS].map(cat => {
                  const active = dessertCatFilter === cat;
                  const col = cat === "all" ? G.forest : (DESSERT_CAT_COLORS[cat] || G.forest);
                  return (
                    <button key={cat} onClick={() => setDessertCatFilter(cat)} style={{ flexShrink:0, padding:"6px 12px", borderRadius:50, fontSize:11, fontWeight: active ? 600 : 400, cursor:"pointer", border:`1.5px solid ${active ? col : G.border}`, backgroundColor: active ? col : "transparent", color: active ? G.ivory : G.muted, fontFamily:sans, whiteSpace:"nowrap", transition:"all 0.15s" }}>
                      {cat === "all" ? "All" : cat}
                    </button>
                  );
                })}
              </div>

              <p style={{ fontSize:11, color:G.muted, margin:"0 0 12px", textAlign:"right" }}>{filteredDesserts.length} recipe{filteredDesserts.length !== 1 ? "s" : ""}</p>

              {filteredDesserts.length === 0 ? (
                <div style={{ textAlign:"center", padding:"24px 0" }}>
                  <p style={{ fontSize:14, color:G.muted }}>No desserts match your search.</p>
                  <button onClick={() => { setDessertSearch(""); setDessertCatFilter("all"); }} style={{ marginTop:10, fontSize:12, color:G.gold, background:"none", border:`1.5px solid ${G.gold}`, borderRadius:9, padding:"7px 16px", cursor:"pointer", fontFamily:sans }}>Clear filters</button>
                </div>
              ) : (
                <>
                  <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom: filteredDesserts.length > dessertLimit ? 8 : 24 }}>
                    {filteredDesserts.slice(0, dessertLimit).map(d => (
                      <DessertCard key={d.id} dessert={d} isSaved={savedDesserts.includes(d.id)} onToggleSave={() => toggleSavedDessert(d.id)} ingChecked={dessertIngChkStatic} onIngToggle={k => setDessertIngChkStatic(p => ({ ...p, [k]:!p[k] }))}/>
                    ))}
                  </div>
                  {filteredDesserts.length > dessertLimit && (
                    <button onClick={() => setDessertLimit(n => n + 6)} style={{ width:"100%", marginBottom:20, padding:"12px", backgroundColor:"transparent", color:G.forest, border:`1.5px solid ${G.forest}`, borderRadius:12, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:sans }}>
                      Generate more ({filteredDesserts.length - dessertLimit} remaining)
                    </button>
                  )}
                </>
              )}

              {/* AI Generate option */}
              <div style={{ borderTop:`1px solid ${G.border}`, paddingTop:18 }}>
                <button onClick={() => setShowAIDessert(s => !s)} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", width:"100%", background:"none", border:`1.5px solid ${G.border}`, borderRadius:12, padding:"12px 16px", cursor:"pointer", textAlign:"left" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <SparkleIcon size={14} color={G.gold}/>
                    <span style={{ fontSize:13, fontWeight:500, color:G.text, fontFamily:sans }}>Generate a custom AI dessert</span>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ transition:"transform 0.2s", transform: showAIDessert ? "rotate(180deg)" : "rotate(0deg)", flexShrink:0 }}>
                    <path d="M2 5l5 5 5-5" stroke={G.muted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                {showAIDessert && (
                  <div style={{ marginTop:12 }}>
                    {!dessert && !dessertLoad && (
                      <GBtn onClick={genDessert}><span style={{ fontSize:15 }}>🍫</span>Generate dessert</GBtn>
                    )}
                    {dessertLoad && <div style={{ height:90, backgroundColor:G.border, borderRadius:16, opacity:0.4 }}/>}
                    {dessert && !dessertLoad && (
                      <div style={{ backgroundColor:G.card, borderRadius:16, padding:"16px", border:`1px solid ${G.border}` }}>
                        <div style={{ marginBottom:12 }}>
                          <p style={{ fontFamily:serif, fontSize:17, fontWeight:600, color:G.text, margin:"0 0 4px" }}>{dessert.emoji} {dessert.name}</p>
                          <MacroStrip kcal={dessert.calories} pro={dessert.protein_g||0} carbs={dessert.carbs_g||0} fat={dessert.fat_g||0}/>
                          <p style={{ fontSize:9, color:G.muted, margin:"3px 0 0", fontFamily:sans }}>per serving</p>
                        </div>
                        {(dessert.ingredients||[]).length > 0 && (
                          <div style={{ marginBottom:12 }}>
                            <p style={{ fontSize:11, fontWeight:700, color:G.muted, textTransform:"uppercase", letterSpacing:"0.06em", margin:"0 0 8px" }}>Ingredients</p>
                            <IngList ingredients={dessert.ingredients} checked={dessertIngChk} onToggle={i => setDessertIngChk(p => ({ ...p, [i]:!p[i] }))} accentColor={G.gold}/>
                          </div>
                        )}
                        {(dessert.steps||[]).length > 0 && (
                          <div style={{ marginBottom:12 }}>
                            <p style={{ fontSize:11, fontWeight:700, color:G.muted, textTransform:"uppercase", letterSpacing:"0.06em", margin:"0 0 8px" }}>Instructions</p>
                            {dessert.steps.map((step, i) => (
                              <div key={i} style={{ display:"flex", gap:10, marginBottom:8 }}>
                                <div style={{ width:20, height:20, borderRadius:"50%", flexShrink:0, backgroundColor:G.gold, color:G.ivory, fontSize:10, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center" }}>{i+1}</div>
                                <p style={{ fontSize:13, color:G.text, lineHeight:1.6, margin:0, paddingTop:1 }}>{step}</p>
                              </div>
                            ))}
                          </div>
                        )}
                        {dessert.tip && <div style={{ padding:"9px 13px", backgroundColor:G.goldLight, borderLeft:`3px solid ${G.gold}`, borderRadius:"0 9px 9px 0", marginBottom:12 }}><p style={{ fontSize:12, color:G.amber, margin:0 }}>💡 {dessert.tip}</p></div>}
                        <div style={{ display:"flex", gap:8 }}>
                          <button onClick={() => { if (!dessertLogged) { addToLog({ name:dessert.name, calories:dessert.calories, protein_g:dessert.protein_g||0, carbs_g:dessert.carbs_g||0, fat_g:dessert.fat_g||0, fiber_g:dessert.fiber_g||0, notes:"AI Dessert" }); setDessertLogged(true); } }} style={{ flex:2, padding:"11px", backgroundColor: dessertLogged ? `${G.forest}15` : G.forest, color: dessertLogged ? G.forest : G.ivory, border:"none", borderRadius:10, fontSize:13, fontWeight:600, cursor: dessertLogged ? "default" : "pointer", fontFamily:sans, display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                            {dessertLogged ? <><CheckIcon size={12} color={G.forest}/>Logged</> : "Log this"}
                          </button>
                          <button onClick={genDessert} style={{ flex:1, padding:"11px", backgroundColor:"transparent", color:G.gold, border:`1.5px solid ${G.gold}`, borderRadius:10, fontSize:13, fontWeight:500, cursor:"pointer", fontFamily:sans, display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>
                            <SparkleIcon size={12} color={G.gold}/>New
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* ── SEARCH FOODS ── */}
        {activeSection === "search" && (
          <div style={{ animation:"sectionIn 0.22s ease", paddingBottom:28 }}>
            <p style={STitleStyle}>Search Foods</p>
            <p style={SDescStyle}>Search any dish or ingredient — returns matching recipes with full ingredients list and step-by-step cooking instructions.</p>

            {/* Search input */}
            <div style={{ display:"flex", gap:8, marginBottom:16 }}>
              <div style={{ flex:1, position:"relative" }}>
                <svg style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }} width="15" height="15" viewBox="0 0 15 15" fill="none">
                  <circle cx="6.5" cy="6.5" r="5" stroke={G.muted} strokeWidth="1.5"/><path d="M10.5 10.5l3 3" stroke={G.muted} strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <input type="text" placeholder="e.g. chicken pasta, banana bread, salmon…" value={foodQuery} onChange={e => setFoodQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && searchFoods()} style={{ width:"100%", boxSizing:"border-box", paddingLeft:36, paddingRight:12, paddingTop:12, paddingBottom:12, border:`1.5px solid ${G.border}`, borderRadius:12, fontSize:13, color:G.text, backgroundColor:G.card, fontFamily:sans, outline:"none" }}/>
              </div>
              <button onClick={() => searchFoods()} disabled={foodSearchLoad || !foodQuery.trim()} style={{ padding:"12px 16px", backgroundColor: (!foodQuery.trim() || foodSearchLoad) ? `${G.forest}60` : G.forest, color:G.ivory, border:"none", borderRadius:12, fontSize:13, fontWeight:600, cursor: (!foodQuery.trim() || foodSearchLoad) ? "not-allowed" : "pointer", fontFamily:sans, flexShrink:0, display:"flex", alignItems:"center", gap:6 }}>
                {foodSearchLoad ? <Spinner/> : <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="6.5" cy="6.5" r="5" stroke={G.ivory} strokeWidth="1.8"/><path d="M10.5 10.5l3 3" stroke={G.ivory} strokeWidth="1.8" strokeLinecap="round"/></svg>}
                Search
              </button>
            </div>

            {/* Loading skeleton */}
            {foodSearchLoad && (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                {[1,2,3,4].map(i => (
                  <div key={i} style={{ backgroundColor:G.card, borderRadius:16, border:`1px solid ${G.border}`, overflow:"hidden" }}>
                    <div style={{ height:120, backgroundColor:G.border, opacity:0.2 + i*0.04 }}/>
                    <div style={{ padding:"10px 12px 12px" }}>
                      <div style={{ height:10, width:"50%", backgroundColor:G.border, borderRadius:4, marginBottom:7, opacity:0.3 }}/>
                      <div style={{ height:13, width:"90%", backgroundColor:G.border, borderRadius:4, marginBottom:5, opacity:0.25 }}/>
                      <div style={{ height:11, width:"70%", backgroundColor:G.border, borderRadius:4, marginBottom:8, opacity:0.2 }}/>
                      <div style={{ display:"flex", gap:5 }}>
                        {[38,30,30,30].map((w,j) => <div key={j} style={{ height:20, width:w, backgroundColor:G.border, borderRadius:5, opacity:0.2 }}/>)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Error */}
            {foodSearchError && !foodSearchLoad && (
              <div style={{ padding:"14px 16px", backgroundColor:G.errorBg, borderRadius:12 }}>
                <p style={{ fontSize:13, color:G.error, margin:0 }}>{foodSearchError}</p>
              </div>
            )}

            {/* No results */}
            {foodSearchDone && !foodSearchLoad && foodResults.length === 0 && !foodSearchError && (
              <div style={{ textAlign:"center", padding:"28px 0" }}>
                <p style={{ fontSize:14, color:G.muted, margin:0 }}>No recipes found for "{foodQuery}".</p>
                <p style={{ fontSize:12, color:G.muted, margin:"6px 0 0" }}>Try terms like "chicken pasta", "chocolate cake" or "salmon".</p>
              </div>
            )}

            {/* Results */}
            {!foodSearchLoad && foodResults.length > 0 && (
              <>
                <p style={{ fontSize:11, color:G.muted, margin:"0 0 12px", textAlign:"right" }}>{foodResults.length} recipe{foodResults.length !== 1 ? "s" : ""} found — tap to view full recipe</p>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  {foodResults.map(food => (
                    <FoodResultCard key={food.id} food={food} onClick={() => openFoodDetail(food)}/>
                  ))}
                </div>
              </>
            )}

            {/* Empty state */}
            {!foodSearchDone && !foodSearchLoad && (
              <div style={{ textAlign:"center", padding:"36px 20px 20px" }}>
                <div style={{ width:64, height:64, borderRadius:"50%", backgroundColor:`${G.forest}0D`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><circle cx="12" cy="12" r="9" stroke={G.forest} strokeWidth="1.8"/><path d="M19 19l6 6" stroke={G.forest} strokeWidth="1.8" strokeLinecap="round"/></svg>
                </div>
                <p style={{ fontFamily:serif, fontSize:16, color:G.text, margin:"0 0 6px", fontWeight:600 }}>Search any food</p>
                <p style={{ fontSize:13, color:G.muted, margin:0, lineHeight:1.7 }}>Search any dish or ingredient — e.g. "chicken pasta", "chocolate cake", "banana bread". Get matching recipes with full ingredients and step-by-step instructions.</p>
              </div>
            )}
          </div>
        )}

        {/* ── SAVED ── */}
        {activeSection === "saved" && savedItems.length > 0 && (
          <div style={{ animation:"sectionIn 0.22s ease", paddingBottom:28 }}>
            <p style={STitleStyle}>Saved</p>
            {Object.entries(savedByType).map(([type, items]) => (
              <div key={type} style={{ marginBottom:18 }}>
                <p style={{ fontSize:11, fontWeight:700, color:G.muted, textTransform:"uppercase", letterSpacing:"0.07em", margin:"0 0 10px" }}>{TYPE_LABELS[type] || type}</p>
                <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                  {items.map(item => {
                    const isExp = !!expandedSaved[item.id];
                    const d = item.data;
                    const hasDetail = d && (
                      (item.type === "day_plan" && Array.isArray(d) && d.length > 0) ||
                      (d.ingredients?.length > 0 || d.steps?.length > 0 || d.method)
                    );
                    return (
                      <div key={item.id} style={{ backgroundColor:G.card, borderRadius:12, border:`1px solid ${G.border}`, overflow:"hidden" }}>
                        <div style={{ display:"flex", alignItems:"center", padding:"11px 14px", gap:10 }}>
                          <div style={{ flex:1, minWidth:0, cursor: hasDetail ? "pointer" : "default" }} onClick={() => hasDetail && setExpandedSaved(p => ({ ...p, [item.id]:!p[item.id] }))}>
                            <p style={{ fontSize:14, fontWeight:600, color:G.text, margin:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{item.label}</p>
                            <p style={{ fontSize:11, color:G.muted, margin:"2px 0 0" }}>{item.date}{hasDetail ? (isExp ? " · collapse" : " · expand") : ""}</p>
                          </div>
                          {hasDetail && (
                            <button onClick={() => setExpandedSaved(p => ({ ...p, [item.id]:!p[item.id] }))} style={{ background:"none", border:"none", cursor:"pointer", padding:2, flexShrink:0 }}>
                              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ transition:"transform 0.25s", transform: isExp ? "rotate(180deg)" : "rotate(0deg)" }}>
                                <path d="M2 5l5 5 5-5" stroke={G.muted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </button>
                          )}
                          <button onClick={() => deleteSavedItem(item.id)} style={{ fontSize:18, color:G.muted, background:"none", border:"none", cursor:"pointer", padding:"2px", lineHeight:1, opacity:0.5, flexShrink:0 }}>×</button>
                        </div>
                        {isExp && hasDetail && (
                          <div style={{ padding:"0 14px 14px", borderTop:`1px solid ${G.border}` }}>
                            {item.type === "day_plan" && Array.isArray(d) ? (
                              d.map((meal, mi) => (
                                <div key={mi} style={{ marginTop:14 }}>
                                  <p style={{ fontFamily:serif, fontSize:14, fontWeight:600, color:G.text, margin:"0 0 8px" }}>{meal.emoji} {meal.name}</p>
                                  {(meal.ingredients||[]).length > 0 && (
                                    <div style={{ marginBottom:10 }}>
                                      <p style={{ fontSize:10, fontWeight:700, color:G.muted, textTransform:"uppercase", letterSpacing:"0.05em", margin:"0 0 6px" }}>Ingredients</p>
                                      {(meal.ingredients||[]).map((ing, i) => {
                                        const nm = typeof ing === "string" ? ing : ing.item;
                                        const am = typeof ing === "string" ? "" : ing.amount;
                                        return (
                                          <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"4px 0", borderBottom: i < meal.ingredients.length-1 ? `1px solid ${G.border}` : "none" }}>
                                            <span style={{ fontSize:12, color:G.text }}>{nm}</span>
                                            {am && <span style={{ fontSize:12, color:G.muted, flexShrink:0, marginLeft:8 }}>{am}</span>}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              ))
                            ) : (
                              <>
                                {(d.ingredients||[]).length > 0 && (
                                  <div style={{ marginTop:12, marginBottom:12 }}>
                                    <p style={{ fontSize:10, fontWeight:700, color:G.muted, textTransform:"uppercase", letterSpacing:"0.05em", margin:"0 0 8px" }}>Ingredients</p>
                                    {(d.ingredients||[]).map((ing, i) => {
                                      const nm = typeof ing === "string" ? ing : ing.item;
                                      const am = typeof ing === "string" ? "" : ing.amount;
                                      return (
                                        <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"5px 0", borderBottom: i < d.ingredients.length-1 ? `1px solid ${G.border}` : "none" }}>
                                          <span style={{ fontSize:13, color:G.text }}>{nm}</span>
                                          {am && <span style={{ fontSize:12, color:G.muted, flexShrink:0, marginLeft:8 }}>{am}</span>}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                                {(d.steps||[]).length > 0 && (
                                  <div style={{ marginTop: d.ingredients?.length ? 0 : 12 }}>
                                    <p style={{ fontSize:10, fontWeight:700, color:G.muted, textTransform:"uppercase", letterSpacing:"0.05em", margin:"0 0 8px" }}>Instructions</p>
                                    {d.steps.map((step, i) => (
                                      <div key={i} style={{ display:"flex", gap:10, marginBottom:8 }}>
                                        <span style={{ fontSize:11, fontWeight:700, color:G.gold, minWidth:16, flexShrink:0 }}>{i+1}.</span>
                                        <p style={{ fontSize:13, color:G.text, lineHeight:1.6, margin:0 }}>{step}</p>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {d.method && !(d.steps?.length) && (
                                  <div style={{ marginTop:12, padding:"10px", backgroundColor:`${G.forest}0A`, borderRadius:8 }}>
                                    <p style={{ fontSize:13, color:G.text, lineHeight:1.55, margin:0 }}>{d.method}</p>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
