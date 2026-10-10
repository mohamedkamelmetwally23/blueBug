import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { LoginPage } from "./LoginPage";

afterEach(() => { cleanup(); sessionStorage.clear(); vi.unstubAllGlobals(); });
function fill() {
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "person@example.com" } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: "secret" } });
}
describe("interactive login", () => {
  it("validates fields before making a request and toggles password accessibly", () => {
    const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
    render(<LoginPage onAuthenticated={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(screen.getByText("Enter a valid email address.")).toBeTruthy();
    expect(document.activeElement).toBe(screen.getByLabelText("Email"));
    expect(fetch).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Show password" }));
    expect(screen.getByLabelText("Password").getAttribute("type")).toBe("text");
    fireEvent.click(screen.getByRole("button", { name: "Hide password" }));
    expect(screen.getByLabelText("Password").getAttribute("type")).toBe("password");
  });
  it("hides backend account details on failure and permits retry", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 401, json: async () => ({ error: { message: "Email does not exist" } }) })));
    render(<LoginPage onAuthenticated={vi.fn()} />); fill();
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect((await screen.findByRole("alert")).textContent).toContain("Check your credentials");
    expect(screen.queryByText("Email does not exist")).toBeNull();
    expect((screen.getByLabelText("Password") as HTMLInputElement).value).toBe("secret");
    expect((screen.getByRole("button", { name: "Sign in" }) as HTMLButtonElement).disabled).toBe(false);
  });
  it.each([ ["manager", "/manager/overview"], ["coordinator", "/coordinator/tasks"], ["employee", "/employee/tasks"] ])("uses the authenticated %s role and shows loading and success", async (role, path) => {
    const user = { id: "1", name: "Person", email: "person@example.com", role };
    const done = vi.fn();
    let resolve!: (value: unknown) => void;
    vi.stubGlobal("fetch", vi.fn(() => new Promise(r => { resolve = r; })));
    render(<LoginPage onAuthenticated={done} />); fill();
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect((screen.getByRole("button", { name: "Opening your workspace…" }) as HTMLButtonElement).disabled).toBe(true);
    resolve({ ok: true, json: async () => ({ data: { token: "test-token", user } }) });
    expect(await screen.findByRole("button", { name: "You’re in. Let’s go!" })).toBeTruthy();
    await waitFor(() => expect(done).toHaveBeenCalledWith(user));
    expect(location.pathname).toBe(path);
    expect(sessionStorage.getItem("ops-token")).toBe("test-token");
  });
  it("supports Arabic RTL without losing form values", () => {
    render(<LoginPage onAuthenticated={vi.fn()} />); fill();
    fireEvent.click(screen.getByRole("button", { name: "العربية" }));
    expect(screen.getByRole("main").getAttribute("dir")).toBe("rtl");
    expect((screen.getByLabelText("البريد الإلكتروني") as HTMLInputElement).value).toBe("person@example.com");
  });
});
