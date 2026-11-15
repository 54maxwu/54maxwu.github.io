/* ---------- extra dresses, fabrics, patterns, trims, shawls, belts, legwear ---------- */
extend('dressParts', (st) => st.dress, {
  bellGown: (o, st) => {
    const r = o({ ...st, dress: 'ball' }), lt = shade(st.dressColor, 35);
    r.paths = [`${WAIST} Q298,430 312,500 Q326,570 352,596 L48,596 Q74,570 88,500 Q102,430 156,400Z`];
    r.deco = [470, 520, 570].map((y, i) => `<path d="M${84 - i * 10},${y} Q200,${y + 16} ${316 + i * 10},${y}" stroke="${lt}" stroke-width="5" fill="none" opacity=".8"/>`).join('');
    r.hem = { y: 592, x1: 50, x2: 350 };
    return r;
  },
  ruffleTier: (o, st) => {
    const r = o({ ...st, dress: 'ball' }), lt = shade(st.dressColor, 30);
    r.paths = [[600, 160], [540, 130], [480, 100]].map(([y, h]) => `M${200 - h * 0.5},${y - 70} L${200 + h * 0.5},${y - 70} Q${200 + h * 0.9},${y - 40} ${200 + h},${y - 4}${scallop(200 + h, 200 - h, y - 4, 12, 9)} Q${200 - h * 0.9},${y - 40} ${200 - h * 0.5},${y - 70}Z`);
    r.paths.push(`${WAIST} L244,430 L156,430Z`);
    r.deco = [[596, 160], [536, 130], [476, 100]].map(([y, h]) => `<path d="M${200 - h + 4},${y - 6}${scallop(200 - h + 4, 200 + h - 4, y - 6, 12, 6)}" stroke="${lt}" stroke-width="3" fill="none"/>`).join('');
    r.hem = { y: 592, x1: 44, x2: 356 };
    return r;
  },
  nightSky: (o, st) => {
    const r = o({ ...st, dress: 'star' });
    r.paths = [`${WAIST} Q290,470 326,600 L74,600 Q110,470 156,400Z`];
    r.deco = `<path d="M150,500 a22,22 0 1,0 16,38 a17,17 0 1,1 -16,-38Z" fill="#fff3a6"/>` + r.deco;
    r.hem = { y: 596, x1: 76, x2: 324 };
    return r;
  },
  grecian: (o, st) => {
    const r = o({ ...st, dress: 'offshoulder' }), dk = shade(st.dressColor, -20), lt = shade(st.dressColor, 35);
    r.bodice = 'M154,332 Q200,322 246,316 L242,405 Q200,414 158,405Z';
    r.paths = [`${WAIST} Q270,480 300,600 L100,600 Q130,480 156,400Z`];
    r.deco = [140, 170, 200, 230, 260].map(x => `<path d="M200,412 Q${(200 + x) / 2},500 ${x},600" stroke="${lt}" stroke-width="2.5" fill="none" opacity=".6"/>`).join('');
    r.over = `<path d="M238,318 L222,294" stroke="${dk}" stroke-width="9" stroke-linecap="round"/><path d="M156,330 Q200,350 240,320" stroke="${lt}" stroke-width="4" fill="none"/><rect x="156" y="398" width="88" height="8" rx="4" fill="${GOLD}"/>`;
    r.hem = { y: 596, x1: 102, x2: 298 };
    return r;
  },
  sunflower: (o, st) => {
    const r = o({ ...st, dress: 'party' });
    r.paths = [`${WAIST} Q292,440 306,510 L94,510 Q108,440 156,400Z`];
    r.deco = [...Array(14)].map((_, i) => `<ellipse cx="${f1(96 + i * 16)}" cy="514" rx="7" ry="13" fill="#ffd23f" stroke="#f5b700" stroke-width="1"/>`).join('') + flower(200, 404, 9, '#ffd23f', '#8d5a3b');
    r.hem = { y: 510, x1: 96, x2: 304 };
    return r;
  },
  lolita: (o, st) => {
    const r = o({ ...st, dress: 'bubble' }), dk = shade(st.dressColor, -25);
    r.pre = `<path d="${WAIST} Q300,430 316,500${scallop(316, 84, 500, 12, 10)} Q100,430 156,400Z" fill="#fff"/>`;
    r.paths = [`${WAIST} Q294,428 306,488${scallop(306, 94, 488, 10, 10)} Q106,428 156,400Z`];
    r.deco = `<path d="M176,410 L224,410 L236,480 L164,480Z" fill="#fff" opacity=".92"/><path d="M164,480${scallop(164, 236, 480, 6, 6)}" stroke="#fff" stroke-width="3" fill="none"/>`
      + [430, 450].map(y => `<path d="M${170 + (y - 430) * 0.2},${y} L${230 - (y - 430) * 0.2},${y}" stroke="${shade(st.dressColor, 20)}" stroke-width="2" stroke-dasharray="3 3"/>`).join('');
    r.over = both(`<circle cx="152" cy="326" r="19" fill="#fff"/><circle cx="152" cy="326" r="13" fill="${st.dressColor}"/>`) + `<path d="M200,334 Q186,324 186,336 Q186,346 200,336 Q214,324 214,336 Q214,346 200,336Z" fill="${dk}"/>`;
    r.hem = { y: 496, x1: 88, x2: 312 };
    return r;
  },
  sailor: (o, st) => {
    const r = o({ ...st, dress: 'party' });
    r.paths = [`${WAIST} L300,482 L100,482Z`];
    r.deco = [120, 145, 170, 195, 220, 245, 270].map((x, i) => `<path d="M${200 + (x - 200) * 0.45},404 L${x + 6},482" stroke="${shade(st.dressColor, -18)}" stroke-width="1.6"/>`).join('');
    r.over = `<path d="M160,318 L200,352 L240,318 L252,342 L200,372 L148,342Z" fill="#2e3a6e"/><path d="M164,326 L200,356 L236,326" stroke="#fff" stroke-width="2" fill="none"/><path d="M200,356 Q186,346 186,358 Q188,368 200,360 Q212,346 214,358 Q212,368 200,360Z" fill="#e53950"/><path d="M198,362 L192,384 M202,362 L208,384" stroke="#e53950" stroke-width="4"/>`;
    r.hem = { y: 482, x1: 102, x2: 298 };
    return r;
  },
  pinafore: (o, st) => {
    const r = o({ ...st, dress: 'party' });
    r.paths = [`${WAIST} Q288,430 300,490 L100,490 Q112,430 156,400Z`];
    r.deco = `<path d="M170,404 L230,404 L246,484${scallop(246, 154, 484, 7, 8)} Z" fill="#fff"/><rect x="186" y="430" width="28" height="22" rx="5" fill="none" stroke="${shade(st.dressColor, -15)}" stroke-width="1.6"/>`;
    r.over = `<path d="M176,404 L176,330 Q186,322 196,330 L196,404Z M224,404 L224,330 Q214,322 204,330 L204,404Z" fill="#fff" opacity=".95"/>` + both(`<path d="M168,318 Q178,312 188,320" stroke="#fff" stroke-width="5" fill="none"/>`);
    r.hem = { y: 490, x1: 102, x2: 298 };
    return r;
  },
});

