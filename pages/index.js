// pages/index.js
import { useEffect, useState } from "react";

export default function Home() {
  const [today, setToday] = useState([]);
  const [tomorrow, setTomorrow] = useState([]);
  const [loading, setLoading] = useState(true);
  const [predLoading, setPredLoading] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const r = await fetch("/api/fixtures");
      const j = await r.json();
      setToday(j.today || []);
      setTomorrow(j.tomorrow || []);
      setLoading(false);
    }
    load();
  }, []);

  async function generatePredictions() {
    setPredLoading(true);
    const all = [...today, ...tomorrow];
    // send to API
    const r = await fetch("/api/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fixtures: all })
    });
    const j = await r.json();
    // map results
    const map = {};
    (j || []).forEach(it => { map[it.id] = it.prediction; });

    setToday(t => t.map(x => ({ ...x, prediction: map[x.id] })));
    setTomorrow(t => t.map(x => ({ ...x, prediction: map[x.id] })));
    setPredLoading(false);
  }

  const buttonStyle = {
    background: "#0A1A2F",
    color: "#fff",
    padding: "12px 18px",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 700,
    marginRight: 12
  };

  return (
    <div style={{
      minHeight: "100vh",
      backgroundImage: "url('/background.jpg')",
      backgroundSize: "cover",
      backgroundPosition: "center",
      padding: 24,
      color: "#fff",
      backdropFilter: "saturate(0.9) blur(2px)"
    }}>
      <div style={{ maxWidth: 980, margin: "0 auto", background: "rgba(6,10,18,0.6)", padding: 20, borderRadius: 12 }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1 style={{ margin: 0 }}>Tunzy Prediction</h1>
          <div>
            <a href="https://whatsapp.com/channel/0029VbBOxtK4CrfpT5BHl531" target="_blank" rel="noreferrer">
              <button style={buttonStyle}>Join Channel</button>
            </a>
            <a href="tel:+2349067345425">
              <button style={{ ...buttonStyle, background: "#112537" }}>+2349067345425</button>
            </a>
          </div>
        </header>

        <main style={{ marginTop: 18 }}>
          <p style={{ opacity: 0.9 }}>Shows Premier League & LaLiga matches for today and tomorrow. Click <b>Generate Predictions</b> to use ChatGPT for BTTS / O/U / Double Chance / Correct Score.</p>

          <div style={{ marginTop: 12 }}>
            <button onClick={generatePredictions} disabled={predLoading} style={buttonStyle}>
              {predLoading ? "Generating..." : "Generate Predictions"}
            </button>
          </div>

          {loading ? <p style={{ marginTop: 18 }}>Loading fixtures...</p> : (
            <>
              <section style={{ marginTop: 20 }}>
                <h2>Today's Games</h2>
                {today.length === 0 && <p>No matches found.</p>}
                {today.map(m => (
                  <MatchCard key={m.id} match={m} />
                ))}
              </section>

              <section style={{ marginTop: 28 }}>
                <h2>Tomorrow's Games</h2>
                {tomorrow.length === 0 && <p>No matches found.</p>}
                {tomorrow.map(m => (
                  <MatchCard key={m.id} match={m} />
                ))}
              </section>
            </>
          )}
        </main>

        <footer style={{ marginTop: 22, fontSize: 13, color: "#d0d7df" }}>
          <div>Powered by football-data.org + ChatGPT</div>
        </footer>
      </div>
    </div>
  );
}

function MatchCard({ match }) {
  const pred = match.prediction || null;

  return (
    <div style={{
      display: "flex",
      gap: 12,
      alignItems: "center",
      background: "rgba(255,255,255,0.04)",
      padding: 12,
      borderRadius: 8,
      marginTop: 12
    }}>
      <img src={match.badge} alt="league" style={{ width: 46, height: 46, objectFit: "contain", borderRadius: 6 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700 }}>{match.home} <span style={{ opacity: 0.7 }}>v</span> {match.away}</div>
        <div style={{ fontSize: 13, opacity: 0.85 }}>{match.competition} • {new Date(match.kickoff).toLocaleString()}</div>

        {pred ? (
          <div style={{ marginTop: 8, fontSize: 13 }}>
            <div><b>BTTS:</b> {pred.btts}</div>
            <div><b>O/U:</b> {pred.ou}</div>
            <div><b>Double Chance:</b> {pred.double}</div>
            <div><b>Correct Score:</b> {pred.correct}</div>
          </div>
        ) : (
          <div style={{ marginTop: 8, opacity: 0.9 }}>No prediction yet</div>
        )}
      </div>
    </div>
  );
}