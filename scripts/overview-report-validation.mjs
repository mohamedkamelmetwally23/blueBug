import { chromium } from '@playwright/test';
import fs from 'node:fs';
const browser = await chromium.launch({ headless: true, channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1500, height: 1000 } });
const names = ['Scripts', 'Emails', 'Action needed', 'Invitation acceptance', 'Deactivation check', 'Target active account', 'Warm emails', 'Warm accounts', 'Trying accounts'];
const categories = names.map((name, i) => ({ _id: String(i), name, description: '', results: [], tasks: 6, completed: 2, quantity: i + 2, statuses: ['Completed', 'Completed', 'In Progress', 'Not Started', 'Not Started', 'Not Started'], goodResults: 2, badResults: 1, pendingResults: 3 }));
await page.addInitScript(() => { sessionStorage.setItem('ops-token', 'print-preview'); document.documentElement.dataset.theme = 'dark'; });
await page.route('**/api/v1/**', route => {
  const path = new URL(route.request().url()).pathname;
  const data = path.endsWith('/auth/me') ? { id: 'manager', name: 'Report Preview', role: 'manager' } : path.endsWith('/categories') ? categories : path.endsWith('/employees') ? [] : path.endsWith('/overview') ? { categories, trend: [] } : path.includes('/financial-reports/') ? { receivedCents: 30000, balanceCents: 20000, reservedCents: 10000, budgetSummary: 'Selected week budget summary.' } : {};
  return route.fulfill({ json: { data } });
});
try {
  await page.goto('http://127.0.0.1:5178/manager/overview');
  await page.locator('.operation-metric').first().waitFor();
  await page.getByText('$300.00').waitFor();
  await page.emulateMedia({ media: 'print' });
  await page.evaluate(() => document.fonts.ready);
  fs.mkdirSync('artifacts', { recursive: true });
  for (const period of ['This week', 'Last month']) {
    if (period === 'Last month') await page.getByRole('button', { name: period, includeHidden: true }).evaluate(button => button.click());
    await page.waitForTimeout(300);
    const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: true, displayHeaderFooter: false });
    const pages = [...pdf.toString('latin1').matchAll(/\/Type\s*\/Page\b/g)].length;
    fs.writeFileSync(`artifacts/overview-report-${period.replaceAll(' ', '-')}.pdf`, pdf);
    if (pages !== 1) throw new Error(`${period}: expected one page, got ${pages}`);
    console.log(`${period}: one A4 page, nine cards and two charts`);
  }
  await page.screenshot({ path: 'artifacts/overview-report-print.png', fullPage: true });
} finally { await browser.close(); }

