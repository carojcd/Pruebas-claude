"""Tarjeta animada de cumpleaños para Karen — 1080×1920, 30 fps, ~20 s.

Las fotos se usan tal cual: solo se recortan las barras de la interfaz de
la app (no se toca a las personas) y se animan con movimiento de cámara.

Uso:
    python3 audio.py                 # genera musica.wav
    python3 render.py                # genera Feliz_cumpleanos_Karen.mp4
    python3 render.py --audio otra.mp3
    python3 render.py --preview 1.5 8 17.5   # PNGs sueltos para revisar
"""
import argparse
import math
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H, FPS, DUR = 1080, 1920, 30, 20.0
NF = int(FPS * DUR)

GOLD = (222, 188, 128)
CREAM = (248, 238, 222)
WARM_DARK = (24, 14, 11)

# Recortes: solo eliminan barras negras / botones de la app / nombre de perfil.
CROPS = {
    1: (80, 0, 972, 1022),
    2: (0, 118, 1080, 1548),
    3: (0, 0, 1065, 1222),
    4: (0, 22, 1080, 1463),
    5: (0, 0, 998, 1512),
}

# Secuencia: (foto, inicio, fin, zoom_ini, zoom_fin, punto focal x/y normalizado)
# Las transiciones se solapan 0.8 s (fundido cruzado con leve escala).
XF = 0.8
SHOTS = [
    (4, 0.0, 3.4, 1.00, 1.07, (0.50, 0.38)),   # intro: el pastel
    (3, 2.6, 6.6, 1.08, 1.00, (0.55, 0.34)),
    (1, 5.8, 9.8, 1.00, 1.08, (0.50, 0.36)),
    (5, 9.0, 14.0, 1.07, 1.00, (0.45, 0.32)),
    (2, 13.2, DUR, 1.00, 1.06, (0.50, 0.42)),  # cierre: la foto del compromiso
]

CARD_MAX_W, CARD_MAX_H = 900, 1380
CARD_CY = 935


# ---------------------------------------------------------------- utilidades
def clamp(x, a=0.0, b=1.0):
    return max(a, min(b, x))


def ease_io(x):
    x = clamp(x)
    return 4 * x ** 3 if x < 0.5 else 1 - (-2 * x + 2) ** 3 / 2


def ease_out(x):
    return 1 - (1 - clamp(x)) ** 3


def lerp(a, b, t):
    return a + (b - a) * t


def ramp(t, t0, dur):
    return clamp((t - t0) / dur)


def font(path, size, wght=None):
    f = ImageFont.truetype(path, size)
    if wght is not None:
        try:
            f.set_variation_by_axes([wght])
        except Exception:
            pass
    return f


def place(canvas, sprite, x, y, alpha=1.0):
    """Compone `sprite` (RGBA) con su esquina en (x, y) flotante y opacidad."""
    if alpha <= 0.003:
        return
    ix, iy = math.floor(x), math.floor(y)
    fx, fy = x - ix, y - iy
    if fx > 1e-3 or fy > 1e-3:  # desplazamiento subpíxel para movimiento suave
        sw, sh = sprite.size
        sprite = sprite.transform((sw + 1, sh + 1), Image.AFFINE,
                                  (1, 0, -fx, 0, 1, -fy), Image.BICUBIC)
    if alpha < 0.999:
        a = sprite.getchannel("A").point(lambda v: int(v * alpha))
        sprite = sprite.copy()
        sprite.putalpha(a)
    _paste(canvas, sprite, ix, iy)


def _paste(canvas, sprite, ix, iy):
    sw, sh = sprite.size
    x0, y0 = max(ix, 0), max(iy, 0)
    x1, y1 = min(ix + sw, W), min(iy + sh, H)
    if x1 <= x0 or y1 <= y0:
        return
    canvas.alpha_composite(sprite, (x0, y0), (x0 - ix, y0 - iy, x1 - ix, y1 - iy))


