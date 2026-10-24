import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router';
import { LanguageProvider } from './i18n/LanguageContext.jsx';
import { AccessProvider } from './access/AccessContext.jsx';
import { resetGrantStoreForTests, saveGrant } from './access/grantStore.js';
import App from './App.jsx';

vi.mock('./features/explore/ExplorePage.jsx', () => ({ default: () => <div data-testid="explore" /> }));
vi.mock('./features/detail/PoiDetailPage.jsx', () => ({ default: () => <div data-testid="detail" /> }));
vi.mock('./api/endpoints.js', () => ({
  publicApi: { languages: vi.fn().mockResolvedValue([]), pois: vi.fn().mockResolvedValue({ items: [] }) },
  accessApi: { me: vi.fn(), redeem: vi.fn() },
}));
import { accessApi } from './api/endpoints.js';

const IN_A_DAY = () => new Date(Date.now() + 24 * 3600 * 1000).toISOString();

function renderAt(path) {
  return render(
    <LanguageProvider>
      <AccessProvider>
        <MemoryRouter initialEntries={[path]}>
          <App />
        </MemoryRouter>
      </AccessProvider>
    </LanguageProvider>,
  );
}

function withValidGrant() {
  const expiresAt = IN_A_DAY();
  saveGrant({ accessToken: 'grant', expiresAt, packageCode: 'DEMO_24H' });
  resetGrantStoreForTests(); // read it back from storage like a reopened app
  vi.mocked(accessApi.me).mockResolvedValue({ grantId: 1, packageCode: 'DEMO_24H', expiresAt, remainingSeconds: 86400 });
}

describe('App routes', () => {
  beforeEach(() => {
    localStorage.clear();
    resetGrantStoreForTests();
  });

  it('shows the explore page at the root once the grant is verified', async () => {
    withValidGrant();
    renderAt('/');
    expect(await screen.findByTestId('explore')).toBeInTheDocument();
  });

  it('shows the detail page at /pois/:id with a valid grant', async () => {
    withValidGrant();
    renderAt('/pois/9');
    expect(await screen.findByTestId('detail')).toBeInTheDocument();
  });

  it('sends visitors without access to the QR scan screen (UC02)', async () => {
    renderAt('/pois/9');
    expect(await screen.findByRole('heading', { name: 'Chào mừng bạn!' })).toBeInTheDocument();
    expect(screen.queryByTestId('detail')).toBeNull();
    expect(accessApi.me).not.toHaveBeenCalled();
  });

  it('renders a not-found page for unknown routes', () => {
    renderAt('/khac');
    expect(screen.getByText('Không tìm thấy trang')).toBeInTheDocument();
  });
});
