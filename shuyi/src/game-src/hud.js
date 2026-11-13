// HUD 與選單（DOM）
import { WEAPONS, PRIMARIES } from './weapons.js';

const TEAM_CN = { BL: '女生隊', GR: '男生隊' };
const $ = (s, r = document) => r.querySelector(s);

const HS_ICON = 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><g fill="none" stroke="#ff4030" stroke-width="3"><circle cx="20" cy="20" r="11"/><path d="M20 2v10M20 28v10M2 20h10M28 20h10"/></g><circle cx="20" cy="20" r="3.5" fill="#ff4030"/></svg>`);
const WB_ICON = 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect x="15" y="4" width="10" height="32" fill="#bbb"/><path d="M2 20h36" stroke="#ffd24a" stroke-width="3"/></svg>`);
const BADGE_SVG = (color, inner) => `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="bg" cx="50%" cy="45%"><stop offset="0" stop-color="${color}" stop-opacity=".95"/><stop offset="1" stop-color="#1a0a00" stop-opacity=".9"/></radialGradient></defs><polygon points="50,3 93,27 93,73 50,97 7,73 7,27" fill="url(#bg)" stroke="#ffd24a" stroke-width="3"/>${inner}</svg>`;
const SKULL = `<g fill="#fff"><path d="M50 22c-14 0-24 9-24 22 0 8 4 13 9 16v9h30v-9c5-3 9-8 9-16 0-13-10-22-24-22z"/><rect x="40" y="66" width="4" height="8"/><rect x="48" y="66" width="4" height="8"/><rect x="56" y="66" width="4" height="8"/></g><circle cx="41" cy="45" r="6" fill="#3a1500"/><circle cx="59" cy="45" r="6" fill="#3a1500"/>`;
const CROSSHAIR_B = `<g fill="none" stroke="#fff" stroke-width="4"><circle cx="50" cy="50" r="20"/><path d="M50 18v14M50 68v14M18 50h14M68 50h14"/></g><circle cx="50" cy="50" r="5" fill="#ff3020"/>`;

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
    this.hitT = 0; this.toastT = 0;
    this.slotsT = 0;
    this.radarCtx = this.el.radar.getContext('2d');
    const touch = matchMedia('(pointer:coarse)').matches;
    this.opts = { team: 'BL', primary: 'ak47', size: 4, diff: 'normal', goal: 50, tod: 'day', quality: touch ? 'low' : 'high', sens: 1.0, fov: 78, vol: 0.8 };
    try { Object.assign(this.opts, JSON.parse(localStorage.getItem('sy_campus_opts') || '{}')); } catch (e) { /* 忽略 */ }
    this.buildMenu();
  }
  saveOpts() { try { localStorage.setItem('sy_campus_opts', JSON.stringify(this.opts)); } catch (e) { /* 忽略 */ } }

  // ---------- 選單 ----------
  buildMenu() {
    const o = this.opts;
    const segs = this.root.querySelectorAll('.seg[data-k]');
    for (const s of segs) {
      const k = s.dataset.k;
      for (const b of s.querySelectorAll('button')) {
        if (String(o[k]) === b.dataset.v) b.classList.add('on');
        b.addEventListener('click', () => {
          for (const x of s.querySelectorAll('button')) x.classList.remove('on');
          b.classList.add('on');
          o[k] = isNaN(+b.dataset.v) ? b.dataset.v : +b.dataset.v;
          this.saveOpts();
          this.g.onOption?.(k, o[k]);
          this.g.audio?.playUI('click');
        });
      }
    }
    for (const sl of this.root.querySelectorAll('.slider[data-k]')) {
      const k = sl.dataset.k, inp = sl.querySelector('input'), sp = sl.querySelector('span');
      inp.value = o[k]; sp.textContent = (+o[k]).toFixed(k === 'fov' ? 0 : 2);
      inp.addEventListener('input', () => {
        o[k] = +inp.value; sp.textContent = (+inp.value).toFixed(k === 'fov' ? 0 : 2); this.saveOpts();
        this.g.onOption?.(k, o[k]);
      });
    }
    $('#btnStart').addEventListener('click', () => this.g.startMatch());
    $('#btnResume').addEventListener('click', () => this.g.resume());
    $('#btnQuit').addEventListener('click', () => this.g.quitToMenu());
    $('#btnAgain').addEventListener('click', () => this.g.startMatch());
    $('#btnMenu').addEventListener('click', () => this.g.quitToMenu());
    for (const c of this.root.querySelectorAll('#loadCards .card')) {
      c.addEventListener('click', () => {
        this.g.chooseLoadout(c.dataset.w);
        for (const x of this.root.querySelectorAll('#loadCards .card')) x.classList.toggle('on', x === c);
      });
    }
    $('#btnLoadClose').addEventListener('click', () => this.g.closeLoadout());
    if (matchMedia('(pointer:coarse)').matches) $('#touchNote').classList.remove('hidden');
    for (const a of this.root.querySelectorAll('.mlinks a'))
      a.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });
  }
  setIcons(icons) {
    this.icons = icons;
    for (const c of this.root.querySelectorAll('#loadCards .card')) c.querySelector('img').src = icons[c.dataset.w] || '';
  }
  syncControls() {
    const o = this.opts;
    for (const s of this.root.querySelectorAll('.seg[data-k]')) for (const b of s.querySelectorAll('button')) b.classList.toggle('on', String(o[s.dataset.k]) === b.dataset.v);
    for (const sl of this.root.querySelectorAll('.slider[data-k]')) {
      const k = sl.dataset.k; sl.querySelector('input').value = o[k]; sl.querySelector('span').textContent = (+o[k]).toFixed(k === 'fov' ? 0 : 2);
    }
  }
  show(name) {
    if (name === 'menu' || name === 'pause') this.syncControls();
    for (const n of ['menu', 'pause', 'end', 'loadout', 'loading']) this.el[n].classList.toggle('hidden', n !== name);
    this.el.hud.classList.toggle('hidden', name === 'menu' || name === 'loading' || name === 'end');
  }
  loading(p, text) { this.el.loadBar.style.width = (p * 100).toFixed(0) + '%'; if (text) this.el.loadTxt.textContent = text; }

  // ---------- 局內 ----------
  update(dt, s) {
    const e = this.el;
    // 比分與時間
    e.sBL.textContent = s.score.BL; e.sGR.textContent = s.score.GR;
    const tl = Math.max(0, s.timeLeft), mm = (tl / 60) | 0, ss = (tl % 60) | 0;
    e.sTime.textContent = `${mm}:${ss < 10 ? '0' : ''}${ss}`;
    e.sGoal.textContent = `團隊競技 · 目標 ${s.goal}`;
    e.tBL.classList.toggle('mine', s.myTeam === 'BL'); e.tGR.classList.toggle('mine', s.myTeam === 'GR');
    // 生命護甲
    e.hpVal.textContent = Math.max(0, Math.ceil(s.hp));
    e.arVal.textContent = Math.max(0, Math.ceil(s.armor));
    e.hpBox.classList.toggle('low', s.hp <= 30 && s.alive);
    // 彈藥
    const w = s.weapon;
    if (w) {
      const d = w.def;
      e.wName.textContent = d.hudName;
      if (d.type === 'melee') { e.aMag.textContent = '∞'; e.aRes.textContent = ''; }
      else if (d.type === 'grenade') { e.aMag.textContent = w.mag; e.aRes.textContent = ''; }
      else { e.aMag.textContent = w.mag; e.aRes.textContent = '/ ' + w.reserve; }
      e.aMag.classList.toggle('low', d.mag > 1 && w.mag <= Math.ceil(d.mag * 0.2));
      if (this.icons[d.id] && e.wIcon.dataset.id !== d.id) { e.wIcon.src = this.icons[d.id]; e.wIcon.dataset.id = d.id; }
      e.aHint.textContent = w.reloading ? '換彈中…' : (d.mag > 1 && w.mag === 0 && w.reserve === 0 ? '彈藥耗盡' : (d.mag > 1 && w.mag === 0 ? '按 R 換彈' : ''));
    }
    // 準星
    const showX = s.alive && !s.scoped && w && w.def.type !== 'sniper';
    e.cross.style.display = showX ? '' : 'none';
    if (showX) {
      const gap = 4 + s.spreadPx;
      e.cT.style.top = -(gap + 9) + 'px'; e.cB.style.top = gap + 'px';
      e.cL.style.left = -(gap + 9) + 'px'; e.cR.style.left = gap + 'px';
    }
    e.scope.classList.toggle('on', !!s.scoped && s.alive);
    // 命中標記
    if (this.hitT > 0) { this.hitT -= dt; e.hit.style.opacity = Math.min(1, this.hitT * 5); } else e.hit.style.opacity = 0;
    // 受擊方向
    for (const d of this.dmgDirs) {
      d.t -= dt;
      const rel = d.ang - s.yaw;
      d.el.style.transform = `rotate(${-rel}rad)`;
      d.el.style.opacity = Math.max(0, Math.min(1, d.t));
      if (d.t <= 0) d.el.remove();
    }
    this.dmgDirs = this.dmgDirs.filter((d) => d.t > 0);
    // 擊殺資訊淡出
    const now = performance.now();
    this.feedItems = this.feedItems.filter((f) => { if (now - f.t > 7000) { f.el.remove(); return false; } return true; });
    // 提示
    if (this.toastT > 0) { this.toastT -= dt; if (this.toastT <= 0) e.toast.style.opacity = 0; }
    // 中央資訊
    if (!s.alive && s.respawnIn > 0) {
      e.center.classList.remove('hidden');
      e.cBig.innerHTML = s.killedBy || '你陣亡了';
      e.cSmall.textContent = `${s.respawnIn.toFixed(1)} 秒後復活 · 按 B 更換武器`;
    } else e.center.classList.add('hidden');
    e.protect.textContent = s.protect > 0 && s.alive ? `出生保護 ${s.protect.toFixed(1)}s（開火即解除）` : '';
    e.nameTip.textContent = s.aimName || ''; e.nameTip.className = s.aimTeam || '';
    if (this.slotsT > 0) { this.slotsT -= dt; e.slots.style.opacity = Math.min(1, this.slotsT * 2); } else e.slots.style.opacity = 0;
  }
  slots(inv, cur) {
    const e = this.el.slots;
    e.innerHTML = '';
    ['主武器', '副武器', '近身', '投擲'].forEach((lab, i) => {
      const w = inv[i];
      if (!w) return;
      const d = document.createElement('div');
      d.className = 's' + (i === cur ? ' on' : '');
      d.innerHTML = `<span>${w.def.name}</span><img src="${this.icons[w.id] || ''}"><b>${i + 1}</b>`;
      e.appendChild(d);
    });
    this.slotsT = 2.2;
  }
  killFeed(k, v, wid, hs, wb, mine) {
    const d = document.createElement('div');
    d.className = 'kf' + (mine ? ' me' : '');
    const icon = this.icons[wid] ? `<img src="${this.icons[wid]}">` : `<span>[${WEAPONS[wid]?.name || wid}]</span>`;
    d.innerHTML = (k ? `<span class="k ${k.team}">${esc(k.name)}</span>` : '') + icon + (wb ? `<img class="hs" src="${WB_ICON}">` : '') + (hs ? `<img class="hs" src="${HS_ICON}">` : '') + `<span class="v ${v.team}">${esc(v.name)}</span>`;
    this.el.feed.prepend(d);
    this.feedItems.push({ el: d, t: performance.now() });
    while (this.feedItems.length > 6) { const f = this.feedItems.shift(); f.el.remove(); }
  }
  hitmarker(hs, kill, armorBreak) {
    this.el.hit.className = kill ? 'kill' : hs ? 'hs' : armorBreak ? 'ab' : '';
    this.hitT = kill ? 0.45 : 0.22;
  }
  damageFrom(ang) {
    const d = document.createElement('div'); d.className = 'dd';
    this.el.dmgDirs.appendChild(d);
    this.dmgDirs.push({ el: d, ang, t: 1.4 });
  }
  badge(text, sub, headshot) {
    const b = this.el.badge;
    b.classList.remove('show'); void b.offsetWidth;
    b.querySelector('.ico').innerHTML = BADGE_SVG(headshot ? '#c0301a' : '#b8860b', headshot ? CROSSHAIR_B : SKULL);
    b.querySelector('.txt').textContent = text;
    b.querySelector('.sub').textContent = sub || '';
    b.classList.add('show');
  }
  toast(text, dur = 2.5) { const t = this.el.toast; t.innerHTML = text; t.style.opacity = 1; this.toastT = dur; }
  scoreboard(show, actors, myId, score) {
    this.el.board.classList.toggle('hidden', !show);
    if (!show) return;
    const rows = (team) => actors.filter((a) => a.team === team).sort((a, b) => b.stats.k - a.stats.k || a.stats.d - b.stats.d)
      .map((a) => `<tr class="${a.id === myId ? 'me' : ''} ${a.alive ? '' : 'dead'}"><td>${esc(a.name)}</td><td>${a.stats.k}</td><td>${a.stats.d}</td><td>${a.stats.hs}</td><td>${a.ping}</td></tr>`).join('');
    const tbl = (team) => `<table class="t${team}"><tr><th class="team">${TEAM_CN[team]} · ${score[team]}</th><th>擊殺</th><th>死亡</th><th>爆頭</th><th>延遲</th></tr>${rows(team)}</table>`;
    this.el.boardBody.innerHTML = `<div class="cols">${tbl('BL')}${tbl('GR')}</div>`;
  }
  endScreen(win, score, actors, myId) {
    this.show('end');
    const r = this.el.endRes;
    r.textContent = win === null ? '平局' : win ? '勝利' : '失敗';
    r.className = 'res ' + (win ? 'win' : 'lose');
    this.el.endSc.textContent = `女生隊 ${score.BL} : ${score.GR} 男生隊`;
    const mvp = [...actors].sort((a, b) => (b.stats.k * 2 - b.stats.d + b.stats.hs) - (a.stats.k * 2 - a.stats.d + a.stats.hs))[0];
    this.el.endMvp.textContent = mvp ? `MVP：${mvp.name}（${mvp.stats.k} 殺 / ${mvp.stats.hs} 爆頭）` : '';
    const me = actors.find((a) => a.id === myId);
    const acc = me && me.stats.shots ? ((me.stats.hits / me.stats.shots) * 100).toFixed(1) : '0';
    this.el.endMe.textContent = me ? `你的戰績：${me.stats.k} 擊殺 · ${me.stats.d} 死亡 · ${me.stats.hs} 爆頭 · 命中率 ${acc}%` : '';
    const rows = (team) => actors.filter((a) => a.team === team).sort((a, b) => b.stats.k - a.stats.k)
      .map((a) => `<tr class="${a.id === myId ? 'me' : ''}"><td>${esc(a.name)}</td><td>${a.stats.k}</td><td>${a.stats.d}</td><td>${a.stats.hs}</td></tr>`).join('');
    const tbl = (team) => `<table class="t${team}"><tr><th class="team">${TEAM_CN[team]}</th><th>擊殺</th><th>死亡</th><th>爆頭</th></tr>${rows(team)}</table>`;
    this.el.endTable.innerHTML = `<div class="cols">${tbl('BL')}${tbl('GR')}</div>`;
  }
  // ---------- 小地圖 ----------
  buildRadar(world) {
    if(this.g.map?.radar){const r=this.g.map.radar;this.radarImg=r.image;this.radarS=r.scale;this.radarX=r.x;this.radarZ=r.z;return;}

    const S = 8; // px/m
    const W = 74 * S, H = 26 * S;
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const x = c.getContext('2d');
    x.fillStyle = 'rgba(70,80,84,0.95)'; x.fillRect(0, 0, W, H);
    const cols = [...world.colliders].filter((k) => k.solid && k.top > 0.3 && k.bottom < 2 && k.hx < 30 && k.tag !== 'deck').sort((a, b) => a.top - b.top);
    for (const k of cols) {
      if (k.bullet === 'pass' && k.mat !== 'mesh') continue;
      x.save();
      x.translate((k.x + 37) * S, (k.z + 13) * S);
      x.rotate(-k.yaw);
      const hgt = k.top;
      x.fillStyle = k.mat === 'mesh' ? 'rgba(200,200,190,.5)' : hgt > 4 ? '#1d2327' : hgt > 2 ? '#2d353a' : hgt > 1.3 ? '#3b454b' : '#56616a';
      x.fillRect(-k.hx * S, -k.hz * S, k.hx * 2 * S, k.hz * 2 * S);
      x.strokeStyle = 'rgba(0,0,0,.5)'; x.lineWidth = 1;
      x.strokeRect(-k.hx * S, -k.hz * S, k.hx * 2 * S, k.hz * 2 * S);
      x.restore();
    }
    // 管道頂棚（二樓）用虛線表示
    x.strokeStyle = 'rgba(245,179,33,.35)'; x.setLineDash([6, 4]);
    x.strokeRect((-29.5 + 37) * S, (9.4 + 13) * S, 36.6 * S, 2.44 * S);
    x.strokeRect((29.5 - 36.6 + 37) * S, (-11.84 + 13) * S, 36.6 * S, 2.44 * S);
    this.radarImg = c; this.radarS = S;
  }
  drawRadar(me, actors, t) {
    const ctx = this.radarCtx, cv = this.el.radar;
    const W = cv.width = cv.clientWidth * 1.5 | 0, H = cv.height = cv.clientHeight * 1.5 | 0;
    ctx.clearRect(0, 0, W, H);
    if (!this.radarImg) return;
    const S = this.radarS, zoom = 0.55 * (W / 294);
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.rotate(me.yaw);
    ctx.scale(zoom, zoom);
    ctx.translate(-(me.pos.x + (this.radarX ?? 37)) * S, -(me.pos.z + (this.radarZ ?? 13)) * S);
    ctx.globalAlpha = 0.95;
    ctx.drawImage(this.radarImg, 0, 0);
    ctx.globalAlpha = 1;
    for (const a of actors) {
      if (a === me) continue;
      const seen = a.team === me.team || (a.radarT > 0);
      if (!seen) continue;
      const px = (a.pos.x + (this.radarX ?? 37)) * S, pz = (a.pos.z + (this.radarZ ?? 13)) * S;
      if (!a.alive) {
        if (a.team !== me.team || a.deadT > 5) continue;
        ctx.strokeStyle = '#9aa'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(px - 8, pz - 8); ctx.lineTo(px + 8, pz + 8); ctx.moveTo(px + 8, pz - 8); ctx.lineTo(px - 8, pz + 8); ctx.stroke();
        continue;
      }
      ctx.fillStyle = a.team === me.team ? '#4fb0ff' : '#ff4a3a';
      if (a.team === me.team) {
        ctx.save(); ctx.translate(px, pz); ctx.rotate(-a.yaw);
        ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(8, 9); ctx.lineTo(0, 4); ctx.lineTo(-8, 9); ctx.closePath(); ctx.fill();
        ctx.restore();
      } else {
        ctx.globalAlpha = Math.min(1, a.radarT);
        ctx.beginPath(); ctx.arc(px, pz, 9, 0, 7); ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
    ctx.restore();
    // 自己
    ctx.fillStyle = '#ffd24a';
    ctx.beginPath(); ctx.moveTo(W / 2, H / 2 - 10); ctx.lineTo(W / 2 + 7, H / 2 + 8); ctx.lineTo(W / 2, H / 2 + 4); ctx.lineTo(W / 2 - 7, H / 2 + 8); ctx.closePath(); ctx.fill();
    // 視野扇形
    const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.45);
    g.addColorStop(0, 'rgba(255,255,255,.18)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(W / 2, H / 2); ctx.arc(W / 2, H / 2, W * 0.45, -Math.PI / 2 - 0.6, -Math.PI / 2 + 0.6); ctx.closePath(); ctx.fill();
  }
}

function esc(s) { return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

const PRIM_CARDS = PRIMARIES.map((id) => {
  const d = WEAPONS[id];
  const sub = { ak47: '中距離 · 傷害高、後座大', m4a1: '中距離 · 穩定好壓', awm: '遠距離 · 一槍致命、需開鏡', mp5: '近距離 · 射速快、遠了沒力', m870: '貼臉 · 一發斃命、遠了沒用' }[id];
  // 武器定位一目了然：傷害（每發含彈丸）、射速、有效射程（傷害剩 60% 的距離）、機動
  const eff = Math.min(d.range, 10 * Math.log(0.6) / Math.log(d.falloff));
  const st = [['傷害', d.dmg * (d.pellets || 1) / 130], ['射速', d.rpm / 850], ['射程', eff / 400], ['機動', (d.speed - 0.76) / 0.26]];
  const bars = st.map(([k, v]) => `<span>${k}</span><i><em style="width:${Math.round(Math.max(0.06, Math.min(1, v)) * 100)}%"></em></i>`).join('');
  return `<div class="card" data-w="${id}"><img alt=""><b>${d.name}</b><small>${sub}</small><div class="st">${bars}</div></div>`;
}).join('');

const TEMPLATE = `
<div id="hud" class="hidden">
  <div id="score">
    <div class="team bl" id="tBL"><span class="nm">女生隊</span><span class="pts" id="sBL">0</span></div>
    <div class="mid"><div class="time" id="sTime">10:00</div><div class="goal" id="sGoal"></div></div>
    <div class="team gr" id="tGR"><span class="pts" id="sGR">0</span><span class="nm">男生隊</span></div>
  </div>
  <div id="radarWrap"><canvas id="radar"></canvas><div class="lbl">樹義國小</div></div>
  <div id="feed"></div>
  <div id="vitals">
    <div class="vbox" id="hpBox"><div class="ic">✚</div><div class="val" id="hpVal">100</div></div>
    <div class="vbox" id="arBox"><div class="ic">⛨</div><div class="val" id="arVal">100</div></div>
  </div>
  <div id="slots"></div>
  <div id="ammo"><div class="wname" id="wName"></div><div class="row"><img class="wicon" id="wIcon" alt=""><span class="mag" id="aMag">30</span><span class="res" id="aRes">/ 90</span></div><div class="hint" id="aHint"></div></div>
  <div id="cross"><i class="t" id="cT"></i><i class="b" id="cB"></i><i class="l" id="cL"></i><i class="r" id="cR"></i></div>
  <div id="hit"><i></i><i></i><i></i><i></i></div>
  <div id="dmgDirs"></div>
  <div id="scope"><div class="ring"></div><div class="h"></div><div class="v"></div><div class="h2 l"></div><div class="h2 r"></div><div class="v2"></div><div class="dot"></div></div>
  <div id="badge"><div class="ico"></div><div class="txt"></div><div class="sub"></div></div>
  <div id="center" class="hidden"><div class="big" id="cBig"></div><div class="small" id="cSmall"></div></div>
  <div id="toast"></div>
  <div id="protect"></div>
  <div id="nameTip"></div>
  <div id="board" class="hidden tbl"><h3><span>樹義國小 · 團隊競技</span><span>Tab</span></h3><div id="boardBody"></div></div>
  <div id="touch" class="hidden"></div>
</div>

<div id="loading" class="screen"><div class="t">樹 義 國 小</div><div class="s" id="loadTxt">LOADING</div><div class="bar"><i id="loadBar"></i></div><div class="tip">提示：WASD 移動，左鍵射擊，R 換彈，B 更換主武器，Esc 暫停。</div></div>

<div id="menu" class="screen hidden">
  <div class="menuBox">
    <div class="title">
      <div class="logo">校 園 對 戰 · 團 隊 競 技</div>
      <h1>樹義國小</h1>
      <div class="en">SHU YI CAMPUS</div>
      <p>依官網校園配置圖、照片與 OpenStreetMap 實際尺寸 1:1 重建的樹義國小，男生隊對女生隊的團隊對戰。<br>五層樓教室都有堂號與班級門牌，沿走廊、樓梯與中庭尋找路線，善用牆面和建築掩護。率先達成目標擊殺的隊伍獲勝。</p>
      <div class="keys">
        <kbd>W A S D</kbd><span>移動　<kbd>Shift</kbd> 靜步　<kbd>空格</kbd> 跳　<kbd>Ctrl</kbd> 蹲</span>
        <kbd>滑鼠左鍵</kbd><span>開火　<kbd>右鍵</kbd> 狙擊開鏡 / 刀重擊</span>
        <kbd>1 2 3 4</kbd><span>主武器 / 手槍 / 刀 / 手雷　<kbd>Q</kbd> 快切　<kbd>滾輪</kbd> 切換</span>
        <kbd>R</kbd><span>換彈　<kbd>F</kbd> 檢視武器　<kbd>B</kbd> 更換主武器</span>
        <kbd>Tab</kbd><span>計分板　<kbd>Esc</kbd> 暫停 / 設定</span>
      </div>
      <div class="note hidden" id="touchNote">檢測到觸屏裝置：已啟用虛擬搖桿（左側移動、右側滑動視角）。電腦 + 滑鼠體驗最佳。</div>
    </div>
    <div class="opts">
      <div class="opt"><div class="lab">陣營</div><div class="seg team" data-k="team"><button data-v="BL">女生隊<small>Girls</small></button><button data-v="GR">男生隊<small>Boys</small></button></div></div>
      <div class="opt"><div class="lab">主武器</div><div class="seg" data-k="primary"><button data-v="ak47">AK-47</button><button data-v="m4a1">M4A1</button><button data-v="awm">AWM</button><button data-v="mp5">MP5</button><button data-v="m870">M870</button></div></div>
      <div class="row2">
        <div class="opt"><div class="lab">對戰規模</div><div class="seg" data-k="size"><button data-v="4">4v4</button><button data-v="6">6v6</button><button data-v="8">8v8</button></div></div>
        <div class="opt"><div class="lab">目標擊殺</div><div class="seg" data-k="goal"><button data-v="30">30</button><button data-v="50">50</button><button data-v="100">100</button></div></div>
      </div>
      <div class="opt"><div class="lab">電腦難度</div><div class="seg" data-k="diff"><button data-v="easy">簡單</button><button data-v="normal">普通</button><button data-v="hard">困難</button><button data-v="hell">地獄</button></div></div>
      <div class="row2">
        <div class="opt"><div class="lab">時間</div><div class="seg" data-k="tod"><button data-v="day">白天</button><button data-v="dusk">黃昏</button></div></div>
        <div class="opt"><div class="lab">畫質</div><div class="seg" data-k="quality"><button data-v="low">流暢</button><button data-v="medium">均衡</button><button data-v="high">極致</button></div></div>
      </div>
      <div class="row3">
        <div class="opt"><div class="lab">靈敏度</div><div class="slider" data-k="sens"><input type="range" min="0.2" max="3" step="0.05"><span></span></div></div>
        <div class="opt"><div class="lab">視野 FOV</div><div class="slider" data-k="fov"><input type="range" min="65" max="100" step="1"><span></span></div></div>
        <div class="opt"><div class="lab">音量</div><div class="slider" data-k="vol"><input type="range" min="0" max="1" step="0.05"><span></span></div></div>
      </div>
      <button class="go" id="btnStart">開 始 遊 戲</button>
      <div class="note">點選開始後滑鼠將被鎖定，按 Esc 暫停。畫質切換會重新載入頁面。</div>
      <div class="mlinks"><span>遊戲引擎改編自</span><a href="https://github.com/riba2534/claude-opus-5-5-demo" target="_blank" rel="noopener noreferrer">riba2534/claude-opus-5-5-demo</a><span>·</span><a href="https://x.com/riba2534" target="_blank" rel="noopener noreferrer">X @riba2534</a></div>
      <div class="mlinks credits"><span>地圖資料 ©</span><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap 貢獻者（ODbL）</a><span>·</span><span>校園配置與堂號：</span><a href="https://tanghao.neocities.org/" target="_blank" rel="noopener noreferrer">臺中市南區樹義國民小學（CC BY-NC-SA）</a></div>
    </div>
  </div>
</div>

<div id="pause" class="screen hidden"><div class="pauseBox"><h2>暫停</h2>
  <div class="opt"><div class="lab">滑鼠靈敏度</div><div class="slider" data-k="sens"><input type="range" min="0.2" max="3" step="0.05"><span></span></div></div>
  <div class="opt"><div class="lab">視野 FOV</div><div class="slider" data-k="fov"><input type="range" min="65" max="100" step="1"><span></span></div></div>
  <div class="opt"><div class="lab">音量</div><div class="slider" data-k="vol"><input type="range" min="0" max="1" step="0.05"><span></span></div></div>
  <div class="opt"><div class="lab">時間</div><div class="seg" data-k="tod"><button data-v="day">白天</button><button data-v="dusk">黃昏</button></div></div>
  <button class="go" id="btnResume">繼 續</button><button class="go sec" id="btnQuit" style="margin-top:10px">退出到主選單</button>
</div></div>

<div id="loadout" class="screen hidden"><div class="loadBox"><h2>更換主武器</h2><div class="sub">復活時生效；在出生點內立即生效。副武器沙漠之鷹、軍刀、手雷自動配備。</div>
  <div class="cards" id="loadCards">${PRIM_CARDS}</div>
  <button class="go sec" id="btnLoadClose" style="margin-top:14px">確 定（B）</button>
</div></div>

<div id="end" class="screen hidden"><div class="endBox">
  <div class="res" id="endRes">勝利</div><div class="sc" id="endSc"></div><div class="mvp" id="endMvp"></div><div class="mvp" id="endMe" style="color:#dfe4e8"></div>
  <div id="endTable" class="tbl"></div>
  <div style="display:flex;gap:10px;margin-top:16px"><button class="go" id="btnAgain">再 來 一 局</button><button class="go sec" id="btnMenu">主選單</button></div>
</div></div>
`;


