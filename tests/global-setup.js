import { execSync } from 'child_process';

export default async function globalSetup() {
    execSync('docker compose exec -T app php artisan migrate:fresh --env=testing', { stdio: 'inherit' });
    execSync('docker compose exec -T app php artisan db:seed --class=TestUserSeeder --env=testing', { stdio: 'inherit' });
}
