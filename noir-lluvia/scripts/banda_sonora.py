"""Banda sonora sintetizada por código y sincronizada con src/timeline.json.

Lluvia por plano, pasos mojados, chapoteo, zumbido de neón, destello, trueno y un dron grave.
Uso: python3 scripts/banda_sonora.py src/timeline.json public/banda-sonora.wav
"""
import json
import sys
import wave

import numpy as np
from scipy.signal import butter, sosfilt

SR = 48000
tl = json.load(open(sys.argv[1]))
FPS = tl["fps"]
N = int(tl["duration"] / FPS * SR)
rng = np.random.default_rng(11)
t = np.arange(N) / SR
out = np.zeros((2, N))


def filt(x, kind, f):
    return sosfilt(butter(4, f, kind, fs=SR, output="sos"), x)


def at(frame):
    return int(frame / FPS * SR)


def add(sig, frame, gain=1.0, pan=0.0):
    i = at(frame)
    sig = np.atleast_2d(sig)
    if sig.shape[0] == 1:
        sig = np.vstack([sig * (1 - max(0, pan)), sig * (1 + min(0, pan))])
    n = min(sig.shape[1], N - i)
    if n > 0:
        out[:, i:i + n] += sig[:, :n] * gain


def env(n, attack, decay):
    e = np.exp(-np.arange(n) / (decay * SR))
    a = int(attack * SR)
    if a > 0:
        e[:a] *= np.linspace(0, 1, a)
    return e


# 1) Lluvia: ruido filtrado estéreo, intensidad por plano (E: amortiguada bajo el sombrero)
shot_gain = {"A": 0.8, "B": 1.0, "C": 1.25, "D": 0.9, "E": 0.55, "F": 1.15}
gain_curve = np.zeros(N)
lp_mix = np.zeros(N)
for s in tl["shots"]:
    gain_curve[at(s["from"]):at(s["to"])] = shot_gain[s["id"]]
    if s["id"] == "E":
        lp_mix[at(s["from"]):at(s["to"])] = 1
k = int(0.03 * SR)
gain_curve = np.convolve(gain_curve, np.ones(k) / k, mode="same")
lp_mix = np.convolve(lp_mix, np.ones(k) / k, mode="same")
for ch in range(2):
    n = rng.standard_normal(N)
    hiss = filt(filt(n, "highpass", 900), "lowpass", 9000)
    body = filt(filt(rng.standard_normal(N), "highpass", 150), "lowpass", 1500)
    muffled = filt(hiss + body, "lowpass", 700)
    rain = (hiss * 0.6 + body * 0.5) * (1 - lp_mix) + muffled * 1.4 * lp_mix
    # gotas sueltas
    ticks = np.zeros(N)
    idx = rng.integers(0, N, 900)
    ticks[idx] = rng.uniform(0.3, 1, 900)
    ticks = filt(ticks, "bandpass", [2500, 7000])
    out[ch] += (rain * 0.09 + ticks * 0.5) * gain_curve


# 2) Pasos mojados
def step(v):
    n = int(0.35 * SR)
    tt = np.arange(n) / SR
    thump = np.sin(2 * np.pi * (85 * tt - 40 * tt ** 2)) * env(n, 0.002, 0.05)
    splash = filt(rng.standard_normal(n), "bandpass", [700, 5000]) * env(n, 0.004, 0.09)
    return (thump * 0.8 + splash * 0.5) * v


for i, s in enumerate(tl["steps"]):
    add(step(s["v"]), s["f"], 0.9, pan=0.15 if i % 2 else -0.15)

