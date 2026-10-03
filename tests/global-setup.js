import { exec, execFileSync } from 'child_process';
import { promisify } from 'util';

const run = promisify(exec);

export default async function globalSetup() {
    const workers = Math.min(Number(process.env.PW_WORKERS || 4), 8);
    const names = Array.from({ length: workers }, (_, i) => `sariapp_test_${i}`);

    ensureDatabases(names);

    await Promise.all(names.map((name) => prepare(name)));
}

function ensureDatabases(names) {
    const sql =
        names
            .map((n) => `CREATE DATABASE IF NOT EXISTS ${n}; GRANT ALL PRIVILEGES ON ${n}.* TO '__USER__'@'%';`)
            .join(' ') + ' FLUSH PRIVILEGES;';

    execFileSync(
        'docker',
        [
            'compose', 'exec', '-T', '-e', `SQL=${sql}`, 'db', 'sh', '-c',
            'mysql -uroot -p"$MYSQL_ROOT_PASSWORD" -e "$(printf "%s" "$SQL" | sed "s/__USER__/$MYSQL_USER/g")"',
        ],
        { stdio: 'inherit' }
    );
}

async function prepare(name) {
    const artisan = `docker compose exec -T -e DB_DATABASE=${name} app php artisan`;

    await run(`${artisan} migrate:fresh --env=testing`);
    await run(`${artisan} db:seed --class=TestUserSeeder --env=testing`);
}