/* fabrics */
extend('fabricDefs', (p, type) => type, {
  iridescent: (o, p) => o(p, 'satin') + `<linearGradient id="${p}fab" gradientUnits="userSpaceOnUse" x1="40" y1="320" x2="360" y2="600">${gradStops(['#e6fffa', '#ffe6fa', '#e6f0ff', '#fff9e6', '#f0e6ff'])}</linearGradient>`,
  chiffon: (o, p) => o(p, 'satin') + `<pattern id="${p}fab" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M3,0 L3,10" stroke="#fff" stroke-width="1.2" opacity=".6"/></pattern>`,
  laceOverlay: (o, p) => o(p, 'satin') + patternDef(`${p}fab`, 'lace', '#fff'),
  sequin: (o, p) => o(p, 'satin') + `<pattern id="${p}fab" width="12" height="12" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="2.4" fill="#fff" opacity=".7"/><circle cx="9" cy="9" r="2.4" fill="#ffe680" opacity=".6"/></pattern>`,
  metallic: (o, p) => o(p, 'satin') + `<linearGradient id="${p}fab" gradientUnits="userSpaceOnUse" x1="60" y1="0" x2="340" y2="0">${gradStops(['#ffffff', '#555566', '#ffffff', '#666677', '#ffffff'])}</linearGradient>`,
});
extend('fabricOver', (p, type) => type, {
  iridescent: (o, p, t, d) => `<path d="${d}" fill="url(#${p}fab)" opacity=".55"/>` + o(p, 'satin', d),
  chiffon: (o, p, t, d) => `<path d="${d}" fill="#fff" opacity=".18"/><path d="${d}" fill="url(#${p}fab)" opacity=".5"/>` + o(p, 'satin', d),
  laceOverlay: (o, p, t, d) => `<path d="${d}" fill="url(#${p}fab)" opacity=".6"/>`,
  sequin: (o, p, t, d) => `<path d="${d}" fill="url(#${p}fab)"/>` + o(p, 'satin', d),
  metallic: (o, p, t, d) => `<path d="${d}" fill="url(#${p}fab)" opacity=".3"/>` + o(p, 'satin', d),
});

