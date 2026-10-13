import { useState } from 'react';
import { poiApi } from '../api/endpoints.js';
import { Alert, Button, Field, inputClass } from '../components/ui.jsx';
import AudioPanel from './AudioPanel.jsx';

function initial(t) {
  return { name: t?.name ?? '', description: t?.description ?? '', narrationText: t?.narrationText ?? '' };
}

/** Content for one language. Text is entered manually per language (no machine translation in MVP). */
export default function TranslationEditor({ poiId, language, translation, ttsStatus, onSaved }) {
  const [form, setForm] = useState(() => initial(translation));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const saved = initial(translation);
  const dirty =
    form.name !== saved.name || form.description !== saved.description || form.narrationText !== saved.narrationText;
  const narrationChanged = translation && form.narrationText.trim() !== saved.narrationText.trim();

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function onSave(e) {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    setMessage(null);
    try {
      await poiApi.saveTranslation(poiId, language.code, form);
      setMessage({
        kind: 'success',
        text: narrationChanged
          ? 'Đã lưu. Nội dung thuyết minh thay đổi nên audio cũ không còn được sử dụng.'
          : 'Đã lưu nội dung.',
      });
      await onSaved?.();
    } catch (err) {
      setErrors(err.fieldMap ? err.fieldMap() : {});
      setMessage({ kind: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  }

  const id = (f) => `${language.code}-${f}`;
  return (
    <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
      <form onSubmit={onSave} className="space-y-4" noValidate>
        <Field label="Tên hiển thị" htmlFor={id('name')} error={errors.name}>
          <input
            id={id('name')}
            className={inputClass}
            value={form.name}
            aria-invalid={!!errors.name}
            onChange={(e) => set('name', e.target.value)}
          />
        </Field>
        <Field label="Mô tả ngắn" htmlFor={id('description')} error={errors.description}>
          <textarea
            id={id('description')}
            rows={3}
            className={inputClass}
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
          />
        </Field>
        <Field
          label="Nội dung thuyết minh"
          htmlFor={id('narration')}
          error={errors.narrationText}
          hint={`${new TextEncoder().encode(form.narrationText).length} byte · Google TTS giới hạn ${ttsStatus?.maxInputBytes ?? '—'} byte/lần`}
        >
          <textarea
            id={id('narration')}
            rows={10}
            className={inputClass}
            value={form.narrationText}
            aria-invalid={!!errors.narrationText}
            onChange={(e) => set('narrationText', e.target.value)}
          />
        </Field>
        {narrationChanged && (
          <Alert kind="warning">Khi lưu, audio hiện tại của ngôn ngữ này sẽ hết hiệu lực (cần gắn/tạo lại).</Alert>
        )}
        {message && <Alert kind={message.kind}>{message.text}</Alert>}
        <Button type="submit" loading={saving} disabled={!dirty && !!translation}>
          {translation ? 'Lưu thay đổi' : `Lưu nội dung ${language.nativeName}`}
        </Button>
      </form>
      <AudioPanel
        poiId={poiId}
        lang={language.code}
        translation={translation}
        ttsStatus={ttsStatus}
        dirty={dirty}
        onChanged={onSaved}
      />
    </div>
  );
}
