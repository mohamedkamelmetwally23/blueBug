import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, CalendarDays } from "lucide-react";
import { type Category, type Task } from "./api";
import { Empty } from "./shared";
import { TaskList } from "./Tasks";
import { pastWeeks, weekLabel } from "./weeks";
export function WeeklyActivity({ revision, categories, open }: { revision: number; categories: Category[]; open: (task: Task) => void }) {
  const weeks = pastWeeks();
  const [selected, setSelected] = useState(() => new URLSearchParams(location.search).get("week"));
  useEffect(() => {
    const sync = () => setSelected(new URLSearchParams(location.search).get("week"));
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);
  const week = weeks.find(w => w.start === selected);
  function navigate(start?: string) {
    history.pushState(null, "", "/employee/activity" + (start ? `?week=${start}` : ""));
    setSelected(start ?? null);
  }
  if (week) return <>
    <div className="activity-week-heading"><button className="secondary" onClick={() => navigate()}><ArrowLeft size={16} />All weeks</button><div><h2>{weekLabel(week.start, week.end)}</h2><p>Monday to Friday · Weekly activity</p></div></div>
    <TaskList key={week.start} revision={revision} categories={categories} employees={[]} employee activity range={week} open={open} />
  </>;
  return <>
    <p className="hint">Choose a week to view its activity. Each week runs from Monday to Friday.</p>
    {weeks.length ? <div className="activity-weeks">{weeks.map(w => <a className="activity-week-card" key={w.start} href={`/employee/activity?week=${w.start}`} onClick={event => { if(event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return; event.preventDefault(); navigate(w.start); }}><span className="activity-week-icon"><CalendarDays size={24} /></span><span className="activity-week-copy"><small>WEEKLY ACTIVITY</small><strong>{weekLabel(w.start, w.end)}</strong><span>Monday – Friday</span></span><ArrowRight size={18} /></a>)}</div> : <Empty>Past weeks will appear here once the first workweek ends.</Empty>}
  </>;
}
