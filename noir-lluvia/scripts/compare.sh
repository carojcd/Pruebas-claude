#!/bin/sh
# Hoja comparativa: viñeta de referencia (izquierda) junto al fotograma renderizado (derecha)
# Uso: scripts/compare.sh <dirStills> <salida.jpg> <panel>:<fotograma> ...
dir=$1; out=$2; shift 2
args=""; filt=""; i=0
for pair in "$@"; do
  p=${pair%%:*}; f=${pair##*:}
  args="$args -i referencia/p$p.png -i $dir/f_$(printf %04d $f).png"
  filt="$filt[$((i*2))]scale=-1:640[r$i];[$((i*2+1))]scale=-1:640[o$i];"
  i=$((i+1))
done
stack=""; for k in $(seq 0 $((i-1))); do stack="$stack[r$k][o$k]"; done
ffmpeg -v error -y $args -filter_complex "${filt}${stack}hstack=$((i*2))" "$out"
