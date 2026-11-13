// 樹義國小校園對戰：第一人稱手與武器
//
// 對外介面
//   new ViewModel(scene, T, team)   scene 為第一人稱專用場景（相機在原點、看 -Z）
//   setTeam(team)        BL 女生隊（白色制服袖口）、GR 男生隊（藍色體育服袖口）
//   equip(id, drawTime)  換武器（從畫面下方舉起）
//   fire() reload(dur, empty) melee(heavy) throwNade() inspect()
//   setVisible(v)
//   update(dt, st)       st：{ speed, onGround, crouch, lookDX, lookDY, sunDirCam, light, indoor }
//
// 設計
//   - 武器姿勢 = 持槍基準姿勢 + 彈簧（後座、視角慣性）+ 走路晃動 + 動作關鍵影格
//   - 動作以關鍵影格表描述，零件（彈匣、槍機、泵動護木…）的移動另外用函式依進度計算
//   - 手臂是兩段式 IK：肩膀固定在畫面外，手掌貼在槍的握點上，手肘自然彎向外下方
import * as THREE from 'three';
import { buildGun } from './guns.js';

// 持槍基準姿勢（相機空間）：位置 [右, 上, 前(負)]、旋轉 [俯仰, 偏擺, 側傾]
const HOLD = {
  ak47: { p: [0.165, -0.172, -0.55], r: [0.045, 0.165, 0.02], kick: [0.04, 0.07], flash: 1 },
  m4a1: { p: [0.16, -0.178, -0.54], r: [0.045, 0.165, 0.02], kick: [0.032, 0.05], flash: 1 },
  awm: { p: [0.17, -0.185, -0.6], r: [0.04, 0.15, 0.02], kick: [0.09, 0.2], flash: 1.6 },
  mp5: { p: [0.155, -0.165, -0.5], r: [0.05, 0.17, 0.02], kick: [0.024, 0.035], flash: 0.8 },
  m870: { p: [0.16, -0.18, -0.56], r: [0.045, 0.16, 0.02], kick: [0.085, 0.22], flash: 1.55 },
  deagle: { p: [0.085, -0.115, -0.4], r: [0.05, 0.1, 0], kick: [0.05, 0.22], flash: 1.2 },
  knife: { p: [0.17, -0.15, -0.34], r: [0.35, -0.25, 0.55] },
  he: { p: [0.13, -0.12, -0.3], r: [0.1, -0.2, 0.2] },
};

const SKIN = { BL: 0xe0b090, GR: 0xd9a682 };
const SLEEVE = { BL: 0xf3f2ec, GR: 0x1f5fb8 };

const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const smooth = (x) => { x = clamp01(x); return x * x * (3 - 2 * x); };
const span = (f, a, b) => clamp01((f - a) / (b - a));
const bump = (f, a, b) => Math.sin(span(f, a, b) * Math.PI);              // a→b 之間 0→1→0

// ───────── 關鍵影格 ─────────
// 每個影格：[進度 0..1, { x, y, z, rx, ry, rz }]（相對基準姿勢的偏移）；影格之間平滑插值

const KEYS = {
  reload: [[0, {}], [0.14, { y: -0.03, x: -0.02, rx: 0.18, rz: 0.45 }], [0.86, { y: -0.03, x: -0.02, rx: 0.18, rz: 0.45 }], [1, {}]],
  slash: [[0, { x: 0.06, ry: 1.1 }], [0.5, { z: -0.08, rx: 0.3, rz: -0.6 }], [1, { x: -0.06, ry: -1.1 }]],
  stab: [[0, {}], [0.35, { z: 0.08, y: 0.05, rx: -0.4 }], [0.55, { z: -0.14, y: 0.01, rx: 0.5 }], [0.65, { z: -0.14, rx: 0.5 }], [1, {}]],
  throw: [[0, {}], [0.3, {}], [0.55, { y: 0.08, z: 0.1, rx: 0.8 }], [0.8, { y: -0.04, z: -0.2, rx: -0.8 }], [1, { y: -0.04, z: -0.2, rx: -0.8 }]],
  inspect: [[0, {}], [0.25, { x: -0.08, y: 0.04, ry: 0.9, rz: 0.5 }], [0.4, { x: -0.08, y: 0.04, ry: 0.9, rz: 0.5 }], [0.6, { x: -0.04, y: 0.02, ry: -0.2, rz: 0.25, rx: 0.3 }], [0.8, { x: -0.04, y: 0.02, ry: -0.2, rz: 0.25, rx: 0.3 }], [1, {}]],
};
const POSE_KEYS = ['x', 'y', 'z', 'rx', 'ry', 'rz'];

