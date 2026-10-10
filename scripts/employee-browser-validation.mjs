import { chromium } from "@playwright/test";
const browser = await chromium.launch({ headless: true, channel: "chrome" });
const page = await browser.newPage();
const employeeEmail = `created${Date.now()}@test.local`;
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.route("**/api/v1/**", async (route) => {
  const url = new URL(route.request().url());
  url.hostname = "127.0.0.1";
  url.port = "4101";
  await route.fulfill({ response: await route.fetch({ url: url.toString() }) });
});
try {
  await page.goto("http://localhost:5173");
  await page
    .getByLabel("Email", { exact: true })
    .fill("coordinator@test.local");
  await page
    .getByLabel("Password", { exact: true })
    .fill("browser-test-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.getByRole("link", { name: "Employees", exact: true }).click();
  await page
    .getByRole("button", { name: "Create Employee", exact: true })
    .click();
  await page.getByLabel("Full name", { exact: true }).fill("Created Employee");
  await page.getByLabel("Email", { exact: true }).fill(employeeEmail);
  await page.getByLabel("Password", { exact: true }).fill("created-password");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Create Employee", exact: true })
    .click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  await page.getByText("Employee created.", { exact: true }).waitFor();
  await page.getByText("Created Employee", { exact: true }).first().waitFor();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await page.getByLabel("Email", { exact: true }).fill(employeeEmail);
  await page.getByLabel("Password", { exact: true }).fill("created-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.getByRole("link", { name: "My Tasks", exact: true }).waitFor();
  if (errors.length) throw new Error(errors.join(";"));
  console.log(
    "PASS: popup creation, refreshed employee list, new employee sign-in; zero browser errors",
  );
} finally {
  await browser.close();
}
