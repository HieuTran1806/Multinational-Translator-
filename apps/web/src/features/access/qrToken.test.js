import { describe, expect, it } from 'vitest';
import { extractQrToken } from './qrToken.js';
import { cameraErrorKey } from './cameraErrors.js';

describe('extractQrToken (UC02 step 2 + A2)', () => {
  it('reads the token from the activation URL encoded in the QR', () => {
    expect(extractQrToken('http://localhost:5174/activate?t=AbC_123-xyz')).toBe('AbC_123-xyz');
    expect(extractQrToken('  https://tour.example/activate?lang=en&t=TOKEN-0001  ')).toBe('TOKEN-0001');
  });

  it('accepts a bare token typed from a ticket', () => {
    expect(extractQrToken('DEMO-QR-0002')).toBe('DEMO-QR-0002');
  });

  it('rejects content that carries no usable token', () => {
    expect(extractQrToken('')).toBeNull();
    expect(extractQrToken('https://example.com/no-token')).toBeNull();
    expect(extractQrToken('hello world')).toBeNull();
    expect(extractQrToken('abc')).toBeNull();
    expect(extractQrToken('https://x/activate?t=<script>')).toBeNull();
  });
});

describe('cameraErrorKey', () => {
  it('maps camera failures to user-facing messages', () => {
    expect(cameraErrorKey({ name: 'NotAllowedError' })).toBe('scan.cam.denied');
    expect(cameraErrorKey({ name: 'NotFoundError' })).toBe('scan.cam.notFound');
    expect(cameraErrorKey({ name: 'Boom' })).toBe('scan.cam.failed');
    expect(cameraErrorKey({ name: 'NotAllowedError' }, false)).toBe('scan.cam.insecure');
  });
});
