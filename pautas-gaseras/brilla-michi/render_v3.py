#!/usr/bin/env python3
"""Pauta Brilla – Seguro de Mascotas · gato (v3).

Texto fijo en Montserrat con interlineado ajustado, tarjeta «DESDE $ 17.640» un 20 % más pequeña y
toda la composición (video + texto + tarjeta + footer) en 4:5.
Salidas:
  salida/brilla_michi_v3_4x5_en_9x16.mp4  (lienzo 1080×1920, composición 4:5 de 1080×1350 centrada, fondo desenfocado)
  salida/brilla_michi_v3_1x1.mp4          (1080×1080)
"""
import os, subprocess
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
os.chdir(HERE)
A, W, DUR = "assets", 1080, 14.04
FOOT_H = round(265 * W / 1097)                       # 261 px (footer recortado, sin margen transparente)
YELLOW, WHITE = (255, 194, 14), (255, 255, 255)

# (fragmentos de la línea con su color y peso) – "seguro para mascotas de Brilla." resaltado
LINES = [
    [("Mi gato cuando se dio cuenta", WHITE, 700)],
    [("que tenía un ", WHITE, 700), ("seguro para", YELLOW, 800)],
    [("mascotas de Brilla.", YELLOW, 800)],
]
SIZE, LEADING = 52, 1.14                              # interlineado ajustado (antes ≈ 1.25)


def text_png(path):
    fonts = {w: ImageFont.truetype(f"{A}/Montserrat-{w}.ttf", SIZE) for w in (700, 800)}
    lh = round(SIZE * LEADING)
    pad = 24
    img = Image.new("RGBA", (W, lh * len(LINES) + 2 * pad), (0, 0, 0, 0))
    shadow = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d, ds = ImageDraw.Draw(img), ImageDraw.Draw(shadow)
    for i, parts in enumerate(LINES):
        widths = [d.textlength(t, font=fonts[w]) for t, _, w in parts]
        x, y = (W - sum(widths)) / 2, pad + i * lh
        for (t, col, w), tw in zip(parts, widths):
            ds.text((x, y + 4), t, font=fonts[w], fill=(0, 0, 0, 150), stroke_width=3, stroke_fill=(0, 0, 0, 150))
            d.text((x, y), t, font=fonts[w], fill=col + (255,), stroke_width=2, stroke_fill=(0, 0, 0, 70))
            x += tw
    shadow = shadow.filter(ImageFilter.GaussianBlur(3))
    shadow.alpha_composite(img)
    shadow.save(path)
    return shadow.size[1]


def gradient_png(path, h=480):
    img = Image.new("RGBA", (W, h))
    px = img.load()
    for y in range(h):
        a = int(150 * (1 - y / h) ** 1.6)
        for x in range(W):
            px[x, y] = (0, 0, 0, a)
    img.save(path)


def render(out, canvas_h, box_h, box_y, crop_off, text_y, price_y):
    """box = composición (W × box_h); se coloca en box_y dentro del lienzo W × canvas_h."""
    price_w = round(560 * 0.8)                        # 20 % más pequeña que la versión anterior (560 px)
    box = (f"[0:v]scale={W}:-1:flags=lanczos,crop={W}:{box_h}:0:{crop_off},setsar=1[b0];"
           f"[b0][1:v]overlay=0:0:shortest=1[b1];"
           f"[b1][2:v]overlay=0:{text_y}:shortest=1[b2];"
           f"[3:v]scale={W}:-1[foot];[b2][foot]overlay=0:H-h:shortest=1[b3];"
           f"[4:v]scale={price_w}:-1,format=rgba,fade=in:st=11.6:d=0.15:alpha=1[pr];"
           f"[b3][pr]overlay=x=(W-w)/2:y='{price_y}+24*exp(-(t-11.6)*7)*cos((t-11.6)*22)':enable='gte(t,11.6)':shortest=1")
    if canvas_h == box_h:
        vf = box + "[vout]"
    else:
        vf = (f"{box}[box];"
              f"[0:v]scale={W}:{canvas_h}:force_original_aspect_ratio=increase,crop={W}:{canvas_h},"
              f"boxblur=40:6,eq=brightness=-0.28:saturation=0.9[bg];"
              f"[bg][box]overlay=0:{box_y}:shortest=1[vout]")
    subprocess.run([
        "ffmpeg", "-y", "-v", "error", "-i", f"{A}/video.mp4",
        "-loop", "1", "-i", f"{A}/grad.png", "-loop", "1", "-i", f"{A}/texto_v3.png",
        "-loop", "1", "-i", f"{A}/footer_fit.png", "-loop", "1", "-i", f"{A}/precio_17640.png",
        "-filter_complex", vf, "-map", "[vout]", "-map", "0:a", "-t", str(DUR),
        "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p", "-r", "24",
        "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", out], check=True)
    print("OK", out)


if __name__ == "__main__":
    os.makedirs("salida", exist_ok=True)
    th = text_png(f"{A}/texto_v3.png"); gradient_png(f"{A}/grad.png")
    # 4:5 (1080×1350) centrado en el lienzo 9:16 → 285 px arriba y abajo
    render("salida/brilla_michi_v3_4x5_en_9x16.mp4", 1920, 1350, 285, crop_off=230, text_y=70, price_y=70 + th + 6)
    # 1:1 (1080×1080)
    render("salida/brilla_michi_v3_1x1.mp4", 1080, 1080, 0, crop_off=330, text_y=36, price_y=36 + th + 4)
