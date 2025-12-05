import fetch from "isomorphic-unfetch";

export default async function handler(req, res) {
  const auth = req.headers.cookie && req.headers.cookie.includes("tunzy_auth=1");
  if (!auth) return res.status(401).json({ error: "unauthenticated" });

  const API_KEY = process.env.FOOTBALL_API_KEY;
  if (!API_KEY) return res.status(500).json({ error: "missing football-data.org API key" });

  const offset = parseInt(process.env.TZ_OFFSET_HOURS || "1", 10);
  const now = new Date(Date.now() + offset * 3600 * 1000);
  const todayStr = now.toISOString().slice(0, 10);
  const tomorrow = new Date(now.getTime() + 24 * 3600 * 1000);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);

  const leagues = [
    { code: "PL", name: "Premier League", badge: "/leagues/premier.png" },
    { code: "PD", name: "La Liga", badge: "/leagues/laliga.png" }
  ];

  async function fetchMatches(leagueCode, dateStr) {
    const url = `https://api.football-data.org/v4/competitions/${leagueCode}/matches?dateFrom=${dateStr}&dateTo=${dateStr}`;
    const r = await fetch(url, { headers: { "X-Auth-Token": API_KEY } });

    if (!r.ok) return [];
    const j = await r.json();
    return j.matches || [];
  }

  const parse = (m, badge) => ({
    id: String(m.id),
    home: m.homeTeam?.name || "Home",
    away: m.awayTeam?.name || "Away",
    kickoff: m.utcDate,
    competition: m.competition?.name || "",
    badge
  });

  let todayFixtures = [];
  let tomorrowFixtures = [];

  try {
    for (const L of leagues) {
      const [fx1, fx2] = await Promise.all([
        fetchMatches(L.code, todayStr),
        fetchMatches(L.code, tomorrowStr)
      ]);

      // Add matches if available
      todayFixtures.push(...fx1.map(m => parse(m, L.badge)));
      tomorrowFixtures.push(...fx2.map(m => parse(m, L.badge)));
    }

    // ---- FALLBACK FIXTURES ----
    if (todayFixtures.length === 0) {
      todayFixtures = [
        {
          id: "FALLBACK1",
          home: "Barcelona",
          away: "Real Betis",
          kickoff: todayStr + "T18:00:00Z",
          competition: "La Liga",
          badge: "/leagues/laliga.png"
        },
        {
          id: "FALLBACK2",
          home: "Chelsea",
          away: "Everton",
          kickoff: todayStr + "T20:00:00Z",
          competition: "Premier League",
          badge: "/leagues/premier.png"
        }
      ];
    }

    if (tomorrowFixtures.length === 0) {
      tomorrowFixtures = [
        {
          id: "FALLBACK3",
          home: "Atlético Madrid",
          away: "Granada",
          kickoff: tomorrowStr + "T18:00:00Z",
          competition: "La Liga",
          badge: "/leagues/laliga.png"
        },
        {
          id: "FALLBACK4",
          home: "Liverpool",
          away: "West Ham",
          kickoff: tomorrowStr + "T20:00:00Z",
          competition: "Premier League",
          badge: "/leagues/premier.png"
        }
      ];
    }

    return res.json({
      today: todayFixtures,
      tomorrow: tomorrowFixtures
    });

  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "failed to fetch fixtures" });
  }
}
