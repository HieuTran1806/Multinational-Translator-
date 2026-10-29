import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { analyticsApi } from '../api/endpoints.js';
import AnalyticsPage from './AnalyticsPage.jsx';

vi.mock('../api/endpoints.js', () => ({
  analyticsApi: { summary: vi.fn() },
}));

const SUMMARY = {
  totals: { poi_view: 12, audio_play: 7, session_start: 3 },
  daily: [
    { day: '2026-10-27', eventType: 'poi_view', count: 8 },
    { day: '2026-10-27', eventType: 'audio_play', count: 5 },
    { day: '2026-10-28', eventType: 'poi_view', count: 4 },
  ],
  topPois: [{ poiId: 5, views: 8 }],
  qrByStatus: { ISSUED: 2, REDEEMED: 4 },
  generatedAt: '2026-10-28T03:00:00Z',
};

describe('UsageSummary dashboard (UC14 system analytics)', () => {
  beforeEach(() => {
    analyticsApi.summary.mockReset().mockResolvedValue(SUMMARY);
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('UC14: renders KPIs, per-day table and top POIs from the backend data', async () => {
    render(<AnalyticsPage />);
    expect((await screen.findAllByText('12')).length).toBeGreaterThan(0);
    expect((await screen.findAllByText('Lượt xem POI')).length).toBeGreaterThan(0);
    expect(await screen.findByText('POI được xem nhiều nhất')).toBeInTheDocument();
    expect(screen.getByText(/POI #5/)).toBeInTheDocument();
    expect(screen.getByText(/cập nhật lúc/)).toBeInTheDocument();
  });

  it('shows the empty state when there is no usage data', async () => {
    analyticsApi.summary.mockResolvedValue({ ...SUMMARY, totals: {}, daily: [], topPois: [] });
    render(<AnalyticsPage />);
    expect(await screen.findByText(/Chưa có dữ liệu sử dụng/)).toBeInTheDocument();
  });

  it('shows an error with retry when the API fails', async () => {
    analyticsApi.summary.mockRejectedValue(Object.assign(new Error('Không kết nối được máy chủ'), { code: 'NETWORK_ERROR' }));
    render(<AnalyticsPage />);
    expect(await screen.findByText('Không kết nối được máy chủ')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Thử lại' })).toBeInTheDocument();
  });
});
