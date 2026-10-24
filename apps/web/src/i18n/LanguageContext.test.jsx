import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { LanguageProvider, useLanguage } from './LanguageContext.jsx';
import { languageLabel } from './languages.js';

vi.mock('../api/endpoints.js', () => ({
  publicApi: { languages: vi.fn() },
}));
import { publicApi } from '../api/endpoints.js';

const languagesMock = vi.mocked(publicApi.languages);

const LANGS = [
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
  { code: 'en', name: 'English', nativeName: 'English' },
];

function Probe() {
  const { lang, languages, loading, error } = useLanguage();
  return (
    <div>
      <span data-testid="lang">{lang}</span>
      <span data-testid="count">{languages.length}</span>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="error">{error ? error.message : 'none'}</span>
    </div>
  );
}

function renderProvider() {
  return render(
    <LanguageProvider>
      <Probe />
    </LanguageProvider>,
  );
}

describe('LanguageContext (UC01 input for UC03–UC05)', () => {
  it('defaults to Vietnamese and loads enabled languages', async () => {
    languagesMock.mockResolvedValue(LANGS);
    renderProvider();
    expect(screen.getByTestId('lang')).toHaveTextContent('vi');
    expect(await screen.findByText('2')).toBeInTheDocument();
    expect(screen.getByTestId('error')).toHaveTextContent('none');
  });

  it('keeps the last chosen language across reloads and exposes it via setLang', async () => {
    localStorage.setItem('tm.lang', 'en');
    languagesMock.mockResolvedValue(LANGS);
    renderProvider();
    expect(screen.getByTestId('lang')).toHaveTextContent('en');
    expect(await screen.findByText('2')).toBeInTheDocument();
  });

  it('surfaces a language-list failure without crashing (switcher shows retry)', async () => {
    languagesMock.mockRejectedValue(new Error('boom'));
    renderProvider();
    expect(await screen.findByText('boom')).toBeInTheDocument();
  });

  it('languageLabel prefers the native name and falls back to the code', () => {
    expect(languageLabel(LANGS, 'vi')).toBe('Tiếng Việt');
    expect(languageLabel(LANGS, 'en')).toBe('English');
    expect(languageLabel(LANGS, 'fr')).toBe('FR');
    expect(languageLabel([], 'vi')).toBe('Tiếng Việt');
  });
});

function Switcher() {
  const { lang, setLang } = useLanguage();
  return (
    <button type="button" onClick={() => setLang('en')}>
      switch:{lang}
    </button>
  );
}

describe('setLang', () => {
  it('updates the language and persists it', async () => {
    const user = userEvent.setup();
    localStorage.setItem('tm.lang', 'vi');
    languagesMock.mockResolvedValue(LANGS);
    render(
      <LanguageProvider>
        <Switcher />
      </LanguageProvider>,
    );
    await user.click(await screen.findByText('switch:vi'));
    expect(screen.getByText('switch:en')).toBeInTheDocument();
    expect(localStorage.getItem('tm.lang')).toBe('en');
    expect(document.documentElement.lang).toBe('en');
  });
});
