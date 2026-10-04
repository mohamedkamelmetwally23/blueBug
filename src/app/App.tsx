import { useState } from "react";
import { Bug, CheckCircle2, ClipboardCheck, LayoutDashboard, RefreshCw } from "lucide-react";
import { OverviewPage } from "../features/overview/OverviewPage.js";
import { WeeklyTasksPage } from "../features/weekly-tasks/WeeklyTasksPage.js";
import { syncGoogleSheet } from "../lib/api.js";

const navigation = [
  ["Overview", LayoutDashboard], ["Weekly Tasks", ClipboardCheck]
] as const;

export function App() {
  const [page, setPage] = useState("Overview");
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ text: string; error: boolean } | null>(null);
  const [syncRevision, setSyncRevision] = useState(0);
  const startSheetSync = async () => {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const result = await syncGoogleSheet();
      setSyncRevision((revision) => revision + 1);
      const failureCount = result.failures.length;
      const failureDetails = result.failures.slice(0, 2)
        .map(({ row, message }) => `السطر ${row}: ${message}`)
        .join("؛ ");
      setSyncMessage({
        text: failureCount
          ? `تمت مزامنة ${result.synced} مهمة، مع وجود ${failureCount} أخطاء. ${failureDetails}${failureCount > 2 ? `؛ وأخطاء أخرى: ${failureCount - 2}` : ""}`
          : `اكتملت المزامنة بنجاح: ${result.synced} مهمة.`,
        error: failureCount > 0
      });
    } catch (reason: unknown) {
      setSyncMessage({ text: reason instanceof Error ? reason.message : "فشلت مزامنة الشيت.", error: true });
    } finally {
      setSyncing(false);
    }
  };
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark"><Bug size={22}/></span><div><strong>Blue Bug</strong><small>Operations</small></div></div>
      <nav>{navigation.map(([label, Icon]) => <button className={page === label ? "nav-item active" : "nav-item"} onClick={() => setPage(label)} key={label}><Icon size={18}/><span>{label}</span></button>)}</nav>
      <div className="profile"><span>OP</span><div><strong>Operations</strong><small>Team workspace</small></div><button>•••</button></div>
    </aside>
    <main>
      <header className="topbar">
        <div className="topbar-breadcrumb"><span>Workspace</span><b>/</b><strong>Operations</strong></div>
        <div className="topbar-sync">
          {syncMessage && <span className={`sync-status${syncMessage.error ? " error" : ""}`} role={syncMessage.error ? "alert" : "status"}>{!syncMessage.error && <CheckCircle2 size={14}/>} {syncMessage.text}</span>}
          <button className="sync-button" onClick={() => void startSheetSync()} disabled={syncing} aria-busy={syncing}>
            <RefreshCw size={16} className={syncing ? "syncing" : undefined}/><span>{syncing ? "جاري المزامنة..." : "مزامنة الشيت"}</span>
          </button>
        </div>
      </header>
      {page === "Weekly Tasks" ? <WeeklyTasksPage refreshKey={syncRevision}/> : <OverviewPage refreshKey={syncRevision}/>}
    </main>
  </div>;
}
