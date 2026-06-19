import { C } from "./noraTokens";

export const NoraAvatar = ({ size = 36 }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <circle cx="20" cy="20" r="20" fill={C.green}/>
    <path d="M20 8 C20 8 14 14 14 20 C14 26 17 30 20 32 C23 30 26 26 26 20 C26 14 20 8 20 8Z" fill={C.gold} opacity="0.85"/>
    <line x1="20" y1="10" x2="20" y2="31" stroke={C.card} strokeWidth="0.7" strokeLinecap="round" opacity="0.45"/>
    <path d="M15.5 18 Q20 16 24.5 18" stroke={C.card} strokeWidth="0.7" strokeLinecap="round" fill="none" opacity="0.4"/>
    <path d="M15 23 Q20 21 25 23" stroke={C.card} strokeWidth="0.7" strokeLinecap="round" fill="none" opacity="0.35"/>
  </svg>
);

export const LeafDecor = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <path d="M10 18C10 18 4 13 4 8a6 6 0 0 1 12 0c0 5-6 10-6 10Z" fill={C.gold} opacity="0.35"/>
    <line x1="10" y1="18" x2="10" y2="6" stroke={C.gold} strokeWidth="0.8" strokeLinecap="round" opacity="0.3"/>
    <path d="M7.5 12 Q10 10.5 12.5 12" stroke={C.gold} strokeWidth="0.7" strokeLinecap="round" fill="none" opacity="0.35"/>
    <path d="M8 9 Q10 7.5 12 9" stroke={C.gold} strokeWidth="0.7" strokeLinecap="round" fill="none" opacity="0.28"/>
  </svg>
);

export const BotanicalBranch = ({ width = 120, opacity = 0.18, flip = false }) => (
  <svg width={width} height={Math.round(width*0.55)} viewBox="0 0 120 66" fill="none"
    style={{ opacity, transform: flip ? "scaleX(-1)" : "none" }}>
    <path d="M4 60 C20 50 50 38 80 28 C100 20 110 12 116 6" stroke={C.gold} strokeWidth="1.3" strokeLinecap="round"/>
    <path d="M30 52 C30 52 22 38 26 26 C30 14 38 14 38 24 C38 34 33 46 30 52" stroke={C.gold} strokeWidth="0.9" fill={C.gold} fillOpacity="0.2" strokeLinecap="round"/>
    <path d="M60 38 C60 38 52 24 56 12 C60 0 68 0 68 10 C68 20 63 32 60 38" stroke={C.gold} strokeWidth="0.9" fill={C.gold} fillOpacity="0.18" strokeLinecap="round"/>
    <path d="M85 26 C85 26 80 14 85 5 C90 -4 97 -1 95 9 C93 19 88 22 85 26" stroke={C.gold} strokeWidth="0.9" fill={C.gold} fillOpacity="0.15" strokeLinecap="round"/>
    <path d="M30 52 C35 46 42 42 50 40" stroke={C.gold} strokeWidth="0.7" strokeLinecap="round" opacity="0.5"/>
    <path d="M60 38 C65 32 72 28 80 26" stroke={C.gold} strokeWidth="0.7" strokeLinecap="round" opacity="0.5"/>
  </svg>
);

