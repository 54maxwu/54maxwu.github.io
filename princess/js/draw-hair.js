/* ---------- hair ---------- */
const BACK_BASE = 'M112,215 Q94,84 200,78 Q306,84 288,215 Q240,160 200,160 Q160,160 112,215Z';
const BACK = {
  long: 'M112,200 Q94,84 200,78 Q306,84 288,200 Q292,320 302,445 Q250,465 200,455 Q150,465 98,445 Q108,320 112,200Z',
  wavy: 'M112,200 Q94,84 200,78 Q306,84 288,200 Q312,240 292,280 Q316,320 296,360 Q320,400 302,440 Q292,472 262,462 Q242,482 220,464 Q200,482 180,464 Q158,482 138,462 Q108,472 98,440 Q80,400 104,360 Q84,320 108,280 Q88,240 112,200Z',
  mermaid: 'M112,200 Q94,84 200,78 Q306,84 288,200 Q314,250 294,300 Q320,350 300,400 Q326,450 306,500 Q330,540 312,570 Q290,590 262,570 Q240,592 220,572 Q200,592 180,572 Q160,592 138,570 Q110,590 88,570 Q70,540 94,500 Q74,450 100,400 Q80,350 106,300 Q86,250 112,200Z',
  superLong: 'M112,200 Q94,84 200,78 Q306,84 288,200 Q300,400 336,600 L64,600 Q100,400 112,200Z',
  bob: 'M106,205 Q92,84 200,78 Q308,84 294,205 L300,292 Q262,304 246,284 L154,284 Q138,304 100,292Z',
  pixie: 'M112,220 Q94,84 200,78 Q306,84 288,220 Q292,252 278,252 Q272,190 200,182 Q128,190 122,252 Q108,252 112,220Z',
};
Object.assign(BACK, { hime: BACK.long, halfUp: BACK.wavy, ringlets: BACK.long, crownBraid: BACK.long, waterfall: BACK.wavy, catBuns: BACK.long, flowerBun: BACK_BASE });
const LONG_BACK = ['long', 'wavy', 'mermaid', 'superLong', 'hime', 'halfUp', 'ringlets', 'crownBraid', 'waterfall', 'catBuns'];

function braid(x0, y0, n, dx, fill, c) {
  let s = '';
  for (let i = 0; i < n; i++) {
    const y = y0 + i * 26, x = x0 + i * dx, rx = 20 - i * 1.1;
    s += `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="16" fill="${fill}"/><path d="M${x - rx + 4},${y - 4} Q${x},${y + 8} ${x + rx - 4},${y - 4}" stroke="${shade(c, -25)}" stroke-width="2" fill="none" opacity=".5"/>`;
  }
  const ex = x0 + n * dx, ey = y0 + n * 26 - 12;
  return s + `<circle cx="${ex}" cy="${ey}" r="7" fill="${ACC}"/><path d="M${ex},${ey + 5} Q${ex - 8},${ey + 28} ${ex + 4},${ey + 42} Q${ex + 10},${ey + 22} ${ex + 6},${ey + 5}Z" fill="${fill}"/>`;
}
function braidArc(x0, y0, cx, cy, x1, y1, n, fill, c, rx = 13) {
  let s = '';
  for (let i = 0; i <= n; i++) {
    const t = i / n, [x, y] = qpt(x0, y0, cx, cy, x1, y1, t);
    const [xa, ya] = qpt(x0, y0, cx, cy, x1, y1, Math.min(1, t + 0.01)), [xb, yb] = qpt(x0, y0, cx, cy, x1, y1, Math.max(0, t - 0.01));
    const ang = Math.atan2(ya - yb, xa - xb) * 180 / Math.PI;
    s += `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${f1(ang)})"><ellipse rx="${rx}" ry="${rx * 0.75}" fill="${fill}"/><path d="M${-rx + 3},-3 Q0,7 ${rx - 3},-3" stroke="${shade(c, -25)}" stroke-width="1.6" fill="none" opacity=".5"/></g>`;
  }
  return s;
}

