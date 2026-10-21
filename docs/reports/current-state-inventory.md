# Phase 1 — Current-state inventory (before branch reset)

## Scope and confidence

This inventory was captured from the previous implementation on branch `XuanHoai_UC01-03` before removing implementation directories from `phase-1-contract-baseline`. The original branch is retained. The working tree contained 13 modified documentation files; those changes were stashed for recovery and reapplied on this new branch. The stash is intentionally retained as an additional backup.

The inventory below is based on tracked-file inspection and source-level route/model searches, not on a fresh full test run. Treat route names and fields as observed legacy behavior, not as an approved target contract.

## Person 1 — User mobile app

Observed:
- React Native/TypeScript mobile client under `apps/mobile`.
- API client had GET-only JSON helper with timeout and normalized network/HTTP errors.
- Client consumed public POI list/detail, offline manifest, and language endpoints.
- DTOs included POI summary/detail, localized narration, audio metadata, and offline translations.
- Tests existed for API client, narration, offline handling, media source resolution, and voice selection.

Gaps / not evidenced in the inspected client:
- No User registration/login/profile/session contract was found in the inspected mobile API files.
- No payment, purchase entitlement, QR issuance, or QR activation flow was found in the inspected mobile API files.
- Need a full use-case-to-screen mapping and explicit offline conflict/error rules before implementation.

## Person 2 — POI, media, Seller

Observed legacy backend:
- Public POI endpoints: `GET /api/v1/public/pois`, `GET /api/v1/public/pois/{id}`, and `GET /api/v1/public/pois/{id}/offline-manifest`.
- Admin POI endpoints covered CRUD, publish/unpublish, translations, audio upload, image upload/delete/order.
- Media endpoints served public/admin audio and POI images.
- Data entities included POI, POI translation, POI image, audio asset, and TTS jobs.

Gaps:
- No Seller controller/model, payment/order API, QR issuance API, or QR activation API was found in the tracked legacy backend inventory.
- The agreed business rule is that Seller issues a User-specific QR only after successful payment; QR must not expire before activation. Expiration/revocation after activation, duplicate issuance, refund/chargeback, and replay prevention still need explicit decisions.
- Media storage authorization and lifecycle need to be redefined against the new role matrix.

## Person 3 — RBAC, Admin API, reports

Observed legacy backend:
- Auth endpoints: `POST /api/v1/auth/login`, `POST /api/v1/auth/logout`, `GET /api/v1/auth/me`.
- Security config allowed health/info, login, and public GET endpoints; authenticated rules existed for `/api/v1/auth/**`. Admin controllers were present, but a complete role-based permission matrix was not evidenced by the inspected route annotations.
- Shared API error model included `code`, `message`, path/context and field-error support; exact response fields must be reconciled in the contract.
- Admin UI API client covered auth, POI, translation, audio, image and TTS operations.

Required agreed rules:
- Only Super Admin can create Admin accounts.
- Super Admin does not manage POIs and does not create Seller accounts.
- Protected self-management actions must be blocked if they would leave no other active Super Admin; at least one other active Super Admin must remain.

Gaps:
- Seller, payment/QR, comprehensive audit reporting and a complete RBAC enforcement matrix were not found as implemented API modules in the inspected source inventory.
- Need to distinguish authentication (401) from authenticated-but-forbidden access (403) consistently.

## Repository reset result

This branch removes the legacy implementation directories and keeps documentation, CI workflow/configuration, and repository support files. No claim is made that the legacy implementation passed all tests as part of this reset.
