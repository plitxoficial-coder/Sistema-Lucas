import { useState, useEffect, useRef } from "react";
import { db } from "./supabase.js";

const BLOCKS = {
  cuerpo:   { label: "Cuerpo",   icon: "🏋️", color: "#f76a6a", bg: "#1a0f0f" },
  mente:    { label: "Mente",    icon: "🧠", color: "#f7b84a", bg: "#1a1200" },
  negocios: { label: "Negocios", icon: "💼", color: "#4a9eff", bg: "#0f1820" },
};

const HABITS = [
  { id: "wake",      icon: "🌅", label: "Levantarse temprano",  block: "cuerpo",   tip: "El día empieza antes que todos. Esa ventaja se acumula." },
  { id: "creatina",  icon: "💊", label: "Creatina",             block: "cuerpo",   tip: "Consistencia > dosis perfecta. Todos los días, sin excepción." },
  { id: "agua",      icon: "💧", label: "Agua (2L+)",           block: "cuerpo",   tip: "Deshidratación leve baja la concentración un 20%. Simple y gratis." },
  { id: "gym",       icon: "🏋️", label: "Entrenar",            block: "cuerpo",   tip: "No entrena el que tiene ganas. Entrena el que tiene disciplina." },
  { id: "skincare",  icon: "🧴", label: "Skincare",             block: "cuerpo",   tip: "Cuídate como si fueras tu propio brand." },
  { id: "nutricion", icon: "🥗", label: "Nutrición cumplida",   block: "cuerpo",   tip: "¿Comiste bien hoy? Sé honesto. El cuerpo se construye en la cocina." },
  { id: "sleep",     icon: "😴", label: "Dormir a tiempo",      block: "cuerpo",   tip: "8 horas = hormona de crecimiento, recuperación, buenas decisiones." },
  { id: "idiomas",   icon: "🗣️", label: "Idiomas (45 min)",    block: "mente",    tip: "Alternás portugués e inglés. Dos idiomas, dos mercados, dos futuros." },
  { id: "lectura",   icon: "📚", label: "Lectura",              block: "mente",    tip: "20 páginas por día = 12 libros por año. 15 minutos que cambian perspectivas." },
  { id: "job",       icon: "💼", label: "Búsqueda laboral",     block: "negocios", tip: "Aplicar, investigar, mejorar CV, hacer networking. Algo concreto cada día." },
  { id: "zentrai",   icon: "⚡", label: "1 hora Zentrai",       block: "negocios", tip: "Outreach, propuesta o seguimiento. El primer cliente empieza con un mensaje." },
  { id: "review",    icon: "📋", label: "Revisión del día",     block: "negocios", tip: "5 minutos para cerrar el loop. ¿Qué moviste hoy? ¿Qué faltó?" },
];

const GOALS = [
  { id: "g1", icon: "💪", label: "Cuerpo optimizado",          sub: "Entrenamiento + nutrición consistentes",        block: "cuerpo" },
  { id: "g2", icon: "😴", label: "Sueño y recuperación",       sub: "8 horas diarias sin negociar",                  block: "cuerpo" },
  { id: "g3", icon: "🗣️", label: "Portugués fluido",           sub: "Funcional para vivir en Fortaleza — enero 2027",block: "mente" },
  { id: "g4", icon: "🇬🇧", label: "Inglés B2",                 sub: "Roles remotos internacionales",                 block: "mente" },
  { id: "g5", icon: "📚", label: "Leer 12 libros",             sub: "20 páginas por día",                            block: "mente" },
  { id: "g6", icon: "💼", label: "Rol remoto",                 sub: "Process Automation Specialist — antes de enero",block: "negocios" },
  { id: "g7", icon: "⚡", label: "Zentrai — primer cliente",   sub: "Servicio de automatización de operaciones",     block: "negocios" },
  { id: "g8", icon: "🇧🇷", label: "Mudanza a Fortaleza",       sub: "Enero 2027 con USD 3.000+ de reserva",          block: "negocios" },
];

const EXPENSE_CATS = ["Comida", "Transporte", "Salud", "Ropa", "Entretenimiento", "Servicios", "Otro"];
const INCOME_CATS  = ["Fiorino", "Zentrai", "Sueldo", "Freelance", "Otro"];
const MONTH_NAMES  = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const QUOTES = [
  "La disciplina es elegir entre lo que querés ahora y lo que querés más.",
  "No construís el futuro descansando. Lo construís haciendo.",
  "Cada hábito que sostenés hoy es un activo que acumula interés.",
  "El éxito no es un evento. Es la suma de días como hoy.",
  "Tu yo de Fortaleza ya está construido. Solo tenés que llegar.",
  "Consistencia > intensidad. Siempre.",
  "Lo que hacés cuando nadie mira define quién sos.",
  "Hoy es otro ladrillo. La pared ya se ve.",
  "Zentrai empieza con un solo cliente. Ese cliente empieza hoy.",
];

