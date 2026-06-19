import { useState, useEffect, useRef } from "react";
import { db } from "./supabase.js";

const BLOCKS = {
  cuerpo:   { label: "Cuerpo",    icon: "🏋️", color: "#f76a6a", bg: "#2e1a1a" },
  mente:    { label: "Mente",     icon: "🧠", color: "#f7b84a", bg: "#2e2210" },
  negocios: { label: "Negocios",  icon: "💼", color: "#4a9eff", bg: "#1a2535" },
};

const HABITS = [
  { id: "wake",      time: "05:00", icon: "🌅", label: "Levantarse",            block: "cuerpo",   tip: "El 1% de ventaja empieza acá. Mientras otros duermen, vos construís." },
  { id: "breakfast", time: "05:30", icon: "🍳", label: "Desayuno",              block: "cuerpo",   tip: "Proteínas en el desayuno = menos hambre y más energía durante todo el día." },
  { id: "creatina",  time: "05:45", icon: "💊", label: "Creatina",              block: "cuerpo",   tip: "Consistencia > dosis perfecta. Todos los días, sin excepción." },
  { id: "agua1",     time: "07:30", icon: "💧", label: "Tomar agua",            block: "cuerpo",   tip: "2–3 litros por día. La deshidratación leve baja la concentración un 20%." },
  { id: "almuerzo",  time: "11:30", icon: "🍽️", label: "Almuerzo",             block: "cuerpo",   tip: "Priorizá proteínas y vegetales. El cuerpo lo hacés en la cocina." },
  { id: "gym",       time: "15:00", icon: "🏋️", label: "Entrenar",             block: "cuerpo",   tip: "No entrena el que tiene ganas. Entrena el que tiene disciplina. Entrá igual." },
  { id: "agua2",     time: "17:00", icon: "💧", label: "Agua (2do aviso)",      block: "cuerpo",   tip: "Hidratación post-entreno es clave para la recuperación muscular." },
  { id: "merienda",  time: "17:30", icon: "🥪", label: "Merienda",              block: "cuerpo",   tip: "Momento ideal para carbohidratos post-entreno. Recargá glucógeno." },
  { id: "skincare",  time: "19:00", icon: "🧴", label: "Skincare",              block: "cuerpo",   tip: "Presentación es parte del juego. Cuídate como si fueras tu propio brand." },
  { id: "cena",      time: "20:00", icon: "🍽️", label: "Cena",                 block: "cuerpo",   tip: "Liviano y proteico. El cuerpo repara músculo mientras dormís." },
  { id: "sleep",     time: "21:30", icon: "😴", label: "Prepararse para dormir",block: "cuerpo",   tip: "8 horas = hormona de crecimiento, recuperación, buenas decisiones. No es opcional." },
  { id: "portugues", time: "08:00", icon: "🇧🇷", label: "Portugués (30 min)",  block: "mente",    tip: "30 minutos diarios = 180 horas al año. En enero llegás a Fortaleza con otro nivel." },
  { id: "ingles",    time: "09:00", icon: "🇬🇧", label: "Inglés (30 min)",     block: "mente",    tip: "El inglés B2 te abre roles remotos internacionales. Cada sesión cuenta." },
  { id: "lectura",   time: "21:00", icon: "📚", label: "Lectura",               block: "mente",    tip: "Los CEOs leen en promedio 52 libros al año. 20 páginas por día = 12 libros." },
  { id: "job1",      time: "10:00", icon: "📨", label: "Aplicar a 3 roles",     block: "negocios", tip: "Volumen + calidad. 3 aplicaciones bien dirigidas valen más que 10 genéricas." },
  { id: "saas1",     time: "10:30", icon: "🚛", label: "1 hora Fleet SaaS",     block: "negocios", tip: "Una hora por día sostenida en el tiempo construye el MVP en 30 días." },
  { id: "review",    time: "21:15", icon: "📋", label: "Revisión del día",       block: "negocios", tip: "5 minutos de revisión diaria evitan semanas perdidas. ¿Qué moviste hoy?" },
];

