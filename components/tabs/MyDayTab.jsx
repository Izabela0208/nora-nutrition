import { C, card, serif, sans, inp, localDateStr } from "../noraTokens";
import { NoraAvatar, BotanicalBranch, DropIcon, RunIcon, ForkIcon, CameraIcon, BarcodeIcon, PlusIcon, CheckIcon, SparkleIcon, MoonIcon, LeafDecor, ChevronIcon } from "../NoraIcons";
import { ProgressRing, BarProgress, Skeleton, Divider, SectionCard, SectionHeader, Collapsible } from "../NoraUI";

const TIMING_TIPS_MALE = [
  { range:[6,12],  tip:"Prime window for strength training and heavy lifting — testosterone peaks in the morning." },
  { range:[12,17], tip:"Excellent time for cardio and endurance work — coordination and reaction time are at their best." },
  { range:[17,22], tip:"Focus on recovery: stretching, light movement, and a protein-rich dinner supports muscle repair overnight." },
  { range:[22,6],  tip:"Rest is training too. Prioritise 7–9 hours of sleep for optimal recovery and hormone balance." },
];

const getMaleTip = () => {
  const h = new Date().getHours();
  return TIMING_TIPS_MALE.find(t => h >= t.range[0] && h < t.range[1])?.tip
    || TIMING_TIPS_MALE[3].tip;
};

