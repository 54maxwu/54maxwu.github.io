/* ---------- face: eyes, brows, makeup, face art ---------- */
const EYE_SHAPES = {
  round: 'translate(168 200) scale(1.16) translate(-168 -198)',
  big: 'translate(168 200) scale(1.3 1.34) translate(-168 -198)',
  doll: 'translate(168 200) scale(1.4 1.48) translate(-168 -198)',
  almond: 'translate(168 200) rotate(8) scale(1.32 1) translate(-168 -198)',
  droopy: 'translate(168 200) rotate(-10) scale(1.26) translate(-168 -198)',
  sleepy: 'translate(168 200) scale(1.26) translate(-168 -198)',
};
const CLOSED_EYE = 'translate(168 200) scale(1.25) translate(-168 -198)';

function drawPupil(t) {
  const d = '#1c1018';
  switch (t) {
    case 'star': return `<path d="${starPath(168, 201, 8.5, 3.8)}" fill="${d}"/>`;
    case 'heart': return `<path d="${heartPath(168, 194, 14)}" fill="${d}"/>`;
    case 'sparkle': return `<circle cx="168" cy="201" r="6" fill="${d}"/><path d="${sparklePath(162, 206, 4)}" fill="#fff"/>`;
    case 'flower': return flower(168, 201, 3.4, d, '#ffd166');
    case 'diamond': return `<path d="M168,192 L175,201 L168,210 L161,201Z" fill="${d}"/>`;
    case 'cat': return `<ellipse cx="168" cy="201" rx="2.6" ry="9.5" fill="${d}"/>`;
    case 'galaxy': return `<circle cx="168" cy="201" r="9" fill="#2a1650"/><circle cx="168" cy="201" r="4.5" fill="${d}"/><circle cx="163" cy="205" r="1" fill="#fff"/><circle cx="171" cy="207" r="0.8" fill="#fff"/><circle cx="174" cy="200" r="0.8" fill="#ffe680"/>`;
    case 'moon': return `<path d="M171,194 a7.5,7.5 0 1,0 0,14 a5.5,5.5 0 1,1 0,-14Z" fill="${d}"/>`;
    case 'ring': return `<circle cx="168" cy="201" r="7" fill="none" stroke="${d}" stroke-width="3"/><circle cx="168" cy="201" r="2.5" fill="${d}"/>`;
    case 'clover': return [[0, -3.5], [3.5, 0], [0, 3.5], [-3.5, 0]].map(([dx, dy]) => `<circle cx="${168 + dx}" cy="${201 + dy}" r="3.6" fill="${d}"/>`).join('');
    case 'snow': return snowflake(168, 201, 7.5, d, 2.6) + `<circle cx="168" cy="201" r="2.5" fill="${d}"/>`;
    default: return `<circle cx="168" cy="201" r="6" fill="${d}"/>`;
  }
}

function drawIris(p, st) {
  const c = st.eyeColor;
  const fill = st.iris === 'plain' ? c : `url(#${p}${st._iris || 'iris'})`;
  let s = `<circle cx="168" cy="201" r="12.5" fill="${fill}"/>`;
  switch (st.iris) {
    case 'ring': s += `<circle cx="168" cy="201" r="11.8" fill="none" stroke="${shade(c, -45)}" stroke-width="1.6"/><circle cx="168" cy="201" r="8.6" fill="none" stroke="${shade(c, 55)}" stroke-width="1.2" opacity=".8"/>`; break;
    case 'rays': for (let i = 0; i < 12; i++) { const a = Math.PI * 2 * i / 12; s += `<line x1="${f1(168 + Math.cos(a) * 6)}" y1="${f1(201 + Math.sin(a) * 6)}" x2="${f1(168 + Math.cos(a) * 11)}" y2="${f1(201 + Math.sin(a) * 11)}" stroke="${shade(c, 55)}" stroke-width="1.2" opacity=".65"/>`; } break;
    case 'dual': s += `<path d="M155.5,201 A12.5,12.5 0 0,0 180.5,201Z" fill="#ffb3e6" opacity=".55"/>`; break;
    case 'crystal': s += `<path d="M168,188.5 L177,197 L168,213.5 L159,197Z M155.5,201 L180.5,201 M159,197 L177,197" stroke="#fff" stroke-width="1" fill="none" opacity=".5"/>`; break;
  }
  return s;
}

