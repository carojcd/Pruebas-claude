#!/usr/bin/env bash
# Verificación compacta del render final. Uso: scripts/verify.sh out/X.mp4 [palabras-render.json]
set -euo pipefail
F=$1
echo "FORMATO: $(ffprobe -v error -select_streams v -show_entries stream=codec_name,width,height,r_frame_rate,pix_fmt -of csv=p=0 "$F") | $(ffprobe -v error -show_entries format=duration -of csv=p=0 "$F") s"
ffmpeg -nostats -i "$F" -af ebur128=peak=true -f null - 2>&1 | grep -A14 Summary | grep -E "I:|Peak:" | tr -s ' ' | tr '\n' ' '; echo
THR=$(python3 -c "import json;print(open('src/data/thr.txt').read().strip())")
echo "SILENCIOS >0,3 s (umbral ${THR} dB): $(ffmpeg -nostats -i "$F" -af silencedetect=n=${THR}dB:d=0.3 -f null - 2>&1 | grep -c silence_start)"
if [ -n "${2:-}" ]; then python3 scripts/sync_check.py src/data/edit.json "$2" | grep -E "emparejadas|desfase|^ *[0-9]+ .* [+-][0-9]{3,} ms"; fi
