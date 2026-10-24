import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { mediaUrl } from '../../api/client.js';
import { publicApi } from '../../api/endpoints.js';
import { useLanguage } from '../../i18n/LanguageContext.jsx';
import { languageLabel } from '../../i18n/languages.js';
import { Alert, Badge, Button, Skeleton } from '../../components/ui.jsx';
import ImageGallery from './ImageGallery.jsx';
import NarrationPlayer from '../audio/NarrationPlayer.jsx';
import { useOnlineStatus } from '../explore/useOnlineStatus.js';

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return '';
  }
}

/**
 * UC04 – POI detail in the current narration language: content, images, available languages and the
 * UC05 narration player. Missing translation falls back with a notice (A1); missing audio still
 * shows the transcript (A2); hidden/unknown POI returns to the map (E1); failures offer retry (E2)
 * and connectivity is surfaced (E3).
 */
export default function PoiDetailPage() {
  const { id } = useParams();
  const { lang, setLang, languages } = useLanguage();
  const online = useOnlineStatus();
  const [nonce, setNonce] = useState(0);
  const key = `${id}|${lang}|${nonce}`;
  const [result, setResult] = useState({ key: null, data: null, error: null });
  const [showTranscript, setShowTranscript] = useState(false);

  useEffect(() => {
    let cancelled = false;
    publicApi
      .poi(id, lang)
      .then((data) => {
        if (cancelled) return;
        setResult({ key, data, error: null });
        setShowTranscript(false);
      })
      .catch((error) => !cancelled && setResult({ key, data: null, error }));
    return () => {
      cancelled = true;
    };
  }, [key, id, lang]);

  const loading = result.key !== key;
  const error = loading ? null : result.error;
  const detail = loading || error ? null : result.data;

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-4" aria-busy="true">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-56 w-full sm:h-72" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (error) {
    const notFound = error.status === 404;
    return (
      <div className="mx-auto max-w-xl space-y-4 p-6">
        <Alert kind="error" title={notFound ? 'Địa điểm không tồn tại hoặc không còn công khai' : 'Không tải được chi tiết địa điểm'}>
          {error.message}
        </Alert>
        <div className="flex gap-2">
          {!notFound && (
            <Button onClick={() => setNonce((n) => n + 1)}>Thử lại</Button>
          )}
          <Link
            to="/"
            className="inline-flex items-center rounded-lg border border-stone/40 bg-white px-4 py-2 text-sm font-semibold text-charcoal hover:bg-sand/50"
          >
            Về bản đồ
          </Link>
        </div>
      </div>
    );
  }

  const images = detail.imageUrl ? [detail.imageUrl, ...(detail.images ?? []).filter((u) => u !== detail.imageUrl)] : (detail.images ?? []);
  const audioUrl = detail.audio ? mediaUrl(detail.audio.url) : null;

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-4 pb-10">
      {!online && (
        <Alert kind="warning" title="Mất kết nối mạng">
          Trang này cần internet để tải nội dung và audio. Nếu hình ảnh hoặc thuyết minh không chạy, hãy kiểm tra kết
          nối rồi thử lại.
        </Alert>
      )}

      <div>
        <Link to="/" className="text-sm font-semibold text-olive hover:underline">
          ← Bản đồ
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-2">
          <h1 className="text-2xl font-bold text-forest">{detail.name}</h1>
          <Badge className="bg-olive/15 text-forest">{detail.category || 'Điểm tham quan'}</Badge>
        </div>
        <p className="mt-1 text-xs text-stone">
          Mã: {detail.code} · Cập nhật {formatDate(detail.updatedAt)}
        </p>
      </div>

      {detail.fallback && (
        <Alert kind="info" title="Nội dung hiển thị theo ngôn ngữ khác">
          Địa điểm này chưa có bản dịch {languageLabel(languages, detail.requestedLanguage)}. Nội dung đang hiển thị
          theo {languageLabel(languages, detail.language)}.
        </Alert>
      )}

      <ImageGallery images={images} alt={detail.name} />

      <section aria-label="Thông tin địa điểm" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl bg-white p-3 text-center ring-1 ring-stone/10">
          <p className="text-xs text-stone">Vĩ độ</p>
          <p className="text-sm font-semibold text-charcoal">{detail.latitude.toFixed(5)}</p>
        </div>
        <div className="rounded-xl bg-white p-3 text-center ring-1 ring-stone/10">
          <p className="text-xs text-stone">Kinh độ</p>
          <p className="text-sm font-semibold text-charcoal">{detail.longitude.toFixed(5)}</p>
        </div>
        <div className="rounded-xl bg-white p-3 text-center ring-1 ring-stone/10">
          <p className="text-xs text-stone">Bán kính kích hoạt</p>
          <p className="text-sm font-semibold text-charcoal">{Math.round(detail.triggerRadius)} m</p>
        </div>
        <div className="rounded-xl bg-white p-3 text-center ring-1 ring-stone/10">
          <p className="text-xs text-stone">Ngôn ngữ có nội dung</p>
          <p className="text-sm font-semibold text-charcoal">{detail.availableLanguages.length}</p>
        </div>
      </section>

      <section aria-label="Thuyết minh" className="space-y-3">
        <h2 className="text-lg font-semibold text-forest">Thuyết minh</h2>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-stone">Ngôn ngữ:</span>
          {(detail.availableLanguages ?? []).map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => setLang(code)}
              aria-pressed={code === detail.language}
              className={`rounded-full px-3 py-1 text-sm font-medium transition ${
                code === detail.language
                  ? 'bg-olive text-paper'
                  : 'bg-white text-charcoal ring-1 ring-stone/30 hover:ring-olive/50'
              }`}
            >
              {languageLabel(languages, code)}
            </button>
          ))}
        </div>

        {audioUrl ? (
          <NarrationPlayer audioUrl={audioUrl} />
        ) : (
          <Alert kind="info" title="Chưa có audio thuyết minh">
            Địa điểm này chưa có audio cho {languageLabel(languages, detail.language)}. Bạn có thể đọc nội dung thuyết
            minh bên dưới.
          </Alert>
        )}

        <div className="rounded-xl border border-stone/25 bg-white p-4">
          <button
            type="button"
            onClick={() => setShowTranscript((v) => !v)}
            aria-expanded={showTranscript}
            className="text-sm font-semibold text-olive hover:underline"
          >
            {showTranscript ? 'Ẩn bản đọc' : 'Xem bản đọc'}
          </button>
          {showTranscript && (
            <article className="mt-3 whitespace-pre-line text-sm leading-relaxed text-charcoal">
              {detail.narrationText}
            </article>
          )}
        </div>
      </section>

      {detail.description && (
        <section aria-label="Giới thiệu" className="rounded-xl bg-white p-4 ring-1 ring-stone/10">
          <h2 className="mb-2 text-lg font-semibold text-forest">Giới thiệu</h2>
          <p className="whitespace-pre-line text-sm leading-relaxed text-charcoal">{detail.description}</p>
        </section>
      )}
    </div>
  );
}
