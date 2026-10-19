#!/usr/bin/env bash
# Genera el kit portátil (sin node_modules, sin vídeos del usuario) para usarlo en otra cuenta/chat.
# Uso: bash scripts/empaquetar.sh <salida.zip>
set -euo pipefail
out="$(realpath -m "$1")"
cd "$(dirname "$0")/../.."
rm -f "$out"
zip -qr "$out" congresos-video \
  -x "congresos-video/node_modules/*" "congresos-video/.venv/*" "congresos-video/out/*" \
     "congresos-video/analisis/*" "congresos-video/fuentes/*" \
     "congresos-video/public/mi-video.mp4" "congresos-video/public/mi-video-norm.mp4" \
     "congresos-video/BORRADOR_*.mp4" "congresos-video/README.md"
ls -la "$out"
