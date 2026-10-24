import { useNarrationPlayer, formatTime } from './useNarrationPlayer.js';
import { Alert, Button } from '../../components/ui.jsx';
import { useT } from '../../i18n/LanguageContext.jsx';

/**
 * UC05 player UI: play / pause / resume / stop, seek bar with progress, and explicit error + retry
 * (E2/E3). Shown only when the POI has audio for the current language; the transcript-only case is
 * handled by the detail page (A2).
 */
export default function NarrationPlayer({ audioUrl }) {
  const t = useT();
  const { status, position, duration, error, play, pause, stop, seekTo, retry } = useNarrationPlayer(audioUrl);

  const ready = status !== 'idle' || position > 0;
  const mainLabel =
    status === 'playing'
      ? t('player.pause')
      : status === 'paused'
        ? t('player.resume')
        : status === 'ended'
          ? t('player.replay')
          : t('player.play');
  const mainAction = status === 'playing' ? pause : play;

  return (
    <div
      role="group"
      aria-label={t('player.group')}
      className="rounded-xl border border-stone/25 bg-white p-4 shadow-sm"
    >
      <div className="flex items-center gap-3">
        <Button
          variant="primary"
          className="!h-11 !w-11 !rounded-full !p-0"
          onClick={mainAction}
          disabled={status === 'loading'}
          aria-label={mainLabel}
          title={mainLabel}
        >
          {status === 'loading' ? null : status === 'playing' ? (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
              <rect x="6" y="5" width="4" height="14" rx="1" />
              <rect x="14" y="5" width="4" height="14" rx="1" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="ml-0.5 h-5 w-5" fill="currentColor" aria-hidden="true">
              <path d="M8 5.14v13.72c0 .8.87 1.3 1.56.9l10.8-6.86a1.05 1.05 0 0 0 0-1.8L9.56 4.24A1.05 1.05 0 0 0 8 5.14z" />
            </svg>
          )}
        </Button>

        <Button
          variant="secondary"
          className="!h-11 !w-11 !rounded-full !p-0"
          onClick={stop}
          disabled={status === 'idle' || status === 'loading'}
          aria-label={t('player.stop')}
          title={t('player.stop')}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
            <rect x="6" y="6" width="12" height="12" rx="1.5" />
          </svg>
        </Button>

        <div className="min-w-0 flex-1">
          <label htmlFor="narration-seek" className="sr-only">
            {t('player.seek')}
          </label>
          <input
            id="narration-seek"
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={Math.min(position, duration || 0)}
            onChange={(e) => seekTo(Number(e.target.value))}
            disabled={status === 'loading' || status === 'error' || !duration}
            className="w-full accent-olive"
            aria-valuetext={`${formatTime(position)} / ${formatTime(duration)}`}
          />
          <div className="mt-0.5 flex justify-between text-xs tabular-nums text-stone" aria-hidden="true">
            <span>{formatTime(position)}</span>
            <span>{duration ? formatTime(duration) : '--:--'}</span>
          </div>
        </div>

        <span className="sr-only" role="status">
          {status === 'playing'
            ? t('player.s.playing')
            : status === 'paused'
              ? t('player.s.paused')
              : status === 'ended'
                ? t('player.s.ended')
                : status === 'loading'
                  ? t('player.s.loading')
                  : t('player.s.ready')}
        </span>
      </div>

      {status === 'ended' && (
        <p className="mt-2 text-xs font-medium text-forest" role="status">
          {t('player.endedNote')}
        </p>
      )}

      {error && (
        <Alert
          kind="error"
          title={t('player.errorTitle')}
          action={
            <Button variant="secondary" onClick={retry}>
              {t('common.retry')}
            </Button>
          }
          className="mt-3"
        >
          {error}
        </Alert>
      )}

      {!error && !ready && (
        <p className="mt-2 text-xs text-stone">{t('player.hint')}</p>
      )}
    </div>
  );
}
