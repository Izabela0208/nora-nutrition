import { serif } from "./noraTokens";

// Shown while the app boots (auth check, profile fetch) — replaces the blank
// ivory flash with an on-brand moment. Disappears automatically once
// NutritionApp finishes loading (authLoading/profileLoading both false).
export default function LoadingScreen() {
  return (
    <div className="nora-loading-screen">
      <div className="nora-loading-glow"/>
      <p className="nora-loading-wordmark" style={{ position: "relative", fontFamily: serif, fontStyle: "italic", fontWeight: 500, fontSize: "clamp(22px, 6vw, 32px)", color: "#F4F2ED", margin: 0, letterSpacing: "0.01em", lineHeight: 1 }}>just a breath</p>
      <style>{`
        .nora-loading-screen {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100vh;   /* fallback for browsers without dvh */
          height: 100dvh;  /* real visible viewport on mobile — accounts for the address bar showing/hiding */
          z-index: 9999;
          background-color: #1F2E26;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .nora-loading-glow {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 60vmax;
          height: 60vmax;
          max-width: 560px;
          max-height: 560px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(244,242,237,0.20) 0%, rgba(244,242,237,0) 68%);
          pointer-events: none;
        }
        @keyframes noraLoadingFogClear {
          0%   { filter: blur(7px); opacity: 0.32; }
          50%  { filter: blur(0px); opacity: 1; }
          100% { filter: blur(7px); opacity: 0.32; }
        }
        @keyframes noraLoadingFogGlow {
          0%   { opacity: 0.22; transform: translate(-50%, -50%) scale(0.88); }
          50%  { opacity: 0.55; transform: translate(-50%, -50%) scale(1.08); }
          100% { opacity: 0.22; transform: translate(-50%, -50%) scale(0.88); }
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
