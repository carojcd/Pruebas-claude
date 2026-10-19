"""Efectos sintetizados (numpy, semilla fija) sincronizados con index.html.
Salida: assets/audio/sfx.wav  (estéreo 44.1 kHz, ducking con la envolvente de assets/audio/vo.wav)
"""
import wave
import numpy as np

SR = 44100
DUR = 28.0
VO_START = 0.5
rng = np.random.default_rng(7)
N = int(SR * DUR)
buf = np.zeros((N, 2), dtype=np.float64)


def add(t, sig, gain=1.0, pan=0.0):
    i = int(t * SR)
    if i >= N:
        return
    sig = sig[: N - i]
    l = gain * (1 - max(pan, 0))
    r = gain * (1 + min(pan, 0))
    buf[i : i + len(sig), 0] += sig * l
    buf[i : i + len(sig), 1] += sig * r


def tt(d):
    return np.arange(int(SR * d)) / SR


def fade(x, a=0.004, r=0.02):
    n = len(x)
    ia, ir = max(int(a * SR), 1), max(int(r * SR), 1)
    x = x.copy()
    x[:ia] *= np.linspace(0, 1, ia)
    x[-ir:] *= np.linspace(1, 0, ir)
    return x


def tone(f, d, decay=6.0, harm=(1.0, 0.3, 0.1)):
    t = tt(d)
    y = sum(h * np.sin(2 * np.pi * f * (k + 1) * t) for k, h in enumerate(harm))
    return fade(y * np.exp(-decay * t))


def band_noise(d, f0, f1, bw=0.7, shape=None):
    """Ruido con banda en barrido de f0 a f1 (OLA por bloques FFT)."""
    n = int(SR * d)
    x = rng.standard_normal(n)
    win, hop = 2048, 512
    out = np.zeros(n + win)
    w = np.hanning(win)
    fr = np.fft.rfftfreq(win, 1 / SR)[1:]
    for s in range(0, n, hop):
        blk = np.zeros(win)
        seg = x[s : s + win]
        blk[: len(seg)] = seg
        sp = np.fft.rfft(blk * w)
        fc = f0 * (f1 / f0) ** (min((s + win / 2) / n, 1))
        g = np.concatenate([[0], np.exp(-0.5 * (np.log2(fr / fc) / bw) ** 2)])
        out[s : s + win] += np.fft.irfft(sp * g, win) * w
    y = out[:n]
    y /= np.max(np.abs(y)) + 1e-9
    if shape is not None:
        y *= shape(np.linspace(0, 1, n))
    return fade(y, 0.01, 0.05)


def whoosh(t, d, f0, f1, gain, peak=0.5):
    sh = lambda u: np.sin(np.pi * np.clip(u / (2 * peak) if u.size else u, 0, 1)) if False else (np.minimum(u / peak, 1) ** 1.5) * (np.minimum((1 - u) / (1 - peak), 1) ** 1.5)
    add(t, band_noise(d, f0, f1, 0.8, sh), gain)


def glass(t, gain=0.5, base=1568, n=5, gap=0.05, pan=0.0):
    for k in range(n):
        add(t + k * gap, tone(base * (1.25 ** k), 0.7, 5.5, (1.0, 0.45, 0.2)), gain * (0.85 ** k), pan)


PENTA = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.7, 1318.5]


def touch(t, k, gain=0.5, pan=0.0):
    add(t, tone(PENTA[k % len(PENTA)], 0.55, 7.0, (1.0, 0.25, 0.06)), gain, pan)


def pop(t, gain=0.5, f=620):
    t_ = tt(0.16)
    y = np.sin(2 * np.pi * (f + 900 * np.exp(-t_ * 30)) * t_) * np.exp(-t_ * 22)
    add(t, fade(y, 0.002, 0.03), gain)


def tick(t, gain=0.3, f=1500):
    t_ = tt(0.05)
    add(t, fade(np.sin(2 * np.pi * f * t_) * np.exp(-t_ * 90), 0.001, 0.01), gain)


def thud(t, gain=0.5):
    t_ = tt(0.5)
    y = np.sin(2 * np.pi * (95 * np.exp(-t_ * 3) + 48) * t_) * np.exp(-t_ * 9)
    add(t, fade(y, 0.003, 0.05), gain)


