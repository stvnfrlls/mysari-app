import { test, expect } from '../fixtures.js';
import { execSync } from '../support/exec.js';

test.describe('Dashboard today summary', () => {
    test.beforeEach(async ({ page }) => {
        execSync('docker compose exec -T app php artisan test:reset-data');
        await login(page);
    });

    test('shows zeros and an empty top sellers panel when nothing was sold', async ({ page }) => {
        await page.goto('/dashboard');

        await expect(page.locator('#todayCash .summary-value')).toHaveText('₱0.00');
        await expect(page.locator('#todayCredit .summary-value')).toHaveText('₱0.00');
        await expect(page.locator('#utangOutstanding .summary-value')).toHaveText('₱0.00');
        await expect(page.locator('#topProducts').getByText('No sales yet today.')).toBeVisible();
    });

    test('a cash sale counts as cash and not as credit or utang', async ({ page }) => {
        const product = `Cash Dash ${Date.now()}`;
        await createProduct(page, { name: product, sku: `SKU-DC-${Date.now()}`, price: 50, stock: 20 });
        await recordSale(page, product, 2);

        await page.goto('/dashboard');

        await expect(page.locator('#todayCash .summary-value')).toHaveText('₱100.00');
        await expect(page.locator('#todayCredit .summary-value')).toHaveText('₱0.00');
        await expect(page.locator('#utangOutstanding .summary-value')).toHaveText('₱0.00');
    });

    test('a credit sale counts as credit and adds to utang outstanding', async ({ page }) => {
        const customer = `Dash Customer ${Date.now()}`;
        const product = `Credit Dash ${Date.now()}`;
        await createCustomer(page, customer);
        await createProduct(page, { name: product, sku: `SKU-DK-${Date.now()}`, price: 50, stock: 20 });
        await recordSale(page, product, 1, customer);

        await page.goto('/dashboard');

        await expect(page.locator('#todayCredit .summary-value')).toHaveText('₱50.00');
        await expect(page.locator('#utangOutstanding .summary-value')).toHaveText('₱50.00');
        await expect(page.locator('#todayCash .summary-value')).toHaveText('₱0.00');
    });

    test('a payment lowers utang outstanding but not the credit sales of the day', async ({ page }) => {
        const customer = `Dash Payer ${Date.now()}`;
        const product = `Payment Dash ${Date.now()}`;
        await createCustomer(page, customer);
        await createProduct(page, { name: product, sku: `SKU-DP-${Date.now()}`, price: 50, stock: 20 });
        await recordSale(page, product, 2, customer);

        await page.goto('/customers');
        await page.locator('tr', { hasText: customer }).getByRole('link', { name: 'View' }).click();
        await page.getByPlaceholder('Amount (₱)').fill('40');
        await page.getByRole('button', { name: 'Record Payment' }).click();
        await expect(page.getByText('Payment recorded.')).toBeVisible();

        await page.goto('/dashboard');

        await expect(page.locator('#todayCredit .summary-value')).toHaveText('₱100.00');
        await expect(page.locator('#utangOutstanding .summary-value')).toHaveText('₱60.00');
    });

    test('top sellers are ranked by units sold', async ({ page }) => {
        const popular = `Popular ${Date.now()}`;
        const quiet = `Quiet ${Date.now()}`;
        await createProduct(page, { name: popular, sku: `SKU-TP-${Date.now()}`, price: 10, stock: 20 });
        await createProduct(page, { name: quiet, sku: `SKU-TQ-${Date.now()}`, price: 10, stock: 20 });
        await recordSale(page, quiet, 1);
        await recordSale(page, popular, 3);

        await page.goto('/dashboard');

        const rows = page.locator('#topProducts .top-row');
        await expect(rows).toHaveCount(2);
        await expect(rows.nth(0)).toContainText(popular);
        await expect(rows.nth(0)).toContainText('3 sold');
        await expect(rows.nth(1)).toContainText(quiet);
        await expect(rows.nth(1)).toContainText('1 sold');
    });

    test('a voided sale is removed from the summary and top sellers', async ({ page }) => {
        const product = `Void Dash ${Date.now()}`;
        await createProduct(page, { name: product, sku: `SKU-DV-${Date.now()}`, price: 40, stock: 20 });
        await recordSale(page, product, 2);

        await page.goto('/dashboard');
        await expect(page.locator('#todayCash .summary-value')).toHaveText('₱80.00');
        await expect(page.locator('#topProducts')).toContainText(product);

        await voidSale(page, product);

        await page.goto('/dashboard');
        await expect(page.locator('#todayCash .summary-value')).toHaveText('₱0.00');
        await expect(page.locator('#topProducts')).not.toContainText(product);
        await expect(page.locator('#topProducts').getByText('No sales yet today.')).toBeVisible();
    });
});

async function login(page) {
    await page.goto('/login');
    await page.getByLabel('Email').fill(process.env.TEST_USER_EMAIL);
    await page.getByLabel('Password').fill(process.env.TEST_USER_PASSWORD);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL('/dashboard');
}

async function createCustomer(page, name) {
    await page.goto('/customers');
    await page.getByPlaceholder('Customer name').fill(name);
    await page.getByRole('button', { name: 'Add Customer' }).click();
    await expect(page.getByText('Customer added.')).toBeVisible();
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

async function recordSale(page, productName, qty, customerName = null) {
    await page.goto('/transactions/create');
    const optionValue = await page
        .locator('#product_id option', { hasText: productName })
        .getAttribute('value');
    await page.selectOption('#product_id', optionValue);
    await page.getByLabel('Quantity').fill(String(qty));

    if (customerName) {
        await page.getByLabel('Pay later (utang)').check();
        await page.selectOption('#customer_id', { label: customerName });
    }

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
