import { chunkText, pickVoice, voiceMatchesLanguage, type DeviceVoice } from '../src/audio/voiceSelection';

const v = (over: Partial<DeviceVoice>): DeviceVoice => ({
  id: 'id', name: 'n', language: 'vi-VN', quality: 300, networkConnectionRequired: false, notInstalled: false, ...over,
});

describe('voice selection', () => {
  it('matches language tags in several formats', () => {
    expect(voiceMatchesLanguage('vi-VN', 'vi')).toBe(true);
    expect(voiceMatchesLanguage('vi_VN', 'vi')).toBe(true);
    expect(voiceMatchesLanguage('vie', 'vi')).toBe(true);
    expect(voiceMatchesLanguage('en-US', 'vi')).toBe(false);
  });

  it('never picks a voice of another language', () => {
    const r = pickVoice([v({ id: 'en', language: 'en-US' })], 'vi', false);
    expect(r).toEqual({ ok: false, problem: 'NO_VOICE_FOR_LANGUAGE' });
  });

  it('reports voices whose data is not installed', () => {
    expect(pickVoice([v({ notInstalled: true })], 'vi', false)).toEqual({ ok: false, problem: 'VOICE_NOT_INSTALLED' });
  });

  it('offline: only accepts voices that do not need the network', () => {
    const network = v({ id: 'net', networkConnectionRequired: true, quality: 500 });
    expect(pickVoice([network], 'vi', true)).toEqual({ ok: false, problem: 'NO_OFFLINE_VOICE' });
    const local = v({ id: 'local', quality: 100 });
    const r = pickVoice([network, local], 'vi', true);
    expect(r.ok && r.voice.id).toBe('local');
  });

  it('online: prefers embedded voices, then quality', () => {
    const r = pickVoice([
      v({ id: 'net', networkConnectionRequired: true, quality: 500 }),
      v({ id: 'lowLocal', quality: 100 }),
      v({ id: 'hiLocal', quality: 400 }),
    ], 'vi', false);
    expect(r.ok && r.voice.id).toBe('hiLocal');
  });

  it('chunks long text below the engine limit', () => {
    const text = 'Câu một. '.repeat(1000);
    const chunks = chunkText(text, 500);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every(c => c.length <= 500)).toBe(true);
    expect(chunks.join(' ').replace(/\s+/g, ' ')).toBe(text.trim().replace(/\s+/g, ' '));
  });
});
