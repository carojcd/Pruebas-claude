"""Borrador automático de bloques de subtítulo (2–4 palabras, 1–2 líneas), palabra clave y emoji.
Uso: python3 scripts/auto_blocks.py src/data/edit.json clips/<n>/blocks.json
Heurística: corta en puntuación o a 4 palabras; clave = palabra más larga no vacía; emoji por diccionario
(máx. 1 de cada 3 bloques, nunca seguidos). Después se REVISA a mano (emojis, claves, errores de Whisper).
"""
import json, re, sys, unicodedata
STOP = set("de la el los las un una unos unas y o u e a al del en con por para que se su sus lo le les me mi mis tu tus nos es son fue era ha han he hay muy mas pero como si no ni sin sobre entre desde hasta cuando donde este esta esto estos estas ese esa eso esos esas ya".split())
norm = lambda s: "".join(c for c in unicodedata.normalize("NFD", s.lower()) if c.isalpha() and not unicodedata.combining(c))
EMOJI = {  # raíz → emoji (se amplía con cada clip)
 "sol": "☀️", "luna": "🌙", "estrella": "⭐", "mar": "🌊", "oceano": "🌊", "agua": "💧", "rio": "🌊", "nilo": "🌊", "fuego": "🔥",
 "oro": "🥇", "dinero": "💰", "tesoro": "💎", "corona": "👑", "reina": "👑", "rey": "👑", "faraon": "👑", "poder": "⚡",
 "amor": "❤️", "corazon": "❤️", "guerra": "⚔️", "paz": "🕊️", "muerte": "💀", "vida": "🌱", "tiempo": "⏳", "idea": "💡",
 "mente": "🧠", "cerebro": "🧠", "mundo": "🌍", "tierra": "🌍", "arbol": "🌳", "selva": "🌿", "piramide": "🔺", "desierto": "🏜️",
 "camino": "🛤️", "viaje": "🧭", "libro": "📖", "ley": "⚖️", "justicia": "⚖️", "verdad": "✅", "secreto": "🤫", "miedo": "😨",
 "exito": "🏆", "futuro": "🔮", "magia": "✨", "milagro": "✨", "dios": "🙏", "cielo": "☁️", "noche": "🌙", "dia": "🌅",
}
e = json.load(open(sys.argv[1])); W = e["words"]
idx = [i for i, w in enumerate(W) if W[i]["text"].strip()]
chunks, cur = [], []
for i in idx:
    cur.append(i)
    t = W[i]["text"].strip()
    if re.search(r"[.,;:?!…]$", t) or len(cur) == 4:
        chunks.append(cur); cur = []
if cur: chunks.append(cur)
# fusionar bloques de 1 palabra con el vecino si caben en 4
out = []
for c in chunks:
    if len(c) == 1 and out and len(out[-1]) < 4 and not re.search(r"[.?!]$", W[out[-1][-1]]["text"].strip()): out[-1] += c
    else: out.append(c)
if len(out) > 1 and len(out[0]) == 1: out[1] = out[0] + out[1]; out.pop(0)
blocks, last_emoji = [], -9
for b, c in enumerate(out):
    words = [W[i]["text"].strip() for i in c]
    cand = [i for i in c if norm(W[i]["text"]) not in STOP] or c
    key = max(cand, key=lambda i: len(norm(W[i]["text"])))
    chars = sum(len(w) for w in words) + len(words) - 1
    if chars > 15 and len(c) >= 2:  # 2 líneas; la clave queda sola o al final de su línea
        k = c.index(key); cut = max(1, min(len(c) - 1, k if k > 0 else 1)) if len(c) > 2 else 1
        lines = [c[:cut], c[cut:]]
    else: lines = [c]
    blk = {"lines": lines, "key": key}
    if len(blocks) - last_emoji >= 2:
        for i in c:
            em = EMOJI.get(norm(W[i]["text"]))
            if em: blk["emoji"] = em; blk["key"] = i; last_emoji = len(blocks); break
    blocks.append(blk)
second_last = blocks[-2]["lines"][0][0] if len(blocks) > 1 else blocks[-1]["lines"][0][0]
json.dump({"punchWord": second_last, "blocks": blocks}, open(sys.argv[2], "w"), ensure_ascii=False, indent=1)
print(f"{len(blocks)} bloques, {sum('emoji' in b for b in blocks)} emojis, punchWord {second_last} → {sys.argv[2]}")
