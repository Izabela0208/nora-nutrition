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

  const { score, daysElapsed, foodDays, waterDays, challengeDays, suppDays, suppTotal, streak, ouraNote, cyclePhaseLabel, language } = req.body || {};
  if (score === undefined || !daysElapsed) {
    return res.status(400).json({ error: "Missing score/daysElapsed" });
  }

  const voiceGuide = loadVoiceGuide();
  const langName = LANGUAGE_NAMES[language] || "English";
  const langLine = language && language !== "en"
    ? `\nCRITICAL: Write entirely in ${langName}. Do not use English unless a word has absolutely no translation.`
    : "";

  const sys = `${voiceGuide}

---

You write Nora's weekly "Longevity Score" reflection for a wellness app — a short, warm read of how someone's week went so far. Follow the voice guide above in spirit — do not reuse or lightly reword its example lines; write new, natural phrasing each time.

Rules specific to this reflection:
- 2–4 sentences. Read the week as a whole pattern, not a checklist — don't just restate the numbers back as a list.
- Reference at least one concrete, real detail from what's given (e.g. the streak, hydration, or wearable trend if present) so it reads as specific to this week, not generic.
- No alarmism, no guilt, no fraction-used-as-a-scoreboard framing, even on a low or incomplete week — a quiet week is information, not a verdict.
- Close on something forward-looking or simply observational — never a demand to "keep it up" or a streak-loss warning.
- If a cycle phase is mentioned, use it only as gentle context if it genuinely adds something — never as an excuse or a diagnosis.
- Return ONLY the reflection text — no quotes, no heading, no preamble.${langLine}`;

  const user = `Longevity Score so far this week: ${score}/100 (based on ${daysElapsed} day${daysElapsed === 1 ? "" : "s"} elapsed).
Consistency streak: ${streak ?? 0} day${(streak ?? 0) === 1 ? "" : "s"}.
Meals logged inside eating window: ${foodDays}/${daysElapsed} days.
Hydration target met: ${waterDays}/${daysElapsed} days.
Daily challenge completed: ${challengeDays}/${daysElapsed} days.
${suppTotal > 0 ? `Supplements taken (all ${suppTotal} tracked): ${suppDays}/${daysElapsed} days.` : "No supplements tracked this week."}
${ouraNote || "No wearable connected this week."}
${cyclePhaseLabel ? `Currently in the ${cyclePhaseLabel} phase.` : ""}`;

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
        max_tokens: 300,
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
    return res.status(200).json({ text });
  } catch (err) {
    console.error("weekly-report error:", err);
    return res.status(500).json({ error: "Failed to reach Anthropic API" });
  }
}
