import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';

test.describe('Product search', () => {
    test.beforeEach(async ({ page }) => {
        execSync('docker compose exec -T app php artisan test:reset-data');
        await login(page);
        await createProduct(page, { name: 'Alpha Rice', sku: 'SKU-ALPHA-1', price: 50, stock: 10 });
        await createProduct(page, { name: 'Beta Soap', sku: 'SKU-BETA-1', price: 20, stock: 10 });
    });

    test('searching by name narrows the list', async ({ page }) => {
        await search(page, 'rice');

        await expect(page.locator('tr', { hasText: 'Alpha Rice' })).toHaveCount(1);
        await expect(page.locator('tr', { hasText: 'Beta Soap' })).toHaveCount(0);
    });

    test('searching by SKU narrows the list', async ({ page }) => {
        await search(page, 'BETA');

        await expect(page.locator('tr', { hasText: 'Beta Soap' })).toHaveCount(1);
        await expect(page.locator('tr', { hasText: 'Alpha Rice' })).toHaveCount(0);
    });

    test('a search with no results shows a no-match message', async ({ page }) => {
        await search(page, 'zzz-nothing');

        await expect(page.getByText('No products match')).toBeVisible();
        await expect(page.getByText('No products yet.')).toHaveCount(0);
    });

    test('a percent sign is searched literally, not as a wildcard', async ({ page }) => {
        await search(page, '%');

        await expect(page.getByText('No products match')).toBeVisible();
        await expect(page.locator('tr', { hasText: 'Alpha Rice' })).toHaveCount(0);
    });

    test('Clear brings the full list back', async ({ page }) => {
        await search(page, 'rice');
        await expect(page.locator('tr', { hasText: 'Beta Soap' })).toHaveCount(0);

        await page.getByRole('link', { name: 'Clear' }).click();

        await expect(page).toHaveURL('/products');
        await expect(page.locator('tr', { hasText: 'Alpha Rice' })).toHaveCount(1);
        await expect(page.locator('tr', { hasText: 'Beta Soap' })).toHaveCount(1);
    });
});

async function login(page) {
    await page.goto('/login');
    await page.getByLabel('Email').fill(process.env.TEST_USER_EMAIL);
    await page.getByLabel('Password').fill(process.env.TEST_USER_PASSWORD);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL('/dashboard');
}

async function createProduct(page, { name, sku, price, stock, threshold = '5' }) {
    await page.goto('/products/create');
    await page.getByLabel('Name').fill(name);
    await page.getByLabel('SKU').fill(sku);
    await page.getByLabel('Price (₱)').fill(price.toFixed(2));
    await page.getByLabel('Stock Quantity').fill(String(stock));
    await page.getByLabel('Low Stock Threshold').fill(String(threshold));
    await page.getByRole('button', { name: 'Save Product' }).click();
    await expect(page).toHaveURL('/products');
}

async function search(page, term) {
    await page.goto('/products');
    await page.getByPlaceholder('Search by name or SKU').fill(term);
    await page.getByRole('button', { name: 'Search' }).click();
    await expect(page).toHaveURL(/\/products\?q=/);
}
