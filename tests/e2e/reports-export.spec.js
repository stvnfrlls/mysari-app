import { test, expect } from '../fixtures.js';
import { execSync } from '../support/exec.js';
import fs from 'fs';

const HEADER = 'Product,"Units Sold",Revenue,Cost,Profit';

test.describe('Sales report CSV export', () => {
    test.beforeEach(async ({ page }) => {
        execSync('docker compose exec -T app php artisan test:reset-data');
        await login(page);
    });

    test('exports a header row and one row per product with cost and profit', async ({ page }) => {
        const name = `Export Item ${Date.now()}`;
        await createProduct(page, { name, sku: `SKU-EX-${Date.now()}`, price: 50, cost: 30, stock: 20 });
        await recordSale(page, name, 3);

        const lines = await exportLines(page);

        expect(lines[0]).toBe(HEADER);
        expect(lines).toContain(`"${name}",3,150.00,90.00,60.00`);
    });

    test('a product without a cost has empty cost and profit cells', async ({ page }) => {
        const name = `Export No Cost ${Date.now()}`;
        await createProduct(page, { name, sku: `SKU-EXN-${Date.now()}`, price: 50, stock: 20 });
        await recordSale(page, name, 2);

        const lines = await exportLines(page);

        expect(lines).toContain(`"${name}",2,100.00,,`);
    });

    test('a voided sale is left out of the export', async ({ page }) => {
        const name = `Export Voided ${Date.now()}`;
        await createProduct(page, { name, sku: `SKU-EXV-${Date.now()}`, price: 40, cost: 10, stock: 20 });
        await recordSale(page, name, 1);
        await voidSale(page, name);

        const lines = await exportLines(page);

        expect(lines).toEqual([HEADER]);
    });

    test('an empty period exports only the header row', async ({ page }) => {
        await page.goto('/reports/sales?from=2020-01-01&to=2020-01-31');

        const lines = await exportLines(page);

        expect(lines).toEqual([HEADER]);
    });

    test('the file name and contents follow the selected date range', async ({ page }) => {
        const name = `Export Range ${Date.now()}`;
        await createProduct(page, { name, sku: `SKU-EXR-${Date.now()}`, price: 25, stock: 10 });
        await recordSale(page, name, 1);

        await page.goto('/reports/sales?from=2020-01-01&to=2020-01-31');
        const [download] = await Promise.all([
            page.waitForEvent('download'),
            page.locator('#exportCsv').click(),
        ]);

        expect(download.suggestedFilename()).toBe('sales-report-2020-01-01-to-2020-01-31.csv');
        const text = fs.readFileSync(await download.path(), 'utf8');
        expect(text).not.toContain(name);
    });

    test('a product name that looks like a formula is neutralised', async ({ page }) => {
        const name = '=SUM(1+1)';
        await createProduct(page, { name, sku: `SKU-EXF-${Date.now()}`, price: 50, stock: 20 });
        await recordSale(page, name, 2);

        const lines = await exportLines(page);

        expect(lines).toContain(`'=SUM(1+1),2,100.00,,`);
    });
});

async function exportLines(page) {
    await page.goto('/reports/sales');
    const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.locator('#exportCsv').click(),
    ]);
    const text = fs.readFileSync(await download.path(), 'utf8').replace(/^\uFEFF/, '');
    return text.split('\n').filter(line => line.length > 0);
}

async function login(page) {
    await page.goto('/login');
    await page.getByLabel('Email').fill(process.env.TEST_USER_EMAIL);
    await page.getByLabel('Password').fill(process.env.TEST_USER_PASSWORD);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL('/dashboard');
}

async function createProduct(page, { name, sku, price, cost, stock, threshold = '5' }) {
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

async function voidSale(page, productName) {
    await page.goto('/transactions');
    const row = page.locator('tr', { hasText: productName });
    page.once('dialog', dialog => dialog.accept());
    await row.getByRole('button', { name: 'Void' }).click();
    await expect(page.getByText('Transaction voided.')).toBeVisible();
}
