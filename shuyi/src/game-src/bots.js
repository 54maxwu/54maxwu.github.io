// 樹義國小校園對戰：電腦玩家
//
// 對外介面
//   new Bot(game, { id, name, team, diff })   diff：easy | normal | hard | hell
//   onSpawn()        重生時重設狀態、挑第一個目的地
//   hear(pos, loud)  聽到槍聲、腳步、爆炸
//   onDamaged(att)   中彈（準心被打偏、轉向攻擊者）
//   update(dt)       每個模擬步呼叫
//   stage            已完成的目的地數（校園地圖 pickBotGoal 用：第一趟有一半機率直奔敵方出生點）
//   TEAM_PREFIX      電腦玩家名稱前綴
//
// 行為：每 0.15 秒「感知」一次決定狀態，每個模擬步依狀態「行動」
//   roam    沿導航路徑走向隨機目的地（全校、各樓層）
//   engage  看得到敵人：反應延遲後瞄準開火、左右橫移，遠距離時邊打邊推進或繞側
//   hunt    敵人剛消失：走到最後看到的位置
//   listen  聽到聲音：轉頭並走過去查看
import * as THREE from 'three';
import { Actor } from './actor.js';

// 難度
//   reaction  發現敵人到開火的延遲（秒，區間）
//   aimError  初始瞄準誤差（弧度，距離越遠越大）  settle  誤差收斂速度
//   turnRate  轉身速度（弧度/秒）                 headshot  瞄頭的機率
//   recoilCtl 後座力影響比例（越小壓槍越好）      recoilComp  鏡頭上飄的補償比例
//   strafe    交戰時橫移力度                       sight  視距（m）  fov  視野角（弧度）
//   hop       交戰時每秒跳躍機率
export const DIFF = {
  easy: { reaction: [0.55, 0.9], aimError: 0.075, settle: 2.2, turnRate: 3.2, headshot: 0.07, recoilCtl: 1.0, recoilComp: 0.55, strafe: 0.35, sight: 50, fov: 1.6, hop: 0 },
  normal: { reaction: [0.38, 0.62], aimError: 0.058, settle: 3.2, turnRate: 5.2, headshot: 0.12, recoilCtl: 0.85, recoilComp: 0.8, strafe: 0.65, sight: 62, fov: 1.85, hop: 0.05 },
  hard: { reaction: [0.2, 0.34], aimError: 0.032, settle: 5.5, turnRate: 8.5, headshot: 0.3, recoilCtl: 0.6, recoilComp: 0.9, strafe: 0.85, sight: 75, fov: 2.05, hop: 0.12 },
  hell: { reaction: [0.12, 0.2], aimError: 0.02, settle: 8.5, turnRate: 13, headshot: 0.5, recoilCtl: 0.42, recoilComp: 0.95, strafe: 1, sight: 95, fov: 2.3, hop: 0.2 },
};

// 除了玩家「我」以外，依序命名為 女同學1號、2號…／男同學1號、2號…
export const TEAM_PREFIX = { BL: '女同學', GR: '男同學' };
export const TEAM_LABEL = { BL: '女生隊', GR: '男生隊' };

const THINK_EVERY = 0.15;
const _eye = new THREE.Vector3(), _a = new THREE.Vector3(), _b = new THREE.Vector3();
const wrapAngle = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const yawTo = (fx, fz, tx, tz) => Math.atan2(-(tx - fx), -(tz - fz));   // yaw = 0 面向 -Z
const rand = (a, b) => a + Math.random() * (b - a);

export class Bot extends Actor {
  constructor(game, o) {
    super(game, o);
    this.skill = DIFF[o.diff] || DIFF.normal;
    this.recoilControl = this.skill.recoilCtl;
    this.state = 'roam';
    this.path = null; this.pi = 0; this.goal = null; this.stage = 0;
    this.target = null; this.visible = false;
    this.lastSeen = null; this.lastSeenT = -99;
    this.heard = null; this.heardT = -99;
    this.reactUntil = 0;
    this.errYaw = 0; this.errPitch = 0; this.aimHead = false;
    this.lookYaw = undefined; this.lookPitch = undefined;
    this.strafeDir = 1; this.strafeT = 0;
    this.burst = 0; this.burstRestUntil = 0;
    this.crouchUntil = 0; this.wantJump = false; this.wantScope = false; this.fireHeld = false;
    this.thinkT = Math.random() * THINK_EVERY;
    this.engageT = 0; this.engageLimit = 3;
    this.nadeCooldown = rand(20, 40); this.nadeAt = null;
    this.stuck = { t: 0, n: 0, at: new THREE.Vector3() };
  }

  onSpawn() {
    this.state = 'roam';
    this.path = null; this.goal = null; this.target = null; this.visible = false; this.lastSeen = null;
    this.stage = 0;
    this.newGoal();
  }

