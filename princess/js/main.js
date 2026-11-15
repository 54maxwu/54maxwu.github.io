/* =========================================================
 *  小公主化妝間 — Princess Makeover (original artwork, pure JS + SVG)
 * ========================================================= */
let state = { ...DEFAULT };
let dirt = [];
let stepIdx = 0;
let catKey = null;
let soundOn = true;
let musicWanted = true;

function makeDirt() {
  const rnd = Math.random;
  const anchors = [[160, 140], [240, 140], [150, 235], [250, 235], [200, 205], [185, 268], [215, 120], [135, 190], [265, 190], [225, 262], [175, 118], [200, 240]];
  return anchors.map(([x, y]) => ({ x: x + (rnd() - 0.5) * 14, y: y + (rnd() - 0.5) * 14, r: 9 + rnd() * 9, o: 1, rot: rnd() * 180 }));
}
function drawDirt(spots) {
  return `<g id="dirt">${spots.map((d, i) => `<g id="dirt${i}" opacity="${d.o}">
    <ellipse cx="${f1(d.x)}" cy="${f1(d.y)}" rx="${f1(d.r)}" ry="${f1(d.r * 0.75)}" fill="#8b5a2b" opacity=".75" transform="rotate(${d.rot.toFixed(0)} ${f1(d.x)} ${f1(d.y)})"/>
    <circle cx="${f1(d.x + d.r * 0.6)}" cy="${f1(d.y - d.r * 0.4)}" r="${f1(d.r * 0.35)}" fill="#7a4a20" opacity=".7"/></g>`).join('')}</g>`;
}

// ---------------- chibi proportions ----------------
// head is drawn 1.35× around the chin, then the whole figure is shrunk to fit the frame
const HEAD = { cx: 200, cy: 285, s: 1.35 }, BODY = { cx: 200, cy: 600, s: 0.86 };
const tf = (t) => `translate(${t.cx} ${t.cy}) scale(${t.s}) translate(${-t.cx} ${-t.cy})`;
const fwd = (t, [x, y]) => [t.cx + (x - t.cx) * t.s, t.cy + (y - t.cy) * t.s];
const inv = (t, [x, y]) => [t.cx + (x - t.cx) / t.s, t.cy + (y - t.cy) / t.s];
const HEAD_CATS = ['faceShape', 'ears', 'eyeColor2', 'eyeShape', 'eyeColor', 'iris', 'pupil', 'highlight', 'lashes', 'eyeliner', 'brows', 'skin', 'eyeshadow', 'shadowStyle', 'highlighter', 'blush', 'blushStyle', 'lips', 'lipStyle',
  'facePaint', 'sticker', 'bangs', 'hairColor', 'hairStreak', 'hairAcc', 'crown', 'earrings', 'glasses'];
/** local drawing coords → screen (svg) coords */
const toScreen = (pt, head) => fwd(BODY, head ? fwd(HEAD, pt) : pt);
const toHead = (pt) => inv(HEAD, inv(BODY, pt));
function mapView(view, head) {
  const [x, y, w, h] = view.split(' ').map(Number);
  const [a, b] = toScreen([x, y], head), [c, d] = toScreen([x + w, y + h], head);
  return `${f1(a)} ${f1(b)} ${f1(c - a)} ${f1(d - b)}`;
}

// ---------------- material finishing ----------------
/** glossy "angel ring" + strand lines on the hair */
function hairShine(st) {
  if (st.bangs === 'none' && ['pixie'].includes(st.hairStyle)) return '';
  const dk = shade(st.hairColor, -28);
  return `<path d="M138,126 Q200,92 262,126" stroke="#fff" stroke-width="9" fill="none" opacity=".32" stroke-linecap="round"/>
    <path d="M150,118 Q170,108 186,104" stroke="#fff" stroke-width="3" fill="none" opacity=".75" stroke-linecap="round"/>
    <path d="M168,92 Q158,112 150,128 M198,86 Q196,108 194,132 M232,92 Q244,110 252,126" stroke="${dk}" stroke-width="1.3" fill="none" opacity=".45" stroke-linecap="round"/>`;
}
/** swap flat gold / pearl fills for metallic & pearly gradients */
function finishArt(p, svg) {
  return svg.replaceAll('fill="#ffd23f"', `fill="url(#${p}gold)"`).replaceAll('fill="#fffaf0"', `fill="url(#${p}pearl)"`);
}

