# Tarjeta animada — Feliz cumpleaños, Karen

Video vertical 1080×1920, 30 fps, 20 s, hecho 100 % con código (Python + Pillow + ffmpeg).

**Resultado:** `Feliz_cumpleanos_Karen.mp4`

## Estructura
| Tiempo | Qué pasa |
|---|---|
| 0–3 s | Intro desde negro con la foto del pastel y "Para Karen" |
| 3–14 s | Tres fotos más, con zoom/paneo suave; el marco cambia de tamaño mientras las fotos se funden |
| 14–20 s | La foto del compromiso sube y deja sitio al mensaje, sincronizado con el final de la melodía |

Las fotos no se retocan: solo se recortan las barras y botones de la app (`CROPS` en `render.py`).

## Regenerar
```bash
python3 audio.py      # crea musica.wav (Happy Birthday instrumental, sintetizado)
python3 render.py     # crea el MP4 (~5 min)
python3 render.py --preview 8 19   # PNGs sueltos para revisar
```

## Cambiar la música
`python3 render.py --audio mi_cancion.mp3`. El mensaje aparece a los 15,5 s,
"Nuera ❤️" a los 16,1 s y la firma a los 18,4 s (ver `render()` en `render.py`).

Fuentes: Cormorant Garamond y Great Vibes (SIL Open Font License, Google Fonts); el corazón usa Noto Color Emoji.
