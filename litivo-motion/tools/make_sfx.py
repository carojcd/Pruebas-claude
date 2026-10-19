"""Sintetiza los sonidos de la pieza (sin samples). Determinista: semilla fija."""
import numpy as np, wave
SR = 44100; DUR = 20.0
rng = np.random.default_rng(7)
out = np.zeros((int(SR * DUR), 2))

def t_(d): return np.arange(int(SR * d)) / SR
def env(n, a=0.004, d=0.2):
    t = np.arange(n) / SR
    return np.minimum(t / a, 1) * np.exp(-t / d)
def put(t0, x, gain=1.0, pan=0.0):
    i = int(t0 * SR); x = x[: len(out) - i]
    out[i:i + len(x), 0] += x * gain * (1 - max(pan, 0))
    out[i:i + len(x), 1] += x * gain * (1 + min(pan, 0))
def lowpass_sweep(x, f0, f1):
    n = len(x); f = np.linspace(f0, f1, n); a = 1 - np.exp(-2 * np.pi * f / SR)
    y = np.zeros(n); s = 0.0
    for i in range(n):
        s += a[i] * (x[i] - s); y[i] = s
    return y
def tone(f, d, dec=0.15, a=0.004, harm=(1, 0.35, 0.12)):
    t = t_(d); y = sum(h * np.sin(2 * np.pi * f * (k + 1) * t) for k, h in enumerate(harm))
    return y * env(len(t), a, dec)

def whoosh(t0, d, gain=0.5, up=True):
    n = int(SR * d); x = rng.standard_normal(n)
    y = lowpass_sweep(x, 250, 5200) if up else lowpass_sweep(x, 5200, 250)
    t = np.arange(n) / SR; sh = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 2
    put(t0, y * sh * gain, 1, 0)
def thud(t0, gain=0.7):
    t = t_(0.5); f = 40 + 60 * np.exp(-t * 14)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9)
    put(t0, y * gain)
def glass(t0, d=1.1, gain=0.18):
    t = t_(d); f = 1700 + 1500 * (t / d)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.5 * np.sin(2 * np.pi * np.cumsum(f * 1.5) / SR)
    put(t0, y * np.sin(np.pi * t / d) ** 2 * gain, 1, 0.2)
def pluck(t0, f, gain=0.25, pan=0.0, dec=0.16):
    put(t0, tone(f, 0.6, dec), gain, pan)
def pop(t0, gain=0.22):
    t = t_(0.12); f = 320 + 520 * (t / 0.12)
    put(t0, np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 28), gain)
def bell(t0, f, gain=0.2, d=1.6, pan=0.0):
    t = t_(d); y = sum(a * np.sin(2 * np.pi * f * r * t) * np.exp(-t / (d * w))
                       for r, a, w in ((1, 1, .35), (2.76, .4, .2), (5.4, .2, .1)))
    put(t0, y * np.minimum(t / 0.004, 1), gain, pan)
def tick(t0, gain=0.07):
    n = int(SR * 0.02); x = rng.standard_normal(n) * np.exp(-np.arange(n) / SR / 0.004)
    put(t0, np.diff(x, prepend=0), gain)
def swell(t0, d, gain=0.3):
    n = int(SR * d); x = rng.standard_normal(n); y = lowpass_sweep(x, 200, 4500)
    put(t0, y * (np.arange(n) / n) ** 2 * gain)

P = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.7, 1318.5]   # pentatónica

# ── llegada de la tarjeta
whoosh(0.0, 1.8, 0.55); thud(1.72, 0.8); bell(1.75, 523.25, 0.12, 2.0)
# ── cabecera (barra, icono, palabras, píldora, brillo)
glass(0.95, 1.1); pluck(1.35, P[2], 0.18, -0.3); pluck(1.5, P[4], 0.18, -0.1); pluck(1.75, P[5], 0.16, 0.4); pop(1.2, 0.14)
# ── titular, texto, línea
pluck(1.6, P[3], 0.2); pluck(2.4, P[1], 0.14); whoosh(3.2, 0.7, 0.14)
# ── píldoras de capacidades (sube la escala) + pop del icono
PT = [4.3, 4.6, 5.15, 5.7, 6.8, 7.9, 8.3, 8.45, 8.6, 8.75, 8.9, 9.05]
for i, t in enumerate(PT):
    pluck(t, P[i % 8], 0.2, (-0.5 if i % 2 == 0 else 0.5)); pop(t + 0.1, 0.12)
# ── cifras: entran y cuentan
for t in (9.6, 10.6, 11.9): pluck(t, P[2], 0.16, 0)
for t0 in (9.75, 10.85):
    for k in range(14): tick(t0 + k * 0.07, 0.05 + 0.002 * k)
    bell(t0 + 1.0, P[5], 0.12, 1.2)
# ── las capas se reúnen + pulso + micro-acción
swell(12.35, 0.5, 0.3); thud(12.85, 0.5); bell(12.85, 1046.5, 0.16, 2.0); glass(12.95, 0.9, 0.16)
bell(13.3, 1318.5, 0.18, 1.4); pluck(13.95, 1568.0, 0.14)
# ── outro: retroceso, logo letra por letra, arcos, eslogan
whoosh(14.15, 0.8, 0.42, up=False)
for i in range(6): pluck(14.9 + i * 0.1, P[i], 0.26, -0.3 + 0.12 * i, 0.12); tick(14.9 + i * 0.1, 0.08)
bell(15.55, 783.99, 0.15, 2.2); bell(15.6, 1174.7, 0.12, 2.2); glass(15.55, 1.0, 0.15)
bell(15.8, 523.25, 0.1, 3.0)
# ── colchón grave muy suave
t = t_(DUR); pad = (np.sin(2*np.pi*110*t) + 0.6*np.sin(2*np.pi*164.8*t) + 0.4*np.sin(2*np.pi*220.5*t))
pad *= 0.022 * np.minimum(t / 2, 1) * np.minimum((DUR - t) / 1.5, 1)
out[:, 0] += pad; out[:, 1] += pad
out /= max(np.abs(out).max(), 1e-9) / 0.9
with wave.open("assets/audio/sfx.wav", "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((out * 32767).astype("<i2").tobytes())
print("ok")
