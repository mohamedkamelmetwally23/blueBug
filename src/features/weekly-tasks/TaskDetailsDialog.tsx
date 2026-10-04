import { X } from "lucide-react";
import { useEffect } from "react";
import type { WeeklyTask } from "../../types/contracts.js";
import { dailyTaskProgress } from "../overview/weekTaskProgress.js";

const formatDate = (value?: string) => value ? new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value)) : "—";

export function TaskDetailsDialog({ task, weekTasks, onClose }: { task: WeeklyTask; weekTasks?: WeeklyTask[]; onClose: () => void }) {
  useEffect(() => { const handler = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); }; document.addEventListener("keydown", handler); return () => document.removeEventListener("keydown", handler); }, [onClose]);
  const completed = task.sheetCompleted ?? task.entries.reduce((sum, entry) => sum + entry.completed, 0);
  const dailyRows = weekTasks ? dailyTaskProgress(weekTasks) : undefined;
  return <div className="dialog-backdrop" role="presentation" onMouseDown={onClose}><section className={`task-dialog${dailyRows ? " task-week-dialog" : ""}`} role="dialog" aria-modal="true" aria-labelledby="task-dialog-title" onMouseDown={(event) => event.stopPropagation()}>
    <header><div><span className="eyebrow">TASK DETAILS</span><h2 id="task-dialog-title">{task.title}</h2></div><button aria-label="Close task details" onClick={onClose}><X size={18}/></button></header>
    {dailyRows
      ? <div className="task-week-table-wrap"><table className="task-week-table"><thead><tr><th>Day</th><th>Names of acc</th><th>Num Done</th><th>Clarifications</th></tr></thead><tbody>{dailyRows.map((row) => <tr key={row.weekday}><th scope="row">{row.weekday}</th><td className="preserve-lines">{row.namesOfAcc}</td><td>{row.numDone}</td><td className="preserve-lines">{row.clarifications}</td></tr>)}</tbody></table></div>
      : <div className="sheet-fields task-sheet-fields">
        <div><span>Names of acc</span><strong className="preserve-lines">{task.accountNames || "—"}</strong></div>
        <div><span>Num Done</span><strong>{completed}</strong></div>
        <div><span>Clarifications</span><strong className="preserve-lines">{task.notes || "—"}</strong></div>
      </div>}
  </section></div>;
}
