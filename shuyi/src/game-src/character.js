// 樹義國小校園對戰：第三人稱角色（學生）
//
// 角色是一個 SkinnedMesh：每個零件只綁一根骨頭（剛性蒙皮），所有零件合併成一個網格、一個材質。
//
// 對外介面（new Soldier(team)）
//   root / mesh / material / bones / B（骨頭名稱 → 骨頭）
//   setWeapon(id)      換手上的槍（第三人稱合併版模型，掛在胸骨上）
//   update(dt, st)     st：{ speed, fwd, crouch, pitch, onGround, reloading }；陣亡後傳 {} 跑布娃娃
//   kick()             開槍後座
//   flinch(part)       中彈硬直（上身後仰，打頭時頭甩更大）
//   setRim(kind)       輪廓光：0 無、1 隊友淡藍、2 敵人暖紅
//   die(dirX, dirZ, headshot, world, velocity, dirY)   進入布娃娃
//   reset()            重生時回到站姿
//   hitTest(origin, dir, maxT, frame)   子彈命中測試 → { t, part }（part：head chest stomach arm leg）
//   muzzleWorld(out) headWorld(out) chestWorld(out)
//
// 服裝依使用者提供的樹義國小照片：
//   BL 女生隊：制服（白色水手領上衣、深藍領與領巾、粉紅釦子、藍格紋百褶裙、白襪、長髮）
//   GR 男生隊：體育服（天藍 POLO、綠領白邊、白 V 襟、胸前寬綠帶上下白線、肩線細條、左胸校徽、及膝藍短褲側邊綠白黑條、短髮）
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { buildGunMerged } from './guns.js';
import { fbm } from './textures.js';
import { Ragdoll } from './ragdoll.js';

// ───────── 布料貼圖 ─────────
// 512×64 的貼圖分三區：U 0～0.25 平織布、0.25～0.5 藍格紋、0.5～1 平滑（皮膚、塑膠、鞋）

const ATLAS_U = { fab: [0.01, 0.23], plaid: [0.26, 0.48], plain: [0.52, 0.98] };
let ATLAS = null;