// ---------------- compose the whole picture ----------------
function build(st, p = 'm', opts = {}) {
  const pv = opts.preview;                       // category key when drawing a thumbnail
  const skin = st.skin;
  const tip = st.hairTip ? pickTone(st.hairTip) : null;
  const hairStops = tip
    ? `<stop offset="0" stop-color="${shade(st.hairColor, 18)}"/><stop offset=".38" stop-color="${st.hairColor}"/>${gradStops(tip, 0.62, 1)}`
    : `<stop offset="0" stop-color="${shade(st.hairColor, 18)}"/><stop offset="1" stop-color="${shade(st.hairColor, -15)}"/>`;
  const tone = st.dressTone ? pickTone(st.dressTone) : null;
  const dressGrad = tone
    ? `<linearGradient id="${p}dress" gradientUnits="userSpaceOnUse" x1="0" y1="320" x2="0" y2="600"><stop offset="0" stop-color="${shade(st.dressColor, 20)}"/><stop offset=".3" stop-color="${st.dressColor}"/>${gradStops(tone, 0.62, 1)}</linearGradient>`
    : `<linearGradient id="${p}dress" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${shade(st.dressColor, 22)}"/><stop offset="1" stop-color="${shade(st.dressColor, -15)}"/></linearGradient>`;
  const ink = lum(st.dressColor) > 0.72 ? shade(st.dressColor === '#ffffff' ? '#ffc2dd' : st.dressColor, -30) : '#ffffff';
  const ec = st.eyeColor;
  const defs = `<defs>
    <linearGradient id="${p}hair" gradientUnits="userSpaceOnUse" x1="0" y1="70" x2="0" y2="480">${hairStops}</linearGradient>
    ${dressGrad}
    <radialGradient id="${p}skin" cx=".5" cy=".4" r=".7"><stop offset="0" stop-color="${shade(skin, 10)}"/><stop offset="1" stop-color="${shade(skin, -5)}"/></radialGradient>
    <radialGradient id="${p}blush"><stop offset="0" stop-color="${st.blush || '#ffa3bf'}" stop-opacity="${st.blush ? 0.85 : 0.6}"/><stop offset="1" stop-color="${st.blush || '#ffa3bf'}" stop-opacity="0"/></radialGradient>
    <linearGradient id="${p}iris" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(ec, -35)}"/><stop offset=".55" stop-color="${ec}"/><stop offset="1" stop-color="${shade(ec, 50)}"/></linearGradient>
    <linearGradient id="${p}iris2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(st.eyeColor2 || ec, -35)}"/><stop offset=".55" stop-color="${st.eyeColor2 || ec}"/><stop offset="1" stop-color="${shade(st.eyeColor2 || ec, 50)}"/></linearGradient>
    <linearGradient id="${p}holo" x1="0" y1="0" x2="1" y2="0">${gradStops(['#ff9ccf', '#ffe680', '#9ef0e0', '#8fd3ff', '#d9a6ff'])}</linearGradient>
    <radialGradient id="${p}bub" cx=".35" cy=".35"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset=".6" stop-color="#e6d6ff" stop-opacity=".3"/><stop offset="1" stop-color="#bfe9ff" stop-opacity=".7"/></radialGradient>
    <radialGradient id="${p}glow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff" stop-opacity=".75"/><stop offset=".6" stop-color="#fff" stop-opacity=".3"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
    <linearGradient id="${p}gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff7c2"/><stop offset=".35" stop-color="#ffd23f"/><stop offset=".62" stop-color="#e3a400"/><stop offset=".82" stop-color="#fff0a0"/><stop offset="1" stop-color="#d49a00"/></linearGradient>
    <radialGradient id="${p}pearl" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#fff6f2"/><stop offset=".85" stop-color="#f0dfea"/><stop offset="1" stop-color="#e2d2ea"/></radialGradient>
    <linearGradient id="${p}vol" gradientUnits="userSpaceOnUse" x1="40" y1="0" x2="360" y2="0"><stop offset="0" stop-color="#2a0a2a" stop-opacity=".26"/><stop offset=".28" stop-color="#2a0a2a" stop-opacity="0"/><stop offset=".68" stop-color="#2a0a2a" stop-opacity="0"/><stop offset="1" stop-color="#2a0a2a" stop-opacity=".3"/></linearGradient>
    <linearGradient id="${p}vol2" gradientUnits="userSpaceOnUse" x1="0" y1="398" x2="0" y2="600"><stop offset="0" stop-color="#2a0a2a" stop-opacity=".16"/><stop offset=".18" stop-color="#2a0a2a" stop-opacity="0"/><stop offset=".85" stop-color="#2a0a2a" stop-opacity="0"/><stop offset="1" stop-color="#2a0a2a" stop-opacity=".14"/></linearGradient>
    <linearGradient id="${p}faceShade" gradientUnits="userSpaceOnUse" x1="0" y1="100" x2="0" y2="292"><stop offset="0" stop-color="${shade(skin, -30)}" stop-opacity=".45"/><stop offset=".3" stop-color="${shade(skin, -30)}" stop-opacity="0"/><stop offset=".78" stop-color="${shade(skin, -30)}" stop-opacity="0"/><stop offset="1" stop-color="${shade(skin, -30)}" stop-opacity=".28"/></linearGradient>
    <radialGradient id="${p}ground"><stop offset="0" stop-color="#3a1a3a" stop-opacity=".28"/><stop offset="1" stop-color="#3a1a3a" stop-opacity="0"/></radialGradient>
    <linearGradient id="${p}light" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff8e6" stop-opacity=".32"/><stop offset=".45" stop-color="#fff8e6" stop-opacity="0"/><stop offset="1" stop-color="#4a2a5a" stop-opacity=".12"/></linearGradient>
    ${st.pattern !== 'none' ? patternDef(`${p}pat`, st.pattern, ink) : ''}
    ${fabricDefs(p, st.fabric)}
  </defs>`;

  const d = dressParts(st);
  const fillD = `url(#${p}dress)`;
  const overlay = (dd) => (st.pattern !== 'none' ? `<path d="${dd}" fill="url(#${p}pat)" opacity="${st.pattern === 'rainbow' ? 0.45 : 0.6}"/>` : '') + fabricOver(p, st.fabric, dd);
  const dLine = shade(st.dressColor === '#ffffff' ? '#e8d6e6' : st.dressColor, -38);
  const vol = (dd, both2) => `<path d="${dd}" fill="url(#${p}vol)"/>` + (both2 ? `<path d="${dd}" fill="url(#${p}vol2)"/>` : '');
  const skirt = d.paths.map(dd => `<path d="${dd}" fill="${fillD}" stroke="${dLine}" stroke-width="1.6" stroke-linejoin="round"/>` + overlay(dd) + vol(dd, true)).join('');
  const bodice = `<path d="${d.bodice}" fill="${fillD}" stroke="${dLine}" stroke-width="1.6" stroke-linejoin="round"/>` + overlay(d.bodice) + vol(d.bodice) + `<path d="M160,${d.waist - 2} Q200,${d.waist + 8} 240,${d.waist - 2}" stroke="${shade(st.dressColor, -20)}" stroke-width="5" fill="none"/>`;
  const arm = `<path d="M150,322 Q130,332 127,380 Q123,430 127,462 Q133,478 146,470 Q150,440 150,410 Q152,372 164,344Z" fill="${skin}" stroke="${shade(skin, -24)}" stroke-width="1.4"/><path d="M146,350 Q136,400 138,452" stroke="${shade(skin, -14)}" stroke-width="4" fill="none" opacity=".45" stroke-linecap="round"/><ellipse cx="136" cy="468" rx="11" ry="12" fill="${skin}" stroke="${shade(skin, -24)}" stroke-width="1.4"/>`;
  const body = `
    <ellipse cx="200" cy="588" rx="120" ry="14" fill="url(#${p}ground)"/>
    ${drawLegs(st)}
    <path d="M184,262 L184,300 L216,300 L216,262Z" fill="${skin}" stroke="${shade(skin, -24)}" stroke-width="1.4"/>
    <path d="M184,284 Q200,296 216,284 L216,292 Q200,302 184,292Z" fill="${shade(skin, -14)}" opacity=".45"/>
    <path d="M150,324 Q158,300 186,296 L214,296 Q242,300 250,324 L250,360 L150,360Z" fill="${skin}"/>`;

  const fullScene = !pv || ['bg', 'aura', 'frame', 'props', 'photoSticker'].includes(pv);
  const bg = fullScene ? drawBg(p, st.bg) + dreamyOverlay(p, st.bg) : `<rect width="400" height="600" fill="#fff4fa"/>`;
  const showAura = !pv || pv === 'aura';
  const showFrame = !pv || pv === 'frame';

  const hLine = shade(st.hairColor, lum(st.hairColor) > 0.85 ? -32 : -42);
  return finishArt(p, defs + bg
    + (showAura ? drawAura(p, st, false) : '')
    + `<ellipse cx="200" cy="320" rx="175" ry="290" fill="url(#${p}glow)"/>`
    + `<g class="princess" transform="${tf(BODY)}">`
    + `<g transform="translate(200 330) scale(1.3) translate(-200 -330)">${drawWings(p, st)}</g>` + drawShawl(st, false) + d.back
    + `<g transform="${tf(HEAD)}">` + drawCrownBack(st) + `<g stroke="${hLine}" stroke-width="1.5" stroke-linejoin="round">${drawHairBack(p, st)}</g></g>` + body
    + d.pre + skirt + d.deco + drawSkirtDeco(st, d.hem) + fabricSparkles(st, d.hem) + bodice + drawBelt(st, d.waist)
    + both(arm) + drawGloves(st) + d.over.replace(/__DRESS__/g, `${p}dress`) + drawShawl(st, true)
    + drawNecklace(st)
    + `<g transform="${tf(HEAD)}">` + drawFace(p, st) + drawGlasses(st) + `<g stroke="${hLine}" stroke-width="1.5" stroke-linejoin="round">${drawHairFront(p, st)}</g>` + hairShine(st) + drawFacePaint(st, true)
    + drawHairAcc(st) + drawEarrings(st) + drawCrown(st) + (opts.dirt ? drawDirt(dirt) : '') + `</g>`
    + drawHeld(p, st) + drawPet(st)
    + `</g>`
    + (!pv || pv === 'props' ? drawProps(st) : '')
    + (showAura ? drawAura(p, st, true) : '')
    + (showFrame ? drawFrame(p, st) : '')
    + `<rect width="400" height="600" fill="url(#${p}light)" pointer-events="none"/>`
    + (!pv || pv === 'photoSticker' ? drawPhotoSticker(st) : ''));
}

