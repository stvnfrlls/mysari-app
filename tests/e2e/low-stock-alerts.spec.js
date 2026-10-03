import { test, expect } from '../fixtures.js';
import { execSync } from '../support/exec.js';

test.describe('Low stock alerts', () => {
    test.beforeEach(async ({ page }) => {
        execSync('docker compose exec -T app php artisan test:reset-data');
        await login(page);
    });

    test('a sale that drops stock to the threshold opens an alert on the dashboard', async ({ page }) => {
        const product = `Alert Low ${Date.now()}`;
        await createProduct(page, { name: product, sku: `SKU-AL-${Date.now()}`, price: 10, stock: 6, threshold: 5 });
        await recordSale(page, product, 1);
        runQueue();

        await page.goto('/dashboard');

        await expect(page.locator('#lowStockAlerts .top-row')).toHaveCount(1);
        await expect(page.locator('#lowStockAlerts')).toContainText(product);
        await expect(page.locator('#lowStockAlerts')).toContainText('5 left');
        await expect(page.locator('#statLow')).toHaveText('1');
    });

    test('a sale that leaves stock above the threshold opens no alert', async ({ page }) => {
        const product = `Alert Fine ${Date.now()}`;
        await createProduct(page, { name: product, sku: `SKU-AF-${Date.now()}`, price: 10, stock: 20, threshold: 5 });
        await recordSale(page, product, 1);
        runQueue();

        await page.goto('/dashboard');

        await expect(page.locator('#lowStockAlerts').getByText('No low stock alerts.')).toBeVisible();
        await expect(page.locator('#statLow')).toHaveText('0');
    });

    test('an open dashboard picks up a new alert without a reload', async ({ page }) => {
        test.setTimeout(60000);

        const product = `Alert Live ${Date.now()}`;
        await createProduct(page, { name: product, sku: `SKU-LV-${Date.now()}`, price: 10, stock: 6, threshold: 5 });

        await page.goto('/dashboard');
        await expect(page.locator('#lowStockAlerts').getByText('No low stock alerts.')).toBeVisible();

        const other = await page.context().newPage();
        await recordSale(other, product, 1);
        await other.close();
        await page.bringToFront();
        runQueue();

        // The dashboard polls every 10 seconds; no reload here.
        await expect(page.locator('#lowStockAlerts')).toContainText(product, { timeout: 20000 });
        await expect(page.locator('#statLow')).toHaveText('1');
    });

    test('restocking above the threshold resolves the alert', async ({ page }) => {
        const product = `Alert Restock ${Date.now()}`;
        const sku = `SKU-AR-${Date.now()}`;
        await createProduct(page, { name: product, sku, price: 10, stock: 6, threshold: 5 });
        await recordSale(page, product, 1);
        runQueue();

        await page.goto('/dashboard');
        await expect(page.locator('#lowStockAlerts')).toContainText(product);

        await page.goto('/products/low-stock');
        const row = page.locator('tr', { hasText: sku });
        await row.locator('input[name="quantity"]').fill('10');
        await row.getByRole('button', { name: 'Restock' }).click();
        await expect(page.getByText('Stock updated.')).toBeVisible();
        runQueue();

        await page.goto('/dashboard');
        await expect(page.locator('#lowStockAlerts').getByText('No low stock alerts.')).toBeVisible();
        await expect(page.locator('#statLow')).toHaveText('0');
    });

    test('voiding the sale that caused the alert resolves it', async ({ page }) => {
        const product = `Alert Void ${Date.now()}`;
        await createProduct(page, { name: product, sku: `SKU-AV-${Date.now()}`, price: 10, stock: 6, threshold: 5 });
        await recordSale(page, product, 1);
        runQueue();

        await page.goto('/dashboard');
        await expect(page.locator('#lowStockAlerts')).toContainText(product);

        await voidSale(page, product);
        runQueue();

        await page.goto('/dashboard');
        await expect(page.locator('#lowStockAlerts').getByText('No low stock alerts.')).toBeVisible();
    });

    test('adding a product at or below its threshold opens an alert', async ({ page }) => {
        const product = `Alert New ${Date.now()}`;
        await createProduct(page, { name: product, sku: `SKU-AN-${Date.now()}`, price: 10, stock: 2, threshold: 5 });
        runQueue();

        await page.goto('/dashboard');

        await expect(page.locator('#lowStockAlerts')).toContainText(product);
        await expect(page.locator('#lowStockAlerts')).toContainText('2 left');
    });

    test('editing stock above the threshold resolves the alert', async ({ page }) => {
        const product = `Alert Edit ${Date.now()}`;
        const sku = `SKU-AE-${Date.now()}`;
        await createProduct(page, { name: product, sku, price: 10, stock: 2, threshold: 5 });
        runQueue();

        await page.goto('/dashboard');
        await expect(page.locator('#lowStockAlerts')).toContainText(product);

        await page.goto('/products');
        const editHref = await page
            .locator('tr', { hasText: sku })
            .getByRole('link', { name: 'Edit' })
            .getAttribute('href');
        await page.goto(editHref);
        await page.getByLabel('Stock Quantity').fill('20');
        await page.getByRole('button', { name: 'Update Product' }).click();
        await expect(page.getByText('Product updated.')).toBeVisible();
        runQueue();

        await page.goto('/dashboard');
        await expect(page.locator('#lowStockAlerts').getByText('No low stock alerts.')).toBeVisible();
    });
});

function runQueue() {
    execSync('docker compose exec -T app php artisan queue:work --stop-when-empty');
}

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