function drawHairBack(p, st) {
  const fill = `url(#${p}hair)`, c = st.hairColor, hs = st.hairStyle;
  let s = `<path d="${BACK[hs] || BACK_BASE}" fill="${fill}"/>`;
  const hl = shade(c, 30);
  if (hs === 'twin') s += both(`<path d="M118,150 Q58,180 66,260 Q72,320 54,380 Q104,350 104,280 Q106,210 126,166Z" fill="${fill}"/><path d="M92,200 Q80,260 74,330" stroke="${hl}" stroke-width="4" fill="none" opacity=".6" stroke-linecap="round"/>`);
  if (hs === 'curlyTwin') {
    let t = '';
    [[104, 176, 22], [86, 210, 22], [96, 246, 21], [80, 280, 20], [92, 314, 18], [78, 344, 16], [88, 370, 13]].forEach(([x, y, r]) =>
      t += `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/><path d="M${x - r * 0.5},${y} a${r * 0.5},${r * 0.5} 0 1,1 ${r * 0.5},${r * 0.5}" stroke="${hl}" stroke-width="2.5" fill="none" opacity=".6"/>`);
    s += both(t);
  }
  if (hs === 'bun' || hs === 'flowerBun') s += `<circle cx="200" cy="66" r="38" fill="${fill}"/><path d="M176,60 Q200,36 224,60 Q206,52 192,70" stroke="${shade(c, 25)}" stroke-width="4" fill="none" opacity=".7"/>`;
  if (hs === 'doubleBun') s += both(`<circle cx="134" cy="96" r="30" fill="${fill}"/><path d="M118,92 Q134,72 150,92" stroke="${shade(c, 25)}" stroke-width="3" fill="none" opacity=".7"/>`);
  if (hs === 'catBuns') s += both(`<path d="M108,122 Q108,64 128,50 Q138,74 168,92 Q140,110 108,122Z" fill="${fill}"/>`);
  if (hs === 'sideBun') s += `<circle cx="282" cy="140" r="30" fill="${fill}"/><path d="M266,136 Q282,116 298,136" stroke="${shade(c, 25)}" stroke-width="3" fill="none" opacity=".7"/>`;
  if (hs === 'halfUp') s += `<path d="M200,70 Q170,40 160,70 Q170,92 200,78 Q230,92 240,70 Q230,40 200,70Z" fill="${ACC}"/>`;
  if (hs === 'ponytail') s += `<path d="M228,96 Q340,110 320,260 Q306,340 336,420 Q272,380 274,270 Q278,170 214,120Z" fill="${fill}"/><path d="M300,170 Q312,250 300,330" stroke="${hl}" stroke-width="4" fill="none" opacity=".5"/>`;
  if (hs === 'bubblePony') {
    s += [[296, 150, 30], [308, 214, 28], [306, 274, 25], [298, 328, 21], [290, 374, 17], [284, 412, 12]].map(([x, y, r], i) =>
      `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/><path d="M${x - r * 0.5},${y - r * 0.4} Q${x},${y - r * 0.9} ${x + r * 0.5},${y - r * 0.4}" stroke="${hl}" stroke-width="3" fill="none" opacity=".6"/>`
      + (i ? `<ellipse cx="${x + 2}" cy="${y - r - 2}" rx="${r * 0.55}" ry="4" fill="${ACC}"/>` : '')).join('');
  }
  if (hs === 'bigCurls' || hs === 'shortCurly') {
    const big = hs === 'bigCurls';
    let t = '';
    for (let i = 0; i <= 12; i++) {
      const a = Math.PI * (0.95 + i * 1.1 / 12);
      t += `<circle cx="${f1(200 + Math.cos(a) * (big ? 104 : 92))}" cy="${f1((big ? 180 : 172) + Math.sin(a) * (big ? 100 : 90))}" r="${big ? 36 : 28}" fill="${fill}"/>`;
    }
    (big ? [[110, 270], [290, 270], [120, 320], [280, 320], [140, 350], [260, 350]] : [[116, 250], [284, 250], [124, 278], [276, 278]]).forEach(([x, y]) => t += `<circle cx="${x}" cy="${y}" r="${big ? 32 : 22}" fill="${fill}"/>`);
    s = t + s;
  }
  if (st.hairStreak && LONG_BACK.includes(hs)) s += both(`<path d="M108,250 Q100,330 108,420" stroke="${st.hairStreak}" stroke-width="9" fill="none" stroke-linecap="round" opacity=".85"/>`);
  return s;
}

