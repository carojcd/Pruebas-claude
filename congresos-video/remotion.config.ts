/**
 * Note: When using the Node.JS APIs, the config file
 * doesn't apply. Instead, pass options directly to the APIs.
 *
 * All configuration options: https://remotion.dev/docs/config
 */

import { Config } from "@remotion/cli/config";
import { findBrowser } from "./scripts/browser.mjs";

Config.setRspack(true);
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setDefaultPremountInSeconds(2);

// Chromium preinstalado en el entorno (el dominio de descarga de Remotion no es accesible)
const browser = findBrowser();
if (browser) Config.setBrowserExecutable(browser);
