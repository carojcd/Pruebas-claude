#!/usr/bin/env python3
"""Pauta Brilla – Seguro de Mascotas · "El perro reclama".

Genera subs.ass (subtítulo dinámico palabra a palabra) y renderiza salida/brilla_perro_9x16.mp4.
La voz va en voz/s0.wav … voz/s5.wav (las 6 frases generadas en Higgsfield, voz «Juan»).
Si no están, renderiza una vista previa solo con el audio original bajado.
Cada fragmento de voz se coloca en el segundo exacto del gesto del perro (ver CHUNKS).
"""
import os, subprocess, textwrap

HERE = os.path.dirname(os.path.abspath(__file__))
os.chdir(HERE)
W, H, DUR = 1080, 1920, 30.04
FOOT_H = round(265 * W / 1097)            # footer recortado (sin margen transparente), 261 px

# ---- Fragmentos de voz: (archivo, desde, hasta [s del audio], segundo del video donde entra) ----
# Los tiempos de palabras vienen de la transcripción con marcas de tiempo de cada audio.
CHUNKS = [
  # id   seg  in    out   video   palabras (texto, t_ini, t_fin en el audio fuente) → frases
  dict(seg=0, a=0.00, b=2.15, at=1.60, phrases=[
      [("¿AHORA", 0.00, 0.68), ("SÍ", 0.68, 0.92)],
      [("ME", 0.92, 1.04), ("VAS", 1.04, 1.20), ("A", 1.20, 1.30), ("PAGAR", 1.30, 1.54)],
      [("EL", 1.54, 1.76), ("SEGURO?", 1.76, 2.10)]]),
  dict(seg=1, a=0.00, b=3.00, at=3.40, phrases=[
      [("EL", 0.00, 0.68), ("OTRO", 0.68, 0.82), ("MES", 0.82, 1.18)],
      [("ME", 1.18, 1.36), ("DIJISTE", 1.36, 1.80), ("LO", 1.80, 2.02), ("MISMO:", 2.02, 2.80)]]),
  dict(seg=1, a=3.05, b=4.20, at=7.10, phrases=[
      [("QUE", 3.12, 3.36), ("AHORITA,", 3.36, 4.10)]]),
  dict(seg=1, a=4.15, b=5.15, at=8.30, phrases=[
      [("QUE", 4.24, 4.34), ("EN", 4.34, 4.44), ("LA", 4.44, 4.54), ("TARDE,", 4.54, 5.10)]]),
  dict(seg=1, a=6.20, b=7.65, at=9.40, phrases=[
      [("QUE", 6.20, 6.36), ("APENAS", 6.36, 6.70), ("TE", 6.70, 6.96), ("PAGUEN...", 6.96, 7.60)]]),
  dict(seg=2, a=0.00, b=1.35, at=10.90, phrases=[
      [("¡AH,", 0.00, 0.80), ("PERO...", 0.90, 1.30)]]),
  dict(seg=2, a=1.35, b=3.15, at=12.30, phrases=[
      [("¿CUÁNTO", 1.40, 1.76), ("PAGASTE", 1.76, 2.08)],
      [("EN", 2.08, 2.18), ("EL", 2.18, 2.28), ("VETERINARIO", 2.28, 2.78)],
      [("AYER?!", 2.90, 3.12)]]),
  dict(seg=2, a=3.50, b=4.40, at=14.10, phrases=[
      [("POQUITO,", 3.60, 4.04), ("¿VERDAD?", 4.06, 4.40)]]),
  # "No, no, no": cada "no" cae con el pico del dedito (≈15.05 / 15.60 / 16.15 s)
  dict(seg=3, a=0.00, b=0.75, at=15.00, phrases=[[("NO,", 0.00, 0.58)]]),
  dict(seg=3, a=0.90, b=1.45, at=15.50, phrases=[[("NO,", 1.00, 1.28)]]),
  dict(seg=3, a=1.95, b=2.70, at=16.05, phrases=[[("NO.", 2.02, 2.60)]]),
  # Enumeración: una palabra por cada gesto de las patitas
  dict(seg=4, a=0.00, b=1.12, at=19.95, phrases=[[("HOSPITALIZACIÓN,", 0.00, 1.04)]], stack=0),
  dict(seg=4, a=1.28, b=2.20, at=21.00, phrases=[[("MEDICAMENTOS,", 1.34, 2.04)]], stack=1),
  dict(seg=4, a=2.20, b=2.75, at=21.85, phrases=[[("TRASLADO...", 2.28, 2.70)]], stack=2),
  dict(seg=5, a=0.00, b=3.25, at=26.50, phrases=[
      [("¡DEJA", 0.00, 0.68), ("DE", 0.68, 0.76), ("HABLAR", 0.76, 0.96), ("TANTO", 0.96, 1.32)],
      [("Y", 1.32, 1.66), ("CÓMPRAME", 1.66, 1.88), ("EL", 1.88, 2.08), ("SEGURO", 2.08, 2.24)],
      [("DE", 2.24, 2.46), ("MASCOTAS!", 2.46, 3.18)]]),
]
SHIFT = 1.60              # la voz arranca en el segundo 0 del video
STACK_END = 23.40 - SHIFT          # la lista "Hospitalización / Medicamentos / Traslado" se queda hasta aquí
YELLOW, WHITE = "&H000EC2FF&", "&H00FFFFFF&"   # BGR de #FFC20E y blanco

for _c in CHUNKS:
    _c["at"] = round(_c["at"] - SHIFT, 3)

