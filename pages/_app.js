import { useState, useEffect, useRef } from "react";
import "../styles/globals.css";

const AUTH_KEY = "nora_auth_ok";
const GREEN  = "#2D4A3E";
const GOLD   = "#C9A96E";
const IVORY  = "#F5F0E8";
const MUTED  = "#7A8C86";
const BORDER = "#E2DAD0";
const SERIF  = "Georgia, 'Times New Roman', serif";
const SANS   = "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

function PasswordGate({ onAuth }) {
  const [value,   setValue]   = useState("");
  const [error,   setError]   = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const submit = async () => {
    if (!value.trim() || loading) return;
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: value }),
      });
      if (res.ok) {
        onAuth();
      } else {
        setError(true);
        setValue("");
        inputRef.current?.focus();
      }
    } catch {
      setError(true);
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: IVORY, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", fontFamily: SANS }}>
      <div style={{ width: "100%", maxWidth: 360 }}>

        {/* Monogram */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", backgroundColor: GREEN, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 20, boxShadow: "0 4px 24px rgba(45,74,62,0.18)" }}>
            <span style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 700, color: IVORY, lineHeight: 1, letterSpacing: "-0.02em" }}>N</span>
          </div>
          <p style={{ fontFamily: SERIF, fontSize: 26, fontWeight: 700, color: GREEN, margin: "0 0 6px", letterSpacing: "-0.02em", lineHeight: 1 }}>Nora</p>
          <p style={{ fontSize: 12, color: MUTED, margin: 0, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 500 }}>Private Access</p>
        </div>

        {/* Card */}
        <div style={{ backgroundColor: "#FDFAF7", borderRadius: 20, border: `1px solid ${BORDER}`, padding: "32px 28px", boxShadow: "0 2px 40px rgba(45,74,62,0.07)" }}>
          <p style={{ fontSize: 13, color: MUTED, margin: "0 0 20px", lineHeight: 1.6, textAlign: "center" }}>
            Enter your access password to continue.
          </p>

          <input
            ref={inputRef}
            type="password"
            value={value}
            onChange={e => { setValue(e.target.value); setError(false); }}
            onKeyDown={e => e.key === "Enter" && submit()}
            placeholder="Password"
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "13px 16px",
              fontSize: 15,
              fontFamily: SANS,
              color: GREEN,
              backgroundColor: IVORY,
              border: `1.5px solid ${error ? "#C0392B" : value ? GOLD : BORDER}`,
              borderRadius: 12,
              outline: "none",
              marginBottom: error ? 10 : 16,
              transition: "border-color 0.15s",
              letterSpacing: "0.06em",
            }}
          />

          {error && (
            <p style={{ fontSize: 12, color: "#C0392B", margin: "0 0 14px", textAlign: "center", fontWeight: 500 }}>
              Incorrect password. Please try again.
            </p>
          )}

          <button
            onClick={submit}
            disabled={!value.trim() || loading}
            style={{
              width: "100%",
              padding: "14px",
              backgroundColor: !value.trim() || loading ? "#C8D5D1" : GREEN,
              color: IVORY,
              border: "none",
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 600,
              fontFamily: SANS,
              cursor: !value.trim() || loading ? "default" : "pointer",
              letterSpacing: "0.04em",
              transition: "background-color 0.15s",
            }}
          >
            {loading ? "Verifying…" : "Enter"}
          </button>
        </div>

        {/* Footer rule */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "28px 0 0" }}>
          <div style={{ flex: 1, height: 1, backgroundColor: BORDER }}/>
          <span style={{ fontSize: 10, color: MUTED, letterSpacing: "0.1em", textTransform: "uppercase", flexShrink: 0 }}>Nora Nutrition</span>
          <div style={{ flex: 1, height: 1, backgroundColor: BORDER }}/>
        </div>
      </div>
    </div>
  );
}

export default function App({ Component, pageProps }) {
  const [authed, setAuthed] = useState(null);

  useEffect(() => {
    const ok = localStorage.getItem(AUTH_KEY);
    setAuthed(ok === "1");
  }, []);

  if (authed === null) {
    // Avoid flash — show ivory blank while checking storage
    return <div style={{ minHeight: "100vh", backgroundColor: "#F5F0E8" }}/>;
  }

  if (!authed) {
    return (
      <PasswordGate onAuth={() => {
        localStorage.setItem(AUTH_KEY, "1");
        setAuthed(true);
      }}/>
    );
  }

  return <Component {...pageProps}/>;
}
