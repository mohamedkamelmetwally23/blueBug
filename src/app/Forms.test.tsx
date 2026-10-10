import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { TaskForm } from "./Forms";
import { api, type Category, type Employee } from "./api";
vi.mock("./api", async (original) => ({ ...await original<typeof import("./api")>(), api: vi.fn() }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });
const categories = ["First", "Second"].map((name, index) => ({ _id: String(index), name, active: true })) as Category[];
const employees = [{ _id: "employee", name: "Employee" }] as Employee[];
it.each([false, true])("assigns multiple categories and preserves unsaved selections on failure: %s", async (fails) => {
  vi.mocked(api).mockResolvedValueOnce({});
  if (fails) vi.mocked(api).mockRejectedValueOnce(new Error("Please retry"));
  else vi.mocked(api).mockResolvedValueOnce({});
  const done = vi.fn();
  render(<TaskForm task={undefined} categories={categories} employees={employees} done={done} cancel={vi.fn()} />);
  fireEvent.click(screen.getByLabelText("First"));
  fireEvent.click(screen.getByLabelText("Second"));
  fireEvent.change(screen.getByLabelText("Assigned to"), { target: { value: "employee" } });
  fireEvent.click(screen.getByRole("button", { name: "Save 2 tasks" }));
  if (fails) {
    await screen.findByText("Please retry");
    expect((screen.getByLabelText("First") as HTMLInputElement).checked).toBe(false);
    expect((screen.getByLabelText("Second") as HTMLInputElement).checked).toBe(true);
    expect(done).not.toHaveBeenCalled();
  } else await waitFor(() => expect(done).toHaveBeenCalledOnce());
  expect(api).toHaveBeenCalledTimes(2);
  for (const categoryId of ["0", "1"]) expect(api).toHaveBeenCalledWith("/tasks", "POST", expect.objectContaining({ categoryId, assignedEmployee: "employee" }));
});