const GOALS = [
  { id: "g1", icon: "💪", label: "Entrenamiento consistente", sub: "Sin saltear días",                        block: "cuerpo" },
  { id: "g2", icon: "🥩", label: "Nutrición controlada",      sub: "Comer bien todos los días",               block: "cuerpo" },
  { id: "g3", icon: "🇧🇷", label: "Portugués fluido",         sub: "30 min diarios hasta enero",              block: "mente" },
  { id: "g4", icon: "🇬🇧", label: "Inglés B2",                sub: "Objetivo: roles remotos internacionales", block: "mente" },
  { id: "g5", icon: "📚", label: "Leer 12 libros",            sub: "20 páginas por día",                      block: "mente" },
  { id: "g6", icon: "💼", label: "Rol remoto",                sub: "Process Automation Specialist — antes de enero", block: "negocios" },
  { id: "g7", icon: "🚛", label: "MVP Fleet SaaS",            sub: "n8n + Supabase — cliente cero confirmado",block: "negocios" },
  { id: "g8", icon: "🇧🇷", label: "Mudanza a Fortaleza",      sub: "Enero 2027",                              block: "negocios" },
];

const QUOTES = [
  "La disciplina es elegir entre lo que querés ahora y lo que querés más.",
  "No construís el futuro descansando. Lo construís haciendo.",
  "Cada hábito que sostenés hoy es un activo que acumula interés.",
  "El éxito no es un evento. Es la suma de días como hoy.",
  "Tu yo de Fortaleza ya está construido. Solo tenés que llegar.",
  "Consistencia > intensidad. Siempre.",
  "Lo que hacés cuando nadie mira define quién sos.",
  "Hoy es otro ladrillo. La pared ya se ve.",
];

const MONTH_NAMES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const toKey = (d) => d.toISOString().slice(0, 10);
const todayKey = () => toKey(new Date());

function ProgressBar({ pct, color = "#7c6af7", height = 4 }) {
  return (
    <div style={{ height, background: "#1e1e30", borderRadius: 4, overflow: "hidden" }}>
      <div style={{ height: "100%", width: pct + "%", background: pct === 100 ? "#4caf75" : color, borderRadius: 4, transition: "width 0.4s ease" }} />
    </div>
  );
}