// =========================================================
//  UI
// =========================================================
const svg = $('#princess');
const stage = $('#stage');

function render() { svg.innerHTML = build(state, 'm', { dirt: dirt.some(d => d.o > 0) }); }

function renderSteps() {
  $('#steps').innerHTML = STEPS.map((s, i) =>
    `<button data-i="${i}" class="${i === stepIdx ? 'active' : ''}"><span class="ico">${s.icon}</span>${s.name}</button>`).join('');
}
function renderCats() {
  const step = STEPS[stepIdx];
  if (!step.cats) { $('#cats').innerHTML = ''; return; }
  if (!step.cats.includes(catKey)) catKey = step.cats[0];
  $('#cats').innerHTML = step.cats.map(k => `<button data-k="${k}" class="${k === catKey ? 'active' : ''}">${CATS[k].name}<small>${CATS[k].options.length}</small></button>`).join('');
}
function renderOptions() {
  const step = STEPS[stepIdx];
  const box = $('#options');
  if (step.id === 'clean') {
    const left = dirt.filter(d => d.o > 0).length;
    const pct = Math.round((1 - dirt.reduce((a, d) => a + d.o, 0) / dirt.length) * 100);
    box.innerHTML = `<div class="clean-box">
      <div class="big">${left ? '🧽' : '🫧✨'}</div>
      ${left ? '按住滑鼠（或手指）在公主臉上來回擦，<br>把髒髒的泥巴擦掉！' : '臉洗得好乾淨！香噴噴～'}
      <br><progress max="100" value="${pct}"></progress>
      <br>${left ? '<button id="skipClean">跳過 ⏭</button>' : '<button id="nextStep">開始打扮 💄</button>'}
    </div>`;
    return;
  }
  const cat = CATS[catKey];
  let items = cat.options.slice();
  if (cat.none) items = [{ v: null, n: cat.noneLabel || '卸除' }, ...items];
  box.innerHTML = items.map((o, i) => {
    const sel = state[catKey] === o.v ? 'selected' : '';
    let thumb;
    if (cat.type === 'color') {
      thumb = o.v === null ? `<div class="emoji">🚫</div>` : `<div class="swatch" style="background:${o.css || o.v}"></div>`;
    } else {
      const pv = { ...state, [catKey]: o.v };
      if (catKey === 'shoes' || catKey === 'socks') pv.dress = 'party';
      if (cat.needs && !pv[cat.needs[0]]) pv[cat.needs[0]] = cat.needs[1];
      const fullView = ['bg', 'aura', 'frame', 'hairStyle', 'props', 'photoSticker'].includes(catKey);
      const view = fullView ? '0 0 400 600' : mapView(cat.view, HEAD_CATS.includes(catKey));
      thumb = `<svg viewBox="${view}" preserveAspectRatio="xMidYMid slice">${build(pv, `pv${i}_`, { preview: catKey })}</svg>`;
    }
    return `<button class="opt ${sel}" data-i="${i}">${thumb}<span>${o.n}</span></button>`;
  }).join('');
  box._items = items;
}
function setTip(t) { $('#tip').textContent = t; }
function goStep(i) {
  stepIdx = i;
  stage.classList.toggle('cleaning', STEPS[i].id === 'clean');
  setTip(STEPS[i].tip);
  renderSteps(); renderCats(); renderOptions(); render();
  $('#options').scrollTop = 0;
  const btn = $('#steps').children[i]; if (btn) btn.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
}

