"""Diseño sonoro sintetizado v2 (numpy, semilla fija), sincronizado con index.html.
Capas: base musical suave (pad + arpegio + hat), efectos de transición, tipografía, interfaz y logo.
Mezcla: reverb en envío, ducking con la voz (ataque 30 ms, soltado 0.35 s), efectos ≈ -14 dB bajo la voz
en los tramos hablados y techo de pico -7 dBFS.  Salida: assets/audio/sfx.wav
"""
import wave
import numpy as np

SR = 44100
DUR = 35.0
VO_START = 0.5
N = int(SR * DUR)
rng = np.random.default_rng(7)
dry = np.zeros((N, 2))
wet = np.zeros((N, 2))   # envío a reverb


def put(bus, t, sig, gain=1.0, pan=0.0):
    i = int(round(t * SR))
    if i >= N or gain == 0:
        return
    sig = sig[: N - i]
    bus[i : i + len(sig), 0] += sig * gain * np.sqrt(0.5 * (1 - pan))
    bus[i : i + len(sig), 1] += sig * gain * np.sqrt(0.5 * (1 + pan))


def add(t, sig, gain=1.0, pan=0.0, send=0.0):
    put(dry, t, sig, gain, pan)
    if send:
        put(wet, t, sig, gain * send, pan)


def tt(d):
    return np.arange(int(SR * d)) / SR


def fade(x, a=0.004, r=0.03):
    x = x.copy()
    ia, ir = max(int(a * SR), 1), max(int(r * SR), 1)
    x[:ia] *= np.linspace(0, 1, ia)
    x[-ir:] *= np.linspace(1, 0, ir)
    return x


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def tone(f, d, decay=6.0, harm=(1.0, 0.3, 0.1)):
    t = tt(d)
    y = sum(h * np.sin(2 * np.pi * f * (k + 1) * t) for k, h in enumerate(harm))
    return fade(y * np.exp(-decay * t))


def band_noise(d, f0, f1, bw=0.7, shape=None):
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
        fc = f0 * (f1 / f0) ** min((s + win / 2) / n, 1)
        g = np.concatenate([[0], np.exp(-0.5 * (np.log2(fr / fc) / bw) ** 2)])
        out[s : s + win] += np.fft.irfft(np.fft.rfft(blk * w) * g, win) * w
    y = out[:n] / (np.max(np.abs(out[:n])) + 1e-9)
    if shape is not None:
        y *= shape(np.linspace(0, 1, n))
    return fade(y, 0.01, 0.05)


def bump(peak, p1=1.6, p2=1.4):
    return lambda u: np.minimum(u / peak, 1) ** p1 * np.minimum((1 - u) / (1 - peak), 1) ** p2


# ---------------------------------------------------------------- instrumentos
def whoosh(t, d=0.55, f0=350, f1=3000, gain=0.6, pan0=-0.7, pan1=0.7, peak=0.6):
    """Whoosh con barrido espectral y paneo estéreo (en 4 tramos)."""
    y = band_noise(d, f0, f1, 0.75, bump(peak))
    k = 4
    seg = len(y) // k
    for j in range(k):
        p = pan0 + (pan1 - pan0) * (j + 0.5) / k
        s = y[j * seg : (j + 1) * seg if j < k - 1 else len(y)]
        add(t + j * seg / SR, fade(s, 0.003, 0.003), gain, p, 0.15)


def thump(t, gain=0.4):
    t_ = tt(0.35)
    body = np.sin(2 * np.pi * (140 * np.exp(-t_ * 18) + 70) * t_) * np.exp(-t_ * 14)
    click = band_noise(0.05, 2500, 1800, 0.9) * 0.25
    y = body.copy()
    y[: len(click)] += click
    add(t, fade(y, 0.002, 0.04), gain, 0, 0.1)


def glass(t, gain=0.4, base=1568, n=5, gap=0.05, pan=0.0):
    for k in range(n):
        add(t + k * gap, tone(base * 1.25 ** k, 0.8, 5.0, (1.0, 0.4, 0.15)), gain * 0.85 ** k, pan + 0.12 * (k - n / 2) / n, 0.5)


def pluck(f, d=0.6, decay=5.0):
    t = tt(d)
    y = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t * 9) + 0.12 * np.sin(2 * np.pi * 3 * f * t) * np.exp(-t * 14)
    return fade(y * np.exp(-decay * t), 0.002, 0.05)


