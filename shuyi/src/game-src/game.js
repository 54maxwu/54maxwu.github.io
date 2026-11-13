// 樹義國小校園對戰：遊戲主體——載入、對局流程、主迴圈、畫面輸出
//
// 戰鬥判定在 combat.js、角色事件的音效反應在 game-events.js，兩者都掛到 Game 上。
// 除錯：window.__game 指向目前的 Game；網址參數 ?q=low|medium|high 指定畫質、?nolock 不鎖滑鼠、?autostart 直接開局
import * as THREE from 'three';
import { Renderer } from './render.js';
import { buildTextures } from './textures.js';
import { buildCampus } from '../campus-map.js';
import { CampusEnvironment as Environment } from '../campus-env.js';
import { CampusWorld as World } from '../campus-physics.js';
import { Effects } from './effects.js';
import { ViewModel } from './viewmodel.js';
import { HUD } from './hud.js';
import { audio } from './audio.js';
import { WEAPONS } from './weapons.js';
import { buildGunMerged } from './guns.js';
import { Player } from './player.js';
import { Bot, TEAM_PREFIX } from './bots.js';
import { TouchControls } from './touch.js';
import { combat } from './combat.js';
import { events } from './game-events.js';

const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => resolve()));
const MAX_STEP = 1 / 100;    // 物理每步最多 10 ms，一幀最多 4 步
const _v = new THREE.Vector3(), _u = new THREE.Vector3(), _d = new THREE.Vector3();

// 電腦玩家的主武器分配：每隊固定有一把狙擊、一把霰彈，人多時再加衝鋒槍，其餘步槍
function botPrimary(team, slot, teamSize) {
  if (slot === 1 && teamSize >= 4) return 'awm';
  if (slot === 2 && teamSize >= 4) return 'm870';
  if (slot === 3 && teamSize >= 6) return 'mp5';
  if (slot === 5) return team === 'BL' ? 'm4a1' : 'ak47';
  return team === 'BL' ? 'ak47' : 'm4a1';
}

export class Game {
  constructor() {
    this.time = 0; this.realTime = 0; this.frame = 0;
    this.playing = false; this.paused = false; this.ended = false; this.locked = false; this.inLoadout = false;
    this.actors = []; this.nades = []; this.timers = []; this.tags = [];
    this.score = { BL: 0, GR: 0 };
    this.audio = audio;
    this.qs = new URLSearchParams(location.search);
  }

  // 排程：遊戲時間到 t 時執行 fn（暫停時不會跑）
  after(t, fn) { this.timers.push({ t, fn }); }

  // ───────── 載入 ─────────

  async init() {
    this.hud = new HUD(this);
    this.opts = this.hud.opts;
    if (this.qs.get('q')) this.opts.quality = this.qs.get('q');
    const step = async (p, text) => { this.hud.loading(p, text); await nextFrame(); };

    this.hud.show('loading');
    await step(0.05, '初始化渲染器');
    this.renderer = new Renderer(document.getElementById('c'), this.opts.quality);
    this.renderer.camera.fov = this.opts.fov;

    await step(0.12, '準備槍械與角色材質');
    await nextFrame();
    this.T = buildTextures(this.opts.quality);

    await step(0.55, '搭建樹義國小');
    this.world = new World();
    this.renderer.scene.userData.camera = this.renderer.camera;
    this.map = await buildCampus(this.renderer.scene, this.world, this.renderer.renderer, document.getElementById('loadTxt'));
    this.map.prepareDestruction?.();

    await step(0.68, '校園天空與光照');
    this.env = new Environment(this.renderer.renderer, this.renderer.scene, this.opts.quality);
    this.env.extraScenes = [this.renderer.vmScene];
    this.env.apply(this.opts.tod);
    this.fx = new Effects(this.renderer.scene, this.T, this.renderer.camera);
    this.fx.world = this.world;
    this.vm = new ViewModel(this.renderer.vmScene, this.T, this.opts.team);
    this.vm.setVisible(false);

    await step(0.8, '計算尋路網格');
    this.nav = this.map.nav;
    this.hud.buildRadar(this.world);

    await step(0.88, '武器圖示／預編譯著色器');
    this.hud.setIcons(this.renderIcons());
    const cam = this.renderer.camera;
    cam.position.set(-20, 12, 30); cam.lookAt(0, 2, 0);
    try { this.renderer.renderer.compile(this.renderer.scene, cam); } catch { /* 部分瀏覽器不支援預編譯，略過 */ }

    await step(1, '完成');
    this.hud.show('menu');
    document.addEventListener('pointerlockchange', () => this.onLockChange());
    this.touch = new TouchControls(this);
    this.touchMode = this.touch.enabled;
    this.last = performance.now();
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
    if (this.qs.has('autostart')) setTimeout(() => this.startMatch(), 300);
    window.__game = this; window.__audio = audio;
  }

