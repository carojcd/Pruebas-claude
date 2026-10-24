"""Mezcla de audio 'halloween': voz en off + música (baja mientras habla) + efectos sintéticos al compás.
Uso: python3 mix_halloween.py <voz.mp3> <musica.mp3> <salida.wav>"""
import sys, subprocess, numpy as np, wave
SR = 48000; BPM = 140; B = 60 / BPM
def load(p, dur=None):
    cmd = ['ffmpeg', '-v', 'error', '-i', p, '-ar', str(SR), '-ac', '2'] + (['-t', str(dur)] if dur else []) + ['-f', 's16le', '-']
    return np.frombuffer(subprocess.run(cmd, capture_output=True, check=True).stdout, '<i2').astype(np.float32).reshape(-1, 2) / 32768
vo = load(sys.argv[1]); DUR = len(vo) / SR + 0.15; N = int(DUR * SR); t = np.arange(N) / SR
mus = load(sys.argv[2], DUR + 1)[:N]; vo = np.pad(vo, ((0, N - len(vo)), (0, 0)))
# ducking: la música baja 7 dB mientras suena la voz (envolvente suavizada)
env = np.convolve(np.abs(vo).mean(1), np.ones(2400) / 2400, 'same'); on = np.clip((env - 0.01) / 0.03, 0, 1)
on = np.convolve(on, np.hanning(9600) / np.hanning(9600).sum(), 'same')
mus *= (0.30 - 0.14 * on)[:, None] * np.minimum(t / .25, 1)[:, None] * np.minimum((DUR - t) / 1.4, 1)[:, None]
vo *= (0.9 / max(np.abs(vo).max(), 1e-6))
rng = np.random.default_rng(5)
def lp(x, fc):
    k = np.exp(-2 * np.pi * fc / SR); y = np.empty_like(x); a = 0.0
    for i, v in enumerate(x): a = (1 - k) * v + k * a; y[i] = a
    return y
def whoosh(l=.45):
    n = int(l * SR); x = np.arange(n) / SR; nz = lp(rng.standard_normal(n), 3000) - lp(rng.standard_normal(n), 400) * .7
    return nz * np.where(x < l * .6, (x / (l * .6)) ** 2, np.exp(-(x - l * .6) / .06))
def boom(l=.5):
    n = int(l * SR); x = np.arange(n) / SR; return np.sin(2 * np.pi * (90 * np.exp(-x * 6) + 35) * x) * np.exp(-x / .18)
def sparkle(f0=1760, l=.9):
    n = int(l * SR); x = np.arange(n) / SR
    return sum(np.sin(2 * np.pi * f0 * m * x) * np.exp(-x / (.35 / m)) for m in (1, 1.5, 2, 3)) * np.minimum(x / .004, 1)
sfx = np.zeros(N, np.float32)
def put(sig, at, g):
    i = int(at * SR); n = min(len(sig), N - i)
    if n > 0: sfx[i:i + n] += sig[:n] * g
cuts = [round(i * 51.43) / 30 for i in range(1, 10)]            # cortes cada 4 tiempos
for c in cuts: put(whoosh(), c - .27, .22); put(boom(.35), c, .20)
put(boom(.6), 0, .30); put(whoosh(.6), 0, .2)
for k, f in enumerate((1318.5, 1568, 2093)): put(sparkle(f), cuts[-1] + .25 + k * .12, .10)   # aparición del logo
mix = mus + vo * 1.0 + np.stack([sfx, np.roll(sfx, 30)], 1)
mix = np.tanh(mix * 1.1) * 0.9
with wave.open(sys.argv[3], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix * 32767).astype('<i2').tobytes())
print('mezcla', round(DUR, 2), 's')
