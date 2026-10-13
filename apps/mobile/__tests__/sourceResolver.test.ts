import { resolveNarrationSource } from '../src/audio/sourceResolver';

const base = { contentVersion: 3, narrationText: 'Xin chào', online: true };

describe('resolveNarrationSource', () => {
  it('prefers verified local audio of the same content version, even online', () => {
    expect(resolveNarrationSource({
      ...base,
      local: { path: '/a.mp3', contentVersion: 3, verified: true },
      remote: { url: 'http://x/a', contentVersion: 3 },
    })).toEqual({ kind: 'local', path: '/a.mp3' });
  });

  it('never uses local audio of an older content version', () => {
    expect(resolveNarrationSource({
      ...base,
      local: { path: '/old.mp3', contentVersion: 2, verified: true },
      remote: { url: 'http://x/new', contentVersion: 3 },
    })).toEqual({ kind: 'remote', url: 'http://x/new' });
  });

  it('ignores unverified local files', () => {
    expect(resolveNarrationSource({
      ...base,
      local: { path: '/broken.mp3', contentVersion: 3, verified: false },
      remote: { url: 'http://x/a', contentVersion: 3 },
    }).kind).toBe('remote');
  });

  it('suggests the device voice when offline without local audio', () => {
    expect(resolveNarrationSource({
      ...base,
      online: false,
      remote: { url: 'http://x/a', contentVersion: 3 },
    })).toEqual({ kind: 'device-suggested', reason: 'OFFLINE_NO_LOCAL_AUDIO' });
  });

  it('suggests the device voice when no audio exists at all', () => {
    expect(resolveNarrationSource({ ...base })).toEqual({ kind: 'device-suggested', reason: 'NO_AUDIO' });
  });

  it('does not use remote audio produced for an older version', () => {
    expect(resolveNarrationSource({ ...base, remote: { url: 'http://x/old', contentVersion: 2 } }).kind)
      .toBe('device-suggested');
  });
});
