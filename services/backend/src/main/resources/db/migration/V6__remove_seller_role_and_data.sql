-- V6: remove Seller accounts, Seller-owned QR data and Seller-only audit events.
-- Flyway runs this migration transactionally on PostgreSQL. Scope is captured before deletion.
CREATE TEMP TABLE seller_accounts ON COMMIT DROP AS
SELECT id, username FROM account WHERE role = 'SELLER';

-- Preserve Admin/Super Admin audit trails, but remove Seller-only operations and Seller actor history.
DELETE FROM audit_log
WHERE action LIKE 'SELLER\_%' ESCAPE '\'
   OR actor_id IN (SELECT id FROM seller_accounts)
   OR actor_name IN (SELECT username FROM seller_accounts);

-- Delete only QR codes explicitly owned by Seller; grants and usage events for other QR codes remain.
DELETE FROM usage_event
WHERE grant_id IN (
    SELECT g.id
    FROM access_grant g
    JOIN access_qr q ON q.id = g.qr_id
    WHERE q.seller_id IN (SELECT id FROM seller_accounts)
);
DELETE FROM access_grant
WHERE qr_id IN (SELECT id FROM access_qr WHERE seller_id IN (SELECT id FROM seller_accounts));
DELETE FROM access_qr WHERE seller_id IN (SELECT id FROM seller_accounts);

-- Account sessions cascade by existing FK; deleted_by references are set null by existing FK.
DELETE FROM account WHERE id IN (SELECT id FROM seller_accounts);

-- Remove Seller-only schema and reject the role at the database boundary.
DROP INDEX IF EXISTS ix_access_qr_seller;
ALTER TABLE access_qr DROP COLUMN IF EXISTS seller_id;
ALTER TABLE account DROP CONSTRAINT ck_account_role;
ALTER TABLE account ADD CONSTRAINT ck_account_role CHECK (role IN ('ADMIN', 'SUPER_ADMIN'));
