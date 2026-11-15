/* ---------- backgrounds ---------- */
const skyGrad = (p, ...cols) => `<defs><linearGradient id="${p}sky" x1="0" y1="0" x2="0" y2="1">${gradStops(cols)}</linearGradient></defs><rect width="400" height="600" fill="url(#${p}sky)"/>`;
const cloud = (x, y, s = 1, o = 0.9, c = '#fff') => `<g fill="${c}" opacity="${o}"><ellipse cx="${x}" cy="${y}" rx="${40 * s}" ry="${16 * s}"/><ellipse cx="${x + 22 * s}" cy="${y - 10 * s}" rx="${26 * s}" ry="${16 * s}"/><ellipse cx="${x - 18 * s}" cy="${y - 6 * s}" rx="${18 * s}" ry="${12 * s}"/></g>`;
const tree = (x, y, s, c) => `<rect x="${x - 6 * s}" y="${y}" width="${12 * s}" height="${50 * s}" fill="#8d5a3b"/><circle cx="${x}" cy="${y - 10 * s}" r="${34 * s}" fill="${c}"/><circle cx="${x - 22 * s}" cy="${y + 6 * s}" r="${22 * s}" fill="${c}"/><circle cx="${x + 22 * s}" cy="${y + 6 * s}" r="${22 * s}" fill="${c}"/>`;
const pine = (x, y, k, c, snow) => `<rect x="${x - 5 * k}" y="${y + 70 * k}" width="${10 * k}" height="${30 * k}" fill="#6b4a3a"/><path d="M${x},${y} L${x - 40 * k},${y + 75 * k} L${x + 40 * k},${y + 75 * k}Z" fill="${c}"/>${snow ? `<path d="M${x},${y} L${x - 16 * k},${y + 30 * k} L${x + 16 * k},${y + 30 * k}Z" fill="#fff"/>` : ''}`;
function starsField(rnd, n, maxY = 600, col = '#fff') {
  let s = '';
  for (let i = 0; i < n; i++) {
    const x = rnd() * 400, y = rnd() * maxY, r = 0.8 + rnd() * 2;
    s += i % 5 === 0 ? anim(`<path d="${sparklePath(x, y, r * 3)}" fill="#fff6c9"/>`, 'tw', rnd() * 3)
      : `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r)}" fill="${col}" opacity="${(0.5 + rnd() * 0.5).toFixed(2)}"/>`;
  }
  return s;
}

/* soft pastel haze + bokeh to make every scene dreamy */
function dreamyOverlay(p, bg) {
  const dark = ['night', 'space', 'aurora', 'moonLake', 'crystalCave', 'stage', 'fairyForest'].includes(bg);
  const rnd = seeded(bg.length * 13 + 5);
  let s = `<defs><radialGradient id="${p}haze" cx=".5" cy=".45" r=".75"><stop offset=".55" stop-color="${dark ? '#b48cff' : '#fff'}" stop-opacity="0"/><stop offset="1" stop-color="${dark ? '#b48cff' : '#fff'}" stop-opacity="${dark ? 0.35 : 0.55}"/></radialGradient>
    <radialGradient id="${p}bok"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>`;
  for (let i = 0; i < 9; i++) s += `<circle cx="${f1(rnd() * 400)}" cy="${f1(rnd() * 520)}" r="${f1(10 + rnd() * 26)}" fill="url(#${p}bok)" opacity="${(0.4 + rnd() * 0.5).toFixed(2)}"/>`;
  return s + `<rect width="400" height="600" fill="url(#${p}haze)"/>`;
}

