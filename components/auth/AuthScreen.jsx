import { useState, useEffect } from "react";
import Image from "next/image";
import { supabase } from "../../lib/supabase";
import { C, serif, sans, inp } from "../noraTokens";

export default function AuthScreen() {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [isNarrow, setIsNarrow] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    setIsNarrow(mq.matches);
    const handler = (e) => setIsNarrow(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

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
    <div style={{ position: "relative", minHeight: "100vh", overflow: "hidden", fontFamily: sans, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <Image
        src={isNarrow ? "/images/atmosphere/fog-1-portrait.jpg" : "/images/atmosphere/fog-1.jpg"}
        alt=""
        fill
        priority
        unoptimized
        sizes="100vw"
        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: isNarrow ? "50% 30%" : "50% 75%", zIndex: 0, filter: "contrast(1.12)" }}
      />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(20,30,25,0.52) 0%, rgba(20,30,25,0.38) 35%, rgba(20,30,25,0.30) 100%)", zIndex: 1 }} />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 45% at 50% 58%, rgba(244,242,237,0.08) 0%, rgba(244,242,237,0) 70%)", zIndex: 1, pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 2, width: "100%", maxWidth: 400, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <h1 style={{ fontFamily: serif, fontSize: 46, fontWeight: 600, color: C.ivory, letterSpacing: "0.02em", margin: "0 0 8px", lineHeight: 1, textShadow: "0 2px 10px rgba(10,16,13,0.75), 0 1px 3px rgba(10,16,13,0.9)" }}>nora</h1>
        <p style={{ fontFamily: sans, fontSize: 11, color: C.ivory, opacity: 0.9, letterSpacing: "0.07em", margin: "0 0 40px", textAlign: "center", textShadow: "0 2px 8px rgba(10,16,13,0.75), 0 1px 3px rgba(10,16,13,0.9)" }}>
          a quieter way to take care
        </p>

        <div style={{ width: "100%", boxSizing: "border-box", backgroundColor: "rgba(255,240,205,0.28)", backdropFilter: "blur(36px)", WebkitBackdropFilter: "blur(36px)", border: "1px solid rgba(255,246,222,0.4)", borderRadius: 20, boxShadow: "0 8px 40px rgba(13,20,16,0.3)", padding: "32px 28px 28px", textAlign: "center" }}>
          <p style={{ color: C.text, fontSize: 13, lineHeight: 1.6, margin: "0 0 24px" }}>
            {isRegister ? "Create your account to begin." : "Welcome back."}
          </p>

          <form onSubmit={handleSubmit} style={{ textAlign: "left" }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", color: C.text, marginBottom: 6 }}>
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

            <label style={{ display: "block", fontSize: 11, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", color: C.text, marginBottom: 6 }}>
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
                backgroundColor: "#1F2E26",
                color: "#F4F2ED",
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
            style={{ marginTop: 20, background: "none", border: "none", color: C.green, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: sans, textDecoration: "underline", textUnderlineOffset: 3 }}
          >
            {isRegister ? "Already have an account? Log in" : "New here? Create an account"}
          </button>
        </div>
      </div>
    </div>
  );
}
