import { test, expect } from '../fixtures.js';
import { execSync } from '../support/exec.js';

test.describe('Daily summaries history', () => {
    test.beforeEach(async ({ page }) => {
        execSync('docker compose exec -T app php artisan test:reset-data');
        await login(page);
    });

    test('shows an empty message when there are no summaries', async ({ page }) => {
        await page.goto('/summaries');

        await expect(page.locator('#summaryList').getByText('No summaries yet.')).toBeVisible();
        await expect(page.locator('.summary-row')).toHaveCount(0);
    });

    test('lists summaries newest first with their numbers', async ({ page }) => {
        execSync(`docker compose exec -T app php artisan tinker --execute="App\\Models\\DailySummary::create(['summary_date' => today()->subDays(2)->toDateString(), 'total_sales' => 100, 'transactions_count' => 2, 'cash' => 100, 'credit' => 0, 'utang_outstanding' => 0]); App\\Models\\DailySummary::create(['summary_date' => today()->subDay()->toDateString(), 'total_sales' => 1234.5, 'transactions_count' => 7, 'cash' => 1000, 'credit' => 234.5, 'utang_outstanding' => 500]);"`);

        await page.goto('/summaries');

        const rows = page.locator('.summary-row');
        await expect(rows).toHaveCount(2);
        await expect(rows.nth(0)).toContainText('₱1,234.50');
        await expect(rows.nth(0)).toContainText('7');
        await expect(rows.nth(0)).toContainText('₱1,000.00');
        await expect(rows.nth(0)).toContainText('₱234.50');
        await expect(rows.nth(0)).toContainText('₱500.00');
        await expect(rows.nth(1)).toContainText('₱100.00');
    });
});

async function login(page) {
    await page.goto('/login');
    await page.getByLabel('Email').fill(process.env.TEST_USER_EMAIL);
    await page.getByLabel('Password').fill(process.env.TEST_USER_PASSWORD);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL('/dashboard');
}
