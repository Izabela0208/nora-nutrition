import { serif } from "./noraTokens";

// Shown while the app boots (auth check, profile fetch) — replaces the blank
// ivory flash with an on-brand moment. Disappears automatically once
// NutritionApp finishes loading (authLoading/profileLoading both false).
export default function LoadingScreen() {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, backgroundColor: "#1F2E26", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      <div className="nora-loading-glow" style={{ position: "absolute", width: "60vmax", height: "60vmax", maxWidth: 560, maxHeight: 560, borderRadius: "50%", background: "radial-gradient(circle, rgba(244,242,237,0.20) 0%, rgba(244,242,237,0) 68%)", pointerEvents: "none" }}/>
      <p className="nora-loading-wordmark" style={{ position: "relative", fontFamily: serif, fontStyle: "italic", fontWeight: 500, fontSize: "clamp(40px, 11vw, 68px)", color: "#F4F2ED", margin: 0, letterSpacing: "0.01em", lineHeight: 1 }}>nora</p>
      <style>{`
        @keyframes noraLoadingFogClear {
          0%   { filter: blur(7px); opacity: 0.32; }
          50%  { filter: blur(0px); opacity: 1; }
          100% { filter: blur(7px); opacity: 0.32; }
        }
        @keyframes noraLoadingFogGlow {
          0%   { opacity: 0.22; transform: scale(0.88); }
          50%  { opacity: 0.55; transform: scale(1.08); }
          100% { opacity: 0.22; transform: scale(0.88); }
        }
        .nora-loading-wordmark { animation: noraLoadingFogClear 2.3s ease-in-out infinite; }
        .nora-loading-glow     { animation: noraLoadingFogGlow 2.3s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .nora-loading-wordmark { animation: none; filter: none; opacity: 1; }
          .nora-loading-glow     { animation: none; opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
