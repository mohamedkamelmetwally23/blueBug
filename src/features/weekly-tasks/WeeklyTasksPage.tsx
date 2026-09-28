import { CalendarDays, CheckCircle2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { fetchWeeklyTasks } from "../../lib/api.js";
import type { WeeklyTask, WeeklyTasksResponse } from "../../types/contracts.js";
import { TaskDetailsDialog } from "./TaskDetailsDialog.js";
import { TaskFiltersBar } from "./TaskFiltersBar.js";
import { TaskPagination } from "./TaskPagination.js";
import { emptyFilters, filterTasks, paginateTasks, TASKS_PER_PAGE, type TaskFilters } from "./taskFilters.js";

const date = (value: string) => new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(value));

export function WeeklyTasksPage() {
  const [data, setData] = useState<WeeklyTasksResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TaskFilters>(emptyFilters);
  const [page, setPage] = useState(1);
  const [selectedTask, setSelectedTask] = useState<WeeklyTask | null>(null);
  useEffect(() => { void fetchWeeklyTasks().then(setData).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Could not load tasks")); }, []);
  const filteredTasks = useMemo(() => filterTasks(data?.tasks ?? [], filters), [data, filters]);
  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / TASKS_PER_PAGE));
  const activePage = Math.min(page, totalPages);
  const visibleTasks = paginateTasks(filteredTasks, activePage);
  const changeFilters = (next: TaskFilters) => { setFilters(next); setPage(1); };

  if (error) return <section className="page-state error"><h2>Weekly tasks unavailable</h2><p>{error}</p></section>;
  if (!data) return <section className="page-state"><div className="loader"/><p>Loading weekly tasks...</p></section>;
  if (!data.week) return <section className="page-state empty"><CalendarDays/><h2>No active week yet</h2></section>;
  return <div className="overview-page weekly-page">
    <section className="page-heading"><div><p className="eyebrow">WEEKLY TASKS</p><h1>Weekly Tasks</h1><p>{date(data.week.start)} — {date(data.week.end)} · {data.tasks.length} tasks</p></div></section>
    <TaskFiltersBar filters={filters} tasks={data.tasks} onChange={changeFilters}/>
    <section className="panel weekly-table-wrap">
      <div className="table-result-count">Showing {visibleTasks.length} of {filteredTasks.length} tasks</div>
      <table className="weekly-table"><thead><tr><th>Task</th><th>Owner</th><th>Dates</th><th>Progress</th><th>Status</th></tr></thead><tbody>{visibleTasks.map((task) => {
        const completed = task.entries.reduce((sum, entry) => sum + entry.completed, 0);
        return <tr className="clickable-task-row" tabIndex={0} key={task.id} onClick={() => setSelectedTask(task)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelectedTask(task); } }}><td><strong>{task.title}</strong><small>{task.kind}{task.dayBucket ? ` · ${task.dayBucket}` : ""}</small></td><td>{task.owner ?? "Unassigned"}</td><td>{task.startDate ? date(task.startDate) : "—"}{task.endDate ? ` – ${date(task.endDate)}` : ""}</td><td>{completed}/{task.target}</td><td><span className={`task-status ${task.status}`}>{task.status === "completed" && <CheckCircle2 size={12}/>} {task.status.replaceAll("-", " ")}</span></td></tr>;
      })}</tbody></table>
      {visibleTasks.length === 0 && <div className="no-filter-results">No tasks match these filters.</div>}
      <TaskPagination page={activePage} totalPages={totalPages} onPageChange={setPage}/>
    </section>
    {selectedTask && <TaskDetailsDialog task={selectedTask} onClose={() => setSelectedTask(null)}/>} 
  </div>;
}
