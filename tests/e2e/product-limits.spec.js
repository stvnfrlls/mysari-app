import { test, expect } from '../fixtures.js';

test.describe('Product and sale limits', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
        await page.getByLabel('Email').fill(process.env.TEST_USER_EMAIL);
        await page.getByLabel('Password').fill(process.env.TEST_USER_PASSWORD);
        await page.getByRole('button', { name: 'Sign In' }).click();
        await expect(page).toHaveURL('/dashboard');
    });

    test('the server rejects a price and a stock above the limits', async ({ page }) => {
        await page.goto('/products/create');
        const token = await page.locator('input[name="_token"]').first().inputValue();
        const stamp = Date.now();

        await page.request.post('/products', {
            form: {
                _token: token,
                name: 'Too Pricey',
                sku: `SKU-BIGP-${stamp}`,
                price: '100000000',
                stock_quantity: '5',
                low_stock_threshold: '1',
            },
        });
        await page.request.post('/products', {
            form: {
                _token: token,
                name: 'Too Much Stock',
                sku: `SKU-BIGS-${stamp}`,
                price: '5',
                stock_quantity: '1000001',
                low_stock_threshold: '1',
            },
        });

        for (const sku of [`SKU-BIGP-${stamp}`, `SKU-BIGS-${stamp}`]) {
            await page.goto(`/products?q=${sku}`);
            await expect(page.getByText(`No products match "${sku}".`)).toBeVisible();
        }
    });

    test('a sale whose total is too large is refused with a message', async ({ page }) => {
        const name = `Huge Price ${Date.now()}`;

        await page.goto('/products/create');
        await page.getByLabel('Name').fill(name);
        await page.getByLabel('SKU').fill(`SKU-HUGE-${Date.now()}`);
        await page.getByLabel('Price (₱)').fill('99999999.00');
        await page.getByLabel('Stock Quantity').fill('5');
        await page.getByLabel('Low Stock Threshold').fill('1');
        await page.getByRole('button', { name: 'Save Product' }).click();
        await expect(page).toHaveURL('/products');

        await page.goto('/transactions/create');
        const optionValue = await page
            .locator('#product_id option', { hasText: name })
            .getAttribute('value');
        await page.selectOption('#product_id', optionValue);
        await page.getByLabel('Quantity').fill('2');
        await page.getByRole('button', { name: 'Record Sale' }).click();

        await expect(page.getByText('Sale total is too large.')).toBeVisible();
    });
});