// ---------------- sound: effects + music box ----------------
let actx = null, master = null, echo = null;
function audio() {
  if (actx) return actx;
  try {
    actx = new (window.AudioContext || window.webkitAudioContext)();
    master = actx.createGain(); master.gain.value = 0.9; master.connect(actx.destination);
    echo = actx.createDelay(); echo.delayTime.value = 0.28;
    const fb = actx.createGain(); fb.gain.value = 0.32;
    const wet = actx.createGain(); wet.gain.value = 0.35;
    echo.connect(fb).connect(echo); echo.connect(wet).connect(master);
  } catch (e) { actx = null; }
  return actx;
}
function note(freq, t, dur, vol, type = 'triangle') {
  const ctx = audio(); if (!ctx) return;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(master); g.connect(echo);
  o.start(t); o.stop(t + dur + 0.05);
}
function tone(freqs, dur = 0.12, type = 'sine', vol = 0.15) {
  if (!soundOn) return;
  const ctx = audio(); if (!ctx) return;
  freqs.forEach((f, i) => note(f, ctx.currentTime + i * dur * 0.8, dur * 1.6, vol, type));
}
const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);
const sfx = {
  pick: () => tone([midi(88), midi(91), midi(96)], 0.07, 'sine', 0.09),
  scrub: () => tone([300 + Math.random() * 200], 0.05, 'sine', 0.04),
  done: () => tone([72, 76, 79, 84, 88].map(midi), 0.11, 'triangle', 0.12),
  shutter: () => tone([1200, 600], 0.06, 'square', 0.06),
};

