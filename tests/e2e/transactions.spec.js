import { test, expect } from '../fixtures.js';
import { execSync } from '../support/exec.js';

test.describe('Transaction management', () => {
    test.beforeAll(() => {
        execSync('docker compose exec -T app php artisan test:reset-data'); // add this line
        execSync('docker compose exec -T app php artisan db:seed --class=TestUserSeeder');
    });

    test.beforeEach(() => {
        // Reset before every test — otherwise fixed values like this file's
        // price/qty combo can match leftover rows from a previous run.
        execSync('docker compose exec -T app php artisan test:reset-data');
    });

    async function login(page) {
        await page.goto('/login');
        await page.getByLabel('Email').fill(process.env.TEST_USER_EMAIL);
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
        await page.getByLabel('Low Stock Threshold').fill(threshold);
        await page.getByRole('button', { name: 'Save Product' }).click();
        await expect(page).toHaveURL('/products');
    }

    function statValue(page, label) {
        return page.locator('.stat-card', { hasText: label }).locator('.stat-value');
    }

    test.describe('Sale recording', () => {
        test.beforeEach(async ({ page }) => {
            await login(page);
        });

        test('recording a sale decrements stock, logs the transaction, and updates dashboard stats', async ({ page }) => {
            const name = `Test Product ${Date.now()}`;
            const sku = `SKU-SALE-${Date.now()}`;
            const price = 50;
            const stock = 20;
            const qty = 3;

            await createProduct(page, { name, sku, price, stock });

            await page.goto('/dashboard');
            const stockBefore = parseInt((await statValue(page, 'Items in Stock').innerText()).replace(/,/g, ''), 10);
            const txCountBefore = parseInt((await statValue(page, 'Transactions Today').innerText()).replace(/,/g, ''), 10);

            await page.goto('/transactions/create');
            const optionLabel = `${name} — ₱${price.toFixed(2)} (${stock} in stock)`;
            await page.locator('#product_id').selectOption({ label: optionLabel });
            await page.getByLabel('Quantity').fill(String(qty));
            await expect(page.locator('#lineTotal')).toHaveText(`Total: ₱${(price * qty).toFixed(2)}`);
            await page.getByRole('button', { name: 'Record Sale' }).click();

            await expect(page).toHaveURL('/transactions');
            await expect(page.getByText('Sale recorded.')).toBeVisible();
            await expect(page.getByText(name)).toBeVisible();
            await expect(page.getByText(`₱${(price * qty).toFixed(2)}`)).toBeVisible();

            await page.goto('/dashboard');
            const stockAfter = parseInt((await statValue(page, 'Items in Stock').innerText()).replace(/,/g, ''), 10);
            const txCountAfter = parseInt((await statValue(page, 'Transactions Today').innerText()).replace(/,/g, ''), 10);

            expect(stockAfter).toBe(stockBefore - qty);
            expect(txCountAfter).toBe(txCountBefore + 1);
            await expect(page.locator('.activity-row', { hasText: name })).toBeVisible();
        });

        test('rejects a sale that exceeds available stock and leaves stock unchanged', async ({ page }) => {
            const name = `Low Stock Product ${Date.now()}`;
            const sku = `SKU-OVER-${Date.now()}`;
            const price = 25;
            const stock = 2;

            await createProduct(page, { name, sku, price, stock });

            await page.goto('/dashboard');
            const stockBefore = parseInt((await statValue(page, 'Items in Stock').innerText()).replace(/,/g, ''), 10);

            await page.goto('/transactions/create');
            const optionLabel = `${name} — ₱${price.toFixed(2)} (${stock} in stock)`;
            await page.locator('#product_id').selectOption({ label: optionLabel });
            const attemptedQty = stock + 5;
            await page.getByLabel('Quantity').fill(String(attemptedQty));
            await page.getByRole('button', { name: 'Record Sale' }).click();

            await expect(page).toHaveURL('/transactions/create');
            await expect(page.getByText(`Not enough stock. Only ${stock} available.`)).toBeVisible();

            await page.goto('/dashboard');
            const stockAfter = parseInt((await statValue(page, 'Items in Stock').innerText()).replace(/,/g, ''), 10);
            expect(stockAfter).toBe(stockBefore);
        });

        test('unauthenticated users are redirected to login when recording a sale', async ({ page, context }) => {
            await context.clearCookies();
            await page.goto('/transactions/create');
            await expect(page).toHaveURL('/login');
        });
    });
})
