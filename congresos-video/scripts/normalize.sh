#!/usr/bin/env bash
# Normaliza la voz a -14 LUFS (pico -3 dBTP, limitador) en dos pasadas, sin recomprimir el vídeo.
# Uso: bash scripts/normalize.sh public/mi-video.mp4 public/mi-video-norm.mp4
set -euo pipefail
in="$1"; out="$2"
F="highpass=f=80,loudnorm=I=-14:TP=-3:LRA=11"
J=$(ffmpeg -hide_banner -i "$in" -af "$F:print_format=json" -f null - 2>&1 | sed -n '/^{/,/^}/p')
M=$(echo "$J" | python3 -c "import json,sys;d=json.load(sys.stdin);print(f\"measured_I={d['input_i']}:measured_TP={d['input_tp']}:measured_LRA={d['input_lra']}:measured_thresh={d['input_thresh']}:offset={d['target_offset']}\")")
ffmpeg -v error -y -i "$in" -c:v copy -af "$F:$M,alimiter=limit=0.63:level=disabled,aresample=48000" -c:a aac -b:a 192k "$out"
ffmpeg -hide_banner -i "$out" -af ebur128=peak=true -f null - 2>&1 | grep -A14 Summary | grep -E "I:|Peak:"
