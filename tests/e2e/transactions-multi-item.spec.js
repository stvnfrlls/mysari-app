import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';

test.describe('Multi-item sales', () => {
    test.beforeEach(async ({ page }) => {
        execSync('docker compose exec -T app php artisan test:reset-data');
        await login(page);
    });

    test('can add and remove item rows', async ({ page }) => {
        await page.goto('/transactions/create');
        const rows = page.locator('.item-row');

        await expect(rows).toHaveCount(1);
        await expect(page.getByRole('button', { name: 'Remove item' })).toHaveCount(0);

        await page.getByRole('button', { name: '+ Add item' }).click();
        await page.getByRole('button', { name: '+ Add item' }).click();
        await expect(rows).toHaveCount(3);

        await page.getByRole('button', { name: 'Remove item' }).first().click();
        await expect(rows).toHaveCount(2);
    });

    test('running total sums every row', async ({ page }) => {
        const ts = Date.now();
        const a = `Multi A ${ts}`;
        const b = `Multi B ${ts}`;
        await createProduct(page, { name: a, sku: `SKU-MA-${ts}`, price: 50, stock: 10 });
        await createProduct(page, { name: b, sku: `SKU-MB-${ts}`, price: 20, stock: 10 });

        await page.goto('/transactions/create');
        await fillItem(page, 0, a, 2);
        await page.getByRole('button', { name: '+ Add item' }).click();
        await fillItem(page, 1, b, 3);

        await expect(page.locator('#lineTotal')).toHaveText('Total: ₱160.00');
    });

    test('a multi-item sale reduces every stock and shows as one transaction', async ({ page }) => {
        const ts = Date.now();
        const a = `Multi A ${ts}`;
        const b = `Multi B ${ts}`;
        await createProduct(page, { name: a, sku: `SKU-MA-${ts}`, price: 50, stock: 10 });
        await createProduct(page, { name: b, sku: `SKU-MB-${ts}`, price: 20, stock: 8 });

        const stockBefore = await dashboardStat(page, 'Items in Stock');
        const txBefore = await dashboardStat(page, 'Transactions Today');

        await recordSale(page, [{ name: a, qty: 2 }, { name: b, qty: 3 }]);

        const rows = page.locator('tbody tr');
        await expect(rows).toHaveCount(1);
        await expect(rows).toContainText(`${a} × 2`);
        await expect(rows).toContainText(`${b} × 3`);
        await expect(rows).toContainText('₱160.00');
        await expect(rows.getByRole('button', { name: 'Void' })).toHaveCount(1);

        expect(await dashboardStat(page, 'Items in Stock')).toBe(stockBefore - 5);
        expect(await dashboardStat(page, 'Transactions Today')).toBe(txBefore + 1);

        const activity = page.locator('.activity-row');
        await expect(activity).toHaveCount(1);
        await expect(activity).toContainText(a);
        await expect(activity).toContainText(b);
    });

    test('the same product in two rows is merged into one line', async ({ page }) => {
        const name = `Merge Item ${Date.now()}`;
        await createProduct(page, { name, sku: `SKU-MERGE-${Date.now()}`, price: 10, stock: 10 });
        const stockBefore = await dashboardStat(page, 'Items in Stock');

        await recordSale(page, [{ name, qty: 2 }, { name, qty: 3 }]);

        const rows = page.locator('tbody tr');
        await expect(rows).toHaveCount(1);
        await expect(rows).toContainText(`${name} × 5`);
        await expect(rows).toContainText('₱50.00');

        expect(await dashboardStat(page, 'Items in Stock')).toBe(stockBefore - 5);
    });

    test('rejects rows whose combined quantity exceeds stock', async ({ page }) => {
        const name = `Combined Item ${Date.now()}`;
        await createProduct(page, { name, sku: `SKU-COMB-${Date.now()}`, price: 10, stock: 4 });
        const stockBefore = await dashboardStat(page, 'Items in Stock');

        await openSaleForm(page, [{ name, qty: 3 }, { name, qty: 3 }]);
        await page.getByRole('button', { name: 'Record Sale' }).click();

        await expect(page).toHaveURL('/transactions/create');
        await expect(page.getByText('Not enough stock. Only 4 available.')).toBeVisible();

        expect(await dashboardStat(page, 'Items in Stock')).toBe(stockBefore);
    });

    test('names the short product and saves nothing when one item lacks stock', async ({ page }) => {
        const ts = Date.now();
        const a = `Short A ${ts}`;
        const b = `Short B ${ts}`;
        await createProduct(page, { name: a, sku: `SKU-SA-${ts}`, price: 10, stock: 10 });
        await createProduct(page, { name: b, sku: `SKU-SB-${ts}`, price: 10, stock: 2 });
        const stockBefore = await dashboardStat(page, 'Items in Stock');

        await openSaleForm(page, [{ name: a, qty: 1 }, { name: b, qty: 5 }]);
        await page.getByRole('button', { name: 'Record Sale' }).click();

        await expect(page).toHaveURL('/transactions/create');
        await expect(page.getByText(`Not enough stock for ${b}. Only 2 available.`)).toBeVisible();

        expect(await dashboardStat(page, 'Items in Stock')).toBe(stockBefore);
        await page.goto('/transactions');
        await expect(page.getByText('No sales recorded yet.')).toBeVisible();
    });

    test('voiding a multi-item sale restores every stock', async ({ page }) => {
        const ts = Date.now();
        const a = `Void A ${ts}`;
        const b = `Void B ${ts}`;
        await createProduct(page, { name: a, sku: `SKU-VA-${ts}`, price: 30, stock: 10 });
        await createProduct(page, { name: b, sku: `SKU-VB-${ts}`, price: 15, stock: 10 });
        const stockBefore = await dashboardStat(page, 'Items in Stock');

        await recordSale(page, [{ name: a, qty: 2 }, { name: b, qty: 4 }]);
        expect(await dashboardStat(page, 'Items in Stock')).toBe(stockBefore - 6);

        await page.goto('/transactions');
        page.once('dialog', dialog => dialog.accept());
        await page.locator('tbody tr').getByRole('button', { name: 'Void' }).click();
        await expect(page.getByText('Transaction voided.')).toBeVisible();
        await expect(page.locator('.badge-voided')).toBeVisible();

        expect(await dashboardStat(page, 'Items in Stock')).toBe(stockBefore);
    });

    test('a multi-item credit sale adds the full total to the customer balance', async ({ page }) => {
        const ts = Date.now();
        const customer = `Customer ${ts}`;
        const a = `Credit A ${ts}`;
        const b = `Credit B ${ts}`;
        await createCustomer(page, customer);
        await createProduct(page, { name: a, sku: `SKU-CA-${ts}`, price: 50, stock: 10 });
        await createProduct(page, { name: b, sku: `SKU-CB-${ts}`, price: 20, stock: 10 });

        await openSaleForm(page, [{ name: a, qty: 2 }, { name: b, qty: 1 }]);
        await page.getByLabel('Pay later (utang)').check();
        await page.selectOption('#customer_id', { label: customer });
        await page.getByRole('button', { name: 'Record Sale' }).click();
        await expect(page).toHaveURL('/transactions');

        await page.goto('/customers');
        const row = page.locator('tr', { hasText: customer });
        await expect(row.getByRole('cell', { name: '₱120.00', exact: true })).toBeVisible();
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

async function createCustomer(page, name) {
    await page.goto('/customers');
    await page.getByPlaceholder('Customer name').fill(name);
    await page.getByRole('button', { name: 'Add Customer' }).click();
    await expect(page.getByText('Customer added.')).toBeVisible();
}

async function fillItem(page, index, productName, qty) {
    const row = page.locator('.item-row').nth(index);
    const value = await row
        .locator('.item-product option', { hasText: productName })
        .first()
        .getAttribute('value');
    await row.locator('.item-product').selectOption(value);
    await row.locator('.item-quantity').fill(String(qty));
}

async function openSaleForm(page, items) {
    await page.goto('/transactions/create');
    for (const [i, item] of items.entries()) {
        if (i > 0) {
            await page.getByRole('button', { name: '+ Add item' }).click();
        }
        await fillItem(page, i, item.name, item.qty);
    }
}

async function recordSale(page, items) {
    await openSaleForm(page, items);
    await page.getByRole('button', { name: 'Record Sale' }).click();
    await expect(page).toHaveURL('/transactions');
}

async function dashboardStat(page, label) {
    await page.goto('/dashboard');
    const text = await page
        .locator('.stat-card', { hasText: label })
        .locator('.stat-value')
        .innerText();
    return parseInt(text.replace(/,/g, ''), 10);
}
