// 樹義國小校園對戰：角色基底（玩家與電腦共用）——移動物理與武器狀態機
//
// 對外介面
//   new Actor(game, { id, name, team, isPlayer })
//   weapon（目前武器）、eye(out)、forward(out)
//   giveLoadout(primary)、spawn(spawnPoint)
//   move(dt, wishX, wishZ, jump, crouch, walk)   wish 為世界座標的期望方向（長度 0..1）
//   weaponUpdate(dt, { fire, firePressed, alt, altPressed, reload, sw })
//   startReload()
// 會通知 game 的事件
//   onJump onLand onSlide onMantle onFootstep onSwitch onScope onReloadStart onReloadDone
//   onDryFire onGrenadeStart、fireWeapon melee throwGrenade damage spawnActor
import * as THREE from 'three';
import { WeaponState, currentSpread, recoilKick } from './weapons.js';
import { Soldier } from './character.js';

export const STAND_H = 1.8, CROUCH_H = 1.15, EYE_STAND = 1.62, EYE_CROUCH = 1.05;

const GRAVITY = 19;          // m/s²（比真實重，跳躍比較俐落）
const JUMP_SPEED = 6.6;
const RUN_SPEED = 5.7;
const GROUND_ACCEL = 11, AIR_ACCEL = 12, AIR_MAX = 1.2;
const FRICTION = 9, STOP_SPEED = 1.5;
const SLIDE_FRICTION = 1.4, SLIDE_MIN = 2.4, SLIDE_TIME = 0.85;
const STEP_EVERY = 2.3;      // 每跑幾公尺一個腳步聲

// 墜落傷害：落地速度超過 SAFE 開始受傷，LETHAL 時剛好 100
// （g = 19 時，約 3.8 m 以下無傷、約 10 m 必死；3 樓高度約扣 40 多）
const FALL_SAFE = 12, FALL_LETHAL = 19.5;

const speedMul = (a) => (a.crouch ? 0.42 : a.walk ? 0.5 : 1) * (a.scoped ? 0.55 : 1) * (a.tagT > 0 ? 0.6 : 1);

export class Actor {
  constructor(game, { id, name, team, isPlayer = false }) {
    Object.assign(this, { game, id, name, team, isPlayer });
    this.pos = new THREE.Vector3();
    this.vel = new THREE.Vector3();
    this.radius = 0.36; this.height = STAND_H; this.stepHeight = 0.55;
    this.onGround = false; this.crouch = false; this.walk = false; this.eyeH = EYE_STAND;
    this.speed = 0;
    // 視角：yaw 水平、pitch 俯仰；punch 為後座造成的鏡頭偏移，aimPunch 為中彈抖動
    this.yaw = 0; this.pitch = 0; this.punchP = 0; this.punchY = 0; this.aimPunch = 0;
    this.hp = 100; this.armor = 100;
    this.alive = false; this.deadT = 0; this.respawnT = 0; this.protectT = 0;
    this.inv = []; this.slot = 0; this.lastSlot = 1; this.readyAt = 0;
    this.primary = 'ak47';
    this.stats = { k: 0, d: 0, hs: 0, shots: 0, hits: 0 };
    this.streak = 0; this.lastKillT = -99; this.multi = 0;
    this.radarT = 0; this.ping = 20 + ((Math.random() * 40) | 0);
    this.lastHurt = -99; this.lastAttacker = null;
    this.scoped = 0; this.scopeReady = false; this.scopeT = 0; this.reScope = 0;
    this.pendingThrow = 0; this.autoSwitchAt = 0;
    this.stepDist = 0;
    this.jumpCD = 0; this.slideCD = 0; this.mantleCD = 0; this.slideT = 0; this.tagT = 0; this.mantleS = null;
    this.soldier = new Soldier(team);
    game.renderer.scene.add(this.soldier.root);
  }

  get weapon() { return this.inv[this.slot]; }

  eye(out) { return out.set(this.pos.x, this.pos.y + this.eyeH, this.pos.z); }

  // 實際瞄準方向（含後座偏移）；yaw = 0 時面向 -Z
  forward(out) {
    const p = this.pitch + this.punchP, y = this.yaw + this.punchY, c = Math.cos(p);
    return out.set(-Math.sin(y) * c, Math.sin(p), -Math.cos(y) * c);
  }

