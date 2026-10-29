import { useEffect, useId, useState } from 'react';
import { useSearchParams } from 'react-router';
import { adminAccountsApi } from '../api/endpoints.js';
import { useAuth } from '../auth/AuthContext.jsx';
import Pagination from '../components/Pagination.jsx';
import { Alert, Button, Card, Field, Spinner, inputClass } from '../components/ui.jsx';

/**
 * UC10 — Super Admin manages Admin/Super Admin accounts.
 * The backend is the source of truth: it rejects every role except SUPER_ADMIN and refuses self-disable,
 * self role change and any operation that would leave no active Super Admin (E2).
 */

const PAGE_SIZE = 20;
const ADMIN_ROLES = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
];
const ROLE_LABEL = { ADMIN: 'Admin', SUPER_ADMIN: 'Super Admin' };

const fmt = (iso) => (iso ? new Date(iso).toLocaleString('vi-VN') : '—');

function RoleBadge({ role }) {
  const superAdmin = role === 'SUPER_ADMIN';
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        superAdmin ? 'bg-terracotta/15 text-earth' : 'bg-sand text-charcoal'
      }`}
    >
      {ROLE_LABEL[role] ?? role}
    </span>
  );
}

function CreateAccountForm({ onCreated }) {
  const usernameId = useId();
  const passwordId = useId();
  const displayNameId = useId();
  const roleId = useId();
  const [form, setForm] = useState({ username: '', password: '', displayName: '', role: 'ADMIN' });
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      await adminAccountsApi.create({
        username: form.username.trim(),
        password: form.password,
        displayName: form.displayName.trim() || null,
        role: form.role,
      });
      setForm({ username: '', password: '', displayName: '', role: 'ADMIN' });
      onCreated();
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Field label="Tên đăng nhập" htmlFor={usernameId} error={error?.fieldMap()?.username}>
        <input
          id={usernameId}
          className={inputClass}
          required
          minLength={3}
          maxLength={64}
          pattern="[a-zA-Z0-9_.\-]+"
          autoComplete="off"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          placeholder="admin_04"
        />
      </Field>
      <Field label="Mật khẩu" htmlFor={passwordId} error={error?.fieldMap()?.password} hint="Tối thiểu 6 ký tự.">
        <input
          id={passwordId}
          type="password"
          className={inputClass}
          required
          minLength={6}
          maxLength={200}
          autoComplete="new-password"
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
      <Field label="Vai trò" htmlFor={roleId} error={error?.fieldMap()?.role}>
        <select
          id={roleId}
          className={inputClass}
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
        >
          {ADMIN_ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </Field>
      {error && !error.fieldErrors?.length && (
        <div className="sm:col-span-2 lg:col-span-4">
          <Alert>{error.message}</Alert>
        </div>
      )}
      <div className="sm:col-span-2 lg:col-span-4">
        <Button type="submit" loading={saving}>
          Tạo tài khoản
        </Button>
      </div>
    </form>
  );
}

export default function AdminAccountsPage() {
  const { account: me } = useAuth();
  const [params, setParams] = useSearchParams();
  const page = Math.max(0, Number(params.get('page') || 0));
  const q = params.get('q') || '';
  const role = params.get('role') || '';
  const [reloadToken, setReloadToken] = useState(0);
  const key = `${page}|${q}|${role}|${reloadToken}`;
  const [result, setResult] = useState({ key: null, data: null, error: null });
  const [actionError, setActionError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [resetTarget, setResetTarget] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [qDraft, setQDraft] = useState(q);

  useEffect(() => {
    let cancelled = false;
    adminAccountsApi
      .list({ page, size: PAGE_SIZE, q: q || undefined, role: role || undefined })
      .then((data) => !cancelled && setResult({ key, data, error: null }))
      .catch((error) => !cancelled && setResult({ key, data: null, error }));
    return () => {
      cancelled = true;
    };
  }, [key, page, q, role]);

  const loading = result.key !== key;
  const reload = () => setReloadToken((n) => n + 1);

  function updateParams(next) {
    const p = new URLSearchParams(params);
    Object.entries(next).forEach(([k, v]) => (v === '' || v == null ? p.delete(k) : p.set(k, String(v))));
    setParams(p);
  }

  async function act(id, fn, successMessage) {
    if (busyId === id) return;
    setBusyId(id);
    setActionError(null);
    setNotice(null);
    try {
      await fn();
      setNotice(successMessage);
      reload();
    } catch (error) {
      setActionError(error);
    } finally {
      setBusyId(null);
    }
  }

  const toggle = (a) => {
    const disabling = a.enabled;
    if (disabling && !window.confirm(`Vô hiệu hóa tài khoản "${a.username}"? Người dùng sẽ không đăng nhập được nữa.`)) {
      return undefined;
    }
    return act(
      a.id,
      () => adminAccountsApi.update(a.id, { enabled: !a.enabled }),
      `Đã ${disabling ? 'vô hiệu hóa' : 'kích hoạt lại'} "${a.username}".`,
    );
  };

  const changeRole = (a, nextRole) => {
    if (nextRole === a.role) return undefined;
    if (
      !window.confirm(
        `Đổi vai trò của "${a.username}" từ ${ROLE_LABEL[a.role]} sang ${ROLE_LABEL[nextRole]}? ` +
          'Quyền truy cập của tài khoản này thay đổi ngay sau khi lưu.',
      )
    ) {
      return undefined;
    }
    return act(a.id, () => adminAccountsApi.update(a.id, { role: nextRole }), `Đã đổi vai trò "${a.username}".`);
  };

  const resetPassword = (a) =>
    act(
      a.id,
      () =>
        adminAccountsApi.resetPassword(a.id, newPassword).then(() => {
          setResetTarget(null);
          setNewPassword('');
        }),
      `Đã đặt lại mật khẩu cho "${a.username}".`,
    );

  const accounts = result.data?.items ?? [];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="text-[26px] font-bold text-forest">Tài khoản Admin</h1>
        <p className="text-sm text-stone">
          Super Admin tạo và quản lý tài khoản Admin/Super Admin: đổi tên hiển thị, vai trò, trạng thái hoạt động và
          đặt lại mật khẩu. Tài khoản Seller được quản lý riêng ở mục “Tài khoản Seller”.
        </p>
      </header>

      <Card title="Tạo tài khoản quản trị">
        <CreateAccountForm onCreated={reload} />
      </Card>

      <Card
        title="Danh sách tài khoản quản trị"
        actions={
          <form
            className="flex flex-wrap items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              updateParams({ q: qDraft.trim(), page: 0 });
            }}
          >
            <input
              className={`${inputClass} !w-auto !py-1.5`}
              placeholder="Tìm theo tên…"
              aria-label="Tìm tài khoản quản trị"
              value={qDraft}
              onChange={(e) => setQDraft(e.target.value)}
            />
            <select
              className={`${inputClass} !w-auto !py-1.5`}
              aria-label="Lọc theo vai trò"
              value={role}
              onChange={(e) => updateParams({ role: e.target.value, page: 0 })}
            >
              <option value="">Tất cả vai trò</option>
              {ADMIN_ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            <Button variant="secondary" className="!py-1.5" type="submit">
              Tìm
            </Button>
          </form>
        }
      >
        {notice && <div className="mb-3"><Alert kind="success">{notice}</Alert></div>}
        {actionError && <div className="mb-3"><Alert>{actionError.message}</Alert></div>}
        {loading ? (
          <Spinner label="Đang tải danh sách tài khoản quản trị…" />
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
        ) : accounts.length === 0 ? (
          <p className="py-6 text-center text-sm text-stone">
            {q || role
              ? 'Không có tài khoản quản trị nào khớp bộ lọc.'
              : 'Chưa có tài khoản quản trị nào. Tạo tài khoản đầu tiên ở trên.'}
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-muted">
                  <tr>
                    <th className="py-2 pr-4">Tên đăng nhập</th>
                    <th className="py-2 pr-4">Tên hiển thị</th>
                    <th className="py-2 pr-4">Vai trò</th>
                    <th className="py-2 pr-4">Trạng thái</th>
                    <th className="py-2 pr-4">Tạo lúc</th>
                    <th className="py-2">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((a) => {
                    const isSelf = me?.id === a.id;
                    return (
                      <tr key={a.id} className="border-t border-shell-border align-top">
                        <td className="py-2.5 pr-4 font-semibold text-forest">
                          {a.username}
                          {isSelf && <span className="ml-2 text-xs font-normal text-muted">(bạn)</span>}
                        </td>
                        <td className="py-2.5 pr-4">{a.displayName || '—'}</td>
                        <td className="py-2.5 pr-4">
                          <RoleBadge role={a.role} />
                        </td>
                        <td className="py-2.5 pr-4">
                          {a.enabled ? (
                            <span className="rounded-full bg-olive/15 px-2.5 py-0.5 text-xs font-semibold text-forest">
                              Đang hoạt động
                            </span>
                          ) : (
                            <span className="rounded-full bg-danger/15 px-2.5 py-0.5 text-xs font-semibold text-danger">
                              Đã vô hiệu hóa
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 pr-4 text-stone">{fmt(a.createdAt)}</td>
                        <td className="py-2.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <select
                              className={`${inputClass} !w-auto !px-2 !py-1 text-xs`}
                              aria-label={`Vai trò của ${a.username}`}
                              value={a.role}
                              disabled={isSelf || busyId === a.id}
                              onChange={(e) => changeRole(a, e.target.value)}
                            >
                              {ADMIN_ROLES.map((r) => (
                                <option key={r.value} value={r.value}>
                                  {r.label}
                                </option>
                              ))}
                            </select>
                            <Button
                              variant="secondary"
                              className="!px-3 !py-1 text-xs"
                              disabled={isSelf || busyId === a.id}
                              title={isSelf ? 'Không thể tự vô hiệu hóa tài khoản của mình' : undefined}
                              onClick={() => toggle(a)}
                            >
                              {a.enabled ? 'Vô hiệu hóa' : 'Kích hoạt lại'}
                            </Button>
                            <Button
                              variant="secondary"
                              className="!px-3 !py-1 text-xs"
                              onClick={() => {
                                setNewPassword('');
                                setResetTarget(resetTarget === a.id ? null : a.id);
                              }}
                            >
                              Đặt lại mật khẩu
                            </Button>
                          </div>
                          {resetTarget === a.id && (
                            <form
                              className="mt-2 flex max-w-sm gap-2"
                              onSubmit={(e) => {
                                e.preventDefault();
                                resetPassword(a);
                              }}
                            >
                              <input
                                type="password"
                                className={inputClass}
                                required
                                minLength={6}
                                maxLength={200}
                                autoComplete="new-password"
                                placeholder="Mật khẩu mới"
                                aria-label={`Mật khẩu mới cho ${a.username}`}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                              />
                              <Button className="!py-1.5 text-xs" type="submit" loading={busyId === a.id}>
                                Lưu
                              </Button>
                            </form>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination
              page={page}
              totalPages={result.data.totalPages}
              totalItems={result.data.totalItems}
              onChange={(p) => updateParams({ page: p })}
              unit="tài khoản"
            />
          </>
        )}
      </Card>
    </div>
  );
}
