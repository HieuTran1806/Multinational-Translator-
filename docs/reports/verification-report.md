# Verification report — role matrix and Seller removal

**Execution date:** 2026-10-29. Production changes were applied with Flyway V6. This report records only commands actually run in this pass.

## Database production

- Target verified by Neon branch metadata and direct JDBC connection metadata: primary branch `production`, database `neondb`, PostgreSQL 18.6. Connection strings and credentials were not printed.
- Flyway validated six migrations and applied V6 successfully; current schema version is 6.
- Read-only post-check: `SELLER` account count 0; `access_qr.seller_id` absent; Seller index absent; role constraint permits only `ADMIN`/`SUPER_ADMIN`; QR=1, grant=1, usage events=0, audit rows=2; active Admin=1, Super Admin=0; unvalidated foreign keys=0.
- Production was not used for test suite execution or write-based smoke tests.

## Automated checks

| Command | Result |
|---|---|
| `services/backend/mvnw.cmd -f services/backend/pom.xml test` | PASS — 60 unit tests, 0 failures/errors/skips |
| `services/backend/mvnw.cmd -f services/backend/pom.xml -DskipTests test-compile` | PASS after role-contract updates |
| `apps/admin`: `npm test -- --reporter=dot` | PASS — 56 tests across 13 files |
| `apps/admin`: `npm run lint` | PASS |
| `apps/admin`: `npm run build` | PASS |

## Not run / limitations

- Backend integration tests were not run because no verified dedicated test database was available in this execution; they were not pointed at production.
- Web User: 73 tests passed; lint passed with 3 existing Fast Refresh warnings and 0 errors; build passed. Browser role-by-role smoke checks were not run because no browser session/server was started; production has no Super Admin account for privileged live flows.
- No Super Admin account exists in production and no bootstrap credentials were configured in the local environment. Provisioning a privileged account requires an approved credential/bootstrap action; it was not guessed or generated.
- No push, deployment or release was performed.