function BlockProgress({ block, checked }) {
  const habits = HABITS.filter(h => h.block === block);
  const done   = habits.filter(h => checked[h.id]).length;
  const pct    = Math.round((done / habits.length) * 100);
  const b      = BLOCKS[block];
  return (
    <div style={{ flex: 1, background: "#13131f", border: `1px solid ${b.color}30`, borderRadius: 10, padding: "10px 12px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: b.color }}>{b.icon} {b.label}</span>
        <span style={{ fontSize: 11, fontWeight: 800, color: pct === 100 ? "#4caf75" : b.color }}>{done}/{habits.length}</span>
      </div>
      <ProgressBar pct={pct} color={b.color} />
    </div>
  );
}
export default function App() {
  const now = new Date();
  const BG = "#0d0d14", CARD = "#13131f", BORDER = "#1e1e30";

  const [ready,        setReady]        = useState(false);
  const [tab,          setTab]          = useState("hoy");
  const [checked,      setChecked]      = useState({});
  const [streak,       setStreak]       = useState({ count: 0, lastDay: null });
  const [appCount,     setAppCount]     = useState(0);
  const [tip,          setTip]          = useState(null);
  const [saving,       setSaving]       = useState(false);
  const [saved,        setSaved]        = useState(false);
  const [viewYear,     setViewYear]     = useState(now.getFullYear());
  const [viewMonth,    setViewMonth]    = useState(now.getMonth());
  const [monthData,    setMonthData]    = useState({});
  const [monthLoading, setMonthLoading] = useState(false);

  const streakRef = useRef(streak);
  streakRef.current = streak;

  useEffect(() => {
    (async () => {
      const [day, str, apps] = await Promise.all([
        db.getDay(todayKey()),
        db.getStreak(),
        db.getAppCount(),
      ]);
      setChecked(day || {});
      setStreak(str);
      setAppCount(apps || 0);
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    if (tab !== "mes" || !ready) return;
    (async () => {
      setMonthLoading(true);
      const data = await db.getMonth(viewYear, viewMonth);
      const tk = todayKey();
      if (tk.startsWith(`${viewYear}-${String(viewMonth+1).padStart(2,"0")}`)) data[tk] = checked;
      setMonthData(data);
      setMonthLoading(false);
    })();
  }, [tab, viewYear, viewMonth, ready]);

  const toggle = async (id) => {
    const next = { ...checked, [id]: !checked[id] };
    setChecked(next);
    setSaving(true);
    await db.setDay(todayKey(), next);
    const allDone = HABITS.every(h => next[h.id]);
    if (allDone) {
      const tk = todayKey();
      const cur = streakRef.current;
      if (cur.lastDay !== tk) {
        const newStreak = { count: cur.count + 1, lastDay: tk };
        setStreak(newStreak);
        await db.setStreak(newStreak.count, newStreak.lastDay);
      }
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const addApplication = async () => {
    const next = appCount + 1;
    setAppCount(next);
    await db.setAppCount(next);
  };

  const doneCount = HABITS.filter(h => checked[h.id]).length;
  const pct       = Math.round((doneCount / HABITS.length) * 100);
  const quote     = QUOTES[now.getDay() % QUOTES.length];

  const calendarDays = () => {
    const first = new Date(viewYear, viewMonth, 1).getDay();
    const days  = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < first; i++) cells.push(null);
    for (let d = 1; d <= days; d++) cells.push(d);
    return cells;
  };

  const dayPct = (d) => {
    if (!d) return null;
    const k = `${viewYear}-${String(viewMonth+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    const data = monthData[k];
    if (!data) return null;
    return Math.round((HABITS.filter(h => data[h.id]).length / HABITS.length) * 100);
  };

  const monthStats = () => {
    const days = new Date(viewYear, viewMonth + 1, 0).getDate();
    let perfect = 0, total = 0, sum = 0;
    for (let d = 1; d <= days; d++) {
      const p = dayPct(d);
      if (p !== null) { total++; sum += p; if (p === 100) perfect++; }
    }
    return { perfect, total, avg: total ? Math.round(sum / total) : 0 };
  };

  if (!ready) return (
    <div style={{ minHeight: "100vh", background: BG, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#555", fontFamily: "system-ui", gap: 12 }}>
      <div style={{ fontSize: 32 }}>⚡</div>
      <div style={{ fontSize: 13 }}>Conectando...</div>
    </div>
  );

  const stats = tab === "mes" ? monthStats() : null;

  return (
    <div style={{ minHeight: "100vh", background: BG, color: "#e8e8f0", fontFamily: "'Inter', system-ui, sans-serif", paddingBottom: 48 }}>

      <div style={{ background: "linear-gradient(160deg, #12121e, #1a1a2e)", borderBottom: "1px solid " + BORDER, padding: "20px 16px 0" }}>
        <div style={{ maxWidth: 480, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 9, color: "#7c6af7", fontWeight: 800, letterSpacing: 3, textTransform: "uppercase", marginBottom: 4 }}>
                Sistema Lucas <span style={{ color: "#4caf75", fontSize: 8 }}>● live</span>
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.2 }}>
                {now.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: "#7c6af7", lineHeight: 1 }}>{streak.count}</div>
              <div style={{ fontSize: 9, color: "#555", textTransform: "uppercase", letterSpacing: 1 }}>racha</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            {Object.keys(BLOCKS).map(b => <BlockProgress key={b} block={b} checked={checked} />)}
          </div>

          <div style={{ marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 10, color: "#555" }}>Total: {doneCount}/{HABITS.length}</span>
              <span style={{ fontSize: 10, fontWeight: 800, color: pct === 100 ? "#4caf75" : "#7c6af7" }}>{pct}%</span>
            </div>
            <ProgressBar pct={pct} color="#7c6af7" height={3} />
          </div>

          <div style={{ padding: "8px 0 12px", fontSize: 10, color: "#555", fontStyle: "italic", borderTop: "1px solid " + BORDER, marginTop: 8 }}>"{quote}"</div>

          <div style={{ height: 14, display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
            {saving && <span style={{ fontSize: 10, color: "#555" }}>guardando...</span>}
            {saved  && <span style={{ fontSize: 10, color: "#4caf75", fontWeight: 700 }}>✓ guardado</span>}
          </div>

          <div style={{ display: "flex", gap: 2 }}>
            {["hoy", "metas", "mes", "progreso"].map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                flex: 1, padding: "8px 0",
                background: tab === t ? "#7c6af7" : "transparent",
                color: tab === t ? "#fff" : "#555",
                border: "none", borderRadius: "8px 8px 0 0",
                fontSize: 11, fontWeight: 700, cursor: "pointer", textTransform: "uppercase", letterSpacing: 1,
              }}>{t}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "16px 16px 0" }}>

        {tab === "hoy" && (
          <div>
            {pct === 100 && (
              <div style={{ background: "#0d2a1a", border: "1px solid #4caf75", borderRadius: 12, padding: 14, marginBottom: 14, textAlign: "center" }}>
                <div style={{ fontSize: 24, marginBottom: 4 }}>🔥</div>
                <div style={{ fontWeight: 800, color: "#4caf75", fontSize: 14 }}>Día completo — racha: {streak.count} días</div>
                <div style={{ fontSize: 11, color: "#4caf7580", marginTop: 3 }}>Cada día así te acerca más a Fortaleza.</div>
              </div>
            )}
            {Object.entries(BLOCKS).map(([blockKey, blockData]) => {
              const blockHabits = HABITS.filter(h => h.block === blockKey);
              const done = blockHabits.filter(h => checked[h.id]).length;
              return (
                <div key={blockKey} style={{ marginBottom: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, paddingBottom: 8, borderBottom: `1px solid ${blockData.color}30` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 16 }}>{blockData.icon}</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: blockData.color, textTransform: "uppercase", letterSpacing: 1 }}>{blockData.label}</span>
                    </div>
                    <span style={{ fontSize: 11, color: done === blockHabits.length ? "#4caf75" : "#555", fontWeight: 700 }}>{done}/{blockHabits.length}</span>
                  </div>
                  {blockKey === "negocios" && (
                    <div style={{ background: "#1a2535", border: "1px solid #4a9eff30", borderRadius: 12, padding: "12px 14px", marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div>
                        <div style={{ fontSize: 11, color: "#4a9eff", fontWeight: 700 }}>📨 Aplicaciones enviadas</div>
                        <div style={{ fontSize: 9, color: "#555", marginTop: 2 }}>Total acumulado</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ fontSize: 28, fontWeight: 900, color: "#4a9eff" }}>{appCount}</div>
                        <button onClick={addApplication} style={{ background: "#4a9eff", border: "none", color: "#fff", borderRadius: 8, padding: "6px 12px", fontSize: 18, cursor: "pointer", fontWeight: 900, lineHeight: 1 }}>+</button>
                      </div>
                    </div>
                  )}
                  <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    {blockHabits.map(h => {
                      const done = !!checked[h.id];
                      const open = tip === h.id;
                      return (
                        <div key={h.id} style={{ background: done ? blockData.bg : CARD, border: `1px solid ${done ? blockData.color + "55" : BORDER}`, borderRadius: 12, overflow: "hidden" }}>
                          <div style={{ display: "flex", alignItems: "center", padding: "12px 12px", gap: 12, cursor: "pointer" }} onClick={() => toggle(h.id)}>
                            <div style={{ width: 24, height: 24, borderRadius: "50%", border: `2px solid ${done ? blockData.color : "#333"}`, background: done ? blockData.color : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#fff", fontWeight: 800, fontSize: 12 }}>
                              {done ? "✓" : ""}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                                <span style={{ fontSize: 14 }}>{h.icon}</span>
                                <span style={{ fontWeight: 700, fontSize: 13, textDecoration: done ? "line-through" : "none", color: done ? "#555" : "#e8e8f0" }}>{h.label}</span>
                              </div>
                              <div style={{ fontSize: 9, color: "#444", marginTop: 2 }}>{h.time}hs</div>
                            </div>
                            <button onClick={e => { e.stopPropagation(); setTip(open ? null : h.id); }} style={{ background: "none", border: "none", color: "#444", fontSize: 11, cursor: "pointer", padding: "0 4px" }}>
                              {open ? "▲" : "▼"}
                            </button>
                          </div>
                          {open && <div style={{ padding: "0 12px 12px 50px", fontSize: 11, color: blockData.color, lineHeight: 1.6 }}>💡 {h.tip}</div>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === "metas" && (
          <div>
            {Object.entries(BLOCKS).map(([blockKey, blockData]) => {
              const blockGoals = GOALS.filter(g => g.block === blockKey);
              return (
                <div key={blockKey} style={{ marginBottom: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, paddingBottom: 8, borderBottom: `1px solid ${blockData.color}30` }}>
                    <span style={{ fontSize: 15 }}>{blockData.icon}</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: blockData.color, textTransform: "uppercase", letterSpacing: 1 }}>{blockData.label}</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {blockGoals.map(g => (
                      <div key={g.id} style={{ background: blockData.bg, border: `1px solid ${blockData.color}30`, borderLeft: `3px solid ${blockData.color}`, borderRadius: 12, padding: "12px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontSize: 18 }}>{g.icon}</span>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 13 }}>{g.label}</div>
                            <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>{g.sub}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === "mes" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <button onClick={() => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y-1); } else setViewMonth(m => m-1); }} style={{ background: CARD, border: "1px solid " + BORDER, color: "#aaa", borderRadius: 8, padding: "6px 16px", cursor: "pointer", fontSize: 16 }}>‹</button>
              <div style={{ fontWeight: 800, fontSize: 15 }}>{MONTH_NAMES[viewMonth]} {viewYear}</div>
              <button onClick={() => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y+1); } else setViewMonth(m => m+1); }} style={{ background: CARD, border: "1px solid " + BORDER, color: "#aaa", borderRadius: 8, padding: "6px 16px", cursor: "pointer", fontSize: 16 }}>›</button>
            </div>
            {stats && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
                {[{ label: "Rastreados", val: stats.total }, { label: "Perfectos", val: stats.perfect, color: "#4caf75" }, { label: "Promedio", val: stats.avg + "%", color: "#7c6af7" }].map(s => (
                  <div key={s.label} style={{ background: CARD, border: "1px solid " + BORDER, borderRadius: 10, padding: "10px 8px", textAlign: "center" }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: s.color || "#e8e8f0" }}>{s.val}</div>
                    <div style={{ fontSize: 9, color: "#555", textTransform: "uppercase", letterSpacing: 1, marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3, marginBottom: 4 }}>
              {["Do","Lu","Ma","Mi","Ju","Vi","Sa"].map(d => <div key={d} style={{ textAlign: "center", fontSize: 9, color: "#444", fontWeight: 700 }}>{d}</div>)}
            </div>
            {monthLoading ? <div style={{ textAlign: "center", color: "#444", padding: 30 }}>Cargando...</div> : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3 }}>
                {calendarDays().map((d, i) => {
                  const p = dayPct(d);
                  const isToday = d && todayKey() === `${viewYear}-${String(viewMonth+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
                  const bg  = !d ? "transparent" : p === null ? CARD : p === 100 ? "#1a3a20" : p >= 60 ? "#1e1b3a" : p >= 30 ? "#2a1a1a" : "#1a1a1a";
                  const dot = p === null ? null : p === 100 ? "#4caf75" : p >= 60 ? "#7c6af7" : p >= 30 ? "#f76a6a" : "#444";
                  return (
                    <div key={i} style={{ aspectRatio: "1", background: bg, border: d ? `1px solid ${isToday ? "#7c6af7" : BORDER}` : "none", borderRadius: 8, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2 }}>
                      {d && <>
                        <div style={{ fontSize: 11, fontWeight: isToday ? 800 : 400, color: isToday ? "#7c6af7" : "#777" }}>{d}</div>
                        {dot && <div style={{ width: 5, height: 5, borderRadius: "50%", background: dot }} />}
                        {p !== null && <div style={{ fontSize: 7, color: dot, fontWeight: 700 }}>{p}%</div>}
                      </>}
                    </div>
                  );
                })}
              </div>
            )}
            <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
              {[{ color: "#4caf75", label: "100% perfecto" }, { color: "#7c6af7", label: "60%+ bueno" }, { color: "#f76a6a", label: "30%+ parcial" }, { color: "#444", label: "< 30%" }].map(l => (
                <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "#555" }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: l.color }} />
                  {l.label}
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "progreso" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
              <div style={{ background: CARD, border: "1px solid " + BORDER, borderRadius: 12, padding: 16, textAlign: "center" }}>
                <div style={{ fontSize: 32, fontWeight: 900, color: "#7c6af7" }}>{streak.count}</div>
                <div style={{ fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: 1 }}>Racha</div>
              </div>
              <div style={{ background: CARD, border: "1px solid " + BORDER, borderRadius: 12, padding: 16, textAlign: "center" }}>
                <div style={{ fontSize: 32, fontWeight: 900, color: "#4a9eff" }}>{appCount}</div>
                <div style={{ fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: 1 }}>Aplicaciones</div>
              </div>
            </div>
            {Object.entries(BLOCKS).map(([blockKey, blockData]) => {
              const blockHabits = HABITS.filter(h => h.block === blockKey);
              const done = blockHabits.filter(h => checked[h.id]).length;
              const p = Math.round((done / blockHabits.length) * 100);
              return (
                <div key={blockKey} style={{ background: CARD, border: "1px solid " + BORDER, borderRadius: 12, padding: 14, marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: blockData.color }}>{blockData.icon} {blockData.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: p === 100 ? "#4caf75" : blockData.color }}>{done}/{blockHabits.length}</span>
                  </div>
                  <ProgressBar pct={p} color={blockData.color} height={6} />
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
