import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { poiApi } from '../api/endpoints.js';
import PoiListPage from './PoiListPage.jsx';

vi.mock('../api/endpoints.js', () => ({
  poiApi: { list: vi.fn() },
}));

const page = (overrides = {}) => ({
  items: [],
  page: 0,
  size: 10,
  totalItems: 0,
  totalPages: 0,
  ...overrides,
});

describe('PoiListPage', () => {
  beforeEach(() => {
    poiApi.list.mockReset();
    poiApi.list.mockResolvedValue(page());
  });

  afterEach(() => cleanup());

  function renderPage(initialEntry = '/pois') {
    return render(
      <MemoryRouter initialEntries={[initialEntry]}>
        <PoiListPage />
      </MemoryRouter>,
    );
  }

  it('loads POIs from the API and offers page-size choices', async () => {
    poiApi.list.mockResolvedValue(
      page({
        items: [{
          id: 1,
          code: 'BEN-DUOC',
          defaultName: 'Địa đạo Bến Dược',
          latitude: 11.143,
          longitude: 106.4618,
          status: 'DRAFT',
          demo: false,
          updatedAt: '2026-01-01T00:00:00Z',
          languages: [],
        }],
        totalItems: 1,
      }),
    );
    renderPage();

    expect(await screen.findByText('Địa đạo Bến Dược')).toBeInTheDocument();
    expect(poiApi.list).toHaveBeenCalledWith({
      page: 0,
      size: 10,
      status: undefined,
      q: undefined,
    });
    expect(screen.getByRole('combobox', { name: 'Kích thước trang' })).toBeInTheDocument();
  });

  it('uses URL filters and requests the selected page size', async () => {
    const user = userEvent.setup();
    renderPage('/pois?status=PUBLISHED&q=ben&page=2&size=20');

    await waitFor(() => {
      expect(poiApi.list).toHaveBeenCalledWith({
        page: 2,
        size: 20,
        status: 'PUBLISHED',
        q: 'ben',
      });
    });

    await user.selectOptions(screen.getByRole('combobox', { name: 'Kích thước trang' }), '50');

    await waitFor(() => {
      expect(poiApi.list).toHaveBeenLastCalledWith({
        page: 0,
        size: 50,
        status: 'PUBLISHED',
        q: 'ben',
      });
    });
  });

  it('shows an API error and retries on request', async () => {
    const user = userEvent.setup();
    poiApi.list.mockRejectedValueOnce(new Error('Backend không phản hồi'));
    renderPage();

    expect(await screen.findByRole('alert')).toHaveTextContent('Backend không phản hồi');
    poiApi.list.mockResolvedValueOnce(page());
    await user.click(screen.getByRole('button', { name: 'Thử lại' }));

    await waitFor(() => expect(poiApi.list).toHaveBeenCalledTimes(2));
    expect(await screen.findByText(/Chưa có POI nào/)).toBeInTheDocument();
  });
});
