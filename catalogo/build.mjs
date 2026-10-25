// Genera el catálogo Don Vitto: HTML -> PDF (carta, vertical) + PNG de cada página para revisión.
// Uso: node build.mjs        (salida en build/ y CATALOGO_DON_VITTO.pdf)
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const A = (p) => pathToFileURL(path.join(DIR, 'assets', p)).href.replace(/%2F/g, '/');
const WEB = 'www.donvitto.co', TAG = 'Calidad y sabor para disfrutar';

// ---------- datos (fuente: catálogo actual + nombres de archivo + etiquetas de las fotos)
const u = (n) => `${n} unidades`, g = (n) => `${n} g`, por = (n) => `${n} porciones`;
const CATS = [
  { id: 'chorizos', name: 'Chorizos y chorichuzos' },
  { id: 'butifarras', name: 'Butifarras' },
  { id: 'salchichas', name: 'Salchichas' },
  { id: 'salchichones', name: 'Salchichones y mortadelas' },
  { id: 'otros', name: 'Jamón, tocineta y más' },
];
const P = [
  ['chorizos', 'Chorizo Santarrosano', 'Chorizo Santarrosano', [g('250'), por(5)], 1],
  ['chorizos', 'Chorizo picante', 'Chorizo Picante', [g('500'), por(5)], 1],
  ['chorizos', 'Chorichuzo', 'Chorichuzo', [u(16), g('500')]],
  ['chorizos', 'Chorichuzo granel 2.5 Kg', 'Chorichuzo Granel', [u(65), g('2.500')]],
  ['chorizos', 'Chorichuzo granel', 'Chorichuzo Granel', [u(130), g('5.000')]],
  ['butifarras', 'Butifarra', 'Butifarra', [u(16), g('500')]],
  ['butifarras', 'Butifarra granel 2.5 Kg', 'Butifarra Granel', [u(65), g('2.500')]],
  ['butifarras', 'Butifarra granel 5 Kg', 'Butifarra Granel', [u(130), g('5.000')]],
  ['salchichas', 'Salchicha manguera 2 Kg', 'Salchicha Manguera', [u(21), g('2.000')]],
  ['salchichas', 'Salchicha Manguera 2.39 Kg', 'Salchicha Manguera', [u(15), g('2.390')]],
  ['salchichas', 'Salchicha Manguera', 'Salchicha Manguera', [u(18), g('2.850')]],
  ['salchichas', 'Salchicha Manguera Larga 2.5 Kg', 'Salchicha Manguera Larga', [u(23), g('2.500')]],
  ['salchichas', 'Salchicha Manguera larga pollo XXL', 'Salchicha Manguera Larga Pollo XXL', [u(10), g('2.500')]],
  ['salchichas', 'Salchicha super perro mixta', 'Salchicha Super Perro Mixta', [u(15), g('500')]],
  ['salchichas', 'Salchicha suiza', 'Salchicha Suiza', [por(4)], 1],
  ['salchichones', 'Salchichón Cervecero', 'Salchichón Cervecero', [g('900')]],
  ['salchichones', 'Salchichón Cervecero Premium', 'Salchichón Cervecero Premium', [g('500'), por(35)], 1],
  ['salchichones', 'Salchichón de pollo', 'Salchichón de Pollo', [g('750')]],
  ['salchichones', 'Salchichón tradicional', 'Salchichón Tradicional', [g('650'), g('750')]],
  ['salchichones', 'Mortadela mixta', 'Mortadela Mixta', [u(25), g('500')]],
  ['salchichones', 'Mortadela Jamonada', 'Mortadela Jamonada', [u(25), g('500')]],
  ['otros', 'Jamón premium', 'Jamón Premium', [u(25), g('500')]],
  ['otros', 'Tocineta', 'Tocineta', [u(20), g('500')]],
  ['otros', 'Tocineta premium', 'Tocineta Premium', [g('500'), por(25)], 1],
  ['otros', 'Hamburguesa mixta precocida', 'Hamburguesa Mixta Precocida', [u(6), g('500')]],
  ['otros', 'Cerdo navideño con salsa de ciruela', 'Cerdo Navideño con Salsa de Ciruela', [], 1],
].map(([cat, file, name, meta, nuevo]) => ({ cat, file, name, meta, nuevo: !!nuevo }));
const catName = Object.fromEntries(CATS.map((c) => [c.id, c.name]));
if (P.length !== 26) throw new Error('Se esperaban 26 productos, hay ' + P.length);
for (const p of P) if (!fs.existsSync(path.join(DIR, 'assets/fotos', p.file + '.jpg'))) throw new Error('Falta foto: ' + p.file);

