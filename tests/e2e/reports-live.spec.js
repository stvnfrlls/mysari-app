import { test, expect } from '../fixtures.js';
import { execSync } from '../support/exec.js';

test.describe('Sales report live totals', () => {
    test.beforeEach(async ({ page }) => {
        execSync('docker compose exec -T app php artisan test:reset-data');
        await login(page);
    });

    test('an open report picks up a new sale without a reload', async ({ page }) => {
        test.setTimeout(60000);

        const product = `Live Report ${Date.now()}`;
        await createProduct(page, { name: product, sku: `SKU-LR-${Date.now()}`, price: 10, stock: 20 });

        await page.goto('/reports/sales');
        await expect(page.locator('#revenueCard')).toContainText('₱0.00');
        await expect(page.locator('#txCard')).toContainText('0');
        await expect(page.getByText('No sales in this period.')).toBeVisible();

        const other = await page.context().newPage();
        await recordSale(other, product, 3);
        await other.close();
        await page.bringToFront();

        // The report polls every 10 seconds; no reload here.
        await expect(page.locator('#revenueCard')).toContainText('₱30.00', { timeout: 20000 });
        await expect(page.locator('#txCard')).toContainText('1');
        await expect(page.locator('#reportData table')).toContainText(product);
    });

    test('an open report drops a voided sale without a reload', async ({ page }) => {
        test.setTimeout(60000);

        const product = `Live Report Void ${Date.now()}`;
        await createProduct(page, { name: product, sku: `SKU-LRV-${Date.now()}`, price: 10, stock: 20 });
        await recordSale(page, product, 2);

        await page.goto('/reports/sales');
        await expect(page.locator('#revenueCard')).toContainText('₱20.00');
        await expect(page.locator('#reportData table')).toContainText(product);

        const other = await page.context().newPage();
        await voidSale(other, product);
        await other.close();
        await page.bringToFront();

        await expect(page.locator('#revenueCard')).toContainText('₱0.00', { timeout: 20000 });
        await expect(page.getByText('No sales in this period.')).toBeVisible();
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
