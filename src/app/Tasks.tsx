import { useState } from "react";
import { ArrowRight, Pencil } from "lucide-react";
import {
  statuses,
  type Category,
  type Task,
  type Page,
  type Employee,
} from "./api";
import { Field, ErrorLine, Empty, Badge, useData, Pager } from "./shared";
export function TaskList({
  revision,
  categories,
  employees,
  employee,
  activity,
  employeeId,
  categoryId,
  open,
  range,
  edit,
}: {
  range?: { start: string; end: string } | undefined;
  revision: number;
  categories: Category[];
  employees: Employee[];
  employee: boolean;
  activity?: boolean;
  employeeId?: string;
  categoryId?: string;
  open: (t: Task) => void;
  edit?: ((t: Task) => void) | undefined;
}) {
  const [filters, setFilters] = useState({
    categoryId: categoryId ?? "",
    employeeId: employeeId ?? "",
    status: "",
    weekday: "",
    from: "",
    to: "",
  });
  const [page, setPage] = useState(1);
  const query = new URLSearchParams({ page: String(page), limit: "20" });
  if (activity) query.set("history", "true");
  Object.entries(filters).forEach(([key, value]) => {
    if (value) query.set(key, value);
  });
  if (range) { query.delete("day"); query.set("from", range.start); query.set("to", range.end); }
  const data = useData<Page<Task>>("/tasks?" + query, revision);
  function filter(key: string, value: string) {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  }
  return (
    <>
      <div className="filters">
        {!categoryId && (
          <Field label="Category">
            <select
              value={filters.categoryId}
              onChange={(e) => filter("categoryId", e.target.value)}
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
        )}
        {!employee && !employeeId && (
          <Field label="Employee">
            <select
              value={filters.employeeId}
              onChange={(e) => filter("employeeId", e.target.value)}
            >
              <option value="">All employees</option>
              {employees.map((e) => (
                <option key={e._id} value={e._id}>
                  {e.name}
                </option>
              ))}
            </select>
          </Field>
        )}
        <Field label="Status">
          <select
            value={filters.status}
            onChange={(e) => filter("status", e.target.value)}
          >
            <option value="">All statuses</option>
            {statuses.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>
        {range ? null : activity ? (
          <>
            <Field label="From date">
              <input
                type="date"
                value={filters.from}
                onChange={(e) => filter("from", e.target.value)}
              />
            </Field>
            <Field label="To date">
              <input
                type="date"
                value={filters.to}
                onChange={(e) => filter("to", e.target.value)}
              />
            </Field>
          </>
        ) : (
          <Field label="Day">
            <select value={filters.weekday} onChange={(e) => filter("weekday", e.target.value)}>
              <option value="">All days</option>
              {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => <option key={day} value={day}>{day}</option>)}
            </select>
          </Field>
        )}
      </div>
      <ErrorLine message={data.error} />
      {data.loading ? (
        <p role="status">Loading tasks…</p>
      ) : !data.data?.items.length ? (
        <Empty>
          {employee
            ? "Assigned tasks and saved work will appear here."
            : "Create a category, then assign a task to an employee."}
        </Empty>
      ) : (
        <>
          <div className="table-wrap task-table-wrap" role="region" aria-label="Tasks" tabIndex={0}>
            <table className={`task-sheet-table${(edit && !employee) || (employee && activity) ? " task-table-editable" : ""}`}>
              <thead>
                <tr>
                  <th scope="col" className="task-category-col">Task / Category</th>
                  {!employee && <th scope="col" className="task-owner-col">Owner</th>}
                  <th scope="col" className="task-status-col">Status</th>
                  <th scope="col" className="task-date-col">Schedule</th>
                  <th scope="col" className="task-accounts-col">Accounts</th>
                  <th scope="col" className="task-done-col">Done</th>
                  <th scope="col" className="task-notes-col">Clarifications</th>
                  <th scope="col" className="task-actions-col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.data.items.map((task) => (
                  <tr key={task._id}>
                    <td className="task-category-cell">
                      <strong title={task.categorySchema.name}>{task.categorySchema.name}</strong>
                      {task.workFormat !== "sheet" &&
                        task.title !== task.categorySchema.name && (
                          <small>{task.title}</small>
                        )}
                      {task.instructions && (
                        <small title={task.instructions}>
                          {task.instructions}
                        </small>
                      )}
                    </td>
                    {!employee && <td><span className="task-preview" title={task.employeeName}>{task.employeeName || "?"}</span></td>}
                    <td>{task.status ? <Badge status={task.status} /> : ""}</td>
                    <td className="task-schedule">
                      <span>{task.workDate || "?"}</span>
                      {task.day && <small>{task.day}</small>}
                      {task.endDate && <small>To {task.endDate}</small>}
                    </td>
                    <td className="task-cell-text" title={task.accountNames}>
                      <span className="task-preview">{task.accountNames || "?"}</span>
                    </td>
                    <td className="task-done-cell">
                      <span>{task.workFormat === "sheet"
                        ? (task.numDone ?? "")
                        : task.actualQuantity}</span>
                    </td>
                    <td className="task-cell-text" title={task.notes}>
                      <span className="task-preview">{task.notes || "?"}</span>
                    </td>
                    <td className="task-actions-cell">
                      <div className="actions">
                        <button
                          className="secondary"
                          onClick={() => open(task)}
                        >
                          {employee && !activity
                            ? !task.status || task.status === "Not Started"
                              ? "Start"
                              : "Edit"
                            : "View details"}
                          {employee && !activity && task.status && task.status !== "Not Started"
                            ? <Pencil size={14} />
                            : <ArrowRight size={14} />}
                        </button>
                        {edit && !employee && (
                          <button
                            className="secondary"
                            aria-label={`Edit ${task.title}`}
                            onClick={() => edit(task)}
                          >
                            <Pencil size={15} />
                            Edit
                          </button>
                        )}
                        {employee && activity && (
                          <button
                            className="secondary"
                            aria-label={`Edit ${task.title}`}
                            onClick={() => open(task)}
                          >
                            <Pencil size={15} />
                            Edit
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager
            page={page}
            total={data.data.total}
            limit={20}
            change={setPage}
          />
        </>
      )}
    </>
  );
}
