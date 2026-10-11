import { chromium } from 'playwright-core';
import fs from 'fs';
const svg = fs.readFileSync('src/logo.svg','utf8').replace(/viewBox="[^"]+"/,'viewBox="0 0 120 44" width="960" height="352"');
const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const p = await b.newPage({viewport:{width:960,height:352}});
await p.setContent(`<body style="margin:0;background:#000">${svg}</body>`);
await p.screenshot({path:process.argv[2]});
await b.close();
