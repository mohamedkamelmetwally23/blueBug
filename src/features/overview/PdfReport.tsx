import { Ban, Bug, CalendarDays, ClipboardList, FileText, Mail, Target, UserRoundCheck, UsersRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { OverviewResponse } from "../../types/contracts.js";

const shortDate = (date: string) => new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(date));
const generatedAt = () => new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date());
type ReportMetric = { label: string; completed: number; target: number; Icon: LucideIcon; success?: boolean; danger?: boolean };

export function PdfReport({ data }: { data: OverviewResponse }) {
  if (!data.week) return null;
  const metrics: ReportMetric[] = [
    { label: "Scripts", ...data.output.scripts, Icon: FileText },
    { label: "Emails", ...data.output.emails, Icon: Mail, success: data.output.emails.completed >= data.output.emails.target },
    { label: "Invitations", ...data.output.invitationAcceptance, Icon: UserRoundCheck },
    { label: "Deactivation", ...data.output.deactivationCheck, Icon: Ban, danger: true },
    { label: "Active WM", ...data.output.activeWmAccount, Icon: UsersRound },
    { label: "Target Active", ...data.output.targetActiveAccount, Icon: Target },
  ];
  const blockers = summarizeBlockers(data);
  const notes = buildManagerNotes(data, blockers);
  return <article className="pdf-report"><section className="pdf-sheet">
    <header className="report-hero">
      <div className="report-brand"><span><Bug size={27}/></span><div><strong>Blue Bug</strong><small>OPERATIONS</small></div></div>
      <div className="report-heading"><small>WEEKLY REPORT</small><h1>Weekly Operations Summary</h1><p><b>{data.week.label}</b><span>{shortDate(data.week.start)} — {shortDate(data.week.end)}</span></p></div>
      <div className="report-generated"><CalendarDays size={16}/><span>Generated on<strong>{generatedAt()}</strong></span></div>
    </header>
    <section className="report-metric-grid">{metrics.map(({ label, completed, target, Icon, success, danger }) => {
      const percentage = target ? Math.min(100, Math.round(completed / target * 100)) : completed ? 100 : 0;
      return <article className={`report-metric${success ? " success" : ""}${danger ? " danger" : ""}`} key={label}><div className="report-metric-title"><span><Icon size={18}/></span><b>{label}</b></div><strong>{completed}{target > 0 && <small> / {target}</small>}</strong><div className="report-track"><i style={{ width: `${percentage}%` }}/></div></article>;
    })}</section>
    <div className="report-main-grid">
      <ReportPanel className="report-targets" icon={Target} title="Target vs Actual"><div className="report-legend"><span><i/>Completed</span><span><i/>Remaining</span></div><div className="report-target-list">{metrics.map(metric => {
        const percentage = metric.target ? Math.min(100, metric.completed / metric.target * 100) : metric.completed ? 100 : 0;
        return <div className="report-target-row" key={metric.label}><b>{metric.label}</b><div><i style={{ width: `${percentage}%` }}><span>{metric.completed}</span></i>{metric.target > metric.completed && <em>{metric.target - metric.completed}</em>}</div><strong>{Math.round(percentage)}%</strong></div>;
      })}</div></ReportPanel>
      <ReportPanel className="report-work" icon={ClipboardList} title="Work by Task Type"><div className="report-table"><div className="report-table-head"><span>Task Type</span><span>Required</span><span>Completed</span><span>Remaining</span><span>Status</span></div>{data.targetVsActual.slice(0, 6).map(item => {
        const complete = item.remaining <= 0;
        return <div className="report-table-row" key={item.taskType}><b>{item.taskType}</b><span>{item.target}</span><strong>{item.completed}</strong><span>{item.remaining}</span><em className={complete ? "done" : "doing"}><i/>{complete ? "Completed" : "In Progress"}</em></div>;
      })}</div></ReportPanel>
    </div>
    <div className="report-bottom-grid">
      <ReportPanel className="report-blockers" icon={Ban} title="Key Blockers / Reasons"><div className="blocker-head"><span>Reason</span><span>Count</span><span>% of Total</span></div>{blockers.length ? blockers.slice(0, 5).map(item => <div className="blocker-row" key={item.reason}><b>{item.reason}</b><span>{item.count}</span><strong>{item.percentage}%</strong><div><i style={{ width: `${item.percentage}%` }}/></div></div>) : <p className="report-empty">No blockers reported this week.</p>}</ReportPanel>
      <ReportPanel className="report-notes" icon={FileText} title="Manager Notes / Next Actions"><ol>{notes.map((note, index) => <li key={note}><span>{index + 1}</span><p>{note}</p></li>)}</ol></ReportPanel>
    </div>
    <footer className="report-footer"><span>Blue Bug Operations</span><span>People&nbsp;&nbsp; • &nbsp;&nbsp;Process&nbsp;&nbsp; • &nbsp;&nbsp;Progress</span><span>Weekly Operations Summary&nbsp;&nbsp; <b>{data.week.label}</b>&nbsp;&nbsp; <em>1 / 1</em></span></footer>
  </section></article>;
}

function ReportPanel({ icon: Icon, title, className, children }: { icon: LucideIcon; title: string; className: string; children: React.ReactNode }) {
  return <section className={`report-panel ${className}`}><header><span><Icon size={17}/></span><h2>{title}</h2></header>{children}</section>;
}

function summarizeBlockers(data: OverviewResponse) {
  const counts = new Map<string, number>();
  for (const blocker of data.systemBlockers) { const reason = blocker.reason.trim() || blocker.type; counts.set(reason, (counts.get(reason) ?? 0) + 1); }
  const total = [...counts.values()].reduce((sum, count) => sum + count, 0);
  return [...counts.entries()].map(([reason, count]) => ({ reason, count, percentage: total ? Math.round(count / total * 100) : 0 })).sort((a, b) => b.count - a.count);
}

function buildManagerNotes(data: OverviewResponse, blockers: ReturnType<typeof summarizeBlockers>) {
  const pending = data.targetVsActual.filter(item => item.remaining > 0).sort((a, b) => b.remaining - a.remaining);
  const notes = pending.slice(0, 3).map(item => `Continue working on ${item.taskType.toLowerCase()} (${item.remaining} remaining).`);
  if (blockers[0]) notes.push(`Follow up on ${blockers[0].reason.toLowerCase()} and remove the main blocker.`);
  notes.push(data.weeklyKpis.remaining > 0 ? `Close the remaining ${data.weeklyKpis.remaining} required items and maintain progress on completed tasks.` : "Maintain the current momentum and prepare next week's priorities.");
  return notes.slice(0, 5);
}