// ---------- páginas de producto (4 por página)
const PER = 4, FIRST_PROD_PAGE = 4;
const prodPages = []; for (let i = 0; i < P.length; i += PER) prodPages.push(P.slice(i, i + PER));
const pageOf = (idx) => FIRST_PROD_PAGE + Math.floor(idx / PER);
const catPages = CATS.map((c) => { const idx = P.map((p, i) => (p.cat === c.id ? i : -1)).filter((i) => i >= 0); return { ...c, items: idx.map((i) => P[i]), from: pageOf(idx[0]), to: pageOf(idx[idx.length - 1]) }; });
const TOTAL = FIRST_PROD_PAGE + prodPages.length + 2;   // + valores + contraportada
const pn = (n) => String(n).padStart(2, '0');

const card = (p) => `
  <article class="card">
    <div class="ph"><img src="${A('fotos/' + p.file + '.jpg')}">${p.nuevo ? '<span class="new">Nuevo</span>' : ''}</div>
    <div class="info"><div class="cat">${catName[p.cat]}</div><h3>${p.name}</h3>
      <div class="meta">${p.meta.map((m, i) => `<span class="chip ${i === p.meta.length - 1 && p.meta.length > 1 || (p.meta.length === 1 && /g$/.test(m)) ? 'solid' : ''}">${m}</span>`).join('')}</div></div>
  </article>`;
const header = (label) => `<header class="top"><img src="${A('logo.svg')}" class="mini"><span>${label}</span></header>`;
const footer = (n) => `<footer class="foot"><span>Productos Cárnicos y Alimenticios · ${WEB}</span><b>${pn(n)}</b></footer>`;

const icons = {
  confianza: '<path d="M32 54 C10 40 8 22 20 16 C27 13 32 19 32 22 C32 19 37 13 44 16 C56 22 54 40 32 54Z"/>',
  equipo: '<circle cx="32" cy="22" r="8"/><circle cx="14" cy="28" r="6"/><circle cx="50" cy="28" r="6"/><path d="M18 52 C18 40 24 34 32 34 C40 34 46 40 46 52"/><path d="M4 50 C4 42 8 38 14 38 M60 50 C60 42 56 38 50 38"/>',
  responsabilidad: '<path d="M32 8 L52 16 V32 C52 44 44 52 32 58 C20 52 12 44 12 32 V16Z"/><path d="M22 32 L30 40 L43 24"/>',
  confidencialidad: '<rect x="14" y="28" width="36" height="28" rx="6"/><path d="M22 28 V20 A10 10 0 0 1 42 20 V28"/><circle cx="32" cy="42" r="3.5"/>',
  servicio: '<path d="M10 46 H54 M14 46 C14 32 22 24 32 24 C42 24 50 32 50 46"/><path d="M32 24 V18 M27 18 H37"/><path d="M8 54 H56"/>',
  integridad: '<path d="M32 8 L38 24 L56 26 L42 38 L47 56 L32 46 L17 56 L22 38 L8 26 L26 24Z"/>',
};
const valores = [['confianza', 'Confianza'], ['equipo', 'Trabajo en equipo'], ['responsabilidad', 'Responsabilidad'], ['confidencialidad', 'Confidencialidad'], ['servicio', 'Actitud de servicio'], ['integridad', 'Integridad']];

