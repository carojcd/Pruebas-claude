#!/usr/bin/env python3
"""Pauta Brilla – Seguro de Mascotas · "El perro reclama" (versión con el audio ya montado).

Usa el audio del video tal cual y lo subtitula palabra a palabra (Montserrat ExtraBold).
Salidas: salida/brilla_perro_v2_9x16.mp4 (1080×1920) y salida/brilla_perro_v2_1x1.mp4 (1080×1080),
ambas con el footer pegado al borde inferior.
Los tiempos de cada palabra vienen de la transcripción con marcas de tiempo del propio audio
(y se afinaron a mano en «no, no, no» y la enumeración).
"""
import os, subprocess, textwrap

HERE = os.path.dirname(os.path.abspath(__file__))
os.chdir(HERE)
W = 1080
FOOT_H = round(265 * W / 1097)                      # 261 px
YELLOW, WHITE = "&H000EC2FF&", "&H00FFFFFF&"         # #FFC20E y blanco (BGR)

# Frases: lista de (palabra, inicio, fin) en segundos del video
PH = [
  [("¿AHORA", 0.00, 0.54), ("SÍ", 0.54, 0.88)],
  [("ME", 0.88, 1.10), ("VAS", 1.10, 1.28), ("A", 1.28, 1.46), ("PAGAR", 1.46, 1.64)],
  [("EL", 1.64, 1.96), ("SEGURO?", 1.96, 2.40)],
  [("EL", 5.20, 5.52), ("OTRO", 5.52, 5.74), ("MES", 5.74, 6.02)],
  [("ME", 6.02, 6.26), ("DIJISTE", 6.26, 6.62), ("LO", 6.62, 6.84), ("MISMO:", 6.84, 7.20)],
  [("QUE", 7.32, 7.46), ("AHORITA,", 7.46, 8.00)],
  [("QUE", 8.04, 8.10), ("EN", 8.10, 8.22), ("LA", 8.22, 8.44), ("TARDE,", 8.44, 8.80)],
  [("QUE", 8.94, 8.96), ("APENAS", 8.96, 9.30), ("TE", 9.30, 9.45), ("PAGUEN...", 9.45, 10.00)],
  [("¡AH,", 10.34, 10.72), ("PERO...", 10.84, 11.06)],
  [("¿CUÁNTO", 11.06, 11.58), ("PAGASTE", 11.58, 12.00)],
  [("EN", 12.00, 12.16), ("EL", 12.16, 12.38), ("VETERINARIO", 12.38, 13.00)],
  [("AYER?!", 13.00, 13.40)],
  [("POQUITO,", 13.54, 13.92), ("¿VERDAD?", 14.00, 14.50)],
  [("¡DEJA", 19.10, 19.50), ("DE", 19.50, 19.72), ("HABLAR", 19.72, 19.98), ("TANTO", 19.98, 20.40)],
  [("Y", 20.58, 20.62), ("CÓMPRAME", 20.62, 21.30), ("EL", 21.30, 21.52), ("SEGURO", 21.52, 22.00)],
  [("DE", 22.00, 22.20), ("MASCOTAS!", 22.20, 22.85)],
]
# Listas acumulativas: (palabra, aparece_en, hasta_cuando_queda_la_lista)
STACKS = [
  ([("NO,", 14.46), ("NO,", 15.60), ("NO.", 16.04)], 16.38),
  ([("HOSPITALIZACIÓN,", 16.40), ("MEDICAMENTOS,", 17.42), ("TRASLADO...", 18.08)], 19.05),
]
END = 23.03

