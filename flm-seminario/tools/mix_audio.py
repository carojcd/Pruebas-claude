"""Mezcla de audio del anuncio (numpy, determinista).

Entradas : assets/audio/vo.wav (voz normalizada a -16 LUFS), assets/audio/music_raw.mp3 (canción del cliente)
Salidas  : assets/audio/music_bed.wav  (canción ecualizada + ducking con la voz + fades)
           assets/audio/sfx.wav        (efectos muy discretos, también con ducking)

Reglas:
  - música ~20 dB por debajo de la voz mientras habla; sube ligeramente (~14 dB por debajo) en las pausas
  - efectos ~26 dB por debajo de la voz en los tramos hablados, techo de pico -12 dBFS
  - fade-in musical 1.5 s y fade-out limpio de 3 s al final
"""
import json
import subprocess
import wave
import numpy as np

SR = 48000
DUR = 42.0
VO_START = 0.25
N = int(SR * DUR)
rng = np.random.default_rng(11)


def read_wav(path):
    with wave.open(path) as w:
        x = np.frombuffer(w.readframes(w.getnframes()), np.int16).reshape(-1, w.getnchannels()).astype(np.float64) / 32768
    return x


def write_wav(path, x):
    pcm = (np.clip(x, -1, 1) * 32767).astype(np.int16)
    with wave.open(path, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(pcm.tobytes())


def rms(x):
    return np.sqrt(np.mean(x ** 2) + 1e-12)


# ---------------------------------------------------------------- voz y su envolvente
vo_full = read_wav("assets/audio/vo.wav").mean(axis=1)
vo = np.zeros(N)
s = int(VO_START * SR)
vo[s : s + len(vo_full)] = vo_full[: N - s]
win = int(0.02 * SR)
env_raw = np.sqrt(np.convolve(vo ** 2, np.ones(win) / win, mode="same"))
speech_rms = rms(vo[np.abs(vo) > 0.01])
env_t = np.clip((env_raw - 10 ** (-45 / 20)) / (0.35 * speech_rms), 0, 1)
a, r = np.exp(-1 / (0.03 * SR)), np.exp(-1 / (0.45 * SR))   # ataque 30 ms, soltado 0.45 s
env = np.zeros(N)
e = 0.0
for i in range(N):
    x = env_t[i]
    e = a * e + (1 - a) * x if x > e else r * e + (1 - r) * x
    env[i] = e
spoken = env > 0.6
vo_rms = rms(vo[spoken])

# ---------------------------------------------------------------- canción: EQ que deja hueco a la voz
eq = ("highpass=f=90,equalizer=f=250:width_type=o:width=1.2:g=-2,"
      "equalizer=f=1200:width_type=o:width=1.4:g=-4,equalizer=f=3000:width_type=o:width=1.6:g=-6,"
      "lowpass=f=12000")
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", "assets/audio/music_raw.mp3", "-t", str(DUR), "-af", eq,
                      "-ar", str(SR), "-ac", "2", "-f", "s16le", "-"], capture_output=True, check=True).stdout
mus = np.frombuffer(raw, np.int16).reshape(-1, 2).astype(np.float64) / 32768
mus = np.pad(mus, ((0, max(0, N - len(mus))), (0, 0)))[:N]

# ganancia por ducking: -20 dB bajo la voz al hablar, -14 dB en pausas
mus_rms_spoken = rms(mus[spoken])
mus_rms_pause = rms(mus[~spoken & (np.arange(N) > SR * 1.5)])
g_speech = vo_rms * 10 ** (-20 / 20) / mus_rms_spoken
g_pause = vo_rms * 10 ** (-14 / 20) / mus_rms_pause
gain = g_pause + (g_speech - g_pause) * env
t = np.arange(N) / SR
fade = np.minimum(t / 1.5, 1) * np.clip((DUR - t) / 3.0, 0, 1)
bed = mus * (gain * fade)[:, None]

# ---------------------------------------------------------------- efectos discretos
sfx = np.zeros((N, 2))


TM = json.load(open("tools/timemap.json"))


