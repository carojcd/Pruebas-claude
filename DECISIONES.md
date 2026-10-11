# LITIVO — Cinematic UI Motion · DECISIONES

Pieza publicitaria de 10 s (1080 × 1920, 60 FPS, 600 fotogramas, H.264 + AAC) producida al 100 % con código: interfaz reconstruida en HTML/CSS/SVG, escena 3D con transformaciones CSS, cámara y coreografía calculadas por fotograma, y banda sonora sintetizada muestra a muestra. No se usaron plantillas, samples, clips, imágenes ni audio generados por IA.

**Entregables**

| Archivo | Ruta |
|---|---|
| Vídeo final | `LITIVO_CINEMATIC_10S.mp4` (raíz del repositorio, 11 278 870 bytes) |
| Este documento | `DECISIONES.md` (raíz del repositorio) |

---

## 0. Limitaciones de las fuentes (declaradas antes de todo)

| Recurso pedido | Estado | Qué se hizo |
|---|---|---|
| Vídeo de referencia `youtube.com/watch?v=uwAnvbtIjrg` | **No accesible.** La petición desde el contenedor devolvió `CONNECT tunnel failed, response 403` (el proxy de salida bloquea `www.youtube.com`). | No se analizó. No se describe ni se imita nada de ese vídeo; la propuesta sigue únicamente las instrucciones escritas del encargo. |
| `Manual de Marca Digital LITIVO.pdf` | **No disponible.** El repositorio estaba vacío (sin commits) y una búsqueda en todo el sistema de archivos (`find / -iname "*manual*marca*" -o -iname "*litivo*"`) no encontró nada. | Se usaron la paleta, la tipografía y las reglas de logotipo escritas en el propio encargo, más las capturas suministradas. |
| SVG oficial del logotipo | **No disponible.** | Se redibujó en vectores midiendo píxel a píxel la captura del dashboard (ver §3). |
| Capturas de la interfaz | Disponibles (5 imágenes). Copiadas en `reference/`. | Fuente principal de layout, textos, iconos, radios y jerarquía. |
| Tipografía Inter Tight | No instalada en el sistema (sólo Inter). | Se instaló el paquete npm `@fontsource/inter-tight` 5.3.0 (licencia OFL) y se sirven los `.woff2` locales desde `src/fonts/`. Es un archivo tipográfico, no un recurso de imagen/audio. |

---

## 1. Concepto creativo

**THE INTERFACE COMES ALIVE.** Un espacio oscuro (Dark) en el que una línea Aqua se enciende, barre el plano del dashboard y lo materializa. La cámara entra en ese plano como si fuera un objeto físico: las tres tarjetas de estadísticas se desprenden y flotan frente al espectador, la cámara recorre "Requiere tu atención" y "Próximas audiencias" mientras sus elementos se despliegan en profundidad, todo vuelve a encajar en una única plataforma y la interfaz se disuelve para dejar el logotipo y el mensaje **"Donde la justicia evoluciona."**

Principio rector: la interfaz real es la protagonista; la luz y el movimiento sólo la revelan.

## 2. Dirección de arte

- **Plano posterior:** fondo Dark con gradientes radiales Teal/Aqua de baja opacidad, un halo ambiental 3D a z = −1100 y arcos concéntricos a z = −2400 derivados del isotipo (círculo + arcos superior/inferior), que generan parallax real al moverse la cámara.
- **Plano intermedio:** el dashboard completo (barra lateral, encabezado, módulos) como un plano físico de 2000 × 1080 px de "mundo".
- **Plano anterior:** las tres tarjetas, las filas de los módulos y los bordes luminosos, con alturas propias (translateZ).
- **Foco cinematográfico:** cuando un componente protagoniza el plano, el resto del dashboard se "apaga" mezclándose hacia Dark (opacidad de niebla 0.86). Así lo protagonista queda iluminado sobre un entorno profundo, sin introducir colores ajenos.
- **Composición vertical 9:16:** el dashboard apaisado sólo se muestra completo en planos generales (escenas 1, 2, 6); en el resto se usan primeros planos y travellings para que los textos sean legibles (por ejemplo, en la escena 4 los títulos de fila de 15.5 px se ven a una escala ≈ 1.9 calculada a partir de la distancia de cámara, es decir ≈ 29 px; en el fotograma 244 las tarjetas flotantes miden ≈ 600, 705 y 775 px de ancho, medidos sobre la imagen).

