import { test, expect } from '../fixtures.js';
import { execSync } from '../support/exec.js';

const CASHIER_EMAIL = 'cashier@example.com';

test.describe('Payment audit and void', () => {
    test.beforeEach(() => {
        execSync('docker compose exec -T app php artisan test:reset-data');
    });

    test('a payment shows who recorded it', async ({ page }) => {
        const { customer } = await setupCreditSale(page);

        await openCustomer(page, customer);
        await page.getByPlaceholder('Amount (₱)').fill('30');
        await page.getByRole('button', { name: 'Record Payment' }).click();
        await expect(page.getByText('Payment recorded.')).toBeVisible();

        const row = page.locator('tr', { hasText: '₱30.00' });
        await expect(row.getByRole('cell', { name: 'Test User' })).toBeVisible();
    });

    test('an owner can void a payment and the balance and utang come back', async ({ page }) => {
        const { customer } = await setupCreditSale(page);

        await openCustomer(page, customer);
        await page.getByPlaceholder('Amount (₱)').fill('30');
        await page.getByRole('button', { name: 'Record Payment' }).click();
        await expect(page.getByText('Balance: ₱70.00')).toBeVisible();

        const row = page.locator('tr', { hasText: '₱30.00' });
        await row.getByPlaceholder('Reason (optional)').fill('typo');
        page.once('dialog', dialog => dialog.accept());
        await row.getByRole('button', { name: 'Void' }).click();

        await expect(page.getByText('Payment voided.')).toBeVisible();
        await expect(page.getByText('Balance: ₱100.00')).toBeVisible();
        await expect(page.locator('tr', { hasText: '₱30.00' }).locator('.badge-voided')).toBeVisible();

        await expectListBalance(page, customer, '₱100.00');

        await page.goto('/dashboard');
        await expect(page.locator('#utangOutstanding')).toContainText('100.00');
    });

    test('a voided payment cannot be voided twice and has no Void button', async ({ page }) => {
        const { customer } = await setupCreditSale(page);

        await openCustomer(page, customer);
        await page.getByPlaceholder('Amount (₱)').fill('30');
        await page.getByRole('button', { name: 'Record Payment' }).click();
        await expect(page.getByText('Balance: ₱70.00')).toBeVisible();

        const token = await page.locator('input[name="_token"]').first().inputValue();
        const row = page.locator('tr', { hasText: '₱30.00' });
        page.once('dialog', dialog => dialog.accept());
        await row.getByRole('button', { name: 'Void' }).click();
        await expect(page.getByText('Payment voided.')).toBeVisible();

        await expect(page.locator('tr', { hasText: '₱30.00' }).getByRole('button', { name: 'Void' })).toHaveCount(0);

        // reset-data truncates, so the first payment of the test has id 1
        const again = await page.request.post('/payments/1/void', {
            form: { _token: token, _method: 'PATCH' },
        });
        expect(again.ok()).toBeTruthy();
        await page.reload();
        await expect(page.getByText('Balance: ₱100.00')).toBeVisible();
    });

    test('a cashier gets 403 on the payment void route and sees no Void button', async ({ page }) => {
        const { customer } = await setupCreditSale(page);

        await openCustomer(page, customer);
        await page.getByPlaceholder('Amount (₱)').fill('30');
        await page.getByRole('button', { name: 'Record Payment' }).click();
        await expect(page.getByText('Balance: ₱70.00')).toBeVisible();

        await page.getByRole('button', { name: 'Log Out' }).click();
        await expect(page).toHaveURL('/');
        await login(page, CASHIER_EMAIL);

        await openCustomer(page, customer);
        await expect(page.locator('tr', { hasText: '₱30.00' }).getByRole('button', { name: 'Void' })).toHaveCount(0);

        const token = await page.locator('input[name="_token"]').first().inputValue();
        const res = await page.request.post('/payments/1/void', {
            form: { _token: token, _method: 'PATCH' },
        });
        expect(res.status()).toBe(403);

        await page.reload();
        await expect(page.getByText('Balance: ₱70.00')).toBeVisible();
    });
});

async function setupCreditSale(page) {
    const customer = `Pay Customer ${Date.now()}`;
    const product = `Pay Item ${Date.now()}`;
    await login(page, process.env.TEST_USER_EMAIL);
    await createCustomer(page, customer);
    await createProduct(page, { name: product, sku: `SKU-PAY-${Date.now()}`, price: 50, stock: 10 });
    await recordSale(page, product, 2, customer);
    return { customer, product };
}

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

async function expectListBalance(page, name, amount) {
    await page.goto('/customers');
    const row = page.locator('tr', { hasText: name });
    await expect(row.getByRole('cell', { name: amount, exact: true })).toBeVisible();
}
