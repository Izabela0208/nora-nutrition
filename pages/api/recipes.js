export default async function handler(req, res) {
  const apiKey = process.env.SPOONACULAR_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "SPOONACULAR_API_KEY not configured" });

  const { id, detail, query, type, diet, number, offset, mealplan, timeFrame, targetCalories, exclude, bulk, ids, cuisine } = req.query;

  let url;

  if (mealplan === "true") {
    // /mealplanner/generate — returns a full day or week plan in one call
    const params = new URLSearchParams({ apiKey, timeFrame: timeFrame || "day" });
    if (targetCalories) params.append("targetCalories", targetCalories);
    if (diet)           params.append("diet", diet);
    if (exclude)        params.append("exclude", exclude);
    if (cuisine)        params.append("cuisine", cuisine);
    url = `https://api.spoonacular.com/mealplanner/generate?${params}`;
  } else if (bulk === "true" && ids) {
    // /recipes/informationBulk — fetches full details for multiple IDs at once
    const params = new URLSearchParams({ apiKey, ids, includeNutrition: "true" });
    url = `https://api.spoonacular.com/recipes/informationBulk?${params}`;
  } else if (detail === "true" && id) {
    url = `https://api.spoonacular.com/recipes/${id}/information?includeNutrition=true&apiKey=${apiKey}`;
  } else {
    // complexSearch — kept as fallback for smoothie/shot ingredient lookups
    const params = new URLSearchParams({
      apiKey,
      number: number || "3",
      addRecipeInformation: "true",
      addRecipeNutrition: "true",
      instructionsRequired: "true",
      fillIngredients: "true",
    });
    if (query)   params.append("query", query);
    if (type)    params.append("type", type);
    if (diet)    params.append("diet", diet);
    if (offset)  params.append("offset", offset);
    if (cuisine) params.append("cuisine", cuisine);
    url = `https://api.spoonacular.com/recipes/complexSearch?${params}`;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: text });
    }
    const data = await response.json();
    // Meal plan generation must never be cached — each request needs a fresh plan
    if (mealplan === "true") {
      res.setHeader("Cache-Control", "no-store, no-cache");
    } else {
      res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    }
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
