import { test, expect } from '../fixtures.js';

test.describe('Login throttle', () => {
    test('locks an email after 5 failed attempts', async ({ page }) => {
        const email = `throttle-${Date.now()}@example.com`;

        for (let i = 0; i < 5; i++) {
            await page.goto('/login');
            await page.getByLabel('Email').fill(email);
            await page.getByLabel('Password').fill('wrongpassword');
            await page.getByRole('button', { name: 'Sign In' }).click();

            await expect(page.getByText('These credentials do not match our records.')).toBeVisible();
        }

        await page.goto('/login');
        await page.getByLabel('Email').fill(email);
        await page.getByLabel('Password').fill('wrongpassword');
        await page.getByRole('button', { name: 'Sign In' }).click();

        await expect(page).toHaveURL('/login');
        await expect(page.getByText(/Too many login attempts/)).toBeVisible();
    });
});
