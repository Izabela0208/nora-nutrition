import { C, card, serif, sans } from "./noraTokens";
import { ChevronIcon, LeafDecor } from "./NoraIcons";

export const ProgressRing = ({ value, max, color, label, unit, size = 86 }) => {
  const pct = Math.min((value / max) * 100, 100);
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-1">
      <div style={{ width: size, height: size }} className="relative">
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.track} strokeWidth="7"/>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="7"
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.7s cubic-bezier(0.4,0,0.2,1)" }}/>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span style={{ fontSize: 13, lineHeight: 1, color: C.text, fontWeight:600 }}>{Math.round(value)}</span>
          <span style={{ fontSize: 10, color: C.muted, marginTop: 1 }}>{unit}</span>
        </div>
      </div>
      <span style={{ fontSize: 11, color: C.muted, fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: 10, color: C.muted, opacity: 0.6 }}>/{Math.round(max)}</span>
    </div>
  );
};

export const BarProgress = ({ value, max, color, label, unit }) => {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="flex items-center gap-3">
      <span style={{ fontSize: 11, color: C.muted, width: 36, textAlign: "right", fontWeight: 500 }}>{label}</span>
      <div style={{ flex: 1, height: 5, backgroundColor: C.track, borderRadius: 10, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, backgroundColor: color, height: "100%", borderRadius: 10, transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)" }}/>
      </div>
      <span style={{ fontSize: 11, color: C.muted, width: 72 }}>{Math.round(value)}/{max} {unit}</span>
    </div>
  );
};

export const Skeleton = ({ className, style: extraStyle }) => (
  <div className={`animate-pulse rounded-xl ${className||""}`} style={{ backgroundColor: C.track, ...extraStyle }}/>
);

export const Divider = () => (
  <div style={{ height: 1, backgroundColor: C.border, margin: "4px 0" }}/>
);

export const SectionCard = ({ children, style: extraStyle }) => (
  <div style={{ ...card, ...extraStyle }}>{children}</div>
);

export const SectionHeader = ({ title, sub, open, onToggle, noBorder, accent }) => (
  <button
    onClick={onToggle}
    style={{
      width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between",
      padding:"15px 18px", background:"none", border:"none", cursor:"pointer", textAlign:"left",
      borderBottom: (!noBorder && open) ? `1px solid ${C.border}` : "none",
    }}
  >
    <div>
      {accent && <div style={{ width:20, height:2, backgroundColor:C.gold, borderRadius:2, marginBottom:6 }}/>}
      <p style={{ fontFamily:serif, fontSize:16, fontWeight:600, color:C.text, margin:0, lineHeight:1.2 }}>{title}</p>
      {sub && <p style={{ fontSize:11, color:C.muted, margin:"3px 0 0", fontFamily:sans }}>{sub}</p>}
    </div>
    <ChevronIcon open={open} size={16}/>
  </button>
);

export const Collapsible = ({ open, children }) => (
  <div style={{
    maxHeight: open ? 9000 : 0,
    overflow:"hidden",
    transition:"max-height 0.38s cubic-bezier(0.4,0,0.2,1), opacity 0.28s ease",
    opacity: open ? 1 : 0,
  }}>
    {children}
  </div>
);

export const PageHeader = ({ title, sub, icon }) => (
  <div style={{ backgroundColor:C.green, padding:"22px 20px 18px" }}>
    <div style={{ display:"flex", alignItems:"center", gap:icon?10:0, marginBottom:sub?3:0 }}>
      {icon}
      <h2 style={{ fontFamily:serif, fontSize:22, color:C.bg, fontWeight:600, margin:0 }}>{title}</h2>
    </div>
    {sub && <p style={{ fontSize:12, color:"rgba(245,240,232,0.6)", margin:0 }}>{sub}</p>}
  </div>
);

export const TabSectionHead = ({ title, sub }) => (
  <div style={{ marginBottom:18 }}>
    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
      <LeafDecor size={18}/>
      <h2 style={{ fontFamily:serif, fontSize:22, color:C.green, fontWeight:600, margin:0 }}>{title}</h2>
    </div>
    {sub && <p style={{ color:C.muted, fontSize:13, marginTop:4, marginLeft:26 }}>{sub}</p>}
  </div>
);

export const GoldTag = ({ children }) => (
  <span style={{ fontSize:11, color:C.gold, fontWeight:600, backgroundColor:C.goldLight, padding:"4px 10px", borderRadius:20, border:`1px solid ${C.gold}40` }}>
    {children}
  </span>
);

export const GreenTag = ({ children }) => (
  <span style={{ fontSize:11, color:C.sage, fontWeight:600, backgroundColor:C.greenLight, padding:"4px 10px", borderRadius:20, border:`1px solid ${C.sage}40` }}>
    {children}
  </span>
);

export const Btn = ({ onClick, disabled, children, variant="green", fullWidth, style:extra }) => {
  const bg = disabled ? "#C8D5D1" : variant==="green" ? C.green : variant==="gold" ? "transparent" : variant==="outline" ? "transparent" : C.green;
  const col = disabled ? C.bg : variant==="gold" ? C.gold : variant==="outline" ? C.gold : C.bg;
  const bdr = variant==="outline" ? `1px solid ${C.gold}` : variant==="gold" ? `1px solid ${C.gold}` : "none";
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: fullWidth ? "100%" : "auto",
      padding:"12px 18px", backgroundColor:bg, color:col, border:bdr,
      borderRadius:10, fontSize:13, fontWeight:500, cursor:disabled?"not-allowed":"pointer",
      letterSpacing:"0.02em", transition:"background-color 0.15s",
      display:"flex", alignItems:"center", justifyContent:"center", gap:7,
      minHeight:44, fontFamily:sans, ...extra
    }}>
      {children}
    </button>
  );
};
