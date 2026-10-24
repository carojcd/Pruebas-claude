"""Detecta núcleos silábicos en la voz (picos de energía en la banda del habla) y alinea las sílabas del guion con ellos.
Uso: python3 syllables.py <voz.wav 16k mono> <salida.json>"""
import sys, json, wave, re, numpy as np
w = wave.open(sys.argv[1]); x = np.frombuffer(w.readframes(w.getnframes()), '<i2').astype(float) / 32768; SR = 16000
x = x - 0.97 * np.concatenate([[0], x[:-1]])                       # preénfasis
hop = 80                                                           # 5 ms
e = np.sqrt((x[:len(x) // hop * hop].reshape(-1, hop) ** 2).mean(1)) + 1e-9
k = np.hanning(9); k /= k.sum(); s = np.convolve(e, k, 'same'); db = 20 * np.log10(s)
base = np.percentile(db, 8); top = np.percentile(db, 95)
act = db > base + (top - base) * 0.25
pk = []
for i in range(3, len(db) - 3):
    if act[i] and db[i] == db[i - 3:i + 4].max() and db[i] - db[max(0, i - 14):i + 15].min() > 2.2: pk.append(i)
# separa picos muy cercanos (<70 ms): conserva el mayor
m = []
for i in pk:
    if m and (i - m[-1]) * 0.005 < 0.07: m[-1] = i if db[i] > db[m[-1]] else m[-1]
    else: m.append(i)
pass

# ---------- alineación sílabas del guion <-> picos (programación dinámica monótona)
SCRIPT = [  # (palabras del guion, zonas de voz activas)
    ("¡Así vivimos Halloween con Don Vitto en Santa Marta!", [(0.05, 3.17)]),
    ("Aprovechamos octubre para compartir con ustedes, mostrando cómo nuestros productos son perfectos para tus pasabocas. Disfrutamos con frescura y mucha alegría para todas las familias que nos visitaron.",
     [(3.40, 4.11), (4.20, 6.42), (6.51, 8.15), (8.25, 10.41), (10.50, 11.80), (11.92, 13.79)]),
    ("¡En Don Vitto seguimos creciendo para estar más cerca de ti!", [(13.95, 17.32)]),
]
def syl(w):
    v, strong, n, prev = 'aeiouáéíóúü', 'aeoáéó', 0, ''
    for ch in re.sub(r'[^a-záéíóúüñ]', '', w.lower()):
        if ch in v:
            if not prev or (prev in strong and ch in strong) or ch in 'íú' or prev in 'íú': n += 1
            prev = ch
        else: prev = ''
    return max(1, n)
peaks = np.array([i * 0.005 for i in m])
out = []
for text, zones in SCRIPT:
    words = text.split(); sy = [syl(wd) for wd in words]; flat = [wi for wi, c in enumerate(sy) for _ in range(c)]; N = len(flat)
    P = peaks[[any(a - .05 <= t <= b + .08 for a, b in zones) for t in peaks]]; M = len(P)
    act = sum(b - a for a, b in zones)
    def at(fr):
        t = fr * act
        for a, b in zones:
            if t <= b - a: return a + t
            t -= b - a
        return zones[-1][1]
    exp = np.array([at((i + .5) / N) for i in range(N)])
    INF = 1e18; dp = np.full((N + 1, M + 1), INF); bk = np.zeros((N + 1, M + 1), int); dp[0, :] = 0
    for i in range(1, N + 1):
        for j in range(i, M + 1):
            c = ((P[j - 1] - exp[i - 1]) / 0.30) ** 2
            best, arg = INF, 0
            for jp in range(i - 1, j):
                v = dp[i - 1, jp] + 0.35 * (j - jp - 1) + (4.0 if jp > 0 and P[j - 1] - P[jp - 1] < 0.11 else 0)
                if v < best: best, arg = v, jp
            dp[i, j] = best + c; bk[i, j] = arg
    j = int(np.argmin(dp[N, N:])) + N; idx = []
    for i in range(N, 0, -1): idx.append(j); j = bk[i, j]
    idx = idx[::-1]; st = [P[k - 1] for k in idx]
    first = {}; 
    for si, wi in enumerate(flat): first.setdefault(wi, st[si])
    last = {wi: st[si] for si, wi in enumerate(flat)}
    res = []
    for wi, wd in enumerate(words):
        s0 = first[wi] - 0.07; e0 = (first[wi + 1] - 0.07) if wi + 1 < len(words) else last[wi] + 0.28
        res.append({'text': wd, 'start': round(float(s0), 3), 'end': round(float(e0), 3)})
    out.append(res)
json.dump(out, open(sys.argv[2], 'w'), ensure_ascii=False, indent=1)
print('palabras', sum(len(g) for g in out), file=sys.stderr)
