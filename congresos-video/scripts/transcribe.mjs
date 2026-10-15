// Transcribe un vídeo con Whisper (transformers.js, CPU) y guarda tiempos por palabra
// en formato Caption de @remotion/captions.
// Uso: node scripts/transcribe.mjs <entrada.mp4> <salida.json> [modelDir] [idioma]
//
// El modelo se carga en local (Hugging Face no es accesible desde este entorno):
// modelDir debe contener Xenova/whisper-small/… (paquete npm "sts-whisper-small").
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { env, pipeline } from "@huggingface/transformers";

const [input, output, modelDir, language = "spanish"] = process.argv.slice(2);
if (!input || !output || !modelDir) {
  console.error("Uso: node scripts/transcribe.mjs <entrada> <salida.json> <modelDir> [idioma]");
  process.exit(1);
}

env.allowRemoteModels = false;
env.localModelPath = modelDir;

// Audio a 16 kHz mono float32 vía ffmpeg
const pcm = execFileSync(
  "ffmpeg",
  ["-v", "error", "-i", input, "-ac", "1", "-ar", "16000", "-f", "f32le", "-"],
  { maxBuffer: 1024 * 1024 * 1024 },
);
const audio = new Float32Array(pcm.buffer, pcm.byteOffset, pcm.byteLength / 4);
console.log(`Audio: ${(audio.length / 16000).toFixed(2)} s`);

const asr = await pipeline("automatic-speech-recognition", "Xenova/whisper-small", {
  dtype: "q8",
  device: "cpu",
});

const t0 = Date.now();
const result = await asr(audio, {
  language,
  task: "transcribe",
  return_timestamps: "word",
  chunk_length_s: 30,
  stride_length_s: 5,
});
console.log(`Transcrito en ${((Date.now() - t0) / 1000).toFixed(1)} s`);
console.log(result.text);

const captions = result.chunks.map((c) => {
  const [start, end] = c.timestamp;
  const startMs = Math.round(start * 1000);
  const endMs = Math.round((end ?? start + 0.3) * 1000);
  return {
    text: c.text.startsWith(" ") ? c.text : ` ${c.text}`,
    startMs,
    endMs,
    timestampMs: Math.round((startMs + endMs) / 2),
    confidence: null,
  };
});
writeFileSync(output, JSON.stringify(captions, null, 2));
console.log(`${captions.length} palabras → ${output}`);
