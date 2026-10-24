"""Mezcla 'mil seguidores': voz en off (empieza a 1.6 s) + colchón ambiental suave (sin efectos). Uso: python3 mix_mil.py <voz.mp3> <salida.wav>"""
import sys, subprocess, numpy as np, wave
SR = 48000; DUR = 15.2; N = int(SR * DUR); t = np.arange(N) / SR
vo = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', sys.argv[1], '-ar', str(SR), '-ac', '2', '-f', 's16le', '-'], capture_output=True, check=True).stdout, '<i2').astype(np.float32).reshape(-1, 2) / 32768
vo *= 0.9 / np.abs(vo).max(); sig = np.zeros((N, 2), np.float32); i = int(1.6 * SR); n = min(len(vo), N - i); sig[i:i + n] = vo[:n]
# colchón: acorde Am(add9) con vibrato lento y entrada/salida suaves; baja mientras habla la voz
pad = sum(np.sin(2 * np.pi * f * t + 0.6 * np.sin(2 * np.pi * (0.17 + k * .03) * t)) * a for k, (f, a) in enumerate([(110, 1), (164.8, .8), (220, .7), (246.9, .35), (329.6, .3)]))
pad *= (0.55 + 0.45 * np.sin(2 * np.pi * .11 * t + 1)) / 3
env = np.convolve(np.abs(sig).mean(1), np.ones(2400) / 2400, 'same'); on = np.clip((env - .01) / .03, 0, 1); on = np.convolve(on, np.hanning(9600) / np.hanning(9600).sum(), 'same')
pad *= (0.20 - 0.10 * on) * np.minimum(t / 1.2, 1) * np.minimum((DUR - t) / 1.4, 1)
mix = np.tanh((sig + np.stack([pad, np.roll(pad, 120)], 1)) * 1.05) * .92
with wave.open(sys.argv[2], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix * 32767).astype('<i2').tobytes())
