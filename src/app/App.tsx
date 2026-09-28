import { useState } from "react";
import { Bug, ClipboardCheck, LayoutDashboard } from "lucide-react";
import { OverviewPage } from "../features/overview/OverviewPage.js";
import { WeeklyTasksPage } from "../features/weekly-tasks/WeeklyTasksPage.js";

const navigation = [
  ["Overview", LayoutDashboard], ["Weekly Tasks", ClipboardCheck]
] as const;

export function App() {
  const [page, setPage] = useState("Overview");
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark"><Bug size={22}/></span><div><strong>Blue Bug</strong><small>Operations</small></div></div>
      <nav>{navigation.map(([label, Icon]) => <button className={page === label ? "nav-item active" : "nav-item"} onClick={() => setPage(label)} key={label}><Icon size={18}/><span>{label}</span></button>)}</nav>
      <div className="profile"><span>OP</span><div><strong>Operations</strong><small>Team workspace</small></div><button>•••</button></div>
    </aside>
    <main>
      <header className="topbar"><div><span>Workspace</span><b>/</b><strong>Operations</strong></div></header>
      {page === "Weekly Tasks" ? <WeeklyTasksPage /> : <OverviewPage />}
    </main>
  </div>;
}
