export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY is not configured" });
  }

  const { title, steps, ingredients, ingredientLines } = req.body || {};
  if (!title) {
    return res.status(400).json({ error: "Missing title" });
  }

  // Two mutually-exclusive ingredient formats, depending on the caller:
  // - "ingredients" ({item, amount} pairs) — Today's Plan / 7-Day Plan, where the item name is
  //   also used for shopping-list matching, so name and quantity are translated as separate fields.
  // - "ingredientLines" (single natural-language strings, e.g. "2 cups flour, sifted") — Search
  //   Foods, which has no shopping-list matching and wants the full descriptive line translated
  //   as one sentence (same treatment as a step), preserving prep notes the {item,amount} split loses.
  const wantsLines = Array.isArray(ingredientLines);
  const ingredientSchema = wantsLines
    ? `"ingredientLines":["string", ...]`
    : `"ingredients":[{"item":"string","amount":"string"},...]`;
  const ingredientRule = wantsLines
    ? `Ingredient lines: translate each full line as one natural sentence, exactly like a step — keep all descriptive/prep detail (e.g. "sifted", "diced", "room temperature"), don't reduce it to just a name and quantity.`
    : `Ingredient quantities: convert US/imperial measurements to metric, the way a Romanian recipe would actually state them.`;

  // Sonnet, not Haiku: empirically, Haiku kept producing real errors even with this same
  // strengthened prompt (invented words, wrong culinary terms, occasional other-language slips) —
  // Sonnet was clean across a 5-recipe test. Cost is acceptable since each recipe is translated
  // once and cached in recipe_translations for every future viewer.
  const sys = `You are a professional culinary translator. Translate this recipe's title, ingredient list and preparation steps from English into natural, fluent Romanian — written as if a native Romanian speaker had authored it directly, not translated word-for-word.

Rules:
- Always use correct Romanian diacritics (ă, â, î, ș, ț) in every word that needs them — never omit them.
- Translate the FULL meaning of every sentence — do not skip, shorten or leave any part in English, unless it's a globally recognized loanword with no natural Romanian equivalent (e.g. "cheddar", "wok").
- Use accurate, standard Romanian culinary vocabulary. Watch for false friends: "noodles" is "tăiței" or "paste", never "noduri"; "bell pepper" is "ardei gras" (or "gogoșar"), never "paprika"/"paprica" (that's the spice); "toothpick" is "scobitoare", never "cărucior"; "sour cream" is "smântână", never invented terms.
- Use natural Romanian sentence structure and word order, not a literal mirror of the English structure.
- Use a consistent imperative/infinitive register for instructions throughout, as a native Romanian recipe would.
- ${ingredientRule} The critical distinction is liquid vs. solid — a "cup" (or tablespoon/teaspoon) of a POURABLE LIQUID (water, milk, oil, stock, cream, wine, vinegar, coconut milk) converts to millilitres (1 cup ≈ 240ml). A "cup" of ANYTHING ELSE — flour, sugar, butter, grated cheese, rice, chopped/diced vegetables or fruit (including things like diced tomato, olives, croutons, berries, nuts), or any solid/chunky ingredient — converts to GRAMS, never ml, using standard culinary density approximations for that specific ingredient (e.g. 1 cup flour ≈ 120g, 1 cup sugar ≈ 200g, 1 cup butter ≈ 227g, 1 cup grated cheese ≈ 110g, 1 cup diced tomato ≈ 150g, 1 cup olives ≈ 135g, 1 cup croutons ≈ 40g). If you're unsure whether an ingredient is liquid or solid, treat it as solid → grams. Teaspoons and tablespoons of anything stay as spoon units, translated to "linguriță" and "lingură" — do not convert these to ml or g. Pounds convert to grams or kilograms (1 lb ≈ 450g), ounces to grams (1 oz ≈ 28g), Fahrenheit to Celsius, inches to cm. Round to sensible, natural cooking quantities (e.g. "240 g", not "241.3 g"). If a quantity is already metric, unitless or a simple count (e.g. "2 eggs", "a pinch", "1 clove"), keep it as-is, translated.
- Return ONLY valid JSON: {"title":"string",${ingredientSchema},"steps":["string",...]}. Keep the same number of ingredients and the same number of steps, in the same order as given. No exclamation marks.`;

  const user = `Title: ${title}\nIngredients: ${JSON.stringify((wantsLines ? ingredientLines : ingredients) || [])}\nSteps: ${JSON.stringify(steps || [])}`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 2000,
        system: sys,
        messages: [{ role: "user", content: user }],
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      console.error("Anthropic API error:", response.status, JSON.stringify(data));
      return res.status(response.status).json({ error: "Anthropic API error" });
    }
    const text = data.content?.map(b => b.text || "").join("").trim() || "";
    const clean = text.replace(/```json\s*/gi, "").replace(/```/g, "").trim();
    let parsed = null;
    try { parsed = JSON.parse(clean); } catch {
      const m = clean.match(/\{[\s\S]*\}/);
      if (m) { try { parsed = JSON.parse(m[0]); } catch {} }
    }
    if (!parsed || !parsed.title) {
      return res.status(502).json({ error: "Translation parse failed" });
    }
    return res.status(200).json({
      title: parsed.title,
      steps: Array.isArray(parsed.steps) ? parsed.steps : [],
      ingredients: Array.isArray(parsed.ingredients) ? parsed.ingredients : [],
      ingredientLines: Array.isArray(parsed.ingredientLines) ? parsed.ingredientLines : [],
    });
  } catch (err) {
    console.error("translate-recipe error:", err);
    return res.status(500).json({ error: "Failed to reach Anthropic API" });
  }
}
