/* ---------- shared helpers ---------- */
const $ = (s) => document.querySelector(s);

function shade(hex, p) {
  const n = parseInt(hex.slice(1), 16);
  let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const t = p < 0 ? 0 : 255, a = Math.abs(p) / 100;
  r = Math.round((t - r) * a) + r;
  g = Math.round((t - g) * a) + g;
  b = Math.round((t - b) * a) + b;
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}
function lum(hex) {
  const n = parseInt(hex.slice(1), 16);
  return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
}
const f1 = (n) => (+n).toFixed(1);

function starPath(cx, cy, R, r, n = 5) {
  cx = +cx; cy = +cy;
  let d = '';
  for (let i = 0; i < n * 2; i++) {
    const a = (Math.PI / n) * i - Math.PI / 2;
    const rad = i % 2 ? r : R;
    d += (i ? 'L' : 'M') + f1(cx + rad * Math.cos(a)) + ',' + f1(cy + rad * Math.sin(a));
  }
  return d + 'Z';
}
function heartPath(x, y, s) {
  x = +x; y = +y; s = +s;
  return `M${x},${y + s * 0.3} C${x},${y} ${x - s * 0.5},${y} ${x - s * 0.5},${y + s * 0.3} C${x - s * 0.5},${y + s * 0.6} ${x},${y + s * 0.8} ${x},${y + s} C${x},${y + s * 0.8} ${x + s * 0.5},${y + s * 0.6} ${x + s * 0.5},${y + s * 0.3} C${x + s * 0.5},${y} ${x},${y} ${x},${y + s * 0.3}Z`;
}
const sparklePath = (x, y, r) => (x = +x, y = +y, `M${x},${y - r} Q${x},${y} ${x + r},${y} Q${x},${y} ${x},${y + r} Q${x},${y} ${x - r},${y} Q${x},${y} ${x},${y - r}Z`);

