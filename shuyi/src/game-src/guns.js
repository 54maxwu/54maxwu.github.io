// 樹義國小校園對戰：槍枝 3D 模型（全部用程式產生）
//
// 座標慣例：單位公尺，槍口朝 -Z、上方 +Y、右側 +X，原點約在握把上緣（食指扣扳機的位置）
//
// 對外介面
//   buildGun(id)        回傳 THREE.Group，零件分開（第一人稱用，零件可以動）
//   buildGunMerged(id)  依材質合併成單一 Mesh（第三人稱用，省 draw call）；
//                       錨點位置放在 mesh.userData.anchors
//   gunMaterials()      共用材質（viewmodel 也拿來做手套質感）
//
// 具名子物件（第一人稱動畫會找這些名字）
//   mag 彈匣、bolt 槍機／拉柄、slide 滑套、pump 泵動護木、lever 手雷握片、pin 手雷拉環
// 錨點（空物件）
//   grip 右手握點、fore 左手扶點、muzzle 槍口、eject 拋殼口、magwell 彈匣井、scope 瞄準鏡目鏡
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { fbm, normalFromHeight } from './textures.js';

// ───────── 材質 ─────────

let MATS = null;

function surfaceMaps() {
  const S = 256;
  // 磨損：細噪聲 + 少量刮痕，用在粗糙度與法線
  const n = fbm(S, S, 10, 10, 5, 2718, 0.55);
  const scratch = new Float32Array(S * S);
  let seed = 99;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let k = 0; k < 40; k++) {
    let x = rnd() * S, y = rnd() * S;
    const a = rnd() * Math.PI, len = 10 + rnd() * 50;
    for (let s = 0; s < len; s++) {
      const xi = ((x | 0) % S + S) % S, yi = ((y | 0) % S + S) % S;
      scratch[yi * S + xi] = 1;
      x += Math.cos(a); y += Math.sin(a);
    }
  }
  const height = new Float32Array(S * S);
  const rc = document.createElement('canvas'); rc.width = rc.height = S;
  const rx = rc.getContext('2d'), ri = rx.createImageData(S, S);
  for (let i = 0; i < S * S; i++) {
    height[i] = n[i] * 0.8 - scratch[i] * 0.3;
    const v = 135 + n[i] * 90 - scratch[i] * 70;   // 刮痕處較光滑
    ri.data[i * 4] = ri.data[i * 4 + 1] = ri.data[i * 4 + 2] = v; ri.data[i * 4 + 3] = 255;
  }
  rx.putImageData(ri, 0, 0);
  const rough = new THREE.CanvasTexture(rc);
  const nrm = new THREE.CanvasTexture(normalFromHeight(height, S, S, 1.4));

  // 木紋：被噪聲扭曲的年輪條紋，沿 V 方向延伸
  const W = 256, warp = fbm(W, W, 2, 6, 4, 1618);
  const wc = document.createElement('canvas'); wc.width = wc.height = W;
  const wx = wc.getContext('2d'), wi = wx.createImageData(W, W);
  for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x;
    const ring = 0.5 + 0.5 * Math.sin((x / W) * 38 + warp[i] * 9);
    const k = 0.7 + ring * 0.22 + warp[i] * 0.16;
    wi.data[i * 4] = 128 * k; wi.data[i * 4 + 1] = 70 * k; wi.data[i * 4 + 2] = 36 * k; wi.data[i * 4 + 3] = 255;
  }
  wx.putImageData(wi, 0, 0);
  const wood = new THREE.CanvasTexture(wc);
  wood.colorSpace = THREE.SRGBColorSpace;

  for (const t of [rough, nrm, wood]) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return { rough, nrm, wood };
}

