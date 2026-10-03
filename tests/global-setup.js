import { exec } from 'child_process';
import { promisify } from 'util';

const run = promisify(exec);

export default async function globalSetup() {
    const workers = Math.min(Number(process.env.PW_WORKERS || 1), 8);

    await Promise.all(Array.from({ length: workers }, (_, i) => prepare(i)));
}

async function prepare(i) {
    const artisan = `docker compose exec -T -e DB_DATABASE=sariapp_test_${i} app php artisan`;

    await run(`${artisan} migrate:fresh --env=testing`);
    await run(`${artisan} db:seed --class=TestUserSeeder --env=testing`);
}
