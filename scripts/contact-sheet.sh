#!/usr/bin/env bash
# Hoja de contactos de fotogramas de previsualización: contact-sheet.sh salida.png f1 f2 ... (12 máx.)
set -e
out=$1; shift
n=$#; ins=(); fc=""; i=0; lay=""
for f in "$@"; do ins+=(-i "build/preview/f$(printf %03d $f).png"); fc+="[$i]scale=270:480,drawtext=fontfile=src/fonts/inter-tight-latin-600-normal.woff2:text='f$f':x=8:y=8:fontsize=22:fontcolor=white:box=1:boxcolor=black@0.5[s$i];"; x=$(( (i%6)*270 )); y=$(( (i/6)*480 )); lay+="${x}_${y}|"; i=$((i+1)); done
for j in $(seq 0 $((n-1))); do fc+="[s$j]"; done
fc+="xstack=inputs=$n:layout=${lay%|}"
ffmpeg -y -v error "${ins[@]}" -filter_complex "$fc" "$out"
