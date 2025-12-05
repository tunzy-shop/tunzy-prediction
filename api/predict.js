import fetch from "isomorphic-unfetch";

export default async function handler(req, res) {
  const auth = req.headers.cookie && req.headers.cookie.includes("tunzy_auth=1");
  if (!auth) return res.status(401).json({error:"unauthenticated"});

  if (req.method !== "POST") return res.status(405).end();
  const { fixtures } = req.body;
  if (!fixtures || !Array.isArray(fixtures)) return res.status(400).json({error:"bad request"});

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) return res.status(500).json({error:"missing openai key"});

  // For each fixture, craft a prompt and call OpenAI
  async function predictFor(f) {
    const prompt = `
You are a football prediction assistant. For the match:
Home: ${f.home}
Away: ${f.away}
Competition: ${f.competition}
Kickoff: ${f.kickoff}

Return a JSON object with keys:
- btts: "yes" or "no" (brief justification)
- ou: "over 2.5" or "under 2.5" (brief justification)
- double: one of "1X", "X2", "12" (brief justification)
- correct: suggested correct score (e.g. "2-1") (brief justification)

Respond ONLY with a JSON object like:
{"btts":"yes - ...", "ou":"over 2.5 - ...", "double":"1X - ...", "correct":"2-1 - ..."}
`;

    const body = {
      model: "gpt-4o-mini", // or "gpt-4o" / whichever is available on your account
      messages: [{ role: "user", content: prompt }],
      max_tokens: 250
    };

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type":"application/json",
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
    // Try to parse json from content
    try {
      const parsed = JSON.parse(content);
      return parsed;
    } catch(e) {
      // fallback: return raw
      return { raw: content };
    }
  }

  // run predictions sequentially or in parallel (be mindful of rate limits)
  const results = [];
  for (const f of fixtures) {
    const p = await predictFor(f);
    results.push({ id: f.id, prediction: p });
  }

  res.json(results);
}
