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
it("restores legacy results and saves independent action needed counts", async () => {
  vi.mocked(api).mockResolvedValue({});
  renderTask("action needed (script,active)");
  expect((screen.getByLabelText("Pending") as HTMLInputElement).value).toBe("1");
  fireEvent.change(screen.getByLabelText("Good"), { target: { value: "12" } });
  fireEvent.change(screen.getByLabelText("Bad"), { target: { value: "3" } });
  fireEvent.click(screen.getByRole("button", { name: "Save work details" }));
  await waitFor(() =>
    expect(api).toHaveBeenCalledWith(
      "/tasks/task/progress",
      "PATCH",
      expect.objectContaining({ goodCount: 12, badCount: 3, pendingCount: 1 }),
    ),
  );
});
it("does not show result choices for other categories", () => {
  renderTask("Scripts");
  expect(screen.queryByLabelText("Good")).toBeNull();
});
it("shows the saved result without allowing edits for viewers", () => {
  renderTask("Action needed", false);
  expect((screen.getByLabelText("Pending") as HTMLInputElement).value).toBe("1");
  expect(
    screen
      .getByLabelText("Pending")
      .closest("fieldset.task-sheet-fields")
      ?.hasAttribute("disabled"),
  ).toBe(true);
});