  // ───────── 路徑 ─────────

  routeTo(x, z, y = 0) {
    this.path = this.game.nav.findPath(this.pos.x, this.pos.z, x, z, this.pos.y, y);
    this.pi = 1;
  }

  newGoal(near) {
    const p = this.game.map.pickBotGoal(this, near);
    this.goal = p;
    this.routeTo(p[0], p[1], p[2] || 0);
  }

  pathDone() { return !this.path || this.pi >= this.path.length; }

  // 回傳往下一個路徑點的單位方向（並在到達時前進到下一點）；高度差太大就嘗試跳
  steer() {
    if (this.pathDone()) return null;
    const wp = this.path[this.pi], wy = wp[2] ?? this.pos.y;
    const dx = wp[0] - this.pos.x, dz = wp[1] - this.pos.z, d = Math.hypot(dx, dz);
    if (d < 0.55 && Math.abs(wy - this.pos.y) < 1.1) this.pi++;
    if (wy - this.pos.y > 0.5 && d < 1.5) { this.wantJump = true; return null; }
    return d > 0.01 ? [dx / d, dz / d] : null;
  }

  // ───────── 感知 ─────────

  hear(pos, loud) {
    if (!this.alive || this.visible) return;
    this.heard = pos.clone(); this.heardT = this.game.time; this.heardLoud = loud;
  }

  onDamaged(att) {
    if (!att || !this.alive) return;
    // 中彈：準心被打偏，要重新拉回
    this.errYaw += (Math.random() - 0.5) * 0.09;
    this.errPitch += rand(0.02, 0.055);
    this.reactUntil = Math.max(this.reactUntil, this.game.time + 0.06);
    if (this.visible && this.target === att) return;
    this.lastSeen = att.pos.clone(); this.lastSeenT = this.game.time;
    if (!this.visible) {
      this.target = att;
      this.lookYaw = yawTo(this.pos.x, this.pos.z, att.pos.x, att.pos.z) + (Math.random() - 0.5) * 0.5;   // 憑感覺轉頭，不準
    }
  }

  // 視距內、在視野角內（6 m 內不限角度）、頭或胸口任一點沒被擋住
  canSee(t) {
    const e = this.eye(_eye), dist = e.distanceTo(t.pos);
    if (dist > this.skill.sight) return false;
    const off = Math.abs(wrapAngle(yawTo(this.pos.x, this.pos.z, t.pos.x, t.pos.z) - this.yaw));
    if (off > this.skill.fov / 2 && dist > 6) return false;
    for (const pt of [t.soldier.headWorld(_a), t.soldier.chestWorld(_b)]) {
      const dx = pt.x - e.x, dy = pt.y - e.y, dz = pt.z - e.z, L = Math.hypot(dx, dy, dz);
      if (!this.game.world.raycast(e.x, e.y, e.z, dx / L, dy / L, dz / L, L - 0.1, 'sight')) return true;
    }
    return false;
  }

  nearestVisibleEnemy() {
    let best = null, bestD = Infinity;
    for (const a of this.game.actors) {
      if (!a.alive || a.team === this.team) continue;
      const d = a.pos.distanceTo(this.pos);
      if (d < bestD && this.canSee(a)) { best = a; bestD = d; }
    }
    return best ? { foe: best, dist: bestD } : null;
  }

  // 新發現敵人：決定反應時間與初始瞄準誤差
  acquire(foe, dist) {
    const now = this.game.time, [r0, r1] = this.skill.reaction;
    const again = this.target === foe && now - this.lastSeenT < 1.5;     // 剛跟丟又看到：反應快很多
    this.reactUntil = now + rand(r0, r1) * (again ? 0.4 : 1);
    const err = this.skill.aimError * (0.8 + dist / 28), dir = rand(0, Math.PI * 2);
    this.errYaw = Math.cos(dir) * err * 1.3;
    this.errPitch = Math.sin(dir) * err * 0.8 - err * 0.1;
    this.aimHead = Math.random() < this.skill.headshot;
    this.burst = 0;
  }

  think() {
    const now = this.game.time;
    const seen = this.nearestVisibleEnemy();
    if (seen) {
      if (!this.visible || this.target !== seen.foe) this.acquire(seen.foe, seen.dist);
      this.target = seen.foe; this.visible = true;
      this.lastSeen = seen.foe.pos.clone(); this.lastSeenT = now;
      this.state = 'engage';
      this.planEngage(seen.foe, seen.dist);
    } else {
      this.visible = false; this.engageT = 0;
      if (this.target && (!this.target.alive || now - this.lastSeenT > 5)) this.target = null;
      this.planSearch(now);
    }
    this.checkStuck();
  }