function clothAtlas() {
  if (ATLAS) return ATLAS;
  const W = 512, H = 64;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const ctx = c.getContext('2d'), img = ctx.createImageData(W, H), d = img.data;
  const grain = fbm(W, H, 16, 2, 4, 314);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x, n = grain[i];
    let r, g, b;
    if (x < 128) {
      // 平織：經緯線交錯的細微明暗
      const warp = (x & 1) ^ (y & 1) ? 0.95 : 1;
      const v = (0.86 + n * 0.22) * warp * 205;
      r = g = b = v;
    } else if (x < 256) {
      // 格紋：深藍底，橫豎各一條寬藍帶（交叉處更亮），加白、深藍細線
      const px = (x - 128) % 32, py = y % 32;
      const wideX = px < 10, wideY = py < 10;
      const k = (wideX ? 1 : 0) + (wideY ? 1 : 0);
      [r, g, b] = [[30, 46, 98], [52, 86, 160], [74, 112, 188]][k];
      if (px === 14 || py === 14) [r, g, b] = [225, 230, 240];
      if (px === 22 || py === 22) [r, g, b] = [20, 28, 60];
      const t = 0.9 + n * 0.15;
      r *= t; g *= t; b *= t;
    } else {
      const v = (0.94 + n * 0.1) * 200;
      r = g = b = v;
    }
    d[i * 4] = Math.min(255, r); d[i * 4 + 1] = Math.min(255, g); d[i * 4 + 2] = Math.min(255, b); d[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  ATLAS = new THREE.CanvasTexture(c);
  ATLAS.colorSpace = THREE.SRGBColorSpace;
  return ATLAS;
}

// 各隊配色：[顏色, 貼圖區]
const PALETTE = {
  BL: {
    shirt: [0xf3f2ec, 'fab'], collar: [0x1e2a5c, 'plain'], trim: [0xf5f5f0, 'plain'], bow: [0x1e2a5c, 'plain'], button: [0xe48aa0, 'plain'],
    bottom: [0xffffff, 'plaid'], sock: [0xf4f4f0, 'fab'], shoe: [0xc98a9e, 'plain'], skin: [0xe0b090, 'plain'], hair: [0x16120f, 'fab'], cuff: [0x1e2a5c, 'plain'],
  },
  GR: {
    shirt: [0x2a90dc, 'fab'], collar: [0x1c9440, 'plain'], trim: [0xf4f4f2, 'plain'], band: [0x1c9440, 'fab'], dark: [0x15181d, 'plain'],
    bottom: [0x2a90dc, 'fab'], shoe: [0x1d2b4a, 'plain'], skin: [0xd9a682, 'plain'], hair: [0x16120f, 'fab'], cuff: [0x2a90dc, 'fab'],
  },
};

// ───────── 骨架 ─────────
// [名稱, 父骨, 相對父骨的位置]；手臂、腿的骨頭都沿 -Y 往下長

const SKELETON = [
  ['hips', -1, [0, 0.97, 0]],
  ['spine', 0, [0, 0.13, 0]], ['chest', 1, [0, 0.19, 0]], ['neck', 2, [0, 0.21, 0]], ['head', 3, [0, 0.08, 0]],
  ['shoulderR', 2, [0.17, 0.13, 0]], ['upperArmR', 5, [0.04, 0, 0]], ['forearmR', 6, [0, -0.29, 0]], ['handR', 7, [0, -0.26, 0]],
  ['shoulderL', 2, [-0.17, 0.13, 0]], ['upperArmL', 9, [-0.04, 0, 0]], ['forearmL', 10, [0, -0.29, 0]], ['handL', 11, [0, -0.26, 0]],
  ['thighR', 0, [0.1, -0.05, 0]], ['shinR', 13, [0, -0.44, 0]], ['footR', 14, [0, -0.44, 0]],
  ['thighL', 0, [-0.1, -0.05, 0]], ['shinL', 16, [0, -0.44, 0]], ['footL', 17, [0, -0.44, 0]],
];
const BONE_INDEX = Object.fromEntries(SKELETON.map(([n], i) => [n, i]));
const UPPER_ARM = 0.29, FOREARM = 0.28;

// 每根骨頭在綁定姿勢下的世界位置
const REST = (() => {
  const out = [];
  SKELETON.forEach(([, parent, p], i) => {
    out[i] = new THREE.Vector3(...p);
    if (parent >= 0) out[i].add(out[parent]);
  });
  return out;
})();
const at = (bone) => REST[BONE_INDEX[bone]];

// ───────── 身體與服裝 ─────────

const capsule = (r, len) => new THREE.CapsuleGeometry(r, len, 3, 10);
const block = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const ball = (r) => new THREE.SphereGeometry(r, 14, 10);

// 零件：[骨頭, 幾何, 配色鍵, 相對骨頭的位移, 旋轉?]
function bodyParts(team) {
  const school = team === 'BL';   // 女生隊穿制服，男生隊穿體育服
  const P = [];
  const put = (bone, geo, color, off, rot) => P.push([bone, geo, color, off, rot]);

  for (const s of ['R', 'L']) {
    const side = s === 'R' ? 1 : -1;
    // 腿：膝下露腿；制服配白襪
    put('thigh' + s, capsule(0.078, 0.3), 'skin', [0, -0.2, 0]);
    put('shin' + s, capsule(0.062, 0.32), 'skin', [0, -0.2, 0]);
    if (school) put('shin' + s, capsule(0.066, 0.12), 'sock', [0, -0.33, 0]);
    put('foot' + s, block(0.11, 0.09, 0.25), 'shoe', [0, 0.02, -0.05]);
    if (!school) {
      // 及膝短褲褲管＋外側綠、白、黑條
      put('thigh' + s, capsule(0.1, 0.2), 'bottom', [0, -0.15, 0]);
      put('thigh' + s, block(0.008, 0.36, 0.03), 'band', [side * 0.1, -0.13, 0]);
      for (const dz of [-0.02, 0.02]) put('thigh' + s, block(0.008, 0.36, 0.008), 'trim', [side * 0.1, -0.13, dz]);
      put('thigh' + s, block(0.008, 0.36, 0.006), 'dark', [side * 0.1, -0.13, 0.028]);
    }
    // 手臂：短袖，露出前臂與手
    put('upperArm' + s, ball(0.08), 'shirt', [0, -0.02, 0]);
    put('upperArm' + s, capsule(0.066, 0.1), 'shirt', [0, -0.09, 0]);
    put('upperArm' + s, capsule(0.069, 0.012), 'cuff', [0, -0.15, 0]);
    put('upperArm' + s, capsule(0.05, 0.12), 'skin', [0, -0.2, 0]);
    put('forearm' + s, capsule(0.045, 0.19), 'skin', [0, -0.13, 0]);
    put('hand' + s, block(0.07, 0.09, 0.045), 'skin', [0, -0.04, 0]);
  }

  // 下身
  if (school) {
    const skirt = new THREE.CylinderGeometry(0.2, 0.31, 0.42, 18, 1, true).scale(1, 1, 0.85);   // 百褶裙：上窄下寬
    put('hips', skirt, 'bottom', [0, -0.12, 0]);
    put('hips', block(0.36, 0.08, 0.24), 'bottom', [0, 0.06, 0]);
  } else {
    put('hips', block(0.37, 0.24, 0.25), 'bottom', [0, -0.03, 0]);
    for (const sx of [-1, 1]) put('hips', block(0.008, 0.22, 0.03), 'band', [sx * 0.186, -0.04, 0]);
  }

  // 上身
  put('spine', block(0.32, 0.22, 0.21), 'shirt', [0, 0.1, 0]);
  put('chest', block(0.38, 0.3, 0.23), 'shirt', [0, 0.1, 0]);
  if (school) {
    put('chest', block(0.3, 0.17, 0.02), 'collar', [0, 0.18, 0.12]);                 // 背後方形水手領
    put('chest', block(0.3, 0.012, 0.022), 'trim', [0, 0.13, 0.125]);                // 領上白線
    for (const sx of [-1, 1]) put('chest', block(0.04, 0.2, 0.02), 'collar', [sx * 0.075, 0.17, -0.12], [0, 0, sx * 0.5]);   // 前襟 V 領
    put('chest', block(0.1, 0.05, 0.03), 'bow', [0, 0.1, -0.125]);                   // 領巾結
    for (const sx of [-1, 1]) put('chest', block(0.03, 0.11, 0.02), 'bow', [sx * 0.025, 0.04, -0.125], [0, 0, -sx * 0.25]);
    for (let i = 0; i < 3; i++) put('chest', block(0.02, 0.02, 0.01), 'button', [0, -0.02 - i * 0.07, -0.118]);
  } else {
    put('chest', block(0.388, 0.085, 0.238), 'band', [0, 0, 0]);                     // 胸前寬綠帶
    for (const dy of [-0.048, 0.048]) put('chest', block(0.39, 0.016, 0.24), 'trim', [0, dy, 0]);
    put('chest', block(0.23, 0.05, 0.19), 'collar', [0, 0.262, 0.005]);              // POLO 領
    put('chest', block(0.232, 0.01, 0.192), 'trim', [0, 0.238, 0.005]);
    put('chest', block(0.05, 0.07, 0.008), 'collar', [0, 0.205, -0.117]);            // V 襟內綠底
    for (const sx of [-1, 1]) put('chest', block(0.03, 0.115, 0.01), 'trim', [sx * 0.026, 0.2, -0.12], [0, 0, sx * 0.46]);
    for (const sx of [-1, 1]) {                                                      // 肩線細條
      put('chest', block(0.12, 0.006, 0.014), 'trim', [sx * 0.13, 0.252, -0.008]);
      put('chest', block(0.12, 0.006, 0.01), 'band', [sx * 0.13, 0.252, 0.006]);
    }
    put('chest', block(0.036, 0.042, 0.006), 'trim', [-0.1, 0.18, -0.118]);          // 左胸校徽
    put('chest', block(0.02, 0.022, 0.004), 'band', [-0.1, 0.18, -0.122]);
  }

  // 頭
  put('neck', capsule(0.05, 0.06), 'skin', [0, 0.04, 0]);
  put('head', ball(0.105).scale(0.95, 1.1, 1), 'skin', [0, 0.09, 0]);
  put('head', new THREE.SphereGeometry(0.118, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.55).scale(1, 1.02, 1.06), 'hair', [0, 0.1, 0.008]);
  if (school) {                                                                      // 瀏海＋及肩長髮
    put('head', block(0.2, 0.05, 0.03), 'hair', [0, 0.16, -0.1]);
    put('head', block(0.24, 0.24, 0.1), 'hair', [0, 0.02, 0.06]);
    for (const sx of [-1, 1]) put('head', block(0.04, 0.2, 0.16), 'hair', [sx * 0.11, 0.04, 0.01]);
  }
  return P;
}

const GEO = {};
function bodyGeometry(team) {
  if (GEO[team]) return GEO[team];
  const pal = PALETTE[team];
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), one = new THREE.Vector3(1, 1, 1), col = new THREE.Color();
  const pieces = bodyParts(team).map(([bone, geo, key, off, rot]) => {
    const base = at(bone);
    m.compose(new THREE.Vector3(base.x + off[0], base.y + off[1], base.z + off[2]), q.setFromEuler(e.set(...(rot || [0, 0, 0]))), one);
    const g = (geo.index ? geo.toNonIndexed() : geo.clone()).applyMatrix4(m);
    const n = g.attributes.position.count;
    const [hex, region] = pal[key];
    col.set(hex);
    const [u0, u1] = ATLAS_U[region];
    const srcUV = g.attributes.uv, uv = new Float32Array(n * 2), color = new Float32Array(n * 3);
    const skinIndex = new Uint16Array(n * 4), skinWeight = new Float32Array(n * 4);
    const bi = BONE_INDEX[bone];
    for (let i = 0; i < n; i++) {
      uv[i * 2] = u0 + ((srcUV ? srcUV.getX(i) : 0.5) % 1) * (u1 - u0);
      uv[i * 2 + 1] = 0.05 + ((srcUV ? srcUV.getY(i) : 0.5) % 1) * 0.9;
      color[i * 3] = col.r; color[i * 3 + 1] = col.g; color[i * 3 + 2] = col.b;
      skinIndex[i * 4] = bi; skinWeight[i * 4] = 1;
    }
    const out = new THREE.BufferGeometry();
    out.setAttribute('position', g.attributes.position);
    out.setAttribute('normal', g.attributes.normal);
    out.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    out.setAttribute('color', new THREE.BufferAttribute(color, 3));
    out.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndex, 4));
    out.setAttribute('skinWeight', new THREE.BufferAttribute(skinWeight, 4));
    return out;
  });
  const merged = mergeGeometries(pieces, false);
  merged.computeBoundingSphere();
  return (GEO[team] = merged);
}

