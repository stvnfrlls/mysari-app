import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';

test.describe('Product cost and profit', () => {
    test.beforeEach(async ({ page }) => {
        execSync('docker compose exec -T app php artisan test:reset-data');
        await login(page);
    });

    test('saves a cost on a new product and shows it in the edit form', async ({ page }) => {
        const sku = `SKU-COST-${Date.now()}`;
        await createProduct(page, { name: `Cost Item ${Date.now()}`, sku, price: 50, cost: 30, stock: 10 });

        await openEdit(page, sku);
        await expect(page.getByLabel('Cost (₱)')).toHaveValue('30.00');
    });

    test('a product can be saved without a cost', async ({ page }) => {
        const sku = `SKU-NOCOST-${Date.now()}`;
        await createProduct(page, { name: `No Cost Item ${Date.now()}`, sku, price: 50, stock: 10 });

        await openEdit(page, sku);
        await expect(page.getByLabel('Cost (₱)')).toHaveValue('');
    });

    test('editing a product can add a cost', async ({ page }) => {
        const sku = `SKU-ADDCOST-${Date.now()}`;
        await createProduct(page, { name: `Add Cost Item ${Date.now()}`, sku, price: 50, stock: 10 });

        await openEdit(page, sku);
        await page.getByLabel('Cost (₱)').fill('35.50');
        await page.getByRole('button', { name: 'Update Product' }).click();
        await expect(page.getByText('Product updated.')).toBeVisible();

        await openEdit(page, sku);
        await expect(page.getByLabel('Cost (₱)')).toHaveValue('35.50');
    });

    test('the report shows cost and profit for a costed sale', async ({ page }) => {
        const name = `Profit Item ${Date.now()}`;
        await createProduct(page, { name, sku: `SKU-PRF-${Date.now()}`, price: 50, cost: 30, stock: 10 });
        await recordSale(page, name, 2);

        await page.goto('/reports/sales');
        await expect(page.locator('#costCard')).toContainText('₱60.00');
        await expect(page.locator('#profitCard')).toContainText('₱40.00');
        await expect(page.locator('#costNote')).toHaveCount(0);

        const row = page.locator('tr', { hasText: name });
        await expect(row.getByRole('cell', { name: '₱100.00', exact: true })).toBeVisible();
        await expect(row.getByRole('cell', { name: '₱60.00', exact: true })).toBeVisible();
        await expect(row.getByRole('cell', { name: '₱40.00', exact: true })).toBeVisible();
    });

    test('a later cost change does not rewrite past sales', async ({ page }) => {
        const name = `Snapshot Item ${Date.now()}`;
        const sku = `SKU-SNAP-${Date.now()}`;
        await createProduct(page, { name, sku, price: 50, cost: 30, stock: 10 });
        await recordSale(page, name, 2);

        await openEdit(page, sku);
        await page.getByLabel('Cost (₱)').fill('45.00');
        await page.getByRole('button', { name: 'Update Product' }).click();
        await expect(page.getByText('Product updated.')).toBeVisible();

        await page.goto('/reports/sales');
        await expect(page.locator('#costCard')).toContainText('₱60.00');
        await expect(page.locator('#profitCard')).toContainText('₱40.00');
    });

    test('sales without a cost show dashes and a note instead of fake profit', async ({ page }) => {
        const name = `Uncosted Item ${Date.now()}`;
        await createProduct(page, { name, sku: `SKU-UNC-${Date.now()}`, price: 20, stock: 10 });
        await recordSale(page, name, 1);

        await page.goto('/reports/sales');
        await expect(page.locator('#costCard')).toContainText('—');
        await expect(page.locator('#profitCard')).toContainText('—');
        await expect(page.locator('#costNote')).toContainText('1 sale line without a cost is left out of cost and profit.');

        const row = page.locator('tr', { hasText: name });
        await expect(row.getByRole('cell', { name: '—', exact: true })).toHaveCount(2);
    });

    test('costed and uncosted sales are reported separately', async ({ page }) => {
        const ts = Date.now();
        const costed = `Mixed Costed ${ts}`;
        const uncosted = `Mixed Uncosted ${ts}`;
        await createProduct(page, { name: costed, sku: `SKU-MC-${ts}`, price: 50, cost: 30, stock: 10 });
        await createProduct(page, { name: uncosted, sku: `SKU-MU-${ts}`, price: 20, stock: 10 });
        await recordSale(page, costed, 2);
        await recordSale(page, uncosted, 1);

        await page.goto('/reports/sales');
        const revenueCard = page.locator('.table-panel', { hasText: 'Total Revenue' });
        await expect(revenueCard).toContainText('₱120.00');
        await expect(page.locator('#costCard')).toContainText('₱60.00');
        await expect(page.locator('#profitCard')).toContainText('₱40.00');
        await expect(page.locator('#costNote')).toContainText('1 sale line without a cost');

        const costedRow = page.locator('tr', { hasText: costed });
        await expect(costedRow.getByRole('cell', { name: '₱40.00', exact: true })).toBeVisible();
        const uncostedRow = page.locator('tr', { hasText: uncosted });
        await expect(uncostedRow.getByRole('cell', { name: '—', exact: true })).toHaveCount(2);
    });

    test('voiding a costed sale removes it from cost and profit', async ({ page }) => {
        const name = `Void Profit Item ${Date.now()}`;
        await createProduct(page, { name, sku: `SKU-VP-${Date.now()}`, price: 50, cost: 30, stock: 10 });
        await recordSale(page, name, 2);

        await page.goto('/transactions');
        page.once('dialog', dialog => dialog.accept());
        await page.locator('tr', { hasText: name }).getByRole('button', { name: 'Void' }).click();
        await expect(page.getByText('Transaction voided.')).toBeVisible();

        await page.goto('/reports/sales');
        await expect(page.locator('#costCard')).toContainText('—');
        await expect(page.locator('#profitCard')).toContainText('—');
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

async function createProduct(page, { name, sku, price, cost = null, stock, threshold = 5 }) {
    await page.goto('/products/create');
    await page.getByLabel('Name').fill(name);
    await page.getByLabel('SKU').fill(sku);
    await page.getByLabel('Price (₱)').fill(price.toFixed(2));
    if (cost !== null) {
        await page.getByLabel('Cost (₱)').fill(cost.toFixed(2));
    }
    await page.getByLabel('Stock Quantity').fill(String(stock));
    await page.getByLabel('Low Stock Threshold').fill(String(threshold));
    await page.getByRole('button', { name: 'Save Product' }).click();
    await expect(page).toHaveURL('/products');
}

async function openEdit(page, sku) {
    await page.goto('/products');
    await page.locator('tr', { hasText: sku }).getByRole('link', { name: 'Edit' }).click();
    await expect(page.getByRole('heading', { name: 'Edit Product' })).toBeVisible();
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
