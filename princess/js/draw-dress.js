/* ---------- dresses ---------- */
const WAIST = 'M156,400 Q200,412 244,400';
const BODICE = 'M152,322 Q176,312 200,326 Q224,312 248,322 L242,405 Q200,414 158,405Z';

function dressParts(st) {
  const c = st.dressColor, lt = shade(c, 35), dk = shade(c, -20), dk2 = shade(c, -35);
  const r = { back: '', pre: '', paths: [], deco: '', over: '', bodice: BODICE, hem: { y: 590, x1: 40, x2: 360 }, waist: 404 };
  const H = (y, x1, x2) => (r.hem = { y, x1, x2 });
  switch (st.dress) {
    case 'mermaid':
      r.paths.push(`${WAIST} Q258,470 232,526 Q282,560 314,600 L86,600 Q118,560 168,526 Q142,470 156,400Z`); H(596, 90, 310);
      r.deco = `<path d="M168,526 Q200,540 232,526" stroke="${lt}" stroke-width="4" fill="none"/>` + [120, 160, 200, 240, 280].map(x => `<path d="M200,535 L${x},600" stroke="${lt}" stroke-width="2" opacity=".6"/>`).join('');
      for (let i = 0; i < 12; i++) r.deco += `<path d="M${172 + (i % 4) * 18 + (Math.floor(i / 4) % 2) * 9},${430 + Math.floor(i / 4) * 30} q9,10 18,0" stroke="${lt}" stroke-width="2" fill="none" opacity=".7"/>`;
      r.over = both(`<path d="M160,320 L186,296" stroke="${dk}" stroke-width="5" stroke-linecap="round"/>`);
      break;
    case 'star': {
      r.paths.push(`${WAIST} L334,600 L66,600Z`); H(596, 68, 332);
      const rn = seeded(3);
      for (let i = 0; i < 16; i++) { const y = 420 + rn() * 170, half = 44 + (y - 400) * 0.45, x = 200 + (rn() - 0.5) * 2 * half; r.deco += anim(`<path d="${starPath(x, y, 5 + rn() * 5, 2.4)}" fill="${i % 3 ? '#fff' : '#ffe066'}" opacity=".9"/>`, 'tw', rn() * 3); }
      r.over = both(`<path d="M158,320 L172,298" stroke="${dk}" stroke-width="3" stroke-linecap="round"/>`) + `<path d="${starPath(200, 404, 9, 4)}" fill="#ffe066"/>`;
      break;
    }
    case 'flower':
      r.paths.push(`${WAIST} Q318,462 338,560${scallop(338, 62, 560, 8, 18)} Q82,462 156,400Z`); H(560, 62, 338);
      for (let i = 0; i <= 8; i++) r.deco += flower(62 + i * 34.5, 562, 8, i % 2 ? '#fff' : lt);
      [[180, 450], [228, 470], [140, 510], [262, 520], [200, 500]].forEach(([x, y], i) => r.deco += flower(x, y, 6, i % 2 ? lt : '#fff'));
      r.over = flower(160, 324, 9, '#fff') + flower(240, 324, 9, '#fff');
      break;
    case 'petal': {
      const petal = (x0, x1, yt, w) => `M${x0},402 Q${(x0 + x1) / 2 - w},${(402 + yt) / 2} ${x1},${yt} Q${(x0 + x1) / 2 + w},${(402 + yt) / 2} ${x0},402Z`;
      r.pre = [[160, 60, 560], [180, 120, 600], [220, 280, 600], [240, 340, 560]].map(([a, b, y]) => `<path d="${petal(a, b, y, 34)}" fill="${lt}"/>`).join('');
      [[166, 90, 590, 30], [184, 150, 600, 30], [200, 200, 600, 30], [216, 250, 600, 30], [234, 310, 590, 30]].forEach(([a, b, y, w]) => r.paths.push(petal(a, b, y, w)));
      H(585, 90, 310);
      r.over = `<path d="M160,322 Q200,340 240,322" stroke="${lt}" stroke-width="4" fill="none"/>`;
      break;
    }
    case 'fairy': {
      let d = `${WAIST} Q300,460 330,560`;
      const pts = 9;
      for (let i = 0; i < pts; i++) { const x0 = 330 - (260 / pts) * i, x1 = 330 - (260 / pts) * (i + 1); d += ` L${f1((x0 + x1) / 2)},${600 - (i % 2) * 14} L${f1(x1)},560`; }
      r.paths.push(d + ' Q100,460 156,400Z'); H(565, 70, 330);
      r.deco = [90, 140, 200, 260, 310].map(x => `<path d="M200,412 Q${(200 + x) / 2},500 ${x},585" stroke="${dk}" stroke-width="1.5" fill="none" opacity=".5"/>`).join('');
      r.over = both(`<ellipse cx="160" cy="406" rx="12" ry="5" fill="#7ed957" transform="rotate(-20 160 406)"/><ellipse cx="176" cy="410" rx="10" ry="4" fill="#5fbf6f" transform="rotate(10 176 410)"/>`) + flower(200, 406, 6, '#fff');
      break;
    }
    case 'swan': {
      r.paths.push(`${WAIST} Q300,470 330,550 L70,550 Q100,470 156,400Z`); H(565, 50, 350);
      let f = '';
      for (let row = 0; row < 3; row++) for (let i = 0; i < 11; i++) {
        const a = -70 + i * 14, len = 70 + row * 45, cy = 410 + row * 40;
        const x = 200 + Math.sin(a * Math.PI / 180) * len, y = cy + Math.cos(a * Math.PI / 180) * len * 0.55 + 40;
        f += `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="9" ry="${26 - row * 3}" fill="${row === 2 ? '#fff' : lt}" opacity=".95" transform="rotate(${f1(-a)} ${f1(x)} ${f1(y)})"/>`;
      }
      r.deco = f;
      r.over = both(`<path d="M150,322 Q130,312 120,328 Q136,330 150,336Z" fill="#fff"/>`);
      break;
    }
    case 'tutu':
      r.pre = `<path d="${WAIST} Q310,430 334,478${scallop(334, 66, 478, 10, 14)} Q90,430 156,400Z" fill="${lt}" opacity=".85"/>`;
      r.paths.push(`${WAIST} Q296,424 314,462${scallop(314, 86, 462, 9, 12)} Q104,424 156,400Z`); H(470, 70, 330);
      r.over = `<path d="M180,400 L200,390 L220,400 L200,410Z" fill="${dk}"/>` + both(`<path d="M160,320 Q164,302 180,298" stroke="${dk}" stroke-width="5" fill="none" stroke-linecap="round"/>`);
      break;
    case 'offshoulder':
      r.paths.push(`${WAIST} Q304,480 344,600 L56,600 Q96,480 156,400Z`); H(596, 58, 342);
      r.deco = `<path d="M200,412 Q190,500 150,600 M200,412 Q214,500 256,600" stroke="${lt}" stroke-width="3" fill="none" opacity=".6"/>`;
      r.over = `<path d="M126,334 Q200,354 274,334 L274,356 Q200,374 126,356Z" fill="${lt}"/><path d="M126,345 Q200,364 274,345" stroke="${c}" stroke-width="2" fill="none" opacity=".6"/>`;
      break;
    case 'cake':
      r.paths.push(`M140,500 L260,500 Q320,540 344,598${scallop(344, 56, 598, 10, 8)} Q80,540 140,500Z`);
      r.paths.push(`M150,440 Q200,452 250,440 Q300,480 318,530${scallop(318, 82, 530, 9, 12)} Q100,480 150,440Z`);
      r.paths.push(`${WAIST} Q280,430 292,470${scallop(292, 108, 470, 8, 12)} Q120,430 156,400Z`); H(594, 58, 342);
      r.deco = [[108, 292, 470, 8], [82, 318, 530, 9]].map(([a, b, y, n]) => `<path d="M${a},${y + 2}${scallop(a, b, y + 2, n, 12)}" stroke="#fff" stroke-width="3" fill="none" stroke-dasharray="1 7" stroke-linecap="round"/>`).join('');
      r.over = both(`<circle cx="152" cy="326" r="16" fill="${lt}"/>`) + flower(200, 404, 7, '#fff');
      break;
    case 'macaron': {
      const cols = [c, '#ffffff', lt, c];
      const tiers = [[600, 160, 10], [548, 132, 9], [496, 104, 8], [452, 78, 7]];
      tiers.forEach(([y, half, n], i) => {
        r.pre += `<path d="M${200 - half * 0.55},${y - 70} L${200 + half * 0.55},${y - 70} Q${200 + half * 0.9},${y - 40} ${200 + half},${y - 6}${scallop(200 + half, 200 - half, y - 6, n, 12)} Q${200 - half * 0.9},${y - 40} ${200 - half * 0.55},${y - 70}Z" fill="${cols[i]}" stroke="${dk}" stroke-width="1" stroke-opacity=".25"/>`
          + `<path d="M${200 - half + 6},${y - 2}${scallop(200 - half + 6, 200 + half - 6, y - 2, n, 6)}" stroke="#fff" stroke-width="2" fill="none" stroke-dasharray="2 6" stroke-linecap="round"/>`;
      });
      r.pre += `<path d="${WAIST} L250,440 L150,440Z" fill="${c}"/>`; H(590, 44, 356);
      r.over = `<path d="M200,404 L184,394 L184,414Z M200,404 L216,394 L216,414Z" fill="${dk}"/>` + both(`<circle cx="152" cy="326" r="15" fill="#fff"/>`);
      break;
    }
    case 'cloud': {
      r.paths.push(`${WAIST} Q310,470 336,556 L64,556 Q90,470 156,400Z`); H(570, 50, 350);
      let d = '';
      for (let i = 0; i < 9; i++) d += `<circle cx="${64 + i * 34}" cy="${560 + (i % 2) * 10}" r="${26 + (i % 3) * 3}" fill="${i % 2 ? lt : '#fff'}"/>`;
      for (let i = 0; i < 6; i++) d += `<circle cx="${110 + i * 36}" cy="${490 + (i % 2) * 8}" r="${18 + (i % 2) * 4}" fill="${lt}" opacity=".85"/>`;
      r.deco = d + `<path d="M150,470 Q160,460 172,470" stroke="#fff" stroke-width="3" fill="none"/>`;
      r.over = both(`<circle cx="148" cy="324" r="14" fill="#fff"/><circle cx="160" cy="316" r="10" fill="#fff"/>`);
      break;
    }
    case 'jellyfish':
      r.paths.push(`${WAIST} Q334,420 322,486${scallop(322, 78, 486, 8, 10)} Q66,420 156,400Z`); H(488, 80, 320);
      r.pre = [100, 130, 160, 190, 220, 250, 280, 305].map((x, i) => anim(`<path d="M${x},480 Q${x + (i % 2 ? 14 : -14)},520 ${x},560 Q${x + (i % 2 ? -12 : 12)},590 ${x + 4},610" stroke="${i % 2 ? lt : '#fff'}" stroke-width="${i % 3 ? 5 : 8}" fill="none" stroke-linecap="round" opacity=".8"/>`, 'sway', i * 0.3)).join('');
      r.deco = [[130, 450], [180, 438], [230, 448], [270, 458], [200, 466]].map(([x, y], i) => anim(`<circle cx="${x}" cy="${y}" r="3" fill="#fff"/>`, 'tw', i * 0.4)).join('');
      r.over = both(`<path d="M160,320 L176,298" stroke="${dk}" stroke-width="4" stroke-linecap="round"/>`);
      break;
    case 'starlight': {
      r.paths.push(`${WAIST} Q300,470 350,575 Q378,596 396,600 L4,600 Q22,596 50,575 Q100,470 156,400Z`); H(596, 20, 380);
      r.deco = `<path d="${WAIST} Q300,470 350,575 Q378,596 396,600 L4,600 Q22,596 50,575 Q100,470 156,400Z" fill="#fff" opacity=".18"/>`;
      const rn = seeded(19);
      for (let i = 0; i < 26; i++) { const y = 420 + rn() * 175, half = 44 + (y - 400) * 0.85, x = 200 + (rn() - 0.5) * 2 * half; r.deco += anim(`<path d="${sparklePath(x, y, 2 + rn() * 5)}" fill="${i % 4 ? '#fff' : '#ffe680'}"/>`, 'tw', rn() * 3); }
      r.over = both(`<path d="M154,322 Q160,304 178,298" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/>`) + `<path d="${starPath(200, 404, 8, 3.5)}" fill="#fff"/>`;
      break;
    }
    case 'empire':
      r.bodice = 'M152,322 Q176,312 200,326 Q224,312 248,322 L246,362 Q200,370 154,362Z'; r.waist = 362;
      r.paths.push('M154,360 Q200,370 246,360 Q300,470 326,600 L74,600 Q100,470 154,360Z'); H(596, 76, 324);
      r.deco = [120, 160, 200, 240, 280].map(x => `<path d="M200,370 Q${(200 + x) / 2},480 ${x},600" stroke="${lt}" stroke-width="2.5" fill="none" opacity=".55"/>`).join('');
      r.over = `<path d="M154,360 Q200,372 246,360" stroke="${dk2}" stroke-width="7" fill="none"/>` + flower(200, 366, 6, '#fff') + both(`<path d="M154,320 Q160,304 176,298" stroke="${dk}" stroke-width="3" fill="none" stroke-linecap="round"/>`);
      break;
    case 'court':
      r.paths.push(`${WAIST} Q330,470 362,590${scallop(362, 38, 590, 10, 12)} Q70,470 156,400Z`);
      r.deco = `<path d="M200,410 L150,590 L250,590Z" fill="${lt}" opacity=".7"/><path d="M200,410 L150,590 M200,410 L250,590" stroke="${GOLD}" stroke-width="3"/>`;
      for (let y = 440; y < 590; y += 30) r.deco += `<circle cx="200" cy="${y}" r="4" fill="${GOLD}"/>`;
      r.over = both(`<path d="M150,318 Q124,326 121,380 Q117,430 123,458 L152,458 Q150,420 152,390 Q156,360 168,340Z" fill="url(#__DRESS__)"/>
        <circle cx="148" cy="326" r="22" fill="${lt}"/><path d="M121,458 L152,458${scallop(152, 121, 458, 4, 8)}Z" fill="#fff"/>`);
      break;
    case 'lantern':
      r.paths.push(`${WAIST} Q290,440 306,500${scallop(306, 94, 500, 8, 10)} Q110,440 156,400Z`); H(500, 96, 304);
      r.over = both(`<path d="M150,318 Q118,322 116,370 Q112,410 124,430 Q140,436 152,428 Q158,400 156,370 Q158,344 168,336Z" fill="${lt}"/><path d="M122,370 Q136,376 152,370 M120,400 Q136,406 154,400" stroke="${c}" stroke-width="1.5" fill="none" opacity=".6"/><rect x="122" y="428" width="30" height="6" rx="3" fill="${dk}"/>`)
        + `<rect x="156" y="396" width="88" height="10" rx="5" fill="${dk2}"/>`;
      break;
    case 'cape':
      r.back = `<path d="M150,316 L250,316 Q332,450 352,600 L48,600 Q68,450 150,316Z" fill="${dk2}"/><path d="M150,316 L250,316 Q320,450 336,600 L64,600 Q80,450 150,316Z" fill="${shade(c, -10)}" opacity=".5"/>`;
      r.paths.push(`${WAIST} Q290,480 310,600 L90,600 Q110,480 156,400Z`); H(596, 92, 308);
      r.over = `<path d="M150,318 Q200,300 250,318" stroke="${GOLD}" stroke-width="5" fill="none"/>` + both(`<circle cx="152" cy="318" r="8" fill="${GOLD}"/><circle cx="152" cy="318" r="4" fill="#ff4d8d"/>`);
      break;
    case 'snow':
      r.paths.push(`${WAIST} Q280,480 320,600 L80,600 Q120,480 156,400Z`); H(596, 82, 318);
      [[180, 460, 8], [230, 500, 10], [150, 560, 9], [260, 570, 8], [200, 540, 6], [210, 440, 6]].forEach(([x, y, k], i) => r.deco += anim(snowflake(x, y, k, '#fff', 2), 'tw', i * 0.4));
      r.over = `<path d="M150,318 Q118,460 64,600 L336,600 Q282,460 250,318 Q200,300 150,318Z" fill="#e8f6ff" opacity=".35" stroke="#fff" stroke-width="2"/>` + snowflake(200, 330, 10, '#bfe9ff', 3);
      break;
    case 'rainbow': {
      ['#c79bff', '#8fd3ff', '#9ef0a0', '#ffe680', '#ffc08a', '#ff9cb5'].forEach((col, i) => {
        const y = 600 - i * 32, half = 160 - i * 18;
        r.pre += `<path d="M${200 - half * 0.45},${y - 60} L${200 + half * 0.45},${y - 60} Q${200 + half * 0.9},${y - 30} ${200 + half},${y}${scallop(200 + half, 200 - half, y, 6, 10)} Q${200 - half * 0.9},${y - 30} ${200 - half * 0.45},${y - 60}Z" fill="${col}"/>`;
      });
      r.pre += `<path d="${WAIST} Q240,430 250,440 L150,440 Q160,430 156,400Z" fill="#ff9cb5"/>`; H(596, 42, 358);
      r.over = `<path d="${starPath(200, 404, 9, 4)}" fill="#fff"/>`;
      break;
    }
    case 'ribbon':
      r.paths.push(`${WAIST} Q300,480 334,600 L66,600 Q100,480 156,400Z`); H(596, 68, 332);
      r.over = `<path d="M200,404 L196,410 Q180,500 168,560 L182,552 L190,568 Q200,480 204,410Z M200,404 L204,410 Q226,500 238,556 L224,550 L216,566 Q206,480 196,410Z" fill="${dk2}"/>
        <path d="M200,404 Q160,370 150,396 Q146,424 200,408Z M200,404 Q240,370 250,396 Q254,424 200,408Z" fill="${dk}" stroke="${dk2}" stroke-width="2"/><circle cx="200" cy="405" r="8" fill="${dk2}"/>`
        + both(`<path d="M160,320 L176,298" stroke="${dk}" stroke-width="4" stroke-linecap="round"/>`);
      break;
    case 'bowTier':
      r.paths.push(`${WAIST} Q310,480 344,600 L56,600 Q90,480 156,400Z`); H(596, 58, 342);
      [[470, 108, 292], [540, 80, 320]].forEach(([y, a, b]) => {
        r.deco += `<path d="M${a},${y}${scallop(a, b, y, 7, 12)}" stroke="${lt}" stroke-width="6" fill="none"/>`;
        for (let i = 0; i < 4; i++) { const x = a + (b - a) * (i + 0.5) / 4; r.deco += `<path d="M${x},${y + 8} Q${x - 12},${y} ${x - 12},${y + 10} Q${x - 12},${y + 20} ${x},${y + 8} Q${x + 12},${y} ${x + 12},${y + 10} Q${x + 12},${y + 20} ${x},${y + 8}Z" fill="${dk}"/>`; }
      });
      r.over = `<path d="M200,404 Q176,388 172,404 Q176,420 200,404 Q224,388 228,404 Q224,420 200,404Z" fill="${dk2}"/>` + both(`<path d="M160,320 L172,298" stroke="${dk}" stroke-width="4" stroke-linecap="round"/>`);
      break;
    case 'heart':
      r.bodice = 'M152,322 Q172,300 200,332 Q228,300 248,322 L242,405 Q200,414 158,405Z';
      r.paths.push(`${WAIST} Q320,470 350,590${scallop(350, 50, 590, 9, 12)} Q80,470 156,400Z`); H(570, 54, 346);
      for (let i = 0; i < 9; i++) r.deco += `<path d="${heartPath(66 + i * 33.5, 560, 16)}" fill="${i % 2 ? '#fff' : lt}"/>`;
      r.over = `<path d="${heartPath(200, 350, 30)}" fill="${lt}" stroke="#fff" stroke-width="2"/>` + both(`<path d="M160,320 L170,298" stroke="${dk}" stroke-width="4" stroke-linecap="round"/>`);
      break;
    case 'party':
      r.paths.push(`${WAIST} Q286,430 300,470${scallop(300, 100, 470, 8, 8)} Q114,430 156,400Z`); H(470, 102, 298);
      r.over = `<rect x="156" y="396" width="88" height="12" rx="5" fill="${dk2}"/><path d="M226,402 Q214,388 212,402 Q214,416 226,402Z M226,402 Q238,388 240,402 Q238,416 226,402Z" fill="${dk2}"/>` + both(`<ellipse cx="152" cy="324" rx="18" ry="11" fill="${lt}"/>`);
      break;
    case 'bubble':
      r.paths.push(`${WAIST} Q314,420 302,462 Q290,490 200,488 Q110,490 98,462 Q86,420 156,400Z`); H(482, 104, 296);
      r.deco = [150, 175, 200, 225, 250].map(x => `<path d="M${x},410 Q${200 + (x - 200) * 1.6},450 ${200 + (x - 200) * 1.5},486" stroke="${dk}" stroke-width="2" fill="none" opacity=".5"/>`).join('') + `<path d="M104,470 Q200,500 296,470" stroke="${lt}" stroke-width="6" fill="none"/>`;
      r.over = both(`<circle cx="152" cy="326" r="18" fill="${lt}"/>`) + `<path d="M200,404 L184,394 L184,414Z M200,404 L216,394 L216,414Z" fill="${dk}"/>`;
      break;
    case 'butterfly':
      r.paths.push(`${WAIST} Q300,470 330,590 Q270,566 200,506 Q130,566 70,590 Q100,470 156,400Z`); H(570, 80, 320);
      r.deco = `<path d="M70,590 Q130,566 200,506 Q270,566 330,590" stroke="${lt}" stroke-width="4" fill="none"/>`;
      r.over = both(`<path d="M152,316 Q110,326 100,372 Q130,362 166,344Z" fill="${lt}" opacity=".75" stroke="#fff" stroke-width="2"/>`);
      break;
    case 'pearlGown':
      r.paths.push(`${WAIST} Q330,470 362,590${scallop(362, 38, 590, 10, 14)} Q70,470 156,400Z`);
      for (let k = 0; k < 2; k++) for (let i = 0; i < 4; i++) { const y = 470 + k * 60, a = 120 - k * 30 + i * (160 + k * 60) / 4, b = a + (160 + k * 60) / 4; r.deco += beadsAlong(a, y, (a + b) / 2, y + 26, b, y, 8, 3, () => '#fffaf0'); }
      r.over = both(`<path d="M152,322 Q140,330 132,346" stroke="#fffaf0" stroke-width="5" stroke-dasharray="0.1 6" stroke-linecap="round"/>`) + beadsAlong(156, 404, 200, 416, 244, 404, 12, 3, () => '#fffaf0');
      break;
    default: // ball
      r.paths.push(`${WAIST} Q330,470 362,590${scallop(362, 38, 590, 10, 14)} Q70,470 156,400Z`);
      r.deco = `<path d="M160,404 Q200,414 240,404 Q296,450 306,520${scallop(306, 94, 520, 7, 14)} Q104,450 160,404Z" fill="${lt}" opacity=".55"/><path d="M38,578${scallop(38, 362, 578, 10, 10)}" stroke="#fff" stroke-width="3" fill="none" opacity=".7"/>`;
      r.over = both(`<circle cx="150" cy="328" r="21" fill="${lt}"/><path d="M134,330 Q150,340 166,330" stroke="${c}" stroke-width="2" fill="none"/>`)
        + `<path d="M200,404 L176,392 L176,418Z M200,404 L224,392 L224,418Z" fill="${dk}"/><circle cx="200" cy="404" r="6" fill="${dk2}"/>`;
  }
  return r;
}

