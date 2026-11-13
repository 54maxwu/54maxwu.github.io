// 樹義國小校園對戰：戰鬥判定
//
// 這些方法會掛到 Game 上（Object.assign(Game.prototype, combat)），所以 this 是 Game。
// 角色、電腦玩家、破壞系統透過 game.xxx() 呼叫：
//   fireWeapon(actor, weaponState, spread)   開一槍：槍口特效、彈殼、彈道（含霰彈多顆彈丸）、曳光、擦身
//   melee(actor, heavy)                      揮刀
//   throwGrenade(actor)  updateNades(dt)  explode(pos, owner)
//   damage(victim, attacker, amount, part, cause, dir, wallbang, melee)
//   kill(victim, attacker, cause, headshot, wallbang, dir)
//   afterWreck(attacker)  updateLanded()  debrisHits()   破壞系統的連鎖反應
import * as THREE from 'three';
import { audio } from './audio.js';
import { WEAPONS, CAUSES, jitterDir } from './weapons.js';
import { buildGunMerged } from './guns.js';

// 連殺稱號：[英文播報, 中文]
const STREAK = [null, null, ['DOUBLE KILL', '雙殺'], ['TRIPLE KILL', '三殺'], ['MULTI KILL', '四殺'], ['ULTRA KILL', '五殺'], ['RAMPAGE', '六殺！'], ['UNSTOPPABLE', '無人能擋'], ['GODLIKE', '超神']];
const EJECTS_CASINGS = new Set(['rifle', 'smg', 'pistol', 'sniper', 'shotgun']);
const TEAM_TEXT = { BL: '#ff9b70', GR: '#8cc8ff' };
const titleCase = (s) => s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
const _v = new THREE.Vector3(), _w = new THREE.Vector3(), _d = new THREE.Vector3();

