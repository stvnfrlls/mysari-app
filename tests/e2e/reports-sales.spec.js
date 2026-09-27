import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';

test.describe('Sales report', () => {
    test.beforeEach(async ({ page }) => {
        execSync('docker compose exec -T app php artisan test:reset-data');
        await login(page);
    });

    test('shows empty state when there are no sales', async ({ page }) => {
        await page.goto('/reports/sales');
        await expect(page.getByText('No sales in this period.')).toBeVisible();
        await expect(page.getByText('₱0.00')).toBeVisible();
    });

    test('reflects a recorded sale in revenue and breakdown', async ({ page }) => {
        const sku = `SKU-RPT-${Date.now()}`;
        const productName = `Report Test Item ${Date.now()}`;

        await page.goto('/products/create');
        await page.getByLabel('Name').fill(productName);
        await page.getByLabel('SKU').fill(sku);
        await page.getByLabel('Price (₱)').fill('50.00');
        await page.getByLabel('Stock Quantity').fill('20');
        await page.getByLabel('Low Stock Threshold').fill('5');
        await page.getByRole('button', { name: 'Save Product' }).click();

        await page.goto('/transactions/create');
        const optionValue = await page
            .locator('#product_id option', { hasText: productName })
            .getAttribute('value');
        await page.selectOption('#product_id', optionValue);
        await page.getByLabel('Quantity').fill('3');
        await page.getByRole('button', { name: 'Record Sale' }).click();

        await expect(page).toHaveURL('/transactions');

        await page.goto('/reports/sales');

        const revenueCard = page.locator('.table-panel', { hasText: 'Total Revenue' });
        await expect(revenueCard.getByText('₱150.00')).toBeVisible();

        await expect(page.getByText(productName)).toBeVisible();

        const row = page.locator('tr', { hasText: productName });
        await expect(row.getByRole('cell', { name: '3', exact: true })).toBeVisible();
        await expect(row.getByText('₱150.00')).toBeVisible();
    });

    test('date filter excludes sales outside the selected range', async ({ page }) => {
        const sku = `SKU-DATE-${Date.now()}`;
        const productName = `Date Filter Item ${Date.now()}`;

        await page.goto('/products/create');
        await page.getByLabel('Name').fill(productName);
        await page.getByLabel('SKU').fill(sku);
        await page.getByLabel('Price (₱)').fill('25.00');
        await page.getByLabel('Stock Quantity').fill('10');
        await page.getByLabel('Low Stock Threshold').fill('5');
        await page.getByRole('button', { name: 'Save Product' }).click();

        await page.goto('/transactions/create');
        const optionValue = await page
            .locator('#product_id option', { hasText: productName })
            .getAttribute('value');
        await page.selectOption('#product_id', optionValue);
        await page.getByLabel('Quantity').fill('1');
        await page.getByRole('button', { name: 'Record Sale' }).click();

        await page.goto('/reports/sales?from=2020-01-01&to=2020-01-31');
        await expect(page.getByText('No sales in this period.')).toBeVisible();
        await expect(page.getByText(productName)).not.toBeVisible();
    });
});

async function login(page) {
    await page.goto('/login');
    await page.getByLabel('Email').fill(process.env.TEST_USER_EMAIL);
    await page.getByLabel('Password').fill(process.env.TEST_USER_PASSWORD);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL('/dashboard');
}
