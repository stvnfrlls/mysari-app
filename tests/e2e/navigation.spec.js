import { test, expect } from '../fixtures.js';

const links = [
    { name: 'Dashboard', url: '/dashboard' },
    { name: 'Products', url: '/products' },
    { name: 'Low Stock', url: '/products/low-stock' },
    { name: 'Record Sale', url: '/transactions/create' },
    { name: 'Transactions', url: '/transactions' },
    { name: 'Customers', url: '/customers' },
    { name: 'Sales Report', url: '/reports/sales' },
    { name: 'Daily Summaries', url: '/summaries' },
];

test.describe('Navigation', () => {
    test('guests see no main nav and the logo goes to the welcome page', async ({ page }) => {
        await page.goto('/login');
        await expect(page.getByRole('navigation', { name: 'Main' })).toHaveCount(0);

        await page.locator('.brand').click();
        await expect(page).toHaveURL('/');
        await expect(page.getByRole('navigation', { name: 'Main' })).toHaveCount(0);
    });

    test.describe('when logged in', () => {
        test.beforeEach(async ({ page }) => {
            await login(page);
        });

        test('shows every main link', async ({ page }) => {
            const nav = page.getByRole('navigation', { name: 'Main' });
            for (const { name } of links) {
                await expect(nav.getByRole('link', { name, exact: true })).toBeVisible();
            }
            await expect(nav.getByRole('button', { name: 'Log Out' })).toBeVisible();
        });

        test('each link opens its page', async ({ page }) => {
            const nav = page.getByRole('navigation', { name: 'Main' });
            for (const { name, url } of links) {
                await page.goto('/dashboard');
                await nav.getByRole('link', { name, exact: true }).click();
                await expect(page).toHaveURL(url);
            }
        });

        test('highlights only the current page', async ({ page }) => {
            const nav = page.getByRole('navigation', { name: 'Main' });
            await page.goto('/products/low-stock');

            await expect(nav.getByRole('link', { name: 'Low Stock', exact: true })).toHaveClass(/active/);
            await expect(nav.getByRole('link', { name: 'Products', exact: true })).not.toHaveClass(/active/);
        });

        test('the logo goes to the dashboard instead of the welcome page', async ({ page }) => {
            await page.goto('/products');
            await page.locator('.brand').click();
            await expect(page).toHaveURL('/dashboard');
        });

        test('visiting the welcome page while logged in redirects to the dashboard', async ({ page }) => {
            await page.goto('/');
            await expect(page).toHaveURL('/dashboard');
        });

        test('can log out from a page other than the dashboard', async ({ page }) => {
            await page.goto('/products');
            await page
                .getByRole('navigation', { name: 'Main' })
                .getByRole('button', { name: 'Log Out' })
                .click();

            await expect(page).toHaveURL('/');
            await expect(page.getByRole('navigation', { name: 'Main' })).toHaveCount(0);
        });
    });
});

async function login(page) {
    await page.goto('/login');
    await page.getByLabel('Email').fill(process.env.TEST_USER_EMAIL);
    await page.getByLabel('Password').fill(process.env.TEST_USER_PASSWORD);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL('/dashboard');
}
