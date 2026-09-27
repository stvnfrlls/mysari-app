import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';

test.describe('Product management', () => {
    test.beforeEach(async ({ page }) => {
        execSync('docker compose exec -T app php artisan test:reset-data');
        await login(page);
    });

    test('shows empty state when no products exist', async ({ page }) => {
        await page.goto('/products');
        await expect(page.getByText('No products yet.')).toBeVisible();
    });

    test('can navigate to products from the dashboard', async ({ page }) => {
        await page.goto('/dashboard');
        await page.getByRole('link', { name: 'Manage Products' }).click();
        await expect(page).toHaveURL('/products');
        await expect(page.getByRole('heading', { name: 'Products' })).toBeVisible();
    });

    test('can create a new product', async ({ page }) => {
        const sku = `SKU-${Date.now()}`;

        await page.goto('/products/create');
        await page.getByLabel('Name').fill('Coca-Cola 1.5L');
        await page.getByLabel('SKU').fill(sku);
        await page.getByLabel('Price (₱)').fill('85.00');
        await page.getByLabel('Stock Quantity').fill('20');
        await page.getByLabel('Low Stock Threshold').fill('5');
        await page.getByRole('button', { name: 'Save Product' }).click();

        await expect(page).toHaveURL('/products');
        await expect(page.getByText('Product added.')).toBeVisible();
        await expect(page.getByText('Coca-Cola 1.5L')).toBeVisible();
        await expect(page.getByText(sku)).toBeVisible();
    });

    test('shows low stock badge when stock is at or below threshold', async ({ page }) => {
        const sku = `SKU-LOW-${Date.now()}`;

        await page.goto('/products/create');
        await page.getByLabel('Name').fill('Instant Noodles');
        await page.getByLabel('SKU').fill(sku);
        await page.getByLabel('Price (₱)').fill('15.00');
        await page.getByLabel('Stock Quantity').fill('3');
        await page.getByLabel('Low Stock Threshold').fill('5');
        await page.getByRole('button', { name: 'Save Product' }).click();

        const row = page.locator('tr', { hasText: sku });
        await expect(row.locator('.badge-low')).toBeVisible();
    });

    test('can edit an existing product', async ({ page }) => {
        const sku = `SKU-EDIT-${Date.now()}`;

        await page.goto('/products/create');
        await page.getByLabel('Name').fill('Original Name');
        await page.getByLabel('SKU').fill(sku);
        await page.getByLabel('Price (₱)').fill('10.00');
        await page.getByLabel('Stock Quantity').fill('50');
        await page.getByLabel('Low Stock Threshold').fill('5');
        await page.getByRole('button', { name: 'Save Product' }).click();

        const row = page.locator('tr', { hasText: sku });
        await row.getByRole('link', { name: 'Edit' }).click();

        await expect(page.getByRole('heading', { name: 'Edit Product' })).toBeVisible();
        await page.getByLabel('Name').fill('Updated Name');
        await page.getByRole('button', { name: 'Update Product' }).click();

        await expect(page).toHaveURL('/products');
        await expect(page.getByText('Product updated.')).toBeVisible();
        await expect(page.getByText('Updated Name')).toBeVisible();
    });

    test('rejects a duplicate SKU', async ({ page }) => {
        const sku = `SKU-DUP-${Date.now()}`;

        await page.goto('/products/create');
        await page.getByLabel('Name').fill('First Product');
        await page.getByLabel('SKU').fill(sku);
        await page.getByLabel('Price (₱)').fill('20.00');
        await page.getByLabel('Stock Quantity').fill('10');
        await page.getByLabel('Low Stock Threshold').fill('5');
        await page.getByRole('button', { name: 'Save Product' }).click();
        await expect(page).toHaveURL('/products');

        await page.goto('/products/create');
        await page.getByLabel('Name').fill('Second Product');
        await page.getByLabel('SKU').fill(sku);
        await page.getByLabel('Price (₱)').fill('30.00');
        await page.getByLabel('Stock Quantity').fill('5');
        await page.getByLabel('Low Stock Threshold').fill('5');
        await page.getByRole('button', { name: 'Save Product' }).click();

        await expect(page).toHaveURL('/products/create');
        await expect(page.locator('.error-box')).toBeVisible();
    });

    test('can delete a product', async ({ page }) => {
        const sku = `SKU-DEL-${Date.now()}`;

        await page.goto('/products/create');
        await page.getByLabel('Name').fill('Product To Delete');
        await page.getByLabel('SKU').fill(sku);
        await page.getByLabel('Price (₱)').fill('5.00');
        await page.getByLabel('Stock Quantity').fill('1');
        await page.getByLabel('Low Stock Threshold').fill('5');
        await page.getByRole('button', { name: 'Save Product' }).click();

        const row = page.locator('tr', { hasText: sku });
        page.once('dialog', dialog => dialog.accept());
        await row.getByRole('button', { name: 'Delete' }).click();

        await expect(page).toHaveURL('/products');
        await expect(page.getByText('Product deleted.')).toBeVisible();
        await expect(page.getByText(sku)).not.toBeVisible();
    });
});

async function login(page) {
    await page.goto('/login');
    await page.getByLabel('Email').fill('testuser@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL('/dashboard');
}