## 3. Identidad visual utilizada

- **Paleta (exclusiva):** Aqua `#63C2C8`, Teal `#3E9891`, Dark `#19292C`, White `#FFFFFF`, Aqua Light `#DCF6F3`, Teal Light `#78BEB7`, Off White `#F5FAFA`, Gray Light `#DDE2E5`. Variaciones permitidas: transparencias de esos mismos colores (p. ej. texto secundario = Dark al 74 %, viñeta = Dark oscurecido). El neón usa sólo Aqua/Teal y blanco en el núcleo del destello.
- **Tipografía:** Inter Tight (400–800) para toda la interfaz y el mensaje final.
- **Logotipo:** redibujado vectorial en `src/logo.svg`. Proceso: recorte de la captura (zona del logotipo, 120 × 44 px), perfiles de filas/columnas y centroides con NumPy para obtener eje de cada trazo (grosor medido 4.4 px), posición de la barra de la "t", terminales de "l" y "t", ángulo de los brazos de la "v", centro/radio del anillo (r ≈ 10.1, grosor 3.6) y de los arcos superior/inferior (concéntricos, r = 15.3, ±27°). Verificación: rasterizado del SVG en Chromium y comparación con la captura → intersección/unión ponderada **0.86**, diferencias residuales atribuibles al desenfoque/compresión de la captura (`scripts/logo-compare.mjs`). El logotipo nunca recibe contorno, neón, sombra ni deformación: entra con opacidad, escala uniforme (0.94 → 1) y un desplazamiento de 16 px. El halo y los arcos de cierre son capas independientes situadas fuera del área de protección.
- **Interfaz:** reconstruida 1:1 sobre las coordenadas de la captura de 2000 px (`src/scene.html`, `src/scene.css`): textos, cifras (5 / 3 / 2), filas (Firmar documento, Completar información del acreedor, Revisar audiencia), calendario de septiembre de 2026 (MAR 8 … LUN 14, JUE 10 seleccionado, punto en SÁB 12), audiencias con horas y botones "Ver expediente". Los iconos se trazaron a mano en SVG imitando los de las capturas. El ancho del titular "Buenos días, Santiago" se ajusta automáticamente a los 392 px medidos en la captura. Se excluyó la barra flotante de herramientas que aparece abajo en la captura 5 porque es un overlay del navegador, no parte del producto. No se añadieron funciones ni textos.

## 4. Arquitectura técnica

| Pieza | Archivo | Función |
|---|---|---|
| Línea de tiempo maestra | `src/timeline.js` | Escenas, 19 eventos audiovisuales (en fotogramas), curvas de easing (cubic-bezier resueltas numéricamente, muelle amortiguado, outBack), `track()` y `pulse()`. Lo importan **la escena y el sintetizador**: una sola fuente de verdad para la sincronía. |
| Escena | `src/scene.html`, `src/scene.css`, `src/scene.js` | DOM + CSS 3D (`perspective: 1300px`, `transform-style: preserve-3d`, `translate3d/rotateX/Y/Z/scale`). `window.renderFrame(f)` fija el estado completo de un fotograma (acepta fracciones para el motion blur). |
| Render | `scripts/render.mjs` | Servidor HTTP local + Chromium 141 headless (playwright-core 1.56.1), 4 páginas en paralelo, captura JPEG q96 de cada sub-fotograma, y FFmpeg 6.1.1 (libx264, `-preset slow -crf 14`, High, yuv420p, BT.709). |
| Motion blur | `scripts/render.mjs` | 4 sub-fotogramas por fotograma con obturador de 180° centrado (desfases −0.1875, −0.0625, +0.0625, +0.1875 fotogramas), promediados con `tmix` y re-muestreados a 60 FPS con `select`. |
| Audio | `scripts/audio.mjs` | Síntesis en Node, 48 kHz, WAV PCM 24 bits estéreo de exactamente 480 000 muestras (10.000 s). |
| Ensamblado y validación | `scripts/finalize.sh`, `scripts/verify_sync.py` | Mux AAC 256 kb/s + `faststart`, ffprobe con conteo real de fotogramas, decodificación completa, informe de sincronía medido sobre el MP4. |
| Diagnóstico | `scripts/debug-*.mjs`, `scripts/contact-sheet.sh` | Herramientas usadas para localizar el fallo de ordenamiento 3D (§13) y para revisar fotogramas. |

