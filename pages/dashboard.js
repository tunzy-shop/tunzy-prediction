import { useEffect, useState } from "react";
import Router from "next/router";

function MatchCard({ m, prediction }) {
  return (
    <div style={{
      border: "1px solid #ddd",
      padding: 12,
      borderRadius: 8,
      marginBottom: 12,
      background: "#fff",
      display: "flex",
      gap: 10
    }}>
      <img src={m.badge} style={{ width: 40, height: 40 }} />
      <div>
        <div><strong>{m.home} vs {m.away}</strong></div>
        <div style={{ fontSize: 13 }}>{m.competition}</div>
        <div style={{ fontSize: 12 }}>Kickoff: {m.kickoff}</div>

        {prediction ? (
          <div style={{ marginTop: 8 }}>
            <div><b>BTTS:</b> {prediction.btts}</div>
            <div><b>O/U:</b> {prediction.ou}</div>
            <div><b>Double Chance:</b> {prediction.double}</div>
            <div><b>Correct Score:</b> {prediction.correct}</div>
          </div>
        ) : (
          <div style={{ marginTop: 8 }}>Loading prediction...</div>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [today, setToday] = useState([]);
  const [tomorrow, setTomorrow] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/fixtures");
      if (res.status === 401) return Router.push("/");
      const data = await res.json();
      setToday(data.today);
      setTomorrow(data.tomorrow);
      setLoading(false);
    }
    load();
  }, []);

  async function generatePredictions() {
    const all = [...today, ...tomorrow];
    const res = await fetch("/api/predict", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ fixtures: all })
    });
    const data = await res.json();

    const map = {};
    data.forEach(d => map[d.id] = d.prediction);

    setToday(t => t.map(x => ({ ...x, prediction: map[x.id] })));
    setTomorrow(t => t.map(x => ({ ...x, prediction: map[x.id] })));
  }

  return (
    <div style={{ padding: 20, background: "#f4f6f8", minHeight: "100vh" }}>
      <h1>Tunzy Prediction</h1>

      {loading ? (
        <p>Loading fixtures...</p>
      ) : (
        <>
          <button onClick={generatePredictions}>Generate Predictions</button>

          <h2 style={{ marginTop: 20 }}>Today's Games</h2>
          {today.length === 0 && <p>No matches.</p>}
          {today.map(m => <MatchCard key={m.id} m={m} prediction={m.prediction} />)}

          <h2 style={{ marginTop: 30 }}>Tomorrow's Games</h2>
          {tomorrow.length === 0 && <p>No matches.</p>}
          {tomorrow.map(m => <MatchCard key={m.id} m={m} prediction={m.prediction} />)}
        </>
      )}
    </div>
  );
}
