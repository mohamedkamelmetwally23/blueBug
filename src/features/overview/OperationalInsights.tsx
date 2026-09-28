import type { OverviewResponse } from "../../types/contracts.js";

export function OperationalInsights({ data }: { data: OverviewResponse }) {
  return <section className="insights-section">
    <div className="details-heading"><div><p className="eyebrow">WEEKLY DETAILS</p><h2>What needs attention</h2></div><span>Based on synced task notes</span></div>
    <div className="insight-grid">
      <article className="panel insight-panel target-panel"><PanelTitle title="Work by task type" subtitle="Weekly target compared with actual output" count={`${data.targetVsActual.length} task types`}/><div className="compact-list">{data.targetVsActual.map((item) => <div key={item.taskType}><span><b>{item.taskType}</b><small>{item.completed} of {item.target}</small></span><div className="mini-track"><i style={{ width: `${item.target ? Math.min(100, item.completed / item.target * 100) : 0}%` }}/></div><em>{item.remaining} left</em></div>)}</div></article>
      <article className="panel insight-panel target-panel"><PanelTitle title="System Problems" subtitle="Credential and operational issues" count={`${data.systemBlockers.length} signals`}/>{data.systemBlockers.length ? <div className="blocker-list">{data.systemBlockers.slice(0, 10).map((item, index) => <div key={`${item.task}-${index}`}><em className={item.type}>{item.type}</em><span><b>{item.task}</b><small>{item.reason}</small></span></div>)}</div> : <p className="quiet-copy">No system blockers detected.</p>}</article>
    </div>
  </section>;
}

function PanelTitle({ title, subtitle, count }: { title: string; subtitle: string; count: string }) {
  return <header className="insight-title"><div><h3>{title}</h3><p>{subtitle}</p></div><span>{count}</span></header>;
}
