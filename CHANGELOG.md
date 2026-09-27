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
