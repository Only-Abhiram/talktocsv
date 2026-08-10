// src/BackendGate.jsx
import { useEffect, useState } from "react";
import App from "./App.jsx";

const API_BASE = import.meta.env.VITE_API_URL+"api" || "/api";

export default function BackendGate() {
  const [status, setStatus] = useState("waking"); // waking | ready | error
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function pingHealth() {
      try {
        const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(8000) });
        if (res.ok) {
          if (!cancelled) setStatus("ready");
          return;
        }
        throw new Error(`Status ${res.status}`);
      } catch {
        if (cancelled) return;
        setAttempt((a) => a + 1);
        setTimeout(pingHealth, 3000);
      }
    }

    pingHealth();
    return () => { cancelled = true; };
  }, []);

  if (status === "ready") return <App />;

  return (
    <div className="gate">
      <div className="gate-spinner" />
      <h2 className="gate-title">
        {attempt === 0 ? "Waking up the server" : "Still warming up"}
      </h2>
      <p className="gate-subtext muted">
      Please hold... 🫡
      </p>
    </div>
  );
}