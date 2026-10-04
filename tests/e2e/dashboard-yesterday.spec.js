import { test, expect } from '../fixtures.js';
import { execSync } from '../support/exec.js';

test.describe('Dashboard yesterday summary', () => {
    test.beforeEach(async ({ page }) => {
        execSync('docker compose exec -T app php artisan test:reset-data');
        await login(page);
    });

    test('shows the saved summary for yesterday', async ({ page }) => {
        execSync(`docker compose exec -T app php artisan tinker --execute="App\\Models\\DailySummary::create(['summary_date' => today()->subDay()->toDateString(), 'total_sales' => 1234.5, 'transactions_count' => 7, 'cash' => 1000, 'credit' => 234.5, 'utang_outstanding' => 500]);"`);

        await page.goto('/dashboard');

        await expect(page.locator('#yesterdayTotal')).toHaveText('₱1,234.50');
        await expect(page.locator('#yesterdayCount')).toHaveText('7');
        await expect(page.locator('#yesterdayCash')).toHaveText('₱1,000.00');
        await expect(page.locator('#yesterdayCredit')).toHaveText('₱234.50');
        await expect(page.locator('#yesterdayUtang')).toHaveText('₱500.00');
    });

    test('shows an empty message when there is no summary for yesterday', async ({ page }) => {
        await page.goto('/dashboard');

        await expect(page.locator('#yesterdaySummary').getByText('No summary for yesterday yet.')).toBeVisible();
        await expect(page.locator('#yesterdayTotal')).toHaveCount(0);
    });

    test('a summary from two days ago is not shown as yesterday', async ({ page }) => {
        execSync(`docker compose exec -T app php artisan tinker --execute="App\\Models\\DailySummary::create(['summary_date' => today()->subDays(2)->toDateString(), 'total_sales' => 99, 'transactions_count' => 1, 'cash' => 99, 'credit' => 0, 'utang_outstanding' => 0]);"`);

        await page.goto('/dashboard');

        await expect(page.locator('#yesterdaySummary').getByText('No summary for yesterday yet.')).toBeVisible();
    });
});

async function login(page) {
    await page.goto('/login');
    await page.getByLabel('Email').fill(process.env.TEST_USER_EMAIL);
    await page.getByLabel('Password').fill(process.env.TEST_USER_PASSWORD);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL('/dashboard');
}