def mapt(t):
    """traslada las marcas de diseño a los tiempos de la voz actual"""
    for (a0, b0), (a1, b1) in zip(TM, TM[1:]):
        if t <= a1:
            return b0 + (t - a0) * (b1 - b0) / (a1 - a0)
    return t - TM[-1][0] + TM[-1][1]


def put(t0, sig, g=1.0, pan=0.0):
    i = int(mapt(t0) * SR)
    sig = sig[: N - i]
    sfx[i : i + len(sig), 0] += sig * g * np.sqrt(0.5 * (1 - pan))
    sfx[i : i + len(sig), 1] += sig * g * np.sqrt(0.5 * (1 + pan))


def tt(d):
    return np.arange(int(SR * d)) / SR


def whoosh(t0, d=0.5, f0=400, f1=2600, g=1.0, pan=0.0):
    n = int(SR * d)
    x = rng.standard_normal(n)
    sp = np.fft.rfft(x)
    f = np.fft.rfftfreq(n, 1 / SR)
    fc = np.sqrt(f0 * f1)
    sp *= np.exp(-0.5 * (np.log2(np.maximum(f, 1) / fc) / 1.1) ** 2)
    y = np.fft.irfft(sp, n)
    u = np.linspace(0, 1, n)
    y *= np.minimum(u / 0.55, 1) ** 1.6 * np.minimum((1 - u) / 0.45, 1) ** 1.4
    put(t0, y / (np.max(np.abs(y)) + 1e-9), g, pan)


def chime(t0, f=1318.5, g=1.0, pan=0.0):
    x = tt(1.2)
    y = (np.sin(2 * np.pi * f * x) + 0.4 * np.sin(2 * np.pi * 2 * f * x) * np.exp(-x * 6)) * np.exp(-x * 4)
    put(t0, y, g, pan)


def tick(t0, f=2200, g=1.0, pan=0.0):
    x = tt(0.05)
    put(t0, np.sin(2 * np.pi * f * x) * np.exp(-x * 110), g, pan)


def pop(t0, f=640, g=1.0, pan=0.0):
    x = tt(0.18)
    put(t0, np.sin(2 * np.pi * (f + 800 * np.exp(-x * 30)) * x) * np.exp(-x * 20), g, pan)


for t0, g in [(2.2, .7), (2.5, .8), (3.95, .9), (7.55, 1.0), (8.95, .7), (12.5, .8), (16.05, .9), (18.65, .8),
              (22.7, .9), (27.45, 1.0), (31.7, .7), (32.65, .9), (37.4, .9)]:
    whoosh(t0, 0.55, 350, 2800, g, 0.0)
for t0 in (19.0, 20.2, 21.3):
    pop(t0, 700, 0.8, 0.2)
for i in range(20):
    tick(14.85 + i * 0.045, 1600 + 40 * i, 0.5, 0.3)
for t0 in (25.35, 25.9, 30.35, 30.8, 31.25):
    pop(t0, 760, 0.7, -0.2)
chime(23.9, 1046.5, 0.6); chime(28.86, 1318.5, 0.7); chime(37.9, 1568, 0.6)
for t0 in (12.8, 13.95, 16.4, 38.7, 39.0):
    tick(t0, 1900, 0.7)

sfx *= (1 - 0.7 * env)[:, None]
sfx *= vo_rms * 10 ** (-26 / 20) / (rms(sfx[spoken]) + 1e-12)
pk = np.max(np.abs(sfx))
if pk > 10 ** (-12 / 20):
    sfx *= 10 ** (-12 / 20) / pk

write_wav("assets/audio/music_bed.wav", bed)
write_wav("assets/audio/sfx.wav", sfx)
db = lambda x, m: 20 * np.log10(rms(x[m]) / vo_rms)
print("música vs voz (habla): %.1f dB | (pausas): %.1f dB | pico música %.1f dBFS" % (db(bed, spoken), db(bed, ~spoken & (t > 1.5) & (t < 39.9)), 20 * np.log10(np.max(np.abs(bed)))))
print("efectos vs voz (habla): %.1f dB | pico efectos %.1f dBFS" % (db(sfx, spoken), 20 * np.log10(np.max(np.abs(sfx)) + 1e-12)))
