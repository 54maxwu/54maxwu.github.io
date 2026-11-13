// 樹義國小校園對戰：畫面介面（HUD）與選單
//
// 對外介面（new HUD(game)）
//   opts / saveOpts()                 設定（存在 localStorage）
//   show(name)                        menu | pause | loadout | end | loading | null（遊戲中）
//   loading(progress, text)
//   setIcons(icons)                   武器圖示（game 用槍枝模型渲染成圖片）
//   update(dt, state)                 每幀更新（state 欄位見 update 開頭註解）
//   slots(inv, cur)                   換槍時短暫顯示武器欄
//   killFeed(killer, victim, wid, headshot, wallbang, mine)
//   hitmarker(headshot, kill, armorBreak)   damageFrom(angle)   toast(html, sec)
//   badge(text, sub, headshot)        擊殺印章
//   scoreboard(show, actors, myId, score)   endScreen(win, score, actors, myId)
//   buildRadar() drawRadar(me, actors)
// 其他模組會找的元素：#c（畫布，在 index.html）、#loadTxt、#loadCards .card、#radarWrap .lbl、#touch
import { WEAPONS, PRIMARIES, CAUSES } from './weapons.js';

const TEAM_NAME = { BL: '女生隊', GR: '男生隊' };
const OPTS_KEY = 'sy_campus_opts';
const $ = (sel, root = document) => root.querySelector(sel);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const svgURL = (svg) => 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);

// 擊殺訊息小圖示：爆頭（準心）、穿牆（被子彈穿過的磚牆）
const ICON_HEADSHOT = svgURL('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><circle cx="20" cy="20" r="12" fill="none" stroke="#ff5a4a" stroke-width="3"/><path d="M20 3v9M20 28v9M3 20h9M28 20h9" stroke="#ff5a4a" stroke-width="3"/><circle cx="20" cy="20" r="4" fill="#ff5a4a"/></svg>');
const ICON_WALLBANG = svgURL('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><g fill="#b4533d" stroke="#5b2a1f" stroke-width="1"><rect x="13" y="4" width="14" height="9"/><rect x="13" y="14" width="14" height="9"/><rect x="13" y="24" width="14" height="9"/></g><path d="M2 19h36" stroke="#ffe066" stroke-width="3" stroke-dasharray="5 3"/></svg>');

// 擊殺印章：仿老師批改作業的紅色圓章，中間寫字
const STAMP = (word, color) => `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
  <defs><filter id="ink"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.6 1.3"/><feComposite in="SourceGraphic" operator="in"/></filter></defs>
  <g filter="url(#ink)" fill="none" stroke="${color}">
    <circle cx="60" cy="60" r="52" stroke-width="7"/><circle cx="60" cy="60" r="42" stroke-width="2.5"/>
    <text x="60" y="76" text-anchor="middle" font-size="44" font-weight="900" fill="${color}" stroke="none" font-family="Microsoft JhengHei,PingFang TC,Noto Sans TC,sans-serif">${word}</text>
  </g></svg>`;

// 主武器卡片的定位說明與數據條
const ROLE = {
  ak47: '中距離 · 傷害高、後座大', m4a1: '中距離 · 穩定好壓', awm: '遠距離 · 一槍致命、需開鏡',
  mp5: '近距離 · 射速快、遠了沒力', m870: '貼臉 · 一發斃命、遠了沒用',
};
function weaponCard(id) {
  const d = WEAPONS[id];
  // 有效射程：傷害衰減到 60% 的距離
  const reach = Math.min(d.range, (10 * Math.log(0.6)) / Math.log(d.falloff));
  const stats = [['傷害', (d.dmg * (d.pellets || 1)) / 130], ['射速', d.rpm / 850], ['射程', reach / 400], ['機動', (d.speed - 0.76) / 0.26]];
  const bars = stats.map(([k, v]) => `<span>${k}</span><i><em style="width:${Math.round(Math.max(0.06, Math.min(1, v)) * 100)}%"></em></i>`).join('');
  return `<button class="card" data-w="${id}"><img alt=""><b>${d.name}</b><small>${ROLE[id] || ''}</small><div class="st">${bars}</div></button>`;
}

