#!/usr/bin/env bash
# Pauta Brilla – Seguro de Mascotas "Michi, la vida número 7" (Surtigas)
# Uso: ./render.sh            -> salida/brilla_michi_9x16.mp4
# Si existen voz/l1.wav … voz/l5.wav se mezclan con la música original (con ducking);
# si no, se renderiza una vista previa solo con la música.
set -euo pipefail
cd "$(dirname "$0")"

A=assets
FONT=$A/Boldonse-Regular.ttf
OUT=salida/brilla_michi_9x16.mp4
W=1080; H=1920
FOOT_H=291        # footer 1097x295 escalado a 1080 de ancho
DUR=14.04

# Inicio (s) y espacio máximo (s) de cada frase de voz
VO_START=(0.25 3.40 6.10 8.60 11.10)
VO_SLOT=(3.10 2.60 2.40 2.40 2.90)

# --- Textos (inicio, fin, línea, color, tamaño, y) ---
txt() { # $1 inicio $2 fin $3 texto $4 color $5 tamaño $6 y
  local a=$1 b=$2
  printf "drawtext=fontfile=%s:text='%s':fontcolor=%s:fontsize=%s:borderw=9:bordercolor=black@0.9:shadowx=0:shadowy=10:shadowcolor=black@0.45:x=(w-text_w)/2:y=%s-28*max(0\\,1-(t-%s)/0.18):alpha='if(lt(t,%s),0,if(lt(t,%s+0.12),(t-%s)/0.12,if(gt(t,%s-0.12),max(0,(%s-t)/0.12),1)))':enable='between(t,%s,%s)'," \
    "$FONT" "$3" "$4" "$5" "$6" "$a" "$a" "$a" "$a" "$b" "$b" "$a" "$b"
}
TXT=""
TXT+=$(txt 0.30 3.30 "MICHI TIENE"   white   78 250)
TXT+=$(txt 0.55 3.30 "7 VIDAS"       0xFFC20E 150 395)
TXT+=$(txt 3.40 6.00 "YA GASTÓ"      white   78 250)
TXT+=$(txt 3.60 6.00 "6 VIDAS"       0xFFC20E 150 395)
TXT+=$(txt 6.10 8.45 "¡NO LO"        white   110 260)
TXT+=$(txt 6.25 8.45 "HAGAS!"        0xE4002B 150 440)
TXT+=$(txt 8.50 10.95 "¡MICHIII!"    0xFFC20E 130 300)
TXT+=$(txt 11.00 $DUR "SU ÚLTIMA VIDA" white  74 240)
TXT+=$(txt 11.20 $DUR "VA ASEGURADA" 0xFFC20E 96 385)
TXT=${TXT%,}

# Badge de precio: entra con rebote a los 11.6 s, encima del footer
PRICE_W=640
PRICE_Y=$((H - FOOT_H - 210))

VF="[0:v]scale=${W}:${H}:flags=lanczos,setsar=1,${TXT}[v1];
[1:v]scale=${W}:-1[foot];
[v1][foot]overlay=0:H-h[v2];
[2:v]scale=${PRICE_W}:-1,format=rgba,fade=in:st=11.6:d=0.15:alpha=1[pr];
[v2][pr]overlay=x=(W-w)/2:y='${PRICE_Y}+60*exp(-(t-11.6)*7)*cos((t-11.6)*22)':enable='gte(t,11.6)'[vout]"

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

ffmpeg -y -v error -i $A/video.mp4 -loop 1 -i $A/footer.png -loop 1 -i $A/precio.png "${INPUTS[@]}" \
  -filter_complex "$VF;$AF" -map "[vout]" -map "[aout]" -t $DUR \
  -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -r 24 -c:a aac -b:a 192k -movflags +faststart "$OUT"
echo "OK -> $OUT"
