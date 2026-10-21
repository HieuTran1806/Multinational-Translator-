# Phase 1 — Shared contract baseline

Status: **Draft baseline for review by all three contributors.** The retained legacy code is evidence only; the approved contract in this document and the linked requirements must govern the rebuild. Unresolved business decisions must be raised rather than guessed.

## 1. API conventions

- Base path: `/api/v1`.
- JSON request/response bodies use `application/json`; binary upload endpoints declare multipart explicitly.
- Field naming: `camelCase` in JSON; stable identifiers are opaque to clients unless a use case requires a human-readable code.
- Timestamps: ISO-8601 UTC (`Z`) in API responses. Store/audit instants in UTC.
- Pagination: agree one shared shape before implementation. Proposed shape: `{ "items": [], "page": 0, "size": 20, "totalItems": 0, "totalPages": 0 }`; `page` is zero-based.
- List sorting and filtering must be explicit, validated, and have documented defaults and maximum page sizes.
- Mutating endpoints must validate authorization on the server, not trust UI-hidden controls.
- Use idempotency protection for payment callbacks and QR issuance where retries could create duplicate effects.

## 2. Error contract

Proposed common response:

```json
{
  "code": "VALIDATION_FAILED",
  "status": 400,
  "message": "Request validation failed",
  "path": "/api/v1/example",
  "timestamp": "2026-01-01T00:00:00Z",
  "fieldErrors": [{ "field": "name", "message": "must not be blank" }]
}
```

`fieldErrors` may be omitted when not applicable. Do not expose stack traces, secrets, internal SQL, tokens, or provider credentials.

- `400 VALIDATION_FAILED` — malformed or invalid input.
- `401 UNAUTHENTICATED` — missing, invalid, expired, or revoked authentication.
- `403 FORBIDDEN` — authenticated principal lacks permission or violates protected self-management rules.
- `404 NOT_FOUND` — resource absent or deliberately concealed by the access policy.
- `409 CONFLICT` — state transition, uniqueness, optimistic-lock, duplicate payment/QR or lifecycle conflict.
- `413 PAYLOAD_TOO_LARGE` — upload/request exceeds configured limit.
- `415 UNSUPPORTED_MEDIA` — unsupported content type.
- `422 BUSINESS_RULE_VIOLATION` — syntactically valid request cannot be applied under business rules (use consistently; do not overlap casually with 409).
- `429 RATE_LIMITED` — rate limit reached.
- `500 INTERNAL_ERROR` — unexpected failure with correlation ID, no sensitive internals.
- `503 DEPENDENCY_UNAVAILABLE` — required dependency unavailable.

The common response fields are `code`, `status`, `message`, `path`, and `timestamp`; `fieldErrors` is optional. Error codes are stable machine-readable contract. The team must decide whether business-rule failures use 409 or 422 before implementation; do not use both inconsistently.

## 3. Identity and RBAC baseline

- Authorization is deny-by-default and enforced at API/service boundaries.
- Public User-facing read APIs are explicitly allowlisted; every other endpoint requires authentication and a permission check.
- Only Super Admin can create Admin accounts.
- Super Admin cannot manage POIs and cannot create Seller accounts.
- A Super Admin cannot deactivate, demote, delete, or otherwise disable their own Super Admin privileges if that would leave no other active Super Admin. The operation is permitted only while at least one *other* active Super Admin remains after the transaction. Enforce transactionally to avoid concurrent requests removing the last two active administrators.
- Return 401 for absent/invalid authentication and 403 for insufficient permissions or protected self-action.
- Audit security-sensitive actions: actor, action, target, timestamp, outcome, and correlation/request ID. Never log credentials, bearer tokens, payment secrets, or full QR secrets.
- Define exact roles/permissions and resource ownership in a reviewed matrix before coding. Role names below are provisional: `SUPER_ADMIN`, `ADMIN`, `SELLER`, `USER`.

## 4. POI/media baseline

- POI lifecycle and visibility must be explicit (e.g. draft/published/archived only after confirming allowed transitions).
- Translations belong to a POI and language; audio assets must be associated with the correct translation/content version.
- Media access must use resource ownership and visibility policy, not only guessable IDs. Upload type, size, checksum, storage key, and ordering validation are server-side.
- Offline manifest versioning and stale-content behavior must be specified. Do not assume a downloaded entitlement or QR is an authorization token unless separately approved.

## 5. Seller, payment, and QR baseline

- Seller may issue a QR for a specific User only after the payment has been confirmed successful by a trusted server-side payment result.
- A QR must not expire before it is activated.
- QR must be bound to a unique issuance/entitlement and have replay protection. A scan/activation operation must be atomic and idempotent.
- Do not treat a client-provided “payment successful” flag as authoritative.
- Decisions still required: payment provider/webhook verification, refund/chargeback behavior, duplicate payment handling, post-activation expiry (if any), QR rotation/revocation, allowed activator identity, and what content/service the QR grants.

## 6. Minimum API domains to agree

| Domain | Minimum scope to specify | Owner for initial review |
|---|---|---|
| User app | User identity/session if required; public POI discovery/detail; language; media; offline manifest; entitlement/QR activation | Person 1 |
| POI/media/Seller | POI lifecycle; translations; image/audio; Seller identity; payment confirmation; QR issue/reissue/revoke | Person 2 |
| RBAC/Admin/reporting | Admin auth; account lifecycle; roles/permissions; audit logs; reporting; Super Admin safety invariant | Person 3 |

## 7. Acceptance criteria for contract sign-off

- Every use case maps to an endpoint/operation, request/response schema, permission, and state transition.
- Every protected endpoint has an explicit role/permission and ownership rule.
- Every endpoint documents success and failure status codes.
- QR issuance cannot happen before trusted payment success; activation cannot be replayed; QR is non-expiring until activation.
- Last-active-Super-Admin invariant is enforced atomically and covered by tests.
- Open questions are recorded as decisions, not silently implemented as assumptions.
