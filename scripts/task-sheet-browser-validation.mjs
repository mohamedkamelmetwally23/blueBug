import { chromium } from "@playwright/test";
import fs from "node:fs";
const browser = await chromium.launch({ headless: true, channel: "chrome" });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.route("**/api/v1/**", async (route) => {
  const url = new URL(route.request().url());
  url.hostname = "127.0.0.1";
  url.port = "4101";
  await route.fulfill({ response: await route.fetch({ url: url.toString() }) });
});
async function login(role) {
  await page.goto("http://localhost:5173");
  await page.getByLabel("Email", { exact: true }).fill(role + "@test.local");
  await page
    .getByLabel("Password", { exact: true })
    .fill("browser-test-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.getByRole("navigation").waitFor();
}
async function logout() {
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await page.getByRole("heading", { name: "Welcome back." }).waitFor();
}
try {
  await login("coordinator");
  await page.getByRole("link", { name: "Categories", exact: true }).click();
  await page
    .getByRole("button", { name: "Create Category", exact: true })
    .click();
  const category = "Assignment " + Date.now();
  await page.getByLabel("Category name", { exact: true }).fill(category);
  await page
    .getByRole("button", { name: "Save category", exact: true })
    .click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  await page.getByRole("link", { name: "Tasks", exact: true }).click();
  await page.getByRole("button", { name: "Create Task", exact: true }).click();
  const dialog = page.getByRole("dialog");
  if ((await dialog.locator("input,select,textarea").count()) !== 4)
    throw new Error("Creation must have only four fields");
  await dialog
    .getByLabel("Category", { exact: true })
    .selectOption({ label: category });
  await dialog
    .getByLabel("Assigned to", { exact: true })
    .selectOption({ label: "Employee" });
  await dialog.getByLabel("Start date", { exact: true }).fill("2026-10-10");
  await dialog
    .getByLabel("Additional information (optional)", { exact: true })
    .fill("Please check accounts");
  await page.screenshot({
    path: "artifacts/minimal-task-form.png",
    fullPage: true,
  });
  await dialog.getByRole("button", { name: "Save task", exact: true }).click();
  await dialog.waitFor({ state: "hidden" });
  let row = page.getByRole("row").filter({ hasText: category });
  await row.waitFor();
  let cells = await row.getByRole("cell").allTextContents();
  for (const index of [1, 3, 5, 6, 7, 8, 9])
    if (cells[index].trim())
      throw new Error("Employee column was prefilled: " + index);
  await logout();
  await login("employee");
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await dialog.getByLabel("Day", { exact: true }).fill("Saturday");
  await dialog.getByLabel("Status", { exact: true }).selectOption("Completed");
  await dialog.getByLabel("End date", { exact: true }).fill("2026-10-11");
  await dialog
    .getByLabel("Names of acc", { exact: true })
    .fill("Account A\nAccount B");
  await dialog.getByLabel("Num Done", { exact: true }).fill("2");
  await dialog.getByLabel("staus", { exact: true }).fill("Good");
  await dialog
    .getByLabel("Clarifications", { exact: true })
    .fill("All checked");
  await dialog
    .getByRole("button", { name: "Save work details", exact: true })
    .click();
  await page.getByText("Work details saved.", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Close form", exact: true }).click();
  await page.reload();
  await page.getByRole("cell", { name: "Good", exact: true }).waitFor();
  await logout();
  await login("coordinator");
  await page.getByRole("cell", { name: "All checked", exact: true }).waitFor();
  await page.getByRole("button", { name: "View details", exact: true }).click();
  if (
    await dialog
      .getByRole("button", { name: "Save work details", exact: true })
      .count()
  )
    throw new Error("Coordinator has employee save control");
  if (!(await dialog.getByLabel("End date", { exact: true }).isDisabled()))
    throw new Error("Management can edit work");
  await page.getByRole("button", { name: "Close form", exact: true }).click();
  await page.screenshot({
    path: "artifacts/task-table-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "artifacts/task-table-mobile.png",
    fullPage: true,
  });
  if (
    await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)
  )
    throw new Error("Page overflows mobile");
  if (errors.length) throw new Error(errors.join(";"));
  console.log(
    "PASS four-field creation, blank columns, employee updates, reload persistence, coordinator review, mobile; zero page errors",
  );
} finally {
  await browser.close();
}
