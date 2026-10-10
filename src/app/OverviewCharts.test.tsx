import { afterEach, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { OverviewCharts } from "./OverviewCharts";
import type { Overview } from "./api";
afterEach(cleanup);
it("uses task counts for statuses, and dated quantities for daily activity", () => {
  const overview = { categories: [{ _id: "scripts", name: "Scripts", tasks: 3, quantity: 50, statuses: ["Completed", "In Progress", "Not Started"] }], trend: [{ _id: "2026-10-05", quantity: 50, categories: [{ categoryId: "scripts", quantity: 50 }] }] } as Overview;
  render(<OverviewCharts overview={overview} week="2026-10-05" />);
  expect(screen.getAllByRole("img", { name: "3 total tasks" })).toHaveLength(1);
  const daily = screen.getByRole("img", { name: /Daily completed quantities/ });
  expect(within(daily).getByText("Scripts, 2026-10-05: 50")).toBeTruthy();
  expect(within(daily).getByText("Scripts, 2026-10-06: 0")).toBeTruthy();
});
it("renders an empty week without invalid chart coordinates", () => {
  const { container } = render(<OverviewCharts week="2026-10-05" />);
  expect(screen.getAllByRole("img", { name: "0 total tasks" })).toHaveLength(1);
  expect(container.innerHTML).not.toMatch(/NaN|Infinity/);
});
