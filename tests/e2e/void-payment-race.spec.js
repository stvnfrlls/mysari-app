import { spawn, spawnSync } from 'child_process';
import { test, expect } from '../fixtures.js';
import { execSync, workerDb } from '../support/exec.js';

const HOLD_SECONDS = 8;

// Args are passed as an array, so there are no shell quoting problems.
function tinkerArgs(code) {
    return [
        'compose', 'exec', '-T',
        '-e', `DB_DATABASE=${workerDb()}`,
        '-e', 'QUEUE_CONNECTION=database',
        'app', 'php', 'artisan', 'tinker', `--execute=${code}`,
    ];
}

function seedCreditSale(productName) {
    const code = `
        $u = App\\Models\\User::where('email', '${process.env.TEST_USER_EMAIL}')->firstOrFail();
        $c = new App\\Models\\Customer;
        $c->forceFill(['name' => 'Lock Test', 'phone' => '0917'])->save();
        $p = new App\\Models\\Product;
        $p->forceFill(['name' => '${productName}', 'sku' => 'SKU-LOCK-' . time(), 'price' => 50, 'stock_quantity' => 8, 'low_stock_threshold' => 1])->save();
        $t = new App\\Models\\Transaction;
        $t->forceFill(['user_id' => $u->id, 'total' => 100, 'is_credit' => true, 'customer_id' => $c->id])->save();
        $i = new App\\Models\\TransactionItem;
        $i->forceFill(['transaction_id' => $t->id, 'product_id' => $p->id, 'quantity' => 2, 'unit_price' => 50])->save();
        echo json_encode(['customer' => $c->id]);
    `;

    const result = spawnSync('docker', tinkerArgs(code), { encoding: 'utf8' });
    const match = result.stdout.match(/\{.*\}/);

    if (!match) {
        throw new Error(`Seeding failed:\n${result.stdout}\n${result.stderr}`);
    }

    return JSON.parse(match[0]).customer;
}

// Locks the customer row in a background process, like pay() does.
// Resolves once the lock is held. `done` resolves when the process exits.
function holdCustomerLock(customerId) {
    const code = `
        Illuminate\\Support\\Facades\\DB::transaction(function () {
            App\\Models\\Customer::whereKey(${customerId})->lockForUpdate()->first();
            fwrite(STDERR, "LOCKED\\n");
            sleep(${HOLD_SECONDS});
        });
    `;

    const child = spawn('docker', tinkerArgs(code));
    let stderr = '';

    const done = new Promise(resolve => child.on('exit', resolve));

    const locked = new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`Lock never acquired:\n${stderr}`)), 20000);

        child.stderr.on('data', chunk => {
            stderr += chunk.toString();
            if (stderr.includes('LOCKED')) {
                clearTimeout(timer);
                resolve(Date.now());
            }
        });
    });

    return { locked, done };
}

test.describe('Void vs payment race', () => {
    test.beforeEach(async ({ page }) => {
        execSync('docker compose exec -T app php artisan test:reset-data');
        await login(page);
    });

    test('voiding a credit sale waits for the customer row lock', async ({ page }) => {
        test.setTimeout(60000);

        const name = `Lock Item ${Date.now()}`;
        const customerId = seedCreditSale(name);

        const lock = holdCustomerLock(customerId);
        const lockedAt = await lock.locked;

        await page.goto('/transactions');
        const row = page.locator('tr', { hasText: name });
        page.once('dialog', dialog => dialog.accept());
        await row.getByRole('button', { name: 'Void' }).click();

        await expect(page.getByText('Transaction voided.')).toBeVisible({ timeout: 30000 });

        const waitedMs = Date.now() - lockedAt;
        await lock.done;

        // Without the customer lock the void finishes in about a second.
        // With it, the void cannot finish until the lock is released.
        expect(waitedMs).toBeGreaterThanOrEqual((HOLD_SECONDS - 1) * 1000);

        await expect(page.locator('tr', { hasText: name })).toHaveClass(/voided/);
    });
});

async function login(page) {
    await page.goto('/login');
    await page.getByLabel('Email').fill(process.env.TEST_USER_EMAIL);
    await page.getByLabel('Password').fill(process.env.TEST_USER_PASSWORD);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL('/dashboard');
}
