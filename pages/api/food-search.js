const USDA_KEY = process.env.USDA_API_KEY || "DEMO_KEY";

function getNutrient(nutrients, id) {
  const n = nutrients.find(x => x.nutrientId === id || x.nutrient?.id === id);
  return n ? Math.round(((n.value ?? n.amount) ?? 0) * 10) / 10 : null;
}

function normalizeUSDASearch(food) {
  const nut = food.foodNutrients || [];
  const kcal = getNutrient(nut, 1008);
  const protein = getNutrient(nut, 1003);
  if (kcal === null && protein === null) return null;
  return {
    id: String(food.fdcId),
    name: food.description || "",
    brand: food.brandOwner || food.brandName || null,
    source: "USDA",
    dataType: food.dataType || "",
    per100g: {
      kcal: kcal || 0,
      protein: protein || 0,
      carbs: getNutrient(nut, 1005) || 0,
      fat: getNutrient(nut, 1004) || 0,
      fiber: getNutrient(nut, 1079),
      sugar: getNutrient(nut, 2000),
      sodium: getNutrient(nut, 1093),
    },
  };
}

function normalizeUSDADetail(food) {
  const nut = food.foodNutrients || [];
  return {
    id: String(food.fdcId),
    name: food.description || "",
    brand: food.brandOwner || food.brandName || null,
    source: "USDA",
    image: null,
    ingredients: food.ingredients || null,
    category: food.foodCategory?.description || food.foodCategoryLabel || "",
    per100g: {
      kcal: getNutrient(nut, 1008) || 0,
      protein: getNutrient(nut, 1003) || 0,
      carbs: getNutrient(nut, 1005) || 0,
      fat: getNutrient(nut, 1004) || 0,
      fiber: getNutrient(nut, 1079),
      sugar: getNutrient(nut, 2000),
      sodium: getNutrient(nut, 1093),
      calcium: getNutrient(nut, 1087),
      iron: getNutrient(nut, 1089),
      vitaminC: getNutrient(nut, 1162),
      potassium: getNutrient(nut, 1092),
      vitaminD: getNutrient(nut, 1114),
      vitaminA: getNutrient(nut, 1104),
      zinc: getNutrient(nut, 1095),
      magnesium: getNutrient(nut, 1090),
    },
    allNutrients: nut
      .map(n => ({
        name: n.nutrient?.name || n.nutrientName || "",
        value: n.value ?? n.amount ?? 0,
        unit: n.nutrient?.unitName || n.unitName || "",
      }))
      .filter(n => n.name && n.value > 0)
      .slice(0, 35),
  };
}

async function fetchUSDA(query) {
  const url = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(query)}&api_key=${USDA_KEY}&pageSize=12&dataType=Foundation,SR%20Legacy,Survey%20(FNDDS)`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`USDA ${r.status}`);
  const data = await r.json();
  return (data.foods || []).map(normalizeUSDASearch).filter(Boolean).slice(0, 10);
}

// Barcode-specific USDA lookup: only "Branded" foods carry a gtinUpc, so that's the only
// dataType worth searching. USDA's search only matches gtinUpc on an exact digit-for-digit
// string, so we also try the EAN-13<->UPC-A leading-zero variant before giving up.
async function fetchUSDAByBarcode(code) {
  const digits = code.replace(/\D/g, "");
  const candidates = [digits];
  if (digits.length === 13 && digits.startsWith("0")) candidates.push(digits.slice(1));
  if (digits.length === 12) candidates.push("0" + digits);
  for (const c of candidates) {
    const url = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(c)}&api_key=${USDA_KEY}&pageSize=5&dataType=Branded`;
    const r = await fetch(url);
    if (!r.ok) continue;
    const data = await r.json();
    const match = (data.foods || []).find(f => (f.gtinUpc || "").replace(/\D/g, "") === c);
    if (match) return [normalizeUSDASearch(match)].filter(Boolean);
  }
  return [];
}

async function fetchOpenFoodFacts(query) {
  const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&json=1&page_size=8&fields=code,product_name,brands,nutriments,image_front_url,image_url,ingredients_text`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`OFF ${r.status}`);
  const data = await r.json();
  return (data.products || [])
    .filter(p => p.product_name && p.nutriments?.["energy-kcal_100g"] != null)
    .map(p => ({
      id: `off_${p.code}`,
      name: p.product_name.trim(),
      brand: p.brands?.split(",")[0]?.trim() || null,
      source: "OpenFoodFacts",
      image: p.image_front_url || p.image_url || null,
      ingredients: p.ingredients_text || null,
      per100g: {
        kcal: Math.round(p.nutriments["energy-kcal_100g"] || 0),
        protein: Math.round((p.nutriments["proteins_100g"] || 0) * 10) / 10,
        carbs: Math.round((p.nutriments["carbohydrates_100g"] || 0) * 10) / 10,
        fat: Math.round((p.nutriments["fat_100g"] || 0) * 10) / 10,
        fiber: p.nutriments["fiber_100g"] != null ? Math.round(p.nutriments["fiber_100g"] * 10) / 10 : null,
        sugar: p.nutriments["sugars_100g"] != null ? Math.round(p.nutriments["sugars_100g"] * 10) / 10 : null,
        sodium: p.nutriments["sodium_100g"] != null ? Math.round(p.nutriments["sodium_100g"] * 1000) : null,
      },
    }))
    .slice(0, 8);
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate");

  const { query, fdcId, barcode } = req.query;

  if (fdcId) {
    try {
      const r = await fetch(`https://api.nal.usda.gov/fdc/v1/food/${fdcId}?api_key=${USDA_KEY}`);
      if (!r.ok) throw new Error(`USDA ${r.status}`);
      const data = await r.json();
      return res.json({ detail: normalizeUSDADetail(data) });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // Barcode lookups only ever match USDA's "Branded" dataType (the only one with a gtinUpc) —
  // skip the generic Foundation/SR Legacy/Survey search and Open Food Facts (already tried
  // client-side by the caller) entirely, instead of wasting a round trip on categories that
  // can never match a barcode.
  if (barcode && typeof barcode === "string") {
    try {
      const results = await fetchUSDAByBarcode(barcode);
      return res.json({ results, errors: {} });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  if (!query || typeof query !== "string") {
    return res.status(400).json({ error: "query required" });
  }

  const [usdaResult, offResult] = await Promise.allSettled([
    fetchUSDA(query),
    fetchOpenFoodFacts(query),
  ]);

  const results = [
    ...(usdaResult.status === "fulfilled" ? usdaResult.value : []),
    ...(offResult.status === "fulfilled" ? offResult.value : []),
  ];

  return res.json({ results, errors: { usda: usdaResult.reason?.message, off: offResult.reason?.message } });
}
