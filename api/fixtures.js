// pages/api/fixtures.js
import fetch from "isomorphic-unfetch";
import { LEAGUES } from "../../lib/leagues";

const BASE_URL = "https://api.football-data.org/v4";
const API_KEY = process.env.FOOTBALL_API_KEY; // put this in Vercel env

async function fetchMatches(leagueId, dateStr) {
  const url = `${BASE_URL}/competitions/${leagueId}/matches?dateFrom=${dateStr}&dateTo=${dateStr}`;
  try {
    const r = await fetch(url, { headers: { "X-Auth-Token": API_KEY } });
    if (!r.ok) {
      // return empty on non-OK (rate-limit / no data)
      return [];
    }
    const j = await r.json();
    return j?.matches || [];
  } catch (e) {
    console.error("fetchMatches error:", e);
    return [];
  }
}

function fallbackFixture(leagueName, idSuffix, dateStr) {
  return {
    id: `FALLBACK-${leagueName}-${idSuffix}`,
    home: `${leagueName} Home`,
    away: `${leagueName} Away`,
    kickoff: `${dateStr}T18:00:00Z`,
    competition: leagueName,
    badge: leagueName.toLowerCase().includes("premier") ? "/leagues/premier.png" : "/leagues/laliga.png"
  };
}

export default async function handler(req, res) {
  if (!API_KEY) {
    return res.status(500).json({ error: "Missing FOOTBALL_API_KEY in environment" });
  }

  // calculate today and tomorrow in UTC date strings (yyyy-mm-dd)
  const offset = parseInt(process.env.TZ_OFFSET_HOURS || "1", 10);
  const now = new Date(Date.now() + offset * 3600 * 1000);
  const todayStr = now.toISOString().slice(0, 10);
  const tomorrow = new Date(now.getTime() + 24 * 3600 * 1000);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);

  try {
    const results = { today: [], tomorrow: [] };

    for (const league of [LEAGUES.PREMIER, LEAGUES.LALIGA]) {
      const [todayMatches, tomorrowMatches] = await Promise.all([
        fetchMatches(league.id, todayStr),
        fetchMatches(league.id, tomorrowStr)
      ]);

      // map real matches
      if ((todayMatches || []).length > 0) {
        const mapped = todayMatches.map(m => ({
          id: String(m.id),
          home: m.homeTeam?.name || "Home",
          away: m.awayTeam?.name || "Away",
          kickoff: m.utcDate,
          competition: m.competition?.name || league.name,
          badge: league.badge
        }));
        results.today.push(...mapped);
      }

      if ((tomorrowMatches || []).length > 0) {
        const mapped = tomorrowMatches.map(m => ({
          id: String(m.id),
          home: m.homeTeam?.name || "Home",
          away: m.awayTeam?.name || "Away",
          kickoff: m.utcDate,
          competition: m.competition?.name || league.name,
          badge: league.badge
        }));
        results.tomorrow.push(...mapped);
      }

      // fallback per-league if empty
      if ((todayMatches || []).length === 0) {
        results.today.push(fallbackFixture(league.name, "1", todayStr));
      }
      if ((tomorrowMatches || []).length === 0) {
        results.tomorrow.push(fallbackFixture(league.name, "1", tomorrowStr));
      }
    }

    return res.json(results);
  } catch (e) {
    console.error("fixtures handler error:", e);
    return res.status(500).json({ error: "Failed to fetch fixtures" });
  }
}