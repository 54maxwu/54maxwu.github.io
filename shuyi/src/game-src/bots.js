// 樹義國小校園對戰：電腦玩家
//
// 對外介面
//   new Bot(game, { id, name, team, diff })   diff：easy | normal | hard | hell
//   onSpawn()        重生時重設狀態、挑第一個目的地
//   hear(pos, loud)  聽到槍聲、腳步、爆炸
//   onDamaged(att)   中彈（準心被打偏、轉向攻擊者）
//   update(dt)       每個模擬步呼叫
//   stage            已完成的巡邏目的地數
//   TEAM_PREFIX      電腦玩家名稱前綴
//
// 行為：每 0.15 秒「感知」一次決定狀態，每個模擬步依狀態「行動」
//   roam    沿導航路徑走向隨機目的地（全校、各樓層）
//   engage  看得到敵人：反應延遲後瞄準開火、左右橫移，遠距離時邊打邊推進或繞側
//   hunt    敵人剛消失：走到最後看到的位置
//   listen  聽到聲音：轉頭並走過去查看
import * as THREE from 'three';
import {planTactics} from './bot-tactics.js';
import {resetMotion,smoothMovement,combatStep,wantsBurst,shotFired} from './bot-motion.js';
import { Actor } from './actor.js';
import {BotSchedule} from './bot-schedule.js';

