"""Alinea las palabras de un guion con la voz: detecta núcleos silábicos (picos de energía) y los casa con las sílabas del texto
mediante programación dinámica monótona.  Uso: python3 align_words.py <voz.wav 16k mono> <config.json> <salida.json>
config.json = [{"text": "...", "zones": [[ini, fin], ...], "syl": {"1.000": 1}}, ...]   (zonas = tramos de voz activa en segundos)"""
import sys, json, wave, re, numpy as np
w = wave.open(sys.argv[1]); x = np.frombuffer(w.readframes(w.getnframes()), '<i2').astype(float) / 32768
x = x - 0.97 * np.concatenate([[0], x[:-1]]); hop = 80
e = np.sqrt((x[:len(x) // hop * hop].reshape(-1, hop) ** 2).mean(1)) + 1e-9
s = np.convolve(e, np.hanning(9) / np.hanning(9).sum(), 'same'); db = 20 * np.log10(s)
base, top = np.percentile(db, 8), np.percentile(db, 95); act = db > base + (top - base) * 0.25
pk = [i for i in range(3, len(db) - 3) if act[i] and db[i] == db[i - 3:i + 4].max() and db[i] - db[max(0, i - 14):i + 15].min() > 2.2]
m = []
for i in pk:
    if m and (i - m[-1]) * 0.005 < 0.07: m[-1] = i if db[i] > db[m[-1]] else m[-1]
    else: m.append(i)
peaks = np.array([i * 0.005 for i in m])
def syl(wd, ov):
    if wd in ov: return ov[wd]
    v, strong, n, prev = 'aeiouáéíóúü', 'aeoáéó', 0, ''
    for ch in re.sub(r'[^a-záéíóúüñ]', '', wd.lower()):
        if ch in v:
            if not prev or (prev in strong and ch in strong) or ch in 'íú' or prev in 'íú': n += 1
            prev = ch
        else: prev = ''
    return max(1, n)
out = []
for g in json.load(open(sys.argv[2])):
    words = g['text'].split(); sy = [syl(wd, g.get('syl', {})) for wd in words]; flat = [wi for wi, c in enumerate(sy) for _ in range(c)]; N = len(flat); zones = g['zones']
    P = peaks[[any(a - .05 <= t <= b + .08 for a, b in zones) for t in peaks]]; M = len(P); act_t = sum(b - a for a, b in zones)
    def at(fr):
        t = fr * act_t
        for a, b in zones:
            if t <= b - a: return a + t
            t -= b - a
        return zones[-1][1]
    exp = np.array([at((i + .5) / N) for i in range(N)]); INF = 1e18
    dp = np.full((N + 1, M + 1), INF); bk = np.zeros((N + 1, M + 1), int); dp[0, :] = 0
    for i in range(1, N + 1):
        for j in range(i, M + 1):
            best, arg = INF, 0
            for jp in range(i - 1, j):
                v = dp[i - 1, jp] + 0.35 * (j - jp - 1) + (4.0 if jp > 0 and P[j - 1] - P[jp - 1] < 0.11 else 0)
                if v < best: best, arg = v, jp
            dp[i, j] = best + ((P[j - 1] - exp[i - 1]) / 0.30) ** 2; bk[i, j] = arg
    j = int(np.argmin(dp[N, N:])) + N; idx = []
    for i in range(N, 0, -1): idx.append(j); j = bk[i, j]
    st = [P[k - 1] for k in idx[::-1]]; first, last = {}, {}
    for si, wi in enumerate(flat): first.setdefault(wi, st[si]); last[wi] = st[si]
    out.append([{'text': wd, 'start': round(float(first[wi] - 0.07), 3), 'end': round(float((first[wi + 1] - 0.07) if wi + 1 < len(words) else last[wi] + 0.28), 3)} for wi, wd in enumerate(words)])
json.dump(out, open(sys.argv[3], 'w'), ensure_ascii=False, indent=1)
