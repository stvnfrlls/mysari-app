import { test, expect } from '../fixtures.js';

test.describe('Cashier restrictions', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
        await page.getByLabel('Email').fill('cashier@example.com');
        await page.getByLabel('Password').fill(process.env.TEST_USER_PASSWORD);
        await page.getByRole('button', { name: 'Sign In' }).click();
        await expect(page).toHaveURL('/dashboard');
    });

    test('a cashier gets 403 on the sales report and its export', async ({ page }) => {
        const report = await page.request.get('/reports/sales');
        expect(report.status()).toBe(403);

        const csv = await page.request.get('/reports/sales/export');
        expect(csv.status()).toBe(403);
    });

    test('a cashier sees no Sales Report link and no product Edit link', async ({ page }) => {
        await expect(page.getByRole('link', { name: 'Sales Report' })).toHaveCount(0);

        const sku = `SKU-CASH-${Date.now()}`;
        await page.goto('/products/create');
        await page.getByLabel('Name').fill('Cashier Made');
        await page.getByLabel('SKU').fill(sku);
        await page.getByLabel('Price (₱)').fill('5.00');
        await page.getByLabel('Stock Quantity').fill('3');
        await page.getByLabel('Low Stock Threshold').fill('1');
        await page.getByRole('button', { name: 'Save Product' }).click();
        await expect(page).toHaveURL('/products');

        const row = page.locator('tr', { hasText: sku });
        await expect(row).toBeVisible();
        await expect(row.getByRole('link', { name: 'Edit' })).toHaveCount(0);
    });
});