def ts(t):
    t = max(0.0, t); h, m = int(t // 3600), int(t % 3600 // 60)
    return f"{h}:{m:02d}:{t % 60:05.2f}"

POP = r"\fscx112\fscy112\t(0,120,\fscx100\fscy100)"
def colored(words, active):
    return " ".join("{\\1c%s%s}%s" % (YELLOW if i == active else WHITE, POP if i == active else "", w)
                    for i, w in enumerate(words))

def two_lines(words, active):
    if len(" ".join(words)) <= 17 or len(words) < 3:
        return colored(words, active)
    k = (len(words) + 1) // 2
    return colored(words[:k], active if active < k else -1) + r"\N" + colored(words[k:], active - k if active >= k else -1)

def events(pos):
    ev = []
    for ph in PH:
        words = [w[0] for w in ph]; st = [w[1] for w in ph]
        end = ph[-1][2] + 0.15
        for i in range(len(ph)):
            t0 = st[i] if i else st[0] - 0.05
            t1 = st[i + 1] if i + 1 < len(ph) else end
            ev.append([t0, t1, r"{\an2\pos(%d,%d)\fad(%d,90)}" % (*pos, 70 if i == 0 else 0) + two_lines(words, i)])
    for items, until in STACKS:
        for n, (w, t0) in enumerate(items):
            t1 = items[n + 1][1] if n + 1 < len(items) else until
            shown = [x[0] for x in items[: n + 1]]
            ev.append([t0 - 0.05, t1, r"{\an2\pos(%d,%d)\fad(60,90)}" % pos + r"\N".join(
                "{\\1c%s%s}%s" % (YELLOW if j == n else WHITE, POP if j == n else "", s) for j, s in enumerate(shown))])
    ev.sort()
    for k in range(len(ev) - 1):                       # nunca dos subtítulos a la vez
        if ev[k][1] > ev[k + 1][0] - 0.02:
            ev[k][1] = max(ev[k][0] + 0.1, ev[k + 1][0] - 0.02)
    return ev

def write_ass(name, h, pos, size):
    head = textwrap.dedent(f"""\
        [Script Info]
        ScriptType: v4.00+
        PlayResX: {W}
        PlayResY: {h}
        WrapStyle: 2

        [V4+ Styles]
        Format: Name,Fontname,Fontsize,PrimaryColour,SecondaryColour,OutlineColour,BackColour,Bold,Italic,Underline,StrikeOut,ScaleX,ScaleY,Spacing,Angle,BorderStyle,Outline,Shadow,Alignment,MarginL,MarginR,MarginV,Encoding
        Style: Din,Montserrat Thin ExtraBold,{size},&H00FFFFFF,&H00FFFFFF,&H00000000,&H80000000,0,0,0,0,100,100,0,0,1,7,4,2,40,40,40,1

        [Events]
        Format: Layer,Start,End,Style,Name,MarginL,MarginR,MarginV,Effect,Text
        """)
    body = "".join(f"Dialogue: 0,{ts(a)},{ts(b)},Din,,0,0,0,,{t}\n" for a, b, t in events(pos))
    open(name, "w", encoding="utf-8").write(head + body)

def render(out, h, vf_video, ass):
    vf = (f"[0:v]{vf_video},setsar=1,ass={ass}:fontsdir=assets[v1];"
          f"[1:v]scale={W}:-1[foot];[v1][foot]overlay=0:H-h:shortest=1[vout]")
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", "assets/video.mp4", "-loop", "1", "-i", "assets/footer_fit.png",
                    "-filter_complex", vf, "-map", "[vout]", "-map", "0:a", "-t", str(END), "-c:v", "libx264",
                    "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p", "-r", "30", "-c:a", "aac", "-b:a", "192k",
                    "-movflags", "+faststart", out], check=True)
    print("OK", out)

if __name__ == "__main__":
    os.makedirs("salida", exist_ok=True)
    # 9:16 – subtítulo en la zona segura de Reels (lejos del borde inferior, donde Instagram pone su interfaz)
    write_ass("subs_9x16.ass", 1920, (540, 1330), 82)
    render("salida/brilla_perro_v2_9x16.mp4", 1920, f"scale={W}:1920:flags=lanczos", "subs_9x16.ass")
    # 1:1 – recorte cuadrado centrado en la cara del perro (parte alta del cuadro vertical)
    write_ass("subs_1x1.ass", 1080, (540, 790), 70)
    render("salida/brilla_perro_v2_1x1.mp4", 1080, f"scale={W}:1920:flags=lanczos,crop={W}:1080:0:190", "subs_1x1.ass")
