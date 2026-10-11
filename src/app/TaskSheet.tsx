import { useState } from "react";
import { LockKeyhole, Save } from "lucide-react";
import { api, statuses, type Task } from "./api";
import { Field, ErrorLine } from "./shared";

export function TaskSheet({
  task,
  writable,
  coordinator,
  done,
}: {
  task: Task;
  writable: boolean;
  coordinator: boolean;
  refresh: () => void;
  done: () => void;
}) {
  const isActionNeeded = /action\s+needed/i.test(task.categorySchema.name);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  return (
    <>
      <div className="task-assignment-summary">
        <span>
          <LockKeyhole size={15} /> Assignment details
        </span>
        <dl>
          <div>
            <dt>Category</dt>
            <dd>{task.categorySchema.name}</dd>
          </div>
          <div>
            <dt>Owner</dt>
            <dd>{task.employeeName || "Assigned employee"}</dd>
          </div>
          <div>
            <dt>Start date</dt>
            <dd>{task.workDate}</dd>
          </div>
        </dl>
        {task.instructions && <p className="preserve">{task.instructions}</p>}
      </div>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          if (!writable || busy) return;
          const values = new FormData(event.currentTarget);
          setBusy(true);
          setError("");
          try {
            await api("/tasks/" + task._id + "/progress", "PATCH", {
              day: values.get("day"),
              status: values.get("status"),
              endDate: values.get("endDate") || null,
              accountNames: values.get("accountNames"),
              numDone:
                values.get("numDone") === ""
                  ? null
                  : Number(values.get("numDone")),
              notes: values.get("notes"),
              ...(isActionNeeded
                ? Object.fromEntries(
                    ["goodCount", "badCount", "pendingCount"].map((key) => [
                      key, Number(values.get(key) || 0),
                    ]),
                  )
                : {}),
            });
            done();
          } catch (error) {
            setError((error as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <h3>Work details</h3>
        <p className="hint">
          {writable
            ? "Fill in your work details, then save your updates."
            : "Work details recorded by the assigned employee."}
        </p>
        <fieldset className="task-sheet-fields" disabled={!writable || busy}>
          <div className="form-grid">
            <Field label="Day">
              <input
                name="day"
                maxLength={100}
                defaultValue={task.day ?? ""}
                placeholder="e.g. Monday"
              />
            </Field>
            <Field label="Status">
              <select name="status" defaultValue={task.status}>
                <option value="">Choose status</option>
                {statuses.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </Field>
            <Field label="End date">
              <input
                name="endDate"
                type="date"
                min={task.workDate}
                defaultValue={task.endDate ?? ""}
              />
            </Field>
            <Field label="Num Done">
              <input
                name="numDone"
                type="number"
                min={0}
                step={1}
                max={1000000000}
                defaultValue={task.numDone ?? ""}
              />
            </Field>
          </div>
          {isActionNeeded && (
            <fieldset className="action-result-picker">
              <legend>Result</legend>
              <div className="form-grid">
                {(["Good", "Bad", "Pending"] as const).map((result) => {
                  const key = `${result.toLowerCase()}Count` as "goodCount" | "badCount" | "pendingCount";
                  return (
                    <Field label={result} key={result}>
                      <input
                        type="number"
                        name={key}
                        min={0}
                        max={1000000000}
                        step={1}
                        defaultValue={task[key] ?? (task.resultStatus === result ? 1 : 0)}
                      />
                    </Field>
                  );
                })}
              </div>
            </fieldset>
          )}
          <Field label="Names of acc">
            <textarea
              name="accountNames"
              rows={3}
              maxLength={10000}
              defaultValue={task.accountNames ?? ""}
            />
          </Field>
          <Field label="Clarifications">
            <textarea
              name="notes"
              rows={3}
              maxLength={5000}
              defaultValue={task.notes ?? ""}
            />
          </Field>
        </fieldset>
        <ErrorLine message={error} />
        {writable && (
          <div className="form-actions">
            <button disabled={busy}>
              <Save size={16} />
              {busy ? "Saving…" : "Save work details"}
            </button>
          </div>
        )}
      </form>
      {coordinator && (
        <div className="delete-section">
          {deleteConfirm && (
            <p>Delete this task? Tasks with recorded work cannot be deleted.</p>
          )}
          <button
            className="secondary danger"
            disabled={busy}
            onClick={async () => {
              if (!deleteConfirm) {
                setDeleteConfirm(true);
                return;
              }
              setBusy(true);
              setError("");
              try {
                await api("/tasks/" + task._id, "DELETE");
                done();
              } catch (error) {
                setError((error as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            {deleteConfirm ? "Confirm delete" : "Delete task"}
          </button>
          {deleteConfirm && (
            <button
              className="secondary"
              disabled={busy}
              onClick={() => setDeleteConfirm(false)}
            >
              Cancel
            </button>
          )}
        </div>
      )}
    </>
  );
}
