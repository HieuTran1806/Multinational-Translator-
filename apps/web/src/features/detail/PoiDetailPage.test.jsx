import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router';
import { LanguageProvider } from '../../i18n/LanguageContext.jsx';
import PoiDetailPage from './PoiDetailPage.jsx';

vi.mock('../../api/endpoints.js', () => ({
  publicApi: { languages: vi.fn(), poi: vi.fn() },
}));
import { publicApi } from '../../api/endpoints.js';

// UC02: images/audio are downloaded with the grant headers and shown through object URLs.
vi.mock('../../api/client.js', async (importOriginal) => ({
  ...(await importOriginal()),
  fetchMediaObjectUrl: vi.fn(async (path) => `blob:test${path}`),
}));

const poiMock = vi.mocked(publicApi.poi);
const languagesMock = vi.mocked(publicApi.languages);

const LANGS = [
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
  { code: 'en', name: 'English', nativeName: 'English' },
];

class FakeAudio {
  constructor() {
    this.listeners = {};
    this.paused = true;
    this.currentTime = 0;
    this.duration = 10;
    this.ended = false;
    this.error = null;
  }
  set src(v) {
    this._src = v;
  }
  get src() {
    return this._src ?? '';
  }
  removeAttribute(name) {
    if (name === 'src') this._src = '';
  }
  addEventListener(type, fn) {
    (this.listeners[type] ??= []).push(fn);
  }
  removeEventListener(type, fn) {
    this.listeners[type] = (this.listeners[type] ?? []).filter((f) => f !== fn);
  }
  emit(type) {
    (this.listeners[type] ?? []).slice().forEach((fn) => fn({ target: this }));
  }
  play() {
    this.paused = false;
    this.emit('play');
    return Promise.resolve();
  }
  pause() {
    if (!this.paused) {
      this.paused = true;
      this.emit('pause');
    }
  }
}

const DETAIL = (over = {}) => ({
  id: 1,
  code: 'DEMO-BEN-DUOC',
  requestedLanguage: 'vi',
  language: 'vi',
  fallback: false,
  availableLanguages: ['vi', 'en'],
  name: 'Địa đạo Bến Dược',
  description: 'Khu di tích thuộc hệ thống địa đạo Củ Chi.',
  narrationText: 'Chào mừng bạn đến với địa đạo Bến Dược.',
  contentVersion: 1,
  audio: { id: 10, url: '/api/v1/public/audio/10', mimeType: 'audio/mpeg' },
  imageUrl: '/api/v1/public/pois/1/image',
  images: ['/api/v1/public/pois/1/image', '/api/v1/public/pois/1/images/5'],
  category: 'Di tích lịch sử',
  triggerRadius: 120,
  latitude: 11.143,
  longitude: 106.4618,
  updatedAt: '2026-10-18T09:30:00Z',
  ...over,
});

function renderDetail(initial = '/pois/1') {
  return render(
    <LanguageProvider>
      <MemoryRouter initialEntries={[initial]}>
        <Routes>
          <Route path="/pois/:id" element={<PoiDetailPage />} />
          <Route path="/" element={<div data-testid="home">bản đồ</div>} />
        </Routes>
      </MemoryRouter>
    </LanguageProvider>,
  );
}

describe('PoiDetailPage (UC04)', () => {
  beforeEach(() => {
    vi.stubGlobal('Audio', FakeAudio);
    languagesMock.mockResolvedValue(LANGS);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders localized content, images and the narration player', async () => {
    poiMock.mockResolvedValue(DETAIL());
    renderDetail();

    expect(await screen.findByRole('heading', { name: 'Địa đạo Bến Dược' })).toBeInTheDocument();
    expect(screen.getByText('Khu di tích thuộc hệ thống địa đạo Củ Chi.')).toBeInTheDocument();
    expect(await screen.findByAltText('Địa đạo Bến Dược')).toHaveAttribute('src', 'blob:test/api/v1/public/pois/1/image');
    expect(await screen.findByRole('group', { name: 'Trình phát thuyết minh' })).toBeInTheDocument();
    expect(poiMock).toHaveBeenCalledWith('1', 'vi');
  });

  it('shows a fallback notice when the requested language is missing (A1)', async () => {
    poiMock.mockResolvedValue(DETAIL({ requestedLanguage: 'en', language: 'vi', fallback: true }));
    renderDetail();

    expect(await screen.findByText(/chưa có bản dịch English/)).toBeInTheDocument();
    expect(screen.getByText(/hiển thị theo Tiếng Việt/)).toBeInTheDocument();
  });

  it('shows transcript-only when the POI has no audio (A2)', async () => {
    poiMock.mockResolvedValue(DETAIL({ audio: null }));
    renderDetail();

    expect(await screen.findByText('Chưa có audio thuyết minh')).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Trình phát thuyết minh' })).toBeNull();

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Xem bản đọc' }));
    expect(screen.getByText('Chào mừng bạn đến với địa đạo Bến Dược.')).toBeInTheDocument();
  });

  it('returns to the map when the POI is not public (E1)', async () => {
    const user = userEvent.setup();
    poiMock.mockRejectedValue(Object.assign(new Error('Địa điểm không tồn tại'), { status: 404 }));
    renderDetail();

    expect(await screen.findByRole('alert')).toHaveTextContent('không tồn tại hoặc không còn công khai');
    expect(screen.queryByRole('button', { name: 'Thử lại' })).toBeNull();
    await user.click(screen.getByRole('link', { name: 'Về bản đồ' }));
    expect(await screen.findByTestId('home')).toBeInTheDocument();
  });

  it('offers retry on other failures and refetches (E2)', async () => {
    const user = userEvent.setup();
    poiMock.mockRejectedValueOnce(Object.assign(new Error('Lỗi mạng'), { status: 0 }));
    renderDetail();

    expect(await screen.findByRole('alert')).toHaveTextContent('Không tải được chi tiết địa điểm');
    poiMock.mockResolvedValue(DETAIL());
    await user.click(screen.getByRole('button', { name: 'Thử lại' }));
    expect(await screen.findByRole('heading', { name: 'Địa đạo Bến Dược' })).toBeInTheDocument();
    await waitFor(() => expect(poiMock).toHaveBeenCalledTimes(2));
  });

  it('switches language from the available-language chips and refetches', async () => {
    const user = userEvent.setup();
    poiMock.mockResolvedValue(DETAIL());
    renderDetail();
    await screen.findByRole('heading', { name: 'Địa đạo Bến Dược' });

    await user.click(screen.getByRole('button', { name: 'English' }));
    await waitFor(() => expect(poiMock).toHaveBeenCalledWith('1', 'en'));
    expect(localStorage.getItem('tm.lang')).toBe('en');
  });
});