  giveLoadout(primary) {
    if (primary) this.primary = primary;
    this.inv = [this.primary, 'deagle', 'knife', 'he'].map((id) => new WeaponState(id));
    for (const w of this.inv) w.patternSeed = Math.random() * 6;
    this.slot = 0; this.lastSlot = 1;
    this.readyAt = this.game.time + 0.3;
    this.soldier.setWeapon(this.primary);
  }

  spawn(sp) {
    this.pos.set(sp.x, (sp.y ?? 0) + 0.02, sp.z);
    this.vel.set(0, 0, 0);
    this.yaw = sp.yaw; this.pitch = 0; this.punchP = this.punchY = 0;
    this.hp = 100; this.armor = 100; this.alive = true; this.deadT = 0;
    this.crouch = false; this.height = STAND_H; this.eyeH = EYE_STAND;
    this.protectT = 3; this.onGround = true;
    this.giveLoadout(this.nextPrimary || this.primary);
    this.soldier.reset();
    this.soldier.root.position.copy(this.pos);
    this.soldier.root.visible = !this.isPlayer;
    this.scoped = 0; this.scopeReady = false;
    this.streak = 0;
    this.mantleS = null; this.slideT = 0; this.tagT = 0;
  }

  // ───────── 移動 ─────────

  move(dt, wishX, wishZ, jump, crouch, walk) {
    this.walk = walk;
    if (this.mantleS) { this.stepMantle(dt); return; }

    const crouchPressed = crouch && !this.crouch;
    this.updateStance(crouch);
    this.eyeH += ((this.crouch ? EYE_CROUCH : EYE_STAND) - this.eyeH) * Math.min(1, dt * 14);
    this.tagT = Math.max(0, this.tagT - dt);
    this.jumpCD -= dt; this.mantleCD -= dt; this.slideCD -= dt;

    const len = Math.hypot(wishX, wishZ);
    const dirX = len > 0 ? wishX / len : 0, dirZ = len > 0 ? wishZ / len : 0;
    const wishSpeed = RUN_SPEED * (this.weapon ? this.weapon.def.speed : 1) * speedMul(this) * Math.min(1, len);

    // 玩家限定的動作：攀爬（按住跳躍往前推）、滑鏟（全速時按蹲）
    if (this.isPlayer) {
      if (jump && len > 0.3 && this.mantleCD <= 0 && (this.onGround || this.vel.y < 2.5) && this.tryMantle(dirX, dirZ)) return;
      if (crouchPressed && this.onGround && !walk && this.slideCD <= 0) this.tryStartSlide();
    }
    if (this.slideT > 0) {
      this.slideT -= dt;
      if (!this.crouch || !this.onGround || Math.hypot(this.vel.x, this.vel.z) < SLIDE_MIN) this.slideT = 0;
    }

    if (this.onGround) this.groundMove(dt, dirX, dirZ, wishSpeed, jump);
    else this.accelerate(dt, dirX, dirZ, Math.min(wishSpeed, AIR_MAX), AIR_ACCEL);
    this.vel.y -= GRAVITY * dt;

    this.game.world.move(this, dt);   // 碰撞與落地（會設定 onGround、landed、landSpeed）
    this.separateFromOthers();
    if (this.landed && this.landSpeed > 3) this.onLanded(this.landSpeed);

    this.speed = Math.hypot(this.vel.x, this.vel.z);
    this.countSteps(dt);
    if (this.pos.y < -3) this.game.spawnActor(this);   // 掉出地圖就重生
  }

  // 蹲下／起身；空中蹲是收腿（身體往上縮），空中起身是放腿（往下伸）
  updateStance(crouch) {
    const W = this.game.world, legs = STAND_H - CROUCH_H - 0.1;
    if (crouch && !this.crouch) {
      this.crouch = true; this.height = CROUCH_H;
      if (!this.onGround) this.pos.y += legs;
    } else if (!crouch && this.crouch) {
      const baseY = this.onGround ? this.pos.y + 0.05 : this.pos.y - legs;
      const h = this.onGround ? STAND_H - 0.05 : STAND_H;
      if (!W.blocked(this.pos.x, baseY, this.pos.z, this.radius * 0.95, h)) {
        this.crouch = false; this.height = STAND_H;
        if (!this.onGround) this.pos.y -= legs;
      }
    }
  }

