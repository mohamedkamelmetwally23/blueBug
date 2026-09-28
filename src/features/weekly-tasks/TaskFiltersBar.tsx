import { Search, X } from "lucide-react";
import type { WeeklyTask } from "../../types/contracts.js";
import { emptyFilters, type TaskFilters } from "./taskFilters.js";

interface Props { filters: TaskFilters; tasks: WeeklyTask[]; onChange: (filters: TaskFilters) => void; }
const unique = (values: Array<string | undefined>) => [...new Set(values.filter((value): value is string => Boolean(value)))].sort();

export function TaskFiltersBar({ filters, tasks, onChange }: Props) {
  const update = (key: keyof TaskFilters, value: string) => onChange({ ...filters, [key]: value });
  return <div className="task-filters" onClick={(event) => event.stopPropagation()}>
    <label className="search-field"><Search size={15}/><input aria-label="Search tasks" placeholder="Search tasks" value={filters.search} onChange={(event) => update("search", event.target.value)}/></label>
    <FilterSelect label="Owner" value={filters.owner} values={unique(tasks.map((task) => task.owner))} onChange={(value) => update("owner", value)}/>
    <FilterSelect label="Status" value={filters.status} values={unique(tasks.map((task) => task.status))} onChange={(value) => update("status", value)}/>
    <FilterSelect label="Priority" value={filters.priority} values={unique(tasks.map((task) => task.priority))} onChange={(value) => update("priority", value)}/>
    <FilterSelect label="Category" value={filters.category} values={unique(tasks.map((task) => task.kind))} onChange={(value) => update("category", value)}/>
    <label className="date-filter"><span>From</span><input aria-label="Date from" type="date" value={filters.dateFrom} onChange={(event) => update("dateFrom", event.target.value)}/></label>
    <label className="date-filter"><span>To</span><input aria-label="Date to" type="date" value={filters.dateTo} onChange={(event) => update("dateTo", event.target.value)}/></label>
    <button className="clear-filters" onClick={() => onChange(emptyFilters)}><X size={14}/> Clear</button>
  </div>;
}

function FilterSelect({ label, value, values, onChange }: { label: string; value: string; values: string[]; onChange: (value: string) => void }) {
  return <select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)}><option value="">All {label.toLowerCase()}</option>{values.map((item) => <option key={item} value={item}>{item.replaceAll("-", " ")}</option>)}</select>;
}
