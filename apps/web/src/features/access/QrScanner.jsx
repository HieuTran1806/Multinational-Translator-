import { useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import { useT } from '../../i18n/LanguageContext.jsx';
import { cameraErrorKey } from './cameraErrors.js';

const SCAN_INTERVAL_MS = 200;
const MAX_FRAME_WIDTH = 640;

/** Native detector where the browser has one (Chrome on Android); otherwise decode frames with jsQR. */
async function createDetector() {
  if ('BarcodeDetector' in window) {
    try {
      const formats = await window.BarcodeDetector.getSupportedFormats();
      if (formats.includes('qr_code')) {
        const native = new window.BarcodeDetector({ formats: ['qr_code'] });
        return async (video) => (await native.detect(video))[0]?.rawValue ?? null;
      }
    } catch {
      /* fall back to jsQR */
    }
  }
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  return async (video) => {
    const scale = Math.min(1, MAX_FRAME_WIDTH / video.videoWidth);
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return jsQR(frame.data, frame.width, frame.height, { inversionAttempts: 'dontInvert' })?.data ?? null;
  };
}

/**
 * UC02 step 1–2: live camera preview that reports the first QR content it reads, then releases the
 * camera. `onError(messageKey)` is called when the camera cannot be used (denied, missing, insecure).
 */
export default function QrScanner({ onResult, onError }) {
  const t = useT();
  const videoRef = useRef(null);
  const callbacks = useRef({ onResult, onError });

  useEffect(() => {
    callbacks.current = { onResult, onError };
  }, [onResult, onError]);

  useEffect(() => {
    let stream = null;
    let timer = null;
    let stopped = false;

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        callbacks.current.onError(cameraErrorKey({ name: 'NoCameraError' }));
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
      } catch (error) {
        if (!stopped) callbacks.current.onError(cameraErrorKey(error));
        return;
      }
      if (stopped) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      const video = videoRef.current;
      video.srcObject = stream;
      await video.play().catch(() => {});
      const detect = await createDetector();
      let busy = false;
      timer = setInterval(async () => {
        if (busy || stopped || video.readyState < 2 || !video.videoWidth) return;
        busy = true;
        try {
          const text = await detect(video);
          if (text && !stopped) {
            stopped = true;
            clearInterval(timer);
            stream.getTracks().forEach((track) => track.stop());
            callbacks.current.onResult(text);
          }
        } catch {
          /* a frame that cannot be decoded is simply skipped */
        } finally {
          busy = false;
        }
      }, SCAN_INTERVAL_MS);
    }

    start();
    return () => {
      stopped = true;
      clearInterval(timer);
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-charcoal">
      <video ref={videoRef} className="aspect-square w-full object-cover" playsInline muted aria-label={t('scan.cameraHint')} />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-3/5 w-3/5 rounded-2xl border-4 border-paper/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
      </div>
      <p className="absolute inset-x-0 bottom-3 text-center text-sm font-medium text-paper drop-shadow">
        {t('scan.cameraHint')}
      </p>
    </div>
  );
}