  // 朝期望方向加速，最多加到 maxSpeed（只補不足的部分，不會超速）
  accelerate(dt, dx, dz, maxSpeed, accel) {
    const along = this.vel.x * dx + this.vel.z * dz, missing = maxSpeed - along;
    if (missing <= 0) return;
    const gain = Math.min(accel * dt * maxSpeed, missing);
    this.vel.x += gain * dx; this.vel.z += gain * dz;
  }

  groundMove(dt, dx, dz, wishSpeed, jump) {
    const v = this.vel, sp = Math.hypot(v.x, v.z);
    if (sp > 0) {
      const loss = this.slideT > 0 ? sp * SLIDE_FRICTION * dt : Math.max(sp, STOP_SPEED) * FRICTION * dt;
      const k = Math.max(0, sp - loss) / sp;
      v.x *= k; v.z *= k;
    }
    if (!(this.slideT > 0)) this.accelerate(dt, dx, dz, wishSpeed, GROUND_ACCEL);
    if (jump && this.jumpCD <= 0) {
      v.y = JUMP_SPEED; this.onGround = false; this.jumpCD = 0.35; this.slideT = 0;
      this.game.onJump(this);
    }
  }

  tryStartSlide() {
    const v = this.vel, sp = Math.hypot(v.x, v.z);
    if (sp <= RUN_SPEED * 0.78) return;
    const boost = Math.max(sp * 1.22, 6.8) / sp;
    v.x *= boost; v.z *= boost;
    this.slideT = SLIDE_TIME; this.slideCD = 1.2;
    this.game.onSlide(this);
  }

  // 角色之間互相推開（只移動自己，推不動就算了）
  separateFromOthers() {
    const W = this.game.world;
    for (const o of this.game.actors) {
      if (o === this || !o.alive || Math.abs(this.pos.y - o.pos.y) >= 1.6) continue;
      const dx = this.pos.x - o.pos.x, dz = this.pos.z - o.pos.z, d2 = dx * dx + dz * dz;
      const R = this.radius + o.radius - 0.05;
      if (d2 >= R * R || d2 < 1e-6) continue;
      const d = Math.sqrt(d2), push = (R - d) / 2, nx = (dx / d) * push, nz = (dz / d) * push;
      if (!W.blocked(this.pos.x + nx, this.pos.y + 0.05, this.pos.z + nz, this.radius * 0.9, this.height - 0.1)) {
        this.pos.x += nx; this.pos.z += nz;
      }
    }
  }

  onLanded(speed) {
    this.game.onLand(this, speed);
    if (speed <= FALL_SAFE || !this.alive) return;
    const k = (speed - FALL_SAFE) / (FALL_LETHAL - FALL_SAFE);
    const dmg = Math.round(k * k * 100);
    if (dmg >= 1) this.game.damage(this, null, dmg, 'leg', 'fall', new THREE.Vector3(0, -1, 0));
  }

  countSteps(dt) {
    if (!this.onGround || this.speed <= 2.6 || this.walk || this.crouch) return;
    this.stepDist += this.speed * dt;
    if (this.stepDist > STEP_EVERY) { this.stepDist = 0; this.game.onFootstep(this); }
  }

  // ───────── 攀爬 ─────────
  // 面前 0.6～1.5 m 高的矮牆、窗台、桌子：前方要有東西擋、上面要能站、翻越路徑要有空間

