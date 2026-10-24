import { useId } from 'react';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { languageLabel } from '../i18n/languages.js';

/** UC01 control surfaced in the header: switches the narration language used by UC03–UC05. */
export default function LanguageSwitcher() {
  const { lang, setLang, languages, loading, error, reload } = useLanguage();
  const id = useId();

  if (error) {
    return (
      <div className="flex items-center gap-2 text-xs text-paper/90" role="status">
        <span>Không tải được danh sách ngôn ngữ</span>
        <button type="button" onClick={reload} className="font-semibold underline hover:text-sand">
          Thử lại
        </button>
      </div>
    );
  }

  if (loading && languages.length === 0) {
    return <span className="text-xs text-paper/80">Đang tải ngôn ngữ…</span>;
  }

  const options = languages.length ? languages : [{ code: lang, name: lang, nativeName: lang }];

  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="sr-only">
        Ngôn ngữ thuyết minh
      </label>
      <select
        id={id}
        value={lang}
        onChange={(e) => setLang(e.target.value)}
        className="rounded-lg border border-white/30 bg-olive-dark px-2.5 py-1.5 text-sm font-medium text-paper focus:outline-none focus-visible:ring-2 focus-visible:ring-sand/70"
        aria-label="Ngôn ngữ thuyết minh"
      >
        {options.map((l) => (
          <option key={l.code} value={l.code} className="text-charcoal">
            {languageLabel(languages, l.code)}
          </option>
        ))}
      </select>
    </div>
  );
}
