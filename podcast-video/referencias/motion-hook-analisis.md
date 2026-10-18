# Referencia «talking head + tarjetas de motion graphics» (analizada 2026-10-18)

Fuente: vídeo de Pinterest (720×1280, 30 fps, 37,8 s, inglés, voz −15,4 LUFS, LRA 5,8 LU). Medido con ffmpeg (detección de escena, fotogramas a 2 fps, ebur128) y Whisper. Tiempos ±0,5 s.
Lo no medible con certeza va marcado **[SUPOSICIÓN]**. Esto NO es el estilo actual (`estilo-podcast.md` prohíbe tarjetas a pantalla completa); sería un estilo opcional nuevo.

## Estructura (37,8 s)
| t (s) | Contenido |
|---|---|
| 0–6,7 | Tarjeta oscura A: tipografía cinética que sigue la voz («if you're still doing outreach as a video editor, you're falling behind» / «in 2025 cold outreach is dead!») |
| 6,7–8,0 | Ponente («let me tell you why») |
| 8,0–11,0 | Tarjeta oscura B («thousands of editors… the same MESSAGE»), cursor de ratón, destello de lente |
| 11,0–14,1 | Tarjeta crema: círculo negro con globos de chat azules que aparecen uno a uno |
| 14,1–16,5 | Ponente |
| 16,5–17,9 | Tarjeta crema 2 («you're just ONE MORE», formas recortadas gigantes) |
| 17,9–36,0 | Ponente continuo con subtítulos; 4 destellos de luz (14,1 / 18,2 / ≈21,5 / ≈25,2 s) |
| 36,0–37,8 | Cierre: vídeo reducido en un panel + «comment “2025”» enorme sobre negro |
- Tarjetas = 14,2 s (**37 %** del vídeo) + cierre 1,8 s (5 %), todas en los primeros 18 s (el gancho). La voz continúa bajo las tarjetas.
- Transiciones: corte seco + destello/light-leak azul-violeta o blanco-rosa (≈ 0,2–0,3 s). 12 cortes en total.

## Subtítulos sobre el ponente
Izquierda, alineados a la izquierda, y ≈ 55–60 % de la altura; 2 líneas de 1–3 palabras; blanco, grotesca condensada con tracking muy cerrado (≈ −4 %), minúsculas (incluso «i created»), ≈ 60 px a 1080 de ancho [SUPOSICIÓN], aparición palabra a palabra con fundido/desenfoque. **Sin palabra clave de color** sobre el ponente.

## Tarjetas
- **Oscura (A/B):** fondo #05070D–#0B1220, texto beige cálido (≈ #E9D9B5) o blanco, líneas ámbar/naranja brillantes que se dibujan, UI falsa (campo «Hey, I'm a vide…», cursor), destellos de lente, grano y polvo, ojos amarillos brillantes en la oscuridad (imagen 3D/stock).
- **Crema:** fondo ≈ #FBF3D6, trazos gruesos rojo-naranja ≈ #E8412A y finos ámbar, círculo negro con globos tipo iMessage (azul ≈ #3B9BFF), texto negro; palabras clave en azul condensado cursiva MAYÚSCULAS («ONE MORE», «MESSAGE»).
- **Marco HUD** en ambas: marcas de regla, texto vertical «456 JK / 789 O», puntos y esquinas.

## Qué se puede reproducir con código (Remotion)
Tipografía cinética sincronizada con las palabras (tenemos tiempos por palabra), líneas que se dibujan (SVG), globos de chat, cursor, marco HUD, círculos/recortes, destellos de luz, grano, zoom/desenfoque, panel de cierre. ≈ 80–85 % del look.
**No** sin materiales: ojos 3D en la oscuridad, destellos de lente reales, texturas de papel/halftone. Se aproximan con degradados, desenfoque y grano; para igualarlo 1:1 harían falta overlays (light leaks, grano, papel).

## Implicaciones
- Se construye **un kit una vez** (tarjeta oscura, tarjeta crema, light-leak, cierre) y luego cada clip solo elige plantilla y texto; lo caro es el kit, no cada clip.
- Cada tarjeta con ilustración concreta (p. ej. los globos de chat) es específica del guion: no se automatiza del todo.
- Chocaría con la regla actual de «solo vídeo»: habría que crear `estilo-motion.md` como variante opcional.
