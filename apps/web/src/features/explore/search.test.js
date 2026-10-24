import { describe, expect, it } from 'vitest';
import { filterPois, normalizeText } from './search.js';

const POIS = [
  { id: 1, name: 'Địa đạo Bến Dược', code: 'DEMO-BEN-DUOC', category: 'Di tích lịch sử', languages: ['en', 'vi'] },
  { id: 2, name: 'Đền thờ liệt sĩ Bến Dược', code: 'DEMO-DEN-BEN-DUOC', category: 'Đền thờ', languages: ['vi'] },
  { id: 3, name: 'Old Rubber Grove', code: 'DEMO-VUON-CAO-SU', category: 'Thiên nhiên', languages: ['en', 'fr', 'vi'] },
];

describe('normalizeText', () => {
  it('strips Vietnamese diacritics and lowercases', () => {
    expect(normalizeText('Địa Đạo Bến Dược')).toBe('dia dao ben duoc');
  });

  it('handles null/undefined and keeps non-Vietnamese text intact', () => {
    expect(normalizeText(null)).toBe('');
    expect(normalizeText('Old Rubber Grove')).toBe('old rubber grove');
  });
});

describe('filterPois', () => {
  it('returns everything for a blank query', () => {
    expect(filterPois(POIS, '   ')).toEqual(POIS);
  });

  it('matches without diacritics', () => {
    expect(filterPois(POIS, 'ben duoc').map((p) => p.id)).toEqual([1, 2]);
  });

  it('matches by category', () => {
    expect(filterPois(POIS, 'den tho').map((p) => p.id)).toEqual([2]);
  });

  it('matches language codes as exact tokens (fr matches no name substring)', () => {
    expect(filterPois(POIS, 'fr').map((p) => p.id)).toEqual([3]);
  });

  it('requires every term to match (AND)', () => {
    expect(filterPois(POIS, 'ben duoc dia dao').map((p) => p.id)).toEqual([1]);
    expect(filterPois(POIS, 'ben duoc khongtonai').map((p) => p.id)).toEqual([]);
  });
});
