#!/usr/bin/env bash
# Pauta Brilla – Seguro de Mascotas "Michi, la vida número 7" (Surtigas)
# Versión 2: texto fijo tipo meme en Montserrat.
# Uso: ./render_v2.sh         -> salida/brilla_michi_v2_texto_fijo_9x16.mp4
# Si existen voz/l1.wav … voz/l5.wav se mezclan con la música original (con ducking);
# si no, se renderiza una vista previa solo con la música.
set -euo pipefail
cd "$(dirname "$0")"

A=assets
FONT=$A/Boldonse-Regular.ttf
OUT=salida/brilla_michi_v2_texto_fijo_9x16.mp4
W=1080; H=1920
FOOT_H=291        # footer 1097x295 escalado a 1080 de ancho
DUR=14.04

# Inicio (s) y espacio máximo (s) de cada frase de voz
VO_START=(0.25 3.40 6.10 8.60 11.10)
VO_SLOT=(3.10 2.60 2.40 2.40 2.90)

# --- Texto fijo (Montserrat), centrado arriba, con degradado suave para legibilidad ---
M7=$A/Montserrat-700.ttf; M8=$A/Montserrat-800.ttf
line() { # $1 fuente $2 texto $3 color $4 tamaño $5 y
  printf "drawtext=fontfile=%s:text='%s':fontcolor=%s:fontsize=%s:shadowx=0:shadowy=3:shadowcolor=black@0.55:borderw=2:bordercolor=black@0.25:x=(w-text_w)/2:y=%s:alpha='min(1,t/0.4)'," "$1" "$2" "$3" "$4" "$5"
}
TXT="[v0]"
TXT+=$(line $M7 "Mi gato cuando se enteró"      white    50 150)
TXT+=$(line $M7 "que estaba asegurado con el"   white    50 214)
TXT+=$(line $M8 "seguro para mascotas de Brilla" 0xFFC20E 52 284)
TXT=${TXT%,}

# Tarjeta de precio: entra con rebote a los 11.6 s, debajo del texto fijo
PRICE_W=560
PRICE_Y=372   # justo debajo del texto fijo

VF="[0:v]scale=${W}:${H}:flags=lanczos,setsar=1[v00];
color=black:s=${W}x520:d=${DUR},format=rgba,geq=r=0:g=0:b=0:a='150*pow(1-Y/520\\,1.6)'[grad];
[v00][grad]overlay=0:0[v0];
${TXT}[v1];
[1:v]scale=${W}:-1[foot];
[v1][foot]overlay=0:H-h[v2];
[2:v]scale=${PRICE_W}:-1,format=rgba,fade=in:st=11.6:d=0.15:alpha=1[pr];
[v2][pr]overlay=x=(W-w)/2:y='${PRICE_Y}+30*exp(-(t-11.6)*7)*cos((t-11.6)*22)':enable='gte(t,11.6)'[vout]"

if ls voz/l1.wav >/dev/null 2>&1; then
  INPUTS=(); AF=""; MIX=""
  for i in 1 2 3 4 5; do
    f=voz/l$i.wav; idx=$((i+2)); k=$((i-1))
    d=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$f")
    tempo=$(python3 -c "print(max(1.0,min(1.35,$d/${VO_SLOT[$k]})))")
    ms=$(python3 -c "print(int(${VO_START[$k]}*1000))")
    INPUTS+=(-i "$f")
    AF+="[$idx:a]silenceremove=start_periods=1:start_threshold=-45dB,aresample=48000,atempo=$tempo,volume=1.6,adelay=${ms}|${ms}[vo$i];"
    MIX+="[vo$i]"
  done
  AF+="${MIX}amix=inputs=5:normalize=0,apad[vo];[vo]asplit[voA][voB];"
  AF+="[0:a]aresample=48000,volume=0.9[mus];[mus][voA]sidechaincompress=threshold=0.03:ratio=8:attack=20:release=300[duck];"
  AF+="[duck][voB]amix=inputs=2:normalize=0,alimiter=limit=0.95,atrim=0:${DUR}[aout]"
else
  INPUTS=(); AF="[0:a]anull[aout]"
fi

ffmpeg -y -v error -i $A/video.mp4 -loop 1 -i $A/footer.png -loop 1 -i $A/precio_17640.png "${INPUTS[@]}" \
  -filter_complex "$VF;$AF" -map "[vout]" -map "[aout]" -t $DUR \
  -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -r 24 -c:a aac -b:a 192k -movflags +faststart "$OUT"
echo "OK -> $OUT"