const css = `
@font-face{font-family:'Montserrat';font-weight:500;src:url(${A('fonts/montserrat-latin-500-normal.woff2')})}
@font-face{font-family:'Montserrat';font-weight:600;src:url(${A('fonts/montserrat-latin-600-normal.woff2')})}
@font-face{font-family:'Montserrat';font-weight:700;src:url(${A('fonts/montserrat-latin-700-normal.woff2')})}
@font-face{font-family:'Montserrat';font-weight:800;src:url(${A('fonts/montserrat-latin-800-normal.woff2')})}
@font-face{font-family:'Playfair Display';font-weight:700;font-style:normal;src:url(${A('fonts/playfair-display-latin-700-normal.woff2')})}
@font-face{font-family:'Playfair Display';font-weight:700;font-style:italic;src:url(${A('fonts/playfair-display-latin-700-italic.woff2')})}
:root{--wine:#8E1328;--wine2:#5B0A19;--red:#D22C2A;--cream:#FFF8EE;--ink:#1B1214;--yellow:#FFF200;--muted:#7C6B6D;--line:#EBD9CB}
@page{size:8.5in 11in;margin:0}
*{margin:0;padding:0;box-sizing:border-box}
html,body{background:#888}
body{font-family:'Montserrat',sans-serif;color:var(--ink);-webkit-print-color-adjust:exact;print-color-adjust:exact}
.page{width:816px;height:1056px;position:relative;overflow:hidden;background:var(--cream);page-break-after:always;break-after:page}
.serif{font-family:'Playfair Display',serif}
/* portada */
.cover{background:radial-gradient(900px 700px at 50% 55%,#6B0F20 0%,#3A0711 55%,#1A0308 100%);color:#fff}
.cover .logo{position:absolute;left:158px;top:70px;width:500px;filter:drop-shadow(0 6px 24px rgba(255,255,255,.18))}
.cover .tag{position:absolute;left:0;right:0;top:238px;text-align:center;font:italic 700 34px 'Playfair Display',serif;color:#FFE9D2}
.cover .hero{position:absolute;left:0;top:318px;width:816px;height:576px;background:url(${A('portada.jpg')}) center/cover;-webkit-mask-image:linear-gradient(to bottom,transparent,#000 16%,#000 84%,transparent);}
.cover .bar{position:absolute;left:0;right:0;bottom:0;height:92px;background:linear-gradient(90deg,var(--wine2),var(--wine) 50%,var(--wine2));display:flex;align-items:center;justify-content:space-between;padding:0 56px;color:#fff}
.cover .bar b{font-weight:800;letter-spacing:7px;font-size:13px}.cover .bar span{font-weight:700;color:var(--yellow);letter-spacing:1px;font-size:15px}
.cover .yl{position:absolute;left:0;right:0;bottom:92px;height:7px;background:var(--yellow)}
/* quienes somos */
.about .txt{position:absolute;left:56px;top:72px;width:430px}
.about .kick{font-weight:800;letter-spacing:6px;font-size:11px;color:var(--red);display:flex;gap:12px;align-items:center}
.about .kick:after{content:'';height:2px;width:46px;background:var(--red)}
.about h2{font:700 66px/1.02 'Playfair Display',serif;color:var(--wine);margin:14px 0 18px}
.about p{font-size:13.6px;line-height:1.7;color:#3b2d30;margin-bottom:12px}
.about .sep{height:1px;background:var(--line);margin:38px 0 34px}
.about .pic{position:absolute;right:0;top:0;width:290px;height:1056px;background:url(${A('fotos/Salchichón tradicional.jpg')}) 50% center/cover;border-radius:46px 0 0 46px;box-shadow:-18px 0 50px rgba(142,19,40,.18)}
.about .pic:after{content:'';position:absolute;inset:0;border-radius:46px 0 0 46px;background:linear-gradient(180deg,rgba(142,19,40,.0) 55%,rgba(91,10,25,.75))}
.about .pic img{position:absolute;left:36px;bottom:44px;width:210px;z-index:2;filter:drop-shadow(0 4px 14px rgba(0,0,0,.4))}
/* indice */
.index{padding:56px 56px}
.index h2{font:700 52px/1.02 'Playfair Display',serif;color:var(--wine);margin:10px 0 8px}
.index .sub{font-size:14px;color:var(--muted);font-weight:600;letter-spacing:.3px;margin-bottom:22px}
.row{display:grid;grid-template-columns:104px 1fr 120px;gap:24px;align-items:center;padding:15px 0;border-top:1px solid var(--line)}
.row:last-child{border-bottom:1px solid var(--line)}
.row .th{width:104px;height:104px;border-radius:22px;overflow:hidden;box-shadow:0 10px 26px rgba(142,19,40,.2)}.row .th img{width:100%;height:100%;object-fit:cover}
.row h3{font:700 25px/1.1 'Playfair Display',serif;color:var(--ink)}
.row .n{font-size:11px;font-weight:800;letter-spacing:3px;color:var(--red);margin:6px 0 8px}
.row p{font-size:12px;line-height:1.55;color:var(--muted)}
.row .pg{text-align:right;white-space:nowrap;font:700 34px/1 'Playfair Display',serif;color:var(--red)}.row .pg small{display:block;font:700 10px 'Montserrat';letter-spacing:3px;color:var(--muted);margin-bottom:6px}
/* productos */
.prod{padding:0 48px}
.top{height:84px;display:flex;align-items:center;justify-content:space-between;border-bottom:1.5px solid var(--line)}
.top .mini{height:44px}.top span{font-weight:800;letter-spacing:5px;font-size:10.5px;color:var(--wine)}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:24px}
.card{background:#fff;border-radius:26px;overflow:hidden;box-shadow:0 12px 34px rgba(142,19,40,.13),0 1px 0 rgba(0,0,0,.03);height:426px;display:flex;flex-direction:column}
.ph{position:relative;height:312px;flex:none}.ph img{width:100%;height:100%;object-fit:cover;display:block}
.new{position:absolute;left:14px;top:14px;background:var(--yellow);color:var(--ink);font-weight:800;font-size:10px;letter-spacing:2.5px;text-transform:uppercase;padding:7px 13px;border-radius:30px;box-shadow:0 4px 12px rgba(0,0,0,.25)}
.info{padding:16px 22px 0}
.cat{font-weight:800;font-size:9.5px;letter-spacing:2.6px;text-transform:uppercase;color:var(--red)}
.info h3{font-weight:800;font-size:18.5px;line-height:1.18;margin:6px 0 10px;color:var(--ink)}
.meta{display:flex;gap:7px;flex-wrap:wrap}
.chip{font-size:11px;font-weight:700;padding:6px 12px;border-radius:30px;background:#FBE9E4;color:var(--wine)}
.chip.solid{background:var(--red);color:#fff}
.foot{position:absolute;left:48px;right:48px;bottom:0;height:46px;display:flex;align-items:center;justify-content:space-between;font-size:10px;letter-spacing:.6px;color:var(--muted);border-top:1.5px solid var(--line)}
.foot b{font:700 18px 'Playfair Display',serif;color:var(--red)}
.banner{grid-column:1 / span 2;height:426px;border-radius:26px;overflow:hidden;position:relative;background:radial-gradient(520px 420px at 50% 40%,#A3173A,var(--wine2));color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;box-shadow:0 12px 34px rgba(142,19,40,.25)}
.banner img{width:360px;filter:drop-shadow(0 6px 24px rgba(255,255,255,.2))}
.banner .t{font:italic 700 28px 'Playfair Display',serif;color:#FFE9D2;margin-top:18px}.banner .w{margin-top:18px;font-weight:800;letter-spacing:3px;color:var(--yellow);font-size:14px}
/* valores */
.vals{background:radial-gradient(800px 800px at 50% 30%,#8E1328 0%,#4A0814 70%,#2A050D 100%);color:#fff;padding:78px 56px}
.vals .kick{font-weight:800;letter-spacing:6px;font-size:11px;color:var(--yellow)}
.vals h2{font:700 56px/1.04 'Playfair Display',serif;margin:14px 0 18px}
.vals p{font-size:15.5px;line-height:1.7;color:#F6DCD2;width:600px}
.vg{display:grid;grid-template-columns:1fr 1fr;gap:26px;margin-top:64px}
.v{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.18);border-radius:28px;padding:54px 30px;display:flex;align-items:center;gap:24px;backdrop-filter:blur(2px)}
.v svg{width:76px;height:76px;flex:none;fill:none;stroke:var(--yellow);stroke-width:3;stroke-linecap:round;stroke-linejoin:round;background:rgba(255,242,0,.1);border-radius:50%;padding:13px}
.v b{font-size:19px;font-weight:800;letter-spacing:.3px}
.vals .yl{position:absolute;left:0;right:0;bottom:0;height:12px;background:var(--yellow)}
/* contraportada */
.back{background:radial-gradient(900px 800px at 50% 45%,#8E1328 0%,#4A0814 60%,#1A0308 100%);color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
.back img{width:520px;filter:drop-shadow(0 6px 28px rgba(255,255,255,.2))}
.back .t{font:italic 700 36px 'Playfair Display',serif;color:#FFE9D2;margin-top:26px}
.back .w{margin-top:34px;font-weight:800;letter-spacing:4px;color:var(--yellow);font-size:16px;border-top:2px solid var(--yellow);padding-top:20px}
.back .yl{position:absolute;left:0;right:0;bottom:0;height:12px;background:var(--yellow)}
`;

