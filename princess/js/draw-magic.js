/* ---------- wings, auras, held items, pets, frames ---------- */
function drawWings(p, st) {
  const w = {
    fairy: `<ellipse cx="125" cy="290" rx="75" ry="38" fill="#bfe9ff" opacity=".55" stroke="#fff" stroke-width="2" transform="rotate(-30 125 290)"/>
      <ellipse cx="140" cy="385" rx="48" ry="26" fill="#ffd6f0" opacity=".6" stroke="#fff" stroke-width="2" transform="rotate(25 140 385)"/>
      <path d="M190,340 Q140,300 80,260 M190,350 Q150,380 110,400" stroke="#fff" stroke-width="1.5" fill="none" opacity=".8"/>`,
    crystalFairy: `<path d="M192,338 L40,220 L120,330Z" fill="#e6d6ff" opacity=".6" stroke="#fff" stroke-width="2"/><path d="M192,342 L70,300 L150,350Z" fill="#bfe9ff" opacity=".6" stroke="#fff" stroke-width="2"/>
      <path d="M192,352 L90,440 L160,370Z" fill="#ffd6f5" opacity=".6" stroke="#fff" stroke-width="2"/><path d="M192,338 L40,220 M192,352 L90,440" stroke="#fff" stroke-width="1" opacity=".8"/>`,
    angel: `<path d="M192,340 Q120,230 30,240 Q60,270 46,290 Q80,300 64,320 Q100,330 84,352 Q130,362 116,384 Q160,384 192,372Z" fill="#fff" stroke="#e3e0f0" stroke-width="2"/>
      <path d="M180,350 Q120,290 60,268 M180,356 Q130,320 76,320 M182,362 Q140,350 100,360" stroke="#e3e0f0" stroke-width="2" fill="none"/>`,
    pinkAngel: `<path d="M192,340 Q120,230 30,240 Q60,270 46,290 Q80,300 64,320 Q100,330 84,352 Q130,362 116,384 Q160,384 192,372Z" fill="#ffd6ec" stroke="#ff9ccf" stroke-width="2"/>
      <path d="M180,350 Q120,290 60,268 M180,356 Q130,320 76,320 M182,362 Q140,350 100,360" stroke="#fff" stroke-width="2" fill="none"/>`,
    butterfly: `<path d="M195,340 Q130,180 50,230 Q20,300 190,352Z" fill="#ff9ccf" stroke="#e0568f" stroke-width="3"/><path d="M195,352 Q100,360 96,430 Q150,470 196,364Z" fill="#b48cff" stroke="#7b4dff" stroke-width="3"/>
      <circle cx="95" cy="260" r="14" fill="#fff" opacity=".7"/><circle cx="130" cy="290" r="8" fill="#ffd166"/><circle cx="135" cy="410" r="9" fill="#fff" opacity=".7"/>`,
    moth: `<path d="M195,340 Q120,200 60,240 Q50,300 190,352Z" fill="#d8ffe8" stroke="#9fe0c0" stroke-width="2"/><path d="M195,352 Q130,370 120,420 Q110,480 96,520 Q140,470 160,430 Q186,400 196,364Z" fill="#c9f7e0" stroke="#9fe0c0" stroke-width="2"/>
      <circle cx="110" cy="276" r="12" fill="#fff6c9" stroke="#ffd166" stroke-width="2"/><circle cx="150" cy="400" r="7" fill="#fff6c9"/>`,
    galaxy: `<path d="M195,340 Q130,180 50,230 Q20,300 190,352Z" fill="#3d2b7a" stroke="#b48cff" stroke-width="2"/><path d="M195,352 Q100,360 96,430 Q150,470 196,364Z" fill="#5a3e9a" stroke="#b48cff" stroke-width="2"/>
      ${[[90, 250], [120, 280], [70, 270], [150, 310], [120, 400], [140, 420], [110, 300]].map(([x, y], i) => anim(`<path d="${sparklePath(x, y, 3 + (i % 3) * 2)}" fill="${i % 2 ? '#fff' : '#ffe680'}"/>`, 'tw', i * 0.3)).join('')}`,
    dragonfly: `<ellipse cx="110" cy="310" rx="88" ry="16" fill="#d9f7ff" opacity=".6" stroke="#9fd8ff" stroke-width="2" transform="rotate(-18 110 310)"/>
      <ellipse cx="118" cy="360" rx="78" ry="14" fill="#e9dcff" opacity=".6" stroke="#c39bff" stroke-width="2" transform="rotate(14 118 360)"/>`,
    heart: `<path d="${heartPath(120, 230, 120)}" fill="#ff8fc7" opacity=".75" stroke="#fff" stroke-width="3" transform="rotate(-35 120 290)"/>`,
    star: `<path d="${starPath(115, 290, 75, 32)}" fill="#ffe066" opacity=".85" stroke="#fff" stroke-width="3"/><path d="${starPath(150, 400, 30, 13)}" fill="#fff3a6" opacity=".85"/>`,
    ice: `<path d="M195,340 L80,230 L104,290 L30,300 L106,340 L50,410 L130,380 L120,440 L192,370Z" fill="#d6f0ff" opacity=".75" stroke="#fff" stroke-width="2.5"/>
      <path d="M190,350 L80,230 M190,352 L30,300 M190,356 L50,410" stroke="#fff" stroke-width="1.5" opacity=".8"/>`,
    snowflake: snowflake(110, 290, 70, '#bfe9ff', 8) + snowflake(110, 290, 70, '#fff', 3) + snowflake(150, 410, 30, '#d6f0ff', 5),
    rainbow: ['#ff6b6b', '#ffb347', '#ffe066', '#7ed957', '#6ec3ff', '#9d6bff'].map((c, i) =>
      `<path d="M195,345 Q120,190 40,250 Q30,330 195,358" fill="none" stroke="${c}" stroke-width="9" opacity=".85" transform="translate(${f1(195 * i * 0.09)},${f1(345 * i * 0.09)}) scale(${1 - i * 0.09})"/>`).join(''),
    cloud: [[150, 300, 34], [110, 270, 30], [80, 300, 26], [120, 340, 30], [150, 390, 24], [100, 380, 20]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" opacity=".95"/>`).join('') + `<circle cx="120" cy="300" r="40" fill="#fff" opacity=".4"/>`,
    bubble: [[140, 290, 40], [90, 270, 28], [80, 330, 22], [140, 380, 30], [100, 410, 18]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#${p}bub)" stroke="#fff" stroke-width="1.5"/><ellipse cx="${x - r * 0.35}" cy="${y - r * 0.4}" rx="${r * 0.25}" ry="${r * 0.12}" fill="#fff" opacity=".8" transform="rotate(-30 ${x - r * 0.35} ${y - r * 0.4})"/>`).join(''),
    petal: [-60, -30, 0, 30].map((a, i) => `<ellipse cx="120" cy="330" rx="70" ry="22" fill="${['#ffc2dd', '#ff9ccf', '#ffd6f0', '#ffb3d1'][i]}" opacity=".85" stroke="#fff" stroke-width="2" transform="rotate(${a} 195 345)"/>`).join(''),
    leaf: `<path d="M194,340 Q120,200 40,250 Q100,320 194,350Z" fill="#9be59b" stroke="#5fbf6f" stroke-width="2"/><path d="M194,345 Q120,280 40,250" stroke="#5fbf6f" stroke-width="2" fill="none"/>
      <path d="M194,356 Q110,380 90,440 Q160,420 194,362Z" fill="#c9f2b8" stroke="#5fbf6f" stroke-width="2"/>`,
    ribbon: `<path d="M196,342 Q100,250 60,300 Q40,340 120,330 Q170,325 196,350" fill="none" stroke="#ff9ccf" stroke-width="14" stroke-linecap="round"/><path d="M196,352 Q130,400 90,460" fill="none" stroke="#ffc2dd" stroke-width="10" stroke-linecap="round"/>`,
  }[st.wings];
  return w ? `<g class="wings">${both(w)}</g>` : '';
}

/* ---------- magic aura: back layer (behind princess) and front layer ---------- */
function drawAura(p, st, front) {
  const a = st.aura, rn = seeded(a.length * 7 + 3);
  const around = (n, fn) => { let s = ''; for (let i = 0; i < n; i++) { const x = 20 + rn() * 360, y = 40 + rn() * 520; if (Math.abs(x - 200) < 70 && y > 90 && y < 300) continue; s += fn(x, y, i); } return s; };
  if (!front) {
    switch (a) {
      case 'rainbowGlow': return `<defs><radialGradient id="${p}rg" cx=".5" cy=".5" r=".5">${gradStops(['#ffffff', '#ffe6f5', '#e6d6ff', '#d6f0ff'])}<stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs><ellipse cx="200" cy="330" rx="210" ry="300" fill="url(#${p}rg)" opacity=".8"/>`;
      case 'lightRays': return anim([...Array(9)].map((_, i) => `<path d="M200,-20 L${-60 + i * 65},620 L${-20 + i * 65},620Z" fill="#fff8d6" opacity=".22"/>`).join(''), 'tw');
      case 'bokeh': return around(14, (x, y, i) => anim(`<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(10 + rn() * 22)}" fill="${['#ffc2dd', '#d9c2ff', '#bfe9ff', '#fff3b0'][i % 4]}" opacity=".45"/>`, 'tw', rn() * 3));
      case 'magicCircle': return anim(`<g transform="translate(200 585) scale(1 .3)"><circle r="150" fill="none" stroke="#ffe680" stroke-width="4"/><circle r="128" fill="none" stroke="#fff" stroke-width="2"/><path d="${starPath(0, 0, 128, 50, 6)}" fill="none" stroke="#ffe680" stroke-width="3"/>${[...Array(12)].map((_, i) => `<circle cx="${f1(Math.cos(i * Math.PI / 6) * 139)}" cy="${f1(Math.sin(i * Math.PI / 6) * 139)}" r="4" fill="#fff"/>`).join('')}</g><ellipse cx="200" cy="585" rx="150" ry="45" fill="#ffe680" opacity=".2"/>`, 'tw');
      default: return '';
    }
  }
  switch (a) {
    case 'sparkles': return around(16, (x, y, i) => anim(`<path d="${sparklePath(x, y, 4 + rn() * 7)}" fill="${i % 3 ? '#fff' : '#fff3a6'}"/>`, 'tw', rn() * 3));
    case 'stars': return around(18, (x, y, i) => anim(`<path d="${starPath(x, y, 4 + rn() * 5, 2 + rn() * 1.5)}" fill="${['#ffe680', '#fff', '#ffc2dd'][i % 3]}"/>`, 'tw', rn() * 3));
    case 'hearts': return around(12, (x, y, i) => anim(`<path d="${heartPath(x, y, 10 + rn() * 12)}" fill="${['#ff8fc7', '#ffc2dd', '#ff6fae'][i % 3]}" opacity=".85"/>`, 'fl', rn() * 3));
    case 'bubbles': return `<defs><radialGradient id="${p}ab" cx=".35" cy=".35"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset=".6" stop-color="#e6d6ff" stop-opacity=".25"/><stop offset="1" stop-color="#bfe9ff" stop-opacity=".6"/></radialGradient></defs>`
      + around(14, (x, y) => anim(`<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(6 + rn() * 14)}" fill="url(#${p}ab)" stroke="#fff" stroke-width="1"/>`, 'fl', rn() * 3));
    case 'petals': return around(18, (x, y, i) => anim(`<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="6" ry="3.5" fill="${i % 2 ? '#ffc2dd' : '#ffb3d1'}" transform="rotate(${f1(rn() * 180)} ${f1(x)} ${f1(y)})"/>`, 'fa', rn() * 4));
    case 'snow': return around(20, (x, y) => anim(snowflake(x, y, 3 + rn() * 4, '#fff', 2), 'fa', rn() * 4));
    case 'butterflies': return around(6, (x, y, i) => anim(butterfly(f1(x), f1(y), 0.8 + rn() * 0.5, ['#7fc8ff', '#ff9ccf', '#c79bff', '#ffd166'][i % 4]), 'fl', rn() * 3));
    case 'notes': return around(10, (x, y, i) => anim(`<path d="M${f1(x)},${f1(y)} L${f1(x)},${f1(y - 16)} L${f1(x + 10)},${f1(y - 19)} L${f1(x + 10)},${f1(y - 4)}" stroke="${['#c79bff', '#ff8fc7', '#6ec3ff'][i % 3]}" stroke-width="2.5" fill="none"/><ellipse cx="${f1(x - 3)}" cy="${f1(y)}" rx="4" ry="3" fill="${['#c79bff', '#ff8fc7', '#6ec3ff'][i % 3]}"/><ellipse cx="${f1(x + 7)}" cy="${f1(y - 4)}" rx="4" ry="3" fill="${['#c79bff', '#ff8fc7', '#6ec3ff'][i % 3]}"/>`, 'fl', rn() * 3));
    case 'fireflies': return around(20, (x, y) => anim(`<circle cx="${f1(x)}" cy="${f1(y)}" r="6" fill="#fffbb0" opacity=".3"/><circle cx="${f1(x)}" cy="${f1(y)}" r="2.2" fill="#fffbb0"/>`, 'tw', rn() * 3));
    case 'glitterRain': return around(30, (x, y, i) => anim(`<line x1="${f1(x)}" y1="${f1(y)}" x2="${f1(x)}" y2="${f1(y + 6)}" stroke="${i % 2 ? '#ffe680' : '#fff'}" stroke-width="2" stroke-linecap="round"/>`, 'fa', rn() * 4));
    case 'rainbowGlow': case 'lightRays': case 'bokeh': case 'magicCircle':
      return around(8, (x, y) => anim(`<path d="${sparklePath(x, y, 3 + rn() * 4)}" fill="#fff"/>`, 'tw', rn() * 3));
    default: return '';
  }
}

/* ---------- held items (right hand at 264,468) ---------- */
function drawHeld(p, st) {
  switch (st.held) {
    case 'wand': return `<line x1="262" y1="472" x2="302" y2="372" stroke="#fff" stroke-width="6" stroke-linecap="round"/><line x1="262" y1="472" x2="302" y2="372" stroke="${GOLD}" stroke-width="2" stroke-dasharray="3 7"/>
      <path d="${starPath(305, 362, 20, 9)}" fill="#ffd23f" stroke="#fff" stroke-width="2"/>` + anim(`<path d="${sparklePath(330, 344, 6)}" fill="#fff8b0"/><path d="${sparklePath(286, 336, 4)}" fill="#fff8b0"/>`, 'tw');
    case 'heartWand': return `<line x1="262" y1="472" x2="300" y2="380" stroke="#ffc2dd" stroke-width="6" stroke-linecap="round"/><path d="M286,368 Q262,350 270,336 Q282,352 290,362Z M314,368 Q338,350 330,336 Q318,352 310,362Z" fill="#fff" stroke="#ffc2dd"/>
      <path d="${heartPath(300, 346, 30)}" fill="#ff6fae" stroke="#fff" stroke-width="2"/>` + anim(`<path d="${sparklePath(326, 338, 5)}" fill="#fff"/>`, 'tw');
    case 'starStaff': return `<line x1="262" y1="500" x2="300" y2="300" stroke="#e6d6ff" stroke-width="6" stroke-linecap="round"/><path d="M314,284 a26,26 0 1,0 -10,44 a20,20 0 1,1 10,-44Z" fill="#ffe680" stroke="${GOLD}" stroke-width="2"/>`
      + anim(`<path d="${starPath(302, 300, 11, 5)}" fill="#fff"/>`, 'tw') + `<path d="M272,450 Q262,440 270,430" stroke="#ff9ccf" stroke-width="4" fill="none"/>`;
    case 'scepter': return `<line x1="262" y1="490" x2="296" y2="362" stroke="${GOLD}" stroke-width="7" stroke-linecap="round"/><circle cx="298" cy="352" r="14" fill="#ff4d8d" stroke="${GOLD}" stroke-width="3"/><circle cx="294" cy="347" r="4" fill="#fff" opacity=".7"/><path d="M298,338 L298,324 M291,330 L305,330" stroke="${GOLD}" stroke-width="4"/>`;
    case 'orb': return `<defs><radialGradient id="${p}orb" cx=".35" cy=".35"><stop offset="0" stop-color="#fff"/><stop offset=".5" stop-color="#c9a7ff"/><stop offset="1" stop-color="#7b4dff"/></radialGradient></defs><path d="M252,468 L276,468 L272,456 L256,456Z" fill="${GOLD}"/><circle cx="264" cy="432" r="26" fill="url(#${p}orb)" opacity=".9"/>` + anim(`<path d="${sparklePath(270, 426, 6)}" fill="#fff"/>`, 'tw');
    case 'bubbleWand': return `<line x1="262" y1="472" x2="290" y2="392" stroke="#ff9ccf" stroke-width="4" stroke-linecap="round"/><circle cx="294" cy="380" r="12" fill="none" stroke="#ff9ccf" stroke-width="3"/>`
      + [[318, 350, 12], [300, 320, 8], [336, 316, 9], [322, 284, 6]].map(([x, y, r], i) => anim(`<circle cx="${x}" cy="${y}" r="${r}" fill="#e6f4ff" opacity=".5" stroke="#fff" stroke-width="1.5"/><circle cx="${x - r * 0.35}" cy="${y - r * 0.35}" r="${r * 0.2}" fill="#fff"/>`, 'fl', i * 0.4)).join('');
    case 'lantern': return `<path d="M264,466 Q272,440 282,430" stroke="${GOLD}" stroke-width="2" fill="none"/><rect x="268" y="430" width="30" height="40" rx="8" fill="#fff3c9" stroke="${GOLD}" stroke-width="2"/>` + anim(`<circle cx="283" cy="450" r="24" fill="#fff3a6" opacity=".35"/><circle cx="283" cy="450" r="7" fill="#ffd23f"/>`, 'tw') + `<path d="M268,430 L298,430 L292,422 L274,422Z" fill="${GOLD}"/>`;
    case 'fan': return `<path d="M266,464 L212,430 A62,62 0 0,1 320,430Z" fill="#ffb3d6" stroke="#e0568f" stroke-width="2"/>` + [222, 240, 258, 276, 294, 310].map(x => `<line x1="266" y1="464" x2="${x}" y2="${f1(402 + Math.abs(x - 266) * 0.35)}" stroke="#fff" stroke-width="1.5" opacity=".8"/>`).join('') + `<circle cx="266" cy="464" r="4" fill="${GOLD}"/>`;
    case 'bouquet': return `<path d="M252,448 L266,500 L282,448Z" fill="#fff" stroke="#f0d0e0" stroke-width="2"/><path d="M256,462 Q266,474 278,462 L274,470 Q266,480 258,470Z" fill="${ACC}"/>`
      + `<ellipse cx="252" cy="436" rx="10" ry="5" fill="#4caf50"/><ellipse cx="282" cy="436" rx="10" ry="5" fill="#4caf50"/>` + rose(256, 430, 9, '#ff6f91') + rose(276, 428, 9, '#e53950') + flower(266, 414, 6, '#fff') + rose(266, 438, 8, '#ff9ccf') + flower(286, 444, 4, '#c79bff') + flower(248, 446, 4, '#ffd166');
    case 'basket': return `<path d="M250,470 Q266,430 282,470" stroke="#c98e63" stroke-width="3" fill="none"/><path d="M244,470 L288,470 L282,496 L250,496Z" fill="#e8b48a" stroke="#c98e63" stroke-width="2"/><path d="M248,480 L284,480 M250,488 L282,488" stroke="#c98e63" stroke-width="1.5"/>`
      + flower(252, 466, 5, '#ff9ccf') + flower(266, 462, 6, '#fff') + flower(280, 466, 5, '#c79bff');
    case 'rose': return `<path d="M264,470 Q272,430 290,394" stroke="#3f9e57" stroke-width="4" fill="none"/><ellipse cx="282" cy="428" rx="10" ry="5" fill="#4caf50" transform="rotate(-40 282 428)"/>` + rose(292, 388, 13, '#e53950');
    case 'mirror': return `<rect x="268" y="408" width="10" height="64" rx="5" fill="${GOLD}" transform="rotate(15 264 468)"/><ellipse cx="290" cy="392" rx="24" ry="30" fill="${GOLD}"/><ellipse cx="290" cy="392" rx="18" ry="24" fill="#d6f0ff"/><path d="M280,380 L292,372" stroke="#fff" stroke-width="4" stroke-linecap="round"/><path d="${heartPath(290, 360, 10)}" fill="#ff4d8d"/>`;
    case 'glassSlipper': return `<path d="M244,466 Q250,446 268,450 Q280,452 290,462 L292,470 Q270,474 250,472Z" fill="#d6f0ff" opacity=".85" stroke="#fff" stroke-width="2"/><path d="M286,470 L290,488" stroke="#d6f0ff" stroke-width="4"/>` + anim(`<path d="${sparklePath(258, 452, 5)}" fill="#fff"/>`, 'tw');
    case 'balloon': return `<path d="M264,462 Q296,400 320,330" stroke="#999" stroke-width="1.5" fill="none"/>` + anim(`<path d="${heartPath(322, 266, 66)}" fill="#ff4d8d"/><ellipse cx="306" cy="290" rx="6" ry="10" fill="#fff" opacity=".5" transform="rotate(-20 306 290)"/>`, 'fl') + `<path d="M318,330 l4,-6 l4,6Z" fill="#e0306f"/>`;
    case 'parasol': return `<line x1="262" y1="478" x2="302" y2="310" stroke="#8d5a3b" stroke-width="4"/><path d="M222,320 Q300,236 382,320${scallop(382, 222, 320, 6, 12)}Z" fill="#ffc2dd" stroke="#ff8fc7" stroke-width="2"/>`
      + [250, 280, 320, 352].map(x => `<path d="M302,262 Q${x},290 ${x},322" stroke="#fff" stroke-width="2" fill="none" opacity=".8"/>`).join('') + `<circle cx="302" cy="260" r="5" fill="${GOLD}"/>`;
    case 'pinwheel': return `<line x1="262" y1="474" x2="292" y2="380" stroke="#fff" stroke-width="4"/>` + anim(['#ff9ccf', '#8fd3ff', '#ffe680', '#c79bff'].map((c, i) => `<path d="M294,374 L294,346 Q310,350 294,374Z" fill="${c}" transform="rotate(${i * 90} 294 374)"/>`).join('') + `<circle cx="294" cy="374" r="3" fill="#fff"/>`, 'spin');
    case 'teddy': return `<g transform="translate(278 446)"><ellipse cx="0" cy="16" rx="18" ry="16" fill="#c98e63"/><circle cx="0" cy="-8" r="16" fill="#c98e63"/><circle cx="-12" cy="-20" r="6" fill="#c98e63"/><circle cx="12" cy="-20" r="6" fill="#c98e63"/>
      <ellipse cx="0" cy="-3" rx="7" ry="5" fill="#f2d2b3"/><circle cx="-6" cy="-10" r="2" fill="${INK}"/><circle cx="6" cy="-10" r="2" fill="${INK}"/><circle cx="0" cy="-5" r="2" fill="${INK}"/><path d="M-6,2 Q0,6 6,2" stroke="${ACC}" stroke-width="3" fill="none"/></g>`;
    case 'purse': return `<path d="M254,472 Q264,446 278,472" stroke="${GOLD}" stroke-width="3" fill="none"/><rect x="246" y="472" width="42" height="32" rx="9" fill="#ff8fc7"/><path d="M246,484 Q267,496 288,484" stroke="#e0568f" stroke-width="2" fill="none"/><circle cx="267" cy="490" r="4" fill="${GOLD}"/>`;
    case 'giftBox': return `<rect x="246" y="446" width="40" height="34" rx="4" fill="#bfe6ff"/><rect x="262" y="446" width="8" height="34" fill="#ff8fc7"/><rect x="244" y="440" width="44" height="10" rx="3" fill="#d6f0ff"/><path d="M266,440 Q252,424 250,436 Q252,446 266,440 Q280,424 282,436 Q280,446 266,440Z" fill="#ff8fc7"/>`;
    case 'lollipop': return `<line x1="264" y1="472" x2="284" y2="410" stroke="#fff" stroke-width="5"/><circle cx="288" cy="394" r="24" fill="#ff8fc7"/><path d="M288,394 m-14,0 a14,14 0 1,1 14,14 a9,9 0 1,1 -9,-9 a4,4 0 1,1 4,4" stroke="#fff" stroke-width="4" fill="none"/>`;
    case 'cottonCandy': return `<line x1="264" y1="472" x2="282" y2="410" stroke="#fff" stroke-width="4"/>` + [[284, 398, 18], [270, 388, 14], [298, 386, 14], [284, 376, 14]].map(([x, y, r], i) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${i % 2 ? '#ffc2dd' : '#d9c2ff'}"/>`).join('');
    case 'icecream': return `<path d="M250,438 L282,438 L266,478Z" fill="#e8b46a"/><path d="M254,446 L276,446 M258,456 L273,456" stroke="#c98e3a" stroke-width="1.5"/><circle cx="258" cy="430" r="11" fill="#ffc2dd"/><circle cx="276" cy="430" r="11" fill="#bfe9ff"/><circle cx="267" cy="414" r="11" fill="#fff3b0"/><circle cx="267" cy="402" r="4" fill="#e53950"/>`;
    case 'cupcake': return `<path d="M248,462 L284,462 L280,488 L252,488Z" fill="#7fc8ff"/><ellipse cx="266" cy="456" rx="22" ry="11" fill="#ffc2dd"/><ellipse cx="266" cy="446" rx="15" ry="9" fill="#ffc2dd"/><circle cx="266" cy="434" r="5" fill="#e53950"/>`;
    case 'macaron': return [['#ff9ccf', 470], ['#c8a2ff', 452], ['#9effe0', 434]].map(([c, y]) => `<ellipse cx="266" cy="${y}" rx="18" ry="7" fill="${c}"/><rect x="250" y="${y - 2}" width="32" height="4" fill="#fff"/><ellipse cx="266" cy="${y - 4}" rx="18" ry="5" fill="${shade(c, 15)}"/>`).join('');
    case 'book': return `<g transform="rotate(-15 268 450)"><rect x="244" y="418" width="48" height="60" rx="4" fill="#7b4dff"/><rect x="288" y="420" width="4" height="56" fill="#fff"/><path d="${heartPath(268, 436, 18)}" fill="#ffd166"/><path d="M252,466 L282,466" stroke="#fff" stroke-width="2"/></g>`;
    default: return '';
  }
}

/* ---------- pets ---------- */
function petEyes(dx = 9, y = -4, big = 4) {
  return `<circle cx="${-dx}" cy="${y}" r="${big}" fill="${INK}"/><circle cx="${dx}" cy="${y}" r="${big}" fill="${INK}"/><circle cx="${-dx + 1.5}" cy="${y - 1.5}" r="1.5" fill="#fff"/><circle cx="${dx + 1.5}" cy="${y - 1.5}" r="1.5" fill="#fff"/>
    <ellipse cx="${-dx - 6}" cy="${y + 9}" rx="5" ry="3" fill="#ff9ebb" opacity=".7"/><ellipse cx="${dx + 6}" cy="${y + 9}" rx="5" ry="3" fill="#ff9ebb" opacity=".7"/>`;
}
const MOUTH = `<path d="M-5,9 Q-2.5,12 0,9 Q2.5,12 5,9" stroke="${INK}" stroke-width="1.5" fill="none"/>`;
function catPet(c, stripe, inner = '#ffb3d1') {
  return `<path d="M24,40 Q60,30 46,-2" stroke="${c}" stroke-width="9" fill="none" stroke-linecap="round"/><ellipse cx="0" cy="38" rx="28" ry="22" fill="${c}" stroke="${c === '#ffffff' ? '#eee' : 'none'}"/>
    <path d="M-24,-8 L-20,-38 L-2,-22Z M24,-8 L20,-38 L2,-22Z" fill="${c}" stroke="${c === '#ffffff' ? '#eee' : 'none'}"/><path d="M-19,-14 L-17,-30 L-8,-22Z M19,-14 L17,-30 L8,-22Z" fill="${inner}"/><circle cx="0" cy="0" r="26" fill="${c}" stroke="${c === '#ffffff' ? '#eee' : 'none'}"/>
    ${stripe ? `<path d="M-6,-24 L-4,-14 M0,-25 L0,-15 M6,-24 L4,-14" stroke="${stripe}" stroke-width="2.5"/>` : ''}${petEyes()}<path d="M-3,4 L3,4 L0,7Z" fill="#ff8fab"/>${MOUTH}
    <path d="M-14,6 L-30,3 M-14,10 L-30,12 M14,6 L30,3 M14,10 L30,12" stroke="${INK}" stroke-width="1" opacity=".6"/>`;
}
function drawPet(st) {
  const wrap = (inner, x = 72, y = 530) => `<g transform="translate(${x} ${y})"><g class="pet">${inner}</g></g>`;
  switch (st.pet) {
    case 'cat': return wrap(catPet('#ffb366', '#e8893a'));
    case 'whiteCat': return wrap(catPet('#ffffff', null) + `<path d="M-30,-10 Q-20,-20 -12,-16" stroke="${ACC}" stroke-width="0"/><path d="M14,-24 Q8,-34 18,-34 Q26,-34 20,-26 Q30,-32 30,-24 Q28,-18 20,-22Z" fill="${ACC}"/>`);
    case 'bunny': return wrap(`<ellipse cx="-10" cy="-38" rx="8" ry="24" fill="#fff" stroke="#f0d9e4" stroke-width="2"/><ellipse cx="10" cy="-38" rx="8" ry="24" fill="#fff" stroke="#f0d9e4" stroke-width="2"/><ellipse cx="-10" cy="-36" rx="3.5" ry="16" fill="#ffb3d1"/><ellipse cx="10" cy="-36" rx="3.5" ry="16" fill="#ffb3d1"/>
      <circle cx="28" cy="44" r="8" fill="#fff" stroke="#f0d9e4"/><ellipse cx="0" cy="38" rx="27" ry="22" fill="#fff" stroke="#f0d9e4" stroke-width="2"/><circle cx="0" cy="0" r="24" fill="#fff" stroke="#f0d9e4" stroke-width="2"/>${petEyes(8)}<path d="M-3,4 L3,4 L0,7Z" fill="#ff8fab"/>${MOUTH}`);
    case 'puppy': { const c = '#f2d2a9', e = '#a0672d'; return wrap(`<path d="M24,36 Q44,26 40,10" stroke="${c}" stroke-width="8" fill="none" stroke-linecap="round"/><ellipse cx="0" cy="38" rx="28" ry="22" fill="${c}"/><circle cx="0" cy="0" r="26" fill="${c}"/>
      <ellipse cx="-26" cy="2" rx="9" ry="19" fill="${e}" transform="rotate(20 -26 2)"/><ellipse cx="26" cy="2" rx="9" ry="19" fill="${e}" transform="rotate(-20 26 2)"/><ellipse cx="10" cy="-8" rx="9" ry="8" fill="${e}" opacity=".5"/>
      ${petEyes()}<ellipse cx="0" cy="5" rx="5" ry="3.5" fill="${INK}"/><path d="M-3,11 Q0,18 3,11Z" fill="#ff8fab"/>`); }
    case 'chick': return wrap(`<ellipse cx="0" cy="18" rx="32" ry="34" fill="#ffe066"/><path d="M-4,-16 Q-2,-28 4,-30 Q2,-22 6,-18" fill="#ffe066" stroke="#ffd23f"/><ellipse cx="-28" cy="22" rx="8" ry="14" fill="#ffd23f" transform="rotate(25 -28 22)"/><ellipse cx="28" cy="22" rx="8" ry="14" fill="#ffd23f" transform="rotate(-25 28 22)"/>
      ${petEyes(10, 4)}<path d="M-6,12 L6,12 L0,20Z" fill="#ff8a3d"/><path d="M-10,52 l-4,8 M-10,52 l0,9 M10,52 l4,8 M10,52 l0,9" stroke="#ff8a3d" stroke-width="2.5" stroke-linecap="round"/>`);
    case 'hamster': return wrap(`<ellipse cx="0" cy="20" rx="34" ry="32" fill="#f4c27a"/><ellipse cx="0" cy="30" rx="22" ry="20" fill="#fff6e6"/><circle cx="-22" cy="-6" r="8" fill="#f4c27a"/><circle cx="22" cy="-6" r="8" fill="#f4c27a"/><circle cx="-22" cy="-6" r="4" fill="#ffb3d1"/><circle cx="22" cy="-6" r="4" fill="#ffb3d1"/>
      ${petEyes(11, 8)}<circle cx="0" cy="15" r="2.5" fill="#ff8fab"/><path d="M-4,19 Q0,22 4,19" stroke="${INK}" stroke-width="1.3" fill="none"/><ellipse cx="-10" cy="44" rx="6" ry="4" fill="#ffb3d1"/><ellipse cx="10" cy="44" rx="6" ry="4" fill="#ffb3d1"/>`);
    case 'panda': return wrap(`<ellipse cx="0" cy="38" rx="28" ry="22" fill="#fff" stroke="#ddd"/><ellipse cx="-22" cy="40" rx="8" ry="12" fill="${INK}"/><ellipse cx="22" cy="40" rx="8" ry="12" fill="${INK}"/><circle cx="-20" cy="-20" r="9" fill="${INK}"/><circle cx="20" cy="-20" r="9" fill="${INK}"/>
      <circle cx="0" cy="0" r="26" fill="#fff" stroke="#ddd"/><ellipse cx="-10" cy="-3" rx="7" ry="9" fill="${INK}" transform="rotate(25 -10 -3)"/><ellipse cx="10" cy="-3" rx="7" ry="9" fill="${INK}" transform="rotate(-25 10 -3)"/>
      <circle cx="-9" cy="-4" r="2.5" fill="#fff"/><circle cx="9" cy="-4" r="2.5" fill="#fff"/><ellipse cx="0" cy="7" rx="4" ry="3" fill="${INK}"/><ellipse cx="-17" cy="8" rx="5" ry="3" fill="#ff9ebb" opacity=".7"/><ellipse cx="17" cy="8" rx="5" ry="3" fill="#ff9ebb" opacity=".7"/>`);
    case 'fox': { const c = '#ff9248'; return wrap(`<path d="M22,40 Q64,40 54,0 Q44,20 22,30Z" fill="${c}"/><path d="M54,0 Q50,10 44,14 Q52,12 54,0Z" fill="#fff"/><ellipse cx="0" cy="38" rx="26" ry="22" fill="${c}"/><ellipse cx="0" cy="42" rx="14" ry="14" fill="#fff"/>
      <path d="M-26,-6 L-22,-38 L-4,-20Z M26,-6 L22,-38 L4,-20Z" fill="${c}"/><path d="M-21,-14 L-20,-30 L-10,-20Z M21,-14 L20,-30 L10,-20Z" fill="#fff"/><circle cx="0" cy="0" r="25" fill="${c}"/>
      <path d="M-25,4 Q-10,22 0,10 Q10,22 25,4 Q20,24 0,26 Q-20,24 -25,4Z" fill="#fff"/>${petEyes(10, -4)}<ellipse cx="0" cy="10" rx="4" ry="3" fill="${INK}"/>`); }
    case 'penguin': return wrap(`<ellipse cx="0" cy="18" rx="32" ry="40" fill="#2e3a59"/><ellipse cx="0" cy="26" rx="22" ry="30" fill="#fff"/><ellipse cx="0" cy="-2" rx="20" ry="16" fill="#fff"/>
      ${petEyes(9, -4)}<path d="M-6,4 L6,4 L0,11Z" fill="#ff9f43"/><ellipse cx="-30" cy="20" rx="7" ry="18" fill="#2e3a59" transform="rotate(15 -30 20)"/><ellipse cx="30" cy="20" rx="7" ry="18" fill="#2e3a59" transform="rotate(-15 30 20)"/>
      <ellipse cx="-12" cy="58" rx="10" ry="4" fill="#ff9f43"/><ellipse cx="12" cy="58" rx="10" ry="4" fill="#ff9f43"/>`);
    case 'bear': { const c = '#b07a4f'; return wrap(`<ellipse cx="0" cy="38" rx="28" ry="22" fill="${c}"/><ellipse cx="0" cy="42" rx="14" ry="12" fill="#e8c39e"/><circle cx="-20" cy="-20" r="9" fill="${c}"/><circle cx="20" cy="-20" r="9" fill="${c}"/><circle cx="-20" cy="-20" r="4.5" fill="#e8c39e"/><circle cx="20" cy="-20" r="4.5" fill="#e8c39e"/>
      <circle cx="0" cy="0" r="26" fill="${c}"/><ellipse cx="0" cy="8" rx="11" ry="8" fill="#e8c39e"/>${petEyes(10, -5)}<ellipse cx="0" cy="5" rx="4" ry="3" fill="${INK}"/>${MOUTH}`); }
    case 'koala': { const c = '#b8bcc8'; return wrap(`<ellipse cx="0" cy="38" rx="28" ry="22" fill="${c}"/><ellipse cx="0" cy="42" rx="14" ry="12" fill="#eef0f5"/><circle cx="-26" cy="-10" r="15" fill="${c}"/><circle cx="26" cy="-10" r="15" fill="${c}"/><circle cx="-26" cy="-10" r="9" fill="#fff"/><circle cx="26" cy="-10" r="9" fill="#fff"/>
      <circle cx="0" cy="2" r="25" fill="${c}"/>${petEyes(11, -2, 3.5)}<ellipse cx="0" cy="8" rx="7" ry="9" fill="#3a3a4a"/>`); }
    case 'seal': return wrap(`<path d="M-34,40 Q-30,0 0,-6 Q34,-4 34,30 Q30,52 0,50 Q-24,50 -34,40Z" fill="#e6eef5" stroke="#cfd9e3" stroke-width="2"/><path d="M-30,44 Q-46,52 -50,44 Q-40,40 -30,40Z M28,46 Q42,56 48,48 Q40,42 30,42Z" fill="#cfd9e3"/>
      ${petEyes(10, 10)}<ellipse cx="0" cy="18" rx="4" ry="3" fill="${INK}"/><path d="M-8,20 L-24,18 M-8,23 L-24,24 M8,20 L24,18 M8,23 L24,24" stroke="${INK}" stroke-width="1" opacity=".5"/>`);
    case 'lamb': return wrap([[0, 34, 28], [-22, 28, 14], [22, 28, 14], [-14, 50, 12], [14, 50, 12], [-14, -18, 11], [0, -24, 12], [14, -18, 11]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fffaf2" stroke="#f0e6d6"/>`).join('')
      + `<ellipse cx="-26" cy="0" rx="10" ry="5" fill="#f5d6c6" transform="rotate(-20 -26 0)"/><ellipse cx="26" cy="0" rx="10" ry="5" fill="#f5d6c6" transform="rotate(20 26 0)"/><ellipse cx="0" cy="2" rx="20" ry="22" fill="#f5d6c6"/>${petEyes(8, 0, 3.5)}${MOUTH.replace(/9/g, '12')}`);
    case 'deer': { const c = '#d9a06b'; return wrap(`<ellipse cx="0" cy="38" rx="28" ry="20" fill="${c}"/>${[[-12, 32], [4, 28], [14, 40], [-2, 44]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" fill="#fff"/>`).join('')}
      <rect x="-20" y="50" width="7" height="14" rx="3" fill="${c}"/><rect x="12" y="50" width="7" height="14" rx="3" fill="${c}"/><path d="M-12,-20 L-18,-38 M-15,-30 L-22,-32 M12,-20 L18,-38 M15,-30 L22,-32" stroke="#a0672d" stroke-width="3" stroke-linecap="round"/>
      <ellipse cx="-24" cy="-8" rx="12" ry="6" fill="${c}" transform="rotate(-25 -24 -8)"/><ellipse cx="24" cy="-8" rx="12" ry="6" fill="${c}" transform="rotate(25 24 -8)"/><circle cx="0" cy="0" r="22" fill="${c}"/><ellipse cx="0" cy="12" rx="10" ry="8" fill="#fff3e0"/>
      ${petEyes(9, -2)}<ellipse cx="0" cy="9" rx="3.5" ry="2.5" fill="${INK}"/>`); }
    case 'squirrel': { const c = '#d9884a'; return wrap(`<path d="M20,46 Q70,40 56,-10 Q48,-34 26,-22 Q46,-10 38,14 Q32,30 18,34Z" fill="${c}"/><path d="M40,-14 Q52,0 44,18" stroke="#f5c08a" stroke-width="4" fill="none"/><ellipse cx="0" cy="36" rx="24" ry="22" fill="${c}"/><ellipse cx="0" cy="40" rx="13" ry="14" fill="#fff3e0"/>
      <path d="M-20,-14 L-18,-34 L-6,-20Z M20,-14 L18,-34 L6,-20Z" fill="${c}"/><circle cx="0" cy="0" r="22" fill="${c}"/>${petEyes(9, -3)}<circle cx="0" cy="6" r="2.5" fill="${INK}"/><ellipse cx="0" cy="22" rx="6" ry="5" fill="#a0672d"/>`); }
    case 'owl': return wrap(`<ellipse cx="0" cy="20" rx="32" ry="38" fill="#c9a7ff"/><ellipse cx="0" cy="34" rx="20" ry="22" fill="#f3e6ff"/>${[[-8, 28], [8, 28], [0, 38], [-8, 46], [8, 46]].map(([x, y]) => `<path d="M${x - 4},${y} q4,4 8,0" stroke="#c9a7ff" stroke-width="1.5" fill="none"/>`).join('')}
      <path d="M-28,-10 L-24,-28 L-12,-14Z M28,-10 L24,-28 L12,-14Z" fill="#b48cff"/><circle cx="-12" cy="0" r="12" fill="#fff"/><circle cx="12" cy="0" r="12" fill="#fff"/><circle cx="-12" cy="1" r="6" fill="${INK}"/><circle cx="12" cy="1" r="6" fill="${INK}"/><circle cx="-10" cy="-1" r="2" fill="#fff"/><circle cx="14" cy="-1" r="2" fill="#fff"/>
      <path d="M-4,10 L4,10 L0,17Z" fill="#ffb347"/><ellipse cx="-30" cy="24" rx="7" ry="16" fill="#b48cff"/><ellipse cx="30" cy="24" rx="7" ry="16" fill="#b48cff"/>`);
    case 'unicorn': return wrap(`<rect x="-22" y="30" width="9" height="28" rx="4" fill="#fff" stroke="#eee"/><rect x="12" y="30" width="9" height="28" rx="4" fill="#fff" stroke="#eee"/><ellipse cx="0" cy="30" rx="30" ry="18" fill="#fff" stroke="#eee"/>
      <path d="M28,24 Q46,30 40,52 Q34,40 28,34Z" fill="#c79bff"/><ellipse cx="-22" cy="0" rx="18" ry="22" fill="#fff" stroke="#eee"/><path d="M-26,-22 L-22,-46 L-16,-22Z" fill="#ffe680" stroke="${GOLD}"/>
      <circle cx="-8" cy="-18" r="7" fill="#ff8fc7"/><circle cx="-4" cy="-6" r="7" fill="#7fc8ff"/><circle cx="-2" cy="6" r="6" fill="#ffd166"/><circle cx="-24" cy="-4" r="3.5" fill="${INK}"/><circle cx="-23" cy="-5" r="1.2" fill="#fff"/><ellipse cx="-30" cy="8" rx="4" ry="2.5" fill="#ff9ebb" opacity=".7"/>`, 70, 528);
    case 'dragon': { const c = '#ffb3d1'; return wrap(`<path d="M24,44 Q60,50 58,24 Q54,36 40,36" stroke="${c}" stroke-width="10" fill="none" stroke-linecap="round"/><path d="M-20,10 Q-56,-10 -50,-30 Q-40,-14 -24,-14Z M20,10 Q56,-10 50,-30 Q40,-14 24,-14Z" fill="#d9c2ff" stroke="#b48cff"/>
      <ellipse cx="0" cy="34" rx="26" ry="24" fill="${c}"/><ellipse cx="0" cy="38" rx="15" ry="16" fill="#fff3e0"/><circle cx="0" cy="0" r="24" fill="${c}"/><path d="M-12,-20 L-16,-34 L-4,-22Z M12,-20 L16,-34 L4,-22Z" fill="#fff3b0"/>
      ${[-6, 0, 6].map(x => `<path d="M${x - 3},-24 L${x},-30 L${x + 3},-24Z" fill="#c79bff"/>`).join('')}${petEyes(9, -2)}<circle cx="-4" cy="8" r="1.5" fill="${INK}"/><circle cx="4" cy="8" r="1.5" fill="${INK}"/>`); }
    case 'jellyfish': return wrap(`<path d="M-26,10 Q-26,-26 0,-26 Q26,-26 26,10${scallop(26, -26, 10, 5, 6)}Z" fill="#d9c2ff" opacity=".85" stroke="#fff" stroke-width="2"/>`
      + [-18, -9, 0, 9, 18].map((x, i) => `<path d="M${x},14 Q${x + (i % 2 ? 6 : -6)},30 ${x},44 Q${x + (i % 2 ? -6 : 6)},56 ${x},66" stroke="${i % 2 ? '#ffc2dd' : '#bfe9ff'}" stroke-width="3" fill="none" stroke-linecap="round"/>`).join('')
      + petEyes(9, -4, 3.2) + `<ellipse cx="-8" cy="-16" rx="6" ry="3" fill="#fff" opacity=".7"/>`, 70, 500);
    case 'butterfly': return wrap(butterfly(0, 0, 2.6, '#7fc8ff', '#c79bff') + `<path d="M-2,-18 Q-8,-30 -14,-32 M2,-18 Q8,-30 14,-32" stroke="#5a3e7a" stroke-width="1.5" fill="none"/><circle cx="-14" cy="-32" r="2" fill="#5a3e7a"/><circle cx="14" cy="-32" r="2" fill="#5a3e7a"/>`, 80, 470);
    case 'bird': return wrap(`<ellipse cx="0" cy="0" rx="16" ry="13" fill="#6ec3ff"/><circle cx="-10" cy="-8" r="10" fill="#6ec3ff"/><ellipse cx="4" cy="2" rx="9" ry="6" fill="#3a9bdc" transform="rotate(-20 4 2)"/><path d="M14,-2 L26,-8 L22,4Z" fill="#3a9bdc"/>
      <circle cx="-12" cy="-10" r="2.5" fill="${INK}"/><path d="M-20,-8 L-27,-6 L-20,-4Z" fill="#ff9f43"/><ellipse cx="-8" cy="-3" rx="3" ry="2" fill="#ff9ebb" opacity=".8"/><path d="M-4,12 l-2,6 M4,12 l2,6" stroke="#ff9f43" stroke-width="2"/>`, 150, 300);
    default: return '';
  }
}

/* ---------- picture frames (drawn above everything) ---------- */
function drawFrame(p, st) {
  const f = st.frame;
  const edge = (n, fn) => { // points around the border
    let s = '';
    const per = [[0, 0, 400, 0], [400, 0, 400, 600], [400, 600, 0, 600], [0, 600, 0, 0]];
    per.forEach(([x0, y0, x1, y1], side) => { const len = Math.hypot(x1 - x0, y1 - y0), k = Math.round(n * len / 1000); for (let i = 0; i < k; i++) { const t = i / k; s += fn(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, i + side * 100); } });
    return s;
  };
  const inset = (x, y, d) => [x < 1 ? d : x > 399 ? 400 - d : x, y < 1 ? d : y > 599 ? 600 - d : y];
  switch (f) {
    case 'gold': return `<defs><linearGradient id="${p}gf" x1="0" y1="0" x2="1" y2="1">${gradStops(['#fff3b0', '#d4a017', '#fff3b0', '#c08a00', '#fff3b0'])}</linearGradient></defs>
      <rect x="6" y="6" width="388" height="588" rx="22" fill="none" stroke="url(#${p}gf)" stroke-width="10"/><rect x="16" y="16" width="368" height="568" rx="16" fill="none" stroke="#fff3b0" stroke-width="2"/>`
      + [[22, 22, 0], [378, 22, 90], [378, 578, 180], [22, 578, 270]].map(([x, y, a]) => `<g transform="translate(${x} ${y}) rotate(${a})"><path d="M0,0 Q30,-4 40,10 Q30,4 20,12 M0,0 Q-4,30 10,40 Q4,30 12,20" stroke="url(#${p}gf)" stroke-width="4" fill="none" stroke-linecap="round"/>${gem(8, 8, 7, '#ff6fae')}</g>`).join('')
      + `<path d="M170,6 Q200,-10 230,6 Q214,18 200,10 Q186,18 170,6Z" fill="url(#${p}gf)"/>` + gem(200, 10, 6, '#8fd3ff');
    case 'pearls': return `<rect x="8" y="8" width="384" height="584" rx="20" fill="none" stroke="#fff" stroke-width="3" opacity=".7"/>` + edge(64, (x, y) => { const [a, b] = inset(x, y, 9); return `<circle cx="${f1(a)}" cy="${f1(b)}" r="5.5" fill="#fffaf0" stroke="#e8dcc0"/>`; });
    case 'flowers': return edge(34, (x, y, i) => { const [a, b] = inset(x, y, 12); return `<ellipse cx="${f1(a + 8)}" cy="${f1(b + 6)}" rx="8" ry="4" fill="#7ed957" transform="rotate(${i * 40} ${f1(a)} ${f1(b)})"/>` + flower(a, b, 7, ['#ff9ccf', '#fff', '#ffd166', '#c79bff'][i % 4]); });
    case 'roses': return `<rect x="6" y="6" width="388" height="588" rx="20" fill="none" stroke="#7ed957" stroke-width="3"/>` + edge(24, (x, y, i) => { const [a, b] = inset(x, y, 10); return rose(f1(a), f1(b), 10, ['#e53950', '#ff6f91', '#ffc2dd'][i % 3]); });
    case 'hearts': return edge(40, (x, y, i) => { const [a, b] = inset(x, y, 12); return `<path d="${heartPath(a, b - 8, 16)}" fill="${['#ff6fae', '#ffc2dd', '#fff'][i % 3]}" stroke="#fff"/>`; });
    case 'stars': return edge(40, (x, y, i) => { const [a, b] = inset(x, y, 12); return anim(`<path d="${starPath(a, b, i % 2 ? 7 : 10, i % 2 ? 3 : 4.5)}" fill="${i % 2 ? '#fff' : '#ffe680'}"/>`, 'tw', (i % 7) * 0.3); });
    case 'lace': return `<rect x="0" y="0" width="400" height="600" fill="none" stroke="#fff" stroke-width="22"/>` + edge(60, (x, y) => { const [a, b] = inset(x, y, 14); return `<circle cx="${f1(a)}" cy="${f1(b)}" r="6" fill="#fff"/><circle cx="${f1(a)}" cy="${f1(b)}" r="2.5" fill="none" stroke="#f0d0e0"/>`; });
    case 'crystal': return `<rect x="8" y="8" width="384" height="584" rx="18" fill="none" stroke="#dfe6f0" stroke-width="4"/>` + [[24, 24], [376, 24], [376, 576], [24, 576], [200, 14], [200, 586], [14, 300], [386, 300]].map(([x, y], i) => anim(gem(x, y, 14, ['#bfe9ff', '#ffd6f5', '#e6d6ff'][i % 3]), 'tw', i * 0.3)).join('');
    case 'ribbon': return `<rect x="8" y="8" width="384" height="584" rx="20" fill="none" stroke="#ff9ccf" stroke-width="10"/><rect x="8" y="8" width="384" height="584" rx="20" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="6 6"/>
      <path d="M200,16 Q160,-14 150,18 Q156,44 200,22 Q244,44 250,18 Q240,-14 200,16Z" fill="#ff6fae" stroke="#e0306f" stroke-width="2"/><circle cx="200" cy="18" r="8" fill="#e0306f"/><path d="M194,24 L180,60 L190,56 M206,24 L220,60 L210,56" stroke="#ff6fae" stroke-width="6" fill="none"/>`;
    case 'clouds': return edge(30, (x, y, i) => { const [a, b] = inset(x, y, 4); return `<circle cx="${f1(a)}" cy="${f1(b)}" r="${18 + (i % 3) * 5}" fill="#fff" opacity=".95"/>`; });
    default: return '';
  }
}
