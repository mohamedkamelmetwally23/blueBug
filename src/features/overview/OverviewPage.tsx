import { AlertTriangle, CalendarDays, CalendarX2, ClipboardCheck, Download, Mail, RefreshCw, ScrollText, Target, UserCheck, UserPlus, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { MetricCard } from "../../components/MetricCard.js";
import { fetchWeeklyTasks } from "../../lib/api.js";
import type { OverviewMetricDetail, WeeklyTask } from "../../types/contracts.js";
import { MetricDetailsDialog } from "./MetricDetailsDialog.js";
import { MonthlyPlanSummary } from "./MonthlyPlanSummary.js";
import { PdfReport } from "./PdfReport.js";
import { useOverview } from "./useOverview.js";
import { TaskDetailsDialog } from "../weekly-tasks/TaskDetailsDialog.js";

const prettyDate = (date: string) => new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(date));
const sheetTaskCards = [
  { title: "warming new emails on wm", icon: Mail },
  { title: "warming last acc on wm with money", icon: Wallet },
  { title: "trying open new acc", icon: UserPlus }
];

export function OverviewPage({ refreshKey = 0 }: { refreshKey?: number }) {
  const [metricDialog, setMetricDialog] = useState<{ title: string; items: OverviewMetricDetail[]; breakdown?: { good: number; bad: number; pending: number; total: number } } | null>(null);
  const [sheetTasks, setSheetTasks] = useState<WeeklyTask[] | null>(null);
  const [sheetTasksError, setSheetTasksError] = useState<string | null>(null);
  const [sheetTasksReload, setSheetTasksReload] = useState(0);
  const [selectedTask, setSelectedTask] = useState<WeeklyTask | null>(null);
  const { data, error, loading, reload } = useOverview(refreshKey);
  useEffect(() => {
    let active = true;
    setSheetTasksError(null);
    void fetchWeeklyTasks()
      .then((result) => { if (active) setSheetTasks(result.tasks); })
      .catch((reason: unknown) => { if (active) setSheetTasksError(reason instanceof Error ? reason.message : "Could not load sheet tasks"); });
    return () => { active = false; };
  }, [sheetTasksReload, refreshKey]);
  if (loading) return <section className="page-state"><div className="loader"/><p>Preparing your weekly overview...</p></section>;
  if (error) return <section className="page-state error"><AlertTriangle/><h2>Overview unavailable</h2><p>{error}</p><button onClick={() => void reload()}><RefreshCw size={16}/> Try again</button></section>;
  if (!data?.week) return <section className="page-state empty"><CalendarDays/><h2>No active week yet</h2><p>Sync your weekly Google Sheet to get started.</p></section>;
  const week = data.week;

  const exportPdf = () => {
    const originalTitle = document.title;
    document.title = `Blue Bug Weekly Report - ${week.label}`;
    window.addEventListener("afterprint", () => { document.title = originalTitle; }, { once: true });
    window.print();
  };

  return <div className="overview-page">
    <PdfReport data={data}/>
    <div className="screen-dashboard">
    <section className="page-heading">
      <div><p className="eyebrow">WEEKLY COMMAND CENTER</p><h1>Operations overview</h1><p>Here&apos;s what&apos;s moving across operations this week.</p></div>
      <div className="overview-actions">
        <button className="pdf-button" onClick={exportPdf}><Download size={16}/><span>Export PDF</span></button>
        <div className="week-chip"><CalendarDays size={17}/><span>{week.label}<small>{prettyDate(week.start)} — {prettyDate(week.end)}</small></span></div>
      </div>
    </section>
    <section className="metrics-grid">
      <MetricCard label="Scripts completed" value={data.output.scripts.completed} target={data.output.scripts.target} icon={ScrollText} tone="green" onClick={() => setMetricDialog({ title: "Scripts completed", items: data.metricDetails.scripts })}/>
      <MetricCard label="Emails completed" value={data.output.emails.completed} target={data.output.emails.target} icon={Mail} tone="orange" onClick={() => setMetricDialog({ title: "Emails completed", items: data.metricDetails.emails })}/>
      <MetricCard label="Action needed" value={data.output.actionNeeded.completed} target={data.output.actionNeeded.target} icon={ClipboardCheck} tone="orange" showTarget={false} subtitle={`${data.actionBreakdown.good} good · ${data.actionBreakdown.bad} bad · ${data.actionBreakdown.pending} pending`} onClick={() => setMetricDialog({ title: "Action needed", items: data.metricDetails.actionNeeded, breakdown: data.actionBreakdown })}/>
      <MetricCard label="Invitation acceptance" value={data.output.invitationAcceptance.completed} target={data.output.invitationAcceptance.target} icon={UserCheck} tone="violet" showTarget={false} subtitle="Invitations checked from Notes" onClick={() => setMetricDialog({ title: "Invitation acceptance", items: data.metricDetails.invitationAcceptance })}/>
      <MetricCard label="Deactivation check" value={data.output.deactivationCheck.completed} target={data.output.deactivationCheck.target} icon={CalendarX2} tone="orange" showTarget={false} subtitle="Accounts checked from Notes" onClick={() => setMetricDialog({ title: "Deactivation date check", items: data.metricDetails.deactivationCheck })}/>
      <MetricCard label="Target active account" value={data.output.targetActiveAccount.completed} target={data.output.targetActiveAccount.target} icon={Target} tone="violet" showTarget={false} subtitle="Actual results from Notes" onClick={() => setMetricDialog({ title: "Target active account", items: data.metricDetails.targetActiveAccount })}/>
    </section>
    <section className="metrics-grid" aria-label="Sheet task cards">
      {sheetTaskCards.map(({ title, icon: Icon }) => {
        const task = sheetTasks?.find((item) => item.title.trim().toLowerCase().replace(/^\d+\s*/, "").replace(/\s+/g, " ").includes(title));
        if (task) {
          const completed = task.entries.reduce((sum, entry) => sum + entry.completed, 0);
          return <MetricCard key={title} label={task.title} value={completed} target={task.target} icon={Icon} tone="green" subtitle={`${task.status.replaceAll("-", " ")} · ${Math.max(task.target - completed, 0)} remaining`} onClick={() => setSelectedTask(task)}/>;
        }
        return <div className="metric-card" key={title} aria-label={`${title}: ${sheetTasksError ? "sheet data unavailable" : sheetTasks ? "not on sheet" : "loading"}`}>
          <div className="metric-icon green"><Icon size={20}/></div>
          <div className="metric-copy"><span>{title}</span><strong>—</strong><p>{sheetTasksError ? "Sheet data unavailable" : sheetTasks ? "Not on sheet" : "Loading from sheet..."}</p></div>
        </div>;
      })}
    </section>
    {sheetTasksError && <div className="sheet-task-error" role="alert"><span>{sheetTasksError}</span><button onClick={() => setSheetTasksReload((current) => current + 1)}><RefreshCw size={16}/> Retry sheet tasks</button></div>}
    <MonthlyPlanSummary/>
    </div>
    {metricDialog && <MetricDetailsDialog title={metricDialog.title} items={metricDialog.items} breakdown={metricDialog.breakdown} onClose={() => setMetricDialog(null)}/>} 
    {selectedTask && <TaskDetailsDialog task={selectedTask} onClose={() => setSelectedTask(null)}/>}
  </div>;
}