const seg = (key, items, cls = '') => `<div class="seg ${cls}" data-k="${key}">${items.map(([v, label, sub]) => `<button data-v="${v}">${label}${sub ? `<small>${sub}</small>` : ''}</button>`).join('')}</div>`;
const slider = (key, min, max, step) => `<div class="slider" data-k="${key}"><input type="range" min="${min}" max="${max}" step="${step}"><span></span></div>`;
const field = (label, body) => `<div class="opt"><div class="lab">${label}</div>${body}</div>`;

const SENS = field('滑鼠靈敏度', slider('sens', 0.2, 3, 0.05));
const FOV = field('視野 FOV', slider('fov', 65, 100, 1));
const VOL = field('音量', slider('vol', 0, 1, 0.05));
const TOD = field('時間', seg('tod', [['day', '白天'], ['dusk', '黃昏']]));

const TEMPLATE = `
<div id="hud" class="hidden">
  <div id="score">
    <div class="team BL" id="tBL"><span class="nm">女生隊</span><b id="sBL">0</b></div>
    <div class="clock"><div id="sTime">10:00</div><small id="sGoal"></small></div>
    <div class="team GR" id="tGR"><b id="sGR">0</b><span class="nm">男生隊</span></div>
  </div>
  <div id="radarWrap"><canvas id="radar"></canvas><div class="lbl">樹義國小</div></div>
  <div id="feed"></div>
  <div id="vitals">
    <div class="pill" id="hpBox"><i class="ic">✚</i><b id="hpVal">100</b></div>
    <div class="pill" id="arBox"><i class="ic">⛨</i><b id="arVal">100</b></div>
  </div>
  <div id="slots"></div>
  <div id="ammo"><div class="wname" id="wName"></div><div class="row"><img class="wicon" id="wIcon" alt=""><b id="aMag">30</b><span id="aRes">/ 90</span></div><div class="hint" id="aHint"></div></div>
  <div id="cross"><i id="cT"></i><i id="cB"></i><i id="cL"></i><i id="cR"></i></div>
  <div id="hit"><i></i><i></i><i></i><i></i></div>
  <div id="dmgDirs"></div>
  <div id="scope"><div class="lens"></div><div class="reticle"></div></div>
  <div id="badge"><div class="ico"></div><div class="txt"></div><div class="sub"></div></div>
  <div id="center" class="hidden"><div class="big" id="cBig"></div><div class="small" id="cSmall"></div></div>
  <div id="toast"></div>
  <div id="protect"></div>
  <div id="nameTip"></div>
  <div id="board" class="hidden tbl"><h3><span>樹義國小 · 團隊競技</span><kbd>Tab</kbd></h3><div id="boardBody"></div></div>
  <div id="touch" class="hidden"></div>
</div>

<div id="loading" class="screen">
  <div class="chalk-title">樹義國小</div>
  <div class="s" id="loadTxt">載入中</div>
  <div class="bar"><i id="loadBar"></i></div>
  <div class="tip">WASD 移動・左鍵射擊・R 換彈・B 換主武器・Esc 暫停</div>
</div>

<div id="menu" class="screen hidden">
  <div class="board-frame">
    <section class="intro">
      <div class="kicker">校園對戰・團隊競技</div>
      <h1 class="chalk-title">樹義國小</h1>
      <p>依官網校園配置圖、照片與 OpenStreetMap 實際尺寸，1:1 重建臺中市樹義國小。女生隊對男生隊，五層樓教室都有堂號與班級門牌；沿走廊、樓梯與中庭找路線，善用牆面掩護，先達到目標擊殺數的隊伍獲勝。</p>
      <dl class="keys">
        <dt><kbd>W A S D</kbd></dt><dd>移動　<kbd>Shift</kbd> 靜步　<kbd>空白</kbd> 跳　<kbd>Ctrl</kbd> 蹲／衝刺中滑鏟</dd>
        <dt><kbd>左鍵</kbd></dt><dd>開火　<kbd>右鍵</kbd> 狙擊開鏡／刀重擊</dd>
        <dt><kbd>1 2 3 4</kbd></dt><dd>主武器／手槍／刀／手雷　<kbd>Q</kbd> 快切　<kbd>滾輪</kbd> 切換</dd>
        <dt><kbd>R</kbd></dt><dd>換彈　<kbd>F</kbd> 檢視武器　<kbd>B</kbd> 換主武器</dd>
        <dt><kbd>Tab</kbd></dt><dd>計分板　<kbd>Esc</kbd> 暫停／設定</dd>
      </dl>
      <div class="note hidden" id="touchNote">偵測到觸控裝置：左半邊拖曳移動、右半邊拖曳轉視角。用電腦加滑鼠玩體驗最好。</div>
    </section>
    <section class="opts">
      ${field('隊伍', seg('team', [['BL', '女生隊', '制服'], ['GR', '男生隊', '體育服']], 'team'))}
      ${field('主武器', seg('primary', PRIMARIES.map((id) => [id, WEAPONS[id].name])))}
      <div class="row2">
        ${field('人數', seg('size', [[4, '4v4'], [6, '6v6'], [8, '8v8']]))}
        ${field('目標擊殺', seg('goal', [[30, '30'], [50, '50'], [100, '100']]))}
      </div>
      ${field('電腦難度', seg('diff', [['easy', '簡單'], ['normal', '普通'], ['hard', '困難'], ['hell', '地獄']]))}
      <div class="row2">
        ${TOD}
        ${field('畫質', seg('quality', [['low', '流暢'], ['medium', '均衡'], ['high', '極致']]))}
      </div>
      <div class="row3">${field('靈敏度', slider('sens', 0.2, 3, 0.05))}${FOV}${VOL}</div>
      <button class="go" id="btnStart">開始上課</button>
      <div class="note">按下開始後滑鼠會被鎖定，按 Esc 暫停。切換畫質會重新載入頁面。</div>
    </section>
  </div>
</div>

<div id="pause" class="screen hidden"><div class="panel"><h2>下課時間</h2>
  ${SENS}${FOV}${VOL}${TOD}
  <button class="go" id="btnResume">繼續</button>
  <button class="go sec" id="btnQuit">回主選單</button>
</div></div>

<div id="loadout" class="screen hidden"><div class="panel wide"><h2>換主武器</h2>
  <div class="sub">在出生點內立即換上，否則下次復活生效。手槍、軍刀、手雷固定配備。</div>
  <div class="cards" id="loadCards">${PRIMARIES.map(weaponCard).join('')}</div>
  <button class="go sec" id="btnLoadClose">確定（B）</button>
</div></div>

<div id="end" class="screen hidden"><div class="panel wide">
  <div class="res" id="endRes"></div><div class="sc" id="endSc"></div>
  <div class="mvp" id="endMvp"></div><div class="mvp me" id="endMe"></div>
  <div id="endTable" class="tbl"></div>
  <div class="btns"><button class="go" id="btnAgain">再來一局</button><button class="go sec" id="btnMenu">主選單</button></div>
</div></div>
`;

