// Default Next.js body limit (1mb) is too small for photo-analysis requests (Ask Nora, plate
// photo). The client already resizes images before upload, but this raises the ceiling as a
// second layer, so an unresized or unusually large request still gets a real answer from
// Anthropic instead of tripping Next.js's own body-size rejection.
export const config = { api: { bodyParser: { sizeLimit: "8mb" } } };

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY is not configured" });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("Anthropic API error:", response.status, JSON.stringify(data));
    }
    return res.status(response.status).json(data);
  } catch (err) {
    console.error("Proxy fetch error:", err);
    return res.status(500).json({ error: "Failed to reach Anthropic API" });
  }
}
