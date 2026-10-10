import { useState } from "react";
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Target,
  Wallet,
  FileText,
  Save,
} from "lucide-react";
import { api, cairoDate } from "./api";
import { Field, ErrorLine, useData } from "./shared";

type Report = {
  weekStart: string;
  requiredAccounts: number;
  achievedAccounts: number;
  receivedCents: number;
  balanceCents: number;
  reservedCents: number;
  budgetSummary: string;
  updatedAt: string;
};
function monday(date: string) {
  const day = new Date(date + "T00:00:00Z");
  day.setUTCDate(day.getUTCDate() - ((day.getUTCDay() + 6) % 7));
  return day.toISOString().slice(0, 10);
}
function shift(date: string, days: number) {
  const value = new Date(date + "T00:00:00Z");
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}
export function Financial() {
  const [week, setWeek] = useState(() => monday(cairoDate()));
  const [revision, setRevision] = useState(0);
  const report = useData<Report | null>("/financial-reports/" + week, revision);
  const [dirty, setDirty] = useState(false);
  const changeWeek = (next: string) => {
    if (next === week) return;
    if (dirty && !window.confirm("Discard unsaved changes and change week?"))
      return;
    setDirty(false);
    setWeek(next);
  };
  return (
    <section className="weekly-financial">
      <div className="report-toolbar">
        <div>
          <h2>
            <CalendarDays size={22} /> Weekly plan & budget
          </h2>
          <p>Plan your targets. Track your funds. Keep each week in focus.</p>
        </div>
        <div className="report-week-picker">
          <button
            type="button"
            className="secondary"
            aria-label="Previous week"
            onClick={() => changeWeek(shift(week, -7))}
          >
            <ChevronLeft size={18} />
          </button>
          <Field label="Week starting">
            <input
              type="date"
              value={week}
              onChange={(event) => {
                if (event.target.value) changeWeek(monday(event.target.value));
              }}
            />
          </Field>
          <button
            type="button"
            className="secondary"
            aria-label="Next week"
            onClick={() => changeWeek(shift(week, 7))}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      <p className="report-period">
        {week} — {shift(week, 6)}
      </p>
      <ErrorLine message={report.error} />
      {report.loading ? (
        <p role="status">Loading weekly report…</p>
      ) : (
        !report.error && (
          <ReportForm
            key={week + ":" + revision}
            week={week}
            report={report.data ?? null}
            dirty={setDirty}
            saved={() => {
              setDirty(false);
              setRevision((value) => value + 1);
            }}
          />
        )
      )}
    </section>
  );
}
function ReportForm({
  week,
  report,
  dirty,
  saved,
}: {
  week: string;
  report: Report | null;
  dirty: (value: boolean) => void;
  saved: () => void;
}) {
  const [required, setRequired] = useState(
    report?.requiredAccounts.toString() ?? "",
  );
  const [achieved, setAchieved] = useState(
    report?.achievedAccounts.toString() ?? "",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <form
      className="report-form"
      onChange={() => dirty(true)}
      onSubmit={async (event) => {
        event.preventDefault();
        if (busy) return;
        const values = new FormData(event.currentTarget);
        setBusy(true);
        setError("");
        try {
          await api("/financial-reports/" + week, "PUT", {
            requiredAccounts: Number(required),
            achievedAccounts: Number(achieved),
            receivedCents: Math.round(Number(values.get("received")) * 100),
            balanceCents: Math.round(Number(values.get("balance")) * 100),
            reservedCents: Math.round(Number(values.get("reserved")) * 100),
            budgetSummary: values.get("budgetSummary"),
          });
          saved();
        } catch (error) {
          setError((error as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="report-status-row">
        <span className={`badge ${report ? "report-status-saved" : ""}`}>
          {report ? "Saved" : "New report"}
        </span>
        {report ? (
          <p className="report-saved" role="status">
            <Check size={16} /> Saved report · Last updated{" "}
            {new Date(report.updatedAt).toLocaleString("en-GB", {
              timeZone: "Africa/Cairo",
            })}
          </p>
        ) : (
          <p className="hint">
            No report saved for this week. Fill in the fields below to create
            one.
          </p>
        )}
      </div>
      <fieldset disabled={busy}>
        <section className="report-section">
          <div className="report-section-heading">
            <span className="report-section-icon">
              <Target size={20} />
            </span>
            <div>
              <h3>Account targets</h3>
              <p>Your goal and progress for the selected week.</p>
            </div>
            <span className="report-step">01</span>
          </div>
          <div className="report-fields">
            <Field label="Required accounts">
              <input
                type="number"
                min={0}
                max={1000000000}
                step={1}
                required
                value={required}
                onChange={(event) => setRequired(event.target.value)}
              />
            </Field>
            <Field label="Already achieved">
              <input
                type="number"
                min={0}
                max={1000000000}
                step={1}
                required
                value={achieved}
                onChange={(event) => setAchieved(event.target.value)}
              />
            </Field>
            <Field label="Current gap (remaining accounts)">
              <input
                readOnly
                value={
                  required !== "" && achieved !== ""
                    ? Math.max(0, Number(required) - Number(achieved))
                    : ""
                }
              />
            </Field>
          </div>
        </section>
        <section className="report-section">
          <div className="report-section-heading">
            <span className="report-section-icon">
              <Wallet size={20} />
            </span>
            <div>
              <h3>Budget & cash flow</h3>
              <p>Enter your weekly funds in US dollars.</p>
            </div>
            <span className="report-step">02</span>
          </div>
          <div className="report-fields">
            <Field label="Received from manager (USD)">
              <input
                name="received"
                type="number"
                min={0}
                max={1000000000}
                step="0.01"
                required
                defaultValue={
                  report ? (report.receivedCents / 100).toFixed(2) : ""
                }
              />
            </Field>
            <Field label="Current cash balance (USD)">
              <input
                name="balance"
                type="number"
                min={0}
                max={1000000000}
                step="0.01"
                required
                defaultValue={
                  report ? (report.balanceCents / 100).toFixed(2) : ""
                }
              />
            </Field>
            <Field label="Reserved funds (USD)">
              <input
                name="reserved"
                type="number"
                min={0}
                max={1000000000}
                step="0.01"
                required
                defaultValue={
                  report ? (report.reservedCents / 100).toFixed(2) : ""
                }
              />
            </Field>
          </div>
        </section>
        <section className="report-section report-notes">
          <div className="report-section-heading">
            <span className="report-section-icon">
              <FileText size={20} />
            </span>
            <div>
              <h3>Budget notes</h3>
              <p>Add context for this week?s numbers.</p>
            </div>
            <span className="report-step">03</span>
          </div>
          <Field label="Budget summary">
            <textarea
              name="budgetSummary"
              rows={4}
              maxLength={5000}
              defaultValue={report?.budgetSummary ?? ""}
              placeholder="Add budget details, reserved account quantities, and notes for this week…"
            />
          </Field>
        </section>
      </fieldset>
      <ErrorLine message={error} />
      <div className="report-savebar">
        <span>Changes are saved to the selected week.</span>
        <button disabled={busy}>
          <Save size={16} />
          {busy ? "Saving…" : "Save weekly report"}
        </button>
      </div>
    </form>
  );
}
