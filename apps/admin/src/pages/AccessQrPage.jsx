import { useEffect, useId, useState } from 'react';
import { useSearchParams } from 'react-router';
import QRCode from 'qrcode';
import { accessQrApi } from '../api/endpoints.js';
import Pagination from '../components/Pagination.jsx';
import { Alert, Button, Card, Field, Spinner, inputClass } from '../components/ui.jsx';

const PAGE_SIZE = 20;

const STATUS = {
  ISSUED: { text: 'Chưa sử dụng', cls: 'bg-sand text-earth' },
  REDEEMED: { text: 'Đã kích hoạt', cls: 'bg-olive/15 text-forest' },
  REVOKED: { text: 'Đã thu hồi', cls: 'bg-danger/15 text-danger' },
};

function QrStatusBadge({ status }) {
  const s = STATUS[status] ?? { text: status, cls: 'bg-stone/15 text-stone' };
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.cls}`}>{s.text}</span>;
}

const fmt = (iso) => (iso ? new Date(iso).toLocaleString('vi-VN') : '—');

/** Renders the activation URL as an SVG QR image (pure JS, no canvas). */
function QrImage({ value }) {
  const [svg, setSvg] = useState(null);
  useEffect(() => {
    let cancelled = false;
    QRCode.toString(value, { type: 'svg', margin: 2, errorCorrectionLevel: 'M' })
      .then((s) => !cancelled && setSvg(s))
      .catch(() => !cancelled && setSvg(''));
    return () => {
      cancelled = true;
    };
  }, [value]);
  if (svg === null) return <div className="h-56 w-56 animate-pulse rounded-xl bg-stone/15" />;
  return (
    <img
      src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`}
      alt="Mã QR kích hoạt"
      className="h-56 w-56 rounded-xl bg-white p-2 ring-1 ring-stone/20"
    />
  );
}

function CopyButton({ text, label }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="secondary"
      className="!px-3 !py-1 text-xs"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          setCopied(false);
        }
      }}
    >
      {copied ? 'Đã sao chép' : label}
    </Button>
  );
}

/** The plaintext token exists only in this response: show it once, with QR image, link and print. */
function IssuedQr({ qr, onClose }) {
  return (
    <div className="qr-print-area space-y-4 rounded-xl border border-olive/30 bg-olive/5 p-4">
      <div className="flex flex-col gap-5 sm:flex-row">
        <QrImage value={qr.activationUrl} />
        <div className="min-w-0 flex-1 space-y-3 text-sm">
          <p className="text-base font-semibold text-forest">QR #{qr.id} — gói {qr.packageCode}</p>
          <p className="text-stone">
            Quyền dùng {qr.durationMinutes / 60} giờ kể từ lúc khách quét thành công. QR không tự hết hạn trước khi
            kích hoạt và chỉ dùng được một lần.
          </p>
          {qr.note && <p className="text-charcoal">Ghi chú: {qr.note}</p>}
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted">Mã (nhập tay)</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <code className="break-all rounded bg-white px-2 py-1 text-xs ring-1 ring-stone/20">{qr.qrToken}</code>
              <CopyButton text={qr.qrToken} label="Sao chép mã" />
            </div>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted">Link kích hoạt</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <code className="break-all rounded bg-white px-2 py-1 text-xs ring-1 ring-stone/20">{qr.activationUrl}</code>
              <CopyButton text={qr.activationUrl} label="Sao chép link" />
            </div>
          </div>
        </div>
      </div>
      <Alert kind="warning">
        Mã chỉ hiển thị <strong>một lần</strong> (hệ thống chỉ lưu bản băm). Hãy in hoặc đưa cho khách ngay; nếu làm mất,
        thu hồi QR này và tạo QR mới.
      </Alert>
      <div className="no-print flex flex-wrap gap-2">
        <Button onClick={() => window.print()}>In QR</Button>
        <Button variant="secondary" onClick={onClose}>
          Đóng
        </Button>
      </div>
    </div>
  );
}

/**
 * UC02 support for Admin: issue single-use access QR codes for visitors, see whether they were used, and
 * revoke them. Seller issuing after payment (UC12) is outside the MVP, so Admin covers it for now.
 */