export function gunMaterials() {
  if (MATS) return MATS;
  const t = surfaceMaps();
  const worn = (color, roughness, metalness, extra) => new THREE.MeshStandardMaterial({
    color, roughness, metalness, roughnessMap: t.rough, normalMap: t.nrm, normalScale: new THREE.Vector2(0.3, 0.3), ...extra,
  });
  MATS = {
    metal: worn(0x2a2c2f, 0.4, 0.85),       // 烤藍鋼
    black: worn(0x17181b, 0.58, 0.35),      // 黑色塗層／聚合物
    steel: worn(0x9097a0, 0.28, 0.95),      // 拋光鋼
    wood: new THREE.MeshStandardMaterial({ map: t.wood, roughness: 0.55, metalness: 0.04, normalMap: t.nrm, normalScale: new THREE.Vector2(0.35, 0.35) }),
    bakelite: worn(0x6b2f15, 0.45, 0.1),    // 橘褐色電木（AK 彈匣、握把）
    olive: worn(0x4e5739, 0.6, 0.2),
    tan: worn(0x907b56, 0.6, 0.15),
    rubber: worn(0x131313, 0.86, 0),
    brass: worn(0xc9a14b, 0.3, 1),
    glass: new THREE.MeshStandardMaterial({ color: 0x0b1b26, roughness: 0.05, metalness: 0.9, emissive: 0x06121a }),
    blade: worn(0xcad0d6, 0.18, 1),
    red: worn(0x8b1b15, 0.5, 0.2),
  };
  return MATS;
}

// ───────── 幾何小工具 ─────────

// 圓角方塊（圓角自動限制在尺寸內）
function box(w, h, d, r = 0.004) {
  const rr = Math.min(r, w / 2 - 1e-4, h / 2 - 1e-4, d / 2 - 1e-4);
  return rr > 0.0005 ? new RoundedBoxGeometry(w, h, d, 2, rr) : new THREE.BoxGeometry(w, h, d);
}
// 沿某軸的圓柱：axis 'z'（前後）、'x'（左右）、'y'（上下）；rEnd 為 -Z 端（或 +X、+Y 端）半徑
function tube(r, len, axis = 'z', seg = 14, rEnd = r) {
  const g = new THREE.CylinderGeometry(rEnd, r, len, seg);
  if (axis === 'z') g.rotateX(-Math.PI / 2);
  else if (axis === 'x') g.rotateZ(-Math.PI / 2);
  return g;
}
function add(parent, geo, mat, [x, y, z], [rx, ry, rz] = [0, 0, 0], name) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.rotation.set(rx, ry, rz);
  if (name) m.name = name;
  parent.add(m);
  return m;
}
function group(parent, name, [x, y, z], [rx, ry, rz] = [0, 0, 0]) {
  const g = new THREE.Group();
  g.name = name;
  g.position.set(x, y, z);
  g.rotation.set(rx, ry, rz);
  parent.add(g);
  return g;
}
function marker(parent, name, x, y, z) {
  const o = new THREE.Object3D();
  o.name = name;
  o.position.set(x, y, z);
  parent.add(o);
  return o;
}
// 側面輪廓擠出：pts 為 [前後(往槍口為正), 上下] 的點列，沿 X 擠出 width 厚
function profile(pts, width, bevel = 0.002) {
  const s = new THREE.Shape();
  pts.forEach(([u, v], i) => (i ? s.lineTo(u, v) : s.moveTo(u, v)));
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: width - bevel * 2, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 1, curveSegments: 6 });
  g.translate(0, 0, -(width - bevel * 2) / 2);
  g.rotateY(Math.PI / 2);   // 輪廓的 u → 世界 -Z（槍口方向），擠出方向 → X
  return g;
}
// 弧形彈匣：上緣寬 depth，往下長 len，越往下越往前彎（bend 為底部往前偏移量）
function curvedMagGeo(len, depth, bend, width) {
  const pts = [], N = 10;
  for (let i = 0; i <= N; i++) {            // 後緣，由上往下
    const t = i / N;
    pts.push([-depth / 2 + bend * t * t, -len * t]);
  }
  pts.push([depth / 2 + bend + 0.004, -len - 0.006]);   // 底板稍微凸出
  for (let i = N; i >= 0; i--) {            // 前緣，由下往上
    const t = i / N;
    pts.push([depth / 2 + bend * t * t, -len * t]);
  }
  return profile(pts, width, 0.0025);
}

// ───────── 各槍型 ─────────

