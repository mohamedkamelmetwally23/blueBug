import { afterEach, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { Issues } from "./Issues";
import { api } from "./api";

vi.mock("./api", () => ({ api: vi.fn() }));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
const issue = {
  _id: "issue1",
  title: "Payment failed",
  description: "Waiting for provider",
  employeeName: "Menna",
  status: "Open",
  createdAt: "2026-10-12T08:00:00Z",
};

it("shows employee descriptions and status to managers without edit controls", async () => {
  vi.mocked(api).mockResolvedValue({ items: [issue], total: 1 });
  render(<Issues />);
  expect(await screen.findByText("Waiting for provider")).toBeTruthy();
  expect(screen.getByText("Not resolved")).toBeTruthy();
  expect(screen.getByText(/Menna/)).toBeTruthy();
  expect(screen.queryByRole("button", { name: /Edit issue/ })).toBeNull();
  expect(screen.queryByRole("button", { name: "Report issue" })).toBeNull();
});

it("lets employees update a problem and its resolution status", async () => {
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  vi.mocked(api).mockResolvedValue({ items: [issue], total: 1 });
  render(<Issues writable />);
  fireEvent.click(
    await screen.findByRole("button", { name: "Edit issue: Payment failed" }),
  );
  fireEvent.change(screen.getByLabelText("Description"), {
    target: { value: "Provider fixed the payment" },
  });
  fireEvent.change(screen.getByLabelText("Resolution status"), {
    target: { value: "Resolved" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save issue" }));
  await waitFor(() =>
    expect(api).toHaveBeenCalledWith("/issues/issue1", "PUT", {
      title: "Payment failed",
      description: "Provider fixed the payment",
      status: "Resolved",
    }),
  );
});
