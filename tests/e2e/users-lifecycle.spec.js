import { test, expect } from '../fixtures.js';
import { workerDb } from '../support/exec.js';

const OWNER_EMAIL = 'testuser@example.com';
const CASHIER_EMAIL = 'cashier@example.com';
const BASE_URL = 'http://localhost:8000';

test.describe('User deactivation and password reset', () => {
    test('a deactivated user cannot log in until reactivated', async ({ page }) => {
        const email = `deact-${Date.now()}@example.com`;

        await login(page, OWNER_EMAIL);
        await page.goto('/users');
        await addUser(page, { name: 'Deact Me', email, role: 'cashier' });

        const row = page.locator('tr', { hasText: email });
        await row.getByRole('button', { name: 'Deactivate' }).click();
        await expect(page.getByText('User deactivated.')).toBeVisible();
        await expect(page.locator('tr', { hasText: email }).locator('td').nth(3)).toHaveText('Deactivated');

        await logout(page);
        await tryLogin(page, email, process.env.TEST_USER_PASSWORD);
        await expect(page).toHaveURL('/login');
        await expect(page.getByText('These credentials do not match our records.')).toBeVisible();

        await login(page, OWNER_EMAIL);
        await page.goto('/users');
        await page.locator('tr', { hasText: email }).getByRole('button', { name: 'Reactivate' }).click();
        await expect(page.getByText('User reactivated.')).toBeVisible();
        await expect(page.locator('tr', { hasText: email }).locator('td').nth(3)).toHaveText('Active');

        await logout(page);
        await login(page, email);
    });

    test('a signed-in user is logged out after being deactivated', async ({ page, browser }) => {
        const email = `kick-${Date.now()}@example.com`;

        await login(page, OWNER_EMAIL);
        await page.goto('/users');
        await addUser(page, { name: 'Kick Me', email, role: 'cashier' });

        const otherContext = await browser.newContext({ baseURL: BASE_URL });
        await otherContext.addCookies([{ name: 'test_db', value: workerDb(), url: BASE_URL }]);
        const otherPage = await otherContext.newPage();
        await login(otherPage, email);

        await page.locator('tr', { hasText: email }).getByRole('button', { name: 'Deactivate' }).click();
        await expect(page.getByText('User deactivated.')).toBeVisible();

        await otherPage.goto('/dashboard');
        await expect(otherPage).toHaveURL('/login');
        await expect(otherPage.getByText('This account has been deactivated.')).toBeVisible();

        await otherContext.close();
    });

    test('an owner has no Deactivate button on their own row and the server refuses it too', async ({ page }) => {
        await login(page, OWNER_EMAIL);
        await page.goto('/users');

        const ownRow = page.locator('tr', { hasText: OWNER_EMAIL });
        await expect(ownRow.getByRole('button', { name: 'Deactivate' })).toHaveCount(0);

        const token = await page.locator('input[name="_token"]').first().inputValue();
        // migrate:fresh runs TestUserSeeder first, so the owner is user 1
        const res = await page.request.post('/users/1/deactivate', {
            form: { _token: token, _method: 'PATCH' },
        });
        expect(res.ok()).toBeTruthy();
        await page.goto('/users');
        await expect(page.locator('tr', { hasText: OWNER_EMAIL }).locator('td').nth(3)).toHaveText('Active');
    });

    test('an owner can reset a password and only the new one works', async ({ page }) => {
        const email = `reset-${Date.now()}@example.com`;
        const newPassword = 'newpassword456';

        await login(page, OWNER_EMAIL);
        await page.goto('/users');
        await addUser(page, { name: 'Reset Me', email, role: 'cashier' });

        const row = page.locator('tr', { hasText: email });
        await row.getByPlaceholder('New password').fill(newPassword);
        await row.getByRole('button', { name: 'Reset' }).click();
        await expect(page.getByText('Password reset.')).toBeVisible();

        await logout(page);

        await tryLogin(page, email, process.env.TEST_USER_PASSWORD);
        await expect(page).toHaveURL('/login');

        await tryLogin(page, email, newPassword);
        await expect(page).toHaveURL('/dashboard');
    });

    test('a cashier gets 403 on the deactivate and password routes', async ({ page }) => {
        await login(page, CASHIER_EMAIL);
        await page.goto('/dashboard');
        const token = await page.locator('input[name="_token"]').first().inputValue();

        const deactivate = await page.request.post('/users/1/deactivate', {
            form: { _token: token, _method: 'PATCH' },
        });
        expect(deactivate.status()).toBe(403);

        const password = await page.request.post('/users/1/password', {
            form: { _token: token, _method: 'PATCH', password: 'hacked-password' },
        });
        expect(password.status()).toBe(403);
    });

    test('resetting a password logs out that user\'s other sessions', async ({ page, browser }) => {
        const email = `sess-${Date.now()}@example.com`;

        await login(page, OWNER_EMAIL);
        await page.goto('/users');
        await addUser(page, { name: 'Sess Me', email, role: 'cashier' });

        const otherContext = await browser.newContext({ baseURL: BASE_URL });
        await otherContext.addCookies([{ name: 'test_db', value: workerDb(), url: BASE_URL }]);
        const otherPage = await otherContext.newPage();
        await login(otherPage, email);

        const row = page.locator('tr', { hasText: email });
        await row.getByPlaceholder('New password').fill('newpassword456');
        await row.getByRole('button', { name: 'Reset' }).click();
        await expect(page.getByText('Password reset.')).toBeVisible();

        await otherPage.goto('/dashboard');
        await expect(otherPage).toHaveURL('/login');

        await otherContext.close();
    });

    test('an owner who resets their own password stays signed in', async ({ page, browser }) => {
        const email = `selfreset-${Date.now()}@example.com`;

        await login(page, OWNER_EMAIL);
        await page.goto('/users');
        await addUser(page, { name: 'Self Reset', email, role: 'owner' });

        const ownerContext = await browser.newContext({ baseURL: BASE_URL });
        await ownerContext.addCookies([{ name: 'test_db', value: workerDb(), url: BASE_URL }]);
        const ownerPage = await ownerContext.newPage();
        await login(ownerPage, email);

        await ownerPage.goto('/users');
        const row = ownerPage.locator('tr', { hasText: email });
        await row.getByPlaceholder('New password').fill('newpassword456');
        await row.getByRole('button', { name: 'Reset' }).click();
        await expect(ownerPage.getByText('Password reset.')).toBeVisible();

        await ownerPage.goto('/dashboard');
        await expect(ownerPage).toHaveURL('/dashboard');

        await ownerContext.close();
    });

    test('a weak password is rejected on reset', async ({ page }) => {
        const email = `weak-${Date.now()}@example.com`;

        await login(page, OWNER_EMAIL);
        await page.goto('/users');
        await addUser(page, { name: 'Weak Pass', email, role: 'cashier' });

        const row = page.locator('tr', { hasText: email });
        await row.getByPlaceholder('New password').fill('onlyletters');
        await row.getByRole('button', { name: 'Reset' }).click();

        await expect(page.getByText('Password reset.')).toHaveCount(0);
    });
});

async function tryLogin(page, email, password) {
    await page.goto('/login');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: 'Sign In' }).click();
}

async function login(page, email) {
    await tryLogin(page, email, process.env.TEST_USER_PASSWORD);
    await expect(page).toHaveURL('/dashboard');
}

async function logout(page) {
    await page.getByRole('button', { name: 'Log Out' }).click();
    await expect(page).toHaveURL('/');
}

async function addUser(page, { name, email, role }) {
    await page.getByPlaceholder('Name', { exact: true }).fill(name);
    await page.getByPlaceholder('Email', { exact: true }).fill(email);
    await page.getByPlaceholder('Password (min 8)').fill(process.env.TEST_USER_PASSWORD);
    await page.getByLabel('New user role').selectOption(role);
    await page.getByRole('button', { name: 'Add User' }).click();
}
