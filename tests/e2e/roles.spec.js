import { test, expect } from '../fixtures.js';
import { execSync } from '../support/exec.js';

const OWNER_EMAIL = 'testuser@example.com';
const CASHIER_EMAIL = 'cashier@example.com';

test.describe('Owner and cashier roles', () => {
    test.beforeEach(() => {
        execSync('docker compose exec -T app php artisan test:reset-data');
    });

    test('owner sees Void and Delete buttons', async ({ page }) => {
        await login(page, OWNER_EMAIL);
        const name = `Role Owner Item ${Date.now()}`;
        await createProduct(page, { name, sku: `SKU-RO-${Date.now()}`, price: 30, stock: 10 });
        await recordSale(page, name, 1);

        await page.goto('/transactions');
        await expect(
            page.locator('tr', { hasText: name }).getByRole('button', { name: 'Void' })
        ).toBeVisible();

        await page.goto('/products');
        await expect(
            page.locator('tr', { hasText: name }).getByRole('button', { name: 'Delete' })
        ).toBeVisible();
    });

    test('cashier does not see Void or Delete buttons', async ({ page }) => {
        await login(page, CASHIER_EMAIL);
        const name = `Role Cashier Item ${Date.now()}`;
        await createProduct(page, { name, sku: `SKU-RC-${Date.now()}`, price: 30, stock: 10 });
        await recordSale(page, name, 1);

        await page.goto('/transactions');
        const saleRow = page.locator('tr', { hasText: name });
        await expect(saleRow).toBeVisible();
        await expect(saleRow.getByRole('button', { name: 'Void' })).toHaveCount(0);

        await page.goto('/products');
        const productRow = page.locator('tr', { hasText: name });
        await expect(productRow.getByRole('link', { name: 'Edit' })).toBeVisible();
        await expect(productRow.getByRole('button', { name: 'Delete' })).toHaveCount(0);
    });

    test('cashier gets 403 when calling void and delete directly', async ({ page }) => {
        await login(page, CASHIER_EMAIL);
        const name = `Role Direct Item ${Date.now()}`;
        await createProduct(page, { name, sku: `SKU-RD-${Date.now()}`, price: 30, stock: 10 });
        await recordSale(page, name, 1);

        await page.goto('/products');
        const editHref = await page
            .locator('tr', { hasText: name })
            .getByRole('link', { name: 'Edit' })
            .getAttribute('href');
        const productId = editHref.match(/products\/(\d+)\/edit/)[1];

        await page.goto('/products/create');
        const token = await page.locator('input[name="_token"]').first().inputValue();

        const del = await page.request.post(`/products/${productId}`, {
            form: { _token: token, _method: 'DELETE' },
        });
        expect(del.status()).toBe(403);

        // reset-data truncates, so the first sale of the test has id 1
        const voidRes = await page.request.post('/transactions/1/void', {
            form: { _token: token },
        });
        expect(voidRes.status()).toBe(403);

        await page.goto('/products');
        await expect(page.locator('tr', { hasText: name })).toBeVisible();
    });
});

async function login(page, email) {
    await page.goto('/login');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(process.env.TEST_USER_PASSWORD);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL('/dashboard');
}

async function createProduct(page, { name, sku, price, stock, threshold = '5' }) {
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
