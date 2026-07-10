import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { C, card, serif, sans, inp } from "../noraTokens";
import { NoraAvatar, BotanicalBranch } from "../NoraIcons";

export default function AuthScreen() {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const isRegister = mode === "register";
  const canSubmit = email.trim().length > 0 && password.length >= 6 && (!isRegister || consent) && !loading;

  const switchMode = (next) => {
    setMode(next);
    setError("");
    setInfo("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError("");
    setInfo("");
    try {
      if (isRegister) {
        const { error: signUpError } = await supabase.auth.signUp({ email: email.trim(), password });
        if (signUpError) throw signUpError;
        setInfo("Check your inbox to confirm your email, then log in.");
        setMode("login");
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (signInError) throw signInError;
      }
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: C.bg, fontFamily: sans, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 400, position: "relative" }}>
        <div style={{ position: "absolute", top: -34, right: -8, pointerEvents: "none" }}>
          <BotanicalBranch width={140} opacity={0.12} />
        </div>
        <div style={{ ...card, padding: "36px 28px 32px", textAlign: "center", position: "relative" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <NoraAvatar size={44} />
          </div>
          <h1 style={{ fontFamily: serif, fontSize: 26, color: C.green, margin: "0 0 6px", fontWeight: 600 }}>Nora</h1>
          <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.6, margin: "0 0 28px" }}>
            {isRegister ? "Create your account to begin." : "Welcome back."}
          </p>

          <form onSubmit={handleSubmit} style={{ textAlign: "left" }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", color: C.muted, marginBottom: 6 }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ ...inp, marginBottom: 16 }}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />

            <label style={{ display: "block", fontSize: 11, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", color: C.muted, marginBottom: 6 }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ ...inp, marginBottom: isRegister ? 16 : 20 }}
              placeholder="At least 6 characters"
              autoComplete={isRegister ? "new-password" : "current-password"}
              minLength={6}
              required
            />

            {isRegister && (
              <label style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 20, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  style={{ marginTop: 3, width: 16, height: 16, accentColor: C.green, cursor: "pointer", flexShrink: 0 }}
                />
                <span style={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>
                  I agree to the processing of my data as described in the{" "}
                  <a href="/privacy" target="_blank" rel="noopener noreferrer" style={{ color: C.green, textDecoration: "underline" }}>
                    Privacy Policy
                  </a>
                  , so Nora can personalise my experience.
                </span>
              </label>
            )}

            {error && (
              <div style={{ backgroundColor: C.errorBg, color: C.error, borderRadius: 10, padding: "10px 14px", fontSize: 12, marginBottom: 16, lineHeight: 1.5 }}>
                {error}
              </div>
            )}
            {info && (
              <div style={{ backgroundColor: C.greenLight, color: C.green, borderRadius: 10, padding: "10px 14px", fontSize: 12, marginBottom: 16, lineHeight: 1.5 }}>
                {info}
              </div>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              style={{
                width: "100%",
                backgroundColor: canSubmit ? C.green : C.border,
                color: canSubmit ? C.bg : C.muted,
                border: "none",
                borderRadius: 12,
                padding: "15px",
                fontSize: 15,
                fontWeight: 500,
                cursor: canSubmit ? "pointer" : "not-allowed",
                letterSpacing: "0.03em",
                transition: "all 0.3s ease",
              }}
            >
              {loading ? "Please wait…" : isRegister ? "Create account" : "Log in"}
            </button>
          </form>

          <button
            onClick={() => switchMode(isRegister ? "login" : "register")}
            style={{ marginTop: 20, background: "none", border: "none", color: C.muted, fontSize: 12, cursor: "pointer", fontFamily: sans, textDecoration: "underline", textUnderlineOffset: 3 }}
          >
            {isRegister ? "Already have an account? Log in" : "New here? Create an account"}
          </button>
        </div>
      </div>
    </div>
  );
}