const BUILD = {
  ak47(m) {
    const g = new THREE.Group();
    add(g, box(0.048, 0.056, 0.27, 0.005), m.metal, [0, 0.034, -0.05]);                 // 機匣
    add(g, box(0.045, 0.02, 0.23, 0.009), m.metal, [0, 0.07, -0.04]);                   // 防塵蓋
    add(g, box(0.05, 0.044, 0.19, 0.01), m.wood, [0, 0.024, -0.28]);                    // 下護木
    add(g, tube(0.018, 0.16, 'z', 12), m.wood, [0, 0.067, -0.27]);                      // 上護木（導氣管外）
    add(g, tube(0.009, 0.33, 'z'), m.metal, [0, 0.042, -0.47]);                         // 槍管
    add(g, tube(0.0055, 0.22, 'z', 8), m.metal, [0, 0.067, -0.44]);                     // 導氣管
    add(g, box(0.022, 0.034, 0.02, 0.002), m.metal, [0, 0.062, -0.56]);                 // 導氣座
    add(g, box(0.004, 0.024, 0.004, 0), m.metal, [0, 0.09, -0.565]);                    // 準星
    add(g, box(0.016, 0.012, 0.04, 0.002), m.metal, [0, 0.083, -0.15]);                 // 表尺座
    add(g, tube(0.0125, 0.055, 'z', 10, 0.011), m.metal, [0, 0.042, -0.66]);            // 斜切制退器
    add(g, box(0.026, 0.01, 0.03, 0.002), m.metal, [0, 0.016, -0.385]);                 // 護木箍
    const mag = group(g, 'mag', [0, 0.006, -0.11]);
    add(mag, curvedMagGeo(0.2, 0.07, 0.085, 0.03), m.bakelite, [0, 0, 0]);
    add(g, box(0.03, 0.1, 0.042, 0.009), m.bakelite, [0, -0.046, 0.036], [0.3, 0, 0]);  // 握把
    add(g, box(0.006, 0.006, 0.065, 0), m.metal, [0, -0.012, -0.012]);                  // 扳機護圈
    add(g, box(0.004, 0.028, 0.004, 0), m.metal, [0, -0.016, -0.026], [0.25, 0, 0]);    // 扳機
    add(g, box(0.003, 0.016, 0.07, 0.001), m.metal, [0.026, 0.03, -0.04]);              // 快慢機
    const stock = group(g, 'stock', [0, 0.012, 0.09]);   // 輪廓本身就往下垂
    add(stock, profile([[0, 0.03], [0, -0.022], [-0.26, -0.07], [-0.27, 0.01]], 0.04, 0.006), m.wood, [0, 0, 0]);
    add(stock, box(0.042, 0.095, 0.01, 0.002), m.metal, [0, -0.02, 0.272]);            // 托底鈑
    add(g, tube(0.006, 0.03, 'x', 8), m.steel, [0.035, 0.06, -0.075], [0, 0, 0], 'bolt');
    marker(g, 'grip', 0, -0.036, 0.03);
    marker(g, 'fore', 0, 0.0, -0.29);
    marker(g, 'muzzle', 0, 0.042, -0.69);
    marker(g, 'eject', 0.03, 0.066, -0.04);
    marker(g, 'magwell', 0, -0.02, -0.11);
    return g;
  },

  m4a1(m) {
    const g = new THREE.Group();
    add(g, box(0.042, 0.048, 0.22, 0.004), m.black, [0, 0.05, -0.04]);                 // 上機匣
    add(g, box(0.022, 0.008, 0.2, 0.001), m.metal, [0, 0.078, -0.045]);                 // 頂部導軌
    for (let i = 0; i < 10; i++) add(g, box(0.025, 0.004, 0.007, 0), m.metal, [0, 0.084, -0.13 + i * 0.019]);
    add(g, box(0.026, 0.026, 0.03, 0.004), m.black, [0, 0.098, 0.04]);                  // 折疊後照門
    add(g, box(0.038, 0.048, 0.16, 0.004), m.black, [0, 0.008, -0.02]);                 // 下機匣
    add(g, box(0.038, 0.034, 0.05, 0.004), m.black, [0, -0.026, -0.09]);                // 彈匣井
    add(g, tube(0.025, 0.2, 'z', 12), m.black, [0, 0.047, -0.27]);                      // 護木
    for (let i = 0; i < 5; i++) add(g, tube(0.0258, 0.005, 'z', 12), m.metal, [0, 0.047, -0.2 - i * 0.034]);
    add(g, tube(0.0078, 0.21, 'z'), m.metal, [0, 0.047, -0.47]);                        // 槍管
    add(g, profile([[0, 0], [0.024, 0], [0.012, 0.058], [0.004, 0.058]], 0.016, 0.002), m.black, [0, 0.04, -0.395]);  // 三角準星座
    add(g, box(0.004, 0.018, 0.004, 0), m.metal, [0, 0.106, -0.405]);
    add(g, tube(0.0105, 0.048, 'z', 8), m.metal, [0, 0.047, -0.6]);                     // 鳥籠消焰器
    const mag = group(g, 'mag', [0, -0.042, -0.088]);
    add(mag, curvedMagGeo(0.17, 0.062, 0.035, 0.026), m.metal, [0, 0, 0]);
    add(g, box(0.028, 0.088, 0.036, 0.007), m.black, [0, -0.042, 0.036], [0.36, 0, 0]); // 握把
    add(g, box(0.005, 0.005, 0.06, 0), m.black, [0, -0.016, -0.01]);                    // 扳機護圈
    add(g, tube(0.015, 0.17, 'z', 12), m.black, [0, 0.045, 0.15]);                      // 緩衝管
    add(g, profile([[0, 0.036], [0, -0.04], [-0.095, -0.05], [-0.1, 0.034]], 0.042, 0.006), m.black, [0, 0.03, 0.19]);  // 伸縮槍托
    add(g, box(0.03, 0.01, 0.02, 0.002), m.black, [0, 0.077, 0.068], [0, 0, 0], 'bolt'); // 拉柄
    add(g, tube(0.006, 0.02, 'z', 8), m.black, [0.024, 0.052, 0.01]);                   // 輔助閉鎖鈕
    marker(g, 'grip', 0, -0.035, 0.035);
    marker(g, 'fore', 0, 0.02, -0.28);
    marker(g, 'muzzle', 0, 0.047, -0.625);
    marker(g, 'eject', 0.024, 0.055, -0.03);
    marker(g, 'magwell', 0, -0.06, -0.088);
    return g;
  },

  awm(m) {
    const g = new THREE.Group();
    add(g, box(0.056, 0.074, 0.44, 0.012), m.olive, [0, 0.004, -0.03]);                // 槍身底盤
    add(g, box(0.05, 0.048, 0.22, 0.012), m.olive, [0, -0.004, -0.34]);                 // 前護木
    add(g, tube(0.021, 0.23, 'z'), m.metal, [0, 0.05, -0.09]);                          // 機匣
    add(g, tube(0.013, 0.55, 'z', 12, 0.011), m.metal, [0, 0.05, -0.5]);                // 槍管（漸細）
    for (let i = 0; i < 3; i++) add(g, box(0.003, 0.004, 0.3, 0), m.black, [Math.cos(i * 2.1) * 0.012, 0.05 + Math.sin(i * 2.1) * 0.012, -0.5]);  // 槍管溝槽
    add(g, box(0.034, 0.03, 0.075, 0.005), m.metal, [0, 0.05, -0.8]);                   // 制退器
    for (let i = 0; i < 3; i++) add(g, box(0.036, 0.024, 0.006, 0), m.black, [0, 0.05, -0.78 - i * 0.017]);
    // 瞄準鏡
    add(g, tube(0.017, 0.28, 'z'), m.black, [0, 0.118, -0.07]);
    add(g, tube(0.018, 0.08, 'z', 16, 0.029), m.black, [0, 0.118, -0.25]);              // 物鏡座
    add(g, tube(0.024, 0.06, 'z', 16, 0.018), m.black, [0, 0.118, 0.1]);                // 目鏡
    add(g, tube(0.0275, 0.002, 'z', 16), m.glass, [0, 0.118, -0.291]);
    add(g, tube(0.011, 0.03, 'y'), m.black, [0, 0.142, -0.07]);                         // 高低旋鈕
    add(g, tube(0.011, 0.03, 'x'), m.black, [0.026, 0.118, -0.07]);                     // 風偏旋鈕
    for (const z of [-0.15, 0.01]) add(g, box(0.028, 0.04, 0.02, 0.003), m.metal, [0, 0.088, z]);  // 鏡環
    const bolt = group(g, 'bolt', [0.022, 0.05, 0.02]);
    add(bolt, tube(0.005, 0.045, 'x', 8), m.steel, [0.02, 0, 0]);
    add(bolt, new THREE.SphereGeometry(0.011, 10, 8), m.black, [0.044, -0.005, 0]);
    const mag = group(g, 'mag', [0, -0.036, -0.075]);
    add(mag, box(0.034, 0.06, 0.088, 0.004), m.metal, [0, -0.03, 0]);
    add(g, box(0.036, 0.1, 0.046, 0.01), m.olive, [0, -0.068, 0.078], [0.3, 0, 0]);     // 握把
    add(g, profile([[0.04, 0.06], [0.05, -0.04], [-0.09, -0.1], [-0.17, -0.1], [-0.17, 0.065]], 0.048, 0.008), m.olive, [0, 0.0, 0.17]);  // 拇指孔槍托
    add(g, box(0.04, 0.026, 0.12, 0.008), m.olive, [0, 0.074, 0.25]);                   // 貼腮板
    add(g, box(0.05, 0.17, 0.014, 0.004), m.rubber, [0, -0.018, 0.345]);                // 托底墊
    for (const x of [-0.012, 0.012]) add(g, tube(0.004, 0.2, 'z', 6), m.black, [x, -0.034, -0.4]);  // 收起的腳架
    marker(g, 'grip', 0, -0.05, 0.075);
    marker(g, 'fore', 0, -0.02, -0.3);
    marker(g, 'muzzle', 0, 0.05, -0.84);
    marker(g, 'eject', 0.03, 0.06, -0.08);
    marker(g, 'magwell', 0, -0.05, -0.075);
    marker(g, 'scope', 0, 0.118, 0.13);
    return g;
  },

  mp5(m) {
    const g = new THREE.Group();
    add(g, box(0.042, 0.058, 0.31, 0.014), m.black, [0, 0.043, -0.09]);                 // 機匣
    add(g, box(0.048, 0.05, 0.15, 0.016), m.black, [0, 0.018, -0.31]);                  // 粗護木
    add(g, tube(0.0085, 0.08, 'z'), m.metal, [0, 0.046, -0.41]);
    add(g, tube(0.0105, 0.02, 'z', 10), m.metal, [0, 0.046, -0.455]);
    add(g, new THREE.TorusGeometry(0.012, 0.0035, 6, 14), m.black, [0, 0.086, -0.38]);   // 準星護環
    add(g, tube(0.014, 0.022, 'y', 12), m.black, [0, 0.086, 0.02]);                     // 鼓形照門
    add(g, tube(0.009, 0.14, 'z', 10), m.black, [-0.024, 0.066, -0.3]);                 // 拉柄管
    const mag = group(g, 'mag', [0, 0.002, -0.13]);
    add(mag, curvedMagGeo(0.17, 0.05, 0.075, 0.025), m.metal, [0, 0, 0]);
    add(g, box(0.03, 0.094, 0.04, 0.008), m.black, [0, -0.042, 0.03], [0.3, 0, 0]);     // 握把
    for (const x of [-0.016, 0.016]) add(g, tube(0.005, 0.2, 'z', 8), m.metal, [x, 0.036, 0.15]);  // 伸縮托桿
    add(g, box(0.046, 0.072, 0.018, 0.006), m.black, [0, 0.03, 0.255]);                 // 托底
    add(g, box(0.012, 0.012, 0.028, 0.002), m.black, [-0.022, 0.07, -0.2], [0, 0, 0], 'bolt');
    marker(g, 'grip', 0, -0.035, 0.03);
    marker(g, 'fore', 0, 0.0, -0.3);
    marker(g, 'muzzle', 0, 0.046, -0.465);
    marker(g, 'eject', 0.025, 0.055, -0.07);
    marker(g, 'magwell', 0, -0.02, -0.13);
    return g;
  },

  m870(m) {
    const g = new THREE.Group();
    add(g, box(0.046, 0.064, 0.22, 0.01), m.black, [0, 0.036, -0.05]);                  // 機匣
    add(g, tube(0.0115, 0.46, 'z'), m.metal, [0, 0.062, -0.39]);                        // 槍管
    add(g, tube(0.0135, 0.36, 'z'), m.black, [0, 0.03, -0.34]);                         // 管狀彈倉
    add(g, tube(0.015, 0.02, 'z'), m.metal, [0, 0.03, -0.53]);                          // 彈倉蓋
    add(g, new THREE.SphereGeometry(0.004, 8, 6), m.brass, [0, 0.076, -0.6]);           // 準星珠
    const pump = group(g, 'pump', [0, 0.03, -0.3]);
    add(pump, box(0.05, 0.044, 0.14, 0.014), m.wood, [0, 0, 0]);
    for (let i = 0; i < 6; i++) add(pump, box(0.052, 0.003, 0.005, 0), m.black, [0, -0.013, -0.05 + i * 0.02]);
    marker(pump, 'fore', 0, -0.02, 0);
    add(g, box(0.008, 0.012, 0.06, 0), m.metal, [0, 0.022, -0.17]);                     // 泵動連桿
    add(g, box(0.012, 0.03, 0.05, 0.004), m.black, [0, -0.008, -0.01]);                 // 扳機護圈
    add(g, box(0.036, 0.074, 0.08, 0.01), m.wood, [0, -0.02, 0.07], [0.35, 0, 0]);      // 握把
    add(g, profile([[0.02, 0.04], [0.02, -0.03], [-0.2, -0.065], [-0.21, 0.035]], 0.04, 0.008), m.wood, [0, 0.01, 0.1]);  // 槍托
    add(g, box(0.042, 0.1, 0.02, 0.006), m.rubber, [0, -0.005, 0.32], [0.08, 0, 0]);    // 托底墊
    add(g, box(0.004, 0.022, 0.05, 0), m.metal, [0.024, 0.045, -0.06]);                 // 拋殼口
    marker(g, 'grip', 0, -0.035, 0.03);
    marker(g, 'muzzle', 0, 0.062, -0.625);
    marker(g, 'eject', 0.026, 0.05, -0.06);
    marker(g, 'magwell', 0, 0.0, -0.1);
    return g;
  },

  deagle(m) {
    const g = new THREE.Group();
    const slide = group(g, 'slide', [0, 0, 0]);
    add(slide, box(0.032, 0.042, 0.255, 0.006), m.steel, [0, 0.062, -0.075]);
    add(slide, box(0.012, 0.006, 0.23, 0.001), m.metal, [0, 0.086, -0.075]);            // 頂部散熱條
    add(slide, box(0.004, 0.01, 0.006, 0), m.metal, [0, 0.093, -0.19]);                 // 準星
    add(slide, box(0.012, 0.01, 0.008, 0.001), m.metal, [0, 0.091, 0.04]);              // 照門
    for (let i = 0; i < 7; i++) add(slide, box(0.034, 0.028, 0.0025, 0), m.metal, [0, 0.062, 0.012 + i * 0.007]);  // 後防滑紋
    add(g, box(0.03, 0.03, 0.18, 0.005), m.metal, [0, 0.027, -0.05]);                   // 槍身
    add(g, box(0.034, 0.112, 0.055, 0.012), m.rubber, [0, -0.04, 0.025], [0.24, 0, 0]); // 握把
    add(g, box(0.006, 0.006, 0.07, 0), m.metal, [0, -0.003, -0.035]);                   // 扳機護圈
    add(g, box(0.006, 0.03, 0.006, 0), m.metal, [0, -0.018, -0.07]);
    add(g, box(0.008, 0.02, 0.012, 0.002), m.metal, [0, 0.076, 0.062], [-0.4, 0, 0]);   // 擊錘
    const mag = group(g, 'mag', [0, -0.03, 0.02], [0.24, 0, 0]);
    add(mag, box(0.022, 0.1, 0.04, 0.002), m.metal, [0, -0.04, 0]);
    marker(g, 'grip', 0, -0.04, 0.03);
    marker(g, 'fore', -0.02, -0.05, 0.02);
    marker(g, 'muzzle', 0, 0.062, -0.21);
    marker(g, 'eject', 0.02, 0.07, -0.03);
    marker(g, 'magwell', 0, -0.1, 0.04);
    return g;
  },

  knife(m) {
    const g = new THREE.Group();
    // 刀刃：微弧的直背刀，刀尖往上收
    const s = new THREE.Shape();
    s.moveTo(0, 0.016);
    s.lineTo(0.13, 0.016);
    s.quadraticCurveTo(0.185, 0.014, 0.205, -0.002);
    s.quadraticCurveTo(0.17, -0.016, 0.1, -0.016);
    s.lineTo(0, -0.014);
    s.closePath();
    const blade = new THREE.ExtrudeGeometry(s, { depth: 0.003, bevelEnabled: true, bevelThickness: 0.0015, bevelSize: 0.0018, bevelSegments: 1 });
    blade.translate(0, 0, -0.0015);
    blade.rotateY(Math.PI / 2);
    add(g, blade, m.blade, [0, 0, -0.034]);
    add(g, box(0.016, 0.05, 0.01, 0.003), m.metal, [0, 0, -0.03]);                      // 護手
    add(g, box(0.024, 0.032, 0.11, 0.01), m.rubber, [0, 0, 0.03]);                      // 刀柄
    for (let i = 0; i < 4; i++) add(g, box(0.026, 0.034, 0.004, 0.001), m.black, [0, 0, -0.008 + i * 0.024]);
    add(g, box(0.026, 0.03, 0.018, 0.006), m.metal, [0, 0, 0.092]);                     // 柄頭
    marker(g, 'grip', 0, 0, 0.03);
    marker(g, 'muzzle', 0, 0, -0.24);
    return g;
  },

  he(m) {
    const g = new THREE.Group();
    // 蛋形彈體：旋轉體
    const pts = [];
    for (let i = 0; i <= 12; i++) {
      const t = i / 12, y = -0.042 + t * 0.086;
      pts.push(new THREE.Vector2(0.0005 + Math.pow(Math.sin(t * Math.PI), 0.55) * 0.034 * (1 - t * 0.12), y));
    }
    add(g, new THREE.LatheGeometry(pts, 16), m.olive, [0, 0, 0]);
    add(g, tube(0.013, 0.028, 'y', 10), m.metal, [0, 0.054, 0]);                       // 引信座
    add(g, box(0.07, 0.01, 0.004, 0.001), m.tan, [0, -0.004, 0.0335]);                  // 標示帶
    add(g, box(0.012, 0.068, 0.005, 0.001), m.metal, [0, 0.03, 0.03], [-0.35, 0, 0], 'lever');
    add(g, new THREE.TorusGeometry(0.012, 0.0022, 6, 14), m.steel, [0.022, 0.058, 0], [0, Math.PI / 2, 0], 'pin');
    marker(g, 'grip', 0, 0, 0);
    marker(g, 'muzzle', 0, 0, -0.04);
    return g;
  },
};