/* patterns */
extend('patternDef', (id, type) => type, {
  strawberries: (o, id) => `<pattern id="${id}" width="34" height="34" patternUnits="userSpaceOnUse"><path d="M10,6 Q18,7 17,14 Q14,21 10,22 Q6,21 3,14 Q2,7 10,6Z" fill="#ff4d6d"/><path d="M6,6 L10,3 L14,6Z" fill="#4caf50"/><circle cx="8" cy="12" r=".9" fill="#fff"/><circle cx="12" cy="15" r=".9" fill="#fff"/></pattern>`,
  cherries: (o, id) => `<pattern id="${id}" width="34" height="34" patternUnits="userSpaceOnUse"><path d="M14,4 Q9,10 9,15 M14,4 Q19,10 20,15" stroke="#4caf50" stroke-width="1.3" fill="none"/><circle cx="9" cy="17" r="4" fill="#e53950"/><circle cx="20" cy="17" r="4" fill="#e53950"/></pattern>`,
  bunnies: (o, id, t, ink) => `<pattern id="${id}" width="36" height="36" patternUnits="userSpaceOnUse"><g fill="${ink}"><ellipse cx="9" cy="8" rx="2" ry="6"/><ellipse cx="15" cy="8" rx="2" ry="6"/><circle cx="12" cy="17" r="6"/></g></pattern>`,
  paws: (o, id, t, ink) => `<pattern id="${id}" width="32" height="32" patternUnits="userSpaceOnUse"><g fill="${ink}"><ellipse cx="12" cy="15" rx="5" ry="4"/><circle cx="6" cy="9" r="2"/><circle cx="10" cy="6" r="2"/><circle cx="15" cy="6" r="2"/><circle cx="19" cy="9" r="2"/></g></pattern>`,
  notes: (o, id, t, ink) => `<pattern id="${id}" width="34" height="34" patternUnits="userSpaceOnUse"><path d="M12,22 L12,8 L22,6 L22,20" stroke="${ink}" stroke-width="2" fill="none"/><ellipse cx="9.5" cy="22" rx="3.5" ry="2.6" fill="${ink}"/><ellipse cx="19.5" cy="20" rx="3.5" ry="2.6" fill="${ink}"/></pattern>`,
  crowns: (o, id, t, ink) => `<pattern id="${id}" width="34" height="30" patternUnits="userSpaceOnUse"><path d="M6,18 L5,8 L10,12 L14,5 L18,12 L23,8 L22,18Z" fill="${ink}"/></pattern>`,
  diamonds: (o, id, t, ink) => `<pattern id="${id}" width="26" height="26" patternUnits="userSpaceOnUse"><path d="M13,4 L19,13 L13,22 L7,13Z" fill="${ink}"/></pattern>`,
  zigzag: (o, id, t, ink) => `<pattern id="${id}" width="24" height="16" patternUnits="userSpaceOnUse"><path d="M0,10 L6,4 L12,10 L18,4 L24,10" stroke="${ink}" stroke-width="2.4" fill="none"/></pattern>`,
  waves: (o, id, t, ink) => `<pattern id="${id}" width="30" height="16" patternUnits="userSpaceOnUse"><path d="M0,8 Q7.5,2 15,8 Q22.5,14 30,8" stroke="${ink}" stroke-width="2.2" fill="none"/></pattern>`,
  leaves: (o, id, t, ink) => `<pattern id="${id}" width="30" height="30" patternUnits="userSpaceOnUse"><ellipse cx="10" cy="10" rx="7" ry="3.2" fill="${ink}" transform="rotate(-35 10 10)"/><ellipse cx="22" cy="22" rx="6" ry="2.8" fill="${ink}" transform="rotate(35 22 22)"/></pattern>`,
  sakura: (o, id) => `<pattern id="${id}" width="34" height="34" patternUnits="userSpaceOnUse">${flower(10, 10, 3.6, '#ffb3d1', '#ff6fae')}${flower(26, 26, 2.8, '#fff', '#ff9ccf')}</pattern>`,
  gingham: (o, id, t, ink) => `<pattern id="${id}" width="20" height="20" patternUnits="userSpaceOnUse"><rect width="10" height="20" fill="${ink}" opacity=".5"/><rect width="20" height="10" fill="${ink}" opacity=".5"/></pattern>`,
});

