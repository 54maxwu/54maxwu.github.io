/* ---------- extra face drawings ---------- */
const FACE_PATHS = {
  round: 'M120,176 Q118,100 200,100 Q282,100 280,176 Q284,246 240,272 Q200,290 160,272 Q116,246 120,176Z',
  chubby: 'M115,182 Q113,100 200,100 Q287,100 285,182 Q291,252 244,277 Q200,293 156,277 Q109,252 115,182Z',
  mochi: 'M113,188 Q111,104 200,102 Q289,104 287,188 Q289,264 200,284 Q111,264 113,188Z',
  oval: 'M122,172 Q120,100 200,100 Q280,100 278,172 Q280,240 232,274 Q200,294 168,274 Q120,240 122,172Z',
  heart: 'M117,170 Q115,100 200,100 Q285,100 283,170 Q281,230 236,268 Q208,292 200,292 Q192,292 164,268 Q119,230 117,170Z',
  small: 'M125,178 Q123,106 200,106 Q277,106 275,178 Q277,244 236,268 Q200,284 164,268 Q123,244 125,178Z',
};

function drawEars(st) {
  const skin = st.skin, dk = shade(skin, -12);
  const elf = `<path d="M132,192 Q110,186 92,156 Q98,196 114,220 Q124,228 132,222Z" fill="${skin}"/><path d="M126,198 Q108,190 100,170 Q106,198 120,214Z" fill="${dk}" opacity=".45"/>`;
  const E = {
    normal: `<ellipse cx="124" cy="206" rx="13" ry="19" fill="${skin}"/><ellipse cx="126" cy="206" rx="6" ry="10" fill="${dk}" opacity=".5"/>`,
    tiny: `<ellipse cx="125" cy="208" rx="9" ry="13" fill="${skin}"/><ellipse cx="126" cy="208" rx="4" ry="7" fill="${dk}" opacity=".5"/>`,
    elf,
    longElf: `<path d="M132,194 Q100,180 70,132 Q80,190 112,222 Q124,230 132,222Z" fill="${skin}"/><path d="M126,200 Q100,186 82,152 Q92,194 118,216Z" fill="${dk}" opacity=".45"/>`,
    fairy: elf + `<circle cx="97" cy="165" r="7" fill="#ffb3d1" opacity=".75"/>` + anim(`<path d="${sparklePath(88, 150, 5)}" fill="#fff"/>`, 'tw'),
    fin: `<path d="M132,192 Q104,170 86,180 Q98,190 88,200 Q100,206 90,216 Q112,230 132,222Z" fill="#9effe0" stroke="#6fd6c0" stroke-width="1.5"/><path d="M128,196 L96,184 M128,206 L94,204 M128,214 L98,216" stroke="#fff" stroke-width="1.2" opacity=".7"/>`,
  };
  return both((E[st.ears] || E.normal).replace(`fill="${skin}"`, `fill="${skin}" stroke="${shade(skin, -24)}" stroke-width="1.4"`));
}

/* eye shapes */
Object.assign(EYE_SHAPES, { cat: 'translate(168 200) rotate(14) scale(1.32 .98) translate(-168 -198)', teary: EYE_SHAPES.big });
extend('drawEye', (p, st) => st.eyeShape, {
  tiny: () => `<g class="eye"><ellipse cx="168" cy="202" rx="8" ry="10" fill="${INK}"/><circle cx="171" cy="198" r="3" fill="#fff"/><circle cx="165" cy="206" r="1.4" fill="#fff"/></g>`,
  happyClosed: () => `<g class="eye"><path d="M154,190 L180,201 L154,212" stroke="${INK}" stroke-width="4.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>`,
  teary: (o, p, st, r) => o(p, st, r).replace(/<\/g><\/g>\s*$/, `<path d="M156,213 Q168,221 180,213" stroke="#8fd3ff" stroke-width="3" fill="none" opacity=".75"/><path d="M152,214 Q147,224 152,228 Q157,224 152,214Z" fill="#bfe9ff" stroke="#fff"/><circle cx="160" cy="204" r="2.5" fill="#fff"/></g></g>`),
});

