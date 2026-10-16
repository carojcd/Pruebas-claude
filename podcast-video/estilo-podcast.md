# estilo-podcast.md — Clips verticales de PODCAST (~30 s)

Entrada medida (`fuentes/clip.mp4`): 720×1280 (ya 9:16), **24 fps**, 30,04 s, 1 ponente, plano fijo medio-corto.
Salida: **1080×1920, 30 fps**, H.264 CRF 18, AAC 192 kb/s. El original se escala ×1,5 (pasa a 30 fps antes de editar → cortes exactos de fotograma).
Lo que decido yo va marcado **[SUPOSICIÓN]**. Tiempos en fotogramas a 30 fps (1 f = 33 ms).

## 1. Qué NO lleva (solo vídeo)
- Sin tarjetas de texto a pantalla completa, sin cortinas/barridos de entrada, sin cierre con logo, sin glitch ni planos oscurecidos. El clip empieza en el 1.er fotograma con la voz y termina con la última palabra (+ 10 f de aire).
- Solo se añade esto si el usuario lo pide.

## 2. Cortes y planos
| Parámetro | Valor |
|---|---|
| Silencios | se elimina todo silencio **> 0,30 s**, ventanas RMS de 10 ms; se deja 0,06 s de aire antes y 0,08 s después de la voz. **Umbral automático [SUPOSICIÓN, calibrado con 4 clips]: percentil 90 del nivel de voz − 22 dB** (≈ −31…−34 dB). El ruido de sala está entre −44 y −35 dB, así que −55 dB no detecta nada |
| Jump cut | corte seco **al inicio de frase/cláusula** (primera palabra tras una pausa, o cada 1,5–2,5 s si no hay pausa: se busca el inicio de palabra más cercano) |
| Duración de plano | objetivo **1,5–2,5 s** (45–75 f). Cada silencio eliminado es un corte obligatorio, así que pueden salir planos de 0,87–1,0 s; no se añaden cortes propios en planos < 45 f |
| Planos < 0,5 s | heredan el zoom del plano anterior (se mantiene el corte, sin salto de escala) |
| Zoom alterno | planos pares **100 %**, impares **110 %** (escala instantánea en el corte, sin zoom animado) |
| Punch-in | **120 %** en la frase más potente (elegida por el editor: remate o afirmación clave, ≈ 1–2 s) |
| Origen del zoom | por clip en `face.json`: x sobre la cara (50–55 %); y fija sobre la cara (clip 1: 24 %) o, si la boca se mueve, **a la altura de la boca** para que el zoom no la baje [SUPOSICIÓN: medido en fotogramas] |
| Varias personas | no aplica en este clip (1 sola persona). Si en otro clip hay varias: se detecta hablante por audio+caras; si no es fiable, se pregunta |
| Calidad | el original es 720 p: 110 % → ≈ 1,65× y 120 % → 1,8× de ampliación; aceptable con `image-rendering` por defecto [SUPOSICIÓN: no se reescala con IA] |

