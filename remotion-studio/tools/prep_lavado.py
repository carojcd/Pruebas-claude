"""Prepara los clips 9:16 (1080x1920, 30 fps) de la pieza 'lavado'.
 v1 y v3: ya son verticales -> ajuste Lanczos + nitidez.   v2: 16:9 -> recorte vertical con seguimiento de cámara.
 Audio: filtro de ruido, normalización de volumen. Uso: python3 prep_lavado.py <dir_origen> <dir_salida>"""
import sys, json, subprocess, numpy as np, cv2, os
SRC, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)
AF = 'highpass=f=90,afftdn=nr=10:nf=-45,loudnorm=I=-16:TP=-1.5:LRA=9'
CUTS = {1: (0.2, 19.8), 2: (0.0, 58.3), 3: (1.8, 53.8)}      # segundos de cada original que se conservan
W, H, FPS = 1080, 1920, 30

def audio(n):
    a, b = CUTS[n]; wav = f'{OUT}/a{n}.wav'
    subprocess.run(['ffmpeg','-v','error','-y','-ss',str(a),'-t',str(b-a),'-i',f'{SRC}/v{n}.mp4','-vn','-af',AF,'-ar','48000','-ac','2',wav],check=True); return wav
def mux(n, vid):
    wav = f'{OUT}/a{n}.wav'
    subprocess.run(['ffmpeg','-v','error','-y','-i',vid,'-i',wav,'-c:v','copy','-c:a','aac','-b:a','192k','-shortest','-movflags','+faststart',f'{OUT}/p{n}.mp4'],check=True); os.remove(vid)

ONLY = [int(x) for x in os.environ.get('ONLY', '').split(',') if x]   # p. ej. ONLY=2 para rehacer solo el video 2
for n in (1, 3):
    if ONLY and n not in ONLY: continue
    a, b = CUTS[n]; audio(n)
    subprocess.run(['ffmpeg','-v','error','-y','-ss',str(a),'-t',str(b-a),'-i',f'{SRC}/v{n}.mp4','-an',
        '-vf',f'fps={FPS},scale={W}:{H}:flags=lanczos,unsharp=5:5:0.7:5:5:0.0','-c:v','libx264','-preset','medium','-crf','12','-pix_fmt','yuv420p',f'{OUT}/_v{n}.mp4'],check=True)
    mux(n, f'{OUT}/_v{n}.mp4')

# --- video 2: recorte 9:16 con seguimiento
if ONLY and 2 not in ONLY: sys.exit(0)
audio(2); a, b = CUTS[2]
track = json.load(open(os.path.join(os.path.dirname(__file__), 'track_v2.json')))
cap = cv2.VideoCapture(f'{SRC}/v2.mp4'); sw, sh = int(cap.get(3)), int(cap.get(4)); sfps = cap.get(5)
cw = sh * 9 / 16; sc = H / sh                       # 324 px de ancho -> 1080
BIAS = 0                                           # deja más aire hacia las manos (lado izquierdo)
enc = subprocess.Popen(['ffmpeg','-v','error','-y','-f','rawvideo','-pix_fmt','bgr24','-s',f'{W}x{H}','-r',str(FPS),'-i','-',
    '-vf','unsharp=5:5:0.8:5:5:0.0','-c:v','libx264','-preset','medium','-crf','12','-pix_fmt','yuv420p',f'{OUT}/_v2.mp4'], stdin=subprocess.PIPE)
nout = int((b - a) * FPS)
frames = {}
def get(i):
    cap.set(cv2.CAP_PROP_POS_FRAMES, i); ok, f = cap.read(); return f
cur = -1; last = None
for k in range(nout):
    t = a + k / FPS; i = min(int(round(t * sfps)), len(track) - 1)
    if i != cur:
        last = get(i); cur = i
    cx = min(max(track[i] + BIAS, cw / 2), sw - cw / 2); x0 = cx - cw / 2
    M = np.float32([[sc, 0, -x0 * sc], [0, sc, 0]])
    enc.stdin.write(cv2.warpAffine(last, M, (W, H), flags=cv2.INTER_CUBIC).tobytes())
enc.stdin.close(); enc.wait(); mux(2, f'{OUT}/_v2.mp4')
print('listo')
