import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';

test.describe('Void sale', () => {
    test.beforeEach(async ({ page }) => {
        execSync('docker compose exec -T app php artisan test:reset-data');
        await login(page);
    });

    test('voiding a sale restores stock and marks the sale as voided', async ({ page }) => {
        const name = `Void Item ${Date.now()}`;
        await createProduct(page, { name, sku: `SKU-VOID-${Date.now()}`, price: 50, stock: 20 });

        const stockBefore = await dashboardStat(page, 'Items in Stock');

        await recordSale(page, name, 3);
        expect(await dashboardStat(page, 'Items in Stock')).toBe(stockBefore - 3);

        await voidSale(page, name);

        const row = page.locator('tr', { hasText: name });
        await expect(row).toHaveClass(/voided/);
        await expect(row.locator('.badge-voided')).toBeVisible();
        await expect(row.getByRole('button', { name: 'Void' })).toHaveCount(0);

        expect(await dashboardStat(page, 'Items in Stock')).toBe(stockBefore);
    });

    test('a voided sale no longer counts toward the dashboard or sales report', async ({ page }) => {
        const name = `Void Report Item ${Date.now()}`;
        await createProduct(page, { name, sku: `SKU-VRPT-${Date.now()}`, price: 40, stock: 10 });

        const txBefore = await dashboardStat(page, 'Transactions Today');

        await recordSale(page, name, 2);
        expect(await dashboardStat(page, 'Transactions Today')).toBe(txBefore + 1);

        await voidSale(page, name);

        expect(await dashboardStat(page, 'Transactions Today')).toBe(txBefore);
        await expect(page.locator('.activity-row', { hasText: name })).toHaveCount(0);

        await page.goto('/reports/sales');
        await expect(page.getByText('No sales in this period.')).toBeVisible();
        await expect(page.getByText(name)).not.toBeVisible();
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
