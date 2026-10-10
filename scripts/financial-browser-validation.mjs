import { chromium } from "@playwright/test";
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
try {
  await page.goto("http://localhost:5173");
  await page
    .getByLabel("Email", { exact: true })
    .fill("coordinator@test.local");
  await page
    .getByLabel("Password", { exact: true })
    .fill("browser-test-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page
    .getByRole("link", { name: "Financial Reports", exact: true })
    .click();
  await page.getByLabel("Required accounts", { exact: true }).fill("50");
  await page.getByLabel("Already achieved", { exact: true }).fill("36");
  if (
    (await page
      .getByLabel("Current gap (remaining accounts)", { exact: true })
      .inputValue()) !== "14"
  )
    throw new Error("Incorrect gap");
  for (const [label, value] of [
    ["Received from manager (USD)", "400"],
    ["Current cash balance (USD)", "350.41"],
    ["Reserved funds (USD)", "50"],
    ["Budget summary", "Weekly budget"],
  ])
    await page.getByLabel(label, { exact: true }).fill(value);
  await page
    .getByRole("button", { name: "Save weekly report", exact: true })
    .click();
  await page.getByText(/Saved report/).waitFor();
  await page.getByRole("button", { name: "Next week", exact: true }).click();
  await page.getByText(/No report saved/).waitFor();
  if (
    (await page
      .getByLabel("Required accounts", { exact: true })
      .inputValue()) !== ""
  )
    throw new Error("Weeks leaked");
  await page
    .getByRole("button", { name: "Previous week", exact: true })
    .click();
  await page.getByText(/Saved report/).waitFor();
  if (
    (await page
      .getByLabel("Current cash balance (USD)", { exact: true })
      .inputValue()) !== "350.41"
  )
    throw new Error("Money not preserved");
  await page.reload();
  await page.getByLabel("Budget summary", { exact: true }).waitFor();
  if (
    (await page.getByLabel("Budget summary", { exact: true }).inputValue()) !==
    "Weekly budget"
  )
    throw new Error("Reload failed");
  await page.screenshot({
    path: "artifacts/weekly-report-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "artifacts/weekly-report-mobile.png",
    fullPage: true,
  });
  if (
    await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)
  )
    throw new Error("Mobile overflow");
  if (errors.length) throw new Error(errors.join(";"));
  console.log(
    "PASS weekly save, gap, separate weeks, persistence after reload, mobile layout; zero page errors",
  );
} finally {
  await browser.close();
}
