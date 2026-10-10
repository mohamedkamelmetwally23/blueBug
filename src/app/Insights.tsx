import { useState } from "react";
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
} from "lucide-react";
import { shiftDate, weekLabel } from "./weeks";
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
  open: (c: Category) => void;
}) {
  const [week, setWeek] = useState(() => {
    const today = cairoDate();
    const weekday = new Date(today + "T00:00:00Z").getUTCDay();
    return shiftDate(today, weekday === 0 ? -6 : 1 - weekday);
  });
  const workdays = 5;
  const dailyTarget = 5;
  const weeklyTarget = dailyTarget * workdays;
  const end = shiftDate(week, workdays - 1);
  const data = useData<Overview>(`/overview?from=${week}&to=${end}`, revision);
  const financial = useData<Report | null>(
    `/financial-reports/${week}`,
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
        tone: "amber",
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
      <div className="operations-heading">
        <div>
          <div className="eyebrow">WEEKLY COMMAND CENTER</div>
          <h1>Operations overview</h1>
          <p>Here's what's moving across operations this week.</p>
        </div>
        <div className="operations-tools">
          <button className="secondary" onClick={() => window.print()}>
            <Download size={17} />
            Export PDF
          </button>
          <label className="operations-week">
            <CalendarDays size={19} />
            <span>
              <strong>{weekLabel(week, end)}</strong>
              <small>Monday &ndash; Friday</small>
            </span>
            <input
              type="date"
              aria-label="Overview week"
              value={week}
              onChange={(e) => {
                if (e.target.value) {
                  const day = e.target.value;
                  const weekday = new Date(day + "T00:00:00Z").getUTCDay();
                  setWeek(shiftDate(day, weekday === 0 ? -6 : 1 - weekday));
                }
              }}
            />
          </label>
        </div>
      </div>
      <ErrorLine message={data.error} />
      {data.loading ? (
        <p role="status">Loading overview...</p>
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
                return (
                  <button
                    className="operation-metric"
                    key={c._id}
                    onClick={() => open(c)}
                  >
                    <span className={`operation-icon ${tone}`}>
                      <Icon size={22} strokeWidth={1.8} />
                    </span>
                    <span className="operation-copy">
                      <span className="operation-label">{title}</span>
                      <span className="operation-value">
                        {c.quantity}
                        {hasWeeklyTarget && <small> / {weeklyTarget}</small>}
                      </span>
                      {hasWeeklyTarget && (
                        <span className="operation-note">
                          {Math.max(0, weeklyTarget - c.quantity)} remaining |{" "}
                          {dailyTarget} per day
                        </span>
                      )}
                    </span>
                  </button>
                );
              })
          ) : (
            <Empty>No work categories are available yet.</Empty>
          )}
        </div>
      )}
      <section className="operations-monthly">
        <div className="eyebrow">WEEKLY FINANCIAL OVERVIEW</div>
        <h2>{weekLabel(week, end)}</h2>
        <p>Funds for the selected week.</p>
        <ErrorLine message={financial.error} />
        {financial.loading ? (
          <p role="status">Loading financial report...</p>
        ) : financial.error ? null : financial.data ? (
          <>
            <div className="operations-monthly-stats">
              <div>
                <strong>{money(financial.data.receivedCents)}</strong>
                <span>Received</span>
              </div>
              <div>
                <strong>{money(financial.data.balanceCents)}</strong>
                <span>Balance</span>
              </div>
              <div>
                <strong>{money(financial.data.reservedCents)}</strong>
                <span>Reserved</span>
              </div>
            </div>
            {financial.data.budgetSummary && (
              <p className="financial-budget-summary">
                {financial.data.budgetSummary}
              </p>
            )}
          </>
        ) : (
          <p>No financial report saved for this week.</p>
        )}
      </section>
    </div>
  );
}

export { Financial } from "./Financial";