  // 校園很大，交戰時不會站著對射：10 m 外會往敵人或側翼移動，對峙太久就換位置
  planEngage(foe, dist) {
    const w = this.weapon;
    if (w.def.type === 'sniper' && !this.scoped && dist > 7 && this.game.time >= w.boltUntil) this.wantScope = true;
    if (Math.random() < 0.12 * this.skill.strafe) this.crouchUntil = this.game.time + rand(0.6, 1.8);
    if (dist < 10) { this.path = null; return; }
    this.engageT += THINK_EVERY;
    if (this.pathDone() || this.engageT > this.engageLimit) {
      this.engageT = 0; this.engageLimit = rand(2.5, 5);
      if (Math.random() < 0.5) this.routeTo(foe.pos.x, foe.pos.z, foe.pos.y);
      else this.newGoal(foe.pos);
    }
  }

  planSearch(now) {
    if (this.lastSeen && now - this.lastSeenT < 5) {
      this.state = 'hunt';
      if (this.huntFor !== this.lastSeenT) { this.routeTo(this.lastSeen.x, this.lastSeen.z, this.lastSeen.y); this.huntFor = this.lastSeenT; }
    } else if (this.heard && now - this.heardT < 3 && Math.random() < 0.5) {
      this.state = 'listen';
      this.routeTo(this.heard.x, this.heard.z, this.heard.y);
      this.lookYaw = yawTo(this.pos.x, this.pos.z, this.heard.x, this.heard.z);
      this.heard = null;
    } else if (this.pathDone()) {
      this.state = 'roam';
      this.stage++;
      this.newGoal();
    }
    // 沒看到人時把彈匣補滿
    const w = this.weapon;
    if (w.def.mag > 1 && w.mag < w.def.mag * 0.5 && w.canReload() && now - this.lastSeenT > 1.2) this.startReload();
    // 手雷：剛跟丟的敵人在 7～24 m 外，偶爾丟一顆過去
    this.nadeCooldown -= THINK_EVERY;
    if (this.nadeCooldown <= 0 && this.lastSeen && now - this.lastSeenT < 3 && this.inv[3].mag > 0) {
      const d = this.lastSeen.distanceTo(this.pos);
      if (d > 7 && d < 24 && Math.random() < 0.35) { this.nadeAt = this.lastSeen.clone(); this.nadeCooldown = rand(25, 50); }
    }
  }

  // 每秒檢查一次：有路要走卻幾乎沒動 → 跳一下；連續三次 → 換目的地
  checkStuck() {
    const s = this.stuck;
    s.t += THINK_EVERY;
    if (s.t <= 1) return;
    const moved = s.at.distanceTo(this.pos);
    if (!this.pathDone() && moved < 0.35 && !this.visible) {
      this.wantJump = true;
      if (++s.n > 2) { s.n = 0; this.stage++; this.newGoal(); }
    } else s.n = 0;
    s.at.copy(this.pos); s.t = 0;
  }

  // ───────── 行動 ─────────

  update(dt) {
    if (!this.alive) return;
    const now = this.game.time;
    this.thinkT -= dt;
    if (this.thinkT <= 0) { this.thinkT = THINK_EVERY * rand(0.87, 1.27); this.think(); }

    const act = { wishX: 0, wishZ: 0, fire: false, firePressed: false, alt: false, sw: null, crouch: now < this.crouchUntil, walk: false, yaw: this.yaw, pitch: this.pitch };
    this.handleGrenade(act, now);
    if (this.target?.alive && this.visible) this.fight(act, dt, now);
    else this.travel(act, now);
    this.avoidCrowding(act);
    this.turnToward(act.yaw, act.pitch, dt);

    this.move(dt, act.wishX, act.wishZ, this.wantJump, act.crouch, act.walk);
    this.wantJump = false;
    this.weaponUpdate(dt, { fire: act.fire, firePressed: act.firePressed || (act.fire && !this.fireHeld), alt: act.alt, altPressed: act.alt, reload: false, sw: act.sw });
    this.fireHeld = act.fire;
  }

  handleGrenade(act, now) {
    if (this.nadeAt) {
      if (this.slot !== 3) { act.sw = 3; return; }
      if (now < this.readyAt || this.pendingThrow) return;
      const d = this.nadeAt.distanceTo(this.pos);
      this.lookYaw = yawTo(this.pos.x, this.pos.z, this.nadeAt.x, this.nadeAt.z);
      this.lookPitch = 0.25 + d * 0.012;          // 越遠丟越高
      act.firePressed = true;
      this.nadeAt = null;
    } else if (this.slot === 3 && this.inv[3].mag <= 0 && !this.pendingThrow && !this.autoSwitchAt) {
      act.sw = 0;
    }
  }

