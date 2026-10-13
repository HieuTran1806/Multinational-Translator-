import { useEffect, useRef, useState } from 'react';
import { fetchMediaObjectUrl, poiApi, ttsApi } from '../api/endpoints.js';
import { Alert, Button, Spinner } from '../components/ui.jsx';
import { isActiveJob, useJobPolling } from './useJobPolling.js';

const MAX_MB = 20;
const ACCEPT = '.mp3,.m4a,.wav,.ogg,audio/mpeg,audio/mp4,audio/wav,audio/ogg';

function formatBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * Audio for one language: current audio (bound to the saved content version), upload, or TTS request.
 * Disabled while the narration has unsaved edits so audio never gets attached to the wrong text.
 */
export default function AudioPanel({ poiId, lang, translation, ttsStatus, dirty, onChanged }) {
  const [busy, setBusy] = useState(null); // 'upload' | 'tts'
  const [message, setMessage] = useState(null); // { kind, text }
  const [preview, setPreview] = useState(null); // { assetId, url }
  const [previewLoading, setPreviewLoading] = useState(false);
  const fileRef = useRef(null);
  const { job, setJob, pollError } = useJobPolling(translation?.latestJob ?? null, (finished) => {
    if (finished.status === 'SUCCEEDED') {
      setMessage({ kind: 'success', text: 'Đã tạo audio bằng Google Cloud TTS.' });
    } else {
      setMessage({ kind: 'error', text: `Tạo audio thất bại: ${finished.errorMessage || finished.errorCode}` });
    }
    onChanged?.();
  });

  const current = translation?.currentAudio ?? null;
  const previewUrl = preview && current && preview.assetId === current.id ? preview.url : null;
  useEffect(() => () => preview && URL.revokeObjectURL(preview.url), [preview]);

  if (!translation) {
    return <Alert kind="info">Lưu nội dung ngôn ngữ này trước, sau đó mới gắn hoặc tạo audio.</Alert>;
  }

  const jobForThisVersion = job && job.contentVersion === translation.contentVersion ? job : null;
  const processing = isActiveJob(jobForThisVersion);
  const disabledReason = dirty ? 'Nội dung đang có thay đổi chưa lưu. Hãy lưu trước khi gắn audio.' : null;

  async function onUpload(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > MAX_MB * 1024 * 1024) {
      setMessage({ kind: 'error', text: `File vượt quá ${MAX_MB} MB.` });
      return;
    }
    setBusy('upload');
    setMessage(null);
    try {
      await poiApi.uploadAudio(poiId, lang, file);
      setMessage({ kind: 'success', text: `Đã tải lên “${file.name}”.` });
      onChanged?.();
    } catch (err) {
      setMessage({ kind: 'error', text: err.message });
    } finally {
      setBusy(null);
    }
  }

  async function onTts() {
    setBusy('tts');
    setMessage(null);
    try {
      const res = await ttsApi.generate(poiId, lang);
      if (res.reusedExisting) {
        setMessage({ kind: 'info', text: 'Audio TTS cho đúng nội dung này đã có sẵn, không cần tạo lại.' });
        onChanged?.();
      } else {
        setJob(res);
      }
    } catch (err) {
      setMessage({ kind: 'error', text: err.message });
    } finally {
      setBusy(null);
    }
  }

  async function onPreview() {
    setPreviewLoading(true);
    try {
      setPreview({ assetId: current.id, url: await fetchMediaObjectUrl(current.url) });
    } catch (err) {
      setMessage({ kind: 'error', text: `Không tải được audio: ${err.message}` });
    } finally {
      setPreviewLoading(false);
    }
  }

  return (
    <div className="space-y-3 rounded-xl bg-sand/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold text-forest">Audio thuyết minh</h3>
        <span className="text-xs text-stone">Phiên bản nội dung: v{translation.contentVersion}</span>
      </div>

      {current ? (
        <div className="space-y-2 text-sm" data-testid="current-audio">
          <p>
            <span className="font-medium text-forest">Đang dùng:</span>{' '}
            {current.source === 'TTS' ? 'Google Cloud TTS' : 'File tải lên'} · {current.format.toUpperCase()} ·{' '}
            {formatBytes(current.sizeBytes)} · v{current.contentVersion}
          </p>
          {previewUrl ? (
            <audio controls src={previewUrl} className="w-full" />
          ) : (
            <Button variant="secondary" onClick={onPreview} loading={previewLoading}>
              ▶ Nghe thử
            </Button>
          )}
        </div>
      ) : (
        <p className="text-sm text-stone" data-testid="no-audio">
          Chưa có audio cho phiên bản nội dung hiện tại. Ứng dụng di động sẽ đề xuất đọc bằng giọng của thiết bị.
        </p>
      )}

      {processing && (
        <Alert kind="warning">
          <Spinner small label={`Đang xử lý TTS (lần thử ${Math.max(jobForThisVersion.attempts, 1)}/${jobForThisVersion.maxAttempts})…`} />
        </Alert>
      )}
      {pollError && <Alert>Không cập nhật được trạng thái tác vụ: {pollError.message}</Alert>}
      {!processing && jobForThisVersion?.status === 'FAILED' && !message && (
        <Alert title="Lần tạo TTS gần nhất thất bại">{jobForThisVersion.errorMessage || jobForThisVersion.errorCode}</Alert>
      )}
      {message && <Alert kind={message.kind}>{message.text}</Alert>}
      {disabledReason && <Alert kind="info">{disabledReason}</Alert>}

      <div className="flex flex-wrap gap-2">
        <input ref={fileRef} type="file" accept={ACCEPT} className="hidden" onChange={onUpload} aria-label="Chọn file audio" />
        <Button
          variant="secondary"
          onClick={() => fileRef.current?.click()}
          loading={busy === 'upload'}
          disabled={!!disabledReason || processing || !!busy}
        >
          Tải audio lên (≤ {MAX_MB} MB)
        </Button>
        <Button
          onClick={onTts}
          loading={busy === 'tts'}
          disabled={!!disabledReason || processing || !!busy || !ttsStatus?.configured}
          title={ttsStatus?.configured ? undefined : 'Máy chủ chưa cấu hình Google Cloud TTS'}
        >
          Tạo bằng Google TTS
        </Button>
      </div>
      {ttsStatus && !ttsStatus.configured && (
        <p className="text-xs text-stone">
          Google Cloud TTS chưa được cấu hình trên máy chủ nên không thể tạo audio tự động. Bạn vẫn có thể tải file
          audio lên.
        </p>
      )}
    </div>
  );
}
