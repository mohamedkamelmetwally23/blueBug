import { Bug } from "lucide-react";
import type { OverviewMetricDetail, OverviewResponse } from "../../types/contracts.js";

const dateLabel = (date: string) => new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(date));

function ReportHeader({ label, start, end, page }: { label: string; start: string; end: string; page: string }) {
  return <header className="pdf-report-header">
    <div className="pdf-report-logo"><span><Bug size={24}/></span><div><strong>Blue Bug</strong><small>OPERATIONS REPORT</small></div></div>
    <div className="pdf-report-period"><strong>{page} · {label}</strong><span>{dateLabel(start)} — {dateLabel(end)}</span></div>
  </header>;
}

function ReportFooter({ page }: { page: number }) {
  return <footer><span>Blue Bug Operations</span><span>Generated from the active weekly workflow · {page}/2</span></footer>;
}

export function PdfReport({ data }: { data: OverviewResponse }) {
  if (!data.week) return null;
  const metrics = [
    ["Scripts", `${data.output.scripts.completed}/${data.output.scripts.target}`], ["Emails", `${data.output.emails.completed}/${data.output.emails.target}`],
    ["Action needed", String(data.output.actionNeeded.completed)], ["Invitations", String(data.output.invitationAcceptance.completed)],
    ["Deactivation", String(data.output.deactivationCheck.completed)], ["Active WM", String(data.output.activeWmAccount.completed)],
    ["Target active", String(data.output.targetActiveAccount.completed)],
  ] as const;
  const tasks = uniqueTasks(Object.values(data.metricDetails).flat());

  return <article className="pdf-report">
    <section className="pdf-sheet">
      <ReportHeader label={data.week.label} start={data.week.start} end={data.week.end} page="Weekly overview"/>
      <section className="pdf-report-intro"><div><small>WEEKLY SUMMARY</small><h1>Operations at a glance</h1></div><p><b>{data.actionBreakdown.good}</b> good · <b>{data.actionBreakdown.bad}</b> bad · <b>{data.actionBreakdown.pending}</b> pending</p></section>
      <section className="pdf-report-metrics">{metrics.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</section>
      <div className="pdf-report-columns">
        <section className="pdf-report-section"><header><h2>Work by task type</h2><span>{data.targetVsActual.length} task types</span></header><div className="pdf-report-table">{data.targetVsActual.slice(0, 9).map((item) => <div key={item.taskType}><b>{item.taskType}</b><span>{item.completed} / {item.target}</span><em>{item.remaining} left</em></div>)}</div></section>
        <section className="pdf-report-section"><header><h2>Monthly plan &amp; budget</h2><span>September</span></header><div className="pdf-plan-grid"><div><strong>50</strong><span>Monthly need</span></div><div><strong>33</strong><span>Achieved</span></div><div><strong>17</strong><span>Current gap</span></div><div><strong>$440</strong><span>Received</span></div><div><strong>$372</strong><span>Spent</span></div><div><strong>$68</strong><span>Balance</span></div></div><ul className="pdf-budget-notes"><li>$50 reserved for 10 US accounts.</li><li>Expected gap after purchase: 7 accounts.</li><li>Remaining: NL, MX, ES, IT, CA, FR and JP.</li></ul></section>
      </div>
      <section className="pdf-report-section pdf-blockers"><header><h2>System problems</h2><span>{data.systemBlockers.length} signals</span></header>{data.systemBlockers.length ? <div>{data.systemBlockers.slice(0, 5).map((item, index) => <p key={`${item.task}-${index}`}><em>{item.type}</em><b>{item.task}</b><span>{item.owner} · {item.reason}</span></p>)}</div> : <p className="pdf-no-data">No system problems detected.</p>}</section>
      <ReportFooter page={1}/>
    </section>

    <section className="pdf-sheet pdf-tasks-sheet">
      <ReportHeader label={data.week.label} start={data.week.start} end={data.week.end} page="Weekly tasks"/>
      <section className="pdf-report-intro"><div><small>DETAILED WORK</small><h1>Weekly Tasks</h1></div><p><b>{tasks.length}</b> synced task entries</p></section>
      <div className="pdf-task-head"><span>Task / owner</span><span>Day</span><span>Status</span><span>Progress</span><span>Notes / reason</span></div>
      <div className="pdf-task-list">{tasks.map((task) => <div className="pdf-task-row" key={task.id}><span><b>{task.task}</b><small>{task.owner}</small></span><span>{task.weekday}</span><span className={`pdf-task-status ${task.status}`}>{task.status.replace("-", " ")}</span><strong>{task.completed}/{task.target}</strong><p>{task.reason || "—"}</p></div>)}</div>
      <ReportFooter page={2}/>
    </section>
  </article>;
}

function uniqueTasks(items: OverviewMetricDetail[]) {
  return [...new Map(items.map((item) => [item.id, item])).values()];
}