const pages = [];
pages.push(`<section class="page cover"><img class="logo" src="${A('logo.svg')}"><div class="tag">${TAG}</div><div class="hero"></div><div class="yl"></div><div class="bar"><b>CATÁLOGO DE PRODUCTOS</b><span>${WEB}</span></div></section>`);
pages.push(`<section class="page about"><div class="txt">
  <div class="kick">QUIÉNES SOMOS</div><h2>Misión</h2>
  <p>Proveer a todo el mercado y a la población en general, mediante una adecuada asesoría profesional, productos alimenticios fabricados y comercializados con los más altos estándares de calidad, con el propósito de que contribuyan al bienestar y cumplan con las necesidades y expectativas de nuestros clientes.</p>
  <p>En nuestros negocios de alimentos buscamos siempre mejorar la calidad de vida del consumidor, con un crecimiento rentable, con marcas líderes, servicio superior y una excelente distribución nacional e internacional.</p>
  <p>Gestionamos nuestras actividades comprometidos con el Desarrollo Sostenible; con el mejor talento humano; innovación sobresaliente y un comportamiento corporativo ejemplar.</p>
  <div class="sep"></div>
  <h2>Visión</h2>
  <p>Continuar siendo reconocidos a nivel nacional como industria de productos cárnicos y alimenticios líder en productos innovadores, competitivos y de calidad; así mismo, posicionarnos en el mercado internacional y ser la primera opción de nuestros clientes como una compañía comprometida con la aplicación de nuevas tecnologías, valores y normatividad nacional.</p>
  </div><div class="pic"><img src="${A('logo.svg')}"></div></section>`);
