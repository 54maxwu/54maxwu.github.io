// 樹義國小校園對戰：視覺特效
//
// 對外介面（new Effects(scene, T, camera)）
//   muzzle(pos, dir, big)        第三人稱槍口火焰＋槍口煙
//   tracer(from, to)             曳光
//   impact(p, n, mat, dir)       子彈命中：flesh／metal／wood／mesh／其他（石材類）
//   light(pos, intensity, dur, color?, dist?)  短暫閃光
//   explosion(p)  bloodSplat(p)  shake（鏡頭震動量，外部讀寫）
//   破壞相關：shatter、debris、slash、casing、remnants、wakeRubble、clearDecalsIn、clearDecals
//   update(dt, t, camera)        每幀呼叫
//
// 粒子物件格式（emit 的參數）：
//   { x,y,z 位置, vx,vy,vz 速度, life 已存活秒數（通常 0）, max 壽命,
//     s0→s1 大小（公尺）, r,g,b 顏色（可 >1 表示發光）, a0→a1 透明度,
//     grav 重力（負值往上飄）, drag 空氣阻力, floor? 落地高度 }
import * as THREE from 'three';

// ───────── 粒子池 ─────────
// 以「欄位陣列」存放（每個屬性一條 Float32Array），不產生垃圾物件；
// 死掉的粒子用最後一顆補位，所以有效粒子永遠是前 n 顆。

const FIELDS = ['x', 'y', 'z', 'vx', 'vy', 'vz', 'age', 'ttl', 's0', 's1', 'r', 'g', 'b', 'a0', 'a1', 'grav', 'drag', 'floor'];

class ParticlePool {
  constructor(scene, tex, additive, max) {
    this.max = max;
    this.n = 0;
    this.ring = 0;
    this.f = {};
    for (const k of FIELDS) this.f[k] = new Float32Array(max);

    this.posBuf = new Float32Array(max * 3);
    this.colBuf = new Float32Array(max * 4);
    this.sizeBuf = new Float32Array(max);
    const g = this.geo = new THREE.BufferGeometry();
    const attr = (arr, n) => new THREE.BufferAttribute(arr, n).setUsage(THREE.DynamicDrawUsage);
    g.setAttribute('position', attr(this.posBuf, 3));
    g.setAttribute('color', attr(this.colBuf, 4));
    g.setAttribute('size', attr(this.sizeBuf, 1));
    g.setDrawRange(0, 0);

    this.mat = new THREE.ShaderMaterial({
      uniforms: { map: { value: tex }, scale: { value: 800 } },
      vertexShader: /* glsl */`
        attribute float size;
        attribute vec4 color;
        uniform float scale;
        varying vec4 vColor;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          float dist = max(0.05, -mv.z);
          vColor = color;
          // 貼在鏡頭前的大煙團會整個糊住畫面，靠近時淡出
          vColor.a *= smoothstep(0.25, 1.2, dist);
          gl_PointSize = min(size * scale / dist, 1024.0);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */`
        uniform sampler2D map;
        varying vec4 vColor;
        void main() {
          vec4 t = texture2D(map, gl_PointCoord);
          gl_FragColor = vec4(vColor.rgb * t.rgb, vColor.a * t.a);
          if (gl_FragColor.a < 0.004) discard;
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
      transparent: true,
      depthWrite: false,
      blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    });
    this.points = new THREE.Points(g, this.mat);
    this.points.frustumCulled = false;
    this.points.renderOrder = additive ? 5 : 4;
    scene.add(this.points);
  }

  emit(o) {
    let i;
    if (this.n < this.max) i = this.n++;
    else { i = this.ring; this.ring = (this.ring + 1) % this.max; }   // 滿了就輪流覆蓋
    const f = this.f;
    f.x[i] = o.x; f.y[i] = o.y; f.z[i] = o.z;
    f.vx[i] = o.vx || 0; f.vy[i] = o.vy || 0; f.vz[i] = o.vz || 0;
    f.age[i] = o.life || 0; f.ttl[i] = o.max;
    f.s0[i] = o.s0; f.s1[i] = o.s1 ?? o.s0;
    f.r[i] = o.r; f.g[i] = o.g; f.b[i] = o.b;
    f.a0[i] = o.a0; f.a1[i] = o.a1 ?? 0;
    f.grav[i] = o.grav || 0; f.drag[i] = o.drag || 0;
    f.floor[i] = o.floor === undefined ? -1e9 : o.floor;
  }

  kill(i) {
    const last = --this.n, f = this.f;
    if (i !== last) for (const k of FIELDS) f[k][i] = f[k][last];
  }

  update(dt) {
    const f = this.f, P = this.posBuf, C = this.colBuf, S = this.sizeBuf;
    let i = 0;
    while (i < this.n) {
      const age = (f.age[i] += dt);
      if (age >= f.ttl[i]) { this.kill(i); continue; }
      const k = Math.exp(-f.drag[i] * dt);
      f.vx[i] *= k; f.vz[i] *= k;
      f.vy[i] = f.vy[i] * k - f.grav[i] * dt;
      f.x[i] += f.vx[i] * dt; f.y[i] += f.vy[i] * dt; f.z[i] += f.vz[i] * dt;
      if (f.y[i] < f.floor[i]) {           // 碰到地面：小彈跳、摩擦
        f.y[i] = f.floor[i];
        f.vy[i] *= -0.25; f.vx[i] *= 0.45; f.vz[i] *= 0.45;
      }
      const t = age / f.ttl[i];
      P[i * 3] = f.x[i]; P[i * 3 + 1] = f.y[i]; P[i * 3 + 2] = f.z[i];
      C[i * 4] = f.r[i]; C[i * 4 + 1] = f.g[i]; C[i * 4 + 2] = f.b[i];
      C[i * 4 + 3] = f.a0[i] + (f.a1[i] - f.a0[i]) * t;
      S[i] = f.s0[i] + (f.s1[i] - f.s0[i]) * t;
      i++;
    }
    const g = this.geo;
    g.setDrawRange(0, this.n);
    if (this.n) {
      g.attributes.position.needsUpdate = true;
      g.attributes.color.needsUpdate = true;
      g.attributes.size.needsUpdate = true;
    }
  }
}

// ───────── 表面貼片（彈孔、血跡、焦痕、刀痕） ─────────
// 環狀緩衝：超過上限時覆蓋最舊的一張。每張有一點色調差異，避免看起來是同一張貼圖蓋章。

const _Z = new THREE.Vector3(0, 0, 1);

class DecalLayer {
  constructor(scene, tex, max, opts = {}) {
    const mat = new THREE.MeshStandardMaterial({
      map: tex, transparent: true, depthWrite: false,
      polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4,
      roughness: 0.9, metalness: 0, ...opts,
    });
    this.mesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), mat, max);
    this.mesh.count = 0;
    this.mesh.frustumCulled = false;
    this.mesh.receiveShadow = true;
    this.mesh.renderOrder = 2;
    this.mesh.setColorAt(0, new THREE.Color(1, 1, 1));   // 建立 instanceColor
    scene.add(this.mesh);
    this.max = max;
    this.i = 0;   // 已放過的總數（clearDecals 會歸零）
    this._m = new THREE.Matrix4(); this._q = new THREE.Quaternion(); this._spin = new THREE.Quaternion();
    this._p = new THREE.Vector3(); this._s = new THREE.Vector3(); this._c = new THREE.Color();
  }

  place(p, n, sx, sy, angle) {
    const q = this._q.setFromUnitVectors(_Z, n).multiply(this._spin.setFromAxisAngle(_Z, angle));
    this._p.copy(p).addScaledVector(n, 0.003);
    this._m.compose(this._p, q, this._s.set(sx, sy, 1));
    const slot = this.i % this.max;
    this.mesh.setMatrixAt(slot, this._m);
    const v = 0.88 + Math.random() * 0.12;
    this.mesh.setColorAt(slot, this._c.setRGB(v, v, v * (0.97 + Math.random() * 0.03)));
    this.i++;
    this.mesh.count = Math.min(this.i, this.max);
    this.mesh.instanceMatrix.needsUpdate = true;
    this.mesh.instanceColor.needsUpdate = true;
  }

  add(p, n, size) { this.place(p, n, size, size, Math.random() * Math.PI * 2); }

  addAligned(p, n, sx, sy, angle) { this.place(p, n, sx, sy, angle); }
}

