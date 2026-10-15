"""Corrige el texto de Whisper sin tocar tiempos y SIN cambiar los índices de palabra.
Uso: python3 scripts/fix_words.py palabras.json correcciones.json salida.json
correcciones.json: {"texto": {"índice": "texto correcto"}, "fusionar": [[a, b]]}
  fusionar: la palabra b hereda el inicio de a y a queda vacía (Whisper partió una palabra en dos).
"""
import json, sys
src, fix, out = sys.argv[1:4]
w = json.load(open(src)); f = json.load(open(fix))
for k, t in f.get("texto", {}).items():
    w[int(k)]["text"] = " " + t
for a, b in f.get("fusionar", []):
    w[b]["startMs"] = w[a]["startMs"]; w[a]["text"] = " "
json.dump(w, open(out, "w"), ensure_ascii=False, indent=1)
print(len(w), "palabras →", out)
