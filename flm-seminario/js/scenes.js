/* Academia FLM · Seminario Práctico en Insolvencia de Persona Natural
   Escenas sincronizadas con la voz en off (vo.wav empieza en t = 0.25 s).
   Tiempos de frase medidos con silencedetect (segundos del video):
     A  0.25 «Los casos cambian» · 1.67 «Tu práctica también» · 3.42–7.62 «Cada asesoría … conocimiento y confianza»
     B  8.15–12.61 «Llega el Seminario Práctico en Insolvencia de Persona Natural de Academia FLM»
     C  13.11 «A partir del dos de diciembre» · 14.87 «veinte horas de formación» · 16.41–18.60 «clases en vivo …»
     D  19.00 «Con campus virtual» · 20.16 «módulos a tu ritmo» · ~21.3 «y docentes expertos» (fin 22.49)
     E  22.94 «Paquete Básico» · 23.89 «cuatrocientos mil pesos» · 25.33–27.59 «con grabaciones del Congreso 2026»
     F  27.98 «Paquete Plus» · 28.86 «novecientos mil pesos» · 30.35–32.38 «con el Diplomado … incluido»
     G  32.80 «Actualízate» · 33.77 «amplía tu portafolio…» · ~35.5 «y da el siguiente paso profesional» · 37.89–39.32 «¡Contáctanos e inscríbete!»
   La canción (101 BPM) sube en 19.2 s y baja en 38.1 s: los cambios grandes caen en pulsos (7.89, 12.65, 18.59, 22.75, 27.5, 32.85, 37.59). */