export function buildGun(id) {
  const g = BUILD[id](gunMaterials());
  g.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = false; });
  return g;
}

// ───────── 第三人稱合併版 ─────────
// 同一種材質的零件合併成一個幾何群組，整把槍只要「材質數」個 draw call。

const mergedCache = new Map();

function bakeMerged(id) {
  const g = buildGun(id);
  g.updateMatrixWorld(true);
  const byMat = new Map(), anchors = {};
  g.traverse((o) => {
    if (o.isMesh) {
      let geo = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
      geo.applyMatrix4(o.matrixWorld);
      // 只保留三種屬性，所有零件才能合併
      const clean = new THREE.BufferGeometry();
      clean.setAttribute('position', geo.getAttribute('position'));
      clean.setAttribute('normal', geo.getAttribute('normal'));
      clean.setAttribute('uv', geo.getAttribute('uv') || new THREE.BufferAttribute(new Float32Array(geo.getAttribute('position').count * 2), 2));
      if (!byMat.has(o.material)) byMat.set(o.material, []);
      byMat.get(o.material).push(clean);
    } else if (o !== g && o.children.length === 0 && o.name) {
      anchors[o.name] = o.getWorldPosition(new THREE.Vector3());
    }
  });
  const mats = [...byMat.keys()];
  const geo = mergeGeometries(mats.map((mt) => mergeGeometries(byMat.get(mt), false)), true);
  return { geo, mats, anchors };
}

export function buildGunMerged(id) {
  if (!mergedCache.has(id)) mergedCache.set(id, bakeMerged(id));
  const d = mergedCache.get(id);
  const mesh = new THREE.Mesh(d.geo, d.mats);
  mesh.castShadow = true;
  mesh.userData.anchors = d.anchors;
  return mesh;
}