def tick(t, gain=0.25, f=2200, pan=0.0):
    t_ = tt(0.04)
    add(t, fade(np.sin(2 * np.pi * f * t_) * np.exp(-t_ * 120), 0.0005, 0.008), gain, pan, 0.2)


def pop(t, gain=0.4, f=620, pan=0.0):
    t_ = tt(0.18)
    y = np.sin(2 * np.pi * (f + 900 * np.exp(-t_ * 30)) * t_) * np.exp(-t_ * 20)
    add(t, fade(y, 0.002, 0.03), gain, pan, 0.25)


def bell(t, gain=0.5, f=1318.5):
    t_ = tt(2.0)
    y = sum(a * np.sin(2 * np.pi * f * r * t_) * np.exp(-d * t_) for r, a, d in [(1, 1, 2.6), (1.5, 0.5, 3.5), (2, 0.3, 4.5), (2.52, 0.12, 6)])
    add(t, fade(y, 0.002, 0.2), gain, 0, 0.6)


def letters(t0, n, st, gain=0.16, pan=0.0, base=72):
    """Tipografía cinética: tic + nota pentatónica suave por letra."""
    pent = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24]
    for i in range(n):
        tick(t0 + i * st, gain, 2400 + 90 * i, pan + 0.5 * (i / max(n - 1, 1) - 0.5))
        if i % 2 == 0:
            add(t0 + i * st, pluck(hz(base + pent[i % len(pent)]), 0.35, 9), gain * 0.9, pan, 0.4)


def riser(t, d, gain=0.4, f0=300, f1=4000):
    add(t, band_noise(d, f0, f1, 0.6, lambda u: u ** 2.2), gain, 0, 0.3)
    tt_ = tt(d)
    f = f0 * 0.5 * (f1 / f0) ** (tt_ / d) * 0.25
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * (tt_ / d) ** 2
    add(t, fade(y, 0.01, 0.05), gain * 0.25, 0, 0.3)


# ---------------------------------------------------------------- base musical (100 BPM, beat 0.6 s)
BEAT = 0.6
CH = {"C": [48, 55, 62, 64], "Am": [45, 52, 55, 60], "F": [41, 48, 52, 57], "G": [43, 50, 52, 59]}
PROG = ["C", "Am", "F", "G"]


def pad_chord(t, notes, d, gain):
    t_ = tt(d)
    env = np.minimum(t_ / 0.35, 1) * np.minimum((d - t_) / 0.6, 1)
    y = np.zeros_like(t_)
    for m in notes:
        f = hz(m + 12)
        for det in (-0.0018, 0.0018):
            y += np.sin(2 * np.pi * f * (1 + det) * t_) + 0.18 * np.sin(2 * np.pi * 2 * f * (1 + det) * t_)
    add(t, y * env / len(notes), gain, 0, 0.35)


t = 0.6
bar = 0
while t < 28.9:
    name = PROG[bar % 4]
    pad_chord(t, CH[name], 4 * BEAT + 0.5, 0.16)
    if t >= 3.0:
        tones = CH[name][1:] + [CH[name][1] + 12, CH[name][2] + 12]
        for k in range(8):
            tk = t + k * BEAT / 2
            if tk >= 28.9:
                break
            m = tones[(k * 3) % len(tones)] + 12
            add(tk, pluck(hz(m), 0.5, 6.5), 0.11 if k % 2 == 0 else 0.07, 0.35 * np.sin(k * 1.3), 0.45)
    if t >= 5.0:
        for k in range(4):
            add(t + k * BEAT + BEAT / 2, band_noise(0.06, 9000, 7000, 0.5, lambda u: np.exp(-u * 5)), 0.05, 0.3, 0.1)
    t += 4 * BEAT
    bar += 1
pad_chord(29.4, [36, 48, 55, 64, 67], 5.6, 0.2)          # acorde final en el logo

