#!/usr/bin/env bash
# Sintetiza la banda sonora, la une al vídeo renderizado y valida el MP4 final.
set -euo pipefail
cd "$(dirname "$0")/.."
OUT=LITIVO_CINEMATIC_10S.mp4
node scripts/audio.mjs
ffmpeg -y -v error -i build/video_noaudio.mp4 -i build/soundtrack.wav -map 0:v:0 -map 1:a:0 \
  -c:v copy -c:a aac -b:a 256k -ar 48000 -movflags +faststart "$OUT"
echo "== ffprobe =="
ffprobe -v error -count_frames -show_entries stream=index,codec_type,codec_name,profile,width,height,pix_fmt,r_frame_rate,avg_frame_rate,nb_read_frames,sample_rate,channels,duration,bit_rate -show_entries format=duration,size,bit_rate,format_name -of default=noprint_wrappers=0 "$OUT"
echo "== decodificación completa (errores) =="
ffmpeg -v error -i "$OUT" -f null - && echo "sin errores de decodificación"