def ts(t):
    t = max(0.0, t)
    h, m = int(t // 3600), int(t % 3600 // 60); s = t % 60
    return f"{h}:{m:02d}:{s:05.2f}"

def line(words, active, size=None):
    parts = []
    for i, w in enumerate(words):
        col = YELLOW if i == active else WHITE
        pop = r"\fscx112\fscy112\t(0,120,\fscx100\fscy100)" if i == active else ""
        parts.append("{\\1c%s%s}%s" % (col, pop, w))
    return " ".join(parts)

def build_ass():
    ev = []
    stack_words = []                                # (texto, aparece_en)
    for c in CHUNKS:
        for ph in c["phrases"]:
            words = [w[0] for w in ph]
            starts = [c["at"] + (w[1] - c["a"]) for w in ph]
            end_phrase = c["at"] + (ph[-1][2] - c["a"]) + 0.18
            if "stack" in c:
                stack_words.append((words[0], starts[0])); continue
            for i in range(len(ph)):
                t0 = starts[i] if i else starts[0] - 0.05
                t1 = starts[i + 1] if i + 1 < len(ph) else end_phrase
                tag = r"{\an2\pos(540,1545)\fad(%d,90)}" % (70 if i == 0 else 0)
                # llevar el texto largo a dos líneas
                txt = line(words, i)
                if len(" ".join(words)) > 17 and len(words) > 2:
                    k = (len(words) + 1) // 2
                    txt = line(words[:k], i if i < k else -1) + r"\N" + line(words[k:], i - k if i >= k else -1)
                ev.append((t0, t1, tag + txt))
    # lista acumulativa: cada palabra queda en pantalla hasta STACK_END
    for n, (w, t0) in enumerate(stack_words):
        shown = [x[0] for x in stack_words[: n + 1]]
        t1 = stack_words[n + 1][1] if n + 1 < len(stack_words) else STACK_END
        txt = r"\N".join(
            "{\\1c%s%s}%s" % (YELLOW if j == n else WHITE, r"\fscx112\fscy112\t(0,120,\fscx100\fscy100)" if j == n else "", s)
            for j, s in enumerate(shown))
        ev.append((t0 - 0.05, t1, r"{\an2\pos(540,1545)\fad(60,90)}" + txt))
    ev.sort()
    for k in range(len(ev) - 1):          # nunca dos subtítulos a la vez
        if ev[k][1] > ev[k + 1][0] - 0.02:
            ev[k] = (ev[k][0], max(ev[k][0] + 0.1, ev[k + 1][0] - 0.02), ev[k][2])
    head = textwrap.dedent(f"""\
        [Script Info]
        ScriptType: v4.00+
        PlayResX: {W}
        PlayResY: {H}
        WrapStyle: 2

        [V4+ Styles]
        Format: Name,Fontname,Fontsize,PrimaryColour,SecondaryColour,OutlineColour,BackColour,Bold,Italic,Underline,StrikeOut,ScaleX,ScaleY,Spacing,Angle,BorderStyle,Outline,Shadow,Alignment,MarginL,MarginR,MarginV,Encoding
        Style: Din,Montserrat Thin ExtraBold,82,&H00FFFFFF,&H00FFFFFF,&H00000000,&H80000000,0,0,0,0,100,100,0,0,1,7,4,2,40,40,40,1

        [Events]
        Format: Layer,Start,End,Style,Name,MarginL,MarginR,MarginV,Effect,Text
        """)
    body = "".join(f"Dialogue: 0,{ts(a)},{ts(b)},Din,,0,0,0,,{t}\n" for a, b, t in ev)
    open("subs.ass", "w", encoding="utf-8").write(head + body)

def render():
    os.makedirs("salida", exist_ok=True)
    have_voice = all(os.path.exists(f"voz/s{i}.wav") for i in range(6))
    inputs = ["-i", "assets/video.mp4", "-loop", "1", "-i", "assets/footer_fit.png"]
    vf = (f"[0:v]scale={W}:{H}:flags=lanczos,setsar=1,ass=subs.ass:fontsdir=assets[v1];"
          f"[1:v]scale={W}:-1[foot];[v1][foot]overlay=0:H-h:shortest=1[vout];")
    if have_voice:
        for i in range(6):
            inputs += ["-i", f"voz/s{i}.wav"]
        af, labels = "", ""
        for n, c in enumerate(CHUNKS):
            ms = int(round(c["at"] * 1000)); d = c["b"] - c["a"]
            af += (f"[{c['seg'] + 2}:a]atrim={c['a']}:{c['b']},asetpts=PTS-STARTPTS,aresample=48000,"
                   f"afade=t=in:d=0.02,afade=t=out:st={d - 0.03:.3f}:d=0.03,adelay={ms}|{ms}[c{n}];")
            labels += f"[c{n}]"
        af += (f"{labels}amix=inputs={len(CHUNKS)}:normalize=0,acompressor=threshold=0.1:ratio=3:makeup=2,"
               f"volume=1.5,apad,asplit[voA][voB];"
               f"[0:a]aresample=48000,volume=0.22[mus];[mus][voA]sidechaincompress=threshold=0.02:ratio=10:attack=15:release=250[duck];"
               f"[duck][voB]amix=inputs=2:normalize=0,alimiter=limit=0.95,atrim=0:{DUR}[aout]")
    else:
        af = f"[0:a]aresample=48000,volume=0.22[aout]"
    subprocess.run(["ffmpeg", "-y", "-v", "error", *inputs, "-filter_complex", vf + af,
                    "-map", "[vout]", "-map", "[aout]", "-t", str(DUR), "-c:v", "libx264", "-preset", "slow",
                    "-crf", "18", "-pix_fmt", "yuv420p", "-r", "24", "-c:a", "aac", "-b:a", "192k",
                    "-movflags", "+faststart", "salida/brilla_perro_9x16.mp4"], check=True)
    print("OK (con voz)" if have_voice else "OK (vista previa sin voz)")

if __name__ == "__main__":
    build_ass(); render()
