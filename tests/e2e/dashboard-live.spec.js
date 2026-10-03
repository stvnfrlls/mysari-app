import { test, expect } from '../fixtures.js';
import { execSync } from '../support/exec.js';

test.describe('Dashboard live panels', () => {
    test.beforeEach(async ({ page }) => {
        execSync('docker compose exec -T app php artisan test:reset-data');
        await login(page);
    });

    test('an open dashboard shows a new sale in Top Sellers and Recent Activity without a reload', async ({ page }) => {
        test.setTimeout(60000);

        const product = `Live Sale ${Date.now()}`;
        await createProduct(page, { name: product, sku: `SKU-LS-${Date.now()}`, price: 10, stock: 20 });

        await page.goto('/dashboard');
        await expect(page.locator('#topProducts').getByText('No sales yet today.')).toBeVisible();
        await expect(page.locator('#recentActivity').getByText('No activity yet.')).toBeVisible();

        const other = await page.context().newPage();
        await recordSale(other, product, 3);
        await other.close();
        await page.bringToFront();

        // The dashboard polls every 10 seconds; no reload here.
        await expect(page.locator('#topProducts .top-row')).toContainText(product, { timeout: 20000 });
        await expect(page.locator('#topProducts .top-row')).toContainText('3 sold');
        await expect(page.locator('#recentActivity .activity-row')).toContainText(`3× ${product}`);
    });

    test('an open dashboard drops a voided sale from both panels without a reload', async ({ page }) => {
        test.setTimeout(60000);

        const product = `Live Void ${Date.now()}`;
        await createProduct(page, { name: product, sku: `SKU-LV2-${Date.now()}`, price: 10, stock: 20 });
        await recordSale(page, product, 2);

        await page.goto('/dashboard');
        await expect(page.locator('#topProducts')).toContainText(product);
        await expect(page.locator('#recentActivity')).toContainText(product);

        const other = await page.context().newPage();
        await voidSale(other, product);
        await other.close();
        await page.bringToFront();

        await expect(page.locator('#topProducts').getByText('No sales yet today.')).toBeVisible({ timeout: 20000 });
        await expect(page.locator('#recentActivity').getByText('No activity yet.')).toBeVisible();
    });
});

async function login(page) {
    await page.goto('/login');
    await page.getByLabel('Email').fill(process.env.TEST_USER_EMAIL);
    await page.getByLabel('Password').fill(process.env.TEST_USER_PASSWORD);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL('/dashboard');
}

async function createProduct(page, { name, sku, price, stock, threshold = 5 }) {
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