**Determinismo:** ninguna animación usa `setTimeout`, `setInterval`, `requestAnimationFrame`, animaciones/transiciones CSS ni aleatoriedad sin semilla; el ruido del audio usa un PRNG mulberry32 con semilla fija `20260910`. Comprobado: dos renders independientes del fotograma 250 dieron el mismo MD5 (`122d7fd446c4988ff6fac161f2d3f354`) y dos síntesis independientes del WAV también (`553323d1b6e192bc35778044ef05858b`).

**Reproducir:** `npm install` → `node scripts/render.mjs --sub 4 --workers 4` → `./scripts/finalize.sh`.

## 5. Animaciones principales (storyboard ejecutado)

| Escena | Fotogramas | Qué ocurre |
|---|---|---|
| 01 Activación digital | 0–72 | Fondo Dark. En f15 la línea Aqua se enciende desde el centro (expansión `outExpo`, engrosamiento breve) y luego barre el plano del dashboard (f30→f75, `inOutSine`). Cada elemento se materializa con una máscara de degradado ligada a la posición de la línea, con una banda luminosa detrás. Halo ambiental se enciende con el impacto. |
| 02 Revelación del dashboard | 72–168 | Pulso en f75. Travelling lateral con giro de yaw (−24° → +8°). Encabezado, CTA y títulos suben a alturas distintas (26–46 px) → parallax real. Barrido especular escalonado sobre las tres tarjetas (f126–168). |
| 03 Floating cards | 168–264 | Cada tarjeta con trayectoria y curva propias (Bezier cúbica + `arrive` + muelle): **5** retrocede (anticipación), avanza a cámara y gira en Y; **3** se desplaza lateralmente, gana profundidad y gira; **2** se hunde (otra profundidad) y traza una curva amplia con alabeo. Llegadas en f180 / f210 / f240 con pulso de neón. Después respiran con fases distintas. Cámara en órbita moderada. |
| 04 Requiere tu atención | 264–360 | Las tarjetas se retiran escalonadas hacia arriba y atrás. Transición por profundidad (la cámara se aleja y vuelve a entrar). El módulo se eleva 120 px; las filas se despliegan tipo acordeón en f300 / f315 / f330 (altura y separación propias, muelle), con pulso del icono, brillo del botón y anillo Aqua. Barrido luminoso del borde desde f326. Travelling rápido hasta los botones. |
| 05 Agenda en perspectiva | 360–462 | El calendario sube a su propio nivel (z = 260) desde abajo, con escala y muelle; asienta en f375. Ola de profundidad en los días, JUE 10 se ilumina en f405, la audiencia 1 se acerca a cámara (z + 92) en f420 y la 2 se queda detrás (z + 20) en f435. Travelling lateral de derecha a izquierda. |
| 06 Convergencia | 462–522 | Dolly out. Las tarjetas regresan a sus huecos por curvas cuadráticas (escalonadas 4 fotogramas), módulos y filas bajan a z = 0, el foco se desvanece; en f510 todo encaja: destello del borde del dashboard, de los huecos y de las tarjetas. |
| 07 Brand reveal | 522–600 | La interfaz se aleja y se disuelve (opacidad + desenfoque, f522–548). Logotipo en f540, mensaje en f555, arcos derivados del isotipo se dibujan alrededor. El último fotograma queda como pieza gráfica estática. |

