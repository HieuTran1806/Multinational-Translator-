import { useEffect, useRef, useState } from 'react';
import { ttsApi } from '../api/endpoints.js';

const ACTIVE = new Set(['QUEUED', 'RUNNING']);

export function isActiveJob(job) {
  return !!job && ACTIVE.has(job.status);
}

/**
 * Polls GET /tts/jobs/{id} while the job is QUEUED/RUNNING (MVP: polling instead of SSE).
 * Calls onFinished(job) once when it reaches SUCCEEDED/FAILED.
 */
export function useJobPolling(initialJob, onFinished, intervalMs = 2000) {
  const [job, setJob] = useState(initialJob);
  const [pollError, setPollError] = useState(null);
  const finishedRef = useRef(onFinished);
  useEffect(() => {
    finishedRef.current = onFinished;
  }, [onFinished]);

  // Adopt a new job passed in by the parent (React's "adjust state on prop change" pattern, no effect)
  const [prevInitial, setPrevInitial] = useState(initialJob);
  if (initialJob !== prevInitial) {
    setPrevInitial(initialJob);
    setJob(initialJob);
  }

  const jobId = job?.id;
  const active = isActiveJob(job);
  useEffect(() => {
    if (!active || !jobId) return undefined;
    let cancelled = false;
    const timer = setInterval(async () => {
      try {
        const next = await ttsApi.job(jobId);
        if (cancelled) return;
        setPollError(null);
        setJob(next);
        if (!isActiveJob(next)) finishedRef.current?.(next);
      } catch (e) {
        if (!cancelled) setPollError(e);
      }
    }, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [active, jobId, intervalMs]);

  return { job, setJob, pollError };
}
