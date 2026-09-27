import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';

test.describe('Low stock report', () => {
    test.beforeEach(async ({ page }) => {
        execSync('docker compose exec -T app php artisan test:reset-data');
        await login(page);
    });

    test('shows empty state when nothing is low', async ({ page }) => {
        await page.goto('/products/low-stock');
        await expect(page.getByText("Nothing's low right now.")).toBeVisible();
    });

    test('lists products at or below their threshold', async ({ page }) => {
        const sku = `SKU-LOW-${Date.now()}`;

        await page.goto('/products/create');
        await page.getByLabel('Name').fill('Instant Noodles');
        await page.getByLabel('SKU').fill(sku);
        await page.getByLabel('Price (₱)').fill('15.00');
        await page.getByLabel('Stock Quantity').fill('3');
        await page.getByLabel('Low Stock Threshold').fill('5');
        await page.getByRole('button', { name: 'Save Product' }).click();

        await page.goto('/products/low-stock');
        const row = page.locator('tr', { hasText: sku });
        await expect(row).toBeVisible();
        await expect(row.locator('.badge-low')).toBeVisible();
    });

    test('excludes products above their threshold', async ({ page }) => {
        const sku = `SKU-OK-${Date.now()}`;

        await page.goto('/products/create');
        await page.getByLabel('Name').fill('Bottled Water');
        await page.getByLabel('SKU').fill(sku);
        await page.getByLabel('Price (₱)').fill('20.00');
        await page.getByLabel('Stock Quantity').fill('50');
        await page.getByLabel('Low Stock Threshold').fill('5');
        await page.getByRole('button', { name: 'Save Product' }).click();

        await page.goto('/products/low-stock');
        await expect(page.getByText(sku)).not.toBeVisible();
    });

    test('can navigate to low stock from products page', async ({ page }) => {
        await page.goto('/products');
        await page.getByRole('link', { name: 'Low Stock' }).click();
        await expect(page).toHaveURL('/products/low-stock');
        await expect(page.getByRole('heading', { name: 'Low Stock' })).toBeVisible();
    });
});

async function login(page) {
    await page.goto('/login');
    await page.getByLabel('Email').fill(process.env.TEST_USER_EMAIL);
    await page.getByLabel('Password').fill(process.env.TEST_USER_PASSWORD);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL('/dashboard');
}