export const ChevronIcon = ({ open, size = 16, color }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ transition:"transform 0.25s ease", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>
    <path d="M3 6l5 5 5-5" stroke={color || C.muted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const FlameIcon = ({ size = 14, color = C.gold }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <path d="M8 14C8 14 3 10 3 6.5c0-2.5 2-4.5 4-4.5-1 1.5-0.5 3 1 4 0-1.5 1-3 2-4 0 2.5 2 4 2 6C12 10 10 14 8 14Z" stroke={color} strokeWidth="1.2" strokeLinejoin="round" fill="none"/>
  </svg>
);

export const DropIcon = ({ size = 14, color = C.slate }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <path d="M8 2 C8 2 3 7 3 10.5a5 5 0 0 0 10 0C13 7 8 2 8 2Z" stroke={color} strokeWidth="1.2" strokeLinejoin="round" fill="none"/>
  </svg>
);

export const RunIcon = ({ size = 14, color = C.sage }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <circle cx="11" cy="3" r="1.5" stroke={color} strokeWidth="1.1"/>
    <path d="M9 5.5 L7 8 L4 9 M9 5.5 L10 8.5 L8.5 11 M7 8 L9.5 9.5" stroke={color} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const ForkIcon = ({ size = 14, color = C.muted }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <path d="M5 2v4a3 3 0 0 0 3 3v5" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M11 2v12" stroke={color} strokeWidth="1.2" strokeLinecap="round"/>
    <path d="M3.5 2v3M6.5 2v3" stroke={color} strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
);

export const CameraIcon = ({ size = 14, color = C.muted }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <rect x="1" y="5" width="14" height="9" rx="1.5" stroke={color} strokeWidth="1.2"/>
    <circle cx="8" cy="9.5" r="2.4" stroke={color} strokeWidth="1.2"/>
    <path d="M5.5 5l1-2h3l1 2" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const BarcodeIcon = ({ size = 14, color = C.muted }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <path d="M1 4V2h2M13 4V2h2M1 12v2h2M13 12v2h2" stroke={color} strokeWidth="1.2" strokeLinecap="round"/>
    <path d="M4 5v6M6.5 5v6M8 5v6M10 5v6M12 5v6" stroke={color} strokeWidth="1" strokeLinecap="round"/>
  </svg>
);

export const SparkleIcon = ({ size = 14, color = C.bg }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <path d="M8 2l1.3 3.7L13 8l-3.7 1.3L8 14l-1.3-3.7L3 8l3.7-1.3L8 2Z" stroke={color} strokeWidth="1.2" strokeLinejoin="round"/>
  </svg>
);

export const MoonIcon = ({ size = 14, color = C.bg }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <path d="M13.5 9A6 6 0 1 1 7 2.5a4.5 4.5 0 0 0 6.5 6.5Z" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const ChartLineIcon = ({ size = 14, color = C.bg }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <polyline points="1,13 5,8 8,11 11,5 15,3" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const PlusIcon = ({ size = 13, color = C.bg }) => (
  <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
    <path d="M6 1v10M1 6h10" stroke={color} strokeWidth="1.6" strokeLinecap="round"/>
  </svg>
);

export const CheckIcon = ({ size = 13, color = C.bg }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
    <path d="M2 7l4 4 6-6" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const SunIcon = ({ size = 14, color = C.gold }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="3" stroke={color} strokeWidth="1.2"/>
    <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.3 3.3l1.4 1.4M11.3 11.3l1.4 1.4M3.3 12.7l1.4-1.4M11.3 4.7l1.4-1.4" stroke={color} strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
);

export const LanguageIcon = ({ size = 14, color = C.muted }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="6.5" stroke={color} strokeWidth="1.2"/>
    <path d="M8 1.5C8 1.5 6 4 6 8s2 6.5 2 6.5M8 1.5C8 1.5 10 4 10 8s-2 6.5-2 6.5M1.5 8h13" stroke={color} strokeWidth="1" strokeLinecap="round"/>
  </svg>
);

export const EditIcon = ({ size = 13, color = C.muted }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
    <path d="M9.5 2.5l2 2-7 7H2.5v-2l7-7Z" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const HeartIcon = ({ size = 16, color = C.muted, filled = false }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill={filled ? color : "none"}>
    <path d="M8 13.5C8 13.5 2 9.5 2 5.5a3.5 3.5 0 0 1 6-2.45A3.5 3.5 0 0 1 14 5.5C14 9.5 8 13.5 8 13.5Z" stroke={color} strokeWidth="1.3" strokeLinejoin="round"/>
  </svg>
);

// Tab navigation icons
export const TabIcon = ({ id, active }) => {
  const color = active ? C.green : C.muted;
  const w = 1.4;
  if (id === "myday") return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="3.5" stroke={color} strokeWidth={w}/>
      <path d="M10 2v2.5M10 15.5V18M2 10h2.5M15.5 10H18M4.4 4.4l1.77 1.77M12.83 12.83l1.77 1.77M4.4 15.6l1.77-1.77M12.83 7.17l1.77-1.77" stroke={color} strokeWidth={w} strokeLinecap="round"/>
    </svg>
  );
  if (id === "nourish") return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M6 2v5a4 4 0 0 0 4 4v7" stroke={color} strokeWidth={w} strokeLinecap="round"/>
      <path d="M14 2v16" stroke={color} strokeWidth={w} strokeLinecap="round"/>
      <path d="M11.5 2c0 2-1 4-3.5 4S4.5 4 4.5 2" stroke={color} strokeWidth={w} strokeLinecap="round"/>
    </svg>
  );
  if (id === "journey") return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <polyline points="2,16 6,10 10,13 14,7 18,4" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
  if (id === "boost") return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M10 18C10 18 3 12 3 7a7 7 0 0 1 14 0c0 5-7 11-7 11Z" stroke={color} strokeWidth={w} strokeLinejoin="round" fill="none"/>
      <line x1="10" y1="18" x2="10" y2="5" stroke={color} strokeWidth={w * 0.7} strokeLinecap="round" opacity="0.6"/>
    </svg>
  );
  if (id === "chat") return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M3 3h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H6.5L3 17V4a1 1 0 0 1 1-1Z" stroke={color} strokeWidth={w} strokeLinejoin="round"/>
      <path d="M7 8h6M7 11h4" stroke={color} strokeWidth={w} strokeLinecap="round"/>
    </svg>
  );
  if (id === "me") return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="7" r="3" stroke={color} strokeWidth={w}/>
      <path d="M3.5 18c0-3.59 2.91-6.5 6.5-6.5s6.5 2.91 6.5 6.5" stroke={color} strokeWidth={w} strokeLinecap="round"/>
    </svg>
  );
  if (id === "eat") return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M6 2v5a4 4 0 0 0 4 4v7" stroke={color} strokeWidth={w} strokeLinecap="round"/>
      <path d="M14 2v16" stroke={color} strokeWidth={w} strokeLinecap="round"/>
      <path d="M11.5 2c0 2-1 4-3.5 4S4.5 4 4.5 2" stroke={color} strokeWidth={w} strokeLinecap="round"/>
    </svg>
  );
  if (id === "thrive") return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M10 16.5C10 16.5 3 12 3 7.5a4.5 4.5 0 0 1 7-3.72A4.5 4.5 0 0 1 17 7.5C17 12 10 16.5 10 16.5Z" stroke={color} strokeWidth={w} strokeLinejoin="round" fill="none"/>
    </svg>
  );
  if (id === "ritual") return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M10 17C10 17 4 13 4 8.5a4.5 4.5 0 0 1 6-4.24A4.5 4.5 0 0 1 16 8.5C16 13 10 17 10 17Z" stroke={color} strokeWidth={w} strokeLinejoin="round"/>
      <path d="M10 6v6M7.5 9.5Q10 8 12.5 9.5" stroke={color} strokeWidth={w * 0.7} strokeLinecap="round" opacity="0.7"/>
    </svg>
  );
  if (id === "asknora") return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M3 3h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H6.5L3 17V4a1 1 0 0 1 1-1Z" stroke={color} strokeWidth={w} strokeLinejoin="round"/>
      <path d="M7 8h6M7 11h4" stroke={color} strokeWidth={w} strokeLinecap="round"/>
    </svg>
  );
  return null;
};