  fight(act, dt, now) {
    const S = this.skill, tgt = this.target, w = this.weapon, d = w.def;
    const e = this.eye(_eye);
    const aim = (this.aimHead ? tgt.soldier.headWorld(_a) : tgt.soldier.chestWorld(_a)).addScaledVector(tgt.vel, 0.08);   // 稍微預判
    const dx = aim.x - e.x, dy = aim.y - e.y, dz = aim.z - e.z, flat = Math.hypot(dx, dz);
    const trueYaw = Math.atan2(-dx, -dz), truePitch = Math.atan2(dy, flat);

    // 瞄準誤差隨時間收斂，再加一點手抖
    const settle = Math.exp(-S.settle * dt);
    this.errYaw *= settle; this.errPitch *= settle;
    const shake = 0.004 * (1 + tgt.speed / 4);
    act.yaw = trueYaw + this.errYaw + Math.sin(now * 3.1 + this.id) * shake;
    act.pitch = truePitch + this.errPitch + Math.cos(now * 2.7 + this.id) * shake * 0.6 - this.punchP * S.recoilComp;
    this.lookYaw = this.lookPitch = undefined;

    // 準心進到目標範圍內才開火（目標約 0.32 m 寬）
    const off = Math.hypot(wrapAngle(this.yaw - trueYaw), this.pitch - truePitch);
    const tolerance = Math.atan2(0.32, flat) * 1.4 + 0.01;
    if (now >= this.reactUntil && off < tolerance && now >= this.readyAt && !this.nadeAt) this.pullTrigger(act, d, off, tolerance, flat, dt, now);
    if (this.wantScope) { act.alt = true; this.wantScope = false; }

    // 橫移：隨機換方向，偶爾站定
    this.strafeT -= dt;
    if (this.strafeT <= 0) {
      this.strafeT = rand(0.25, 0.95);
      this.strafeDir = Math.random() < 0.2 ? 0 : Math.random() < 0.5 ? -1 : 1;
    }
    const sideK = d.type === 'sniper' ? 0 : S.strafe * this.strafeDir;
    act.wishX = Math.cos(this.yaw) * sideK;
    act.wishZ = -Math.sin(this.yaw) * sideK;
    // 10 m 外：沿路徑推進，橫移保留一部分
    if (flat >= 10 && d.type !== 'sniper') {
      const dir = this.steer();
      if (dir) { act.wishX = act.wishX * 0.35 + dir[0]; act.wishZ = act.wishZ * 0.35 + dir[1]; }
    }
    if (Math.random() < S.hop * dt && this.onGround && d.type !== 'sniper') this.wantJump = true;
  }

  pullTrigger(act, d, off, tolerance, dist, dt, now) {
    switch (d.type) {
      case 'sniper': if (this.scoped && this.scopeReady && off < tolerance * 0.6) act.firePressed = true; break;
      case 'pistol': act.firePressed = Math.random() < dt * 5; break;
      case 'shotgun': act.firePressed = dist < 24 && Math.random() < dt * 6; break;
      default:
        if (now < this.burstRestUntil) break;
        act.fire = true;
        // 遠距離點放：打 3～7 發停一下
        if (dist > 14 && ++this.burst > rand(3, 7)) { this.burst = 0; this.burstRestUntil = now + 0.18 + Math.random() * 0.3 * (dist / 30); }
    }
  }

  travel(act, now) {
    if (this.scoped && now - this.lastSeenT > 2) act.alt = true;    // 收鏡
    const dir = this.steer();
    if (dir) {
      act.wishX = dir[0]; act.wishZ = dir[1];
      if (this.lookYaw === undefined || now - this.heardT > 1.5) act.yaw = Math.atan2(-dir[0], -dir[1]);
      act.pitch = 0;
    }
    if (this.lookYaw !== undefined) {
      act.yaw = this.lookYaw;
      if (this.lookPitch !== undefined) act.pitch = this.lookPitch;
    }
  }

  // 跟隊友靠太近（1.1 m 內）就互相讓開
  avoidCrowding(act) {
    for (const a of this.game.actors) {
      if (a === this || !a.alive) continue;
      const dx = this.pos.x - a.pos.x, dz = this.pos.z - a.pos.z, d2 = dx * dx + dz * dz;
      if (d2 < 1.2 && d2 > 1e-4) { const d = Math.sqrt(d2); act.wishX += (dx / d) * 0.6; act.wishZ += (dz / d) * 0.6; }
    }
  }

  // 轉身有速度上限；沒在交戰時轉得慢一點
  turnToward(yaw, pitch, dt) {
    const max = this.skill.turnRate * dt * (this.visible ? 1 : 0.7);
    this.yaw = wrapAngle(this.yaw + THREE.MathUtils.clamp(wrapAngle(yaw - this.yaw), -max, max));
    this.pitch += THREE.MathUtils.clamp(pitch - this.pitch, -max * 0.6, max * 0.6);
  }
}