export default function AccessQrPage() {
  const noteId = useId();
  const [params, setParams] = useSearchParams();
  const page = Math.max(0, Number(params.get('page') || 0));
  const status = params.get('status') || '';
  const [reloadToken, setReloadToken] = useState(0);
  const key = `${page}|${status}|${reloadToken}`;
  const [result, setResult] = useState({ key: null, data: null, error: null });
  const [note, setNote] = useState('');
  const [issuing, setIssuing] = useState(false);
  const [issued, setIssued] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [revoking, setRevoking] = useState(null);

  useEffect(() => {
    let cancelled = false;
    accessQrApi
      .list({ page, size: PAGE_SIZE, status: status || undefined })
      .then((data) => !cancelled && setResult({ key, data, error: null }))
      .catch((error) => !cancelled && setResult({ key, data: null, error }));
    return () => {
      cancelled = true;
    };
  }, [key, page, status]);

  const loading = result.key !== key;
  const reload = () => setReloadToken((n) => n + 1);

  function update(next) {
    const p = new URLSearchParams(params);
    Object.entries(next).forEach(([k, v]) => (v === '' || v == null ? p.delete(k) : p.set(k, String(v))));
    setParams(p);
  }

  async function issue(e) {
    e.preventDefault();
    setIssuing(true);
    setActionError(null);
    try {
      setIssued(await accessQrApi.issue({ note: note.trim() || undefined }));
      setNote('');
      reload();
    } catch (error) {
      setActionError(error);
    } finally {
      setIssuing(false);
    }
  }

  async function revoke(qr) {
    const msg =
      qr.status === 'REDEEMED'
        ? `Thu hồi QR #${qr.id}? Khách đang dùng QR này sẽ mất quyền truy cập ngay.`
        : `Thu hồi QR #${qr.id}? QR sẽ không kích hoạt được nữa.`;
    if (!window.confirm(msg)) return;
    setRevoking(qr.id);
    setActionError(null);
    try {
      await accessQrApi.revoke(qr.id);
      reload();
    } catch (error) {
      setActionError(error);
    } finally {
      setRevoking(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="no-print">
        <h1 className="text-[26px] font-bold text-forest">QR truy cập</h1>
        <p className="text-sm text-stone">Tạo mã QR dùng một lần cho khách tham quan, theo dõi trạng thái và thu hồi</p>
      </header>

      <Card title="Tạo QR mới">
        {issued ? (
          <IssuedQr qr={issued} onClose={() => setIssued(null)} />
        ) : (
          <form onSubmit={issue} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Field label="Ghi chú (không bắt buộc)" htmlFor={noteId} hint="Ví dụ: tên khách, mã vé, đoàn…">
                <input
                  id={noteId}
                  className={inputClass}
                  value={note}
                  maxLength={200}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Khách đoàn A"
                />
              </Field>
            </div>
            <Button type="submit" loading={issuing} className="sm:mb-5">
              Tạo QR (gói 24 giờ)
            </Button>
          </form>
        )}
      </Card>

      {actionError && <Alert title="Thao tác không thành công">{actionError.message}</Alert>}

      <Card
        className="no-print"
        title="Danh sách QR"
        actions={
          <select
            aria-label="Lọc trạng thái QR"
            className={`${inputClass} w-auto`}
            value={status}
            onChange={(e) => update({ status: e.target.value, page: 0 })}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="ISSUED">Chưa sử dụng</option>
            <option value="REDEEMED">Đã kích hoạt</option>
            <option value="REVOKED">Đã thu hồi</option>
          </select>
        }
      >
        {loading && (
          <div className="py-10 text-center text-stone">
            <Spinner label="Đang tải danh sách…" />
          </div>
        )}
        {!loading && result.error && (
          <Alert
            title="Không thể tải danh sách QR"
            action={
              <Button variant="secondary" onClick={reload}>
                Thử lại
              </Button>
            }
          >
            {result.error.message}
          </Alert>
        )}
        {!loading && result.data && result.data.items.length === 0 && (
          <div className="py-10 text-center text-stone">
            {status ? 'Không có QR nào ở trạng thái này.' : 'Chưa có QR nào. Hãy tạo QR đầu tiên ở trên.'}
          </div>
        )}
        {!loading && result.data && result.data.items.length > 0 && (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b border-stone/20 text-xs uppercase tracking-wide text-stone">
                  <tr>
                    <th className="py-2 pr-3">QR</th>
                    <th className="py-2 pr-3">Trạng thái</th>
                    <th className="py-2 pr-3">Ghi chú</th>
                    <th className="py-2 pr-3">Tạo lúc</th>
                    <th className="py-2 pr-3">Kích hoạt lúc</th>
                    <th className="py-2 pr-3" />
                  </tr>
                </thead>
                <tbody>
                  {result.data.items.map((qr) => (
                    <tr key={qr.id} className="border-b border-stone/10 align-top">
                      <td className="py-3 pr-3">
                        <span className="font-semibold text-forest">#{qr.id}</span>
                        <div className="text-xs text-stone">{qr.packageCode}</div>
                      </td>
                      <td className="py-3 pr-3">
                        <QrStatusBadge status={qr.status} />
                        {qr.revokedAt && <div className="mt-1 text-xs text-stone">{fmt(qr.revokedAt)}</div>}
                      </td>
                      <td className="py-3 pr-3 text-charcoal">{qr.note || <span className="text-stone">—</span>}</td>
                      <td className="py-3 pr-3 text-xs text-stone">{fmt(qr.createdAt)}</td>
                      <td className="py-3 pr-3 text-xs text-stone">{fmt(qr.redeemedAt)}</td>
                      <td className="py-3 text-right">
                        {qr.status !== 'REVOKED' && (
                          <Button
                            variant="secondary"
                            className="!px-3 !py-1 text-xs"
                            loading={revoking === qr.id}
                            onClick={() => revoke(qr)}
                          >
                            Thu hồi
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={result.data.page}
              totalPages={result.data.totalPages}
              totalItems={result.data.totalItems}
              onChange={(next) => update({ page: next })}
              unit="mã QR"
            />
          </div>
        )}
      </Card>
    </div>
  );
}
