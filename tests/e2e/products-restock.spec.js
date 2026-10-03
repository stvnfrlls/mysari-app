import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';

test.describe('Restock and stock history', () => {
    test.beforeEach(async ({ page }) => {
        execSync('docker compose exec -T app php artisan test:reset-data');
        await login(page);
    });

    test('restocking a low-stock product raises stock and removes it from the low-stock list', async ({ page }) => {
        const name = `Restock Item ${Date.now()}`;
        const sku = `SKU-RS-${Date.now()}`;
        await createProduct(page, { name, sku, price: 10, stock: 2 });

        const stockBefore = await dashboardStat(page, 'Items in Stock');

        await page.goto('/products/low-stock');
        const row = page.locator('tr', { hasText: sku });
        await row.locator('input[name="quantity"]').fill('10');
        await row.locator('input[name="note"]').fill('Weekly delivery');
        await row.getByRole('button', { name: 'Restock' }).click();

        await expect(page.getByText('Stock updated.')).toBeVisible();
        await expect(page.getByText(sku)).not.toBeVisible();
        await expect(page.getByText("Nothing's low right now.")).toBeVisible();

        expect(await dashboardStat(page, 'Items in Stock')).toBe(stockBefore + 10);
    });

    test('history lists sale, void and restock movements', async ({ page }) => {
        const name = `History Item ${Date.now()}`;
        const sku = `SKU-HIST-${Date.now()}`;
        await createProduct(page, { name, sku, price: 10, stock: 4 });

        await recordSale(page, name, 1);
        await voidSale(page, name);

        await page.goto('/products/low-stock');
        const row = page.locator('tr', { hasText: sku });
        const historyHref = await row.getByRole('link', { name: 'History' }).getAttribute('href');
        await row.locator('input[name="quantity"]').fill('6');
        await row.locator('input[name="note"]').fill('Weekly delivery');
        await row.getByRole('button', { name: 'Restock' }).click();
        await expect(page.getByText('Stock updated.')).toBeVisible();

        await page.goto(historyHref);
        await expect(page.getByRole('heading', { name })).toBeVisible();
        await expect(page.getByText('Current stock: 10')).toBeVisible();
        await expect(page.locator('tbody tr')).toHaveCount(3);

        await expect(page.getByRole('cell', { name: 'Sale', exact: true })).toBeVisible();
        await expect(page.getByRole('cell', { name: 'Void', exact: true })).toBeVisible();
        await expect(page.getByRole('cell', { name: 'Restock', exact: true })).toBeVisible();
        await expect(page.getByRole('cell', { name: '-1', exact: true })).toBeVisible();
        await expect(page.getByRole('cell', { name: '+1', exact: true })).toBeVisible();
        await expect(page.getByRole('cell', { name: '+6', exact: true })).toBeVisible();
        await expect(page.getByRole('cell', { name: 'Weekly delivery' })).toBeVisible();
    });

    test('editing stock from the product form logs an adjustment', async ({ page }) => {
        const name = `Adjust Item ${Date.now()}`;
        const sku = `SKU-ADJ-${Date.now()}`;
        await createProduct(page, { name, sku, price: 10, stock: 10 });

        await page.goto('/products');
        const editHref = await page
            .locator('tr', { hasText: sku })
            .getByRole('link', { name: 'Edit' })
            .getAttribute('href');

        await page.goto(editHref);
        await page.getByLabel('Stock Quantity').fill('15');
        await page.getByRole('button', { name: 'Update Product' }).click();
        await expect(page.getByText('Product updated.')).toBeVisible();

        await page.goto(editHref.replace(/\/edit$/, '/history'));
        await expect(page.getByRole('cell', { name: 'Adjustment', exact: true })).toBeVisible();
        await expect(page.getByRole('cell', { name: '+5', exact: true })).toBeVisible();
        await expect(page.getByText('Current stock: 15')).toBeVisible();
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

async function recordSale(page, productName, qty) {
    await page.goto('/transactions/create');
    const optionValue = await page
        .locator('#product_id option', { hasText: productName })
        .getAttribute('value');
    await page.selectOption('#product_id', optionValue);
    await page.getByLabel('Quantity').fill(String(qty));
    await page.getByRole('button', { name: 'Record Sale' }).click();
    await expect(page).toHaveURL('/transactions');
}

async function voidSale(page, productName) {
    await page.goto('/transactions');
    const row = page.locator('tr', { hasText: productName });
    page.once('dialog', dialog => dialog.accept());
    await row.getByRole('button', { name: 'Void' }).click();
    await expect(page.getByText('Transaction voided.')).toBeVisible();
}

async function dashboardStat(page, label) {
    await page.goto('/dashboard');
    const text = await page
        .locator('.stat-card', { hasText: label })
        .locator('.stat-value')
        .innerText();
    return parseInt(text.replace(/,/g, ''), 10);
}