  // 武器圖示：用正交相機從側面拍每把槍的剪影，轉成白色 PNG
  renderIcons() {
    const r = this.renderer.renderer, W = 256, H = 96;
    const target = new THREE.WebGLRenderTarget(W, H);
    const scene = new THREE.Scene();
    scene.overrideMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 10);
    const prevColor = r.getClearColor(new THREE.Color()), prevAlpha = r.getClearAlpha();
    r.setClearColor(0x000000, 0);
    const pixels = new Uint8Array(W * H * 4), icons = {};
    for (const id of Object.keys(WEAPONS)) {
      const gun = buildGunMerged(id);
      scene.add(gun);
      const box = new THREE.Box3().setFromObject(gun);
      const cz = (box.min.z + box.max.z) / 2, cy = (box.min.y + box.max.y) / 2;
      const half = Math.max(((box.max.z - box.min.z) / 2) * 1.08, ((box.max.y - box.min.y) / 2) * 1.08 * (W / H));
      Object.assign(cam, { left: -half, right: half, top: (half * H) / W, bottom: (-half * H) / W });
      cam.position.set(2, cy, cz); cam.lookAt(0, cy, cz); cam.updateProjectionMatrix();
      r.setRenderTarget(target); r.clear(); r.render(scene, cam);
      r.readRenderTargetPixels(target, 0, 0, W, H, pixels);
      const c = document.createElement('canvas'); c.width = W; c.height = H;
      const ctx = c.getContext('2d'), img = ctx.createImageData(W, H);
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const src = ((H - 1 - y) * W + x) * 4, dst = (y * W + x) * 4;   // WebGL 的列是從下往上
        img.data[dst] = img.data[dst + 1] = img.data[dst + 2] = 245;
        img.data[dst + 3] = pixels[src + 3] > 10 ? 235 : 0;
      }
      ctx.putImageData(img, 0, 0);
      icons[id] = c.toDataURL();
      scene.remove(gun);
    }
    r.setRenderTarget(null);
    r.setClearColor(prevColor, prevAlpha);
    target.dispose();
    return icons;
  }

  // ───────── 對局流程 ─────────

  startMatch() {
    this.map.resetGlass?.();
    this.map.resetDestruction?.();
    this.fx?.clearDecals();
    const o = this.opts;
    audio.init(); audio.setVolumes({ master: o.vol }); audio.stopAmbient(); audio.playUI('start');
    this.concT = this.concK = this.flash = 0;
    this.clearActors();
    for (const n of this.nades) this.renderer.scene.remove(n.mesh);
    this.nades = []; this.timers = [];
    this.score = { BL: 0, GR: 0 };
    this.goal = o.goal; this.timeLeft = 600;
    this.env.apply(o.tod);

    const mine = o.team, theirs = mine === 'BL' ? 'GR' : 'BL';
    const count = { BL: 0, GR: 0 };
    let id = 0;
    this.player = new Player(this, { id: id++, name: '我', team: mine });
    this.player.primary = o.primary;
    this.player.bind(document.getElementById('c'));
    this.actors.push(this.player);
    for (const team of [mine, theirs]) {
      const n = team === mine ? o.size - 1 : o.size;
      for (let i = 0; i < n; i++) {
        const b = new Bot(this, { id: id++, name: `${TEAM_PREFIX[team]}${++count[team]}號`, team, diff: o.diff });
        b.primary = botPrimary(team, team === mine ? i + 1 : i, o.size);
        this.actors.push(b);
        if (team === mine) this.addNameTag(b);
      }
    }
    for (const a of this.actors) this.spawnActor(a, true);
    for (const a of this.actors) a.soldier.setRim(a.isPlayer ? 0 : a.team === mine ? 1 : 2);   // 隊友淡藍、敵人暖紅輪廓
    this.vm.setTeam(mine);
    this.vm.equip(this.player.weapon.id, 0.6);
    this.hud.slots(this.player.inv, 0);
    this.playing = true; this.paused = false; this.ended = false;
    this.hud.show(null);
    this.lock();
    setTimeout(() => audio.announce('Go go go!'), 400);
    this.hud.toast(`團隊競技・率先達到 <b style="color:#ffe066">${this.goal}</b> 擊殺的隊伍獲勝`, 3.5);
  }

  clearActors() {
    for (const a of this.actors) this.renderer.scene.remove(a.soldier.root);
    for (const t of this.tags) this.renderer.scene.remove(t.sprite);
    this.actors = []; this.tags = [];
  }

  // 隊友頭上的名牌
  addNameTag(b) {
    const c = document.createElement('canvas'); c.width = 256; c.height = 48;
    const x = c.getContext('2d');
    x.font = 'bold 30px "Microsoft JhengHei","PingFang TC","Noto Sans TC",sans-serif';
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.lineWidth = 5; x.strokeStyle = 'rgba(0,0,0,.8)'; x.strokeText(b.name, 128, 24);
    x.fillStyle = b.team === 'BL' ? '#ff9b70' : '#8cc8ff'; x.fillText(b.name, 128, 24);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true, opacity: 0.85, toneMapped: false }));
    s.scale.set(1.3, 0.244, 1);
    s.renderOrder = 20;
    this.renderer.scene.add(s);
    this.tags.push({ sprite: s, actor: b });
  }

  // 出生點：避開有人站著的點，偏好離敵人遠的點（加一點隨機）
  spawnActor(a, first) {
    let best = null, bestScore = -Infinity;
    for (const p of this.map.spawns[a.team]) {
      let score = Math.random() * 3;
      for (const o of this.actors) {
        if (!o.alive || o === a) continue;
        const d = Math.hypot(o.pos.x - p.x, o.pos.z - p.z);
        if (d < 1.2) score -= 100;
        if (o.team !== a.team) score += Math.min(d, 40) * 0.1;
      }
      if (score > bestScore) { bestScore = score; best = p; }
    }
    a.spawn(best);
    if (a instanceof Bot) a.onSpawn();
    if (a.isPlayer) {
      a.deathCam = null;
      this.vm.equip(a.weapon.id, first ? 0.6 : 0.5);
      this.vm.setVisible(true);
      this.hud.slots(a.inv, a.slot);
      audio.setLowHealth(false);
    }
  }

  lock() {
    if (this.touchMode || this.qs.has('nolock')) { this.locked = true; return; }
    const c = document.getElementById('c');
    const plain = () => { try { c.requestPointerLock(); } catch { /* 拿不到鎖定就算了 */ } };
    try {
      const p = c.requestPointerLock({ unadjustedMovement: true });   // 不受系統滑鼠加速影響
      p?.catch?.(plain);
    } catch { plain(); }
  }

  // 滑鼠鎖定被解除（按 Esc）就暫停；重新鎖定就繼續
  onLockChange() {
    this.locked = document.pointerLockElement === document.getElementById('c');
    if (this.locked) { if (this.paused) this.resume(true); }
    else if (this.playing && !this.ended && !this.inLoadout && !this.qs.has('nolock')) this.pause();
  }

  pause() { this.paused = true; this.hud.show('pause'); this.hud.scoreboard(false); }

  resume(fromLock) { this.paused = false; this.hud.show(null); if (!fromLock) this.lock(); }

  quitToMenu() {
    this.playing = false; this.paused = false; this.ended = true;
    audio.stopAmbient(); audio.setLowHealth(false);
    this.clearActors();
    this.player = null;
    this.vm.setVisible(false);
    if (document.pointerLockElement) document.exitPointerLock();
    this.hud.show('menu');
  }

  toggleLoadout() {
    if (!this.playing) return;
    if (this.inLoadout) { this.closeLoadout(); return; }
    this.inLoadout = true;
    this.hud.show('loadout');
    const current = this.player.nextPrimary || this.player.primary;
    for (const card of document.querySelectorAll('#loadCards .card')) card.classList.toggle('on', card.dataset.w === current);
    if (document.pointerLockElement) document.exitPointerLock();
  }

  closeLoadout() { this.inLoadout = false; this.hud.show(null); this.lock(); }

  // 在出生點內立刻換上；否則下次復活生效
  chooseLoadout(id) {
    const p = this.player;
    p.nextPrimary = id;
    this.opts.primary = id;
    this.hud.saveOpts();
    if (p.alive && this.map.isSpawn(p)) {
      p.primary = id;
      p.inv[0] = new (p.inv[0].constructor)(id);
      p.inv[0].patternSeed = Math.random() * 6;
      p.slot = 0;
      p.readyAt = this.time + WEAPONS[id].draw;
      p.soldier.setWeapon(id);
      this.vm.equip(id, WEAPONS[id].draw);
      this.hud.slots(p.inv, 0);
      this.hud.toast(`已換成 ${WEAPONS[id].name}`, 1.5);
    } else this.hud.toast(`復活後使用 ${WEAPONS[id].name}`, 1.5);
    audio.playUI('buy');
  }

  onOption(k, v) {
    if (k === 'vol') audio.setVolumes({ master: v });
    if (k === 'fov' && this.renderer) { this.renderer.camera.fov = v; this.renderer.camera.updateProjectionMatrix(); }
    if (k === 'tod' && this.env) this.env.apply(v);
    if (k === 'quality') { this.hud.saveOpts(); location.reload(); }   // 畫質影響貼圖與陰影，重新載入最單純
    if (k === 'team' && this.vm) this.vm.setTeam(v);
  }

  endMatch() {
    this.ended = true; this.playing = false;
    const mine = this.player.team, theirs = mine === 'BL' ? 'GR' : 'BL';
    const win = this.score[mine] === this.score[theirs] ? null : this.score[mine] > this.score[theirs];
    this.hud.endScreen(win, this.score, this.actors, this.player.id);
    audio.playUI('roundEnd'); audio.setLowHealth(false);
    audio.announce(win ? 'Mission accomplished' : win === null ? 'Draw' : 'Mission failed');
    if (document.pointerLockElement) document.exitPointerLock();
    this.vm.setVisible(false);
  }

  // ───────── 主迴圈 ─────────

  loop(now) {
    requestAnimationFrame(this.loop);
    let dt = (now - this.last) / 1000;
    this.last = now;
    if (dt <= 0) return;
    dt = Math.min(dt, 0.1);   // 切回分頁時不要一次跳太多
    this.realTime += dt;
    if (this.playing && !this.paused) {
      if (this.player) this.player.lookDX = this.player.lookDY = 0;
      // 固定小步長模擬：手感不受幀率影響；最後一步才更新角色動畫
      const steps = Math.min(4, Math.ceil(dt / MAX_STEP - 1e-6)), h = dt / steps;
      for (let i = 0; i < steps; i++) this.simulate(h, i === steps - 1 ? dt : 0);
    } else if (!this.playing) {
      // 選單背景：俯瞰校園
      const cam = this.renderer.camera, mc = this.map?.menuCam;
      if (mc) { cam.position.set(...mc.pos); cam.lookAt(...mc.look); } else { cam.position.set(123, 151, 159); cam.lookAt(0, 39, 0); }
      cam.fov = 65; cam.updateProjectionMatrix();
    }
    this.renderFrame(dt);
  }

  // 除錯用：不渲染、直接快轉模擬
  fastForward(seconds, step = 1 / 30) {
    for (let t = 0; t < seconds && this.playing; t += step) this.simulate(step);
    return { score: this.score, time: this.time.toFixed(1), kills: this.actors.map((a) => `${a.name}:${a.stats.k}/${a.stats.d}`).join(' ') };
  }

  // vis：要更新角色動畫的時間量（同一幀的前幾個小步傳 0，省掉重複的骨架計算）
  simulate(dt, vis = dt) {
    this.time += dt;
    this.timeLeft -= dt;
    for (let i = this.timers.length - 1; i >= 0; i--) {
      if (this.time < this.timers[i].t) continue;
      const { fn } = this.timers[i];
      this.timers.splice(i, 1);
      fn();
    }
    this.player.update(dt);
    for (const a of this.actors) if (!a.isPlayer) a.update(dt);
    for (const a of this.actors) this.updateBody(a, dt, vis);
    this.updateNades(dt);
    if (this.timeLeft <= 0 && !this.ended) this.endMatch();
    const cam = this.renderer.camera;
    for (const t of this.tags) {
      const a = t.actor;
      t.sprite.visible = a.alive && a.pos.distanceTo(cam.position) < 45;
      if (t.sprite.visible) { a.soldier.headWorld(t.sprite.position); t.sprite.position.y += 0.42; }
    }
  }

  // 角色外觀跟著邏輯位置走；陣亡的倒數重生
  updateBody(a, dt, vis) {
    a.radarT = Math.max(0, a.radarT - dt);
    const s = a.soldier;
    if (!a.alive) {
      a.deadT += dt;
      if (vis) s.update(vis, {});
      a.respawnT -= dt;
      if (a.respawnT <= 0 && !this.ended) this.spawnActor(a);
      return;
    }
    a.protectT = Math.max(0, a.protectT - dt);
    s.root.position.copy(a.pos);
    s.root.rotation.y = a.yaw;
    if (vis) {
      const fwd = (a.vel.x * -Math.sin(a.yaw) + a.vel.z * -Math.cos(a.yaw)) / Math.max(0.01, a.speed || 0);
      s.update(vis, { speed: a.speed || 0, fwd, crouch: a.crouch, pitch: a.pitch + a.punchP, onGround: a.onGround, reloading: a.weapon?.reloading });
    }
    if (!a.isPlayer) s.mesh.visible = !(a.protectT > 0 && Math.sin(this.time * 30) > 0.3);   // 出生保護時閃爍
  }

  // ───────── 每幀輸出 ─────────

  renderFrame(dt) {
    const R = this.renderer, cam = R.camera, p = this.player;
    if (p && this.playing) this.updateViewModel(dt, p);
    this.fx.update(dt, this.realTime, cam);
    this.env.update(dt, this.realTime, cam.position);
    this.map.update(dt, this.realTime);
    this.updateLanded();
    if (this.playing) this.debrisHits();
    this.updateRadarLabel(dt);
    audio.setListener(cam.position, _v.set(0, 0, -1).applyQuaternion(cam.quaternion), _u.set(0, 1, 0).applyQuaternion(cam.quaternion));
    audio.update(dt);
    if (p && (this.playing || this.ended)) this.updateHUD(dt);
    this.updateScreenFx(dt);
    R.render();
  }

  updateViewModel(dt, p) {
    const R = this.renderer, cam = R.camera;
    if (this.frame % 6 === 0 || this.lightK === undefined) this.probeLight();
    this.frame++;
    const sunCam = this.env.sunDir.clone().applyQuaternion(cam.quaternion.clone().invert());
    this.vm.setVisible(p.alive && !(p.scoped && p.weapon.def.type === 'sniper'));
    this.vm.update(dt, { speed: p.speed || 0, onGround: p.onGround, crouch: p.crouch, lookDX: p.lookDX, lookDY: p.lookDY, sunDirCam: sunCam, light: this.lightK, indoor: this.indoorK > 0.5 });
    R.vmScene.environmentIntensity = 0.75 * (0.35 + 0.65 * (1 - this.indoorK));
  }

  // 手上的槍要跟環境一樣亮：太陽被擋住就變暗，頭頂有遮蔽算室內
  probeLight() {
    const e = this.player.eye(_v), s = this.env.sunDir;
    const shade = this.world.raycast(e.x, e.y, e.z, s.x, s.y, s.z, 80, 'sight') ? 0.22 : 1;
    const roof = this.world.raycast(e.x, e.y, e.z, 0, 1, 0, 5, 'sight') ? 1 : 0;
    this.lightK = this.lightK === undefined ? shade : this.lightK + (shade - this.lightK) * 0.35;
    this.indoorK = this.indoorK === undefined ? roof : this.indoorK + (roof - this.indoorK) * 0.35;
  }

  // 小地圖下方：所在樓棟、樓層、堂號（資料來自 tanghao.neocities.org）＋幀率；幀率太低時提示降畫質
  updateRadarLabel(dt) {
    this.fpsAcc = (this.fpsAcc || 0) + dt;
    this.fpsN = (this.fpsN || 0) + 1;
    if (this.fpsAcc > 1) {
      this.fps = Math.round(this.fpsN / this.fpsAcc);
      this.fpsAcc = 0; this.fpsN = 0;
      if (this.playing && !this.paused && this.time > 8 && !this.fpsHinted && this.fps < 32 && this.opts.quality !== 'low') {
        this.fpsHinted = true;
        this.hud.toast('幀率偏低：可按 Esc 回主選單把畫質調成「均衡」或「流暢」', 5);
      }
    }
    this.locAcc = (this.locAcc || 0) + dt;
    if (this.locAcc < 0.3) return;
    this.locAcc = 0;
    const label = document.querySelector('#radarWrap .lbl');
    if (!label) return;
    const place = this.playing && this.player && this.map.locate ? this.map.locate(this.player.pos) : '';
    label.textContent = `${place || '樹義國小'}・${this.fps || '--'} FPS`;
  }

  updateScreenFx(dt) {
    const u = this.renderer.fx.uniforms, p = this.player;
    const alive = p?.alive && this.playing, dead = p && !p.alive && this.playing;
    this.dmgFlash = Math.max(0, (this.dmgFlash || 0) - dt * 1.6);
    this.concT = Math.max(0, (this.concT || 0) - dt); if (this.concT <= 0) this.concK = 0;
    this.suppT = Math.max(0, (this.suppT || 0) - dt); if (this.suppT <= 0) this.suppK = 0;
    this.flash = Math.max(0, (this.flash || 0) - dt * 2.2);
    const concussion = (this.concK || 0) * Math.min(1, this.concT / 1.2);
    const suppression = (this.suppK || 0) * 0.28 * (this.suppT / 0.4);
    u.uTime.value = this.realTime;
    u.uDamage.value = this.dmgFlash;
    u.uConc.value = alive ? Math.max(concussion, suppression) : 0;
    u.uFlash.value = alive ? this.flash : 0;
    u.uLowHP.value = alive ? Math.max(0, (35 - p.hp) / 35) : 0;
    u.uDeath.value = dead ? Math.min(1, p.deadT * 2) : 0;
    u.uProtect.value = alive ? Math.min(1, p.protectT) : 0;
    u.uVignette.value = 0;
  }

  updateHUD(dt) {
    const p = this.player, cam = this.renderer.camera, w = p.weapon;
    // 準星張開的像素：目前散佈角換算到螢幕
    let spreadPx = 0;
    if (w?.def.spread) {
      const s = w.def.spread;
      const run = Math.min(1, Math.max(0, ((p.speed || 0) - 1.6) / 3.4));
      const cone = Math.min(0.12, w.spreadAcc + s.base * 2 + s.move * run + (w.def.pelletSpread || 0) + (p.onGround ? 0 : s.air * 0.5)) * (p.crouch ? 0.7 : 1);
      spreadPx = (Math.tan(cone) / Math.tan(THREE.MathUtils.degToRad(cam.fov / 2))) * (window.innerHeight / 2);
    }
    // 準星指到的角色名稱（每 4 幀查一次）
    if (p.alive && this.frame % 4 === 0) {
      const o = cam.position, d = _d.set(0, 0, -1).applyQuaternion(cam.quaternion);
      const wall = this.world.raycast(o.x, o.y, o.z, d.x, d.y, d.z, 80, 'sight');
      let best = null, bestT = wall ? wall.t : 80;
      this.frame++;
      for (const a of this.actors) {
        if (a === p || !a.alive) continue;
        const r = a.soldier.hitTest(o, d, bestT, this.frame);
        if (r) { best = a; bestT = r.t; }
      }
      this.aimTarget = best;
    }
    const aim = this.aimTarget?.alive ? this.aimTarget : null;
    this.hud.update(dt, {
      score: this.score, timeLeft: this.timeLeft, goal: this.goal, myTeam: p.team,
      hp: p.hp, armor: p.armor, alive: p.alive, weapon: w, scoped: p.scoped && w.def.type === 'sniper', spreadPx,
      yaw: p.yaw, respawnIn: p.respawnT, killedBy: this.killedBy, protect: p.protectT,
      aimName: aim?.name || '', aimTeam: aim?.team || '',
    });
    this.hud.drawRadar(p, this.actors);
    const tab = p.keys.has('Tab') && this.playing && !this.paused;
    if (tab !== this.boardShown || (tab && this.frame % 20 === 0)) {
      this.boardShown = tab;
      this.hud.scoreboard(tab, this.actors, p.id, this.score);
    }
  }
}

Object.assign(Game.prototype, combat, events);
