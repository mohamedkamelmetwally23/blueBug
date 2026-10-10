import { ArrowRight, CalendarDays, Tags } from "lucide-react";
import { statuses, type Category, type Employee, type Overview } from "./api";
import { Empty, ErrorLine, useData } from "./shared";
export function Employees({
  data,
  loading,
  open,
}: {
  data: Employee[] | undefined;
  loading: boolean;
  open: (e: Employee) => void;
}) {
  return loading ? (
    <p role="status">Loading employees…</p>
  ) : !data?.length ? (
    <Empty>Employees will appear here.</Empty>
  ) : (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Employee</th>
            <th>Assigned</th>
            <th>Completed</th>
            <th>Work quantity</th>
            <th>Last activity</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          {data.map((e) => (
            <tr key={e._id}>
              <td>
                <strong>{e.name}</strong>
                <small>
                  {statuses
                    .map(
                      (s) =>
                        `${s}: ${e.statuses.filter((v) => v === s).length}`,
                    )
                    .join(" · ")}
                </small>
              </td>
              <td>{e.assigned}</td>
              <td>{e.completed}</td>
              <td>{e.quantity}</td>
              <td>
                {e.lastActivity
                  ? new Date(e.lastActivity).toLocaleString("en-GB", {
                      timeZone: "Africa/Cairo",
                    })
                  : "No activity"}
              </td>
              <td>
                <button className="secondary" onClick={() => open(e)}>
                  View work
                  <ArrowRight size={14} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Bars({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; value: number }[];
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <section className="chart">
      <h2>{title}</h2>
      {rows.length ? (
        rows.map((r) => (
          <div className="bar-row" key={r.label}>
            <span title={r.label}>{r.label}</span>
            <div>
              <i style={{ width: `${(r.value / max) * 100}%` }} />
            </div>
            <strong>{r.value}</strong>
          </div>
        ))
      ) : (
        <p className="muted">Recorded activity will appear here.</p>
      )}
    </section>
  );
}

export function OverviewPanel({
  revision,
  open,
}: {
  revision: number;
  open: (c: Category) => void;
}) {
  const data = useData<Overview>("/overview", revision);
  const categories = data.data?.categories ?? [];
  const all = categories.flatMap((c) => c.statuses);
  return (
    <>
      <ErrorLine message={data.error} />
      {data.loading ? (
        <p role="status">Loading overview…</p>
      ) : (
        <>
          <div className="cards">
            {categories.length ? (
              categories.map((c) => (
                <button
                  className="card category-card"
                  key={c._id}
                  onClick={() => open(c)}
                >
                  <div className="card-top">
                    <span className="category-icon">
                      <Tags size={20} />
                    </span>
                    <ArrowRight size={18} />
                  </div>
                  <h2>{c.name}</h2>
                  <div className="stats">
                    <div>
                      <strong>{c.tasks}</strong>
                      <span>Tasks</span>
                    </div>
                    <div>
                      <strong>{c.completed}</strong>
                      <span>Completed</span>
                    </div>
                    <div>
                      <strong>{c.quantity}</strong>
                      <span>Work recorded</span>
                    </div>
                  </div>
                  {c.target > 0 && (
                    <div className="target-progress">
                      <span>
                        {c.targetedQuantity} / {c.target} targeted units
                      </span>
                      <progress
                        max={c.target}
                        value={Math.min(c.target, c.targetedQuantity)}
                      />
                    </div>
                  )}
                </button>
              ))
            ) : (
              <Empty>
                Categories and real team activity will appear once your
                Coordinator creates work.
              </Empty>
            )}
          </div>
          <div className="charts">
            <Bars
              title="Tasks by Category"
              rows={categories.map((c) => ({ label: c.name, value: c.tasks }))}
            />
            <Bars
              title="Task Status Distribution"
              rows={
                all.length
                  ? statuses.map((s) => ({
                      label: s,
                      value: all.filter((v) => v === s).length,
                    }))
                  : []
              }
            />
            <Bars
              title="Work Activity Trend"
              rows={(data.data?.trend ?? []).map((d) => ({
                label: d._id,
                value: d.quantity,
              }))}
            />
          </div>
        </>
      )}
      <div className="coming-soon">
        <CalendarDays size={18} />
        <strong>Monthly Financial Report — Coming Soon</strong>
      </div>
    </>
  );
}

export { Financial } from "./Financial";
