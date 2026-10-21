import { mockRequest } from './handlers.js';

/** Runs a mock call, fast-forwarding its fake network delay. */
async function call(path, opts) {
  const p = mockRequest(path, opts);
  p.catch(() => {});
  await vi.advanceTimersByTimeAsync(600);
  return p;
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

test('lists POIs with backend paging shape and filters', async () => {
  const res = await call('/api/v1/admin/pois?page=0&size=10');
  expect(res.items).toHaveLength(10);
  expect(res.totalItems).toBeGreaterThan(10);
  expect(res.totalPages).toBe(Math.ceil(res.totalItems / 10));
  expect(res.items[0]).toHaveProperty('languages');

  const found = await call('/api/v1/admin/pois?page=0&size=10&q=ben-duoc');
  expect(found.items.map((p) => p.code)).toEqual(['BEN-DUOC']);
});

test('create validates fields and rejects duplicate codes', async () => {
  await expect(call('/api/v1/admin/pois', { method: 'POST', body: { code: 'x' } })).rejects.toMatchObject({
    code: 'VALIDATION_FAILED',
    status: 400,
  });
  const body = { code: 'BEN-DUOC', defaultName: 'Trùng', latitude: 11, longitude: 106, triggerRadius: 50 };
  await expect(call('/api/v1/admin/pois', { method: 'POST', body })).rejects.toMatchObject({ code: 'CONFLICT', status: 409 });
});

test('publish requires English audio; uploading one unblocks it', async () => {
  const created = await call('/api/v1/admin/pois', {
    method: 'POST',
    body: { code: 'TEST-PUBLISH', defaultName: 'Test', latitude: 11, longitude: 106, triggerRadius: 50 },
  });
  const id = created.id;
  await expect(call(`/api/v1/admin/pois/${id}/publish`, { method: 'POST' })).rejects.toMatchObject({ code: 'PUBLISH_NOT_READY' });

  await call(`/api/v1/admin/pois/${id}/translations/en`, {
    method: 'PUT',
    body: { name: 'Test', description: '', narrationText: 'Hello' },
  });
  const fd = new FormData();
  fd.append('file', new File(['x'], 'en.mp3', { type: 'audio/mpeg' }));
  await call(`/api/v1/admin/pois/${id}/translations/en/audio`, { method: 'POST', formData: fd });

  const published = await call(`/api/v1/admin/pois/${id}/publish`, { method: 'POST' });
  expect(published.status).toBe('PUBLISHED');
});

test('changing narration bumps contentVersion and drops current audio', async () => {
  const list = await call('/api/v1/admin/pois?page=0&size=10&q=ben-duoc');
  const id = list.items[0].id;
  const before = (await call(`/api/v1/admin/pois/${id}`)).translations.find((t) => t.languageCode === 'vi');
  expect(before.currentAudio).not.toBeNull();

  await call(`/api/v1/admin/pois/${id}/translations/vi`, {
    method: 'PUT',
    body: { name: before.name, description: before.description, narrationText: `${before.narrationText} Mới.` },
  });
  const after = (await call(`/api/v1/admin/pois/${id}`)).translations.find((t) => t.languageCode === 'vi');
  expect(after.contentVersion).toBe(before.contentVersion + 1);
  expect(after.currentAudio).toBeNull();
});

test('TTS job goes QUEUED → RUNNING → SUCCEEDED, or FAILED for "#fail" text', async () => {
  const ok = (await call('/api/v1/admin/pois?page=0&size=10&q=ham-chong')).items[0].id;
  const job = await call(`/api/v1/admin/pois/${ok}/translations/en/tts`, { method: 'POST' });
  expect(job.status).toBe('QUEUED');
  await vi.advanceTimersByTimeAsync(1500);
  expect((await call(`/api/v1/admin/tts/jobs/${job.id}`)).status).toBe('RUNNING');
  await vi.advanceTimersByTimeAsync(3000);
  const done = await call(`/api/v1/admin/tts/jobs/${job.id}`);
  expect(done.status).toBe('SUCCEEDED');
  expect(done.audio.source).toBe('TTS');

  const bad = (await call('/api/v1/admin/pois?page=0&size=10&q=bep-hoang-cam')).items[0].id;
  const failing = await call(`/api/v1/admin/pois/${bad}/translations/vi/tts`, { method: 'POST' });
  await vi.advanceTimersByTimeAsync(5000);
  expect((await call(`/api/v1/admin/tts/jobs/${failing.id}`)).status).toBe('FAILED');
});

test('media routes return a blob for raw requests', async () => {
  const id = (await call('/api/v1/admin/pois?page=0&size=10&q=ben-duoc')).items[0].id;
  const poi = await call(`/api/v1/admin/pois/${id}`);
  const res = await call(poi.images[0].url, { raw: true });
  expect((await res.blob()).type).toBe('image/svg+xml');
});