# ------------------------------------------------------------- preparación
class Photo:
    def __init__(self, idx):
        self.img = Image.open(f"fotos/{idx}.jpg").convert("RGB").crop(CROPS[idx])
        pw, ph = self.img.size
        s = min(CARD_MAX_W / pw, CARD_MAX_H / ph)
        self.cw, self.ch = round(pw * s), round(ph * s)
        # Fondo: la misma foto muy desenfocada, cálida y oscura (solo ambiente)
        cover = max(W * 1.18 / pw, H * 1.18 / ph)
        bg = self.img.resize((round(pw * cover / 4), round(ph * cover / 4)), Image.BILINEAR)
        bg = bg.filter(ImageFilter.GaussianBlur(14))
        a = np.asarray(bg).astype(np.float32) / 255
        lum = a @ np.array([0.3, 0.55, 0.15], np.float32)
        warm = np.stack([lum * 1.15, lum * 0.82, lum * 0.62], -1)
        a = (0.45 * a + 0.55 * warm) * 0.42
        self.bg = Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8)).resize(
            (round(pw * cover), round(ph * cover)), Image.BICUBIC)

    def background(self, t_local):
        """Fondo con deriva lenta (zoom 1.0 -> 1.05)."""
        bw, bh = self.bg.size
        z = 1 + 0.05 * t_local / 6
        sc = min(bw / W, bh / H)
        vw, vh = W * sc / z, H * sc / z
        cx, cy = bw / 2, bh / 2
        return self.bg.resize((W, H), Image.BILINEAR,
                              box=(cx - vw / 2, cy - vh / 2, cx + vw / 2, cy + vh / 2))

    def content(self, zoom, focus, cw, ch):
        """La foto con Ken Burns, encuadrada para un marco de cw×ch."""
        pw, ph = self.img.size
        r = cw / ch
        ww, wh = (ph * r, ph) if pw / ph > r else (pw, pw / r)
        vw, vh = ww / zoom, wh / zoom
        cx = lerp(pw / 2, focus[0] * pw, (zoom - 1) * 6)
        cy = lerp(ph / 2, focus[1] * ph, (zoom - 1) * 6)
        cx = clamp(cx, vw / 2, pw - vw / 2)
        cy = clamp(cy, vh / 2, ph - vh / 2)
        return self.img.resize((cw, ch), Image.LANCZOS,
                               box=(cx - vw / 2, cy - vh / 2, cx + vw / 2, cy + vh / 2))


FRAMES = {}


def framed(content):
    """Esquinas redondeadas + filete dorado fino."""
    cw, ch = content.size
    if (cw, ch) not in FRAMES:
        stroke = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
        ImageDraw.Draw(stroke).rounded_rectangle(
            (5, 5, cw - 6, ch - 6), radius=14, outline=GOLD + (120,), width=2)
        FRAMES[(cw, ch)] = (rounded_mask(cw, ch, 18), stroke)
        if len(FRAMES) > 64:
            FRAMES.pop(next(iter(FRAMES)))
    mask, stroke = FRAMES[(cw, ch)]
    card = content.convert("RGBA")
    card.putalpha(mask)
    card.alpha_composite(stroke)
    return card


def rounded_mask(w, h, r):
    m = Image.new("L", (w * 2, h * 2), 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, w * 2 - 1, h * 2 - 1), radius=r * 2, fill=255)
    return m.resize((w, h), Image.LANCZOS)


def shadow_sprite(w, h, pad=90):
    s = Image.new("L", (w + pad * 2, h + pad * 2), 0)
    ImageDraw.Draw(s).rounded_rectangle((pad, pad + 24, pad + w, pad + h + 24), radius=24, fill=170)
    s = s.filter(ImageFilter.GaussianBlur(36))
    sp = Image.new("RGBA", s.size, (8, 3, 2, 0))
    sp.putalpha(s)
    return sp, pad