// 難度
//   reaction  發現敵人到開火的延遲（秒，區間）
//   aimError  初始瞄準誤差（弧度，距離越遠越大）  settle  誤差收斂速度
//   turnRate  轉身速度（弧度/秒）                 headshot  瞄頭的機率
//   recoilCtl 後座力影響比例（越小壓槍越好）      recoilComp  鏡頭上飄的補償比例
//   strafe    交戰時橫移力度                       sight  視距（m）  fov  視野角（弧度）
//   各難度使用相同約 110 度水平視野；差異在反應、槍法與操作。
export const DIFF = {
  easy: { reaction: [0.6, 1], aimError: 0.075, settle: 2.2, turnRate: 3.2, headshot: 0.07, recoilCtl: 1.0, recoilComp: 0.55, strafe: 0.35, sight: 50, fov: 1.92 },
  normal: { reaction: [0.4, 0.7], aimError: 0.058, settle: 3.2, turnRate: 5.2, headshot: 0.12, recoilCtl: 0.85, recoilComp: 0.8, strafe: 0.65, sight: 62, fov: 1.92 },
  hard: { reaction: [0.28, 0.46], aimError: 0.032, settle: 5.5, turnRate: 7.2, headshot: 0.3, recoilCtl: 0.6, recoilComp: 0.9, strafe: 0.85, sight: 75, fov: 1.92 },
  hell: { reaction: [0.22, 0.36], aimError: 0.02, settle: 8.5, turnRate: 8.5, headshot: 0.5, recoilCtl: 0.42, recoilComp: 0.95, strafe: 1, sight: 95, fov: 1.92 },
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
    this.heard = null; this.heardT = -99; this.heardReady = 0;
    this.observedAim = null; this.observedVelocity = new THREE.Vector3();
    this.lookUntil = 0;
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
    this.schedule=new BotSchedule(this);
  }

  onSpawn() {
    this.schedule?.reset();
    this.routeVersion=(this.routeVersion||0)+1;this.routePending=false;this.routeGoal=null;
    this.checkedRouteRevision=this.checkedWaypoint=undefined;
    resetMotion(this);
    this.peekPoint=null;this.peekPhase=null;this.nextPeek=0;this.coverCycleAt=this.game.time+2+this.id*.2;
    this.tactic='engage';this.coverPoint=null;this.tacticAt=0;this.searchProbe=0;this.searchAt=0;
    this.state = 'roam';
    this.path = null; this.goal = null; this.target = null; this.visible = false; this.lastSeen = null;
    this.lastSeenT = this.heardT = -99; this.heard = null; this.heardReady = 0;
    this.observedAim = null; this.observedVelocity.set(0,0,0);
    this.lookYaw = this.lookPitch = undefined; this.lookUntil = 0; this.huntFor = undefined;
    this.fireHeld = false; this.nadeAt = null; this.wantJump = this.wantScope = false;
    this.crouchUntil = this.reactUntil = this.burstRestUntil = 0;
    this.stage = 0;
    this.newGoal();
  }

  // ───────── 路徑 ─────────

  routeTo(x, z, y = 0) {
    const revision=this.game.world.structuralRevision||0,previous=this.routeGoal;
    if(previous&&Math.hypot(previous[0]-x,previous[1]-z)<.35&&Math.abs(previous[2]-y)<.35&&this.routeRevision===revision&&(this.routePending||this.path&&!this.pathDone()))return;
    this.routeGoal=[x,z,y];this.routeRevision=revision;
    const version=this.routeVersion=(this.routeVersion||0)+1;
    this.path=null;this.pi=0;this.checkedWaypoint=undefined;
    if(this.game.nav.requestPath){
      this.routePending=true;
      this.game.nav.requestPath(this,[this.pos.x,this.pos.z,x,z,this.pos.y,y],path=>{if(version!==this.routeVersion)return;this.routePending=false;if(this.alive){this.path=path;this.pi=path?.length>1?1:0;}});
      return;
    }
    this.routePending=false;
    this.path = this.game.nav.findPath(this.pos.x, this.pos.z, x, z, this.pos.y, y);
    this.pi = 1;
  }

  newGoal(near) {
    const p = this.game.map.pickBotGoal(this, near);
    this.goal = p;
    this.routeTo(p[0], p[1], p[2] || 0);
  }

  pathDone() { return !this.routePending && (!this.path || this.pi >= this.path.length); }

  // 回傳往下一個可步行路徑點的單位方向；卡住時另外處理跳躍。
  steer() {
    if (!this.path || this.pi >= this.path.length) return null;
    const wp = this.path[this.pi], wy = wp[2] ?? this.pos.y;
    const revision=this.game.world.structuralRevision||0;
    if(this.checkedRouteRevision!==revision||this.checkedWaypoint!==this.pi){
      this.checkedRouteRevision=revision;this.checkedWaypoint=this.pi;
      const support=this.game.world.support(wp[0],wp[1],.3,wy+.03);
      if(!support||Math.abs(support.y-(wy-.025))>.15){
        this.path=null;
        const goal=this.routeGoal||this.goal;if(goal&&!this.routePending)this.routeTo(goal[0],goal[1],goal[2]||0);
        return null;
      }
    }
    const dx = wp[0] - this.pos.x, dz = wp[1] - this.pos.z, d = Math.hypot(dx, dz);
    if (d < 0.55 && Math.abs(wy - this.pos.y) < 1.1) this.pi++;
    return d > 0.01 ? [dx / d, dz / d] : null;
  }

  // ───────── 感知 ─────────

  hear(pos, loud) {
    if (!this.alive || this.visible) return;
    const now=this.game.time,dist=this.pos.distanceTo(pos),range=loud?45:12;
    if(dist>range || now-this.heardT<.35)return;
    const e=this.eye(_eye),dx=pos.x-e.x,dy=pos.y+.8-e.y,dz=pos.z-e.z,L=Math.hypot(dx,dy,dz);
    const muffled=L>.1&&this.game.world.raycast(e.x,e.y,e.z,dx/L,dy/L,dz/L,L-.1,'sight');
    if(muffled&&dist>range*(loud?.55:.3))return;
    const uncertainty=Math.max(.7,dist*(loud?.14:.3))+(muffled?2:0),angle=rand(0,Math.PI*2),r=Math.sqrt(Math.random())*uncertainty;
    if(!this.heard||now-this.heardT>1.5)this.heardReady=now+rand(.25,.6);
    this.heard=pos.clone();this.heard.x+=Math.cos(angle)*r;this.heard.z+=Math.sin(angle)*r;
    this.heard.y=this.pos.y; // 聲音不提供精確樓層與敵人身分。
    this.heardT=now;this.heardLoud=loud;
  }

  onDamaged(att) {
    if (!att || !this.alive) return;
    // 中彈：準心被打偏，要重新拉回
    this.errYaw += (Math.random() - 0.5) * 0.09;
    this.errPitch += rand(0.02, 0.055);
    this.reactUntil = Math.max(this.reactUntil, this.game.time + 0.06);
    if (this.visible && this.target === att) return;
    if (!this.visible) {
      // 受擊只提供大致來襲方向，不能把攻擊者座標寫進視覺記憶。
      const yaw=yawTo(this.pos.x,this.pos.z,att.pos.x,att.pos.z)+rand(-.55,.55),distance=rand(4,9);
      this.heard=this.pos.clone().add(new THREE.Vector3(-Math.sin(yaw)*distance,0,-Math.cos(yaw)*distance));
      this.heardT=this.game.time;this.heardReady=this.game.time+rand(.2,.45);
    }
  }

  // 任何距離都遵守水平／垂直視野，頭或胸口必須在視線內。
  canSee(t) {
    const e = this.eye(_eye), dist = e.distanceTo(t.pos);
    if (dist > this.skill.sight) return false;
    const off = Math.abs(wrapAngle(yawTo(this.pos.x, this.pos.z, t.pos.x, t.pos.z) - this.yaw));
    if (off > this.skill.fov / 2) return false;
    for (const pt of [t.soldier.headWorld(_a), t.soldier.chestWorld(_b)]) {
      const dx = pt.x - e.x, dy = pt.y - e.y, dz = pt.z - e.z, L = Math.hypot(dx, dy, dz);
      if(L<.001)continue;
      if(Math.abs(Math.atan2(dy,Math.hypot(dx,dz))-this.pitch)>Math.PI/4)continue;
      if (!this.game.world.raycast(e.x, e.y, e.z, dx / L, dy / L, dz / L, L - 0.1, 'sight')) return true;
    }
    return false;
  }

  nearestVisibleEnemy() {
    let best = null, bestD = Infinity;
    this.visibleEnemies=0;
    for (const a of this.game.actors) {
      if (!a.alive || a.team === this.team) continue;
      const d = a.pos.distanceTo(this.pos);
      if (this.canSee(a)) { this.visibleEnemies++;if(d<bestD){best = a; bestD = d;} }
    }
    return best ? { foe: best, dist: bestD } : null;
  }

  // 新發現敵人：決定反應時間與初始瞄準誤差
  acquire(foe, dist) {
    const now = this.game.time, [r0, r1] = this.skill.reaction;
    const again = this.target === foe && now - this.lastSeenT < 1.5;     // 剛跟丟又看到：反應快很多
    this.reactUntil = now + Math.max(.18,rand(r0, r1) * (again ? 0.65 : 1));
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
      this.observedAim=(this.aimHead?seen.foe.soldier.headWorld(_a):seen.foe.soldier.chestWorld(_a)).clone();
      this.observedVelocity.copy(seen.foe.vel);
      this.state = 'engage';
      this.searchProbe=0;this.searchAt=0;
      if(!this.schedule||this.schedule.allowsTactics(now))planTactics(this,seen,now);
      if(this.coverPoint)this.state='retreat';else if(!this.schedule?.holdsPlan())this.planEngage(seen.foe, seen.dist);
    } else {
      this.visible = false; this.engageT = 0;
      if (this.target && now - this.lastSeenT > 5) this.target = null;
      if(this.schedule?.holdsPlan())this.state='retreat';else this.planSearch(now);
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
    if(this.coverPoint&&this.tactic==='peek'&&now<this.coverUntil&&now-this.lastSeenT<3){this.state='retreat';return;}
    if(this.coverPoint&&this.tactic==='peek'){this.coverPoint=null;this.peekPoint=null;this.peekPhase=null;}
    if(this.coverPoint&&this.tactic==='cover'){
      const distance=this.pos.distanceTo(this.coverPoint);
      if(distance<1.2){this.path=null;this.crouchUntil=now+.6;if(this.weapon.canReload())this.startReload();}
      if(now-this.lastSeenT<2.5||this.weapon.reloading){this.state='retreat';return;}
      this.coverPoint=null;this.tactic='engage';
    }
    if (this.lastSeen && now - this.lastSeenT < 5 && !(this.heard&&this.heardT>this.lastSeenT&&now>=this.heardReady)) {
      this.state = 'hunt';
      if (this.huntFor !== this.lastSeenT) { this.routeTo(this.lastSeen.x, this.lastSeen.z, this.lastSeen.y); this.huntFor = this.lastSeenT; }
      if(this.pos.distanceTo(this.lastSeen)<2.5&&now>=(this.searchAt||0)){
        this.searchAt=now+.9;this.searchProbe=(this.searchProbe||0)+1;
        this.lookYaw=yawTo(this.pos.x,this.pos.z,this.lastSeen.x,this.lastSeen.z)+(this.searchProbe%2?.65:-.65);this.lookUntil=now+.85;
        if(this.searchProbe<=2){const angle=this.yaw+(this.searchProbe%2?1:-1)*1.2;const node=this.game.nav.nearest(this.lastSeen.x+Math.cos(angle)*3,this.lastSeen.z+Math.sin(angle)*3,this.lastSeen.y);
          if(node&&Math.abs(node.y-this.lastSeen.y)<.8)this.routeTo(node.x,node.z,node.y);}
      }
    } else if (this.heard && now - this.heardT < 3 && now >= this.heardReady) {
      this.state = 'listen';
      this.routeTo(this.heard.x, this.heard.z, this.heard.y);
      this.lookYaw = yawTo(this.pos.x, this.pos.z, this.heard.x, this.heard.z);
      this.lookUntil=now+1.2;
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
    this.schedule.refresh(now);
    this.thinkT -= dt;
    if (this.thinkT <= 0) { this.thinkT = THINK_EVERY * rand(0.87, 1.27); this.think(); }

    const act = { wishX: 0, wishZ: 0, fire: false, firePressed: false, alt: false, sw: null, crouch: now < this.crouchUntil, walk: false, yaw: this.yaw, pitch: this.pitch };
    this.handleGrenade(act, now);
    if (this.target?.alive && this.visible) this.fight(act, dt, now);
    else this.travel(act, now);
    this.schedule.apply(act,now);
    this.avoidCrowding(act);
    if(['observe-cover','reload-cover','fire-window','observe-search'].includes(this.schedule.task))act.wishX=act.wishZ=0;
    smoothMovement(this,act,dt);
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
      this.lookUntil = now + .8;
      act.firePressed = true;
      this.nadeAt = null;
    } else if (this.slot === 3 && this.inv[3].mag <= 0 && !this.pendingThrow && !this.autoSwitchAt) {
      act.sw = 0;
    }
  }

  fight(act, dt, now) {
    const S = this.skill, tgt = this.target, w = this.weapon, d = w.def;
    const e = this.eye(_eye);
    if(!this.observedAim)return;
    // 只追蹤上次視覺取樣；失去視線後不讀取敵人的即時位置／速度。
    const aim = _a.copy(this.observedAim).addScaledVector(this.observedVelocity,Math.min(.08,Math.max(0,now-this.lastSeenT)));
    const dx = aim.x - e.x, dy = aim.y - e.y, dz = aim.z - e.z, flat = Math.hypot(dx, dz);
    const trueYaw = Math.atan2(-dx, -dz), truePitch = Math.atan2(dy, flat);

    // 瞄準誤差隨時間收斂，再加一點手抖
    const settle = Math.exp(-S.settle * dt);
    this.errYaw *= settle; this.errPitch *= settle;
    const shake = 0.004 * (1 + this.observedVelocity.length() / 4);
    act.yaw = trueYaw + this.errYaw + Math.sin(now * 3.1 + this.id) * shake;
    act.pitch = truePitch + this.errPitch + Math.cos(now * 2.7 + this.id) * shake * 0.6 - this.punchP * S.recoilComp;
    this.lookYaw = this.lookPitch = undefined;

    combatStep(this,act,d,flat,now);
    // 準心進到目標範圍內才開火（目標約 0.32 m 寬）
    const off = Math.hypot(wrapAngle(this.yaw - trueYaw), this.pitch - truePitch);
    const tolerance = Math.atan2(0.32, flat) * 1.4 + 0.01;
    if ((!this.coverPoint||this.peekPhase==='exposed') && !w.reloading && now >= this.reactUntil && off < tolerance && now >= this.readyAt && !this.nadeAt && this.canSee(tgt)) this.pullTrigger(act, d, off, tolerance, flat, dt, now);
    if (this.wantScope) { act.alt = true; this.wantScope = false; }

    if(this.coverPoint){
      this.coverAction(act,now);
      return;
    }
    // 10 m 外：沿路徑推進，橫移保留一部分
    if (flat >= 10 && d.type !== 'sniper' && now >= (this.plantUntil||0)) {
      const dir = this.steer();
      if (dir) { act.wishX = act.wishX * 0.35 + dir[0]; act.wishZ = act.wishZ * 0.35 + dir[1]; }
    }
  }

  pullTrigger(act, d, off, tolerance, dist, dt, now) {
    switch (d.type) {
      case 'sniper': if (this.scoped && this.scopeReady && off < tolerance * 0.6) act.firePressed = true; break;
      case 'pistol': if(now>=(this.triggerAt||0)){act.firePressed=true;this.triggerAt=now+rand(.22,.38);} break;
      case 'shotgun': if(dist<24&&now>=(this.triggerAt||0)){act.firePressed=true;this.triggerAt=now+.85;} break;
      default:
        act.fire = wantsBurst(this,d,dist,now);
    }
  }

  onShotFired(def){shotFired(this,def,this.game.time);}

  coverAction(act,now){
    this.schedule.coverAction(act,now);
  }

  travel(act, now) {
    if(this.coverPoint){this.coverAction(act,now);if(this.observedAim){act.yaw=yawTo(this.pos.x,this.pos.z,this.observedAim.x,this.observedAim.z);act.pitch=0;}return;}
    if(now>this.lookUntil){this.lookYaw=this.lookPitch=undefined;}
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
      if(Math.abs(a.pos.y-this.pos.y)>1.5)continue;
      const dx = this.pos.x - a.pos.x, dz = this.pos.z - a.pos.z, d2 = dx * dx + dz * dz;
      if (d2 < 1.2 && d2 > 1e-4) { const d = Math.sqrt(d2); act.wishX += (dx / d) * 0.6; act.wishZ += (dz / d) * 0.6; }
    }
  }

  // 轉身有速度上限；沒在交戰時轉得慢一點
  turnToward(yaw, pitch, dt) {
    // A single non-finite heading would otherwise stick forever and spread to the pose, aim and camera.
    if (!Number.isFinite(yaw)) yaw = this.yaw;
    if (!Number.isFinite(pitch)) pitch = this.pitch;
    const max = this.skill.turnRate * dt * (this.visible ? 1 : 0.7);
    this.yaw = wrapAngle(this.yaw + THREE.MathUtils.clamp(wrapAngle(yaw - this.yaw), -max, max));
    this.pitch += THREE.MathUtils.clamp(pitch - this.pitch, -max * 0.6, max * 0.6);
  }
}
