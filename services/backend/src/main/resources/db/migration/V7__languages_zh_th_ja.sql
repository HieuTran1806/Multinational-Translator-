-- Add Chinese (Mandarin, Simplified), Thai and Japanese narration languages.
-- default_tts_voice stays NULL: each TTS provider picks its own default voice for the locale
-- (Azure: zh-CN-XiaoxiaoNeural / th-TH-PremwadeeNeural / ja-JP-NanamiNeural; Google: provider default).
-- tts_language_code 'zh-CN' is mapped to 'cmn-CN' by the Google provider.
INSERT INTO language (code, name, native_name, tts_language_code, default_tts_voice, enabled, sort_order) VALUES
    ('zh', 'Chinese',  '中文',     'zh-CN', NULL, TRUE, 3),
    ('th', 'Thai',     'ภาษาไทย', 'th-TH', NULL, TRUE, 4),
    ('ja', 'Japanese', '日本語',   'ja-JP', NULL, TRUE, 5)
ON CONFLICT (code) DO NOTHING;
