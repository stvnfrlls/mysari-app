# [1.27.0](https://github.com/stvnfrlls/mysari-app/compare/v1.26.1...v1.27.0) (2026-10-04)


### Features

* show yesterday's summary on the dashboard ([9a90008](https://github.com/stvnfrlls/mysari-app/commit/9a9000807da445a8133cf748c9a4f565e7153d42))

## [1.26.1](https://github.com/stvnfrlls/mysari-app/compare/v1.26.0...v1.26.1) (2026-10-04)


### Bug Fixes

* run the app in Asia/Manila time ([ea029ac](https://github.com/stvnfrlls/mysari-app/commit/ea029acf06cc79f5d76f600e30643f8f90d2de2b))

# [1.26.0](https://github.com/stvnfrlls/mysari-app/compare/v1.25.0...v1.26.0) (2026-10-04)


### Features

* poll top sellers and recent activity on the dashboard ([733ba0d](https://github.com/stvnfrlls/mysari-app/commit/733ba0d2c6fc0558b967f274dcc9dc92e51cb468))
* prune old sales exports daily ([28c9cf9](https://github.com/stvnfrlls/mysari-app/commit/28c9cf96e734f7a7d163d6b8b788f59abe8a0585))

# [1.25.0](https://github.com/stvnfrlls/mysari-app/compare/v1.24.0...v1.25.0) (2026-10-03)


### Features

* queue sales report exports ([a902c73](https://github.com/stvnfrlls/mysari-app/commit/a902c73639aeb160b1cb89a273437f9d5cfa1cfa))

# [1.24.0](https://github.com/stvnfrlls/mysari-app/compare/v1.23.1...v1.24.0) (2026-10-03)


### Features

* queue low-stock alerts and refresh the dashboard live ([1818af2](https://github.com/stvnfrlls/mysari-app/commit/1818af22cb89d811da911e9c30d202c07aedc429))

## [1.23.1](https://github.com/stvnfrlls/mysari-app/compare/v1.23.0...v1.23.1) (2026-10-03)


### Bug Fixes

* ignore invalid report dates instead of returning a 500 ([961007d](https://github.com/stvnfrlls/mysari-app/commit/961007d5797123ed0e55a3c812423ba6851b16a6))

# [1.23.0](https://github.com/stvnfrlls/mysari-app/compare/v1.22.1...v1.23.0) (2026-10-03)


### Bug Fixes

* deny dotfiles, run only index.php and add security headers in nginx ([82cf687](https://github.com/stvnfrlls/mysari-app/commit/82cf687c628bc5d1ae6bf077502a30c48916a5c6))


### Features

* record who took each payment and let owners void payments ([aab71a9](https://github.com/stvnfrlls/mysari-app/commit/aab71a95d95d134649f2c4905a2f1294ce375cf4))

## [1.22.1](https://github.com/stvnfrlls/mysari-app/compare/v1.22.0...v1.22.1) (2026-10-03)


### Bug Fixes

* cap product price and stock values ([7a71864](https://github.com/stvnfrlls/mysari-app/commit/7a718643ebfb9eaca2eea991fb5247d7239c6f20))
* default APP_DEBUG to false in .env.example ([3a6c0e8](https://github.com/stvnfrlls/mysari-app/commit/3a6c0e8a79f40bbff1a96cdfe0eb7415c9d5ecd8))
* end other sessions on password reset and require letters and numbers ([50e369b](https://github.com/stvnfrlls/mysari-app/commit/50e369bcce7560fca4dc74fb8c75e57ac0f407db))
* publish mysql port on localhost only ([5d17c29](https://github.com/stvnfrlls/mysari-app/commit/5d17c29658065144c20d08c05f9d02ee2435ed57))
* refuse sales whose total exceeds the column limit ([77c6117](https://github.com/stvnfrlls/mysari-app/commit/77c611758f51ef2f7a227a926cad7c7dac7c9b94))
* refuse to delete a product that has sales ([495988b](https://github.com/stvnfrlls/mysari-app/commit/495988bbd3921f776e1d84350ab0e4ecdd0f0b2b))
* restrict product edit and sales reports to owners ([9fe7dab](https://github.com/stvnfrlls/mysari-app/commit/9fe7dab645004e88a0abc16394542c44a0cbce42))
* restrict test database switch to local and testing environments ([7e11dfb](https://github.com/stvnfrlls/mysari-app/commit/7e11dfbd8b353d9c81d0191ec8c8d84efa79b6fc))
* throttle login attempts per email and IP ([9faff30](https://github.com/stvnfrlls/mysari-app/commit/9faff307aad40aafc13dcf95c30d75c66e8eefc2))

# [1.22.0](https://github.com/stvnfrlls/mysari-app/compare/v1.21.0...v1.22.0) (2026-10-03)


### Features

* add cash and credit split, utang total and top sellers to the dashboard ([d40d0f4](https://github.com/stvnfrlls/mysari-app/commit/d40d0f4997e77724e9d4ddacc81e9740b288aa68))

# [1.21.0](https://github.com/stvnfrlls/mysari-app/compare/v1.20.0...v1.21.0) (2026-10-03)


### Features

* paginate the customers list ([81f4b2b](https://github.com/stvnfrlls/mysari-app/commit/81f4b2b580b1896ece3853ba5a260c7dec1d86b7))

# [1.20.0](https://github.com/stvnfrlls/mysari-app/compare/v1.19.0...v1.20.0) (2026-10-03)


### Bug Fixes

* restore the transactions list that was overwritten by the products pager change ([6a530c2](https://github.com/stvnfrlls/mysari-app/commit/6a530c27344789f7176a22863d825f46105b9840))


### Features

* paginate the products list with a themed pager ([6958111](https://github.com/stvnfrlls/mysari-app/commit/6958111d29fa7c89d76e4eee93c8ce5b49673e8d))

# [1.19.0](https://github.com/stvnfrlls/mysari-app/compare/v1.18.0...v1.19.0) (2026-10-03)


### Features

* add customer edit and owner-only delete ([a8c3626](https://github.com/stvnfrlls/mysari-app/commit/a8c36261a2e0bc0ad9bc843bb5980a0d41f2dd54))

# [1.18.0](https://github.com/stvnfrlls/mysari-app/compare/v1.17.0...v1.18.0) (2026-10-03)


### Features

* add user deactivation and password reset ([2eb068b](https://github.com/stvnfrlls/mysari-app/commit/2eb068bd82db4d68b18792aeef3a6b496f3442f1))

# [1.17.0](https://github.com/stvnfrlls/mysari-app/compare/v1.16.0...v1.17.0) (2026-10-03)


### Features

* add CSV export for the sales report ([d82a928](https://github.com/stvnfrlls/mysari-app/commit/d82a9282ef1c5f839f917fba2e81a7af0617cae4))

# [1.16.0](https://github.com/stvnfrlls/mysari-app/compare/v1.15.0...v1.16.0) (2026-10-03)


### Features

* add product search by name or SKU ([23a47c2](https://github.com/stvnfrlls/mysari-app/commit/23a47c23af6547e60a2255d7162b0932070fa9f9))

# [1.15.0](https://github.com/stvnfrlls/mysari-app/compare/v1.14.0...v1.15.0) (2026-10-03)


### Features

* add owner-only user management screen ([58fab16](https://github.com/stvnfrlls/mysari-app/commit/58fab168c202295f2876917709d92db9c666c3ea))

# [1.14.0](https://github.com/stvnfrlls/mysari-app/compare/v1.13.0...v1.14.0) (2026-10-03)


### Features

* add owner and cashier roles, restrict void and product delete to owners ([4c380c4](https://github.com/stvnfrlls/mysari-app/commit/4c380c447af5e0e30889d9f2014be9e2f5e53f89))

# [1.13.0](https://github.com/stvnfrlls/mysari-app/compare/v1.12.0...v1.13.0) (2026-10-03)


### Features

* add main navigation and redirect logged-in users from welcome page to dashboard ([d1e5040](https://github.com/stvnfrlls/mysari-app/commit/d1e504081b86700d8698ed9584800bbde68842ce))
* add multi-item sales with cart form ([7836c14](https://github.com/stvnfrlls/mysari-app/commit/7836c14a85afc8c65410e968e7690e197d54914b))
* add product cost price and profit in sales report ([ce47156](https://github.com/stvnfrlls/mysari-app/commit/ce47156dbf92b5f4e943b3d4e57afae87c58a282))

# [1.12.0](https://github.com/stvnfrlls/mysari-app/compare/v1.11.0...v1.12.0) (2026-10-03)


### Features

* add utang (credit) tracking with customers and payments ([f587d8c](https://github.com/stvnfrlls/mysari-app/commit/f587d8c947981f809d170ccfe8df289594d3200a))
* add void sale, restock, and stock movement history ([1328723](https://github.com/stvnfrlls/mysari-app/commit/1328723e54be5af10bb156d2d4018868f5442e59))

# [1.11.0](https://github.com/stvnfrlls/mysari-app/compare/v1.10.0...v1.11.0) (2026-09-27)


### Features

* add low-stock view and sales report with e2e coverage ([765cc82](https://github.com/stvnfrlls/mysari-app/commit/765cc82f45923c15477328f9eb4383f027770ed4))

# [1.10.0](https://github.com/stvnfrlls/mysari-app/compare/v1.9.0...v1.10.0) (2026-09-27)


### Features

* **docker:** add horizontal scaling support with Redis-backed sessions ([665e282](https://github.com/stvnfrlls/mysari-app/commit/665e2824985fcb25d10209535c774c2afbe4eae0))
* **docker:** make app service load-balancer ready ([4ce70a4](https://github.com/stvnfrlls/mysari-app/commit/4ce70a4c3a9bbf2ba6fe20a2008d62642de4e657))

# [1.9.0](https://github.com/stvnfrlls/mysari-app/compare/v1.8.1...v1.9.0) (2026-09-27)


### Features

* add sales transaction recording with live dashboard stats ([1891c1b](https://github.com/stvnfrlls/mysari-app/commit/1891c1b385de97d57eed73a22baf539acfa6d920))

## [1.8.1](https://github.com/stvnfrlls/mysari-app/compare/v1.8.0...v1.8.1) (2026-09-27)


### Bug Fixes

* remove unused testing database init script causing CI db startup failure ([ba0d12a](https://github.com/stvnfrlls/mysari-app/commit/ba0d12a02eb564bcd7c070458bb27b596c148be7))

# [1.8.0](https://github.com/stvnfrlls/mysari-app/compare/v1.7.0...v1.8.0) (2026-09-27)


### Features

* add product management with CRUD and low stock tracking ([fc44457](https://github.com/stvnfrlls/mysari-app/commit/fc444571d99a2d27dd22598bad5cd41e057e857d))

# [1.7.0](https://github.com/stvnfrlls/mysari-app/compare/v1.6.1...v1.7.0) (2026-09-27)


### Features

* add dashboard UI and playwright e2e tests for login flow ([170779c](https://github.com/stvnfrlls/mysari-app/commit/170779c45fd522781e76d4e8d4b546fd2fff54a7))

## [1.6.1](https://github.com/stvnfrlls/mysari-app/compare/v1.6.0...v1.6.1) (2026-09-27)


### Bug Fixes

* **security:** pin CI actions to SHAs, harden Dockerfile, enforce npm release age ([4e6336f](https://github.com/stvnfrlls/mysari-app/commit/4e6336fdc1484f52171315198211393648631867))

# [1.6.0](https://github.com/stvnfrlls/mysari-app/compare/v1.5.0...v1.6.0) (2026-09-26)


### Features

* add database readiness check to CI workflow and update Semgrep job configuration ([83ffd32](https://github.com/stvnfrlls/mysari-app/commit/83ffd3229dbca55275e76fd66df380d06fae73af))
* add Semgrep scanning for security vulnerabilities and audit PHP dependencies ([f7713f3](https://github.com/stvnfrlls/mysari-app/commit/f7713f38e2db3ce8a569523b64dce25bfb69aca7))
* enhance database service health checks in Docker Compose and remove redundant wait step in CI ([5e4b8a1](https://github.com/stvnfrlls/mysari-app/commit/5e4b8a1ee95b2eae721f49c52d57bf904bdfa723))
* update Semgrep job permissions to include actions read access ([641912f](https://github.com/stvnfrlls/mysari-app/commit/641912f05dafebecb7708dce401b5fa96321f724))

# [1.5.0](https://github.com/stvnfrlls/mysari-app/compare/v1.4.0...v1.5.0) (2026-09-26)


### Features

* enhance CI workflow by adding Playwright version retrieval and caching for browsers and Composer dependencies ([ef854da](https://github.com/stvnfrlls/mysari-app/commit/ef854da3e19002246920a3ebe8940994d5dcf7dd))

# [1.4.0](https://github.com/stvnfrlls/mysari-app/compare/v1.3.0...v1.4.0) (2026-09-26)


### Features

* update CI workflow to use latest action versions and add HTML reporter for Playwright tests ([7d4ece0](https://github.com/stvnfrlls/mysari-app/commit/7d4ece030301c38cea45b1f832ac4be3096e94ab))

# [1.3.0](https://github.com/stvnfrlls/mysari-app/compare/v1.2.0...v1.3.0) (2026-09-26)


### Features

* consolidate CI workflows by removing old Playwright and release configurations and adding a unified test and release workflow ([4a4612c](https://github.com/stvnfrlls/mysari-app/commit/4a4612cc3a5cf1f1e2fa6e7c17184ef90bf5202a))

# [1.2.0](https://github.com/stvnfrlls/mysari-app/compare/v1.1.0...v1.2.0) (2026-09-26)


### Features

* update environment configuration and enhance Playwright workflow ([3d66b4b](https://github.com/stvnfrlls/mysari-app/commit/3d66b4ba870cf59984ce78bd9f70275d2d53b898))

# [1.1.0](https://github.com/stvnfrlls/mysari-app/compare/v1.0.1...v1.1.0) (2026-09-26)


### Features

* add login authentication and landing page ([d9c0783](https://github.com/stvnfrlls/mysari-app/commit/d9c078393d6a9ab5265928d55f4d6e96683a9bdc))
* add Playwright testing framework and implement login flow tests ([a442f6e](https://github.com/stvnfrlls/mysari-app/commit/a442f6e00c7034a80e503239117944983e5c2c8e))

## [1.0.1](https://github.com/stvnfrlls/mysari-app/compare/v1.0.0...v1.0.1) (2026-09-26)


### Bug Fixes

* grant issues and pull-requests write permissions for release workflow ([7600b23](https://github.com/stvnfrlls/mysari-app/commit/7600b23848abc10d0269d34a203ddc365db4effd))

# 1.0.0 (2026-09-26)


### Bug Fixes

* bump CI node version to 22 for semantic-release compatibility ([2577bfa](https://github.com/stvnfrlls/mysari-app/commit/2577bfafd35d918447a32cd9d91c422ba627c708))
* rename release config to .cjs for ESM compatibility ([fadc621](https://github.com/stvnfrlls/mysari-app/commit/fadc621ccfdb4cc2dd7561b759408c6ff9bcd49f))


### Features

* add GitHub Actions workflow for semantic release ([4a65a17](https://github.com/stvnfrlls/mysari-app/commit/4a65a179ef75f8b9b3e4f16bf825efdec8bfde20))
* implement login view and layout structure ([3daa01d](https://github.com/stvnfrlls/mysari-app/commit/3daa01d8e18eb3e04a650a4e904a6b3965b62f27))
* initial commit ([fa3f850](https://github.com/stvnfrlls/mysari-app/commit/fa3f850ce3ecf56eefd361297432531659044c30))
