import fetch from "isomorphic-unfetch";

export default async function handler(req, res) {
  // simple cookie check (demo)
  const auth = req.headers.cookie && req.headers.cookie.includes("tunzy_auth=1");
  if (!auth) return res.status(401).json({error:"unauthenticated"});

  const provider = process.env.FOOTBALL_API_PROVIDER || "apifootball";
  const key = process.env.FOOTBALL_API_KEY;
  if (!key) return res.status(500).json({error:"missing api key"});

  // compute today and tomorrow in Africa/Lagos (UTC+1)
  const offset = parseInt(process.env.TZ_OFFSET_HOURS || "1", 10);
  const now = new Date(Date.now() + offset*3600*1000);
  const todayStr = now.toISOString().slice(0,10);
  const tomorrow = new Date(now.getTime() + 24*3600*1000);
  const tomorrowStr = tomorrow.toISOString().slice(0,10);

  try {
    // Example request to API-Football / RapidAPI style
    const url = `https://v3.football.api-sports.io/fixtures?date=${todayStr}`;
    const url2 = `https://v3.football.api-sports.io/fixtures?date=${tomorrowStr}`;
    const headers = { "x-rapidapi-key": key, "x-rapidapi-host":"v3.football.api-sports.io" };
    const [r1, r2] = await Promise.all([fetch(url,{headers}), fetch(url2,{headers})]);
    const j1 = await r1.json();
    const j2 = await r2.json();

    const parse = (j) => (j.response || []).map(f => ({
      id: String(f.fixture.id),
      home: f.teams.home.name,
      away: f.teams.away.name,
      kickoff: f.fixture.date,
      competition: f.league.name,
      league_id: f.league.id
    }));

    const fixtures = [...parse(j1), ...parse(j2)].filter(f => {
      // limit to Premier League (ENG) and LaLiga (ESP) by league name/ID optionally
      const league = (f.competition || "").toLowerCase();
      return league.includes("premier") || league.includes("la liga") || league.includes("la liga") || league.includes("laliga") || league.includes("la liga santander");
    });

    return res.json(fixtures);
  } catch (e) {
    console.error(e);
    return res.status(500).json({error:"failed to fetch fixtures"});
  }
}
