import { useEffect, useState } from 'react';
import { Alert, Button, Card, Spinner } from './ui.jsx';

const fmtDay = (day) => new Date(`${day}T00:00:00Z`).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
const fmtTime = (iso) => (iso ? new Date(iso).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) : '—');

const EVENT_LABELS = {
  poi_view: 'Lượt xem POI',
  audio_play: 'Lượt phát audio',
  session_start: 'Lượt bắt đầu phiên',
};

const daysBack = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 19) + 'Z';

/** One row per UTC day, event types as columns. */
function pivotDaily(daily) {
  const byDay = new Map();
  for (const row of daily || []) {
    const e = byDay.get(row.day) ?? { day: row.day };
    e[row.eventType] = Number(row.count);
    byDay.set(row.day, e);
  }
  return [...byDay.values()];
}

/** Shared UC13/UC14 dashboard body: KPIs, per-day series and top POIs, all served by the backend. */
export default function UsageSummary({ title, subtitle, fetchSummary, rangeState, reloadToken: externalReloadToken = 0 }) {
  const [result, setResult] = useState({ key: null, data: null, error: null });
  const [internalReloadToken, setInternalReloadToken] = useState(0);
  const key = `${JSON.stringify(rangeState)}|${externalReloadToken}|${internalReloadToken}`;

  useEffect(() => {
    let cancelled = false;
    fetchSummary(rangeState)
      .then((data) => !cancelled && setResult({ key, data, error: null }))
      .catch((error) => !cancelled && setResult({ key, data: null, error }));
    return () => {
      cancelled = true;
    };
  }, [key, fetchSummary, rangeState]);

  const loading = result.key !== key;
  const summary = loading ? null : result.data;
  const error = loading ? null : result.error;

  const totalEvents = summary
    ? Object.values(summary.totals || {}).reduce((a, b) => a + Number(b), 0)
    : 0;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="text-[26px] font-bold text-forest">{title}</h1>
        {subtitle && <p className="text-sm text-stone">{subtitle}</p>}
      </header>

      {loading ? (
        <Spinner label="Đang tải số liệu…" />
      ) : error ? (
        <Card>
          <Alert
            action={
              <Button variant="secondary" onClick={() => setInternalReloadToken((n) => n + 1)}>
                Thử lại
              </Button>
            }
          >
            {error.message}
          </Alert>
        </Card>
      ) : (
        <>
          <p className="text-xs text-muted">Dữ liệu cập nhật lúc {fmtTime(summary.generatedAt)} (giờ Việt Nam).</p>
          <div className="grid gap-4 sm:grid-cols-3">
            {Object.entries(EVENT_LABELS).map(([type, label]) => (
              <Card key={type}>
                <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
                <p className="mt-1 text-3xl font-bold text-forest">{Number(summary.totals?.[type] ?? 0)}</p>
                <p className="mt-1 text-xs text-muted">trong khoảng thời gian đang chọn</p>
              </Card>
            ))}
          </div>

          {summary.qrByStatus && Object.keys(summary.qrByStatus).length > 0 && (
            <Card title="Mã QR của tôi">
              <div className="flex flex-wrap gap-6 text-sm">
                <span>
                  Đã tạo: <strong>{(summary.qrByStatus.ISSUED ?? 0) + (summary.qrByStatus.REDEEMED ?? 0)}</strong>
                </span>
                <span>
                  Chưa kích hoạt: <strong>{summary.qrByStatus.ISSUED ?? 0}</strong>
                </span>
                <span>
                  Đã kích hoạt: <strong>{summary.qrByStatus.REDEEMED ?? 0}</strong>
                </span>
                <span>
                  Đã thu hồi: <strong>{summary.qrByStatus.REVOKED ?? 0}</strong>
                </span>
              </div>
            </Card>
          )}

          {totalEvents === 0 ? (
            <Card>
              <p className="py-6 text-center text-sm text-stone">
                Chưa có dữ liệu sử dụng trong khoảng thời gian này. Thử chọn khoảng dài hơn.
              </p>
            </Card>
          ) : (
  
          <Card title="Số liệu theo ngày (UTC)">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs uppercase tracking-wide text-muted">
                    <tr>
                      <th className="py-2 pr-4">Ngày</th>
                      <th className="py-2 pr-4">Lượt xem POI</th>
                      <th className="py-2 pr-4">Lượt phát audio</th>
                      <th className="py-2">Phiên</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pivotDaily(summary.daily).map((row) => (
                      <tr key={row.day} className="border-t border-shell-border">
                        <td className="py-2 pr-4">{fmtDay(row.day)}</td>
                        <td className="py-2 pr-4">{row.poi_view}</td>
                        <td className="py-2 pr-4">{row.audio_play}</td>
                        <td className="py-2">{row.session_start}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {summary.topPois && summary.topPois.length > 0 && (
            <Card title="POI được xem nhiều nhất">
              <ol className="list-decimal space-y-1 pl-5 text-sm">
                {summary.topPois.map((p) => (
                  <li key={p.poiId}>
                    POI #{p.poiId} — {p.views} lượt xem
                  </li>
                ))}
              </ol>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

export function RangePicker({ rangeState, setRangeState, onReload, loading }) {
  const presets = [
    ['7 ngày', () => ({ from: daysBack(7), to: undefined })],
    ['30 ngày', () => ({ from: daysBack(30), to: undefined })],
    ['90 ngày', () => ({ from: daysBack(90), to: undefined })],
  ];
  return (
    <Card title="Khoảng thời gian">
      <div className="flex flex-wrap items-end gap-3">
        {presets.map(([label, make]) => (
          <Button key={label} variant="secondary" onClick={() => setRangeState(make())}>
            {label}
          </Button>
        ))}
        <label className="text-xs text-muted">
          Từ
          <input
            type="date"
            className="ml-2 rounded border px-2 py-1"
            value={rangeState?.from ? rangeState.from.slice(0, 10) : ''}
            onChange={(e) =>
              setRangeState((prev) => ({ ...prev, from: e.target.value ? `${e.target.value}T00:00:00Z` : undefined }))
            }
          />
        </label>
        <label className="text-xs text-muted">
          Đến
          <input
            type="date"
            className="ml-2 rounded border px-2 py-1"
            value={rangeState?.to ? rangeState.to.slice(0, 10) : ''}
            onChange={(e) =>
              setRangeState((prev) => ({ ...prev, to: e.target.value ? `${e.target.value}T23:59:59Z` : undefined }))
            }
          />
        </label>
        {onReload && (
          <Button variant="secondary" onClick={onReload} disabled={loading} title="Tải lại số liệu">
            Làm mới
          </Button>
        )}
      </div>
    </Card>
  );
}
