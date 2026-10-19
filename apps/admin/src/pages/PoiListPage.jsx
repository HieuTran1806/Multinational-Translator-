import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { poiApi } from '../api/endpoints.js';
import Pagination from '../components/Pagination.jsx';
import { Alert, AudioBadge, Button, Card, PoiStatusBadge, Spinner, inputClass } from '../components/ui.jsx';
import { LANGUAGE_LABELS } from '../config.js';

const PAGE_SIZE = 10;

export default function PoiListPage() {
  const [params, setParams] = useSearchParams();
  const page = Math.max(0, Number(params.get('page') || 0));
  const status = params.get('status') || '';
  const q = params.get('q') || '';
  const requestedSize = Number(params.get('size') || PAGE_SIZE);
  const size = [10, 20, 50, 100].includes(requestedSize) ? requestedSize : PAGE_SIZE;
  const [search, setSearch] = useState(q);
  const [reloadToken, setReloadToken] = useState(0);
  const key = `${page}|${size}|${status}|${q}|${reloadToken}`;
  const [result, setResult] = useState({ key: null, data: null, error: null });

  useEffect(() => {
    let cancelled = false;
    poiApi
      .list({ page, size, status: status || undefined, q: q || undefined })
      .then((data) => !cancelled && setResult({ key, data, error: null }))
      .catch((error) => !cancelled && setResult({ key, data: null, error }));
    return () => {
      cancelled = true;
    };
  }, [key, page, size, status, q]);

  const state = { loading: result.key !== key, data: result.data, error: result.error };
  const load = () => setReloadToken((n) => n + 1);

  function update(next) {
    const p = new URLSearchParams(params);
    Object.entries(next).forEach(([k, v]) => (v === '' || v == null ? p.delete(k) : p.set(k, String(v))));
    setParams(p);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-forest">Quản lý POI</h1>
          <p className="text-sm text-stone">Địa điểm, nội dung theo ngôn ngữ và trạng thái audio</p>
        </div>
        <Link to="/pois/new">
          <Button>+ Thêm POI</Button>
        </Link>
      </header>

      <Card>
        <form
          className="mb-4 flex flex-wrap gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            update({ q: search.trim(), page: 0 });
          }}
        >
          <input
            aria-label="Tìm kiếm"
            className={`${inputClass} max-w-xs`}
            placeholder="Tìm theo tên hoặc mã…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            aria-label="Lọc trạng thái"
            className={`${inputClass} max-w-[12rem]`}
            value={status}
            onChange={(e) => update({ status: e.target.value, page: 0 })}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="PUBLISHED">Công khai</option>
            <option value="DRAFT">Nháp</option>
          </select>
          <label className="flex items-center gap-2 text-sm text-stone">
            <span>Kích thước trang</span>
            <select
              aria-label="Kích thước trang"
              className={`${inputClass} w-auto min-w-[5rem]`}
              value={String(size)}
              onChange={(e) => update({ size: e.target.value, page: 0 })}
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </label>
          <Button type="submit" variant="secondary">
            Tìm
          </Button>
        </form>

        {state.loading && (
          <div className="py-10 text-center text-stone">
            <Spinner label="Đang tải danh sách…" />
          </div>
        )}
        {!state.loading && state.error && (
          <Alert
            title="Không thể tải danh sách POI"
            action={
              <Button variant="secondary" onClick={() => load()}>
                Thử lại
              </Button>
            }
          >
            {state.error.message}
          </Alert>
        )}
        {!state.loading && state.data && state.data.items.length === 0 && (
          <div className="py-10 text-center text-stone">
            {q || status ? 'Không tìm thấy kết quả phù hợp.' : 'Chưa có POI nào. Hãy thêm địa điểm đầu tiên.'}
          </div>
        )}
        {!state.loading && state.data && state.data.items.length > 0 && (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b border-stone/20 text-xs uppercase tracking-wide text-stone">
                  <tr>
                    <th className="py-2 pr-3">Tên / Mã</th>
                    <th className="py-2 pr-3">Toạ độ</th>
                    <th className="py-2 pr-3">Trạng thái</th>
                    <th className="py-2 pr-3">Nội dung &amp; audio</th>
                    <th className="py-2 pr-3">Cập nhật</th>
                  </tr>
                </thead>
                <tbody>
                  {state.data.items.map((p) => (
                    <tr key={p.id} className="border-b border-stone/10 align-top">
                      <td className="py-3 pr-3">
                        <Link to={`/pois/${p.id}`} className="font-semibold text-forest hover:underline">
                          {p.defaultName}
                        </Link>
                        <div className="text-xs text-stone">
                          {p.code}
                          {p.demo && <span className="ml-2 rounded bg-terracotta/15 px-1 text-terracotta">DEMO</span>}
                        </div>
                      </td>
                      <td className="py-3 pr-3 tabular-nums text-stone">
                        {p.latitude.toFixed(5)}, {p.longitude.toFixed(5)}
                      </td>
                      <td className="py-3 pr-3">
                        <PoiStatusBadge status={p.status} />
                      </td>
                      <td className="py-3 pr-3">
                        {p.languages.length === 0 && <span className="text-xs text-stone">Chưa có nội dung</span>}
                        <ul className="space-y-1">
                          {p.languages.map((l) => (
                            <li key={l.languageCode} className="flex items-center gap-2">
                              <span className="w-20 text-xs">{LANGUAGE_LABELS[l.languageCode] ?? l.languageCode}</span>
                              <AudioBadge status={l.audio} />
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className="py-3 pr-3 text-xs text-stone">
                        {new Date(p.updatedAt).toLocaleString('vi-VN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={state.data.page}
              totalPages={state.data.totalPages}
              totalItems={state.data.totalItems}
              onChange={(next) => update({ page: next })}
            />
          </div>
        )}
      </Card>
    </div>
  );
}