# ---------------------------------------------------------------- eventos (mismos tiempos que index.html)
whoosh(0.25, 1.1, 250, 1800, 0.4, -0.2, 0.2, 0.7); thump(1.2, 0.3); glass(0.5, 0.35, 1046, 5, 0.08)   # logo FLM
whoosh(1.75, 0.8, 1800, 500, 0.2, 0, 0, 0.5)
pop(2.05, 0.25, 700)
letters(2.6, 13, 0.035, 0.11, 0, 74); letters(3.15, 10, 0.04, 0.11, 0, 72)
whoosh(4.2, 0.4, 2600, 500, 0.35, 0, 0)
letters(5.1, 7, 0.05, 0.14, -0.3, 76); letters(5.4, 7, 0.05, 0.14, 0.3, 79)
for i in range(5):
    add(6.0 + i * 0.08, pluck(hz(79 + [0, 2, 4, 7, 9][i]), 0.4, 8), 0.1, -0.5 + 0.25 * i, 0.4)
whoosh(6.6, 0.5, 2800, 400, 0.45, 0, 0)
pop(7.9, 0.45, 520)                                                          # 24
for i in range(12):
    tick(7.9 + i * 0.08, 0.14 + 0.01 * i, 1500 + 80 * i, 0.3)
glass(8.9, 0.3, 1397, 4, 0.06)
letters(8.55, 11, 0.03, 0.1, 0, 72)
whoosh(9.8, 0.9, 250, 2400, 0.4, 0, 0, 0.75); thump(10.5, 0.3)              # móvil
letters(10.35, 20, 0.03, 0.08, 0, 74)
whoosh(11.85, 0.5, 600, 3500, 0.55, -0.6, 0.6)
whoosh(12.15, 1.0, 250, 2800, 0.45, 0.4, 0.2, 0.75); thump(12.9, 0.35)     # clases en vivo
whoosh(12.4, 0.8, 300, 2600, 0.3, -0.6, -0.2, 0.7)
letters(12.3, 6, 0.04, 0.15, -0.3, 74); letters(12.55, 6, 0.04, 0.15, 0.3, 79)
pop(13.0, 0.4, 560, 0.5)
for i in range(3):
    pop(13.35 + i * 0.2, 0.3, 600 + 90 * i, 0.4)
letters(13.8, 10, 0.035, 0.13, 0, 76)
whoosh(14.68, 0.5, 500, 3500, 0.6, 0.3, -0.9)
whoosh(14.8, 0.9, 250, 2600, 0.45, 0, 0, 0.8); thump(15.55, 0.35)          # suscripción
for i in range(3):
    pop(15.3 + i * 0.25, 0.35, 650 + 110 * i, 0.3 * (i - 1))
pop(16.4, 0.4, 520)
for i in range(10):
    for j in range(3):
        tick(16.35 + i * 0.035 + j * 0.08, 0.12, 2600 + 150 * j, -0.6 + i * 0.12)
add(16.7, band_noise(1.6, 900, 1500, 0.4, bump(0.4)), 0.18, 0, 0.2)
letters(17.75, 6, 0.05, 0.18, 0, 72); glass(18.1, 0.3, 1175, 4, 0.06)
whoosh(18.75, 0.45, 3200, 500, 0.5, 0, 0)
whoosh(19.35, 0.9, 250, 2400, 0.45, 0, 0, 0.75); thump(20.05, 0.35)        # diplomados
letters(19.4, 10, 0.035, 0.14, -0.3, 79); letters(19.9, 7, 0.04, 0.12, 0.3, 74)
pop(19.85, 0.3, 720, 0.4)
letters(21.25, 8, 0.035, 0.12, -0.3, 72); letters(21.55, 14, 0.025, 0.1, 0.3, 76)
whoosh(22.82, 0.5, 500, 3400, 0.55, 0.5, -0.9)
whoosh(23.3, 0.9, 300, 2600, 0.45, 0.8, 0.2, 0.75); thump(24.0, 0.35)      # webinars
letters(23.35, 8, 0.04, 0.15, 0, 79)
pop(23.9, 0.4, 620, -0.3); pop(24.0, 0.4, 520, 0.2)
letters(24.4, 8, 0.035, 0.12, -0.3, 72); letters(24.7, 9, 0.035, 0.14, 0.3, 77)
glass(24.9, 0.3, 1568, 4, 0.06, 0.3)
whoosh(25.92, 0.5, 500, 3500, 0.55, -0.5, 0.9)
whoosh(26.1, 0.9, 250, 2800, 0.45, 0, 0, 0.75); thump(26.8, 0.3)            # graduarte
letters(26.15, 14, 0.025, 0.1, 0, 76)
for i in range(12):
    tick(26.5 + i * 0.1, 0.13 + 0.01 * i, 1500 + 70 * i, 0.4)
