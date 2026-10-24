"""Mezcla de audio 'halloween': voz en off + música (baja mientras habla). Sin efectos de sonido.
Uso: python3 mix_halloween.py <voz.mp3> <musica.mp3> <salida.wav>"""
import sys, subprocess, numpy as np, wave
SR = 48000; BPM = 140; B = 60 / BPM
def load(p, dur=None):
    cmd = ['ffmpeg', '-v', 'error', '-i', p, '-ar', str(SR), '-ac', '2'] + (['-t', str(dur)] if dur else []) + ['-f', 's16le', '-']
    return np.frombuffer(subprocess.run(cmd, capture_output=True, check=True).stdout, '<i2').astype(np.float32).reshape(-1, 2) / 32768
vo = load(sys.argv[1]); DUR = len(vo) / SR + 0.15; N = int(DUR * SR); t = np.arange(N) / SR
mus = load(sys.argv[2], DUR + 1)[:N]; vo = np.pad(vo, ((0, N - len(vo)), (0, 0)))
# ducking: la música baja 7 dB mientras suena la voz (envolvente suavizada)
env = np.convolve(np.abs(vo).mean(1), np.ones(2400) / 2400, 'same'); on = np.clip((env - 0.01) / 0.03, 0, 1)
on = np.convolve(on, np.hanning(9600) / np.hanning(9600).sum(), 'same')
mus *= (0.30 - 0.14 * on)[:, None] * np.minimum(t / .25, 1)[:, None] * np.minimum((DUR - t) / 1.4, 1)[:, None]
vo *= (0.9 / max(np.abs(vo).max(), 1e-6))
mix = mus + vo
mix = np.tanh(mix * 1.1) * 0.9
with wave.open(sys.argv[3], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix * 32767).astype('<i2').tobytes())
print('mezcla', round(DUR, 2), 's')
