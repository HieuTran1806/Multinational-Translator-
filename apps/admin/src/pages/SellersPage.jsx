import { useEffect, useId, useState } from 'react';
import { useSearchParams } from 'react-router';
import { sellersApi } from '../api/endpoints.js';
import Pagination from '../components/Pagination.jsx';
import { Alert, Button, Card, Field, Spinner, inputClass } from '../components/ui.jsx';

const PAGE_SIZE = 20;

const fmt = (iso) => (iso ? new Date(iso).toLocaleString('vi-VN') : '—');

function CreateSellerForm({ onCreated }) {
  const usernameId = useId();
  const passwordId = useId();
  const displayNameId = useId();
  const [form, setForm] = useState({ username: '', password: '', displayName: '' });
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await sellersApi.create(form);
      setForm({ username: '', password: '', displayName: '' });
      onCreated();
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-3">
      <Field label="Tên đăng nhập" htmlFor={usernameId}>
        <input
          id={usernameId}
          className={inputClass}
          required
          minLength={3}
          maxLength={64}
          pattern="[a-zA-Z0-9_.\-]+"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          placeholder="seller_01"
        />
      </Field>
      <Field label="Mật khẩu" htmlFor={passwordId} error={error?.fieldMap()?.password}>
        <input
          id={passwordId}
          type="password"
          className={inputClass}
          required
          minLength={6}
          maxLength={200}
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
      </Field>
      <Field label="Tên hiển thị (không bắt buộc)" htmlFor={displayNameId} error={error?.fieldMap()?.displayName}>
        <input
          id={displayNameId}
          className={inputClass}
          maxLength={120}
          value={form.displayName}
          onChange={(e) => setForm({ ...form, displayName: e.target.value })}
        />
      </Field>
      {error && !error.fieldErrors?.length && <div className="sm:col-span-3"><Alert>{error.message}</Alert></div>}
      <div className="sm:col-span-3">
        <Button type="submit" loading={saving}>
          Tạo Seller
        </Button>
      </div>
    </form>
  );
}

/**
 * UC09: Admin creates and manages Seller accounts — enable/disable, reset password, soft delete.
 * The backend rejects Super Admin here on purpose (Super Admin must not manage Sellers).
 */