// ───────── 命中盒 ─────────
// [骨頭, 中心(骨頭座標), 半尺寸, 部位]

const HITBOXES = [
  ['head', [0, 0.1, 0], [0.1, 0.12, 0.11], 'head'],
  ['chest', [0, 0.1, 0], [0.21, 0.18, 0.145], 'chest'],
  ['spine', [0, 0.09, 0], [0.17, 0.12, 0.12], 'stomach'],
  ['hips', [0, -0.02, 0], [0.18, 0.11, 0.13], 'stomach'],
  ...['R', 'L'].flatMap((s) => [
    ['upperArm' + s, [0, -0.14, 0], [0.065, 0.16, 0.065], 'arm'],
    ['forearm' + s, [0, -0.13, 0], [0.055, 0.15, 0.055], 'arm'],
    ['thigh' + s, [0, -0.21, 0], [0.09, 0.24, 0.09], 'leg'],
    ['shin' + s, [0, -0.22, 0], [0.07, 0.24, 0.075], 'leg'],
  ]),
];

const AXES = ['x', 'y', 'z'];

// 射線（本地座標）與軸對齊盒的進入距離，沒打到回傳 -1
function rayBox(o, d, c, h, maxT) {
  let lo = 0, hi = maxT;
  for (let i = 0; i < 3; i++) {
    const k = AXES[i];
    const oo = o[k] - c[i];
    if (Math.abs(d[k]) < 1e-9) { if (oo < -h[i] || oo > h[i]) return -1; continue; }
    let a = (-h[i] - oo) / d[k], b = (h[i] - oo) / d[k];
    if (a > b) { const t = a; a = b; b = t; }
    if (a > lo) lo = a;
    if (b < hi) hi = b;
    if (lo > hi) return -1;
  }
  return lo;
}

