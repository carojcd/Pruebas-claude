"""Efectos de sonido sintetizados para 'lavado': intro, outro, whoosh de corte y 'pop' de tarjeta. Uso: python3 sfx_lavado.py <dir_salida>"""
import sys, wave, numpy as np
SR = 48000; rng = np.random.default_rng(4)
def save(name, x):
    x = np.tanh(x / max(np.abs(x).max(), 1e-9) * 1.1) * .85
    with wave.open(f'{sys.argv[1]}/{name}.wav', 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.stack([x, np.roll(x, 40)], 1) * 32767).astype('<i2').tobytes())
def lp(x, fc):
    k = np.exp(-2 * np.pi * fc / SR); y = np.empty_like(x); a = 0.0
    for i, v in enumerate(x): a = (1 - k) * v + k * a; y[i] = a
    return y
def tone(f, l, dec, bright=.3):
    n = int(l * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * f * t) + bright * np.sin(2 * np.pi * 2.01 * f * t) * np.exp(-t / (dec * .5)) + .1 * np.sin(2 * np.pi * 3.99 * f * t) * np.exp(-t / (dec * .25))) * np.minimum(t / .006, 1) * np.exp(-t / dec)
def put(buf, sig, at, g=1.0):
    i = int(at * SR); n = min(len(sig), len(buf) - i)
    if n > 0: buf[i:i + n] += sig[:n] * g
def bubble(f0, l=.12):
    n = int(l * SR); t = np.arange(n) / SR
    return np.sin(2 * np.pi * (f0 + 900 * t / l) * t) * np.exp(-t / .035) * np.minimum(t / .004, 1)
def whoosh(l, peak):
    n = int(l * SR); t = np.arange(n) / SR; nz = lp(rng.standard_normal(n), 2200) - lp(rng.standard_normal(n), 300) * .6
    return nz * np.where(t < peak, (t / peak) ** 2, np.exp(-(t - peak) / .09))
b = np.zeros(int(5.2 * SR))                                   # intro: burbujas + arpegio suave + destello del título
for at, f in [(.10, 700), (.35, 820), (.62, 650), (.9, 900), (1.2, 760), (1.55, 980), (2.0, 700), (2.6, 880)]: put(b, bubble(f), at, .3)
for i, f in enumerate([392, 493.9, 587.3, 784]): put(b, tone(f, 1.8, .6), .45 + i * .16, .22)
put(b, whoosh(.9, .5), .05, .12); put(b, tone(1046.5, 2.0, .8), 2.2, .12)
for at in (2.2, 2.4, 2.65): put(b, bubble(1100, .1), at, .2)
save('sfx_intro', b)
b = np.zeros(int(4.8 * SR))                                   # outro: acorde cálido ascendente + brillo final
put(b, whoosh(.8, .4), 0, .13)
for i, f in enumerate([261.6, 329.6, 392, 523.3]): put(b, tone(f, 3.0, 1.1), .25 + i * .2, .22)
put(b, tone(784, 2.2, .9), 1.2, .16); put(b, tone(1046.5, 2.2, .9), 1.55, .14); put(b, tone(1318.5, 2.4, 1.0), 1.9, .12)
for at in (.5, .9, 1.4, 2.1): put(b, bubble(850, .12), at, .22)
save('sfx_outro', b)
save('sfx_whoosh', np.pad(whoosh(.7, .3), (0, int(.3 * SR))))   # whoosh de corte
b = np.zeros(int(.6 * SR)); put(b, bubble(520, .14), 0, .5); put(b, tone(880, .5, .22), .06, .4); put(b, tone(1318.5, .5, .2), .14, .25); save('sfx_pop', b)
