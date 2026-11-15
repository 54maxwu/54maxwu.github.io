import * as THREE from 'three';

// 陣亡布娃娃：固定 120Hz 的 Verlet 粒子 + 約束，碰撞使用場景實際 OBB。
//
// 自然倒下的關鍵：
//   1. 中彈後不是立刻變軟：前 0.2～0.8 秒還有「殘餘肌肉張力」，上半身想維持姿勢、膝蓋先軟掉往下沉，
//      張力漸漸消失後才整個人癱倒（爆頭幾乎立刻斷電，爆炸直接被炸飛）。
//   2. 膝蓋、手肘是鉸鏈，只能往正確方向彎；四肢之間有最小距離，不會互相穿過或對折。
//   3. 頭、手、腳都有末端粒子，所以它們會跟著身體翻轉，不會僵在原本的角度。
//   4. 骨頭方向由「父骨頭的旋轉 + 擺動」一路傳下去，軀幹翻身時四肢也跟著扭轉。
//   5. 地面接觸時法向幾乎不反彈、切向有摩擦，身體會滑一下再停住，不會像橡膠一樣彈。

const STEP = 1 / 120;
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3(), _d = new THREE.Vector3();
const _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _m = new THREE.Matrix4();

function frameQuat(up, side, out) {
  const u = _a.copy(up).normalize();
  const s = _b.copy(side).addScaledVector(u, -side.dot(u)).normalize();
  const f = _c.crossVectors(s, u);
  return out.setFromRotationMatrix(_m.makeBasis(s, u, f));
}

