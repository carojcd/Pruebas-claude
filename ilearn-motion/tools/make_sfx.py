"""Diseño sonoro sintetizado v2 (numpy, semilla fija), sincronizado con index.html.
Capas: base musical suave (pad + arpegio + hat), efectos de transición, tipografía, interfaz y logo.
Mezcla: reverb en envío, ducking con la voz (ataque 30 ms, soltado 0.35 s), efectos ≈ -14 dB bajo la voz
en los tramos hablados y techo de pico -7 dBFS.  Salida: assets/audio/sfx.wav
"""
import wave
import numpy as np

SR = 44100
DUR = 28.0
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
while t < 21.3:
    name = PROG[bar % 4]
    pad_chord(t, CH[name], 4 * BEAT + 0.5, 0.16)
    if t >= 3.0:
        tones = CH[name][1:] + [CH[name][1] + 12, CH[name][2] + 12]
        for k in range(8):
            tk = t + k * BEAT / 2
            if tk >= 21.3:
                break
            m = tones[(k * 3) % len(tones)] + 12
            add(tk, pluck(hz(m), 0.5, 6.5), 0.11 if k % 2 == 0 else 0.07, 0.35 * np.sin(k * 1.3), 0.45)
    if t >= 5.0:
        for k in range(4):
            add(t + k * BEAT + BEAT / 2, band_noise(0.06, 9000, 7000, 0.5, lambda u: np.exp(-u * 5)), 0.05, 0.3, 0.1)
    t += 4 * BEAT
    bar += 1
pad_chord(22.0, [43, 50, 55, 62], 1.6, 0.12)            # suspensión antes del logo
pad_chord(24.45, [36, 48, 55, 64, 67], 3.5, 0.2)          # acorde final en el logo

# ---------------------------------------------------------------- eventos (mismos tiempos que index.html)
letters(0.72, 7, 0.055, 0.2, 0, 76)                       # Imagina
whoosh(0.6, 1.0, 250, 1800, 0.35, -0.2, 0.2, 0.7)
whoosh(3.0, 0.45, 400, 3200, 0.55, -0.8, 0.8)              # streak
glass(3.15, 0.4, 1046, 6, 0.07)                            # lazo infinito
add(3.15, band_noise(1.1, 500, 2600, 0.8, bump(0.5)), 0.35, 0, 0.4)
whoosh(3.3, 0.4, 600, 2200, 0.2, 0.6, -0.2)
whoosh(4.88, 0.5, 2500, 300, 0.5, 0, 0)                    # salida del lazo
whoosh(4.95, 0.9, 250, 2600, 0.45, 0, 0, 0.8); thump(5.6, 0.35)   # pill
letters(5.1, 10, 0.04, 0.16, 0, 74)                        # TRIMESTRAL
for i in range(3):
    pop(5.55 + i * 0.25, 0.35, 650 + 110 * i, 0.3 * (i - 1))
whoosh(6.25, 0.45, 600, 3500, 0.55, 0.2, 0.2); whoosh(6.3, 0.45, 400, 3000, 0.45, 0.8, -0.8)
whoosh(6.3, 0.8, 300, 2400, 0.4, 0.8, 0.3, 0.75); thump(6.95, 0.3)  # diplomados
letters(6.45, 10, 0.035, 0.15, -0.5, 79)
pop(6.85, 0.3, 720, 0.4)
whoosh(7.45, 0.45, 500, 3200, 0.55, 0.5, -0.9); whoosh(7.5, 0.45, 400, 3000, 0.4, 0.8, -0.8)
whoosh(7.5, 0.8, 300, 2400, 0.4, -0.8, -0.3, 0.75); thump(8.1, 0.3)  # lista
letters(7.55, 6, 0.045, 0.15, 0.5, 76); letters(7.75, 14, 0.025, 0.1, 0.5, 72)
for i in range(4):
    pop(7.75 + i * 0.1, 0.18, 820 + 90 * i, -0.4)
whoosh(8.6, 0.45, 3000, 400, 0.45, -0.4, -0.4)
whoosh(8.62, 1.0, 250, 2800, 0.45, 0.4, 0.2, 0.75); thump(9.3, 0.35)  # dashboard
whoosh(8.85, 0.8, 300, 2600, 0.3, -0.6, -0.2, 0.7)
letters(8.7, 6, 0.04, 0.15, -0.5, 74); letters(8.9, 6, 0.04, 0.15, -0.5, 79)
glass(9.0, 0.3, 1397, 4, 0.08, 0.3)
pop(9.3, 0.4, 560, -0.3)
for i in range(3):
    pop(10.05 + i * 0.25, 0.32, 600 + 90 * i, 0.5)