export class HUD {
  constructor(game) {
    this.g = game;
    this.root = $('#ui');
    this.root.innerHTML = TEMPLATE;
    this.el = {};
    for (const n of this.root.querySelectorAll('[id]')) this.el[n.id] = n;
    this.icons = {};
    this.feedItems = [];
    this.dmgDirs = [];
    this.hitT = 0; this.toastT = 0; this.slotsT = 0;
    this.radarCtx = this.el.radar.getContext('2d');
    const touch = matchMedia('(pointer:coarse)').matches;
    this.opts = { team: 'BL', primary: 'ak47', size: 4, diff: 'normal', goal: 50, tod: 'day', quality: touch ? 'low' : 'high', sens: 1.0, fov: 78, vol: 0.8 };
    try { Object.assign(this.opts, JSON.parse(localStorage.getItem(OPTS_KEY) || '{}')); } catch { /* 無痕模式等情況讀不到就用預設 */ }
    this.wireMenu(touch);
  }

  saveOpts() {
    try { localStorage.setItem(OPTS_KEY, JSON.stringify(this.opts)); } catch { /* 存不了就算了 */ }
  }

  // ───────── 選單 ─────────

  setOpt(k, raw) {
    this.opts[k] = isNaN(+raw) ? raw : +raw;
    this.saveOpts();
    this.g.onOption?.(k, this.opts[k]);
  }

