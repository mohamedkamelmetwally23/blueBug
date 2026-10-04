import { Pencil, Save, X } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchMonthlyPlan, saveMonthlyPlan, saveMonthlyPlanFigures, type MonthlyPlanFigure, type MonthlyPlanFigures } from "../../lib/api.js";

const initialFigures: MonthlyPlanFigures = {
  monthlyNeed: { value: 50, label: "Monthly Need", detail: "Amazon Accounts" },
  progressSep: { value: 33, label: "Progress SEP", detail: "Already Achieved" },
  currentGap: { value: 17, label: "Current Gap", detail: "Remaining Accounts" },
  receivedFromManager: { value: 440, label: "Received from Manager", detail: "" },
  currentCashBalance: { value: 68, label: "Current Cash Balance", detail: "" },
  reservedBudget: { value: 50, label: "Reserved for 10 US Accounts", detail: "" }
};

const figureDefinitions: { key: keyof MonthlyPlanFigures; currency?: boolean }[] = [
  { key: "monthlyNeed" },
  { key: "progressSep" },
  { key: "currentGap" },
  { key: "receivedFromManager", currency: true },
  { key: "currentCashBalance", currency: true },
  { key: "reservedBudget", currency: true }
];

export function MonthlyPlanSummary() {
  const [summary, setSummary] = useState("");
  const [figures, setFigures] = useState<MonthlyPlanFigures>(initialFigures);
  const [draft, setDraft] = useState("");
  const [figureDraft, setFigureDraft] = useState<MonthlyPlanFigure>({ value: 0, label: "", detail: "" });
  const [editingFigure, setEditingFigure] = useState<keyof MonthlyPlanFigures | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingSummary, setEditingSummary] = useState(false);

  useEffect(() => {
    void fetchMonthlyPlan()
      .then((plan) => {
        setSummary(plan.content);
        setFigures(plan.figures);
      })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Could not load monthly overview"))
      .finally(() => setLoading(false));
  }, []);

  const closeEditor = () => {
    if (!saving) {
      setEditingSummary(false);
      setEditingFigure(null);
    }
  };

  const openSummaryEditor = () => {
    setDraft(summary);
    setError(null);
    setEditingFigure(null);
    setEditingSummary(true);
  };

  const openFigureEditor = (key: keyof MonthlyPlanFigures) => {
    setFigureDraft({ ...figures[key] });
    setError(null);
    setEditingSummary(false);
    setEditingFigure(key);
  };

  const saveSummary = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      setSummary(await saveMonthlyPlan(draft));
      setEditingSummary(false);
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "Could not save budget summary");
    } finally {
      setSaving(false);
    }
  };

  const saveFigure = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingFigure) return;
    const value = Number(figureDraft.value);
    if (!Number.isFinite(value) || value < 0) {
      setError("Enter a valid non-negative number.");
      return;
    }
    if (!figureDraft.label.trim()) {
      setError("Enter a label for this figure.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      setFigures(await saveMonthlyPlanFigures({ ...figures, [editingFigure]: { ...figureDraft, value, label: figureDraft.label.trim(), detail: figureDraft.detail.trim() } }));
      setEditingFigure(null);
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "Could not save the value");
    } finally {
      setSaving(false);
    }
  };

  const editing = editingSummary || editingFigure !== null;
  useEffect(() => {
    if (!editing) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeEditor();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [editing, saving]);

  const activeFigure = figureDefinitions.find((figure) => figure.key === editingFigure);
  const displayValue = (key: keyof MonthlyPlanFigures, currency = false) =>
    currency
      ? `$${figures[key].value.toLocaleString("en-US", { maximumFractionDigits: 2 })}`
      : figures[key].value.toLocaleString("en-US");

  return <>
    <section className="monthly-plan panel" aria-labelledby="monthly-plan-title">
      <header className="monthly-plan-header">
        <div>
          <p className="eyebrow">MONTHLY OVERVIEW</p>
          <h2 id="monthly-plan-title">Monthly Plan &amp; Budget Position</h2>
        </div>
      </header>

      <div className="monthly-plan-figures">
        {figureDefinitions.map((figure) => <article key={figure.key}>
          <div className="monthly-plan-value">
            <strong>{displayValue(figure.key, figure.currency)}</strong>
            <button className="monthly-plan-icon-button" type="button" aria-label={`Edit ${figures[figure.key].label}`} title={`Edit ${figures[figure.key].label}`} disabled={loading} onClick={() => openFigureEditor(figure.key)}>
              <Pencil size={14}/>
            </button>
          </div>
          <span>{figures[figure.key].label}</span>
          {figures[figure.key].detail && <small>{figures[figure.key].detail}</small>}
        </article>)}
      </div>

      <div className="budget-summary">
        <div className="budget-summary-header">
          <h3>Budget Summary</h3>
          <button className="pdf-button monthly-plan-edit" type="button" onClick={openSummaryEditor} disabled={loading}>
            <Pencil size={15}/><span>{summary ? "Edit" : "Write summary"}</span>
          </button>
        </div>
        {loading ? <p className="monthly-plan-state">Loading budget summary...</p>
          : error && !editing ? <p className="monthly-plan-error">{error}</p>
          : summary ? <p className="monthly-plan-content">{summary}</p>
          : <p className="monthly-plan-state">No budget summary added yet.</p>}
      </div>
    </section>

    {editing && <div className="dialog-backdrop" onMouseDown={closeEditor}>
      <section className="task-dialog monthly-plan-dialog" role="dialog" aria-modal="true" aria-labelledby="monthly-plan-dialog-title" onMouseDown={(event) => event.stopPropagation()}>
        <header>
          <div><span className="eyebrow">MONTHLY OVERVIEW</span><h2 id="monthly-plan-dialog-title">{activeFigure && editingFigure ? `Edit ${figures[editingFigure].label}` : "Budget Summary"}</h2></div>
          <button type="button" aria-label="Close editor" onClick={closeEditor}><X size={18}/></button>
        </header>
        {activeFigure && editingFigure ? <form onSubmit={(event) => void saveFigure(event)}>
          <label htmlFor="monthly-plan-figure-value">Number</label>
          <input id="monthly-plan-figure-value" className="monthly-plan-number-input" type="number" min="0" step={activeFigure.currency ? "0.01" : "1"} value={figureDraft.value} onChange={(event) => setFigureDraft({ ...figureDraft, value: Number(event.target.value) })} required autoFocus />
          <label htmlFor="monthly-plan-figure-label">Title</label>
          <input id="monthly-plan-figure-label" className="monthly-plan-number-input" type="text" maxLength={120} value={figureDraft.label} onChange={(event) => setFigureDraft({ ...figureDraft, label: event.target.value })} required />
          <label htmlFor="monthly-plan-figure-detail">Description</label>
          <input id="monthly-plan-figure-detail" className="monthly-plan-number-input" type="text" maxLength={120} value={figureDraft.detail} onChange={(event) => setFigureDraft({ ...figureDraft, detail: event.target.value })} />
          {error && <p className="monthly-plan-form-error" role="alert">{error}</p>}
          <div className="monthly-plan-form-actions">
            <button type="button" className="monthly-plan-cancel" onClick={closeEditor} disabled={saving}>Cancel</button>
            <button type="submit" className="pdf-button" disabled={saving || !figureDraft.label.trim()}><Save size={15}/><span>{saving ? "Saving..." : "Save"}</span></button>
          </div>
        </form> : <form onSubmit={(event) => void saveSummary(event)}>
          <label htmlFor="monthly-plan-content">Write the budget summary</label>
          <textarea id="monthly-plan-content" value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={10000} required autoFocus />
          {error && <p className="monthly-plan-form-error" role="alert">{error}</p>}
          <div className="monthly-plan-form-actions">
            <button type="button" className="monthly-plan-cancel" onClick={closeEditor} disabled={saving}>Cancel</button>
            <button type="submit" className="pdf-button" disabled={saving || !draft.trim()}><Save size={15}/><span>{saving ? "Saving..." : "Save"}</span></button>
          </div>
        </form>}
      </section>
    </div>}
  </>;
}
