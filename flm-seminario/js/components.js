/* Academia FLM · componentes reutilizables de animación (GSAP, deterministas y seek-safe).
   Cada componente recibe el timeline raíz y un tiempo absoluto en segundos. */
(function () {
  const STOPS = [[0, 217, 181], [50, 188, 229], [108, 92, 231]]; // menta → cian → violeta
  const lerp = (a, b, k) => Math.round(a + (b - a) * k);
  const gradColor = (u) => {
    const s = u < 0.5 ? 0 : 1, k = u < 0.5 ? u * 2 : (u - 0.5) * 2, a = STOPS[s], b = STOPS[s + 1];
    return `rgb(${lerp(a[0], b[0], k)},${lerp(a[1], b[1], k)},${lerp(a[2], b[2], k)})`;
  };

  /* Tipografía: divide los textos marcados con data-split="words|chars|grad". */
  function splitText(root = document) {
    root.querySelectorAll("[data-split]").forEach((el) => {
      const mode = el.dataset.split, txt = el.textContent.trim();
      if (mode === "words") {
        el.innerHTML = txt.split(" ").map((w) => `<span class="w"><span>${w}</span></span>`).join(" ");
        return;
      }
      const n = [...txt].filter((c) => c !== " ").length;
      let k = 0, html = "";
      for (const c of txt) {
        if (c === " ") { html += " "; continue; }
        const col = mode === "grad" ? ` style="color:${gradColor(k / Math.max(n - 1, 1))}"` : "";
        html += `<span class="m"><span class="ch"${col}>${c}</span></span>`;
        k++;
      }
      el.innerHTML = html;
    });
  }

  const E4 = "power4.out", E3 = "power3.out", S = "sine.inOut", IN = "power3.in";

  const FX = {
    E4, E3, S, IN,
    /* letras que suben desde su máscara */
    charsIn: (tl, sel, t, st = 0.035, d = 0.7) =>
      tl.fromTo(sel + " .ch", { yPercent: 140, rotation: 7, opacity: 0 }, { yPercent: 0, rotation: 0, opacity: 1, duration: d, ease: E3, stagger: st }, t),
    charsOut: (tl, sel, t, st = 0.012) =>
      tl.to(sel + " .ch", { yPercent: -140, rotation: -4, opacity: 0, duration: 0.34, ease: IN, stagger: st }, t),
    /* palabras con máscara */
    wordsIn: (tl, sel, t, st = 0.07, d = 0.6) =>
      tl.fromTo(sel + " .w > span", { yPercent: 140, opacity: 0 }, { yPercent: 0, opacity: 1, duration: d, ease: E3, stagger: st }, t),
    wordsOut: (tl, sel, t) =>
      tl.to(sel + " .w > span", { yPercent: -140, opacity: 0, duration: 0.32, ease: IN, stagger: 0.025 }, t),
    /* entrada con desenfoque controlado (motion blur) */
    blurIn: (tl, sel, t, from = {}) =>
      tl.fromTo(sel, { opacity: 0, y: 40, filter: "blur(14px)", ...from }, { opacity: 1, y: 0, x: 0, scale: 1, filter: "blur(0px)", duration: 0.8, ease: E4 }, t),
    blurOut: (tl, sel, t, to = {}) =>
      tl.to(sel, { opacity: 0, y: -50, filter: "blur(12px)", duration: 0.4, ease: IN, ...to }, t),
    /* icono / elemento con pop elegante (sin rebote elástico) */
    pop: (tl, sel, t, d = 0.55) =>
      tl.fromTo(sel, { opacity: 0, scale: 0.55 }, { opacity: 1, scale: 1, duration: d, ease: "back.out(1.4)" }, t),
    /* trazo SVG (pathLength="1") */
    draw: (tl, sel, t, d = 0.8, ease = "power2.inOut") =>
      tl.fromTo(sel, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: d, ease }, t),
    /* barra que crece */
    grow: (tl, sel, t, d = 0.7, origin = "left center") =>
      tl.fromTo(sel, { scaleX: 0, transformOrigin: origin }, { scaleX: 1, duration: d, ease: E3 }, t),
    /* contador numérico */
    countTo: (tl, el, to, t, d, fmt = (v) => Math.round(v)) => {
      const o = { v: 0 }, node = document.querySelector(el);
      tl.fromTo(o, { v: 0 }, { v: to, duration: d, ease: "power2.out", onUpdate: () => { node.textContent = fmt(o.v); } }, t);
    },
    /* forma orgánica: el borde se transforma entre varias siluetas */
    morph: (tl, sel, t, d, shapes) => {
      const step = d / shapes.length;
      shapes.forEach((r, i) => tl.to(sel, { borderRadius: r, duration: step, ease: S }, t + i * step));
    },
    /* tarjeta editorial que entra flotando */
    cardIn: (tl, sel, t, from = {}) =>
      tl.fromTo(sel, { opacity: 0, y: 90, scale: 0.94, filter: "blur(10px)", ...from },
        { opacity: 1, y: 0, x: 0, scale: 1, rotationY: 0, filter: "blur(0px)", duration: 0.9, ease: E4 }, t),
  };

  window.FLM = { splitText, gradColor, FX };
})();
