import { ChartPie, ChartNoAxesCombined } from "lucide-react";
import type { Overview } from "./api";
import { shiftDate } from "./weeks";

const colors = ["#259bff", "#ffb33b", "#ff829c", "#20ce91", "#a16aff", "#46c9db", "#e1a462", "#7388d9", "#dc79c4"];
type Slice = { label: string; value: number; color: string };
function Donut({ rows }: { rows: Slice[] }) {
  const total = rows.reduce((sum, row) => sum + row.value, 0);
  let offset = 0;
  return <div className="overview-donut-body">
    <div className="overview-donut">
      <svg viewBox="0 0 180 180" role="img" aria-label={`${total} total tasks`}>
        <circle cx="90" cy="90" r="70" fill="none" stroke="var(--line)" strokeWidth="30" />
        {rows.filter(row => row.value > 0).map(row => {
          const length = row.value / total * 439.823;
          const start = offset; offset += length;
          return <circle key={row.label} cx="90" cy="90" r="70" fill="none" stroke={row.color} strokeWidth="30" strokeDasharray={`${length} ${439.823 - length}`} strokeDashoffset={-start} transform="rotate(-90 90 90)"><title>{row.label}: {row.value}</title></circle>;
        })}
      </svg>
      <div><strong>{total}</strong><span>{"Total Tasks"}</span></div>
    </div>
    <ul className="overview-chart-legend">{rows.map(row => <li key={row.label}><i style={{ background: row.color }} /><span>{row.label}</span><strong>{row.value} <small>({total ? Math.round(row.value / total * 100) : 0}%)</small></strong></li>)}</ul>
  </div>;
}
export function OverviewCharts({ overview, week, end }: { overview?: Overview | undefined; week: string; end?: string }) {
  const categories = overview?.categories ?? [];
  const statusRows = [
    { label: "Completed", color: "#20ce91" },
    { label: "In Progress", color: "#258cff" },
    { label: "Not Started", color: "#9baac0" },
  ].map(row => ({ ...row, value: categories.reduce((sum, c) => sum + (c.statuses ?? []).filter(status => status === row.label).length, 0) }));
  const days: string[] = [];
  for (let day = week; day <= (end ?? shiftDate(week, 4)); day = shiftDate(day, 1)) days.push(day);
  const step = 346 / Math.max(1, days.length - 1);
  const series = categories.map((category, i) => ({ label: category.name, color: colors[i % colors.length]!, values: days.map(day => (overview?.trend ?? []).find(point => point._id === day)?.categories?.filter(point => point.categoryId === category._id).reduce((sum, point) => sum + point.quantity, 0) ?? 0) }));
  const max = Math.max(5, ...series.flatMap(s => s.values));
  const ceiling = Math.ceil(max / 5) * 5;
  const heading = (title: string, Icon: typeof ChartPie) => <div className="overview-chart-heading"><Icon size={23} /><h2>{title}</h2><span>{"Selected Period"}</span></div>;
  return <div className="overview-charts">
    <section className="overview-chart">{heading("Task Status Distribution", ChartPie)}<Donut rows={statusRows} /></section>
    <section className="overview-chart">{heading("Daily Activity Trend", ChartNoAxesCombined)}
      <svg className="overview-line-chart" viewBox="0 0 400 220" role="img" aria-label="Daily completed quantities by category, selected period">
        {Array.from({ length: 6 }, (_, i) => <g key={i}><line x1="34" x2="380" y1={20 + i * 30} y2={20 + i * 30} stroke="var(--line)" /><text x="16" y={24 + i * 30} textAnchor="middle">{Math.round(ceiling * (5 - i) / 5)}</text></g>)}
        {days.map((day, i) => <g key={day}><line x1={34 + i * step} x2={34 + i * step} y1="20" y2="170" stroke="var(--line)" /><text x={34 + i * step} y="190" textAnchor="middle">{days.length <= 7 ? new Date(day + "T00:00:00Z").toLocaleDateString("en-GB", { weekday: "short", timeZone: "UTC" }) : ""}</text><text x={34 + i * step} y="208" textAnchor="middle">{(days.length <= 7 || (i % 7 === 0 && i < days.length - 3) || i === days.length - 1) ? new Date(day + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }) : ""}</text></g>)}
        {series.map(s => { const points = s.values.map((value, i) => `${34 + i * step},${170 - value / ceiling * 150}`).join(" "); return <g key={s.label}><polygon points={`34,170 ${points} 380,170`} fill={s.color} opacity=".055" /><polyline points={points} fill="none" stroke={s.color} strokeWidth="2.5" strokeLinejoin="round" />{s.values.map((value, i) => <circle key={i} cx={34 + i * step} cy={170 - value / ceiling * 150} r="4.5" fill={s.color} stroke="var(--surface)"><title>{s.label}, {days[i]}: {value}</title></circle>)}</g>; })}
      </svg>
      <ul className="overview-chart-legend overview-line-legend">{series.map(s => <li key={s.label}><i style={{ background: s.color }} /><span>{s.label}</span></li>)}</ul>
      {!categories.length && <p className="muted">{"Recorded activity will appear here."}</p>}
    </section>
  </div>;
}