/* skirt trims */
function hemAlong(hem, n, fn, inset = 0.06) { const { y, x1, x2 } = hem, w = x2 - x1; let s = ''; for (let i = 0; i < n; i++) s += fn(x1 + w * (inset + (1 - 2 * inset) * i / (n - 1)), y, i); return s; }
function inSkirtArea(hem, n, seed, fn) { const { y, x1, x2 } = hem, w = x2 - x1, rn = seeded(seed); let s = ''; for (let i = 0; i < n; i++) { const yy = 430 + rn() * (y - 450), t = (yy - 404) / (y - 404), half = 40 + t * (w / 2 - 40); s += fn(200 + (rn() - 0.5) * 1.7 * half, yy, i); } return s; }
extend('drawSkirtDeco', (st) => st.skirtDeco, {
  bowsBig: (o, st, hem) => hemAlong(hem, 4, (x, y) => `<path d="M${f1(x)},${y - 20} Q${f1(x - 22)},${y - 36} ${f1(x - 22)},${y - 18} Q${f1(x - 22)},${y - 2} ${f1(x)},${y - 20} Q${f1(x + 22)},${y - 36} ${f1(x + 22)},${y - 18} Q${f1(x + 22)},${y - 2} ${f1(x)},${y - 20}Z" fill="${ACC}" stroke="#fff" stroke-width="1.5"/><circle cx="${f1(x)}" cy="${y - 20}" r="4" fill="#e0306f"/>`, 0.12),
  pearlScatter: (o, st, hem) => inSkirtArea(hem, 24, 61, (x, y) => `<circle cx="${f1(x)}" cy="${f1(y)}" r="3" fill="#fffaf0" stroke="#e8dcc0" stroke-width=".6"/>`),
  starHem: (o, st, hem) => hemAlong(hem, 12, (x, y, i) => anim(`<path d="${starPath(x, y - 12, 7, 3)}" fill="${i % 2 ? '#fff' : '#ffe680'}"/>`, 'tw', i * 0.2), 0.04),
  rainbowHem: (o, st, hem) => ['#ff9cb5', '#ffe680', '#9ef0a0', '#8fd3ff', '#c79bff'].map((c, i) => `<path d="M${hem.x1 + 4},${hem.y - 6 - i * 6} Q200,${hem.y + 8 - i * 6} ${hem.x2 - 4},${hem.y - 6 - i * 6}" stroke="${c}" stroke-width="5" fill="none"/>`).join(''),
  candies: (o, st, hem) => inSkirtArea(hem, 10, 71, (x, y, i) => { const c = ['#ff8fc7', '#8fd3ff', '#ffd166', '#c79bff'][i % 4]; return `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="6" ry="5" fill="${c}"/><path d="M${f1(x - 6)},${f1(y)} l-5,-4 l0,8Z M${f1(x + 6)},${f1(y)} l5,-4 l0,8Z" fill="${c}"/>`; }),
  shells: (o, st, hem) => hemAlong(hem, 9, (x, y) => `<path d="M${f1(x - 9)},${y - 4} Q${f1(x - 9)},${y - 20} ${f1(x)},${y - 20} Q${f1(x + 9)},${y - 20} ${f1(x + 9)},${y - 4}Z" fill="#ffd6f5" stroke="#ff9ebb"/>`) + inSkirtArea(hem, 8, 73, (x, y) => `<circle cx="${f1(x)}" cy="${f1(y)}" r="2.6" fill="#fffaf0"/>`),
  snowflakes: (o, st, hem) => inSkirtArea(hem, 12, 79, (x, y, i) => anim(snowflake(x, y, 5 + (i % 3) * 2, '#fff', 1.8), 'tw', i * 0.25)),
  leafHem: (o, st, hem) => hemAlong(hem, 16, (x, y, i) => `<ellipse cx="${f1(x)}" cy="${y - 8}" rx="6" ry="13" fill="${i % 2 ? '#7ed957' : '#9be59b'}" transform="rotate(${i % 2 ? 20 : -20} ${f1(x)} ${y - 8})"/>`, 0.03),
  tulle: (o, st, hem) => `<path d="M156,404 Q200,414 244,404 Q${hem.x2 + 20},${(404 + hem.y) / 2} ${hem.x2 + 18},${hem.y + 4}${scallop(hem.x2 + 18, hem.x1 - 18, hem.y + 4, 12, 8)} Q${hem.x1 - 20},${(404 + hem.y) / 2} 156,404Z" fill="#fff" opacity=".28" stroke="#fff" stroke-width="1.5"/>`,
  bells: (o, st, hem) => hemAlong(hem, 8, (x, y) => `<path d="M${f1(x - 6)},${y - 6} Q${f1(x - 6)},${y - 18} ${f1(x)},${y - 18} Q${f1(x + 6)},${y - 18} ${f1(x + 6)},${y - 6}Z" fill="#ffd23f" stroke="${GOLD}"/><circle cx="${f1(x)}" cy="${y - 5}" r="1.8" fill="${GOLD}"/>`),
});

