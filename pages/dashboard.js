import { useEffect, useState } from "react";
import Router from "next/router";

function MatchCard({m, prediction}) {
  return (
    <div style={{border:"1px solid #ddd", padding:12, borderRadius:8, marginBottom:8, background:"#fff"}}>
      <div><strong>{m.home} v {m.away}</strong> — {m.kickoff}</div>
      <div style={{fontSize:13}}>Competition: {m.competition}</div>
      {prediction ? (
        <div style={{marginTop:8}}>
          <div><b>BTTS:</b> {prediction.btts}</div>
          <div><b>O/U:</b> {prediction.ou}</div>
          <div><b>Double Chance:</b> {prediction.double}</div>
          <div><b>Correct Score:</b> {prediction.correct}</div>
        </div>
      ) : <div style={{marginTop:8}}>Loading prediction...</div>}
    </div>
  );
}

export default function Dashboard() {
  const [fixtures, setFixtures] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    async function load() {
      // get fixtures for today & tomorrow
      const res = await fetch("/api/fixtures");
      if (res.status === 401) return Router.push("/");
      const data = await res.json();
      setFixtures(data);
      setLoading(false);
    }
    load();
  }, []);

  async function askPreds() {
    // trigger predictions; server will call OpenAI
    const res = await fetch("/api/predict", { method: "POST", headers: {"content-type":"application/json"}, body: JSON.stringify({fixtures})});
    const data = await res.json();
    // data is an array of {id, prediction}
    const map = {};
    data.forEach(d => { map[d.id] = d.prediction });
    setFixtures((f)=>f.map(x => ({...x, prediction: map[x.id]})));
  }

  return (
    <div style={{padding:20, background:"#f4f6f8", minHeight:"100vh"}}>
      <h1>Tunzy Prediction</h1>
      <p>Shows LaLiga & Premier League matches for today and tomorrow.</p>
      {loading ? <p>Loading fixtures...</p> : (
        <>
          <button onClick={askPreds}>Generate predictions (ChatGPT)</button>
          <div style={{marginTop:16}}>
            {fixtures.length === 0 && <div>No fixtures found.</div>}
            {fixtures.map(m => <MatchCard key={m.id} m={m} prediction={m.prediction} />)}
          </div>
        </>
      )}
    </div>
  );
}
