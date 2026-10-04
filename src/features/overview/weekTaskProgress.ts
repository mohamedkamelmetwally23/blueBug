import type { WeeklyTask } from "../../types/contracts.js";

export const WORK_WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as const;

export interface DailyTaskProgress {
  weekday: typeof WORK_WEEKDAYS[number];
  numDone: number;
  namesOfAcc: string;
  clarifications: string;
}

const taskWeekday = (task: WeeklyTask): string => task.dayBucket?.toLowerCase()
  ?? (task.dayDate ? new Intl.DateTimeFormat("en", { weekday: "long", timeZone: "UTC" }).format(new Date(task.dayDate)).toLowerCase() : "");

export const dailyTaskProgress = (tasks: WeeklyTask[]): DailyTaskProgress[] =>
  WORK_WEEKDAYS.map((weekday) => {
    const dayTasks = tasks.filter((task) => taskWeekday(task) === weekday.toLowerCase());
    return {
      weekday,
      numDone: dayTasks.reduce((sum, task) => sum + (task.sheetCompleted ?? task.entries.reduce((total, entry) => total + entry.completed, 0)), 0),
      namesOfAcc: dayTasks.map((task) => task.accountNames?.trim()).filter((names): names is string => Boolean(names)).join("\n") || "—",
      clarifications: dayTasks.map((task) => task.notes?.trim()).filter((notes): notes is string => Boolean(notes)).join("\n") || "—"
    };
  });

export const totalNumDone = (tasks: WeeklyTask[]): number =>
  dailyTaskProgress(tasks).reduce((sum, day) => sum + day.numDone, 0);
