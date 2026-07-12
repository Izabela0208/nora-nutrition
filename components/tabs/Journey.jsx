import { useState, useEffect } from "react";
import { C, card, serif, sans, localDateStr } from "../noraTokens";
import { SectionHeader, Collapsible, TabSectionHead } from "../NoraUI";

const MOTIVATIONAL = [
  "Every day you log is a vote for the person you're becoming.",
  "Progress is built one choice at a time — you're making them.",
  "Consistency is the compound interest of health.",
  "Small daily improvements lead to stunning long-term results.",
  "You're not starting over — you're building on everything you know.",
  "Nourishing yourself is an act of self-respect.",
  "The body achieves what the mind believes.",
];

const CYCLE_NUTRITION = {
  menstrual:  {
    foods: ["Iron-rich foods — lentils, red meat, spinach", "Herbal teas to ease cramping", "Anti-inflammatory turmeric & ginger"],
    avoid: "Caffeine and alcohol, which worsen cramping and fatigue.",
  },
  follicular: {
    foods: ["Fermented foods — yoghurt, kefir, kimchi", "Complex carbs for rising energy — oats, quinoa", "Zinc for hormonal support — pumpkin seeds, chickpeas"],
    avoid: "Heavy or processed foods that may slow your rising energy.",
  },
  ovulatory:  {
    foods: ["Zinc-rich seeds — hemp, pumpkin", "Salmon or sardines for anti-inflammation", "Fibre-rich vegetables to support oestrogen clearance"],
    avoid: "Excess sugar and alcohol during this sensitive window.",
  },
  luteal:     {
    foods: ["Magnesium foods — dark chocolate, almonds, leafy greens", "Vitamin B6 — bananas, poultry, avocado", "Complex carbs to balance serotonin — sweet potato, brown rice"],
    avoid: "Salt and processed foods that worsen bloating and mood shifts.",
  },
};

const MALE_WINDOWS = [
  { time: "06:00–10:00", title: "Cortisol peak", tip: "Testosterone is at its daily high — ideal for strength training, sprinting or competitive sport." },
  { time: "10:00–14:00", title: "Peak output", tip: "Best window for high-intensity work, complex movements and skill-based training." },
  { time: "14:00–17:00", title: "Afternoon power", tip: "Reaction time and muscle strength peak again. Excellent for a second session or team sport." },
  { time: "17:00–20:00", title: "Endurance & flexibility", tip: "Core temperature is highest — ideal for longer runs, yoga or deep stretching." },
  { time: "20:00+", title: "Recovery mode", tip: "Wind down. Prioritise protein-rich foods to support overnight muscle repair and growth hormone release." },
];

const CIRCADIAN_INFO = [
  { icon: "🌅", time: "06:00–09:00", title: "Morning light", tip: "Sunlight within 30 min of waking anchors your circadian clock, boosts cortisol naturally and improves sleep that night." },
  { icon: "🍽️", time: "07:00–10:00", title: "Breakfast window", tip: "Eating within 2 hours of waking activates metabolism. Protein at breakfast stabilises blood sugar all day." },
  { icon: "⚡", time: "10:00–14:00", title: "Peak metabolism", tip: "Digestive enzymes and insulin sensitivity are highest. Eat your largest, most nutritionally dense meal here." },
  { icon: "🌿", time: "14:00–17:00", title: "Afternoon fuel", tip: "A light snack with complex carbs sustains focus. Avoid heavy meals that divert blood flow from the brain." },
  { icon: "🌙", time: "19:00–21:00", title: "Wind-down window", tip: "Finish your last meal 3 hours before bed. Digestion slows and body temperature drops as evening progresses." },
];