const _v = new THREE.Vector3(), _w = new THREE.Vector3(), _lo = new THREE.Vector3(), _ld = new THREE.Vector3();
const _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion();
const DOWN = new THREE.Vector3(0, -1, 0);

// ───────── 角色 ─────────

export class Soldier {
  constructor(team) {
    this.team = team;
    this.root = new THREE.Group();
    this.material = new THREE.MeshStandardMaterial({ vertexColors: true, map: clothAtlas(), roughness: 0.82, metalness: 0.05 });
    // 輪廓光：視線越貼著表面越亮（菲涅耳），讓人在暗處或雜亂背景前也看得出輪廓
    this.rimU = { value: new THREE.Vector4(0, 0, 0, 0) };
    this.material.onBeforeCompile = (sh) => {
      sh.uniforms.uRim = this.rimU;
      sh.fragmentShader = 'uniform vec4 uRim;\n' + sh.fragmentShader.replace(
        '#include <emissivemap_fragment>',
        '#include <emissivemap_fragment>\n  totalEmissiveRadiance += uRim.rgb * uRim.a * pow(1.0 - clamp(dot(normalize(normal), normalize(vViewPosition)), 0.0, 1.0), 2.2);',
      );
    };

    this.mesh = new THREE.SkinnedMesh(bodyGeometry(team), this.material);
    this.mesh.castShadow = this.mesh.receiveShadow = true;
    this.mesh.frustumCulled = false;
    this.bones = SKELETON.map(([name, , p]) => {
      const b = new THREE.Bone();
      b.name = name;
      b.position.set(...p);
      return b;
    });
    SKELETON.forEach(([, parent], i) => (parent >= 0 ? this.bones[parent] : this.mesh).add(this.bones[i]));
    this.mesh.updateMatrixWorld(true);
    this.mesh.bind(new THREE.Skeleton(this.bones));
    this.root.add(this.mesh);
    this.B = Object.fromEntries(this.bones.map((b) => [b.name, b]));

    this.gait = Math.random() * 10; this.stride = 0;
    this.crouchK = 0; this.recoilK = 0;
    this.flinchK = 0; this.flinchSide = 0; this.flinchH = 0;
    this.deadT = -1; this.opacity = 1;
    this.gun = null; this.gunId = null;
    this.hitInv = HITBOXES.map(() => new THREE.Matrix4());
    this.hitFrame = -1;
  }

