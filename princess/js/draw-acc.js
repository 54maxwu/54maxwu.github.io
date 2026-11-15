/* ---------- crowns, earrings, necklaces, glasses, gloves ---------- */
function drawCrownBack(st) {
  if (st.crown === 'veil') return `<path d="M200,84 Q110,100 96,250 Q80,400 70,500 L330,500 Q320,400 304,250 Q290,100 200,84Z" fill="#fff" opacity=".45" stroke="#fff" stroke-width="2"/>`
    + anim(`<path d="${sparklePath(100, 330, 5)}" fill="#fff"/><path d="${sparklePath(296, 280, 4)}" fill="#fff"/>`, 'tw');
  return '';
}
const headband = (c, w = 6) => `<path d="M124,128 Q200,62 276,128" stroke="${c}" stroke-width="${w}" fill="none"/>`;

function drawCrown(st) {
  switch (st.crown) {
    case 'crown': return `<path d="M160,98 L164,58 L182,80 L200,48 L218,80 L236,58 L240,98Z" fill="#ffd23f" stroke="${GOLD}" stroke-width="2.5" stroke-linejoin="round"/>
      <rect x="160" y="90" width="80" height="10" rx="3" fill="#f5b700"/>
      <circle cx="200" cy="76" r="6" fill="#ff4d8d"/><circle cx="178" cy="88" r="4" fill="#5ec8ff"/><circle cx="222" cy="88" r="4" fill="#5ec8ff"/>
      <circle cx="164" cy="56" r="4" fill="#fff"/><circle cx="200" cy="46" r="4" fill="#fff"/><circle cx="236" cy="56" r="4" fill="#fff"/>`;
    case 'tiara': return `<path d="M148,112 Q200,82 252,112" stroke="#dfe6f0" stroke-width="5" fill="none"/>
      <path d="M170,98 L176,84 L184,94 L200,66 L216,94 L224,84 L230,98" stroke="#dfe6f0" stroke-width="4" fill="none" stroke-linejoin="round"/>
      <path d="M200,80 l6,8 l-6,9 l-6,-9Z" fill="#8fd3ff" stroke="#fff"/><circle cx="176" cy="88" r="3" fill="#ffc6ec"/><circle cx="224" cy="88" r="3" fill="#ffc6ec"/>` + anim(`<path d="${sparklePath(208, 72, 5)}" fill="#fff"/>`, 'tw');
    case 'pearlTiara': return `<path d="M148,112 Q200,82 252,112" stroke="#fffaf0" stroke-width="4" fill="none"/>` + beadsAlong(150, 108, 200, 70, 250, 108, 14, 3.2, () => '#fffaf0')
      + [[176, 86], [200, 72], [224, 86]].map(([x, y], i) => `<line x1="${x}" y1="${y}" x2="${x}" y2="${y - 16 - (i === 1) * 8}" stroke="#fffaf0" stroke-width="2"/><circle cx="${x}" cy="${y - 18 - (i === 1) * 8}" r="${i === 1 ? 6 : 4.5}" fill="#fffaf0" stroke="#e8dcc0"/>`).join('');
    case 'starCrown': return `<path d="M160,98 L240,98 L238,86 L162,86Z" fill="#ffd23f" stroke="${GOLD}" stroke-width="2"/>` + [[172, 72, 9], [200, 56, 14], [228, 72, 9]].map(([x, y, r]) => `<line x1="${x}" y1="86" x2="${x}" y2="${y}" stroke="${GOLD}" stroke-width="2"/>` + anim(`<path d="${starPath(x, y, r, r * 0.45)}" fill="#ffe680" stroke="${GOLD}" stroke-width="1.5"/>`, 'tw', x / 100)).join('');
    case 'moonTiara': return `<path d="M148,112 Q200,82 252,112" stroke="#dfe6f0" stroke-width="5" fill="none"/><path d="M206,58 a18,18 0 1,0 0,36 a13,13 0 1,1 0,-36Z" fill="#fff3a6" stroke="${GOLD}" stroke-width="1.5"/>`
      + anim(`<path d="${starPath(172, 90, 6, 2.6)}" fill="#fff"/><path d="${starPath(230, 90, 6, 2.6)}" fill="#fff"/>`, 'tw');
    case 'iceCrown': return `<path d="M156,100 L162,70 L172,88 L180,52 L190,84 L200,36 L210,84 L220,52 L228,88 L238,70 L244,100Z" fill="#d6f0ff" stroke="#8fd3ff" stroke-width="2" stroke-linejoin="round"/>` + snowflake(200, 82, 7, '#fff', 2) + `<rect x="156" y="94" width="88" height="8" rx="3" fill="#bfe9ff"/>`;
    case 'heartCrown': return `<path d="M160,100 L240,100 L238,80 L162,80Z" fill="#ffd23f" stroke="${GOLD}" stroke-width="2"/>` + [[172, 62, 16], [200, 50, 22], [228, 62, 16]].map(([x, y, k]) => `<path d="${heartPath(x, y, k)}" fill="#ff4d8d" stroke="${GOLD}" stroke-width="2"/>`).join('') + `<circle cx="200" cy="90" r="4" fill="#fff"/>`;
    case 'butterflyCrown': return headband('#dfe6f0', 4) + butterfly(200, 74, 1.4, '#c79bff', '#ff9ccf') + butterfly(168, 92, 0.8, '#8fd3ff') + butterfly(232, 92, 0.8, '#8fd3ff');
    case 'shellCrown': return `<path d="M164,100 Q164,60 200,56 Q236,60 236,100Z" fill="#ffd6f5" stroke="#ff9ebb" stroke-width="2"/>` + [176, 188, 200, 212, 224].map(x => `<path d="M200,100 L${x},62" stroke="#ff9ebb" stroke-width="1.5"/>`).join('') + `<circle cx="200" cy="100" r="7" fill="#fffaf0" stroke="#e8dcc0"/>` + [[160, 104], [240, 104]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="#fffaf0"/>`).join('');
    case 'roseCrown': { let s = ''; for (let i = 0; i <= 6; i++) { const a = Math.PI * (1.12 + i * 0.76 / 6); s += rose(f1(200 + Math.cos(a) * 80), f1(130 + Math.sin(a) * 50), 10, i % 2 ? '#e53950' : '#ff6f91'); } return s; }
    case 'wreath': {
      let s = ''; const cols = ['#ff8fc7', '#fff', '#ffd166', '#c79bff'];
      for (let i = 0; i <= 8; i++) { const a = Math.PI + (Math.PI / 8) * i, x = 200 + Math.cos(a) * 82, y = 128 + Math.sin(a) * 46; s += `<ellipse cx="${f1(x + 6)}" cy="${f1(y + 4)}" rx="8" ry="4" fill="#6fcf7f" transform="rotate(${(i * 22.5).toFixed(0)} ${f1(x)} ${f1(y)})"/>` + flower(x, y, 6.5, cols[i % cols.length]); }
      return s;
    }
    case 'antlers': return both(`<path d="M150,104 Q140,70 150,40 M146,78 Q128,70 122,52 M150,56 Q162,46 166,34" stroke="#c9a27a" stroke-width="5" fill="none" stroke-linecap="round"/>` + flower(150, 40, 4.5, '#ffc2dd') + flower(122, 52, 4, '#fff') + `<ellipse cx="160" cy="92" rx="7" ry="3" fill="#7ed957"/>`);
    case 'circlet': return `<path d="M120,150 Q200,128 280,150" stroke="${GOLD}" stroke-width="2" fill="none"/>` + beadsAlong(120, 150, 200, 128, 280, 150, 16, 1.6, () => '#fffaf0') + `<path d="M200,139 L200,146" stroke="${GOLD}" stroke-width="1.5"/>` + gem(200, 152, 6, '#8fd3ff');
    case 'halo': return anim(`<ellipse cx="200" cy="50" rx="52" ry="12" fill="none" stroke="#fff3a6" stroke-width="10" opacity=".6"/><ellipse cx="200" cy="50" rx="52" ry="12" fill="none" stroke="#ffd23f" stroke-width="4"/>`, 'fl');
    case 'veil': return `<path d="M156,100 Q200,80 244,100" stroke="#fff" stroke-width="5" fill="none"/>` + [164, 182, 200, 218, 236].map((x, i) => `<circle cx="${x}" cy="${96 - (i === 2 ? 8 : i % 2 ? 5 : 0)}" r="4" fill="#fffaf0" stroke="#e8dcc0"/>`).join('');
    case 'hennin': return `<path d="M164,100 L222,6 L240,98Z" fill="#ff9ccf" stroke="#e0568f" stroke-width="2"/><path d="M168,94 L238,92" stroke="${GOLD}" stroke-width="6"/><path d="M222,6 Q280,60 270,160 Q290,90 228,10Z" fill="#fff" opacity=".7"/><circle cx="222" cy="6" r="4" fill="${GOLD}"/>`;
    case 'unicorn': return `<path d="M188,96 L200,26 L212,96Z" fill="#ffe680" stroke="${GOLD}" stroke-width="2"/><path d="M191,82 L209,74 M193,66 L207,58 M196,48 L204,43" stroke="${GOLD}" stroke-width="2"/>` + flower(172, 98, 6, '#ff8fc7') + flower(228, 98, 6, '#c79bff');
    case 'catEars': return both(`<path d="M126,118 L132,58 L172,92Z" fill="#fff" stroke="#f0d0e0" stroke-width="3"/><path d="M134,104 L137,74 L158,92Z" fill="#ffb3d1"/>`) + headband('#fff');
    case 'bunnyEars': return both(`<ellipse cx="172" cy="46" rx="14" ry="44" fill="#fff" stroke="#f0d0e0" stroke-width="3" transform="rotate(-12 172 46)"/><ellipse cx="172" cy="50" rx="6" ry="30" fill="#ffb3d1" transform="rotate(-12 172 50)"/>`) + headband('#ff9ccf');
    case 'bearEars': return both(`<circle cx="136" cy="96" r="22" fill="#a0672d"/><circle cx="136" cy="96" r="11" fill="#e8b48a"/>`) + headband('#a0672d');
    case 'bow': return `<path d="M246,104 Q214,76 216,108 Q218,132 246,112Z M254,104 Q286,76 284,108 Q282,132 254,112Z" fill="#ff4d8d" stroke="#c2185b" stroke-width="2"/><circle cx="250" cy="108" r="8" fill="#e0306f"/>`;
    case 'ribbons': return both(`<path d="M128,136 Q106,118 108,138 Q110,156 128,142Z M136,136 Q158,118 156,138 Q154,156 136,142Z" fill="${ACC}" stroke="#e0306f" stroke-width="1.5"/><circle cx="132" cy="139" r="5" fill="#e0306f"/>`);
    case 'headband': { let s = headband('#fff', 4); for (let i = 0; i <= 12; i++) { const [x, y] = qpt(124, 128, 200, 64, 276, 128, i / 12); s += `<circle cx="${f1(x)}" cy="${f1(y)}" r="5" fill="#fffaf0" stroke="#e8dcc0"/>`; } return s; }
    case 'beret': return `<ellipse cx="214" cy="92" rx="74" ry="26" fill="#e0568f" transform="rotate(10 214 92)"/><ellipse cx="214" cy="100" rx="66" ry="10" fill="#c2185b" opacity=".4" transform="rotate(10 214 100)"/><circle cx="218" cy="64" r="6" fill="#c2185b"/>`;
    case 'topHat': return `<g transform="rotate(14 240 80)"><ellipse cx="240" cy="100" rx="34" ry="8" fill="#2b1a3a"/><rect x="220" y="56" width="40" height="44" rx="4" fill="#2b1a3a"/><rect x="220" y="86" width="40" height="8" fill="${ACC}"/></g>` + flower(262, 94, 5, '#fff');
    case 'fascinator': return `<path d="M250,110 Q300,40 296,20 Q280,70 246,106Z" fill="#fff" stroke="#e3e0f0"/><path d="M256,110 Q320,70 330,40 Q300,80 252,106Z" fill="#ffc2dd"/><circle cx="252" cy="112" r="12" fill="#c79bff"/><circle cx="252" cy="112" r="5" fill="#fff"/>`;
    case 'starclip': return `<path d="${starPath(254, 118, 16, 7)}" fill="#ffd23f" stroke="#fff" stroke-width="2"/><path d="${starPath(234, 104, 8, 3.5)}" fill="#ffe680" stroke="#fff" stroke-width="1.5"/>`;
    case 'moonClip': return `<path d="M258,98 a18,18 0 1,0 0,36 a13,13 0 1,1 0,-36Z" fill="#ffe680" stroke="#fff" stroke-width="2"/><path d="${starPath(272, 104, 5, 2.2)}" fill="#fff"/><path d="${starPath(266, 128, 3.5, 1.5)}" fill="#fff"/>`;
    case 'flowerClip': return `<ellipse cx="236" cy="128" rx="12" ry="5" fill="#4caf50" transform="rotate(30 236 128)"/>` + flower(254, 116, 11, '#ff6f91', '#ffe066');
    case 'butterflyClips': return [[250, 112, 1, '#b48cff'], [270, 136, 0.8, '#7fc8ff'], [234, 98, 0.7, '#ff8fc7']].map(([x, y, k, c]) => butterfly(x, y, k, c)).join('');
    default: return '';
  }
}

function drawEarrings(st) {
  const hook = (y2 = 230) => `<line x1="122" y1="222" x2="122" y2="${y2}" stroke="${GOLD}" stroke-width="1.5"/>`;
  const one = {
    stud: gem(122, 223, 5, '#dff4ff'),
    pearl: hook() + `<circle cx="122" cy="235" r="6" fill="#fffaf0" stroke="#e8dcc0"/><circle cx="120" cy="233" r="2" fill="#fff"/>`,
    pearlDrop: hook(236) + `<circle cx="122" cy="226" r="3" fill="#fffaf0"/><ellipse cx="122" cy="243" rx="5.5" ry="7" fill="#fffaf0" stroke="#e8dcc0"/>`,
    heart: hook() + `<path d="${heartPath(122, 229, 13)}" fill="#ff4d8d"/>`,
    star: hook() + `<path d="${starPath(122, 237, 9, 4)}" fill="#ffd23f"/>`,
    drop: hook(232) + `<path d="M122,232 Q114,244 122,250 Q130,244 122,232Z" fill="#8fd3ff" stroke="#fff"/>`,
    hoop: `<circle cx="122" cy="236" r="11" fill="none" stroke="${GOLD}" stroke-width="3"/>`,
    moon: hook() + `<path d="M124,230 a8,8 0 1,0 0,16 a6,6 0 1,1 0,-16Z" fill="#ffd23f"/>`,
    planet: hook(230) + `<circle cx="122" cy="237" r="5.5" fill="#c79bff"/><ellipse cx="122" cy="237" rx="10" ry="3" fill="none" stroke="#ffd166" stroke-width="1.5" transform="rotate(-20 122 237)"/>`,
    cloud: hook(228) + `<g fill="#fff" stroke="#bfe9ff"><circle cx="117" cy="236" r="5"/><circle cx="123" cy="232" r="6"/><circle cx="128" cy="237" r="5"/></g>`,
    rainbow: hook(228) + ['#ff6b6b', '#ffd166', '#7ed957', '#6ec3ff'].map((c, i) => `<path d="M${112 + i * 2.5},240 a${10 - i * 2.5},${10 - i * 2.5} 0 0,1 ${20 - i * 5},0" stroke="${c}" stroke-width="2.2" fill="none"/>`).join(''),
    flower: hook(228) + flower(122, 236, 4, '#ff8fc7'),
    cherry: hook(226) + `<path d="M122,226 Q116,234 116,240 M122,226 Q128,234 129,240" stroke="#4caf50" stroke-width="1.5" fill="none"/><circle cx="116" cy="242" r="4.5" fill="#e53950"/><circle cx="129" cy="242" r="4.5" fill="#e53950"/>`,
    strawberry: hook(228) + `<path d="M122,228 Q130,230 129,238 Q126,246 122,248 Q118,246 115,238 Q114,230 122,228Z" fill="#ff4d6d"/><path d="M117,229 L122,226 L127,229Z" fill="#4caf50"/>`,
    icecream: hook(226) + `<path d="M117,236 L127,236 L122,250Z" fill="#e8b46a"/><circle cx="122" cy="232" r="6" fill="#ffc2dd"/><circle cx="122" cy="226" r="2" fill="#e53950"/>`,
    butterfly: hook(228) + butterfly(122, 237, 0.6, '#b48cff'),
    bow: hook(228) + `<path d="M122,234 Q112,226 112,236 Q112,244 122,236 Q132,226 132,236 Q132,244 122,236Z" fill="${ACC}"/><circle cx="122" cy="235" r="2.5" fill="#e0306f"/>`,
    crown: hook(228) + `<path d="M114,244 L113,232 L118,236 L122,229 L126,236 L131,232 L130,244Z" fill="#ffd23f" stroke="${GOLD}"/>`,
    shell: hook(228) + `<path d="M114,244 Q114,230 122,230 Q130,230 130,244Z" fill="#ffd6f5" stroke="#ff9ebb"/><path d="M122,244 L122,232 M122,244 L117,233 M122,244 L127,233" stroke="#ff9ebb" stroke-width=".8"/>`,
    feather: hook(226) + `<path d="M122,228 Q112,244 120,262 Q128,244 122,228Z" fill="#fff" stroke="#d9c2ff"/><path d="M122,230 L121,260" stroke="#d9c2ff" stroke-width="1"/>`,
    bell: hook(228) + `<path d="M115,242 Q115,230 122,230 Q129,230 129,242Z" fill="#ffd23f" stroke="${GOLD}"/><circle cx="122" cy="243" r="2" fill="${GOLD}"/>`,
    tassel: hook(226) + `<circle cx="122" cy="228" r="3" fill="${GOLD}"/>` + [-4, -2, 0, 2, 4].map(dx => `<line x1="122" y1="230" x2="${122 + dx}" y2="252" stroke="${ACC}" stroke-width="1.5"/>`).join(''),
    chandelier: hook(226) + `<path d="M112,232 Q122,240 132,232" stroke="${GOLD}" stroke-width="1.5" fill="none"/>` + [[112, 236], [122, 242], [132, 236]].map(([x, y]) => `<path d="M${x},${y} Q${x - 4},${y + 7} ${x},${y + 10} Q${x + 4},${y + 7} ${x},${y}Z" fill="#c9a7ff" stroke="#fff" stroke-width=".8"/>`).join(''),
    snowflake: hook(228) + snowflake(122, 237, 8, '#8fd3ff', 2.2),
  }[st.earrings];
  return one ? both(one) : '';
}

function drawNecklace(st) {
  const CH = `<path d="M178,298 Q200,322 222,298" stroke="${GOLD}" stroke-width="2" fill="none"/>`;
  const arc = (n, y0, depth, r, colFn) => beadsAlong(176, y0, 200, y0 + depth * 2, 224, y0, n, r, colFn);
  switch (st.necklace) {
    case 'pearl': return arc(10, 298, 10, 4, () => '#fffaf0');
    case 'doublePearl': return arc(10, 296, 7, 3.5, () => '#fffaf0') + arc(12, 298, 14, 3.5, () => '#ffe9f2');
    case 'pearlY': return arc(10, 296, 8, 3, () => '#fffaf0') + [0, 1, 2, 3].map(i => `<circle cx="200" cy="${314 + i * 7}" r="${3 + (i === 3) * 2}" fill="#fffaf0" stroke="#e8dcc0"/>`).join('');
    case 'heart': return CH + `<path d="${heartPath(200, 310, 16)}" fill="#ff4d8d" stroke="${GOLD}" stroke-width="1.5"/>`;
    case 'heartChain': return CH + [0.15, 0.35, 0.5, 0.65, 0.85].map(t => { const [x, y] = qpt(178, 298, 200, 322, 222, 298, t); return `<path d="${heartPath(x, y - 1, t === 0.5 ? 12 : 7)}" fill="#ff6fae"/>`; }).join('');
    case 'gem': return CH + `<path d="M200,310 l9,8 l-9,14 l-9,-14Z" fill="#7b5cff" stroke="#fff" stroke-width="1.5"/><path d="M193,316 l7,-3 l7,3" stroke="#fff" fill="none" opacity=".7"/>`;
    case 'tearDrop': return CH + `<path d="M200,308 Q188,326 200,336 Q212,326 200,308Z" fill="#ff6fae" stroke="#fff" stroke-width="1.5"/><ellipse cx="197" cy="324" rx="2" ry="4" fill="#fff" opacity=".6"/>`;
    case 'crystal': return CH + `<path d="M200,308 L208,318 L200,340 L192,318Z" fill="#bfe9ff" stroke="#fff" stroke-width="1.5"/><path d="M192,318 L208,318 M200,308 L200,340" stroke="#fff" stroke-width="1" opacity=".7"/>`;
    case 'star': return CH + `<path d="${starPath(200, 320, 10, 4.5)}" fill="#ffd23f" stroke="${GOLD}"/>`;
    case 'starChain': return CH + [0.2, 0.4, 0.6, 0.8].map(t => { const [x, y] = qpt(178, 298, 200, 322, 222, 298, t); return `<path d="${starPath(x, y + 4, 5, 2.2)}" fill="#ffd23f"/>`; }).join('');
    case 'moon': return CH + `<path d="M203,310 a10,10 0 1,0 0,20 a7.5,7.5 0 1,1 0,-20Z" fill="#fff3a6" stroke="${GOLD}"/>`;
    case 'sunMoon': return CH + `<circle cx="194" cy="318" r="6" fill="#ffd23f"/><path d="M210,312 a7,7 0 1,0 0,14 a5,5 0 1,1 0,-14Z" fill="#fff3a6" stroke="${GOLD}" stroke-width=".8"/>`;
    case 'flowerChain': { let s = ''; for (let i = 0; i <= 6; i++) { const [x, y] = qpt(176, 298, 200, 318, 224, 298, i / 6); s += flower(x, y, 3, i % 2 ? '#ff8fc7' : '#fff'); } return s; }
    case 'bow': return CH + `<path d="M200,316 Q186,306 186,318 Q186,328 200,318 Q214,306 214,318 Q214,328 200,318Z" fill="${ACC}"/><circle cx="200" cy="317" r="3" fill="#e0306f"/>`;
    case 'ribbonPearl': return `<path d="M184,286 Q200,296 216,286" stroke="#ff9ccf" stroke-width="6" fill="none"/>` + arc(8, 300, 8, 3, () => '#fffaf0') + `<path d="M200,292 Q190,284 190,292 Q190,300 200,292 Q210,284 210,292 Q210,300 200,292Z" fill="#ff9ccf"/>`;
    case 'key': return CH + `<circle cx="200" cy="316" r="5" fill="none" stroke="${GOLD}" stroke-width="2.5"/><path d="M200,321 L200,336 M200,330 L205,330 M200,334 L204,334" stroke="${GOLD}" stroke-width="2.5"/>`;
    case 'locket': return CH + `<ellipse cx="200" cy="320" rx="9" ry="11" fill="#ffd23f" stroke="${GOLD}" stroke-width="1.5"/><path d="${heartPath(200, 315, 9)}" fill="#ff4d8d"/>`;
    case 'crownPendant': return CH + `<path d="M191,326 L190,312 L195,317 L200,309 L205,317 L210,312 L209,326Z" fill="#ffd23f" stroke="${GOLD}"/><circle cx="200" cy="320" r="2" fill="#ff4d8d"/>`;
    case 'butterfly': return CH + butterfly(200, 320, 0.75, '#7fc8ff');
    case 'shell': return CH + `<path d="M190,326 Q190,310 200,310 Q210,310 210,326Z" fill="#ffd1dc" stroke="#ff9ebb"/><path d="M200,326 L200,312 M200,326 L194,313 M200,326 L206,313" stroke="#ff9ebb" stroke-width="1"/>`;
    case 'cherry': return CH + `<path d="M200,308 Q194,316 194,322 M200,308 Q206,316 207,322" stroke="#4caf50" stroke-width="1.5" fill="none"/><circle cx="194" cy="324" r="4.5" fill="#e53950"/><circle cx="207" cy="324" r="4.5" fill="#e53950"/>`;
    case 'beads': { const cs = ['#ff6b6b', '#ffb347', '#ffe066', '#7ed957', '#6ec3ff', '#9d6bff']; return arc(10, 298, 10, 4, i => cs[i % 6]); }
    case 'choker': return `<path d="M186,282 Q200,290 214,282 L214,290 Q200,298 186,290Z" fill="${INK}"/><circle cx="200" cy="294" r="5" fill="${ACC}" stroke="#fff"/>`;
    case 'lace': return `<path d="M186,280 Q200,288 214,280 L214,290 Q200,298 186,290Z" fill="#fff" stroke="#f0d9e4"/><path d="M186,290${scallop(186, 214, 290, 5, 4)}" stroke="#fff" stroke-width="2" fill="none"/><path d="M200,298 Q195,306 200,310 Q205,306 200,298Z" fill="#fffaf0" stroke="#e8dcc0"/>`;
    default: return '';
  }
}

function drawGlasses(st) {
  const temples = (c) => both(`<path d="M144,192 L124,188" stroke="${c}" stroke-width="3"/>`);
  switch (st.glasses) {
    case 'round': return both(`<circle cx="168" cy="198" r="23" fill="#fff" opacity=".15" stroke="#c2185b" stroke-width="4"/>`) + `<path d="M191,196 Q200,188 209,196" stroke="#c2185b" stroke-width="3" fill="none"/>` + temples('#c2185b');
    case 'heart': return both(`<path d="${heartPath(168, 178, 46)}" fill="#ff6fae" opacity=".45" stroke="#ff2e88" stroke-width="3"/>`) + `<path d="M190,194 Q200,188 210,194" stroke="#ff2e88" stroke-width="3" fill="none"/>`;
    case 'star': return both(`<path d="${starPath(168, 200, 30, 15)}" fill="#ffe066" opacity=".5" stroke="${GOLD}" stroke-width="3"/>`) + `<path d="M192,196 Q200,190 208,196" stroke="${GOLD}" stroke-width="3" fill="none"/>`;
    case 'cateye': return both(`<path d="M142,190 Q148,174 172,176 Q192,178 193,196 Q190,216 168,217 Q146,214 142,190Z" fill="#fff" opacity=".15" stroke="#7b2cbf" stroke-width="4"/><path d="M142,186 L132,172" stroke="#7b2cbf" stroke-width="4" stroke-linecap="round"/><circle cx="133" cy="173" r="2.5" fill="#fff"/>`) + `<path d="M192,194 L208,194" stroke="#7b2cbf" stroke-width="3"/>`;
    case 'square': return both(`<rect x="142" y="178" width="52" height="40" rx="10" fill="#fff" opacity=".15" stroke="#3a3a4a" stroke-width="4"/>`) + `<path d="M194,194 L206,194" stroke="#3a3a4a" stroke-width="3"/>` + temples('#3a3a4a');
    case 'rainbow': return both(['#ff6b6b', '#ffd166', '#7ed957', '#6ec3ff', '#9d6bff'].map((c, i) => `<circle cx="168" cy="198" r="${24 - i * 1.6}" fill="none" stroke="${c}" stroke-width="1.8"/>`).join('')) + `<path d="M192,196 Q200,188 208,196" stroke="#ff9ccf" stroke-width="3" fill="none"/>`;
    case 'flowerFrame': return both(`<circle cx="168" cy="198" r="22" fill="#fff" opacity=".12" stroke="#ff9ccf" stroke-width="3"/>` + [0, 72, 144, 216, 288].map(a => { const x = 168 + Math.cos(a * Math.PI / 180) * 22, y = 198 + Math.sin(a * Math.PI / 180) * 22; return flower(f1(x), f1(y), 3.5, '#fff', '#ff9ccf'); }).join('')) + `<path d="M190,196 Q200,188 210,196" stroke="#ff9ccf" stroke-width="3" fill="none"/>`;
    case 'monocle': return mirror(`<circle cx="168" cy="198" r="22" fill="#fff" opacity=".18" stroke="${GOLD}" stroke-width="3.5"/><path d="M150,212 Q140,260 150,300" stroke="${GOLD}" stroke-width="1.5" fill="none"/>`);
    case 'sunglasses': return both(`<path d="M142,186 Q168,176 194,186 Q196,216 170,220 Q144,216 142,186Z" fill="#2b2b3a" opacity=".88" stroke="${GOLD}" stroke-width="2"/><path d="M152,190 L162,186" stroke="#fff" stroke-width="3" opacity=".6" stroke-linecap="round"/>`) + `<path d="M194,188 Q200,184 206,188" stroke="${GOLD}" stroke-width="2.5" fill="none"/>`;
    case 'mask': return `<path fill-rule="evenodd" d="M118,190 Q136,158 200,176 Q264,158 282,190 Q272,228 232,224 Q210,220 200,208 Q190,220 168,224 Q128,228 118,190Z M152,198 a16,12 0 1,0 32,0 a16,12 0 1,0 -32,0Z M216,198 a16,12 0 1,0 32,0 a16,12 0 1,0 -32,0Z" fill="#7b4dff" stroke="${GOLD}" stroke-width="2.5"/>
      <path d="M278,180 Q300,140 296,110 Q290,150 270,176Z" fill="#ff8fc7"/>` + [[136, 184], [200, 190], [264, 184]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" fill="#ffd23f"/>`).join('');
    case 'butterflyMask': return both(`<path fill-rule="evenodd" d="M200,194 Q172,148 124,164 Q108,202 138,226 Q178,234 200,208Z M152,198 a15,11 0 1,0 30,0 a15,11 0 1,0 -30,0Z" fill="#ff9ccf" opacity=".9" stroke="#ffd166" stroke-width="2"/><circle cx="132" cy="176" r="3" fill="#fff"/><circle cx="136" cy="216" r="2.5" fill="#fff"/>`);
    case 'catMask': return both(`<path fill-rule="evenodd" d="M200,190 Q170,170 140,174 L130,150 L150,168 Q120,180 122,200 Q130,226 168,224 Q190,222 200,210Z M152,198 a15,11 0 1,0 30,0 a15,11 0 1,0 -30,0Z" fill="#fff" stroke="#ff9ccf" stroke-width="2.5"/><path d="M134,158 L140,170" stroke="#ff9ccf" stroke-width="3"/>`);
    default: return '';
  }
}