export default function SellersPage() {
  const [params, setParams] = useSearchParams();
  const page = Math.max(0, Number(params.get('page') || 0));
  const q = params.get('q') || '';
  const [reloadToken, setReloadToken] = useState(0);
  const key = `${page}|${q}|${reloadToken}`;
  const [result, setResult] = useState({ key: null, data: null, error: null });
  const [actionError, setActionError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [resetTarget, setResetTarget] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [qDraft, setQDraft] = useState(q);

  useEffect(() => {
    let cancelled = false;
    sellersApi
      .list({ page, size: PAGE_SIZE, q: q || undefined })
      .then((data) => !cancelled && setResult({ key, data, error: null }))
      .catch((error) => !cancelled && setResult({ key, data: null, error }));
    return () => {
      cancelled = true;
    };
  }, [key, page, q]);

  const loading = result.key !== key;
  const reload = () => setReloadToken((n) => n + 1);

  function update(next) {
    const p = new URLSearchParams(params);
    Object.entries(next).forEach(([k, v]) => (v === '' || v == null ? p.delete(k) : p.set(k, String(v))));
    setParams(p);
  }

  async function act(id, fn) {
    setBusyId(id);
    setActionError(null);
    try {
      await fn();
      reload();
    } catch (error) {
      setActionError(error);
    } finally {
      setBusyId(null);
    }
  }

  const toggle = (s) =>
    act(s.id, () => sellersApi.update(s.id, { enabled: !s.enabled }));
  const remove = (s) => {
    if (!window.confirm(`Xóa mềm Seller "${s.username}"? Tài khoản sẽ không đăng nhập được nữa nhưng lịch sử được giữ.`))
      return;
    return act(s.id, () => sellersApi.remove(s.id));
  };
  const resetPassword = (s) =>
    act(s.id, () => sellersApi.resetPassword(s.id, newPassword).then(() => {
      setResetTarget(null);
      setNewPassword('');
    }));

  const sellers = result.data?.items ?? [];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="text-[26px] font-bold text-forest">Tài khoản Seller</h1>
        <p className="text-sm text-stone">
          Tạo và quản lý tài khoản Seller. Seller không tự đăng ký và chỉ thao tác trên dữ liệu của chính mình.
        </p>
      </header>

      <Card title="Tạo Seller mới">
        <CreateSellerForm onCreated={reload} />
      </Card>

      <Card
        title="Danh sách Seller"
        actions={
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              update({ q: qDraft.trim(), page: 0 });
            }}
          >
            <input
              className={`${inputClass} !py-1.5`}
              placeholder="Tìm theo tên…"
              aria-label="Tìm Seller"
              value={qDraft}
              onChange={(e) => setQDraft(e.target.value)}
            />
            <Button variant="secondary" className="!py-1.5" type="submit">
              Tìm
            </Button>
          </form>
        }
      >
        {actionError && <Alert>{actionError.message}</Alert>}
        {loading ? (
          <Spinner label="Đang tải danh sách Seller…" />
        ) : result.error ? (
          <Alert
            action={
              <Button variant="secondary" onClick={reload}>
                Thử lại
              </Button>
            }
          >
            {result.error.message}
          </Alert>
        ) : sellers.length === 0 ? (
          <p className="py-6 text-center text-sm text-stone">
            {q ? 'Không có Seller nào khớp từ khóa.' : 'Chưa có Seller nào. Tạo Seller đầu tiên ở trên.'}
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-muted">
                  <tr>
                    <th className="py-2 pr-4">Tên đăng nhập</th>
                    <th className="py-2 pr-4">Tên hiển thị</th>
                    <th className="py-2 pr-4">Trạng thái</th>
                    <th className="py-2 pr-4">Tạo lúc</th>
                    <th className="py-2">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {sellers.map((s) => (
                    <tr key={s.id} className="border-t border-shell-border">
                      <td className="py-2.5 pr-4 font-semibold text-forest">{s.username}</td>
                      <td className="py-2.5 pr-4">{s.displayName || '—'}</td>
                      <td className="py-2.5 pr-4">
                        {s.enabled ? (
                          <span className="rounded-full bg-olive/15 px-2.5 py-0.5 text-xs font-semibold text-forest">
                            Đang hoạt động
                          </span>
                        ) : (
                          <span className="rounded-full bg-danger/15 px-2.5 py-0.5 text-xs font-semibold text-danger">
                            Đã vô hiệu hóa
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 pr-4 text-stone">{fmt(s.createdAt)}</td>
                      <td className="py-2.5">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="secondary"
                            className="!px-3 !py-1 text-xs"
                            disabled={busyId === s.id}
                            onClick={() => toggle(s)}
                          >
                            {s.enabled ? 'Vô hiệu hóa' : 'Kích hoạt lại'}
                          </Button>
                          <Button
                            variant="secondary"
                            className="!px-3 !py-1 text-xs"
                            onClick={() => setResetTarget(resetTarget === s.id ? null : s.id)}
                          >
                            Đặt lại mật khẩu
                          </Button>
                          <Button
                            variant="ghost"
                            className="!px-3 !py-1 text-xs text-danger"
                            disabled={busyId === s.id}
                            onClick={() => remove(s)}
                          >
                            Xóa
                          </Button>
                        </div>
                        {resetTarget === s.id && (
                          <form
                            className="mt-2 flex max-w-sm gap-2"
                            onSubmit={(e) => {
                              e.preventDefault();
                              resetPassword(s);
                            }}
                          >
                            <input
                              type="password"
                              className={inputClass}
                              required
                              minLength={6}
                              placeholder="Mật khẩu mới"
                              aria-label={`Mật khẩu mới cho ${s.username}`}
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                            />
                            <Button className="!py-1.5 text-xs" type="submit" loading={busyId === s.id}>
                              Lưu
                            </Button>
                          </form>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={page}
              totalPages={result.data.totalPages}
              totalItems={result.data.totalItems}
              onChange={(p) => update({ page: p })}
              unit="Seller"
            />
          </>
        )}
      </Card>
    </div>
  );
}