export const combat = {
  // ───────── 開槍 ─────────

  fireWeapon(a, ws, spread) {
    const d = ws.def;
    const eye = a.eye(new THREE.Vector3());
    const dir = jitterDir(a.forward(new THREE.Vector3()), spread, Math.random);
    const muzzle = a.isPlayer ? this.playerShotFx(a, d, dir) : this.botShotFx(a, d, dir);

    a.radarT = 1.6;   // 開槍會在敵方小地圖上短暫現形
    this.alertBots(a.pos, a.team, 45, true);

    // 霰彈：每顆彈丸各自偏移；後面的彈丸不重複播命中音效
    const pellets = d.pellets || 1;
    let end = null;
    for (let i = 0; i < pellets; i++) {
      const pd = pellets > 1 ? jitterDir(dir.clone(), d.pelletSpread, Math.random) : dir;
      this._quiet = i > 0;
      end = this.traceBullet(a, eye, pd, d);
      // 約每 3 發畫一條曳光，狙擊每發都畫，霰彈只畫第一顆
      if (i === 0 && (d.type === 'sniper' || Math.random() < 0.33)) this.fx.tracer(muzzle, end);
    }
    this._quiet = false;
    this.nearMiss(a, eye, dir, end);
  },

  // 玩家開槍：第一人稱槍口、畫面閃光、拋殼（泵動槍延遲到拉護木時才拋）
  playerShotFx(a, d, dir) {
    const cam = this.renderer.camera;
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(cam.quaternion);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(cam.quaternion);
    const muzzle = cam.position.clone().addScaledVector(dir, 0.9).addScaledVector(right, 0.14).addScaledVector(up, -0.1);
    this.vm.fire();
    this.fx.light(cam.position.clone().addScaledVector(dir, 1.2), d.type === 'sniper' ? 10 : 5, 0.06);
    audio.playShot(d.sound, null);
    if (Math.random() < 0.5) audio.playShellDrop(null);

    if (d.pump) {
      const t = this.time, same = () => a.alive && a.weapon.def === d;
      this.after(t + 0.2, () => same() && audio.playReload(d.id, 'boltback'));
      this.after(t + 0.42, () => same() && audio.playReload(d.id, 'boltforward'));
      this.after(t + 0.32, () => {
        if (!same()) return;
        const c = this.renderer.camera;
        const r = new THREE.Vector3(1, 0, 0).applyQuaternion(c.quaternion), u = new THREE.Vector3(0, 1, 0).applyQuaternion(c.quaternion);
        const f = a.forward(new THREE.Vector3());
        this.fx.casing(c.position.clone().addScaledVector(f, 0.38).addScaledVector(r, 0.15).addScaledVector(u, -0.08), r.multiplyScalar(2.2).addScaledVector(u, 1.4), d.type);
      });
    } else if (EJECTS_CASINGS.has(d.type)) {
      const at = cam.position.clone().addScaledVector(dir, 0.42).addScaledVector(right, 0.17).addScaledVector(up, -0.07);
      const v = right.clone().multiplyScalar(1.8 + Math.random() * 1.2).addScaledVector(up, 1.1 + Math.random() * 0.9).addScaledVector(dir, -0.4 + Math.random() * 0.4);
      if (a.vel) v.add(a.vel);
      this.fx.casing(at, v, d.type);
    }
    return muzzle;
  },

  // 其他角色開槍：第三人稱槍口火焰、身體後座、近處才拋彈殼
  botShotFx(a, d, dir) {
    const muzzle = a.soldier.muzzleWorld(new THREE.Vector3());
    this.fx.muzzle(muzzle, dir, d.type === 'sniper' ? 1.6 : d.type === 'smg' ? 0.8 : 1);
    a.soldier.kick();
    audio.playShot(d.sound, muzzle);
    if (EJECTS_CASINGS.has(d.type) && muzzle.distanceTo(this.renderer.camera.position) < 35) {
      const right = new THREE.Vector3(Math.cos(a.yaw), 0, -Math.sin(a.yaw));
      const at = muzzle.clone().addScaledVector(dir, -0.45).addScaledVector(right, 0.05);
      this.fx.casing(at, right.multiplyScalar(1.6 + Math.random()).add(new THREE.Vector3(0, 1.2 + Math.random() * 0.8, 0)), d.type);
    }
    return muzzle;
  },

  // 敵方子彈從玩家耳邊 1.3 m 內擦過：呼嘯聲＋短暫模糊與震動（壓制感）
  nearMiss(a, eye, dir, end) {
    const p = this.player;
    if (!p?.alive || a === p || a.team === p.team) return;
    const head = p.eye(_v);
    const along = _d.copy(head).sub(eye).dot(dir);
    if (along <= 2 || along >= eye.distanceTo(end)) return;
    const closest = eye.clone().addScaledVector(dir, along);
    const miss = closest.distanceTo(head);
    if (miss >= 1.3) return;
    const k = 1 - miss / 1.3;
    audio.playBulletWhiz(closest);
    this.suppK = Math.max(this.suppK || 0, k);
    this.suppT = 0.4;
    this.fx.shake = Math.max(this.fx.shake, 0.12 + 0.2 * k);
  },

  // 彈道：依序檢查路徑上的牆面與角色。玻璃會碎、可破壞物會被打爛、薄牆可穿透（傷害遞減）
  traceBullet(shooter, o, dir, d) {
    const range = d.range;
    const walls = this.world.raycastAll(o.x, o.y, o.z, dir.x, dir.y, dir.z, range);
    let power = d.pen, keep = 1, wallbang = false, from = 0;
    this.frame++;
    for (let i = 0; i <= walls.length; i++) {
      const h = walls[i];
      const victim = this.firstActorHit(shooter, o, dir, from, h ? h.t : range);
      if (victim) {
        const { actor, t, part } = victim;
        const pt = o.clone().addScaledVector(dir, t);
        const partMul = part === 'head' ? d.headMul : part === 'arm' || part === 'leg' ? d.limbMul : 1;
        const dmg = d.dmg * keep * Math.pow(d.falloff, t / 10) * partMul;
        const back = _v.copy(dir).negate();
        this.fx.impact(pt, back, 'flesh', dir);
        if (part === 'head') this.fx.impact(pt, back, 'flesh', dir);
        if (!this._quiet) audio.playImpact(pt, 'flesh');
        this.damage(actor, shooter, dmg, part, d.id, dir, wallbang);
        return pt;
      }
      if (!h) break;
      const c = h.collider;
      // 這發子彈途中剛被打爛的東西（例如牆的背面那層）：直接穿過，不再留彈孔
      if (c.bullet === 'pass' || (c.solid === false && c.part)) { from = h.exit; continue; }
      const pt = o.clone().addScaledVector(dir, h.t);
      const near = pt.distanceTo(this.renderer.camera.position);

      if (c.tag === 'glass' && this.map.breakGlass) {
        const pane = this.map.breakGlass(c);
        if (pane) { this.fx.shatter(pane, dir); if (near < 60) audio.playGlassBreak(pt); }
        keep *= 0.9; from = h.exit; continue;
      }

      const mat = c.mat;
      this.fx.impact(pt, new THREE.Vector3(h.nx, h.ny, h.nz), mat, dir);
      if (!this._quiet && near < 40) audio.playImpact(pt, mat === 'wood' ? 'wood' : mat === 'concrete' ? 'concrete' : 'metal');

      const wreck = this.map.damageAt?.(c, d.dmg * keep, dir);
      if (wreck) {
        this.fx.debris(wreck, dir);
        this.afterWreck(shooter);
        if (near < 70) audio.playDestroy(pt, wreck.kind);
        keep *= 0.75; from = h.exit; continue;
      }

      if (c.bullet === 'pen') {
        const cost = (h.exit - h.t) * (mat === 'wood' ? 1.0 : 1.9);   // 越厚、越硬越難穿
        if (power > cost) {
          power -= cost; keep *= 0.6; wallbang = true; from = h.exit;
          this.fx.impact(o.clone().addScaledVector(dir, h.exit), dir.clone(), mat, dir);   // 出口也留彈孔
          continue;
        }
      } else if (mat === 'metal' && Math.random() < 0.08) audio.playRicochet(pt);
      return pt;
    }
    return o.clone().addScaledVector(dir, range);
  },

  firstActorHit(shooter, o, dir, from, limit) {
    let best = null;
    for (const a of this.actors) {
      if (!a.alive || a === shooter || a.team === shooter.team) continue;
      const r = a.soldier.hitTest(o, dir, best ? best.t : limit, this.frame);
      if (r && r.t > from - 0.01 && r.t < (best ? best.t : limit)) best = { actor: a, t: r.t, part: r.part };
    }
    return best;
  },

  // ───────── 近戰 ─────────
  // 以準心為中心左右各掃兩條射線找人；命中判定延遲到刀揮到的那一刻

  melee(a, heavy) {
    const d = WEAPONS.knife;
    const range = heavy ? d.rangeHeavy : d.rangeLight;
    const eye = a.eye(new THREE.Vector3());
    const aim = a.forward(new THREE.Vector3());
    if (a.isPlayer) this.vm.melee(heavy);
    this.frame++;
    let hit = null;
    for (const off of [0, 0.12, -0.12, 0.24, -0.24]) {
      const dir = aim.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), off);
      for (const b of this.actors) {
        if (!b.alive || b === a || b.team === a.team) continue;
        const r = b.soldier.hitTest(eye, dir, range, this.frame);
        if (r && (!hit || r.t < hit.t)) hit = { actor: b, t: r.t, part: r.part, dir };
      }
      if (hit) break;
    }
    const style = heavy ? 'heavy' : 'light', from = a.isPlayer ? null : eye;
    this.after(this.time + (heavy ? 0.33 : 0.1), () => {
      if (!a.alive) return;
      if (hit?.actor.alive) {
        // 從背後刺：傷害加倍（輕擊 1.6 倍）
        const facing = hit.actor.forward(new THREE.Vector3()).setY(0).normalize();
        const behind = facing.dot(_v.copy(hit.dir).setY(0).normalize()) > 0.5;
        let dmg = heavy ? d.dmgHeavy : d.dmgLight;
        if (behind) dmg *= heavy ? 2 : 1.6;
        if (hit.part === 'head') dmg *= 1.3;
        this.fx.impact(eye.clone().addScaledVector(hit.dir, hit.t), hit.dir.clone().negate(), 'flesh', hit.dir);
        audio.playKnife(style, 'flesh', from);
        this.damage(hit.actor, a, dmg, hit.part, 'knife', hit.dir, false, true);
        return;
      }
      const w = this.world.raycast(eye.x, eye.y, eye.z, aim.x, aim.y, aim.z, range, 'bullet');
      if (!w) { audio.playKnife(style, 'miss', from); return; }
      const pt = eye.clone().addScaledVector(aim, w.t), c = w.collider;
      // 玻璃一刀就破；其他表面留刀痕，可破壞物也會累積傷害
      const pane = c.tag === 'glass' ? this.map.breakGlass?.(c) : null;
      if (pane) { this.fx.shatter(pane, aim); audio.playGlassBreak(pt); }
      else {
        this.fx.slash(pt, new THREE.Vector3(w.nx, w.ny, w.nz), c.mat, heavy);
        const wreck = this.map.damageAt?.(c, heavy ? 70 : 34, aim);
        if (wreck) { this.fx.debris(wreck, aim); audio.playDestroy(pt, wreck.kind, 0.7); }
        this.afterWreck(a);
      }
      audio.playKnife(style, 'wall', from);
    });
  },

  // ───────── 手雷 ─────────

  throwGrenade(a) {
    const eye = a.eye(new THREE.Vector3());
    const dir = a.forward(new THREE.Vector3());
    const right = new THREE.Vector3(Math.cos(a.yaw), 0, -Math.sin(a.yaw));
    const pos = eye.clone().addScaledVector(dir, 0.5).addScaledVector(right, 0.12);
    const vel = dir.clone().multiplyScalar(16).add(new THREE.Vector3(0, 2.8, 0)).addScaledVector(a.vel, 0.6);
    const mesh = buildGunMerged('he');
    mesh.scale.setScalar(1.3);
    mesh.position.copy(pos);
    this.renderer.scene.add(mesh);
    this.nades.push({ mesh, pos, vel, fuse: WEAPONS.he.fuse, owner: a, spin: new THREE.Vector3(Math.random() * 10, Math.random() * 10, 0) });
    audio.playGrenadeThrow();
    if (a.isPlayer) audio.announce('Fire in the hole!');
    this.alertBots(pos, a.team, 20, false);
  },

  // 手雷飛行：每幀分 3 小步，撞到面就沿法線反彈並損失速度；落地後滾動摩擦
  updateNades(dt) {
    this.nades = this.nades.filter((n) => {
      n.fuse -= dt;
      const h = dt / 3;
      for (let s = 0; s < 3; s++) {
        n.vel.y -= 14 * h;
        const sp = n.vel.length();
        if (sp < 1e-4) continue;
        const d = _w.copy(n.vel).divideScalar(sp);
        const hit = this.world.raycast(n.pos.x, n.pos.y, n.pos.z, d.x, d.y, d.z, sp * h + 0.07, 'move');
        if (!hit) { n.pos.addScaledVector(n.vel, h); continue; }
        const nrm = new THREE.Vector3(hit.nx, hit.ny, hit.nz);
        n.pos.addScaledVector(d, Math.max(0, hit.t - 0.07));
        const into = n.vel.dot(nrm);
        n.vel.addScaledVector(nrm, -1.45 * into).multiplyScalar(0.55);
        if (Math.abs(into) > 2) audio.playGrenadeBounce(n.pos.clone());
        if (nrm.y > 0.7 && Math.abs(n.vel.y) < 1.2) { n.vel.y = 0; n.vel.x *= 0.8; n.vel.z *= 0.8; }
        n.spin.multiplyScalar(0.6);
      }
      n.mesh.position.copy(n.pos);
      n.mesh.rotation.x += n.spin.x * dt;
      n.mesh.rotation.y += n.spin.y * dt;
      if (n.fuse > 0) return true;
      this.explode(n.pos.clone(), n.owner);
      this.renderer.scene.remove(n.mesh);
      return false;
    });
  },

  explode(p, owner) {
    const he = WEAPONS.he;
    this.fx.explosion(p);
    // 震碎附近玻璃、炸毀牆柱桌椅樹木、把課桌椅推翻
    const panes = this.map.breakGlassNear?.(p, 7) || [];
    for (const q of panes) this.fx.shatter(q, null, p);
    if (panes.length) audio.playGlassBreak(p, Math.min(1.5, 0.6 + panes.length * 0.15));
    const wrecked = this.map.blastAt?.(p, 6.5, 900) || [];
    for (const w of wrecked.slice(0, 40)) this.fx.debris(w, null, p);
    this.afterWreck(owner);
    this.map.pushAt?.(p, 10, 1);
    this.concussPlayer(p);
    if (wrecked.length) audio.playDestroy(p, wrecked[0].kind, Math.min(1.8, 0.8 + wrecked.length * 0.1));
    audio.playExplosion(p);
    this.fx.shake = Math.max(this.fx.shake, Math.max(0, 1.4 - this.renderer.camera.position.distanceTo(p) / 18));

    for (const a of this.actors) {
      if (!a.alive || (a.team === owner.team && a !== owner)) continue;
      // 以腳、胸、頭三點中離爆心最近的一點算距離；任一點沒被擋住就算直接受爆
      let dist = Infinity, dir = null, exposed = false;
      for (const c of [new THREE.Vector3(a.pos.x, a.pos.y + 0.3, a.pos.z), a.soldier.chestWorld(new THREE.Vector3()), a.soldier.headWorld(new THREE.Vector3())]) {
        const v = c.sub(p), L = v.length();
        v.divideScalar(L || 1);
        if (L < dist) { dist = L; dir = v; }
        if (!exposed && L < he.radius && !this.world.raycast(p.x, p.y + 0.2, p.z, v.x, v.y, v.z, Math.max(0, L - 0.3), 'bullet')) exposed = true;
      }
      if (dist > he.radius) continue;
      const dmg = he.dmg * Math.pow(1 - dist / he.radius, 1.1) * (exposed ? 1 : 0.3);   // 隔著掩體只吃部分衝擊
      if (dmg > 1) this.damage(a, owner, dmg, 'chest', 'he', dir, false);
    }
    this.alertBots(p, null, 40, true);
  },

  // 玩家在 14 m 內：視線被擋只算 45%；震盪時間與閃白依距離
  concussPlayer(p) {
    const pl = this.player;
    const cam = this.renderer.camera.position, dv = _v.copy(cam).sub(p), L = dv.length();
    if (!pl?.alive || L >= 14) return;
    let k = 1 - L / 14;
    if (L > 0.5 && this.world.raycast(p.x, p.y + 0.1, p.z, dv.x / L, dv.y / L, dv.z / L, L - 0.3, 'sight')) k *= 0.45;
    this.concK = Math.max(this.concK || 0, k);
    this.concT = Math.max(this.concT || 0, 1.5 + 2.5 * k);
    this.flash = Math.max(this.flash || 0, 0.85 * k * k);
  },

  // ───────── 破壞系統的連鎖 ─────────

  // 東西被打爛後：清掉上面的彈孔、讓堆在上面的殘骸掉下、留下斷口、檢查失去支撐的結構與鬆脫的玻璃（最多連鎖 8 輪）
  afterWreck(att) {
    const M = this.map;
    if (!M.takeWrecked) return;
    for (let round = 0; round < 8; round++) {
      const list = M.takeWrecked();
      if (!list.length) break;
      for (const x of list) { this.fx.clearDecalsIn(x); this.fx.wakeRubble(x); }
      for (const x of list) this.fx.remnants(x);
      M.collapse?.(list, att);
      for (const c of M.looseGlass?.(list) || []) {
        const q = M.breakGlass(c);
        if (q) { this.fx.shatter(q, new THREE.Vector3(0, -0.3, 0)); audio.playGlassBreak(new THREE.Vector3(q.x, q.y, q.z), 0.8); }
      }
    }
  },

  // 塌落的牆塊落地、翻倒的桌子撞地：碎屑、聲音、震動，正下方的人受傷
  updateLanded() {
    const events = this.map.takeLanded?.();
    if (!events?.length) return;
    const cam = this.renderer.camera.position, still = new THREE.Vector3();
    for (const L of events) {
      const i = L.info, pt = new THREE.Vector3(i.x, i.y, i.z), d = pt.distanceTo(cam);
      if (L.thud) { if (d < 40) audio.playImpact(pt, 'wood'); continue; }
      this.fx.debris(i, still);
      if (L.hit) this.fx.debris(L.hit, still);
      if (d < 80) audio.playDestroy(pt, i.kind, Math.min(1.6, 0.6 + i.sx * i.sy * i.sz * 1.5));
      this.fx.shake = Math.max(this.fx.shake, Math.max(0, 0.6 - d / 25));
      for (const a of this.actors) {
        if (!a.alive) continue;
        const under = Math.abs(a.pos.x - i.x) < i.sx / 2 + 0.3 && Math.abs(a.pos.z - i.z) < i.sz / 2 + 0.3
          && a.pos.y <= i.y + i.sy / 2 && a.pos.y + 1.8 >= i.y - i.sy / 2;
        if (under) this.damage(a, L.att && L.att !== a ? L.att : null, 30 + Math.min(70, (L.v || 0) * 8 * i.sx * i.sy * i.sz * 3), 'head', 'he', new THREE.Vector3(0, -1, 0), false);
      }
    }
    this.afterWreck(events[0].att);
  },

  // 掉落中的碎塊、碎玻璃砸到人：依重量與落速受傷（每塊只算一次，砸到後速度大減）
  debrisHits() {
    const down = new THREE.Vector3();
    const test = (list, glass) => {
      for (const c of list) {
        if (c.rest || c.hit || c.v.y > -3) continue;                   // 只算正在往下掉、夠快的
        const sx = glass ? c.s : c.s.x, sy = glass ? c.s : c.s.y, sz = glass ? c.s : c.s.z;
        if (!glass && sy < 0.25 * sx) continue;                          // 扁平的樹葉片不算
        for (const a of this.actors) {
          if (!a.alive) continue;
          const r = a.radius + Math.max(sx, sz) / 2;
          if (Math.abs(c.p.x - a.pos.x) > r || Math.abs(c.p.z - a.pos.z) > r || c.p.y < a.pos.y || c.p.y > a.pos.y + a.height + 0.15) continue;
          c.hit = true;
          if (glass) {                                                   // 一陣碎玻璃最多每 0.3 秒算一次
            if (this.time - (a._glassT ?? -9) < 0.3) break;
            a._glassT = this.time;
          }
          // 石材約 2400 kg/m³：傷害 ≈ 質量 × 速度 × 0.6，單塊上限 70；玻璃碎片小傷
          let dmg = glass ? 3 + sx * 40 : Math.min(70, sx * sy * sz * 2400 * c.v.length() * 0.6);
          if (dmg >= 2) {
            const head = c.p.y > a.pos.y + a.height - 0.35;
            if (head) dmg *= 1.6;
            this.damage(a, null, dmg, head ? 'head' : 'chest', glass ? 'glass' : 'debris', down.copy(c.v).normalize().clone(), false);
          }
          c.v.multiplyScalar(0.3);
          break;
        }
      }
    };
    test(this.fx.chunks, false);
    test(this.fx.shards, true);
  },

  // ───────── 傷害與擊殺 ─────────

  // 護甲：腿部以外的傷害有一部分由護甲吸收（依武器的穿甲比例），護甲也會被磨損
  damage(v, att, amt, part, cause, dir, wallbang, melee) {
    if (!v.alive || v.protectT > 0) return;
    if (att && att !== v && att.team === v.team) return;          // 沒有友軍傷害
    const armorBefore = v.armor, armored = armorBefore > 0 && part !== 'leg';
    let hpLoss = amt;
    if (armored) {
      const pen = WEAPONS[cause]?.armorPen ?? 0.75;
      hpLoss = amt * pen;
      v.armor = Math.max(0, v.armor - amt * (1 - pen) * 1.4);
    }
    v.hp -= hpLoss;
    v.lastAttacker = att; v.lastHurt = this.time;
    const killed = v.hp <= 0, broke = armorBefore > 0 && v.armor <= 0;
    if (att && att !== v) att.stats.hits++;

    if (!killed) {
      v.tagT = Math.max(v.tagT || 0, melee ? 0.5 : 0.3);          // 中彈減速
      if (v.onGround && !(v.slideT > 0)) { v.vel.x *= 0.6; v.vel.z *= 0.6; }
      if (!v.isPlayer) v.soldier.flinch(part);
    }
    if (v.isPlayer) {
      if (att && att !== v) this.hud.damageFrom(Math.atan2(-(att.pos.x - v.pos.x), -(att.pos.z - v.pos.z)));
      v.aimPunch += Math.min(0.05, hpLoss * 0.0012);
      audio.playHurt(Math.min(100, hpLoss));
      if (broke) audio.playArmorBreak(null);
      this.dmgFlash = Math.min(1.2, (this.dmgFlash || 0) + hpLoss / 45);
      if (v.hp <= 30 && !killed) audio.setLowHealth(true);
    } else v.onDamaged?.(att);

    if (att?.isPlayer && att !== v) {
      this.hud.hitmarker(part === 'head', killed, broke);
      if (killed || this.time - (this._hmT ?? -1) > 0.03) { audio.playHitmarker(part === 'head', armored && part !== 'head'); this._hmT = this.time; }
      if (broke && !killed) audio.playArmorBreak(v.soldier.chestWorld(new THREE.Vector3()));
    }
    if (killed) this.kill(v, att, cause, part === 'head' && !melee, wallbang, dir);
  },

  kill(v, att, cause, headshot, wallbang, dir) {
    v.alive = false; v.hp = 0; v.deadT = 0; v.respawnT = 4.0; v.stats.d++; v.scoped = 0;
    v.soldier.die(dir.x, dir.z, headshot, this.world, v.vel, dir.y || 0);
    audio.playDeath(v.soldier.chestWorld(new THREE.Vector3()));
    const p = this.player, byOther = att && att !== v;
    if (byOther) {
      att.stats.k++;
      if (headshot) att.stats.hs++;
      this.score[att.team]++;
      att.multi = this.time - att.lastKillT < 5 ? att.multi + 1 : 1;   // 5 秒內連續擊殺
      att.lastKillT = this.time;
      att.streak++;
    }
    this.hud.killFeed(byOther ? att : null, v, cause, headshot, wallbang, att === p || v === p);
    if (att === p && v !== p) this.celebrate(att, v, cause, headshot, wallbang);
    if (v === p) {
      p.startDeathCam(att);
      this.vm.setVisible(false);
      audio.setLowHealth(false);
      const weapon = WEAPONS[cause]?.name || cause;
      this.killedBy = byOther
        ? `被 <span style="color:${TEAM_TEXT[att.team]}">${att.name}</span> 用 ${weapon}${headshot ? ' <span style="color:#ff5040">爆頭</span>' : ''}擊殺`
        : CAUSES[cause]?.death || '你陣亡了';
    }
    this.fx.bloodSplat(v.pos);
    if (this.score.BL >= this.goal || this.score.GR >= this.goal) setTimeout(() => { if (this.playing) this.endMatch(); }, 1200);
  },

  // 玩家擊殺：印章＋播報（連殺優先，其次爆頭、刀殺、手雷、穿牆）
  celebrate(att, v, cause, headshot, wallbang) {
    const n = Math.min(att.multi, 8);
    let title = 'KILL', sub = `擊殺 ${v.name}`, call = null;
    if (n >= 2) { [title, sub] = [STREAK[n][0], `${STREAK[n][1]}・${sub}`]; call = titleCase(STREAK[n][0]) + '!'; }
    else if (headshot) { [title, sub, call] = ['HEADSHOT', `爆頭・${sub}`, 'Headshot!']; }
    else if (cause === 'knife') { [title, sub] = ['KNIFE KILL', `刀殺・${sub}`]; }
    else if (cause === 'he') { [title, sub] = ['GRENADE KILL', `手雷擊殺・${sub}`]; }
    else if (wallbang) { [title, sub] = ['WALLBANG', `穿牆擊殺・${sub}`]; }
    if (call) setTimeout(() => audio.announce(call), 150);
    this.hud.badge(title, sub, headshot);
    audio.playKillConfirm(headshot);
  },

  // 讓附近（radius 內）的敵方電腦聽到聲音；team 為 null 時兩隊都聽得到
  alertBots(pos, team, radius, loud) {
    for (const b of this.actors) if (b.hear && b.team !== team && b.pos.distanceTo(pos) < radius) b.hear(pos, loud);
  },
};