## 3. Subtítulos (palabra a palabra, sincronizados)
| Parámetro | Valor |
|---|---|
| Bloques | **2–4 palabras**, **1–2 líneas**, centrados horizontalmente |
| Posición | centro del bloque en **y = 62 % (1190 px)**; si la boca baja (cámara que se acerca), el bloque la sigue: **y = boca + 17 %**, máx. **80 %** (`face.json`, boca medida por clip en fotogramas con rejilla) para que nunca tape boca ni barbilla |
| Zona segura | margen libre **200 px arriba** y **250 px abajo** (texto entre y 200 y y 1670); ancho útil **≤ 880 px** (100 px a cada lado) |
| Boca | cara/boca en y ≈ 25–36 % (480–690 px); el bloque (y ≈ 1100–1280) queda ≥ 400 px por debajo [SUPOSICIÓN: se verifica con fotogramas de control] |
| Texto base | **Montserrat ExtraBold 800**, **78 px**, blanco **#FFFFFF**, interlineado 1,05, tracking −0,01 em, sombra `0 4px 14px rgba(0,0,0,.55)` + contorno `-webkit-text-stroke: 2px rgba(0,0,0,.35)` |
| Palabra clave | **1 por bloque**; **Playfair Display ExtraBold Italic 800**, **101 px** (1,3×), naranja **#FF6A1A**, glow `0 0 18px #FF6A1A99, 0 0 42px #FF6A1A55`; se elige la palabra con más peso semántico (sustantivo/verbo/cifra) |
| Entrada de palabra | aparece en su **inicio hablado (−0 / +1 f)**; pop de escala **0,8 → 1,05 → 1** en **6 f** (0→4 f sube a 1,05, 4→6 f baja a 1) + fundido de opacidad 0→1 en los mismos 6 f |
| Entrada palabra clave | mismo pop con más rebote: **0,7 → 1,15 → 0,97 → 1** en **9 f** |
| Salida | el bloque desaparece al empezar el siguiente o 8 f tras su última palabra |
| Sincronía | objetivo: desfase medio **≤ 50 ms** entre la palabra oída y su aparición (se mide re-transcribiendo el render) |
| Texto | se corrige la ortografía de Whisper (nombres propios, palabras mal oídas) sin tocar los tiempos |

## 4. Emojis
- **1 de cada 3 bloques** (≈ 33 %), relacionado con el significado de la palabra clave; nunca en bloques consecutivos.
- **90 px**, a la **derecha del bloque**, centrado verticalmente con él (el bloque con emoji limita su texto a 760 px de ancho para que quepa).
- Entrada: pop 0,5 → 1,2 → 1 en 8 f, en el fotograma de inicio de la **palabra clave**; sale con el bloque.
- Render: Chromium headless pinta **Noto Color Emoji en color** (comprobado) → se usa el emoji como texto, sin imágenes.

## 5. Sonido
| Parámetro | Valor |
|---|---|
| Voz | normalizada a **−14 LUFS integrados**, pico real máx. **−2 dBFS** (`loudnorm` 2 pasadas + limitador `alimiter`) |
| «Pop» de emoji | burbuja sintetizada: seno 520→880 Hz, 90 ms, −24 dBFS, en el fotograma de entrada del emoji |
| Whoosh en punch-in | ruido paso-banda 400→4000 Hz, 280 ms, −22 dBFS, **empieza 6 f antes** del corte y llega a su pico en él |
| Música | **pedida por el usuario** (clip 1): pad cálido sintetizado (Dm–Bb–F–C, campanitas suaves), ≈ −33 LUFS (≈ 19 LU bajo la voz), fundido de entrada 1 s y de salida 1,5 s. Se genera con `scripts/sfx.py`. En clips nuevos: preguntar |
| Master final | tras el render, `scripts/export.sh` aplica `loudnorm` de 2 pasadas sobre la mezcla (−14 LUFS, −2 dBTP) sin recodificar el vídeo |
| Resto de SFX | ninguno |

## 6. Color
Corrección suave global: `contrast(1.08) saturate(1.05)` (CSS filter). Sin tocar matiz ni curvas por zonas → los tonos de piel se mantienen. Sin viñeta ni grano.

## 7. Verificación obligatoria antes de entregar
1. `ffprobe`: 1080×1920, 30 fps, H.264 + AAC.
2. `ffmpeg ebur128`: −14 LUFS (±1), true peak ≤ −2 dBTP.
3. Sincronía: re-transcribir el render y comparar inicio de cada palabra con el de su subtítulo (media ≤ 50 ms).
4. `silencedetect` (−55 dB, d = 0,3): 0 silencios > 0,3 s.
5. Fotogramas de control: zona segura, subtítulo bajo la boca, emojis en color.

## 8. Correcciones aprobadas
Reglas confirmadas por el usuario; **mandan sobre las secciones 1–7** cuando se contradicen. (Aún ninguna.)

- *Preferencia del usuario (clip 1):* sí quiere música de fondo muy baja (ver §5).
