import { test, expect } from '../fixtures.js';
import { execSync, workerDb } from '../support/exec.js';

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

    test('cashier does not see Void or Delete buttons', async ({ page, browser }) => {
        const name = `Role Cashier Item ${Date.now()}`;
        await createProductAsOwner(browser, { name, sku: `SKU-RC-${Date.now()}`, price: 30, stock: 10 });

        await login(page, CASHIER_EMAIL);
        await recordSale(page, name, 1);

        await page.goto('/transactions');
        const saleRow = page.locator('tr', { hasText: name });
        await expect(saleRow).toBeVisible();
        await expect(saleRow.getByRole('button', { name: 'Void' })).toHaveCount(0);

        await page.goto('/products');
        const productRow = page.locator('tr', { hasText: name });
        await expect(productRow.getByRole('link', { name: 'Edit' })).toHaveCount(0);
        await expect(productRow.getByRole('button', { name: 'Delete' })).toHaveCount(0);
    });

    test('cashier gets 403 when calling void, delete, edit and update directly', async ({ page, browser }) => {
        const name = `Role Direct Item ${Date.now()}`;
        await createProductAsOwner(browser, { name, sku: `SKU-RD-${Date.now()}`, price: 30, stock: 10 });

        await login(page, CASHIER_EMAIL);
        await recordSale(page, name, 1);

        await page.goto('/transactions/create');
        const productId = await page
            .locator('#product_id option', { hasText: name })
            .getAttribute('value');

        // Any page with a form gives a token, so the POSTs reach the role check instead of a 419.
        await page.goto('/customers');
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

        const edit = await page.request.get(`/products/${productId}/edit`);
        expect(edit.status()).toBe(403);

        const update = await page.request.post(`/products/${productId}`, {
            form: {
                _token: token,
                _method: 'PATCH',
                name: 'Hacked',
                sku: `SKU-HACK-${Date.now()}`,
                price: '0.01',
                stock_quantity: '999',
                low_stock_threshold: '1',
            },
        });
        expect(update.status()).toBe(403);

        await page.goto('/products');
        await expect(page.locator('tr', { hasText: name })).toBeVisible();
        await expect(page.getByText('Hacked')).toHaveCount(0);
    });
});

async function login(page, email) {
    await page.goto('/login');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(process.env.TEST_USER_PASSWORD);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL('/dashboard');
}

// Cashiers cannot create products, so an owner does it in a separate browser context.
async function createProductAsOwner(browser, product) {
    const ownerContext = await browser.newContext({ baseURL: 'http://localhost:8000' });
    await ownerContext.addCookies([
        { name: 'test_db', value: workerDb(), url: 'http://localhost:8000' },
    ]);
    const ownerPage = await ownerContext.newPage();

    await login(ownerPage, OWNER_EMAIL);
    await createProduct(ownerPage, product);
    await ownerContext.close();
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