// original little waltz for the music box
const MELODY = [76, 79, 84, 83, 79, 76, 74, 77, 81, 79, 76, 72, 72, 76, 79, 81, 79, 77, 76, 74, 71, 72, 0, 0,
  79, 84, 88, 86, 84, 81, 77, 81, 84, 83, 79, 76, 74, 77, 81, 79, 76, 74, 72, 76, 74, 72, 0, 0];
const BASS = [48, 55, 53, 52, 48, 53, 55, 48, 52, 57, 53, 55, 48, 53, 55, 48];
const music = { on: false, step: 0, timer: null };
function musicTick() {
  const ctx = audio(); if (!ctx) return;
  const t = ctx.currentTime + 0.05, i = music.step % MELODY.length;
  if (MELODY[i]) note(midi(MELODY[i]), t, 1.4, 0.06, 'triangle'), note(midi(MELODY[i] + 12), t, 0.6, 0.015, 'sine');
  if (i % 3 === 0) note(midi(BASS[(i / 3) % BASS.length]), t, 1.2, 0.035, 'sine');
  music.step++;
}
function setMusic(on) {
  music.on = on;
  clearInterval(music.timer);
  if (on && audio()) { actx.resume && actx.resume(); music.timer = setInterval(musicTick, 340); }
  $('#btnMusic').classList.toggle('off', !on);
}