export default function MyDayTab({
  profile, targets, entries, waterMl, setWaterMl,
  greeting, greetingLoad,
  checkin, checkinLoad, handleCheckin,
  eveningSummary, eveningSummaryLoad,
  weeklyInsight, weeklyInsightLoad,
  sleepHours, setSleepHours, sleepQuality, setSleepQuality, sleepSaved, saveSleep,
  logMode, setLogMode,
  logInput, setLogInput, logLoading, logError, setLogError, handleLogText,
  activityInput, setActivityInput, handleLogActivity,
  imageFile, setImageFile, handleLogImage, fileRef,
  barcodeInput, setBarcodeInput, barcodeResult, setBarcodeResult,
  barcodeLoad, barcodeError, setBarcodeError,
  barcodeGrams, setBarcodeGrams,
  handleBarcodeSearch, handleBarcodeCapture, handleAddBarcode, barcodeFileRef,
  logToast, setLogToast, logToastTimer,
  showWaterPicker, setShowWaterPicker, customWaterMl, setCustomWaterMl, addWater, waterToast,
  editingId, editFields, setEditFields, startEdit, saveEdit, setEntries,
  isFemale, cyclePhase,
  circadian, fetchCircadian,
  openSections, toggleSection,
  foodE, exerE, netCal, totalPro, totalCarb, totalFat, totalFib, burnedCal,
}) {
  const mealGroups = ["Morning","Midday","Snacks","Evening"];
  const grouped = mealGroups.reduce((a,g)=>{a[g]=entries.filter(e=>e.mealGroup===g);return a;},{});

  const fmtTime = (d) => d ? d.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}) : "–";
  const addMins = (d, m) => d ? new Date(d.getTime() + m*60000) : null;
  const sr = circadian.sunrise instanceof Date ? circadian.sunrise : null;
  const ss = circadian.sunset  instanceof Date ? circadian.sunset  : null;

  const h = new Date().getHours();
  const isEvening = h >= 20;

  return (
    <div style={{ padding:"0 0 100px", display:"flex", flexDirection:"column", gap:0 }}>

      {/* ── Header ─────────────────────────────────────── */}
      <div style={{ position:"relative", overflow:"hidden" }}>
        <img src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80&auto=format&fit=crop"
          alt="" loading="lazy" style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", filter:"brightness(0.22) saturate(1.3)" }}/>
        <div style={{ position:"absolute", inset:0, backgroundColor:"rgba(45,74,62,0.88)" }}/>
        <div style={{ position:"absolute", right:-10, top:-8, opacity:0.22 }}><BotanicalBranch width={140} opacity={1} flip={true}/></div>
        <div style={{ position:"absolute", left:-8, bottom:-4, opacity:0.16 }}><BotanicalBranch width={110} opacity={1}/></div>
        <div style={{ position:"relative", padding:"28px 20px 22px" }}>
          {(()=>{
            const now = new Date();
            const dayName = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][now.getDay()];
            const monthName = ['January','February','March','April','May','June','July','August','September','October','November','December'][now.getMonth()];
            return (<>
              <p style={{ fontSize:11, color:"rgba(201,169,110,0.8)", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.12em", margin:"0 0 4px" }}>{dayName}</p>
              <p style={{ fontFamily:serif, fontSize:22, color:C.bg, fontWeight:600, margin:"0 0 6px" }}>{now.getDate()} {monthName} {now.getFullYear()}</p>
            </>);
          })()}
          {greetingLoad
            ? <div style={{ height:16, width:"60%", backgroundColor:"rgba(255,255,255,0.12)", borderRadius:8 }}/>
            : <p style={{ fontSize:12, color:"rgba(245,240,232,0.7)", margin:0, lineHeight:1.5 }}>
                {(greeting || `Good ${h<12?"morning":h<17?"afternoon":"evening"}, ${profile.name}.`).split(".")[0]}
              </p>
          }
        </div>
      </div>

      <div style={{ padding:"14px 16px 0", display:"flex", flexDirection:"column", gap:12 }}>

        {/* Water toast */}
        {waterToast && (
          <div style={{ ...card, padding:"10px 14px", display:"flex", alignItems:"center", gap:8, backgroundColor:C.greenLight, border:`1px solid ${C.sage}30`, animation:"fadeIn 0.2s ease" }}>
            <DropIcon size={14} color={C.slate}/>
            <span style={{ fontSize:13, color:C.green, fontWeight:500 }}>{waterToast}</span>
          </div>
        )}

        {/* Water picker */}
        {showWaterPicker && (
          <div style={{ ...card, padding:"14px 16px", animation:"fadeIn 0.2s ease" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
              <span style={{ fontSize:13, fontWeight:600, color:C.text }}>How much water?</span>
              <button onClick={()=>{setShowWaterPicker(false);setCustomWaterMl("");}} style={{ background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:18,padding:2 }}>×</button>
            </div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {[150,250,500].map(ml=>(
                <button key={ml} onClick={()=>{addWater(ml);setShowWaterPicker(false);}} style={{ padding:"10px 16px", borderRadius:10, border:`1px solid ${C.border}`, backgroundColor:C.card, color:C.slate, fontSize:13, fontWeight:500, cursor:"pointer" }}>
                  {ml} ml
                </button>
              ))}
              <button onClick={()=>setShowWaterPicker("custom")} style={{ padding:"10px 16px", borderRadius:10, border:`1px solid ${showWaterPicker==="custom"?C.slate:C.border}`, backgroundColor:showWaterPicker==="custom"?`${C.slate}18`:C.card, color:C.muted, fontSize:13, cursor:"pointer" }}>Custom</button>
            </div>
            {showWaterPicker === "custom" && (
              <div style={{ display:"flex", gap:8, marginTop:10 }}>
                <input autoFocus className="focus-gold" type="number" style={{...inp,flex:1}} placeholder="Amount in ml" value={customWaterMl} onChange={e=>setCustomWaterMl(e.target.value)} onKeyDown={e=>{ if(e.key==="Enter"&&customWaterMl){ addWater(Math.round(parseFloat(customWaterMl))); setShowWaterPicker(false); setCustomWaterMl(""); } }}/>
                <button onClick={()=>{ if(customWaterMl){ addWater(Math.round(parseFloat(customWaterMl))); setShowWaterPicker(false); setCustomWaterMl(""); } }} disabled={!customWaterMl} style={{ padding:"11px 18px", backgroundColor:customWaterMl?C.slate:"#C8D5D1", color:C.bg, border:"none", borderRadius:10, fontSize:13, fontWeight:500, cursor:customWaterMl?"pointer":"not-allowed" }}>Add</button>
              </div>
            )}
          </div>
        )}

        {/* Log toast */}
        {logToast && (
          <div onClick={()=>{ startEdit(logToast.entry); setLogToast(null); if(logToastTimer.current) clearTimeout(logToastTimer.current); }}
            style={{ ...card, padding:"12px 16px", display:"flex", alignItems:"center", gap:10, backgroundColor:C.greenLight, border:`1px solid ${C.sage}40`, animation:"fadeIn 0.2s ease", cursor:"pointer" }}>
            <CheckIcon size={14} color={C.sage}/>
            <span style={{ fontSize:13, color:C.green, fontWeight:500, flex:1 }}>{logToast.msg}</span>
            <span style={{ fontSize:11, color:C.muted }}>edit</span>
          </div>
        )}

        {/* Cycle indicator (female) */}
        {isFemale && cyclePhase && (
          <div style={{ ...card, padding:"12px 16px", display:"flex", gap:12, alignItems:"flex-start", borderLeft:`3px solid ${cyclePhase.color}` }}>
            <div style={{ flex:1 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
                <span style={{ fontSize:13, fontWeight:600, color:C.text }}>{cyclePhase.label} phase</span>
                <span style={{ fontSize:11, color:C.muted }}>· day {cyclePhase.day}</span>
              </div>
              <p style={{ fontSize:12, color:C.muted, margin:0, lineHeight:1.5 }}>{cyclePhase.tip}</p>
            </div>
          </div>
        )}

        {/* Male timing tip */}
        {!isFemale && (
          <div style={{ ...card, padding:"12px 16px", display:"flex", gap:10, alignItems:"flex-start" }}>
            <div style={{ width:28, height:28, borderRadius:8, backgroundColor:C.greenLight, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <RunIcon size={14} color={C.green}/>
            </div>
            <div>
              <p style={{ fontSize:11, fontWeight:700, color:C.green, textTransform:"uppercase", letterSpacing:"0.06em", margin:"0 0 2px" }}>Performance timing</p>
              <p style={{ fontSize:12, color:C.muted, margin:0, lineHeight:1.5 }}>{getMaleTip()}</p>
            </div>
          </div>
        )}

        {/* Circadian card */}
        <div style={{ ...card, padding:"14px 16px" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom: sr ? 10 : 0 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ width:26, height:26, borderRadius:7, backgroundColor:C.goldLight, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="3" stroke={C.gold} strokeWidth="1.3"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.3 3.3l1.4 1.4M11.3 11.3l1.4 1.4M3.3 12.7l1.4-1.4M11.3 4.7l1.4-1.4" stroke={C.gold} strokeWidth="1.3" strokeLinecap="round"/></svg>
              </div>
              <p style={{ fontSize:13, fontWeight:600, color:C.text, margin:0 }}>Circadian Eating</p>
            </div>
            <button onClick={fetchCircadian} disabled={circadian.loading} style={{ fontSize:11, color:C.gold, fontWeight:500, background:"none", border:`1px solid ${C.gold}40`, borderRadius:8, padding:"4px 10px", cursor:circadian.loading?"not-allowed":"pointer", opacity:circadian.loading?0.6:1 }}>
              {circadian.loading ? "Locating…" : sr ? "Refresh" : "Get times"}
            </button>
          </div>
          {circadian.error && <p style={{ fontSize:12, color:C.muted, margin:0 }}>{circadian.error}</p>}
          {sr && ss && (
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6 }}>
                {[
                  {label:"Sunrise",     val:fmtTime(sr)},
                  {label:"Breakfast by",val:fmtTime(addMins(sr,60))},
                  {label:"Stop eating", val:fmtTime(addMins(ss,-120))},
                ].map(item=>(
                  <div key={item.label} style={{ backgroundColor:C.bg, borderRadius:9, padding:"8px 6px", textAlign:"center", border:`1px solid ${C.border}` }}>
                    <p style={{ fontSize:12, fontWeight:600, color:C.green, margin:0 }}>{item.val}</p>
                    <p style={{ fontSize:9, color:C.muted, margin:"2px 0 0", textTransform:"uppercase", letterSpacing:"0.04em" }}>{item.label}</p>
                  </div>
                ))}
              </div>
              <p style={{ fontSize:11, color:C.muted, margin:0, lineHeight:1.55 }}>
                Largest meal between 10 am–2 pm aligns with peak metabolism. Finishing dinner before sunset supports deeper sleep.
              </p>
            </div>
          )}
          {!sr && !circadian.loading && !circadian.error && (
            <p style={{ fontSize:12, color:C.muted, margin:"6px 0 0", lineHeight:1.5 }}>Tap to get eating windows based on your local sunrise and sunset times.</p>
          )}
        </div>

        {/* Progress rings section */}
        <div style={{ ...card, overflow:"hidden" }}>
          <SectionHeader title="Today's Progress" open={openSections.myday_progress} onToggle={()=>toggleSection("myday_progress")} accent/>
          <Collapsible open={openSections.myday_progress}>
            {targets ? (
              <div style={{ padding:"14px 16px 16px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                  <p style={{ fontSize:12, color:C.muted, margin:0 }}>
                    Net <strong style={{ color:C.text }}>{Math.round(netCal)}</strong> kcal
                    {burnedCal>0 ? ` · ${burnedCal} burned` : ""}
                  </p>
                  <span style={{ fontSize:11, color:C.gold, fontWeight:600, backgroundColor:C.goldLight, padding:"3px 10px", borderRadius:20, border:`1px solid ${C.gold}40` }}>
                    {Math.round((netCal/targets.calories)*100)}%
                  </span>
                </div>
                <div style={{ display:"flex", justifyContent:"space-around", marginBottom:16 }}>
                  <ProgressRing value={netCal}    max={targets.calories}  color={C.green} label="Energy"  unit="kcal" size={76}/>
                  <ProgressRing value={totalPro}  max={targets.protein_g} color={C.gold}  label="Protein" unit="g"    size={76}/>
                  <ProgressRing value={totalCarb} max={targets.carbs_g}   color={C.sage}  label="Carbs"   unit="g"    size={76}/>
                  <ProgressRing value={totalFat}  max={targets.fat_g}     color={C.tan}   label="Fat"     unit="g"    size={76}/>
                </div>
                <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:12, display:"flex", flexDirection:"column", gap:9 }}>
                  <BarProgress value={totalFib} max={targets.fiber_g}  color={C.green} label="Fibre" unit="g"/>
                  <BarProgress value={waterMl}  max={targets.water_ml} color={C.slate} label="Water" unit="ml"/>
                  <div style={{ display:"flex", gap:6, paddingLeft:48, marginTop:2 }}>
                    {[150,250,500].map(ml=>(
                      <button key={ml} onClick={()=>setWaterMl(w=>Math.min(w+ml,targets.water_ml*2))} style={{ padding:"5px 10px", fontSize:11, borderRadius:8, border:`1px solid ${C.border}`, backgroundColor:C.card, color:C.slate, cursor:"pointer", fontWeight:500, display:"flex", alignItems:"center", gap:3 }}>
                        <DropIcon size={10} color={C.slate}/>+{ml}
                      </button>
                    ))}
                    {waterMl>0 && <button onClick={()=>setWaterMl(0)} style={{ marginLeft:"auto", fontSize:11, color:C.muted, background:"none", border:"none", cursor:"pointer", opacity:0.6 }}>reset</button>}
                  </div>
                </div>
              </div>
            ) : (
              <p style={{ fontSize:13, color:C.muted, padding:"16px 18px", margin:0 }}>Complete your profile to see progress targets.</p>
            )}
          </Collapsible>
        </div>

        {/* Log food section */}
        <div style={{ ...card, overflow:"hidden" }}>
          <SectionHeader title="Log Food & Activity" open={openSections.myday_log} onToggle={()=>toggleSection("myday_log")} accent/>
          <Collapsible open={openSections.myday_log}>
            <div>
              <div style={{ display:"flex", borderBottom:`1px solid ${C.border}` }}>
                {[
                  {id:"text",    label:"Food",     icon:(c)=><ForkIcon size={12} color={c}/>},
                  {id:"activity",label:"Activity", icon:(c)=><RunIcon size={12} color={c}/>},
                  {id:"photo",   label:"Photo",    icon:(c)=><CameraIcon size={12} color={c}/>},
                  {id:"barcode", label:"Scan",     icon:(c)=><BarcodeIcon size={12} color={c}/>},
                ].map(({id,label,icon})=>(
                  <button key={id} onClick={()=>{setLogMode(id);setBarcodeResult(null);setBarcodeError("");setBarcodeGrams("100");setLogError("");}} style={{ flex:1, padding:"10px 0", fontSize:10, fontWeight:logMode===id?600:400, color:logMode===id?C.green:C.muted, backgroundColor:"transparent", border:"none", cursor:"pointer", borderBottom:logMode===id?`2px solid ${C.gold}`:"2px solid transparent", letterSpacing:"0.03em", display:"flex", flexDirection:"column", alignItems:"center", gap:3 }}>
                    {icon(logMode===id ? C.green : C.muted)}{label}
                  </button>
                ))}
              </div>
              <div style={{ padding:14 }}>
                {logMode==="text" && (
                  <div style={{ display:"flex", gap:8 }}>
                    <input className="focus-gold" style={{...inp,flex:1}} placeholder='e.g. "two scrambled eggs" or "500ml water"' value={logInput} onChange={e=>setLogInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogText()}/>
                    <button onClick={handleLogText} disabled={logLoading||!logInput.trim()} style={{ padding:"11px 16px", backgroundColor:logLoading||!logInput.trim()?"#C8D5D1":C.green, color:C.bg, border:"none", borderRadius:10, fontSize:13, fontWeight:500, cursor:logLoading||!logInput.trim()?"not-allowed":"pointer", minWidth:54 }}>
                      {logLoading ? <span style={{ width:13,height:13,border:`2px solid ${C.bg}`,borderTopColor:"transparent",borderRadius:"50%",display:"inline-block",animation:"spin 0.8s linear infinite" }}/> : <PlusIcon size={12} color={C.bg}/>}
                    </button>
                  </div>
                )}
                {logMode==="activity" && (
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    <div style={{ display:"flex", gap:8 }}>
                      <input className="focus-gold" style={{...inp,flex:1}} placeholder='e.g. "30 min run" or "1 hour gym"' value={activityInput} onChange={e=>setActivityInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogActivity()}/>
                      <button onClick={handleLogActivity} disabled={logLoading||!activityInput.trim()} style={{ padding:"11px 16px", backgroundColor:logLoading||!activityInput.trim()?"#C8D5D1":C.sage, color:C.bg, border:"none", borderRadius:10, fontSize:13, fontWeight:500, cursor:logLoading||!activityInput.trim()?"not-allowed":"pointer", minWidth:54 }}>
                        {logLoading ? <span style={{ width:13,height:13,border:`2px solid ${C.bg}`,borderTopColor:"transparent",borderRadius:"50%",display:"inline-block",animation:"spin 0.8s linear infinite" }}/> : <RunIcon size={13} color={C.bg}/>}
                      </button>
                    </div>
                    <p style={{ fontSize:11, color:C.muted, margin:0 }}>Estimated for a 70 kg adult · deducted from net total</p>
                  </div>
                )}
                {logMode==="photo" && (
                  <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                    <div onClick={()=>fileRef.current?.click()} style={{ border:`1.5px dashed ${C.border}`, borderRadius:12, padding:"22px", textAlign:"center", cursor:"pointer" }}>
                      {imageFile ? <p style={{ fontSize:13, color:C.green, margin:0 }}>{imageFile.name}</p>
                        : <><p style={{ fontSize:13, color:C.muted, margin:0 }}>Tap to upload a food photo</p><p style={{ fontSize:11, color:C.border, margin:"4px 0 0" }}>Nora identifies and logs it automatically</p></>}
                      <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={e=>setImageFile(e.target.files[0])}/>
                    </div>
                    {imageFile && <button onClick={handleLogImage} disabled={logLoading} style={{ padding:"12px", backgroundColor:logLoading?"#C8D5D1":C.green, color:C.bg, border:"none", borderRadius:10, fontSize:13, fontWeight:500, cursor:logLoading?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>{logLoading?"Analysing…":<><CameraIcon size={13} color={C.bg}/>Analyse &amp; log</>}</button>}
                  </div>
                )}
                {logMode==="barcode" && (
                  <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                    <div style={{ display:"flex", gap:8 }}>
                      <input className="focus-gold" type="text" inputMode="numeric" style={{...inp,flex:1}} placeholder="Enter barcode number…" value={barcodeInput} onChange={e=>setBarcodeInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleBarcodeSearch(barcodeInput)}/>
                      <button onClick={()=>handleBarcodeSearch(barcodeInput)} disabled={barcodeLoad||!barcodeInput.trim()} style={{ padding:"11px 16px", backgroundColor:barcodeLoad||!barcodeInput.trim()?"#C8D5D1":C.green, color:C.bg, border:"none", borderRadius:10, fontSize:13, fontWeight:500, cursor:barcodeLoad||!barcodeInput.trim()?"not-allowed":"pointer", minWidth:64 }}>
                        {barcodeLoad ? <span style={{ width:13,height:13,border:`2px solid ${C.bg}`,borderTopColor:"transparent",borderRadius:"50%",display:"inline-block",animation:"spin 0.8s linear infinite" }}/> : "Search"}
                      </button>
                    </div>
                    <div onClick={()=>barcodeFileRef.current?.click()} style={{ border:`1.5px dashed ${C.border}`, borderRadius:10, padding:"14px", textAlign:"center", cursor:"pointer" }}>
                      <p style={{ fontSize:13, color:C.muted, margin:0 }}>Photograph a barcode</p>
                      <p style={{ fontSize:11, color:C.border, margin:"2px 0 0" }}>Chrome & Edge on Android</p>
                      <input ref={barcodeFileRef} type="file" accept="image/*" capture="environment" style={{ display:"none" }} onChange={e=>{ if(e.target.files[0]) handleBarcodeCapture(e.target.files[0]); }}/>
                    </div>
                    {barcodeError && <p style={{ fontSize:12, color:C.error, backgroundColor:C.errorBg, padding:"10px 12px", borderRadius:10, margin:0 }}>{barcodeError}</p>}
                    {barcodeLoad && <Skeleton style={{ height:112, borderRadius:12 }}/>}
                    {barcodeResult && !barcodeLoad && (() => {
                      const gr = parseFloat(barcodeGrams)||100; const ratio = gr/100;
                      return (
                        <div style={{ backgroundColor:C.greenLight, border:`1px solid ${C.border}`, borderRadius:12, padding:14 }}>
                          <div style={{ display:"flex", gap:12, marginBottom:12 }}>
                            {barcodeResult.image && <img src={barcodeResult.image} alt="" style={{ width:50,height:50,objectFit:"contain",borderRadius:8,backgroundColor:"white",border:`1px solid ${C.border}` }}/>}
                            <div style={{ flex:1, minWidth:0 }}>
                              <p style={{ fontSize:14, fontWeight:600, color:C.text, margin:"0 0 2px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{barcodeResult.name}</p>
                              {barcodeResult.brand && <p style={{ fontSize:12, color:C.muted, margin:"0 0 4px" }}>{barcodeResult.brand}</p>}
                              {barcodeResult.nutriscore && (
                                <span style={{ fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:20, backgroundColor:barcodeResult.nutriscore==="a"?C.green:barcodeResult.nutriscore==="b"?C.sage:barcodeResult.nutriscore==="c"?C.gold:C.error, color:"white" }}>NUTRI-SCORE {barcodeResult.nutriscore.toUpperCase()}</span>
                              )}
                            </div>
                          </div>
                          <div style={{ marginBottom:10 }}>
                            <p style={{ fontSize:11, color:C.muted, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em", margin:"0 0 6px" }}>Portion</p>
                            <div style={{ display:"flex", gap:5, alignItems:"center" }}>
                              <input type="number" value={barcodeGrams} onChange={e=>setBarcodeGrams(e.target.value)} style={{...inp,flex:1,padding:"8px 10px",fontSize:13}} placeholder="grams"/>
                              {["50","100","150","200"].map(g=>(
                                <button key={g} onClick={()=>setBarcodeGrams(g)} style={{ padding:"7px 8px", fontSize:11, borderRadius:8, border:`1px solid ${barcodeGrams===g?C.green:C.border}`, backgroundColor:barcodeGrams===g?C.green:C.card, color:barcodeGrams===g?C.bg:C.muted, cursor:"pointer", fontWeight:500, flexShrink:0 }}>{g}g</button>
                              ))}
                            </div>
                          </div>
                          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:5, marginBottom:10 }}>
                            {[{l:"Energy",v:`${Math.round(barcodeResult.calories*ratio)} kcal`},{l:"Protein",v:`${Math.round(barcodeResult.protein_g*ratio*10)/10}g`},{l:"Carbs",v:`${Math.round(barcodeResult.carbs_g*ratio*10)/10}g`},{l:"Fat",v:`${Math.round(barcodeResult.fat_g*ratio*10)/10}g`}].map(m=>(
                              <div key={m.l} style={{ backgroundColor:"white", borderRadius:8, padding:"8px 4px", textAlign:"center", border:`1px solid ${C.border}` }}>
                                <p style={{ fontSize:11, fontWeight:600, color:C.green, margin:0 }}>{m.v}</p>
                                <p style={{ fontSize:9, color:C.muted, margin:"2px 0 0", textTransform:"uppercase", letterSpacing:"0.04em" }}>{m.l}</p>
                              </div>
                            ))}
                          </div>
                          <button onClick={()=>handleAddBarcode(barcodeResult,barcodeGrams)} style={{ width:"100%", padding:"11px", backgroundColor:C.green, color:C.bg, border:"none", borderRadius:10, fontSize:13, fontWeight:500, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                            <CheckIcon size={13} color={C.bg}/>Log {Math.round(gr)}g
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                )}
                {logError && <p style={{ fontSize:12, color:C.error, margin:"10px 0 0", backgroundColor:C.errorBg, padding:"8px 12px", borderRadius:8 }}>{logError} <button onClick={()=>setLogError("")} style={{ background:"none",border:"none",color:C.error,cursor:"pointer",textDecoration:"underline",fontSize:12 }}>Dismiss</button></p>}
              </div>
            </div>
          </Collapsible>
        </div>

        {/* Entries section */}
        {entries.length > 0 && (
          <div style={{ ...card, overflow:"hidden" }}>
            <SectionHeader title="Logged Today" sub={`${foodE.length} food item${foodE.length!==1?"s":""} · ${exerE.length} activity${exerE.length!==1?"s":""}`} open={openSections.myday_entries} onToggle={()=>toggleSection("myday_entries")}/>
            <Collapsible open={openSections.myday_entries}>
              <div>
                {mealGroups.filter(g=>grouped[g]?.length>0).map((group,gi)=>(
                  <div key={group} style={{ borderTop:gi>0?`1px solid ${C.border}`:"none" }}>
                    <p style={{ fontSize:10, fontWeight:600, color:C.muted, textTransform:"uppercase", letterSpacing:"0.07em", margin:0, padding:"8px 14px 4px" }}>{group}</p>
                    {grouped[group].map((entry,idx)=>(
                      <div key={entry.id}>
                        {idx>0 && <Divider/>}
                        {editingId===entry.id ? (
                          <div style={{ padding:"12px 14px" }}>
                            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                              <input style={{...inp,fontSize:13}} value={editFields.name} onChange={e=>setEditFields(p=>({...p,name:e.target.value}))} placeholder="Name"/>
                              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:5 }}>
                                {[["kcal","calories"],["P (g)","protein_g"],["C (g)","carbs_g"],["F (g)","fat_g"]].map(([lbl,key])=>(
                                  <div key={key}>
                                    <label style={{ fontSize:10, color:C.muted, textTransform:"uppercase", display:"block", marginBottom:3 }}>{lbl}</label>
                                    <input type="number" style={{...inp,fontSize:12,padding:"7px 8px"}} value={editFields[key]} onChange={e=>setEditFields(p=>({...p,[key]:e.target.value}))}/>
                                  </div>
                                ))}
                              </div>
                              <input style={{...inp,fontSize:12}} value={editFields.notes} onChange={e=>setEditFields(p=>({...p,notes:e.target.value}))} placeholder="Notes"/>
                              <div style={{ display:"flex", gap:8 }}>
                                <button onClick={()=>saveEdit(entry.id)} style={{ flex:2, padding:"9px", backgroundColor:C.green, color:C.bg, border:"none", borderRadius:9, fontSize:12, fontWeight:500, cursor:"pointer" }}>Save</button>
                                <button onClick={()=>setEntries(p=>p.filter(e=>e.id!==entry.id))} style={{ flex:1, padding:"9px", backgroundColor:C.errorBg, color:C.error, border:`1px solid ${C.error}30`, borderRadius:9, fontSize:12, cursor:"pointer" }}>Delete</button>
                                <button onClick={()=>{ }} style={{ flex:1, padding:"9px", backgroundColor:C.greenLight, color:C.green, border:`1px solid ${C.border}`, borderRadius:9, fontSize:12, cursor:"pointer" }} onClick={()=>setEntries(p=>p.map(e=>e.id===entry.id?{...e,id:entry.id}:e))}>Cancel</button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div style={{ padding:"11px 14px", display:"flex", alignItems:"center", gap:10 }}>
                            <div style={{ width:26, height:26, borderRadius:7, backgroundColor:entry.type==="exercise"?`${C.sage}20`:`${C.gold}18`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                              {entry.type==="exercise" ? <RunIcon size={13} color={C.sage}/> : <LeafDecor size={13}/>}
                            </div>
                            <div style={{ flex:1, minWidth:0 }}>
                              <p style={{ fontSize:13, fontWeight:500, color:C.text, margin:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{entry.name}</p>
                              <p style={{ fontSize:11, color:C.muted, margin:"2px 0 0" }}>{entry.time}{entry.notes?` · ${entry.notes}`:""}</p>
                            </div>
                            <div style={{ textAlign:"right", flexShrink:0 }}>
                              <p style={{ fontSize:13, fontWeight:600, color:entry.type==="exercise"?C.sage:C.text, margin:0 }}>
                                {entry.type==="exercise"?`−${Math.abs(entry.calories)}`:`${entry.estimated?"~":""}${entry.calories}`} kcal
                              </p>
                              {entry.type==="food" && <p style={{ fontSize:10, color:C.muted, margin:"1px 0 0" }}>{entry.estimated&&<span style={{opacity:0.5}}>~</span>}P{Math.round(entry.protein_g)} C{Math.round(entry.carbs_g)} F{Math.round(entry.fat_g)}</p>}
                            </div>
                            <button onClick={()=>startEdit(entry)} style={{ background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:14,padding:2,flexShrink:0,opacity:0.65 }}>✎</button>
                            <button onClick={()=>setEntries(prev=>prev.filter(e=>e.id!==entry.id))} style={{ background:"none",border:"none",color:C.border,cursor:"pointer",fontSize:18,lineHeight:1,padding:2,flexShrink:0 }}>×</button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </Collapsible>
          </div>
        )}

        {/* Check-in */}
        <button onClick={handleCheckin} disabled={checkinLoad||entries.length===0}
          style={{ width:"100%", padding:"14px", backgroundColor:checkinLoad||entries.length===0?"#C8D5D1":C.green, color:C.bg, border:"none", borderRadius:12, fontSize:14, fontWeight:500, cursor:checkinLoad||entries.length===0?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:7 }}>
          {checkinLoad?"Nora is reviewing your day…":<><SparkleIcon size={13} color={C.bg}/>How am I doing?</>}
        </button>
        {checkin && (
          <div style={{ ...card, padding:"15px 18px", display:"flex", gap:12, animation:"fadeIn 0.3s ease" }}>
            <NoraAvatar size={32}/>
            <p style={{ fontSize:14, color:C.text, lineHeight:1.65, margin:0, flex:1 }}>{checkin}</p>
          </div>
        )}

        {/* Evening summary */}
        {isEvening && (
          <>
            {eveningSummaryLoad && <div style={{ ...card, padding:"14px 16px" }}><Skeleton style={{ height:14, marginBottom:6, borderRadius:6 }}/><Skeleton style={{ height:14, width:"80%", borderRadius:6 }}/></div>}
            {eveningSummary && !eveningSummaryLoad && (
              <div style={{ ...card, padding:"14px 16px", display:"flex", gap:10, alignItems:"flex-start", animation:"fadeIn 0.3s ease", borderLeft:`3px solid ${C.gold}` }}>
                <NoraAvatar size={28}/>
                <div style={{ flex:1 }}>
                  <p style={{ fontSize:11, fontWeight:700, color:C.gold, textTransform:"uppercase", letterSpacing:"0.06em", margin:"0 0 4px" }}>Your day</p>
                  <p style={{ fontSize:13, color:C.text, lineHeight:1.6, margin:0 }}>{eveningSummary}</p>
                </div>
              </div>
            )}
          </>
        )}

        {/* Sleep */}
        {!sleepSaved ? (
          <div style={{ ...card, padding:"16px 18px" }}>
            <p style={{ fontSize:11, fontWeight:600, color:C.muted, textTransform:"uppercase", letterSpacing:"0.07em", margin:"0 0 12px" }}>How did you sleep?</p>
            <div style={{ display:"flex", gap:8, marginBottom:10 }}>
              <input className="focus-gold" type="number" step="0.5" min="0" max="14" style={{...inp,flex:1}} placeholder="Hours (e.g. 7.5)" value={sleepHours} onChange={e=>setSleepHours(e.target.value)}/>
              <div style={{ display:"flex", gap:4, flex:2 }}>
                {["poor","ok","good","great"].map(q=>(
                  <button key={q} onClick={()=>setSleepQuality(q)} style={{ flex:1, padding:"10px 0", borderRadius:8, border:`1px solid ${sleepQuality===q?C.green:C.border}`, backgroundColor:sleepQuality===q?C.green:C.card, color:sleepQuality===q?C.bg:C.muted, fontSize:10, fontWeight:sleepQuality===q?600:400, cursor:"pointer", textTransform:"capitalize", transition:"all 0.15s" }}>{q}</button>
                ))}
              </div>
            </div>
            <button onClick={saveSleep} disabled={!sleepHours} style={{ width:"100%", padding:"11px", backgroundColor:sleepHours?C.green:"#C8D5D1", color:C.bg, border:"none", borderRadius:9, fontSize:13, fontWeight:500, cursor:sleepHours?"pointer":"not-allowed", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
              <MoonIcon size={13} color={sleepHours?C.bg:"rgba(255,255,255,0.5)"}/>Save sleep
            </button>
          </div>
        ) : (
          <div style={{ ...card, padding:"12px 16px", display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:7, height:7, borderRadius:"50%", backgroundColor:C.sage }}/>
            <span style={{ fontSize:13, color:C.text, flex:1 }}>Sleep: <strong>{sleepHours}h</strong> · {sleepQuality}</span>
            <button onClick={()=>setSleepSaved(false)} style={{ fontSize:11, color:C.muted, background:"none", border:"none", cursor:"pointer" }}>Edit</button>
          </div>
        )}

        {/* Weekly insight */}
        {weeklyInsightLoad && <div style={{ ...card, padding:"14px 16px" }}><Skeleton style={{ height:14, marginBottom:6, borderRadius:6 }}/><Skeleton style={{ height:14, width:"70%", borderRadius:6 }}/></div>}
        {weeklyInsight && !weeklyInsightLoad && (
          <div style={{ ...card, padding:"14px 16px", display:"flex", gap:10, alignItems:"flex-start", animation:"fadeIn 0.3s ease" }}>
            <NoraAvatar size={26}/>
            <div style={{ flex:1 }}>
              <p style={{ fontSize:11, fontWeight:700, color:C.green, textTransform:"uppercase", letterSpacing:"0.06em", margin:"0 0 4px" }}>Nora noticed</p>
              <p style={{ fontSize:13, color:C.text, lineHeight:1.6, margin:0 }}>{weeklyInsight}</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
