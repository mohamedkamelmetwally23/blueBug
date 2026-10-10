import { afterEach, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { TaskSheet } from "./TaskSheet";
import { api, type Task } from "./api";
vi.mock("./api", async (original) => ({
  ...(await original<typeof import("./api")>()),
  api: vi.fn(),
}));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
function renderTask(name: string, writable = true) {
  return render(
    <TaskSheet
      task={
        {
          _id: "task",
          categorySchema: { name },
          workDate: "2026-10-05",
          status: "",
          resultStatus: "Pending",
        } as Task
      }
      writable={writable}
      coordinator={false}
      refresh={vi.fn()}
      done={vi.fn()}
    />,
  );
}
it("restores and saves a single action needed result", async () => {
  vi.mocked(api).mockResolvedValue({});
  renderTask("action needed (script,active)");
  expect((screen.getByLabelText("Pending") as HTMLInputElement).checked).toBe(
    true,
  );
  fireEvent.click(screen.getByLabelText("Good"));
  expect((screen.getByLabelText("Pending") as HTMLInputElement).checked).toBe(
    false,
  );
  fireEvent.click(screen.getByRole("button", { name: "Save work details" }));
  await waitFor(() =>
    expect(api).toHaveBeenCalledWith(
      "/tasks/task/progress",
      "PATCH",
      expect.objectContaining({ resultStatus: "Good" }),
    ),
  );
});
it("does not show result choices for other categories", () => {
  renderTask("Scripts");
  expect(screen.queryByRole("radio")).toBeNull();
});
it("shows the saved result without allowing edits for viewers", () => {
  renderTask("Action needed", false);
  expect((screen.getByLabelText("Pending") as HTMLInputElement).checked).toBe(
    true,
  );
  expect(
    screen
      .getByLabelText("Pending")
      .closest("fieldset.task-sheet-fields")
      ?.hasAttribute("disabled"),
  ).toBe(true);
});