// ---------------- visual effects ----------------
function sparkle(x, y, n = 8, chars = ['✨', '⭐', '💖', '🌸', '🦋', '💫']) {
  const fx = $('#fx');
  for (let i = 0; i < n; i++) {
    const el = document.createElement('span');
    el.textContent = chars[Math.floor(Math.random() * chars.length)];
    el.style.left = (x / 400 * 100) + '%';
    el.style.top = (y / 600 * 100) + '%';
    el.style.setProperty('--dx', ((Math.random() - 0.5) * 140) + 'px');
    el.style.setProperty('--dy', ((Math.random() - 0.8) * 110) + 'px');
    el.style.animationDelay = (i * 0.04) + 's';
    fx.appendChild(el);
    setTimeout(() => el.remove(), 1300);
  }
  const ring = document.createElement('div');
  ring.className = 'ring';
  ring.style.left = (x / 400 * 100) + '%';
  ring.style.top = (y / 600 * 100) + '%';
  fx.appendChild(ring);
  setTimeout(() => ring.remove(), 800);
  stage.classList.remove('magic'); void stage.offsetWidth; stage.classList.add('magic');
}
function bubble(x, y) {
  const el = document.createElement('div');
  el.className = 'bubble';
  el.style.left = (x / 400 * 100) + '%';
  el.style.top = (y / 600 * 100) + '%';
  el.style.setProperty('--dx', ((Math.random() - 0.5) * 60) + 'px');
  $('#fx').appendChild(el);
  setTimeout(() => el.remove(), 1000);
}
// subtle paper / print grain, generated once
const GRAIN = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 160;
  const g = c.getContext('2d'), img = g.createImageData(160, 160);
  for (let i = 0; i < img.data.length; i += 4) { const v = 110 + Math.random() * 90; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
  g.putImageData(img, 0, 0);
  return c;
})();
$('#grain').style.backgroundImage = `url(${GRAIN.toDataURL()})`;

(function skyParticles() {
  const sky = $('#sky'), chars = ['✦', '✧', '♡', '☆', '❀', '✿', '·', '♪'], cols = ['#ff9ccf', '#c79bff', '#8fd3ff', '#ffd166', '#fff'];
  for (let i = 0; i < 30; i++) {
    const s = document.createElement('span');
    s.textContent = chars[i % chars.length];
    s.style.left = (Math.random() * 100) + '%';
    s.style.fontSize = (10 + Math.random() * 18) + 'px';
    s.style.color = cols[i % cols.length];
    s.style.animationDuration = (10 + Math.random() * 14) + 's';
    s.style.animationDelay = (-Math.random() * 20) + 's';
    sky.appendChild(s);
  }
})();

