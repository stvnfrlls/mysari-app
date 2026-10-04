import { test, expect } from '../fixtures.js';
import { execSync } from '../support/exec.js';

test.describe('User delete guard', () => {
    test('a user who has sales cannot be deleted from the database', async () => {
        const email = `seller-${Date.now()}@example.com`;

        execSync('docker compose exec -T app php artisan test:reset-data');

        execSync(`docker compose exec -T app php artisan tinker --execute="App\\Models\\Transaction::create(['user_id' => App\\Models\\User::create(['name' => 'Temp Seller', 'email' => '${email}', 'password' => bcrypt('temp-pass-12345')])->id, 'total' => 5]);"`);

        const attempt = execSync(`docker compose exec -T app php artisan tinker --execute="try { App\\Models\\User::where('email', '${email}')->delete(); echo 'DELETED'; } catch (Throwable) { echo 'BLOCKED'; }"`).toString();
        expect(attempt).toContain('BLOCKED');

        const still = execSync(`docker compose exec -T app php artisan tinker --execute="echo 'USERS=' . App\\Models\\User::where('email', '${email}')->count() . ' SALES=' . App\\Models\\Transaction::count();"`).toString();
        expect(still).toContain('USERS=1');
        expect(still).toContain('SALES=1');

        // Clean up: with the sale gone, the user can be deleted.
        execSync('docker compose exec -T app php artisan test:reset-data');
        execSync(`docker compose exec -T app php artisan tinker --execute="App\\Models\\User::where('email', '${email}')->delete();"`);
    });
});