function sampleKeys(keys, f, out) {
  for (const k of POSE_KEYS) out[k] = 0;
  if (!keys) return out;
  let i = 1;
  while (i < keys.length - 1 && f > keys[i][0]) i++;
  const [fa, a] = keys[i - 1], [fb, b] = keys[i];
  const t = smooth(fb > fa ? (f - fa) / (fb - fa) : 1);
  for (const k of POSE_KEYS) out[k] = (a[k] || 0) + ((b[k] || 0) - (a[k] || 0)) * t;
  return out;
}

// 阻尼彈簧（後座力用）：x 位移、v 速度
class Spring {
  constructor(stiff, damp) { this.k = stiff; this.c = damp; this.x = 0; this.v = 0; }
  hit(impulse) { this.v += impulse; }
  step(dt) { this.v += (-this.k * this.x - this.c * this.v) * dt; this.x += this.v * dt; return this.x; }
  reset() { this.x = this.v = 0; }
}

// ───────── 手臂 ─────────

const UP = new THREE.Vector3(0, 1, 0);

class Arm {
  constructor(parent, side, skinMat, sleeveMat) {
    this.side = side;                                        // 1 右、-1 左
    // 肩膀在畫面下緣外；左手要伸到護木，所以左肩較前
    this.shoulder = side > 0 ? new THREE.Vector3(0.22, -0.36, -0.05) : new THREE.Vector3(-0.12, -0.36, -0.25);
    this.upperLen = 0.28; this.foreLen = 0.33;
    this.g = new THREE.Group();
    this.upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.043, 1, 4, 10), skinMat);
    this.sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.056, 0.052, 1, 12, 1, true), sleeveMat);
    this.fore = new THREE.Mesh(new THREE.CapsuleGeometry(0.036, 1, 4, 10), skinMat);
    this.hand = new THREE.Group();
    const palm = new THREE.Mesh(new THREE.BoxGeometry(0.072, 0.082, 0.04), skinMat);
    const fingers = new THREE.Mesh(new THREE.BoxGeometry(0.068, 0.034, 0.066), skinMat);
    fingers.position.set(0, -0.034, -0.028);
    const thumb = new THREE.Mesh(new THREE.CapsuleGeometry(0.012, 0.038, 3, 6), skinMat);
    thumb.position.set(-0.034 * side, 0.008, -0.028);
    thumb.rotation.x = -1.1;
    this.hand.add(palm, fingers, thumb);
    this.g.add(this.upper, this.sleeve, this.fore, this.hand);
    parent.add(this.g);
    this._e = new THREE.Vector3(); this._d = new THREE.Vector3(); this._n = new THREE.Vector3(); this._w = new THREE.Vector3();
  }

  // 圓柱類網格（長度 1、沿 Y）擺在 a→b 之間
  static bone(mesh, a, b, inset = 0) {
    const d = new THREE.Vector3().subVectors(b, a), L = d.length();
    mesh.position.copy(a).addScaledVector(d, 0.5);
    mesh.quaternion.setFromUnitVectors(UP, d.divideScalar(L || 1));
    mesh.scale.set(1, Math.max(0.01, L - inset), 1);
  }

  // 兩段式 IK：給定手腕位置與手掌朝向，算出手肘
  solve(wrist, handQuat, shoulderShift) {
    const S = this._w.copy(this.shoulder).add(shoulderShift);
    const d = this._d.subVectors(wrist, S);
    let L = d.length();
    const a = this.upperLen, b = this.foreLen;
    L = Math.min(L, a + b - 1e-4);
    d.normalize();
    // 手肘偏向：往外、往下
    const pole = this._n.set(0.6 * this.side, -1, 0.15);
    pole.addScaledVector(d, -pole.dot(d)).normalize();
    const along = (a * a - b * b + L * L) / (2 * L);
    const h = Math.sqrt(Math.max(0, a * a - along * along));
    const E = this._e.copy(S).addScaledVector(d, along).addScaledVector(pole, h);
    const W = wrist;
    Arm.bone(this.upper, S, E, 0.04);
    // 短袖：只蓋住上臂靠肩膀的 60%
    const sleeveEnd = new THREE.Vector3().lerpVectors(S, E, 0.6);
    Arm.bone(this.sleeve, S, sleeveEnd);
    Arm.bone(this.fore, E, W, 0.06);
    this.hand.position.copy(W);
    this.hand.quaternion.copy(handQuat);
  }
}

