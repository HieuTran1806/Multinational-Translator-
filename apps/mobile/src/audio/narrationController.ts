import { SoundNarrationPlayer } from './SoundNarrationPlayer';
import type { NarrationPlayer, PlayerState } from './NarrationPlayer';
import { speakWithDeviceVoice, stopDeviceVoice } from './deviceTts';

export type ActiveKind = 'file' | 'device';

export interface NarrationState {
  /** Identifies what is playing, e.g. "poi:12:en". */
  key: string | null;
  kind: ActiveKind | null;
  state: PlayerState;
  error: string | null;
}

type Listener = (s: NarrationState) => void;

/**
 * Single owner of audio output. Starting anything new (another POI, another language, device voice)
 * always stops the current source first, so narrations never overlap.
 */
export class NarrationController {
  private current: NarrationState = { key: null, kind: null, state: 'idle', error: null };
  private listeners = new Set<Listener>();
  private token = 0;

  constructor(private readonly player: NarrationPlayer = new SoundNarrationPlayer(),
              private readonly device = { speak: speakWithDeviceVoice, stop: stopDeviceVoice }) {}

  subscribe(l: Listener): () => void {
    this.listeners.add(l);
    l(this.current);
    return () => {
      this.listeners.delete(l);
    };
  }

  getState(): NarrationState {
    return this.current;
  }

  private set(next: Partial<NarrationState>) {
    this.current = { ...this.current, ...next };
    this.listeners.forEach(l => l(this.current));
  }

  async playFile(key: string, uri: string): Promise<void> {
    const my = await this.resetFor(key, 'file');
    try {
      await this.player.load(uri);
    } catch {
      if (my === this.token) {
        this.set({ state: 'error', error: 'AUDIO_LOAD_FAILED' });
      }
      return;
    }
    if (my !== this.token) {
      return; // superseded while loading
    }
    this.set({ state: 'playing' });
    this.player.play(success => {
      if (my === this.token) {
        this.set(success ? { state: 'ended' } : { state: 'error', error: 'AUDIO_PLAYBACK_FAILED' });
      }
    });
  }

  async playDeviceVoice(key: string, text: string, voiceId: string): Promise<void> {
    const my = await this.resetFor(key, 'device');
    try {
      this.set({ state: 'playing' });
      await this.device.speak(text, voiceId, () => {
        if (my === this.token) {
          this.set({ state: 'ended' });
        }
      });
    } catch {
      if (my === this.token) {
        this.set({ state: 'error', error: 'DEVICE_TTS_FAILED' });
      }
    }
  }

  pause(): void {
    if (this.current.kind === 'file' && this.current.state === 'playing') {
      this.player.pause();
      this.set({ state: 'paused' });
    }
  }

  resume(): void {
    if (this.current.kind === 'file' && this.current.state === 'paused') {
      const my = this.token;
      this.set({ state: 'playing' });
      this.player.play(success => {
        if (my === this.token) {
          this.set(success ? { state: 'ended' } : { state: 'error', error: 'AUDIO_PLAYBACK_FAILED' });
        }
      });
    }
  }

  /** Stops whatever is playing (used on stop button, POI/language switch, screen exit). */
  async stop(): Promise<void> {
    this.token++;
    this.player.stop();
    this.player.release();
    await this.device.stop();
    if (this.current.state !== 'idle') {
      this.set({ state: 'stopped' });
    }
  }

  async stopIfKeyDiffers(key: string): Promise<void> {
    if (this.current.key !== null && this.current.key !== key) {
      await this.stop();
      this.set({ key: null, kind: null, state: 'idle', error: null });
    }
  }

  private async resetFor(key: string, kind: ActiveKind): Promise<number> {
    await this.stop();
    const my = this.token;
    this.set({ key, kind, state: 'loading', error: null });
    return my;
  }
}

export const narration = new NarrationController();
