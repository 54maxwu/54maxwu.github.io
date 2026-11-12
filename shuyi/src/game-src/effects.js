// 特效：粒子、貼花、曳光、槍口火焰、爆炸、煙囪排煙、海鷗
import * as THREE from 'three';

class Particles {
  constructor(scene, tex, additive, max) {
    this.max = max;
    const g = new THREE.BufferGeometry();
    this.pos = new Float32Array(max * 3); this.col = new Float32Array(max * 4); this.size = new Float32Array(max);
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('color', new THREE.BufferAttribute(this.col, 4).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('size', new THREE.BufferAttribute(this.size, 1).setUsage(THREE.DynamicDrawUsage));
    this.geo = g;
    this.mat = new THREE.ShaderMaterial({
      uniforms: { map: { value: tex }, scale: { value: 800 } },
      vertexShader: `attribute float size; attribute vec4 color; varying vec4 vC; uniform float scale;
        void main(){ vC = color; vec4 mv = modelViewMatrix * vec4(position,1.0); gl_PointSize = size * scale / max(0.1, -mv.z); gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `uniform sampler2D map; varying vec4 vC;
        void main(){ vec4 t = texture2D(map, gl_PointCoord); gl_FragColor = vec4(vC.rgb * t.rgb, vC.a * t.a);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        }`,
      transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    });
    this.points = new THREE.Points(g, this.mat);
    this.points.frustumCulled = false;
    this.points.renderOrder = additive ? 5 : 4;
    scene.add(this.points);
    // 模擬資料
    this.p = []; // {x,y,z,vx,vy,vz,life,max,s0,s1,r,g,b,a0,a1,grav,drag}
  }
  emit(o) { if (this.p.length < this.max) this.p.push(o); else this.p[(Math.random() * this.max) | 0] = o; }
  update(dt) {
    const P = this.p;
    let n = 0;
    for (let i = 0; i < P.length; i++) {
      const q = P[i];
      q.life += dt;
      if (q.life >= q.max) continue;
      const dr = Math.exp(-q.drag * dt);
      q.vx *= dr; q.vy = q.vy * dr - q.grav * dt; q.vz *= dr;
      q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt;
      if (q.floor !== undefined && q.y < q.floor) { q.y = q.floor; q.vy *= -0.3; q.vx *= 0.5; q.vz *= 0.5; }
      const t = q.life / q.max;
      this.pos[n * 3] = q.x; this.pos[n * 3 + 1] = q.y; this.pos[n * 3 + 2] = q.z;
      this.col[n * 4] = q.r; this.col[n * 4 + 1] = q.g; this.col[n * 4 + 2] = q.b;
      this.col[n * 4 + 3] = q.a0 + (q.a1 - q.a0) * t;
      this.size[n] = q.s0 + (q.s1 - q.s0) * t;
      P[n] = q; n++;
    }
    P.length = n;
    this.geo.setDrawRange(0, n);
    this.geo.attributes.position.needsUpdate = true;
    this.geo.attributes.color.needsUpdate = true;
    this.geo.attributes.size.needsUpdate = true;
  }
}

class Decals {
  constructor(scene, tex, max, opts = {}) {
    const mat = new THREE.MeshStandardMaterial({ map: tex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4, roughness: 0.9, metalness: 0, ...opts });
    this.mesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), mat, max);
    this.mesh.count = 0; this.mesh.frustumCulled = false;
    this.mesh.receiveShadow = true;
    this.mesh.renderOrder = 2;
    scene.add(this.mesh);
    this.max = max; this.i = 0;
    this.m = new THREE.Matrix4(); this.q = new THREE.Quaternion(); this.q2 = new THREE.Quaternion();
  }
  // 指定角度與長寬（刀痕用）
  addAligned(p, n, sx, sy, angle) {
    const q = this.q.setFromUnitVectors(new THREE.Vector3(0, 0, 1), n);
    q.multiply(this.q2.setFromAxisAngle(new THREE.Vector3(0, 0, 1), angle));
    this.m.compose(new THREE.Vector3(p.x + n.x * 0.004, p.y + n.y * 0.004, p.z + n.z * 0.004), q, new THREE.Vector3(sx, sy, 1));
    this.mesh.setMatrixAt(this.i % this.max, this.m); this.i++;
    this.mesh.count = Math.min(this.i, this.max); this.mesh.instanceMatrix.needsUpdate = true;
  }
  add(p, n, size) {
    const q = this.q.setFromUnitVectors(new THREE.Vector3(0, 0, 1), n);
    q.multiply(this.q2.setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.random() * Math.PI * 2));
    this.m.compose(new THREE.Vector3(p.x + n.x * 0.004, p.y + n.y * 0.004, p.z + n.z * 0.004), q, new THREE.Vector3(size, size, size));
    this.mesh.setMatrixAt(this.i % this.max, this.m);
    this.i++;
    this.mesh.count = Math.min(this.i, this.max);
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}

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

function tracerTex() {
  const c = document.createElement('canvas'); c.width = 64; c.height = 16;
  const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, 16);
  g.addColorStop(0, 'rgba(255,220,150,0)'); g.addColorStop(0.5, 'rgba(255,245,210,1)'); g.addColorStop(1, 'rgba(255,220,150,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 16);
  const g2 = x.createLinearGradient(0, 0, 64, 0);
  g2.addColorStop(0, 'rgba(0,0,0,1)'); g2.addColorStop(1, 'rgba(0,0,0,0)');
  x.globalCompositeOperation = 'destination-out'; x.fillStyle = g2; x.fillRect(0, 0, 64, 16);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export class Effects {
  constructor(scene, T, camera) {
    this.scene = scene; this.camera = camera; this.T = T;
    this.add = new Particles(scene, T.glow, true, 900);
    this.smoke = new Particles(scene, T.puff, false, 900);
    this.decals = {
      metal: new Decals(scene, T.holeMetal, 300),
      wood: new Decals(scene, T.holeWood, 250),
      concrete: new Decals(scene, T.holeStone, 700),
      slash: new Decals(scene, slashTex(), 300),
      blood: new Decals(scene, T.blood, 60),
      scorch: new Decals(scene, T.scorch, 12),
    };
    // 曳光
    this.tracerMax = 48;
    this.tracers = [];
    this.tracerMesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ map: tracerTex(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, color: 0xffe0a0, toneMapped: false }), this.tracerMax);
    this.tracerMesh.frustumCulled = false; this.tracerMesh.count = 0; this.tracerMesh.renderOrder = 6;
    scene.add(this.tracerMesh);
    // 第三人稱槍口火焰
    this.flashes = [];
    for (let i = 0; i < 12; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: T.flash[i % 3], blending: THREE.AdditiveBlending, depthWrite: false, color: 0xffd8a0, toneMapped: false }));
      s.visible = false; s.renderOrder = 7; scene.add(s);
      this.flashes.push({ s, t: 0 });
    }
    this.flashI = 0;
    // 動態點光源池
    this.lights = [];
    for (let i = 0; i < 3; i++) {
      const l = new THREE.PointLight(0xffa850, 0, 9, 2);
      scene.add(l); this.lights.push({ l, t: 0, peak: 0, dur: 0.06 });
    }
    this.lightI = 0;
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
    this.shake = 0;
    this.funnelT = 0;
    this.birds = [];
  }
  light(pos, intensity, dur, color = 0xffa850, dist = 9) {
    const L = this.lights[this.lightI++ % this.lights.length];
    L.l.position.copy(pos); L.l.color.set(color); L.l.distance = dist;
    L.t = dur; L.dur = dur; L.peak = intensity; L.l.intensity = intensity;
  }
  muzzle(pos, dir, big = 1) {
    const F = this.flashes[this.flashI++ % this.flashes.length];
    F.s.position.copy(pos).addScaledVector(dir, 0.06);
    F.s.material.rotation = Math.random() * 6.28;
    F.s.scale.setScalar(0.45 * big * (0.8 + Math.random() * 0.4));
    F.s.visible = true; F.t = 0.05;
    this.light(pos, 6 * big, 0.06);
    // 槍口煙
    this.smoke.emit({ x: pos.x, y: pos.y, z: pos.z, vx: dir.x * 1.5, vy: 0.4, vz: dir.z * 1.5, life: 0, max: 0.7, s0: 0.1, s1: 0.5, r: 0.7, g: 0.7, b: 0.7, a0: 0.18, a1: 0, grav: -0.3, drag: 3 });
  }
  tracer(from, to) {
    const d = to.clone().sub(from); const L = d.length();
    if (L < 2) return;
    d.divideScalar(L);
    this.tracers.push({ from: from.clone(), dir: d, len: L, t: 0 });
    if (this.tracers.length > this.tracerMax) this.tracers.shift();
  }
  impact(p, n, mat, dir) {
    const nx = n.x, ny = n.y, nz = n.z;
    if (mat === 'flesh') {
      for (let i = 0; i < 10; i++) this.smoke.emit({ x: p.x, y: p.y, z: p.z, vx: dir.x * 2 + (Math.random() - 0.5) * 1.5, vy: Math.random() * 1.2, vz: dir.z * 2 + (Math.random() - 0.5) * 1.5, life: 0, max: 0.35 + Math.random() * 0.3, s0: 0.06, s1: 0.28, r: 0.45, g: 0.02, b: 0.02, a0: 0.8, a1: 0, grav: 2, drag: 4 });
      for (let i = 0; i < 6; i++) this.smoke.emit({ x: p.x, y: p.y, z: p.z, vx: dir.x * 3 + (Math.random() - 0.5) * 2, vy: Math.random() * 2, vz: dir.z * 3 + (Math.random() - 0.5) * 2, life: 0, max: 0.6, s0: 0.035, s1: 0.03, r: 0.35, g: 0.0, b: 0.0, a0: 1, a1: 0.6, grav: 9, drag: 0.5, floor: 0.01 });
      return;
    }
    if (mat === 'metal') {
      const cnt = 6 + (Math.random() * 6) | 0;
      for (let i = 0; i < cnt; i++) {
        const sp = 3 + Math.random() * 5;
        this.add.emit({ x: p.x, y: p.y, z: p.z, vx: (nx + (Math.random() - 0.5) * 1.4) * sp, vy: (ny + Math.random() * 0.8) * sp, vz: (nz + (Math.random() - 0.5) * 1.4) * sp, life: 0, max: 0.18 + Math.random() * 0.25, s0: 0.035, s1: 0.01, r: 1.6, g: 1.1, b: 0.5, a0: 1, a1: 0.3, grav: 9, drag: 1.5 });
      }
      this.add.emit({ x: p.x + nx * 0.02, y: p.y + ny * 0.02, z: p.z + nz * 0.02, vx: 0, vy: 0, vz: 0, life: 0, max: 0.05, s0: 0.25, s1: 0.1, r: 1.5, g: 1.2, b: 0.7, a0: 1, a1: 0, grav: 0, drag: 0 });
      this.decals.metal.add(p, n, 0.07 + Math.random() * 0.03);
    } else if (mat === 'wood') {
      for (let i = 0; i < 8; i++) this.smoke.emit({ x: p.x, y: p.y, z: p.z, vx: (nx + (Math.random() - 0.5)) * 3, vy: (ny + Math.random()) * 3, vz: (nz + (Math.random() - 0.5)) * 3, life: 0, max: 0.6, s0: 0.03, s1: 0.025, r: 0.55, g: 0.4, b: 0.25, a0: 1, a1: 0.8, grav: 9, drag: 1, floor: 0.01 });
      this.decals.wood.add(p, n, 0.08 + Math.random() * 0.03);
    } else if (mat !== 'mesh') {
      // 磚、水泥、石材：留下崩缺彈孔
      this.decals.concrete.add(p, n, 0.07 + Math.random() * 0.04);
    }
    // 塵煙
    const dust = mat === 'wood' ? [0.62, 0.52, 0.4] : [0.55, 0.55, 0.53];
    for (let i = 0; i < 3; i++) this.smoke.emit({ x: p.x + nx * 0.05, y: p.y + ny * 0.05, z: p.z + nz * 0.05, vx: nx * (0.5 + Math.random()) + (Math.random() - 0.5) * 0.4, vy: ny * 0.8 + 0.3, vz: nz * (0.5 + Math.random()) + (Math.random() - 0.5) * 0.4, life: 0, max: 0.8 + Math.random() * 0.6, s0: 0.12, s1: 0.6, r: dust[0], g: dust[1], b: dust[2], a0: 0.35, a1: 0, grav: -0.2, drag: 2.5 });
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
    const C = { brick: [0.66, 0.36, 0.28], granite: [0.52, 0.51, 0.49], plaster: [0.9, 0.88, 0.84], white: [0.9, 0.88, 0.84], beige: [0.88, 0.8, 0.64], wood: [0.5, 0.36, 0.22], board: [0.2, 0.32, 0.26], bark: [0.4, 0.3, 0.22], tree: [0.4, 0.3, 0.22], green: [0.18, 0.42, 0.3], red: [0.7, 0.2, 0.18], blue: [0.2, 0.35, 0.65], yellow: [0.85, 0.68, 0.25] };
    const base = C[b.kind] || [0.72, 0.7, 0.66], vol = b.sx * b.sy * b.sz, tree = b.kind === 'tree';
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
  }
  clearDecals() { for (const d of Object.values(this.decals)) { d.mesh.count = 0; d.i = 0; } }
  bloodSplat(p) { this.decals.blood.add(p, new THREE.Vector3(0, 1, 0), 0.5 + Math.random() * 0.4); }
  explosion(p) {
    this.light(p, 60, 0.35, 0xff9040, 22);
    this.add.emit({ x: p.x, y: p.y + 0.3, z: p.z, vx: 0, vy: 0, vz: 0, life: 0, max: 0.18, s0: 2, s1: 7, r: 2.2, g: 1.6, b: 0.9, a0: 1, a1: 0, grav: 0, drag: 0 });
    for (let i = 0; i < 26; i++) {
      const a = Math.random() * 6.28, e = Math.random() * 1.2, sp = 3 + Math.random() * 6;
      this.add.emit({ x: p.x, y: p.y + 0.3, z: p.z, vx: Math.cos(a) * Math.cos(e) * sp, vy: Math.sin(e) * sp + 1, vz: Math.sin(a) * Math.cos(e) * sp, life: 0, max: 0.35 + Math.random() * 0.35, s0: 0.9, s1: 2.2, r: 1.8, g: 0.8, b: 0.25, a0: 0.9, a1: 0, grav: -1, drag: 4 });
    }
    for (let i = 0; i < 40; i++) {
      const a = Math.random() * 6.28, sp = 8 + Math.random() * 14;
      this.add.emit({ x: p.x, y: p.y + 0.2, z: p.z, vx: Math.cos(a) * sp, vy: Math.random() * 10, vz: Math.sin(a) * sp, life: 0, max: 0.4 + Math.random() * 0.5, s0: 0.06, s1: 0.02, r: 1.8, g: 1.2, b: 0.5, a0: 1, a1: 0.4, grav: 12, drag: 1.2, floor: 0.02 });
    }
    for (let i = 0; i < 22; i++) {
      const a = Math.random() * 6.28, sp = 1 + Math.random() * 3;
      this.smoke.emit({ x: p.x + Math.cos(a) * 0.5, y: p.y + 0.4 + Math.random(), z: p.z + Math.sin(a) * 0.5, vx: Math.cos(a) * sp, vy: 1 + Math.random() * 2, vz: Math.sin(a) * sp, life: 0, max: 3 + Math.random() * 3, s0: 1.2, s1: 5, r: 0.22, g: 0.21, b: 0.2, a0: 0.75, a1: 0, grav: -0.4, drag: 1.2 });
    }
    this.decals.scorch.add(new THREE.Vector3(p.x, 0.01, p.z), new THREE.Vector3(0, 1, 0), 3.2);
    this.shake = Math.max(this.shake, 1);
  }
  // 煙囪排煙 & 海鷗
  initAmbient(funnelTop) {
    this.funnelTop = funnelTop;
    const birdMat = new THREE.MeshStandardMaterial({ color: 0xf2f2ee, roughness: 0.8, side: THREE.DoubleSide });
    const tipMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8, side: THREE.DoubleSide });
    for (let i = 0; i < 6; i++) {
      const b = new THREE.Group();
      const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.35, 3, 6), birdMat); body.rotation.x = Math.PI / 2;
      const wg = new THREE.BufferGeometry();
      wg.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, -0.1, 0.75, 0.05, 0.05, 0, 0, 0.15, 0.75, 0.05, 0.05, 1.05, 0, 0.12, 0.75, 0.05, 0.05], 3));
      wg.computeVertexNormals();
      const wR = new THREE.Mesh(wg, birdMat), wL = new THREE.Mesh(wg, birdMat); wL.scale.x = -1;
      const tipG = new THREE.BufferGeometry(); tipG.setAttribute('position', new THREE.Float32BufferAttribute([0.75, 0.05, 0.05, 1.05, 0, 0.12, 1.2, 0, 0.18], 3)); tipG.computeVertexNormals();
      const tR = new THREE.Mesh(tipG, tipMat), tL = new THREE.Mesh(tipG, tipMat); tL.scale.x = -1;
      const wrR = new THREE.Group(); wrR.add(wR, tR); const wrL = new THREE.Group(); wrL.add(wL, tL);
      b.add(body, wrR, wrL);
      b.scale.setScalar(1.1);
      this.scene.add(b);
      this.birds.push({ g: b, wR: wrR, wL: wrL, r: 25 + Math.random() * 30, h: 18 + Math.random() * 16, sp: 0.18 + Math.random() * 0.12, ph: Math.random() * 6.28, cx: -10 + Math.random() * 30, flap: Math.random() * 6 });
    }
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
  update(dt, t, camera, shipSpeed) {
    this.updateShards(dt);
    this.updateChunks(dt);
    this.add.update(dt); this.smoke.update(dt);
    const h = window.innerHeight * Math.min(window.devicePixelRatio, 2);
    const sc = h / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2));
    this.add.mat.uniforms.scale.value = sc; this.smoke.mat.uniforms.scale.value = sc;
    // 曳光
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), sv = new THREE.Vector3(), pv = new THREE.Vector3();
    const camPos = camera.position;
    let n = 0;
    const speed = 380;
    this.tracers = this.tracers.filter((tr) => {
      tr.t += dt;
      const head = Math.min(tr.len, tr.t * speed), tail = Math.max(0, head - 7);
      if (tail >= tr.len) return false;
      const mid = pv.copy(tr.from).addScaledVector(tr.dir, (head + tail) / 2);
      const toCam = camPos.clone().sub(mid).normalize();
      const up = new THREE.Vector3().crossVectors(tr.dir, toCam).normalize();
      const nrm = new THREE.Vector3().crossVectors(tr.dir, up);
      const basis = new THREE.Matrix4().makeBasis(tr.dir, up, nrm);
      q.setFromRotationMatrix(basis);
      const dist = mid.distanceTo(camPos);
      sv.set(head - tail, 0.018 + dist * 0.0012, 1);
      m.compose(mid, q, sv);
      if (n < this.tracerMax) this.tracerMesh.setMatrixAt(n++, m);
      return true;
    });
    this.tracerMesh.count = n; this.tracerMesh.instanceMatrix.needsUpdate = true;
    for (const F of this.flashes) if (F.t > 0) { F.t -= dt; if (F.t <= 0) F.s.visible = false; }
    for (const L of this.lights) { if (L.t > 0) { L.t -= dt; L.l.intensity = Math.max(0, L.t / L.dur) * L.peak; } else L.l.intensity = 0; }
    this.shake *= Math.exp(-dt * 5);
    // 煙囪排煙
    if (this.funnelTop) {
      this.funnelT -= dt;
      if (this.funnelT <= 0) {
        this.funnelT = 0.14;
        const f = this.funnelTop;
        const g = 0.18 + Math.random() * 0.1;
        this.smoke.emit({ x: f.x + (Math.random() - 0.5) * 2, y: f.y, z: f.z + (Math.random() - 0.5) * 1.5, vx: -shipSpeed * 0.9 - Math.random(), vy: 2.2 + Math.random(), vz: (Math.random() - 0.5) * 0.8, life: 0, max: 9, s0: 2.2, s1: 11, r: g, g: g, b: g * 1.02, a0: 0.42, a1: 0, grav: -0.05, drag: 0.08 });
      }
    }
    for (const b of this.birds) {
      b.ph += dt * b.sp;
      const x = b.cx + Math.cos(b.ph) * b.r, z = Math.sin(b.ph) * b.r * 0.6, y = b.h + Math.sin(b.ph * 2.3) * 3;
      b.g.position.set(x, y, z);
      b.g.rotation.y = -b.ph + Math.PI;
      b.g.rotation.z = Math.sin(b.ph) * 0.3;
      b.flap += dt * 7;
      const gl = Math.sin(b.ph * 0.7) > 0.3;
      const fa = gl ? 0.08 : Math.sin(b.flap) * 0.6;
      b.wR.rotation.z = fa; b.wL.rotation.z = -fa;
    }
  }
}