const toKey    = (d) => d.toISOString().slice(0, 10);
const todayKey = () => toKey(new Date());
const fmtARS   = (n) => `$${Math.round(n).toLocaleString("es-AR")}`;
const fmtUSD   = (n) => `U$D ${n.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

function ProgressBar({ pct, color = "#7c6af7", height = 4 }) {
  return (
    <div style={{ height, background: "#ffffff08", borderRadius: 4, overflow: "hidden" }}>
      <div style={{ height: "100%", width: Math.min(pct, 100) + "%", background: pct >= 100 ? "#4caf75" : color, borderRadius: 4, transition: "width 0.4s ease" }} />
    </div>
  );
}

function BlockProgress({ block, checked }) {
  const habits = HABITS.filter(h => h.block === block);
  const done   = habits.filter(h => checked[h.id]).length;
  const pct    = Math.round((done / habits.length) * 100);
  const b      = BLOCKS[block];
  return (
    <div style={{ flex: 1, background: "#ffffff05", borderRadius: 10, padding: "10px 12px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: b.color }}>{b.icon} {b.label}</span>
        <span style={{ fontSize: 11, fontWeight: 800, color: pct === 100 ? "#4caf75" : b.color }}>{done}/{habits.length}</span>
      </div>
      <ProgressBar pct={pct} color={b.color} />
    </div>
  );
}

function DayEditModal({ day, onClose }) {
  const CARD = "#13131f";
  const [checked, setChecked] = useState({});
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => { const d = await db.getDay(day); setChecked(d || {}); setLoading(false); })();
  }, [day]);

  const toggle = async (id) => {
    const next = { ...checked, [id]: !checked[id] };
    setChecked(next); setSaving(true);
    await db.setDay(day, next);
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 1200);
  };

  const doneCount = HABITS.filter(h => checked[h.id]).length;
  const pct = Math.round((doneCount / HABITS.length) * 100);
  const [y, m, d] = day.split("-");

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000000dd", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: "#12121e", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 480, maxHeight: "85vh", overflowY: "auto", padding: "20px 16px 40px" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 9, color: "#7c6af7", fontWeight: 800, textTransform: "uppercase", letterSpacing: 2 }}>Editando día</div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{parseInt(d)}/{parseInt(m)}/{y}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {saving && <span style={{ fontSize: 10, color: "#555" }}>guardando...</span>}
            {saved  && <span style={{ fontSize: 10, color: "#4caf75", fontWeight: 700 }}>✓</span>}
            <button onClick={onClose} style={{ background: "#ffffff0f", border: "none", color: "#aaa", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 13 }}>✕ Cerrar</button>
          </div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 10, color: "#555" }}>{doneCount}/{HABITS.length}</span>
            <span style={{ fontSize: 10, fontWeight: 800, color: pct === 100 ? "#4caf75" : "#7c6af7" }}>{pct}%</span>
          </div>
          <ProgressBar pct={pct} height={3} />
        </div>
        {loading ? <div style={{ textAlign: "center", color: "#444", padding: 30 }}>Cargando...</div> : (
          Object.entries(BLOCKS).map(([bk, bd]) => (
            <div key={bk} style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: bd.color, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, paddingBottom: 6, borderBottom: `1px solid ${bd.color}20` }}>
                {bd.icon} {bd.label}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {HABITS.filter(h => h.block === bk).map(h => {
                  const done = !!checked[h.id];
                  return (
                    <div key={h.id} onClick={() => toggle(h.id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: done ? bd.bg : CARD, borderRadius: 10, cursor: "pointer" }}>
                      <div style={{ width: 22, height: 22, borderRadius: "50%", border: `2px solid ${done ? bd.color : "#333"}`, background: done ? bd.color : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#fff", fontWeight: 800, fontSize: 11 }}>
                        {done ? "✓" : ""}
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: done ? "#555" : "#e8e8f0", textDecoration: done ? "line-through" : "none" }}>{h.icon} {h.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
function FinanceTab({ db }) {
  const now = new Date();
  const [transactions, setTransactions] = useState([]);
  const [settings, setSettings]         = useState({ usd_goal: 3000, usd_saved: 0, exchange_rate: 1000 });
  const [loading, setLoading]           = useState(true);
  const [showForm, setShowForm]         = useState(false);
  const [formType, setFormType]         = useState("gasto");
  const [formAmount, setFormAmount]     = useState("");
  const [formCat, setFormCat]           = useState("Otro");
  const [formDesc, setFormDesc]         = useState("");
  const [saving, setSaving]             = useState(false);
  const [editingSettings, setEditingSettings] = useState(false);
  const [newRate, setNewRate]           = useState("");
  const [newSaved, setNewSaved]         = useState("");
  const [newGoal, setNewGoal]           = useState("");

  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const CARD = "#13131f";

  useEffect(() => {
    (async () => {
      const [txs, cfg] = await Promise.all([db.getTransactions(monthKey), db.getFinanceSettings()]);
      setTransactions(txs || []);
      setSettings(cfg || { usd_goal: 3000, usd_saved: 0, exchange_rate: 1000 });
      setLoading(false);
    })();
  }, []);

  const ingresos = transactions.filter(t => t.type === "ingreso").reduce((s, t) => s + Number(t.amount), 0);
  const gastos   = transactions.filter(t => t.type === "gasto").reduce((s, t) => s + Number(t.amount), 0);
  const balance  = ingresos - gastos;
  const usdBalance = balance / settings.exchange_rate;
  const usdSaved   = Number(settings.usd_saved);
  const usdGoal    = Number(settings.usd_goal);
  const usdPct     = Math.round((usdSaved / usdGoal) * 100);
  const weeksLeft  = Math.round((new Date("2027-01-07") - now) / (7 * 24 * 60 * 60 * 1000));

  const addTransaction = async () => {
    if (!formAmount || isNaN(Number(formAmount))) return;
    setSaving(true);
    const tx = { type: formType, amount: Number(formAmount), category: formCat, description: formDesc, date: monthKey };
    const saved = await db.addTransaction(tx);
    if (saved) setTransactions(prev => [saved, ...prev]);
    setFormAmount(""); setFormDesc(""); setShowForm(false);
    setSaving(false);
  };

  const deleteTransaction = async (id) => {
    await db.deleteTransaction(id);
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const saveSettings = async () => {
    const updated = {
      ...settings,
      exchange_rate: newRate ? Number(newRate) : settings.exchange_rate,
      usd_saved: newSaved ? Number(newSaved) : settings.usd_saved,
      usd_goal: newGoal ? Number(newGoal) : settings.usd_goal,
    };
    await db.setFinanceSettings(updated);
    setSettings(updated);
    setEditingSettings(false);
    setNewRate(""); setNewSaved(""); setNewGoal("");
  };

  if (loading) return <div style={{ textAlign: "center", color: "#444", padding: 40 }}>Cargando...</div>;

  return (
    <div>
      {/* Meta Fortaleza */}
      <div style={{ background: "linear-gradient(135deg, #0f1a10, #0a1a0a)", borderRadius: 14, padding: 16, marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 9, color: "#4caf75", fontWeight: 800, textTransform: "uppercase", letterSpacing: 2, marginBottom: 4 }}>🇧🇷 Meta Fortaleza</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: "#4caf75" }}>{fmtUSD(usdSaved)}</div>
            <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>de {fmtUSD(usdGoal)} objetivo</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#4caf75" }}>{usdPct}%</div>
            <div style={{ fontSize: 10, color: "#555" }}>{weeksLeft} semanas</div>
          </div>
        </div>
        <ProgressBar pct={usdPct} color="#4caf75" height={6} />
      </div>

      {/* Balance del mes */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
        {[
          { label: "Ingresos", val: fmtARS(ingresos), color: "#4caf75" },
          { label: "Gastos",   val: fmtARS(gastos),   color: "#f76a6a" },
          { label: "Balance",  val: fmtARS(balance),  color: balance >= 0 ? "#4caf75" : "#f76a6a" },
        ].map(s => (
          <div key={s.label} style={{ background: CARD, borderRadius: 10, padding: "10px 8px", textAlign: "center" }}>
            <div style={{ fontSize: 13, fontWeight: 900, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 9, color: "#555", textTransform: "uppercase", letterSpacing: 1, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* USD del mes */}
      <div style={{ background: CARD, borderRadius: 12, padding: "12px 14px", marginBottom: 12 }}>
        <div style={{ fontSize: 10, color: "#7c6af7", fontWeight: 700, marginBottom: 4 }}>Balance en USD (TC: ${settings.exchange_rate.toLocaleString("es-AR")})</div>
        <div style={{ fontSize: 20, fontWeight: 900, color: usdBalance >= 0 ? "#4caf75" : "#f76a6a" }}>{fmtUSD(usdBalance)}</div>
        <div style={{ fontSize: 10, color: "#555", marginTop: 2 }}>Este mes podés sumar al ahorro</div>
      </div>

      {/* Botones */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button onClick={() => setShowForm(!showForm)} style={{ flex: 1, background: "#7c6af7", border: "none", color: "#fff", borderRadius: 10, padding: "12px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
          {showForm ? "✕ Cancelar" : "+ Agregar movimiento"}
        </button>
        <button onClick={() => setEditingSettings(!editingSettings)} style={{ background: "#ffffff08", border: "none", color: "#777", borderRadius: 10, padding: "12px 14px", fontSize: 16, cursor: "pointer" }}>⚙️</button>
      </div>

      {/* Configuración */}
      {editingSettings && (
        <div style={{ background: CARD, borderRadius: 12, padding: 14, marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: "#7c6af7", fontWeight: 700, marginBottom: 10 }}>Configuración</div>
          {[
            { label: "Tipo de cambio (ARS/USD)", val: newRate, set: setNewRate, placeholder: settings.exchange_rate },
            { label: "USD ahorrados hasta hoy", val: newSaved, set: setNewSaved, placeholder: settings.usd_saved },
            { label: "Meta en USD", val: newGoal, set: setNewGoal, placeholder: settings.usd_goal },
          ].map(f => (
            <div key={f.label} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 10, color: "#666", marginBottom: 4 }}>{f.label}</div>
              <input value={f.val} onChange={e => f.set(e.target.value)} placeholder={String(f.placeholder)}
                style={{ width: "100%", background: "#0d0d14", border: "none", borderRadius: 8, padding: "8px 10px", color: "#e8e8f0", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
            </div>
          ))}
          <button onClick={saveSettings} style={{ width: "100%", background: "#4caf75", border: "none", color: "#fff", borderRadius: 8, padding: "10px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Guardar</button>
        </div>
      )}

      {/* Formulario */}
      {showForm && (
        <div style={{ background: CARD, borderRadius: 12, padding: 14, marginBottom: 12 }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
            {["ingreso", "gasto"].map(t => (
              <button key={t} onClick={() => { setFormType(t); setFormCat(t === "ingreso" ? "Fiorino" : "Comida"); }} style={{
                flex: 1, padding: "8px", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12,
                background: formType === t ? (t === "ingreso" ? "#4caf75" : "#f76a6a") : "#ffffff0f",
                color: formType === t ? "#fff" : "#666",
              }}>{t === "ingreso" ? "💰 Ingreso" : "💸 Gasto"}</button>
            ))}
          </div>
          <input value={formAmount} onChange={e => setFormAmount(e.target.value)} placeholder="Monto en ARS"
            type="number" style={{ width: "100%", background: "#0d0d14", border: "none", borderRadius: 8, padding: "10px", color: "#e8e8f0", fontSize: 14, outline: "none", marginBottom: 8, boxSizing: "border-box" }} />
          <select value={formCat} onChange={e => setFormCat(e.target.value)}
            style={{ width: "100%", background: "#0d0d14", border: "none", borderRadius: 8, padding: "10px", color: "#e8e8f0", fontSize: 13, outline: "none", marginBottom: 8, boxSizing: "border-box" }}>
            {(formType === "ingreso" ? INCOME_CATS : EXPENSE_CATS).map(c => <option key={c}>{c}</option>)}
          </select>
          <input value={formDesc} onChange={e => setFormDesc(e.target.value)} placeholder="Descripción (opcional)"
            style={{ width: "100%", background: "#0d0d14", border: "none", borderRadius: 8, padding: "10px", color: "#e8e8f0", fontSize: 13, outline: "none", marginBottom: 12, boxSizing: "border-box" }} />
          <button onClick={addTransaction} disabled={saving} style={{ width: "100%", background: formType === "ingreso" ? "#4caf75" : "#f76a6a", border: "none", color: "#fff", borderRadius: 8, padding: "12px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            {saving ? "Guardando..." : `Agregar ${formType}`}
          </button>
        </div>
      )}

      {/* Lista */}
      <div style={{ fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
        Movimientos de {MONTH_NAMES[now.getMonth()]}
      </div>
      {transactions.length === 0 ? (
        <div style={{ textAlign: "center", color: "#333", padding: 20, fontSize: 13 }}>Sin movimientos este mes</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {transactions.map(t => (
            <div key={t.id} style={{ background: CARD, borderRadius: 10, padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: t.type === "ingreso" ? "#4caf75" : "#f76a6a", flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#e8e8f0" }}>{t.category}{t.description ? ` — ${t.description}` : ""}</div>
                  <div style={{ fontSize: 10, color: "#555", marginTop: 1 }}>{t.type}</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: t.type === "ingreso" ? "#4caf75" : "#f76a6a" }}>
                  {t.type === "ingreso" ? "+" : "-"}{fmtARS(t.amount)}
                </div>
                <button onClick={() => deleteTransaction(t.id)} style={{ background: "none", border: "none", color: "#333", fontSize: 14, cursor: "pointer", padding: "0 2px" }}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
export default function App() {
  const now = new Date();
  const BG = "#0d0d14", CARD = "#13131f";

  const [ready,        setReady]        = useState(false);
  const [tab,          setTab]          = useState("hoy");
  const [checked,      setChecked]      = useState({});
  const [streak,       setStreak]       = useState({ count: 0, lastDay: null });
  const [appCount,     setAppCount]     = useState(0);
  const [tip,          setTip]          = useState(null);
  const [saving,       setSaving]       = useState(false);
  const [saved,        setSaved]        = useState(false);
  const [focusTask,    setFocusTask]    = useState("");
  const [focusInput,   setFocusInput]   = useState("");
  const [editingFocus, setEditingFocus] = useState(false);
  const [notes,        setNotes]        = useState({ cuerpo: "", mente: "", negocios: "" });
  const [editingNote,  setEditingNote]  = useState(null);
  const [noteInput,    setNoteInput]    = useState("");
  const [aiReport,     setAiReport]     = useState("");
  const [aiLoading,    setAiLoading]    = useState(false);
  const [weekData,     setWeekData]     = useState({});
  const [viewYear,     setViewYear]     = useState(now.getFullYear());
  const [viewMonth,    setViewMonth]    = useState(now.getMonth());
  const [monthData,    setMonthData]    = useState({});
  const [monthLoading, setMonthLoading] = useState(false);
  const [editingDay,   setEditingDay]   = useState(null);

  const streakRef = useRef(streak);
  streakRef.current = streak;

  const weeksLeft = Math.round((new Date("2027-01-07") - now) / (7 * 24 * 60 * 60 * 1000));

  useEffect(() => {
    (async () => {
      const tk = todayKey();
      const [day, str, apps, focus, notesData] = await Promise.all([
        db.getDay(tk), db.getStreak(), db.getAppCount(), db.getFocus(tk), db.getNotes(tk),
      ]);
      setChecked(day || {});
      setStreak(str);
      setAppCount(apps || 0);
      setFocusTask(focus || "");
      setNotes(notesData || { cuerpo: "", mente: "", negocios: "" });
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

  useEffect(() => {
    if (tab !== "🤖") return;
    (async () => {
      const obj = {};
      for (let i = 0; i < 7; i++) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const k = toKey(d);
        const data = await db.getDay(k);
        if (data) obj[k] = data;
      }
      setWeekData(obj);
    })();
  }, [tab]);

  const toggle = async (id) => {
    const next = { ...checked, [id]: !checked[id] };
    setChecked(next); setSaving(true);
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
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const saveFocus = async () => {
    setFocusTask(focusInput); setEditingFocus(false);
    await db.setFocus(todayKey(), focusInput);
  };

  const saveNote = async (block) => {
    const next = { ...notes, [block]: noteInput };
    setNotes(next); setEditingNote(null);
    await db.setNotes(todayKey(), next);
  };

  const addApplication    = async () => { const n = appCount + 1; setAppCount(n); await db.setAppCount(n); };
  const removeApplication = async () => { const n = Math.max(0, appCount - 1); setAppCount(n); await db.setAppCount(n); };

  const generateAiReport = async () => {
    setAiLoading(true); setAiReport("");
    const weekSummary = Object.entries(weekData).map(([date, data]) => {
      const done = HABITS.filter(h => data[h.id]).length;
      const pct  = Math.round((done / HABITS.length) * 100);
      const byBlock = Object.keys(BLOCKS).map(b => {
        const bh = HABITS.filter(h => h.block === b);
        return `${BLOCKS[b].label}: ${bh.filter(h => data[h.id]).length}/${bh.length}`;
      }).join(", ");
      return `${date}: ${pct}% (${byBlock})`;
    }).join("\n");

    const prompt = `Sos un coach de alto rendimiento analizando el progreso semanal de Lucas, 25 años, con estos objetivos:
- Lanzar Zentrai: servicio productizado de automatización de operaciones para empresas de transporte. El foco es conseguir el primer cliente pagando.
- Conseguir un rol remoto como Process Automation Specialist antes de enero 2027
- Mudarse a Fortaleza, Brasil en enero 2027 con USD 3.000+ de reserva
- Entrenar consistentemente, comer bien, estudiar idiomas 45 min diarios, leer

Sistema con 3 bloques: Cuerpo (7 hábitos), Mente (2 hábitos), Negocios (3 hábitos).
Aplicaciones laborales enviadas: ${appCount} | Racha actual: ${streak.count} días | Semanas hasta Fortaleza: ${weeksLeft}

Datos de los últimos 7 días:
${weekSummary || "Sin datos suficientes aún"}

Respondé en español con este formato:
**✅ Qué funcionó**
- punto 1
- punto 2

**⚠️ Qué falló o está en riesgo**
- punto 1
- punto 2

**🎯 3 acciones para esta semana**
- acción 1
- acción 2
- acción 3

**💬 Mensaje directo**
Una línea que impacte.`;

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "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",
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1000, messages: [{ role: "user", content: prompt }] }),
      });
      const data = await response.json();
      setAiReport(data.content?.map(c => c.text || "").join("") || "Error al generar.");
    } catch { setAiReport("Error de conexión. Intentá de nuevo."); }
    setAiLoading(false);
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
  const TABS = ["hoy", "metas", "mes", "💰", "progreso", "🤖"];

  return (
    <div style={{ minHeight: "100vh", background: BG, color: "#e8e8f0", fontFamily: "'Inter', system-ui, sans-serif", paddingBottom: 48 }}>

      {editingDay && (
        <DayEditModal day={editingDay} onClose={() => {
          setEditingDay(null);
          if (tab === "mes") db.getMonth(viewYear, viewMonth).then(data => {
            const tk = todayKey();
            if (tk.startsWith(`${viewYear}-${String(viewMonth+1).padStart(2,"0")}`)) data[tk] = checked;
            setMonthData(data);
          });
        }} />
      )}

      <div style={{ background: "linear-gradient(160deg, #12121e, #1a1a2e)", padding: "20px 16px 0", borderBottom: "1px solid #ffffff08" }}>
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
              <div style={{ fontSize: 9, color: "#4caf75", marginTop: 2 }}>{weeksLeft}sem 🇧🇷</div>
            </div>
          </div>

          {(focusTask || editingFocus) && (
            <div style={{ background: "#ffffff06", borderRadius: 10, padding: "10px 12px", marginBottom: 10 }}>
              <div style={{ fontSize: 9, color: "#7c6af7", fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>🎯 Foco del día</div>
              {editingFocus ? (
                <div style={{ display: "flex", gap: 8 }}>
                  <input value={focusInput} onChange={e => setFocusInput(e.target.value)} placeholder="Tu tarea más importante hoy..."
                    style={{ flex: 1, background: "#0d0d14", border: "none", borderRadius: 6, padding: "6px 10px", color: "#e8e8f0", fontSize: 12, outline: "none" }} />
                  <button onClick={saveFocus} style={{ background: "#7c6af7", border: "none", color: "#fff", borderRadius: 6, padding: "6px 12px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>OK</button>
                </div>
              ) : (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{focusTask}</div>
                  <button onClick={() => { setFocusInput(focusTask); setEditingFocus(true); }} style={{ background: "none", border: "none", color: "#555", fontSize: 11, cursor: "pointer" }}>editar</button>
                </div>
              )}
            </div>
          )}
          {!focusTask && !editingFocus && (
            <button onClick={() => { setFocusInput(""); setEditingFocus(true); }} style={{ width: "100%", background: "#ffffff06", border: "none", borderRadius: 10, padding: "10px 12px", color: "#444", fontSize: 12, cursor: "pointer", textAlign: "left", marginBottom: 10 }}>
              🎯 ¿Cuál es tu foco del día?
            </button>
          )}

          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            {Object.keys(BLOCKS).map(b => <BlockProgress key={b} block={b} checked={checked} />)}
          </div>

          <div style={{ marginBottom: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 10, color: "#555" }}>Total: {doneCount}/{HABITS.length}</span>
              <span style={{ fontSize: 10, fontWeight: 800, color: pct === 100 ? "#4caf75" : "#7c6af7" }}>{pct}%</span>
            </div>
            <ProgressBar pct={pct} color="#7c6af7" height={3} />
          </div>

          <div style={{ padding: "8px 0 10px", fontSize: 10, color: "#555", fontStyle: "italic", borderTop: "1px solid #ffffff08", marginTop: 8 }}>"{quote}"</div>

          <div style={{ height: 14, display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
            {saving && <span style={{ fontSize: 10, color: "#555" }}>guardando...</span>}
            {saved  && <span style={{ fontSize: 10, color: "#4caf75", fontWeight: 700 }}>✓ guardado</span>}
          </div>

          <div style={{ display: "flex", gap: 2 }}>
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                flex: 1, padding: "7px 0",
                background: tab === t ? "#7c6af7" : "transparent",
                color: tab === t ? "#fff" : (t === "🤖" ? "#a78bfa" : t === "💰" ? "#4caf75" : "#555"),
                border: "none", borderRadius: "8px 8px 0 0",
                fontSize: ["🤖","💰"].includes(t) ? 14 : 9, fontWeight: 700, cursor: "pointer", textTransform: "uppercase", letterSpacing: 0.5,
              }}>{t}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "16px 16px 0" }}>

        {tab === "hoy" && (
          <div>
            {pct === 100 && (
              <div style={{ background: "#0d2a1a", borderRadius: 12, padding: 14, marginBottom: 14, textAlign: "center" }}>
                <div style={{ fontSize: 24, marginBottom: 4 }}>🔥</div>
                <div style={{ fontWeight: 800, color: "#4caf75", fontSize: 14 }}>Día completo — racha: {streak.count} días</div>
                <div style={{ fontSize: 11, color: "#4caf7560", marginTop: 3 }}>Cada día así te acerca más a Fortaleza.</div>
              </div>
            )}
            {Object.entries(BLOCKS).map(([blockKey, blockData]) => {
              const blockHabits = HABITS.filter(h => h.block === blockKey);
              const done = blockHabits.filter(h => checked[h.id]).length;
              return (
                <div key={blockKey} style={{ marginBottom: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, paddingBottom: 8, borderBottom: `1px solid ${blockData.color}20` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 16 }}>{blockData.icon}</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: blockData.color, textTransform: "uppercase", letterSpacing: 1 }}>{blockData.label}</span>
                    </div>
                    <span style={{ fontSize: 11, color: done === blockHabits.length ? "#4caf75" : "#555", fontWeight: 700 }}>{done}/{blockHabits.length}</span>
                  </div>

                  {blockKey === "negocios" && (
                    <div style={{ background: "#ffffff06", borderRadius: 12, padding: "12px 14px", marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div>
                        <div style={{ fontSize: 11, color: "#4a9eff", fontWeight: 700 }}>📨 Aplicaciones enviadas</div>
                        <div style={{ fontSize: 9, color: "#555", marginTop: 2 }}>Total acumulado</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <button onClick={removeApplication} style={{ background: "#ffffff0f", border: "none", color: "#4a9eff", borderRadius: 8, padding: "6px 12px", fontSize: 18, cursor: "pointer", fontWeight: 900 }}>−</button>
                        <div style={{ fontSize: 28, fontWeight: 900, color: "#4a9eff", minWidth: 36, textAlign: "center" }}>{appCount}</div>
                        <button onClick={addApplication} style={{ background: "#4a9eff", border: "none", color: "#fff", borderRadius: 8, padding: "6px 12px", fontSize: 18, cursor: "pointer", fontWeight: 900 }}>+</button>
                      </div>
                    </div>
                  )}

                  <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    {blockHabits.map(h => {
                      const done = !!checked[h.id];
                      const open = tip === h.id;
                      return (
                        <div key={h.id} style={{ background: done ? blockData.bg : CARD, borderRadius: 12, overflow: "hidden" }}>
                          <div style={{ display: "flex", alignItems: "center", padding: "12px 12px", gap: 12, cursor: "pointer" }} onClick={() => toggle(h.id)}>
                            <div style={{ width: 24, height: 24, borderRadius: "50%", border: `2px solid ${done ? blockData.color : "#333"}`, background: done ? blockData.color : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#fff", fontWeight: 800, fontSize: 12 }}>
                              {done ? "✓" : ""}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                                <span style={{ fontSize: 14 }}>{h.icon}</span>
                                <span style={{ fontWeight: 700, fontSize: 13, textDecoration: done ? "line-through" : "none", color: done ? "#555" : "#e8e8f0" }}>{h.label}</span>
                              </div>
                            </div>
                            <button onClick={e => { e.stopPropagation(); setTip(open ? null : h.id); }} style={{ background: "none", border: "none", color: "#333", fontSize: 11, cursor: "pointer", padding: "0 4px" }}>
                              {open ? "▲" : "▼"}
                            </button>
                          </div>
                          {open && <div style={{ padding: "0 12px 12px 50px", fontSize: 11, color: blockData.color, lineHeight: 1.6 }}>💡 {h.tip}</div>}
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ marginTop: 8 }}>
                    {editingNote === blockKey ? (
                      <div style={{ display: "flex", gap: 8 }}>
                        <input value={noteInput} onChange={e => setNoteInput(e.target.value)} placeholder={`Nota de ${blockData.label.toLowerCase()}...`}
                          style={{ flex: 1, background: CARD, border: "none", borderRadius: 8, padding: "8px 10px", color: "#e8e8f0", fontSize: 12, outline: "none" }} />
                        <button onClick={() => saveNote(blockKey)} style={{ background: blockData.color, border: "none", color: "#fff", borderRadius: 8, padding: "8px 12px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>OK</button>
                        <button onClick={() => setEditingNote(null)} style={{ background: "#ffffff0f", border: "none", color: "#888", borderRadius: 8, padding: "8px 10px", cursor: "pointer", fontSize: 12 }}>✕</button>
                      </div>
                    ) : (
                      <button onClick={() => { setNoteInput(notes[blockKey] || ""); setEditingNote(blockKey); }}
                        style={{ width: "100%", background: "transparent", border: "none", borderRadius: 8, padding: "8px 12px", color: notes[blockKey] ? "#aaa" : "#333", fontSize: 11, cursor: "pointer", textAlign: "left" }}>
                        {notes[blockKey] ? `📝 ${notes[blockKey]}` : `+ Nota de ${blockData.label.toLowerCase()}`}
                      </button>
                    )}
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
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, paddingBottom: 8, borderBottom: `1px solid ${blockData.color}20` }}>
                    <span style={{ fontSize: 15 }}>{blockData.icon}</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: blockData.color, textTransform: "uppercase", letterSpacing: 1 }}>{blockData.label}</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {blockGoals.map(g => (
                      <div key={g.id} style={{ background: blockData.bg, borderLeft: `3px solid ${blockData.color}`, borderRadius: 12, padding: "12px 14px" }}>
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
              <button onClick={() => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y-1); } else setViewMonth(m => m-1); }} style={{ background: "#ffffff08", border: "none", color: "#aaa", borderRadius: 8, padding: "6px 16px", cursor: "pointer", fontSize: 16 }}>‹</button>
              <div style={{ fontWeight: 800, fontSize: 15 }}>{MONTH_NAMES[viewMonth]} {viewYear}</div>
              <button onClick={() => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y+1); } else setViewMonth(m => m+1); }} style={{ background: "#ffffff08", border: "none", color: "#aaa", borderRadius: 8, padding: "6px 16px", cursor: "pointer", fontSize: 16 }}>›</button>
            </div>
            {stats && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
                {[{ label: "Rastreados", val: stats.total }, { label: "Perfectos", val: stats.perfect, color: "#4caf75" }, { label: "Promedio", val: stats.avg + "%", color: "#7c6af7" }].map(s => (
                  <div key={s.label} style={{ background: CARD, borderRadius: 10, padding: "10px 8px", textAlign: "center" }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: s.color || "#e8e8f0" }}>{s.val}</div>
                    <div style={{ fontSize: 9, color: "#555", textTransform: "uppercase", letterSpacing: 1, marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ fontSize: 10, color: "#444", marginBottom: 8, textAlign: "center" }}>Tocá cualquier día para editarlo</div>
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
                    <div key={i} onClick={() => d && setEditingDay(`${viewYear}-${String(viewMonth+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`)}
                      style={{ aspectRatio: "1", background: bg, border: d ? `1px solid ${isToday ? "#7c6af755" : "#ffffff08"}` : "none", borderRadius: 8, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, cursor: d ? "pointer" : "default" }}>
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
              {[{ color: "#4caf75", label: "100%" }, { color: "#7c6af7", label: "60%+" }, { color: "#f76a6a", label: "30%+" }, { color: "#444", label: "<30%" }].map(l => (
                <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "#555" }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: l.color }} />
                  {l.label}
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "💰" && <FinanceTab db={db} />}

        {tab === "progreso" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
              <div style={{ background: CARD, borderRadius: 12, padding: 16, textAlign: "center" }}>
                <div style={{ fontSize: 32, fontWeight: 900, color: "#7c6af7" }}>{streak.count}</div>
                <div style={{ fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: 1 }}>Racha</div>
              </div>
              <div style={{ background: CARD, borderRadius: 12, padding: 16, textAlign: "center" }}>
                <div style={{ fontSize: 32, fontWeight: 900, color: "#4a9eff" }}>{appCount}</div>
                <div style={{ fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: 1 }}>Aplicaciones</div>
              </div>
            </div>
            {Object.entries(BLOCKS).map(([blockKey, blockData]) => {
              const blockHabits = HABITS.filter(h => h.block === blockKey);
              const done = blockHabits.filter(h => checked[h.id]).length;
              const p = Math.round((done / blockHabits.length) * 100);
              return (
                <div key={blockKey} style={{ background: CARD, borderRadius: 12, padding: 14, marginBottom: 10 }}>
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

        {tab === "🤖" && (
          <div>
            <div style={{ fontSize: 10, color: "#a78bfa", fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>🤖 Análisis semanal con IA</div>
            <div style={{ fontSize: 11, color: "#555", marginBottom: 16, lineHeight: 1.6 }}>Basado en tus últimos 7 días — hábitos, racha, aplicaciones y Zentrai.</div>
            {!aiReport && !aiLoading && (
              <button onClick={generateAiReport} style={{ width: "100%", background: "linear-gradient(135deg, #2d1f5e, #1a1a35)", borderRadius: 14, padding: "20px 16px", color: "#e8e8f0", cursor: "pointer", textAlign: "center", border: "none" }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🤖</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#a78bfa", marginBottom: 4 }}>Generar análisis</div>
                <div style={{ fontSize: 11, color: "#666" }}>Claude analiza tu semana y te da 3 acciones concretas</div>
              </button>
            )}
            {aiLoading && (
              <div style={{ background: CARD, borderRadius: 14, padding: 24, textAlign: "center" }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>⚡</div>
                <div style={{ fontSize: 13, color: "#a78bfa" }}>Analizando tu semana...</div>
              </div>
            )}
            {aiReport && !aiLoading && (
              <div>
                <div style={{ background: CARD, borderRadius: 14, padding: 16, marginBottom: 12, lineHeight: 1.7, fontSize: 13, color: "#ccc", whiteSpace: "pre-wrap" }}>{aiReport}</div>
                <button onClick={() => setAiReport("")} style={{ width: "100%", background: "transparent", border: "none", borderRadius: 10, padding: "10px", color: "#444", fontSize: 12, cursor: "pointer" }}>Regenerar análisis</button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