/* iris */
const irisPlus = (o, p, st, extra) => o(p, { ...st, iris: 'gradient' }) + extra;
extend('drawIris', (p, st) => st.iris, {
  galaxyIris: (o, p, st) => `<circle cx="168" cy="201" r="12.5" fill="#2a1650"/><circle cx="168" cy="201" r="12.5" fill="url(#${p}${st._iris || 'iris'})" opacity=".55"/>`
    + [[162, 196], [174, 205], [166, 208], [172, 194], [160, 204]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i % 2 ? 0.8 : 1.1}" fill="${i % 2 ? '#ffe680' : '#fff'}"/>`).join(''),
  flowerIris: (o, p, st) => irisPlus(o, p, st, [0, 60, 120, 180, 240, 300].map(a => `<ellipse cx="168" cy="193" rx="2.6" ry="5" fill="${shade(st.eyeColor, 55)}" opacity=".55" transform="rotate(${a} 168 201)"/>`).join('')),
  heartIris: (o, p, st) => irisPlus(o, p, st, [0, 60, 120, 180, 240, 300].map(a => { const x = 168 + Math.cos(a * Math.PI / 180) * 9.5, y = 201 + Math.sin(a * Math.PI / 180) * 9.5; return `<path d="${heartPath(x, y - 2, 4)}" fill="${shade(st.eyeColor, 60)}" opacity=".8"/>`; }).join('')),
  gem: (o, p, st) => irisPlus(o, p, st, `<path d="M168,188.5 L178,195 L178,207 L168,213.5 L158,207 L158,195Z M168,188.5 L168,213.5 M158,195 L178,207 M178,195 L158,207" stroke="#fff" stroke-width=".9" fill="none" opacity=".55"/>`),
});

/* pupils & highlights */
const PD = '#1c1018';
extend('drawPupil', (t) => t, {
  butterfly: () => butterfly(168, 201, 0.55, PD, PD),
  crown: () => `<path d="M161,206 L160,196 L164,199 L168,193 L172,199 L176,196 L175,206Z" fill="${PD}"/>`,
  music: () => `<path d="M171,193 L171,206" stroke="${PD}" stroke-width="2.4"/><path d="M171,193 Q177,195 176,200" stroke="${PD}" stroke-width="2" fill="none"/><ellipse cx="167.5" cy="206" rx="4.2" ry="3.2" fill="${PD}"/>`,
  cross: () => `<path d="${sparklePath(168, 201, 9)}" fill="${PD}"/>`,
  drop: () => `<path d="M168,192 Q159,203 168,210 Q177,203 168,192Z" fill="${PD}"/>`,
  starHollow: () => `<path d="${starPath(168, 201, 8.5, 3.8)}" fill="none" stroke="${PD}" stroke-width="2.4" stroke-linejoin="round"/>`,
});
extend('drawHighlight', (t) => t, {
  flower: () => flower(173, 195, 2.3, '#fff', '#fff') + `<circle cx="163" cy="207" r="1.8" fill="#fff"/>`,
  butterfly: () => butterfly(173, 195, 0.42, '#fff', '#fff') + `<circle cx="163" cy="207" r="1.8" fill="#fff"/>`,
  window: () => `<g fill="#fff"><rect x="168.5" y="190" width="4" height="4"/><rect x="173.5" y="190" width="4" height="4"/><rect x="168.5" y="195" width="4" height="4"/><rect x="173.5" y="195" width="4" height="4"/></g><circle cx="163" cy="207" r="1.8" fill="#fff"/>`,
  ring: () => `<circle cx="173" cy="195" r="4.2" fill="none" stroke="#fff" stroke-width="2"/><circle cx="163" cy="207" r="1.8" fill="#fff"/>`,
  triple: () => `<circle cx="174" cy="193" r="3.6" fill="#fff"/><circle cx="168" cy="198" r="2.4" fill="#fff"/><circle cx="163" cy="203" r="1.6" fill="#fff"/>`,
});

