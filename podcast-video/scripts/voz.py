"""Voz editada: concatena los tramos de edit.json (fundidos de 6 ms en cada unión) y normaliza
a −14 LUFS / pico real máx. −2 dBTP (loudnorm de 2 pasadas + limitador).
Uso: python3 scripts/voz.py fuentes/clip.mp4 src/data/edit.json public/voz.wav [LUFS=-14] [TP=-2]
"""
import json, subprocess, sys
src, edit, out = sys.argv[1:4]
I = sys.argv[4] if len(sys.argv) > 4 else "-14"
TP = sys.argv[5] if len(sys.argv) > 5 else "-2"
e = json.load(open(edit)); FPS = e["fps"]; F = 0.006
parts, labels = [], []
for k, s in enumerate(e["segments"]):
    a, b = s["srcStartFrame"] / FPS, s["srcEndFrame"] / FPS
    parts.append(f"[0:a]atrim={a}:{b},asetpts=PTS-STARTPTS,afade=t=in:d={F},afade=t=out:st={b - a - F}:d={F}[a{k}]")
    labels.append(f"[a{k}]")
fc = ";".join(parts) + ";" + "".join(labels) + f"concat=n={len(labels)}:v=0:a=1[voz]"
base = ["ffmpeg", "-v", "error", "-y", "-i", src, "-filter_complex", fc, "-map", "[voz]", "-ac", "2", "-ar", "48000"]
subprocess.run(base + ["/tmp/claude-0/voz_raw.wav"], check=True)
r = subprocess.run(["ffmpeg", "-nostats", "-i", "/tmp/claude-0/voz_raw.wav", "-af", f"loudnorm=I={I}:TP={TP}:LRA=11:print_format=json", "-f", "null", "-"], capture_output=True, text=True).stderr
m = json.loads(r[r.rindex("{"):])
af = (f"loudnorm=I={I}:TP={TP}:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}"
      f":measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true,alimiter=limit={10 ** ((float(TP) - 0.3) / 20):.4f}:level=disabled")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", "/tmp/claude-0/voz_raw.wav", "-af", af, "-ar", "48000", out], check=True)
print("voz →", out, "| entrada", m["input_i"], "LUFS")
