#!/usr/bin/env python3
"""Pauta Brilla – Seguro de Mascotas · montaje de 3 clips (paraguas, hamaca, sueño).

- Clips 1→2→3 con transición tipo «whip pan» (deslizamiento + desenfoque de movimiento).
- Voz en off (assets/voz.mp3) + música (assets/musica.mp3, el «drop» cae en la 1.ª transición).
- Subtítulo dinámico palabra a palabra en Source Sans Pro Bold.
- Tarjeta «DESDE $ 17.640» cuando la voz dice el precio.
- Footer a sangre en el borde inferior; subtítulos y tarjeta dentro de la zona 4:5 (1080×1350, y 285–1635).
Salidas: salida/brilla_montaje_9x16.mp4 y salida/brilla_montaje_1x1.mp4
"""
import os, subprocess, textwrap

HERE = os.path.dirname(os.path.abspath(__file__))
os.chdir(HERE)
A, W, H = "assets", 1080, 1920
CLIP, XF = 6.08, 0.60                    # duración de cada clip y de cada transición
T1, T2 = CLIP - XF, 2 * (CLIP - XF)      # inicio de las transiciones: 5.48 s y 10.96 s
DUR = 3 * CLIP - 2 * XF                  # 17.04 s
VO = 0.60                                # la voz entra a los 0.6 s → cada frase cae en su clip
MUSIC_SS = 3.22                          # el drop de la canción (9.00 s) cae en la mitad de la 1.ª transición
ZONE_TOP, ZONE_BOT = 285, 1635           # zona 4:5 centrada en el 9:16
YELLOW, WHITE = "&H000EC2FF&", "&H00FFFFFF&"

# Bloques de subtítulo (2 líneas), palabra, inicio, fin en segundos del audio de la voz.
# Cada bloque aparece una sola vez con fundido y el amarillo «se llena» palabra a palabra (karaoke \\kf),
# así no parpadea y se lee al ritmo de la voz. El precio no se subtitula: lo muestra la tarjeta.
BLOCKS = [
  [[("NO", 0.00), ("PUEDES", 0.42), ("EVITAR", 0.74)], [("TODAS", 1.28), ("SUS", 1.66), ("AVENTURAS,", 1.92)], 2.70],
  [[("PERO", 2.98), ("SÍ", 3.06), ("PUEDES", 3.36)], [("PROTEGERLOS.", 3.76)], 4.60],
  [[("CON", 4.80), ("EL", 5.00), ("SEGURO", 5.20), ("PARA", 5.48)], [("MASCOTAS", 5.64), ("DE", 6.14), ("BRILLA,", 6.34)], 6.75],
  [[("CUIDA", 7.00), ("A", 7.10), ("QUIENES", 7.32), ("LLENAN", 7.50)], [("TU", 7.92), ("VIDA", 8.16), ("DE", 8.38), ("ALEGRÍA.", 8.68)], 9.15],
  [[("PROTÉGELOS", 9.50), ("HOY", 9.94)], [("DESDE", 10.16), ("SOLO", 10.48)], 10.76],
]
PRICE_AT = VO + 10.76                    # la tarjeta entra cuando la voz dice «17.640», donde van los subtítulos

# Formatos. sub_y = base del bloque de subtítulos; la tarjeta se centra en el mismo lugar del bloque.
FORMATS = {
    "9x16": dict(h=1920, sub_size=69, sub_y=1384,          # 1480 − 5 % de la altura (96 px)
                 price_w=538,                               # 448 × 1.2
                 crops=None),
    # 1:1 – cada clip se recorta por separado para que lo importante quede arriba de los subtítulos;
    # el clip 2 hace un paneo vertical que sigue al gato del salto a la hamaca y el clip 3
    # sube de los perritos dormidos a la nube del sueño mientras se dibuja.
    "1x1": dict(h=1080, sub_size=52, sub_y=770,            # base con aire sobre el footer (empieza en 819)
                price_w=430,
                crops=["330", "300+300*min(1\\,max(0\\,(t-1)/3.5))", "600-200*min(1\\,max(0\\,(t-0.5)/4.5))"]),
}

def ts(t):
    t = max(0.0, t); return f"0:{int(t // 60):02d}:{t % 60:05.2f}"

