import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { App } from "./App";
let role = "employee";
let entryFails = false;
const task = {
  _id: "task",
  categoryId: "cat",
  assignedEmployee: "user",
  employeeName: "Employee",
  title: "Review accounts",
  instructions: "Check identifiers",
  workDate: "2026-10-10",
  actualQuantity: 0,
  aggregateQuantity: 0,
  status: "Not Started",
  notes: "",
  categorySchema: {
    _id: "cat",
    name: "Attention",
    mode: "entries",
    targetBehavior: "optional",
    version: 1,
    fields: [
      {
        key: "detail",
        label: "Work detail",
        type: "text",
        required: true,
        options: [],
      },
    ],
    results: ["Good"],
    active: true,
  },
};
beforeEach(() => {
  sessionStorage.setItem("ops-token", "token");
  history.replaceState(null, "", "/");
  entryFails = false;
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, options?: RequestInit) => {
      const path = new URL(String(url), "http://localhost").pathname.replace(
        "/api/v1",
        "",
      );
      const data =
        path === "/auth/me"
          ? { id: "user", name: "Test User", email: "test@example.com", role }
          : path.includes("/financial-reports/")
            ? null
            : path.endsWith("/categories")
              ? [task.categorySchema]
              : path.endsWith("/employees")
                ? []
                : path.includes("/entries")
                  ? { items: [], total: 0, page: 1, limit: 20 }
                  : path.includes("/overview")
                    ? { categories: [], trend: [] }
                    : { items: [task], total: 1, page: 1, limit: 20 };
      if (entryFails && options?.method === "POST" && path.includes("/entries"))
        return {
          ok: false,
          status: 422,
          json: async () => ({ error: { message: "Please retry" } }),
        };
      return { ok: true, status: 200, json: async () => ({ data }) };
    }),
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  sessionStorage.clear();
});
describe("role workspaces", () => {
  it.each([
    ["employee", ["My Tasks", "My Activity"]],
    ["manager", ["Overview", "Employees"]],
    ["coordinator", ["Tasks", "Categories", "Employees", "Financial Reports"]],
  ] as const)("renders exact navigation for %s", async (r, names) => {
    role = r;
    render(<App />);
    const nav = await screen.findByRole("navigation");
    expect(screen.queryByLabelText("Team")).toBeNull();
    expect(
      Array.from(nav.querySelectorAll("a")).map((a) => a.textContent),
    ).toEqual([...names]);
    expect(location.pathname).toBe(
      r === "employee"
        ? "/employee/tasks"
        : r === "manager"
          ? "/manager/overview"
          : "/coordinator/tasks",
    );
  });
  it("renders dynamic entry drawer and preserves values on failure", async () => {
    role = "employee";
    entryFails = true;
    render(<App />);
    fireEvent.click(await screen.findByRole("button", { name: "Start" }));
    const identifier = await screen.findByLabelText(
      "Account / item identifier",
    );
    fireEvent.change(identifier, { target: { value: "Account A" } });
    fireEvent.change(screen.getByLabelText("Work detail *"), {
      target: { value: "Checked" },
    });
    fireEvent.change(screen.getByLabelText("Result classification"), {
      target: { value: "Good" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save entry" }));
    expect(await screen.findByRole("alert")).toHaveProperty(
      "textContent",
      "Please retry",
    );
    expect((identifier as HTMLInputElement).value).toBe("Account A");
    expect(screen.getByRole("button", { name: "Mark Completed" })).toBeTruthy();
  });
  it("keeps manager task details read only", async () => {
    role = "manager";
    history.replaceState(null, "", "/manager/employees");
    render(<App />);
    await screen.findByRole("navigation");
    expect(screen.queryByRole("button", { name: "Create Task" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Save progress" })).toBeNull();
  });
  it("shows a weekly financial form and calculates the remaining accounts", async () => {
    role = "coordinator";
    render(<App />);
    fireEvent.click(
      await screen.findByRole("link", { name: "Financial Reports" }),
    );
    await screen.findByRole("button", { name: "Save weekly report" });
    fireEvent.change(screen.getByLabelText("Required accounts"), {
      target: { value: "50" },
    });
    fireEvent.change(screen.getByLabelText("Already achieved"), {
      target: { value: "36" },
    });
    expect(
      (
        screen.getByLabelText(
          "Current gap (remaining accounts)",
        ) as HTMLInputElement
      ).value,
    ).toBe("14");
    expect(screen.queryByLabelText("Target cost")).toBeNull();
    expect(location.pathname).toBe("/coordinator/monthly-financial-report");
  });
});