function drawBg(p, bg) {
  const rnd = seeded(7);
  let s = '';
  switch (bg) {
    case 'garden': {
      s = skyGrad(p, '#9fdcff', '#e9fbff') + `<circle cx="340" cy="70" r="38" fill="#fff3a6"/><circle cx="340" cy="70" r="28" fill="#ffe066"/>` + cloud(80, 90) + cloud(250, 140, 0.8)
        + `<ellipse cx="80" cy="470" rx="220" ry="90" fill="#9be59b"/><ellipse cx="350" cy="480" rx="200" ry="80" fill="#7fd98a"/><rect y="480" width="400" height="120" fill="#6fcf7f"/>`;
      const cols = ['#ff8fab', '#ffd166', '#c79bff', '#ff6b6b', '#fff'];
      for (let i = 0; i < 18; i++) s += flower(15 + rnd() * 370, 480 + rnd() * 110, 5 + rnd() * 4, cols[i % cols.length]);
      return s;
    }
    case 'sakura': {
      s = skyGrad(p, '#ffe4f0', '#fff7fb') + `<rect y="500" width="400" height="100" fill="#ffd3e6"/>`
        + `<path d="M0,120 Q80,140 140,100 M60,128 Q90,90 110,70 M400,80 Q320,110 270,90 M330,98 Q310,60 290,50" stroke="#8d5a3b" stroke-width="8" fill="none" stroke-linecap="round"/>`;
      for (let i = 0; i < 40; i++) {
        const x = i < 20 ? rnd() * 160 : 240 + rnd() * 160, y = 40 + rnd() * 120;
        s += flower(x, y, 6 + rnd() * 3, i % 3 ? '#ffc2dd' : '#ffe0ee', '#ff8fb8');
      }
      for (let i = 0; i < 26; i++) s += `<ellipse cx="${f1(rnd() * 400)}" cy="${f1(150 + rnd() * 440)}" rx="5" ry="3" fill="#ffb3d1"/>`;
      return s;
    }
    case 'lavender': {
      s = skyGrad(p, '#d9c2ff', '#ffe0d6') + `<circle cx="200" cy="300" r="60" fill="#fff3d6" opacity=".9"/><path d="M0,330 Q200,300 400,330 L400,600 L0,600Z" fill="#b48cff"/>`;
      for (let row = 0; row < 9; row++) {
        const y = 340 + row * row * 3.4 + row * 6, sp = 14 + row * 5;
        for (let x = -10 + (row % 2) * sp / 2; x < 410; x += sp) s += `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${2 + row * 0.7}" ry="${5 + row * 1.6}" fill="${row % 2 ? '#8e5bd6' : '#9d6bff'}"/>`;
      }
      return s + cloud(80, 120, 0.9) + cloud(320, 90, 0.7);
    }
    case 'teaParty': {
      s = skyGrad(p, '#ffe9f3', '#fff8e1') + `<rect y="470" width="400" height="130" fill="#c9f0b8"/>`;
      // bunting
      s += `<path d="M0,40 Q200,90 400,40" stroke="#d4a5a5" stroke-width="2" fill="none"/>`;
      for (let i = 0; i < 11; i++) { const [x, y] = qpt(0, 40, 200, 90, 400, 40, (i + 0.5) / 11); s += `<path d="M${f1(x - 13)},${f1(y)} L${f1(x + 13)},${f1(y)} L${f1(x)},${f1(y + 24)}Z" fill="${['#ff9ccf', '#bfe6ff', '#fff3b0', '#c8a2ff'][i % 4]}"/>`; }
      // left table
      s += `<ellipse cx="60" cy="470" rx="70" ry="14" fill="#fff"/><path d="M-10,470 L130,470 L120,540 L0,540Z" fill="#fff" opacity=".9"/><path d="M-10,470${scallop(-10, 130, 470, 6, 10)}" fill="#ffc2dd"/>
        <path d="M40,456 Q40,440 60,440 Q80,440 80,456Z" fill="#fff" stroke="#ffb3d1" stroke-width="2"/><path d="M80,446 q10,0 6,8" stroke="#ffb3d1" stroke-width="2" fill="none"/>`;
      // cake stand right
      s += `<line x1="345" y1="400" x2="345" y2="480" stroke="${GOLD}" stroke-width="3"/><ellipse cx="345" cy="480" rx="40" ry="7" fill="#fff" stroke="${GOLD}"/><ellipse cx="345" cy="440" rx="30" ry="6" fill="#fff" stroke="${GOLD}"/>
        <circle cx="330" cy="470" r="9" fill="#ff9ccf"/><circle cx="352" cy="470" r="9" fill="#bfe6ff"/><circle cx="370" cy="472" r="7" fill="#fff3b0"/><circle cx="340" cy="430" r="8" fill="#c8a2ff"/><circle cx="356" cy="430" r="8" fill="#9effe0"/>`;
      return s + cloud(300, 150, 0.8);
    }
    case 'carousel': {
      s = skyGrad(p, '#ffd6ec', '#e9e0ff') + `<rect y="520" width="400" height="80" fill="#f7c6e0"/>`;
      s += `<path d="M30,150 L200,60 L370,150Z" fill="#ff9ccf"/><path d="M30,150${scallop(30, 370, 150, 10, 16)}" fill="#fff"/><path d="M200,60 L200,30" stroke="${GOLD}" stroke-width="4"/>${anim(`<path d="${starPath(200, 26, 10, 4.5)}" fill="#ffd23f"/>`, 'tw')}`;
      for (let i = 0; i < 10; i++) s += anim(`<circle cx="${47 + i * 34}" cy="168" r="4" fill="#fff6a6"/>`, 'tw', i * 0.25);
      [[60, 260], [340, 300]].forEach(([x, y]) => {
        s += `<line x1="${x}" y1="166" x2="${x}" y2="520" stroke="${GOLD}" stroke-width="5"/>
          <g transform="translate(${x} ${y})"><ellipse cx="0" cy="0" rx="34" ry="16" fill="#fff"/><path d="M24,-6 Q40,-30 34,-40 Q46,-36 46,-24 Q44,-10 30,0Z" fill="#fff"/><path d="M34,-40 Q20,-34 22,-14" stroke="#c8a2ff" stroke-width="7" fill="none"/>
          <rect x="-24" y="10" width="7" height="26" fill="#fff"/><rect x="16" y="10" width="7" height="26" fill="#fff"/><path d="M-10,-14 L10,-14 L6,0 L-6,0Z" fill="#ff9ccf"/></g>`;
      });
      return s + `<ellipse cx="200" cy="520" rx="200" ry="20" fill="#ffb3d1"/>`;
    }
    case 'forest': {
      s = skyGrad(p, '#c8f0c0', '#e8ffe0') + `<rect y="500" width="400" height="100" fill="#5fae5f"/>`;
      [[40, 330, 1.3, '#3f9e57'], [130, 300, 1.1, '#4fb36a'], [280, 310, 1.2, '#3f9e57'], [370, 330, 1.3, '#4fb36a'], [200, 280, 0.9, '#6cc47c']].forEach(([x, y, k, c]) => s += tree(x, y, k, c));
      [[60, 545], [330, 560], [250, 580]].forEach(([x, y]) => s += `<rect x="${x - 4}" y="${y}" width="8" height="16" fill="#fff8e7"/><path d="M${x - 16},${y + 2} Q${x},${y - 20} ${x + 16},${y + 2}Z" fill="#ff5c5c"/><circle cx="${x - 5}" cy="${y - 6}" r="2.5" fill="#fff"/><circle cx="${x + 6}" cy="${y - 3}" r="2" fill="#fff"/>`);
      return s;
    }
    case 'fairyForest': {
      s = skyGrad(p, '#1d3b4f', '#3f6d6a', '#6aa58a');
      [[30, 260, 1.5], [120, 230, 1.2], [290, 240, 1.3], [380, 270, 1.6]].forEach(([x, y, k]) => s += tree(x, y, k, '#2a5a52'));
      s += `<rect y="520" width="400" height="80" fill="#2f5a46"/>`;
      [[50, 520, '#7ff0ff'], [90, 540, '#ff9cf0'], [320, 530, '#c79bff'], [360, 548, '#7ff0ff']].forEach(([x, y, c], i) => s += anim(`<circle cx="${x}" cy="${y - 4}" r="22" fill="${c}" opacity=".25"/>`, 'tw', i * 0.5)
        + `<rect x="${x - 3}" y="${y}" width="6" height="14" fill="#e8fff7"/><path d="M${x - 14},${y + 2} Q${x},${y - 18} ${x + 14},${y + 2}Z" fill="${c}"/>`);
      for (let i = 0; i < 22; i++) s += anim(`<circle cx="${f1(rnd() * 400)}" cy="${f1(150 + rnd() * 380)}" r="${f1(1.5 + rnd() * 2)}" fill="#fffbb0"/>`, 'tw', rnd() * 3);
      return s;
    }
    case 'rainbow': {
      s = skyGrad(p, '#8fd3ff', '#e6f7ff');
      ['#ff6b6b', '#ffb347', '#ffe066', '#7ed957', '#6ec3ff', '#9d6bff'].forEach((c, i) => s += `<path d="M${-40 + i * 16},420 A${240 - i * 16},${240 - i * 16} 0 0,1 ${440 - i * 16},420" stroke="${c}" stroke-width="16" fill="none" opacity=".85"/>`);
      return s + cloud(40, 420, 1.6, 1) + cloud(360, 420, 1.6, 1) + cloud(200, 90, 0.9) + `<rect y="520" width="400" height="80" fill="#a8e6a1"/>`;
    }
    case 'clouds': {
      s = skyGrad(p, '#d9c2ff', '#ffe6f5');
      s += `<g fill="#f7d9ff"><rect x="150" y="80" width="100" height="90"/><rect x="138" y="60" width="30" height="110"/><rect x="232" y="60" width="30" height="110"/><path d="M134,62 L153,26 L172,62Z M228,62 L247,26 L266,62Z" fill="#c79bff"/></g>` + cloud(200, 175, 2, 1);
      for (let i = 0; i < 8; i++) s += anim(`<path d="${sparklePath(rnd() * 400, rnd() * 400, 6)}" fill="#fff"/>`, 'tw', i * 0.4);
      return s + cloud(60, 300, 1.2) + cloud(340, 260, 1.1) + `<path d="M0,520 Q60,490 120,520 Q180,490 240,520 Q300,490 360,520 Q390,505 400,520 L400,600 L0,600Z" fill="#fff"/>`;
    }
    case 'sweetDream': {
      s = skyGrad(p, '#ffc8e6', '#d9c2ff', '#bfe6ff');
      s += `<path d="M300,60 a46,46 0 1,0 30,84 a36,36 0 1,1 -30,-84Z" fill="#fff6c9"/><path d="M296,108 q6,4 12,0" stroke="#d4a017" stroke-width="2" fill="none"/>`;
      [[60, 0, 120], [120, 0, 70], [360, 0, 190]].forEach(([x, y, l], i) => s += `<line x1="${x}" y1="${y}" x2="${x}" y2="${l}" stroke="#fff" stroke-width="1.5"/>` + anim(`<path d="${starPath(x, l + 10, 12, 5)}" fill="#fff3a6"/>`, 'tw', i * 0.6));
      s += cloud(70, 230, 1.3) + cloud(330, 280, 1.1) + `<path d="M0,520 Q100,480 200,520 Q300,480 400,520 L400,600 L0,600Z" fill="#fff" opacity=".9"/>`;
      for (let i = 0; i < 12; i++) s += anim(`<circle cx="${f1(rnd() * 400)}" cy="${f1(rnd() * 480)}" r="2" fill="#fff"/>`, 'tw', rnd() * 3);
      return s;
    }
    case 'candy': {
      s = skyGrad(p, '#ffd6ec', '#d6fff3') + `<path d="M0,500 Q100,450 200,500 Q300,550 400,480 L400,600 L0,600Z" fill="#ffb3d1"/><path d="M0,540 Q120,510 240,550 Q330,580 400,540 L400,600 L0,600Z" fill="#b3f0dc"/>`;
      [[50, 330, '#ff6fae'], [350, 300, '#8fd3ff'], [300, 420, '#ffd166']].forEach(([x, y, c]) => s += `<line x1="${x}" y1="${y}" x2="${x}" y2="${y + 200}" stroke="#fff" stroke-width="7"/><circle cx="${x}" cy="${y}" r="34" fill="${c}"/><path d="M${x},${y} m-20,0 a20,20 0 1,1 20,20 a14,14 0 1,1 -14,-14 a8,8 0 1,1 8,8" stroke="#fff" stroke-width="5" fill="none"/>`);
      s += `<path d="M110,600 L110,450 Q110,420 140,420 Q160,420 160,445" stroke="#fff" stroke-width="12" fill="none"/><path d="M110,600 L110,450 Q110,420 140,420 Q160,420 160,445" stroke="#ff4d6d" stroke-width="12" stroke-dasharray="10 10" fill="none"/>`;
      return s + cloud(200, 80, 0.9);
    }
    case 'night':
      return skyGrad(p, '#1b1850', '#6a45a8') + `<circle cx="320" cy="90" r="40" fill="#fff6c9"/><circle cx="338" cy="78" r="36" fill="#2a2366"/>` + starsField(rnd, 50)
        + `<path d="M0,540 Q100,500 200,530 Q300,560 400,520 L400,600 L0,600Z" fill="#2a2366"/>`;
    case 'moonLake':
      return skyGrad(p, '#141a4a', '#4a3c8c', '#7d6bc4') + starsField(rnd, 40, 330) + `<circle cx="200" cy="150" r="56" fill="#fff6d6"/><circle cx="200" cy="150" r="70" fill="#fff6d6" opacity=".2"/>
        <rect y="330" width="400" height="270" fill="#2a2f6e"/><ellipse cx="200" cy="400" rx="40" ry="60" fill="#fff6d6" opacity=".25"/>
        ${[350, 380, 410, 440].map((y, i) => `<line x1="${170 - i * 6}" y1="${y}" x2="${230 + i * 6}" y2="${y}" stroke="#fff6d6" stroke-width="3" opacity=".5"/>`).join('')}
        ${[20, 40, 360, 380].map(x => `<path d="M${x},600 Q${x - 6},520 ${x + 4},450" stroke="#1e2350" stroke-width="5" fill="none"/><ellipse cx="${x + 4}" cy="450" rx="4" ry="14" fill="#5a3e2a"/>`).join('')}`;
    case 'aurora': {
      s = skyGrad(p, '#0e1b3a', '#1f3f5c', '#3b2b6b') + starsField(rnd, 40, 400);
      [['#7cffc4', 140], ['#8fd3ff', 190], ['#e08fff', 240]].forEach(([c, y], i) => s += anim(`<path d="M-20,${y} Q80,${y - 80} 180,${y - 10} Q280,${y + 60} 420,${y - 60} L420,${y + 30} Q280,${y + 110} 180,${y + 40} Q80,${y - 30} -20,${y + 50}Z" fill="${c}" opacity=".35"/>`, 'fl', i));
      return s + `<path d="M0,500 Q100,470 200,500 Q300,470 400,500 L400,600 L0,600Z" fill="#e6f4ff"/>` + pine(50, 380, 1.2, '#2a4a5a', true) + pine(350, 370, 1.3, '#2a4a5a', true);
    }
    case 'space': {
      s = skyGrad(p, '#0b0b2b', '#3b1c6b') + starsField(rnd, 60);
      return s + `<circle cx="70" cy="120" r="40" fill="#ff9ccf"/><ellipse cx="70" cy="120" rx="66" ry="14" fill="none" stroke="#ffd166" stroke-width="5" transform="rotate(-20 70 120)"/>
        <circle cx="340" cy="420" r="30" fill="#7fc8ff"/><path d="M318,410 Q340,400 362,412" stroke="#fff" stroke-width="4" opacity=".5" fill="none"/>
        <circle cx="330" cy="80" r="14" fill="#ffd166"/><circle cx="40" cy="480" r="10" fill="#c79bff"/>`;
    }
    case 'crystalCave': {
      s = skyGrad(p, '#2a1450', '#5a2d8c', '#8a5cc4');
      const cr = (x, y, w, h, c, a = 0) => `<g transform="rotate(${a} ${x} ${y})"><path d="M${x - w},${y} L${x - w * 0.6},${y - h} L${x},${y - h - w} L${x + w * 0.6},${y - h} L${x + w},${y}Z" fill="${c}" opacity=".85"/><path d="M${x},${y - h - w} L${x},${y}" stroke="#fff" stroke-width="1.5" opacity=".5"/></g>`;
      [[30, 600, 22, 120, '#c9a7ff', -10], [70, 600, 16, 80, '#8fd3ff', 8], [340, 600, 24, 140, '#ff9cf0', 6], [380, 600, 14, 70, '#c9a7ff', -8], [120, 600, 12, 50, '#9effe0', 0], [290, 600, 12, 60, '#8fd3ff', 0],
        [20, 0, 18, -90, '#c9a7ff', 180], [380, 0, 16, -70, '#8fd3ff', 180]].forEach(([x, y, w, h, c, a]) => s += cr(x, y, w, h, c, a));
      for (let i = 0; i < 18; i++) s += anim(`<path d="${sparklePath(rnd() * 400, rnd() * 600, 3 + rnd() * 4)}" fill="#fff"/>`, 'tw', rnd() * 3);
      return s;
    }
    case 'sea': {
      s = skyGrad(p, '#7fe0ff', '#1f6fc5') + `<g fill="#fff" opacity=".15"><path d="M40,0 L90,0 L30,400 Z"/><path d="M200,0 L240,0 L180,380Z"/><path d="M330,0 L380,0 L300,420Z"/></g><path d="M0,540 Q100,520 200,545 Q300,565 400,535 L400,600 L0,600Z" fill="#f5deb3"/>`;
      [[30, 600], [60, 600], [350, 600], [375, 600]].forEach(([x, y], i) => s += `<path d="M${x},${y} Q${x - 18},${y - 60} ${x},${y - 110} Q${x + 18},${y - 160} ${x},${y - 200 - i * 10}" stroke="#2fbf71" stroke-width="10" fill="none" stroke-linecap="round"/>`);
      for (let i = 0; i < 14; i++) s += anim(`<circle cx="${f1(rnd() * 400)}" cy="${f1(rnd() * 500)}" r="${f1(3 + rnd() * 8)}" fill="none" stroke="#fff" stroke-width="2" opacity=".7"/>`, 'fl', rnd() * 3);
      return s + `<path d="${starPath(330, 560, 18, 8)}" fill="#ff8a65"/><g transform="translate(70,200)"><ellipse rx="20" ry="12" fill="#ffd166"/><path d="M18,0 L32,-10 L32,10Z" fill="#ffd166"/><circle cx="-9" cy="-3" r="2.5" fill="${INK}"/></g>`;
    }
    case 'lagoon': {
      s = skyGrad(p, '#ffd6ec', '#bfe9ff') + `<rect y="300" width="400" height="300" fill="#6fd6e0"/><rect y="300" width="400" height="300" fill="#3fa6d9" opacity=".4"/>`;
      for (let i = 0; i < 10; i++) { const x = rnd() * 360, y = 320 + rnd() * 200; s += anim(`<line x1="${f1(x)}" y1="${f1(y)}" x2="${f1(x + 20 + rnd() * 30)}" y2="${f1(y)}" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".55"/>`, 'tw', i * 0.3); }
      s += `<path d="M0,330 Q60,250 120,330Z" fill="#a39bb0"/><path d="M300,340 Q360,240 420,340Z" fill="#a39bb0"/><path d="M0,560 Q200,520 400,560 L400,600 L0,600Z" fill="#ffe9c4"/>`;
      s += `<path d="M40,560 Q40,530 70,530 Q100,530 100,560Z" fill="#ffc2dd" stroke="#ff9ebb" stroke-width="2"/><circle cx="70" cy="552" r="9" fill="#fffaf0"/><path d="M330,566 Q330,546 350,546 Q370,546 370,566Z" fill="#ffd6f5" stroke="#ff9ebb"/>`;
      for (let i = 0; i < 12; i++) s += anim(`<path d="${sparklePath(rnd() * 400, 310 + rnd() * 230, 3 + rnd() * 3)}" fill="#fff"/>`, 'tw', rnd() * 3);
      return s + cloud(100, 100) + cloud(300, 150, 0.8);
    }
    case 'beach': {
      s = skyGrad(p, '#ff9a8b', '#ffd5a8') + `<circle cx="200" cy="330" r="70" fill="#fff1a8" opacity=".9"/><rect y="330" width="400" height="140" fill="#5fb3d9"/>
        <g stroke="#fff" stroke-width="3" opacity=".5"><line x1="140" y1="360" x2="260" y2="360"/><line x1="160" y1="390" x2="240" y2="390"/></g>
        <path d="M0,460 Q200,430 400,470 L400,600 L0,600Z" fill="#ffe0a8"/><path d="M350,600 Q340,450 360,330" stroke="#8d5a3b" stroke-width="12" fill="none"/>`;
      [-60, -20, 20, 60, 100].forEach(a => s += `<ellipse cx="360" cy="330" rx="55" ry="12" fill="#3fa66b" transform="rotate(${a + 180} 360 330) translate(-50 0)"/>`);
      return s + `<path d="${starPath(60, 540, 14, 6)}" fill="#ff8a65"/>`;
    }
    case 'snow': {
      s = skyGrad(p, '#bfe3ff', '#f2faff') + `<ellipse cx="80" cy="500" rx="240" ry="90" fill="#fff"/><ellipse cx="360" cy="510" rx="200" ry="80" fill="#eef7ff"/><rect y="520" width="400" height="80" fill="#fff"/>`;
      s += pine(40, 360, 1, '#3f9e8f', true) + pine(360, 340, 1.2, '#3f9e8f', true) + pine(320, 400, 0.8, '#3f9e8f', true);
      for (let i = 0; i < 26; i++) s += snowflake(rnd() * 400, rnd() * 480, 3 + rnd() * 4, '#fff', 2);
      return s;
    }
    case 'iceCastle': {
      s = skyGrad(p, '#a8d8ff', '#e6f4ff', '#ffffff');
      const tower = (x, y, w, h) => `<rect x="${x - w / 2}" y="${y}" width="${w}" height="${600 - y}" fill="#d6f0ff" opacity=".9"/><path d="M${x - w / 2 - 6},${y} L${x},${y - h} L${x + w / 2 + 6},${y}Z" fill="#9fd8ff"/><path d="M${x},${y - h} L${x},${y}" stroke="#fff" stroke-width="2" opacity=".6"/>`;
      s += tower(40, 280, 50, 110) + tower(360, 260, 54, 120) + tower(110, 340, 40, 80) + tower(290, 330, 40, 90) + `<rect x="80" y="400" width="240" height="200" fill="#e6f7ff" opacity=".9"/>`;
      s += `<rect y="540" width="400" height="60" fill="#fff"/>`;
      for (let i = 0; i < 16; i++) s += anim(snowflake(rnd() * 400, rnd() * 520, 3 + rnd() * 4, '#fff', 2), 'fa', rnd() * 3);
      return s;
    }
    case 'autumn': {
      s = skyGrad(p, '#ffd59e', '#fff1dc') + `<rect y="500" width="400" height="100" fill="#d9a066"/>`;
      [[50, 320, 1.2, '#ff8c42'], [350, 310, 1.3, '#e85d3a'], [200, 280, 0.8, '#ffb347']].forEach(([x, y, k, c]) => s += tree(x, y, k, c));
      const cols = ['#ff8c42', '#e85d3a', '#ffd166', '#c2571a'];
      for (let i = 0; i < 22; i++) s += `<ellipse cx="${f1(rnd() * 400)}" cy="${f1(rnd() * 600)}" rx="7" ry="4" fill="${cols[i % 4]}"/>`;
      return s;
    }
    case 'ballroom': {
      s = skyGrad(p, '#fff0c9', '#f7b7d2') + `<g fill="#f9d98a" opacity=".5">${[60, 140, 260, 340].map(x => `<rect x="${x - 12}" y="120" width="24" height="420" rx="6"/>`).join('')}</g>
        <path d="M0,0 L90,0 Q60,200 80,600 L0,600Z" fill="#c2185b"/><path d="M400,0 L310,0 Q340,200 320,600 L400,600Z" fill="#c2185b"/>
        <path d="M0,0 L400,0 L400,30 Q300,60 200,30 Q100,60 0,30Z" fill="#ad1457"/>
        <line x1="200" y1="0" x2="200" y2="50" stroke="${GOLD}" stroke-width="3"/><path d="M150,60 Q200,90 250,60" stroke="${GOLD}" stroke-width="5" fill="none"/>`;
      [150, 175, 200, 225, 250].forEach((x, i) => { const y = 66 + (i === 2 ? 14 : i % 2 ? 10 : 0); s += anim(`<path d="M${x},${y} l-5,10 l5,10 l5,-10Z" fill="#fff" stroke="#9fd8ff"/>`, 'tw', i * 0.3); });
      return s + `<rect y="540" width="400" height="60" fill="#e9a6c4"/>`;
    }
    case 'stage': {
      s = skyGrad(p, '#2a0f2f', '#5a1f4f') + `<path d="M140,0 L260,0 L380,600 L20,600Z" fill="#fff6c9" opacity=".18"/>
        <path d="M0,0 L110,0 Q70,250 100,600 L0,600Z" fill="#9b1b4a"/><path d="M400,0 L290,0 Q330,250 300,600 L400,600Z" fill="#9b1b4a"/>
        <path d="M0,0 L400,0 L400,40 Q350,70 300,40 Q250,70 200,40 Q150,70 100,40 Q50,70 0,40Z" fill="#7a1238"/>
        <rect y="540" width="400" height="60" fill="#6b3a2a"/><rect y="540" width="400" height="6" fill="#ffd166"/>`;
      for (let i = 0; i < 12; i++) s += anim(`<path d="${sparklePath(rnd() * 400, 60 + rnd() * 400, 4 + rnd() * 4)}" fill="#ffe680"/>`, 'tw', rnd() * 3);
      return s;
    }
    case 'bedroom': {
      s = `<rect width="400" height="600" fill="#ffe6f2"/>`;
      for (let x = 0; x < 400; x += 40) s += `<rect x="${x}" y="0" width="20" height="500" fill="#ffd6ea"/>`;
      return s + `<rect x="40" y="70" width="110" height="140" rx="55" fill="#bfe8ff" stroke="#fff" stroke-width="10"/><line x1="95" y1="70" x2="95" y2="210" stroke="#fff" stroke-width="6"/>
        <path d="M30,60 Q60,140 40,220 L60,220 Q90,140 70,60Z M160,60 Q130,140 150,220 L130,220 Q100,140 120,60Z" fill="#ff9ccf"/>
        <rect x="270" y="90" width="90" height="70" rx="6" fill="#fff" stroke="${GOLD}" stroke-width="5"/><path d="${heartPath(315, 105, 34)}" fill="#ff8fc7"/>
        <rect y="500" width="400" height="100" fill="#e8b48a"/><ellipse cx="200" cy="560" rx="170" ry="30" fill="#c79bff" opacity=".6"/>`;
    }
    case 'hearts': {
      s = `<defs><radialGradient id="${p}sky" cx=".5" cy=".4" r=".8"><stop offset="0" stop-color="#fff0f7"/><stop offset="1" stop-color="#ffb3d6"/></radialGradient></defs><rect width="400" height="600" fill="url(#${p}sky)"/>`;
      for (let i = 0; i < 22; i++) { const x = rnd() * 400, y = rnd() * 600, sz = 14 + rnd() * 26; s += `<path d="${heartPath(x, y, sz)}" fill="${i % 2 ? '#ff8fc7' : '#fff'}" opacity="${(0.4 + rnd() * 0.4).toFixed(2)}"/>`; }
      return s;
    }
    default: // castle
      return skyGrad(p, '#ffd3ea', '#e5d4ff') + cloud(80, 90) + cloud(330, 150, 0.8) + `
        <g fill="#f6c1de">
          <rect x="10" y="300" width="70" height="300"/><path d="M0,300 L45,210 L90,300Z" fill="#c79bff"/>
          <rect x="320" y="280" width="70" height="320"/><path d="M310,280 L355,190 L400,280Z" fill="#c79bff"/>
          <rect x="70" y="380" width="260" height="220"/>
          ${[80, 115, 150, 185, 220, 255, 290].map(x => `<rect x="${x}" y="366" width="20" height="20"/>`).join('')}
        </g>
        <g fill="#fff" opacity=".8"><path d="M35,360 a10,10 0 0 1 20,0 v24 h-20z"/><path d="M345,340 a10,10 0 0 1 20,0 v24 h-20z"/></g>
        <line x1="45" y1="210" x2="45" y2="185" stroke="#a072d6" stroke-width="3"/><path d="M45,185 l18,6 l-18,6z" fill="${ACC}"/>
        <line x1="355" y1="190" x2="355" y2="165" stroke="#a072d6" stroke-width="3"/><path d="M355,165 l18,6 l-18,6z" fill="${ACC}"/>
        <rect y="540" width="400" height="60" fill="#b9e8b0"/>`;
  }
}