/* lashes & liner */
extend('lashPaths', (st) => st.lashes, {
  9: () => `<path d="M150,192 l-8,-4 M160,181 l-3,-8 M171,178 l1,-8" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/>`,
  10: (o, st) => o({ ...st, lashes: 3 }).replaceAll(INK, '#ff6fae'),
  11: (o, st) => o({ ...st, lashes: 3 }).replaceAll(INK, '#3a7bd5'),
  12: () => [['M151,193 l-13,-3', '#ff6b6b'], ['M154,187 l-12,-10', '#ffb347'], ['M160,182 l-8,-13', '#ffd23f'], ['M168,179 l-2,-12', '#7ed957'], ['M176,179 l3,-10', '#6ec3ff']]
    .map(([d, c]) => `<path d="${d}" stroke="${c}" stroke-width="2" stroke-linecap="round"/>`).join(''),
});
extend('linerParts', (st) => st.eyeliner, {
  mint: (o, st) => ({ ...o({ ...st, eyeliner: 'wing' }), col: '#3fbf8f', extra: `<path d="M153,193 L137,182 L156,188Z" fill="#3fbf8f"/>` }),
  silver: (o, st) => ({ ...o({ ...st, eyeliner: 'wing' }), col: '#a0a8c0', extra: `<path d="M153,193 L137,182 L156,188Z" fill="#a0a8c0"/>` + [[156, 181], [166, 177], [176, 178]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.3" fill="#fff"/>`).join('') }),
  rainbow: (o, st) => ({ ...o({ ...st, eyeliner: 'thin' }), extra: ['#ff6b6b', '#ffd23f', '#6ec3ff'].map((c, i) => `<path d="M153,${192 + i * 2} L${138 - i},${182 + i * 3}" stroke="${c}" stroke-width="2.4" stroke-linecap="round"/>`).join('') }),
  doubleWing: (o, st) => ({ ...o({ ...st, eyeliner: 'wing' }), extra: `<path d="M153,193 L137,182 L156,188Z" fill="${INK}"/><path d="M153,198 L140,197 L155,201Z" fill="${INK}"/>` }),
  puppy: (o, st) => ({ ...o({ ...st, eyeliner: 'thin' }), extra: `<path d="M153,195 L139,204 L156,191Z" fill="${INK}"/>` }),
  graphic: (o, st) => ({ ...o(st), extra: `<path d="M148,185 Q168,164 189,181" stroke="${INK}" stroke-width="1.4" fill="none" stroke-linecap="round"/>` }),
});

/* brows */
const browCol = (st) => lum(st.hairColor) > 0.93 ? '#a89aa6' : shade(st.hairColor, lum(st.hairColor) > 0.7 ? -45 : -30);
const browLine = (d, c, w) => both(`<path d="${d}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round"/>`);
extend('drawBrows', (st) => st.brows, {
  round: (o, st) => browLine('M154,159 Q168,145 182,159', browCol(st), 5),
  tiny: (o, st) => browLine('M163,156 Q170,152 177,155', browCol(st), 4.5),
  star: () => both(`<path d="${starPath(170, 152, 6, 2.6)}" fill="#ffd23f" stroke="#fff" stroke-width=".8"/>`),
  cloud: (o, st) => both(`<g fill="${browCol(st)}"><circle cx="162" cy="154" r="3.6"/><circle cx="169" cy="151" r="4.4"/><circle cx="176" cy="154" r="3.6"/></g>`),
  pink: () => browLine('M150,160 Q166,149 186,157', '#ff8fc7', 4),
  purple: () => browLine('M150,160 Q166,149 186,157', '#9d6bff', 4),
});

/* eyeshadow styles */
extend('drawShadow', (st) => st.eyeshadow ? st.shadowStyle : '__none', {
  heart: (o, st) => both(`<path d="${heartPath(168, 172, 30)}" fill="${st.eyeshadow}" opacity=".5"/>`),
  ombreUp: (o, st) => both(`<ellipse cx="168" cy="180" rx="25" ry="21" fill="${shade(st.eyeshadow, 40)}" opacity=".4"/><ellipse cx="168" cy="190" rx="24" ry="13" fill="${st.eyeshadow}" opacity=".6"/>`),
  sparkleCrease: (o, st) => both(`<ellipse cx="168" cy="188" rx="25" ry="16" fill="${st.eyeshadow}" opacity=".5"/><path d="M146,182 Q168,165 190,182" stroke="#fff" stroke-width="1.6" fill="none"/><path d="${sparklePath(188, 176, 4)}" fill="#fff"/>`),
  dots: (o, st) => both([[152, 188], [158, 181], [166, 178], [174, 178], [182, 182], [160, 190], [176, 188]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.2" fill="${st.eyeshadow}"/>`).join('')),
  galaxy: (o, st) => both(`<ellipse cx="168" cy="188" rx="26" ry="17" fill="#3d2b7a" opacity=".5"/><ellipse cx="168" cy="190" rx="20" ry="11" fill="${st.eyeshadow}" opacity=".45"/>` + [[154, 182], [166, 176], [180, 180], [172, 184]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i % 2 ? 0.9 : 1.3}" fill="#fff"/>`).join('')),
  pastelDuo: () => both(`<ellipse cx="158" cy="188" rx="15" ry="15" fill="#ffc2dd" opacity=".6"/><ellipse cx="178" cy="188" rx="15" ry="15" fill="#bfe6ff" opacity=".6"/>`),
});

/* highlighter */
const cheekGlow = (fill, op) => both(`<ellipse cx="150" cy="216" rx="17" ry="6" fill="${fill}" opacity="${op}" transform="rotate(-18 150 216)"/>`);
const noseGlow = `<path d="M200,204 L200,226" stroke="#fff" stroke-width="3" opacity=".5" stroke-linecap="round"/><circle cx="201" cy="231" r="1.8" fill="#fff" opacity=".9"/>`;
extend('drawHighlighter', (p, st) => st.highlighter, {
  gold: () => cheekGlow('#ffe9a8', 0.65) + noseGlow,
  rose: () => cheekGlow('#ffd6e6', 0.75) + noseGlow,
  moon: () => both(`<path d="M146,208 a8,8 0 1,0 0,16 a6,6 0 1,1 0,-16Z" fill="#fff" opacity=".7"/>`),
  nose: () => noseGlow,
  forehead: () => `<ellipse cx="200" cy="130" rx="24" ry="7" fill="#fff" opacity=".4"/>` + noseGlow,
});

/* blush styles */
extend('drawBlush', (p, st) => st.blush ? st.blushStyle : '__none', {
  oval: (o, p) => both(`<ellipse cx="146" cy="238" rx="27" ry="16" fill="url(#${p}blush)"/>`),
  diagonal: (o, p) => both(`<ellipse cx="148" cy="232" rx="25" ry="9" fill="url(#${p}blush)" transform="rotate(-25 148 232)"/>`),
  strawberry: (o, p, st) => both(`<path d="M148,228 Q160,230 158,240 Q154,250 148,252 Q142,250 138,240 Q136,230 148,228Z" fill="${st.blush}" opacity=".65"/><path d="M142,228 L148,224 L154,228Z" fill="#7ed957"/><circle cx="145" cy="237" r="1" fill="#fff"/><circle cx="151" cy="242" r="1" fill="#fff"/>`),
  moon: (o, p, st) => both(`<path d="M152,226 a11,11 0 1,0 0,22 a8,8 0 1,1 0,-22Z" fill="${st.blush}" opacity=".6"/>`),
  cloud: (o, p, st) => both(`<g fill="${st.blush}" opacity=".55"><circle cx="138" cy="240" r="7"/><circle cx="148" cy="234" r="9"/><circle cx="158" cy="240" r="7"/></g>`),
  triple: (o, p, st) => both([136, 148, 160].map(x => `<circle cx="${x}" cy="238" r="4.5" fill="${st.blush}" opacity=".75"/>`).join('')),
});

/* mouths */
extend('drawMouthInner', (st) => st.lipStyle, {
  fang: (o, st) => o({ ...st, lipStyle: 'smile' }) + `<path d="M192,254 L194.5,261 L197,254Z" fill="#fff"/>`,
  tongue: (o, st) => `<path d="M186,252 Q200,262 214,252" stroke="${st.lips || '#c45a76'}" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M198,256 Q198,268 205,268 Q212,268 211,256Z" fill="#ff8fa3"/><path d="M204.5,258 L204.5,264" stroke="#e8607e" stroke-width="1.2"/>`,
  kiss: (o, st) => `<ellipse cx="198" cy="257" rx="6" ry="6.5" fill="${st.lips || '#ef8a9c'}"/><path d="M193,257 Q198,259 203,257" stroke="${shade(st.lips || '#ef8a9c', -30)}" stroke-width="1.4" fill="none"/><path d="${heartPath(216, 240, 10)}" fill="#ff6fae"/>`,
  wavy: (o, st) => `<path d="M186,256 q3.5,-4 7,0 q3.5,4 7,0 q3.5,-4 7,0 q3.5,4 7,0" stroke="${st.lips || '#c45a76'}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`,
  omega: (o, st) => `<path d="M186,252 Q186,261 193,261 Q200,261 200,253 Q200,261 207,261 Q214,261 214,252" stroke="${st.lips || '#c45a76'}" stroke-width="3" fill="none" stroke-linecap="round"/>`,
  bigHeart: (o, st) => `<path d="${heartPath(200, 240, 32)}" fill="${st.lips || '#ff6fae'}"/><path d="M186,253 Q200,258 214,253" stroke="${shade(st.lips || '#ff6fae', -30)}" stroke-width="1.6" fill="none"/><ellipse cx="207" cy="260" rx="4" ry="2" fill="#fff" opacity=".7"/>`,
});

/* face painting */
extend('drawFacePaint', (st) => st.facePaint, {
  crownForehead: (o, st, top) => top ? `<path d="M190,136 L189,124 L194,128 L200,120 L206,128 L211,124 L210,136Z" fill="#ffd23f" stroke="${GOLD}"/><circle cx="200" cy="131" r="1.8" fill="#ff4d8d"/>` : '',
  heartForehead: (o, st, top) => top ? `<path d="${heartPath(200, 122, 14)}" fill="#ff6fae" stroke="#fff"/>` : '',
  bunnyNose: (o, st, top) => top ? '' : `<path d="M196,229 Q200,226 204,229 Q202,234 200,234 Q198,234 196,229Z" fill="#ff9ebb"/><path d="M200,234 L200,240" stroke="#ff9ebb" stroke-width="1.5"/>` + both(`<path d="M168,236 l-14,-2 M168,240 l-14,2" stroke="#d9a6b6" stroke-width="1.2" stroke-linecap="round"/>`),
  catNose: (o, st, top) => top ? '' : `<path d="M196,229 L204,229 L200,234Z" fill="#ff8fab"/>` + both(`<path d="M166,234 l-18,-3 M166,239 l-18,1 M166,244 l-16,4" stroke="${INK}" stroke-width="1.2" stroke-linecap="round" opacity=".6"/>`),
  starsCheeks: (o, st, top) => top ? '' : both(`<path d="${starPath(146, 228, 5, 2.2)}" fill="#ffd23f"/><path d="${starPath(156, 240, 3.5, 1.6)}" fill="#fff3a6"/><path d="${starPath(138, 242, 3, 1.3)}" fill="#ffd23f"/>`),
  sunMoon: (o, st, top) => top ? '' : `<circle cx="256" cy="226" r="6" fill="#ffd23f"/>` + [0, 60, 120, 180, 240, 300].map(a => `<line x1="256" y1="216" x2="256" y2="213" stroke="#ffb300" stroke-width="1.8" stroke-linecap="round" transform="rotate(${a} 256 226)"/>`).join('') + `<path d="M146,218 a8,8 0 1,0 0,16 a6,6 0 1,1 0,-16Z" fill="#c9a7ff"/>`,
  cloudCheek: (o, st, top) => top ? '' : `<g fill="#fff" stroke="#bfe9ff" stroke-width="1.2"><circle cx="252" cy="230" r="6"/><circle cx="260" cy="225" r="8"/><circle cx="269" cy="231" r="6"/></g>` + anim(`<path d="${sparklePath(272, 214, 4)}" fill="#fff"/>`, 'tw'),
  leafVine: (o, st, top) => top ? '' : `<path d="M138,170 Q128,196 138,222 Q146,236 140,250" stroke="#5fbf6f" stroke-width="1.6" fill="none"/>` + [[136, 180, -30], [134, 204, 30], [141, 228, -30], [140, 246, 20]].map(([x, y, a]) => `<ellipse cx="${x + 5}" cy="${y}" rx="5" ry="2.4" fill="#7ed957" transform="rotate(${a} ${x} ${y})"/>`).join(''),
  pearlDrops: (o, st, top) => top ? '' : both([[154, 222, 2.6], [162, 226, 2], [170, 227, 1.6]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fffaf0" stroke="#e8dcc0" stroke-width=".6"/>`).join('')),
  galaxyCheek: (o, st, top) => top ? '' : `<ellipse cx="258" cy="226" rx="16" ry="10" fill="#7b4dff" opacity=".35"/><ellipse cx="258" cy="226" rx="9" ry="6" fill="#ff8fc7" opacity=".35"/>` + [[250, 222], [262, 230], [266, 220], [256, 228]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i % 2 ? 0.9 : 1.3}" fill="#fff"/>`).join(''),
});

/* stickers */
extend('drawSticker', (st) => st.sticker, {
  bunny: () => `<ellipse cx="251" cy="208" rx="3" ry="8" fill="#fff" stroke="#ffb3d1"/><ellipse cx="261" cy="208" rx="3" ry="8" fill="#fff" stroke="#ffb3d1"/><circle cx="256" cy="221" r="8" fill="#fff" stroke="#ffb3d1"/><circle cx="253" cy="220" r="1.2" fill="${INK}"/><circle cx="259" cy="220" r="1.2" fill="${INK}"/>`,
  cat: () => `<path d="M248,214 L249,204 L254,210 L258,210 L263,204 L264,214Z" fill="#ffb366"/><circle cx="256" cy="219" r="8" fill="#ffb366"/><circle cx="253" cy="218" r="1.2" fill="${INK}"/><circle cx="259" cy="218" r="1.2" fill="${INK}"/>`,
  star2: () => `<path d="${starPath(252, 214, 7, 3)}" fill="#ffd23f"/><path d="${starPath(264, 226, 5, 2.2)}" fill="#ff9ccf"/>`,
  gemHeart: () => `<path d="${heartPath(256, 208, 18)}" fill="#ff6fae" stroke="#fff"/><path d="M250,214 L256,224 L262,214" stroke="#fff" stroke-width="1" fill="none" opacity=".7"/>`,
  crescentStars: () => `<path d="M258,208 a9,9 0 1,0 0,18 a7,7 0 1,1 0,-18Z" fill="#c9a7ff"/><path d="${starPath(266, 210, 3, 1.3)}" fill="#ffd23f"/><path d="${starPath(266, 226, 2.4, 1)}" fill="#ffd23f"/>`,
  bandage: () => `<g transform="rotate(-25 256 220)"><rect x="244" y="215" width="24" height="10" rx="5" fill="#ffd6b8"/><rect x="252" y="215" width="8" height="10" fill="#ffc29a"/><circle cx="254" cy="218" r=".7" fill="#e8a080"/><circle cx="258" cy="222" r=".7" fill="#e8a080"/></g>`,
  flowerTrio: () => flower(250, 214, 3.2, '#ff8fc7') + flower(262, 218, 3.2, '#fff', '#ff8fc7') + flower(254, 228, 3, '#c79bff'),
  droplet: () => `<path d="M256,208 Q248,220 256,228 Q264,220 256,208Z" fill="#8fd3ff" stroke="#fff"/><ellipse cx="253.5" cy="220" rx="1.5" ry="3" fill="#fff" opacity=".7"/>`,
  cupcake: () => `<path d="M249,222 L263,222 L261,232 L251,232Z" fill="#7fc8ff"/><ellipse cx="256" cy="219" rx="9" ry="5" fill="#ffc2dd"/><circle cx="256" cy="213" r="2.5" fill="#e53950"/>`,
  lollipop: () => `<line x1="256" y1="222" x2="256" y2="234" stroke="#fff" stroke-width="2"/><circle cx="256" cy="216" r="7" fill="#ff8fc7"/><path d="M256,216 m-4,0 a4,4 0 1,1 4,4" stroke="#fff" stroke-width="1.6" fill="none"/>`,
  shell: () => `<path d="M248,226 Q248,212 256,212 Q264,212 264,226Z" fill="#ffd6f5" stroke="#ff9ebb"/><path d="M256,226 L256,214 M256,226 L251,215 M256,226 L261,215" stroke="#ff9ebb" stroke-width=".8"/>`,
  snowflake: () => snowflake(256, 220, 8, '#8fd3ff', 2),
  leaf: () => `<ellipse cx="256" cy="220" rx="9" ry="4.5" fill="#7ed957" transform="rotate(-30 256 220)"/><path d="M249,224 L263,216" stroke="#4caf50" stroke-width="1"/>`,
  candy: () => `<ellipse cx="256" cy="220" rx="6" ry="5" fill="#ff8fc7"/><path d="M250,220 L244,215 L244,225Z M262,220 L268,215 L268,225Z" fill="#ffc2dd"/><path d="M253,216 L259,224" stroke="#fff" stroke-width="1.4"/>`,
  note2: () => `<path d="M250,226 L250,208 L264,205 L264,223" stroke="#ff6fae" stroke-width="2.4" fill="none"/><path d="M250,211 L264,208" stroke="#ff6fae" stroke-width="3"/><ellipse cx="247" cy="227" rx="4" ry="3" fill="#ff6fae"/><ellipse cx="261" cy="224" rx="4" ry="3" fill="#ff6fae"/>`,
});
