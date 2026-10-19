// Renderiza fotogramas sueltos para revisión rápida y los junta en una hoja de contacto.
// Uso: node scripts/stills.mjs <dirSalida> <f1> <f2> ...
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { findBrowser } from "./browser.mjs";

const [outDir, ...frames] = process.argv.slice(2);
mkdirSync(outDir, { recursive: true });
const browserExecutable = findBrowser() ?? null;
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const composition = await selectComposition({ serveUrl, id: "Congresos", browserExecutable });
const files = [];
for (const f of frames.map(Number)) {
  const output = path.join(outDir, `f_${String(f).padStart(4, "0")}.png`);
  await renderStill({ composition, serveUrl, frame: f, output, browserExecutable, scale: 0.5 });
  files.push(output);
}
const inputs = files.flatMap((f) => ["-i", f]);
const labels = files.map((_, i) => `[${i}]drawtext=text='${frames[i]}':x=8:y=8:fontsize=28:fontcolor=yellow:box=1:boxcolor=black[v${i}]`);
execFileSync("ffmpeg", [
  "-v", "error", "-y", ...inputs,
  "-filter_complex", `${labels.join(";")};${files.map((_, i) => `[v${i}]`).join("")}hstack=${files.length}`,
  path.join(outDir, "hoja.jpg"),
]);
console.log("Hoja:", path.join(outDir, "hoja.jpg"));
