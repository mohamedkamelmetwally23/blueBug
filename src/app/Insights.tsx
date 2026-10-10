import { useEffect, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  ScrollText,
  Mail,
  ClipboardCheck,
  UserCheck,
  CalendarX,
  Target,
  Wallet,
  UserPlus,
  Download,
  Tags,
  ChartNoAxesColumnIncreasing,
} from "lucide-react";
import { OverviewCharts } from "./OverviewCharts";
import { ThemeToggle } from "./ThemeToggle";
import { shiftDate, weekLabel, workingWeek } from "./weeks";
import {
  cairoDate,
  statuses,
  type Category,
  type Employee,
  type Overview,
} from "./api";
import type { Report } from "./Financial";
import { Empty, ErrorLine, useData } from "./shared";
export function Employees({
  data,
  loading,
  open,
}: {
  data: Employee[] | undefined;
  loading: boolean;
  open: (e: Employee) => void;
}) {
  return loading ? (
    <p role="status">Loading employees…</p>
  ) : !data?.length ? (
    <Empty>Employees will appear here.</Empty>
  ) : (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Employee</th>
            <th>Assigned</th>
            <th>Completed</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          {data.map((e) => (
            <tr key={e._id}>
              <td>
                <strong>{e.name}</strong>
                <small>
                  {statuses
                    .map(
                      (s) =>
                        `${s}: ${e.statuses.filter((v) => v === s).length}`,
                    )
                    .join(" · ")}
                </small>
              </td>
              <td>{e.assigned}</td>
              <td>{e.completed}</td>
              <td>
                <button className="secondary" onClick={() => open(e)}>
                  View work
                  <ArrowRight size={14} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Bars({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; value: number }[];
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <section className="chart">
      <h2>{title}</h2>
      {rows.length ? (
        rows.map((r) => (
          <div className="bar-row" key={r.label}>
            <span title={r.label}>{r.label}</span>
            <div>
              <i style={{ width: `${(r.value / max) * 100}%` }} />
            </div>
            <strong>{r.value}</strong>
          </div>
        ))
      ) : (
        <p className="muted">Recorded activity will appear here.</p>
      )}
    </section>
  );
}

export function OverviewPanel({
  revision,
  open,
}: {
  revision: number;
  open: (c: Category, range: { start: string; end: string }) => void;
}) {
  const dateLabel = weekLabel;
  const [today, setToday] = useState(cairoDate);
  const [period, setPeriod] = useState("current-week");
  useEffect(() => {
    const sync = () => setToday(cairoDate());
    const timer = window.setInterval(sync, 30000);
    window.addEventListener("focus", sync);
    return () => { window.clearInterval(timer); window.removeEventListener("focus", sync); };
  }, []);
  const current = workingWeek(today);
  const monthStart = today.slice(0, 7) + "-01";
  const previousMonthEnd = shiftDate(monthStart, -1);
  const week = period === "last-month" ? previousMonthEnd.slice(0, 7) + "-01" : shiftDate(current.start, period === "last-week" ? -7 : period === "2-weeks-ago" ? -14 : period === "3-weeks-ago" ? -21 : 0);
  const end = period === "last-month" ? previousMonthEnd : shiftDate(week, 4);
  let workdays = 0;
  for (let date = week; date <= end; date = shiftDate(date, 1)) {
    const day = new Date(date + "T00:00:00Z").getUTCDay();
    if (day > 0 && day < 6) workdays++;
  }
  const dailyTarget = 5;
  const weeklyTarget = dailyTarget * workdays;
  const financialWeek = period === "last-month" ? workingWeek(shiftDate(end, -2)).start : week;
  const data = useData<Overview>(`/overview?from=${week}&to=${end}`, revision);
  const financial = useData<Report | null>(
    `/financial-reports/${financialWeek}`,
    revision,
  );
  const money = (cents: number) =>
    (cents / 100).toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  const categories = data.data?.categories ?? [];
  const presentation = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes("action"))
      return {
        title: "Action needed",
        Icon: ClipboardCheck,
        tone: "amber",
        rank: 2,
      };
    if (lower.includes("script"))
      return {
        title: "Scripts completed",
        Icon: ScrollText,
        tone: "blue",
        rank: 0,
      };
    if (lower.includes("email") && !lower.includes("warm"))
      return { title: "Emails completed", Icon: Mail, tone: "amber", rank: 1 };
    if (lower.includes("invitation"))
      return {
        title: "Invitation acceptance",
        Icon: UserCheck,
        tone: "purple",
        rank: 3,
      };
    if (lower.includes("deactivation"))
      return {
        title: "Deactivation check",
        Icon: CalendarX,
        tone: "green",
        rank: 4,
      };
    if (lower.includes("target"))
      return {
        title: "Target active account",
        Icon: Target,
        tone: "purple",
        rank: 5,
      };
    if (lower.includes("warm") && lower.includes("email"))
      return { title: name, Icon: Mail, tone: "blue", rank: 6 };
    if (lower.includes("warm"))
      return { title: name, Icon: Wallet, tone: "blue", rank: 7 };
    if (lower.includes("trying") || lower.includes("open"))
      return { title: name, Icon: UserPlus, tone: "blue", rank: 8 };
    return { title: name, Icon: Tags, tone: "blue", rank: 9 };
  };
  return (
    <div className="operations-overview">
      <div className="overview-report-heading">
        <div><span>BLUE BUG OPERATIONS</span><h1>Operations Report</h1><p>{dateLabel(week, end)}</p></div>
        <div className="overview-report-meta"><strong>{period === "last-month" ? "Monthly overview" : "Weekly overview"}</strong><span>Generated {today}</span></div>
      </div>
      <div className="operations-heading">
        <div>
          <span className="operations-heading-icon" aria-hidden="true"><ChartNoAxesColumnIncreasing size={32} /></span>
          <h1>{"Operations overview"}</h1>
          <p>{"Track operations across your selected period."}</p>
        </div>
        <div className="operations-tools">
          <ThemeToggle />
          <button className="secondary" onClick={() => window.print()}>
            <Download size={17} />
            {"Export PDF"}
          </button>
          <div className="operations-week">
            <CalendarDays size={19} />
            <span>
              <strong>{dateLabel(week, end)}</strong>
              <small>{period === "last-month" ? "Previous calendar month" : "Monday \u2013 Friday"}</small>
            </span>
          </div>
          <div className="overview-period" role="group" aria-label="Overview period">
            {[{ value: "current-week", label: "This week" }, { value: "last-week", label: "Last week" }, { value: "2-weeks-ago", label: "2 weeks ago" }, { value: "3-weeks-ago", label: "3 weeks ago" }, { value: "last-month", label: "Last month" }].map(option => (
              <button type="button" key={option.value} aria-pressed={period === option.value} onClick={() => setPeriod(option.value)}>{option.label}</button>
            ))}
          </div>
        </div>
      </div>
      <ErrorLine message={data.error} />
      {data.loading ? (
        <p role="status">{"Loading overview..."}</p>
      ) : (
        <div className="operations-grid">
          {categories.length ? (
            [...categories]
              .sort(
                (a, b) => presentation(a.name).rank - presentation(b.name).rank,
              )
              .map((c) => {
                const { title, Icon, tone, rank } = presentation(c.name);
                const hasWeeklyTarget = rank === 0 || rank === 1;
                const percentage = Math.round((c.quantity / weeklyTarget) * 100);
                return (
                  <button
                    className={`operation-metric tone-${tone}`}
                    key={c._id}
                    onClick={() => open(c, { start: week, end })}
                  >
                    <svg className="operation-sparkline" viewBox="0 0 140 64" aria-hidden="true"><path d="M0 53 Q18 36 33 41 T64 28 T99 14 T140 4 L140 64 L0 64Z" fill="currentColor" opacity=".08" /><path d="M0 53 Q18 36 33 41 T64 28 T99 14 T140 4" fill="none" stroke="currentColor" strokeWidth="2" /></svg>
                    <span className={`operation-icon ${tone}`}>
                      <Icon size={22} strokeWidth={1.8} />
                    </span>
                    <span className="operation-copy">
                      <span className="operation-label">{title}</span>
                      <span className="operation-value">
                        {c.quantity}
                        {hasWeeklyTarget && <small> / {weeklyTarget}</small>}
                      </span>
                      {rank === 2 && <span className="operation-result-note"><span className="result-good">{"Good"}: {c.goodResults ?? 0}</span><span className="result-bad">{"Bad"}: {c.badResults ?? 0}</span><span className="result-pending">{"Pending"}: {c.pendingResults ?? 0}</span></span>}
                      {hasWeeklyTarget && (
                        <span className="operation-note">
                          {Math.max(0, weeklyTarget - c.quantity)} {"remaining"} |{" "}
                          {dailyTarget} {"per day"}
                        </span>
                      )}
                    </span>
                    {hasWeeklyTarget && <span className="operation-ring" aria-hidden="true"><svg viewBox="0 0 54 54"><circle cx="27" cy="27" r="23" /><circle cx="27" cy="27" r="23" strokeDasharray={`${Math.min(100, percentage) * 1.445} 144.5`} /></svg><strong>{percentage}%</strong></span>}
                    <span className="operation-progress" aria-hidden="true"><span style={{ width: hasWeeklyTarget ? `${Math.min(100, percentage)}%` : "0%" }} /></span>
                  </button>
                );
              })
          ) : (
            <Empty>{"No work categories are available yet."}</Empty>
          )}
        </div>
      )}
      {!data.loading && !data.error && <OverviewCharts overview={data.data} week={week} end={end} />}
      <section className="operations-monthly">
        <div className="eyebrow">{"WEEKLY FINANCIAL OVERVIEW"}</div>
        <h2>{dateLabel(financialWeek, shiftDate(financialWeek, 4))}</h2>
        <p>{"Funds for the selected week."}</p>
        <ErrorLine message={financial.error} />
        {financial.loading ? (
          <p role="status">{"Loading financial report..."}</p>
        ) : financial.error ? null : financial.data ? (
          <>
            <div className="operations-monthly-stats">
              <div>
                <strong>{money(financial.data.receivedCents)}</strong>
                <span>{"Received"}</span>
              </div>
              <div>
                <strong>{money(financial.data.balanceCents)}</strong>
                <span>{"Balance"}</span>
              </div>
              <div>
                <strong>{money(financial.data.reservedCents)}</strong>
                <span>{"Reserved"}</span>
              </div>
            </div>
            {financial.data.budgetSummary && (
              <p className="financial-budget-summary">
                {financial.data.budgetSummary}
              </p>
            )}
          </>
        ) : (
          <p>{"No financial report saved for this week."}</p>
        )}
      </section>
      <footer className="overview-report-footer"><span>Blue Bug Operations · Management report</span><span>{dateLabel(week, end)}</span></footer>
    </div>
  );
}

export { Financial } from "./Financial";