export default function Journey({ profile, targets, entries, waterMl, cyclePhase }) {
  const [open, setOpen] = useState({ cycle: true, male: true, circadian: true });
  const [history, setHistory] = useState({});
  const [sun, setSun] = useState(null);

  const tog = k => setOpen(p => ({ ...p, [k]: !p[k] }));

  useEffect(() => {
    try {
      const h = localStorage.getItem("nora_history");
      setHistory(h ? JSON.parse(h) : {});
    } catch {}
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(pos => {
      const { latitude: lat, longitude: lng } = pos.coords;
      fetch(`https://api.sunrisesunset.io/json?lat=${lat}&lng=${lng}&timezone=auto&date=today`)
        .then(r => r.json())
        .then(d => { if (d.status === "OK") setSun(d.results); })
        .catch(() => {});
    }, () => {});
  }, []);

  // Build last 7 days
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = localDateStr(d);
    const isToday = i === 0;
    const dayData = history[key] || null;
    const calories = isToday
      ? entries.filter(e => e.type === "food").reduce((s, e) => s + (e.calories || 0), 0)
      : (dayData?.calories || 0);
    const label = isToday ? "Today" : ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"][d.getDay()];
    days.push({ key, label, calories, hasData: isToday ? entries.length > 0 : !!dayData });
  }

  // Streak
  let streak = 0;
  const todayKey = localDateStr();
  for (let i = 0; i < 60; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = localDateStr(d);
    const hasData = key === todayKey ? entries.length > 0 : !!history[key];
    if (hasData) streak++;
    else break;
  }

  const target = targets?.calories || 2000;
  const maxCal = Math.max(...days.map(d => d.calories), target, 100);

  const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  const motivMsg = MOTIVATIONAL[dayOfYear % MOTIVATIONAL.length];

  return (
    <div style={{ padding: "24px 20px 100px", display: "flex", flexDirection: "column", gap: 16 }}>
      <TabSectionHead title="Journey" sub="Your progress at a glance"/>

      {/* Streak */}
      <div style={{ ...card, padding: "20px 20px 18px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div>
            <p style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px", fontWeight: 600 }}>Current Streak</p>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span style={{ fontFamily: serif, fontSize: 38, color: C.green, fontWeight: 700, lineHeight: 1 }}>{streak}</span>
              <span style={{ fontSize: 14, color: C.muted }}>{streak === 1 ? "day" : "days"}</span>
            </div>
          </div>
          <div style={{ width: 54, height: 54, borderRadius: "50%", backgroundColor: C.goldLight, border: `2px solid ${C.gold}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>
            {streak >= 14 ? "🏆" : streak >= 7 ? "🔥" : streak >= 3 ? "⚡" : "🌱"}
          </div>
        </div>
        <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.65, margin: 0, fontStyle: "italic", borderLeft: `3px solid ${C.green}`, paddingLeft: 12 }}>
          "{motivMsg}"
        </p>
      </div>

      {/* Weekly calorie chart */}
      <div style={{ ...card, padding: "18px 20px 20px" }}>
        <p style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 16px", fontWeight: 600 }}>Weekly Energy</p>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 100 }}>
          {days.map(day => {
            const barH = day.calories > 0 ? Math.max((day.calories / maxCal) * 84, 6) : 0;
            const pct = day.calories / target;
            const barColor = !day.hasData
              ? C.track
              : pct > 1.12 ? C.error
              : pct > 0.88 ? C.green
              : C.sage;
            const isToday = day.label === "Today";
            return (
              <div key={day.key} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <span style={{ fontSize: 9, color: C.muted, fontWeight: 500, height: 12, lineHeight: "12px" }}>
                  {day.calories > 0 ? `${Math.round(day.calories / 100) / 10}k` : ""}
                </span>
                <div style={{ width: "100%", height: 84, display: "flex", alignItems: "flex-end" }}>
                  <div style={{
                    width: "100%",
                    height: barH || 3,
                    backgroundColor: barColor,
                    borderRadius: "4px 4px 0 0",
                    opacity: day.hasData ? 1 : 0.3,
                    transition: "height 0.5s ease",
                  }}/>
                </div>
                <span style={{ fontSize: 10, color: isToday ? C.green : C.muted, fontWeight: isToday ? 700 : 400 }}>{day.label}</span>
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
          <div style={{ flex: 1, borderTop: `1px dashed ${C.border}` }}/>
          <span style={{ fontSize: 10, color: C.muted, whiteSpace: "nowrap" }}>Target {target} kcal</span>
          <div style={{ flex: 1, borderTop: `1px dashed ${C.border}` }}/>
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 10, justifyContent: "center" }}>
          {[{ color: C.green, label: "On target" }, { color: C.sage, label: "Under" }, { color: C.error, label: "Over" }].map(l => (
            <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: l.color }}/>
              <span style={{ fontSize: 10, color: C.muted }}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Female: cycle phase insights */}
      {profile?.sex === "female" && cyclePhase && (
        <div style={{ ...card }}>
          <SectionHeader
            title="Cycle Phase Insights"
            sub={`${cyclePhase.label} phase · Day ${cyclePhase.day}`}
            open={open.cycle}
            onToggle={() => tog("cycle")}
            accent
          />
          <Collapsible open={open.cycle}>
            <div style={{ padding: "0 18px 18px" }}>
              <div style={{ borderLeft: `3px solid ${cyclePhase.color}`, paddingLeft: 12, marginBottom: 16 }}>
                <p style={{ fontSize: 13, color: C.text, lineHeight: 1.7, margin: 0 }}>{cyclePhase.tip}</p>
              </div>
              <p style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" }}>Best foods this phase</p>
              {(CYCLE_NUTRITION[cyclePhase.phase]?.foods || []).map((f, i, arr) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0", borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : "none" }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", backgroundColor: cyclePhase.color, flexShrink: 0 }}/>
                  <span style={{ fontSize: 13, color: C.text }}>{f}</span>
                </div>
              ))}
              {CYCLE_NUTRITION[cyclePhase.phase]?.avoid && (
                <div style={{ backgroundColor: C.errorBg, borderRadius: 10, padding: "10px 12px", marginTop: 12 }}>
                  <p style={{ fontSize: 12, color: C.error, margin: 0, lineHeight: 1.6 }}>
                    <strong>Limit:</strong> {CYCLE_NUTRITION[cyclePhase.phase].avoid}
                  </p>
                </div>
              )}
            </div>
          </Collapsible>
        </div>
      )}

      {/* Male: performance timing */}
      {profile?.sex === "male" && (
        <div style={{ ...card }}>
          <SectionHeader
            title="Performance Windows"
            sub="Optimise training & nutrition by the clock"
            open={open.male}
            onToggle={() => tog("male")}
            accent
          />
          <Collapsible open={open.male}>
            <div style={{ padding: "0 18px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
              {MALE_WINDOWS.map((w, i) => (
                <div key={i} style={{ borderLeft: `3px solid ${C.green}`, paddingLeft: 12, paddingTop: 2, paddingBottom: 2 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3, flexWrap: "wrap", gap: 4 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: C.text, margin: 0 }}>{w.title}</p>
                    <span style={{ fontSize: 10, color: C.muted, backgroundColor: C.greenLight, padding: "2px 8px", borderRadius: 20 }}>{w.time}</span>
                  </div>
                  <p style={{ fontSize: 12, color: C.muted, margin: 0, lineHeight: 1.6 }}>{w.tip}</p>
                </div>
              ))}
            </div>
          </Collapsible>
        </div>
      )}

      {/* Circadian rhythm */}
      <div style={{ ...card }}>
        <SectionHeader
          title="Circadian Rhythm"
          sub={sun ? `Sunrise ${sun.sunrise} · Sunset ${sun.sunset}` : "Align eating with your body clock"}
          open={open.circadian}
          onToggle={() => tog("circadian")}
          accent
        />
        <Collapsible open={open.circadian}>
          <div style={{ padding: "0 18px 18px", display: "flex", flexDirection: "column" }}>
            {CIRCADIAN_INFO.map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 12, padding: "11px 0", borderBottom: i < CIRCADIAN_INFO.length - 1 ? `1px solid ${C.border}` : "none" }}>
                <span style={{ fontSize: 20, flexShrink: 0, lineHeight: 1.5 }}>{item.icon}</span>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: C.text, margin: 0 }}>{item.title}</p>
                    <span style={{ fontSize: 10, color: C.muted }}>{item.time}</span>
                  </div>
                  <p style={{ fontSize: 12, color: C.muted, margin: 0, lineHeight: 1.6 }}>{item.tip}</p>
                </div>
              </div>
            ))}
          </div>
        </Collapsible>
      </div>
    </div>
  );
}
