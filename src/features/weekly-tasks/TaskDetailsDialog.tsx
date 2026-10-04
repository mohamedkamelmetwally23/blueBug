import { X } from "lucide-react";
import { useEffect } from "react";
import type { WeeklyTask } from "../../types/contracts.js";

const formatDate = (value?: string) => value ? new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value)) : "—";
const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as const;

export function TaskDetailsDialog({ task, weekTasks, onClose }: { task: WeeklyTask; weekTasks?: WeeklyTask[]; onClose: () => void }) {
  useEffect(() => { const handler = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); }; document.addEventListener("keydown", handler); return () => document.removeEventListener("keydown", handler); }, [onClose]);
  const completed = task.sheetCompleted ?? task.entries.reduce((sum, entry) => sum + entry.completed, 0);
  const dailyRows = weekTasks ? weekdays.map((weekday) => {
    const dayTasks = weekTasks.filter((item) => {
      const taskWeekday = item.dayBucket?.toLowerCase()
        ?? (item.dayDate ? new Intl.DateTimeFormat("en", { weekday: "long", timeZone: "UTC" }).format(new Date(item.dayDate)).toLowerCase() : "");
      return taskWeekday === weekday.toLowerCase();
    });
    return {
      weekday,
      num: dayTasks.reduce((sum, item) => sum + item.target, 0),
      done: dayTasks.reduce((sum, item) => sum + (item.sheetCompleted ?? item.entries.reduce((total, entry) => total + entry.completed, 0)), 0),
      clarifications: dayTasks.map((item) => item.notes?.trim()).filter((notes): notes is string => Boolean(notes)).join("\n") || "—"
    };
  }) : undefined;
  return <div className="dialog-backdrop" role="presentation" onMouseDown={onClose}><section className="task-dialog" role="dialog" aria-modal="true" aria-labelledby="task-dialog-title" onMouseDown={(event) => event.stopPropagation()}>
    <header><div><span className="eyebrow">TASK DETAILS</span><h2 id="task-dialog-title">{task.title}</h2></div><button aria-label="Close task details" onClick={onClose}><X size={18}/></button></header>
    {dailyRows
      ? <div className="task-week-table-wrap"><table className="task-week-table"><thead><tr><th>Day</th><th>Num</th><th>Done</th><th>Clarifications</th></tr></thead><tbody>{dailyRows.map((row) => <tr key={row.weekday}><th scope="row">{row.weekday}</th><td>{row.num}</td><td>{row.done}</td><td className="preserve-lines">{row.clarifications}</td></tr>)}</tbody></table></div>
      : <div className="sheet-fields task-sheet-fields">
        <div><span>Num</span><strong>{task.target}</strong></div>
        <div><span>Done</span><strong>{completed}</strong></div>
        <div><span>Clarifications</span><strong className="preserve-lines">{task.notes || "—"}</strong></div>
      </div>}
  </section></div>;
}