# 3) Chapoteo del zapato (golpe + lámina de agua + gotas que caen después)
n = int(1.2 * SR)
tt = np.arange(n) / SR
thump = np.sin(2 * np.pi * (70 * tt - 30 * tt ** 2)) * env(n, 0.001, 0.08)
sheet = filt(rng.standard_normal(n), "bandpass", [400, 6000]) * env(n, 0.006, 0.22)
drops = np.zeros(n)
di = rng.integers(int(0.15 * SR), n, 70)
drops[di] = rng.uniform(0.2, 0.8, 70)
drops = filt(drops, "bandpass", [1800, 6000]) * 2.5
add(thump * 1.1 + sheet * 0.9 + drops, tl["splash"] - 0.5, 1.0)
# whoosh previo (el pie cae)
n = int(0.22 * SR)
w = filt(rng.standard_normal(n), "bandpass", [300, 2500]) * np.sin(np.linspace(0, np.pi, n)) ** 2
add(w * 0.25, tl["splash"] - 7)

# 4) Zumbido del neón (plano D) con chasquidos
a, b = tl["neonBuzz"]
n = at(b) - at(a)
tt = np.arange(n) / SR
hum = sum(np.sin(2 * np.pi * 120 * h * tt) / h for h in (1, 2, 3, 5)) * 0.05
hum *= np.minimum(1, np.minimum(tt / 0.05, (tt[-1] - tt) / 0.05))
for c in (0.18, 0.52):
    ci = int(c * SR)
    L = int(0.03 * SR)
    hum[ci:ci + L] += rng.standard_normal(L) * 0.12 * np.exp(-np.arange(L) / (0.006 * SR))
add(hum, a, 1.0, pan=0.35)

# 5) Destello del ojo: campanilla aguda breve
n = int(0.9 * SR)
tt = np.arange(n) / SR
chime = (np.sin(2 * np.pi * 2350 * tt) + 0.6 * np.sin(2 * np.pi * 3520 * tt) + 0.3 * np.sin(2 * np.pi * 4700 * tt)) * env(n, 0.01, 0.25)
add(chime * 0.05, tl["glint"] - 2)

# 6) Trueno: chasquido + retumbo largo
for i, c in enumerate(tl["lightning"]):
    n = int(0.25 * SR)
    crack = filt(rng.standard_normal(n), "highpass", 1200) * env(n, 0.0005, 0.035)
    add(crack * (0.9 if i == 0 else 0.5), c)
n = at(tl["duration"]) - at(tl["lightning"][0]) + SR
tt = np.arange(n) / SR
rumble = filt(rng.standard_normal(n), "lowpass", 160)
roll = 0.6 + 0.4 * np.sin(2 * np.pi * 2.3 * tt) * np.sin(2 * np.pi * 0.9 * tt)
rumble *= env(n, 0.04, 0.9) * roll
add(np.vstack([rumble, filt(rumble, "lowpass", 120)]) * 3.0, tl["lightning"][0])

# 7) Dron grave (Re menor) que crece hacia el relámpago, con latido
tt = t
drone = (np.sin(2 * np.pi * 73.4 * tt) + 0.6 * np.sin(2 * np.pi * 110.0 * tt * 1.002) + 0.35 * np.sin(2 * np.pi * 146.8 * tt * 0.998))
swell = np.clip(tt / (tl["lightning"][0] / FPS), 0, 1) ** 1.5 * 0.7 + 0.3
pulse = 1 + 0.35 * np.maximum(0, np.sin(2 * np.pi * 1.1 * tt)) ** 8
out += filt(drone, "lowpass", 400) * 0.05 * swell * pulse

# master: fade de salida, normalización con margen
fade = int(0.25 * SR)
out[:, -fade:] *= np.linspace(1, 0, fade)
out[:, :int(0.02 * SR)] *= np.linspace(0, 1, int(0.02 * SR))
out *= 0.89 / np.abs(out).max()
pcm = (np.clip(out.T, -1, 1) * 32767).astype("<i2")
with wave.open(sys.argv[2], "wb") as wf:
    wf.setnchannels(2)
    wf.setsampwidth(2)
    wf.setframerate(SR)
    wf.writeframes(pcm.tobytes())
print("Banda sonora:", sys.argv[2], f"{N / SR:.2f} s")