/* shawls */
extend('drawShawl', (st) => st.shawl, {
  bolero: (o, st, front) => front ? both(`<path d="M152,316 Q128,322 122,352 L126,376 Q150,368 168,348 Q176,330 192,318Z" fill="#fff"/><path d="M168,348 Q176,330 192,318" stroke="#f0d0e0" stroke-width="2" fill="none"/>`) : '',
  puffBolero: (o, st, front) => front ? both(`<circle cx="146" cy="330" r="24" fill="#ffd6ec"/><path d="M152,316 Q170,318 188,318 Q176,336 168,352 Q156,352 150,344Z" fill="#ffd6ec"/><path d="M128,344 Q146,354 166,344" stroke="#ff9ccf" stroke-width="2" fill="none"/>`) : '',
  fairyCape: (o, st, front) => front ? `<circle cx="200" cy="318" r="6" fill="#bfe9ff" stroke="#fff"/>` : `<path d="M150,318 Q80,420 60,600 L340,600 Q320,420 250,318Z" fill="#e6f4ff" opacity=".5" stroke="#fff" stroke-width="2"/><path d="M150,318 Q120,460 120,600 M250,318 Q280,460 280,600" stroke="#fff" stroke-width="1.5" opacity=".7" fill="none"/>`,
  ermine: (o, st, front) => front ? [...Array(11)].map((_, i) => { const [x, y] = qpt(132, 340, 200, 296, 268, 340, i / 10); return `<circle cx="${f1(x)}" cy="${f1(y)}" r="11" fill="#fff"/>` + (i % 3 === 1 ? `<path d="M${f1(x)},${f1(y - 3)} l-1.5,5 l1.5,-1 l1.5,1Z" fill="${INK}"/>` : ''); }).join('') : `<path d="M146,318 L254,318 Q336,460 352,600 L48,600 Q64,460 146,318Z" fill="#b0123c"/><path d="M146,318 L254,318 Q326,460 340,600 L60,600 Q74,460 146,318Z" fill="#d42a56" opacity=".5"/>`,
  ribbonCape: (o, st, front) => front ? `<path d="M200,312 Q184,300 182,314 Q184,326 200,316 Q216,300 218,314 Q216,326 200,316Z" fill="#ff9ccf"/>` : `<path d="M196,316 Q140,420 120,560 M204,316 Q260,420 280,560 M200,316 Q200,440 200,580" stroke="#ffc2dd" stroke-width="12" fill="none" stroke-linecap="round" opacity=".85"/>`,
  laceCollar: (o, st, front) => front ? both(`<path d="M200,298 Q172,292 166,310 Q176,326 200,312Z" fill="#fff" stroke="#f0d0e0" stroke-width="1.5"/>`) + `<circle cx="200" cy="314" r="3" fill="${ACC}"/>` : '',
  sailorCollar: (o, st, front) => front ? `<path d="M160,316 L200,348 L240,316 L254,338 L200,370 L146,338Z" fill="#2e3a6e"/><path d="M164,324 L200,352 L236,324" stroke="#fff" stroke-width="2" fill="none"/><path d="M200,352 Q186,342 186,354 Q188,364 200,356 Q212,342 214,354 Q212,364 200,356Z" fill="#e53950"/>` : '',
  scarf: (o, st, front) => front ? `<path d="M182,292 Q200,304 218,292 L220,304 Q200,316 180,304Z" fill="#ff9ccf"/><path d="M206,304 L214,346 L224,342 L214,302Z" fill="#ffb3d6"/><circle cx="208" cy="304" r="5" fill="#ff8fc7"/>` : '',
});

