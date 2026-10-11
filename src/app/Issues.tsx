import { useEffect, useState } from "react";
import { CircleAlert, Pencil, Plus, RefreshCw, Save } from "lucide-react";
import { api, type Page } from "./api";
import { Drawer, Empty, ErrorLine, Field, Pager, useData } from "./shared";

type Issue = {
  _id: string;
  employeeName: string;
  title: string;
  description: string;
  status: "Open" | "Resolved";
  createdAt: string;
};

export function Issues({
  writable = false,
  revision = 0,
}: {
  writable?: boolean;
  revision?: number;
}) {
  const [page, setPage] = useState(1);
  const [updates, setUpdates] = useState(0);
  const [editing, setEditing] = useState<Issue | "new">();
  const data = useData<Page<Issue>>(
    `/issues?page=${page}&limit=10`,
    revision + updates,
  );
  useEffect(() => {
    const refresh = () => setUpdates((value) => value + 1);
    window.addEventListener("focus", refresh);
    const timer = window.setInterval(refresh, 60000);
    return () => {
      window.removeEventListener("focus", refresh);
      window.clearInterval(timer);
    };
  }, []);
  return (
    <section className="issues-section" aria-labelledby="issues-heading">
      <div className="issues-heading">
        <span className="financial-summary-icon">
          <CircleAlert size={22} aria-hidden="true" />
        </span>
        <div>
          <h2 id="issues-heading">
            {writable ? "My issues" : "Employee issues"}
          </h2>
          <p>Problems and their latest resolution status.</p>
        </div>
        <button
          className="secondary"
          onClick={() => setUpdates((value) => value + 1)}
          aria-label="Refresh issues"
        >
          <RefreshCw size={16} />
        </button>
        {writable && (
          <button onClick={() => setEditing("new")}>
            <Plus size={16} />
            Report issue
          </button>
        )}
      </div>
      <ErrorLine message={data.error} />
      {data.loading ? (
        <p role="status">Loading issues...</p>
      ) : (
        !data.error &&
        (data.data?.items?.length ? (
          <div className="issue-list">
            {data.data.items.map((issue) => (
              <article className="issue-card" key={issue._id}>
                <div className="issue-card-heading">
                  <h3 dir="auto">{issue.title}</h3>
                  <span
                    className={`issue-status ${issue.status === "Resolved" ? "is-resolved" : "is-open"}`}
                  >
                    {issue.status === "Resolved" ? "Resolved" : "Not resolved"}
                  </span>
                </div>
                <p className="issue-description" dir="auto">
                  {issue.description}
                </p>
                <div className="issue-meta">
                  <span>
                    {issue.employeeName} ·{" "}
                    {new Date(issue.createdAt).toLocaleDateString("en-GB", {
                      timeZone: "Africa/Cairo",
                    })}
                  </span>
                  {writable && (
                    <button
                      className="secondary"
                      onClick={() => setEditing(issue)}
                      aria-label={`Edit issue: ${issue.title}`}
                    >
                      <Pencil size={14} />
                      Edit
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <Empty>No issues reported yet.</Empty>
        ))
      )}
      {!!data.data?.total && (
        <Pager
          page={page}
          total={data.data.total}
          limit={10}
          change={setPage}
        />
      )}
      {editing && (
        <Drawer
          title={editing === "new" ? "Report issue" : "Edit issue"}
          close={() => setEditing(undefined)}
        >
          <IssueForm
            issue={editing === "new" ? undefined : editing}
            saved={() => {
              setEditing(undefined);
              setUpdates((value) => value + 1);
            }}
          />
        </Drawer>
      )}
    </section>
  );
}

function IssueForm({
  issue,
  saved,
}: {
  issue?: Issue | undefined;
  saved: () => void;
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
          await api(
            issue ? `/issues/${issue._id}` : "/issues",
            issue ? "PUT" : "POST",
            {
              title: values.get("title"),
              description: values.get("description"),
              status: values.get("status"),
            },
          );
          saved();
        } catch (error) {
          setError((error as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <fieldset className="task-sheet-fields" disabled={busy}>
        <Field label="Issue title">
          <input
            name="title"
            required
            maxLength={200}
            defaultValue={issue?.title ?? ""}
          />
        </Field>
        <Field label="Description">
          <textarea
            name="description"
            required
            maxLength={5000}
            rows={6}
            defaultValue={issue?.description ?? ""}
          />
        </Field>
        <Field label="Resolution status">
          <select name="status" defaultValue={issue?.status ?? "Open"}>
            <option value="Open">Not resolved</option>
            <option value="Resolved">Resolved</option>
          </select>
        </Field>
      </fieldset>
      <ErrorLine message={error} />
      <div className="form-actions">
        <button disabled={busy}>
          <Save size={16} />
          {busy ? "Saving…" : "Save issue"}
        </button>
      </div>
    </form>
  );
}
