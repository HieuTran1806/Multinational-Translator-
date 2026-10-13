/** Abstraction over the audio playback library (MobileNarrationPlayer). */
export type PlayerState = 'idle' | 'loading' | 'playing' | 'paused' | 'stopped' | 'ended' | 'error';

export interface NarrationPlayer {
  /** Loads a local absolute file path or an http(s) URL. Rejects if the file cannot be prepared. */
  load(uri: string): Promise<void>;
  play(onEnd: (success: boolean) => void): void;
  pause(): void;
  stop(): void;
  release(): void;
}
