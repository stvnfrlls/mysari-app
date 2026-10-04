# Deploying mysari-app

Run everything from the project folder on the server.
`P` below means: docker compose --env-file .env.production -f docker-compose.prod.yml

## First deploy

1. Install Docker, clone the repo, and create `.env.production` from `.env.production.example`.
   Fill in APP_KEY, APP_URL and both database passwords. Never commit this file.
2. Start the stack: `P up -d --build`
3. Run the migrations: `P exec app php artisan migrate --force`
4. Create the roles, then the first owner. Run the role seeder before any user exists,
   because it gives the owner role to every user that has no role:

```
   P exec -u www-data -e HOME=/tmp app php artisan db:seed --class=RoleSeeder --force
```

   Then create the owner. The password is typed at a hidden prompt, so it stays out of the shell history:

```
   IFS= read -rs OWNER_PASSWORD; export OWNER_PASSWORD
   P exec -u www-data -e HOME=/tmp -e OWNER_PASSWORD="$OWNER_PASSWORD" app php artisan tinker --execute='$u = App\Models\User::create(["name" => "Owner", "email" => "you@yourdomain.com", "password" => bcrypt(getenv("OWNER_PASSWORD"))]); $u->assignRole("owner");'
   unset OWNER_PASSWORD
```

   Use your real email and a long password. Further accounts are created from the Users screen.
5. Put a TLS proxy in front of nginx. nginx listens on 127.0.0.1:8000 only.
   The proxy must send X-Forwarded-Proto: https.
6. Open the site over https and log in. Check that the session cookie is marked Secure.
7. Add the backup cron line from scripts/backup-db.sh, and copy backups off the server.

## Every later deploy

1. `git pull`
2. `P up -d --build`
3. `P exec app php artisan migrate --force`
4. `P restart worker scheduler` (they keep old code in memory)
5. Check `P ps` and the site.

## Rules

- Run artisan commands that write files as www-data: `P exec -u www-data app php artisan ...`
- Add `-e HOME=/tmp` when running tinker as www-data, or it prints a psysh warning and may not run.
- Never publish the MySQL port.
- Keep TEST_DB_SWITCH false.
- Run seeders only by name with `--class`, and only `RoleSeeder` on a server. `DatabaseSeeder` is empty on purpose, and `TestUserSeeder` has a known password.
- Restore test: load a backup into a scratch database before you ever need it.
