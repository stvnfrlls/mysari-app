import { test, expect } from '../fixtures.js';
import { execSync } from '../support/exec.js';
import fs from 'fs';
import path from 'path';

const exportsDir = path.join(process.cwd(), 'storage/app/private/exports');

test.describe('Export cleanup', () => {
    test.beforeEach(async ({ page }) => {
        execSync('docker compose exec -T app php artisan test:reset-data');
        await login(page);
    });

    test('an export older than 7 days loses its file and its row', async ({ page }) => {
        test.setTimeout(60000);

        const file = await makeReadyExport(page);
        expect(fileExists(file)).toBe(true);

        execSync(`docker compose exec -T app php artisan tinker --execute="App\\Models\\ReportExport::query()->update(['created_at' => now()->subDays(8)]);"`);
        runPrune();

        expect(fs.existsSync(path.join(exportsDir, file))).toBe(false);

        await page.goto('/reports/sales');
        await expect(page.locator('#exportList .export-row')).toHaveCount(0);
    });

    test('test:reset-data removes its own export files', async ({ page }) => {
        test.setTimeout(60000);

        const file = await makeReadyExport(page);
        expect(fileExists(file)).toBe(true);

        execSync('docker compose exec -T app php artisan test:reset-data');

        expect(fileExists(file)).toBe(false);
    });

    test('a recent export is kept', async ({ page }) => {
        test.setTimeout(60000);

        const file = await makeReadyExport(page);

        runPrune();

        expect(fileExists(file)).toBe(true);

        await page.goto('/reports/sales');
        await expect(page.locator('#exportList .export-row')).toHaveCount(1);
    });
});

function runPrune() {
    execSync(`docker compose exec -T app php artisan tinker --execute="App\\Jobs\\PruneOldExports::dispatchSync();"`);
}

function fileExists(name) {
    try {
        execSync(`docker compose exec -T app test -f /var/www/storage/app/private/exports/${name}`);
        return true;
    } catch {
        return false;
    }
}

function runQueue() {
    execSync('docker compose exec -T app su -s /bin/sh www-data -c "php artisan queue:work --stop-when-empty"');
}

function listFiles() {
    return fs.existsSync(exportsDir) ? fs.readdirSync(exportsDir) : [];
}

// Returns the name of the file this worker's export wrote.
async function makeReadyExport(page) {
    await page.goto('/reports/sales');
    await page.locator('#queueExport').click();
    await expect(page.locator('#exportList .export-status').first()).toHaveText('Pending');

    runQueue();

    await expect(page.locator('#exportList .export-status').first()).toHaveText('Ready', { timeout: 15000 });

    const out = execSync(`docker compose exec -T app php artisan tinker --execute="echo App\\Models\\ReportExport::latest('id')->first()->path;"`).toString();
    const match = out.match(/exports\/([\w-]+\.csv)/);
    expect(match).not.toBeNull();
    return match[1];
}

async function login(page) {
    await page.goto('/login');
    await page.getByLabel('Email').fill(process.env.TEST_USER_EMAIL);
    await page.getByLabel('Password').fill(process.env.TEST_USER_PASSWORD);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL('/dashboard');
}