  setWeapon(id) {
    if (this.gunId === id) return;
    if (this.gun) this.B.chest.remove(this.gun);
    this.gunId = id;
    this.gun = buildGunMerged(id);
    this.B.chest.add(this.gun);   // 掛在胸骨上，瞄準方向跟著上身
  }

  // 兩段式 IK：讓手到達目標；pole 決定手肘往哪邊彎
  solveArm(side, target, pole) {
    const upper = this.B['upperArm' + side], fore = this.B['forearm' + side];
    const S = upper.getWorldPosition(new THREE.Vector3());
    const toT = _v.copy(target).sub(S);
    const dist = Math.min(toT.length(), UPPER_ARM + FOREARM - 0.001);
    const dir = toT.normalize();
    // 餘弦定理：上臂與「肩→手」連線的夾角
    const cos = (UPPER_ARM ** 2 + dist ** 2 - FOREARM ** 2) / (2 * UPPER_ARM * dist);
    const ang = Math.acos(THREE.MathUtils.clamp(cos, -1, 1));
    const bend = _w.copy(pole).sub(S);
    bend.addScaledVector(dir, -bend.dot(dir)).normalize();
    const elbowDir = dir.clone().multiplyScalar(Math.cos(ang)).addScaledVector(bend, Math.sin(ang)).normalize();
    const elbow = S.clone().addScaledVector(elbowDir, UPPER_ARM);

    upper.quaternion.copy(upper.parent.getWorldQuaternion(_q).invert().multiply(_q2.setFromUnitVectors(DOWN, elbowDir)));
    upper.updateMatrixWorld(true);
    const wrist = S.clone().addScaledVector(dir, dist);
    const foreDir = wrist.sub(elbow).normalize();
    fore.quaternion.copy(upper.getWorldQuaternion(_q).invert().multiply(_q2.setFromUnitVectors(DOWN, foreDir)));
  }