whoosh(10.92, 0.5, 500, 3500, 0.6, -0.3, 0.9); whoosh(11.0, 0.45, 400, 3200, 0.45, -0.8, 0.8)
pop(11.1, 0.45, 520)                                       # actualización
for i in range(13):
    for j in range(3):
        tick(11.35 + i * 0.035 + j * 0.08, 0.12, 2600 + 150 * j, -0.6 + i * 0.09)
add(11.4, band_noise(1.6, 900, 1500, 0.4, bump(0.4)), 0.18, 0, 0.2)
glass(12.2, 0.35, 1175, 5, 0.06)
whoosh(13.15, 0.45, 3200, 500, 0.5, 0, 0)
whoosh(13.45, 0.8, 300, 2500, 0.4, 0.8, 0, 0.75); thump(14.1, 0.3)  # plataforma
whoosh(13.65, 0.8, 250, 2400, 0.35, 0.2, 0.6, 0.75); thump(14.4, 0.25)
letters(13.7, 17, 0.03, 0.1, 0, 74)
for i in range(3):
    tick(14.2 + i * 0.08, 0.2, 1900, 0.5)
whoosh(15.3, 0.45, 500, 3500, 0.6, 0.6, -0.9); whoosh(15.32, 0.45, 400, 3200, 0.45, 0.8, -0.8)
whoosh(15.4, 0.9, 250, 2800, 0.45, 0.2, 0.3, 0.75); thump(16.05, 0.3)  # a tu ritmo
letters(15.55, 5, 0.06, 0.2, -0.5, 72)
for i in range(10):
    tick(15.8 + i * 0.1, 0.13 + 0.01 * i, 1500 + 70 * i, 0.4)
for i in range(5):
    add(16.2 + i * 0.07, pluck(hz(76 + [0, 2, 4, 7, 9][i]), 0.4, 8), 0.1, -0.5 + 0.2 * i, 0.4)
whoosh(16.9, 0.45, 600, 3600, 0.5, 0.3, 0.3)
whoosh(17.0, 0.8, 300, 2600, 0.4, -0.8, -0.3, 0.75); thump(17.7, 0.3)  # vanguardia
whoosh(17.2, 0.8, 250, 2000, 0.3, -0.3, -0.1, 0.75)
letters(17.7, 10, 0.035, 0.15, 0.5, 77)
add(17.3, band_noise(1.1, 800, 4000, 0.6, bump(0.6)), 0.15, -0.4, 0.3)
for i in range(3):
    pop(17.6 + i * 0.25, 0.28, 700 + 120 * i, -0.5)
glass(18.05, 0.3, 1568, 4, 0.06, 0.5)
whoosh(18.65, 0.45, 500, 3400, 0.5, 0, -0.9)
riser(18.4, 0.75, 0.3)
# reunión de capas
for i in range(8):
    whoosh(19.1 + i * 0.06, 0.6, 3000, 600, 0.13, (-1) ** i * 0.8, 0, 0.3)
    thump(19.75 + i * 0.06, 0.12)
add(20.15, band_noise(1.4, 200, 1200, 0.9, bump(0.15, 1, 2)), 0.35, 0, 0.5)   # pulso de luz
thump(20.15, 0.45)
glass(20.15, 0.4, 1046, 7, 0.07)
letters(20.55, 11, 0.04, 0.16, 0, 79)
glass(20.0, 0.2, 1397, 4, 0.12, -0.4)
whoosh(21.38, 0.75, 2800, 250, 0.6, 0, 0, 0.3)            # la escena se aleja
riser(21.45, 0.6, 0.15, 500, 2500)
# “y tú” + micro-acción
thump(22.12, 0.45); bell(22.12, 0.35, 1046.5)
letters(22.0, 1, 0.04, 0.2, -0.3, 72); letters(22.12, 2, 0.06, 0.22, -0.1, 79)
pop(22.3, 0.45, 520, 0.5)
for t_ in (22.75, 22.93):
    tick(t_, 0.3, 1700, 0.5); tick(t_ + 0.01, 0.15, 3400, 0.5)
bell(22.95, 0.45)
riser(22.6, 0.6, 0.25, 400, 5000)
whoosh(23.12, 0.45, 600, 5000, 0.6, 0.2, 1.0)              # la flecha avanza
# logo letra por letra + arcos + brillo
for i, t_ in enumerate([23.6, 23.76, 23.92, 24.08]):
    tick(t_, 0.35, 1200 + 160 * i, -0.4 + 0.25 * i)
    add(t_, pluck(hz([67, 72, 76, 79][i]), 0.8, 4.5), 0.22, -0.4 + 0.25 * i, 0.5)
add(24.25, band_noise(0.95, 500, 4200, 0.7, bump(0.5, 1.3, 1.3)), 0.35, 0, 0.4)
glass(24.25, 0.4, 1175, 6, 0.1)
thump(24.45, 0.3)
glass(25.35, 0.3, 2093, 5, 0.06, 0.3)

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
