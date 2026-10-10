import { useEffect, useState } from "react";
import {
  LogOut,
  Plus,
  Pencil,
  Trash2,
  ClipboardList,
  Tags,
  Users,
  ChartNoAxesCombined,
  CalendarDays,
  Check,
} from "lucide-react";
import { api, type User, type Category, type Task, type Employee } from "./api";
import { Brand, ErrorLine, Empty, Drawer, useData } from "./shared";
import { WeeklyActivity } from "./WeeklyActivity";
import { workingWeek, weekLabel } from "./weeks";
import { LoginPage } from "./LoginPage";
import { ThemeToggle } from "./ThemeToggle";
import { TaskList } from "./Tasks";
import { Employees, OverviewPanel, Financial } from "./Insights";
import {
  TaskForm,
  CategoryForm,
  WorkForm,
  DeleteCategoryForm,
  EmployeeForm,
} from "./Forms";
const navigation = {
  employee: ["My Tasks", "My Activity"],
  manager: ["Overview", "Employees"],
  coordinator: ["Tasks", "Categories", "Employees", "Financial Reports"],
};
const routes: Record<string, string> = {
  "My Tasks": "/employee/tasks",
  "My Activity": "/employee/activity",
  Overview: "/manager/overview",
  Employees: "/manager/employees",
  Tasks: "/coordinator/tasks",
  Categories: "/coordinator/categories",
  "Financial Reports": "/coordinator/monthly-financial-report",
};
function pageRoute(user: User, page: string) {
  return page === "Employees" && user.role === "coordinator"
    ? "/coordinator/employees"
    : routes[page];
}
function initialPage(user: User) {
  return (
    navigation[user.role].find(
      (p) => pageRoute(user, p) === location.pathname,
    ) ?? navigation[user.role][0]!
  );
}
export function App() {
  const [user, setUser] = useState<User>();
  const [checking, setChecking] = useState(
    !!sessionStorage.getItem("ops-token"),
  );
  useEffect(() => {
    let active = true;
    const logout = () => {
      sessionStorage.removeItem("ops-token");
      setUser(undefined);
    };
    window.addEventListener("ops-logout", logout);
    if (sessionStorage.getItem("ops-token"))
      api<User>("/auth/me")
        .then((u) => {
          if (active) setUser(u);
        })
        .catch(logout)
        .finally(() => {
          if (active) setChecking(false);
        });
    return () => {
      active = false;
      window.removeEventListener("ops-logout", logout);
    };
  }, []);
  if (checking)
    return (
      <div className="login">
        <p role="status">Opening your workspace...</p>
      </div>
    );
  if (!user) return <LoginPage onAuthenticated={setUser} />;
  return (
    <Workspace
      key={user.id}
      user={user}
      logout={async () => {
        try {
          await api("/auth/logout", "POST");
        } finally {
          sessionStorage.removeItem("ops-token");
          setUser(undefined);
        }
      }}
    />
  );
}
type Modal =
  | { kind: "employeeForm" }
  | { kind: "taskForm"; task?: Task }
  | { kind: "categoryForm"; category?: Category }
  | { kind: "deleteCategory"; category: Category }
  | { kind: "work"; task: Task }
  | { kind: "employee"; employee: Employee }
  | { kind: "category"; category: Category };
