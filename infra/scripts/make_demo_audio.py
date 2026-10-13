#!/usr/bin/env python3
"""Generate small, valid WAV fixtures for the demo (no Google Cloud needed).

They are simple TONES, not speech: vi = two short beeps, en = three short beeps.
Usage:  python3 infra/scripts/make_demo_audio.py [output_dir]
Default output: services/backend/src/main/resources/demo-audio/
"""
import math
import os
import struct
import sys
import wave

RATE = 8000


def tone_pattern(beeps: int, freq: float) -> bytes:
    frames = bytearray()
    for _ in range(beeps):
        for i in range(int(RATE * 0.25)):  # 250 ms beep
            v = int(12000 * math.sin(2 * math.pi * freq * i / RATE))
            frames += struct.pack('<h', v)
        frames += b'\x00\x00' * int(RATE * 0.25)  # 250 ms silence
    frames += b'\x00\x00' * int(RATE * 0.5)
    return bytes(frames)


def write(path: str, data: bytes) -> None:
    with wave.open(path, 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(RATE)
        w.writeframes(data)
    print('wrote', path, os.path.getsize(path), 'bytes')


if __name__ == '__main__':
    here = os.path.dirname(os.path.abspath(__file__))
    default = os.path.join(here, '..', '..', 'services', 'backend', 'src', 'main', 'resources', 'demo-audio')
    out = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else default)
    os.makedirs(out, exist_ok=True)
    write(os.path.join(out, 'demo-vi.wav'), tone_pattern(2, 660.0))
    write(os.path.join(out, 'demo-en.wav'), tone_pattern(3, 880.0))