  update(dt, st) {
    if (this.deadT >= 0) { this.updateDeath(dt); return; }
    const B = this.B;

    // 步態：速度決定步頻與步幅；蹲下時步頻放慢
    this.crouchK += ((st.crouch ? 1 : 0) - this.crouchK) * Math.min(1, dt * 10);
    const ck = this.crouchK, moving = st.speed > 0.3 && st.onGround;
    this.gait += dt * (moving ? 2.2 + st.speed * 1.15 : 0) * (ck > 0.5 ? 0.7 : 1);
    this.stride += ((moving ? Math.min(1, st.speed / 5) : 0) - this.stride) * Math.min(1, dt * 8);
    this.legs(st, ck);

    // 骨盆：走路時上下起伏、左右扭
    const g = this.gait, A = this.stride;
    B.hips.position.y = 0.97 - ck * 0.38 - (moving ? Math.abs(Math.cos(g)) * 0.035 * A : 0) + (st.onGround ? 0 : 0.02);
    B.hips.position.z = ck * 0.08;
    B.hips.rotation.y = Math.sin(g) * 0.08 * A;

    // 上身：跟著視角俯仰，身體側向持槍
    const pitch = THREE.MathUtils.clamp(st.pitch, -1.2, 1.2);
    B.spine.rotation.set(pitch * 0.3 + ck * 0.15, -B.hips.rotation.y - 0.25, 0);
    B.chest.rotation.set(pitch * 0.45 - this.recoilK * 0.08, -0.12, 0);
    B.neck.rotation.set(pitch * 0.2, 0.3, 0);
    B.head.rotation.set(0, 0.05, 0);
    if (this.flinchK > 0.01) {
      B.spine.rotation.x -= this.flinchK * 0.12;
      B.chest.rotation.x -= this.flinchK * 0.2;
      B.chest.rotation.y += this.flinchSide * this.flinchK * 0.35;
      B.head.rotation.x -= this.flinchH * this.flinchK * 0.55;
    }
    this.flinchK *= Math.exp(-dt * 9);
    this.recoilK *= Math.exp(-dt * 12);

    if (this.gun) this.holdGun(st);
    B.handR.rotation.set(0, 0, 0); B.handL.rotation.set(0, 0, 0);
  }

  legs(st, ck) {
    const B = this.B, g = this.gait, A = this.stride;
    const dir = st.fwd < -0.3 ? -1 : 1;                     // 後退時步態反過來
    const swing = Math.sin(g) * 0.62 * A * dir;
    // 膝蓋只在腿往前擺的那半拍彎曲
    const kneeR = Math.max(0, Math.sin(g + Math.PI * 0.5 * dir)) * A;
    const kneeL = Math.max(0, Math.sin(g + Math.PI + Math.PI * 0.5 * dir)) * A;
    let hipR = swing, hipL = -swing, shinR = -kneeR, shinL = -kneeL;
    // 蹲姿：右腿前跨、左腿跪
    const lerp = (a, b) => a * (1 - ck) + b * ck;
    hipR = lerp(hipR, 1.25 + swing * 0.3); hipL = lerp(hipL, 0.55 - swing * 0.3);
    shinR = lerp(shinR, -1.9); shinL = lerp(shinL, -1.2 + Math.min(0, -swing));
    if (!st.onGround) { hipR = 0.7; hipL = 0.25; shinR = -1.1; shinL = -0.6; }   // 空中收腿
    B.thighR.rotation.set(hipR, 0, 0.02); B.thighL.rotation.set(hipL, 0, -0.02);
    B.shinR.rotation.set(shinR, 0, 0); B.shinL.rotation.set(shinL, 0, 0);
    B.footR.rotation.set(-hipR - shinR, 0, 0);               // 腳掌保持貼地
    B.footL.rotation.set(-hipL - shinL, 0, 0);
    if (ck > 0.01) B.footL.rotation.x = 0.5 * ck + B.footL.rotation.x * (1 - ck);
  }

