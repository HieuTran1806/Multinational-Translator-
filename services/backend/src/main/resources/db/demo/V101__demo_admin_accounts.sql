-- =====================================================================
-- DEMO ADMIN ACCOUNTS — loaded only when the "dev" profile adds db/demo
-- to spring.flyway.locations. Never enable this demo seed in production.
-- The shared password is documented in db/demo/README.md; only BCrypt
-- hashes are stored here. ON CONFLICT makes reruns safe and preserves any
-- pre-existing account, password hash, role, and enabled state.
-- =====================================================================

-- V5 replaced the plain UNIQUE(username) constraint with the partial index
-- uq_account_username_active, so the conflict target must repeat that predicate.
INSERT INTO account (username, password_hash, display_name, role, enabled)
VALUES
    ('admin01', '$2a$10$xx2W6oxI1SVG6PpFfTRzB.b7qDg.7hhDmJO7Gsh/ovQQiC6GniE3i', '[DEMO] Admin 01', 'ADMIN', TRUE),
    ('admin02', '$2a$10$xx2W6oxI1SVG6PpFfTRzB.b7qDg.7hhDmJO7Gsh/ovQQiC6GniE3i', '[DEMO] Admin 02', 'ADMIN', TRUE),
    ('admin03', '$2a$10$xx2W6oxI1SVG6PpFfTRzB.b7qDg.7hhDmJO7Gsh/ovQQiC6GniE3i', '[DEMO] Admin 03', 'ADMIN', TRUE)
ON CONFLICT (username) WHERE deleted_at IS NULL DO NOTHING;