Principios aplicados: anticipación (tarjetas 5 y 2, desplazamiento opuesto de la 3), follow-through y overshoot controlado (muelles con amortiguamiento 0.45–0.55), overlapping action y stagger (retirada y regreso escalonados, filas, días), jerarquía (movimientos grandes en cámara y tarjetas; micro-animaciones discretas en iconos, botones y días) y curvas distintas según intención (`camera`, `arrive`, `depart`, `spring`, `outExpo`…).

## 6. Movimientos de cámara

Cámara orbital definida por objetivo T, distancia r, yaw, pitch y roll (`src/scene.js`, tabla `CAM`), interpolada con **splines de Hermite con tangentes Catmull-Rom** para que la velocidad sea continua entre keyframes (sin paradas robóticas). Se usan: dolly in inclinado (f0–72, r 4300 → 2150, roll −22° → −15°), tracking lateral con giro (escena 2), órbita moderada entre tarjetas (yaw +6° → −7°), transición por profundidad (r 960 → 760 con cambio de objetivo), tracking lateral rápido sobre las filas, descenso y travelling de la agenda (yaw +12° → −8°), dolly out de convergencia (r → 2700) y alejamiento final (r → 4600). Sin temblores ni movimientos aleatorios.

## 7. Iluminación

- **Aqua edge lighting:** capa `neon-edge` (línea de 1.6 px + 3 sombras difusas + brillo interior), intensidad calculada por fotograma: pulso con ataque de 2–3 fotogramas y caída exponencial (24–30 fotogramas) en cada golpe; base de 0.16 mientras flotan; nunca permanece encendida al máximo.
- **Barrido direccional:** capa `neon-sweep` con `conic-gradient` enmascarado al contorno (luz que recorre el borde) en el vuelo de cada tarjeta, en el módulo de atención y en el calendario; barrido especular diagonal sobre la cara de las tarjetas en la escena 2.
- **Soft ambient glow / environmental halos:** halo 2D y halo 3D detrás del dashboard, halo de marca detrás del logotipo.
- **Depth shadows:** sombra proyectada de cada tarjeta sobre el plano del dashboard, con desplazamiento, desenfoque y opacidad función de la altura z.
- **Iluminación dependiente de profundidad:** las tarjetas se oscurecen hacia Dark según su distancia a la cámara; el foco atenúa lo que no protagoniza el plano.
- **Subtle light trails:** tres ecos del contorno de cada tarjeta evaluados 1.6, 3.2 y 4.8 fotogramas antes, visibles sólo cuando la velocidad supera un umbral.
- **Motion blur** real por promediado temporal de 4 sub-fotogramas.

## 8. Síntesis musical

Pista original de 10 s a **120 BPM** (1 negra = 30 fotogramas) en Re menor que resuelve a Re mayor (add9) en el logotipo. Todo se genera con osciladores y filtros escritos en `scripts/audio.mjs`:

