/* ---------- extra headpieces, earrings, necklaces, glasses, gloves ---------- */
const recolor = (s, map) => Object.entries(map).reduce((a, [k, v]) => a.replaceAll(k, v), s);
const HB = (c, w = 6) => `<path d="M124,128 Q200,62 276,128" stroke="${c}" stroke-width="${w}" fill="none"/>`;

extend('drawCrown', (st) => st.crown, {
  roseGold: (o, st) => recolor(o({ ...st, crown: 'crown' }), { '#ffd23f': '#f7c1b5', [GOLD]: '#d98a7a', '#f5b700': '#eba494' }),
  silverCrown: (o, st) => recolor(o({ ...st, crown: 'crown' }), { '#ffd23f': '#eef0f7', [GOLD]: '#a8b0c8', '#f5b700': '#d3d8e6', '#ff4d8d': '#8fd3ff' }),
  tallCrown: () => `<path d="M156,100 L158,38 L174,72 L186,26 L200,60 L214,26 L226,72 L242,38 L244,100Z" fill="#ffd23f" stroke="${GOLD}" stroke-width="2.5" stroke-linejoin="round"/><rect x="156" y="90" width="88" height="11" rx="3" fill="#f5b700"/>`
    + [[158, 36], [186, 24], [214, 24], [242, 36]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4.5" fill="#fff"/>`).join('') + gem(200, 76, 8, '#ff4d8d') + gem(176, 88, 5, '#8fd3ff') + gem(224, 88, 5, '#8fd3ff'),
  miniCrown: (o, st) => `<g transform="translate(246 112) rotate(18) scale(.55) translate(-200 -80)">${o({ ...st, crown: 'crown' })}</g>`,
  gemCrown: () => `<path d="M160,98 L166,64 L184,82 L200,56 L216,82 L234,64 L240,98Z" fill="#ffd23f" stroke="${GOLD}" stroke-width="2.5" stroke-linejoin="round"/>` + [[172, 88, '#ff4d8d'], [186, 90, '#7ed957'], [200, 86, '#8fd3ff'], [214, 90, '#c79bff'], [228, 88, '#ffb347'], [200, 70, '#ff6fae']].map(([x, y, c]) => gem(x, y, 5, c)).join(''),
  flowerTiara: () => HB('#dfe6f0', 4) + [[150, 108, '#ffc2dd'], [170, 90, '#fff'], [200, 80, '#ff9ccf'], [230, 90, '#fff'], [250, 108, '#ffc2dd']].map(([x, y, c], i) => flower(x, y, i === 2 ? 8 : 6, c, '#ffd166')).join(''),
  snowTiara: () => `<path d="M148,112 Q200,82 252,112" stroke="#dfe6f0" stroke-width="5" fill="none"/>` + snowflake(200, 76, 12, '#bfe9ff', 3) + snowflake(170, 92, 7, '#d6f0ff', 2) + snowflake(230, 92, 7, '#d6f0ff', 2),
  foxEars: () => both(`<path d="M126,118 L130,52 L172,92Z" fill="#ff9248"/><path d="M134,104 L136,70 L158,92Z" fill="#fff"/>`) + HB('#ff9248'),
  blackCatEars: () => both(`<path d="M126,118 L132,58 L172,92Z" fill="#3a3340"/><path d="M134,104 L137,74 L158,92Z" fill="#ff9ebb"/>`) + HB('#3a3340') + `<path d="M232,98 Q222,88 220,98 Q222,108 232,98 Q242,88 244,98 Q242,108 232,98Z" fill="${ACC}"/>`,
  sheepHorns: () => both(`<path d="M150,110 Q118,96 112,120 Q108,142 128,146 Q144,146 140,130 Q136,120 126,126" stroke="#f3e6d6" stroke-width="10" fill="none" stroke-linecap="round"/><path d="M150,110 Q118,96 112,120 Q108,142 128,146" stroke="#e0cbb0" stroke-width="2" fill="none"/>`),
  bunnyBow: () => HB('#ff9ccf') + both(`<path d="M196,96 Q170,40 182,30 Q196,26 200,92Z" fill="#ff9ccf" stroke="#e0568f" stroke-width="1.5"/>`) + [[186, 56], [190, 74], [214, 56], [210, 74]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.4" fill="#fff"/>`).join(''),
  fairyHat: () => `<g transform="rotate(-12 200 90)"><path d="M156,100 Q200,108 244,100 L208,10Z" fill="#c8a2ff"/><path d="M156,100 Q200,112 244,100" stroke="#ff9ccf" stroke-width="7" fill="none"/>${anim(`<path d="${starPath(208, 10, 9, 4)}" fill="#ffe680"/>`, 'tw')}<circle cx="190" cy="70" r="3" fill="#fff"/><circle cx="210" cy="50" r="2.4" fill="#fff"/></g>`,
  sunHat: () => `<ellipse cx="200" cy="104" rx="118" ry="26" fill="#f5d9a0" stroke="#d9b06a" stroke-width="2"/><path d="M144,100 Q144,52 200,50 Q256,52 256,100Z" fill="#f5d9a0" stroke="#d9b06a" stroke-width="2"/><path d="M146,90 Q200,100 254,90 L255,99 Q200,110 145,99Z" fill="#ff9ccf"/>` + flower(244, 92, 8, '#fff', '#ffd166'),
  bonnet: () => `<path d="M114,170 Q104,70 200,64 Q296,70 286,170 Q280,110 200,100 Q120,110 114,170Z" fill="#fff0f6" stroke="#ffc2dd" stroke-width="2"/><path d="M118,168 Q122,108 200,98 Q278,108 282,168" stroke="#fff" stroke-width="5" fill="none" stroke-dasharray="2 6" stroke-linecap="round"/>` + both(`<path d="M118,170 Q110,200 120,230 Q112,236 116,248" stroke="#ff9ccf" stroke-width="5" fill="none" stroke-linecap="round"/>`),
  flowerHat: () => `<g transform="rotate(12 230 90)"><ellipse cx="230" cy="100" rx="46" ry="12" fill="#c8f0d6"/><path d="M200,98 Q200,64 230,62 Q260,64 260,98Z" fill="#c8f0d6"/>${flower(218, 70, 6, '#ff9ccf')}${flower(236, 64, 7, '#fff', '#ffd166')}${flower(252, 76, 5, '#c79bff')}</g>`,
});

extend('drawEarrings', (st) => st.earrings, {
  starDrop: () => both(`<line x1="122" y1="222" x2="122" y2="240" stroke="${GOLD}" stroke-width="1.2"/><path d="${starPath(122, 245, 7, 3)}" fill="#ffd23f"/><circle cx="122" cy="232" r="2" fill="#fff"/>`),
  heartHoop: () => both(`<path d="${heartPath(122, 226, 20)}" fill="none" stroke="${GOLD}" stroke-width="2.5"/>`),
  pearlCluster: () => both(`<line x1="122" y1="222" x2="122" y2="228" stroke="${GOLD}" stroke-width="1.2"/>` + [[122, 231], [118, 238], [126, 238], [122, 245]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.6" fill="#fffaf0" stroke="#e8dcc0" stroke-width=".6"/>`).join('')),
  lollipop: () => both(`<line x1="122" y1="222" x2="122" y2="246" stroke="#fff" stroke-width="2"/><circle cx="122" cy="236" r="7" fill="#ff8fc7"/><path d="M122,236 m-4,0 a4,4 0 1,1 4,4" stroke="#fff" stroke-width="1.6" fill="none"/>`),
  key: () => both(`<line x1="122" y1="222" x2="122" y2="228" stroke="${GOLD}" stroke-width="1.2"/><circle cx="122" cy="232" r="4" fill="none" stroke="${GOLD}" stroke-width="2"/><path d="M122,236 L122,250 M122,246 L126,246 M122,249 L125,249" stroke="${GOLD}" stroke-width="2"/>`),
  music: () => both(`<line x1="122" y1="222" x2="122" y2="226" stroke="${GOLD}" stroke-width="1.2"/><path d="M124,226 L124,242" stroke="#7b4dff" stroke-width="2"/><ellipse cx="120.5" cy="243" rx="4" ry="3" fill="#7b4dff"/><path d="M124,226 Q130,228 129,234" stroke="#7b4dff" stroke-width="1.8" fill="none"/>`),
  moonStar: () => both(`<line x1="122" y1="222" x2="122" y2="228" stroke="${GOLD}" stroke-width="1.2"/><path d="M124,228 a8,8 0 1,0 0,16 a6,6 0 1,1 0,-16Z" fill="#ffd23f"/><line x1="118" y1="244" x2="118" y2="250" stroke="${GOLD}" stroke-width="1"/><path d="${starPath(118, 253, 4, 1.8)}" fill="#ffd23f"/>`),
  cat: () => both(`<line x1="122" y1="222" x2="122" y2="228" stroke="${GOLD}" stroke-width="1.2"/><path d="M115,233 L116,226 L120,230 L124,230 L128,226 L129,233Z" fill="#ffb366"/><circle cx="122" cy="236" r="6" fill="#ffb366"/><circle cx="120" cy="235" r=".9" fill="${INK}"/><circle cx="124" cy="235" r=".9" fill="${INK}"/>`),
  bunny: () => both(`<line x1="122" y1="222" x2="122" y2="226" stroke="${GOLD}" stroke-width="1.2"/><ellipse cx="119" cy="230" rx="2" ry="6" fill="#fff" stroke="#ffb3d1"/><ellipse cx="125" cy="230" rx="2" ry="6" fill="#fff" stroke="#ffb3d1"/><circle cx="122" cy="239" r="6" fill="#fff" stroke="#ffb3d1"/>`),
  leaf: () => both(`<line x1="122" y1="222" x2="122" y2="228" stroke="${GOLD}" stroke-width="1.2"/><ellipse cx="122" cy="238" rx="4.5" ry="10" fill="#7ed957"/><path d="M122,229 L122,247" stroke="#4caf50" stroke-width="1"/>`),
  gemHoop: () => both(`<circle cx="122" cy="236" r="11" fill="none" stroke="${GOLD}" stroke-width="2"/>` + [[111, 236], [122, 247], [133, 236]].map(([x, y], i) => gem(x, y, 3, ['#ff6fae', '#8fd3ff', '#c79bff'][i])).join('')),
  clover: () => both(`<line x1="122" y1="222" x2="122" y2="230" stroke="${GOLD}" stroke-width="1.2"/>` + [[0, -3.5], [3.5, 0], [0, 3.5], [-3.5, 0]].map(([dx, dy]) => `<circle cx="${122 + dx}" cy="${236 + dy}" r="3.4" fill="#4caf50"/>`).join('')),
});

extend('drawNecklace', (st) => st.necklace, {
  lockHeart: () => `<path d="M178,298 Q200,322 222,298" stroke="${GOLD}" stroke-width="2" fill="none"/><path d="M195,314 Q195,306 200,306 Q205,306 205,314" stroke="${GOLD}" stroke-width="2" fill="none"/><path d="${heartPath(200, 312, 16)}" fill="#ffd23f" stroke="${GOLD}"/><circle cx="200" cy="320" r="1.6" fill="${GOLD}"/>`,
  moonPearl: () => `<path d="M178,298 Q200,322 222,298" stroke="${GOLD}" stroke-width="2" fill="none"/><path d="M204,310 a10,10 0 1,0 0,20 a7.5,7.5 0 1,1 0,-20Z" fill="#fff3a6" stroke="${GOLD}"/><circle cx="203" cy="320" r="3.4" fill="#fffaf0"/>`,
  clover: () => `<path d="M178,298 Q200,322 222,298" stroke="${GOLD}" stroke-width="2" fill="none"/>` + [[0, -4], [4, 0], [0, 4], [-4, 0]].map(([dx, dy]) => `<circle cx="${200 + dx}" cy="${320 + dy}" r="4" fill="#4caf50"/>`).join(''),
  music: () => `<path d="M178,298 Q200,322 222,298" stroke="${GOLD}" stroke-width="2" fill="none"/><path d="M203,312 L203,328" stroke="#7b4dff" stroke-width="2.2"/><ellipse cx="199" cy="329" rx="4.5" ry="3.4" fill="#7b4dff"/><path d="M203,312 Q210,314 209,320" stroke="#7b4dff" stroke-width="2" fill="none"/>`,
  rose: () => `<path d="M178,298 Q200,322 222,298" stroke="#4caf50" stroke-width="2" fill="none"/>` + rose(200, 318, 8, '#e53950'),
  gemCollar: () => beadsAlong(178, 294, 200, 318, 222, 294, 8, 2, () => GOLD) + [[184, 304, '#8fd3ff'], [192, 309, '#ff6fae'], [200, 312, '#c79bff'], [208, 309, '#ff6fae'], [216, 304, '#8fd3ff']].map(([x, y, c]) => gem(x, y + 4, 4.5, c)).join(''),
  bunny: () => `<path d="M178,298 Q200,322 222,298" stroke="${GOLD}" stroke-width="2" fill="none"/><ellipse cx="197" cy="312" rx="2" ry="6" fill="#fff" stroke="#ffb3d1"/><ellipse cx="203" cy="312" rx="2" ry="6" fill="#fff" stroke="#ffb3d1"/><circle cx="200" cy="322" r="7" fill="#fff" stroke="#ffb3d1"/>`,
  pearlDrop: () => `<path d="M178,298 Q200,322 222,298" stroke="${GOLD}" stroke-width="1.5" fill="none"/><line x1="200" y1="309" x2="200" y2="318" stroke="${GOLD}" stroke-width="1.2"/><ellipse cx="200" cy="324" rx="5.5" ry="7" fill="#fffaf0" stroke="#e8dcc0"/>`,
  sunflower: () => `<path d="M178,298 Q200,322 222,298" stroke="#7ed957" stroke-width="2" fill="none"/>` + flower(200, 318, 6, '#ffd23f', '#8d5a3b'),
  snowflake: () => `<path d="M178,298 Q200,322 222,298" stroke="#dfe6f0" stroke-width="2" fill="none"/>` + snowflake(200, 320, 9, '#8fd3ff', 2.4),
  rainbow: () => `<path d="M178,298 Q200,322 222,298" stroke="${GOLD}" stroke-width="2" fill="none"/>` + ['#ff6b6b', '#ffd166', '#7ed957', '#6ec3ff'].map((c, i) => `<path d="M${189 + i * 2.5},326 a${11 - i * 2.5},${11 - i * 2.5} 0 0,1 ${22 - i * 5},0" stroke="${c}" stroke-width="2.4" fill="none"/>`).join(''),
  tripleStar: () => `<path d="M178,298 Q200,322 222,298" stroke="${GOLD}" stroke-width="2" fill="none"/>` + [[190, 318, 5], [200, 324, 7], [210, 318, 5]].map(([x, y, r]) => `<path d="${starPath(x, y, r, r * 0.45)}" fill="#ffd23f"/>`).join(''),
});

extend('drawGlasses', (st) => st.glasses, {
  tinyRound: () => both(`<circle cx="168" cy="200" r="15" fill="#fff" opacity=".15" stroke="#7a5a3a" stroke-width="2.4"/>`) + `<path d="M183,198 Q200,192 217,198" stroke="#7a5a3a" stroke-width="2" fill="none"/>`,
  ovalPink: () => both(`<ellipse cx="168" cy="200" rx="26" ry="20" fill="#ffc2dd" opacity=".25" stroke="#ff8fc7" stroke-width="3.5"/>`) + `<path d="M193,196 Q200,190 207,196" stroke="#ff8fc7" stroke-width="3" fill="none"/>`,
  starSun: () => both(`<path d="${starPath(168, 201, 30, 15)}" fill="#3a2a5a" opacity=".85" stroke="#ffd23f" stroke-width="2.5"/>`),
  heartSun: () => both(`<path d="${heartPath(168, 178, 46)}" fill="#5a1a3a" opacity=".85" stroke="#ff4d8d" stroke-width="2.5"/>`),
  clear: () => both(`<rect x="142" y="180" width="52" height="40" rx="18" fill="#fff" opacity=".2" stroke="#d6e6f5" stroke-width="2.5"/>`) + `<path d="M194,196 L206,196" stroke="#d6e6f5" stroke-width="2.5"/>`,
  bunnyMask: () => `<path fill-rule="evenodd" d="M118,190 Q136,160 200,176 Q264,160 282,190 Q272,228 232,224 Q210,220 200,208 Q190,220 168,224 Q128,228 118,190Z M152,198 a16,12 0 1,0 32,0 a16,12 0 1,0 -32,0Z M216,198 a16,12 0 1,0 32,0 a16,12 0 1,0 -32,0Z" fill="#fff" stroke="#ffb3d1" stroke-width="2.5"/>` + both(`<ellipse cx="146" cy="150" rx="8" ry="22" fill="#fff" stroke="#ffb3d1" stroke-width="2" transform="rotate(-20 146 150)"/>`),
  cloudFrame: () => both(`<g fill="#fff" opacity=".85" stroke="#bfe9ff" stroke-width="1.5"><circle cx="150" cy="200" r="9"/><circle cx="160" cy="184" r="10"/><circle cx="178" cy="184" r="10"/><circle cx="188" cy="200" r="9"/><circle cx="178" cy="216" r="9"/><circle cx="160" cy="216" r="9"/></g><circle cx="169" cy="200" r="15" fill="#fff" opacity=".2"/>`),
  goldWire: () => both(`<circle cx="168" cy="200" r="22" fill="none" stroke="${GOLD}" stroke-width="1.6"/>`) + `<path d="M190,198 Q200,192 210,198" stroke="${GOLD}" stroke-width="1.6" fill="none"/>`,
});

extend('drawGloves', (st) => st.gloves, {
  mint: () => glove('#b8f5c8'), blue: () => glove('#bfe6ff'), goldGlove: () => glove('#ffe680', `<path d="M123,398 L151,398" stroke="${GOLD}" stroke-width="3"/>`),
  bowGlove: () => glove('#fff', `<path d="M137,402 Q127,394 125,402 Q127,410 137,402 Q147,394 149,402 Q147,410 137,402Z" fill="${ACC}"/>`),
  pearlGlove: () => glove('#fff', [126, 131, 136, 141, 146].map(x => `<circle cx="${x}" cy="400" r="2.6" fill="#fffaf0" stroke="#e8dcc0" stroke-width=".6"/>`).join('')),
  furCuff: () => both([124, 131, 138, 145, 151].map(x => `<circle cx="${x}" cy="448" r="6" fill="#fff"/>`).join('')),
  heartBracelet: () => both(`<ellipse cx="137" cy="448" rx="14" ry="4" fill="none" stroke="${GOLD}" stroke-width="1.5"/><path d="${heartPath(137, 450, 9)}" fill="#ff4d8d"/>`),
  moonBracelet: () => both(`<ellipse cx="137" cy="448" rx="14" ry="4" fill="none" stroke="#dfe6f0" stroke-width="1.5"/><path d="M139,450 a5,5 0 1,0 0,10 a3.8,3.8 0 1,1 0,-10Z" fill="#ffe680"/>`),
});
function glove(fill, extra = '') {
  return both(`<path d="M123,395 Q119,440 125,462 Q133,482 148,472 Q152,440 151,395Z" fill="${fill}"/><ellipse cx="136" cy="468" rx="12" ry="13" fill="${fill}"/><path d="M128,410 Q130,440 132,458" stroke="#fff" stroke-width="3" opacity=".6" fill="none"/>${extra}`);
}