const BANG_SIDE = 'M116,205 Q98,88 200,82 Q302,88 284,205 Q284,150 262,124 Q238,150 198,138 Q170,132 150,118 Q124,150 116,205Z';
const BANGS = {
  side: BANG_SIDE,
  straight: 'M116,205 Q98,88 200,82 Q302,88 284,205 Q282,172 276,146' + scallop(276, 124, 146, 7, 9) + ' Q118,172 116,205Z',
  mini: 'M116,205 Q98,88 200,82 Q302,88 284,205 Q282,160 272,124' + scallop(272, 128, 124, 8, 7) + ' Q118,160 116,205Z',
  curtain: 'M116,205 Q98,88 200,82 Q302,88 284,205 Q276,148 236,132 Q212,124 200,108 Q188,124 164,132 Q124,148 116,205Z',
  middle: 'M116,205 Q98,88 200,82 Q302,88 284,205 Q276,128 200,104 Q124,128 116,205Z',
  sideLong: 'M116,205 Q98,88 200,82 Q302,88 284,205 Q286,250 272,282 Q266,196 238,160 Q200,130 150,140 Q126,160 116,205Z',
  none: 'M116,195 Q98,88 200,82 Q302,88 284,195 Q272,108 200,100 Q128,108 116,195Z',
  wispy: 'M116,205 Q98,88 200,82 Q302,88 284,205 Q280,140 262,118 L138,118 Q120,140 116,205Z',
  curl: 'M116,205 Q98,88 200,82 Q302,88 284,205 Q280,140 258,120 Q200,128 142,120 Q120,140 116,205Z',
};

