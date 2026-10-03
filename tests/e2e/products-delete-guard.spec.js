import { test, expect } from '../fixtures.js';

test.describe('Product delete guard', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
        await page.getByLabel('Email').fill(process.env.TEST_USER_EMAIL);
        await page.getByLabel('Password').fill(process.env.TEST_USER_PASSWORD);
        await page.getByRole('button', { name: 'Sign In' }).click();
        await expect(page).toHaveURL('/dashboard');
    });

    test('a product with a sale cannot be deleted', async ({ page }) => {
        const name = `Guard Item ${Date.now()}`;
        const sku = `SKU-GUARD-${Date.now()}`;

        await page.goto('/products/create');
        await page.getByLabel('Name').fill(name);
        await page.getByLabel('SKU').fill(sku);
        await page.getByLabel('Price (₱)').fill('10.00');
        await page.getByLabel('Stock Quantity').fill('5');
        await page.getByLabel('Low Stock Threshold').fill('1');
        await page.getByRole('button', { name: 'Save Product' }).click();
        await expect(page).toHaveURL('/products');

        await page.goto('/transactions/create');
        const optionValue = await page
            .locator('#product_id option', { hasText: name })
            .getAttribute('value');
        await page.selectOption('#product_id', optionValue);
        await page.getByLabel('Quantity').fill('1');
        await page.getByRole('button', { name: 'Record Sale' }).click();
        await expect(page).toHaveURL('/transactions');

        await page.goto('/products');
        const row = page.locator('tr', { hasText: sku });
        page.once('dialog', dialog => dialog.accept());
        await row.getByRole('button', { name: 'Delete' }).click();

        await expect(page.getByText('This product has sales on record and cannot be deleted.')).toBeVisible();
        await expect(page.locator('tr', { hasText: sku })).toBeVisible();
    });
});