export class Ragdoll {
  // opts：{ point, force, explosive, rng }
  constructor(bones, world, direction, velocity, headshot, opts = {}) {
    this.bones = bones; this.world = world; this.acc = 0; this.t = 0; this.still = 0; this.asleep = false;
    const rng = opts.rng || Math.random;
    const idx = (n) => bones.findIndex((b) => b.name === n);
    this.I = Object.fromEntries(bones.map((b, i) => [b.name, i]));
    const root = bones[0].parent;
    root.updateWorldMatrix(true, true);
    this.rootQ = root.getWorldQuaternion(new THREE.Quaternion());

    const mass = (n) => /hips|spine|chest/.test(n) ? 3 : /head|thigh/.test(n) ? 1.6 : 1;
    const radius = (n) => /head/.test(n) ? 0.12 : /hips|chest|spine/.test(n) ? 0.15 : /thigh|shin/.test(n) ? 0.075 : 0.06;
    this.nodes = bones.map((b) => ({
      p: b.getWorldPosition(new THREE.Vector3()), prev: new THREE.Vector3(),
      q0: b.getWorldQuaternion(new THREE.Quaternion()), r: radius(b.name), w: 1 / mass(b.name),
      cn: new THREE.Vector3(), hit: false,
    }));

    // 末端粒子：頭頂、手指尖、腳尖
    this.children = bones.map(() => []);
    bones.forEach((b, i) => { const p = bones.indexOf(b.parent); if (p >= 0) this.children[p].push(i); });
    const tip = (bone, local, r) => {
      const i = this.I[bone]; if (i === undefined) return;
      const p = bones[i].localToWorld(new THREE.Vector3(...local));
      this.nodes.push({ p, prev: new THREE.Vector3(), q0: null, r, w: 1, cn: new THREE.Vector3(), hit: false });
      this.children[i].push(this.nodes.length - 1);
    };
    tip('head', [0, 0.2, 0.01], 0.11);
    tip('handR', [0, -0.12, 0], 0.05); tip('handL', [0, -0.12, 0], 0.05);
    tip('footR', [0, -0.06, -0.16], 0.05); tip('footL', [0, -0.06, -0.16], 0.05);
    const N = this.nodes.length;
    const nodeOf = (name) => name.endsWith('Tip') ? this.children[this.I[name.slice(0, -3)]].find((c) => c >= bones.length) : this.I[name];

    // ─── 約束 ───
    this.links = [];
    const link = (a, b, k = 1, lo = 1, hi = 1) => {
      if (a === undefined || b === undefined || a < 0 || b < 0) return;
      const L = this.nodes[a].p.distanceTo(this.nodes[b].p);
      this.links.push({ a, b, min: L * lo, max: L * hi, k });
    };
    this.children.forEach((ch, p) => ch.forEach((c) => link(p, c)));
    // 軀幹與骨盆幾乎是剛體，脊椎留一點彎曲
    const n = nodeOf;
    for (const [a, b] of [['hips', 'chest'], ['hips', 'shoulderR'], ['hips', 'shoulderL'], ['shoulderR', 'shoulderL'], ['thighR', 'thighL'], ['spine', 'shoulderR'], ['spine', 'shoulderL']]) link(n(a), n(b), 1, 0.96, 1.02);
    link(n('hips'), n('thighR')); link(n('hips'), n('thighL'));
    link(n('thighR'), n('spine'), 1, 0.92, 1.04); link(n('thighL'), n('spine'), 1, 0.92, 1.04);
    // 頭可以點頭、側倒，但不會整顆折到背後
    link(n('chest'), n('headTip'), 0.8, 0.86, 1.0); link(n('shoulderR'), n('headTip'), 0.6, 0.82, 1.06); link(n('shoulderL'), n('headTip'), 0.6, 0.82, 1.06);
    link(n('chest'), n('head'), 1, 0.92, 1.0);
    // 腳掌：腳尖和小腿保持角度範圍（腳踝）
    link(n('shinR'), n('footRTip'), 0.7, 0.85, 1.05); link(n('shinL'), n('footLTip'), 0.7, 0.85, 1.05);
    // 手腕
    link(n('forearmR'), n('handRTip'), 0.5, 0.8, 1.0); link(n('forearmL'), n('handLTip'), 0.5, 0.8, 1.0);
    // 肩關節活動範圍：上臂末端（手肘）不會穿進軀幹或甩到太遠
    link(n('chest'), n('forearmR'), 0.5, 0.55, 1.6); link(n('chest'), n('forearmL'), 0.5, 0.55, 1.6);
    link(n('hips'), n('forearmR'), 0.4, 0.45, 2.0); link(n('hips'), n('forearmL'), 0.4, 0.45, 2.0);
    // 髖關節：膝蓋不會往後甩到背後
    link(n('chest'), n('shinR'), 0.5, 0.78, 1.25); link(n('chest'), n('shinL'), 0.5, 0.78, 1.25);

    // 最小距離（簡化的自身碰撞）
    this.apart = [];
    const apart = (a, b, d) => this.apart.push({ a: n(a), b: n(b), d });
    apart('shinR', 'shinL', 0.13); apart('footR', 'footL', 0.12); apart('footRTip', 'footLTip', 0.1);
    apart('thighR', 'shinL', 0.12); apart('thighL', 'shinR', 0.12);
    for (const s of ['R', 'L']) {
      apart('hand' + s, 'chest', 0.15); apart('hand' + s, 'hips', 0.13); apart('hand' + s, 'spine', 0.15);
      apart('upperArm' + s, 'hand' + s, 0.13);   // 手肘不會完全對折
      apart('thigh' + s, 'foot' + s, 0.24);      // 膝蓋不會完全對折
      apart('hand' + s + 'Tip', 'head', 0.14);
    }

    // 鉸鏈：[根, 關節, 末端, 方向]，方向 +1 = 關節往身體前方凸（膝蓋），-1 = 往後凸（手肘）
    this.hinges = [];
    for (const s of ['R', 'L']) {
      this.hinges.push({ a: n('thigh' + s), b: n('shin' + s), c: n('foot' + s), sign: 1, leg: true });
      this.hinges.push({ a: n('upperArm' + s), b: n('forearm' + s), c: n('hand' + s), sign: -1, leg: false });
    }

    // 旋轉：記住軀幹在綁定姿勢下的座標框，四肢記住指向子骨頭的方向
    const P = (name) => this.nodes[n(name)].p;
    this.hipsRest = frameQuat(_d.copy(P('spine')).sub(P('hips')), new THREE.Vector3().copy(P('thighR')).sub(P('thighL')), new THREE.Quaternion());
    this.chestRest = frameQuat(_d.copy(P('neck')).sub(P('chest')), new THREE.Vector3().copy(P('shoulderR')).sub(P('shoulderL')), new THREE.Quaternion());
    this.axes = this.children.slice(0, bones.length).map((ch, i) => ch.length ? this.nodes[ch[0]].p.clone().sub(this.nodes[i].p).normalize() : null);
    this.delta = bones.map(() => new THREE.Quaternion());

    // ─── 初速：角色原本的移動 + 命中衝量（以命中點為中心往外衰減）───
    const dir = direction.clone(); if (dir.lengthSq() > 0) dir.normalize();
    const explosive = !!opts.explosive;
    const force = opts.force ?? (headshot ? 2.2 : 1.5);
    const hitP = opts.point || (headshot ? P('head') : P('chest'));
    const kick = dir.clone();
    if (explosive) kick.y = Math.max(kick.y, 0) + 0.55;
    for (let i = 0; i < N; i++) {
      const nd = this.nodes[i];
      const fall = Math.exp(-nd.p.distanceTo(hitP) / 0.28);
      const k = force * (0.22 + 0.78 * fall) * (explosive ? 1 : nd.w * 1.4);
      nd.prev.copy(nd.p).addScaledVector(velocity, -STEP * 0.85).addScaledVector(kick, -k * STEP);
    }

    // ─── 殘餘肌肉張力 ───
    // 頭部中彈幾乎立刻斷電；身體中彈會先腿軟、上身撐一下再倒；爆炸直接飛出去
    this.tone = explosive ? 0 : headshot ? 0.1 + rng() * 0.08 : 0.45 + rng() * 0.35;
    this.tone0 = this.tone;
    const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(this.rootQ); fwd.y = 0; fwd.normalize();
    this.fwd = fwd;
    // 倒下方向：多半順著子彈方向，偶爾往前撲倒或往側邊（看起來不會每次都一樣）
    const flat = dir.clone(); flat.y = 0; if (flat.lengthSq() < 1e-4) flat.copy(fwd).negate(); flat.normalize();
    const side = new THREE.Vector3(-flat.z, 0, flat.x);
    const r = rng();
    this.fallDir = r < 0.55 ? flat.clone() : r < 0.8 ? flat.clone().addScaledVector(side, rng() < 0.5 ? 0.9 : -0.9).normalize() : fwd.clone();
    this.buckle = 0.6 + rng() * 0.6;   // 膝蓋軟掉的力度
    const hips = P('hips');
    this.rel = this.nodes.map((nd) => nd.p.clone().sub(hips));
    this.upper = new Set(['spine', 'chest', 'neck', 'head', 'shoulderR', 'shoulderL', 'upperArmR', 'upperArmL', 'forearmR', 'forearmL'].map(n));
    this.upper.add(n('headTip'));
    this.shins = [n('shinR'), n('shinL')];
    this.hipsI = n('hips');
  }

