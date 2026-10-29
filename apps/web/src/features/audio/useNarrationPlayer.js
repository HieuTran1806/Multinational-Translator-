import { useCallback, useEffect, useRef, useState } from 'react';
import { useT } from '../../i18n/LanguageContext.jsx';
import { usageApi } from '../../api/endpoints.js';

/**
 * UC05 audio narration player built on a single HTMLAudioElement per source.
 *
 * Status machine: idle → loading → playing ⇄ paused → ended, with error reachable from any state
 * (network failure, unsupported format, lost connection while streaming). "stop" resets to idle at
 * position 0. `attempt` re-creates the element so a retry always starts a fresh load (E2).
 */

/** Message key for an audio failure; translated at render time so a language switch updates it (UC01). */
function errorKey(audioError, offline) {
  if (offline) return 'player.err.offline';
  switch (audioError?.code) {
    case 2: // MEDIA_ERR_NETWORK
      return 'player.err.network';
    case 3: // MEDIA_ERR_DECODE
      return 'player.err.decode';
    case 4: // MEDIA_ERR_SRC_NOT_SUPPORTED
      return 'player.err.unsupported';
    default:
      return 'player.err.generic';
  }
}

export function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function useNarrationPlayer(audioUrl) {
  const t = useT();
  const [status, setStatus] = useState('idle');
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const audioRef = useRef(null);
  // Distinguishes a user "stop" (reset to idle) from the pause event it triggers on the element.
  const stoppingRef = useRef(false);
  const playTrackedRef = useRef(false);

  useEffect(() => {
    // Only synchronizes React with the external audio element; all state updates happen in event
    // callbacks. A source change remounts the player (the detail page re-renders a skeleton while
    // refetching), and retry() resets the state from its click handler before bumping `attempt`.
    if (!audioUrl) return undefined;

    playTrackedRef.current = false;
    const el = new Audio();
    el.preload = 'metadata';
    el.src = audioUrl;
    audioRef.current = el;

    const onPlay = () => {
      setStatus('playing');
      if (!playTrackedRef.current) {
        playTrackedRef.current = true;
        usageApi.record('audio_play').catch(() => {});
      }
    };
    const onWaiting = () => setStatus((s) => (s === 'error' ? s : 'loading'));
    const onPause = () => {
      if (stoppingRef.current) return; // handled by stop()
      setStatus((s) => (s === 'ended' ? s : 'paused'));
    };
    const onEnded = () => setStatus('ended');
    const onTime = () => setPosition(el.currentTime);
    const onMeta = () => setDuration(Number.isFinite(el.duration) ? el.duration : 0);
    const onError = () => {
      setStatus('error');
      setError(errorKey(el.error, typeof navigator !== 'undefined' && navigator.onLine === false));
    };
    const onOffline = () => {
      if (el.paused) return;
      el.pause();
      setStatus('error');
      setError(errorKey(el.error, true));
    };
    el.addEventListener('play', onPlay);
    el.addEventListener('playing', onPlay);
    el.addEventListener('waiting', onWaiting);
    el.addEventListener('pause', onPause);
    el.addEventListener('ended', onEnded);
    el.addEventListener('timeupdate', onTime);
    el.addEventListener('loadedmetadata', onMeta);
    el.addEventListener('error', onError);
    window.addEventListener('offline', onOffline);
    return () => {
      el.removeEventListener('play', onPlay);
      el.removeEventListener('playing', onPlay);
      el.removeEventListener('waiting', onWaiting);
      el.removeEventListener('pause', onPause);
      el.removeEventListener('ended', onEnded);
      el.removeEventListener('timeupdate', onTime);
      el.removeEventListener('loadedmetadata', onMeta);
      el.removeEventListener('error', onError);
      window.removeEventListener('offline', onOffline);
      el.pause();
      el.removeAttribute('src');
      audioRef.current = null;
    };
  }, [audioUrl, attempt]);

  const play = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    setError(null);
    stoppingRef.current = false;
    if (el.ended || el.currentTime >= (el.duration || Infinity)) el.currentTime = 0;
    try {
      const p = el.play();
      if (p && typeof p.catch === 'function') {
        p.catch((err) => {
          if (err?.name === 'AbortError' || err?.name === 'NotSupportedError') return; // handled by the error event
          setStatus('error');
          setError(
            err?.name === 'NotAllowedError' ? 'player.err.blocked' : 'player.err.play',
          );
        });
      }
    } catch {
      setStatus('error');
      setError('player.err.play');
    }
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const stop = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    stoppingRef.current = true;
    el.pause();
    try {
      el.currentTime = 0;
    } catch {
      /* seeking before metadata is ready – harmless */
    }
    setPosition(0);
    setStatus('idle');
  }, []);

  const seekTo = useCallback((seconds) => {
    const el = audioRef.current;
    if (!el || !Number.isFinite(seconds)) return;
    try {
      el.currentTime = seconds;
      setPosition(seconds);
    } catch {
      /* seeking unsupported before metadata – ignored */
    }
  }, []);

  const retry = useCallback(() => {
    setStatus('idle');
    setPosition(0);
    setDuration(0);
    setError(null);
    setAttempt((a) => a + 1);
  }, []);

  return { status, position, duration, error: error ? t(error) : null, play, pause, stop, seekTo, retry };
}
