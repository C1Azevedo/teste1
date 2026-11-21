/* Fundo dos cartões: campo de futebol americano em perspectiva (SVG gerado em código).
   Câmera alta, em diagonal, de uma end zone à outra. Tudo é calculado por uma
   homografia: coordenadas do campo (jardas) -> pixels do cartão. */
(() => {
  const W = 360, H = 250;          // viewBox compartilhado por todos os cartões
  const EZ = 14;                   // profundidade visual da end zone (jardas)
  const L = 100 + 2 * EZ;          // comprimento total modelado
  const FW = 53.33;                // largura do campo (jardas)

  // Cantos do campo na tela: FL (longe-esq), FR (longe-dir), NR (perto-dir), NL (perto-esq)
  const FL = [52, 66], FR = [298, 54], NR = [388, 212], NL = [-10, 228];

  // --- homografia quadrado unitário -> quadrilátero (Heckbert) -------------
  const [x0, y0] = FL, [x1, y1] = FR, [x2, y2] = NR, [x3, y3] = NL;
  const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3;
  const dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
  const den = dx1 * dy2 - dx2 * dy1;
  const g = (dx3 * dy2 - dx2 * dy3) / den;
  const h = (dx1 * dy3 - dx3 * dy1) / den;
  const A = x1 - x0 + g * x1, B = x3 - x0 + h * x3, C = x0;
  const D = y1 - y0 + g * y1, E = y3 - y0 + h * y3, F = y0;

  // u: jardas ao longo do campo (0..L), w: jardas na largura (0 = lado longe, FW = lado perto)
  const P = (u, w) => {
    const s = u / L, t = w / FW, k = g * s + h * t + 1;
    return [(A * s + B * t + C) / k, (D * s + E * t + F) / k];
  };
  const f1 = (n) => Math.round(n * 10) / 10;
  const pt = (p) => `${f1(p[0])},${f1(p[1])}`;
  const quad = (ua, ub, wa, wb) => [P(ua, wa), P(ub, wa), P(ub, wb), P(ua, wb)].map(pt).join(' ');
  const poly = (ua, ub, wa, wb, fill, extra = '') => `<polygon points="${quad(ua, ub, wa, wb)}" fill="${fill}" ${extra}/>`;

  // matriz afim local (em jardas) no ponto (u,w); ex/ey são os eixos do texto em coordenadas (u,w)
  function mat(u, w, ex, ey) {
    const p = P(u, w), pu = P(u + 1, w), pw = P(u, w + 1);
    const Du = [pu[0] - p[0], pu[1] - p[1]], Dw = [pw[0] - p[0], pw[1] - p[1]];
    const ax = [ex[0] * Du[0] + ex[1] * Dw[0], ex[0] * Du[1] + ex[1] * Dw[1]];
    const ay = [ey[0] * Du[0] + ey[1] * Dw[0], ey[0] * Du[1] + ey[1] * Dw[1]];
    return `matrix(${ax[0].toFixed(3)} ${ax[1].toFixed(3)} ${ay[0].toFixed(3)} ${ay[1].toFixed(3)} ${p[0].toFixed(2)} ${p[1].toFixed(2)})`;
  }

  // gerador pseudoaleatório fixo (o fundo é idêntico em todos os cartões)
  function rng(seed) {
    return () => {
      seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // ---- partes estáticas (calculadas uma vez) --------------------------------
  const GREEN_A = '#2a6b33', GREEN_B = '#357f3d';
  const FONT = `'Arial Black','Helvetica Neue',Arial,sans-serif`;

  function buildStands() {
    const r = rng(7);
    let s = `<rect width="${W}" height="${H}" fill="url(#gStands)"/>`;
    // fileiras da arquibancada
    for (let i = 0; i < 9; i++) {
      const y = 6 + i * 6.6;
      s += `<path d="M0 ${y} L${W} ${y - 5}" stroke="#fff" stroke-opacity="${0.025 + i * 0.004}" stroke-width="1"/>`;
    }
    let dots = '';
    const cols = ['#d7dde9', '#e9c58f', '#8fa7d1', '#dc7f82', '#bcd1a8', '#f3f3f3'];
    for (let i = 0; i < 260; i++) {
      const x = r() * W, y = 4 + r() * 56;
      const rad = 0.5 + r() * 1.1 * (0.6 + y / 60);
      dots += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(rad)}" fill="${cols[(r() * cols.length) | 0]}" opacity="${f1(0.12 + r() * 0.4)}"/>`;
    }
    s += `<g filter="url(#fBlur)">${dots}</g>`;
    // refletores
    for (const [x, y, rr] of [[56, 10, 30], [196, 4, 24], [330, 8, 30]]) {
      s += `<circle cx="${x}" cy="${y}" r="${rr}" fill="url(#gLight)"/><circle cx="${x}" cy="${y}" r="2.2" fill="#fff" opacity=".9"/>`;
    }
    // muro / faixa de publicidade escura na lateral distante
    const a = P(0, -1.6), b = P(L, -1.6), c = P(L, 0), d = P(0, 0);
    s += `<polygon points="${[a, b, c, d].map(pt).join(' ')}" fill="#0b0f16" opacity=".85"/>`;
    return s;
  }

  function buildTurf() {
    let s = '';
    // listras: 20 faixas de 5 jardas entre as end zones
    for (let i = 0; i < 20; i++) {
      s += poly(EZ + i * 5, EZ + (i + 1) * 5, 0, FW, i % 2 ? GREEN_B : GREEN_A);
    }
    return s;
  }

  function buildLines() {
    const white = '#f4f7f2';
    let s = '';
    const lineW = (yd, wd) => poly(yd - wd / 2, yd + wd / 2, 0, FW, white);
    // linhas de 5 em 5 jardas e linhas de gol / fundo
    for (let i = 0; i <= 20; i++) {
      const yd = EZ + i * 5;
      const goal = i === 0 || i === 20;
      s += `<g opacity="${goal ? 1 : 0.82}">${lineW(yd, goal ? 0.55 : i % 2 === 0 ? 0.36 : 0.26)}</g>`;
    }
    s += poly(0, 0.6, 0, FW, white, 'opacity=".9"') + poly(L - 0.6, L, 0, FW, white, 'opacity=".9"');
    // laterais
    s += poly(0, L, 0, 0.5, white, 'opacity=".95"') + poly(0, L, FW - 0.5, FW, white, 'opacity=".95"');
    // marcas de hash (a cada jarda) e marcas junto às laterais
    let ticks = '';
    const tick = (yd, w0, w1) => { ticks += 'M' + quad(yd - 0.09, yd + 0.09, w0, w1).split(' ').join(' L') + 'Z'; };
    const hashFar = 23.58, hashNear = FW - 23.58;
    for (let yd = EZ + 1; yd < EZ + 100; yd++) {
      if ((yd - EZ) % 5 === 0) continue;
      tick(yd, hashFar - 0.35, hashFar + 0.35);
      tick(yd, hashNear - 0.35, hashNear + 0.35);
      tick(yd, 0.5, 1.2);
      tick(yd, FW - 1.2, FW - 0.5);
    }
    s += `<path d="${ticks}" fill="${white}" opacity=".7"/>`;
    // números de jardas (lado perto em pé, lado longe de cabeça para baixo)
    for (let k = 1; k <= 9; k++) {
      const val = k <= 5 ? k * 10 : (10 - k) * 10;
      const yd = EZ + k * 10;
      const digits = String(val).split('');
      digits.forEach((dg, i) => {
        const du = (i === 0 ? -1.7 : 1.7);
        s += `<text transform="${mat(yd + du, 43.5, [1, 0], [0, 1])}" font-family="${FONT}" font-size="4.2" text-anchor="middle" fill="${white}" opacity=".85">${dg}</text>`;
        s += `<text transform="${mat(yd - du, 9.8, [-1, 0], [0, -1])}" font-family="${FONT}" font-size="4.2" text-anchor="middle" fill="${white}" opacity=".7">${dg}</text>`;
      });
    }
    return s;
  }

  // Trave em Y: haste, travessão e dois postes, em perspectiva
  function goalpost(u) {
    const base = P(u, FW / 2);
    const ku = Math.hypot(P(u + 1, FW / 2)[0] - base[0], P(u + 1, FW / 2)[1] - base[1]);
    const v = ku * 0.95;                       // pixels por jarda de altura
    const cb = P(u, FW / 2 - 3.08), ce = P(u, FW / 2 + 3.08);
    const barA = [cb[0], cb[1] - 3.33 * v], barB = [ce[0], ce[1] - 3.33 * v];
    const stemTop = [(barA[0] + barB[0]) / 2, (barA[1] + barB[1]) / 2];
    const upA = [barA[0], barA[1] - 11.67 * v], upB = [barB[0], barB[1] - 11.67 * v];
    const d = `M${pt(base)}L${pt(stemTop)}M${pt(barA)}L${pt(barB)}M${pt(barA)}L${pt(upA)}M${pt(barB)}L${pt(upB)}`;
    const sh = `M${pt(base)}L${pt([base[0] + 5, base[1] + 2])}`;
    return `<path d="${sh}" stroke="#000" stroke-opacity=".25" stroke-width="2" fill="none"/>
      <path d="${d}" stroke="#7a6a00" stroke-width="2.4" stroke-linecap="round" fill="none" opacity=".6"/>
      <path d="${d}" stroke="#ffd60a" stroke-width="1.5" stroke-linecap="round" fill="none"/>`;
  }

  const STATIC = {
    stands: buildStands(),
    turf: buildTurf(),
    lines: buildLines(),
    posts: goalpost(0) + goalpost(L),
  };

  // ---- cores -------------------------------------------------------------------
  const FALLBACK = '#2d3a4f';
  function hex(c) { return c && /^[0-9a-f]{6}$/i.test(c) ? '#' + c : null; }
  function lum(h6) {
    const n = parseInt(h6.slice(1), 16), r = (n >> 16) & 255, g_ = (n >> 8) & 255, b = n & 255;
    return (0.2126 * r + 0.7152 * g_ + 0.0722 * b) / 255;
  }
  function lift(h6, amt) { // clareia cores quase pretas para o campo não ficar um buraco preto
    const n = parseInt(h6.slice(1), 16);
    const m = (v) => Math.round(v + (255 - v) * amt);
    return '#' + [m((n >> 16) & 255), m((n >> 8) & 255), m(n & 255)].map((v) => v.toString(16).padStart(2, '0')).join('');
  }
  function zoneColor(team) {
    let c = hex(team.color) || hex(team.alt) || FALLBACK;
    if (lum(c) < 0.09 && hex(team.alt) && lum(hex(team.alt)) > 0.09) c = hex(team.alt);
    if (lum(c) < 0.12) c = lift(c, 0.22);
    return c;
  }

  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // largura relativa por letra (aproximação de fonte condensada/pesada)
  const adv = (ch) => ('IJ1'.includes(ch) ? 0.55 : 'MW'.includes(ch) ? 1.3 : ch === ' ' ? 0.5 : 1);

  // end zone: fundo, nome do time (letra a letra em perspectiva) e logo
  function endZone(side, team) {
    const left = side === 'left';
    const u0 = left ? 0 : L - EZ, u1 = left ? EZ : L;
    const col = zoneColor(team);
    const dark = lum(col) > 0.62;
    const ink = dark ? '#10151d' : '#ffffff';
    let s = poly(u0, u1, 0, FW, col);
    // leve gradiente de profundidade
    s += poly(u0, u1, 0, FW, 'url(#gEz)');

    const name = String(team.nick || team.abbr || '').toUpperCase();
    const span0 = 3, span1 = 25;                         // trecho (em w) ocupado pelo nome
    const chars = name.split('');
    const total = chars.reduce((a, c) => a + adv(c), 0);
    const uc = u0 + EZ / 2;
    // esquerda: lê de baixo para cima; direita: de cima para baixo
    let acc = 0;
    const ex = left ? [0, -1] : [0, 1];
    const ey = left ? [1, 0] : [-1, 0];
    const size = Math.min(7.2, ((span1 - span0) / total) * 1.15);
    chars.forEach((ch) => {
      const a = adv(ch);
      const mid = (acc + a / 2) / total;
      acc += a;
      if (ch === ' ') return;
      const w = left ? span1 - mid * (span1 - span0) : span0 + mid * (span1 - span0);
      s += `<text transform="${mat(uc + (left ? -size * 0.36 : size * 0.36), w, ex, ey)}" font-family="${FONT}" font-size="${f1(size)}" font-weight="900" text-anchor="middle" fill="${ink}" opacity=".92">${esc(ch)}</text>`;
    });
    // logo: decal plano no chão, de pé em relação à tela
    if (team.logo) {
      const wc = 39, half = 6.2;
      const m = mat(uc, wc, [1, 0], [0, 1]);
      s += `<g transform="${m}"><ellipse rx="${half * 0.95}" ry="${half * 0.95}" fill="${dark ? '#000' : '#fff'}" opacity=".14"/>
        <image href="${esc(team.logo)}" x="${-half}" y="${-half}" width="${half * 2}" height="${half * 2}" preserveAspectRatio="xMidYMid meet"/></g>`;
    }
    return s;
  }

  function render(g) {
    return `<svg class="field" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      ${STATIC.stands}
      <g>${STATIC.turf}${endZone('left', g.away)}${endZone('right', g.home)}</g>
      <g clip-path="url(#fieldClip)">
        ${STATIC.lines}
        <rect width="${W}" height="${H}" filter="url(#fGrass)" opacity=".3" style="mix-blend-mode:multiply"/>
        <rect width="${W}" height="${H}" fill="url(#gDepth)"/>
        <rect width="${W}" height="${H}" fill="url(#gSpot)"/>
      </g>
      ${STATIC.posts}
      <rect width="${W}" height="${H}" fill="url(#gVig)"/>
      <rect width="${W}" height="${H}" fill="url(#gScrim)"/>
    </svg>`;
  }

  // definições compartilhadas (filtros, gradientes, recorte do campo)
  function defs() {
    return `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>
      <linearGradient id="gStands" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#06080c"/><stop offset=".28" stop-color="#121a28"/><stop offset=".45" stop-color="#0a0e15"/><stop offset="1" stop-color="#05070a"/>
      </linearGradient>
      <radialGradient id="gLight"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".25" stop-color="#cfe3ff" stop-opacity=".22"/><stop offset="1" stop-color="#9ec3ff" stop-opacity="0"/></radialGradient>
      <linearGradient id="gEz" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".28"/><stop offset="1" stop-color="#fff" stop-opacity=".06"/></linearGradient>
      <linearGradient id="gDepth" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#0a1810" stop-opacity=".55"/><stop offset=".35" stop-color="#0a1810" stop-opacity=".12"/><stop offset=".75" stop-color="#fff" stop-opacity=".02"/><stop offset="1" stop-color="#000" stop-opacity=".3"/>
      </linearGradient>
      <radialGradient id="gSpot" cx="180" cy="120" r="210" gradientUnits="userSpaceOnUse" gradientTransform="translate(180 120) scale(1 .62) translate(-180 -120)">
        <stop offset="0" stop-color="#eaffd8" stop-opacity=".22"/><stop offset=".6" stop-color="#eaffd8" stop-opacity=".05"/><stop offset="1" stop-color="#000" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="gVig" cx="180" cy="130" r="230" gradientUnits="userSpaceOnUse"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".62"/></radialGradient>
      <radialGradient id="gScrim" cx="180" cy="132" r="105" gradientUnits="userSpaceOnUse" gradientTransform="translate(180 132) scale(1 .72) translate(-180 -132)"><stop offset="0" stop-color="#05080c" stop-opacity=".68"/><stop offset=".6" stop-color="#05080c" stop-opacity=".34"/><stop offset="1" stop-color="#05080c" stop-opacity="0"/></radialGradient>
      <filter id="fBlur" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation=".7"/></filter>
      <filter id="fGrass" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="1.1 .5" numOctaves="2" seed="11" result="n"/>
        <feColorMatrix in="n" type="matrix" values="0 0 0 0 .02  0 0 0 0 .09  0 0 0 0 .03  1.6 1.6 0 0 -1.15"/>
      </filter>
      <clipPath id="fieldClip"><polygon points="${quad(0, L, 0, FW)}"/></clipPath>
    </defs></svg>`;
  }

  window.Field = { render, defs };
})();