pages.push(`<section class="page vals"><div class="kick">NUESTRA ESENCIA</div><h2>Valores<br>corporativos</h2><p>Nuestro deber, la credibilidad y la calidad de nuestros productos, constituye un pilar fundamental en nuestros valores.</p>
  <div class="vg">${valores.map(([k, t]) => `<div class="v"><svg viewBox="0 0 64 64">${icons[k]}</svg><b>${t}</b></div>`).join('')}</div><div class="yl"></div></section>`);
prodPages.forEach((items, i) => {
  const n = FIRST_PROD_PAGE + i, last = i === prodPages.length - 1;
  pages.push(`<section class="page prod">${header('PORTAFOLIO DE PRODUCTOS')}<div class="grid">${items.map(card).join('')}${last && items.length === 2 ? `<div class="banner"><img src="${A('logo.svg')}"><div class="t">${TAG}</div><div class="w">${WEB.toUpperCase()}</div></div>` : ''}</div>${footer(n)}</section>`);
});
pages.push(`<section class="page back"><img src="${A('logo.svg')}"><div class="t">${TAG}</div><div class="w">${WEB}</div><div class="yl"></div></section>`);

const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Catálogo Don Vitto</title><style>${css}</style></head><body>${pages.join('\n')}</body></html>`;
fs.mkdirSync(path.join(DIR, 'build'), { recursive: true });
fs.writeFileSync(path.join(DIR, 'build/catalogo.html'), html);

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--force-color-profile=srgb', '--allow-file-access-from-files'] });
const page = await browser.newPage({ viewport: { width: 816, height: 1056 }, deviceScaleFactor: 1.5 });
await page.goto(pathToFileURL(path.join(DIR, 'build/catalogo.html')).href); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(400);
await page.pdf({ path: path.join(DIR, 'CATALOGO_DON_VITTO.pdf'), width: '8.5in', height: '11in', printBackground: true, preferCSSPageSize: true });
const els = await page.$$('section.page');
for (let i = 0; i < els.length; i++) await els[i].screenshot({ path: path.join(DIR, `build/p${pn(i + 1)}.png`) });
console.log('páginas:', els.length, '| esperadas:', TOTAL);
await browser.close();