- **Pads:** 3 dientes de sierra con polyBLEP por nota (desafinación ±0.11 semitonos), filtro de estado variable (TPT) cuyo corte se abre con la energía del montaje (380 Hz → 4 400 Hz en el riser). Progresión: Dm9 (0–2 s) · B♭maj9 (2–4 s) · Gm9 (4–6 s) · A7sus4 (6–7.5 s) · B♭maj7♯11 (7.5–8.5 s) · Dadd9 (9–10 s).
- **Sub bass:** seno + 2.º y 3.er armónico (audibles en altavoces de móvil), con sidechain del kick.
- **Kick sintetizado:** seno con caída de tono 162 → 44 Hz y clic de ataque; a negras de 2.0 s a 7.0 s.
- **Percusión electrónica:** hats de ruido filtrado a corcheas a contratiempo y semicorcheas fantasma, palmas por ráfagas de ruido en paso-banda.
- **Pulsos digitales:** arpegio FM a semicorcheas (4.0–7.4 s) con delay ping-pong de corchea con puntillo.
- **Mezcla y máster:** reverb tipo Freeverb (8 combs + 4 all-pass por canal), paso-alto a 32 Hz, saturación suave `tanh`, normalización a −1 dBFS, fundidos de 4 ms / 80 ms. Resultado medido en el MP4: −11.5 LUFS integrados, LRA 2.7 LU, pico −0.7 dBFS (tras la codificación AAC).
- **Arco de energía:** intro sobria → entra el groove en 2.0 s → las tarjetas suben la energía → breakdown en 7.5 s → riser → impacto en 8.5 s → acorde final y campanas.

## 9. Diseño sonoro

Impacto tecnológico (boom con caída de tono + ráfaga filtrada + cola), pings FM afinados a los acordes (golpes de tarjeta A5 → C6 → E6, filas D6 → F6 → A6), barridos de ruido en paso-banda con paneo móvil (whooshes de vuelo, barrido de atención, brillo de borde), succión previa al encendido, transición sonora de la agenda, riser de ruido + sierra ascendente (dos octavas) + redoble acelerado, y campanas FM en el cierre. Ningún sonido procede de archivos.

## 10. Sincronización audiovisual

Los 19 eventos de `src/timeline.js` disparan a la vez el movimiento/luz en la escena y el sonido en el sintetizador (el sonido se coloca en la muestra `fotograma × 800`). Mapa: activación (f15) impacto · dashboard (f75) pulso digital · groove/barrido de luz (f120) · tarjeta 5 (f180) impacto suave · tarjeta 3 (f210) nuevo impacto · tarjeta 2 (f240) impacto más pronunciado · atención (f270) barrido electrónico · filas (f300/315/330) pings · agenda (f360) transición sonora · calendario (f375) golpe suave · JUE 10 (f405) ping · audiencias (f420/435) · riser (f450→f510) · convergencia (f510) impacto · logotipo (f540) nota final · mensaje (f555) campanas.

**Medición sobre el MP4 final** (`scripts/verify_sync.py`: mayor salto de energía de la envolvente muestra a muestra en ±25 ms alrededor de cada evento):

| Evento | Fotograma | t (ms) | Onset medido (ms) | Desfase (ms) |
|---|---|---|---|---|
| ignite | 15 | 250.0 | 249.6 | −0.4 |
| dashPulse | 75 | 1250.0 | 1253.4 | +3.4 |
| grooveIn | 120 | 2000.0 | 1999.6 | −0.4 |
| card1 | 180 | 3000.0 | 2976.0 | −24.0 |
| card2 | 210 | 3500.0 | 3500.2 | +0.2 |
| card3 | 240 | 4000.0 | 3999.6 | −0.4 |
| attentionSweep | 270 | 4500.0 | 4478.0 | −22.0 |
| row1 | 300 | 5000.0 | 4995.1 | −4.9 |
| row2 | 315 | 5250.0 | 5257.9 | +7.9 |
| row3 | 330 | 5500.0 | 5481.2 | −18.8 |
| agendaWhoosh | 360 | 6000.0 | 5977.2 | −22.8 |
| calendarLand | 375 | 6250.0 | 6269.9 | +19.9 |
| daySelect | 405 | 6750.0 | 6756.2 | +6.2 |
| audience1 | 420 | 7000.0 | 6998.4 | −1.6 |
| audience2 | 435 | 7250.0 | 7258.4 | +8.4 |
| riserStart | 450 | 7500.0 | 7520.6 | +20.6 |
| converge | 510 | 8500.0 | 8521.2 | +21.2 |
| logo | 540 | 9000.0 | 9011.1 | +11.1 |
| tagline | 555 | 9250.0 | 9273.6 | +23.6 |

