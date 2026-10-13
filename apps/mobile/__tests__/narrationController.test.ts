import { NarrationController } from '../src/audio/narrationController';
import type { NarrationPlayer } from '../src/audio/NarrationPlayer';

function fakePlayer() {
  const log: string[] = [];
  const p: NarrationPlayer & { log: string[]; onEnd?: (ok: boolean) => void } = {
    log,
    load: async uri => {
      log.push(`load:${uri}`);
    },
    play: cb => {
      log.push('play');
      p.onEnd = cb;
    },
    pause: () => {
      log.push('pause');
    },
    stop: () => {
      log.push('stop');
    },
    release: () => {
      log.push('release');
    },
  };
  return p;
}

describe('NarrationController', () => {
  it('stops the current narration before starting another one (no overlap)', async () => {
    const player = fakePlayer();
    const device = { speak: jest.fn(async () => undefined), stop: jest.fn(async () => undefined) };
    const c = new NarrationController(player, device);
    await c.playFile('poi:1:vi', '/a.mp3');
    expect(c.getState()).toMatchObject({ key: 'poi:1:vi', state: 'playing' });

    player.log.length = 0;
    await c.playFile('poi:1:en', '/b.mp3');
    expect(player.log.slice(0, 3)).toEqual(['stop', 'release', 'load:/b.mp3']);
    expect(device.stop).toHaveBeenCalled();
    expect(c.getState().key).toBe('poi:1:en');
  });

  it('switching to the device voice stops file playback', async () => {
    const player = fakePlayer();
    const device = { speak: jest.fn(async () => undefined), stop: jest.fn(async () => undefined) };
    const c = new NarrationController(player, device);
    await c.playFile('poi:1:vi', '/a.mp3');
    await c.playDeviceVoice('poi:1:vi:device', 'Xin chào', 'voice-vi');
    expect(player.log).toContain('stop');
    expect(device.speak).toHaveBeenCalledWith('Xin chào', 'voice-vi', expect.any(Function));
    expect(c.getState()).toMatchObject({ kind: 'device', state: 'playing' });
  });

  it('supports pause, resume and stop', async () => {
    const player = fakePlayer();
    const c = new NarrationController(player, { speak: jest.fn(), stop: jest.fn(async () => undefined) });
    await c.playFile('k', '/a.mp3');
    c.pause();
    expect(c.getState().state).toBe('paused');
    c.resume();
    expect(c.getState().state).toBe('playing');
    await c.stop();
    expect(c.getState().state).toBe('stopped');
  });

  it('ignores the end callback of a superseded sound', async () => {
    const player = fakePlayer();
    const c = new NarrationController(player, { speak: jest.fn(), stop: jest.fn(async () => undefined) });
    await c.playFile('a', '/a.mp3');
    const oldEnd = player.onEnd!;
    await c.playFile('b', '/b.mp3');
    oldEnd(true);
    expect(c.getState()).toMatchObject({ key: 'b', state: 'playing' });
  });

  it('reports load errors', async () => {
    const player = fakePlayer();
    player.load = async () => {
      throw new Error('x');
    };
    const c = new NarrationController(player, { speak: jest.fn(), stop: jest.fn(async () => undefined) });
    await c.playFile('a', '/missing.mp3');
    expect(c.getState()).toMatchObject({ state: 'error', error: 'AUDIO_LOAD_FAILED' });
  });
});
