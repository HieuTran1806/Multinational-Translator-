import { useId } from 'react';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { languageLabel } from '../i18n/languages.js';

/**
 * UC01 control in the header (also on the scan screen): lists the enabled languages from the backend and
 * switches UI + content language. If the list cannot be loaded the current language is kept (E1).
 */
export default function LanguageSwitcher() {
  const { lang, setLang, languages, loading, error, reload, t } = useLanguage();
  const id = useId();

  if (error && languages.length === 0) {
    return (
      <div className="flex items-center gap-2 text-xs text-paper/90" role="status">
        <span className="hidden min-[420px]:inline">{t('lang.loadFailed')}</span>
        <button type="button" onClick={reload} className="font-semibold underline hover:text-sand">
          {t('common.retry')}
        </button>
      </div>
    );
  }

  if (loading && languages.length === 0) {
    return <span className="text-xs text-paper/80">{t('lang.loading')}</span>;
  }

  const options = languages.length ? languages : [{ code: lang, name: lang, nativeName: lang }];

  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="sr-only">
        {t('lang.label')}
      </label>
      <select
        id={id}
        value={lang}
        onChange={(e) => setLang(e.target.value)}
        className="rounded-lg border border-white/30 bg-olive-dark px-2.5 py-1.5 text-sm font-medium text-paper focus:outline-none focus-visible:ring-2 focus-visible:ring-sand/70"
        aria-label={t('lang.label')}
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
