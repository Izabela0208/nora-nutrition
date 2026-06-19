import { useState } from "react";
import { C, card, serif, sans, inp, PLAN_SECTIONS } from "../noraTokens";
import { NoraAvatar, SparkleIcon, CheckIcon, LeafDecor, ForkIcon } from "../NoraIcons";
import { Skeleton, SectionHeader, Collapsible, GoldTag } from "../NoraUI";

export default function NourishTab({
  profile, targets,
  mealPlan, mealPlanLoad, handleGetMealPlan,
  expandedMeal, setExpandedMeal,
  mealPrepPlan, mealPrepLoad, mealPrepCuisine, setMealPrepCuisine, handleGetMealPrep,
  savedMealPlans, setSavedMealPlans, saveCurrentMealPlan,
  netCal, totalPro, totalCarb, totalFat,
  addMealToLog,
  openSections, toggleSection,
  tabLabel,
}) {
  const [struckIngredients, setStruckIngredients] = useState(new Set());
  const [checkedItems, setCheckedItems] = useState(new Set());
  const [expandedDays, setExpandedDays] = useState(new Set([0]));
  const [customPrepInput, setCustomPrepInput] = useState("");

  const toggleStruck = (key) => setStruckIngredients(prev => {
    const next = new Set(prev); next.has(key) ? next.delete(key) : next.add(key); return next;
  });
  const toggleChecked = (key) => setCheckedItems(prev => {
    const next = new Set(prev); next.has(key) ? next.delete(key) : next.add(key); return next;
  });
  const toggleDay = (i) => setExpandedDays(prev => {
    const next = new Set(prev); next.has(i) ? next.delete(i) : next.add(i); return next;
  });

  return (
    <div style={{ paddingBottom:100 }}>
      {/* Header */}
      <div style={{ backgroundColor:C.green, padding:"22px 20px 18px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
          <ForkIcon size={18} color={C.gold}/>
          <h2 style={{ fontFamily:serif, fontSize:22, color:C.bg, fontWeight:600, margin:0 }}>{tabLabel}</h2>
        </div>
        <p style={{ fontSize:12, color:"rgba(245,240,232,0.6)", margin:0 }}>Meals designed for your goals</p>
      </div>

      <div style={{ padding:"14px 16px 0", display:"flex", flexDirection:"column", gap:12 }}>

        {/* ── Section 1: Today's Plan ─────────────────────────────────── */}
        <div style={{ ...card, overflow:"hidden" }}>
          <SectionHeader
            title="Today's Plan"
            sub="Personalised to your goals and remaining macros"
            open={openSections.nourish_plan}
            onToggle={()=>toggleSection("nourish_plan")}
            accent
          />
          <Collapsible open={openSections.nourish_plan}>
            <div style={{ padding:"0 0 16px" }}>

              {/* Remaining macros */}
              {targets && (
                <div style={{ margin:"0 16px 12px", padding:"12px 14px", backgroundColor:C.greenLight, borderRadius:12 }}>
                  <p style={{ fontSize:10, fontWeight:600, color:C.muted, textTransform:"uppercase", letterSpacing:"0.06em", margin:"0 0 8px" }}>Remaining today</p>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:4, textAlign:"center" }}>
                    {[
                      {l:"Energy",  v:Math.max(0,Math.round(targets.calories-netCal)),   u:"kcal", col:C.green},
                      {l:"Protein", v:Math.max(0,Math.round(targets.protein_g-totalPro)), u:"g",   col:C.gold},
                      {l:"Carbs",   v:Math.max(0,Math.round(targets.carbs_g-totalCarb)),  u:"g",   col:C.sage},
                      {l:"Fat",     v:Math.max(0,Math.round(targets.fat_g-totalFat)),     u:"g",   col:C.tan},
                    ].map(item=>(
                      <div key={item.l}>
                        <p style={{ fontSize:14, fontWeight:700, color:item.col, margin:0 }}>{item.v}<span style={{ fontSize:10, fontWeight:400 }}>{item.u}</span></p>
                        <p style={{ fontSize:9, color:C.muted, margin:0, textTransform:"uppercase", letterSpacing:"0.05em" }}>{item.l}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty state */}
              {!mealPlan && !mealPlanLoad && (
                <div style={{ textAlign:"center", padding:"32px 16px 20px" }}>
                  <div style={{ width:56, height:56, borderRadius:16, backgroundColor:C.goldLight, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 14px" }}>
                    <ForkIcon size={24} color={C.gold}/>
                  </div>
                  <p style={{ fontFamily:serif, fontSize:17, fontWeight:600, color:C.text, margin:"0 0 6px" }}>Ready to plan your day?</p>
                  <p style={{ fontSize:13, color:C.muted, margin:"0 0 20px", lineHeight:1.6 }}>Nora will craft a full day of meals tailored to your remaining targets</p>
                  <button onClick={()=>handleGetMealPlan(false)} style={{ padding:"13px 28px", backgroundColor:C.green, color:C.bg, border:"none", borderRadius:12, fontSize:14, fontWeight:500, cursor:"pointer", display:"inline-flex", alignItems:"center", gap:8 }}>
                    <SparkleIcon size={14} color={C.bg}/>Generate meal plan
                  </button>
                </div>
              )}

              {/* Loading */}
              {mealPlanLoad && (
                <div style={{ padding:"0 16px", display:"flex", flexDirection:"column", gap:16 }}>
                  {[1,2,3,4,5].map(i=><div key={i} style={{ height:80, backgroundColor:C.track, borderRadius:12 }}/>)}
                </div>
              )}

              {/* Plan */}
              {!mealPlanLoad && mealPlan && (
                <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
                  <button onClick={()=>handleGetMealPlan(true)} style={{ margin:"0 16px 12px", padding:"11px", backgroundColor:C.goldLight, color:C.amber, border:`1px solid ${C.gold}`, borderRadius:10, fontSize:13, fontWeight:500, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                    <SparkleIcon size={13} color={C.amber}/>Generate new plan
                  </button>

                  {PLAN_SECTIONS.map((section, secIdx) => {
                    const sectionMeals = mealPlan[section.group] || [];
                    if (sectionMeals.length === 0) return null;
                    return (
                      <div key={section.group} style={{ margin:"0 16px 16px" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10, paddingBottom:6, borderBottom:`1px solid ${C.border}` }}>
                          <div style={{ width:10, height:10, borderRadius:"50%", backgroundColor:section.color, flexShrink:0 }}/>
                          <h3 style={{ fontFamily:serif, fontSize:16, fontWeight:600, color:C.text, margin:0 }}>{section.label}</h3>
                        </div>
                        {sectionMeals.map((meal, mealIdx) => {
                          const key = `${section.group}-${mealIdx}`;
                          const expanded = expandedMeal === key;
                          return (
                            <div key={key} style={{ ...card, overflow:"hidden", marginBottom:10 }}>
                              <div style={{ padding:"14px 16px 12px" }}>
                                <div style={{ display:"flex", alignItems:"flex-start", gap:10, marginBottom:10 }}>
                                  <span style={{ fontSize:24, lineHeight:1.1, flexShrink:0 }}>{meal.emoji}</span>
                                  <div style={{ flex:1, minWidth:0 }}>
                                    <h4 style={{ fontFamily:serif, fontSize:15, fontWeight:600, color:C.text, margin:"0 0 3px" }}>{meal.name}</h4>
                                    <span style={{ fontSize:11, color:C.muted }}>⏱ {meal.prepTime}{meal.cookTime?` · ${meal.cookTime} cook`:""}</span>
                                  </div>
                                </div>
                                {/* Macro grid */}
                                <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", border:`1px solid ${C.border}`, borderRadius:10, overflow:"hidden", marginBottom:10 }}>
                                  {[
                                    {l:"Cal",v:meal.calories,u:"kcal",col:C.green},
                                    {l:"Protein",v:meal.protein_g,u:"g",col:C.gold},
                                    {l:"Carbs",v:meal.carbs_g,u:"g",col:C.sage},
                                    {l:"Fat",v:meal.fat_g,u:"g",col:C.tan},
                                    {l:"Fibre",v:meal.fiber_g||0,u:"g",col:C.slate},
                                  ].map((m,j)=>(
                                    <div key={j} style={{ padding:"8px 2px", textAlign:"center", borderRight:j<4?`1px solid ${C.border}`:"none", backgroundColor:C.bg }}>
                                      <p style={{ fontSize:12, fontWeight:700, color:m.col, margin:0 }}><span style={{fontSize:9,opacity:0.6}}>~</span>{m.v}<span style={{fontSize:9,fontWeight:400}}>{m.u}</span></p>
                                      <p style={{ fontSize:9, color:C.muted, margin:"1px 0 0", textTransform:"uppercase", letterSpacing:"0.03em" }}>{m.l}</p>
                                    </div>
                                  ))}
                                </div>
                                <div style={{ display:"flex", gap:8 }}>
                                  <button onClick={()=>setExpandedMeal(expanded?null:key)} style={{ flex:1, padding:"10px 8px", backgroundColor:expanded?C.greenLight:"transparent", color:C.green, border:`1px solid ${C.green}40`, borderRadius:10, fontSize:12, fontWeight:500, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:5, transition:"background-color 0.15s" }}>
                                    <span style={{ fontSize:9 }}>{expanded?"▲":"▼"}</span>{expanded?"Hide Recipe":"View Recipe"}
                                  </button>
                                  <button onClick={()=>addMealToLog(meal)} style={{ flex:1, padding:"10px 8px", backgroundColor:C.green, color:C.bg, border:"none", borderRadius:10, fontSize:12, fontWeight:500, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>
                                    <CheckIcon size={12} color={C.bg}/>Log Meal
                                  </button>
                                </div>
                              </div>

                              {/* Expanded recipe */}
                              {expanded && (
                                <div style={{ borderTop:`1px solid ${C.border}`, padding:"16px 16px 14px", backgroundColor:C.bg }}>
                                  {/* Ingredients — tappable */}
                                  {meal.ingredients?.length > 0 && (
                                    <div style={{ marginBottom:16 }}>
                                      <p style={{ fontSize:11, fontWeight:700, color:section.color, textTransform:"uppercase", letterSpacing:"0.07em", margin:"0 0 8px" }}>Ingredients</p>
                                      <p style={{ fontSize:11, color:C.muted, margin:"0 0 6px" }}>Tap to cross off as you prepare</p>
                                      <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                                        {meal.ingredients.map((ing, ingIdx) => {
                                          const ingKey = `${section.group}-${mealIdx}-${ingIdx}`;
                                          const struck = struckIngredients.has(ingKey);
                                          return (
                                            <button key={ingIdx} onClick={()=>toggleStruck(ingKey)} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"9px 12px", backgroundColor:struck?"#F0F0EC":C.card, borderRadius:9, border:`1px solid ${struck?C.border:C.border}`, cursor:"pointer", textAlign:"left", transition:"all 0.15s", opacity:struck?0.5:1 }}>
                                              <span style={{ fontSize:13, color:C.text, textDecoration:struck?"line-through":"none" }}>{ing.item||String(ing)}</span>
                                              {ing.amount && <span style={{ fontSize:12, color:C.muted, fontWeight:500, marginLeft:10, flexShrink:0, textDecoration:struck?"line-through":"none" }}>{ing.amount}</span>}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                  {/* Steps */}
                                  {meal.steps?.length > 0 && (
                                    <div style={{ marginBottom:14 }}>
                                      <p style={{ fontSize:11, fontWeight:700, color:section.color, textTransform:"uppercase", letterSpacing:"0.07em", margin:"0 0 10px" }}>Instructions</p>
                                      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                                        {meal.steps.map((step, j)=>(
                                          <div key={j} style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
                                            <div style={{ width:22, height:22, borderRadius:"50%", backgroundColor:section.color, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, flexShrink:0, marginTop:1 }}>{j+1}</div>
                                            <p style={{ fontSize:13, color:C.text, margin:0, lineHeight:1.65, flex:1 }}>{step}</p>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {meal.tip && (
                                    <div style={{ display:"flex", gap:10, alignItems:"flex-start", padding:"10px 12px", backgroundColor:C.greenLight, borderRadius:10 }}>
                                      <NoraAvatar size={18}/>
                                      <p style={{ fontSize:12, color:C.muted, fontStyle:"italic", margin:0, flex:1, lineHeight:1.5 }}>{meal.tip}</p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}

                  {/* Save + regen */}
                  <div style={{ display:"flex", gap:8, margin:"0 16px" }}>
                    <button onClick={saveCurrentMealPlan} style={{ flex:1, padding:"12px", backgroundColor:C.greenLight, color:C.green, border:`1px solid ${C.border}`, borderRadius:12, fontSize:13, fontWeight:500, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                      <CheckIcon size={12} color={C.green}/>Save plan
                    </button>
                    <button onClick={()=>handleGetMealPlan(true)} style={{ flex:2, padding:"12px", backgroundColor:C.goldLight, color:C.amber, border:`1px solid ${C.gold}`, borderRadius:12, fontSize:13, fontWeight:500, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                      <SparkleIcon size={13} color={C.amber}/>New plan
                    </button>
                  </div>
                </div>
              )}

              {/* Saved plans */}
              {savedMealPlans.length > 0 && (
                <div style={{ margin:"12px 16px 0" }}>
                  <p style={{ fontSize:11, fontWeight:600, color:C.muted, textTransform:"uppercase", letterSpacing:"0.06em", margin:"0 0 8px" }}>Saved plans</p>
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    {savedMealPlans.map(sp=>(
                      <div key={sp.id} style={{ ...card, padding:"12px 14px" }}>
                        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
                          <span style={{ fontSize:12, fontWeight:500, color:C.text }}>Plan from {sp.date}</span>
                          <div style={{ display:"flex", gap:6 }}>
                            <button onClick={()=>{}} style={{ fontSize:12, color:C.green, fontWeight:500, background:"none", border:`1px solid ${C.green}40`, borderRadius:8, padding:"4px 10px", cursor:"pointer" }}>Load</button>
                            <button onClick={()=>{ const u=savedMealPlans.filter(x=>x.id!==sp.id); setSavedMealPlans(u); try{localStorage.setItem("nora_saved_plans",JSON.stringify(u));}catch{} }} style={{ fontSize:12, color:C.muted, background:"none", border:"none", cursor:"pointer", padding:"4px" }}>×</button>
                          </div>
                        </div>
                        <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                          {Object.entries(sp.plan).map(([group,meals])=>meals[0]&&(
                            <span key={group} style={{ fontSize:11, color:C.muted, backgroundColor:C.greenLight, padding:"3px 8px", borderRadius:8 }}>{meals[0].emoji} {meals[0].name.split(" ").slice(0,3).join(" ")}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Collapsible>
        </div>

        {/* ── Section 2: 7-Day Meal Prep ──────────────────────────────── */}
        <div style={{ ...card, overflow:"hidden" }}>
          <SectionHeader
            title="7-Day Meal Prep"
            sub="Pick a cuisine for your full week plan"
            open={openSections.nourish_prep}
            onToggle={()=>toggleSection("nourish_prep")}
            accent
          />
          <Collapsible open={openSections.nourish_prep}>
            <div style={{ padding:"0 16px 16px" }}>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:12 }}>
                {["Mediterranean","Asian","Romanian","American"].map(c=>(
                  <button key={c} onClick={()=>setMealPrepCuisine(c)} style={{ padding:"8px 14px", borderRadius:10, border:`1px solid ${mealPrepCuisine===c?C.green:C.border}`, backgroundColor:mealPrepCuisine===c?C.green:C.card, color:mealPrepCuisine===c?C.bg:C.text, fontSize:13, fontWeight:mealPrepCuisine===c?600:400, cursor:"pointer", transition:"all 0.15s" }}>{c}</button>
                ))}
              </div>
              <button onClick={()=>handleGetMealPrep(mealPrepCuisine)} disabled={mealPrepLoad} style={{ width:"100%", padding:"12px", backgroundColor:mealPrepLoad?"#C8D5D1":C.green, color:C.bg, border:"none", borderRadius:12, fontSize:13, fontWeight:500, cursor:mealPrepLoad?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:7, marginBottom:14 }}>
                {mealPrepLoad ? "Planning your week…" : <><SparkleIcon size={13} color={C.bg}/>Generate {mealPrepCuisine} week</>}
              </button>

              {mealPrepLoad && (
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {[1,2,3].map(i=><div key={i} style={{ height:60, backgroundColor:C.track, borderRadius:10 }}/>)}
                </div>
              )}

              {mealPrepPlan && !mealPrepLoad && (
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {/* 7-day collapsible days */}
                  <div style={{ ...card, overflow:"hidden" }}>
                    <div style={{ backgroundColor:C.green, padding:"10px 14px" }}>
                      <p style={{ fontSize:13, fontWeight:600, color:C.bg, margin:0 }}>7-Day Schedule</p>
                    </div>
                    {mealPrepPlan.days?.map((d, i)=>(
                      <div key={i} style={{ borderBottom:i<mealPrepPlan.days.length-1?`1px solid ${C.border}`:"none" }}>
                        <button onClick={()=>toggleDay(i)} style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 14px", background:"none", border:"none", cursor:"pointer" }}>
                          <span style={{ fontSize:13, fontWeight:600, color:C.text }}>{d.day}</span>
                          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                            <span style={{ fontSize:11, color:C.muted }}>~{d.calories_est} kcal</span>
                            <span style={{ fontSize:10, color:C.muted }}>{expandedDays.has(i)?"▲":"▼"}</span>
                          </div>
                        </button>
                        {expandedDays.has(i) && (
                          <div style={{ padding:"0 14px 12px", display:"flex", flexDirection:"column", gap:4 }}>
                            {[
                              {l:"Breakfast",v:d.breakfast,col:C.amber},
                              {l:"Lunch",v:d.lunch,col:C.green},
                              {l:"Snack",v:d.snack,col:C.slate},
                              {l:"Dinner",v:d.dinner,col:"#5A4A7A"},
                            ].map((item,j)=>(
                              <div key={j} style={{ display:"flex", gap:8, alignItems:"flex-start" }}>
                                <span style={{ fontSize:11, fontWeight:600, color:item.col, width:60, flexShrink:0, paddingTop:1 }}>{item.l}</span>
                                <p style={{ fontSize:12, color:C.text, margin:0, lineHeight:1.45 }}>{item.v}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Checkable shopping list */}
                  {mealPrepPlan.shopping_list?.length>0 && (
                    <div style={{ ...card, overflow:"hidden" }}>
                      <div style={{ backgroundColor:C.goldLight, borderBottom:`1px solid ${C.border}`, padding:"10px 14px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                        <p style={{ fontSize:13, fontWeight:600, color:C.amber, margin:0 }}>Shopping List</p>
                        {checkedItems.size > 0 && <button onClick={()=>setCheckedItems(new Set())} style={{ fontSize:11, color:C.muted, background:"none", border:"none", cursor:"pointer" }}>Clear checks</button>}
                      </div>
                      <div style={{ padding:"12px 14px", display:"flex", flexDirection:"column", gap:12 }}>
                        {mealPrepPlan.shopping_list.map((cat,catIdx)=>(
                          <div key={catIdx}>
                            <p style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.05em", margin:"0 0 6px" }}>{cat.category}</p>
                            <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                              {cat.items?.map((item,itemIdx)=>{
                                const ck = `${catIdx}-${itemIdx}`;
                                const isChecked = checkedItems.has(ck);
                                return (
                                  <button key={itemIdx} onClick={()=>toggleChecked(ck)} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 10px", borderRadius:9, border:`1px solid ${isChecked?C.sage:C.border}`, backgroundColor:isChecked?C.greenLight:C.card, cursor:"pointer", textAlign:"left", transition:"all 0.15s" }}>
                                    <div style={{ width:18, height:18, borderRadius:"50%", border:`1.5px solid ${isChecked?C.sage:C.border}`, backgroundColor:isChecked?C.sage:"transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                                      {isChecked && <CheckIcon size={10} color="white"/>}
                                    </div>
                                    <span style={{ fontSize:13, color:C.text, textDecoration:isChecked?"line-through":"none", opacity:isChecked?0.6:1 }}>{item}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Prep tips */}
                  {mealPrepPlan.prep_tips?.length>0 && (
                    <div style={{ ...card, padding:"14px 16px" }}>
                      <p style={{ fontSize:11, fontWeight:700, color:C.green, textTransform:"uppercase", letterSpacing:"0.05em", margin:"0 0 8px" }}>Prep tips</p>
                      {mealPrepPlan.prep_tips.map((t,i)=>(
                        <p key={i} style={{ fontSize:12, color:C.muted, margin:"4px 0", lineHeight:1.55 }}>· {t}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </Collapsible>
        </div>

        {/* ── Section 3: Custom Meal Prep ─────────────────────────────── */}
        <div style={{ ...card, overflow:"hidden" }}>
          <SectionHeader
            title="Custom Request"
            sub="Describe what you want and Nora will plan it"
            open={openSections.nourish_custom}
            onToggle={()=>toggleSection("nourish_custom")}
            accent
          />
          <Collapsible open={openSections.nourish_custom}>
            <div style={{ padding:"0 16px 16px" }}>
              <p style={{ fontSize:13, color:C.muted, margin:"0 0 10px", lineHeight:1.55 }}>Try: "high-protein vegetarian week", "quick 20-min meals", or "Italian-inspired prep"</p>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                <textarea
                  className="focus-gold"
                  style={{ ...inp, minHeight:72, resize:"vertical", lineHeight:1.5, fontSize:14 }}
                  placeholder="Describe your ideal week of meals…"
                  value={customPrepInput}
                  onChange={e=>setCustomPrepInput(e.target.value)}
                />
                <button onClick={()=>{ if(customPrepInput.trim()) handleGetMealPrep(customPrepInput.trim()); }} disabled={mealPrepLoad||!customPrepInput.trim()} style={{ width:"100%", padding:"12px", backgroundColor:mealPrepLoad||!customPrepInput.trim()?"#C8D5D1":C.green, color:C.bg, border:"none", borderRadius:10, fontSize:13, fontWeight:500, cursor:mealPrepLoad||!customPrepInput.trim()?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:7 }}>
                  <SparkleIcon size={13} color={C.bg}/>Plan my custom week
                </button>
              </div>
            </div>
          </Collapsible>
        </div>

      </div>
    </div>
  );
}
