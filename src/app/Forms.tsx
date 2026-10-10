import { TaskSheet } from "./TaskSheet";
import { useState } from "react";
import { Pencil, Trash2, Check } from "lucide-react";
import {
  api,
  cairoDate,
  statuses,
  type Category,
  type Task,
  type Entry,
  type Page,
  type Employee,
  type DynamicField,
} from "./api";
import {
  Field,
  ErrorLine,
  Badge,
  useData,
  Pager,
  PasswordInput,
} from "./shared";
export function TaskForm({
  task,
  categories,
  employees,
  done,
  cancel,
}: {
  task: Task | undefined;
  categories: Category[];
  employees: Employee[];
  done: () => void;
  cancel: () => void;
}) {
  const [categoryIds, setCategoryIds] = useState<string[]>(
    task ? [task.categoryId] : [],
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        if (busy) return;
        if (!categoryIds.length) {
          setError("Choose at least one category.");
          return;
        }
        const values = new FormData(event.currentTarget);
        setBusy(true);
        setError("");
        try {
          for (const categoryId of categoryIds) {
            await api(
              "/tasks" + (task ? "/" + task._id : ""),
              task ? "PUT" : "POST",
              {
                categoryId,
                assignedEmployee: values.get("assignedEmployee"),
                workDate: values.get("workDate"),
                instructions: values.get("instructions"),
                ...(task && task.workFormat !== "sheet"
                  ? { title: task.title, target: task.target ?? null }
                  : {}),
              },
            );
            if (!task)
              setCategoryIds((selected) =>
                selected.filter((id) => id !== categoryId),
              );
          }
          done();
        } catch (error) {
          setError((error as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="form-grid">
        {task ? (
          <Field label="Category">
            <input value={task.categorySchema.name} disabled />
          </Field>
        ) : (
          <fieldset className="task-category-picker" disabled={busy}>
            <legend>Categories</legend>
            <p className="hint">
              Choose one or more categories. Each creates a separate task.
            </p>
            <div className="task-category-options">
              {categories
                .filter((category) => category.active)
                .map((category) => (
                  <label className="checkbox" key={category._id}>
                    <input
                      type="checkbox"
                      checked={categoryIds.includes(category._id)}
                      onChange={(event) =>
                        setCategoryIds((selected) =>
                          event.target.checked
                            ? [...selected, category._id]
                            : selected.filter((id) => id !== category._id),
                        )
                      }
                    />
                    <span>{category.name}</span>
                  </label>
                ))}
            </div>
            {!categories.some((category) => category.active) && (
              <p className="hint">No active categories available.</p>
            )}
          </fieldset>
        )}
        <Field label="Assigned to">
          <select
            name="assignedEmployee"
            required
            defaultValue={task?.assignedEmployee ?? ""}
          >
            <option value="">Choose employee</option>
            {employees.map((employee) => (
              <option key={employee._id} value={employee._id}>
                {employee.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Start date">
          <input
            name="workDate"
            type="date"
            required
            defaultValue={task?.workDate ?? cairoDate()}
          />
        </Field>
      </div>
      <Field label="Additional information (optional)">
        <textarea
          name="instructions"
          rows={3}
          maxLength={5000}
          defaultValue={task?.instructions}
          placeholder="Anything the employee needs to know..."
        />
      </Field>
      <p className="hint">
        The employee will fill in the remaining work details after assignment.
      </p>
      <ErrorLine message={error} />
      <div className="form-actions">
        <button
          type="button"
          className="secondary"
          disabled={busy}
          onClick={cancel}
        >
          Cancel
        </button>
        <button disabled={busy || !categoryIds.length}>
          {busy
            ? "Saving..."
            : categoryIds.length > 1
              ? `Save ${categoryIds.length} tasks`
              : "Save task"}
        </button>
      </div>
    </form>
  );
}
export function CategoryForm({
  category,
  done,
  cancel,
}: {
  category: Category | undefined;
  done: () => void;
  cancel: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (busy) return;
        const f = new FormData(e.currentTarget);
        setBusy(true);
        setError("");
        try {
          await api(
            "/categories" + (category ? "/" + category._id : ""),
            category ? "PUT" : "POST",
            {
              name: f.get("name"),
              description: f.get("description"),
              mode: category?.mode ?? "entries",
              targetBehavior: category?.targetBehavior ?? "optional",
              results: category?.results ?? [],
              fields: category?.fields ?? [],
              active: category?.active ?? true,
            },
          );
          done();
        } catch (e) {
          setError((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <Field label="Category name">
        <input
          name="name"
          defaultValue={category?.name}
          required
          maxLength={100}
        />
      </Field>
      <Field label="Description">
        <textarea
          name="description"
          defaultValue={category?.description}
          rows={2}
          maxLength={2000}
        />
      </Field>
      <ErrorLine message={error} />
      <div className="form-actions">
        <button type="button" className="secondary" onClick={cancel}>
          Cancel
        </button>
        <button disabled={busy}>{busy ? "Saving…" : "Save category"}</button>
      </div>
    </form>
  );
}

export function DynamicInput({
  field,
  value,
}: {
  field: DynamicField;
  value: unknown;
}) {
  const common = { name: "dynamic:" + field.key, required: field.required };
  return (
    <Field label={field.label + (field.required ? " *" : "")}>
      {field.type === "longtext" ? (
        <textarea
          {...common}
          defaultValue={String(value ?? "")}
          maxLength={5000}
        />
      ) : field.type === "dropdown" ? (
        <select {...common} defaultValue={String(value ?? "")}>
          <option value="">Choose an option</option>
          {field.options.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      ) : field.type === "boolean" ? (
        <select
          {...common}
          defaultValue={value === undefined ? "" : String(value)}
        >
          <option value="">Choose</option>
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
      ) : (
        <input
          {...common}
          type={
            field.type === "number"
              ? "number"
              : field.type === "date"
                ? "date"
                : "text"
          }
          step={field.type === "number" ? "any" : undefined}
          defaultValue={String(value ?? "")}
          maxLength={500}
        />
      )}
    </Field>
  );
}

function LegacyWorkForm({
  task,
  writable,
  coordinator,
  refresh,
  done,
}: {
  task: Task;
  writable: boolean;
  coordinator: boolean;
  refresh: () => void;
  done: () => void;
}) {
  const [page, setPage] = useState(1);
  const [version, setVersion] = useState(0);
  const [editing, setEditing] = useState<Entry>();
  const [formKey, setFormKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [status, setStatus] = useState(task.status);
  const [notes, setNotes] = useState(task.notes);
  const [quantity, setQuantity] = useState(task.aggregateQuantity);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const path = "/tasks/" + task._id;
  const entries = useData<Page<Entry>>(
    path + "/entries?page=" + page + "&limit=20",
    version,
  );
  const definition = task.categorySchema;
  async function mutate(action: () => Promise<unknown>, message: string) {
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
      setVersion((v) => v + 1);
      refresh();
      setNotice(message);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const actual =
    definition.mode === "aggregate"
      ? quantity
      : (entries.data?.total ?? task.actualQuantity);
  return (
    <>
      <div className="task-summary">
        <div className="meta">
          {definition.name} · {task.workDate} · {task.employeeName}
        </div>
        <p>{task.instructions || "No additional instructions."}</p>
        <div className="summary-bottom">
          <Badge status={status} />
          <strong>
            {actual} recorded{" "}
            {task.target != null && (
              <span className="muted">/ {task.target} target</span>
            )}
          </strong>
        </div>
      </div>
      {writable ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void mutate(
              () =>
                api(path + "/progress", "PATCH", {
                  status,
                  notes,
                  ...(definition.mode === "aggregate"
                    ? { aggregateQuantity: quantity }
                    : {}),
                }),
              "Progress saved.",
            );
          }}
        >
          <div className="form-grid">
            <Field label="Task status">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {statuses.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
            {definition.mode === "aggregate" && (
              <Field label="Completed quantity">
                <input
                  type="number"
                  min={0}
                  max={1000000000}
                  required
                  step={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                />
              </Field>
            )}
          </div>
          <Field label="Task notes">
            <textarea
              value={notes}
              maxLength={5000}
              rows={2}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Field>
          <div className="actions">
            <button disabled={busy}>Save progress</button>
            <button
              type="button"
              className="secondary"
              disabled={busy}
              onClick={() =>
                void mutate(async () => {
                  await api(path + "/progress", "PATCH", {
                    status: "Completed",
                    notes,
                    ...(definition.mode === "aggregate"
                      ? { aggregateQuantity: quantity }
                      : {}),
                  });
                  setStatus("Completed");
                }, "Task marked Completed.")
              }
            >
              <Check size={15} />
              Mark Completed
            </button>
          </div>
        </form>
      ) : (
        <section>
          <h3>Task notes</h3>
          <p className="preserve">{task.notes || "No notes recorded."}</p>
        </section>
      )}
      <ErrorLine message={error} />
      {notice && (
        <p className="notice" role="status">
          {notice}
        </p>
      )}
      {definition.mode === "entries" && (
        <>
          {writable && (
            <form
              key={formKey}
              className="entry-form"
              onSubmit={async (e) => {
                e.preventDefault();
                if (busy) return;
                const form = e.currentTarget;
                const f = new FormData(form);
                const values: Record<string, unknown> = {};
                for (const field of definition.fields) {
                  const value = f.get("dynamic:" + field.key);
                  if (value !== "" && value !== null)
                    values[field.key] =
                      field.type === "number"
                        ? Number(value)
                        : field.type === "boolean"
                          ? value === "true"
                          : value;
                }
                const submitter = (e.nativeEvent as SubmitEvent)
                  .submitter as HTMLButtonElement | null;
                const another = submitter?.value === "another";
                await mutate(
                  async () => {
                    await api(
                      path + "/entries" + (editing ? "/" + editing._id : ""),
                      editing ? "PUT" : "POST",
                      {
                        identifier: f.get("identifier"),
                        result: f.get("result") ?? "",
                        notes: f.get("entryNotes"),
                        values,
                      },
                    );
                    setEditing(undefined);
                    setFormKey((k) => k + 1);
                    setPage(1);
                    if (another)
                      requestAnimationFrame(() =>
                        document
                          .querySelector<HTMLInputElement>(
                            '[name="identifier"]',
                          )
                          ?.focus(),
                      );
                  },
                  editing ? "Entry updated." : "Entry saved.",
                );
              }}
            >
              <h3>{editing ? "Edit work entry" : "Record work"}</h3>
              <Field label="Account / item identifier">
                <input
                  name="identifier"
                  defaultValue={editing?.identifier}
                  required
                  maxLength={300}
                />
              </Field>
              {definition.results.length > 0 && (
                <Field label="Result classification">
                  <select
                    name="result"
                    required
                    defaultValue={editing?.result ?? ""}
                  >
                    <option value="">Choose result</option>
                    {definition.results.map((r) => (
                      <option key={r}>{r}</option>
                    ))}
                  </select>
                </Field>
              )}
              {definition.fields.map((field) => (
                <DynamicInput
                  key={field.key}
                  field={field}
                  value={editing?.values[field.key]}
                />
              ))}
              <Field label="Entry notes">
                <textarea
                  name="entryNotes"
                  rows={2}
                  defaultValue={editing?.notes}
                  maxLength={5000}
                />
              </Field>
              <div className="actions">
                <button disabled={busy} value="save">
                  {busy ? "Saving…" : "Save entry"}
                </button>
                <button disabled={busy} className="secondary" value="another">
                  Save & Add Another
                </button>
                {editing && (
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => {
                      setEditing(undefined);
                      setFormKey((k) => k + 1);
                    }}
                  >
                    Cancel edit
                  </button>
                )}
              </div>
            </form>
          )}
          <div className="section-heading">
            <h3>Saved entries</h3>
            <span className="meta">{entries.data?.total ?? 0} records</span>
          </div>
          <ErrorLine message={entries.error} />
          {entries.loading ? (
            <p role="status">Loading entries…</p>
          ) : entries.data?.items.length ? (
            <>
              <div className="entries">
                {entries.data.items.map((entry) => (
                  <article className="entry" key={entry._id}>
                    <div className="section-heading">
                      <strong>{entry.identifier}</strong>
                      {entry.result && (
                        <span className="badge">{entry.result}</span>
                      )}
                    </div>
                    <dl>
                      {definition.fields
                        .filter((f) => entry.values[f.key] !== undefined)
                        .map((f) => (
                          <div key={f.key}>
                            <dt>{f.label}</dt>
                            <dd>{String(entry.values[f.key])}</dd>
                          </div>
                        ))}
                    </dl>
                    {entry.notes && <p className="preserve">{entry.notes}</p>}
                    <small className="muted">
                      {new Date(entry.updatedAt).toLocaleString("en-GB", {
                        timeZone: "Africa/Cairo",
                      })}
                    </small>
                    {writable && (
                      <div className="actions">
                        <button
                          className="secondary"
                          disabled={busy}
                          onClick={() => {
                            setEditing(entry);
                            setFormKey((k) => k + 1);
                            requestAnimationFrame(() =>
                              document
                                .querySelector<HTMLInputElement>(
                                  '[name="identifier"]',
                                )
                                ?.focus(),
                            );
                          }}
                        >
                          <Pencil size={14} />
                          Edit
                        </button>
                        <button
                          className="secondary danger"
                          disabled={busy}
                          onClick={() =>
                            void mutate(async () => {
                              await api(
                                path + "/entries/" + entry._id,
                                "DELETE",
                              );
                              if (editing?._id === entry._id) {
                                setEditing(undefined);
                                setFormKey((k) => k + 1);
                              }
                              if (entries.data?.items.length === 1 && page > 1)
                                setPage((p) => p - 1);
                            }, "Entry removed.")
                          }
                        >
                          <Trash2 size={14} />
                          Remove
                        </button>
                      </div>
                    )}
                  </article>
                ))}
              </div>
              <Pager
                page={page}
                total={entries.data.total}
                limit={20}
                change={setPage}
              />
            </>
          ) : (
            <p className="muted">No work entries saved yet.</p>
          )}
        </>
      )}
      {coordinator && (
        <div className="delete-section">
          {deleteConfirm ? (
            <>
              <p>
                Delete this task? Only tasks without recorded work can be
                deleted.
              </p>
              <div className="actions">
                <button
                  disabled={busy}
                  onClick={() =>
                    void mutate(async () => {
                      await api(path, "DELETE");
                      done();
                    }, "Task deleted.")
                  }
                >
                  Confirm delete
                </button>
                <button
                  className="secondary"
                  onClick={() => setDeleteConfirm(false)}
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <button
              className="secondary danger"
              onClick={() => setDeleteConfirm(true)}
            >
              <Trash2 size={14} />
              Delete task
            </button>
          )}
        </div>
      )}
    </>
  );
}
export function DeleteCategoryForm({
  category,
  done,
  cancel,
}: {
  category: Category;
  done: () => void;
  cancel: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (busy) return;
        setBusy(true);
        setError("");
        try {
          await api("/categories/" + category._id, "DELETE");
          done();
        } catch (e) {
          setError((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <p>
        Delete <strong>{category.name}</strong>? This cannot be undone.
      </p>
      <p className="hint">Categories linked to tasks cannot be deleted.</p>
      <ErrorLine message={error} />
      <div className="form-actions">
        <button
          type="button"
          className="secondary"
          disabled={busy}
          onClick={cancel}
        >
          Cancel
        </button>
        <button
          disabled={busy}
          style={{ background: "var(--danger)", borderColor: "var(--danger)" }}
        >
          {busy ? "Deleting…" : "Delete category"}
        </button>
      </div>
    </form>
  );
}

export function EmployeeForm({
  done,
  cancel,
}: {
  done: () => void;
  cancel: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        if (busy) return;
        const values = new FormData(event.currentTarget);
        setBusy(true);
        setError("");
        try {
          await api("/employees", "POST", {
            name: values.get("name"),
            email: values.get("email"),
            password: values.get("password"),
          });
          done();
        } catch (error) {
          setError((error as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <p className="hint">
        Create an employee account to sign in and receive assigned tasks.
      </p>
      <Field label="Full name">
        <input name="name" autoComplete="name" required maxLength={100} />
      </Field>
      <Field label="Email">
        <input
          name="email"
          type="email"
          autoComplete="off"
          required
          maxLength={200}
        />
      </Field>
      <Field label="Password">
        <PasswordInput
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          maxLength={200}
        />
      </Field>
      <p className="hint">
        Use at least 8 characters. Share these sign-in details with the
        employee.
      </p>
      <ErrorLine message={error} />
      <div className="form-actions">
        <button
          type="button"
          className="secondary"
          disabled={busy}
          onClick={cancel}
        >
          Cancel
        </button>
        <button disabled={busy}>
          {busy ? "Creating?" : "Create Employee"}
        </button>
      </div>
    </form>
  );
}

export function WorkForm(props: Parameters<typeof LegacyWorkForm>[0]) {
  return props.task.workFormat === "sheet" ? (
    <TaskSheet {...props} />
  ) : (
    <LegacyWorkForm {...props} />
  );
}
