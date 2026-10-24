import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import NarrationPlayer from './NarrationPlayer.jsx';

class FakeAudio {
  static created = [];
  constructor() {
    this.listeners = {};
    this.paused = true;
    this.currentTime = 0;
    this.duration = 120;
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

describe('NarrationPlayer (UC05 UI)', () => {
  beforeEach(() => {
    FakeAudio.created = [];
    vi.stubGlobal('Audio', FakeAudio);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const audio = () => FakeAudio.created.at(-1);

  it('switches between play, pause and resume with one main button', async () => {
    const user = userEvent.setup();
    render(<NarrationPlayer audioUrl="mock://a.mp3" />);

    const main = screen.getByRole('button', { name: 'Phát' });
    await user.click(main);
    expect(screen.getByRole('button', { name: 'Tạm dừng' })).toBeEnabled();

    await user.click(screen.getByRole('button', { name: 'Tạm dừng' }));
    expect(screen.getByRole('button', { name: 'Tiếp tục' })).toBeEnabled();

    await user.click(screen.getByRole('button', { name: 'Tiếp tục' }));
    expect(screen.getByRole('button', { name: 'Tạm dừng' })).toBeEnabled();
  });

  it('stop resets to the initial state and disables the stop button', async () => {
    const user = userEvent.setup();
    render(<NarrationPlayer audioUrl="mock://a.mp3" />);
    expect(screen.getByRole('button', { name: 'Dừng' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Phát' }));
    await user.click(screen.getByRole('button', { name: 'Dừng' }));
    expect(screen.getByRole('button', { name: 'Phát' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Dừng' })).toBeDisabled();
  });

  it('shows an error with a retry action and recovers', async () => {
    const user = userEvent.setup();
    render(<NarrationPlayer audioUrl="mock://broken.mp3" />);
    await user.click(screen.getByRole('button', { name: 'Phát' }));

    act(() => {
      audio().error = { code: 4 };
      audio().emit('error');
    });
    expect(screen.getByRole('alert')).toHaveTextContent('Không phát được thuyết minh');

    await user.click(screen.getByRole('button', { name: 'Thử lại' }));
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByRole('button', { name: 'Phát' })).toBeEnabled();
  });

  it('seeks through the range input', async () => {
    const user = userEvent.setup();
    render(<NarrationPlayer audioUrl="mock://a.mp3" />);

    const seek = screen.getByLabelText('Vị trí phát');
    await user.click(screen.getByRole('button', { name: 'Phát' }));
    act(() => audio().emit('loadedmetadata'));
    expect(seek).toBeEnabled();
    fireEvent.change(seek, { target: { value: '42' } });
    expect(audio().currentTime).toBe(42);
  });
});
