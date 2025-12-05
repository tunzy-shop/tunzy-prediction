import { useState } from "react";
import { useRouter } from "next/router";

export default function Login() {
  const router = useRouter();
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    const res = await fetch("/api/login", {
      method: "POST",
      headers: {"content-type":"application/json"},
      body: JSON.stringify({user, pass})
    });
    if (res.ok) {
      router.push("/dashboard");
    } else {
      setErr("Invalid credentials");
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundImage: "url('/background.jpeg')",
      backgroundSize: "cover"
    }}>
      <form onSubmit={handleLogin} style={{background:"rgba(0,0,0,0.6)", padding:24, borderRadius:8, color:"#fff"}}>
        <h2>Tunzy Prediction — Login</h2>
        {err && <div style={{color:"salmon"}}>{err}</div>}
        <div>
          <label>Username</label><br/>
          <input value={user} onChange={e=>setUser(e.target.value)} />
        </div>
        <div>
          <label>Password</label><br/>
          <input type="password" value={pass} onChange={e=>setPass(e.target.value)} />
        </div>
        <button style={{marginTop:10}}>Log in</button>
        <p style={{fontSize:12}}>Demo creds: tunzy / tunzyprediction</p>
      </form>
    </div>
  );
        }
