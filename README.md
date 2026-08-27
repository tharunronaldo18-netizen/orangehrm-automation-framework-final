# OrangeHRM Automation Framework

End-to-end and API-level automation for the OrangeHRM employee lifecycle
(authentication → creation → role-based validation → update → API
verification → deletion), built with Playwright + TypeScript, integrated
into a GitHub Actions CI pipeline, and complemented with k6 performance
tests.

## Stack

| Concern              | Choice                          | Why |
|----------------------|----------------------------------|-----|
| E2E + API testing     | Playwright (TypeScript)          | Native auto-waiting, tracing, video/screenshot capture, sharding, and a real API request context that can share cookies with the browser — needed since this app has no public token-based API. |
| CI                    | GitHub Actions                   | Native artifact handling, matrix-based sharding, good free tier for a demo pipeline. |
| Performance           | k6                                | Scriptable, has native threshold assertions and HTML reporting, works well for both form-based (login) and JSON API (employee creation) load profiles. |

## Project structure

```
├── .github/workflows/ci.yml     # CI pipeline: install → test (sharded) → merge report → artifacts
├── config/                      # Environment-based config (qa/staging/prod)
├── src/
│   ├── pages/                   # Page Object Model
│   ├── api/                     # Internal-API client + Employee API wrapper
│   ├── utils/                   # Config, data factory, logger, retry helper
│   └── types/                   # Shared TypeScript interfaces
├── tests/
│   ├── e2e/                     # Full UI-driven lifecycle
│   ├── api/                     # API-only specs
│   └── fixtures/                # Custom Playwright fixtures (POM wiring, auth, API client)
├── k6/                          # Performance tests (login, employee creation)
└── playwright.config.ts
```

## Key design decisions

**No public API — internal API reuse for verification.** OrangeHRM's
community edition doesn't ship a documented, token-based REST API. Rather
than fabricate one, `ApiClient` extracts the authenticated browser session's
cookies and reuses them against the same internal `/api/v2/*` endpoints the
Vue frontend calls. This gives genuine API-level verification (bypassing the
UI to check persisted state) without pretending an API exists that doesn't.

**Role-based validation as a real access-control check, not just a UI
check.** The new employee's ESS login is exercised in a *separate browser
context* and asserted to have zero visibility of the Admin menu item — this
tests actual authorization, not just "the page rendered".

**Config via environment files + `TEST_ENV`.** `ConfigManager` is a
singleton that loads `config/<TEST_ENV>.env` and falls back to real
`process.env` values, so CI secrets always win over anything committed, and
local devs can just edit `config/qa.env`.

**Retries are layered, not blanket.** Playwright's own locator auto-waiting
handles most "flakiness" for free. `RetryHelper.retry()` is reserved for
higher-level business actions (e.g., "read back a record we just wrote")
where a brief propagation delay is expected and legitimate — it is *not*
used to paper over assertions that should just fail.

**Tagging strategy.** Tests are tagged inline (`@smoke`, `@regression`,
`@negative`, `@api-only`, `@e2e`) and filtered via `--grep` in `package.json`
scripts, so CI can run a fast `@smoke` subset on every PR and the full
`@regression` suite on merges/nightly without maintaining separate test
files per tier.

**Parallelization.** `fullyParallel: true` locally, and CI shards the suite
3-ways via a workflow matrix (`--shard=N/3`), each shard uploading a "blob"
report that a final job merges into one HTML report — avoiding the common
pitfall of parallel CI jobs clobbering each other's report output.

## Flaky test detection & mitigation

**Detection:**
- CI retries are capped at 2 and reported separately from first-attempt
  passes (Playwright's JSON reporter records `retry` count per test) — a
  test that only passes on retry across multiple runs is flagged for review
  rather than treated as "passing".
- Trace files (`trace: 'on-first-retry'`) are only generated for tests that
  actually needed a retry, so triage starts from the trace viewer instead of
  re-running blind.

**Mitigation:**
- Prefer Playwright's built-in auto-waiting/locators over any manual
  `waitForTimeout` (hard sleeps are treated as a code-review flag).
- Every test generates its own unique data via `DataFactory` — no shared
  fixtures/state between tests, which removes the single biggest source of
  "flaky" failures that are actually just test-order or data collisions.
- Genuinely environment-flaky tests (e.g. a known-slow third-party widget)
  are tagged `@flaky` and excluded from the required CI gate but still run
  and reported on, so they're visible without blocking merges — with an
  explicit owner and follow-up ticket, not left indefinitely quarantined.
- Root cause first, retry second: retries mask symptoms, traces/videos find
  causes. The CI pipeline captures both so retries are a stopgap, not a fix.

## Reporting & observability

- **HTML report**: merged Playwright HTML report published as a CI artifact
  (`playwright-html-report`), viewable via `npx playwright show-report`.
- **Screenshots/video on failure**: `screenshot: 'only-on-failure'`,
  `video: 'retain-on-failure'` — kept for failing tests only, uploaded as
  `failure-artifacts-*`.
- **k6 HTML reports**: written per-run to `k6-results/*.html` via
  `k6-reporter`, uploaded as `k6-performance-reports`.
- **Environment-based execution**: any run can target a different
  environment via `TEST_ENV=staging npx playwright test` locally, or the
  `environment` input on the manually-triggered CI workflow.

## Setup

```bash
git clone <this-repo>
cd orangehrm-automation-framework
npm ci
npx playwright install --with-deps chromium
cp .env.example .env   # or edit config/qa.env directly
```

## Running tests

```bash
npm run test              # full suite
npm run test:smoke        # fast @smoke subset
npm run test:regression   # full @regression suite
npm run test:e2e          # UI lifecycle only
npm run test:api          # API-only specs
npm run test:shard1       # 1 of 3 local shards (mirrors CI)
npm run report            # open last HTML report

npm run k6:login          # k6 login load test
npm run k6:employee       # k6 employee creation load test
```

Target a different environment:

```bash
TEST_ENV=staging npm run test
```

## CI pipeline

On every push/PR to `main`, GitHub Actions:
1. Installs dependencies (`npm ci`) and Playwright browsers.
2. Runs the suite across 3 parallel shards.
3. Uploads a per-shard blob report and, on failure, screenshots/videos/traces.
4. Merges all shard reports into a single HTML report artifact.

k6 performance tests run on manual dispatch (`workflow_dispatch`) against a
chosen environment, to avoid load-testing a shared demo instance on every
commit.

## Known limitations / assumptions

- Tests target OrangeHRM's public demo instance
  (`opensource-demo.orangehrmlive.com`), which is a shared, periodically
  reset environment — expect occasional unrelated state from other users.
- Internal `/api/v2/*` endpoint shapes are based on the current OrangeHRM
  OS 5.x frontend and may shift between versions; the `EmployeeApi` wrapper
  isolates that risk to one file.
- k6 scripts assume standard OrangeHRM CSRF form-token behavior; if fronted
  by a WAF/bot-protection layer in a real deployment, token scraping logic
  would need adjusting.

## Notes from the first real CI run

Worth calling out explicitly, since it's a good illustration of why the
above risks were flagged rather than assumed away: the first real CI run
against the live demo passed every test except one —
`assertEmployeeDeleted` initially assumed a "not found" employee always
returns a plain HTTP 404. It doesn't; OrangeHRM's internal API can also
return a 2xx with an empty/null `data` payload. `EmployeeApi.assertEmployeeDeleted`
was updated to treat both shapes as "not found" instead of guessing one.
This is the kind of thing a live CI run against a real environment catches
that no amount of code review would — which is the whole point of running
it before submitting rather than just reading the code and assuming it's right.