function patternDef(id, type, ink) {
  const P = (w, h, inner, extra = '') => `<pattern id="${id}" width="${w}" height="${h}" patternUnits="userSpaceOnUse" ${extra}>${inner}</pattern>`;
  switch (type) {
    case 'dots': return P(24, 24, `<circle cx="6" cy="6" r="3.5" fill="${ink}"/><circle cx="18" cy="18" r="3.5" fill="${ink}"/>`);
    case 'bigDots': return P(44, 44, `<circle cx="11" cy="11" r="8" fill="${ink}"/><circle cx="33" cy="33" r="8" fill="${ink}"/>`);
    case 'stripes': return P(18, 18, `<rect width="7" height="18" fill="${ink}"/>`, 'patternTransform="rotate(35)"');
    case 'hearts': return P(30, 30, `<path d="${heartPath(8, 3, 10)}" fill="${ink}"/><path d="${heartPath(23, 18, 8)}" fill="${ink}"/>`);
    case 'stars': return P(32, 32, `<path d="${starPath(8, 8, 6, 2.6)}" fill="${ink}"/><path d="${starPath(24, 23, 4, 1.8)}" fill="${ink}"/>`);
    case 'moons': return P(36, 36, `<path d="M12,4 a7,7 0 1,0 0,14 a5,5 0 1,1 0,-14Z" fill="${ink}"/><circle cx="28" cy="26" r="2" fill="${ink}"/>`);
    case 'glitter': return P(40, 40, [[5, 7], [22, 4], [33, 16], [12, 24], [28, 32], [4, 36], [19, 15]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i % 2 ? 1.2 : 1.8}" fill="${ink}"/>`).join(''));
    case 'lace': return P(24, 24, `<circle cx="12" cy="12" r="8" fill="none" stroke="${ink}" stroke-width="1.5"/><circle cx="12" cy="12" r="2.5" fill="${ink}"/>` + [[0, 0], [24, 24], [24, 0], [0, 24]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" fill="${ink}"/>`).join(''));
    case 'checks': return P(28, 28, `<rect width="14" height="14" fill="${ink}"/><rect x="14" y="14" width="14" height="14" fill="${ink}"/>`);
    case 'plaid': return P(30, 30, `<rect y="10" width="30" height="6" fill="${ink}"/><rect x="10" width="6" height="30" fill="${ink}"/><rect x="24" width="2" height="30" fill="${ink}"/><rect y="24" width="30" height="2" fill="${ink}"/>`);
    case 'argyle': return P(30, 40, `<path d="M15,0 L30,20 L15,40 L0,20Z" fill="${ink}" opacity=".7"/><path d="M0,0 L30,40 M30,0 L0,40" stroke="${ink}" stroke-width="1"/>`);
    case 'flowers': return P(36, 36, flower(10, 10, 3.2, ink, '#ffe066') + flower(27, 27, 2.6, ink, '#ff8fc7'));
    case 'butterflies': return P(44, 44, butterfly(12, 12, 0.5, ink, ink) + butterfly(34, 32, 0.38, ink, ink));
    case 'ribbons': return P(36, 36, `<path d="M12,12 Q4,6 4,12 Q4,18 12,12 Q20,6 20,12 Q20,18 12,12Z M28,28 Q22,24 22,28 Q22,32 28,28 Q34,24 34,28 Q34,32 28,28Z" fill="${ink}"/>`);
    case 'clouds': return P(50, 40, `<g fill="${ink}"><circle cx="10" cy="12" r="5"/><circle cx="17" cy="9" r="6"/><circle cx="24" cy="12" r="5"/><circle cx="34" cy="30" r="4"/><circle cx="40" cy="28" r="5"/><circle cx="46" cy="30" r="4"/></g>`);
    case 'sparkles': return P(34, 34, `<path d="${sparklePath(10, 10, 7)}" fill="${ink}"/><path d="${sparklePath(26, 24, 4)}" fill="${ink}"/>`);
    case 'rainbow': return P(60, 60, ['#ff6b6b', '#ffb347', '#ffe066', '#7ed957', '#6ec3ff', '#9d6bff'].map((c, i) => `<rect y="${i * 10}" width="60" height="10" fill="${c}"/>`).join(''));
    case 'snow': return P(36, 36, snowflake(12, 12, 6, ink) + snowflake(28, 28, 4, ink));
    default: return '';
  }
}

/* fabric sheen overlays (applied on skirt + bodice) */
function fabricDefs(p, type) {
  let s = `<linearGradient id="${p}sheen" gradientUnits="userSpaceOnUse" x1="40" y1="330" x2="360" y2="600">
    <stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".25" stop-color="#fff" stop-opacity=".45"/><stop offset=".35" stop-color="#fff" stop-opacity="0"/>
    <stop offset=".62" stop-color="#fff" stop-opacity="0"/><stop offset=".72" stop-color="#fff" stop-opacity=".3"/><stop offset=".82" stop-color="#fff" stop-opacity="0"/></linearGradient>`;
  if (type === 'holo') s += `<linearGradient id="${p}fab" gradientUnits="userSpaceOnUse" x1="40" y1="320" x2="360" y2="600">${gradStops(['#ff9ccf', '#ffe680', '#9ef0e0', '#8fd3ff', '#d9a6ff', '#ff9ccf'])}</linearGradient>`;
  if (type === 'pearl') s += `<radialGradient id="${p}fab" gradientUnits="userSpaceOnUse" cx="200" cy="470" r="200"><stop offset="0" stop-color="#fff" stop-opacity=".6"/><stop offset=".6" stop-color="#ffe6f5" stop-opacity=".3"/><stop offset="1" stop-color="#d6ecff" stop-opacity=".5"/></radialGradient>`;
  if (type === 'velvet') s += `<radialGradient id="${p}fab" gradientUnits="userSpaceOnUse" cx="200" cy="460" r="190"><stop offset=".4" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#2a0a2a" stop-opacity=".45"/></radialGradient>`;
  if (type === 'glitter' || type === 'starlight') s += `<pattern id="${p}fab" width="30" height="30" patternUnits="userSpaceOnUse">${[[4, 5, 1.3], [17, 3, 0.9], [25, 13, 1.5], [9, 18, 1], [21, 25, 1.2], [3, 27, 0.8], [14, 11, 0.7]].map(([x, y, r], i) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${i % 3 ? '#fff' : '#ffe680'}"/>`).join('')}</pattern>`;
  if (type === 'tulle') s += `<pattern id="${p}fab" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M0,4 L8,4 M4,0 L4,8" stroke="#fff" stroke-width=".7"/></pattern>`;
  return s;
}
function fabricOver(p, type, d) {
  const sheen = `<path d="${d}" fill="url(#${p}sheen)"/>`;
  switch (type) {
    case 'matte': return '';
    case 'satin': return sheen;
    case 'glitter': return `<path d="${d}" fill="url(#${p}fab)" opacity=".9"/>` + sheen;
    case 'starlight': return `<path d="${d}" fill="url(#${p}fab)" opacity=".5"/>` + sheen;
    case 'holo': return `<path d="${d}" fill="url(#${p}fab)" opacity=".4"/>` + sheen;
    case 'pearl': return `<path d="${d}" fill="url(#${p}fab)"/>` + sheen;
    case 'velvet': return `<path d="${d}" fill="url(#${p}fab)"/>`;
    case 'tulle': return `<path d="${d}" fill="#fff" opacity=".2"/><path d="${d}" fill="url(#${p}fab)" opacity=".5"/>`;
    default: return '';
  }
}
function fabricSparkles(st, hem) {
  if (st.fabric !== 'starlight') return '';
  const rn = seeded(23);
  let s = '';
  for (let i = 0; i < 14; i++) {
    const y = 420 + rn() * (hem.y - 430), t = (y - 404) / (hem.y - 404), half = 44 + t * ((hem.x2 - hem.x1) / 2 - 44);
    s += anim(`<path d="${sparklePath(200 + (rn() - 0.5) * 1.8 * half, y, 3 + rn() * 4)}" fill="#fff"/>`, 'tw', rn() * 3);
  }
  return s;
}

/* trimming placed along the hem of any dress */
function drawSkirtDeco(st, hem) {
  const { y, x1, x2 } = hem, w = x2 - x1;
  const along = (n, fn, inset = 0.06) => { let s = ''; for (let i = 0; i < n; i++) { const t = inset + (1 - 2 * inset) * i / (n - 1); s += fn(x1 + w * t, y, i); } return s; };
  const inSkirt = (n, seed, fn) => { const rn = seeded(seed); let s = ''; for (let i = 0; i < n; i++) { const yy = 430 + rn() * (y - 450), t = (yy - 404) / (y - 404), half = 40 + t * (w / 2 - 40); s += fn(200 + (rn() - 0.5) * 1.7 * half, yy, i); } return s; };
  switch (st.skirtDeco) {
    case 'pearlSwag': { let s = ''; const n = 6; for (let i = 0; i < n; i++) { const a = x1 + 10 + (w - 20) * i / n, b = x1 + 10 + (w - 20) * (i + 1) / n; s += beadsAlong(a, y - 34, (a + b) / 2, y - 6, b, y - 34, 7, 3, () => '#fffaf0'); } return s + along(n + 1, (x) => `<circle cx="${f1(x)}" cy="${y - 36}" r="5" fill="#fffaf0" stroke="#e8dcc0"/>`, 0.03); }
    case 'crystals': return inSkirt(16, 31, (x, yy, i) => anim(gem(f1(x), f1(yy), 5 + (i % 3), ['#bfe9ff', '#ffd6f5', '#e6d6ff'][i % 3]), 'tw', i * 0.2));
    case 'ribbonBows': return along(6, (x) => `<path d="M${f1(x)},${y - 12} Q${f1(x - 14)},${y - 22} ${f1(x - 14)},${y - 10} Q${f1(x - 14)},${y + 2} ${f1(x)},${y - 12} Q${f1(x + 14)},${y - 22} ${f1(x + 14)},${y - 10} Q${f1(x + 14)},${y + 2} ${f1(x)},${y - 12}Z" fill="${ACC}" stroke="#fff"/><path d="M${f1(x - 2)},${y - 10} L${f1(x - 8)},${y + 8} M${f1(x + 2)},${y - 10} L${f1(x + 8)},${y + 8}" stroke="${ACC}" stroke-width="3"/>`);
    case 'flowerGarland': return `<path d="M${x1},${y - 14} Q200,${y + 6} ${x2},${y - 14}" stroke="#7ed957" stroke-width="3" fill="none"/>` + along(9, (x, yy, i) => flower(f1(x), f1(y - 14 + Math.sin(Math.PI * (x - x1) / w) * 10), 6, ['#fff', '#ff9ccf', '#ffd166', '#c79bff'][i % 4]));
    case 'roses': return along(7, (x, yy, i) => rose(f1(x), y - 10, 9, ['#e53950', '#ff6f91', '#ffc2dd'][i % 3]) + `<ellipse cx="${f1(x + 10)}" cy="${y - 2}" rx="7" ry="3" fill="#4caf50"/>`) + rose(160, 410, 8, '#ff6f91') + rose(240, 410, 8, '#ff6f91');
    case 'laceTrim': return `<path d="M${x1},${y - 12} L${x2},${y - 12}${scallop(x2, x1, y - 12, 14, 12)}Z" fill="#fff" opacity=".9"/>` + along(14, (x) => `<circle cx="${f1(x)}" cy="${y - 6}" r="2.5" fill="none" stroke="#f0d0e0"/>`, 0.035);
    case 'ruffles': { const c = shade(st.dressColor, 45); return `<path d="M${x1 - 6},${y - 22}${scallop(x1 - 6, x2 + 6, y - 22, 12, 22)}" stroke="${c}" stroke-width="8" fill="none"/><path d="M${x1},${y - 40}${scallop(x1, x2, y - 40, 11, 16)}" stroke="#fff" stroke-width="4" fill="none" opacity=".7"/>`; }
    case 'butterflies': return inSkirt(6, 41, (x, yy, i) => anim(butterfly(f1(x), f1(yy), 0.9, ['#7fc8ff', '#ff9ccf', '#c79bff', '#ffd166'][i % 4]), 'fl', i * 0.4));
    case 'starTrail': { let s = ''; for (let i = 0; i < 10; i++) { const t = i / 9, x = 170 + t * (x2 - 190), yy = 412 + t * (y - 430); s += anim(`<path d="${starPath(x, yy, 4 + t * 7, 1.8 + t * 3)}" fill="${i % 3 ? '#fff' : '#ffe680'}"/>`, 'tw', i * 0.2); } return s; }
    case 'hearts': return along(10, (x, yy, i) => `<path d="${heartPath(f1(x), y - 22, 14)}" fill="${i % 2 ? '#ff4d8d' : '#fff'}"/>`) + inSkirt(6, 51, (x, yy) => `<path d="${heartPath(f1(x), f1(yy), 9)}" fill="#fff" opacity=".7"/>`);
    case 'featherTrim': return along(16, (x, yy, i) => `<ellipse cx="${f1(x)}" cy="${y - 6}" rx="7" ry="16" fill="${i % 2 ? '#fff' : '#ffe6f5'}" transform="rotate(${(i % 2 ? 15 : -15)} ${f1(x)} ${y - 6})"/>`, 0.03);
    case 'goldEmbroidery': return along(7, (x) => `<path d="M${f1(x - 18)},${y - 14} Q${f1(x - 9)},${y - 32} ${f1(x)},${y - 16} Q${f1(x + 9)},${y - 32} ${f1(x + 18)},${y - 14} M${f1(x - 6)},${y - 20} q6,-8 12,0" stroke="${GOLD}" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="${f1(x)}" cy="${y - 10}" r="2.5" fill="#ffd23f"/>`)
      + `<path d="M${x1 + 6},${y - 4} L${x2 - 6},${y - 4}" stroke="${GOLD}" stroke-width="2"/>`;
    default: return '';
  }
}

/* shawls: back part (behind body) and front part */
function drawShawl(st, front) {
  const sh = st.shawl;
  if (!front) {
    if (sh === 'starCape') { const rn = seeded(5); let s = `<path d="M146,318 L254,318 Q340,460 356,600 L44,600 Q60,460 146,318Z" fill="#3d3b8e"/><path d="M146,318 L254,318 Q330,460 344,600 L56,600 Q70,460 146,318Z" fill="#5a4fb0" opacity=".6"/>`; for (let i = 0; i < 18; i++) { const y = 340 + rn() * 250, half = 60 + (y - 320) * 0.5; s += anim(`<path d="${starPath(200 + (rn() - 0.5) * 2 * half, y, 3 + rn() * 4, 1.4 + rn())}" fill="#fff6a6"/>`, 'tw', rn() * 3); } return s; }
    if (sh === 'sheer') return `<path d="M144,320 Q100,420 96,500 Q200,470 304,500 Q300,420 256,320Z" fill="#fff" opacity=".35"/>`;
    if (sh === 'bowBack') return `<path d="M200,400 Q120,330 90,380 Q80,440 200,408Z M200,400 Q280,330 310,380 Q320,440 200,408Z" fill="${shade(st.dressColor, -15)}" stroke="${shade(st.dressColor, -30)}" stroke-width="2"/><path d="M196,410 Q160,500 140,580 L160,570 L168,590 Q190,500 204,410Z M204,410 Q240,500 260,580 L240,570 L232,590 Q210,500 196,410Z" fill="${shade(st.dressColor, -25)}"/>`;
    return '';
  }
  switch (sh) {
    case 'sheer': return both(`<path d="M150,318 Q128,330 124,370 Q120,420 112,470 Q126,478 136,470 Q132,420 142,372 Q150,340 168,330Z" fill="#fff" opacity=".45" stroke="#fff" stroke-width="1.5"/>`) + `<path d="M150,320 Q200,350 250,320" stroke="#fff" stroke-width="3" fill="none" opacity=".7"/>`;
    case 'capelet': return `<path d="M140,318 Q200,300 260,318 Q290,346 280,370${scallop(280, 120, 370, 10, 10)} Q110,346 140,318Z" fill="#fff" opacity=".95"/>` + [[150, 350], [180, 356], [220, 356], [250, 350]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4" fill="none" stroke="#f0d0e0" stroke-width="1.5"/>`).join('') + `<path d="M200,322 Q188,312 186,322 Q188,332 200,322 Q212,312 214,322 Q212,332 200,322Z" fill="${ACC}"/>`;
    case 'furStole': { let s = ''; for (let i = 0; i <= 12; i++) { const [x, y] = i <= 6 ? qpt(124, 380, 132, 320, 200, 318, i / 6) : qpt(200, 318, 268, 320, 276, 380, (i - 6) / 6); s += `<circle cx="${f1(x)}" cy="${f1(y)}" r="13" fill="${i % 2 ? '#fff' : '#f7f2ff'}"/>`; } return s; }
    case 'featherBoa': { let s = ''; [[124, 470, 140, 330, 200, 322], [276, 470, 260, 330, 200, 322]].forEach(([a, b, c2, d, e, f]) => { for (let i = 0; i <= 10; i++) { const [x, y] = qpt(a, b, c2, d, e, f, i / 10); s += `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="9" ry="13" fill="${i % 2 ? '#ff9ccf' : '#ffc2dd'}" transform="rotate(${i * 33} ${f1(x)} ${f1(y)})"/>`; } }); return s; }
    case 'ribbonSash': return `<path d="M156,318 L170,312 L246,392 L236,404Z" fill="#bfe9ff" stroke="${GOLD}" stroke-width="2"/><circle cx="226" cy="378" r="10" fill="#ffd23f" stroke="${GOLD}" stroke-width="2"/><path d="${starPath(226, 378, 6, 2.6)}" fill="#fff"/>`;
    case 'flowerSash': { let s = ''; for (let i = 0; i <= 7; i++) { const t = i / 7; s += flower(f1(160 + t * 80), f1(318 + t * 82), 6, ['#fff', '#ff9ccf', '#ffd166', '#c79bff'][i % 4]); } return s; }
    case 'pearlCape': return both(beadsAlong(132, 336, 150, 310, 180, 304, 8, 3, () => '#fffaf0') + beadsAlong(128, 350, 150, 326, 186, 318, 9, 2.6, () => '#ffe9f2'));
    case 'starCape': return `<path d="M150,318 Q200,302 250,318" stroke="${GOLD}" stroke-width="4" fill="none"/>` + both(`<path d="${starPath(152, 318, 8, 3.5)}" fill="#ffd23f"/>`);
    default: return '';
  }
}
