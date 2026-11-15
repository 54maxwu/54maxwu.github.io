/* ---------- extra hairstyles, bangs, hair accessories ---------- */
Object.assign(BANGS, {
  zigzag: 'M116,205 Q98,88 200,82 Q302,88 284,205 Q282,170 276,146 ' + [...Array(9)].map((_, i) => `L${f1(276 - (i + 0.5) * 16.9)},${i % 2 ? 146 : 160} `).join('') + 'L124,146 Q118,170 116,205Z',
  longBlunt: 'M116,205 Q98,88 200,82 Q302,88 284,205 Q282,182 278,160' + scallop(278, 122, 160, 8, 6) + ' Q118,182 116,205Z',
  ahoge: BANGS.side, heartAhoge: BANGS.side, sideClip: BANGS.curtain,
});

const FRONT_BASE = { longTwin: 'twin', lowTwin: 'long', drills: 'twin', shortTwin: 'twin', halfTwin: 'long', bunLong: 'long', messyBun: 'bun', sideSwept: 'long', fluffyLong: 'long', wavyBob: 'bob' };

extend('drawHairBack', (p, st) => st.hairStyle, {
  longTwin: (o, p, st) => `<path d="${BACK_BASE}" fill="url(#${p}hair)"/>` + both(`<path d="M118,150 Q48,190 58,300 Q66,420 44,530 Q102,470 104,330 Q106,220 126,166Z" fill="url(#${p}hair)"/><path d="M88,220 Q78,320 70,440" stroke="${shade(st.hairColor, 30)}" stroke-width="4" fill="none" opacity=".55" stroke-linecap="round"/>`),
  lowTwin: (o, p, st) => `<path d="${BACK_BASE}" fill="url(#${p}hair)"/><path d="M112,215 Q110,240 126,248 L274,248 Q290,240 288,215Z" fill="url(#${p}hair)"/>` + both(`<path d="M122,232 Q78,262 86,332 Q92,400 78,462 Q120,420 120,342 Q122,284 136,246Z" fill="url(#${p}hair)"/>`),
  drills: (o, p, st) => `<path d="${BACK_BASE}" fill="url(#${p}hair)"/>` + both([...Array(6)].map((_, i) => { const x = 98 - i * 1.5, y = 186 + i * 34, rx = 24 - i * 2.4; return `<ellipse cx="${x}" cy="${y}" rx="${f1(rx)}" ry="21" fill="url(#${p}hair)"/><path d="M${f1(x - rx + 3)},${y - 8} Q${x},${y + 6} ${f1(x + rx - 3)},${y + 12}" stroke="${shade(st.hairColor, 30)}" stroke-width="2.4" fill="none" opacity=".6"/>`; }).join('')),
  shortTwin: (o, p, st) => `<path d="${BACK_BASE}" fill="url(#${p}hair)"/>` + both(`<path d="M120,150 Q82,158 80,198 Q82,236 66,252 Q108,244 112,206 Q114,176 130,164Z" fill="url(#${p}hair)"/>`),
  halfTwin: (o, p, st) => o(p, { ...st, hairStyle: 'long' }) + both(`<path d="M136,116 Q100,108 96,148 Q96,180 84,198 Q118,186 120,156 Q122,136 142,126Z" fill="url(#${p}hair)"/>`),
  bunLong: (o, p, st) => o(p, { ...st, hairStyle: 'long' }) + `<circle cx="200" cy="64" r="34" fill="url(#${p}hair)"/><path d="M180,58 Q200,38 220,58" stroke="${shade(st.hairColor, 25)}" stroke-width="3.5" fill="none" opacity=".7"/>`,
  messyBun: (o, p, st) => o(p, { ...st, hairStyle: 'bun' }) + `<path d="M172,50 Q160,34 168,26 M228,48 Q244,36 238,24 M190,34 Q186,20 196,14" stroke="url(#${p}hair)" stroke-width="5" fill="none" stroke-linecap="round"/>`,
  sideSwept: (o, p, st) => o(p, { ...st, hairStyle: 'long' }),
  fluffyLong: (o, p, st) => both([[104, 230, 26], [96, 280, 28], [102, 330, 28], [94, 380, 26], [106, 426, 24]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#${p}hair)"/>`).join('')) + o(p, { ...st, hairStyle: 'long' }),
  wavyBob: (o, p) => `<path d="M106,205 Q92,84 200,78 Q308,84 294,205 Q312,240 294,270 Q306,300 270,296 Q250,312 230,292 L170,292 Q150,312 130,296 Q94,300 106,270 Q88,240 106,205Z" fill="url(#${p}hair)"/>`,
});

extend('drawHairFront', (p, st) => (FRONT_BASE[st.hairStyle] || ['ahoge', 'heartAhoge', 'sideClip'].includes(st.bangs)) ? 'x' : '', {
  x: (o, p, st) => {
    const fill = `url(#${p}hair)`, hs = st.hairStyle;
    let s = o(p, { ...st, hairStyle: FRONT_BASE[hs] || hs });
    if (hs === 'lowTwin') s += both(`<circle cx="124" cy="240" r="9" fill="${ACC}"/><circle cx="121" cy="237" r="2.6" fill="#fff" opacity=".7"/>`);
    if (hs === 'halfTwin') s += both(`<circle cx="138" cy="122" r="8" fill="${ACC}"/>`);
    if (hs === 'sideSwept') s += `<path d="M268,136 Q302,220 288,300 Q280,360 302,424 Q262,384 262,300 Q266,220 254,160Z" fill="${fill}"/><path d="M280,220 Q290,290 282,360" stroke="${shade(st.hairColor, 30)}" stroke-width="3" fill="none" opacity=".5"/>`;
    if (hs === 'bunLong') s += `<path d="M180,92 Q200,100 220,92" stroke="${ACC}" stroke-width="6" fill="none" stroke-linecap="round"/>`;
    if (hs === 'messyBun') s += both(`<path d="M126,150 Q116,190 124,232" stroke="${fill}" stroke-width="4" fill="none" stroke-linecap="round"/>`);
    if (hs === 'fluffyLong') s += both(`<circle cx="116" cy="262" r="14" fill="${fill}"/><circle cx="112" cy="300" r="13" fill="${fill}"/>`);
    if (hs === 'drills' || hs === 'longTwin' || hs === 'shortTwin') s += '';
    if (st.bangs === 'ahoge') s += `<path d="M202,86 Q192,56 210,48 Q228,42 222,60" stroke="${fill}" stroke-width="6" fill="none" stroke-linecap="round"/>`;
    if (st.bangs === 'heartAhoge') s += `<path d="M200,86 L200,64 Q190,42 178,52 Q170,64 200,82 M200,64 Q210,42 222,52 Q230,64 200,82" stroke="${fill}" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
    if (st.bangs === 'sideClip') s += `<rect x="146" y="120" width="24" height="7" rx="3.5" fill="${ACC}" transform="rotate(-28 158 123)"/><path d="${starPath(172, 116, 5, 2.2)}" fill="#ffd23f"/>`;
    return s;
  },
});

extend('drawHairAcc', (st) => st.hairAcc, {
  rainbowClips: () => ['#ff6b6b', '#ffb347', '#ffd23f', '#7ed957', '#6ec3ff'].map((c, i) => `<rect x="${120 + i * 4}" y="${168 - i * 12}" width="20" height="6" rx="3" fill="${c}" transform="rotate(-50 ${130 + i * 4} ${171 - i * 12})"/>`).join(''),
  cherryClips: () => both(`<path d="M132,140 Q126,148 126,154 M132,140 Q138,148 139,154" stroke="#4caf50" stroke-width="1.6" fill="none"/><circle cx="126" cy="156" r="5" fill="#e53950"/><circle cx="139" cy="156" r="5" fill="#e53950"/><circle cx="124.5" cy="154.5" r="1.3" fill="#fff"/>`),
  starPins: () => [[122, 164, 7], [130, 146, 6], [142, 130, 5]].map(([x, y, r], i) => anim(`<path d="${starPath(x, y, r, r * 0.45)}" fill="${['#ffd23f', '#fff3a6', '#ffc2dd'][i]}" stroke="#fff"/>`, 'tw', i * 0.3)).join(''),
  bunnyClip: () => `<ellipse cx="128" cy="128" rx="4" ry="11" fill="#fff" stroke="#ffb3d1" transform="rotate(-25 128 128)"/><ellipse cx="140" cy="124" rx="4" ry="11" fill="#fff" stroke="#ffb3d1" transform="rotate(10 140 124)"/><circle cx="134" cy="140" r="9" fill="#fff" stroke="#ffb3d1"/><circle cx="131" cy="139" r="1.2" fill="${INK}"/><circle cx="137" cy="139" r="1.2" fill="${INK}"/>`,
  pearlComb: () => `<path d="M118,166 Q130,140 156,124" stroke="#fffaf0" stroke-width="5" fill="none" stroke-linecap="round"/>` + beadsAlong(118, 160, 130, 134, 156, 118, 8, 3.2, () => '#fffaf0'),
  miniWreath: () => [[124, 160], [130, 145], [140, 132], [152, 122]].map(([x, y], i) => `<ellipse cx="${x + 6}" cy="${y + 4}" rx="6" ry="3" fill="#7ed957"/>` + flower(x, y, 4.2, ['#fff', '#ff9ccf', '#ffd166', '#c79bff'][i])).join(''),
  leafPins: () => [[124, 158, -60], [132, 142, -40], [144, 128, -20]].map(([x, y, a]) => `<ellipse cx="${x}" cy="${y}" rx="9" ry="4" fill="#7ed957" transform="rotate(${a} ${x} ${y})"/><path d="M${x - 6},${y + 5} L${x + 6},${y - 5}" stroke="#4caf50" stroke-width="1"/>`).join(''),
  snowPins: () => [[124, 160, 7], [132, 142, 6], [144, 128, 5]].map(([x, y, r]) => snowflake(x, y, r, '#8fd3ff', 2)).join(''),
  crystalPins: () => [[124, 160, '#d6c2ff'], [132, 144, '#bfe9ff'], [144, 130, '#ffd6f5']].map(([x, y, c], i) => anim(gem(x, y, 7, c), 'tw', i * 0.4)).join(''),
  heartChain: () => `<path d="M120,164 Q200,112 280,164" stroke="${GOLD}" stroke-width="1.2" fill="none"/>` + [0.12, 0.3, 0.5, 0.7, 0.88].map((t) => { const [x, y] = qpt(120, 164, 200, 112, 280, 164, t); return `<path d="${heartPath(x, y, 8)}" fill="#ff6fae"/>`; }).join(''),
  ribbonBraid: () => both(`<path d="M122,170 Q112,200 120,230 Q128,260 116,290 Q108,320 118,350" stroke="#ff9ccf" stroke-width="4" fill="none" stroke-dasharray="10 8" stroke-linecap="round"/><path d="M118,350 Q110,362 106,374 M118,350 Q124,364 128,374" stroke="#ff9ccf" stroke-width="3" fill="none"/>`),
  goldLeaves: () => [[122, 168, -70], [126, 152, -55], [134, 138, -40], [146, 126, -25], [160, 118, -10]].map(([x, y, a]) => `<ellipse cx="${x}" cy="${y}" rx="8" ry="3.5" fill="#ffd23f" stroke="${GOLD}" stroke-width=".8" transform="rotate(${a} ${x} ${y})"/>`).join(''),
});
