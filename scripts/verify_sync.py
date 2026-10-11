#!/usr/bin/env python3
"""Verificación audiovisual medida sobre el MP4 final (no sobre la intención).

Para cada evento de src/timeline.js:
  * audio: mayor salto de energía (envolvente muestra a muestra, ventana 1 ms) en ±25 ms;
  * vídeo: busca el pico de luminancia/cambio de imagen en ±6 fotogramas.
Uso: python3 -I scripts/verify_sync.py video.mp4 > build/sync_report.md
"""
import re, subprocess, sys
import numpy as np

video = sys.argv[1]
src = open('src/timeline.js', encoding='utf-8').read()
block = src[src.index('export const EVENTS'):]
block = block[:block.index('};')]
events = [(m.group(1), int(m.group(2))) for m in re.finditer(r'(\w+):\s*(\d+),', block)]

SR = 48000
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', video, '-map', '0:a:0', '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
a = np.frombuffer(raw, np.float32)
# envolvente de energía muestra a muestra (ventana deslizante de 1 ms) y su derivada en dB
e = np.sqrt(np.convolve(a.astype(np.float64) ** 2, np.ones(48) / 48, mode='same')) + 1e-9
db = 20 * np.log10(e)
jump = np.diff(db, prepend=db[0])

W, H = 135, 240
rawv = subprocess.run(['ffmpeg', '-v', 'error', '-i', video, '-map', '0:v:0', '-vf', f'scale={W}:{H},format=gray', '-f', 'rawvideo', '-'], capture_output=True, check=True).stdout
v = np.frombuffer(rawv, np.uint8).reshape(-1, H, W).astype(np.float32)
lum = v.mean(axis=(1, 2))
dlum = np.diff(lum, prepend=lum[0])

rows = []
for name, f in events:
    t_ms = f * 1000 / 60
    i0 = int(round(f * SR / 60))
    lo, hi = max(i0 - 1200, 0), i0 + 1200  # ±25 ms
    k = lo + int(np.argmax(jump[lo:hi]))
    a_ms = k * 1000 / SR
    seg = jump[lo:hi]
    vlo, vhi = max(f - 6, 1), min(f + 7, len(v))
    pk = vlo + int(np.argmax(dlum[vlo:vhi]))
    rows.append((name, f, t_ms, round(a_ms, 1), a_ms - t_ms, float(seg.max()) * 48, pk, pk - f, float(dlum[pk])))

print('| Evento | Fotograma | t (ms) | Onset audio medido (ms) | Desfase audio (ms) | Salto de energía (dB/ms) | Pico de luz (fotograma) | Desfase visual (fotogramas) | Δ luminancia |')
print('|---|---|---|---|---|---|---|---|---|')
for r in rows:
    print(f'| {r[0]} | {r[1]} | {r[2]:.1f} | {r[3]} | {r[4]:+.1f} | {r[5]:.2f} | {r[6]} | {r[7]:+d} | {r[8]:+.2f} |')
offs = [abs(r[4]) for r in rows if r[4] is not None]
print(f'\nDesfase absoluto de audio: medio {np.mean(offs):.1f} ms, máximo {np.max(offs):.1f} ms (1 fotograma = 16.7 ms).')
print(f'Fotogramas de vídeo: {len(v)} · muestras de audio: {len(a)} ({len(a) / SR:.3f} s).')
