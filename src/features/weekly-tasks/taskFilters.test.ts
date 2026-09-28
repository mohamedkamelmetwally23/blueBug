import { describe, expect, it } from "vitest";
import type { WeeklyTask } from "../../types/contracts.js";
import { emptyFilters, filterTasks, paginateTasks, TASKS_PER_PAGE } from "./taskFilters.js";

const task = (index: number, changes: Partial<WeeklyTask> = {}): WeeklyTask => ({ id: String(index), title: `Task ${index}`, kind: "script", priority: "medium", owner: "Menna", status: "completed", startDate: "2026-09-21T00:00:00.000Z", endDate: "2026-09-22T00:00:00.000Z", target: 1, entries: [], ...changes });

describe("weekly task filtering and pagination", () => {
  it("filters by all supported dimensions", () => {
    const tasks = [task(1), task(2, { title: "Email partners", kind: "email", owner: "Aya", status: "in-progress", priority: "urgent", startDate: "2026-09-24T00:00:00.000Z", endDate: "2026-09-25T00:00:00.000Z" })];
    expect(filterTasks(tasks, { ...emptyFilters, search: "email", owner: "Aya", status: "in-progress", priority: "urgent", category: "email", dateFrom: "2026-09-23", dateTo: "2026-09-25" })).toEqual([tasks[1]]);
  });
  it("paginates filtered results at 15 tasks per page", () => {
    const filtered = filterTasks(Array.from({ length: 32 }, (_, index) => task(index + 1)), emptyFilters);
    expect(paginateTasks(filtered, 1)).toHaveLength(TASKS_PER_PAGE);
    expect(paginateTasks(filtered, 3)).toHaveLength(2);
  });
});
