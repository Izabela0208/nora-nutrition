import { C, card, serif, sans } from "../noraTokens";
import { FlameIcon, DropIcon, ChartLineIcon, SparkleIcon, NoraAvatar, LeafDecor } from "../NoraIcons";
import { Skeleton, Divider, TabSectionHead, SectionCard, SectionHeader, Collapsible } from "../NoraUI";

export default function JourneyTab({
  profile, targets,
  last7, streak, daysWithData, avg,
  waterMl, circadian,
  weeklyReport, weeklyLoad, handleWeeklyReport,
  weeklyInsight, weeklyInsightLoad,
  openSections, toggleSection,
  isFemale, cyclePhase,
}) {
  const fmtTime = (d) => d ? d.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}) : "–";
  const addMins = (d, m) => d ? new Date(d.getTime() + m*60000) : null;
  const sr = circadian?.sunrise instanceof Date ? circadian.sunrise : null;
  const ss = circadian?.sunset  instanceof Date ? circadian.sunset  : null;
  const breakfastWindow = sr ? `${fmtTime(addMins(sr,30))}–${fmtTime(addMins(sr,60))}` : null;
  const stopEating = ss ? fmtTime(addMins(ss,-120)) : null;

  return (
    <div style={{ paddingBottom:100 }}>
      <div style={{ backgroundColor:C.green, padding:"22px 20px 18px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
          <ChartLineIcon size={18} color={C.gold}/>
          <h2 style={{ fontFamily:serif, fontSize:22, color:C.bg, fontWeight:600, margin:0 }}>Journey</h2>
        </div>
        <p style={{ fontSize:12, color:"rgba(245,240,232,0.6)", margin:0 }}>Your progress at a glance</p>
      </div>

      <div style={{ padding:"14px 16px 0", display:"flex", flexDirection:"column", gap:12 }}>

        {/* Streak */}
        <div style={{ ...card, padding:"18px 20px", display:"flex", alignItems:"center", gap:16 }}>
          <div style={{ width:52, height:52, borderRadius:14, backgroundColor:C.goldLight, border:`1px solid ${C.gold}30`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <FlameIcon size={22} color={C.gold}/>
          </div>
          <div style={{ flex:1 }}>
            <p style={{ fontFamily:serif, fontSize:22, fontWeight:600, color:C.text, margin:0 }}>{streak} <span style={{ fontSize:14, fontWeight:400, color:C.muted }}>day{streak!==1?"s":""}</span></p>
            <p style={{ fontSize:12, color:C.muted, margin:"2px 0 0" }}>
              {streak>=30?"Elite dedication — you're unstoppable":streak>=14?"Two weeks strong — Nora is proud of you!":streak>=7?"One full week — exceptional consistency!":streak>=3?"Building momentum — keep it going!":streak>0?"Every day logged is a win. Come back tomorrow!":"Start logging today to build your streak."}
            </p>
          </div>
          <div style={{ textAlign:"right" }}>
            <p style={{ fontSize:22, fontWeight:600, color:C.green, margin:0 }}>{last7.filter(d=>d.calories>0).length}<span style={{ fontSize:12, color:C.muted, fontWeight:400 }}>/7</span></p>
            <p style={{ fontSize:10, color:C.muted, margin:"2px 0 0", textTransform:"uppercase", letterSpacing:"0.05em" }}>Days logged</p>
          </div>
        </div>

        {/* 7-day chart */}
        <div style={{ ...card, padding:"20px 16px", overflow:"hidden" }}>
          <SectionHeader
            title="Energy · 7 days"
            sub={targets ? `Target: ${targets.calories} kcal/day` : undefined}
            open={openSections.journey_chart}
            onToggle={()=>toggleSection("journey_chart")}
            noBorder
          />
          <Collapsible open={openSections.journey_chart}>
            <div style={{ padding:"0 16px 16px" }}>
              <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", gap:4, height:100 }}>
                {last7.map(d => {
                  const h = targets ? Math.round((d.calories/targets.calories)*100) : 0;
                  const col = h===0?C.track:h<=105?C.green:h<=120?C.gold:C.error;
                  return (
                    <div key={d.date} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                      <div style={{ width:"100%", position:"relative", display:"flex", alignItems:"flex-end", height:80 }}>
                        <div style={{ width:"100%", height:`${Math.min(h||0,150)}%`, backgroundColor:col, borderRadius:"4px 4px 0 0", transition:"height 0.6s cubic-bezier(0.4,0,0.2,1)" }}/>
                        {targets && <div style={{ position:"absolute", width:"100%", borderTop:`1px dashed ${C.border}`, bottom:"66.67%" }}/>}
                      </div>
                      <span style={{ fontSize:10, color:d.isToday?C.green:C.muted, fontWeight:d.isToday?700:400 }}>{d.day}</span>
                      {d.calories>0 && <span style={{ fontSize:9, color:C.muted }}>{Math.round(d.calories/100)/10}k</span>}
                    </div>
                  );
                })}
              </div>
              <div style={{ display:"flex", gap:12, marginTop:12, flexWrap:"wrap" }}>
                {[{col:C.green,label:"On target"},{col:C.gold,label:"Slightly over"},{col:C.error,label:"Over"}].map(item=>(
                  <div key={item.label} style={{ display:"flex", alignItems:"center", gap:4 }}>
                    <div style={{ width:10, height:10, borderRadius:3, backgroundColor:item.col }}/>
                    <span style={{ fontSize:10, color:C.muted }}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </Collapsible>
        </div>

        {/* Averages */}
        {targets && (
          <div style={{ ...card, overflow:"hidden" }}>
            <SectionHeader
              title="7-day averages"
              sub={daysWithData.length===0 ? "No data yet — start logging" : `${daysWithData.length} days tracked`}
              open={openSections.journey_avgs}
              onToggle={()=>toggleSection("journey_avgs")}
              noBorder
            />
            <Collapsible open={openSections.journey_avgs}>
              <div style={{ padding:"0 16px 16px" }}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  {[
                    {label:"Avg Energy",  val:`${avg("calories")} kcal`, target:`${targets.calories} kcal`},
                    {label:"Avg Protein", val:`${avg("protein")}g`,      target:`${targets.protein_g}g`},
                    {label:"Avg Carbs",   val:`${avg("carbs")}g`,        target:`${targets.carbs_g}g`},
                    {label:"Avg Fat",     val:`${avg("fat")}g`,          target:`${targets.fat_g}g`},
                  ].map(item=>(
                    <div key={item.label} style={{ backgroundColor:C.greenLight, borderRadius:12, padding:"12px 14px" }}>
                      <p style={{ fontSize:11, color:C.muted, margin:"0 0 4px", textTransform:"uppercase", letterSpacing:"0.05em" }}>{item.label}</p>
                      <p style={{ fontSize:16, fontWeight:600, color:C.green, margin:0 }}>{daysWithData.length>0?item.val:"—"}</p>
                      <p style={{ fontSize:10, color:C.muted, margin:"2px 0 0" }}>Target: {item.target}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Collapsible>
          </div>
        )}

        {/* Hydration this week */}
        {targets && daysWithData.length>0 && (
          <div style={{ ...card, overflow:"hidden" }}>
            <SectionHeader
              title="Hydration"
              sub="This week"
              open={openSections.journey_hydration}
              onToggle={()=>toggleSection("journey_hydration")}
              noBorder
            />
            <Collapsible open={openSections.journey_hydration}>
              <div style={{ padding:"0 16px 16px", display:"flex", flexDirection:"column", gap:8 }}>
                {last7.slice().reverse().filter(d=>d.isToday||d.waterMl>0||d.entryCount>0).slice(0,5).map(d=>(
                  <div key={d.date} style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <span style={{ fontSize:11, color:d.isToday?C.green:C.muted, width:28, fontWeight:d.isToday?700:400 }}>{d.day}</span>
                    <div style={{ flex:1, height:5, backgroundColor:C.track, borderRadius:6, overflow:"hidden" }}>
                      <div style={{ width:`${Math.min((d.waterMl/(targets.water_ml||1))*100,100)}%`, backgroundColor:C.slate, height:"100%", borderRadius:6, transition:"width 0.5s ease" }}/>
                    </div>
                    <span style={{ fontSize:11, color:C.muted, width:36, textAlign:"right" }}>{d.waterMl>0?`${(d.waterMl/1000).toFixed(1)}L`:"—"}</span>
                  </div>
                ))}
              </div>
            </Collapsible>
          </div>
        )}

        {/* Circadian details */}
        {(sr || ss) && (
          <div style={{ ...card, overflow:"hidden" }}>
            <SectionHeader
              title="Circadian windows"
              sub="Your personalised eating schedule"
              open={openSections.journey_circadian}
              onToggle={()=>toggleSection("journey_circadian")}
              noBorder
            />
            <Collapsible open={openSections.journey_circadian}>
              <div style={{ padding:"0 16px 16px" }}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:12 }}>
                  {[
                    {label:"Sunrise",    val:fmtTime(sr)},
                    {label:"Breakfast",  val:breakfastWindow||"—"},
                    {label:"Stop eating",val:stopEating||"—"},
                    {label:"Sunset",     val:fmtTime(ss)},
                    {label:"Best workout",val:sr?`${fmtTime(addMins(sr,120))}–${fmtTime(addMins(sr,360))}`:"—"},
                    {label:"Sleep by",   val:ss?fmtTime(addMins(ss,60)):"—"},
                  ].map(item=>(
                    <div key={item.label} style={{ backgroundColor:C.bg, borderRadius:9, padding:"9px 8px", textAlign:"center", border:`1px solid ${C.border}` }}>
                      <p style={{ fontSize:12, fontWeight:600, color:C.green, margin:0, lineHeight:1.2 }}>{item.val}</p>
                      <p style={{ fontSize:9, color:C.muted, margin:"3px 0 0", textTransform:"uppercase", letterSpacing:"0.04em", lineHeight:1.3 }}>{item.label}</p>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize:12, color:C.muted, margin:0, lineHeight:1.6 }}>Align your biggest meal with 10 am–2 pm for peak metabolic activity. Finishing dinner 2+ hours before sunset improves sleep quality and insulin sensitivity.</p>
              </div>
            </Collapsible>
          </div>
        )}

        {/* Performance / Cycle insights */}
        {(weeklyInsight || weeklyInsightLoad) && (
          <div style={{ ...card, overflow:"hidden" }}>
            <SectionHeader
              title={isFemale ? "Cycle insights" : "Performance insights"}
              open={openSections.journey_insights}
              onToggle={()=>toggleSection("journey_insights")}
              noBorder
            />
            <Collapsible open={openSections.journey_insights}>
              <div style={{ padding:"0 16px 16px" }}>
                {weeklyInsightLoad && <><div style={{ height:14, backgroundColor:C.track, borderRadius:6, marginBottom:6 }}/><div style={{ height:14, width:"70%", backgroundColor:C.track, borderRadius:6 }}/></>}
                {weeklyInsight && !weeklyInsightLoad && (
                  <div style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                    <NoraAvatar size={28}/>
                    <p style={{ fontSize:13, color:C.text, lineHeight:1.6, margin:0, flex:1 }}>{weeklyInsight}</p>
                  </div>
                )}
                {isFemale && cyclePhase && (
                  <div style={{ marginTop:12, padding:"12px 14px", backgroundColor:C.greenLight, borderRadius:10, borderLeft:`3px solid ${cyclePhase.color}` }}>
                    <p style={{ fontSize:12, fontWeight:600, color:C.text, margin:"0 0 3px" }}>{cyclePhase.label} phase · day {cyclePhase.day}</p>
                    <p style={{ fontSize:12, color:C.muted, margin:0, lineHeight:1.5 }}>{cyclePhase.tip}</p>
                  </div>
                )}
              </div>
            </Collapsible>
          </div>
        )}

        {/* Weekly report */}
        <button onClick={handleWeeklyReport} disabled={weeklyLoad} style={{ width:"100%", padding:"15px", backgroundColor:weeklyLoad?"#C8D5D1":C.green, color:C.bg, border:"none", borderRadius:12, fontSize:14, fontWeight:500, cursor:weeklyLoad?"not-allowed":"pointer", letterSpacing:"0.02em", transition:"background-color 0.15s", display:"flex", alignItems:"center", justifyContent:"center", gap:7 }}>
          {weeklyLoad ? "Generating your report…" : <><ChartLineIcon size={14} color={C.bg}/>Generate weekly report</>}
        </button>

        {weeklyLoad && <div style={{ ...card, padding:20, display:"flex", flexDirection:"column", gap:10 }}><div style={{ height:14, backgroundColor:C.track, borderRadius:6 }}/><div style={{ height:14, width:"75%", backgroundColor:C.track, borderRadius:6 }}/><div style={{ height:14, width:"83%", backgroundColor:C.track, borderRadius:6 }}/></div>}

        {weeklyReport && (
          <div style={{ ...card, overflow:"hidden", animation:"fadeIn 0.3s ease" }}>
            <div style={{ backgroundColor:C.green, padding:"18px 20px", display:"flex", gap:14 }}>
              <NoraAvatar size={38}/>
              <div>
                <p style={{ fontSize:12, color:"rgba(245,240,232,0.6)", margin:"0 0 4px", textTransform:"uppercase", letterSpacing:"0.06em" }}>Weekly Report</p>
                <p style={{ fontSize:14, color:C.bg, lineHeight:1.5, margin:0 }}>{weeklyReport.headline}</p>
              </div>
            </div>
            <div style={{ padding:20, display:"flex", flexDirection:"column", gap:16 }}>
              <div>
                <p style={{ fontSize:11, fontWeight:700, color:C.sage, textTransform:"uppercase", letterSpacing:"0.07em", margin:"0 0 8px" }}>Wins this week</p>
                {weeklyReport.wins?.map((w,i)=><p key={i} style={{ fontSize:13, color:C.text, margin:"4px 0", display:"flex", gap:8, lineHeight:1.5 }}><span style={{ color:C.sage, flexShrink:0 }}>✓</span>{w}</p>)}
              </div>
              <div style={{ height:1, backgroundColor:C.border }}/>
              <div>
                <p style={{ fontSize:11, fontWeight:700, color:C.gold, textTransform:"uppercase", letterSpacing:"0.07em", margin:"0 0 8px" }}>For next week</p>
                {weeklyReport.suggestions?.map((s,i)=><p key={i} style={{ fontSize:13, color:C.text, margin:"4px 0", display:"flex", gap:8, lineHeight:1.5 }}><span style={{ color:C.gold, flexShrink:0 }}>→</span>{s}</p>)}
              </div>
              <div style={{ backgroundColor:C.greenLight, borderRadius:10, padding:"12px 14px" }}>
                <p style={{ fontSize:10, fontWeight:700, color:C.green, textTransform:"uppercase", letterSpacing:"0.07em", margin:"0 0 5px" }}>Did you know</p>
                <p style={{ fontSize:13, color:C.text, margin:0, lineHeight:1.6 }}>{weeklyReport.fun_fact}</p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
