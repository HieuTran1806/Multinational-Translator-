import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { LanguageProvider } from '../../i18n/LanguageContext.jsx';
import Layout from '../../components/Layout.jsx';
import ExplorePage from './ExplorePage.jsx';

vi.mock('./PoiMap.jsx', () => ({ default: () => <div data-testid="poi-map" /> }));
vi.mock('../../api/endpoints.js', () => ({
  publicApi: { languages: vi.fn(), pois: vi.fn() },
}));
import { publicApi } from '../../api/endpoints.js';

const poisMock = vi.mocked(publicApi.pois);
const languagesMock = vi.mocked(publicApi.languages);

const LANGS = [
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
  { code: 'en', name: 'English', nativeName: 'English' },
];

function page(pois) {
  return { items: pois, page: 0, size: 200, totalItems: pois.length, totalPages: 1 };
}

const POIS = [
  { id: 1, code: 'DEMO-BEN-DUOC', name: 'Địa đạo Bến Dược', latitude: 11.14, longitude: 106.46, imageUrl: null, category: 'Di tích lịch sử', triggerRadius: 100, languages: ['vi', 'en'], updatedAt: '2026-10-18T09:30:00Z' },
  { id: 2, code: 'DEMO-DEN', name: 'Đền thờ liệt sĩ Bến Dược', latitude: 11.15, longitude: 106.47, imageUrl: null, category: 'Đền thờ', triggerRadius: 80, languages: ['vi'], updatedAt: '2026-10-17T15:00:00Z' },
  { id: 3, code: 'DEMO-VUON', name: 'Vườn cao su cổ', latitude: 11.11, longitude: 106.47, imageUrl: null, category: 'Thiên nhiên', triggerRadius: 60, languages: ['vi', 'en'], updatedAt: '2026-09-28T12:00:00Z' },
];

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

function renderExplore() {
  return render(
    <LanguageProvider>
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<ExplorePage />} />
          </Route>
          <Route path="/pois/:id" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>
    </LanguageProvider>,
  );
}

describe('ExplorePage (UC03 + search)', () => {
  it('renders the map and the POI list from the API', async () => {
    languagesMock.mockResolvedValue(LANGS);
    poisMock.mockResolvedValue(page(POIS));
    renderExplore();

    expect(screen.getByTestId('poi-map')).toBeInTheDocument();
    expect(await screen.findByText('Địa đạo Bến Dược')).toBeInTheDocument();
    expect(screen.getByText('3/3 địa điểm')).toBeInTheDocument();
  });

  it('filters the list with accent-insensitive search', async () => {
    const user = userEvent.setup();
    languagesMock.mockResolvedValue(LANGS);
    poisMock.mockResolvedValue(page(POIS));
    renderExplore();

    await screen.findByText('Địa đạo Bến Dược');
    await user.type(screen.getByLabelText('Tìm kiếm địa điểm'), 'ben duoc');
    expect(screen.getByText('2/3 địa điểm')).toBeInTheDocument();
    expect(screen.getByText('Địa đạo Bến Dược')).toBeInTheDocument();
    expect(screen.getByText('Đền thờ liệt sĩ Bến Dược')).toBeInTheDocument();
    expect(screen.queryByText('Vườn cao su cổ')).toBeNull();
  });

  it('shows an empty result message when nothing matches', async () => {
    const user = userEvent.setup();
    languagesMock.mockResolvedValue(LANGS);
    poisMock.mockResolvedValue(page(POIS));
    renderExplore();

    await screen.findByText('Địa đạo Bến Dược');
    await user.type(screen.getByLabelText('Tìm kiếm địa điểm'), 'khongtonai');
    expect(screen.getByText('Không tìm thấy địa điểm phù hợp với từ khoá.')).toBeInTheDocument();
  });

  it('opens the POI detail page when a list item is chosen', async () => {
    const user = userEvent.setup();
    languagesMock.mockResolvedValue(LANGS);
    poisMock.mockResolvedValue(page(POIS));
    renderExplore();

    await user.click(await screen.findByText('Vườn cao su cổ'));
    expect(await screen.findByText('/pois/3')).toBeInTheDocument();
  });

  it('shows a list error with retry and recovers (E2)', async () => {
    const user = userEvent.setup();
    languagesMock.mockResolvedValue(LANGS);
    poisMock.mockRejectedValueOnce(Object.assign(new Error('API POI lỗi'), { status: 500 }));
    renderExplore();

    expect(await screen.findByRole('alert')).toHaveTextContent('Không tải được danh sách địa điểm');
    poisMock.mockResolvedValue(page(POIS));
    await user.click(screen.getByRole('button', { name: 'Thử lại' }));
    expect(await screen.findByText('Địa đạo Bến Dược')).toBeInTheDocument();
    await waitFor(() => expect(poisMock).toHaveBeenCalledTimes(2));
  });

  it('refetches localized names when the language changes', async () => {
    const user = userEvent.setup();
    languagesMock.mockResolvedValue(LANGS);
    poisMock.mockResolvedValue(page(POIS));
    renderExplore();
    await screen.findByText('Địa đạo Bến Dược');

    await user.selectOptions(screen.getByLabelText('Ngôn ngữ thuyết minh'), 'en');
    await waitFor(() => expect(poisMock).toHaveBeenCalledWith(expect.objectContaining({ lang: 'en' })));
  });
});
