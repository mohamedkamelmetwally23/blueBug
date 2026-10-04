import { X } from "lucide-react";
import { useEffect } from "react";
import type { OverviewMetricDetail } from "../../types/contracts.js";

interface ActionBreakdown { good: number; bad: number; pending: number; total: number; }
export function MetricDetailsDialog({ title, items, breakdown, onClose }: { title: string; items: OverviewMetricDetail[]; breakdown: ActionBreakdown | undefined; onClose: () => void }) {
  useEffect(() => { const handler = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); }; document.addEventListener("keydown", handler); return () => document.removeEventListener("keydown", handler); }, [onClose]);
  return <div className="dialog-backdrop" onMouseDown={onClose}><section className="task-dialog metric-dialog" role="dialog" aria-modal="true" aria-labelledby="metric-dialog-title" onMouseDown={(event) => event.stopPropagation()}>
    <header><div><span className="eyebrow">WEEKLY BREAKDOWN</span><h2 id="metric-dialog-title">{title}</h2></div><button aria-label="Close details" onClick={onClose}><X size={18}/></button></header>
    {breakdown && <><div className="outcome-summary"><div><span>Total checked</span><strong>{breakdown.total}</strong></div><div className="good"><span>Good</span><strong>{breakdown.good}</strong></div><div className="bad"><span>Bad</span><strong>{breakdown.bad}</strong></div><div className="not-found"><span>Pending</span><strong>{breakdown.pending}</strong></div></div><p className="outcome-help">Good: ✅ ☑️ ➡️ · Bad: ⛔ 🔒 🚩 · Pending: checked accounts without a result emoji.</p></>}
    <div className="metric-detail-list">{items.length ? items.map((item) => <article className={breakdown ? "daily-outcome" : item.noteQuantity ? "note-quantity-row" : undefined} key={item.id}>
      <div className="metric-detail-heading"><strong>{item.task || item.weekday}</strong><small>{item.weekday} · {item.status.replaceAll("-", " ")}</small></div>
      <SheetFields num={item.target} done={item.completed} clarifications={item.clarifications}/>
      {breakdown && <div className="daily-outcome-counts"><span className="good">Good <b>{item.accountOutcomes?.good ?? 0}</b></span><span className="bad">Bad <b>{(item.accountOutcomes?.bad ?? 0) + (item.accountOutcomes?.notFound ?? 0)}</b></span><span className="not-found">Pending <b>{Math.max(item.target - (item.accountOutcomes?.total ?? 0), 0)}</b></span></div>}
    </article>) : <p className="quiet-copy">No task details available.</p>}</div>
  </section></div>;
}

function SheetFields({ num, done, clarifications }: { num: number; done: number; clarifications: string | undefined }) {
  return <div className="sheet-fields">
    <div><span>Num</span><strong>{num}</strong></div>
    <div><span>Done</span><strong>{done}</strong></div>
    <div><span>Clarifications</span><strong className="preserve-lines">{clarifications || "—"}</strong></div>
  </div>;
}
