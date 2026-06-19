import { useState } from "react";
import { sans, serif } from "../noraTokens";
import { CheckIcon } from "../NoraIcons";

const G = {
  forest:    "#1B3A2D",
  ivory:     "#FAF7F2",
  gold:      "#C9A84C",
  goldLight: "#FBF5E6",
  amber:     "#9A7020",
  muted:     "#8C9E97",
  border:    "#DDD7CC",
  text:      "#1C2B26",
  card:      "#FFFFFF",
};

const CAT_COLORS = {
  "No-Bake":         "#7A9E8A",
  "Frozen":          "#5B8DD9",
  "Baked":           "#C9A84C",
  "Mousse & Pudding":"#C8847A",
  "Energy Balls":    "#2D5A45",
  "Fruit-Based":     "#9A7020",
};

const MacroChip = ({ label, value, unit }) => (
  <span style={{ fontSize:11, color:G.muted, backgroundColor:`${G.muted}12`, borderRadius:5, padding:"2px 6px", display:"inline-flex", alignItems:"center", gap:2 }}>
    <b style={{ color:G.text, fontWeight:600 }}>{value}</b>{unit} {label}
  </span>
);

export default function DessertCard({ dessert, isSaved, onToggleSave, ingChecked, onIngToggle }) {
  const [isOpen, setIsOpen] = useState(false);
  const catColor = CAT_COLORS[dessert.category] || G.forest;

  return (
    <div style={{ backgroundColor:G.card, borderRadius:16, border:`1px solid ${G.border}`, overflow:"hidden", boxShadow:"0 1px 5px rgba(27,58,45,0.05)" }}>
      <div style={{ height:2.5, backgroundColor:catColor }}/>
      <div style={{ display:"flex", alignItems:"stretch" }}>
        <button
          type="button"
          onClick={() => setIsOpen(o => !o)}
          style={{ flex:1, padding:"13px 0 13px 14px", display:"flex", alignItems:"flex-start", gap:10, background:"none", border:"none", cursor:"pointer", textAlign:"left", minWidth:0 }}
        >
          <span style={{ fontSize:22, flexShrink:0, lineHeight:1.3 }}>{dessert.emoji}</span>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ fontFamily:serif, fontSize:15, fontWeight:600, color:G.text, margin:"0 0 2px", lineHeight:1.3 }}>{dessert.name}</p>
            <p style={{ fontSize:11, color:G.muted, margin:"0 0 5px" }}>{dessert.category} · {dessert.prep_time} min · {dessert.servings} servings</p>
            <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
              <MacroChip label="kcal" value={dessert.kcal} unit=""/>
              <MacroChip label="P" value={dessert.macros.protein_g} unit="g"/>
              <MacroChip label="C" value={dessert.macros.carbs_g} unit="g"/>
              <MacroChip label="F" value={dessert.macros.fat_g} unit="g"/>
            </div>
          </div>
        </button>

        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"0 14px", gap:10, flexShrink:0 }}>
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onToggleSave(); }}
            style={{ background:"none", border:"none", cursor:"pointer", padding:4 }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill={isSaved ? G.gold : "none"} stroke={isSaved ? G.gold : G.muted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 2h12a1 1 0 0 1 1 1v14l-7-3.5L2 17V3a1 1 0 0 1 1-1z"/>
            </svg>
          </button>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ transition:"transform 0.25s", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", pointerEvents:"none" }}>
            <path d="M2 5l5 5 5-5" stroke={G.muted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {isOpen && (
        <div style={{ borderTop:`1px solid ${G.border}`, padding:"16px 16px 18px" }}>
          <p style={{ fontSize:11, fontWeight:700, color:G.muted, textTransform:"uppercase", letterSpacing:"0.07em", margin:"0 0 10px" }}>
            Ingredients <span style={{ fontWeight:400, textTransform:"none", letterSpacing:0 }}>({dessert.servings} servings)</span>
          </p>
          <div style={{ marginBottom:14 }}>
            {(dessert.ingredients || []).map((ing, i) => {
              const k = `${dessert.id}_${i}`;
              const ck = !!(ingChecked[k]);
              return (
                <div
                  key={i}
                  onClick={() => onIngToggle(k)}
                  style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", cursor:"pointer", borderBottom: i < dessert.ingredients.length-1 ? `1px solid ${G.border}` : "none", opacity: ck ? 0.4 : 1 }}
                >
                  <div style={{ width:17, height:17, borderRadius:4, border:`1.5px solid ${ck ? catColor : G.border}`, backgroundColor: ck ? catColor : "transparent", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    {ck && <CheckIcon size={10} color={G.ivory}/>}
                  </div>
                  <span style={{ fontSize:13, color:G.text, flex:1, textDecoration: ck ? "line-through" : "none" }}>{ing.item}</span>
                  <span style={{ fontSize:12, color:G.muted, flexShrink:0 }}>{ing.amount_display}</span>
                </div>
              );
            })}
          </div>

          {(dessert.steps || []).length > 0 && (
            <div style={{ marginBottom:14 }}>
              <p style={{ fontSize:11, fontWeight:700, color:G.muted, textTransform:"uppercase", letterSpacing:"0.07em", margin:"0 0 10px" }}>Instructions</p>
              {dessert.steps.map((step, i) => (
                <div key={i} style={{ display:"flex", gap:11, marginBottom:10 }}>
                  <div style={{ width:22, height:22, borderRadius:"50%", flexShrink:0, backgroundColor:catColor, color:G.ivory, fontSize:11, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center" }}>{i+1}</div>
                  <p style={{ fontSize:13, color:G.text, lineHeight:1.6, margin:0, paddingTop:2 }}>{step}</p>
                </div>
              ))}
            </div>
          )}

          {(dessert.benefits || []).length > 0 && (
            <div style={{ marginBottom: dessert.tip ? 14 : 0 }}>
              <p style={{ fontSize:11, fontWeight:700, color:G.muted, textTransform:"uppercase", letterSpacing:"0.07em", margin:"0 0 8px" }}>Benefits</p>
              {dessert.benefits.map((b, i) => (
                <div key={i} style={{ display:"flex", gap:8, marginBottom:5 }}>
                  <span style={{ color:G.gold, flexShrink:0, fontSize:16, marginTop:-2 }}>·</span>
                  <p style={{ fontSize:13, color:G.text, lineHeight:1.55, margin:0 }}>{b}</p>
                </div>
              ))}
            </div>
          )}

          {dessert.tip && (
            <div style={{ padding:"10px 14px", backgroundColor:G.goldLight, borderLeft:`3px solid ${G.gold}`, borderRadius:"0 9px 9px 0", marginTop: dessert.benefits?.length ? 12 : 0 }}>
              <p style={{ fontSize:12, color:G.amber, margin:0, lineHeight:1.6 }}>💡 {dessert.tip}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
