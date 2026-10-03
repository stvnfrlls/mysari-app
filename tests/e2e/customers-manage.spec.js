import { test, expect } from '../fixtures.js';
import { execSync } from '../support/exec.js';

const CASHIER_EMAIL = 'cashier@example.com';
const REFUSED = 'This customer has sales or payments on record and cannot be deleted.';

test.describe('Customer edit and delete', () => {
    test.beforeEach(() => {
        execSync('docker compose exec -T app php artisan test:reset-data');
    });

    test('owner can edit a customer name and phone', async ({ page }) => {
        const name = `Edit Me ${Date.now()}`;
        const newName = `Edited ${Date.now()}`;
        await login(page, process.env.TEST_USER_EMAIL);
        await createCustomer(page, name);
        await openCustomer(page, name);

        await page.getByLabel('Customer name').fill(newName);
        await page.getByLabel('Customer phone').fill('09170000000');
        await page.getByRole('button', { name: 'Save Details' }).click();

        await expect(page.getByText('Customer updated.')).toBeVisible();
        await expect(page.getByRole('heading', { name: newName, exact: true })).toBeVisible();

        await page.goto('/customers');
        const row = page.locator('tr', { hasText: newName });
        await expect(row.getByRole('cell', { name: '09170000000', exact: true })).toBeVisible();
        await expect(page.locator('tr', { hasText: name })).toHaveCount(0);
    });

    test('editing a customer keeps their balance', async ({ page }) => {
        const name = `Balance Keep ${Date.now()}`;
        const newName = `Balance Renamed ${Date.now()}`;
        const product = `Keep Item ${Date.now()}`;
        await login(page, process.env.TEST_USER_EMAIL);
        await createCustomer(page, name);
        await createProduct(page, { name: product, sku: `SKU-KB-${Date.now()}`, price: 50, stock: 10 });
        await recordSale(page, product, 2, name);

        await openCustomer(page, name);
        await page.getByLabel('Customer name').fill(newName);
        await page.getByRole('button', { name: 'Save Details' }).click();

        await expect(page.getByText('Customer updated.')).toBeVisible();
        await expect(page.getByText('Balance: ₱100.00')).toBeVisible();
    });

    test('owner can delete a customer with no history', async ({ page }) => {
        const name = `Delete Me ${Date.now()}`;
        await login(page, process.env.TEST_USER_EMAIL);
        await createCustomer(page, name);
        await openCustomer(page, name);

        page.once('dialog', dialog => dialog.accept());
        await page.getByRole('button', { name: 'Delete Customer' }).click();

        await expect(page).toHaveURL('/customers');
        await expect(page.getByText('Customer deleted.')).toBeVisible();
        await expect(page.locator('tr', { hasText: name })).toHaveCount(0);
    });

    test('a customer with a sale cannot be deleted', async ({ page }) => {
        const name = `Has Sale ${Date.now()}`;
        const product = `Sale Item ${Date.now()}`;
        await login(page, process.env.TEST_USER_EMAIL);
        await createCustomer(page, name);
        await createProduct(page, { name: product, sku: `SKU-HS-${Date.now()}`, price: 20, stock: 10 });
        await recordSale(page, product, 1, name);
        await openCustomer(page, name);

        page.once('dialog', dialog => dialog.accept());
        await page.getByRole('button', { name: 'Delete Customer' }).click();

        await expect(page.getByText(REFUSED)).toBeVisible();
        await expect(page).toHaveURL(/\/customers\/\d+$/);

        await page.goto('/customers');
        await expect(page.locator('tr', { hasText: name })).toHaveCount(1);
    });

    test('a customer whose only sale was voided still cannot be deleted', async ({ page }) => {
        const name = `Voided Sale ${Date.now()}`;
        const product = `Voided Item ${Date.now()}`;
        await login(page, process.env.TEST_USER_EMAIL);
        await createCustomer(page, name);
        await createProduct(page, { name: product, sku: `SKU-VS-${Date.now()}`, price: 20, stock: 10 });
        await recordSale(page, product, 1, name);

        await page.goto('/transactions');
        page.once('dialog', dialog => dialog.accept());
        await page.locator('tr', { hasText: product }).getByRole('button', { name: 'Void' }).click();
        await expect(page.getByText('Transaction voided.')).toBeVisible();

        await openCustomer(page, name);
        page.once('dialog', dialog => dialog.accept());
        await page.getByRole('button', { name: 'Delete Customer' }).click();

        await expect(page.getByText(REFUSED)).toBeVisible();
    });

    test('a cashier can edit a customer but has no Delete button', async ({ page }) => {
        const name = `Cashier Edit ${Date.now()}`;
        const newName = `Cashier Renamed ${Date.now()}`;
        await login(page, CASHIER_EMAIL);
        await createCustomer(page, name);
        await openCustomer(page, name);

        await expect(page.getByRole('button', { name: 'Delete Customer' })).toHaveCount(0);

        await page.getByLabel('Customer name').fill(newName);
        await page.getByRole('button', { name: 'Save Details' }).click();
        await expect(page.getByText('Customer updated.')).toBeVisible();
    });

    test('a cashier gets 403 when deleting a customer directly', async ({ page }) => {
        const name = `Cashier Direct ${Date.now()}`;
        await login(page, CASHIER_EMAIL);
        await createCustomer(page, name);
        await openCustomer(page, name);

        const id = page.url().match(/customers\/(\d+)$/)[1];
        const token = await page.locator('input[name="_token"]').first().inputValue();

        const res = await page.request.post(`/customers/${id}`, {
            form: { _token: token, _method: 'DELETE' },
        });
        expect(res.status()).toBe(403);

        await page.goto('/customers');
        await expect(page.locator('tr', { hasText: name })).toHaveCount(1);
    });
});

async function login(page, email) {
    await page.goto('/login');
    await page.getByLabel('Email').fill(email);
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

async function recordSale(page, productName, qty, customerName) {
    await page.goto('/transactions/create');
    const optionValue = await page
        .locator('#product_id option', { hasText: productName })
        .getAttribute('value');
    await page.selectOption('#product_id', optionValue);
    await page.getByLabel('Quantity').fill(String(qty));
    await page.getByLabel('Pay later (utang)').check();
    await page.selectOption('#customer_id', { label: customerName });
    await page.getByRole('button', { name: 'Record Sale' }).click();
    await expect(page).toHaveURL('/transactions');
}

async function openCustomer(page, name) {
    await page.goto('/customers');
    await page.locator('tr', { hasText: name }).getByRole('link', { name: 'View' }).click();
    await expect(page).toHaveURL(/\/customers\/\d+$/);
}