def build_ass(fmt, name):
    f = FORMATS[fmt]; SUB_Y = f["sub_y"]
    ev = []
    for n, (l1, l2, end) in enumerate(BLOCKS):
        words = [(w, s + VO) for w, s in l1 + l2]
        t0 = words[0][1] - 0.15
        t1 = end + VO + 0.25
        if n + 1 < len(BLOCKS):
            t1 = min(t1, BLOCKS[n + 1][0][0][1] + VO - 0.17)
        else:
            t1 = PRICE_AT
        parts = ["{\\k%d}" % round((words[0][1] - t0) * 100)]
        for k, (w, st) in enumerate(words):
            nxt = words[k + 1][1] if k + 1 < len(words) else end + VO
            sep = "\\N" if k == len(l1) - 1 else " "
            parts.append("{\\kf%d}%s%s" % (max(1, round((nxt - st) * 100)), w, sep if k + 1 < len(words) else ""))
        ev.append((t0, t1, r"{\an2\pos(540,%d)\fad(180,180)}" % SUB_Y + "".join(parts)))
    head = textwrap.dedent(f"""\
        [Script Info]
        ScriptType: v4.00+
        PlayResX: {W}
        PlayResY: {f["h"]}
        WrapStyle: 2

        [V4+ Styles]
        Format: Name,Fontname,Fontsize,PrimaryColour,SecondaryColour,OutlineColour,BackColour,Bold,Italic,Underline,StrikeOut,ScaleX,ScaleY,Spacing,Angle,BorderStyle,Outline,Shadow,Alignment,MarginL,MarginR,MarginV,Encoding
        Style: Din,Source Sans Pro,{f["sub_size"]},{YELLOW.rstrip("&")},{WHITE.rstrip("&")},&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,5,3,2,40,40,40,1

        [Events]
        Format: Layer,Start,End,Style,Name,MarginL,MarginR,MarginV,Effect,Text
        """)
    open(name, "w", encoding="utf-8").write(
        head + "".join(f"Dialogue: 0,{ts(a)},{ts(b)},Din,,0,0,0,,{t}\n" for a, b, t in ev))

def render(fmt):
    f = FORMATS[fmt]; ass = f"subs_{fmt}.ass"; build_ass(fmt, ass); out = f"salida/brilla_montaje_{fmt}.mp4"
    os.makedirs("salida", exist_ok=True)
    block_h = 2 * f["sub_size"] * 1.2
    price_h = f["price_w"] * 130 / 700
    PRICE_Y = round(f["sub_y"] - block_h / 2 - price_h / 2)   # centro de la tarjeta = centro del bloque de subtítulos
    PRICE_W = f["price_w"]
    def norm(k):
        base = f"scale={W}:{H}:flags=lanczos,setsar=1,fps=24,format=yuv420p"
        return base if not f["crops"] else base + f",crop={W}:{f['h']}:0:'{f['crops'][k]}'"
    blur = f"between(t,{T1 + 0.1:.2f},{T1 + XF - 0.1:.2f})+between(t,{T2 + 0.1:.2f},{T2 + XF - 0.1:.2f})"
    vf = (f"[0:v]{norm(0)}[a];[1:v]{norm(1)}[b];[2:v]{norm(2)}[c];"
          f"[a][b]xfade=transition=smoothleft:duration={XF}:offset={T1}[ab];"
          f"[ab][c]xfade=transition=smoothleft:duration={XF}:offset={T2}[abc];"
          f"[abc]avgblur=sizeX=40:sizeY=1:enable='{blur}',ass={ass}:fontsdir={A}[v1];"
          f"[4:v]scale={W}:-1[foot];[v1][foot]overlay=0:H-h:shortest=1[v2];"
          f"[5:v]scale={PRICE_W}:-1,format=rgba,fade=in:st={PRICE_AT:.2f}:d=0.15:alpha=1[pr];"
          f"[v2][pr]overlay=x=(W-w)/2:y='{PRICE_Y}+24*exp(-(t-{PRICE_AT:.2f})*7)*cos((t-{PRICE_AT:.2f})*22)'"
          f":enable='gte(t,{PRICE_AT:.2f})':shortest=1[vout];")
    ms = int(VO * 1000)
    af = (f"[3:a]aresample=48000,adelay={ms}|{ms},acompressor=threshold=0.12:ratio=3:makeup=1.6,apad,asplit[vA][vB];"
          f"[6:a]aresample=48000,volume=0.45,afade=t=in:d=0.4,afade=t=out:st={DUR - 1.6:.2f}:d=1.6[mus];"
          f"[mus][vA]sidechaincompress=threshold=0.03:ratio=6:attack=20:release=350[duck];"
          f"[duck][vB]amix=inputs=2:normalize=0,alimiter=limit=0.93,atrim=0:{DUR}[aout]")
    subprocess.run([
        "ffmpeg", "-y", "-v", "error",
        "-i", f"{A}/v1.mp4", "-i", f"{A}/v2.mp4", "-i", f"{A}/v3.mp4", "-i", f"{A}/voz.mp3",
        "-loop", "1", "-i", "../comun/footer_brilla_seguros_1080.png", "-loop", "1", "-i", f"{A}/precio_17640.png",
        "-ss", str(MUSIC_SS), "-i", f"{A}/musica.mp3",
        "-filter_complex", vf + af, "-map", "[vout]", "-map", "[aout]", "-t", f"{DUR:.2f}",
        "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p", "-r", "24",
        "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", out], check=True)
    print("OK", out)

if __name__ == "__main__":
    render("9x16"); render("1x1")
