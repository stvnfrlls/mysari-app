import { test, expect } from '../fixtures.js';
import { execSync, workerDb } from '../support/exec.js';

test.describe('Cashier restrictions', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
        await page.getByLabel('Email').fill('cashier@example.com');
        await page.getByLabel('Password').fill(process.env.TEST_USER_PASSWORD);
        await page.getByRole('button', { name: 'Sign In' }).click();
        await expect(page).toHaveURL('/dashboard');
    });

    test('a cashier gets 403 when queueing or downloading an export directly', async ({ page, browser }) => {
        test.setTimeout(60000);

        // Grab a CSRF token from any page with a form, so the POST reaches the role check instead of a 419.
        await page.goto('/customers');
        const token = await page.locator('input[name="_token"]').first().inputValue();

        const queue = await page.request.post('/reports/sales/exports', {
            form: { _token: token, from: '2026-10-01', to: '2026-10-03' },
        });
        expect(queue.status()).toBe(403);

        // The owner creates a real export so the cashier hits an id that exists.
        const ownerContext = await browser.newContext({ baseURL: 'http://localhost:8000' });
        await ownerContext.addCookies([
            { name: 'test_db', value: workerDb(), url: 'http://localhost:8000' },
        ]);
        const ownerPage = await ownerContext.newPage();

        await ownerPage.goto('/login');
        await ownerPage.getByLabel('Email').fill(process.env.TEST_USER_EMAIL);
        await ownerPage.getByLabel('Password').fill(process.env.TEST_USER_PASSWORD);
        await ownerPage.getByRole('button', { name: 'Sign In' }).click();
        await expect(ownerPage).toHaveURL('/dashboard');

        await ownerPage.goto('/reports/sales');
        await ownerPage.locator('#queueExport').click();
        await expect(ownerPage.locator('#exportList .export-status').first()).toHaveText('Pending');

        execSync('docker compose exec -T app su -s /bin/sh www-data -c "php artisan queue:work --stop-when-empty"');

        await expect(ownerPage.locator('#exportList .export-status').first()).toHaveText('Ready', { timeout: 15000 });
        const href = await ownerPage.locator('#exportList .export-download').first().getAttribute('href');
        await ownerContext.close();

        const download = await page.request.get(href);
        expect(download.status()).toBe(403);
    });

    test('a cashier gets 403 on the sales report and its export', async ({ page }) => {
        const report = await page.request.get('/reports/sales');
        expect(report.status()).toBe(403);

        const csv = await page.request.get('/reports/sales/export');
        expect(csv.status()).toBe(403);

        const summaries = await page.request.get('/summaries');
        expect(summaries.status()).toBe(403);
    });

    test('a cashier sees no Sales Report, Daily Summaries or Add Product link', async ({ page }) => {
        await expect(page.getByRole('link', { name: 'Sales Report' })).toHaveCount(0);
        await expect(page.getByRole('link', { name: 'Daily Summaries' })).toHaveCount(0);

        await page.goto('/products');
        await expect(page.getByRole('link', { name: 'Add Product' })).toHaveCount(0);
    });

    test('a cashier gets 403 when creating a product directly', async ({ page }) => {
        const form = await page.request.get('/products/create');
        expect(form.status()).toBe(403);

        // Any page with a form gives a token, so the POST reaches the role check instead of a 419.
        await page.goto('/customers');
        const token = await page.locator('input[name="_token"]').first().inputValue();

        const store = await page.request.post('/products', {
            form: {
                _token: token,
                name: 'Cashier Made',
                sku: `SKU-CASH-${Date.now()}`,
                price: '5.00',
                stock_quantity: '3',
                low_stock_threshold: '1',
            },
        });
        expect(store.status()).toBe(403);
    });
});