  tryMantle(dx, dz) {
    const W = this.game.world, p = this.pos, r = this.radius;
    const facing = dx * -Math.sin(this.yaw) + dz * -Math.cos(this.yaw);
    if (facing < 0.5) return false;                          // 只在往前推時
    const reach = r + 0.42, tx = p.x + dx * reach, tz = p.z + dz * reach;
    const top = W.support(tx, tz, r * 0.7, p.y + 1.5);
    if (!top) return false;
    const rise = top.y - p.y;
    if (rise <= this.stepHeight + 0.05 || rise > 1.5) return false;
    const wallAhead = W.blocked(p.x + dx * (r + 0.12), p.y + this.stepHeight + 0.02, p.z + dz * (r + 0.12), r * 0.8, Math.max(0.05, rise - this.stepHeight - 0.04));
    if (!wallAhead) return false;
    if (W.blocked(p.x, p.y + 0.05, p.z, r * 0.9, rise + CROUCH_H)) return false;               // 撐起時頭頂
    if (W.blocked(p.x + dx * reach * 0.5, top.y + 0.02, p.z + dz * reach * 0.5, r * 0.85, CROUCH_H - 0.05)) return false;   // 翻越途中
    const standRoom = !W.blocked(tx, top.y + 0.02, tz, r * 0.95, STAND_H - 0.04);
    if (!standRoom) {
      if (W.blocked(tx, top.y + 0.02, tz, r * 0.95, CROUCH_H - 0.04)) return false;
      this.crouch = true; this.height = CROUCH_H;          // 上面太矮就蹲著上去
    }
    const dur = 0.24 + rise * 0.2;
    this.mantleS = { t: 0, dur, from: p.clone(), to: new THREE.Vector3(tx, top.y + 0.01, tz), dx, dz };
    this.slideT = 0; this.scoped = 0; this.scopeReady = false;
    this.readyAt = Math.max(this.readyAt, this.game.time + dur + 0.08);
    this.game.onMantle(this, rise);
    return true;
  }

  // 先把身體撐高（前 70% 時間），過一半後才往前帶上去
  stepMantle(dt) {
    const m = this.mantleS;
    m.t += dt;
    const f = Math.min(1, m.t / m.dur);
    const up = 1 - (1 - Math.min(1, f / 0.7)) ** 2;
    const fw = Math.max(0, (f - 0.35) / 0.65), ahead = fw * fw * (3 - 2 * fw);
    this.pos.set(
      m.from.x + (m.to.x - m.from.x) * ahead,
      m.from.y + (m.to.y - m.from.y) * up,
      m.from.z + (m.to.z - m.from.z) * ahead,
    );
    this.vel.set(0, 0, 0); this.onGround = false; this.speed = 0; this.landed = false;
    this.eyeH += ((this.crouch ? EYE_CROUCH : EYE_STAND) - this.eyeH) * Math.min(1, dt * 14);
    if (f < 1) return;
    this.mantleS = null; this.onGround = true; this.jumpCD = 0.3; this.mantleCD = 0.3;
    this.vel.set(m.dx * 2.4, 0, m.dz * 2.4);
    this.game.onLand(this, 3.6);
  }

  // ───────── 武器 ─────────

  weaponUpdate(dt, inp) {
    const g = this.game, now = g.time;
    this.switchTo(inp.sw, now);
    const w = this.weapon, d = w.def;
    this.recoverAim(dt, w, now);
    if (w.reloading && now >= w.reloadUntil) { w.finishReload(); g.onReloadDone(this); }
    if (d.type === 'sniper') this.updateScope(inp, w, now);
    if (now < this.readyAt) return;

    if (inp.reload && w.canReload()) this.startReload();
    if (w.reloading) return;
    if (d.type === 'melee') return this.useKnife(inp, w, now);
    if (d.type === 'grenade') return this.useGrenade(dt, inp, w, now);
    this.useGun(inp, w, now);
  }

  switchTo(slot, now) {
    if (slot === undefined || slot === null || slot === this.slot) return;
    const target = this.inv[slot];
    if (!target || (target.def.type === 'grenade' && target.mag <= 0)) return;
    this.weapon.reloadUntil = 0;                // 換槍會中斷換彈
    this.lastSlot = this.slot; this.slot = slot;
    this.readyAt = now + target.def.draw;
    this.scoped = 0; this.scopeReady = false;
    this.soldier.setWeapon(target.id);
    this.game.onSwitch(this);
  }

  // 停火後：散佈收斂、連射計數歸零、鏡頭回正
  recoverAim(dt, w, now) {
    const d = w.def, sinceShot = now - w.lastShot;
    if (d.spread) {
      if (sinceShot > (60 / d.rpm) * 1.2) w.spreadAcc *= Math.exp(-d.spread.recover * dt);
      if (sinceShot > 0.28) w.shotsFired = 0;
    }
    if (d.recoil && sinceShot > 60 / d.rpm + 0.05) {
      const k = Math.exp(-d.recoil.recover * dt);
      this.punchP *= k; this.punchY *= k;
    }
    this.aimPunch *= Math.exp(-dt * 10);
  }

