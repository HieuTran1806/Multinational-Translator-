import { describe, expect, it, vi } from 'vitest';
import { apiUrl, mediaUrl, ApiError } from './client.js';

vi.mock('../config.js', () => ({ API_BASE_URL: 'http://api.test' }));

describe('client helpers', () => {
  it('joins the API base with a relative path', () => {
    expect(apiUrl('/api/v1/public/pois')).toBe('http://api.test/api/v1/public/pois');
  });

  it('mediaUrl passes API-relative paths through and maps null to null', () => {
    expect(mediaUrl('/api/v1/public/audio/7')).toBe('http://api.test/api/v1/public/audio/7');
    expect(mediaUrl(null)).toBeNull();
  });

  it('ApiError keeps the backend error shape', () => {
    const e = new ApiError({ code: 'NOT_FOUND', message: 'Địa điểm', status: 404 });
    expect(e.code).toBe('NOT_FOUND');
    expect(e.status).toBe(404);
    expect(e.message).toBe('Địa điểm');
    expect(e.name).toBe('ApiError');
  });
});
