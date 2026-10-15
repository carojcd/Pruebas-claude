# estilo.md — Guía de edición (referencia + marca Congreso de Insolvencia Económica)

Fuente: `fuentes/referencia.mp4` (720×1280, 23,976 fps, 17,11 s, AAC estéreo 44,1 kHz, portugués).
Medido con ffmpeg (fotogramas a 2 fps + detección de escena `scene>0.2`, `signalstats`, `ebur128`, espectrograma) y Whisper (tiempos por palabra).
Todos los tamaños se dan **convertidos a 1080×1920** (×1,5 respecto a la referencia) y los tiempos en ms y en fotogramas a **30 fps**.
Lo que no se puede medir con certeza va marcado **[SUPOSICIÓN]**.
Material de análisis: `analisis/ref/` (contact sheet `sheet_all.jpg`, tiras de transiciones `intro.jpg`, `t78.jpg`, `t106.jpg`, `t146.jpg`, `spectro.png`).

---

## A. LO QUE HACE LA REFERENCIA (medido)

### A1. Ritmo de cortes
| t (s) | Tipo | Duración del plano anterior |
|---|---|---|
| 0,00–1,30 | Entrada: el plano entra con barrido horizontal desde negro (franja negra a la izquierda que se retira, ease-out) | — |
| 1,38 | Corte seco (jump cut, mismo encuadre) al inicio de frase | 1,38 s |
| 2,79 | Corte seco (jump cut) | 1,41 s |
| 5,34 | Corte seco con leve cambio de escala (≈ +4 %) [SUPOSICIÓN: % estimado a ojo] | 2,55 s |
| 7,88 | Corte a **plano oscurecido** (luma media 55 → 36, −35 %) para la frase clave | 2,54 s |
| 9,01 | Transición **glitch**: desenfoque + separación RGB, ≈ 250 ms (6 fot. @24) | 1,13 s |
| 10,89 | Corte a **tarjeta negra** de texto | 1,88 s |
| 11,47 | Corte a **tarjeta blanca** de texto | 0,58 s |
| 12,35 | Corte de vuelta al ponente | 0,88 s |
| 15,06 | **Punch-in** (zoom de corte ≈ +10 %) para el remate [SUPOSICIÓN: % estimado] | 2,71 s |
| 17,11 | Fin | 2,05 s |

- **Plano medio: 1,6 s** (10 planos en 17,1 s). Rango 0,58–2,71 s.
- Los cortes caen **al inicio de frase**, 0–2 fotogramas antes de la primera palabra (p. ej. corte 5,34 → «Pouca» 5,36).
- Silencios casi eliminados: solo un hueco > 150 ms a −40 dB en todo el vídeo (4,27–4,44 s). Densidad: **2,46 palabras/s**.
- No hay movimiento de cámara continuo (Ken Burns) perceptible dentro de los planos [SUPOSICIÓN].

### A2. Subtítulos
- **Fuente**: grotesca neo-suiza tipo Helvetica Neue / Neue Haas [SUPOSICIÓN: identificación visual]. Dos pesos: Regular (400) y Bold (700).
- **Tamaño** (a 1080 px de ancho):
  - Palabras normales: ≈ **70–77 px** (bloque de 2 líneas mide ≈ 146 px de alto).
  - Palabra destacada: ≈ **105–125 px** (×1,4–1,7 la normal); en frases-clima («a própria capacidade.») el bloque entero sube a ≈ 126 px.
  - Tarjetas de texto: ≈ **68 px**, una sola línea.
- **Interlineado**: ≈ 0,9 (las líneas casi se tocan: los descendentes de la línea 1 rozan la línea 2). **Tracking**: ≈ −2 % [SUPOSICIÓN].
- **Color**: blanco #FFFFFF, sin caja, sin contorno; sombra muy suave o ninguna [SUPOSICIÓN].
- **Alineación/posición**: bloque alineado a la izquierda, ancho máx. ≈ **73 % del cuadro (≈ 790 px)**, margen izquierdo ≈ **13 % (≈ 140 px)**. Centro vertical del bloque entre **52 % y 60 % de la altura** (sobre el pecho, debajo de la cara). Variante: bloque a la derecha de la cabeza (borde derecho al 90 %, top al 38 %) cuando el gesto deja ese hueco libre. Tarjetas: centrado al 50 %.
- **Palabras por bloque**: 2–5 (media **3,3**), en **1–3 líneas** de 1–3 palabras. Cada bloque dura 0,6–2,0 s y desaparece de golpe al cortar o al empezar el siguiente.
- **Animación**: aparición **palabra a palabra** sincronizada con el inicio de cada palabra hablada (0–2 fot. de retraso). Cada palabra entra con **opacidad 0 → 100 % en ≈ 250 ms (8 fot. @30)**, pasando por gris, con ligero desenfoque inicial (≈ 6 px → 0) [SUPOSICIÓN: el blur se intuye a 8 fps]. Sin desplazamiento ni escala.
- **Palabra destacada**: la última palabra con peso semántico del bloque (sustantivo/cifra/remate: «dinheiro?», «valioso.», «renda.», «capacidade.», «maiores», «preparadas.»). Se marca con **Bold + tamaño ×1,4–1,7**, no con color. **1 palabra destacada por bloque**, en su propia línea (la última).
- La puntuación final (« . », « ? ») se conserva en pantalla.