  // 槍的位置（胸骨座標），再用 IK 讓雙手握上去
  holdGun(st) {
    const id = this.gunId, pistol = id === 'deagle', melee = id === 'knife' || id === 'he';
    const gun = this.gun;
    if (melee) {
      gun.position.set(0.18, 0.02, -0.28); gun.rotation.set(-0.3, 0.37, 0);
    } else {
      const reload = st.reloading ? 1 : 0;
      gun.position.set(pistol ? 0.03 : 0.1, (pistol ? 0.14 : 0.1) - reload * 0.08, (pistol ? -0.42 : -0.3) + this.recoilK * 0.05);
      gun.rotation.set(-0.5 * reload, 0.37, 0.4 * reload);
    }
    this.mesh.updateMatrixWorld(true);
    const an = gun.userData.anchors;
    const grip = gun.localToWorld(new THREE.Vector3().copy(an.grip || _v.set(0, 0, 0)));
    this.solveArm('R', grip, this.B.chest.localToWorld(new THREE.Vector3(0.6, -0.5, 0.1)));
    if (an.fore && !melee) {
      const fore = gun.localToWorld(new THREE.Vector3().copy(an.fore));
      this.solveArm('L', fore, this.B.chest.localToWorld(new THREE.Vector3(-0.5, -0.6, 0)));
    } else {
      this.B.upperArmL.rotation.set(0.3, 0, -0.15);
      this.B.forearmL.rotation.set(0.6, 0, 0);
    }
  }

  kick() { this.recoilK = 1; }

  flinch(part) {
    this.flinchK = Math.min(1.3, this.flinchK + 0.8);
    this.flinchSide = Math.random() - 0.5;
    this.flinchH = part === 'head' ? 1 : 0.2;
  }

  setRim(kind) {
    const v = this.rimU.value;
    if (kind === 2) v.set(1.0, 0.5, 0.38, 0.5);
    else if (kind === 1) v.set(0.45, 0.72, 1.0, 0.22);
    else v.set(0, 0, 0, 0);
  }

  die(dirX, dirZ, headshot, world, velocity, dirY = 0) {
    this.deadT = 0;
    this.root.updateWorldMatrix(true, true);
    this.ragdoll = new Ragdoll(this.bones, world, new THREE.Vector3(dirX, dirY, dirZ), velocity, headshot);
    this.material.transparent = false; this.material.opacity = 1; this.opacity = 1;
  }

  updateDeath(dt) {
    this.deadT += dt;
    this.ragdoll?.update(dt);
    if (this.gun) this.gun.visible = this.deadT < 0.25;   // 槍很快脫手消失
  }

  reset() {
    this.ragdoll = null;
    SKELETON.forEach(([, , p], i) => { this.bones[i].position.set(...p); this.bones[i].quaternion.identity(); });
    this.deadT = -1;
    this.mesh.rotation.set(0, 0, 0);
    this.material.transparent = false; this.material.opacity = 1; this.opacity = 1;
    if (this.gun) this.gun.visible = true;
  }

  // 子彈命中：先用一顆包住全身的球粗篩，再逐一測各骨頭的命中盒（同一幀只算一次反矩陣）
  hitTest(o, d, maxT, frame) {
    const hip = this.B.hips.getWorldPosition(_v);
    const wx = hip.x - o.x, wy = hip.y + 0.3 - o.y, wz = hip.z - o.z;
    const along = wx * d.x + wy * d.y + wz * d.z;
    if (along < -1.5 || along > maxT + 1.5) return null;
    const px = wx - d.x * along, py = wy - d.y * along, pz = wz - d.z * along;
    if (px * px + py * py + pz * pz > 1.6) return null;

    if (this.hitFrame !== frame) {
      this.mesh.updateMatrixWorld(true);
      HITBOXES.forEach(([bone], i) => this.hitInv[i].copy(this.B[bone].matrixWorld).invert());
      this.hitFrame = frame;
    }
    let best = maxT, part = null;
    for (let i = 0; i < HITBOXES.length; i++) {
      const [, center, half, name] = HITBOXES[i];
      _lo.copy(o).applyMatrix4(this.hitInv[i]);
      _ld.copy(d).transformDirection(this.hitInv[i]);
      const t = rayBox(_lo, _ld, center, half, best);
      if (t >= 0 && t < best) { best = t; part = name; }
    }
    return part ? { t: best, part } : null;
  }

  muzzleWorld(out) {
    if (!this.gun) return this.B.head.getWorldPosition(out);
    return this.gun.localToWorld(out.copy(this.gun.userData.anchors.muzzle || _v.set(0, 0, -0.5)));
  }
  headWorld(out) { return this.B.head.localToWorld(out.set(0, 0.1, 0)); }
  chestWorld(out) { return this.B.chest.localToWorld(out.set(0, 0.1, 0)); }
}