function flower(cx, cy, r, color, center = '#ffe066') {
  cx = +cx; cy = +cy; r = +r;
  let s = '';
  for (let i = 0; i < 5; i++) {
    const a = (Math.PI * 2 / 5) * i - Math.PI / 2;
    s += `<circle cx="${f1(cx + Math.cos(a) * r)}" cy="${f1(cy + Math.sin(a) * r)}" r="${f1(r * 0.85)}" fill="${color}"/>`;
  }
  return s + `<circle cx="${cx}" cy="${cy}" r="${f1(r * 0.65)}" fill="${center}"/>`;
}
function rose(cx, cy, r, c) {
  cx = +cx; cy = +cy;
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${c}"/><path d="M${cx - r * 0.5},${cy} a${r * 0.5},${r * 0.5} 0 1,1 ${r * 0.6},${r * 0.4} M${cx - r * 0.2},${cy - r * 0.1} a${r * 0.25},${r * 0.25} 0 1,1 ${r * 0.3},${r * 0.2}" stroke="${shade(c, -30)}" stroke-width="1.5" fill="none"/>`;
}
function snowflake(x, y, r, c, w = 1.5) {
  let s = `<g stroke="${c}" stroke-width="${w}" stroke-linecap="round">`;
  for (let i = 0; i < 3; i++) {
    const a = Math.PI / 3 * i, dx = Math.cos(a) * r, dy = Math.sin(a) * r;
    s += `<line x1="${f1(x - dx)}" y1="${f1(y - dy)}" x2="${f1(x + dx)}" y2="${f1(y + dy)}"/>`;
  }
  return s + '</g>';
}
function scallop(xFrom, xTo, y, n, d) {
  const step = (xTo - xFrom) / n;
  let s = '';
  for (let i = 0; i < n; i++) {
    const x0 = xFrom + step * i, x1 = x0 + step;
    s += ` Q${f1((x0 + x1) / 2)},${y + d} ${f1(x1)},${y}`;
  }
  return s;
}
function seeded(seed) {
  return () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
}
function qpt(x0, y0, cx, cy, x1, y1, t) {
  const a = (1 - t) * (1 - t), b = 2 * (1 - t) * t, c = t * t;
  return [a * x0 + b * cx + c * x1, a * y0 + b * cy + c * y1];
}
function beadsAlong(x0, y0, cx, cy, x1, y1, n, r, colFn) {
  let s = '';
  for (let i = 0; i <= n; i++) {
    const [x, y] = qpt(x0, y0, cx, cy, x1, y1, i / n);
    s += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${r}" fill="${colFn(i)}" stroke="rgba(0,0,0,.08)"/>`;
  }
  return s;
}
function gem(x, y, s, c) {
  x = +x; y = +y;
  return `<path d="M${x},${y - s} L${x + s * 0.8},${y} L${x},${y + s} L${x - s * 0.8},${y}Z" fill="${c}" stroke="#fff" stroke-width="1"/><path d="M${x},${y - s} L${x + s * 0.8},${y} L${x - s * 0.8},${y}Z" fill="#fff" opacity=".28"/><path d="M${x - s * 0.35},${y - s * 0.25} L${x},${y - s * 0.6}" stroke="#fff" stroke-width="1" opacity=".8"/>`;
}
function butterfly(x, y, s, c1, c2) {
  return `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0,0 Q-14,-16 -16,-4 Q-16,6 0,2 Q14,-16 16,-4 Q16,6 0,2Z" fill="${c1}" stroke="#fff" stroke-width="1.5"/><path d="M0,2 Q-12,14 -6,16 Q0,14 0,2 Q12,14 6,16 Q0,14 0,2Z" fill="${c2 || shade(c1, 25)}" stroke="#fff" stroke-width="1.5"/><path d="M0,-6 L0,8" stroke="#5a3e7a" stroke-width="1.6" stroke-linecap="round"/></g>`;
}
const mirror = (inner) => `<g transform="translate(400,0) scale(-1,1)">${inner}</g>`;
const both = (inner) => inner + mirror(inner);
/** wrap content in an animated group (classes styled in CSS for the main stage only) */
const anim = (inner, cls = 'tw', d = 0) => `<g class="${cls}" style="animation-delay:${d.toFixed ? d.toFixed(2) : d}s">${inner}</g>`;

const GOLD = '#d4a017', ACC = '#ff7eb6', INK = '#2b1a24';

/* multi-colour "dreamy" gradients used by hair tips / dress tones */
const SPECIAL = {
  rainbow: ['#ff8fab', '#ffd166', '#9ef0a0', '#8fd3ff', '#c79bff'],
  unicorn: ['#ffc2dd', '#d9c2ff', '#bfe9ff', '#c9ffe5'],
  galaxy: ['#3d2b7a', '#7b4dff', '#ff8fc7', '#ffe680'],
  mermaid: ['#7ee0c5', '#6ec3ff', '#b48cff'],
  sunset: ['#ffd166', '#ff9a76', '#ff6fae'],
  cotton: ['#ffc2dd', '#ffffff', '#bfe9ff'],
  aurora: ['#9effe0', '#8fd3ff', '#d9a6ff'],
  peach: ['#ffe0c2', '#ffb3c6', '#ff8fab'],
};
const isSpecial = (v) => typeof v === 'string' && !!SPECIAL[v];
const specialCss = (v) => `linear-gradient(135deg, ${SPECIAL[v].join(', ')})`;
function gradStops(list, from = 0, to = 1) {
  return list.map((c, i) => `<stop offset="${(from + (to - from) * i / Math.max(1, list.length - 1)).toFixed(3)}" stop-color="${c}"/>`).join('');
}
const pickTone = (v) => isSpecial(v) ? SPECIAL[v] : [v];

/** extend a global drawing function with extra options: table[key](orig, ...args) */
function extend(name, keyFn, table) {
  const orig = window[name];
  window[name] = function (...a) { const f = table[keyFn(...a)]; return f ? f(orig, ...a) : orig(...a); };
}
