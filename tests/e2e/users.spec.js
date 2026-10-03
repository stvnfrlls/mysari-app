import { test, expect } from '@playwright/test';

const OWNER_EMAIL = 'testuser@example.com';
const CASHIER_EMAIL = 'cashier@example.com';

test.describe('User management', () => {
    test('owner can add a cashier who can then log in', async ({ page }) => {
        const email = `new-cashier-${Date.now()}@example.com`;

        await login(page, OWNER_EMAIL);
        await page.goto('/users');
        await addUser(page, { name: 'New Cashier', email, role: 'cashier' });

        await expect(page.getByText('User added.')).toBeVisible();
        const row = page.locator('tr', { hasText: email });
        await expect(row).toBeVisible();
        await expect(row.locator('td').nth(2)).toHaveText('Cashier');

        await page.getByRole('button', { name: 'Log Out' }).click();
        await expect(page).toHaveURL('/');

        await login(page, email);
        await expect(page.getByRole('link', { name: 'Users' })).toHaveCount(0);
    });

    test('owner can change another user\'s role', async ({ page }) => {
        const email = `promote-${Date.now()}@example.com`;

        await login(page, OWNER_EMAIL);
        await page.goto('/users');
        await addUser(page, { name: 'Promote Me', email, role: 'cashier' });

        const row = page.locator('tr', { hasText: email });
        await row.locator('select[name="role"]').selectOption('owner');
        await row.getByRole('button', { name: 'Save' }).click();

        await expect(page.getByText('Role updated.')).toBeVisible();
        await expect(page.locator('tr', { hasText: email }).locator('td').nth(2)).toHaveText('Owner');
    });

    test('owner cannot demote themselves', async ({ page }) => {
        await login(page, OWNER_EMAIL);
        await page.goto('/users');

        const row = page.locator('tr', { hasText: OWNER_EMAIL });
        await row.locator('select[name="role"]').selectOption('cashier');
        await row.getByRole('button', { name: 'Save' }).click();

        await expect(page.getByText('You cannot remove your own owner role.')).toBeVisible();
        await expect(page.locator('tr', { hasText: OWNER_EMAIL }).locator('td').nth(2)).toHaveText('Owner');
    });

    test('cashier cannot open the users page', async ({ page }) => {
        await login(page, CASHIER_EMAIL);

        const response = await page.goto('/users');
        expect(response.status()).toBe(403);

        await page.goto('/dashboard');
        await expect(page.getByRole('link', { name: 'Users' })).toHaveCount(0);
    });
});

async function login(page, email) {
    await page.goto('/login');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(process.env.TEST_USER_PASSWORD);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL('/dashboard');
}

async function addUser(page, { name, email, role }) {
    await page.getByPlaceholder('Name', { exact: true }).fill(name);
    await page.getByPlaceholder('Email', { exact: true }).fill(email);
    await page.getByPlaceholder('Password (min 8)').fill(process.env.TEST_USER_PASSWORD);
    await page.getByLabel('New user role').selectOption(role);
    await page.getByRole('button', { name: 'Add User' }).click();
}
