# podcast-video — contexto para no re-investigar

Clips verticales de podcast (Remotion, 1080×1920, 30 fps). Estilo y reglas: `estilo-podcast.md` (manda sobre todo; ahí está «Correcciones aprobadas»).

## Flujo (3 comandos por clip)
```
scripts/clip.sh prep  <n> <entrada.mp4>   # 30 fps + Whisper; imprime la transcripción numerada
# → revisar clips/<n>/correcciones.json (palabras mal oídas, por índice) y clips/<n>/face.json (boca)
scripts/clip.sh edit  <n>                 # corta silencios (umbral automático) y propone bloques/clave/emoji
# → revisar clips/<n>/blocks.json (emojis, claves, punchWord)
scripts/clip.sh build <n>                 # voz −14 LUFS, sfx, plan, render, master y verificación → entregas/PODCAST_<n>.mp4
```
Previsualizar sin renderizar todo: `node scripts/stills.mjs /tmp/x <fotograma> …` (20 s). Solo `build` renderiza el vídeo completo (~90 s).
Si solo cambia texto/emoji: no hace falta repetir la verificación de sincronía. Si cambia volumen de música: remezclar con ffmpeg.

## Problemas del entorno ya resueltos (no volver a investigar)
- Hugging Face bloqueado: modelo Whisper desde npm (`npm pack sts-whisper-small`, carpeta `package/models`); `clip.sh prep` lo descarga solo en `$WHISPER_MODELS` (por defecto /tmp/claude-0/w/package/models).
- Chromium para Remotion: `/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell` (ya en remotion.config.ts y stills.mjs). Pinta emojis en color (Noto Color Emoji).
- OpenCV (`pip install opencv-python-headless==4.10.0.84`) detecta caras con cajas inconsistentes: NO fiable para ubicar la boca → medir `face.json` en fotogramas con rejilla (`ffmpeg … drawgrid=h=ih*0.05`).
- Los clips vienen a 24 fps: se pasan a 30 fps antes de editar (`public/clip-norm.mp4`, ignorado por git).
- Render: siempre `--pixel-format yuv420p` (con jpeg sale yuvj420p). El master de audio lo hace `scripts/export.sh`.
- El pipeline original está en la rama `claude/great-franklin-220loc` (congresos-video/); no se modifica.

## Datos clave
- Silencio: no es digital (ruido de sala −44…−35 dB; en el clip 4 el suelo era bimodal). Umbral automático = percentil 90 del nivel − 22 dB (clips 1–4: −34/−33/−31/−34 dB). Comprobar tras `build` que no quedan pausas > 0,3 s a −45 dB.
- Planos < 0,5 s (los crea el corte de silencios) heredan el zoom del anterior: sin parpadeo de escala.
- El detector ignora «voz» de < 30 ms (aliento/clics): sin eso un pico aislado impedía cortar una pausa y el subtítulo salía ~300 ms antes (clip 3).
- Texto corregido sin tocar tiempos: `scripts/fix_words.py` (los índices de palabra no cambian).
- Verificación: `scripts/verify.sh` (formato, LUFS/pico, silencios, sincronía). Whisper confunde palabras pegadas a un corte (±200 ms): comprobar con energía de voz antes de «arreglar» subtítulos.
- La boca puede bajar si la cámara se acerca: `face.json` (mouth por segundo de origen) mueve el subtítulo (boca + captionOffset, mín. 62 %, máx. 80 %) y el origen del zoom.
- Los datos activos están en `src/data` y `public/`; la copia por clip en `clips/<n>/` (clip 1 = `clip1`).
