import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router';
import { LanguageProvider } from './i18n/LanguageContext.jsx';
import App from './App.jsx';

vi.mock('./features/explore/ExplorePage.jsx', () => ({ default: () => <div data-testid="explore" /> }));
vi.mock('./features/detail/PoiDetailPage.jsx', () => ({ default: () => <div data-testid="detail" /> }));
vi.mock('./api/endpoints.js', () => ({
  publicApi: { languages: vi.fn().mockResolvedValue([]), pois: vi.fn().mockResolvedValue({ items: [] }) },
}));

describe('App routes', () => {
  it('shows the explore page at the root', () => {
    render(
      <LanguageProvider>
        <MemoryRouter initialEntries={['/']}>
          <App />
        </MemoryRouter>
      </LanguageProvider>,
    );
    expect(screen.getByTestId('explore')).toBeInTheDocument();
  });

  it('shows the detail page at /pois/:id', () => {
    render(
      <LanguageProvider>
        <MemoryRouter initialEntries={['/pois/9']}>
          <App />
        </MemoryRouter>
      </LanguageProvider>,
    );
    expect(screen.getByTestId('detail')).toBeInTheDocument();
  });

  it('renders a not-found page for unknown routes', () => {
    render(
      <LanguageProvider>
        <MemoryRouter initialEntries={['/khac']}>
          <App />
        </MemoryRouter>
      </LanguageProvider>,
    );
    expect(screen.getByText('Không tìm thấy trang')).toBeInTheDocument();
  });
});
