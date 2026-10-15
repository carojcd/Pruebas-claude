#!/usr/bin/env bash
# Pipeline de un clip de podcast. Datos por clip en clips/<nombre>/; el clip "activo" se copia a src/data y public.
#   scripts/clip.sh prep  <nombre> <entrada.mp4>   30 fps + Whisper → clips/<n>/palabras.json (+ transcripción numerada)
#   scripts/clip.sh edit  <nombre>                 corrige texto, corta silencios (umbral auto), borrador de bloques
#   scripts/clip.sh build <nombre>                 voz, sfx, plan, render, master −14 LUFS y verificación (con sincronía)
set -euo pipefail
cd "$(dirname "$0")/.."
CMD=${1:?prep|edit|build}; N=${2:?nombre}; D=clips/$N; mkdir -p "$D"
MODELS=${WHISPER_MODELS:-/tmp/claude-0/w/package/models}
act() { cp "$D"/{edit,blocks,face}.json src/data/; }
case $CMD in
prep)
  IN=${3:?entrada.mp4}; [ "$IN" -ef "fuentes/$N.mp4" ] || cp "$IN" "fuentes/$N.mp4"
  ffmpeg -v error -y -i "fuentes/$N.mp4" -vf fps=30 -c:v libx264 -crf 14 -preset fast -g 30 -c:a aac -b:a 192k public/clip-norm.mp4
  if [ ! -d "$MODELS/Xenova" ]; then
    T=$(mktemp -d); (cd "$T" && npm pack sts-whisper-small >/dev/null 2>&1 && tar xzf sts-whisper-small-*.tgz); mkdir -p "$MODELS"; cp -r "$T"/package/models/* "$MODELS"/
  fi
  node scripts/transcribe.mjs "fuentes/$N.mp4" "$D/palabras.json" "$MODELS" spanish | tail -1
  python3 -c "
import json;[print(i,w['text'].strip(),end=' | ') for i,w in enumerate(json.load(open('$D/palabras.json')))];print()"
  [ -f "$D/correcciones.json" ] || echo '{"texto": {}, "fusionar": []}' > "$D/correcciones.json"
  [ -f "$D/face.json" ] || echo '{"zoomOriginX": 0.5, "zoomOriginY": null, "mouth": [[0, 0.40]], "captionOffset": 0.17}' > "$D/face.json"
  echo ">> Revisa $D/correcciones.json (texto mal oído) y $D/face.json (posición de la boca), luego: scripts/clip.sh edit $N" ;;
edit)
  python3 scripts/fix_words.py "$D/palabras.json" "$D/correcciones.json" "$D/palabras-ok.json"
  python3 scripts/build_edit.py public/clip-norm.mp4 "$D/palabras-ok.json" "$D/edit.json"
  cp "$D/thr.txt" src/data/thr.txt
  [ -f "$D/blocks.json" ] || python3 scripts/auto_blocks.py "$D/edit.json" "$D/blocks.json"
  python3 -c "
import json;e=json.load(open('$D/edit.json'));b=json.load(open('$D/blocks.json'))
W=e['words']
for k,x in enumerate(b['blocks']): print(k+1,' / '.join(' '.join(W[i]['text'].strip() for i in l) for l in x['lines']),'| clave:',W[x['key']]['text'].strip(),x.get('emoji',''))
print('punchWord',b['punchWord'],W[b['punchWord']]['text'].strip())"
  echo ">> Edita $D/blocks.json si hace falta (emojis, claves, punchWord) y: scripts/clip.sh build $N" ;;
build)
  act; cp "$D/thr.txt" src/data/thr.txt
  python3 scripts/voz.py "fuentes/$N.mp4" src/data/edit.json public/voz.wav | tail -1
  python3 scripts/plan.py src/data/edit.json src/data/blocks.json src/data/plan.json | head -1
  DUR=$(python3 -c "import json;print(json.load(open('src/data/plan.json'))['durationInFrames']/30+2)")
  [ -f public/sfx/pop.wav ] && [ "$(ffprobe -v error -show_entries format=duration -of csv=p=0 public/sfx/musica.wav | cut -d. -f1)" -ge "${DUR%.*}" ] || python3 scripts/sfx.py public/sfx "$DUR"
  cp src/data/plan.json "$D/"
  scripts/export.sh "out/PODCAST_$N.mp4" 2>&1 | grep -E "^OK|rror"
  node scripts/transcribe.mjs "out/PODCAST_$N.mp4" "$D/render-palabras.json" "$MODELS" spanish >/dev/null
  scripts/verify.sh "out/PODCAST_$N.mp4" "$D/render-palabras.json"
  mkdir -p entregas && cp "out/PODCAST_$N.mp4" "entregas/PODCAST_$N.mp4" ;;
esac