Desfase absoluto medio **11.5 ms**, máximo **24.0 ms** (1 fotograma = 16.7 ms). Los valores mayores corresponden a eventos cuyo sonido es, por diseño, un crescendo previo (whoosh de la tarjeta 5, barrido de atención, transición de agenda, riser) o un ataque suave (campanas del mensaje), donde el detector elige el punto de máxima pendiente y no el instante programado. La correlación cruzada entre el WAV y el audio decodificado del MP4 dio **0 muestras** de desfase (la codificación AAC no desplaza la pista).

Limitación declarada: el informe completo (`build/sync_report.md`, no versionado) incluye también un pico de luminancia global por evento; esa métrica sólo es significativa para destellos grandes (ignite: −1 fotograma, card3: −1, converge: +2) y no capta luces locales, por lo que no se usa como prueba. La sincronía visual está garantizada por construcción (ambos lados leen el mismo fotograma de `timeline.js`) y se revisó visualmente en fotogramas concretos (línea en f15, pulsos de tarjetas, JUE 10 en f405, destello en f509–510, logotipo en f540).

## 11. Alternativas descartadas

| Alternativa | Motivo del descarte |
|---|---|
| Three.js / WebGL con la interfaz como textura | Habría obligado a rasterizar la UI en texturas (texto menos nítido en primeros planos, pérdida de fidelidad). Con CSS 3D el texto se rasteriza a la escala real de cada plano y la interfaz sigue siendo DOM. |
| Remotion | No era necesario: un arnés propio de ~90 líneas (servidor + Chromium + FFmpeg) da el mismo control por fotograma sin dependencias adicionales. No se probó. |
| Usar las capturas como imágenes animadas | Prohibido por el encargo y con resolución insuficiente para primeros planos. |
| Niebla gris por mezcla con blanco/50 % | Probada en la primera previsualización: el dashboard quedaba gris "sucio". Sustituida por mezcla hacia Dark al 86 %. |
| Ocultar y volver a mostrar las filas de "Requiere tu atención" | Probado: se veía el módulo vacío durante la transición. Sustituido por un despliegue tipo acordeón (las filas nunca desaparecen). |
| Bisagra/inclinación propia del calendario (rotateX/rotateY con muelle) | Provocaba que Chromium dejara de dibujar el calendario en fotogramas concretos (§13). Sustituida por elevación + deslizamiento + escala uniforme; la sensación de perspectiva la aporta la cámara. |
| Encuadres a 1 247 px de ancho completos en escenas 4–5 | Texto ilegible en 9:16 (≈ 13 px). Sustituidos por primeros planos con travelling. |
| Fundido cruzado largo dashboard → logotipo | El dashboard seguía visible bajo el logotipo (f550); se adelantó el fundido para que termine en f548. |

## 12. Iteraciones realizadas

1. **Fidelidad estática:** vista plana del dashboard (`--flat`) comparada con la captura → layout aceptado.
2. **Previsualización 1** (25 fotogramas sueltos): composición base de las 7 escenas.
3. **Previsualización 2** (24 fotogramas): niebla gris, filas ocultas, primeros planos recortados → corregidos.
4. **Previsualización 3** (24 fotogramas): hojas sin niebla, calendario mal encuadrado, tarjetas pequeñas → corregidos.
5. **Render completo v1** (600 fotogramas, sin motion blur): análisis de diferencias entre fotogramas → parpadeo del calendario en f368–370 y f378–382.
6. **Diagnóstico y corrección del parpadeo** (§13), con previsualizaciones secuenciales f340–f400.
7. **Previsualización 4** (24 fotogramas) + ajuste del fundido final.
8. **Render completo v2** (600 fotogramas × 4 sub-fotogramas): sin parpadeos; revisión a resolución completa → recortes de títulos en escenas 4–5.
9. **Ajustes de encuadre** (f72, f296–342, f424–462) verificados con previsualizaciones.
10. **Render final v3** (600 × 4) + síntesis + mux + validación.
11. **Audio:** 3 iteraciones de mezcla (riser demasiado débil; sub poco audible en móvil; reequilibrio de intro y cierre), verificadas con espectrograma, forma de onda y EBU R128.

