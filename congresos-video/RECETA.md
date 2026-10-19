# RECETA — Editar un vídeo vertical del Congreso (resultado = BORRADOR_v2.mp4)

Proceso probado y cerrado. Síguelo tal cual: **no re-investigues** nada de lo marcado como resuelto.
Estilo y marca ya están en `estilo.md` (§A referencia medida, §B adaptación a marca, §C correcciones aprobadas, que mandan).

## Resuelto (no volver a comprobar ni buscar alternativas)
| Tema | Solución fija |
|---|---|
| Whisper | Hugging Face y OpenAI están bloqueados. Modelo `sts-whisper-small` (npm, ONNX q8) + transformers.js en CPU, tiempos por palabra. No usar `@remotion/whisper-webgpu` (pide GPU y HF). |
| Chromium | Remotion no puede descargar el suyo: `scripts/browser.mjs` usa el de `/opt/pw-browsers`. |
| Skills de Remotion | Ya instaladas en `.claude/skills/` (no reinstalar). |
| Marca | DM Sans 500/800 en `public/fonts`, logotipos en `public/logo-*.png`, paleta y degradado en `src/montaje.ts` (`BRAND`). **No releer el PDF** salvo que la marca haya cambiado. |
| Referencia de estilo | Ya analizada en `estilo.md`. No reanalizar `referencia.mp4`. |
| SFX y música | Sintetizados por `scripts/sfx.py` (`public/sfx/`). |

## Pasos (comandos desde `congresos-video/`)
0. `npm run setup` → debe terminar en `LISTO` (instala solo lo que falte).
1. Copiar el vídeo nuevo a `public/mi-video.mp4`. Una sola exploración:
   - `ffprobe` (resolución, fps, duración).
   - Hoja de contacto a 1 fps: `ffmpeg -i public/mi-video.mp4 -vf "fps=1,scale=320:-1,tile=6x6" -frames:v 1 analisis/mio/sheet.jpg` y mirarla una vez.
   - Cambios de cámara: `ffmpeg -i public/mi-video.mp4 -vf "select='gt(scene,0.2)',showinfo" -an -f null - 2>&1 | grep -o "pts_time:[0-9.]*"`.
2. `npm run transcribir` (otro idioma: `IDIOMA=portuguese npm run transcribir`).
3. `npm run editar` → `src/data/edit.json`. Corta silencios > 0,3 s (umbral −55 dB, aire 60/80 ms) y ajusta los tiempos de Whisper a los bordes de la voz. Si una palabra queda claramente desfasada, añadirla a `OVERRIDES` en `scripts/build_edit.py`.
4. `npm run normalizar` → voz a −14 LUFS, pico ≤ −2 dBTP. Luego `npm run sfx` (solo si falta `public/sfx/`).
5. **Adaptar `src/montaje.ts` y `src/components/Shot.tsx` al vídeo nuevo** (es lo único editorial):
   - `CAMERA_CUT_SRC`: fotograma de origen del cambio general → medio (`-1` si no hay).
   - `Shot.tsx › FRAMING`: `cx` (x de la cara o atril en el original 1920×1080) y `anchorY` (y de la cara) para cada encuadre. El 16:9 se escala a 1920 de alto y se recorta a 1080 de ancho.
   - `BLOCKS`: bloques de 2–5 palabras (índices de `edit.json › words`), en 1–3 líneas. `hl` = palabra clave, la última del bloque, en su propia línea. `hl: null` si no hay clave.
   - Un bloque `kind: "enfasis"` en la frase más potente (plano oscurecido + texto grande + glitch al terminar). Fijar `EMPHASIS_FROM`/`GLITCH_AT` con sus índices de palabra.
   - Dos bloques `tarjetaOscura` y `tarjetaClara` seguidos, en una frase del último tercio (`CARD_DARK_FROM`, `CARD_LIGHT_FROM`; `CARD_TO` = inicio del último tramo).
   - Último bloque = remate sobre el ponente (punch-in del 114 %).
   - `EXTRA_CUT`: partir cualquier plano de más de ~3,5 s en un inicio de frase.
6. Control rápido: `node scripts/stills.mjs analisis/stills <6–8 fotogramas clave>` → mirar `hoja.jpg` **una vez**.
7. `npm run render` → `out/borrador.mp4` (~3 min).
8. Verificación (todo en un comando cada uno):
   - `ffprobe`: 1080×1920, 30 fps.
   - `ebur128`: ≈ −14/−15 LUFS, pico < −1 dBFS.
   - `silencedetect=n=-55dB:d=0.3`: sin silencios dentro del montaje.
   - Sincronía: `node scripts/transcribe.mjs out/borrador.mp4 <tmp>.json <modelos> spanish` y comparar inicios de palabra con `edit.json` (objetivo: media < 50 ms; revisar las de > 150 ms).
9. Entregar como `BORRADOR_vN.mp4` (copiar desde `out/`) con la lista de decisiones; commit + push.
10. Correcciones aprobadas por el usuario → `estilo.md §C` (numeradas). Mandan sobre §A/§B.

## Valores fijos de este estilo (no cambiar sin corrección aprobada)
- 1080×1920, 30 fps, H.264 CRF 18, AAC.
- Sin cortina de entrada (§C.1). Arranca directamente en el primer plano.
- Jump cuts en cada corte de silencio con zoom alterno 100/108 % (plano general 100/112 %), énfasis 118 % con −42 % de luz, remate 114 %.
- Subtítulos DM Sans 500 a 72 px, blancos, palabra clave DM Sans 800 a 110 px con el degradado #00F0BF→#36C8F7→#3B82F6→#704DFF. Fundido + desenfoque de 250 ms por palabra. Bloque centrado al 56 % de la altura, x = 120, ancho 820.
- Oscurecido inferior azul #111827 para legibilidad. Corrección de color: brillo 0,9, contraste 1,1, saturación 1,06.
- Glitch: 10 fotogramas, desenfoque 16 px + separación RGB ±16 px.
- Cierre de 2,2 s sobre #111827: logotipo a 640 px + «CONOCIMIENTO QUE CONECTA. / IDEAS QUE TRANSFORMAN.».
- Sonido: riser al inicio, whoosh en las tarjetas, golpe en el glitch, cama musical desde el glitch, golpe de cierre.

## Reproducir exactamente BORRADOR_v2
Con `public/mi-video.mp4` original: `npm run setup && npm run transcribir && npm run editar && npm run normalizar && npm run render`.
