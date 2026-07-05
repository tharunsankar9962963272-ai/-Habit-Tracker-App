import React, { useState, useMemo } from "react";
import { Check, Flame, ChevronLeft, ChevronRight, Plus, X, Trash2, Calendar, Grid3x3, ListChecks, TrendingUp, TrendingDown, Minus } from "lucide-react";

const DEFAULT_HABITS = [
  "Workout",
  "Study 4 hours",
  "DSA",
  "AI learning",
  "Project work",
  "GitHub commit",
  "Read documentation",
  "Drink 3L water",
  "Sleep 7+ hours",
  "Meditation",
  "No social media while studying",
];

function pad(n) {
  return String(n).padStart(2, "0");
}
function dateKey(y, m, d) {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}
function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}
function fmtMonth(year, month) {
  return new Date(year, month, 1).toLocaleString("default", { month: "long", year: "numeric" });
}
function keyFor(habit, dKey) {
  return `${habit}::${dKey}`;
}

export default function HabitTracker() {
  const today = new Date();
  const todayKey = dateKey(today.getFullYear(), today.getMonth(), today.getDate());

  const [view, setView] = useState("month"); // "month" | "week" | "year"
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [overviewYear, setOverviewYear] = useState(today.getFullYear());
  const [habits, setHabits] = useState(DEFAULT_HABITS);
  const [done, setDone] = useState({});
  const [newHabit, setNewHabit] = useState("");
  const [addingHabit, setAddingHabit] = useState(false);

  const totalDays = daysInMonth(year, month);
  const days = Array.from({ length: totalDays }, (_, i) => i + 1);
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();
  const todayDate = today.getDate();

  const yearRange = useMemo(() => {
    const start = today.getFullYear() - 1;
    return [start, start + 1, start + 2, start + 3];
  }, []);

  const toggle = (habit, dKey) => {
    setDone((prev) => ({ ...prev, [keyFor(habit, dKey)]: !prev[keyFor(habit, dKey)] }));
  };

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); } else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); } else setMonth((m) => m + 1);
  };

  const addHabit = () => {
    const name = newHabit.trim();
    if (name && !habits.includes(name)) setHabits((prev) => [...prev, name]);
    setNewHabit("");
    setAddingHabit(false);
  };
  const removeHabit = (habit) => setHabits((prev) => prev.filter((h) => h !== habit));

  const streakFor = (habit) => {
    let streak = 0;
    let cursor = new Date(today);
    for (let i = 0; i < 3 * 365; i++) {
      const k = dateKey(cursor.getFullYear(), cursor.getMonth(), cursor.getDate());
      if (done[keyFor(habit, k)]) {
        streak++;
        cursor.setDate(cursor.getDate() - 1);
      } else break;
    }
    return streak;
  };

  const rowCompletionPct = (habit) => {
    const upto = isCurrentMonth ? todayDate : totalDays;
    if (upto === 0) return 0;
    let c = 0;
    for (let d = 1; d <= upto; d++) {
      if (done[keyFor(habit, dateKey(year, month, d))]) c++;
    }
    return Math.round((c / upto) * 100);
  };

  const dayCompletionFrac = (d) => {
    if (!habits.length) return 0;
    const k = dateKey(year, month, d);
    let c = 0;
    habits.forEach((h) => { if (done[keyFor(h, k)]) c++; });
    return c / habits.length;
  };

  const monthStats = useMemo(() => {
    const upto = isCurrentMonth ? todayDate : totalDays;
    const totalCells = habits.length * upto;
    let doneCells = 0;
    habits.forEach((h) => {
      for (let d = 1; d <= upto; d++) {
        if (done[keyFor(h, dateKey(year, month, d))]) doneCells++;
      }
    });
    return { pct: totalCells ? Math.round((doneCells / totalCells) * 100) : 0, doneCells, totalCells };
  }, [done, habits, totalDays, isCurrentMonth, todayDate, year, month]);

  // Shared week grid for the selected overview year — used by both Week and Year views
  const overviewWeeks = useMemo(() => {
    const start = new Date(overviewYear, 0, 1);
    const startDow = start.getDay();
    const gridStart = new Date(start);
    gridStart.setDate(gridStart.getDate() - startDow);

    const end = new Date(overviewYear, 11, 31);
    const endDow = end.getDay();
    const gridEnd = new Date(end);
    gridEnd.setDate(gridEnd.getDate() + (6 - endDow));

    const weeks = [];
    let cursor = new Date(gridStart);
    while (cursor <= gridEnd) {
      const week = [];
      for (let i = 0; i < 7; i++) {
        const inYear = cursor.getFullYear() === overviewYear;
        const k = dateKey(cursor.getFullYear(), cursor.getMonth(), cursor.getDate());
        week.push({ date: new Date(cursor), key: k, inYear });
        cursor.setDate(cursor.getDate() + 1);
      }
      weeks.push(week);
    }
    return weeks;
  }, [overviewYear]);

  const countDoneForKey = (k) => {
    let c = 0;
    habits.forEach((h) => { if (done[keyFor(h, k)]) c++; });
    return c;
  };

  const heatColor = (frac) => {
    if (frac === null) return "transparent";
    if (frac === 0) return "rgba(255,255,255,0.06)";
    if (frac < 0.34) return "rgba(79,124,255,0.35)";
    if (frac < 0.67) return "rgba(79,124,255,0.65)";
    if (frac < 1) return "rgba(155,92,255,0.8)";
    return "#4FE3C1";
  };

  const heatmapWeeksWithFrac = useMemo(() => {
    return overviewWeeks.map((week) =>
      week.map((d) => ({ ...d, frac: d.inYear ? (habits.length ? countDoneForKey(d.key) / habits.length : 0) : null }))
    );
  }, [overviewWeeks, done, habits]);

  const yearStats = useMemo(() => {
    if (overviewYear > today.getFullYear()) return { pct: 0, days: 0 };
    const start = new Date(overviewYear, 0, 1);
    const lastDay = overviewYear === today.getFullYear() ? today : new Date(overviewYear, 11, 31);
    let totalDaysCount = 0;
    let sumFrac = 0;
    let cursor = new Date(start);
    while (cursor <= lastDay) {
      const k = dateKey(cursor.getFullYear(), cursor.getMonth(), cursor.getDate());
      sumFrac += habits.length ? countDoneForKey(k) / habits.length : 0;
      totalDaysCount++;
      cursor.setDate(cursor.getDate() + 1);
    }
    return { pct: totalDaysCount ? Math.round((sumFrac / totalDaysCount) * 100) : 0, days: totalDaysCount };
  }, [overviewYear, habits, done]);

  const monthLabelsForHeatmap = useMemo(() => {
    const labels = [];
    let lastMonth = -1;
    heatmapWeeksWithFrac.forEach((week, wIdx) => {
      const firstInYear = week.find((d) => d.inYear);
      if (firstInYear && firstInYear.date.getMonth() !== lastMonth) {
        lastMonth = firstInYear.date.getMonth();
        labels.push({ wIdx, label: firstInYear.date.toLocaleString("default", { month: "short" }) });
      }
    });
    return labels;
  }, [heatmapWeeksWithFrac]);

  // Weekly performance table — one row per week, most recent first
  const weeklyStats = useMemo(() => {
    const rows = [];
    let prevPct = null;
    overviewWeeks.forEach((week) => {
      const activeDays = week.filter((d) => d.inYear && d.key <= todayKey);
      if (activeDays.length === 0) return;

      const possible = habits.length * activeDays.length;
      let doneCount = 0;
      let perfectDays = 0;
      const perHabitCount = {};
      habits.forEach((h) => (perHabitCount[h] = 0));

      activeDays.forEach((d) => {
        const c = countDoneForKey(d.key);
        doneCount += c;
        if (habits.length && c === habits.length) perfectDays++;
        habits.forEach((h) => { if (done[keyFor(h, d.key)]) perHabitCount[h]++; });
      });

      const pct = possible ? Math.round((doneCount / possible) * 100) : 0;

      let weakest = null;
      if (habits.length) {
        let minCount = Infinity;
        habits.forEach((h) => {
          if (perHabitCount[h] < minCount) {
            minCount = perHabitCount[h];
            weakest = h;
          }
        });
      }

      const trend = prevPct === null ? null : pct > prevPct ? "up" : pct < prevPct ? "down" : "flat";
      const start = activeDays[0].date;
      const end = activeDays[activeDays.length - 1].date;

      rows.push({
        key: activeDays[0].key,
        rangeLabel: `${start.toLocaleString("default", { month: "short", day: "numeric" })} – ${end.toLocaleString("default", { month: "short", day: "numeric" })}`,
        pct,
        perfectDays,
        totalDays: activeDays.length,
        weakest,
        trend,
        isCurrent: activeDays.some((d) => d.key === todayKey),
      });
      prevPct = pct;
    });
    return rows.reverse();
  }, [overviewWeeks, habits, done, todayKey]);

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: "#0A0E1A", color: "#E8ECF7", minHeight: "100vh", padding: "26px 18px 50px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        .mono { font-family: 'JetBrains Mono', monospace; }
        .display { font-family: 'Space Grotesk', sans-serif; }
        button { cursor: pointer; }
        input { font-family: 'Inter', sans-serif; }
        .cell-btn:hover { outline: 1px solid rgba(143,179,255,0.4); }
        table { border-collapse: collapse; }
        .grid-wrap::-webkit-scrollbar, .heat-wrap::-webkit-scrollbar { height: 8px; }
        .grid-wrap::-webkit-scrollbar-thumb, .heat-wrap::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 4px; }
        .wk-row td { padding: 10px 12px; font-size: 13px; border-bottom: 1px solid rgba(255,255,255,0.05); }
      `}</style>

      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16, marginBottom: 18 }}>
          <div>
            <h1 className="display" style={{ fontSize: 26, fontWeight: 700, margin: "0 0 4px" }}>Habit tracker</h1>
            <p style={{ fontSize: 13.5, color: "#8C93AC", margin: 0 }}>
              Month grid for daily checks, a weekly report card, and a 3-year heatmap.
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 4 }}>
            {[
              { id: "month", label: "Month", Icon: Grid3x3 },
              { id: "week", label: "Week", Icon: ListChecks },
              { id: "year", label: "Year", Icon: Calendar },
            ].map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setView(id)}
                style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 9,
                  border: "none", fontSize: 12.5,
                  background: view === id ? "linear-gradient(90deg, #4F7CFF, #9B5CFF)" : "transparent",
                  color: view === id ? "white" : "#8C93AC",
                }}
              >
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>
        </div>

        {view === "month" && (
          <>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "8px 10px" }}>
                <button onClick={prevMonth} style={{ background: "none", border: "none", color: "#8FB3FF", padding: 4 }}><ChevronLeft size={16} /></button>
                <span className="mono" style={{ fontSize: 13, minWidth: 130, textAlign: "center" }}>{fmtMonth(year, month)}</span>
                <button onClick={nextMonth} style={{ background: "none", border: "none", color: "#8FB3FF", padding: 4 }}><ChevronRight size={16} /></button>
              </div>
            </div>

            <div style={{ marginBottom: 20, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "14px 18px", display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 220px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                  <span style={{ color: "#8C93AC" }}>Month completion</span>
                  <span className="mono" style={{ color: "#7DD6C0" }}>{monthStats.pct}%</span>
                </div>
                <div style={{ height: 8, borderRadius: 4, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${monthStats.pct}%`, background: "linear-gradient(90deg, #4F7CFF, #9B5CFF)", transition: "width 0.3s ease" }} />
                </div>
              </div>
              <span className="mono" style={{ fontSize: 12.5, color: "#6B7394" }}>{monthStats.doneCells} / {monthStats.totalCells} checks logged</span>
            </div>

            <div className="grid-wrap" style={{ overflowX: "auto", borderRadius: 14, border: "1px solid rgba(255,255,255,0.08)" }}>
              <table style={{ width: "100%", minWidth: totalDays * 34 + 260 }}>
                <thead>
                  <tr>
                    <th style={{ position: "sticky", left: 0, zIndex: 2, background: "#10152A", textAlign: "left", padding: "10px 14px", fontSize: 11.5, color: "#6B7394", fontWeight: 500, minWidth: 200, borderBottom: "1px solid rgba(255,255,255,0.08)", borderRight: "1px solid rgba(255,255,255,0.08)" }}>Habit</th>
                    {days.map((d) => (
                      <th key={d} className="mono" style={{ width: 34, minWidth: 34, padding: "8px 0", fontSize: 11, fontWeight: 500, textAlign: "center", color: d === todayDate && isCurrentMonth ? "#4FE3C1" : "#6B7394", background: d === todayDate && isCurrentMonth ? "rgba(79,227,193,0.08)" : "transparent", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>{d}</th>
                    ))}
                    <th style={{ minWidth: 90, padding: "8px 10px", fontSize: 11, color: "#6B7394", fontWeight: 500, textAlign: "center", borderBottom: "1px solid rgba(255,255,255,0.08)", borderLeft: "1px solid rgba(255,255,255,0.08)" }}>Streak</th>
                    <th style={{ minWidth: 70, padding: "8px 10px", fontSize: 11, color: "#6B7394", fontWeight: 500, textAlign: "center", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>%</th>
                    <th style={{ width: 36, borderBottom: "1px solid rgba(255,255,255,0.08)" }} />
                  </tr>
                </thead>
                <tbody>
                  {habits.map((habit, hIdx) => {
                    const streak = streakFor(habit);
                    const pct = rowCompletionPct(habit);
                    const rowBg = hIdx % 2 === 0 ? "#0D1224" : "#0F1428";
                    return (
                      <tr key={habit}>
                        <td style={{ position: "sticky", left: 0, background: rowBg, padding: "10px 14px", fontSize: 13, borderRight: "1px solid rgba(255,255,255,0.08)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>{habit}</td>
                        {days.map((d) => {
                          const k = dateKey(year, month, d);
                          const isDone = !!done[keyFor(habit, k)];
                          const future = k > todayKey;
                          return (
                            <td key={d} style={{ padding: 2, background: rowBg, borderBottom: "1px solid rgba(255,255,255,0.05)", textAlign: "center" }}>
                              <button
                                className="cell-btn"
                                disabled={future}
                                onClick={() => toggle(habit, k)}
                                style={{
                                  width: 26, height: 26, borderRadius: 6, border: "1px solid rgba(255,255,255,0.08)",
                                  background: isDone ? "#4FE3C1" : future ? "rgba(255,255,255,0.015)" : "rgba(255,255,255,0.04)",
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  opacity: future ? 0.4 : 1, cursor: future ? "default" : "pointer",
                                }}
                              >
                                {isDone && <Check size={13} color="#0A0E1A" />}
                              </button>
                            </td>
                          );
                        })}
                        <td style={{ textAlign: "center", borderLeft: "1px solid rgba(255,255,255,0.08)", borderBottom: "1px solid rgba(255,255,255,0.05)", background: rowBg }}>
                          <span className="mono" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12.5, color: streak > 0 ? "#F0B44E" : "#6B7394" }}><Flame size={12} /> {streak}</span>
                        </td>
                        <td style={{ textAlign: "center", borderBottom: "1px solid rgba(255,255,255,0.05)", background: rowBg }}>
                          <span className="mono" style={{ fontSize: 12, color: "#8FB3FF" }}>{pct}%</span>
                        </td>
                        <td style={{ textAlign: "center", borderBottom: "1px solid rgba(255,255,255,0.05)", background: rowBg }}>
                          <button onClick={() => removeHabit(habit)} style={{ background: "none", border: "none", color: "#4A5074", padding: 4 }}><Trash2 size={13} /></button>
                        </td>
                      </tr>
                    );
                  })}
                  <tr>
                    <td style={{ position: "sticky", left: 0, background: "#10152A", padding: "10px 14px", fontSize: 11.5, color: "#6B7394", borderRight: "1px solid rgba(255,255,255,0.08)", borderTop: "1px solid rgba(255,255,255,0.08)" }}>Day completion</td>
                    {days.map((d) => {
                      const p = dayCompletionFrac(d);
                      return (
                        <td key={d} style={{ textAlign: "center", padding: 4, background: "#10152A", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                          <div style={{ margin: "0 auto", width: 8, height: 8, borderRadius: "50%", background: p === 0 ? "rgba(255,255,255,0.1)" : p < 1 ? "rgba(143,179,255,0.6)" : "#4FE3C1" }} />
                        </td>
                      );
                    })}
                    <td style={{ background: "#10152A", borderTop: "1px solid rgba(255,255,255,0.08)" }} />
                    <td style={{ background: "#10152A", borderTop: "1px solid rgba(255,255,255,0.08)" }} />
                    <td style={{ background: "#10152A", borderTop: "1px solid rgba(255,255,255,0.08)" }} />
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: 14 }}>
              {addingHabit ? (
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input autoFocus value={newHabit} onChange={(e) => setNewHabit(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addHabit()} placeholder="New habit name"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 12px", color: "#E8ECF7", fontSize: 13, outline: "none", minWidth: 220 }} />
                  <button onClick={addHabit} style={{ background: "linear-gradient(90deg, #4F7CFF, #9B5CFF)", border: "none", borderRadius: 8, padding: "8px 14px", color: "white", fontSize: 13 }}>Add</button>
                  <button onClick={() => { setAddingHabit(false); setNewHabit(""); }} style={{ background: "none", border: "none", color: "#6B7394", padding: 6 }}><X size={15} /></button>
                </div>
              ) : (
                <button onClick={() => setAddingHabit(true)} style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.15)", borderRadius: 10, padding: "8px 14px", color: "#8FB3FF", fontSize: 13 }}>
                  <Plus size={14} /> Add habit
                </button>
              )}
            </div>
          </>
        )}

        {view === "week" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14, marginBottom: 16 }}>
              <div style={{ display: "flex", gap: 6 }}>
                {yearRange.map((y) => (
                  <button
                    key={y}
                    onClick={() => setOverviewYear(y)}
                    disabled={y > today.getFullYear()}
                    style={{
                      padding: "7px 14px", borderRadius: 9, fontSize: 12.5, border: "1px solid rgba(255,255,255,0.08)",
                      background: overviewYear === y ? "linear-gradient(90deg, #4F7CFF, #9B5CFF)" : "rgba(255,255,255,0.03)",
                      color: y > today.getFullYear() ? "#4A5074" : overviewYear === y ? "white" : "#8C93AC",
                      cursor: y > today.getFullYear() ? "default" : "pointer",
                    }}
                  >
                    {y}
                  </button>
                ))}
              </div>
              <span className="mono" style={{ fontSize: 12.5, color: "#8C93AC" }}>{weeklyStats.length} weeks logged in {overviewYear}</span>
            </div>

            {weeklyStats.length === 0 ? (
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "40px 20px", textAlign: "center", color: "#6B7394", fontSize: 13.5 }}>
                No weeks to show yet for {overviewYear}.
              </div>
            ) : (
              <div className="grid-wrap" style={{ overflowX: "auto", borderRadius: 14, border: "1px solid rgba(255,255,255,0.08)" }}>
                <table style={{ width: "100%", minWidth: 620 }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", padding: "10px 12px", fontSize: 11, color: "#6B7394", fontWeight: 500, background: "#10152A", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Week</th>
                      <th style={{ textAlign: "left", padding: "10px 12px", fontSize: 11, color: "#6B7394", fontWeight: 500, background: "#10152A", borderBottom: "1px solid rgba(255,255,255,0.08)", minWidth: 160 }}>Completion</th>
                      <th style={{ textAlign: "center", padding: "10px 12px", fontSize: 11, color: "#6B7394", fontWeight: 500, background: "#10152A", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Trend</th>
                      <th style={{ textAlign: "center", padding: "10px 12px", fontSize: 11, color: "#6B7394", fontWeight: 500, background: "#10152A", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Perfect days</th>
                      <th style={{ textAlign: "left", padding: "10px 12px", fontSize: 11, color: "#6B7394", fontWeight: 500, background: "#10152A", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Focus area</th>
                    </tr>
                  </thead>
                  <tbody>
                    {weeklyStats.map((row) => (
                      <tr key={row.key} className="wk-row" style={{ background: row.isCurrent ? "rgba(79,124,255,0.07)" : (weeklyStats.indexOf(row) % 2 === 0 ? "#0D1224" : "#0F1428") }}>
                        <td>
                          {row.rangeLabel}
                          {row.isCurrent && <span className="mono" style={{ fontSize: 9.5, color: "#8FB3FF", marginLeft: 8, letterSpacing: 0.4 }}>IN PROGRESS</span>}
                        </td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ flex: 1, height: 6, borderRadius: 3, background: "rgba(255,255,255,0.06)", overflow: "hidden", minWidth: 70 }}>
                              <div style={{ height: "100%", width: `${row.pct}%`, background: row.pct === 100 ? "#4FE3C1" : "linear-gradient(90deg, #4F7CFF, #9B5CFF)" }} />
                            </div>
                            <span className="mono" style={{ fontSize: 12, color: "#8FB3FF", minWidth: 34 }}>{row.pct}%</span>
                          </div>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          {row.trend === null && <Minus size={14} color="#4A5074" />}
                          {row.trend === "up" && <TrendingUp size={14} color="#4FE3C1" />}
                          {row.trend === "down" && <TrendingDown size={14} color="#E4849B" />}
                          {row.trend === "flat" && <Minus size={14} color="#6B7394" />}
                        </td>
                        <td className="mono" style={{ textAlign: "center", color: row.perfectDays === row.totalDays ? "#4FE3C1" : "#8C93AC" }}>
                          {row.perfectDays}/{row.totalDays}
                        </td>
                        <td style={{ color: "#8C93AC" }}>{row.weakest || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {view === "year" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14, marginBottom: 16 }}>
              <div style={{ display: "flex", gap: 6 }}>
                {yearRange.map((y) => (
                  <button
                    key={y}
                    onClick={() => setOverviewYear(y)}
                    disabled={y > today.getFullYear()}
                    style={{
                      padding: "7px 14px", borderRadius: 9, fontSize: 12.5, border: "1px solid rgba(255,255,255,0.08)",
                      background: overviewYear === y ? "linear-gradient(90deg, #4F7CFF, #9B5CFF)" : "rgba(255,255,255,0.03)",
                      color: y > today.getFullYear() ? "#4A5074" : overviewYear === y ? "white" : "#8C93AC",
                      cursor: y > today.getFullYear() ? "default" : "pointer",
                    }}
                  >
                    {y}
                  </button>
                ))}
              </div>
              <span className="mono" style={{ fontSize: 12.5, color: "#8C93AC" }}>
                {yearStats.pct}% average completion · {yearStats.days} days tracked
              </span>
            </div>

            <div className="heat-wrap" style={{ overflowX: "auto", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "18px 18px 14px" }}>
              <div style={{ position: "relative", minWidth: heatmapWeeksWithFrac.length * 14 + 20, height: 16, marginBottom: 4 }}>
                {monthLabelsForHeatmap.map((m, i) => (
                  <span key={i} className="mono" style={{ position: "absolute", left: m.wIdx * 14, fontSize: 10.5, color: "#6B7394" }}>{m.label}</span>
                ))}
              </div>
              <div style={{ display: "flex", gap: 3, minWidth: heatmapWeeksWithFrac.length * 14 + 20 }}>
                {heatmapWeeksWithFrac.map((week, wIdx) => (
                  <div key={wIdx} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    {week.map((d, dIdx) => (
                      <div
                        key={dIdx}
                        title={d.inYear ? `${d.key} — ${Math.round((d.frac || 0) * 100)}%` : ""}
                        style={{ width: 11, height: 11, borderRadius: 3, background: d.inYear ? heatColor(d.frac) : "transparent" }}
                      />
                    ))}
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 14, fontSize: 11, color: "#6B7394" }}>
                <span>Less</span>
                {[0, 0.2, 0.5, 0.8, 1].map((f, i) => (
                  <div key={i} style={{ width: 11, height: 11, borderRadius: 3, background: f === 0 ? "rgba(255,255,255,0.06)" : heatColor(f) }} />
                ))}
                <span>More</span>
              </div>
            </div>

            <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 }}>
              {habits.map((habit) => (
                <div key={habit} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "12px 14px" }}>
                  <div style={{ fontSize: 13, marginBottom: 6 }}>{habit}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "#F0B44E" }}>
                    <Flame size={13} /> <span className="mono">{streakFor(habit)} day streak</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
