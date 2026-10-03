import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';

test.describe('Utang (credit) tracking', () => {
    test.beforeEach(async ({ page }) => {
        execSync('docker compose exec -T app php artisan test:reset-data');
        await login(page);
    });

    test('shows empty state when there are no customers', async ({ page }) => {
        await page.goto('/customers');
        await expect(page.getByText('No customers yet.')).toBeVisible();
    });

    test('can add a customer', async ({ page }) => {
        const name = `Customer ${Date.now()}`;

        await page.goto('/customers');
        await page.getByPlaceholder('Customer name').fill(name);
        await page.getByPlaceholder('Phone (optional)').fill('09171234567');
        await page.getByRole('button', { name: 'Add Customer' }).click();

        await expect(page.getByText('Customer added.')).toBeVisible();
        const row = page.locator('tr', { hasText: name });
        await expect(row).toBeVisible();
        await expect(row.getByRole('cell', { name: '09171234567', exact: true })).toBeVisible();
        await expect(row.getByRole('cell', { name: '₱0.00', exact: true })).toBeVisible();
    });

    test('a credit sale adds to the customer balance', async ({ page }) => {
        const customer = `Customer ${Date.now()}`;
        const product = `Credit Item ${Date.now()}`;
        await createCustomer(page, customer);
        await createProduct(page, { name: product, sku: `SKU-CR-${Date.now()}`, price: 50, stock: 10 });

        await recordSale(page, product, 2, customer);

        await expectListBalance(page, customer, '₱100.00');

        await page.locator('tr', { hasText: customer }).getByRole('link', { name: 'View' }).click();
        await expect(page).toHaveURL(/\/customers\/\d+$/);
        await expect(page.getByText('Balance: ₱100.00')).toBeVisible();
        await expect(page.getByText(`${product} × 2`)).toBeVisible();
    });

    test('a credit sale without a customer is rejected', async ({ page }) => {
        const product = `No Customer Item ${Date.now()}`;
        await createProduct(page, { name: product, sku: `SKU-NC-${Date.now()}`, price: 20, stock: 5 });

        await page.goto('/transactions/create');
        const optionValue = await page
            .locator('#product_id option', { hasText: product })
            .getAttribute('value');
        await page.selectOption('#product_id', optionValue);
        await page.getByLabel('Quantity').fill('1');
        await page.getByLabel('Pay later (utang)').check();
        await page.getByRole('button', { name: 'Record Sale' }).click();

        await expect(page).toHaveURL('/transactions/create');
    });

    test('a cash sale does not change a customer balance', async ({ page }) => {
        const customer = `Customer ${Date.now()}`;
        const product = `Cash Item ${Date.now()}`;
        await createCustomer(page, customer);
        await createProduct(page, { name: product, sku: `SKU-CASH-${Date.now()}`, price: 30, stock: 10 });

        await recordSale(page, product, 1);

        await expectListBalance(page, customer, '₱0.00');
    });

    test('a partial payment reduces the balance', async ({ page }) => {
        const customer = `Customer ${Date.now()}`;
        const product = `Partial Item ${Date.now()}`;
        await createCustomer(page, customer);
        await createProduct(page, { name: product, sku: `SKU-PART-${Date.now()}`, price: 50, stock: 10 });
        await recordSale(page, product, 2, customer);

        await openCustomer(page, customer);
        await page.getByPlaceholder('Amount (₱)').fill('40');
        await page.getByPlaceholder('Note (optional)').fill('First payment');
        await page.getByRole('button', { name: 'Record Payment' }).click();

        await expect(page.getByText('Payment recorded.')).toBeVisible();
        await expect(page.getByText('Balance: ₱60.00')).toBeVisible();
        await expect(page.getByRole('cell', { name: '₱40.00', exact: true })).toBeVisible();
        await expect(page.getByRole('cell', { name: 'First payment', exact: true })).toBeVisible();
    });

    test('paying the full balance clears it', async ({ page }) => {
        const customer = `Customer ${Date.now()}`;
        const product = `Full Pay Item ${Date.now()}`;
        await createCustomer(page, customer);
        await createProduct(page, { name: product, sku: `SKU-FULL-${Date.now()}`, price: 25, stock: 10 });
        await recordSale(page, product, 2, customer);

        await openCustomer(page, customer);
        await page.getByPlaceholder('Amount (₱)').fill('50');
        await page.getByRole('button', { name: 'Record Payment' }).click();

        await expect(page.getByText('Payment recorded.')).toBeVisible();
        await expect(page.getByText('Balance: ₱0.00')).toBeVisible();
    });

    test('rejects a payment larger than the balance', async ({ page }) => {
        const customer = `Customer ${Date.now()}`;
        const product = `Overpay Item ${Date.now()}`;
        await createCustomer(page, customer);
        await createProduct(page, { name: product, sku: `SKU-OVER-${Date.now()}`, price: 50, stock: 10 });
        await recordSale(page, product, 2, customer);

        await openCustomer(page, customer);
        await page.getByPlaceholder('Amount (₱)').fill('150');
        await page.getByRole('button', { name: 'Record Payment' }).click();

        await expect(page.getByText('Payment exceeds the balance of ₱100.00.')).toBeVisible();
        await expect(page.getByText('Balance: ₱100.00')).toBeVisible();
        await expect(page.getByText('No payments yet.')).toBeVisible();
    });

    test('voiding a credit sale removes it from the balance', async ({ page }) => {
        const customer = `Customer ${Date.now()}`;
        const product = `Void Credit Item ${Date.now()}`;
        await createCustomer(page, customer);
        await createProduct(page, { name: product, sku: `SKU-VC-${Date.now()}`, price: 40, stock: 10 });
        await recordSale(page, product, 2, customer);
        await expectListBalance(page, customer, '₱80.00');

        await page.goto('/transactions');
        const row = page.locator('tr', { hasText: product });
        page.once('dialog', dialog => dialog.accept());
        await row.getByRole('button', { name: 'Void' }).click();
        await expect(page.getByText('Transaction voided.')).toBeVisible();

        await expectListBalance(page, customer, '₱0.00');

        await openCustomer(page, customer);
        await expect(page.getByText('Balance: ₱0.00')).toBeVisible();
        await expect(page.locator('.badge-voided')).toBeVisible();
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

async function openCustomer(page, name) {
    await page.goto('/customers');
    await page.locator('tr', { hasText: name }).getByRole('link', { name: 'View' }).click();
    await expect(page).toHaveURL(/\/customers\/\d+$/);
}

async function expectListBalance(page, name, amount) {
    await page.goto('/customers');
    const row = page.locator('tr', { hasText: name });
    await expect(row.getByRole('cell', { name: amount, exact: true })).toBeVisible();
}
