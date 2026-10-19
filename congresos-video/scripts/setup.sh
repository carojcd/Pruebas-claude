#!/usr/bin/env bash
# Prepara el entorno de edición en una sesión nueva. Idempotente: solo instala lo que falta.
# Uso: bash scripts/setup.sh
set -euo pipefail
cd "$(dirname "$0")/.."
MODELS="${WHISPER_MODELS:-$HOME/.cache/whisper-models}"

mkdir -p analisis/mio out public

# 1) Dependencias de Node (Remotion, transformers.js, DM Sans)
[ -d node_modules ] || npm ci --no-audit --no-fund

# 2) Modelo Whisper small multilingüe (ONNX q8) desde npm: Hugging Face está bloqueado en este entorno
if [ ! -f "$MODELS/Xenova/whisper-small/onnx/decoder_model_merged_quantized.onnx" ]; then
  tmp="$(mktemp -d)"
  (cd "$tmp" && npm pack sts-whisper-small@1.0.0 --silent >/dev/null && tar xzf sts-whisper-small-1.0.0.tgz)
  mkdir -p "$MODELS"
  cp -r "$tmp/package/models/." "$MODELS/"
fi

# 3) Python para el corte de silencios y los efectos de sonido
[ -x .venv/bin/python ] || python3 -m venv .venv
.venv/bin/python -c "import numpy" 2>/dev/null || .venv/bin/pip install -q numpy

# 4) Herramientas del sistema
command -v ffmpeg >/dev/null || { echo "Falta ffmpeg"; exit 1; }
node -e 'import("./scripts/browser.mjs").then(m=>{const b=m.findBrowser(); console.log("Chromium:", b ?? "el de Remotion (se descarga solo en el primer render)")})'
echo "Whisper: $MODELS"
echo "LISTO"
