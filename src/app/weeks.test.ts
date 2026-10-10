import { describe, it, expect } from "vitest";
import { workingWeek, pastWeeks } from "./weeks";
describe("Monday to Friday workweeks", () => {
  it.each([ ["2026-10-05", "2026-10-05", "2026-10-09"], ["2026-10-09", "2026-10-05", "2026-10-09"], ["2026-10-10", "2026-10-12", "2026-10-16"], ["2026-10-11", "2026-10-12", "2026-10-16"], ["2026-10-14", "2026-10-12", "2026-10-16"], ["2027-01-01", "2026-12-28", "2027-01-01"] ])("selects the active or upcoming workweek on %s", (today, start, end) => { expect(workingWeek(today)).toEqual({start,end}); });
  it("archives only ended workweeks starting October 5, newest first", () => {
    expect(pastWeeks("2026-10-09")).toEqual([]);
    expect(pastWeeks("2026-10-10")).toEqual([{start:"2026-10-05",end:"2026-10-09"}]);
    expect(pastWeeks("2026-10-17")).toEqual([{start:"2026-10-12",end:"2026-10-16"},{start:"2026-10-05",end:"2026-10-09"}]);
  });
});
