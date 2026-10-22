# Remotion Studio

Espacio para animar distintas piezas con código (React + Remotion 4).

## Estructura
- `src/Root.tsx`: registro de composiciones (id, duración, fps, resolución).
- `src/pieces/<nombre>/`: una carpeta por pieza.
- `public/`: imágenes, audio y fuentes (se usan con `staticFile('archivo.png')`).
- `out/`: videos renderizados (no se suben a git).

## Comandos
```
npx remotion render src/index.ts <id> out/<id>.mp4   # render a MP4
npx remotion still  src/index.ts <id> out/<id>.png --frame=30   # un fotograma
npm run studio                                            # vista previa interactiva
```

## Notas
- `remotion.config.ts` apunta al `headless_shell` que ya trae el entorno (no descarga navegador).
- Para audio: `<Audio src={staticFile('x.wav')} />`. Se pueden generar sonidos con Python/numpy como en `glow-poll/audio.py`.
- Piezas anteriores (sin Remotion): `glow-poll/` (tarjetas Premiere) y `bar-neon/` (hombre fumando).
