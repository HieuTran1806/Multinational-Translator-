import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { languageApi, poiApi, ttsApi } from '../api/endpoints.js';
import PoiEditPage from './PoiEditPage.jsx';

vi.mock('../api/endpoints.js', () => ({
  languageApi: { list: vi.fn() },
  ttsApi: { status: vi.fn() },
  poiApi: { get: vi.fn(), create: vi.fn(), update: vi.fn() },
  fetchMediaObjectUrl: vi.fn(),
}));

const LANGS = [{ code: 'vi', nativeName: 'Tiếng Việt' }, { code: 'en', nativeName: 'English' }];
const CREATED = {
  id: 5, code: 'E2E-REG', defaultName: 'Điểm E2E', latitude: 11.14, longitude: 106.46,
  category: null, triggerRadius: 50, status: 'DRAFT', rowVersion: 0, images: [], translations: [],
};

function renderPage(entry = '/pois/new') {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/pois/new" element={<PoiEditPage />} />
        <Route path="/pois/:id" element={<PoiEditPage />} />
        <Route path="/pois" element={<p>poi list</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('PoiEditPage — create then edit transition', () => {
  beforeEach(() => {
    languageApi.list.mockReset().mockResolvedValue(LANGS);
    ttsApi.status.mockReset().mockResolvedValue({ provider: 'none', configured: false });
    poiApi.get.mockReset().mockResolvedValue(CREATED);
    poiApi.create.mockReset().mockResolvedValue(CREATED);
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  // Regression: navigating from /pois/new to /pois/{id} after create used to render
  // with loading=false and poi=null, crashing on `poi.defaultName`.
  it('does not crash when switching to the edit view right after create', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByLabelText(/mã địa điểm/i);

    await user.type(screen.getByLabelText(/mã địa điểm/i), 'E2E-REG');
    await user.type(screen.getByLabelText(/tên mặc định/i), 'Điểm E2E');
    await user.type(screen.getByLabelText(/vĩ độ/i), '11.14');
    await user.type(screen.getByLabelText(/kinh độ/i), '106.46');
    await user.click(screen.getByRole('button', { name: /tạo poi/i }));

    await waitFor(() => expect(poiApi.create).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(poiApi.get).toHaveBeenCalledWith('5'));
    // The edit view renders the created POI name instead of throwing.
    expect(await screen.findByRole('heading', { name: 'Điểm E2E' })).toBeInTheDocument();
  });

  it('falls back to empty form fields when the API returns a POI without optional data', async () => {
    poiApi.get.mockResolvedValue({ ...CREATED, defaultName: null, category: null, triggerRadius: null });
    renderPage('/pois/5');
    await waitFor(() => expect(poiApi.get).toHaveBeenCalledWith('5'));
    expect((await screen.findByLabelText(/tên mặc định/i)).value).toBe('');
    expect(screen.getByRole('heading', { name: '' })).toBeInTheDocument();
  });
});
