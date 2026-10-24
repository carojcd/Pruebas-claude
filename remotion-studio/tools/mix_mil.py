"""Mezcla 'mil seguidores': voz en off (empieza a 1.6 s) + canción de fondo que baja mientras se habla (sin efectos). Uso: python3 mix_mil.py <voz.mp3> <musica.mp3> <salida.wav>"""
import sys, subprocess, numpy as np, wave
SR = 48000; DUR = 15.2; N = int(SR * DUR); t = np.arange(N) / SR
vo = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', sys.argv[1], '-ar', str(SR), '-ac', '2', '-f', 's16le', '-'], capture_output=True, check=True).stdout, '<i2').astype(np.float32).reshape(-1, 2) / 32768
vo *= 0.9 / np.abs(vo).max(); sig = np.zeros((N, 2), np.float32); i = int(1.6 * SR); n = min(len(vo), N - i); sig[i:i + n] = vo[:n]
# música: se normaliza su volumen, entra con fundido, baja ~8 dB mientras habla la voz y sale con fundido
mus = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', sys.argv[2], '-ar', str(SR), '-ac', '2', '-t', str(DUR), '-f', 's16le', '-'], capture_output=True, check=True).stdout, '<i2').astype(np.float32).reshape(-1, 2) / 32768
mus = np.pad(mus, ((0, max(0, N - len(mus))), (0, 0)))[:N]; mus *= 0.11 / max(np.sqrt((mus ** 2).mean()), 1e-6)
env = np.convolve(np.abs(sig).mean(1), np.ones(2400) / 2400, 'same'); on = np.clip((env - .01) / .03, 0, 1); on = np.convolve(on, np.hanning(14400) / np.hanning(14400).sum(), 'same')
mus *= (1.0 - 0.60 * on)[:, None] * np.minimum(t / .8, 1)[:, None] * np.minimum((DUR - t) / 1.5, 1)[:, None]
mix = np.tanh((sig + mus) * 1.05) * .92
with wave.open(sys.argv[3], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix * 32767).astype('<i2').tobytes())
