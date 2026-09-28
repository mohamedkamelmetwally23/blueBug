import { X } from "lucide-react";
import { useEffect } from "react";
import type { WeeklyTask } from "../../types/contracts.js";

const formatDate = (value?: string) => value ? new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value)) : "—";

export function TaskDetailsDialog({ task, onClose }: { task: WeeklyTask; onClose: () => void }) {
  useEffect(() => { const handler = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); }; document.addEventListener("keydown", handler); return () => document.removeEventListener("keydown", handler); }, [onClose]);
  const completed = task.entries.reduce((sum, entry) => sum + entry.completed, 0);
  return <div className="dialog-backdrop" role="presentation" onMouseDown={onClose}><section className="task-dialog" role="dialog" aria-modal="true" aria-labelledby="task-dialog-title" onMouseDown={(event) => event.stopPropagation()}>
    <header><div><span className="eyebrow">TASK DETAILS</span><h2 id="task-dialog-title">{task.title}</h2></div><button aria-label="Close task details" onClick={onClose}><X size={18}/></button></header>
    <div className="task-detail-grid"><Detail label="Owner" value={task.owner ?? "Unassigned"}/><Detail label="Status" value={task.status.replaceAll("-", " ")}/><Detail label="Day" value={task.dayBucket ? `${task.dayBucket}${task.dayDate ? ` · ${formatDate(task.dayDate)}` : ""}` : "—"}/><Detail label="Category" value={task.kind}/><Detail label="Dates" value={`${formatDate(task.startDate)} – ${formatDate(task.endDate)}`}/><Detail label="Progress" value={`${completed} / ${task.target}`}/></div>
    <DetailSection title="Deliverable" content={task.deliverable}/><DetailSection title="Notes" content={task.notes} preserveLines/>
  </section></div>;
}
function Detail({ label, value }: { label: string; value: string }) { return <div className="task-detail"><span>{label}</span><strong>{value}</strong></div>; }
function DetailSection({ title, content, preserveLines = false }: { title: string; content: string | undefined; preserveLines?: boolean }) { return <div className="detail-section"><h3>{title}</h3><p className={preserveLines ? "preserve-lines" : undefined}>{content || "—"}</p></div>; }