function Workspace({ user, logout }: { user: User; logout: () => void }) {
  const [page, setPage] = useState(() => initialPage(user));
  const [revision, setRevision] = useState(0);
  const [modal, setModal] = useState<Modal>();
  const [notice, setNotice] = useState("");
  const categories = useData<Category[]>("/categories", revision);
  const employees = useData<Employee[]>(
    user.role !== "employee" ? "/employees" : null,
    revision,
  );
  const refresh = () => setRevision((r) => r + 1);
  const done = () => {
    refresh();
    setModal(undefined);
    setNotice("Changes saved.");
  };
  useEffect(() => {
    const change = () => {
      setPage(initialPage(user));
      setModal(undefined);
    };
    window.addEventListener("popstate", change);
    history.replaceState(
      null,
      "",
      pageRoute(user, page) + (page === "My Activity" ? location.search : ""),
    );
    return () => window.removeEventListener("popstate", change);
  }, [user, page]);
  const icons: Record<string, typeof ClipboardList> = {
    "My Tasks": ClipboardList,
    "My Activity": CalendarDays,
    Tasks: ClipboardList,
    Categories: Tags,
    Employees: Users,
    Overview: ChartNoAxesCombined,
    "Financial Reports": CalendarDays,
  };
  return (
    <div className={`shell ${page === "Overview" ? "operations-shell" : ""}`}>
      <a className="skip" href="#content">
        Skip to content
      </a>
      <aside>
        <Brand />
        <div className="nav-caption">WORKSPACE</div>
        <nav aria-label="Workspace">
          {navigation[user.role].map((name) => {
            const Icon = icons[name]!;
            return (
              <a
                key={name}
                href={pageRoute(user, name)}
                aria-current={page === name ? "page" : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  setPage(name);
                  setModal(undefined);
                  setNotice("");
                  history.pushState(null, "", pageRoute(user, name));
                }}
              >
                <Icon size={18} />
                {name}
              </a>
            );
          })}
        </nav>
        <div className="profile">
          <span className="avatar">{user.name.slice(0, 1)}</span>
          <div>
            <strong>{user.name}</strong>
            <small>{user.role}</small>
          </div>
          <button className="icon" aria-label="Sign out" onClick={logout}>
            <LogOut size={18} />
          </button>
        </div>
      </aside>
      <main id="content">
        <header className="topbar">
          <span>
            Workspace <span className="muted">/</span>{" "}
            <strong>{page === "Overview" ? "Operations" : page}</strong>
          </span>
          <ThemeToggle />
        </header>
        <div className="page">
          {page !== "Overview" && (
            <div className="page-heading">
              <div>
                <div className="eyebrow">
                  {user.role.toUpperCase()} WORKSPACE
                </div>
                <h1>{page}</h1>
                <p>
                  {page === "My Tasks"
                    ? "Your assigned work. One clear step at a time."
                    : page === "Categories"
                      ? "Define categories for your daily work."
                      : page === "Financial Reports"
                        ? "Your weekly targets, funds, and budget in one place."
                        : page === "Overview"
                          ? "A clear view of your team's work and results."
                          : "Keep your team's daily work in focus."}
                </p>
              </div>
              {user.role === "coordinator" &&
                ["Tasks", "Categories", "Employees"].includes(page) && (
                  <button
                    onClick={() =>
                      setModal(
                        page === "Tasks"
                          ? { kind: "taskForm" }
                          : page === "Employees"
                            ? { kind: "employeeForm" }
                            : { kind: "categoryForm" },
                      )
                    }
                  >
                    <Plus size={16} />
                    Create{" "}
                    {page === "Tasks"
                      ? "Task"
                      : page === "Employees"
                        ? "Employee"
                        : "Category"}
                  </button>
                )}
            </div>
          )}
          <ErrorLine message={categories.error || employees.error} />
          {notice && (
            <p className="notice" role="status">
              <Check size={16} />
              {notice}
            </p>
          )}
          <>
            {page === "My Activity" && (
              <WeeklyActivity
                revision={revision}
                categories={categories.data ?? []}
                open={(task) => setModal({ kind: "work", task })}
              />
            )}
            {page === "My Tasks" && (
              <div className="current-week-banner">
                <CalendarDays size={20} />
                <div>
                  <strong>
                    This week &middot;{" "}
                    {weekLabel(workingWeek().start, workingWeek().end)}
                  </strong>
                  <small>Monday &ndash; Friday</small>
                </div>
              </div>
            )}
            {["Tasks", "My Tasks"].includes(page) && (
              <TaskList
                key={page}

                revision={revision}
                categories={categories.data ?? []}
                employees={employees.data ?? []}
                employee={user.role === "employee"}
                range={page === "My Tasks" ? workingWeek() : undefined}
                open={(task) => setModal({ kind: "work", task })}
                edit={(task) => setModal({ kind: "taskForm", task })}
              />
            )}{" "}
            {page === "Categories" && (
              <div className="cards category-grid">
                {categories.loading ? (
                  <p role="status">Loading categories...</p>
                ) : categories.data?.length ? (
                  categories.data.map((category) => (
                    <article className="card category-tile" key={category._id}>
                      <div className="card-top">
                        <span className="category-icon">
                          <Tags size={20} />
                        </span>
                        <span
                          className={`badge category-state ${category.active ? "is-active" : "is-inactive"}`}
                        >
                          {category.active ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <div className="category-copy">
                        <h2>{category.name}</h2>
                        <p
                          className={
                            category.description ? "" : "description-empty"
                          }
                          title={category.description}
                        >
                          {category.description || "No description added."}
                        </p>
                      </div>
                      <footer className="category-actions">
                        <button
                          className="secondary category-edit"
                          onClick={() =>
                            setModal({ kind: "categoryForm", category })
                          }
                        >
                          <Pencil size={14} />
                          Edit
                        </button>
                        <button
                          className="secondary danger category-delete"
                          onClick={() =>
                            setModal({ kind: "deleteCategory", category })
                          }
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </footer>
                    </article>
                  ))
                ) : (
                  <Empty>
                    Create your first category to define work fields and
                    results.
                  </Empty>
                )}
              </div>
            )}{" "}
            {page === "Overview" && (
              <OverviewPanel
                revision={revision}
                open={(category) => setModal({ kind: "category", category })}
              />
            )}{" "}
            {page === "Employees" && (
              <Employees
                data={employees.data}
                loading={employees.loading}
                open={(employee) => setModal({ kind: "employee", employee })}
              />
            )}{" "}
            {page === "Financial Reports" && <Financial />}
          </>
        </div>
      </main>
      {modal && (
        <Drawer
          title={
            modal.kind === "employeeForm"
              ? "Create employee"
              : modal.kind === "taskForm"
                ? modal.task
                  ? "Edit task"
                  : "Create task"
                : modal.kind === "deleteCategory"
                  ? "Delete category"
                  : modal.kind === "categoryForm"
                    ? modal.category
                      ? "Edit category"
                      : "Create category"
                    : modal.kind === "work"
                      ? modal.task.title
                      : modal.kind === "employee"
                        ? modal.employee.name
                        : modal.category.name
          }
          close={() => setModal(undefined)}
        >
          {modal.kind === "employeeForm" && (
            <EmployeeForm
              cancel={() => setModal(undefined)}
              done={() => {
                done();
                setNotice("Employee created.");
              }}
            />
          )}
          {modal.kind === "taskForm" && (
            <TaskForm
              task={modal.task}
              categories={categories.data ?? []}
              employees={employees.data ?? []}
              done={done}
              cancel={() => setModal(undefined)}
            />
          )}{" "}
          {modal.kind === "categoryForm" && (
            <CategoryForm
              category={modal.category}
              done={done}
              cancel={() => setModal(undefined)}
            />
          )}{" "}
          {modal.kind === "deleteCategory" && (
            <DeleteCategoryForm
              category={modal.category}
              cancel={() => setModal(undefined)}
              done={() => {
                refresh();
                setModal(undefined);
                setNotice("Category deleted.");
              }}
            />
          )}
          {modal.kind === "work" && (
            <WorkForm
              task={modal.task}
              writable={
                user.role === "employee" &&
                modal.task.assignedEmployee === user.id
              }
              coordinator={user.role === "coordinator"}
              refresh={refresh}
              done={done}
            />
          )}{" "}
          {modal.kind === "employee" && (
            <TaskList
              revision={revision}
              categories={categories.data ?? []}
              employees={[]}
              employee={false}
              employeeId={modal.employee._id}
              open={(task) => setModal({ kind: "work", task })}
              edit={
                user.role === "coordinator"
                  ? (task) => setModal({ kind: "taskForm", task })
                  : undefined
              }
            />
          )}{" "}
          {modal.kind === "category" && (
            <>
              <p>{modal.category.description}</p>
              <p className="meta">
                Result classifications:{" "}
                {modal.category.results.join(", ") || "None configured"}
              </p>
              <TaskList
                revision={revision}
                categories={categories.data ?? []}
                employees={employees.data ?? []}
                employee={false}
                categoryId={modal.category._id}
                open={(task) => setModal({ kind: "work", task })}
                edit={
                  user.role === "coordinator"
                    ? (task) => setModal({ kind: "taskForm", task })
                    : undefined
                }
              />
            </>
          )}
        </Drawer>
      )}
    </div>
  );
}
