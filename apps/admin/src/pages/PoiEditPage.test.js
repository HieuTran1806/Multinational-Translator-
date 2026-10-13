import { describe, expect, it } from 'vitest';
import { validatePoiForm } from './poiForm.js';

describe('validatePoiForm', () => {
  it('accepts a valid POI', () => {
    expect(validatePoiForm({ code: 'BEN-DUOC', defaultName: 'Bến Dược', latitude: '11.14', longitude: '106.46' })).toEqual(
      {},
    );
  });

  it('rejects out-of-range coordinates and bad codes', () => {
    const e = validatePoiForm({ code: 'ben duoc', defaultName: ' ', latitude: '91', longitude: 'abc' });
    expect(Object.keys(e).sort()).toEqual(['code', 'defaultName', 'latitude', 'longitude']);
  });
});