/* belts */
function drawBelt(st, w) {
  const band = (c, h = 9) => `<rect x="157" y="${w - h / 2}" width="86" height="${h}" rx="${h / 2}" fill="${c}"/>`;
  switch (st.belt) {
    case 'ribbon': return band(ACC) + `<path d="M226,${w} Q216,${w - 10} 214,${w} Q216,${w + 10} 226,${w} Q236,${w - 10} 238,${w} Q236,${w + 10} 226,${w}Z" fill="${ACC}" stroke="#e0306f"/>`;
    case 'pearl': return beadsAlong(157, w, 200, w + 8, 243, w, 14, 3.2, () => '#fffaf0');
    case 'chain': return `<path d="M157,${w} Q200,${w + 10} 243,${w}" stroke="${GOLD}" stroke-width="3" fill="none" stroke-dasharray="4 2"/><path d="${heartPath(200, w + 6, 10)}" fill="#ffd23f"/>`;
    case 'flower': return band('#7ed957', 5) + [166, 183, 200, 217, 234].map((x, i) => flower(x, w, 4.5, ['#fff', '#ff9ccf', '#ffd166'][i % 3])).join('');
    case 'gem': return band('#e6e9f2') + [170, 185, 200, 215, 230].map((x, i) => gem(x, w, 4.5, ['#ff6fae', '#8fd3ff', '#c79bff'][i % 3])).join('');
    case 'bowFront': return band(shade(st.dressColor, -25), 7) + `<path d="M200,${w} Q174,${w - 18} 172,${w} Q174,${w + 18} 200,${w} Q226,${w - 18} 228,${w} Q226,${w + 18} 200,${w}Z" fill="${shade(st.dressColor, -25)}"/><circle cx="200" cy="${w}" r="5" fill="${shade(st.dressColor, -40)}"/>`;
    case 'starBuckle': return band('#3d3b8e') + `<path d="${starPath(200, w, 10, 4.5)}" fill="#ffd23f" stroke="${GOLD}"/>`;
    case 'heartBuckle': return band('#ff9ccf') + `<path d="${heartPath(200, w - 8, 16)}" fill="#ff4d8d" stroke="#fff"/>`;
    case 'lace': return band('#fff', 10) + `<path d="M157,${w + 5}${scallop(157, 243, w + 5, 8, 5)}" stroke="#fff" stroke-width="3" fill="none"/>`;
    case 'corset': return [0, 1, 2, 3, 4].map(i => `<path d="M194,${w - 70 + i * 13} L206,${w - 62 + i * 13} M206,${w - 70 + i * 13} L194,${w - 62 + i * 13}" stroke="#fff" stroke-width="1.8"/>`).join('') + `<path d="M200,${w - 6} Q192,${w - 12} 190,${w - 4} M200,${w - 6} Q208,${w - 12} 210,${w - 4}" stroke="#fff" stroke-width="2" fill="none"/>`;
    case 'rainbow': return ['#ff9cb5', '#ffe680', '#9ef0a0', '#8fd3ff', '#c79bff'].map((c, i) => `<rect x="157" y="${w - 7.5 + i * 3}" width="86" height="3" fill="${c}"/>`).join('');
    case 'butterfly': return band('#bfe6ff', 6) + butterfly(200, w, 1.1, '#7fc8ff', '#c79bff');
    case 'sashTails': return band(ACC) + `<path d="M222,${w} L214,${w + 70} L222,${w + 64} L228,${w + 72} L230,${w}Z M232,${w} L240,${w + 60} L246,${w + 52} L250,${w + 58} L240,${w}Z" fill="${ACC}"/>`;
    case 'crystal': return band('#dfe6f0', 6) + [164, 176, 188, 200, 212, 224, 236].map((x, i) => anim(gem(x, w, 4, '#bfe9ff'), 'tw', i * 0.2)).join('');
    default: return '';
  }
}