// ───────── 主體 ─────────

export class ViewModel {
  constructor(scene, T, team) {
    this.scene = scene;
    this.rig = new THREE.Group();
    scene.add(this.rig);
    this.holder = new THREE.Group();
    this.rig.add(this.holder);
    this.guns = {};
    this.cur = null; this.id = null;
    this.parts = {}; this.rest = {};

    // 燈光：方向每幀由外部換算到相機空間
    this.sun = new THREE.DirectionalLight(0xffffff, 2.5);
    this.sun.position.set(0.5, 1, 0.3);
    this.fill = new THREE.HemisphereLight(0xcfe2f4, 0x40464c, 0.35);
    this.muzzleLight = new THREE.PointLight(0xffb060, 0, 1.5, 2);
    scene.add(this.sun, this.fill, this.muzzleLight);

    this.skinMat = new THREE.MeshStandardMaterial({ color: SKIN.BL, roughness: 0.7, metalness: 0 });
    this.sleeveMat = new THREE.MeshStandardMaterial({ color: SLEEVE.BL, roughness: 0.9, metalness: 0, side: THREE.DoubleSide });
    this.arms = { R: new Arm(this.rig, 1, this.skinMat, this.sleeveMat), L: new Arm(this.rig, -1, this.skinMat, this.sleeveMat) };

    // 槍口火焰：正面一片＋三片繞槍管軸 60° 排開的側焰
    const flashMat = (tex) => new THREE.MeshBasicMaterial({ map: tex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, color: 0xffdcaa, side: THREE.DoubleSide });
    this.flashTex = T.flash;
    this.flash = new THREE.Group();
    this.flashFront = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.16), flashMat(T.flash[0]));
    this.flash.add(this.flashFront);
    const sideGeo = new THREE.PlaneGeometry(0.22, 0.07).rotateY(Math.PI / 2).translate(0, 0, -0.1);
    for (let i = 0; i < 3; i++) {
      const s = new THREE.Mesh(sideGeo, flashMat(T.flashSide));
      s.rotation.z = (i * Math.PI) / 3;
      this.flash.add(s);
    }
    this.flash.visible = false;
    this.flash.renderOrder = 10;
    this.flashT = 0;

    // 彈殼
    const shellGeo = new THREE.CylinderGeometry(0.0055, 0.0055, 0.035, 8).rotateZ(Math.PI / 2);
    const brass = new THREE.MeshStandardMaterial({ color: 0xc9a14b, roughness: 0.3, metalness: 1 });
    this.shells = Array.from({ length: 14 }, () => {
      const mesh = new THREE.Mesh(shellGeo, brass);
      mesh.visible = false;
      this.rig.add(mesh);
      return { mesh, v: new THREE.Vector3(), w: new THREE.Vector3(), life: 0 };
    });
    this.shellNext = 0;

    // 動態狀態
    this.t = 0;
    this.kickZ = new Spring(260, 26);       // 往後頂
    this.kickR = new Spring(260, 26);       // 槍口上揚
    this.sway = new THREE.Vector2();
    this.bobPhase = 0; this.bobAmt = 0;
    this.draw = 1; this.drawDur = 0.5;
    this.slideT = 0;
    this.anim = null;
    this._pose = {};
    this._v = new THREE.Vector3(); this._v2 = new THREE.Vector3(); this._shift = new THREE.Vector3(); this._q = new THREE.Quaternion();
    this.setTeam(team);
  }

  setTeam(team) {
    this.team = team;
    this.skinMat.color.set(SKIN[team] ?? SKIN.BL);
    this.sleeveMat.color.set(SLEEVE[team] ?? SLEEVE.BL);
  }

  equip(id, drawTime) {
    if (!this.guns[id]) {
      const g = buildGun(id);
      g.traverse((o) => { if (o.isMesh) o.frustumCulled = false; });
      this.guns[id] = g;
    }
    if (this.cur) this.holder.remove(this.cur);
    this.cur = this.guns[id];
    this.id = id;
    this.holder.add(this.cur);
    this.cur.visible = true;
    this.parts = {};
    this.cur.traverse((o) => { if (o.name) this.parts[o.name] = o; });
    this.rest = {};
    for (const k of ['mag', 'bolt', 'slide', 'pin', 'lever', 'pump']) {
      const o = this.parts[k];
      if (o) this.rest[k] = { p: o.position.clone(), r: o.rotation.clone() };
    }
    this.parts.muzzle?.add(this.flash);
    this.draw = 0; this.drawDur = drawTime || 0.5;
    this.anim = null;
    this.kickZ.reset(); this.kickR.reset();
  }

  fire() {
    const h = HOLD[this.id] || HOLD.ak47, k = h.kick || [0.03, 0.05];
    this.kickZ.hit(k[0] * 38);
    this.kickR.hit(k[1] * 38);
    this.flashT = 0.05;
    this.flash.visible = true;
    this.flashFront.material.map = this.flashTex[(Math.random() * this.flashTex.length) | 0];
    this.flashFront.rotation.z = Math.random() * Math.PI;
    this.flash.scale.setScalar((h.flash || 1) * (0.8 + Math.random() * 0.45));
    if (this.id === 'awm') this.play('bolt', 1.3);
    else if (this.id === 'm870') this.play('pump', 0.66);
    else this.ejectShell();
    if (this.id === 'deagle') this.slideT = 0.09;
  }

  reload(dur, empty) { this.play('reload', dur, { empty }); }
  melee(heavy) { this.play(heavy ? 'stab' : 'slash', heavy ? 0.85 : 0.38, { dir: Math.random() < 0.5 ? 1 : -1 }); }
  throwNade() { this.play('throw', 0.75); }
  inspect() { if (!this.anim) this.play('inspect', 2.6); }
  setVisible(v) { this.rig.visible = v; }

  play(type, dur, extra = {}) { this.anim = { type, dur, t: 0, ...extra }; }

  ejectShell() {
    const port = this.parts.eject;
    if (!port) return;
    const s = this.shells[this.shellNext++ % this.shells.length];
    port.getWorldPosition(s.mesh.position);
    s.mesh.visible = true;
    s.life = 0.9;
    s.v.set(0.9 + Math.random() * 0.6, 0.9 + Math.random() * 0.5, 0.25 + Math.random() * 0.3);
    s.w.set(Math.random() * 20, Math.random() * 20, Math.random() * 20);
    s.mesh.rotation.set(0, Math.random(), 0);
  }

  resetParts() {
    for (const k in this.rest) {
      const o = this.parts[k];
      o.position.copy(this.rest[k].p); o.rotation.copy(this.rest[k].r); o.visible = true;
    }
  }

  // 依動作進度移動零件，並回傳左右手的目標（null = 照常握在握點／扶點）
  animateParts(a, f) {
    const P = this.parts, R = this.rest, id = this.id;
    const hands = { L: null, R: null };
    const world = (o, dy = 0) => { const v = o.getWorldPosition(new THREE.Vector3()); v.y += dy; return v; };

    if (a.type === 'reload') {
      if (P.mag && id !== 'm870') {
        const m = P.mag, r = R.mag.p;
        if (f < 0.3) {                                   // 拔出
          const k = smooth(span(f, 0.15, 0.3));
          m.position.set(r.x, r.y - k * 0.12, r.z + k * 0.02); m.visible = true;
        } else if (f < 0.42) {                           // 丟掉
          const k = span(f, 0.3, 0.42);
          m.position.set(r.x, r.y - 0.12 - k * 0.4, r.z); m.visible = k < 0.95;
        } else {                                         // 新彈匣插入
          const up = smooth(span(f, 0.42, 0.62)), seat = span(f, 0.62, 0.7);
          m.visible = true;
          m.position.set(r.x, r.y - (1 - up) * 0.3 - (1 - seat) * 0.015, r.z + (1 - up) * 0.05);
        }
        if (f > 0.12 && f < 0.72) hands.L = world(m, -0.06);
        if (f > 0.62 && f < 0.7) this.kickR.hit(-0.8 * 0.016);   // 拍進去的小震動
      }
      if (id === 'm870' && P.magwell && f > 0.12 && f < 0.85) {   // 一發一發塞進管狀彈倉
        const cyc = Math.sin((((f - 0.12) / 0.73) * 4 % 1) * Math.PI);
        hands.L = world(P.magwell, -0.05 - (1 - cyc) * 0.06);
      }
      if (a.empty) {
        if (P.bolt && R.bolt && f > 0.74 && f < 0.92) {
          const pull = bump(f, 0.74, 0.92);
          P.bolt.position.z = R.bolt.p.z + pull * 0.07;
          hands.L = world(P.bolt);
        }
        if (id === 'deagle' && P.slide && f > 0.8 && f < 0.9) P.slide.position.z = R.slide.p.z + 0.03;
        if (id === 'm870' && P.pump && f > 0.86 && f < 0.98) P.pump.position.z = R.pump.p.z + bump(f, 0.86, 0.98) * 0.085;
      }
    } else if (a.type === 'bolt' && P.bolt) {
      // 拉栓：上抬 → 後拉（拋殼）→ 推回 → 下壓
      const g = span(f, 0.15, 0.85);
      const lift = smooth(span(g, 0, 0.2)) * (1 - smooth(span(g, 0.8, 1)));
      const back = smooth(span(g, 0.2, 0.45)) * (1 - smooth(span(g, 0.55, 0.8)));
      P.bolt.rotation.z = lift * 1.2;
      P.bolt.position.z = R.bolt.p.z + back * 0.09;
      if (g > 0 && g < 1) hands.R = world(P.bolt.children[1] || P.bolt);
      if (back > 0.5 && !a.ejected) { a.ejected = true; this.ejectShell(); }
    } else if (a.type === 'pump' && P.pump) {
      const back = bump(f, 0.2, 0.95);
      P.pump.position.z = R.pump.p.z + back * 0.085;
      if (span(f, 0.2, 0.95) > 0.45 && !a.ejected) { a.ejected = true; this.ejectShell(); }
    } else if (a.type === 'throw') {
      if (P.pin) P.pin.visible = span(f, 0, 0.3) < 0.6;
      if (f < 0.3) hands.L = this.cur.localToWorld(new THREE.Vector3(0.03, 0.06, 0));
      if (f > 0.72) this.cur.visible = false;
    }
    return hands;
  }

  update(dt, st) {
    this.t += dt;
    if (!this.cur) return;
    const id = this.id, h = HOLD[id] || HOLD.ak47;

    const kz = this.kickZ.step(dt), kr = this.kickR.step(dt);

    // 視角慣性：轉頭時槍稍微落後
    const tx = THREE.MathUtils.clamp(-st.lookDX * 0.00055, -0.05, 0.05);
    const ty = THREE.MathUtils.clamp(st.lookDY * 0.00055, -0.04, 0.04);
    const follow = Math.min(1, dt * 9);
    this.sway.x += (tx - this.sway.x) * follow;
    this.sway.y += (ty - this.sway.y) * follow;

    // 走路晃動：8 字形
    const walking = st.onGround && st.speed > 0.5;
    this.bobAmt += ((walking ? Math.min(1, st.speed / 6) : 0) - this.bobAmt) * Math.min(1, dt * 6);
    this.bobPhase += dt * (5 + st.speed * 1.2) * (walking ? 1 : 0.3);
    const bobX = Math.sin(this.bobPhase) * 0.011 * this.bobAmt;
    const bobY = -Math.abs(Math.cos(this.bobPhase)) * 0.009 * this.bobAmt;
    const breath = Math.sin(this.t * 1.6) * 0.0018;

    // 舉槍
    this.draw = Math.min(1, this.draw + dt / this.drawDur);
    const lower = 1 - smooth(this.draw);

    let x = h.p[0] + bobX + this.sway.x;
    let y = h.p[1] + bobY + breath + this.sway.y - lower * 0.22 - (st.crouch ? 0.006 : 0);
    let z = h.p[2] + kz;
    let rx = h.r[0] + kr - lower * 0.9 + this.sway.y * 1.5;
    let ry = h.r[1] + this.sway.x * 2;
    let rz = h.r[2] + bobX * 2 + (st.crouch ? -0.03 : 0);

    // 沙漠之鷹滑套後座
    if (this.slideT > 0 && this.parts.slide) {
      this.slideT -= dt;
      this.parts.slide.position.z = this.rest.slide.p.z + Math.max(0, this.slideT) * 0.5;
    }

    // 動作
    let hands = { L: null, R: null };
    const a = this.anim;
    if (a) {
      a.t += dt;
      const f = Math.min(1, a.t / a.dur);
      const o = sampleKeys(KEYS[a.type], f, this._pose);
      const flip = a.dir || 1;                         // 揮刀左右交替
      x += o.x * flip; y += o.y; z += o.z; rx += o.rx; ry += o.ry * flip; rz += o.rz * flip;
      if (a.type === 'bolt') { const s = bump(f, 0.15, 0.85); rz += s * 0.18; rx += s * 0.06; y -= s * 0.015; }
      if (a.type === 'pump') { const s = bump(f, 0.2, 0.95); rz += s * 0.07; rx += s * 0.025; y -= s * 0.01; }
      if (a.type === 'reload' && a.empty && f > 0.74 && f < 0.92) rz -= bump(f, 0.74, 0.92) * 0.1;
      this.holder.position.set(x, y, z);
      this.holder.rotation.set(rx, ry, rz);
      this.holder.updateMatrixWorld(true);
      hands = this.animateParts(a, f);
      if (f >= 1) {
        this.anim = null;
        this.resetParts();
        if (a.type === 'throw') this.cur.visible = false;
      }
    }
    this.holder.position.set(x, y, z);
    this.holder.rotation.set(rx, ry, rz);
    this.holder.updateMatrixWorld(true);

    // 手臂：肩膀跟著槍的位移稍微移動
    const shift = this._shift.set((x - h.p[0]) * 0.6, (y - h.p[1]) * 0.6, (z - h.p[2]) * 0.5);
    const P = this.parts;
    const grip = hands.R || (P.grip ? P.grip.getWorldPosition(this._v) : this._v.set(x, y, z));
    const qR = this._q.copy(this.holder.quaternion).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -0.35));
    this.arms.R.solve(grip, qR, shift);
    const showL = id !== 'knife';
    this.arms.L.g.visible = showL;
    if (showL) {
      const fore = hands.L || (P.fore ? P.fore.getWorldPosition(this._v2) : grip);
      const qL = new THREE.Quaternion().copy(this.holder.quaternion).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0.3));
      this.arms.L.solve(fore, qL, id === 'deagle' ? shift.clone().add(new THREE.Vector3(0.12, 0, -0.1)) : shift);
    }

    // 槍口火焰與閃光
    if (this.flashT > 0) {
      this.flashT -= dt;
      if (this.flashT <= 0) this.flash.visible = false;
      this.flash.getWorldPosition(this.muzzleLight.position);
      this.muzzleLight.intensity = this.flashT > 0 ? 3 : 0;
    }

    // 彈殼
    for (const s of this.shells) {
      if (s.life <= 0) continue;
      s.life -= dt;
      s.v.y -= 9.8 * dt;
      s.mesh.position.addScaledVector(s.v, dt);
      s.mesh.rotation.x += s.w.x * dt;
      s.mesh.rotation.y += s.w.y * dt;
      if (s.life <= 0) s.mesh.visible = false;
    }

    // 光照跟著環境：室內、陰影下變暗
    if (st.sunDirCam) this.sun.position.copy(st.sunDirCam);
    this.sun.intensity = 2.6 * (st.light ?? 1);
    this.fill.intensity = 0.35 * (st.indoor ? 0.5 : 1);
  }
}
