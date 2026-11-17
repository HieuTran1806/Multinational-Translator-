import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getPasswordDeadline, isPasswordChangeOverdue, PASSWORD_CHANGE_WINDOW_MS } from './passwordDeadline.js';

const admin = { id: 123, role: 'ADMIN' };
const superAdmin = { id: 123, role: 'SUPER_ADMIN' };

describe('frontend-only 24h password deadline', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useRealTimers();
  });

  it('starts the 24h window on first login and persists across visits', () => {
    vi.setSystemTime(new Date('2026-11-17T00:00:00.000Z'));
    vi.useFakeTimers();
    const deadline = getPasswordDeadline(admin);
    expect(deadline).toBe(Date.now() + PASSWORD_CHANGE_WINDOW_MS);
    vi.advanceTimersByTime(60 * 60 * 1000);
    expect(getPasswordDeadline(admin)).toBe(deadline);
    expect(isPasswordChangeOverdue(admin)).toBe(false);
  });

  it('blocks admins after 24 hours and does not affect super admins', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-17T00:00:00.000Z'));
    getPasswordDeadline(admin);
    vi.advanceTimersByTime(PASSWORD_CHANGE_WINDOW_MS);
    expect(isPasswordChangeOverdue(admin)).toBe(true);
    expect(isPasswordChangeOverdue(superAdmin)).toBe(false);
  });
});
