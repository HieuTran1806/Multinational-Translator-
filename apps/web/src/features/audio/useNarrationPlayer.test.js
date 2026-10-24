import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useNarrationPlayer } from './useNarrationPlayer.js';

class FakeAudio {
  static created = [];
  constructor() {
    this.listeners = {};
    this.paused = true;
    this.currentTime = 0;
    this.duration = NaN;
    this.ended = false;
    this.error = null;
    FakeAudio.created.push(this);
  }
  set src(v) {
    this._src = v;
  }
  get src() {
    return this._src ?? '';
  }
  removeAttribute(name) {
    if (name === 'src') this._src = '';
  }
  addEventListener(type, fn) {
    (this.listeners[type] ??= []).push(fn);
  }
  removeEventListener(type, fn) {
    this.listeners[type] = (this.listeners[type] ?? []).filter((f) => f !== fn);
  }
  emit(type) {
    (this.listeners[type] ?? []).slice().forEach((fn) => fn({ target: this }));
  }
  play() {
    this.paused = false;
    this.emit('play');
    return Promise.resolve();
  }
  pause() {
    if (!this.paused) {
      this.paused = true;
      this.emit('pause');
    }
  }
}

describe('useNarrationPlayer (UC05)', () => {
  beforeEach(() => {
    FakeAudio.created = [];
    vi.stubGlobal('Audio', FakeAudio);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const audio = () => FakeAudio.created.at(-1);

  it('stays idle without an audio source', () => {
    const { result } = renderHook(() => useNarrationPlayer(null));
    expect(result.current.status).toBe('idle');
    expect(result.current.error).toBeNull();
    expect(FakeAudio.created).toHaveLength(0);
  });

  it('plays, pauses, resumes and stops', async () => {
    const { result } = renderHook(() => useNarrationPlayer('mock://a.mp3'));

    await act(async () => result.current.play());
    expect(result.current.status).toBe('playing');

    await act(async () => result.current.pause());
    expect(result.current.status).toBe('paused');

    await act(async () => result.current.play());
    expect(result.current.status).toBe('playing');

    act(() => {
      audio().currentTime = 12;
      audio().emit('timeupdate');
    });
    expect(result.current.position).toBe(12);

    act(() => result.current.stop());
    expect(result.current.status).toBe('idle');
    expect(result.current.position).toBe(0);
    expect(audio().currentTime).toBe(0);
  });

  it('tracks duration and seeks', () => {
    const { result } = renderHook(() => useNarrationPlayer('mock://a.mp3'));
    act(() => {
      audio().duration = 95;
      audio().emit('loadedmetadata');
    });
    expect(result.current.duration).toBe(95);

    act(() => result.current.seekTo(40));
    expect(result.current.position).toBe(40);
    expect(audio().currentTime).toBe(40);
  });

  it('reports completion', async () => {
    const { result } = renderHook(() => useNarrationPlayer('mock://a.mp3'));
    await act(async () => result.current.play());
    act(() => audio().emit('ended'));
    expect(result.current.status).toBe('ended');
  });

  it('enters the error state on media failure and retry recreates the player', async () => {
    const { result } = renderHook(() => useNarrationPlayer('mock://broken.mp3'));
    await act(async () => result.current.play());

    act(() => {
      audio().error = { code: 2 }; // MEDIA_ERR_NETWORK
      audio().emit('error');
    });
    expect(result.current.status).toBe('error');
    expect(result.current.error).toContain('kết nối');

    const broken = audio();
    act(() => result.current.retry());
    expect(result.current.status).toBe('idle');
    expect(result.current.error).toBeNull();
    expect(audio()).not.toBe(broken);
  });

  it('stops and reports an error when the browser goes offline while playing', async () => {
    const { result } = renderHook(() => useNarrationPlayer('mock://a.mp3'));
    await act(async () => result.current.play());

    act(() => {
      window.dispatchEvent(new Event('offline'));
    });
    expect(result.current.status).toBe('error');
    expect(result.current.error).toContain('Mất kết nối mạng');
    expect(audio().paused).toBe(true);
  });
});
