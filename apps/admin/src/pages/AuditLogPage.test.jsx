import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { auditApi } from '../api/endpoints.js';
import AuditLogPage from './AuditLogPage.jsx';

vi.mock('../api/endpoints.js', () => ({
  auditApi: { list: vi.fn() },
}));

const page = (items = []) => ({ items, page: 0, size: 20, totalItems: items.length, totalPages: items.length ? 1 : 0 });
const ENTRY = (over = {}) => ({
  id: 11,
  occurredAt: '2026-10-27T09:30:00Z',
  actorId: 1,
  actorName: 'it_admin',
  action: 'ADMIN_CREATE',
  resourceType: 'ACCOUNT',
  resourceId: '3',
  result: 'SUCCESS',
  detail: 'username=admin01',
  ...over,
});

describe('AuditLogPage (UC15 – Super Admin tra cứu audit log)', () => {
  beforeEach(() => {
    auditApi.list.mockReset().mockResolvedValue(page());
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders audit entries with actor, action, resource and result', async () => {
    auditApi.list.mockResolvedValue(page([
      ENTRY(),
      ENTRY({ id: 12, action: 'QR_REDEEM', resourceType: 'ACCESS_QR', result: 'DENIED', actorId: null, actorName: null, detail: 'already_used' }),
    ]));
    render(
      <MemoryRouter initialEntries={['/audit']}>
        <AuditLogPage />
      </MemoryRouter>,
    );
    const table = (await screen.findByText('ADMIN_CREATE')).closest('table');
    expect(within(table).getByText('it_admin')).toBeInTheDocument();
    expect(within(table).getByText('Thành công')).toBeInTheDocument();
    expect(within(table).getByText('ACCOUNT #3')).toBeInTheDocument();
    expect(within(table).getByText('Từ chối')).toBeInTheDocument();
    expect(within(table).getByText('Hệ thống')).toBeInTheDocument();
  });

  it('shows the empty state', async () => {
    render(
      <MemoryRouter initialEntries={['/audit']}>
        <AuditLogPage />
      </MemoryRouter>,
    );
    expect(await screen.findByText('Không có bản ghi nào khớp bộ lọc.')).toBeInTheDocument();
  });

  it('filters by action and result through the API', async () => {
    render(
      <MemoryRouter initialEntries={['/audit']}>
        <AuditLogPage />
      </MemoryRouter>,
    );
    await screen.findByRole('combobox', { name: 'Hành động' });
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Hành động' }), 'ADMIN_CREATE');
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Kết quả' }), 'DENIED');
    await waitFor(() => {
      const last = auditApi.list.mock.calls.at(-1)[0];
      expect(last.action).toBe('ADMIN_CREATE');
      expect(last.result).toBe('DENIED');
      expect(last.page).toBe(0);
    });
  });
});
