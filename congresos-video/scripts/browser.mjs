// Localiza el Chromium headless preinstalado (Remotion no puede descargar el suyo en este entorno)
import { existsSync, readdirSync } from "node:fs";

export const findBrowser = () => {
  if (process.env.REMOTION_BROWSER) return process.env.REMOTION_BROWSER;
  const base = "/opt/pw-browsers";
  if (!existsSync(base)) return undefined;
  const dir = readdirSync(base).filter((d) => d.startsWith("chromium_headless_shell")).sort().pop();
  return dir ? `${base}/${dir}/chrome-linux/headless_shell` : undefined;
};
