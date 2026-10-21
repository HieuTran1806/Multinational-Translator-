-- Reference data (needed in every environment).
-- Voice names follow Google Cloud TTS naming; NULL means "provider default for the language".
INSERT INTO language (code, name, native_name, tts_language_code, default_tts_voice, enabled, sort_order) VALUES
    ('vi', 'Vietnamese', 'Tiếng Việt', 'vi-VN', NULL, TRUE, 1),
    ('en', 'English',    'English',    'en-US', NULL, TRUE, 2);