(function () {
  const { splitText, FX } = window.FLM;
  const { E4, E3, S, IN } = FX;
  splitText();
  const tl = gsap.timeline({ paused: true });

  /* ---------- fondo degradado vivo ---------- */
  tl.to("#o1", { x: 140, y: 120, rotation: 25, duration: 10, ease: S, yoyo: true, repeat: 3 }, 0);
  tl.to("#o2", { x: -160, y: -180, rotation: -20, duration: 12, ease: S, yoyo: true, repeat: 2 }, 0);
  tl.to("#o3", { x: 180, y: -120, rotation: 30, duration: 9, ease: S, yoyo: true, repeat: 3 }, 0);
  FX.morph(tl, ".orb", 0, 42, ["58% 42% 37% 63% / 46% 58% 42% 54%", "36% 64% 58% 42% / 60% 38% 62% 40%", "50% 50% 44% 56% / 40% 56% 44% 60%", "42% 58% 63% 37% / 41% 44% 56% 59%"]);

  /* =========================================================== A · INTRODUCCIÓN */
  // Aparición 1: toma a pantalla completa con push-in y titular por máscara
  tl.fromTo("#v1z", { scale: 1.0 }, { scale: 1.1, duration: 2.6, ease: "none" }, 0);
  tl.fromTo("#v1shade", { opacity: 0 }, { opacity: 1, duration: 0.6, ease: S }, 0.1);
  FX.charsIn(tl, "#tA1a", 0.3, 0.035, 0.6); FX.charsIn(tl, "#tA1b", 0.55, 0.04, 0.6);
  FX.charsOut(tl, "#tA1a", 1.36, 0.006); FX.charsOut(tl, "#tA1b", 1.38, 0.006);
  FX.charsIn(tl, "#tA2a", 1.74, 0.03, 0.55); FX.charsIn(tl, "#tA2b", 2.0, 0.05, 0.6);
  FX.charsOut(tl, "#tA2a", 2.95); FX.charsOut(tl, "#tA2b", 2.97);
  // la fotografía se convierte en una tarjeta blanca (documento → tarjeta digital)
  tl.fromTo("#v1w", { clipPath: "inset(0% 0% 0% 0% round 0px)" }, { clipPath: "inset(30% 12% 30% 12% round 44px)", duration: 0.95, ease: "power3.inOut" }, 2.45);
  tl.to("#v1shade", { opacity: 0, duration: 0.6, ease: S }, 2.6);
  tl.fromTo("#cardA", { opacity: 0 }, { opacity: 1, duration: 0.3, ease: S }, 3.3);
  tl.to("#v1w", { opacity: 0, duration: 0.3, ease: S }, 3.42);
  tl.fromTo("#cardA .skel", { scaleX: 0 }, { scaleX: 1, duration: 0.45, ease: E3, stagger: 0.05 }, 3.32);
  // la tarjeta se colapsa en una línea en degradado que divide la pantalla
  tl.to("#cardA", { scaleY: 0.008, scaleX: 1.32, duration: 0.4, ease: "power3.in" }, 3.72);
  tl.to("#cardA", { opacity: 0, duration: 0.1 }, 4.08);
  tl.fromTo("#divLine", { opacity: 0, y: 956 }, { opacity: 1, y: 956, duration: 0.1 }, 4.05);

  // Aparición 2: composición dividida (video arriba, tipografía abajo)
  const split = { y: 960, open: 0 };
  const setSplit = () => {
    const yp = (split.y / 1920) * 100;
    gsap.set("#v2w", { clipPath: `inset(${((1 - split.open) * yp).toFixed(3)}% 0% ${(100 - yp).toFixed(3)}% 0%)` });
    gsap.set("#divLine", { y: split.y - 4 });
  };
  tl.fromTo(split, { open: 0 }, { open: 1, duration: 0.6, ease: E3, onUpdate: setSplit }, 4.05);
  tl.fromTo(split, { y: 960 }, { y: 1000, duration: 1.4, ease: S, onUpdate: setSplit, immediateRender: false }, 4.65);
  tl.to(split, { y: 940, duration: 1.6, ease: S, onUpdate: setSplit }, 6.05);
  tl.fromTo("#v2z", { y: 30, scale: 1.04 }, { y: -30, scale: 1.1, duration: 3.6, ease: "none" }, 4.05);
  FX.wordsIn(tl, "#tB1", 4.15, 0.06); FX.wordsIn(tl, "#tB2", 4.7, 0.07);
  FX.charsIn(tl, "#tB3", 5.95, 0.03, 0.65);
  FX.charsIn(tl, "#tB4a", 6.8, 0.03, 0.5); FX.charsIn(tl, "#tB4b", 6.88, 0.035, 0.6);
  tl.to("#tB3 .ch", { y: -10, duration: 0.25, ease: S, yoyo: true, repeat: 1, stagger: 0.02 }, 6.7);
  // barrido en degradado hacia el blanco
  tl.fromTo("#wipe", { y: 1920 }, { y: -1150, duration: 0.75, ease: "power2.inOut" }, 7.45);
  tl.to(["#v2w", "#divLine", "#tB1", "#tB2", "#tB3", "#tB4a", "#tB4b"], { opacity: 0, duration: 0.01 }, 7.85);
  tl.to("#wipe", { opacity: 0, duration: 0.25, ease: S }, 8.2);

  /* =========================================================== B · PRESENTACIÓN */
  FX.wordsIn(tl, "#tC1", 8.35, 0.09, 0.7);
  FX.charsIn(tl, "#tC2", 9.65, 0.03, 0.7);
  FX.charsIn(tl, "#tC3", 10.15, 0.03, 0.7);
  FX.charsIn(tl, "#tC4", 10.6, 0.035, 0.7);
  FX.wordsIn(tl, "#tC5", 11.65, 0.08);
  // Aparición 3: toma dentro de una forma orgánica que se desplaza (parallax con la cámara original)
  tl.fromTo("#v3w", { opacity: 0, scale: 0.25, x: 220, y: 160 }, { opacity: 1, scale: 1, x: 0, y: 0, duration: 1.1, ease: E4 }, 8.95);
  tl.to("#v3w", { x: -70, y: -40, duration: 2.0, ease: S }, 10.05);
  tl.fromTo("#v3z", { x: -40, scale: 1.12 }, { x: 40, scale: 1.02, duration: 3.6, ease: "none" }, 8.95);
  FX.morph(tl, "#v3w", 8.95, 3.5, ["60% 40% 55% 45% / 45% 60% 40% 55%", "38% 62% 42% 58% / 58% 42% 62% 38%", "52% 48% 36% 64% / 40% 54% 46% 60%"]);
  FX.pop(tl, "#chip1", 9.55); FX.pop(tl, "#chip2", 9.85);
  tl.to(["#chip1", "#chip2"], { y: -26, duration: 1.4, ease: S, yoyo: true, repeat: 1, stagger: 0.2 }, 10.3);
  tl.to("#v3w", { scale: 0.08, opacity: 0, x: 280, y: 300, duration: 0.55, ease: IN }, 12.1);
  FX.blurOut(tl, ["#chip1", "#chip2"], 12.15);
  FX.wordsOut(tl, "#tC1", 12.45); FX.charsOut(tl, "#tC2", 12.47); FX.charsOut(tl, "#tC3", 12.5); FX.charsOut(tl, "#tC4", 12.53); FX.wordsOut(tl, "#tC5", 12.5);

  /* =========================================================== C · FORMACIÓN */
  tl.fromTo("#calC", { opacity: 0, clipPath: "inset(0% 100% 0% 0% round 44px)", y: 30 }, { opacity: 1, clipPath: "inset(0% 0% 0% 0% round 44px)", y: 0, duration: 0.8, ease: E4 }, 12.75);
  FX.pop(tl, "#calTile", 12.9);
  FX.draw(tl, "#calTile use", 12.95, 0.6);
  FX.wordsIn(tl, "#cIni", 13.05); FX.wordsIn(tl, "#cD1", 13.2, 0.08); FX.wordsIn(tl, "#cD1b", 13.4);
  FX.grow(tl, "#cDiv", 13.75, 0.5);
  FX.wordsIn(tl, "#cFin", 13.85); FX.wordsIn(tl, "#cD2", 14.0, 0.08); FX.wordsIn(tl, "#cD2b", 14.2);
  tl.to("#calDay", { rotationX: 90, duration: 0.18, ease: "power2.in" }, 13.95);
  const day = { v: 0 }, dayEl = document.getElementById("calDay");
  tl.fromTo(day, { v: 0 }, { v: 1, duration: 0.02, onUpdate: () => { dayEl.textContent = day.v > 0.5 ? "12" : "2"; } }, 14.13);
  tl.fromTo("#calDay", { rotationX: -90 }, { rotationX: 0, duration: 0.25, ease: E3, immediateRender: false }, 14.14);
  // reloj: el anillo se dibuja y las manecillas giran mientras cuenta a 20
  tl.fromTo("#clockSvg", { opacity: 0, scale: 0.6, rotation: -30 }, { opacity: 1, scale: 1, rotation: 0, duration: 0.7, ease: E4 }, 14.75);
  FX.draw(tl, "#clkRing", 14.85, 1.1, "power2.out");
  tl.fromTo("#clkM", { rotation: 0, svgOrigin: "150 150" }, { rotation: 720, svgOrigin: "150 150", duration: 1.2, ease: "power2.out" }, 14.85);
  tl.fromTo("#clkH", { rotation: 0, svgOrigin: "150 150" }, { rotation: 60, svgOrigin: "150 150", duration: 1.2, ease: "power2.out" }, 14.85);
  tl.fromTo("#k20", { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1, duration: 0.6, ease: E4 }, 14.85);
  FX.countTo(tl, "#k20", 20, 14.85, 0.95);
  FX.charsIn(tl, "#kHoras", 15.2, 0.04, 0.55);
  FX.blurOut(tl, "#calC", 16.0, { y: -120 }); FX.blurOut(tl, ["#clockSvg", "#k20"], 16.05, { y: -120 }); FX.charsOut(tl, "#kHoras", 16.0);
  // Aparición 4a: toma de las manos con portátil y documentos, que se funde con el blanco
  tl.fromTo("#v4w", { clipPath: "inset(0% 0% 100% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.7, ease: E4 }, 16.05);
  tl.fromTo("#v4z", { scale: 1.12, y: -40 }, { scale: 1.02, y: 30, duration: 2.6, ease: "none" }, 16.05);
  FX.cardIn(tl, "#liveC", 16.3);
  tl.fromTo("#lDot", { scale: 0 }, { scale: 1, duration: 0.4, ease: "back.out(2)" }, 16.45);
  tl.to("#lDot", { scale: 1.25, duration: 0.3, ease: S, yoyo: true, repeat: 3 }, 16.9);
  FX.charsIn(tl, "#lT", 16.45, 0.025, 0.55);
  FX.grow(tl, "#lDiv", 16.75, 0.6);
  FX.pop(tl, "#lI1", 16.95); FX.wordsIn(tl, "#lR1a", 17.0); FX.wordsIn(tl, "#lR1b", 17.15, 0.05);
  FX.pop(tl, "#lI2", 17.45); FX.wordsIn(tl, "#lR2a", 17.5); FX.wordsIn(tl, "#lR2b", 17.65, 0.05);
  FX.blurOut(tl, "#liveC", 18.45, { y: 140 });
  tl.to("#v4w", { opacity: 0, y: -80, filter: "blur(10px)", duration: 0.4, ease: IN }, 18.4);

  /* =========================================================== D · BENEFICIOS */
  // Aparición 4b: inserto cinematográfico en una tarjeta editorial flotante
  FX.cardIn(tl, "#insD", 18.6, { rotationY: -12, transformPerspective: 1400 });
  tl.fromTo("#insV", { clipPath: "circle(0% at 50% 50%)" }, { clipPath: "circle(75% at 50% 50%)", duration: 0.9, ease: E3 }, 18.75);
  tl.fromTo("#insV", { scale: 1.08 }, { scale: 1, duration: 4.0, ease: "none" }, 18.75);
  tl.to("#insD", { y: -16, duration: 1.45, ease: S, yoyo: true, repeat: 1 }, 19.5);
  [["#bI1", "#bT1", 19.0], ["#bI2", "#bT2", 20.15], ["#bI3", "#bT3", 21.3]].forEach(([icon, txt, t]) => {
    FX.pop(tl, icon, t);
    FX.draw(tl, icon + " use", t + 0.05, 0.7);
    FX.wordsIn(tl, txt, t + 0.08, 0.07);
  });
  FX.blurOut(tl, "#insD", 22.45, { y: -140 });
  ["#bD1", "#bD2", "#bD3"].forEach((s, i) => FX.blurOut(tl, s, 22.45 + i * 0.05, { x: -160, y: 0 }));

  /* =========================================================== E · PAQUETE BÁSICO */
  // una línea gráfica cruza la pantalla y se convierte en el borde de la tarjeta
  FX.draw(tl, "#lnE", 22.72, 0.35, "power2.out");
  tl.to("#lnE", { strokeDashoffset: -1, duration: 0.35, ease: "power2.in" }, 23.05);
  FX.draw(tl, "#bdE", 23.02, 0.8, "power2.inOut");
  tl.fromTo("#cardE", { opacity: 0 }, { opacity: 1, duration: 0.45, ease: S }, 23.35);
  tl.fromTo("#pE", { opacity: 0, x: -40, clipPath: "inset(0% 100% 0% 0% round 36px)" }, { opacity: 1, x: 0, clipPath: "inset(0% 0% 0% 0% round 36px)", duration: 0.55, ease: E3 }, 23.4);
  tl.fromTo("#prE", { opacity: 0, yPercent: 60, filter: "blur(16px)" }, { opacity: 1, yPercent: 0, filter: "blur(0px)", duration: 0.7, ease: E4 }, 23.88);
  FX.grow(tl, "#dvE", 24.4, 0.6);
  [["#iE1", 25.33], ["#iE2", 25.88]].forEach(([s, t]) => {
    tl.fromTo(s + " .chk", { scale: 0, rotation: -60 }, { scale: 1, rotation: 0, duration: 0.45, ease: "back.out(1.8)" }, t);
    tl.fromTo(s + " span", { opacity: 0, x: 30 }, { opacity: 1, x: 0, duration: 0.5, ease: E3 }, t + 0.05);
  });

  /* =========================================================== F · PAQUETE PLUS */
  tl.to("#cardE", { scale: 0.55, x: -320, y: -360, opacity: 0, filter: "blur(8px)", duration: 0.5, ease: "power3.inOut" }, 27.4);
  tl.to("#bdE", { opacity: 0, duration: 0.3 }, 27.4);
  tl.fromTo("#burstF", { scale: 0 }, { scale: 1, duration: 0.45, ease: "power3.in" }, 27.45);
  tl.to("#burstF", { scale: 0, duration: 0.55, ease: "power3.out" }, 27.95);
  tl.fromTo("#cardF", { opacity: 0, scale: 0.78, rotationY: 24, transformPerspective: 1600, filter: "blur(12px)" },
    { opacity: 1, scale: 1, rotationY: 0, filter: "blur(0px)", duration: 0.9, ease: "back.out(1.3)" }, 27.95);
  tl.fromTo("#pF", { opacity: 0, clipPath: "inset(0% 100% 0% 0% round 36px)" }, { opacity: 1, clipPath: "inset(0% 0% 0% 0% round 36px)", duration: 0.5, ease: E3 }, 28.05);
  tl.fromTo("#prF", { opacity: 0, scale: 1.25, filter: "blur(18px)" }, { opacity: 1, scale: 1, filter: "blur(0px)", duration: 0.65, ease: E4, transformOrigin: "0% 50%" }, 28.85);
  FX.grow(tl, "#dvF", 29.4, 0.6);
  [["#iF1", 30.3], ["#iF2", 30.75], ["#iF3", 31.2]].forEach(([s, t]) => {
    tl.fromTo(s + " .chk", { scale: 0, rotation: -60 }, { scale: 1, rotation: 0, duration: 0.45, ease: "back.out(1.8)" }, t);
    tl.fromTo(s + " span", { opacity: 0, x: 30 }, { opacity: 1, x: 0, duration: 0.5, ease: E3 }, t + 0.05);
  });
  // comparación breve entre paquetes
  tl.to("#cardF", { opacity: 0, scale: 0.6, x: 240, filter: "blur(8px)", duration: 0.45, ease: "power3.inOut" }, 31.75);
  tl.fromTo("#cmpE", { opacity: 0, x: -200 }, { opacity: 1, x: 0, duration: 0.55, ease: E4 }, 31.85);
  tl.fromTo("#cmpF", { opacity: 0, x: 200 }, { opacity: 1, x: 0, duration: 0.55, ease: E4 }, 31.95);
  FX.blurOut(tl, ["#cmpE", "#cmpF"], 32.55, { y: -80 });

  /* =========================================================== G · CIERRE */
  // Aparición 5: composición final asimétrica; el video se integra con el fondo institucional
  tl.fromTo("#v6w", { clipPath: "inset(0% 0% 0% 100% round 240px 0px 0px 70px)" }, { clipPath: "inset(0% 0% 0% 0% round 240px 0px 0px 70px)", duration: 0.85, ease: E4 }, 32.65);
  tl.fromTo("#v6z", { scale: 1.14, x: 40 }, { scale: 1.0, x: -20, duration: 4.95, ease: "none" }, 32.65);
  FX.charsIn(tl, "#tG1", 32.78, 0.03, 0.55);
  tl.fromTo("#tG1", { scale: 1.12, transformOrigin: "0% 50%" }, { scale: 1, duration: 0.8, ease: E4 }, 32.78);
  FX.charsOut(tl, "#tG1", 33.45, 0.006);
  FX.charsIn(tl, "#tG2a", 33.86, 0.03, 0.55); FX.charsIn(tl, "#tG2b", 34.02, 0.035, 0.6);
  FX.charsOut(tl, "#tG2a", 35.28, 0.006); FX.charsOut(tl, "#tG2b", 35.3, 0.006);
  FX.charsIn(tl, "#tG3a", 35.7, 0.025, 0.55); FX.charsIn(tl, "#tG3b", 35.95, 0.05, 0.6);
  tl.to("#v6w", { opacity: 0, filter: "blur(14px)", scale: 1.05, duration: 0.6, ease: S }, 37.2);
  FX.charsOut(tl, "#tG3a", 37.3); FX.charsOut(tl, "#tG3b", 37.32);
  // llamado a la acción final
  FX.charsIn(tl, "#cta1", 37.75, 0.03, 0.6);
  FX.charsIn(tl, "#cta2", 38.2, 0.035, 0.6);
  FX.grow(tl, "#ctaLine", 38.55, 0.7);
  FX.cardIn(tl, "#cWa", 38.65, { y: 60 });
  FX.cardIn(tl, "#cMail", 38.95, { y: 60 });
  tl.to(["#o1", "#o3"], { opacity: 0.7, duration: 1.2, ease: S }, 38.0);

  window.__timelines["seminario"] = tl;
})();
