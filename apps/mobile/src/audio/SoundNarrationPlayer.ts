import Sound from 'react-native-sound';
import type { NarrationPlayer } from './NarrationPlayer';

let categorySet = false;

/** react-native-sound implementation (Android MediaPlayer / iOS AVAudioPlayer). */
export class SoundNarrationPlayer implements NarrationPlayer {
  private sound: Sound | null = null;

  load(uri: string): Promise<void> {
    if (!categorySet) {
      Sound.setCategory('Playback');
      categorySet = true;
    }
    this.release();
    return new Promise((resolve, reject) => {
      // Absolute path or URL: basePath must be ''.
      const s = new Sound(uri, '', (error: unknown) => {
        if (error) {
          s.release();
          reject(new Error('AUDIO_LOAD_FAILED'));
          return;
        }
        this.sound = s;
        resolve();
      });
    });
  }

  play(onEnd: (success: boolean) => void): void {
    this.sound?.play(onEnd);
  }

  pause(): void {
    this.sound?.pause();
  }

  stop(): void {
    this.sound?.stop();
  }

  release(): void {
    if (this.sound) {
      this.sound.stop();
      this.sound.release();
      this.sound = null;
    }
  }
}