// ---------------- cleaning interaction ----------------
let scrubbing = false, scrubTick = 0;
function svgPoint(e) {
  const r = svg.getBoundingClientRect();
  return [(e.clientX - r.left) / r.width * 400, (e.clientY - r.top) / r.height * 600];
}
function scrub(e) {
  if (!scrubbing || STEPS[stepIdx].id !== 'clean') return;
  const [x, y] = svgPoint(e);
  const [hx, hy] = toHead([x, y]);              // dirt lives in head coordinates
  let changed = false;
  dirt.forEach((d, i) => {
    if (d.o <= 0) return;
    if (Math.hypot(d.x - hx, d.y - hy) < d.r + 16) {
      d.o = Math.max(0, d.o - 0.07);
      const el = document.getElementById('dirt' + i);
      if (el) el.setAttribute('opacity', d.o.toFixed(2));
      changed = true;
    }
  });
  if (++scrubTick % 3 === 0) bubble(x + (Math.random() - 0.5) * 30, y);
  if (changed && scrubTick % 4 === 0) sfx.scrub();
  if (changed) {
    const bar = $('.clean-box progress');
    if (bar) bar.value = Math.round((1 - dirt.reduce((a, d) => a + d.o, 0) / dirt.length) * 100);
    if (dirt.every(d => d.o <= 0)) {
      scrubbing = false;
      sfx.done(); sparkle(...toScreen([200, 190], true), 14); setTip('哇！好乾淨 ✨');
      render(); renderOptions();
    }
  }
}
stage.addEventListener('pointerdown', (e) => {
  if (STEPS[stepIdx].id !== 'clean') return;
  scrubbing = true;
  stage.setPointerCapture(e.pointerId);
  scrub(e);
});
stage.addEventListener('pointermove', scrub);
['pointerup', 'pointercancel', 'pointerleave'].forEach(t => stage.addEventListener(t, () => scrubbing = false));

// start the music box on the first interaction (browsers block autoplay)
window.addEventListener('pointerdown', () => { if (musicWanted && !music.on) setMusic(true); }, { once: true });

// ---------------- events ----------------
$('#steps').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  sfx.pick(); goStep(+b.dataset.i);
});
$('#cats').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  catKey = b.dataset.k;
  sfx.pick(); renderCats(); renderOptions();
  $('#options').scrollTop = 0;
});
$('#options').addEventListener('click', (e) => {
  if (e.target.id === 'skipClean') { dirt.forEach(d => d.o = 0); sfx.done(); goStep(1); return; }
  if (e.target.id === 'nextStep') { sfx.pick(); goStep(1); return; }
  const b = e.target.closest('.opt'); if (!b) return;
  const item = $('#options')._items[+b.dataset.i];
  const cat = CATS[catKey];
  state[catKey] = item.v;
  if (cat.needs && !state[cat.needs[0]]) state[cat.needs[0]] = cat.needs[1];
  sfx.pick();
  const scroll = $('#options').scrollTop;
  render(); renderOptions();
  $('#options').scrollTop = scroll;
  sparkle(...(['bg', 'aura', 'frame', 'props', 'photoSticker'].includes(catKey) ? cat.focus : toScreen(cat.focus, HEAD_CATS.includes(catKey) || cat.focus[1] < 260)));
});

const OPTIONAL = ['glasses', 'gloves', 'wings', 'held', 'pet', 'sticker', 'hairTip', 'hairStreak', 'hairAcc', 'pattern', 'eyeliner', 'facePaint', 'skirtDeco', 'shawl', 'dressTone', 'eyeColor2', 'belt', 'socks', 'props', 'photoSticker'];
$('#btnRandom').addEventListener('click', () => {
  Object.keys(CATS).forEach(k => {
    const opts = CATS[k].options;
    if (OPTIONAL.includes(k) && Math.random() < 0.55) { state[k] = CATS[k].none ? null : opts[0].v; return; }
    state[k] = opts[Math.floor(Math.random() * opts.length)].v;
  });
  if (Math.random() < 0.7) state.eyeShape = ['big', 'doll', 'round'][Math.floor(Math.random() * 3)];
  dirt.forEach(d => d.o = 0);
  if (STEPS[stepIdx].id === 'clean') goStep(1); else { render(); renderOptions(); }
  sfx.done(); sparkle(200, 300, 18);
});
$('#btnReset').addEventListener('click', () => {
  if (!confirm('要重新開始嗎？')) return;
  state = { ...DEFAULT };
  dirt = makeDirt();
  goStep(0);
});
$('#btnSound').addEventListener('click', (e) => {
  soundOn = !soundOn;
  e.currentTarget.textContent = soundOn ? '🔊' : '🔇';
});
$('#btnMusic').addEventListener('click', (e) => {
  e.stopPropagation();
  musicWanted = !music.on;
  setMusic(musicWanted);
});
$('#btnPhoto').addEventListener('click', () => {
  sfx.shutter();
  stage.animate([{ filter: 'brightness(2.5)' }, { filter: 'brightness(1)' }], { duration: 350 });
  const xml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600" width="800" height="1200">${build(state, 'ph', { dirt: dirt.some(d => d.o > 0) })}</svg>`;
  const img = new Image();
  img.onload = () => {
    const cv = document.createElement('canvas');
    cv.width = 800; cv.height = 1200;
    const ctx = cv.getContext('2d');
    ctx.drawImage(img, 0, 0, 800, 1200);
    ctx.save(); ctx.globalCompositeOperation = 'soft-light'; ctx.globalAlpha = 0.55;
    ctx.fillStyle = ctx.createPattern(GRAIN, 'repeat'); ctx.fillRect(0, 0, 800, 1200); ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    ctx.beginPath(); ctx.roundRect ? ctx.roundRect(210, 1096, 380, 64, 32) : ctx.rect(210, 1096, 380, 64); ctx.fill();
    ctx.fillStyle = '#e0569a';
    ctx.font = 'bold 36px "LXGW WenKai TC", "Microsoft JhengHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('✨ 夢幻小公主 ✨', 400, 1140);
    const url = cv.toDataURL('image/png');
    $('#photoImg').src = url;
    $('#photoDownload').href = url;
    $('#photoModal').classList.remove('hidden');
    sfx.done();
  };
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml);
});
$('#photoClose').addEventListener('click', () => $('#photoModal').classList.add('hidden'));