def bell(t, gain=0.5):
    t_ = tt(1.8)
    y = sum(a * np.sin(2 * np.pi * f * t_) * np.exp(-d * t_) for f, a, d in [(1318.5, 1, 3), (1976, 0.5, 4), (2637, 0.3, 5), (3322, 0.12, 7)])
    add(t, fade(y, 0.002, 0.2), gain)


def pad(gain=0.12):
    t_ = tt(DUR)
    y = sum(a * np.sin(2 * np.pi * f * t_ + p) for f, a, p in [(110, 1, 0), (164.8, 0.6, 1.1), (220, 0.45, 2.3), (329.6, 0.2, 0.7)])
    y *= 1 + 0.15 * np.sin(2 * np.pi * 0.11 * t_)
    env = np.minimum(t_ / 2.0, 1) * np.minimum((DUR - t_) / 2.0, 1)
    add(0, y * env, gain)


# ------------------------------------------------------------------ eventos (mismos tiempos que index.html)
pad()
whoosh(0.15, 1.9, 300, 3200, 0.9, 0.55)
thud(1.95, 0.45)
glass(0.9, 0.35, 1320, 5, 0.06)
for i in range(7):
    touch(1.0 + i * 0.1, i, 0.22, -0.4)
touch(1.5, 5, 0.3); touch(2.0, 6, 0.25); touch(2.1, 7, 0.25)
glass(1.6, 0.25, 1046, 4, 0.07)
for i, t in enumerate([2.4, 2.47, 2.54, 2.61, 2.68]):
    tick(t, 0.2, 1800 + 120 * i)
glass(3.5, 0.2, 1175, 4, 0.12)
for i in range(4):
    touch(3.5 + i * 0.28, i + 2, 0.28, 0.2)
for i in range(4):
    pop(4.5 + i * 0.28, 0.32, 700 + 60 * i)
whoosh(5.0, 0.9, 400, 2600, 0.5, 0.5)
glass(5.3, 0.3, 1397, 3, 0.07)
for i in range(3):
    pop(5.7 + i * 0.3, 0.38, 600 + 100 * i)
whoosh(6.35, 1.0, 350, 2400, 0.55, 0.5)
glass(6.55, 0.28, 1175, 4, 0.06)
for i in range(3):
    touch(6.7 + i * 0.28, 2 + i, 0.3, -0.5)
whoosh(7.25, 0.9, 400, 2400, 0.45, 0.5); touch(7.5, 4, 0.35, 0.5)
whoosh(8.65, 1.0, 400, 2800, 0.5, 0.5); glass(8.95, 0.3, 1568, 3, 0.07)
touch(8.9, 5, 0.3, 0.5); pop(8.95, 0.4, 700); touch(9.7, 6, 0.25)
for i in range(3):
    pop(10.05 + i * 0.28, 0.4, 560 + 90 * i)
touch(11.2, 3, 0.35, 0.5)
whoosh(11.5, 1.3, 600, 1800, 0.35, 0.5)
for i in range(6):
    tick(11.55 + i * 0.2, 0.2, 1200 + 80 * i)
whoosh(13.55, 1.0, 350, 2500, 0.55, 0.5); glass(14.1, 0.3, 1175, 4, 0.06)
touch(14.2, 6, 0.3, -0.6)
for i in range(3):
    tick(14.4 + i * 0.12, 0.25, 1700)
touch(14.6, 4, 0.3, -0.6); touch(14.85, 5, 0.3, -0.6)
whoosh(14.0, 0.9, 300, 2000, 0.4, 0.5)
for i in range(4):
    pop(14.5 + i * 0.28, 0.4, 560 + 70 * i)
whoosh(15.45, 1.0, 400, 2800, 0.5, 0.5); glass(15.75, 0.3, 1397, 3, 0.07); pop(15.8, 0.4, 700)
for i in range(15):
    tick(16.0 + i * 0.1, 0.18 + 0.01 * i, 1400 + 60 * i)
for i, t in enumerate([16.5, 16.75, 17.0]):
    touch(t, 3 + i, 0.32, 0.4)
