-- =====================================================================
-- DEMO ACCESS QR CODES (UC02) — loaded only by the "dev" profile.
-- Plaintext tokens are documented in db/demo/README.md; only SHA-256
-- hashes are stored. Each one can be redeemed exactly once; issue more via
-- POST /api/v1/admin/access-qrs. Never enable this demo seed in production.
-- =====================================================================

INSERT INTO access_qr (token_hash, package_id, note)
SELECT v.token_hash, p.id, v.note
FROM (VALUES
    ('6ba8f1e825f4e8ddf8b3a28e5a6695d17a76e8244617b49f5eb6c175685fa10e', '[DEMO] DEMO-QR-0001'),
    ('def4234df2e11f86eab4b31f2cc7f1771acc631393826ef8130f848aca3b1037', '[DEMO] DEMO-QR-0002'),
    ('6d19188aa3b8ecfebeddd612821564877a99b28e014b8d8ae1af054c16e2ffa6', '[DEMO] DEMO-QR-0003')
) AS v (token_hash, note)
JOIN access_package p ON p.code = 'DEMO_24H'
ON CONFLICT (token_hash) DO NOTHING;