/* legs, socks and shoes */
function drawLegs(st) {
  const skin = st.skin;
  const legs = (y1, y2, fill, extra = '') => [173, 205].map(x => `<rect x="${x}" y="${y1}" width="22" height="${y2 - y1}" rx="9" fill="${fill}" stroke="${shade(fill, -24)}" stroke-width="1.3"/>`).join('') + extra;
  let s = legs(440, 580, skin);
  const sockFns = {
    white: () => legs(500, 578, '#fff') + both(`<rect x="173" y="500" width="22" height="5" fill="#f0d0e0"/>`),
    lace: () => legs(548, 578, '#fff') + both(`<path d="M172,548${scallop(172, 196, 548, 4, -5)}" fill="#fff" stroke="#f0d0e0" stroke-width=".8"/>`),
    stripes: () => legs(500, 578, '#fff') + both([0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => `<rect x="173" y="${502 + i * 9}" width="22" height="4" fill="#ff9ccf"/>`).join('')),
    pinkTights: () => legs(440, 578, '#ffc2dd'),
    hearts: () => legs(440, 578, '#fff0f6') + both([[178, 470], [188, 500], [179, 530], [189, 560]].map(([x, y]) => `<path d="${heartPath(x, y, 6)}" fill="#ff8fc7"/>`).join('')),
    stars: () => legs(440, 578, '#c8b8ff') + both([[178, 470], [188, 500], [179, 530], [189, 560]].map(([x, y]) => `<path d="${starPath(x, y, 3.5, 1.5)}" fill="#fff"/>`).join('')),
    ribbon: () => legs(490, 578, '#fff') + both(`<path d="M184,492 Q174,484 172,494 Q174,502 184,494 Q194,484 196,494 Q194,502 184,494Z" fill="${ACC}"/>`),
    frilly: () => legs(552, 578, '#fff') + both(`<path d="M170,552${scallop(170, 198, 552, 5, -7)}" fill="#ffd6ec" stroke="#fff"/>`),
    lilac: () => legs(440, 578, '#d9c2ff'),
    rainbow: () => legs(500, 578, '#fff') + both(['#ff9cb5', '#ffe680', '#9ef0a0', '#8fd3ff', '#c79bff', '#ff9cb5', '#ffe680', '#9ef0a0'].map((c, i) => `<rect x="173" y="${502 + i * 9.5}" width="22" height="5" fill="${c}"/>`).join('')),
    dots: () => legs(440, 578, '#fff') + both([[178, 456], [188, 474], [179, 494], [189, 514], [178, 534], [188, 554]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.6" fill="#ff9ccf"/>`).join('')),
  };
  if (sockFns[st.socks]) s += sockFns[st.socks]();
  const sh = (fill, stroke = shade(fill, -20)) => `<path d="M170,574 Q170,563 184,563 Q198,563 198,574 Q198,585 182,585 Q168,585 170,574Z" fill="${fill}" stroke="${stroke}" stroke-width="1.2"/>`;
  const shoe = {
    none: `<ellipse cx="183" cy="578" rx="12" ry="7" fill="${skin}"/>`,
    maryJane: sh('#e0568f') + `<path d="M172,568 L196,568" stroke="#c2185b" stroke-width="3"/><circle cx="192" cy="568" r="2" fill="#fff"/>`,
    glass: sh('#d6f0ff', '#fff') + `<path d="${sparklePath(178, 570, 4)}" fill="#fff"/>`,
    ballet: sh('#ffc2dd') + `<path d="M178,564 L190,540 M190,564 L178,540" stroke="#ffc2dd" stroke-width="2"/>`,
    boots: `<rect x="171" y="540" width="26" height="40" rx="8" fill="#ff9ccf"/>` + sh('#ff9ccf') + `<rect x="171" y="540" width="26" height="6" rx="3" fill="#fff"/>`,
    heels: sh('#ff4d8d') + `<rect x="171" y="580" width="5" height="10" fill="#c2185b"/>`,
    ribbonHeels: sh('#ffb3d6') + `<rect x="171" y="580" width="5" height="10" fill="#e0568f"/><path d="M174,566 Q184,550 194,534 M194,566 Q184,550 174,534" stroke="#ff9ccf" stroke-width="2"/>`,
    bunny: sh('#fff', '#ffb3d1') + `<ellipse cx="180" cy="558" rx="3" ry="8" fill="#fff" stroke="#ffb3d1"/><ellipse cx="188" cy="558" rx="3" ry="8" fill="#fff" stroke="#ffb3d1"/>`,
    heartShoes: sh('#e53950') + `<path d="${heartPath(184, 566, 10)}" fill="#fff"/>`,
    star: sh('#ffd23f') + `<path d="${starPath(184, 573, 6, 2.6)}" fill="#fff"/>`,
    sneakers: sh('#fff', '#ddd') + `<path d="M176,570 L192,566 M176,574 L192,570" stroke="#ff8fc7" stroke-width="1.6"/><path d="M169,580 L199,580" stroke="#ff8fc7" stroke-width="3"/>`,
    fluffy: `<ellipse cx="184" cy="575" rx="17" ry="11" fill="#ffd6ec"/>` + [172, 180, 188, 196].map(x => `<circle cx="${x}" cy="566" r="5" fill="#fff"/>`).join(''),
    crystal: sh('#d9c2ff', '#fff') + `<path d="M174,570 L184,564 L194,570 L184,580Z" stroke="#fff" stroke-width="1" fill="none"/>`,
    flower: sh('#fff3b0') + flower(184, 568, 4, '#ff8fc7'),
    sandals: `<ellipse cx="183" cy="578" rx="12" ry="7" fill="${skin}"/><path d="M172,574 L196,574 M176,580 L192,580 M184,574 L184,560" stroke="#d4a017" stroke-width="2.2"/>`,
    rainboots: `<rect x="170" y="520" width="28" height="60" rx="8" fill="#ffd23f"/>` + sh('#ffd23f') + `<rect x="170" y="520" width="28" height="6" rx="3" fill="#f5b700"/>`,
    wingShoes: sh('#fff', '#e3e0f0') + `<path d="M170,566 Q156,556 160,548 Q166,558 172,560Z" fill="#fff" stroke="#e3e0f0"/>`,
  }[st.shoes] ?? '';
  return s + both(shoe);
}