whoosh(17.1, 1.0, 400, 2800, 0.5, 0.5); pop(17.4, 0.4, 700); glass(17.45, 0.3, 1568, 3, 0.07); pop(17.9, 0.4, 800)
glass(17.5, 0.28, 1175, 6, 0.2)
for i in range(3):
    pop(17.9 + i * 0.4, 0.3, 650 + 120 * i)
touch(17.5, 6, 0.3, 0.5)
# reunirse: swell + pulso de luz
add(19.1, band_noise(1.2, 250, 1400, 0.9, lambda u: np.sin(np.pi * u) ** 2), 0.4)
glass(20.0, 0.45, 1046, 6, 0.08)
add(20.0, tone(523.25, 1.8, 2.5, (1, 0.5, 0.25)) + tone(783.99, 1.8, 2.5, (1, 0.4, 0.2)), 0.22)
glass(20.5, 0.25, 1397, 4, 0.09)
# micro-acción
bell(22.1, 0.55)
for i in range(4):
    tick(22.1 + i * 0.45, 0.18, 2000)
# salida: whoosh inverso
add(23.1, band_noise(1.0, 3000, 250, 0.9, lambda u: np.minimum(u / 0.7, 1) * np.minimum((1 - u) / 0.3, 1)), 0.7)
# logo: tic + nota por letra, arcos al final
for i, t in enumerate([23.6, 23.78, 23.96, 24.14]):
    tick(t, 0.4, 1100 + 150 * i); touch(t, 1 + i * 2, 0.32, -0.3 + 0.2 * i)
add(24.3, band_noise(0.9, 500, 3500, 0.7, lambda u: np.sin(np.pi * u) ** 1.3), 0.4)
glass(24.3, 0.4, 1175, 6, 0.1)
add(24.45, tone(392, 3.2, 1.2, (1, 0.5, 0.2)) + tone(587.33, 3.2, 1.2, (1, 0.4, 0.15)), 0.25)

# ------------------------------------------------------------------ ducking con la voz
with wave.open("assets/audio/vo.wav") as w:
    raw = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).reshape(-1, w.getnchannels()).astype(np.float64) / 32768
vo = np.zeros(N)
m = raw.mean(axis=1)
s = int(VO_START * SR)
vo[s : s + len(m)] = m[: N - s]
win = int(0.02 * SR)
rms = np.sqrt(np.convolve(vo ** 2, np.ones(win) / win, mode="same"))
thr = 10 ** (-42 / 20)
speech_rms = np.sqrt(np.mean(vo[np.abs(vo) > 0.01] ** 2))
env_t = np.clip((rms - thr) / (0.4 * speech_rms), 0, 1)
a = np.exp(-1 / (0.03 * SR))   # ataque 30 ms
r = np.exp(-1 / (0.35 * SR))   # soltado 0.35 s
env = np.zeros(N)
e = 0.0
for i in range(N):
    x = env_t[i]
    e = a * e + (1 - a) * x if x > e else r * e + (1 - r) * x
    env[i] = e
gain = 1 - 0.88 * env
sfx = buf * gain[:, None]

# nivel: efectos ≈ -14 dB bajo la voz en los tramos hablados, techo -7 dBFS
spoken = env > 0.6
vo_rms = np.sqrt(np.mean(vo[spoken] ** 2))
sf_rms = np.sqrt(np.mean(sfx[spoken] ** 2))
sfx *= (vo_rms * 10 ** (-14 / 20)) / (sf_rms + 1e-12)
# paso alto suave (sin graves fuertes) y techo de pico
sfx[1:] -= 0.0 * sfx[:-1]
peak = np.max(np.abs(sfx))
cap = 10 ** (-7 / 20)
if peak > cap:
    sfx *= cap / peak
pcm = (np.clip(sfx, -1, 1) * 32767).astype(np.int16)
with wave.open("assets/audio/sfx.wav", "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print("sfx ok  peak dBFS=%.1f  rms/voz en habla=%.1f dB" % (20 * np.log10(np.max(np.abs(sfx))), 20 * np.log10(np.sqrt(np.mean(sfx[spoken] ** 2)) / vo_rms)))
