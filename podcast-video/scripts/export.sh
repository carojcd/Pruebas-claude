#!/usr/bin/env bash
# Render + masterización de audio final (−14 LUFS / −2 dBTP) sin recodificar el vídeo.
# Uso: scripts/export.sh out/PODCAST_borrador.mp4
set -euo pipefail
OUT=${1:-out/PODCAST_borrador.mp4}; RAW=out/_raw.mp4
mkdir -p out
npx remotion render Podcast "$RAW" --codec h264 --crf 18 --pixel-format yuv420p --color-space bt709 --audio-codec aac --audio-bitrate 192k >/dev/null
J=$(ffmpeg -nostats -i "$RAW" -af loudnorm=I=-14:TP=-2:LRA=11:print_format=json -f null - 2>&1)
g() { echo "$J" | python3 -c "import sys,json;t=sys.stdin.read();print(json.loads(t[t.rindex('{'):])['$1'])"; }
ffmpeg -v error -y -i "$RAW" -c:v copy -af "loudnorm=I=-14:TP=-2:LRA=11:measured_I=$(g input_i):measured_TP=$(g input_tp):measured_LRA=$(g input_lra):measured_thresh=$(g input_thresh):offset=$(g target_offset):linear=true,alimiter=limit=0.7586:level=disabled" -ar 48000 -c:a aac -b:a 192k -shortest -movflags +faststart "$OUT"
echo "OK → $OUT"