### A3. Textos en pantalla (además de los subtítulos)
- **Tarjetas de texto a pantalla completa** (2 en 17 s): fondo plano negro y fondo plano blanco, texto centrado de 1–2 palabras que **sigue el audio** (la voz continúa por debajo). Duran 0,58 s y 0,88 s. Las palabras van apareciendo con el mismo fundido de 250 ms.
- No hay títulos, rótulos de nombre, logotipos ni CTA.

### A4. B-roll
- **Ninguno**: todo es el ponente (un solo plano/cámara). La variedad visual sale de jump cuts, el plano oscurecido, el glitch, las tarjetas de texto y el punch-in.

### A5. Transiciones
- **Corte seco**: 8 de 10 cambios.
- **Barrido de entrada** desde negro (0–1,3 s).
- **Glitch** (1 vez): desenfoque gaussiano ≈ 20 px + aberración cromática (canales R/B desplazados ≈ ±12 px) durante ≈ 250 ms [SUPOSICIÓN: magnitudes estimadas].
- Sin fundidos cruzados.

### A6. Zooms
- Saltos de escala por corte (jump-cut zoom): ≈ **+4 %** y **+10 %** (punch-in final). Sin zoom animado.

### A7. Color
- Clave baja y cálida: luma media **YAVG ≈ 55/255 (≈ 22 %)**, saturación media **SATAVG ≈ 10** (baja), tono **HUEAVG ≈ 146°** (marrones/ámbar). Altas luces solo en ventana/cortinas; ponente con luz lateral suave.
- Plano de énfasis: −35 % de luminosidad (YAVG 36) para que el texto grande destaque.
- Tarjetas: negro puro (YAVG 0) y blanco puro (YAVG 235).

### A8. Sonido
- Voz: **−20,9 LUFS integrados**, LRA 3,4 LU, prácticamente mono (canal lateral −43,9 LUFS).
- **Riser/whoosh** ascendente de 0 a 1,7 s bajo el barrido de entrada (barridos de 2 kHz → 10 kHz visibles en el espectrograma).
- **Golpes/clics de banda ancha** en ≈ 1,6 s, 3,4 s y 9,0 s (este último coincide con el glitch) [SUPOSICIÓN: SFX de transición].
- **Cama musical** suave (tonos sostenidos 400–900 Hz y 2–3 kHz) desde ≈ 10,2 s hasta el final, ≈ 25–30 dB por debajo de la voz, con un grave sostenido al final (16,3 s) [SUPOSICIÓN: pad/drone].

---

## B. ADAPTACIÓN A LA MARCA (manual `CONGRESOS_BRANDBOOK.pdf`)

La estructura de edición (A1–A8) se mantiene; la **línea gráfica** se sustituye por la de la marca:

| Elemento | Referencia | Se aplica así |
|---|---|---|
| Fuente | Helvetica Regular/Bold | **DM Sans**: normales en **Medium 500** (uso «captions» del manual), destacada en **ExtraBold 800** |
| Tamaños | 72 / 110 px | **72 px** normales, **110 px** destacada (×1,5), interlineado 0,95, tracking −1 % |
| Color texto | Blanco | Blanco #FFFFFF; **palabra destacada con el degradado principal** #00F0BF → #36C8F7 → #3B82F6 → #704DFF (manual: «un titular con una sola palabra destacada»; **máx. 1 degradado por composición**) |
| Sombra | — | Sombra suave negra 0 4 24 rgba(0,0,0,0.45) para legibilidad sobre vídeo (no se aplica al logo: el manual prohíbe sombras en el logo) |
| Tarjeta negra | #000000 | **Azul oscuro #111827** con curva de degradado en una esquina (sistema gráfico «curvas y ondas») |
| Tarjeta blanca | #FFFFFF | **Gris claro #F3F4F6**, texto #111827, palabra clave con degradado |
| Elementos de sistema | — | 3 nodos (●●● turquesa, cyan, morado) y línea de degradado como acentos discretos en tarjetas |
| Cierre | — | Tarjeta final sobre #111827 con **logotipo** (≥ 160 px de ancho, área de protección 2X, sin deformar, rotar ni sombrear) |
| Iconografía | — | Outline con degradado (solo si hace falta) |

---

## C. Correcciones aprobadas
Estas reglas **mandan sobre las secciones A y B** cuando se contradicen.

1. **Sin cortina de entrada** (borrador v1 → v2). El vídeo empieza directamente en el primer plano, con los subtítulos desde el fotograma 0; no se usa el barrido/panel de entrada de A1/A5.
