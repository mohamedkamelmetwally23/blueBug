import { useState } from "react";
import { LockKeyhole, Save } from "lucide-react";
import { api, statuses, type Task } from "./api";
import { Field, ErrorLine } from "./shared";

export function TaskSheet({
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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
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
        onChange={() => setSaved(false)}
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
            });
            refresh();
            setSaved(true);
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
        {saved && (
          <p className="notice" role="status">
            Work details saved.
          </p>
        )}
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
