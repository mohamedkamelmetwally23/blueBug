import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen, within, fireEvent } from "@testing-library/react";
import { OverviewPanel } from "./Insights";
const state = vi.hoisted(() => ({ missing: false }));
vi.mock("./shared", async (original) => ({
  ...(await original<typeof import("./shared")>()),
  useData: (path: string) => ({
    loading: false,
    error: "",
    data: path.startsWith("/overview")
      ? {
          categories: [
            {
              _id: "other",
              goodResults: 3,
              badResults: 1,
              pendingResults: 2,
              name: "Action needed",
              completed: 2,
              quantity: 12,
              tasks: 4,
            },
            {
              _id: "email",
              name: "Emails",
              completed: 1,
              quantity: 5,
              tasks: 4,
            },
            {
              _id: "cat",
              name: "Scripts",
              completed: 3,
              quantity: 45,
              tasks: 7,
              target: 90,
              targetedQuantity: 45,
            },
          ],
        }
      : state.missing
        ? null
        : {
            receivedCents: 12345,
            balanceCents: 6789,
            reservedCents: 1000,
            budgetSummary: "Next week budget",
          },
  }),
}));
afterEach(() => {
  cleanup();
  state.missing = false;
});
it("shows summed work against the five-day target and financial amounts in dollars", () => {
  render(<OverviewPanel revision={0} open={vi.fn()} />);
  const card = screen.getByRole("button", { name: /Scripts completed/ });
  expect(within(card).getByText("45").className).toBe("operation-value");
  expect(within(card).getByText("/ 25")).toBeTruthy();
  expect(within(card).getByText(/0 remaining/)).toBeTruthy();
  expect(screen.getByText("$123.45")).toBeTruthy();
  expect(screen.getByText("$67.89")).toBeTruthy();
  expect(screen.getByText("$10.00")).toBeTruthy();
  expect(screen.getByText("Next week budget")).toBeTruthy();
});
it("explains when no financial report exists", () => {
  state.missing = true;
  render(<OverviewPanel revision={0} open={vi.fn()} />);
  expect(
    screen.getByText("No financial report saved for this week."),
  ).toBeTruthy();
});

it("shows only Done totals for other categories and keeps the emails target", () => {
  render(<OverviewPanel revision={0} open={vi.fn()} />);
  const other = screen.getByRole("button", { name: /Action needed/ });
  expect(within(other).getByText("12").className).toBe("operation-value");
  expect(within(other).queryByText(/25|remaining|per day/)).toBeNull();
  const email = screen.getByRole("button", { name: /Emails completed/ });
  expect(within(email).getByText("5").className).toBe("operation-value");
  expect(within(email).getByText("/ 25")).toBeTruthy();
});

it("shows Good and Bad result counts beneath the Action needed value", () => {
  render(<OverviewPanel revision={0} open={vi.fn()} />);
  const card = screen.getByRole("button", { name: /Action needed/ });
  expect(within(card).getByText("Good: 3")).toBeTruthy();
  expect(within(card).getByText("Bad: 1")).toBeTruthy();
  expect(within(card).getByText("Pending: 2")).toBeTruthy();
});
it("filters the overview to last week or the previous calendar month", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-10T12:00:00Z"));
  try {
    render(<OverviewPanel revision={0} open={vi.fn()} />);
    expect(screen.getByRole("button", { name: "This week" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getAllByText(/12 Oct 2026.*16 Oct 2026/).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: "Last week" }));
    expect(screen.getAllByText(/5 Oct 2026.*9 Oct 2026/).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: "2 weeks ago" }));
    expect(screen.getAllByText(/28 Sept 2026.*2 Oct 2026/).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: "3 weeks ago" }));
    expect(screen.getAllByText(/21 Sept 2026.*25 Sept 2026/).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: "Last month" }));
    expect(screen.getAllByText(/1 Sept 2026.*30 Sept 2026/).length).toBeGreaterThan(0);
  } finally { cleanup(); vi.useRealTimers(); }
});
