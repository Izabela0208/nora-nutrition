import fs from "fs";
import path from "path";

let voiceGuideCache = null;
function loadVoiceGuide() {
  if (voiceGuideCache) return voiceGuideCache;
  voiceGuideCache = fs.readFileSync(path.join(process.cwd(), "lib", "nora-voice.md"), "utf8");
  return voiceGuideCache;
}

const LANGUAGE_NAMES = { en: "English", ro: "Romanian" };

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY is not configured" });
  }

  const { meal, todayMeals, goal, cyclePhase, language } = req.body || {};
  if (!meal?.name) {
    return res.status(400).json({ error: "Missing meal" });
  }

  const voiceGuide = loadVoiceGuide();
  const otherMeals = (todayMeals || [])
    .filter(m => m.name && m.name !== meal.name)
    .map(m => `${m.name} (${Math.round(m.calories || 0)} kcal)`)
    .join(", ") || "none yet";

  const langName = LANGUAGE_NAMES[language] || "English";
  const langLine = language && language !== "en"
    ? `\nCRITICAL: Write entirely in ${langName}. Do not use English unless a word has absolutely no translation.`
    : "";

  const sys = `${voiceGuide}

---

You write Nora's one-sentence reaction after a user logs a meal. Follow the voice guide above in spirit — do not reuse or lightly reword its example lines. Write ONE new sentence, natural and specific to this meal and its context. No exclamation marks (this is a routine moment, not a rare milestone). Return ONLY the sentence, no quotes, no preamble.${langLine}`;

  const user = `Meal just logged: ${meal.name} — ${Math.round(meal.calories || 0)} kcal, ${Math.round(meal.protein_g || 0)}g protein, ${Math.round(meal.carbs_g || 0)}g carbs, ${Math.round(meal.fat_g || 0)}g fat.
Other meals logged today: ${otherMeals}.
${goal ? `User's goal: ${goal}.` : ""}
${cyclePhase ? `Cycle phase: ${cyclePhase.label}, day ${cyclePhase.day}.` : ""}`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 100,
        system: sys,
        messages: [{ role: "user", content: user }],
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      console.error("Anthropic API error:", response.status, JSON.stringify(data));
      return res.status(response.status).json({ error: "Anthropic API error" });
    }
    const comment = data.content?.map(b => b.text || "").join("").trim() || "";
    return res.status(200).json({ comment });
  } catch (err) {
    console.error("meal-comment error:", err);
    return res.status(500).json({ error: "Failed to reach Anthropic API" });
  }
}