  collide(nd) {
    const p = nd.p, r = nd.r;
    const cs = this.world.query(p.x - r, p.z - r, p.x + r, p.z + r);
    for (const c of cs) {
      if (!c.solid || p.y + r < c.bottom || p.y - r > c.top) continue;
      const [x, z] = c.toLocal(p.x, p.z), y = p.y - c.y;
      const qx = Math.max(-c.hx, Math.min(c.hx, x)), qy = Math.max(-c.hy, Math.min(c.hy, y)), qz = Math.max(-c.hz, Math.min(c.hz, z));
      let dx = x - qx, dy = y - qy, dz = z - qz, push;
      const dist = Math.hypot(dx, dy, dz);
      if (dist >= r) continue;
      if (dist > 1e-8) { push = r - dist; dx /= dist; dy /= dist; dz /= dist; }
      else {
        const gaps = [c.hx - Math.abs(x), c.hy - Math.abs(y), c.hz - Math.abs(z)];
        const a = gaps.indexOf(Math.min(...gaps));
        dx = a === 0 ? (x < 0 ? -1 : 1) : 0; dy = a === 1 ? (y < 0 ? -1 : 1) : 0; dz = a === 2 ? (z < 0 ? -1 : 1) : 0;
        push = r + gaps[a];
      }
      const [wx, wz] = c.toWorldDir(dx, dz);
      p.x += wx * push; p.y += dy * push; p.z += wz * push;
      nd.cn.set(wx, dy, wz); nd.hit = true;
    }
  }

