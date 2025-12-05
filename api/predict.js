// pages/api/predict.js
import fetch from "isomorphic-unfetch";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.warn("OPENAI_API_KEY not set - predictions won't work until you set it.");
}

async function callOpenAIForMatch(match) {
  // Craft a compact prompt that asks for a JSON object only
  const prompt = `You are a concise football prediction assistant.
Match: ${match.home} vs ${match.away}
Competition: ${match.competition}
Kickoff: ${match.kickoff}

Return a JSON object only (no other text) with fields:
- btts: "yes" or "no" with one short reason
- ou: "over 2.5" or "under 2.5" with one short reason
- double: one of "1X", "X2", "12" with one short reason
- correct: predicted correct score like "2-1" with one short reason

Example:
{"btts":"yes - both teams score often", "ou":"over 2.5 - attacking teams", "double":"1X - home stronger", "correct":"2-1 - home edge"}

Now produce the JSON for this match.`;

  const body = {
    model: "gpt-4o-mini", // change if not available on your account
    messages: [{ role: "user", content: prompt }],
    max_tokens: 200,
    temperature: 0.3
  };

  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify(body)
  });

  if (!r.ok) {
    const txt = await r.text();
    return { error: `openai error: ${txt}` };
  }

  const j = await r.json();
  const content = j.choices?.[0]?.message?.content || "";

  // try parse JSON snippet
  try {
    const parsed = JSON.parse(content);
    return parsed;
  } catch (e) {
    // Attempt to extract first JSON-looking substring
    const m = content.match(/\{[\s\S]*\}/);
    if (m) {
      try {
        return JSON.parse(m[0]);
      } catch (e2) {
        return { raw: content };
      }
    }
    return { raw: content };
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Only POST allowed" });

  const { fixtures } = req.body || {};
  if (!fixtures || !Array.isArray(fixtures)) return res.status(400).json({ error: "Invalid fixtures array" });

  if (!OPENAI_API_KEY) return res.status(500).json({ error: "Missing OPENAI_API_KEY in environment" });

  // limit to avoid high cost
  const limit = Math.min(fixtures.length, 12);
  const toProcess = fixtures.slice(0, limit);

  const results = [];
  // sequential to be kinder to rate limits (can change to parallel if desired)
  for (const f of toProcess) {
    const pred = await callOpenAIForMatch(f);
    results.push({ id: f.id, prediction: pred });
  }

  return res.json(results);
}