  wireMenu(touch) {
    for (const s of this.root.querySelectorAll('.seg[data-k]')) {
      s.addEventListener('click', (e) => {
        const b = e.target.closest('button');
        if (!b) return;
        this.setOpt(s.dataset.k, b.dataset.v);
        this.syncControls();
      });
    }
    for (const sl of this.root.querySelectorAll('.slider[data-k]')) {
      const input = sl.querySelector('input');
      input.addEventListener('input', () => { this.setOpt(sl.dataset.k, input.value); this.syncControls(); });
    }
    const on = (id, fn) => this.el[id].addEventListener('click', fn);
    on('btnStart', () => this.g.startMatch());
    on('btnResume', () => this.g.resume());
    on('btnQuit', () => this.g.quitToMenu());
    on('btnAgain', () => this.g.startMatch());
    on('btnMenu', () => this.g.quitToMenu());
    on('btnLoadClose', () => this.g.closeLoadout());
    this.el.loadCards.addEventListener('click', (e) => {
      const c = e.target.closest('.card');
      if (!c) return;
      this.g.chooseLoadout(c.dataset.w);
      for (const x of this.el.loadCards.children) x.classList.toggle('on', x === c);
    });
    if (touch) this.el.touchNote.classList.remove('hidden');
    // 觸控時連結要能點（不被遊戲的觸控處理吃掉）
    for (const a of this.root.querySelectorAll('.mlinks a')) a.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });
    this.syncControls();
  }

  // 依目前設定更新所有選單按鈕與滑桿（主選單、暫停選單共用同一組設定）
  syncControls() {
    const o = this.opts;
    for (const s of this.root.querySelectorAll('.seg[data-k]')) {
      for (const b of s.querySelectorAll('button')) b.classList.toggle('on', String(o[s.dataset.k]) === b.dataset.v);
    }
    for (const sl of this.root.querySelectorAll('.slider[data-k]')) {
      const k = sl.dataset.k;
      sl.querySelector('input').value = o[k];
      sl.querySelector('span').textContent = (+o[k]).toFixed(k === 'fov' ? 0 : 2);
    }
  }

  setIcons(icons) {
    this.icons = icons;
    for (const c of this.el.loadCards.children) c.querySelector('img').src = icons[c.dataset.w] || '';
  }

  show(name) {
    if (name === 'menu' || name === 'pause') this.syncControls();
    for (const n of ['menu', 'pause', 'end', 'loadout', 'loading']) this.el[n].classList.toggle('hidden', n !== name);
    this.el.hud.classList.toggle('hidden', name === 'menu' || name === 'loading' || name === 'end');
  }

  loading(p, text) {
    this.el.loadBar.style.width = `${Math.round(p * 100)}%`;
    if (text) this.el.loadTxt.textContent = text;
  }

  // ───────── 遊戲中 ─────────
  // state：score timeLeft goal myTeam hp armor alive weapon scoped spreadPx yaw respawnIn killedBy protect aimName aimTeam

  update(dt, s) {
    const e = this.el;
    e.sBL.textContent = s.score.BL;
    e.sGR.textContent = s.score.GR;
    const left = Math.max(0, s.timeLeft), m = Math.floor(left / 60), sec = Math.floor(left % 60);
    e.sTime.textContent = `${m}:${String(sec).padStart(2, '0')}`;
    e.sGoal.textContent = `先到 ${s.goal} 殺獲勝`;
    e.tBL.classList.toggle('mine', s.myTeam === 'BL');
    e.tGR.classList.toggle('mine', s.myTeam === 'GR');

    e.hpVal.textContent = Math.max(0, Math.ceil(s.hp));
    e.arVal.textContent = Math.max(0, Math.ceil(s.armor));
    e.hpBox.classList.toggle('low', s.hp <= 30 && s.alive);
    e.hpBox.style.setProperty('--fill', `${Math.max(0, Math.min(100, s.hp))}%`);
    e.arBox.style.setProperty('--fill', `${Math.max(0, Math.min(100, s.armor))}%`);

    this.updateAmmo(s.weapon);
    this.updateCrosshair(s);

    if (this.hitT > 0) { this.hitT -= dt; e.hit.style.opacity = Math.min(1, this.hitT * 5); } else e.hit.style.opacity = 0;

    for (const d of this.dmgDirs) {
      d.t -= dt;
      d.el.style.transform = `rotate(${-(d.ang - s.yaw)}rad)`;
      d.el.style.opacity = Math.max(0, Math.min(1, d.t));
      if (d.t <= 0) d.el.remove();
    }
    this.dmgDirs = this.dmgDirs.filter((d) => d.t > 0);

    const now = performance.now();
    this.feedItems = this.feedItems.filter((f) => (now - f.t > 7000 ? (f.el.remove(), false) : true));

    if (this.toastT > 0 && (this.toastT -= dt) <= 0) e.toast.style.opacity = 0;

    const dead = !s.alive && s.respawnIn > 0;
    e.center.classList.toggle('hidden', !dead);
    if (dead) {
      e.cBig.innerHTML = s.killedBy || '你陣亡了';
      e.cSmall.textContent = `${s.respawnIn.toFixed(1)} 秒後復活・按 B 換主武器`;
    }
    e.protect.textContent = s.protect > 0 && s.alive ? `出生保護 ${s.protect.toFixed(1)} 秒（開火即解除）` : '';
    e.nameTip.textContent = s.aimName || '';
    e.nameTip.className = s.aimTeam || '';
    if (this.slotsT > 0) { this.slotsT -= dt; e.slots.style.opacity = Math.min(1, this.slotsT * 2); } else e.slots.style.opacity = 0;
  }

  updateAmmo(w) {
    const e = this.el;
    if (!w) return;
    const d = w.def;
    e.wName.textContent = d.hudName;
    if (d.type === 'melee') { e.aMag.textContent = '∞'; e.aRes.textContent = ''; }
    else { e.aMag.textContent = w.mag; e.aRes.textContent = d.type === 'grenade' ? '' : `/ ${w.reserve}`; }
    e.aMag.classList.toggle('low', d.mag > 1 && w.mag <= Math.ceil(d.mag * 0.2));
    if (this.icons[d.id] && e.wIcon.dataset.id !== d.id) { e.wIcon.src = this.icons[d.id]; e.wIcon.dataset.id = d.id; }
    const empty = d.mag > 1 && w.mag === 0;
    e.aHint.textContent = w.reloading ? '換彈中…' : empty && w.reserve === 0 ? '彈藥耗盡' : empty ? '按 R 換彈' : '';
  }

  // 準星四條線隨散佈張開；狙擊槍、開鏡時不顯示
  updateCrosshair(s) {
    const e = this.el, w = s.weapon;
    const show = s.alive && !s.scoped && w && w.def.type !== 'sniper';
    e.cross.style.display = show ? '' : 'none';
    if (show) e.cross.style.setProperty('--gap', `${4 + s.spreadPx}px`);
    e.scope.classList.toggle('on', !!s.scoped && s.alive);
  }

  slots(inv, cur) {
    const box = this.el.slots;
    box.innerHTML = inv.map((w, i) => (w ? `<div class="s${i === cur ? ' on' : ''}"><span>${w.def.name}</span><img src="${this.icons[w.id] || ''}" alt=""><b>${i + 1}</b></div>` : '')).join('');
    this.slotsT = 2.2;
  }

  killFeed(killer, victim, wid, headshot, wallbang, mine) {
    const row = document.createElement('div');
    row.className = 'kf' + (mine ? ' me' : '');
    const weapon = this.icons[wid] ? `<img src="${this.icons[wid]}" alt="">` : `<span class="cause">${WEAPONS[wid]?.name || CAUSES[wid]?.name || wid}</span>`;
    row.innerHTML = (killer ? `<span class="${killer.team}">${esc(killer.name)}</span>` : '') + weapon
      + (wallbang ? `<img class="tag" src="${ICON_WALLBANG}" alt="穿牆">` : '')
      + (headshot ? `<img class="tag" src="${ICON_HEADSHOT}" alt="爆頭">` : '')
      + `<span class="${victim.team}">${esc(victim.name)}</span>`;
    this.el.feed.prepend(row);
    this.feedItems.push({ el: row, t: performance.now() });
    while (this.feedItems.length > 6) this.feedItems.shift().el.remove();
  }

  hitmarker(headshot, kill, armorBreak) {
    this.el.hit.className = kill ? 'kill' : headshot ? 'hs' : armorBreak ? 'ab' : '';
    this.hitT = kill ? 0.45 : 0.22;
  }

  damageFrom(ang) {
    const d = document.createElement('div');
    d.className = 'dd';
    this.el.dmgDirs.appendChild(d);
    this.dmgDirs.push({ el: d, ang, t: 1.4 });
  }

  badge(text, sub, headshot) {
    const b = this.el.badge;
    b.classList.remove('show');
    void b.offsetWidth;   // 重新觸發動畫
    b.querySelector('.ico').innerHTML = STAMP(headshot ? '爆頭' : '擊殺', headshot ? '#d42a1e' : '#c0392b');
    b.querySelector('.txt').textContent = text;
    b.querySelector('.sub').textContent = sub || '';
    b.classList.add('show');
  }

  toast(html, dur = 2.5) {
    this.el.toast.innerHTML = html;
    this.el.toast.style.opacity = 1;
    this.toastT = dur;
  }

  teamTables(actors, myId, cols, header) {
    const table = (team) => {
      const rows = actors.filter((a) => a.team === team)
        .sort((a, b) => b.stats.k - a.stats.k || a.stats.d - b.stats.d)
        .map((a) => `<tr class="${a.id === myId ? 'me' : ''}${a.alive === false && cols.includes('ping') ? ' dead' : ''}"><td>${esc(a.name)}</td>${cols.map((c) => `<td>${c === 'ping' ? a.ping : a.stats[c]}</td>`).join('')}</tr>`).join('');
      return `<table class="t${team}"><tr><th class="team">${header(team)}</th>${cols.map((c) => `<th>${{ k: '擊殺', d: '死亡', hs: '爆頭', ping: '延遲' }[c]}</th>`).join('')}</tr>${rows}</table>`;
    };
    return `<div class="cols">${table('BL')}${table('GR')}</div>`;
  }

  scoreboard(show, actors, myId, score) {
    this.el.board.classList.toggle('hidden', !show);
    if (show) this.el.boardBody.innerHTML = this.teamTables(actors, myId, ['k', 'd', 'hs', 'ping'], (t) => `${TEAM_NAME[t]}・${score[t]}`);
  }

  endScreen(win, score, actors, myId) {
    this.show('end');
    const e = this.el;
    e.endRes.textContent = win === null ? '平手' : win ? '勝利' : '落敗';
    e.endRes.className = 'res ' + (win ? 'win' : 'lose');
    e.endSc.textContent = `女生隊 ${score.BL} : ${score.GR} 男生隊`;
    const rating = (a) => a.stats.k * 2 - a.stats.d + a.stats.hs;
    const mvp = [...actors].sort((a, b) => rating(b) - rating(a))[0];
    e.endMvp.textContent = mvp ? `本局 MVP：${mvp.name}（${mvp.stats.k} 殺／${mvp.stats.hs} 爆頭）` : '';
    const me = actors.find((a) => a.id === myId);
    const acc = me?.stats.shots ? ((me.stats.hits / me.stats.shots) * 100).toFixed(1) : '0';
    e.endMe.textContent = me ? `你的成績：${me.stats.k} 擊殺・${me.stats.d} 死亡・${me.stats.hs} 爆頭・命中率 ${acc}%` : '';
    e.endTable.innerHTML = this.teamTables(actors, myId, ['k', 'd', 'hs'], (t) => TEAM_NAME[t]);
  }

  // ───────── 小地圖 ─────────
  // 校園地圖提供俯視圖（radar.image）與座標換算（每公尺 scale 像素、世界原點在圖上 x/z）

  buildRadar() {
    const r = this.g.map?.radar;
    if (!r) return;
    this.radar = { img: r.image, s: r.scale, x: r.x, z: r.z };
  }

  drawRadar(me, actors = this.g.actors || []) {
    const ctx = this.radarCtx, cv = this.el.radar;
    const W = (cv.width = Math.round(cv.clientWidth * 1.5)), H = (cv.height = Math.round(cv.clientHeight * 1.5));
    ctx.clearRect(0, 0, W, H);
    const R = this.radar;
    if (!R) return;
    const toMap = (p) => [(p.x + R.x) * R.s, (p.z + R.z) * R.s];
    const zoom = 0.55 * (W / 294);
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.rotate(me.yaw);                // 地圖跟著自己的朝向轉，上方永遠是前方
    ctx.scale(zoom, zoom);
    const [mx, mz] = toMap(me.pos);
    ctx.translate(-mx, -mz);
    ctx.globalAlpha = 0.95;
    ctx.drawImage(R.img, 0, 0);
    ctx.globalAlpha = 1;
    for (const a of actors) {
      if (a === me) continue;
      const ally = a.team === me.team;
      if (!ally && !(a.radarT > 0)) continue;   // 敵人只在開槍後短暫出現
      const [px, pz] = toMap(a.pos);
      if (!a.alive) {
        if (!ally || a.deadT > 5) continue;
        ctx.strokeStyle = '#a9b4b0'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(px - 8, pz - 8); ctx.lineTo(px + 8, pz + 8); ctx.moveTo(px + 8, pz - 8); ctx.lineTo(px - 8, pz + 8); ctx.stroke();
        continue;
      }
      if (ally) {
        ctx.fillStyle = '#5fb8ff';
        ctx.save(); ctx.translate(px, pz); ctx.rotate(-a.yaw);
        ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(8, 9); ctx.lineTo(0, 4); ctx.lineTo(-8, 9); ctx.closePath(); ctx.fill();
        ctx.restore();
      } else {
        ctx.fillStyle = '#ff5a4a';
        ctx.globalAlpha = Math.min(1, a.radarT);
        ctx.beginPath(); ctx.arc(px, pz, 9, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
    ctx.restore();
    // 視野扇形與自己的箭頭（固定在中央、朝上）
    const cx = W / 2, cy = H / 2;
    const fan = ctx.createRadialGradient(cx, cy, 0, cx, cy, W * 0.45);
    fan.addColorStop(0, 'rgba(255,240,180,.22)'); fan.addColorStop(1, 'rgba(255,240,180,0)');
    ctx.fillStyle = fan;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, W * 0.45, -Math.PI / 2 - 0.6, -Math.PI / 2 + 0.6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffe066';
    ctx.beginPath(); ctx.moveTo(cx, cy - 10); ctx.lineTo(cx + 7, cy + 8); ctx.lineTo(cx, cy + 4); ctx.lineTo(cx - 7, cy + 8); ctx.closePath(); ctx.fill();
  }
}
