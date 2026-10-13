# Prompt maestro — Animaciones de tarjetas UI flotantes (estilo LITIVO)

Copia el bloque, rellena los campos entre [corchetes] y adjunta la captura de la tarjeta.

---

```
Actúa como director de arte y motion designer. Crea una animación de [6] segundos de la tarjeta/interfaz que adjunto, reconstruida 100 % con código (HTML/CSS/SVG + JS), sin animar la captura como imagen.

FORMATO
- Vídeo MP4 H.264, [1080×1920 (9:16)], 60 fps, exactamente [360] fotogramas y [6.000] s.
- [Sin audio] / [Con sonido sutil sintetizado por código: toques suaves por cada grupo de componentes, sin samples].
- Guarda el resultado como [carpeta/NOMBRE_6S.mp4].

IDENTIDAD VISUAL
- Fondo Dark #19292C con degradados radiales Teal suaves, halo central Aqua y arcos concéntricos finos arriba y abajo (derivados del isotipo), viñeta sutil.
- Paleta: Aqua #63C2C8, Teal #3E9891, Dark #19292C, Blanco #FFFFFF, Aqua Light #DCF6F3, Off-white #F5FAFA, Bordes #DDE2E5. [Colores extra solo si la tarjeta los usa].
- Tipografía Inter Tight (archivos locales). Conserva textos, cifras, iconos, radios y jerarquía exactos de la captura; iconos lineales redibujados en SVG.

ESCENA Y CÁMARA
- La tarjeta flota en perspectiva CSS 3D (perspective ≈1500px): llega desde la profundidad (≈0–1.8 s, desaceleración outQuint), inclinada ~15° en X y ~20° en Y, y deriva muy lentamente hasta el final. Sin giros bruscos ni zoom permanente.
- Encuadre fijo para toda la serie; solo ajusta la escala para que la tarjeta quepa con margen (nada recortado en ningún fotograma).

RESPLANDOR AQUA (borde)
- Capas: línea de borde Aqua 2px + sombras difusas Aqua/Teal + halo detrás de la tarjeta + un brillo que recorre el contorno (conic-gradient enmascarado) al entrar y al final. Elegante, nunca saturado.

COREOGRAFÍA POR CAPAS
- Divide la tarjeta en componentes (encabezado, bloques, filas, iconos, botones, chips…). Cada uno entra escalonado (stagger 5–24 fotogramas) con opacidad + desplazamiento corto (8–24 px) + profundidad propia (translateZ), dejando ver de qué se compone.
- Detalles vivos cuando aplique: cifras que cuentan, barras que se llenan, líneas que se dibujan, iconos con pequeño pop.
- ≈3.9–4.6 s: todas las capas se reúnen en una tarjeta plana con un pulso de luz.
- ≈5.0 s: cierre con una micro-acción (resaltar el botón/opción principal o avanzar una flecha). Sin fundido a negro; el último fotograma queda limpio.

TÉCNICA (determinista)
- Todo el estado se calcula desde el número de fotograma (window.renderFrame(f)); sin setTimeout, requestAnimationFrame, animaciones CSS ni aleatoriedad sin semilla.
- Render con Chromium headless fotograma a fotograma, motion blur por 4 sub-fotogramas promediados, codificación con FFmpeg.
- Evita planos casi coplanares que se solapen (Chromium los ordena mal): separa las profundidades de las capas.

AHORRO DE TOKENS
- Reutiliza la base de un proyecto anterior (render, fondo, resplandor, cámara) y cambia solo el contenido y los tiempos.
- Una sola comprobación visual (un fotograma intermedio + el final) y un solo render salvo error.

VERIFICACIÓN Y ENTREGA
- Verifica con ffprobe: resolución, 60 fps, nº de fotogramas y duración exacta.
- Entrega el MP4 y un resumen breve de lo que se ve; sube el proyecto al repositorio.
```

---

**Variables rápidas**

| Campo | Ejemplos |
|---|---|
| Duración | 5 s = 300 fotogramas · 6 s = 360 · 8 s = 480 · 10 s = 600 |
| Formato | 9:16 = 1080×1920 · 16:9 = 1920×1080 · 1:1 = 1080×1080 |
| Audio | Sin audio · Sonido sutil · Teclas (si hay escritura) |
| Cierre | Resaltar botón · Flecha que avanza · Fila seleccionada · Ninguno |

Referencias en este repositorio: `buscador/` (escritura + teclas), `calendario/` (8 s con sonido), `proceso/`, `tabla/`, `reportes/`, `notificaciones/`, `audiencias/` (6 s), `LITIVO_FONDO_9x16.png` (fondo).
