# MySari App

A small web app for a sari-sari store: point of sale, stock, customer credit (utang), sales reports and daily summaries.

- Repo: `stvnfrlls/mysari-app`
- Stack: Laravel 13, MySQL, Redis, Docker, Blade views, Playwright end-to-end tests
- Releases: semantic-release (see [Commits and releases](#commits-and-releases))
- Status: feature complete for a small store. Work now is known gaps and deploy preparation. See [Handoff](#handoff).

---

## Contents

1. [Features](#features)
2. [Roles and permissions](#roles-and-permissions)
3. [Architecture](#architecture)
4. [Getting started (development)](#getting-started-development)
5. [Daily commands](#daily-commands)
6. [Testing](#testing)
7. [Continuous integration](#continuous-integration)
8. [Commits and releases](#commits-and-releases)
9. [Deployment and backups](#deployment-and-backups)
10. [Data model](#data-model)
11. [Documentation index](#documentation-index)
12. [Handoff](#handoff)

---

## Features

**Sales**
- Record a sale with one or many items. Duplicate products in a sale are merged so the stock check sees the combined quantity.
- Stock is locked and checked inside a database transaction. A sale that exceeds stock is refused and saves nothing.
- Credit sales (utang): tick the credit checkbox and pick a customer.
- Void a sale (owner only). Stock is restored and a `void` stock movement is logged.
- Limits on input sizes and on the sale total.

**Products and stock**
- Product list with search by name or SKU, and pagination.
- Optional cost price, snapshotted onto each sale line, so a later cost change does not rewrite past profit.
- Restock with a stock history per product (sale, restock, void and adjustment movements).
- Low stock threshold, a low stock report, and low stock alerts that open and resolve automatically.
- A product that has sales cannot be deleted.

**Customers and utang**
- Add and edit customers. Owners can delete a customer who has no sales or payments.
- Record payments against a customer balance. A payment larger than the balance is refused.
- Payments record who took them. Owners can void a payment.
- Customer balance = active credit sales minus active payments.

**Reports and dashboard**
- Dashboard: today's totals, top sellers, recent activity, low stock alerts and a "Yesterday" panel. It refreshes itself every 10 seconds (it skips polling while the tab is hidden).
- Sales report (owner only) with a date range, revenue, cost and profit. It also refreshes every 10 seconds.
- CSV export of the sales report, built by a queued job. The CSV is protected against spreadsheet formula injection. Exports are deleted after 7 days.
- Daily summaries: a job builds yesterday's totals at 00:10 Manila time. Owners get a paginated history page.

**Users**
- Owner-only Users screen: add users, change role, deactivate and reactivate, reset a password.
- A deactivated user is logged out and cannot log in. Resetting a password logs out that user's other sessions.
- An owner cannot demote or deactivate themselves.

**Security**
- Login throttle, `AuthenticateSession`, owner-only routes, delete guards, input limits, nginx hardening, `.dockerignore`.
- HSTS and trusted proxies for production (HSTS is only sent when the proxy marks the request as https).
- A user who has sales cannot be deleted (`transactions.user_id` is `restrictOnDelete`).

---

## Roles and permissions

Roles come from the spatie permission tables: `owner` and `cashier`.

| Action | Cashier | Owner |
|---|---|---|
| Record sales, view transactions | yes | yes |
| View products, low stock, stock history, restock | yes | yes |
| Create, edit, delete products | no | yes |
| Void a sale | no | yes |
| Add and edit customers, record payments | yes | yes |
| Delete a customer, void a payment | no | yes |
| Sales report, exports, daily summaries | no | yes |
| Users screen | no | yes |

Cashiers get a 403 on owner routes, and the matching buttons and links are hidden from them.

---

## Architecture

Docker compose services:

| Service | Container | Purpose |
|---|---|---|
| `app` | `mysari-app-app-1` | PHP-FPM, Laravel |
| `webserver` | `MySari-App-nginx` | nginx |
| `db` | `MySari-App-mysql` | MySQL |
| `redis` | `MySari-App-redis` | queues and cache |
| `worker` | `mysari-app-worker-1` | runs queued jobs |
| `scheduler` | `mysari-app-scheduler-1` | runs scheduled jobs |

Queued and scheduled jobs:
- `CheckLowStock` opens and resolves low stock alerts after sales, voids and stock edits.
- `BuildSalesExport` builds the CSV export.
- `PruneOldExports` runs daily and deletes exports older than 7 days.
- `BuildDailySummary` runs daily at 00:10 (`routes/console.php`). A null date means yesterday.

Time zone: `config/app.php` uses `env('APP_TIMEZONE', 'Asia/Manila')`. The dashboard's "today", the daily summary and the scheduler all use Manila time.

---

## Getting started (development)

Run everything from WSL or Linux inside the project folder. Docker and Docker Compose are required.

1. Copy the environment file and start the stack:
   ```bash
   cp .env.example .env
   docker compose up -d --build
   ```
2. Generate the app key (`.env.example` ships with a blank `APP_KEY` on purpose):
   ```bash
   docker compose exec app php artisan key:generate
   ```
3. Run the migrations:
   ```bash
   docker compose exec app php artisan migrate
   ```
4. Create the roles and the two test accounts:
   ```bash
   docker compose exec app php artisan db:seed --class=TestUserSeeder
   ```
   This creates `testuser@example.com` (owner) and `cashier@example.com` (cashier). **Both use the known password `password123`. Development only, never on a server.**
5. Open http://localhost:8000 and log in.

Notes:
- Run seeders by name with `--class`. `DatabaseSeeder` is intentionally empty.
- Artisan commands that write files should run as www-data: `docker compose exec -u www-data app php artisan ...`
- For tinker as www-data, also pass `-e HOME=/tmp`, otherwise psysh prints a warning and the command may silently not run.
- `DemoDataSeeder.php`, if you have it locally, is excluded through `.git/info/exclude` and must not be committed.

---

## Daily commands

```bash
docker compose up -d                                   # start
docker compose ps                                      # status
docker compose exec app php artisan migrate            # migrations
docker compose exec -u www-data app php artisan make:controller FooController   # new files
sudo chown -R $USER:$USER app database resources       # after make:* commands
docker compose restart worker scheduler                # after changing job code
```

Backfill a daily summary by hand:

```bash
docker compose exec -u www-data -e HOME=/tmp app php artisan tinker --execute="App\Jobs\BuildDailySummary::dispatchSync('2026-10-03');"
```

---

## Testing

Tests are Playwright end-to-end specs in `tests/e2e`. At v1.29.3 there are 147 specs and a full run takes about 2.5 to 3 minutes.

### Setup

- Node dependencies installed (`npm install`).
- A `.env.playwright` file that provides `TEST_USER_EMAIL` and `TEST_USER_PASSWORD` (the owner test account).
- `.env` must have `TEST_DB_SWITCH=true`. `.env.example` has `false`.
- The stack must be running (`docker compose up -d`).

### Running

```bash
npx playwright test                                 # full suite, 4 workers
PW_WORKERS=1 npx playwright test                    # serial
npx playwright test tests/e2e/products.spec.js      # one file
```

Run the full suite before every commit.

### How the test databases work

- Each Playwright worker uses its own database, `sariapp_test_0` to `sariapp_test_7`. `tests/global-setup.js` creates them, runs `migrate:fresh` and `TestUserSeeder`.
- Browser requests choose the database through a `test_db` cookie, read by `app/Http/Middleware/UseTestDatabase.php`. It only acts when all of these hold: `config/testdb.php` is enabled (`TEST_DB_SWITCH=true`), `APP_ENV` is `local` or `testing`, and the name matches `^sariapp_test_\d{1,2}\z`. It also forces `queue.default` to `database`.
- Artisan calls inside specs get `DB_DATABASE` and `QUEUE_CONNECTION=database` through `tests/support/exec.js`. That helper rewrites the prefix `docker compose exec -T app`, so commands must start with exactly that.
- `php artisan test:reset-data` truncates payments, stock movements, transaction items, transactions, low stock alerts, jobs, report exports, customers, products and daily summaries (never users). It also deletes the export files listed in its own `report_exports` rows. Run by hand it hits the dev database, so scope it: `-e DB_DATABASE=sariapp_test_0`.

### Rules for writing specs

- Import `test` and `expect` from `tests/fixtures.js`, and `execSync` and `workerDb` from `tests/support/exec.js`.
- Extra browser contexts must add the `test_db` cookie themselves.
- Specs that need a queued job call `docker compose exec -T app php artisan queue:work --stop-when-empty`. If the job writes files, wrap it as `su -s /bin/sh www-data -c "..."`.
- Do not check export files on the host with `fs.existsSync`. On CI the folder belongs to www-data. Use `docker compose exec -T app test -f /var/www/storage/app/private/exports/<name>`.
- All workers share one exports folder and every test database starts export ids at 1. Find an export through the worker's own database, never by id prefix or folder diff.
- After opening a second page in the same context, call `page.bringToFront()`, because polling skips hidden tabs.
- Shell commands go in the terminal, never in a spec file.
- Cashiers cannot create products. If a spec needs a product while logged in as a cashier, create it in a separate owner context (see `createProductAsOwner` in `tests/e2e/roles.spec.js`).
- A race spec that fires two requests at once passes without the fix and proves nothing. `tests/e2e/void-payment-race.spec.js` instead holds the customer row lock in a background process and checks that the void waits for it.

---

## Continuous integration

GitHub Actions, `.github/workflows/ci.yml`, with three jobs: test, semgrep and release.

- The test job copies `.env.example` to `.env`, sets `TEST_DB_SWITCH=true`, runs `key:generate` and the migrations, then the Playwright suite.
- The release job only runs after the tests pass.
- Passing locally does not guarantee a green CI run, because the environments differ.

---

## Commits and releases

semantic-release reads commit messages:

| Type | Result |
|---|---|
| `feat:` | minor release |
| `fix:` | patch release |
| `chore:`, `test:`, `docs:`, `ci:` | no release |

- The commit type must match what shipped.
- Stage explicit paths. Never `git add .`. Run `git status --short` first.
- The release bot commits to `main`, so run `git pull --rebase` before `git push`.
- In bash, use single quotes around patterns that contain `!`.
- Press `q` to leave git's pager when `git diff` shows `(END)`.

Last release confirmed: v1.29.3.

---

## Deployment and backups

Full first-deploy and later-deploy steps are in [`docs/DEPLOY.md`](docs/DEPLOY.md). Summary of the production setup:

- `docker-compose.prod.yml`: no bind mounts, `--no-dev` install, a `storage` named volume, the database port is not published, nginx listens on `127.0.0.1:8000` only, and `env_file` is `.env.production`.
- Command prefix: `docker compose --env-file .env.production -f docker-compose.prod.yml`. Do not run it on the dev machine without stopping the dev stack and adding `-p mysari-prod`.
- `.env.production.example` is the committed template. `.env.production` is gitignored and must never be committed.
- Production needs `TRUSTED_PROXIES=*` and a TLS proxy that sends `X-Forwarded-Proto: https`. Keep `TEST_DB_SWITCH=false`.
- `APP_KEY`: a real key was committed in the past, so treat that old key as burned. Production must generate its own.
- First owner: run `RoleSeeder` before any user exists (it gives the owner role to every user that has no role), then create the owner with the tinker command in `docs/DEPLOY.md`, which reads the password from a hidden prompt.
- Never run a plain `db:seed` on a server. Only `RoleSeeder`, by name.

Backups: `scripts/backup-db.sh` dumps the database from the db container, gzips it into `~/mysari-backups`, and keeps 14 days. Schedule it from cron on the host (for example 02:30) and copy the backups off the server.

Restore test (done once on dev, repeat on the server once real data exists):

```bash
docker compose exec -T db sh -c 'mysql -uroot -p"$MYSQL_ROOT_PASSWORD" -e "CREATE DATABASE sariapp_restore_test"'
zcat ~/mysari-backups/<file>.sql.gz | docker compose exec -T db sh -c 'mysql -uroot -p"$MYSQL_ROOT_PASSWORD" sariapp_restore_test'
# compare row counts with the live database, then:
docker compose exec -T db sh -c 'mysql -uroot -p"$MYSQL_ROOT_PASSWORD" -e "DROP DATABASE sariapp_restore_test"'
```

The dump has no `CREATE DATABASE` or `USE` lines, so it cannot overwrite the live database.

---

## Data model

Names that are easy to get wrong:

- **products**: name, sku, price (decimal 10,2), `cost_price` (nullable), `stock_quantity`, low_stock_threshold
- **transactions**: user_id (`restrictOnDelete`), total (decimal 10,2), customer_id (nullable), is_credit, voided_at, void_reason
- **transaction_items**: transaction_id, product_id (FK, no cascade), quantity, unit_price, `unit_cost` (nullable snapshot)
- **stock_movements**: product_id (cascade), transaction_id, type (`sale`, `restock`, `void`, `adjustment`), quantity_change, note
- **customers**: name, phone
- **payments**: customer_id, amount, note, user_id (nullable), voided_at, void_reason, voided_by
- **users**: name, email, password, `deactivated_at` (not in `$fillable`, use `forceFill`). Roles come from the spatie tables.
- **low_stock_alerts**: product_id (cascade), stock_quantity, resolved_at (nullable)
- **report_exports**: user_id (nullable), from_date, to_date, status (`pending`, `ready`, `failed`), path (relative to the `local` disk, `exports/<id>-<uuid>.csv`), error, finished_at
- **daily_summaries**: summary_date (unique), total_sales, transactions_count, cash, credit, `utang_outstanding` (balance as of the end of that day)

Helpers: `Transaction::active()`, `Payment::active()` (both `whereNull('voided_at')`), `isVoided()`, `Customer::balance()`, `User::isDeactivated()`, `Product::isLowStock()`, `LowStockAlert::open()`, `ReportExport::isReady()`, `filename()`.

Known pitfall: the `$fillable` lists of `Transaction` and `TransactionItem` got swapped twice. If inserts fail, check both models first.

---

## Documentation index

| File | What it covers |
|---|---|
| `README.md` | this file |
| `docs/DEPLOY.md` | first deploy, later deploys, rules for running artisan and seeders on a server |
| `scripts/backup-db.sh` | database backup script |
| `.env.example` | development environment template |
| `.env.production.example` | production environment template |
| `tests/global-setup.js`, `tests/support/exec.js`, `tests/fixtures.js` | test database and helper setup |

---

## Handoff

State as of 4 October 2026. Verify with `git status --short` and `git log origin/main..` before relying on it.

### Done

- Features listed above, all covered by Playwright specs.
- Security round and production preparation (compose file, env template, HSTS, trusted proxies, backup script, deploy doc).
- Known gaps closed:
  1. A user with sales can no longer be deleted (`fix:`, v1.29.1).
  2. A void now locks the customer row first, so it cannot race a payment into a negative balance (`fix:`, v1.29.2).
  3. Only owners can create products. Cashiers keep recording payments (`fix:`, v1.29.3).
  4. `test:reset-data` no longer leaves export files on disk.
- The backup restore and the owner-creation command in `docs/DEPLOY.md` were tested on the dev stack against scratch databases.
- `DatabaseSeeder` was emptied so a plain `db:seed` cannot create a user. This was a `chore:` change. Confirm it is committed and pushed.

### Open items

- **Refund decision:** if a customer pays off a credit sale and the owner then voids that sale, the balance goes negative. This is a business rule, not a race. It needs a decision on refunds.
- **First real deploy:** not done yet. Hosting was never decided. The prod compose file assumes a VPS behind a TLS proxy. A managed database would change the compose file and the backup script. The production compose file and `.env.production` flow have not been exercised yet.
- **Restore test on real data:** repeat it on the server once real data exists.
- **Dependabot:** six alerts for bundled npm packages that are dev-only (inside semantic-release's npm CLI). The plan was to dismiss them as "Vulnerable code is not actually used", and `braces` as "Risk is tolerable to this project". Do not run `npm audit fix --force`. Recheck `npm audit` about a month after early October 2026. `composer audit` was clean.
- **Cache settings:** `.env.example` has `CACHE_DRIVER=redis` next to `CACHE_STORE=database`. Laravel 13 should read `CACHE_STORE`, and the login throttle spec may depend on it. Left alone on purpose.
- **Not yet checked:** how the app looks on a phone, and what happens when the connection drops mid-sale (there is no offline mode).
- **Cosmetic:** a comment in `docker/php/Dockerfile` has a mangled link, harmless.
- If `Undefined variable $locked` at `CustomerController.php:82` ever returns, investigate then. It appeared once and the current code does not have the problem.

### Reviewed and found fine

`routes/web.php` middleware, `EnsureUserIsActive`, `TransactionController`, `CustomerController::pay`, `UserController`, `DashboardController`, `.gitignore`, `entrypoint.sh`, views (no `{!!` on user data), session config (HttpOnly, lax, `secure` reads `SESSION_SECURE_COOKIE`), `.dockerignore`.

### Decisions

- No new features. The app is feature complete for a small sari-sari store. Reverb was skipped.
- Cashiers keep recording payments. Payments can only be voided by an owner.
- Product creation is owner-only.

### Suggested next steps

1. Confirm the last commit is pushed and CI is green.
2. Decide the refund rule for voiding a paid-off credit sale.
3. Decide hosting, then follow `docs/DEPLOY.md` for the first deploy.
4. Put it in front of one real user and fix what they complain about first.
5. Handle the Dependabot alerts as planned, and recheck in about a month.

### Working conventions

- One implementation step at a time, and no assumptions about code that has not been seen.
- Every feature ends with its Playwright spec and a git commit message.
- Run the full suite before every commit.
