"""Compara el inicio de cada palabra re-transcrita del render con el de su subtítulo.
Uso: python3 scripts/sync_check.py src/data/edit.json analisis/render-palabras.json
"""
import json, sys, difflib, unicodedata, statistics as st
norm = lambda s: "".join(c for c in unicodedata.normalize("NFD", s.lower()) if c.isalnum() and not unicodedata.combining(c))
sub = [(i, norm(w["text"]), w["startMs"]) for i, w in enumerate(json.load(open(sys.argv[1]))["words"]) if norm(w["text"])]
ren = [(norm(w["text"]), w["startMs"]) for w in json.load(open(sys.argv[2])) if norm(w["text"])]
sm = difflib.SequenceMatcher(None, [s[1] for s in sub], [r[0] for r in ren], autojunk=False)
d = []
for a, b, n in sm.get_matching_blocks():
    for k in range(n):
        d.append((sub[a + k][0], sub[a + k][1], ren[b + k][1] - sub[a + k][2]))
print(f"{len(d)}/{len(sub)} palabras emparejadas")
for i, t, x in d: print(f"{i:3d} {t:14s} {x:+5d} ms")
ab = [abs(x) for *_, x in d]
print(f"desfase medio con signo {st.mean(x for *_, x in d):+.0f} ms | medio absoluto {st.mean(ab):.0f} ms | mediana abs {st.median(ab):.0f} | máx {max(ab)}")
