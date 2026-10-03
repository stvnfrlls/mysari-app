import { test, expect } from '../fixtures.js';
import { execSync } from '../support/exec.js';

test.describe('Products pagination', () => {
    test.beforeEach(async ({ page }) => {
        execSync('docker compose exec -T app php artisan test:reset-data');
        execSync(
            `docker compose exec -T app php artisan tinker --execute="for (\\$i = 1; \\$i <= 25; \\$i++) { App\\Models\\Product::create(['name' => 'Page '.str_pad(\\$i, 2, '0', STR_PAD_LEFT), 'sku' => 'PAGE-'.\\$i, 'price' => 10, 'stock_quantity' => 10, 'low_stock_threshold' => 5]); }"`
        );
        await login(page);
    });

    test('the first page shows 20 products and the result count', async ({ page }) => {
        await page.goto('/products');

        await expect(page.locator('tbody tr')).toHaveCount(20);
        await expect(page.locator('tr', { hasText: 'Page 01' })).toHaveCount(1);
        await expect(page.locator('tr', { hasText: 'Page 21' })).toHaveCount(0);
        await expect(page.getByText('Showing 1 to 20 of 25 results')).toBeVisible();
    });

    test('page 2 shows the remaining products', async ({ page }) => {
        await page.goto('/products');
        await page.getByRole('link', { name: '2', exact: true }).click();

        await expect(page).toHaveURL(/page=2/);
        await expect(page.locator('tbody tr')).toHaveCount(5);
        await expect(page.locator('tr', { hasText: 'Page 21' })).toHaveCount(1);
        await expect(page.locator('tr', { hasText: 'Page 01' })).toHaveCount(0);
        await expect(page.getByText('Showing 21 to 25 of 25 results')).toBeVisible();
    });

    test('Next and Previous move between pages', async ({ page }) => {
        await page.goto('/products');
        await expect(page.locator('.pager-item.disabled', { hasText: 'Previous' })).toBeVisible();

        await page.getByRole('link', { name: 'Next' }).click();
        await expect(page).toHaveURL(/page=2/);
        await expect(page.locator('.pager-item.disabled', { hasText: 'Next' })).toBeVisible();

        await page.getByRole('link', { name: 'Previous' }).click();
        await expect(page.locator('tr', { hasText: 'Page 01' })).toHaveCount(1);
    });

    test('the search term survives a page change', async ({ page }) => {
        await page.goto('/products');
        await page.getByPlaceholder('Search by name or SKU').fill('Page');
        await page.getByRole('button', { name: 'Search' }).click();
        await expect(page.getByText('Showing 1 to 20 of 25 results')).toBeVisible();

        await page.getByRole('link', { name: '2', exact: true }).click();

        await expect(page).toHaveURL(/q=Page/);
        await expect(page).toHaveURL(/page=2/);
        await expect(page.getByPlaceholder('Search by name or SKU')).toHaveValue('Page');
        await expect(page.locator('tbody tr')).toHaveCount(5);
        await expect(page.locator('tr', { hasText: 'Page 21' })).toHaveCount(1);
    });

    test('a search with few results shows no page links', async ({ page }) => {
        await page.goto('/products?q=Page 2');

        await expect(page.locator('tbody tr')).toHaveCount(6);
        await expect(page.getByRole('navigation', { name: 'Pagination' })).toHaveCount(0);
    });
});

async function login(page) {
    await page.goto('/login');
    await page.getByLabel('Email').fill(process.env.TEST_USER_EMAIL);
    await page.getByLabel('Password').fill(process.env.TEST_USER_PASSWORD);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL('/dashboard');
}
