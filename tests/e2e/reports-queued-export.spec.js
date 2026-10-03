import { test, expect } from '../fixtures.js';
import { execSync } from '../support/exec.js';
import fs from 'fs';

test.describe('Queued sales export', () => {
    test.beforeEach(async ({ page }) => {
        execSync('docker compose exec -T app php artisan test:reset-data');
        await login(page);
    });

    test('queueing an export goes from Pending to Ready and the download has the data', async ({ page }) => {
        test.setTimeout(60000);

        const name = `Queued Export ${Date.now()}`;
        await createProduct(page, { name, sku: `SKU-QE-${Date.now()}`, price: 50, cost: 30, stock: 20 });
        await recordSale(page, name, 3);

        await page.goto('/reports/sales');
        await page.locator('#queueExport').click();

        await expect(page.getByText('Export queued.')).toBeVisible();
        await expect(page.locator('#exportList .export-status').first()).toHaveText('Pending');

        runQueue();

        // The page polls every 3 seconds while an export is pending; no reload here.
        await expect(page.locator('#exportList .export-status').first()).toHaveText('Ready', { timeout: 15000 });

        const [download] = await Promise.all([
            page.waitForEvent('download'),
            page.locator('#exportList .export-download').first().click(),
        ]);

        expect(download.suggestedFilename()).toMatch(/^sales-report-\d{4}-\d{2}-\d{2}-to-\d{4}-\d{2}-\d{2}\.csv$/);
        const text = fs.readFileSync(await download.path(), 'utf8').replace(/^\uFEFF/, '');
        expect(text.split('\n')).toContain(`"${name}",3,150.00,90.00,60.00`);
    });

    test('a range with no sales still produces a header-only file', async ({ page }) => {
        test.setTimeout(60000);

        await page.goto('/reports/sales?from=2020-01-01&to=2020-01-31');
        await page.locator('#queueExport').click();
        await expect(page.getByText('Export queued.')).toBeVisible();

        runQueue();

        await expect(page.locator('#exportList .export-status').first()).toHaveText('Ready', { timeout: 15000 });

        const [download] = await Promise.all([
            page.waitForEvent('download'),
            page.locator('#exportList .export-download').first().click(),
        ]);

        expect(download.suggestedFilename()).toBe('sales-report-2020-01-01-to-2020-01-31.csv');
        const text = fs.readFileSync(await download.path(), 'utf8').replace(/^\uFEFF/, '');
        expect(text.split('\n').filter(line => line.length > 0)).toEqual(['Product,"Units Sold",Revenue,Cost,Profit']);
    });
});

// Runs as www-data like the real worker, so the web process can read the file it writes.
function runQueue() {
    execSync('docker compose exec -T app su -s /bin/sh www-data -c "php artisan queue:work --stop-when-empty"');
}

async function login(page) {
    await page.goto('/login');
    await page.getByLabel('Email').fill(process.env.TEST_USER_EMAIL);
    await page.getByLabel('Password').fill(process.env.TEST_USER_PASSWORD);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL('/dashboard');
}

async function createProduct(page, { name, sku, price, cost, stock, threshold = 5 }) {
    await page.goto('/products/create');
    await page.getByLabel('Name').fill(name);
    await page.getByLabel('SKU').fill(sku);
    await page.getByLabel('Price (₱)').fill(price.toFixed(2));
    if (cost !== undefined) {
        await page.getByLabel('Cost (₱)').fill(cost.toFixed(2));
    }
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