  // 接觸反應每步只做一次：法向吸收、切向摩擦
  contact(nd) {
    if (!nd.hit) return;
    const v = _a.copy(nd.p).sub(nd.prev), vn = v.dot(nd.cn);
    const vt = _b.copy(v).addScaledVector(nd.cn, -vn);
    const sp = vt.length();
    // 庫侖摩擦：慢的時候直接停住（靜摩擦），快的時候滑一段
    const drop = 0.0009 + 0.25 * Math.abs(vn);
    vt.multiplyScalar(sp > drop ? (sp - drop) / sp * 0.9 : 0);
    v.copy(vt).addScaledVector(nd.cn, vn < 0 ? -vn * 0.06 : vn * 0.3);
    nd.prev.copy(nd.p).sub(v);
  }

  solveLinks() {
    const nodes = this.nodes;
    for (const l of this.links) {
      const A = nodes[l.a], B = nodes[l.b];
      const d = _a.copy(B.p).sub(A.p), L = d.length();
      if (L < 1e-8) continue;
      const target = L < l.min ? l.min : L > l.max ? l.max : L;
      if (target === L) continue;
      const ws = A.w + B.w, f = (L - target) / L * l.k / ws;
      A.p.addScaledVector(d, f * A.w); B.p.addScaledVector(d, -f * B.w);
    }
    for (const s of this.apart) {
      const A = nodes[s.a], B = nodes[s.b];
      const d = _a.copy(B.p).sub(A.p), L = d.length();
      if (L >= s.d || L < 1e-8) continue;
      const ws = A.w + B.w, f = (L - s.d) / L / ws;
      A.p.addScaledVector(d, f * A.w); B.p.addScaledVector(d, -f * B.w);
    }
  }

  solveHinges() {
    const nodes = this.nodes, I = this.I;
    const sideLeg = _c.copy(nodes[I.thighR].p).sub(nodes[I.thighL].p).normalize();
    const sideArm = _d.copy(nodes[I.shoulderR].p).sub(nodes[I.shoulderL].p).normalize();
    for (const h of this.hinges) {
      const A = nodes[h.a].p, B = nodes[h.b].p, C = nodes[h.c].p;
      const ac = _a.copy(C).sub(A);
      const f = _b.crossVectors(h.leg ? sideLeg : sideArm, ac);
      if (f.lengthSq() < 1e-10) continue;
      f.normalize();
      const off = (B.x - A.x) * f.x + (B.y - A.y) * f.y + (B.z - A.z) * f.z;
      const want = 0.012;   // 留一點點自然彎曲，避免完全打直時抖動
      const bad = h.sign > 0 ? want - off : off + want;
      if (bad <= 0) continue;
      // 關節往正確那側推，兩端各退一點，讓長度約束接手修正
      B.addScaledVector(f, h.sign * bad * 0.7);
      A.addScaledVector(f, -h.sign * bad * 0.15); C.addScaledVector(f, -h.sign * bad * 0.15);
    }
  }

