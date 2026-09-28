import type { WeeklyTask } from "../../types/contracts.js";

export interface TaskFilters {
  search: string; owner: string; status: string; priority: string;
  category: string; dateFrom: string; dateTo: string;
}

export const emptyFilters: TaskFilters = { search: "", owner: "", status: "", priority: "", category: "", dateFrom: "", dateTo: "" };
export const TASKS_PER_PAGE = 15;

export const filterTasks = (tasks: WeeklyTask[], filters: TaskFilters): WeeklyTask[] => {
  const search = filters.search.trim().toLowerCase();
  const from = filters.dateFrom ? new Date(`${filters.dateFrom}T00:00:00`).getTime() : undefined;
  const to = filters.dateTo ? new Date(`${filters.dateTo}T23:59:59.999`).getTime() : undefined;
  return tasks.filter((task) => {
    const taskStart = task.startDate ? new Date(task.startDate).getTime() : undefined;
    const taskEnd = task.endDate ? new Date(task.endDate).getTime() : taskStart;
    return (!search || task.title.toLowerCase().includes(search))
      && (!filters.owner || task.owner === filters.owner)
      && (!filters.status || task.status === filters.status)
      && (!filters.priority || task.priority === filters.priority)
      && (!filters.category || task.kind === filters.category)
      && (from === undefined || (taskEnd !== undefined && taskEnd >= from))
      && (to === undefined || (taskStart !== undefined && taskStart <= to));
  });
};

export const paginateTasks = (tasks: WeeklyTask[], page: number): WeeklyTask[] =>
  tasks.slice((page - 1) * TASKS_PER_PAGE, page * TASKS_PER_PAGE);

