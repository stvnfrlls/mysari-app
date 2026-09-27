import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';

test.beforeAll(() => {
    execSync('docker compose exec -T app php artisan db:seed --class=TestUserSeeder');
});

test.describe('Login flow', () => {
    test('landing page has a sign in link', async ({ page }) => {
        await page.goto('/');
        await expect(page.getByRole('link', { name: 'Sign In' })).toBeVisible();
    });

    test('successful login redirects to dashboard', async ({ page }) => {
        await page.goto('/login');

        await page.getByLabel('Email').fill(process.env.TEST_USER_EMAIL);
        await page.getByLabel('Password').fill(process.env.TEST_USER_PASSWORD);
        await page.getByRole('button', { name: 'Sign In' }).click();

        await expect(page).toHaveURL('/dashboard');
        await expect(page.getByText('Welcome back, Test User')).toBeVisible();
    });

    test('invalid credentials show an error', async ({ page }) => {
        await page.goto('/login');

        await page.getByLabel('Email').fill(process.env.TEST_USER_EMAIL);
        await page.getByLabel('Password').fill('wrongpassword');
        await page.getByRole('button', { name: 'Sign In' }).click();

        await expect(page).toHaveURL('/login');
        await expect(page.getByText('These credentials do not match our records.')).toBeVisible();
    });

    test('logout redirects to landing page', async ({ page }) => {
        await page.goto('/login');
        await page.getByLabel('Email').fill(process.env.TEST_USER_EMAIL);
        await page.getByLabel('Password').fill(process.env.TEST_USER_PASSWORD);
        await page.getByRole('button', { name: 'Sign In' }).click();

        await page.getByRole('button', { name: 'Log Out' }).click();
        await expect(page).toHaveURL('/');
    });
});
