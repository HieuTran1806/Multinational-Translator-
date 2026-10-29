import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { auditApi } from '../api/endpoints.js';
import Pagination from '../components/Pagination.jsx';
import { Alert, Button, Card, Spinner, inputClass } from '../components/ui.jsx';

const PAGE_SIZE = 20;

const ACTIONS = [
  ['', 'Tất cả hành động'],
  ['ADMIN_CREATE', 'Tạo tài khoản Admin'],
  ['ADMIN_UPDATE', 'Cập nhật tài khoản Admin'],
  ['ADMIN_RESET_PASSWORD', 'Đặt lại mật khẩu Admin'],
  ['QR_ISSUE', 'Tạo QR'],
  ['QR_REDEEM', 'Kích hoạt QR'],
  ['QR_REVOKE', 'Thu hồi QR'],
];

const RESULT_BADGE = {
  SUCCESS: 'bg-olive/15 text-forest',
  DENIED: 'bg-danger/15 text-danger',
  FAILURE: 'bg-danger/15 text-danger',
};

const fmt = (iso) => (iso ? new Date(iso).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) : '—');

/**
 * UC15 — read-only audit log lookup for Super Admin. The backend is the only writer and rejects
 * every other role here (403), including Admin.
 */
export default function AuditLogPage() {
  const [params, setParams] = useSearchParams();
  const page = Math.max(0, Number(params.get('page') || 0));
  const action = params.get('action') || '';
  const result = params.get('result') || '';
  const resourceType = params.get('resourceType') || '';
  const actorId = params.get('actorId') || '';
  const [reloadToken, setReloadToken] = useState(0);
  const key = `${page}|${action}|${result}|${resourceType}|${actorId}|${reloadToken}`;
  const [state, setState] = useState({ key: null, data: null, error: null });

  useEffect(() => {
    let cancelled = false;
    auditApi
      .list({ page, size: PAGE_SIZE, action, result, resourceType, actorId: actorId || undefined })
      .then((data) => !cancelled && setState({ key, data, error: null }))
      .catch((error) => !cancelled && setState({ key, data: null, error }));
    return () => {
      cancelled = true;
    };
  }, [key, page, action, result, resourceType, actorId]);

  const loading = state.key !== key;
  const reload = () => setReloadToken((n) => n + 1);

  function update(next) {
    const p = new URLSearchParams(params);
    Object.entries(next).forEach(([k, v]) => (v === '' || v == null ? p.delete(k) : p.set(k, String(v))));
    setParams(p);
  }

  const items = state.data?.items ?? [];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="text-[26px] font-bold text-forest">Audit Log</h1>
        <p className="text-sm text-stone">
          Lịch sử các sự kiện quản trị và nghiệp vụ quan trọng, do backend ghi nhận. Chỉ xem, không sửa được.
        </p>
      </header>

      <Card title="Bộ lọc">
        <form
          className="grid gap-3 sm:grid-cols-4"
          onSubmit={(e) => {
            e.preventDefault();
            update({ page: 0 });
          }}
        >
          <label className="text-xs font-medium text-muted">
            Hành động
            <select
              className={`${inputClass} mt-1`}
              value={action}
              onChange={(e) => update({ action: e.target.value, page: 0 })}
            >
              {ACTIONS.map(([v, label]) => (
                <option key={v} value={v}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium text-muted">
            Kết quả
            <select
              className={`${inputClass} mt-1`}
              value={result}
              onChange={(e) => update({ result: e.target.value, page: 0 })}
            >
              <option value="">Tất cả</option>
              <option value="SUCCESS">Thành công</option>
              <option value="DENIED">Bị từ chối</option>
              <option value="FAILURE">Thất bại</option>
            </select>
          </label>
          <label className="text-xs font-medium text-muted">
            Loại đối tượng
            <input
              className={`${inputClass} mt-1`}
              placeholder="ACCOUNT / ACCESS_QR…"
              value={resourceType}
              onChange={(e) => update({ resourceType: e.target.value, page: 0 })}
            />
          </label>
          <label className="text-xs font-medium text-muted">
            ID người thực hiện
            <input
              className={`${inputClass} mt-1`}
              inputMode="numeric"
              value={actorId}
              onChange={(e) => update({ actorId: e.target.value.replace(/\D/g, ''), page: 0 })}
            />
          </label>
        </form>
      </Card>

      <Card>
        {loading ? (
          <Spinner label="Đang tải audit log…" />
        ) : state.error ? (
          <Alert
            action={
              <Button variant="secondary" onClick={reload}>
                Thử lại
              </Button>
            }
          >
            {state.error.message}
          </Alert>
        ) : items.length === 0 ? (
          <p className="py-6 text-center text-sm text-stone">Không có bản ghi nào khớp bộ lọc.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-muted">
                  <tr>
                    <th className="py-2 pr-4">Thời điểm</th>
                    <th className="py-2 pr-4">Người thực hiện</th>
                    <th className="py-2 pr-4">Hành động</th>
                    <th className="py-2 pr-4">Đối tượng</th>
                    <th className="py-2 pr-4">Kết quả</th>
                    <th className="py-2">Chi tiết</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((a) => (
                    <tr key={a.id} className="border-t border-shell-border">
                      <td className="py-2.5 pr-4 whitespace-nowrap text-stone">{fmt(a.occurredAt)}</td>
                      <td className="py-2.5 pr-4">
                        {a.actorName || (a.actorId != null ? `#${a.actorId}` : 'Hệ thống')}
                      </td>
                      <td className="py-2.5 pr-4 font-semibold text-forest">{a.action}</td>
                      <td className="py-2.5 pr-4">
                        {a.resourceType}
                        {a.resourceId ? ` #${a.resourceId}` : ''}
                      </td>
                      <td className="py-2.5 pr-4">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            RESULT_BADGE[a.result] ?? 'bg-stone/15 text-stone'
                          }`}
                        >
                          {a.result === 'DENIED' ? 'Từ chối' : a.result === 'FAILURE' ? 'Thất bại' : 'Thành công'}
                        </span>
                      </td>
                      <td className="py-2.5 text-xs text-stone">{a.detail || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={page}
              totalPages={state.data.totalPages}
              totalItems={state.data.totalItems}
              onChange={(p) => update({ page: p })}
              unit="bản ghi"
            />
          </>
        )}
      </Card>
    </div>
  );
}
