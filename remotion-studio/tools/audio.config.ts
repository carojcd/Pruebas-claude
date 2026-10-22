import { Config } from '@remotion/cli/config';
// Configuración solo para renderizar el audio (sin opciones de video).
Config.setBrowserExecutable('/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell');
Config.setOverwriteOutput(true);