  // 狙擊鏡：右鍵在 不開 → 1 段 → 2 段 之間循環；開鏡 0.18 秒後才穩定；開槍後拉完栓自動回到原本倍率
  updateScope(inp, w, now) {
    const g = this.game, free = !w.reloading && now >= w.boltUntil;
    if (inp.altPressed && now >= this.readyAt && free) {
      this.scoped = (this.scoped + 1) % 3; this.scopeT = now; this.scopeReady = false;
      g.onScope(this);
    }
    if (this.scoped && now - this.scopeT > 0.18) this.scopeReady = true;
    if (this.reScope && free) {
      this.scoped = this.reScope; this.reScope = 0; this.scopeT = now; this.scopeReady = false;
      g.onScope(this);
    }
  }

  useKnife(inp, w, now) {
    if (now < w.nextFire) return;
    const d = w.def;
    if (inp.fire) { w.nextFire = now + d.rateLight; this.game.melee(this, false); }
    else if (inp.alt) { w.nextFire = now + d.rateHeavy; this.game.melee(this, true); }
  }

  // 手雷：按下 → 拔插銷動畫 0.52 秒 → 丟出 → 0.45 秒後自動切回上一把
  useGrenade(dt, inp, w, now) {
    const g = this.game;
    if (this.pendingThrow > 0) {
      this.pendingThrow -= dt;
      if (this.pendingThrow <= 0) {
        g.throwGrenade(this);
        w.mag = 0;
        this.readyAt = now + 0.4;
        this.autoSwitchAt = now + 0.45;
      }
      return;
    }
    if (this.autoSwitchAt && now >= this.autoSwitchAt) {
      this.autoSwitchAt = 0;
      const back = this.inv[this.lastSlot] && this.lastSlot !== 3 ? this.lastSlot : 0;
      this.switchTo(back, now);
      return;
    }
    if (inp.firePressed && w.mag > 0) { this.pendingThrow = 0.52; g.onGrenadeStart(this); }
  }

  useGun(inp, w, now) {
    const g = this.game, d = w.def;
    const trigger = d.auto ? inp.fire : inp.firePressed;
    if (!trigger || now < w.nextFire || now < w.boltUntil) return;
    if (w.mag <= 0) {
      if (inp.firePressed) g.onDryFire(this);
      if (w.canReload()) this.startReload();
      return;
    }
    w.mag--;
    w.lastShot = now;
    // 連射時從上一發的預定時間接著算，射速不會因為幀率掉格
    w.nextFire = (now - w.nextFire < 0.05 ? w.nextFire : now) + 60 / d.rpm;
    this.stats.shots++;

    const spread = currentSpread(w, { speed: this.speed, onGround: this.onGround, crouch: this.crouch, scoped: this.scoped > 0, scopeReady: this.scopeReady });
    g.fireWeapon(this, w, spread);

    const [up, side] = recoilKick(w, Math.random);
    const control = this.recoilControl ?? 1;          // 電腦依難度壓槍
    this.punchP = Math.min(d.recoil.upMax, this.punchP + up * control);
    this.punchY += side * control;
    w.shotsFired++;
    if (d.spread) w.spreadAcc = Math.min(d.spread.max, w.spreadAcc + d.spread.perShot);
    this.protectT = 0;                                 // 開火就解除出生保護
    if (d.bolt) w.boltUntil = now + d.bolt;
    if (d.type === 'sniper' && this.scoped) { this.reScope = this.scoped; this.scoped = 0; this.scopeReady = false; }
    if (w.mag === 0 && !this.isPlayer && w.canReload()) this.startReload();
  }

  startReload() {
    const w = this.weapon;
    if (!w.canReload()) return;
    w.reloadUntil = this.game.time + w.def.reload;
    this.scoped = 0; this.scopeReady = false; this.reScope = 0;
    this.game.onReloadStart(this, w.mag === 0);
  }
}
