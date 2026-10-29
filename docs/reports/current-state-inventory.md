# Current-state inventory — role matrix / Seller removal

**Snapshot:** 2026-10-29. Repository: `Multitional-Translator-`, branch `main`. This document describes the current tree and the production state verified in this implementation pass; older audit findings are superseded.

## Backend

- `AccountRole` contains only `ADMIN` and `SUPER_ADMIN`; database `ck_account_role` enforces the same set.
- `SecurityConfig` uses specific matchers before `/api/v1/admin/**`: Analytics = `ADMIN`; account management and Audit Log = `SUPER_ADMIN`; other Admin APIs = `ADMIN`; default deny.
- `AdminAccountService` manages only `ADMIN` accounts; create role is fixed to `ADMIN`; target lookup rejects Super Admin accounts. Account list/detail/update/enable-disable/reset-password/soft-delete are exposed through UC10 endpoints.
- QR/grant/usage events remain part of the User access flow; there is no Seller ownership in the current QR entity/DTO/service.
- Seller-only controller/service/repository/DTO/API and seller-scope analytics are not part of the current Java source. V5 remains immutable historical migration; V6 removes its Seller schema from production.

## Web applications

- Web Admin has a shared login/shell for Admin and Super Admin, with role-gated routes and API clients. Admin sees POI/content/media/QR/Analytics; Super Admin sees Accounts/Audit.
- Seller pages/API client/menu/QR selector have been removed. Admin Accounts UI no longer offers role editing or creation of Super Admin accounts and includes account detail and soft-delete actions.
- Web User has no admin functions and no Seller dependency; QR/grant/map/POI/audio paths remain in place.

## Production database (read-only post-check after Flyway V6)

- Target: Neon primary branch `production`, database `neondb`; Flyway version `6`, latest migration `remove seller role and data`, state `SUCCESS`.
- Seller accounts: 0; `access_qr.seller_id` column: absent; Seller index: absent; Seller role constraint value: absent.
- Admin accounts: 1 active; Super Admin accounts: 0. No Super Admin was created during this task because no bootstrap credentials or approved password were present.
- Preserved data: QR 1, grants 1, usage events 0, audit rows 2. Foreign keys marked unvalidated: 0.

## Remaining operational gap

The production database has no active Super Admin. UC10/UC15 are correctly restricted in code but cannot be exercised by a production operator until a Super Admin is provisioned through an approved bootstrap/credential process. Do not promote the existing Admin automatically; that would remove its current Admin capabilities and exceed this task's authorization.