// 曳光貼圖：橫向是彈頭（右）→ 尾巴（左）的亮度漸層，縱向是細細的光芯
function makeTracerTex() {
  const W = 128, H = 16, c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d'), img = ctx.createImageData(W, H), d = img.data;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const along = x / (W - 1);                                  // 0 尾 → 1 頭
    const across = Math.abs((y + 0.5) / H * 2 - 1);
    const core = Math.exp(-across * across * 14);
    const a = Math.pow(along, 1.6) * core;
    const i = (y * W + x) * 4;
    d[i] = 255; d[i + 1] = 200 + 55 * core; d[i + 2] = 130 + 110 * core; d[i + 3] = a * 255;
  }
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const rand = (a, b) => a + Math.random() * (b - a);
const spread = (k) => (Math.random() - 0.5) * k;

// 刀痕：細長、兩端尖的刻痕，中間深色、邊緣崩出較淺的碎面
function slashTex() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 32;
  const x = c.getContext('2d');
  const body = (w, col) => { x.fillStyle = col; x.beginPath(); x.moveTo(4, 16); x.quadraticCurveTo(128, 16 - w, 252, 16); x.quadraticCurveTo(128, 16 + w, 4, 16); x.fill(); };
  body(13, 'rgba(205,190,170,0.55)');
  body(7, 'rgba(120,105,90,0.85)');
  body(3, 'rgba(25,20,18,0.95)');
  for (let i = 0; i < 26; i++) { const px = 20 + Math.random() * 216, w = 1 + Math.random() * 2; x.fillStyle = 'rgba(220,205,185,0.6)'; x.fillRect(px, 16 + (Math.random() < 0.5 ? -1 : 1) * (5 + Math.random() * 5), w, w); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

// 材質顏色（碎塊、殘塊共用）
const KIND_COL = { brick: [0.66, 0.36, 0.28], granite: [0.52, 0.51, 0.49], plaster: [0.9, 0.88, 0.84], white: [0.9, 0.88, 0.84], beige: [0.88, 0.8, 0.64], wood: [0.5, 0.36, 0.22], board: [0.2, 0.32, 0.26], bark: [0.4, 0.3, 0.22], tree: [0.4, 0.3, 0.22], green: [0.18, 0.42, 0.3], red: [0.7, 0.2, 0.18], blue: [0.2, 0.35, 0.65], yellow: [0.85, 0.68, 0.25], concrete: [0.72, 0.7, 0.66], stone: [0.7, 0.68, 0.63], quarry: [0.6, 0.36, 0.29], terrazzo: [0.8, 0.76, 0.7], pebble: [0.6, 0.57, 0.52], roof: [0.6, 0.25, 0.18] };
const STONY = new Set(['brick', 'granite', 'plaster', 'white', 'beige', 'concrete', 'stone', 'quarry', 'terrazzo', 'pebble', 'roof']);
const RC = new Set(['concrete', 'granite', 'stone', 'white', 'beige']);

// 靜態實例集合：只在內容變動時重建矩陣（地上殘骸、斷面殘塊、鋼筋）
class StaticSet {
  constructor(scene, geo, mat, max, shadow) {
    this.max = max; this.items = []; this.dirty = false;
    this.mesh = new THREE.InstancedMesh(geo, mat, max);
    this.mesh.count = 0; this.mesh.frustumCulled = false; this.mesh.castShadow = !!shadow; this.mesh.receiveShadow = true;
    scene.add(this.mesh); this._d = new THREE.Object3D(); this._c = new THREE.Color();
  }
  add(it) { if (this.items.length >= this.max) this.items.shift(); this.items.push(it); this.dirty = true; }
  remove(fn) { const n = this.items.length; this.items = this.items.filter((it) => !fn(it)); if (this.items.length !== n) this.dirty = true; }
  clear() { this.items = []; this.dirty = true; }
  flush() {
    if (!this.dirty) return; this.dirty = false;
    const D = this._d, M = this.mesh;
    for (let i = 0; i < this.items.length; i++) {
      const it = this.items[i];
      D.position.copy(it.p); D.quaternion.copy(it.q); D.scale.copy(it.s); D.updateMatrix(); M.setMatrixAt(i, D.matrix);
      if (it.col) M.setColorAt(i, this._c.setRGB(it.col[0], it.col[1], it.col[2]));
    }
    M.count = this.items.length; M.instanceMatrix.needsUpdate = true; if (M.instanceColor) M.instanceColor.needsUpdate = true;
  }
}


export class Effects {
  constructor(scene, T, camera) {
    this.scene = scene; this.camera = camera; this.T = T;
    this.add = new ParticlePool(scene, T.glow, true, 900);      // 發光：火花、火球
    this.smoke = new ParticlePool(scene, T.puff, false, 900);   // 不發光：煙、塵、木屑、血霧
    this.decals = {
      metal: new DecalLayer(scene, T.holeMetal, 300),
      wood: new DecalLayer(scene, T.holeWood, 250),
      concrete: new DecalLayer(scene, T.holeStone, 700),
      slash: new DecalLayer(scene, slashTex(), 300),
      blood: new DecalLayer(scene, T.blood, 60),
      scorch: new DecalLayer(scene, T.scorch, 12),
    };

    // 曳光：一條朝向鏡頭的細長面片
    this.tracerMax = 48;
    this.tracers = [];
    this.tracerMesh = new THREE.InstancedMesh(
      new THREE.PlaneGeometry(1, 1),
      // 白天的亮背景會把加法混合的光吃掉，所以用一般混合、偏橘黃的實色
      new THREE.MeshBasicMaterial({ map: makeTracerTex(), color: 0xffc860, transparent: true, opacity: 0.95, side: THREE.DoubleSide, depthWrite: false, toneMapped: false }),
      this.tracerMax,
    );
    this.tracerMesh.count = 0; this.tracerMesh.frustumCulled = false; this.tracerMesh.renderOrder = 6;
    scene.add(this.tracerMesh);

    // 第三人稱槍口火焰（其他角色開槍時看到的）
    this.flashes = Array.from({ length: 12 }, (_, i) => {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: T.flash[i % T.flash.length], blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, color: 0xffe0b0 }));
      s.visible = false; s.renderOrder = 7; scene.add(s);
      return { s, t: 0 };
    });
    this.flashNext = 0;

    // 閃光用的點光源：數量固定，避免開關燈時重新編譯 shader
    this.lights = Array.from({ length: 3 }, () => {
      const l = new THREE.PointLight(0xffa850, 0, 9, 2);
      scene.add(l);
      return { l, t: 0, dur: 1, peak: 0 };
    });
    this.lightNext = 0;
    // 玻璃碎片：三角形實體碎片（InstancedMesh），會旋轉、落地彈跳後淡出
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.Float32BufferAttribute([0, 0.55, 0, -0.5, -0.4, 0.02, 0.48, -0.32, -0.02], 3));
    sg.computeVertexNormals();
    this.shardMax = 600; this.shards = []; this._dummy = new THREE.Object3D();
    this.shardMesh = new THREE.InstancedMesh(sg, new THREE.MeshStandardMaterial({ color: 0xd6eef3, roughness: 0.04, metalness: 0.35, transparent: true, opacity: 0.82, side: THREE.DoubleSide, depthWrite: false }), this.shardMax);
    this.shardMesh.count = 0; this.shardMesh.frustumCulled = false; this.shardMesh.renderOrder = 4; scene.add(this.shardMesh);
    // 破壞碎塊：小方塊（磚塊、水泥、木屑、樹葉），依材質上色
    this.chunkMax = 1000; this.chunks = [];
    this.chunkMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ roughness: 0.92, metalness: 0 }), this.chunkMax);
    this.chunkMesh.count = 0; this.chunkMesh.frustumCulled = false; this.chunkMesh.castShadow = true; scene.add(this.chunkMesh);
    this._col = new THREE.Color();
    // 落地後的碎塊轉成靜態殘骸，不再消失（新一局才清掉）
    this.rubble = new StaticSet(scene, new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ roughness: 0.95, metalness: 0 }), 2600, true);
    // 斷面殘塊：被打掉的牆/柱在相鄰結構上留下參差不齊的斷口
    this.jag = new StaticSet(scene, new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ roughness: 0.95, metalness: 0 }), 4000, true);
    // 外露鋼筋
    this.rebar = new StaticSet(scene, new THREE.CylinderGeometry(0.5, 0.5, 1, 5), new THREE.MeshStandardMaterial({ color: 0x5a4436, roughness: 0.7, metalness: 0.55 }), 1400, false);
    // 彈殼
    this.caseMax = 260; this.cases = [];
    this.caseMesh = new THREE.InstancedMesh(new THREE.CylinderGeometry(1, 1, 1, 7), new THREE.MeshStandardMaterial({ color: 0xc9a046, roughness: 0.3, metalness: 0.9 }), this.caseMax);
    this.caseMesh.count = 0; this.caseMesh.frustumCulled = false; scene.add(this.caseMesh);
    this.shake = 0;
    this._tm = new THREE.Matrix4(); this._ta = new THREE.Vector3(); this._tb = new THREE.Vector3(); this._tc = new THREE.Vector3(); this._tmid = new THREE.Vector3();
  }

  light(pos, intensity, dur, color = 0xffa850, dist = 9) {
    const L = this.lights[this.lightNext++ % this.lights.length];
    L.l.position.copy(pos); L.l.color.set(color); L.l.distance = dist;
    L.t = L.dur = dur; L.peak = intensity; L.l.intensity = intensity;
  }

  muzzle(pos, dir, big = 1) {
    const F = this.flashes[this.flashNext++ % this.flashes.length];
    F.s.position.copy(pos).addScaledVector(dir, 0.05);
    F.s.material.rotation = Math.random() * Math.PI * 2;
    F.s.scale.setScalar(0.42 * big * rand(0.8, 1.2));
    F.s.visible = true; F.t = 0.05;
    this.light(pos, 6 * big, 0.06);
    // 兩小團槍口煙，往槍口方向推出後緩緩上飄
    for (let i = 0; i < 2; i++) {
      this.smoke.emit({ x: pos.x, y: pos.y, z: pos.z, vx: dir.x * rand(0.8, 1.8), vy: 0.25 + dir.y, vz: dir.z * rand(0.8, 1.8), max: rand(0.5, 0.8), s0: 0.08, s1: 0.45, r: 0.72, g: 0.71, b: 0.7, a0: 0.16, a1: 0, grav: -0.35, drag: 3.2 });
    }
  }

  tracer(from, to) {
    const len = from.distanceTo(to);
    if (len < 2) return;
    this.tracers.push({ from: from.clone(), dir: to.clone().sub(from).divideScalar(len), len, t: 0 });
    if (this.tracers.length > this.tracerMax) this.tracers.shift();
  }

  impact(p, n, mat, dir) {
    const S = this.smoke, A = this.add;
    if (mat === 'flesh') {
      // 血霧＋往後噴的血滴（會落地）
      for (let i = 0; i < 9; i++) S.emit({ x: p.x, y: p.y, z: p.z, vx: dir.x * 1.8 + spread(1.6), vy: rand(0, 1.1), vz: dir.z * 1.8 + spread(1.6), max: rand(0.3, 0.6), s0: 0.05, s1: 0.3, r: 0.42, g: 0.02, b: 0.03, a0: 0.75, a1: 0, grav: 1.8, drag: 4 });
      for (let i = 0; i < 7; i++) S.emit({ x: p.x, y: p.y, z: p.z, vx: dir.x * 3 + spread(2.2), vy: rand(0.3, 2.2), vz: dir.z * 3 + spread(2.2), max: 0.65, s0: 0.035, s1: 0.03, r: 0.33, g: 0, b: 0.01, a0: 1, a1: 0.6, grav: 9.8, drag: 0.5, floor: 0.01 });
      return;
    }
    if (mat === 'metal') {
      // 火花：沿反彈方向噴出，受重力下墜
      const count = 6 + ((Math.random() * 7) | 0);
      for (let i = 0; i < count; i++) {
        const v = rand(3, 8);
        A.emit({ x: p.x, y: p.y, z: p.z, vx: (n.x + spread(1.4)) * v, vy: (n.y + rand(0, 0.8)) * v, vz: (n.z + spread(1.4)) * v, max: rand(0.15, 0.42), s0: 0.035, s1: 0.01, r: 1.7, g: 1.15, b: 0.5, a0: 1, a1: 0.25, grav: 9.8, drag: 1.5, floor: 0.01 });
      }
      A.emit({ x: p.x + n.x * 0.02, y: p.y + n.y * 0.02, z: p.z + n.z * 0.02, max: 0.05, s0: 0.24, s1: 0.1, r: 1.5, g: 1.25, b: 0.8, a0: 1, a1: 0 });
      this.decals.metal.add(p, n, rand(0.07, 0.1));
    } else if (mat === 'wood') {
      // 木屑：較大、會落地
      for (let i = 0; i < 8; i++) S.emit({ x: p.x, y: p.y, z: p.z, vx: (n.x + spread(1)) * 3, vy: (n.y + rand(0, 1)) * 3, vz: (n.z + spread(1)) * 3, max: 0.7, s0: 0.035, s1: 0.03, r: 0.6, g: 0.44, b: 0.27, a0: 1, a1: 0.8, grav: 9.8, drag: 1, floor: 0.01 });
      this.decals.wood.add(p, n, rand(0.08, 0.11));
    } else if (mat !== 'mesh') {
      // 磚、混凝土、磨石子：碎石屑＋崩缺彈孔
      for (let i = 0; i < 5; i++) S.emit({ x: p.x, y: p.y, z: p.z, vx: (n.x + spread(1.2)) * 2.6, vy: (n.y + rand(0, 1)) * 2.6, vz: (n.z + spread(1.2)) * 2.6, max: 0.6, s0: 0.025, s1: 0.02, r: 0.62, g: 0.6, b: 0.56, a0: 1, a1: 0.7, grav: 9.8, drag: 0.8, floor: 0.01 });
      this.decals.concrete.add(p, n, rand(0.07, 0.11));
    }
    // 命中處揚起的塵
    const tint = mat === 'wood' ? [0.62, 0.52, 0.4] : mat === 'metal' ? [0.5, 0.5, 0.5] : [0.6, 0.58, 0.55];
    for (let i = 0; i < 3; i++) {
      S.emit({ x: p.x + n.x * 0.05, y: p.y + n.y * 0.05, z: p.z + n.z * 0.05, vx: n.x * rand(0.5, 1.5) + spread(0.4), vy: n.y * 0.8 + 0.3, vz: n.z * rand(0.5, 1.5) + spread(0.4), max: rand(0.8, 1.4), s0: 0.12, s1: 0.6, r: tint[0], g: tint[1], b: tint[2], a0: 0.35, a1: 0, grav: -0.2, drag: 2.5 });
    }
  }
  // 玻璃碎裂：整片玻璃化為碎片，沿子彈方向（或爆炸外推）噴出後落地
  shatter(b, dir, from) {
    const area = Math.max(b.sx * b.sy, b.sy * b.sz, b.sx * b.sz), n = Math.max(18, Math.min(80, area * 26 | 0));
    const floor = this.world ? -50 : b.y - b.sy / 2 - 0.95;
    for (let i = 0; i < n; i++) {
      const x = b.x + (Math.random() - 0.5) * b.sx, y = b.y + (Math.random() - 0.5) * b.sy, z = b.z + (Math.random() - 0.5) * b.sz;
      if (this.shards.length >= this.shardMax) this.shards.shift();
      let vx, vy, vz;
      if (dir) { const s = 2 + Math.random() * 3.5; vx = dir.x * s + (Math.random() - 0.5) * 2; vy = dir.y * s + Math.random() * 1.5; vz = dir.z * s + (Math.random() - 0.5) * 2; }
      else { const dx = x - from.x, dy = y - from.y, dz = z - from.z, L = Math.hypot(dx, dy, dz) || 1, s = 4 + Math.random() * 4; vx = dx / L * s; vy = dy / L * s + 1; vz = dz / L * s; }
      const k = 0.8 + Math.random() * 0.25;
      this.shards.push({ p: new THREE.Vector3(x, y, z), v: new THREE.Vector3(vx, vy, vz), q: new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.random() * 6.3, Math.random() * 6.3, Math.random() * 6.3)), w: new THREE.Vector3((Math.random() - 0.5) * 18, (Math.random() - 0.5) * 18, (Math.random() - 0.5) * 18), s: (0.05 + Math.random() * 0.13) * k, life: 0, max: 2.2 + Math.random() * 1.6, floor, rest: false, chk: 0 });
      if (i % 3 === 0) this.smoke.emit({ x, y, z, vx: vx * 0.6, vy, vz: vz * 0.6, life: 0, max: 0.8, s0: 0.03, s1: 0.02, r: 0.8, g: 0.9, b: 0.95, a0: 0.6, a1: 0, grav: 9.8, drag: 0.8, floor });
    }
    for (let i = 0; i < 10; i++) this.add.emit({ x: b.x + (Math.random() - 0.5) * b.sx, y: b.y + (Math.random() - 0.5) * b.sy, z: b.z + (Math.random() - 0.5) * b.sz, vx: (Math.random() - 0.5) * 2, vy: Math.random() * 1.5, vz: (Math.random() - 0.5) * 2, life: 0, max: 0.25 + Math.random() * 0.3, s0: 0.06, s1: 0.01, r: 1.1, g: 1.2, b: 1.3, a0: 0.9, a1: 0, grav: 6, drag: 1 });
  }
  // 刀砍到牆面：留下刀痕與少量碎屑（不是彈孔）
  slash(p, n, mat, heavy) {
    const len = (heavy ? 0.42 : 0.3) * (mat === 'wood' ? 1.15 : 1) * (0.9 + Math.random() * 0.2);
    const ang = heavy ? Math.PI / 2 + (Math.random() - 0.5) * 0.4 : (Math.random() < 0.5 ? 0.45 : -0.45) + (Math.random() - 0.5) * 0.3;
    this.decals.slash.addAligned(p, n, len, len * 0.2, ang);
    const dust = mat === 'wood' ? [0.62, 0.5, 0.36] : [0.62, 0.58, 0.54];
    for (let i = 0; i < 5; i++) this.smoke.emit({ x: p.x + n.x * 0.04, y: p.y + n.y * 0.04, z: p.z + n.z * 0.04, vx: n.x * (0.6 + Math.random()) + (Math.random() - 0.5) * 0.8, vy: 0.3 + Math.random() * 0.6, vz: n.z * (0.6 + Math.random()) + (Math.random() - 0.5) * 0.8, life: 0, max: 0.5 + Math.random() * 0.4, s0: 0.03, s1: 0.12, r: dust[0], g: dust[1], b: dust[2], a0: 0.5, a1: 0, grav: 1.5, drag: 3 });
  }
  // 碎片落點：查詢該位置實際的支撐面（已被打爛的物件不算），沒有就落到地面
  floorAt(x, z, y) {
    const s = this.world.support(x, z, 0.03, y + 0.05);
    return s ? s.y : 0;
  }
  // 定期重查腳下支撐面：下層被打爛後，停在上面的碎片要繼續掉落
  refloor(o, dt) {
    if (!this.world || (o.chk -= dt) > 0) return;
    o.chk = o.rest ? 0.25 : 0.05;
    const f = this.floorAt(o.p.x, o.p.z, o.p.y);
    if (f < o.floor - 0.01) { o.floor = f; o.rest = false; } else if (!o.rest) o.floor = f;
  }
  // 物件被打爛：依材質噴出碎塊與粉塵
  debris(b, dir, from) {
    const base = KIND_COL[b.kind] || [0.72, 0.7, 0.66], vol = b.sx * b.sy * b.sz, tree = b.kind === 'tree';
    const n = tree ? 40 : Math.max(10, Math.min(46, vol * 55 | 0)), floor = this.world ? -50 : Math.max(b.y - b.sy / 2, -0.2);
    for (let i = 0; i < n; i++) {
      if (this.chunks.length >= this.chunkMax) this.chunks.shift();
      const leaf = tree && i % 3 !== 0, x = b.x + (Math.random() - 0.5) * b.sx, y = b.y + (Math.random() - 0.5) * b.sy * (tree ? 0.9 : 1), z = b.z + (Math.random() - 0.5) * b.sz;
      let v;
      if (dir) v = new THREE.Vector3(dir.x * (1.5 + Math.random() * 3) + (Math.random() - 0.5) * 2.5, Math.random() * 3, dir.z * (1.5 + Math.random() * 3) + (Math.random() - 0.5) * 2.5);
      else { const dx = x - from.x, dy = y - from.y, dz = z - from.z, L = Math.hypot(dx, dy, dz) || 1, s = 4 + Math.random() * 6; v = new THREE.Vector3(dx / L * s, dy / L * s + 2, dz / L * s); }
      const k = 0.8 + Math.random() * 0.3, col = leaf ? [0.24 * k, 0.45 * k, 0.2 * k] : [base[0] * k, base[1] * k, base[2] * k];
      const sz = leaf ? 0.12 + Math.random() * 0.14 : 0.06 + Math.random() * 0.16;
      this.chunks.push({ p: new THREE.Vector3(x, y, z), v, q: new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.random() * 6.3, Math.random() * 6.3, Math.random() * 6.3)), w: new THREE.Vector3((Math.random() - 0.5) * 12, (Math.random() - 0.5) * 12, (Math.random() - 0.5) * 12), s: new THREE.Vector3(sz, sz * (leaf ? 0.15 : 0.6 + Math.random() * 0.5), sz * (0.7 + Math.random() * 0.5)), col, life: 0, max: 4 + Math.random() * 3, floor, rest: false, chk: 0 });
    }
    const dust = tree ? [0.45, 0.5, 0.35] : base.map(c => c * 0.9 + 0.08);
    for (let i = 0; i < (tree ? 8 : 14); i++) this.smoke.emit({ x: b.x + (Math.random() - 0.5) * b.sx, y: b.y + (Math.random() - 0.5) * b.sy, z: b.z + (Math.random() - 0.5) * b.sz, vx: (Math.random() - 0.5) * 1.5, vy: Math.random() * 0.8, vz: (Math.random() - 0.5) * 1.5, life: 0, max: 1.6 + Math.random() * 1.2, s0: 0.4, s1: 1.6, r: dust[0], g: dust[1], b: dust[2], a0: 0.5, a1: 0, grav: -0.15, drag: 2 });
  }
  updateChunks(dt) {
    const D = this._dummy, M = this.chunkMesh, dq = new THREE.Quaternion(), ax = new THREE.Vector3();
    let n = 0;
    for (const ch of this.chunks) {
      ch.life += dt; if (ch.life >= ch.max) continue;
      this.refloor(ch, dt);
      if (!ch.rest) {
        ch.v.y -= 9.8 * dt; ch.v.multiplyScalar(Math.exp(-0.3 * dt)); ch.p.addScaledVector(ch.v, dt);
        const wl = ch.w.length(); if (wl > 1e-3) { dq.setFromAxisAngle(ax.copy(ch.w).divideScalar(wl), wl * dt); ch.q.premultiply(dq); }
        if (ch.p.y < ch.floor + ch.s.y / 2) { ch.p.y = ch.floor + ch.s.y / 2; if (Math.abs(ch.v.y) > 1.5) { ch.v.y *= -0.3; ch.v.x *= 0.5; ch.v.z *= 0.5; ch.w.multiplyScalar(0.5); } else ch.rest = true; }
      }
      if (ch.rest && this.world) {
        ch.restT = (ch.restT || 0) + dt;
        if (ch.restT > 0.6) { this.rubble.add({ p: ch.p, q: ch.q, s: ch.s, col: ch.col }); ch.life = ch.max; continue; }
      }
      const fade = Math.min(1, (ch.max - ch.life) / 0.8);
      D.position.copy(ch.p); D.quaternion.copy(ch.q); D.scale.copy(ch.s).multiplyScalar(fade); D.updateMatrix(); M.setMatrixAt(n, D.matrix);
      M.setColorAt(n, this._col.setRGB(ch.col[0], ch.col[1], ch.col[2])); n++;
    }
    this.chunks = this.chunks.filter(ch => ch.life < ch.max);
    M.count = n; M.instanceMatrix.needsUpdate = true; if (M.instanceColor) M.instanceColor.needsUpdate = true;
  }
  // 物件被打爛時，移除貼在它上面的彈孔
  clearDecalsIn(b) {
    const m = new THREE.Matrix4(), zero = new THREE.Matrix4().makeScale(0, 0, 0), e = 0.15;
    for (const d of Object.values(this.decals)) {
      let hit = false;
      for (let i = 0; i < d.mesh.count; i++) {
        d.mesh.getMatrixAt(i, m); const x = m.elements[12], y = m.elements[13], z = m.elements[14];
        if (Math.abs(x - b.x) < b.sx / 2 + e && Math.abs(y - b.y) < b.sy / 2 + e && Math.abs(z - b.z) < b.sz / 2 + e) { d.mesh.setMatrixAt(i, zero); hit = true; }
      }
      if (hit) d.mesh.instanceMatrix.needsUpdate = true;
    }
    if (b.c) { this.jag.remove((it) => it.owner === b.c); this.rebar.remove((it) => it.owner === b.c); }
  }
  // 物件被打爛：原本堆在它上面的殘骸、彈殼重新掉落
  wakeRubble(b) {
    const x0 = b.x - b.sx / 2 - 0.2, x1 = b.x + b.sx / 2 + 0.2, z0 = b.z - b.sz / 2 - 0.2, z1 = b.z + b.sz / 2 + 0.2, y0 = b.y - b.sy / 2 - 0.05;
    this.rubble.remove((it) => {
      if (it.p.x < x0 || it.p.x > x1 || it.p.z < z0 || it.p.z > z1 || it.p.y < y0) return false;
      if (this.chunks.length >= this.chunkMax) this.chunks.shift();
      this.chunks.push({ p: it.p, v: new THREE.Vector3((Math.random() - 0.5) * 0.4, 0, (Math.random() - 0.5) * 0.4), q: it.q, w: new THREE.Vector3((Math.random() - 0.5) * 4, 0, (Math.random() - 0.5) * 4), s: it.s, col: it.col, life: 0, max: 6, floor: -50, rest: false, chk: 0 });
      return true;
    });
    for (const c of this.cases) if (c.rest && c.p.x > x0 && c.p.x < x1 && c.p.z > z0 && c.p.z < z1 && c.p.y >= y0) { c.rest = false; c.chk = 0; c.floor = -50; }
  }
  // 斷口：被打掉的石材/磚牆在仍然存在的相鄰結構上留下參差殘塊，鋼筋混凝土另外露出彎曲鋼筋
  remnants(b) {
    if (!this.world || !STONY.has(b.kind)) return;
    const base = KIND_COL[b.kind], e = 0.03, lo = [b.x - b.sx / 2, b.y - b.sy / 2, b.z - b.sz / 2], hi = [b.x + b.sx / 2, b.y + b.sy / 2, b.z + b.sz / 2];
    const rc = RC.has(b.kind) || (b.kind === 'brick' && Math.min(b.sx, b.sz) >= 0.28);
    const cands = this.world.query(lo[0] - e, lo[2] - e, hi[0] + e, hi[2] + e).slice();
    let faces = 0;
    for (const c of cands) {
      if (!c.solid || c.tag === 'glass' || c.tag === 'boundary' || c === b.c) continue;
      const clo = [c.minX, c.bottom, c.minZ], chi = [c.maxX, c.top, c.maxZ];
      const ov = [0, 1, 2].map((i) => Math.min(hi[i], chi[i]) - Math.max(lo[i], clo[i]));
      // 剛好貼著的那一面：一個軸接觸（重疊量約為 0），另兩軸有足夠的共用面積
      let a = -1;
      for (let i = 0; i < 3; i++) { const o1 = (i + 1) % 3, o2 = (i + 2) % 3; if (ov[i] > -e && ov[i] < 0.06 && ov[o1] > 0.08 && ov[o2] > 0.08) { a = i; break; } }
      if (a < 0) continue;
      if (++faces > 8) break;
      const sgn = (clo[a] + chi[a]) / 2 > (lo[a] + hi[a]) / 2 ? 1 : -1;   // 鄰居在 +a 方向：斷口朝 -a 長出
      const plane = sgn > 0 ? hi[a] : lo[a], o1 = (a + 1) % 3, o2 = (a + 2) % 3;
      const r1 = [Math.max(lo[o1], clo[o1]), Math.min(hi[o1], chi[o1])], r2 = [Math.max(lo[o2], clo[o2]), Math.min(hi[o2], chi[o2])];
      const w1 = r1[1] - r1[0], w2 = r2[1] - r2[0], depthMax = Math.min(0.26, (hi[a] - lo[a]) * 0.45);
      const owner = c.part ? c : null;
      const n = Math.max(2, Math.min(9, Math.round(w1 * w2 / 0.05)));
      for (let i = 0; i < n; i++) {
        const s1 = Math.min(w1, 0.06 + Math.random() * 0.2), s2 = Math.min(w2, 0.06 + Math.random() * 0.2), d = 0.03 + Math.random() * depthMax;
        const p = [0, 0, 0], sz = [0, 0, 0];
        p[a] = plane - sgn * d / 2; sz[a] = d;
        p[o1] = r1[0] + s1 / 2 + Math.random() * (w1 - s1); sz[o1] = s1;
        p[o2] = r2[0] + s2 / 2 + Math.random() * (w2 - s2); sz[o2] = s2;
        const k = 0.72 + Math.random() * 0.28;
        this.jag.add({ p: new THREE.Vector3(p[0], p[1], p[2]), q: new THREE.Quaternion().setFromEuler(new THREE.Euler((Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5)), s: new THREE.Vector3(sz[0], sz[1], sz[2]), col: [base[0] * k, base[1] * k, base[2] * k], owner });
      }
      if (!rc || w1 * w2 < 0.03) continue;
      const nb = 2 + (Math.random() * 3 | 0), dir = [0, 0, 0]; dir[a] = -sgn;
      for (let i = 0; i < nb; i++) {
        const st = [0, 0, 0]; st[a] = plane;
        st[o1] = r1[0] + Math.min(0.05, w1 / 3) + Math.random() * Math.max(0, w1 - 0.1);
        st[o2] = r2[0] + Math.min(0.05, w2 / 3) + Math.random() * Math.max(0, w2 - 0.1);
        let P = new THREE.Vector3(st[0], st[1], st[2]);
        const d1 = new THREE.Vector3(dir[0], dir[1], dir[2]).add(new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(0.5)).normalize();
        const perp = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).cross(d1).normalize();
        const d2 = d1.clone().applyAxisAngle(perp, 0.5 + Math.random() * 0.8);
        for (const [dd, L] of [[d1, 0.14 + Math.random() * 0.4], [d2, 0.06 + Math.random() * 0.25]]) {
          if (!(dd.lengthSq() > 0.5)) continue;
          this.rebar.add({ p: P.clone().addScaledVector(dd, L / 2), q: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dd), s: new THREE.Vector3(0.016, L, 0.016), owner });
          P = P.clone().addScaledVector(dd, L);
        }
      }
    }
  }
  // 拋出彈殼：落地彈跳、躺平，停留一段時間
  casing(p, v, type) {
    const S = { pistol: [0.0055, 0.024], smg: [0.0048, 0.021], rifle: [0.005, 0.046], sniper: [0.0068, 0.072], shotgun: [0.0105, 0.062] }[type] || [0.005, 0.04];
    if (this.cases.length >= this.caseMax) this.cases.shift();
    this.cases.push({ p: p.clone(), v: v.clone(), q: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, Math.PI / 2)), w: new THREE.Vector3((Math.random() - 0.5) * 30, (Math.random() - 0.5) * 30, (Math.random() - 0.5) * 30), r: S[0], len: S[1], life: 0, max: 25 + Math.random() * 10, floor: -50, rest: false, chk: 0 });
  }
  updateCases(dt) {
    if (!this.cases.length && !this.caseMesh.count) return;
    const D = this._dummy, M = this.caseMesh, dq = new THREE.Quaternion(), ax = new THREE.Vector3();
    let n = 0;
    for (const c of this.cases) {
      c.life += dt; if (c.life >= c.max) continue;
      this.refloor(c, dt);
      if (!c.rest) {
        c.v.y -= 9.8 * dt; c.v.multiplyScalar(Math.exp(-0.2 * dt)); c.p.addScaledVector(c.v, dt);
        const wl = c.w.length(); if (wl > 1e-3) { dq.setFromAxisAngle(ax.copy(c.w).divideScalar(wl), wl * dt); c.q.premultiply(dq); }
        if (c.p.y < c.floor + c.r) {
          c.p.y = c.floor + c.r;
          if (Math.abs(c.v.y) > 0.7) { c.v.y *= -0.35; c.v.x *= 0.55; c.v.z *= 0.55; c.w.multiplyScalar(0.5); }
          else { c.rest = true; c.q.setFromEuler(new THREE.Euler(0, Math.random() * 6.3, Math.PI / 2)); }
        }
      }
      const fade = Math.min(1, (c.max - c.life) / 1.5);
      D.position.copy(c.p); D.quaternion.copy(c.q); D.scale.set(c.r * fade, c.len * fade, c.r * fade); D.updateMatrix(); M.setMatrixAt(n++, D.matrix);
    }
    this.cases = this.cases.filter((c) => c.life < c.max);
    M.count = n; M.instanceMatrix.needsUpdate = true;
  }
  clearDecals() {
    for (const d of Object.values(this.decals)) { d.mesh.count = 0; d.i = 0; }
    this.rubble.clear(); this.jag.clear(); this.rebar.clear(); this.chunks = []; this.shards = []; this.cases = [];
  }
  bloodSplat(p) {
    this.decals.blood.add(p, new THREE.Vector3(0, 1, 0), rand(0.5, 0.9));
  }

  // 手雷爆炸：閃光 → 火球 → 四散火星 → 貼地衝擊塵環 → 上升黑煙柱 → 地面焦痕
  explosion(p) {
    const A = this.add, S = this.smoke, y = p.y + 0.3;
    this.light(p, 60, 0.35, 0xff9040, 22);
    A.emit({ x: p.x, y, z: p.z, max: 0.16, s0: 2.2, s1: 7, r: 2.4, g: 1.8, b: 1.1, a0: 1, a1: 0 });
    // 火球：一團團往外膨脹、迅速冷卻
    for (let i = 0; i < 24; i++) {
      const az = rand(0, Math.PI * 2), el = rand(0, 1.2), v = rand(3, 9);
      A.emit({ x: p.x, y, z: p.z, vx: Math.cos(az) * Math.cos(el) * v, vy: Math.sin(el) * v + 1, vz: Math.sin(az) * Math.cos(el) * v, max: rand(0.35, 0.7), s0: 0.9, s1: 2.3, r: 1.9, g: 0.85, b: 0.28, a0: 0.9, a1: 0, grav: -1, drag: 4 });
    }
    // 火星：飛得遠、落地彈跳
    for (let i = 0; i < 40; i++) {
      const az = rand(0, Math.PI * 2), v = rand(8, 22);
      A.emit({ x: p.x, y: p.y + 0.2, z: p.z, vx: Math.cos(az) * v, vy: rand(0, 10), vz: Math.sin(az) * v, max: rand(0.4, 0.9), s0: 0.06, s1: 0.02, r: 1.9, g: 1.2, b: 0.5, a0: 1, a1: 0.4, grav: 12, drag: 1.2, floor: 0.02 });
    }
    // 衝擊塵環：貼著地面快速向外擴散
    for (let i = 0; i < 18; i++) {
      const az = (i / 18) * Math.PI * 2 + spread(0.3), v = rand(5, 9);
      S.emit({ x: p.x, y: p.y + 0.15, z: p.z, vx: Math.cos(az) * v, vy: 0.2, vz: Math.sin(az) * v, max: rand(1.2, 2), s0: 0.6, s1: 2.6, r: 0.55, g: 0.5, b: 0.44, a0: 0.45, a1: 0, grav: 0, drag: 2.6 });
    }
    // 黑煙柱：慢慢升起、擴散
    for (let i = 0; i < 22; i++) {
      const az = rand(0, Math.PI * 2), v = rand(1, 3);
      S.emit({ x: p.x + Math.cos(az) * 0.5, y: p.y + rand(0.4, 1.4), z: p.z + Math.sin(az) * 0.5, vx: Math.cos(az) * v, vy: rand(1, 3), vz: Math.sin(az) * v, max: rand(3, 6), s0: 1.2, s1: 5, r: 0.21, g: 0.2, b: 0.19, a0: 0.75, a1: 0, grav: -0.4, drag: 1.2 });
    }
    this.decals.scorch.add(new THREE.Vector3(p.x, 0.01, p.z), new THREE.Vector3(0, 1, 0), 3.2);
    this.shake = Math.max(this.shake, 1);
  }
  updateShards(dt) {
    const D = this._dummy, M = this.shardMesh, dq = new THREE.Quaternion(), ax = new THREE.Vector3();
    let n = 0;
    for (const sh of this.shards) {
      sh.life += dt; if (sh.life >= sh.max) continue;
      this.refloor(sh, dt);
      if (!sh.rest) {
        sh.v.y -= 9.8 * dt; sh.v.multiplyScalar(Math.exp(-0.4 * dt)); sh.p.addScaledVector(sh.v, dt);
        const wl = sh.w.length(); if (wl > 1e-3) { dq.setFromAxisAngle(ax.copy(sh.w).divideScalar(wl), wl * dt); sh.q.premultiply(dq); }
        if (sh.p.y < sh.floor + 0.005) { sh.p.y = sh.floor + 0.005; if (Math.abs(sh.v.y) > 1.2) { sh.v.y *= -0.25; sh.v.x *= 0.4; sh.v.z *= 0.4; sh.w.multiplyScalar(0.4); } else { sh.rest = true; sh.q.setFromEuler(new THREE.Euler(-Math.PI / 2, Math.random() * 6.3, 0)); } }
      }
      const fade = Math.min(1, (sh.max - sh.life) / 0.6);
      D.position.copy(sh.p); D.quaternion.copy(sh.q); D.scale.setScalar(sh.s * fade); D.updateMatrix(); M.setMatrixAt(n++, D.matrix);
    }
    this.shards = this.shards.filter(sh => sh.life < sh.max);
    M.count = n; M.instanceMatrix.needsUpdate = true;
  }
  update(dt, t, camera) {
    // 破壞系統
    this.updateShards(dt);
    this.updateChunks(dt);
    this.updateCases(dt);
    this.rubble.flush(); this.jag.flush(); this.rebar.flush();

    // 粒子：大小以「實際繪圖像素」換算，高解析度手機上不會變大一倍
    this.add.update(dt); this.smoke.update(dt);
    const canvasH = document.getElementById('c')?.height || window.innerHeight;
    const pxPerUnit = canvasH / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2));
    this.add.mat.uniforms.scale.value = pxPerUnit;
    this.smoke.mat.uniforms.scale.value = pxPerUnit;

    this.updateTracers(dt, camera);

    for (const F of this.flashes) if (F.t > 0 && (F.t -= dt) <= 0) F.s.visible = false;
    for (const L of this.lights) {
      if (L.t > 0) { L.t -= dt; L.l.intensity = Math.max(0, L.t / L.dur) * L.peak; } else L.l.intensity = 0;
    }
    this.shake *= Math.exp(-dt * 5);
  }

  // 曳光：彈頭以 750 m/s 前進、拖著 5 m 的尾巴，一閃即逝；面片繞著彈道軸轉向鏡頭
  updateTracers(dt, camera) {
    const SPEED = 750, TAIL = 5, M = this._tm, mid = this._tmid, side = this._ta, face = this._tb, toCam = this._tc;
    let n = 0;
    this.tracers = this.tracers.filter((tr) => {
      tr.t += dt;
      const front = tr.t * SPEED, head = Math.min(tr.len, front), tail = Math.max(0, front - TAIL);   // 尾巴要用未截斷的位置算，彈頭到達終點後尾巴才會跟著收進去
      if (tail >= tr.len) return false;
      if (n >= this.tracerMax) return true;
      mid.copy(tr.from).addScaledVector(tr.dir, (head + tail) / 2);
      toCam.copy(camera.position).sub(mid);
      const dist = toCam.length();
      side.crossVectors(tr.dir, toCam).normalize();
      face.crossVectors(tr.dir, side);
      const L = head - tail, W = 0.022 + dist * 0.0016;
      // 直接寫出縮放後的基底：X 軸沿彈道（長度 L）、Y 軸橫向（寬度 W）
      M.set(
        tr.dir.x * L, side.x * W, face.x, mid.x,
        tr.dir.y * L, side.y * W, face.y, mid.y,
        tr.dir.z * L, side.z * W, face.z, mid.z,
        0, 0, 0, 1,
      );
      this.tracerMesh.setMatrixAt(n++, M);
      return true;
    });
    this.tracerMesh.count = n;
    this.tracerMesh.instanceMatrix.needsUpdate = true;
  }
}