function drawHighlight(t) {
  const W = '#fff';
  switch (t) {
    case 'round': return `<circle cx="173" cy="195" r="4.5" fill="${W}"/><circle cx="163" cy="207" r="2" fill="${W}"/>`;
    case 'star': return `<path d="${starPath(173, 195, 6, 2.6)}" fill="${W}"/><path d="${starPath(163, 207, 3, 1.3)}" fill="${W}"/>`;
    case 'heart': return `<path d="${heartPath(173, 190, 10)}" fill="${W}"/><circle cx="163" cy="207" r="2" fill="${W}"/>`;
    case 'double': return `<circle cx="173" cy="195" r="4.5" fill="${W}"/><circle cx="164" cy="194" r="2.4" fill="${W}"/><circle cx="163" cy="207" r="2.4" fill="${W}"/><circle cx="172" cy="207" r="1.4" fill="${W}"/>`;
    case 'moon': return `<path d="M175,190 a5.5,5.5 0 1,0 0,11 a4,4 0 1,1 0,-11Z" fill="${W}"/><circle cx="163" cy="207" r="1.8" fill="${W}"/>`;
    case 'cross': return `<path d="M173,188 L173,202 M166,195 L180,195" stroke="${W}" stroke-width="2.2" stroke-linecap="round"/><circle cx="173" cy="195" r="2.2" fill="${W}"/><circle cx="163" cy="207" r="1.8" fill="${W}"/>`;
    case 'cluster': return [[173, 194, 3], [167, 192, 1.6], [176, 200, 1.4], [162, 206, 2], [168, 209, 1.2], [171, 204, 0.9]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${W}"/>`).join('');
    case 'big': return `<ellipse cx="172" cy="194" rx="6" ry="5" fill="${W}"/><path d="M158,206 Q168,214 178,206" stroke="${W}" stroke-width="2" fill="none" opacity=".75" stroke-linecap="round"/><circle cx="164" cy="196" r="1.5" fill="${W}"/>`;
    default: return `<path d="${sparklePath(173, 194, 6.5)}" fill="${W}"/><circle cx="163" cy="207" r="2.1" fill="${W}"/><circle cx="176" cy="204" r="1.2" fill="${W}"/>`;
  }
}

function lashPaths(st) {
  const ln = st.lashes, col = ln === 5 ? '#9d4edd' : INK;
  const L = (d, w = 2.5, c = col) => `<path d="${d}" stroke="${c}" stroke-width="${f1(w * 0.68)}" stroke-linecap="round" fill="none"/>`;
  switch (ln) {
    case 1: return L('M152,190 l-9,-6 M156,184 l-6,-9');
    case 2: return L('M152,190 l-10,-6 M156,184 l-7,-10 M162,180 l-3,-10 M169,178 l0,-10', 3);
    case 3: case 5: return L('M151,193 l-13,-3 M154,187 l-12,-10 M160,182 l-8,-13 M168,179 l-2,-12 M176,179 l3,-10', 3) + L('M156,212 l-4,6 M164,215 l-2,7 M172,215 l0,7', 1.6);
    case 4: return L('M152,191 q-12,-2 -14,-12 M157,184 q-9,-6 -7,-17 M164,180 q-4,-8 0,-16 M172,178 q1,-8 7,-13', 2.5);
    case 6: return L('M151,193 l-13,-3 M154,187 l-12,-10 M160,182 l-8,-13 M168,179 l-2,-12', 3) + [[138, 190], [142, 177], [152, 169], [166, 167]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2" fill="#ffd23f"/>`).join('');
    case 7: return L('M150,193 q-16,-2 -22,-14 M154,186 q-12,-6 -14,-20 M160,181 q-6,-10 -4,-22 M168,179 q0,-10 6,-20 M176,180 q4,-8 12,-14', 2.2);
    case 8: return L('M152,190 l-9,-6 M156,184 l-6,-9') + L('M154,211 l-5,8 M160,214 l-3,9 M167,216 l-1,9 M174,215 l1,8 M180,211 l2,6', 1.8);
    default: return '';
  }
}

function linerParts(st) {
  const el = st.eyeliner;
  const col = { blue: '#3a7bd5', pink: '#ff4d8d', purple: '#7b4dff', gold: GOLD }[el] || INK;
  const thick = ['thin', 'wing', 'cat', 'double', 'blue', 'pink', 'purple', 'gold', 'heartTip', 'starTip'].includes(el);
  const wing = `<path d="M153,193 L137,182 L156,188Z" fill="${col}"/>`;
  let extra = '';
  if (['wing', 'blue', 'pink', 'purple', 'gold'].includes(el)) extra = wing;
  if (el === 'cat') extra = `<path d="M154,195 L128,176 L157,188Z" fill="${INK}"/>`;
  if (el === 'heartTip') extra = wing + `<path d="${heartPath(134, 174, 9)}" fill="#ff4d8d"/>`;
  if (el === 'starTip') extra = wing + `<path d="${starPath(134, 180, 6, 2.6)}" fill="#ffd23f"/>`;
  if (el === 'double') extra = `<path d="M152,206 Q168,222 184,206" stroke="${INK}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
  if (el === 'glitter') extra = [[154, 183], [160, 178], [168, 176], [176, 177], [182, 182]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.6" fill="#ffd23f"/>`).join('');
  if (el === 'dotted') extra = [[154, 210], [160, 214], [167, 216], [174, 215], [180, 211]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.2" fill="${INK}"/>`).join('');
  const smoky = el === 'smoky' ? `<ellipse cx="166" cy="198" rx="21" ry="21" fill="#3a2a3a" opacity=".22"/><path d="M152,206 Q168,220 184,206" stroke="#3a2a3a" stroke-width="2.5" fill="none"/>` : '';
  return { col, thick, extra, smoky };
}

function drawEye(p, st, right) {
  const shape = st.eyeShape;
  const closed = shape === 'smile' || (shape === 'wink' && right);
  if (closed) {
    return `<g class="eye"><g transform="${CLOSED_EYE}"><path d="M151,202 Q168,184 185,202" stroke="${INK}" stroke-width="4" fill="none" stroke-linecap="round"/>
      <path d="M152,199 l-9,-3 M155,194 l-6,-7" stroke="${INK}" stroke-width="2.5" stroke-linecap="round"/></g></g>`;
  }
  const lv = linerParts(st);
  const lid = 2.4 + (st.lashes >= 2 && st.lashes !== 8 ? 0.5 : 0) + (lv.thick ? 1.2 : 0);
  const sleepy = shape === 'sleepy';
  const lidPath = sleepy ? 'M150,196 Q168,186 186,196' : 'M151,193 Q168,174 185,193';
  const t = EYE_SHAPES[shape] || '';
  return `<g class="eye"><g transform="${t}">
    ${lv.smoky}
    <ellipse cx="168" cy="198" rx="16" ry="18" fill="#fff"/>
    <ellipse cx="168" cy="190" rx="15" ry="7" fill="#e6dcf0" opacity=".5"/>
    ${drawIris(p, st)}
    <path d="M156.5,197 A12.5,12.5 0 0,1 179.5,197" stroke="#1c1018" stroke-opacity=".3" stroke-width="4" fill="none"/>
    ${drawPupil(st.pupil)}
    ${drawHighlight(st.highlight)}
    ${sleepy ? `<path d="M147,197 Q168,187 189,197 L190,175 L146,175Z" fill="${st.skin}"/>` : ''}
    <path d="${lidPath}" stroke="${lv.col}" stroke-width="${lid}" fill="none" stroke-linecap="round"/>
    ${lv.extra}
    <path d="M157,215 Q168,220 179,215" stroke="#ff9ebb" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".75"/>
    <g transform="${sleepy ? 'translate(0 7)' : ''}">${lashPaths(st)}</g>
  </g></g>`;
}

function drawShadow(st) {
  const c = st.eyeshadow;
  if (!c) return '';
  const base = `<ellipse cx="168" cy="188" rx="25" ry="16" fill="${c}" opacity=".55"/>`;
  switch (st.shadowStyle) {
    case 'glitter': return both(base + [[154, 182], [162, 176], [172, 175], [180, 180], [158, 190], [184, 188]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.4" fill="#fff"/>`).join(''));
    case 'stars': return both(base + `<path d="${starPath(150, 178, 4, 1.7)}" fill="#fff"/><path d="${starPath(184, 176, 3, 1.3)}" fill="#ffe680"/><path d="${sparklePath(166, 172, 3)}" fill="#fff"/>`);
    case 'smoky': return both(`<ellipse cx="166" cy="190" rx="29" ry="19" fill="${c}" opacity=".5"/><ellipse cx="150" cy="190" rx="14" ry="11" fill="${shade(c, -35)}" opacity=".5"/>`);
    case 'duo': return both(base + `<ellipse cx="168" cy="178" rx="22" ry="9" fill="${shade(c, 50)}" opacity=".7"/>`);
    case 'double': return both(`<ellipse cx="176" cy="188" rx="15" ry="14" fill="${shade(c, 40)}" opacity=".6"/><ellipse cx="154" cy="189" rx="15" ry="14" fill="${shade(c, -25)}" opacity=".55"/>`);
    case 'halo': return both(base + `<circle cx="168" cy="184" r="8" fill="#fff" opacity=".5"/>`);
    case 'fade': return both(`<ellipse cx="168" cy="180" rx="27" ry="24" fill="${c}" opacity=".28"/>` + base);
    case 'wing': return both(`<path d="M188,196 Q172,166 150,174 Q134,178 128,166 Q136,198 152,202Z" fill="${c}" opacity=".6"/>`);
    case 'rainbow': return both(['#ff9ccf', '#ffe066', '#9fd8ff'].map((col, i) => `<ellipse cx="${156 + i * 12}" cy="188" rx="13" ry="14" fill="${col}" opacity=".5"/>`).join(''));
    default: return both(base);
  }
}

function drawHighlighter(p, st) {
  const cheek = (fill, op) => both(`<ellipse cx="150" cy="216" rx="17" ry="6" fill="${fill}" opacity="${op}" transform="rotate(-18 150 216)"/>`);
  const nose = `<path d="M200,204 L200,224" stroke="#fff" stroke-width="3" opacity=".45" stroke-linecap="round"/>`;
  switch (st.highlighter) {
    case 'glow': return cheek('#fff', 0.35) + `<circle cx="203" cy="229" r="1.8" fill="#fff" opacity=".8"/>`;
    case 'dewy': return cheek('#fff', 0.5) + nose + both(`<circle cx="146" cy="214" r="2.5" fill="#fff" opacity=".9"/>`) + `<ellipse cx="200" cy="132" rx="14" ry="4" fill="#fff" opacity=".3"/>`;
    case 'pearl': return cheek('#fff0f8', 0.6) + nose + both(`<ellipse cx="154" cy="212" rx="6" ry="2" fill="#e6f4ff" opacity=".7" transform="rotate(-18 154 212)"/>`);
    case 'glitter': return cheek('#fff', 0.3) + both([[140, 220], [146, 214], [154, 212], [160, 208], [150, 218], [158, 216]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i % 2 ? 1 : 1.5}" fill="${i % 3 ? '#fff' : '#ffe680'}"/>`).join(''));
    case 'starry': return cheek('#fff', 0.3) + both(`<path d="${sparklePath(146, 214, 4)}" fill="#fff"/><path d="${sparklePath(158, 209, 2.5)}" fill="#fff"/>`);
    case 'holo': return both(`<ellipse cx="150" cy="216" rx="18" ry="6.5" fill="url(#${p}holo)" opacity=".55" transform="rotate(-18 150 216)"/>`) + nose;
    default: return '';
  }
}

function drawBlush(p, st) {
  const c = st.blush;
  if (!c) return both(`<ellipse cx="146" cy="240" rx="19" ry="12" fill="url(#${p}blush)"/>`);
  const g = `<ellipse cx="148" cy="236" rx="22" ry="13" fill="url(#${p}blush)"/>`;
  switch (st.blushStyle) {
    case 'heart': return both(`<path d="${heartPath(148, 224, 24)}" fill="${c}" opacity=".55"/>`);
    case 'lines': return both(g + `<path d="M136,242 l6,-9 M145,244 l6,-9 M154,245 l6,-9" stroke="${shade(c, -20)}" stroke-width="2" stroke-linecap="round"/>`);
    case 'wide': return `<ellipse cx="200" cy="230" rx="72" ry="14" fill="url(#${p}blush)"/><ellipse cx="200" cy="230" rx="40" ry="10" fill="${c}" opacity=".25"/>`;
    case 'star': return both(g + `<path d="${starPath(150, 236, 6, 2.6)}" fill="${shade(c, -10)}"/><path d="${starPath(138, 228, 3.5, 1.5)}" fill="${shade(c, -10)}"/>`);
    case 'dots': return both([[140, 234], [150, 230], [156, 240], [146, 242]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.5" fill="${c}" opacity=".8"/>`).join(''));
    case 'swirl': return both(g + `<path d="M148,236 m-2,0 a2,2 0 1,1 4,0 a5,5 0 1,1 -9,-2 a9,9 0 1,1 16,4" stroke="${shade(c, -15)}" stroke-width="1.8" fill="none" stroke-linecap="round"/>`);
    case 'flower': return both(g + flower(148, 236, 5, shade(c, -5), '#fff'));
    case 'sparkle': return both(g + `<path d="${sparklePath(142, 232, 5)}" fill="#fff"/><path d="${sparklePath(156, 240, 3)}" fill="#fff"/>`);
    default: return both(g);
  }
}

/* small mouth = cuter: every lip style is drawn at 78% size */
function drawMouth(st) {
  return `<g transform="translate(200 258) scale(.78) translate(-200 -256)">${drawMouthInner(st)}</g>`;
}
function drawMouthInner(st) {
  const c = st.lips || '#ef8a9c', dk = shade(c, -15);
  const upper = (col = dk) => `<path d="M183,253 Q192,245 200,250 Q208,245 217,253 Q200,257 183,253Z" fill="${col}"/>`;
  const lower = (col = c) => `<path d="M183,253 Q200,257 217,253 Q210,268 200,268 Q190,268 183,253Z" fill="${col}"/>`;
  switch (st.lipStyle) {
    case 'glossy': return upper() + lower() + `<ellipse cx="205" cy="260" rx="7" ry="3" fill="#fff" opacity=".8"/><ellipse cx="193" cy="249" rx="3" ry="1.5" fill="#fff" opacity=".6"/>`;
    case 'glitter': return upper() + lower() + [[192, 259], [198, 262], [205, 258], [210, 261], [196, 250], [206, 250]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i % 2 ? 0.9 : 1.3}" fill="${i % 3 ? '#fff' : '#ffe680'}"/>`).join('');
    case 'ombre': return upper() + lower() + `<ellipse cx="200" cy="256" rx="9" ry="5" fill="${shade(c, -35)}" opacity=".7"/>`;
    case 'twoTone': return upper(shade(c, -25)) + lower(shade(c, 35)) + `<ellipse cx="205" cy="260" rx="5" ry="2.5" fill="#fff" opacity=".55"/>`;
    case 'heart': return `<path d="${heartPath(200, 246, 22)}" fill="${c}"/><path d="M190,254 Q200,258 210,254" stroke="${shade(c, -30)}" stroke-width="1.5" fill="none"/><ellipse cx="205" cy="258" rx="3" ry="1.5" fill="#fff" opacity=".6"/>`;
    case 'pout': return `<ellipse cx="200" cy="257" rx="8" ry="7" fill="${c}"/><path d="M193,257 Q200,259 207,257" stroke="${shade(c, -30)}" stroke-width="1.5" fill="none"/>`;
    case 'tiny': return `<g transform="translate(200 256) scale(.62) translate(-200 -256)">${upper() + lower()}</g><ellipse cx="202" cy="259" rx="2.5" ry="1.2" fill="#fff" opacity=".6"/>`;
    case 'smile': return `<path d="M182,250 Q200,276 218,250 Q200,256 182,250Z" fill="#a8324a" stroke="${c}" stroke-width="3" stroke-linejoin="round"/><path d="M188,253 Q200,257 212,253 L211,257 Q200,260 189,257Z" fill="#fff"/>`;
    case 'grin': return `<path d="M180,248 Q200,252 220,248 Q218,276 200,278 Q182,276 180,248Z" fill="#a8324a" stroke="${c}" stroke-width="3" stroke-linejoin="round"/><ellipse cx="200" cy="270" rx="9" ry="5" fill="#ff8fa3"/>`;
    case 'ooh': return `<ellipse cx="200" cy="258" rx="7" ry="9" fill="#a8324a" stroke="${c}" stroke-width="3"/>`;
    case 'cat': return `<path d="M186,252 Q193,261 200,253 Q207,261 214,252" stroke="${st.lips ? c : '#c45a76'}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    default:
      return st.lips ? upper() + lower() + `<ellipse cx="206" cy="260" rx="5" ry="2.5" fill="#fff" opacity=".55"/>`
        : `<path d="M187,251 Q200,268 213,251 Q200,256 187,251Z" fill="#e8607e" stroke="#c45a76" stroke-width="2" stroke-linejoin="round"/><ellipse cx="200" cy="259" rx="5" ry="2.6" fill="#ff9eb5"/>`;
  }
}

function drawSticker(st) {
  switch (st.sticker) {
    case 'heart': return `<path d="${heartPath(254, 208, 16)}" fill="#ff4d8d" stroke="#fff" stroke-width="1.5"/>`;
    case 'star': return `<path d="${starPath(254, 216, 10, 4.5)}" fill="#ffd23f" stroke="#fff" stroke-width="1.5"/>`;
    case 'gems': return [[190, 182], [200, 176], [210, 182]].map(([x, y]) => gem(x, y, 4, '#bfe9ff')).join('') + both(gem(140, 216, 4, '#ffc6ec') + gem(134, 206, 3, '#ffc6ec'));
    case 'freckles': return both([[148, 222], [156, 218], [162, 224], [152, 228], [142, 228]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.6" fill="#b5735a" opacity=".7"/>`).join(''));
    case 'flower': return flower(256, 220, 5, '#ff8fc7');
    case 'moon': return `<path d="M260,208 a10,10 0 1,0 0,20 a7.5,7.5 0 1,1 0,-20Z" fill="#ffd23f" stroke="#fff" stroke-width="1"/><circle cx="268" cy="210" r="1.5" fill="#fff"/>`;
    case 'butterfly': return butterfly(256, 220, 0.75, '#b48cff');
    case 'rainbow': return ['#ff6b6b', '#ffd166', '#7ed957', '#6ec3ff'].map((c, i) => `<path d="M${242 + i * 3},228 a${14 - i * 3},${14 - i * 3} 0 0,1 ${28 - i * 6},0" stroke="${c}" stroke-width="3" fill="none"/>`).join('');
    case 'sparkle': return `<path d="${sparklePath(258, 214, 9)}" fill="#fff8b0" stroke="#ffd23f"/><path d="${sparklePath(244, 204, 4)}" fill="#fff8b0"/><path d="${sparklePath(268, 230, 3)}" fill="#fff8b0"/>`;
    case 'crown': return `<path d="M246,222 L244,208 L251,214 L256,204 L261,214 L268,208 L266,222Z" fill="#ffd23f" stroke="${GOLD}"/>`;
    case 'tear': return `<path d="M236,222 Q230,232 236,238 Q242,232 236,222Z" fill="#8fd3ff" stroke="#fff"/>`;
    case 'whiskers': return both(`<path d="M132,232 l20,4 M130,242 l22,0 M132,252 l20,-4" stroke="${INK}" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>`);
    case 'music': return `<path d="M250,226 L250,206 L264,202 L264,222" stroke="#7b4dff" stroke-width="2.5" fill="none"/><ellipse cx="247" cy="227" rx="4" ry="3" fill="#7b4dff"/><ellipse cx="261" cy="223" rx="4" ry="3" fill="#7b4dff"/>`;
    case 'cloud': return `<g fill="#fff" stroke="#bfe9ff"><circle cx="250" cy="220" r="6"/><circle cx="258" cy="215" r="7"/><circle cx="266" cy="221" r="6"/></g>`;
    case 'hearts3': return [[244, 210, 8], [258, 216, 10], [250, 228, 6]].map(([x, y, k]) => `<path d="${heartPath(x, y, k)}" fill="#ff4d8d"/>`).join('');
    case 'clover': return [[0, -4], [4, 0], [0, 4], [-4, 0]].map(([dx, dy]) => `<circle cx="${256 + dx}" cy="${218 + dy}" r="4" fill="#4caf50"/>`).join('') + `<path d="M256,220 q2,8 6,10" stroke="#4caf50" stroke-width="1.5" fill="none"/>`;
    case 'strawberry': return `<path d="M256,212 Q266,214 264,224 Q260,232 256,234 Q252,232 248,224 Q246,214 256,212Z" fill="#ff4d6d"/><path d="M250,212 L256,208 L262,212 L256,214Z" fill="#4caf50"/><circle cx="253" cy="220" r=".9" fill="#fff"/><circle cx="259" cy="222" r=".9" fill="#fff"/>`;
    case 'bow': return `<path d="M256,218 Q244,208 244,218 Q244,228 256,218 Q268,208 268,218 Q268,228 256,218Z" fill="${ACC}" stroke="#fff"/><circle cx="256" cy="218" r="2.5" fill="#e0306f"/>`;
    case 'cherry': return `<path d="M256,206 Q250,214 250,222 M256,206 Q262,214 263,222" stroke="#4caf50" stroke-width="1.5" fill="none"/><circle cx="250" cy="224" r="4.5" fill="#e53950"/><circle cx="263" cy="224" r="4.5" fill="#e53950"/>`;
    case 'diamond': return gem(256, 218, 8, '#bfe9ff');
    case 'kiss': return `<path d="M246,220 Q251,214 256,218 Q261,214 266,220 Q256,224 246,220Z M246,220 Q256,224 266,220 Q261,228 256,228 Q251,228 246,220Z" fill="#ff4d6d" opacity=".75"/>`;
    case 'sun': return `<circle cx="256" cy="218" r="6" fill="#ffd23f"/>` + [0, 45, 90, 135, 180, 225, 270, 315].map(a => `<line x1="256" y1="208" x2="256" y2="205" stroke="#ffb300" stroke-width="2" stroke-linecap="round" transform="rotate(${a} 256 218)"/>`).join('');
    case 'planet': return `<circle cx="256" cy="218" r="7" fill="#c79bff"/><ellipse cx="256" cy="218" rx="12" ry="3.5" fill="none" stroke="#ffd166" stroke-width="2" transform="rotate(-20 256 218)"/>`;
    case 'paw': return `<ellipse cx="256" cy="222" rx="6" ry="5" fill="#ff8fc7"/>` + [[248, 214], [253, 210], [259, 210], [264, 214]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.4" fill="#ff8fc7"/>`).join('');
    default: return '';
  }
}

/* face painting – lower part drawn on the face, `top` part drawn above the bangs */
function drawFacePaint(st, top) {
  const fp = st.facePaint;
  if (top) {
    if (fp === 'foreheadGem') return `<path d="M160,98 Q200,128 240,98" stroke="${GOLD}" stroke-width="1.5" fill="none"/>` + beadsAlong(160, 98, 200, 128, 240, 98, 8, 1.6, () => '#fffaf0') + `<line x1="200" y1="113" x2="200" y2="128" stroke="${GOLD}" stroke-width="1.5"/>` + gem(200, 134, 6, '#ff6fae');
    if (fp === 'moonForehead') return `<path d="M203,120 a10,10 0 1,0 0,20 a7.5,7.5 0 1,1 0,-20Z" fill="#ffe680" stroke="#fff"/><path d="${starPath(214, 124, 3, 1.3)}" fill="#fff"/>`;
    return '';
  }
  switch (fp) {
    case 'fairyDots': return both([[146, 178, 2.2], [140, 186, 1.8], [137, 196, 2.4], [138, 207, 1.6], [143, 216, 2], [132, 190, 1.2], [131, 203, 1.4]].map(([x, y, r], i) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${i % 2 ? '#ffc6ec' : '#fff'}"/>`).join(''));
    case 'starTrail': return [[264, 186, 6], [272, 174, 4.5], [278, 162, 3.5], [282, 150, 2.5]].map(([x, y, r]) => `<path d="${starPath(x, y, r, r * 0.45)}" fill="#ffd23f" stroke="#fff" stroke-width=".8"/>`).join('') + `<circle cx="258" cy="196" r="1.5" fill="#fff"/>`;
    case 'flowerVine': return `<path d="M262,172 Q276,196 262,214 Q252,230 262,248" stroke="#5fbf6f" stroke-width="1.8" fill="none"/>` + [[263, 176], [266, 205], [258, 232]].map(([x, y]) => flower(x, y, 3.2, '#ff9ccf')).join('') + `<ellipse cx="270" cy="190" rx="4" ry="2" fill="#5fbf6f"/><ellipse cx="256" cy="220" rx="4" ry="2" fill="#5fbf6f"/>`;
    case 'butterflyTemple': return butterfly(268, 182, 0.8, '#7fc8ff', '#c79bff') + butterfly(260, 160, 0.45, '#ff9ccf');
    case 'mermaidScales': return both([0, 1, 2].map(r => [0, 1, 2, 3].map(c => `<path d="M${136 + c * 7 + (r % 2) * 3.5},${206 + r * 6} q3.5,5 7,0" stroke="${['#7ee0c5', '#8fd3ff', '#c79bff'][r]}" stroke-width="1.6" fill="none"/>`).join('')).join(''));
    case 'rainbowTrail': return ['#ff9ccf', '#ffd166', '#9ef0a0', '#8fd3ff', '#c79bff'].map((c, i) => `<path d="M${246 - i * 2},${214 + i * 3} Q262,${228 + i * 3} 280,${210 + i * 3}" stroke="${c}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`).join('');
    case 'snowSwirl': return snowflake(266, 178, 6, '#8fd3ff', 1.8) + snowflake(276, 196, 4, '#bfe9ff', 1.5) + `<path d="M256,168 Q282,176 270,206 Q262,220 276,230" stroke="#bfe9ff" stroke-width="1.5" fill="none"/>`;
    case 'heartTrail': return [[146, 214, 7], [140, 224, 5.5], [136, 233, 4.5], [134, 241, 3.5]].map(([x, y, s]) => `<path d="${heartPath(x, y, s)}" fill="#ff6fae"/>`).join('');
    case 'glitterFreckles': return [[185, 222], [192, 218], [208, 218], [215, 222], [150, 222], [158, 218], [242, 218], [250, 222], [200, 214]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i % 2 ? 1.2 : 1.7}" fill="${i % 3 ? '#ffd23f' : '#fff'}"/>`).join('');
    case 'crystalTears': return both(`<path d="M160,220 Q156,228 160,232 Q164,228 160,220Z" fill="#bfe9ff" stroke="#fff"/><path d="M166,230 Q163,236 166,239 Q169,236 166,230Z" fill="#e6c9ff" stroke="#fff"/>`);
    case 'goldSwirl': return `<path d="M258,170 Q284,170 278,190 Q274,202 262,196 Q256,190 264,186 M270,204 Q290,214 276,232 Q268,240 262,232" stroke="${GOLD}" stroke-width="1.8" fill="none" stroke-linecap="round"/><circle cx="276" cy="190" r="1.8" fill="#ffd23f"/><circle cx="266" cy="234" r="1.6" fill="#ffd23f"/>`;
    default: return '';
  }
}

const BROWS = {
  natural: ['M150,160 Q166,149 186,157', 4], arched: ['M150,163 Q164,143 186,156', 4], straight: ['M150,157 Q168,153 186,156', 5],
  thick: ['M150,160 Q166,149 186,157', 7], thin: ['M151,159 Q166,150 185,156', 2], soft: ['M150,154 Q168,151 186,160', 4], angry: ['M150,152 Q168,154 186,162', 5],
  wave: ['M150,160 Q158,150 166,156 Q176,161 186,153', 3.5], short: ['M160,157 Q170,151 182,156', 5],
};
function drawBrows(st) {
  const col = lum(st.hairColor) > 0.93 ? '#a89aa6' : shade(st.hairColor, lum(st.hairColor) > 0.7 ? -45 : -30);
  if (st.brows === 'dots') return both(`<ellipse cx="170" cy="152" rx="7" ry="4.5" fill="${col}"/>`);
  if (st.brows === 'heart') return both(`<path d="${heartPath(170, 144, 12)}" fill="${col}"/>`);
  if (st.brows === 'feather') return both([0, 1, 2].map(i => `<path d="M${152 + i * 2},${161 - i} Q${167},${150 - i * 2} ${185 - i * 2},${157 - i}" stroke="${col}" stroke-width="1.4" fill="none" stroke-linecap="round"/>`).join(''));
  const [d, w] = BROWS[st.brows] || BROWS.natural;
  return both(`<path d="${d}" stroke="${col}" stroke-width="${w}" fill="none" stroke-linecap="round"/>`);
}

function drawFace(p, st) {
  const skin = st.skin, skinDk = shade(skin, -12);
  let s = drawEars(st);
  // round, chubby-cheeked face
  const fp = FACE_PATHS[st.faceShape] || FACE_PATHS.round;
  s += `<path d="${fp}" fill="url(#${p}skin)" stroke="${shade(skin, -24)}" stroke-width="1.6"/><path d="${fp}" fill="url(#${p}faceShade)"/>`;
  s += drawShadow(st) + drawFacePaint(st, false) + drawBrows(st);
  s += drawEye(p, st, false) + mirror(drawEye(p, st.eyeColor2 ? { ...st, eyeColor: st.eyeColor2, _iris: 'iris2' } : st, true));
  s += `<path d="M197.5,234 Q200,236.5 202.5,234" stroke="${shade(skin, -28)}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
  s += drawHighlighter(p, st) + drawBlush(p, st) + drawMouth(st) + drawSticker(st);
  return s;
}