## 13. Errores detectados

1. Script de comparación del logotipo lanzado desde el directorio temporal: no resolvía `playwright-core` (`ERR_MODULE_NOT_FOUND`).
2. `render.mjs --preview ""` interpretaba la cadena vacía como "sin previsualización" y lanzó un render completo no deseado (se detuvo manualmente).
3. Curva `ease.camera` inicial mal formulada (detectada al revisar sus valores, antes de usarla).
4. En el sintetizador, el sub bajo se calculaba antes de que los kicks escribieran la envolvente de sidechain (detectado en revisión de código antes de la primera escucha analítica).
5. Niebla gris, filas que desaparecían, recortes de texto, tarjetas más oscuras que el dashboard en las escenas 1–2 (la sombra por distancia se aplicaba aunque estuvieran apoyadas).
6. **Parpadeo del calendario** (render v1): en f368 y f378–382 Chromium no dibujaba la placa, la cabecera ni las filas del calendario (sí los números de los días). Diferencia media entre fotogramas de 40–46 frente a ≈ 6–9 en los vecinos.
7. Riser de 7.5–8.5 s demasiado bajo (sonoridad momentánea −21 LUFS al inicio) y energía del sub concentrada en frecuencias que un móvil no reproduce.
8. Dashboard visible bajo el logotipo en f550.

## 14. Correcciones aplicadas

1. Scripts auxiliares movidos a `scripts/` dentro del proyecto.
2. Bandera `IS_PREVIEW` basada en la presencia de `--preview`.
3. `ease.camera` reemplazada por `cubic-bezier(0.6, 0, 0.12, 1)` resuelta numéricamente.
4. Los kicks se generan antes que el sub.
5. Niebla hacia Dark (0.86) también en botón CTA, día seleccionado y celdas del calendario; despliegue en acordeón; nuevos keyframes de cámara; sombreado por distancia de las tarjetas condicionado a su altura (`smoothstep(40, 160, z)`); tarjetas flotantes más cerca de cámara.
6. Parpadeo, en cuatro pasos medidos:
   a. Flags de composición determinista de Chromium (`--run-all-compositor-stages-before-draw`, etc.) → **sin efecto** (mismas diferencias). Se conservan por robustez.
   b. Capa compuesta estable para todas las hojas (`translateZ(0)`) → **sin efecto**; se conserva.
   c. Bisección ocultando grupos de elementos (`scripts/debug-sort.mjs`): el fallo desaparece al ocultar el módulo de atención → causa: planos casi paralelos (inclinación del calendario de −2.7°) en el árbol BSP de ordenamiento 3D de Chromium. Se eliminó la inclinación del calendario.
   d. Persistía en f376 por solapamiento casi coplanar (calendario a z ≈ 120–130 y módulo de atención a z = 120). Se separaron los niveles (calendario a z = 260) y se ocultan (`visibility: hidden`) las capas totalmente transparentes. Verificación: diferencias suaves en f340–f400 y, en el MP4 final, sólo dos picos aislados, ambos intencionados (f13 encendido de la línea, f508 destello de convergencia).
7. Envolvente del riser 0.15 + 0.85·u^1.3 y ganancia 0.62; sub con armónicos 0.8/0.42/0.16; paso-alto del máster a 32 Hz. Resultado: crescendo de −19.6 a −8.1 LUFS momentáneos entre 7.8 s y 8.5 s.
8. Fundido de la interfaz movido a f522–548.

## 15. Tiempo real de ejecución

