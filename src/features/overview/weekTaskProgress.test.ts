import { describe, expect, it } from "vitest";
import type { WeeklyTask } from "../../types/contracts.js";
import { dailyTaskProgress, totalNumDone } from "./weekTaskProgress.js";

const task = (dayBucket: string, sheetCompleted: number): WeeklyTask => ({
  id: dayBucket,
  title: "trying open new acc",
  kind: "activation",
  status: "in-progress",
  dayBucket,
  target: 1,
  sheetCompleted,
  accountNames: `${dayBucket.toLowerCase()}-account@example.com`,
  notes: `${dayBucket} clarification`,
  entries: []
});

describe("sheet task weekly progress", () => {
  it("sums Num Done for the card and exposes each day's sheet fields", () => {
    const tasks = [
      task("MONDAY", 2),
      task("TUESDAY", 4),
      task("WEDNESDAY", 3),
      task("THURSDAY", 0),
      task("FRIDAY", 0)
    ];

    expect(totalNumDone(tasks)).toBe(9);
    expect(dailyTaskProgress(tasks)).toMatchObject([
      { weekday: "Monday", numDone: 2, namesOfAcc: "monday-account@example.com", clarifications: "MONDAY clarification" },
      { weekday: "Tuesday", numDone: 4, namesOfAcc: "tuesday-account@example.com", clarifications: "TUESDAY clarification" },
      { weekday: "Wednesday", numDone: 3, namesOfAcc: "wednesday-account@example.com", clarifications: "WEDNESDAY clarification" },
      { weekday: "Thursday", numDone: 0, namesOfAcc: "thursday-account@example.com", clarifications: "THURSDAY clarification" },
      { weekday: "Friday", numDone: 0, namesOfAcc: "friday-account@example.com", clarifications: "FRIDAY clarification" }
    ]);
  });
});