function drawHairFront(p, st) {
  const fill = `url(#${p}hair)`, c = st.hairColor, hs = st.hairStyle;
  let s = '';
  if (['long', 'wavy', 'halfUp', 'mermaid', 'crownBraid', 'waterfall', 'catBuns'].includes(hs)) s += both(`<path d="M120,180 Q106,250 114,330 Q128,290 130,230Z" fill="${fill}"/>`);
  if (hs === 'superLong') s += both(`<path d="M120,180 Q100,280 112,380 Q130,320 130,230Z" fill="${fill}"/>`);
  if (hs === 'hime') s += both(`<path d="M117,166 L113,272 L138,272 L135,166Z" fill="${fill}"/>`);
  if (hs === 'bob') s += both(`<path d="M118,178 Q104,240 112,286 Q130,270 132,220Z" fill="${fill}"/>`);
  if (hs === 'pixie') s += both(`<path d="M120,186 Q110,226 124,252 Q132,222 134,196Z" fill="${fill}"/>`);
  if (hs === 'bigCurls' || hs === 'shortCurly') s += both(`<circle cx="120" cy="250" r="16" fill="${fill}"/><circle cx="116" cy="222" r="14" fill="${fill}"/>`);
  if (hs === 'ringlets') {
    let t = `<path d="M122,176 Q110,200 116,224Z" fill="${fill}"/>`;
    [[114, 230], [110, 262], [114, 294], [108, 326], [112, 358], [106, 390]].forEach(([x, y], i) => t += `<ellipse cx="${x}" cy="${y}" rx="${13 - i * 0.8}" ry="17" fill="${fill}"/><path d="M${x - 8},${y - 6} Q${x + 10},${y} ${x - 8},${y + 8}" stroke="${shade(c, 30)}" stroke-width="2.2" fill="none" opacity=".6"/>`);
    s += both(t);
  }
  if (hs === 'sidePony') s += `<path d="M126,150 Q66,210 92,300 Q116,360 96,430 Q150,390 138,300 Q128,230 140,166Z" fill="${fill}"/><path d="M104,240 Q112,300 106,380" stroke="${shade(c, 30)}" stroke-width="4" fill="none" opacity=".5"/>`;
  if (hs === 'braid') s += `<path d="M272,140 Q292,180 276,230Z" fill="${fill}"/>` + braid(270, 228, 8, 2.5, fill, c);
  if (hs === 'twinBraids') s += both(`<path d="M128,140 Q108,180 124,226Z" fill="${fill}"/>` + braid(128, 226, 7, -2, fill, c));
  if (hs === 'fishtail') {
    s += `<path d="M272,140 Q292,180 276,230Z" fill="${fill}"/>`;
    for (let i = 0; i < 11; i++) {
      const y = 228 + i * 19, x = 272 + i * 2, k = 1 - i * 0.04;
      s += `<ellipse cx="${x - 6 * k}" cy="${y}" rx="${10 * k}" ry="${13 * k}" fill="${fill}" transform="rotate(30 ${x - 6 * k} ${y})"/><ellipse cx="${x + 6 * k}" cy="${y}" rx="${10 * k}" ry="${13 * k}" fill="${fill}" transform="rotate(-30 ${x + 6 * k} ${y})"/><path d="M${x},${y - 8} L${x},${y + 8}" stroke="${shade(c, -25)}" stroke-width="1.2" opacity=".5"/>`;
    }
    s += `<circle cx="294" cy="440" r="6" fill="${ACC}"/><path d="M294,444 Q286,466 298,480 Q302,462 298,444Z" fill="${fill}"/>`;
  }

  // bangs / top cap
  if (st.bangs === 'sideR') s += mirror(`<path d="${BANG_SIDE}" fill="${fill}"/>`);
  else s += `<path d="${BANGS[st.bangs] || BANG_SIDE}" fill="${fill}"/>`;
  if (st.bangs === 'wispy') for (let x = 146; x <= 254; x += 18) s += `<path d="M${x - 9},116 Q${x},140 ${x + 1},154 Q${x + 5},134 ${x + 9},116Z" fill="${fill}"/>`;
  if (st.bangs === 'curl') s += both(`<path d="M172,118 Q164,134 174,146 Q184,152 186,142 Q186,134 178,136" stroke="${fill}" stroke-width="7" fill="none" stroke-linecap="round"/>`);
  if (st.bangs === 'middle') s += `<path d="M200,84 L200,104" stroke="${shade(c, -25)}" stroke-width="2"/>`;
  s += `<path d="M146,106 Q190,88 236,100" stroke="${shade(c, 45)}" stroke-width="7" fill="none" opacity=".55" stroke-linecap="round"/>`
    + `<path d="M160,96 Q176,90 190,90" stroke="#fff" stroke-width="3" fill="none" opacity=".6" stroke-linecap="round"/>`;

  if (hs === 'crownBraid') s += braidArc(120, 176, 200, 40, 280, 176, 12, fill, c, 12);
  if (hs === 'waterfall') s += braidArc(122, 150, 200, 112, 278, 140, 9, fill, c, 10);
  if (hs === 'twin' || hs === 'curlyTwin') s += both(`<circle cx="120" cy="156" r="10" fill="${ACC}"/><circle cx="117" cy="153" r="3" fill="#fff" opacity=".7"/>`);
  if (hs === 'bun') s += `<path d="M178,92 Q200,100 222,92" stroke="${ACC}" stroke-width="7" fill="none" stroke-linecap="round"/>`;
  if (hs === 'flowerBun') s += flower(172, 74, 7, '#fff', '#ffd166') + flower(228, 74, 7, '#ff9ccf') + flower(200, 40, 6, '#c79bff') + flower(186, 96, 5, '#ffc2dd') + flower(214, 96, 5, '#fff');
  if (hs === 'doubleBun') s += both(`<path d="M128,120 Q140,112 154,116" stroke="${ACC}" stroke-width="6" fill="none" stroke-linecap="round"/>`);
  if (hs === 'sideBun') s += `<path d="M262,156 Q276,166 290,166" stroke="${ACC}" stroke-width="6" fill="none" stroke-linecap="round"/>`;
  if (hs === 'catBuns') s += both(`<path d="M120,104 Q124,76 132,66" stroke="${shade(c, 35)}" stroke-width="3" fill="none" opacity=".6"/>`);
  if (hs === 'ponytail' || hs === 'bubblePony') s += `<circle cx="226" cy="100" r="9" fill="${ACC}"/>`;
  if (hs === 'sidePony') s += `<circle cx="130" cy="160" r="10" fill="${ACC}"/>`;
  if (st.hairStreak) s += `<path d="M168,88 Q156,108 148,132 M240,92 Q254,110 262,130" stroke="${st.hairStreak}" stroke-width="7" fill="none" stroke-linecap="round" opacity=".85"/>`
    + (['long', 'wavy', 'mermaid', 'halfUp', 'crownBraid', 'waterfall', 'catBuns', 'superLong'].includes(hs) ? both(`<path d="M120,200 Q114,250 118,300" stroke="${st.hairStreak}" stroke-width="5" fill="none" stroke-linecap="round" opacity=".85"/>`) : '');
  return s;
}