  // 殘餘肌肉：上半身維持形狀並慢慢往倒下方向傾，膝蓋往前下方軟掉
  muscles() {
    const k = THREE.MathUtils.clamp(1 - this.t / this.tone0, 0, 1);
    if (k <= 0) return;
    const nodes = this.nodes, hips = nodes[this.hipsI].p;
    const s = 0.16 * k * k;
    const tilt = (1 - k) * 0.9;   // 張力消失時上身已經傾了約 50 度
    const axis = _c.set(this.fallDir.z, 0, -this.fallDir.x);
    _q.setFromAxisAngle(axis, tilt);   // 繞 up×fallDir 轉正角度＝往倒下方向傾
    for (const i of this.upper) {
      const target = _a.copy(this.rel[i]).applyQuaternion(_q).add(hips);
      nodes[i].p.lerp(target, s);
    }
    // 膝蓋往前、骨盆往下：腿軟跪倒的感覺
    const g = STEP * STEP;
    for (const i of this.shins) nodes[i].p.addScaledVector(this.fwd, 7 * this.buckle * k * g).y -= 3 * this.buckle * k * g;
    nodes[this.hipsI].p.y -= 5 * this.buckle * k * g;
  }

  update(dt) {
    if (this.asleep) return;
    this.acc = Math.min(this.acc + dt, 0.1);
    const nodes = this.nodes;
    while (this.acc >= STEP) {
      this.acc -= STEP; this.t += STEP;
      let vmax = 0;
      for (const nd of nodes) {
        const v = _a.copy(nd.p).sub(nd.prev).multiplyScalar(nd.hit ? 0.985 : 0.998);
        vmax = Math.max(vmax, v.lengthSq());
        nd.prev.copy(nd.p); nd.p.add(v); nd.p.y -= 9.8 * STEP * STEP;
        nd.hit = false;
      }
      this.muscles();
      for (let it = 0; it < 8; it++) {
        this.solveLinks();
        this.solveHinges();
        for (const nd of nodes) this.collide(nd);
      }
      for (const nd of nodes) this.contact(nd);
      // 靜止 0.6 秒後休眠，省下運算
      this.still = vmax < (0.02 * STEP) ** 2 && this.t > 1.5 ? this.still + STEP : 0;
      if (this.still > 0.6) { this.asleep = true; break; }
    }
    this.pose();
  }

  pose() {
    const nodes = this.nodes, bones = this.bones, I = this.I;
    bones[0].parent.updateWorldMatrix(true, false);
    const P = (i) => nodes[i].p;
    // 骨盆與胸口用完整座標框（保留翻身），其他骨頭沿著父骨頭旋轉再擺向子粒子
    frameQuat(_d.copy(P(I.spine)).sub(P(I.hips)), _b.clone().copy(P(I.thighR)).sub(P(I.thighL)), this.delta[I.hips]).multiply(_q2.copy(this.hipsRest).invert());
    frameQuat(_d.copy(P(I.neck)).sub(P(I.chest)), _b.clone().copy(P(I.shoulderR)).sub(P(I.shoulderL)), this.delta[I.chest]).multiply(_q2.copy(this.chestRest).invert());
    bones.forEach((b, i) => {
      const parent = bones.indexOf(b.parent);
      if (i !== I.hips && i !== I.chest) {
        const D = this.delta[i].copy(parent >= 0 ? this.delta[parent] : this.delta[I.hips]);
        const ch = this.children[i];
        if (ch.length) {
          const now = _a.copy(P(ch[0])).sub(P(i));
          if (now.lengthSq() > 1e-10) {
            const was = _b.copy(this.axes[i]).applyQuaternion(D);
            D.premultiply(_q.setFromUnitVectors(was, now.normalize()));
          }
        }
      }
      const desired = _q.copy(this.delta[i]).multiply(nodes[i].q0);
      b.position.copy(b.parent.worldToLocal(_c.copy(P(i))));
      b.parent.getWorldQuaternion(_q2);
      b.quaternion.copy(_q2.invert().multiply(desired));
      b.updateWorldMatrix(false, false);
    });
  }
}
