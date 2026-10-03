import { test, expect } from '../fixtures.js';

test.describe('Report date handling', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
        await page.getByLabel('Email').fill(process.env.TEST_USER_EMAIL);
        await page.getByLabel('Password').fill(process.env.TEST_USER_PASSWORD);
        await page.getByRole('button', { name: 'Sign In' }).click();
        await expect(page).toHaveURL('/dashboard');
    });

    test('invalid dates fall back to the default range instead of erroring', async ({ page }) => {
        for (const query of ['from=abc', 'to=not-a-date', 'from[]=x', 'from=2026-02-31&to=zzz']) {
            const report = await page.request.get(`/reports/sales?${query}`);
            expect(report.status(), query).toBe(200);

            const csv = await page.request.get(`/reports/sales/export?${query}`);
            expect(csv.status(), query).toBe(200);
        }
    });
});