bell(27.7, 0.4)
pop(27.3, 0.4, 560)
letters(27.75, 9, 0.04, 0.15, 0, 79)
riser(28.3, 0.7, 0.25, 400, 5000)
whoosh(28.97, 0.5, 600, 3600, 0.5, 0.3, 0.3)
# logo Academia FLM armado por partes
whoosh(29.3, 0.6, 400, 3000, 0.35, -0.8, 0.2, 0.6)
add(29.5, band_noise(0.9, 500, 4200, 0.7, bump(0.5, 1.3, 1.3)), 0.35, 0, 0.4)
thump(29.6, 0.35); glass(29.5, 0.35, 1175, 6, 0.09)
for i in range(3):
    pop(30.0 + i * 0.12, 0.38, 700 + 140 * i, 0.2 + 0.25 * i)
for i, t_ in enumerate([31.27, 32.0, 32.73]):
    tick(t_, 0.3, 1300 + 200 * i, -0.4 + 0.4 * i)
    add(t_, pluck(hz([72, 76, 79][i]), 0.8, 4.5), 0.2, -0.4 + 0.4 * i, 0.5)
add(33.2, band_noise(0.6, 800, 4000, 0.6, bump(0.5)), 0.2, 0, 0.3)
glass(33.85, 0.3, 2093, 5, 0.06, 0.3)

# ---------------------------------------------------------------- reverb (IR sintética, estéreo)
irl = int(1.6 * SR)
ti = np.arange(irl) / SR
ir = rng.standard_normal((irl, 2)) * np.exp(-ti * 3.8)[:, None]
for c in range(2):  # suaviza agudos de la cola
    ir[:, c] = np.convolve(ir[:, c], np.ones(6) / 6, mode="same")
ir /= np.sqrt(np.sum(ir ** 2, axis=0))
nfft = 1 << int(np.ceil(np.log2(N + irl)))
rev = np.stack([np.fft.irfft(np.fft.rfft(wet[:, c], nfft) * np.fft.rfft(ir[:, c], nfft), nfft)[:N] for c in range(2)], 1)
buf = dry + 0.55 * rev

# filtro paso alto suave (~90 Hz) para no competir con la voz en graves
a1 = np.exp(-2 * np.pi * 90 / SR)
hp = np.zeros_like(buf)
for c in range(2):
    x = buf[:, c]
    y = np.empty_like(x)
    prev_x = prev_y = 0.0
    for i in range(len(x)):
        prev_y = a1 * (prev_y + x[i] - prev_x)
        prev_x = x[i]
        y[i] = prev_y
    hp[:, c] = y
buf = hp

# ---------------------------------------------------------------- ducking con la voz
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
a = np.exp(-1 / (0.03 * SR))
r = np.exp(-1 / (0.35 * SR))
env = np.zeros(N)
e = 0.0
for i in range(N):
    x = env_t[i]
    e = a * e + (1 - a) * x if x > e else r * e + (1 - r) * x
    env[i] = e
sfx = buf * (1 - 0.8 * env)[:, None]

spoken = env > 0.6
vo_rms = np.sqrt(np.mean(vo[spoken] ** 2))
sfx *= (vo_rms * 10 ** (-14 / 20)) / (np.sqrt(np.mean(sfx[spoken] ** 2)) + 1e-12)
cap = 10 ** (-7 / 20)
peak = np.max(np.abs(sfx))
if peak > cap:  # limitador suave: comprime sólo los picos por encima del techo
    k = np.maximum(np.abs(sfx) / cap, 1.0)
    g = 1 / np.maximum.reduce([k[:, 0], k[:, 1]])
    g = np.convolve(g, np.ones(441) / 441, mode="same")
    sfx *= np.minimum(g, 1)[:, None]
    sfx *= cap / max(np.max(np.abs(sfx)), cap)
pcm = (np.clip(sfx, -1, 1) * 32767).astype(np.int16)
with wave.open("assets/audio/sfx.wav", "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print("sfx ok  pico=%.1f dBFS  efectos vs voz en habla=%.1f dB" % (20 * np.log10(np.max(np.abs(sfx))), 20 * np.log10(np.sqrt(np.mean(sfx[spoken] ** 2)) / vo_rms)))