// blink
setInterval(() => {
  const eyes = svg.querySelectorAll('.eye');
  eyes.forEach(e => e.setAttribute('transform', 'translate(0,198) scale(1,0.1) translate(0,-198)'));
  setTimeout(() => eyes.forEach(e => e.removeAttribute('transform')), 140);
}, 3800);

// ---------------- start ----------------
dirt = makeDirt();
goStep(0);

// ---------------- fullscreen ----------------
(() => {
  const btn = $('#btnFull');
  const root = document.documentElement;
  const canNative = !!(root.requestFullscreen || root.webkitRequestFullscreen);
  const fsEl = () => document.fullscreenElement || document.webkitFullscreenElement;
  const standalone = matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches || navigator.standalone;
  let pseudo = false;

  const sync = () => {
    const on = !!fsEl() || pseudo;
    document.body.classList.toggle('is-fs', on || standalone);
    btn.textContent = on ? '↙ 離開全螢幕' : '⛶ 全螢幕';
  };
  const showTip = (msg) => {
    const tip = $('#tip');
    tip.textContent = msg;
    setTimeout(() => { if (tip.textContent === msg) tip.textContent = ''; }, 3500);
  };

  const toggle = async () => {
    if (fsEl()) {
      (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      return;
    }
    if (pseudo) { pseudo = false; sync(); return; }
    if (canNative) {
      try {
        const req = root.requestFullscreen || root.webkitRequestFullscreen;
        await req.call(root, { navigationUI: 'hide' });
        // 舊版 webkit 前綴不回傳 Promise、失敗也不丟錯：稍等確認真的進入全螢幕
        await new Promise(r => setTimeout(r, 400));
        if (fsEl()) return;
      } catch (_) { /* fall through to pseudo mode */ }
    }
    // iPhone / iPad 上的 Safari、Chrome 等不支援網頁全螢幕：改用沉浸模式，並提示加入主畫面
    pseudo = true; sync();
    window.scrollTo(0, 1);
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const crios = /CriOS/.test(navigator.userAgent);
    showTip(ios
      ? (crios ? '📱 網址列的分享鈕 ⬆ → 加入主畫面，就能全螢幕玩！' : '📱 分享 ⬆ → 加入主畫面，就能全螢幕玩！')
      : '這個瀏覽器不支援全螢幕，已切換成精簡畫面');
  };

  if (standalone) btn.style.display = 'none';
  btn.addEventListener('click', toggle);
  document.addEventListener('fullscreenchange', sync);
  document.addEventListener('webkitfullscreenchange', sync);
  document.addEventListener('keydown', (e) => {
    if (e.target.closest?.('input, textarea')) return;
    if ((e.key === 'f' || e.key === 'F') && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); toggle(); }
    else if (e.key === 'Escape' && pseudo) { pseudo = false; sync(); }
  });
  sync();
})();