/* hair accessories (combine with crowns) */
function drawHairAcc(st) {
  switch (st.hairAcc) {
    case 'pearlPins': return [[124, 160], [130, 144], [140, 130]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5.5" fill="#fffaf0" stroke="#e8dcc0"/><circle cx="${x - 1.5}" cy="${y - 1.5}" r="1.6" fill="#fff"/>`).join('');
    case 'starChain': return `<path d="M120,164 Q200,112 280,164" stroke="${GOLD}" stroke-width="1.5" fill="none"/>` + [0.1, 0.25, 0.4, 0.6, 0.75, 0.9].map((t, i) => { const [x, y] = qpt(120, 164, 200, 112, 280, 164, t); return `<line x1="${f1(x)}" y1="${f1(y)}" x2="${f1(x)}" y2="${f1(y + 8 + (i % 2) * 6)}" stroke="${GOLD}" stroke-width="1"/>` + anim(`<path d="${starPath(x, y + 10 + (i % 2) * 6, 5, 2.2)}" fill="#ffd23f"/>`, 'tw', i * 0.3); }).join('');
    case 'pearlStrand': return beadsAlong(124, 150, 200, 96, 276, 150, 18, 3.2, () => '#fffaf0') + beadsAlong(130, 168, 200, 124, 270, 168, 14, 2.6, () => '#ffe9f2');
    case 'flowerVine': return `<path d="M150,108 Q124,140 120,180 Q114,230 118,280" stroke="#5fbf6f" stroke-width="3" fill="none"/>` + [[150, 110, '#ff9ccf'], [130, 140, '#fff'], [121, 178, '#c79bff'], [117, 220, '#ff9ccf'], [118, 262, '#fff']].map(([x, y, c]) => flower(x, y, 5, c)).join('')
      + [[140, 124], [124, 160], [118, 200], [118, 244]].map(([x, y], i) => `<ellipse cx="${x + 6}" cy="${y}" rx="6" ry="3" fill="#7ed957" transform="rotate(${i % 2 ? 30 : -30} ${x + 6} ${y})"/>`).join('');
    case 'sakura': return `<path d="M150,112 Q130,120 118,146" stroke="#8d5a3b" stroke-width="3" fill="none"/>` + [[150, 110], [136, 116], [124, 132], [118, 148], [142, 128]].map(([x, y], i) => flower(x, y, i === 4 ? 4 : 5.5, '#ffc2dd', '#ff8fb8')).join('');
    case 'ribbonStreamers': return [['#ff9ccf', 0], ['#bfe6ff', 8], ['#d9c2ff', 16]].map(([c, d]) => `<path d="M128,${140 + d / 2} Q${100 - d},${200 + d} ${112 + d / 2},${260 + d} Q${124},${300 + d} ${104 - d / 2},${340 + d}" stroke="${c}" stroke-width="5" fill="none" stroke-linecap="round"/>`).join('')
      + `<path d="M128,142 Q116,130 114,142 Q116,154 128,142 Q140,130 142,142 Q140,154 128,142Z" fill="${ACC}"/><circle cx="128" cy="142" r="3.5" fill="#e0306f"/>`;
    case 'butterflies': return anim(butterfly(130, 140, 0.9, '#7fc8ff', '#c79bff'), 'fl', 0) + anim(butterfly(270, 132, 0.7, '#ff9ccf'), 'fl', 0.8) + anim(butterfly(120, 190, 0.6, '#ffd166'), 'fl', 1.4);
    case 'gemPins': return [[124, 162, '#ff6fae'], [130, 146, '#8fd3ff'], [140, 132, '#c79bff'], [152, 120, '#9effe0']].map(([x, y, c]) => gem(x, y, 6, c)).join('');
    case 'heartClips': return [[124, 162], [131, 145], [141, 130]].map(([x, y], i) => `<path d="${heartPath(x, y - 6, 12)}" fill="${['#ff4d8d', '#ff9ccf', '#ffc2dd'][i]}" stroke="#fff"/>`).join('');
    case 'bowPins': return both(`<path d="M130,150 Q118,140 118,152 Q118,162 130,150 Q142,140 142,152 Q142,162 130,150Z" fill="#ff9ccf" stroke="#fff"/><circle cx="130" cy="150" r="3" fill="#e0568f"/>`);
    case 'moonStars': return `<path d="M136,122 a14,14 0 1,0 0,28 a10,10 0 1,1 0,-28Z" fill="#ffe680" stroke="#fff" stroke-width="1.5"/>` + anim(`<path d="${starPath(150, 120, 5, 2.2)}" fill="#fff"/>`, 'tw', 0.2) + anim(`<path d="${starPath(122, 164, 4, 1.8)}" fill="#ffe680"/>`, 'tw', 0.9);
    case 'feather': return `<path d="M136,140 Q100,80 120,40 Q128,90 140,136Z" fill="#fff" stroke="#e3e0f0"/><path d="M136,140 Q118,90 120,44" stroke="#d9c2ff" stroke-width="1.5" fill="none"/><path d="M142,142 Q124,96 146,62 Q146,100 146,140Z" fill="#ffc2dd"/>` + gem(140, 144, 6, '#8fd3ff');
    case 'beads': return both(`<path d="M126,150 Q120,220 124,290" stroke="${GOLD}" stroke-width="1" fill="none"/>` + [0, 1, 2, 3, 4, 5, 6].map(i => { const [x, y] = qpt(126, 150, 120, 220, 124, 290, i / 6); return `<circle cx="${f1(x)}" cy="${f1(y)}" r="3.2" fill="${['#ff9ccf', '#fff', '#c79bff', '#bfe6ff'][i % 4]}"/>`; }).join(''));
    case 'crystalComb': return `<path d="M116,150 Q130,130 152,120" stroke="#dfe6f0" stroke-width="6" fill="none" stroke-linecap="round"/>` + [[118, 152], [128, 140], [140, 130], [152, 122]].map(([x, y]) => `<line x1="${x}" y1="${y}" x2="${x - 4}" y2="${y + 16}" stroke="#dfe6f0" stroke-width="1"/>` + `<path d="M${x - 4},${y + 16} Q${x - 8},${y + 22} ${x - 4},${y + 26} Q${x},${y + 22} ${x - 4},${y + 16}Z" fill="#bfe9ff" stroke="#fff"/>`).join('');
    case 'glitterDust': { const r = seeded(11); let s = ''; for (let i = 0; i < 22; i++) { const a = Math.PI * (1.05 + r() * 0.9), d = 80 + r() * 30; s += anim(`<path d="${sparklePath(200 + Math.cos(a) * d, 175 + Math.sin(a) * d, 2 + r() * 3)}" fill="${i % 3 ? '#fff' : '#ffe680'}"/>`, 'tw', r() * 3); } return s; }
    default: return '';
  }
}