def text_sprite(text, fnt, fill, shadow=True, tracking=0):
    bbox = fnt.getbbox(text)
    tw, th = bbox[2] - bbox[0] + abs(tracking) * len(text), bbox[3] - bbox[1]
    pad = 30
    im = Image.new("RGBA", (tw + pad * 2, th + pad * 2), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    if tracking:
        x = pad - bbox[0]
        for ch in text:
            d.text((x, pad - bbox[1]), ch, font=fnt, fill=fill)
            x += fnt.getlength(ch) + tracking
    else:
        d.text((pad - bbox[0], pad - bbox[1]), text, font=fnt, fill=fill)
    if shadow:
        sh = im.getchannel("A").filter(ImageFilter.GaussianBlur(10)).point(lambda v: int(v * 0.75))
        base = Image.new("RGBA", im.size, (10, 4, 2, 0))
        base.putalpha(sh)
        base.alpha_composite(im)
        im = base
    return im


def heart_sprite(height):
    """❤️ con la fuente de emoji a color (Noto Color Emoji se rasteriza a 109 px)."""
    f = ImageFont.truetype("/usr/share/fonts/truetype/noto/NotoColorEmoji.ttf", 109)
    im = Image.new("RGBA", (160, 160), (0, 0, 0, 0))
    ImageDraw.Draw(im).text((10, 10), "❤️", font=f, embedded_color=True)
    im = im.crop(im.getbbox())
    return im.resize((round(im.width * height / im.height), height), Image.LANCZOS)


def glow_sprite(r, color, peak):
    size = r * 2 + 1
    y, x = np.mgrid[-r:r + 1, -r:r + 1]
    d = np.sqrt(x * x + y * y) / r
    a = np.clip(1 - d, 0, 1) ** 2.2 * peak
    arr = np.zeros((size, size, 4), np.uint8)
    arr[..., :3] = color
    arr[..., 3] = (a * 255).astype(np.uint8)
    return Image.fromarray(arr, "RGBA")


def bokeh_sprite(r, color):
    size = r * 2 + 8
    m = Image.new("L", (size * 2, size * 2), 0)
    ImageDraw.Draw(m).ellipse((8, 8, size * 2 - 8, size * 2 - 8), fill=255)
    m = m.resize((size, size), Image.LANCZOS).filter(ImageFilter.GaussianBlur(max(1.5, r / 6)))
    sp = Image.new("RGBA", (size, size), color + (0,))
    sp.putalpha(m)
    return sp


def sparkle_sprite(r):
    """Destello de cuatro puntas, muy fino."""
    s = r * 2 + 1
    y, x = np.mgrid[-r:r + 1, -r:r + 1].astype(np.float32)
    d = np.sqrt(x * x + y * y) / r
    core = np.exp(-(d * 7) ** 2)
    rays = (np.exp(-(np.abs(x) / 1.1) ** 2) + np.exp(-(np.abs(y) / 1.1) ** 2)) * np.clip(1 - d, 0, 1) ** 2
    a = np.clip(core + 0.7 * rays, 0, 1)
    arr = np.zeros((s, s, 4), np.uint8)
    arr[..., 0], arr[..., 1], arr[..., 2] = 255, 236, 200
    arr[..., 3] = (a * 255).astype(np.uint8)
    return Image.fromarray(arr, "RGBA")


# ------------------------------------------------------------- partículas
rng = np.random.default_rng(7)
BOKEH = []
for _ in range(34):
    r = int(rng.choice([6, 9, 13, 18, 26]))
    col = tuple(int(c) for c in rng.choice([(255, 214, 160), (255, 196, 150), (255, 230, 190)]))
    BOKEH.append(dict(sp=bokeh_sprite(r, col), x=rng.uniform(0, W), y=rng.uniform(0, H),
                      vy=rng.uniform(-18, -6), vx=rng.uniform(-4, 4), ph=rng.uniform(0, 6.28),
                      a=rng.uniform(0.10, 0.26) * (1.0 if r < 18 else 0.6)))
SPARKS = []
for _ in range(16):
    SPARKS.append(dict(x=rng.uniform(60, W - 60), y=rng.uniform(80, H - 80),
                       t0=rng.uniform(0, DUR), per=rng.uniform(3.0, 5.5),
                       r=int(rng.choice([10, 14, 18]))))
SPARK_SPRITES = {r: sparkle_sprite(r) for r in (10, 14, 18, 24)}


def draw_particles(canvas, t, strength=1.0):
    for b in BOKEH:
        y = (b["y"] + b["vy"] * t) % (H + 80) - 40
        x = b["x"] + b["vx"] * t + 14 * math.sin(t * 0.4 + b["ph"])
        a = b["a"] * (0.75 + 0.25 * math.sin(t * 0.9 + b["ph"])) * strength
        sp = b["sp"]
        place(canvas, sp, x - sp.width / 2, y - sp.height / 2, a)
    for s in SPARKS:
        ph = ((t - s["t0"]) % s["per"]) / 1.4  # cada destello vive 1.4 s
        if ph >= 1:
            continue
        a = math.sin(ph * math.pi) ** 2 * 0.55 * strength
        sp = SPARK_SPRITES[s["r"]]
        place(canvas, sp, s["x"] - sp.width / 2, s["y"] - sp.height / 2, a)


# ---------------------------------------------------------------- textos
FD = "fuentes/"
f_script = font(FD + "GreatVibes-Regular.ttf", 92)
f_title = font(FD + "CormorantGaramond.ttf", 88, 560)
f_name = font(FD + "CormorantGaramond-Italic.ttf", 124, 520)
f_quote = font(FD + "CormorantGaramond-Italic.ttf", 57, 480)
f_sign = font(FD + "GreatVibes-Regular.ttf", 94)

TX = {
    "para": text_sprite("Para Karen", f_script, GOLD),
    "l1": text_sprite("Feliz cumpleaños,", f_title, CREAM),
    "l2": text_sprite("Nuera", f_name, CREAM),
    "q1": text_sprite("Que la vida siempre te devuelva", f_quote, CREAM),
    "q2": text_sprite("todo el amor y la alegría", f_quote, CREAM),
    "q3": text_sprite("que entregas.", f_quote, CREAM),
    "sig": text_sprite("Con cariño, tu suegra.", f_sign, GOLD),
}
HEART = heart_sprite(84)


def divider_sprite(w=340):
    im = Image.new("RGBA", (w, 24), (0, 0, 0, 0))
    a = np.zeros((24, w), np.float32)
    xs = np.linspace(-1, 1, w)
    line = np.clip(1 - np.abs(xs) ** 2, 0, 1)
    a[11:13, :] = line * 0.85
    arr = np.zeros((24, w, 4), np.uint8)
    arr[..., :3] = GOLD
    arr[..., 3] = (a * 255).astype(np.uint8)
    im = Image.fromarray(arr, "RGBA")
    d = ImageDraw.Draw(im)
    c = w // 2
    d.polygon([(c, 4), (c + 8, 12), (c, 20), (c - 8, 12)], fill=GOLD + (230,))
    return im


DIVIDER = divider_sprite()


def text_in(canvas, key_or_sprite, cy, t, t0, dur=1.1, rise=26, cx=W / 2):
    sp = TX[key_or_sprite] if isinstance(key_or_sprite, str) else key_or_sprite
    p = ease_out(ramp(t, t0, dur))
    if p <= 0:
        return
    place(canvas, sp, cx - sp.width / 2, cy - sp.height / 2 + rise * (1 - p), p)


# --------------------------------------------------------------- overlays
def make_vignette():
    y, x = np.mgrid[0:H, 0:W].astype(np.float32)
    d = np.sqrt(((x - W / 2) / (W * 0.62)) ** 2 + ((y - H * 0.47) / (H * 0.62)) ** 2)
    a = np.clip((d - 0.55) / 0.75, 0, 1) ** 1.6 * 0.85
    arr = np.zeros((H, W, 4), np.uint8)
    arr[..., :3] = WARM_DARK
    arr[..., 3] = (a * 255).astype(np.uint8)
    return Image.fromarray(arr, "RGBA")


def make_bottom_shade():
    y = np.linspace(0, 1, H, dtype=np.float32)[:, None]
    a = np.clip((y - 0.45) / 0.35, 0, 1) ** 1.3 * 0.78
    arr = np.zeros((H, W, 4), np.uint8)
    arr[..., :3] = (18, 10, 8)
    arr[..., 3] = np.broadcast_to((a * 255).astype(np.uint8), (H, W))
    return Image.fromarray(arr, "RGBA")


VIGNETTE = make_vignette()
SHADE = make_bottom_shade()
WARM_GLOW = glow_sprite(700, (255, 190, 130), 0.10)


# ------------------------------------------------------------------ frame
PHOTOS = {i: Photo(i) for i in CROPS}
SHADOWS = {}


def shot_alpha(t, start, end, first, last):
    a_in = 1.0 if first else ease_io(ramp(t, start, XF))
    a_out = 1.0 if last else 1 - ease_io(ramp(t, end - XF, XF))
    return a_in * a_out


def render(t):
    canvas = Image.new("RGBA", (W, H), WARM_DARK + (255,))

    active = [(k, s) for k, s in enumerate(SHOTS) if s[1] <= t < s[2] + 1e-6]
    # Fondos (fundido cruzado)
    for k, (idx, st, en, z0, z1, foc) in active:
        a = shot_alpha(t, st, en, k == 0, k == len(SHOTS) - 1)
        bg = PHOTOS[idx].background(t - st).convert("RGBA")
        place(canvas, bg, 0, 0, a)

    # Brillo cálido que se desplaza muy lento
    gx = W * 0.25 + 260 * math.sin(t * 0.18)
    gy = H * 0.22 + 160 * math.cos(t * 0.13)
    place(canvas, WARM_GLOW, gx - 700, gy - 700, 1.0)

    # Cierre: oscurecer la parte baja para el texto
    shade = ease_io(ramp(t, 14.4, 1.6))
    place(canvas, SHADE, 0, 0, shade)

    draw_particles(canvas, t, strength=0.55 + 0.45 * shade)

    # Tarjeta: un único marco. En cada transición el marco cambia de tamaño
    # suavemente y las dos fotos se funden dentro de él.
    frames = []
    for k, (idx, st, en, z0, z1, foc) in active:
        last = k == len(SHOTS) - 1
        span = (en - st) if not last else 6.8
        zoom = lerp(z0, z1, ease_io((t - st) / span))
        frames.append((k, PHOTOS[idx], zoom, foc))
    if len(frames) == 2:
        p = ease_io(ramp(t, SHOTS[frames[1][0]][1], XF))
    else:
        p = 1.0
    (_, pa, _, _), (kb, pb, _, _) = frames[0], frames[-1]
    fw, fh = lerp(pa.cw, pb.cw, p), lerp(pa.ch, pb.ch, p)
    s = 1.0 + 0.012 * math.sin(math.pi * p) if len(frames) == 2 else 1.0
    cy = CARD_CY
    alpha = 1.0
    if kb == 0:  # intro: aparece desde negro con un leve acercamiento
        cy -= 35  # deja sitio a "Para Karen"
        s *= lerp(0.94, 1.0, ease_out(ramp(t, 0.0, 1.8)))
        alpha = ease_io(ramp(t, 0.1, 1.3))
    elif frames[0][0] == 0:
        cy -= 35 * (1 - p)
    if kb == len(SHOTS) - 1:  # cierre: sube y se reduce para dejar sitio al mensaje
        pc = ease_io(ramp(t, 14.5, 1.5))
        s *= lerp(1.0, 0.78, pc)
        cy = lerp(cy, 610, pc)
    cw, ch = round(fw * s), round(fh * s)
    content = None
    for k, ph, zoom, foc in frames:
        img = ph.content(zoom, foc, cw, ch)
        content = img if content is None else Image.blend(content, img, p)
    card = framed(content)
    key = (cw // 6, ch // 6)
    if key not in SHADOWS:
        SHADOWS[key] = shadow_sprite(cw, ch)
    sh, pad = SHADOWS[key]
    place(canvas, sh, W / 2 - sh.width / 2, cy - sh.height / 2, alpha * 0.9)
    place(canvas, card, W / 2 - cw / 2, cy - ch / 2, alpha)

    canvas.alpha_composite(VIGNETTE)

    # Intro: "Para Karen"
    if t < 3.6:
        p = ease_out(ramp(t, 0.7, 1.2)) * (1 - ease_io(ramp(t, 2.5, 0.9)))
        sp = TX["para"]
        place(canvas, sp, W / 2 - sp.width / 2, 1650 - sp.height / 2 + 20 * (1 - p), p)

    # Mensaje final (sincronizado con el final de la melodía)
    text_in(canvas, "l1", 1162, t, 15.45)
    # "Nuera ❤️" sobre la última nota (16.2 s)
    l2, gap = TX["l2"], 18
    total = l2.width - 60 + gap + HEART.width
    x0 = W / 2 - total / 2
    text_in(canvas, "l2", 1282, t, 16.05, cx=x0 + l2.width / 2)
    hp = ease_out(ramp(t, 16.45, 0.9))
    if hp > 0:
        hs = lerp(0.6, 1.0, hp) * (1 + 0.035 * math.sin(max(0, t - 17.3) * 3.4) * ramp(t, 17.3, 0.6))
        hsp = HEART.resize((max(1, round(HEART.width * hs)), max(1, round(HEART.height * hs))), Image.LANCZOS)
        hx = x0 + l2.width - 30 + gap + HEART.width / 2
        place(canvas, hsp, hx - hsp.width / 2, 1290 - hsp.height / 2, hp)
        # pequeño destello junto al corazón
        sp_a = math.sin(clamp((t - 16.6) / 1.2) * math.pi) ** 2
        sp = SPARK_SPRITES[24]
        place(canvas, sp, hx + 40 - sp.width / 2, 1242 - sp.height / 2, sp_a * 0.8)

    dp = ease_out(ramp(t, 16.9, 1.0))
    if dp > 0:  # filete dorado que se abre desde el centro
        dw = max(2, round(DIVIDER.width * dp))
        div = DIVIDER.resize((dw, DIVIDER.height), Image.LANCZOS)
        place(canvas, div, W / 2 - dw / 2, 1384, dp)
    text_in(canvas, "q1", 1462, t, 17.15, dur=1.0, rise=18)
    text_in(canvas, "q2", 1534, t, 17.40, dur=1.0, rise=18)
    text_in(canvas, "q3", 1606, t, 17.65, dur=1.0, rise=18)
    text_in(canvas, "sig", 1732, t, 18.35, dur=1.2, rise=20)

    # Fundido final
    out = canvas.convert("RGB")
    fo = ease_io(ramp(t, 19.35, 0.65))
    if fo > 0:
        out = Image.blend(out, Image.new("RGB", (W, H), (0, 0, 0)), fo * 0.85)
    return out


# Tramado fijo muy leve: evita bandas en los degradados oscuros sin
# inflar el archivo (un grano distinto en cada cuadro pesa mucho).
DITHER = np.random.default_rng(3).integers(-1, 2, size=(H, W, 1), dtype=np.int16)


def finish(img):
    a = np.asarray(img).astype(np.int16)
    return np.clip(a + DITHER, 0, 255).astype(np.uint8)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--audio", default="musica.wav")
    ap.add_argument("--out", default="Feliz_cumpleanos_Karen.mp4")
    ap.add_argument("--preview", nargs="*", type=float)
    args = ap.parse_args()

    if args.preview:
        for t in args.preview:
            render(t).save(f"preview_{t:05.2f}.png")
            print("preview", t)
        return

    cmd = ["ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
           "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
           "-i", args.audio,
           "-map", "0:v", "-map", "1:a",
           "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p",
           "-profile:v", "high", "-tune", "film",
           "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart",
           args.out]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    for f in range(NF):
        proc.stdin.write(finish(render(f / FPS)).tobytes())
        if f % 30 == 0:
            print(f"  {f / FPS:4.1f}s", file=sys.stderr, flush=True)
    proc.stdin.close()
    sys.exit(proc.wait())


if __name__ == "__main__":
    main()
