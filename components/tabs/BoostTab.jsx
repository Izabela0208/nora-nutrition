import { C, card, serif, sans, inp } from "../noraTokens";
import { NoraAvatar, SparkleIcon, CheckIcon, LeafDecor } from "../NoraIcons";
import { Skeleton, SectionHeader, Collapsible } from "../NoraUI";

export default function BoostTab({
  profile,
  userSupps, newSupName, setNewSupName, newSupDose, setNewSupDose,
  addUserSupp, toggleSupp, removeSupp, addRecommendedSupp,
  supRecs, supOverall, supLoad, handleGetSupRecs,
  foodE,
  openSections, toggleSection,
}) {
  const morningRecs = supRecs.filter(r => r.timing === "morning" || r.timing === "any" || !r.timing).slice(0, 2);
  const eveningRecs = supRecs.filter(r => r.timing === "evening").slice(0, 2);
  const allRecs = supRecs.slice(0, 3);

  return (
    <div style={{ padding:"0 0 100px" }}>
      <div style={{ backgroundColor:C.green, padding:"22px 20px 18px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
          <LeafDecor size={18}/>
          <h2 style={{ fontFamily:serif, fontSize:22, color:C.bg, fontWeight:600, margin:0 }}>Boost</h2>
        </div>
        <p style={{ fontSize:12, color:"rgba(245,240,232,0.6)", margin:0 }}>Track your supplements and discover nutritional gaps</p>
      </div>

      <div style={{ padding:"14px 16px 0", display:"flex", flexDirection:"column", gap:12 }}>

        {/* My Daily Supplements */}
        <div style={{ ...card, overflow:"hidden" }}>
          <SectionHeader
            title="My Daily Supplements"
            sub={userSupps.length===0 ? "Add what you take regularly" : `${userSupps.filter(s=>s.taken).length} of ${userSupps.length} taken today`}
            open={openSections.boost_mine}
            onToggle={()=>toggleSection("boost_mine")}
            accent
          />
          <Collapsible open={openSections.boost_mine}>
            <div style={{ padding:"0 16px 16px", display:"flex", flexDirection:"column", gap:10 }}>
              {/* Add form */}
              <div style={{ display:"flex", gap:8 }}>
                <input className="focus-gold" style={{ ...inp, flex:1, fontSize:14 }} placeholder="e.g. Vitamin D" value={newSupName} onChange={e=>setNewSupName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addUserSupp()}/>
                <input className="focus-gold" style={{ ...inp, width:72, fontSize:14 }} placeholder="Dose" value={newSupDose} onChange={e=>setNewSupDose(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addUserSupp()}/>
                <button onClick={addUserSupp} disabled={!newSupName.trim()} style={{ padding:"11px 16px", backgroundColor:newSupName.trim()?C.green:"#C8D5D1", color:C.bg, border:"none", borderRadius:10, fontSize:18, fontWeight:500, cursor:newSupName.trim()?"pointer":"not-allowed", lineHeight:1 }}>+</button>
              </div>

              {userSupps.length === 0 ? (
                <p style={{ fontSize:13, color:C.muted, textAlign:"center", padding:"10px 0 4px", margin:0 }}>Your list is empty — add supplements above or accept Nora's suggestions below.</p>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                  {userSupps.map(s=>(
                    <div key={s.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"11px 12px", borderRadius:10, border:`1px solid ${s.taken?C.sage:C.border}`, backgroundColor:s.taken?C.greenLight:C.card, transition:"all 0.2s ease" }}>
                      <button type="button" onClick={()=>toggleSupp(s.id)} style={{ width:22, height:22, borderRadius:"50%", border:`1.5px solid ${s.taken?C.sage:C.border}`, backgroundColor:s.taken?C.sage:"transparent", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", flexShrink:0, transition:"all 0.2s ease", color:"white", fontSize:11, fontWeight:700 }}>
                        {s.taken && <CheckIcon size={11} color="white"/>}
                      </button>
                      <div style={{ flex:1, minWidth:0 }}>
                        <span style={{ fontSize:13, fontWeight:500, color:s.taken?C.muted:C.text, textDecoration:s.taken?"line-through":"none" }}>{s.name}</span>
                        {s.dose && <span style={{ fontSize:11, color:C.muted, marginLeft:8 }}>{s.dose}</span>}
                      </div>
                      <button onClick={()=>removeSupp(s.id)} style={{ background:"none", border:"none", color:C.border, cursor:"pointer", fontSize:18, lineHeight:1, padding:2, flexShrink:0, transition:"color 0.15s" }}>×</button>
                    </div>
                  ))}
                  {userSupps.every(s=>s.taken) && (
                    <div style={{ textAlign:"center", padding:"8px 0 2px" }}>
                      <span style={{ fontSize:12, color:C.sage, fontWeight:600 }}>All supplements taken today ✓</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Collapsible>
        </div>

        {/* Nora's Suggestions */}
        <div style={{ ...card, overflow:"hidden" }}>
          <div style={{ backgroundColor:C.green, padding:"14px 18px", display:"flex", gap:10, alignItems:"center" }}>
            <NoraAvatar size={28}/>
            <div style={{ flex:1 }}>
              <p style={{ fontSize:13, fontWeight:600, color:C.bg, margin:0 }}>Nora's suggestions</p>
              <p style={{ fontSize:11, color:"rgba(245,240,232,0.65)", margin:"1px 0 0" }}>Personalised to your nutritional gaps</p>
            </div>
          </div>

          <div style={{ padding:16, display:"flex", flexDirection:"column", gap:10 }}>
            {supLoad && (
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                <div style={{ height:56, backgroundColor:C.track, borderRadius:10 }}/>
                <div style={{ height:56, backgroundColor:C.track, borderRadius:10 }}/>
                <div style={{ height:56, backgroundColor:C.track, borderRadius:10 }}/>
              </div>
            )}

            {!supLoad && supOverall && (
              <p style={{ fontSize:13, color:C.text, fontStyle:"italic", lineHeight:1.6, margin:"0 0 4px", padding:"0 2px" }}>{supOverall}</p>
            )}

            {!supLoad && allRecs.length > 0 && (
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {allRecs.map((rec, i) => {
                  const isAdded = userSupps.some(s=>s.name.toLowerCase()===rec.name.toLowerCase());
                  const timingColor = rec.timing==="evening" ? C.slate : C.amber;
                  const timingLabel = rec.timing==="evening" ? "Evening" : rec.timing==="morning" ? "Morning" : "Any time";
                  return (
                    <div key={i} style={{ borderRadius:10, border:`1px solid ${C.border}`, padding:"12px 14px", backgroundColor:C.card }}>
                      <div style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4, flexWrap:"wrap" }}>
                            <span style={{ fontSize:13, fontWeight:600, color:C.text }}>{rec.name}</span>
                            {rec.dose && <span style={{ fontSize:11, color:C.muted }}>{rec.dose}</span>}
                            <span style={{ fontSize:10, color:timingColor, backgroundColor:`${timingColor}18`, padding:"2px 7px", borderRadius:8, fontWeight:600 }}>{timingLabel}</span>
                          </div>
                          <p style={{ fontSize:12, color:C.muted, margin:0, lineHeight:1.5 }}>{rec.reason}</p>
                        </div>
                        <button onClick={()=>{ if (!isAdded) addRecommendedSupp(rec); }} disabled={isAdded} style={{ padding:"5px 10px", borderRadius:8, border:`1px solid ${isAdded?C.sage:C.border}`, backgroundColor:isAdded?C.greenLight:C.card, color:isAdded?C.sage:C.muted, fontSize:11, fontWeight:500, cursor:isAdded?"default":"pointer", flexShrink:0, transition:"all 0.15s", whiteSpace:"nowrap" }}>
                          {isAdded?"Added ✓":"+ Add"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!supLoad && allRecs.length === 0 && !supOverall && (
              <p style={{ fontSize:13, color:C.muted, textAlign:"center", padding:"8px 0", margin:0 }}>
                {foodE.length===0 ? "Log some food first for better suggestions." : "Tap below to see personalised recommendations."}
              </p>
            )}

            <button onClick={handleGetSupRecs} disabled={supLoad} style={{ width:"100%", padding:"12px", backgroundColor:supLoad?"#C8D5D1":C.green, color:C.bg, border:"none", borderRadius:10, fontSize:13, fontWeight:500, cursor:supLoad?"not-allowed":"pointer", transition:"background-color 0.15s", display:"flex", alignItems:"center", justifyContent:"center", gap:7 }}>
              {supLoad ? "Analysing your nutrition…" : <><SparkleIcon size={13} color={C.bg}/>{allRecs.length>0 ? "Re-analyse" : "Analyse my nutrition gaps"}</>}
            </button>
          </div>
        </div>

        <p style={{ fontSize:11, color:C.muted, textAlign:"center", lineHeight:1.6, margin:"4px 0 0" }}>
          For informational purposes only. Always consult your doctor before starting a new supplement.
        </p>

      </div>
    </div>
  );
}
