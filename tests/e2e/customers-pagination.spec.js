import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';

function seedCustomers(count) {
    execSync(
        `docker compose exec -T app php artisan tinker --execute="for (\\$i = 1; \\$i <= ${count}; \\$i++) { App\\Models\\Customer::create(['name' => 'Cust '.str_pad(\\$i, 2, '0', STR_PAD_LEFT)]); }"`
    );
}

test.describe('Customers pagination', () => {
    test.beforeEach(async ({ page }) => {
        execSync('docker compose exec -T app php artisan test:reset-data');
        seedCustomers(25);
        await login(page);
    });

    test('the first page shows 20 customers and the result count', async ({ page }) => {
        await page.goto('/customers');

        await expect(page.locator('tbody tr')).toHaveCount(20);
        await expect(page.locator('tr', { hasText: 'Cust 01' })).toHaveCount(1);
        await expect(page.locator('tr', { hasText: 'Cust 21' })).toHaveCount(0);
        await expect(page.getByText('Showing 1 to 20 of 25 results')).toBeVisible();
    });

    test('page 2 shows the remaining customers', async ({ page }) => {
        await page.goto('/customers');
        await page.getByRole('link', { name: '2', exact: true }).click();

        await expect(page).toHaveURL(/page=2/);
        await expect(page.locator('tbody tr')).toHaveCount(5);
        await expect(page.locator('tr', { hasText: 'Cust 21' })).toHaveCount(1);
        await expect(page.locator('tr', { hasText: 'Cust 01' })).toHaveCount(0);
        await expect(page.getByText('Showing 21 to 25 of 25 results')).toBeVisible();
    });

    test('a customer on page 2 still shows the right balance', async ({ page }) => {
        const product = `Page Credit Item ${Date.now()}`;
        await createProduct(page, { name: product, sku: `SKU-PC-${Date.now()}`, price: 50, stock: 10 });

        await page.goto('/transactions/create');
        const optionValue = await page
            .locator('#product_id option', { hasText: product })
            .getAttribute('value');
        await page.selectOption('#product_id', optionValue);
        await page.getByLabel('Quantity').fill('2');
        await page.getByLabel('Pay later (utang)').check();
        await page.selectOption('#customer_id', { label: 'Cust 25' });
        await page.getByRole('button', { name: 'Record Sale' }).click();
        await expect(page).toHaveURL('/transactions');

        await page.goto('/customers?page=2');
        const row = page.locator('tr', { hasText: 'Cust 25' });
        await expect(row.getByRole('cell', { name: '₱100.00', exact: true })).toBeVisible();
        await expect(page.locator('tr', { hasText: 'Cust 21' }).getByRole('cell', { name: '₱0.00', exact: true })).toBeVisible();
    });
});

test.describe('Customers pagination with few customers', () => {
    test('no page links when everything fits on one page', async ({ page }) => {
        execSync('docker compose exec -T app php artisan test:reset-data');
        seedCustomers(3);
        await login(page);

        await page.goto('/customers');

        await expect(page.locator('tbody tr')).toHaveCount(3);
        await expect(page.getByRole('navigation', { name: 'Pagination' })).toHaveCount(0);
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