- Inicio del trabajo (marca registrada en el contenedor): **2026-10-11 19:34:15 UTC**.
- Vídeo final validado: **2026-10-11 20:49–20:50 UTC**. Este documento se terminó a continuación; la hora exacta del commit final queda registrada en el historial de git.
- Duración total desde el inicio hasta el MP4 validado: **≈ 1 h 16 min** (incluye inspección, diseño, implementación, 4 tandas de previsualización, 3 renders completos, diagnóstico y documentación).
- Síntesis de audio: 1.2 s reales (medido con `time` en la primera ejecución); `finalize.sh` completo (síntesis + mux + ffprobe + decodificación): **6.5 s** reales.

## 16. Tiempo real de renderizado

Máquina: 4 vCPU Intel Xeon 2.10 GHz, sin GPU (rasterizado por software de Chromium).

| Render | Configuración | Captura | Codificación | Total (reloj) |
|---|---|---|---|---|
| v1 | 600 fotogramas, sin motion blur, 4 páginas | 342.9 s | 32.5 s | 6 min 16.2 s |
| v2 | 600 × 4 sub-fotogramas (2 400 capturas) | 1 021.4 s | 42.0 s | 17 min 44.1 s |
| **v3 (final)** | 600 × 4 sub-fotogramas (2 400 capturas) | **1 010.3 s** | **41.8 s** | **17 min 33.0 s** (20:31:58 → 20:49:31 UTC) |

Las previsualizaciones de fotogramas sueltos tardaron entre 4.8 s y 34.7 s por tanda según la consola de cada ejecución (≈ 0.6–2.2 s por fotograma PNG).

## 17. Validación técnica (medida sobre `LITIVO_CINEMATIC_10S.mp4`)

| Comprobación | Resultado |
|---|---|
| Contenedor | MP4 (`mov,mp4,m4a,3gp,3g2,mj2`), `faststart`, 11 278 870 bytes, 9.02 Mb/s |
| Vídeo | H.264 High, 1080 × 1920, yuv420p, `r_frame_rate = 60/1`, `avg_frame_rate = 60/1` |
| Fotogramas | **600** (contados decodificando, `-count_frames`) |
| Duración | 10.000000 s (formato, vídeo y audio) |
| Audio | AAC-LC, 48 000 Hz, estéreo, 265.9 kb/s |
| Pistas | 1 de vídeo + 1 de audio |
| Decodificación completa | sin errores (`ffmpeg -v error -f null`) |
| Continuidad | diferencia media entre fotogramas: mediana 2.27, máx. 16.9 (sobre 255, a 270 × 480); picos aislados sólo en f13 y f508 (intencionados) |
| Sonoridad | −11.5 LUFS integrados, LRA 2.7 LU, pico −0.7 dBFS |
| Sincronía | desfase medio 11.5 ms, máximo 24.0 ms (§10) |
| Determinismo | MD5 idénticos en renders y síntesis repetidos (§4) |

Nota: al decodificar el AAC se obtienen 480 256 muestras (256 de relleno del codificador al final); la duración declarada de la pista es 10.000 s.

## 18. Rutas de los archivos

| Archivo | Ruta |
|---|---|
| Vídeo final | `/home/user/Pruebas-claude/LITIVO_CINEMATIC_10S.mp4` |
| Documentación | `/home/user/Pruebas-claude/DECISIONES.md` |
| Código de la escena | `src/scene.html`, `src/scene.css`, `src/scene.js`, `src/timeline.js` |
| Logotipo vectorial | `src/logo.svg` |
| Tipografía | `src/fonts/` (Inter Tight, OFL) |
| Render, audio, validación | `scripts/render.mjs`, `scripts/audio.mjs`, `scripts/finalize.sh`, `scripts/verify_sync.py` |
| Capturas de referencia | `reference/` |
| Rama | `claude/litivo-cinematic-motion-j20tu2` en `carojcd/Pruebas-claude` |

Los artefactos intermedios (`build/`: 2 400 sub-fotogramas, WAV, previsualizaciones, registros) no se versionan; se regeneran con los comandos de §4.