function drawGloves(st) {
  const g = (fill, extra = '') => `<path d="M123,395 Q119,440 125,462 Q133,482 148,472 Q152,440 151,395Z" fill="${fill}"/><ellipse cx="136" cy="468" rx="12" ry="13" fill="${fill}"/>${extra}`;
  const one = {
    white: g('#fff', `<path d="M123,395 Q137,401 151,395" stroke="#eee" stroke-width="3" fill="none"/>`),
    lace: g('#fff', `<path d="M122,395${scallop(122, 152, 395, 4, -7)}" fill="#fff"/>` + [[130, 410], [142, 422], [132, 436], [144, 448], [134, 456]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" fill="none" stroke="#f0d0e0"/>`).join('')),
    pink: g('#ffb3d6', `<path d="M128,410 Q130,440 132,458" stroke="#fff" stroke-width="3" opacity=".6" fill="none"/>`),
    lilac: g('#d9c2ff', `<path d="M128,410 Q130,440 132,458" stroke="#fff" stroke-width="3" opacity=".6" fill="none"/><path d="M122,398 L152,398" stroke="#b48cff" stroke-width="3"/>`),
    ruffle: `<path d="M120,440${scallop(120, 154, 440, 4, 10)} L154,450${scallop(154, 120, 450, 4, 10)}Z" fill="#fff" stroke="#f0d0e0"/>`,
    pearl: [126, 131, 136, 141, 146].map(x => `<circle cx="${x}" cy="448" r="3.2" fill="#fffaf0" stroke="#e8dcc0"/>`).join(''),
    gold: `<ellipse cx="137" cy="448" rx="14" ry="4.5" fill="none" stroke="${GOLD}" stroke-width="4"/>`,
    crystal: `<ellipse cx="137" cy="448" rx="14" ry="4.5" fill="none" stroke="#dfe6f0" stroke-width="3"/>` + [128, 137, 146].map(x => gem(x, 449, 3.5, '#bfe9ff')).join(''),
    star: `<ellipse cx="137" cy="448" rx="14" ry="4" fill="none" stroke="${GOLD}" stroke-width="1.5"/><path d="${starPath(137, 455, 5, 2.2)}" fill="#ffd23f"/>`,
    flower: `<rect x="124" y="444" width="27" height="7" rx="3" fill="#7ed957"/>` + flower(137, 446, 5, '#ff8fc7'),
    ribbon: `<rect x="124" y="444" width="27" height="7" rx="3" fill="${ACC}"/><path d="M140,448 Q132,438 130,448 Q132,458 140,448 Q148,438 150,448 Q148,458 140,448Z" fill="${ACC}" stroke="#e0306f"/>`,
    charm: ['#ff6b6b', '#ffd166', '#7ed957', '#6ec3ff', '#c79bff'].map((c, i) => `<circle cx="${126 + i * 5}" cy="448" r="3.2" fill="${c}"/>`).join('') + `<path d="${heartPath(138, 452, 8)}" fill="${GOLD}"/>`,
  }[st.gloves];
  return one ? both(one) : '';
}
