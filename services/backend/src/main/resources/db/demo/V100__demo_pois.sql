-- =====================================================================
-- DEMO DATA ONLY — loaded only when the "dev" profile adds classpath:db/demo
-- to spring.flyway.locations. NEVER enabled in production.
-- Texts are short illustrative summaries written for the demo, not
-- verified historical content. Replace before any public release.
-- =====================================================================

INSERT INTO poi (code, default_name, latitude, longitude, status, is_demo, published_at)
VALUES
    ('DEMO-BEN-DUOC',  '[DEMO] Địa đạo Bến Dược', 11.1430, 106.4618, 'PUBLISHED', TRUE, now()),
    ('DEMO-BEN-DINH',  '[DEMO] Địa đạo Bến Đình', 11.0598, 106.5281, 'PUBLISHED', TRUE, now()),
    ('DEMO-DRAFT-01',  '[DEMO] Điểm nháp (không công khai)', 11.1405, 106.4600, 'DRAFT', TRUE, NULL);

INSERT INTO poi_translation (poi_id, language_code, name, description, narration_text)
SELECT p.id, t.lang, t.name, t.description, t.narration
FROM poi p
JOIN (VALUES
    ('DEMO-BEN-DUOC', 'vi', '[DEMO] Địa đạo Bến Dược',
     'Nội dung minh hoạ. Khu di tích thuộc hệ thống địa đạo Củ Chi.',
     'Đây là nội dung thuyết minh minh hoạ cho điểm Bến Dược. Nhóm dự án cần thay bằng nội dung đã được kiểm chứng.'),
    ('DEMO-BEN-DUOC', 'en', '[DEMO] Ben Duoc Tunnels',
     'Demo content. A site within the Cu Chi tunnels network.',
     'This is placeholder narration for the Ben Duoc site. The project team must replace it with verified content.'),
    ('DEMO-BEN-DINH', 'vi', '[DEMO] Địa đạo Bến Đình',
     'Nội dung minh hoạ cho điểm tham quan Bến Đình.',
     'Đây là nội dung thuyết minh minh hoạ cho điểm Bến Đình. Nhóm dự án cần thay bằng nội dung đã được kiểm chứng.'),
    ('DEMO-BEN-DINH', 'en', '[DEMO] Ben Dinh Tunnels',
     'Demo content for the Ben Dinh visitor site.',
     'This is placeholder narration for the Ben Dinh site. The project team must replace it with verified content.'),
    ('DEMO-DRAFT-01', 'vi', '[DEMO] Điểm nháp',
     'POI nháp dùng để kiểm tra khách không xem được.',
     'Nội dung nháp, không được hiển thị cho khách.')
) AS t(code, lang, name, description, narration) ON t.code = p.code;
