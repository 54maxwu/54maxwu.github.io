// 樹義國小校園對戰：程序貼圖
// 所有貼圖都在執行時用 Canvas 畫出來，不載入任何圖檔。
//
// 對外介面
//   fbm(w, h, fx, fy, octaves, seed, persistence?) → Float32Array(w*h)，值域 0..1，左右上下可無縫平鋪
//   normalFromHeight(height, w, h, strength)       → canvas，切線空間法線圖（可平鋪）
//   buildTextures(quality)                         → 特效用貼圖集合（見檔案最後）
import * as THREE from 'three';

// ───────── 亂數與噪聲 ─────────

// splitmix32：給定種子就產生固定序列，讓每次畫出來的貼圖都一樣
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x9e3779b9) >>> 0;
    let z = s;
    z = Math.imul(z ^ (z >>> 16), 0x21f0aaad);
    z = Math.imul(z ^ (z >>> 15), 0x735a2d97);
    return ((z ^ (z >>> 15)) >>> 0) / 4294967296;
  };
}

// 整數格點雜湊 → 0..1
function hash3(x, y, s) {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(s, 2246822519);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
const mod = (a, n) => ((a % n) + n) % n;

// 週期性值噪聲疊加。fx、fy 為第一層在橫、直方向的格數；每層頻率加倍，格數也跟著加倍，所以仍可平鋪。
export function fbm(w, h, fx, fy, octaves, seed, persistence = 0.5) {
  const out = new Float32Array(w * h);
  let amp = 1;
  for (let o = 0; o < octaves; o++) {
    const cx = Math.max(1, Math.round(fx * (1 << o)));
    const cy = Math.max(1, Math.round(fy * (1 << o)));
    const s = (seed * 131 + o * 7919) | 0;
    // 先把這層的格點值算好，避免每個像素重算雜湊
    const lat = new Float32Array(cx * cy);
    for (let j = 0; j < cy; j++) for (let i = 0; i < cx; i++) lat[j * cx + i] = hash3(i, j, s);
    for (let y = 0; y < h; y++) {
      const gy = (y / h) * cy, j0 = Math.floor(gy), ty = fade(gy - j0);
      const r0 = mod(j0, cy) * cx, r1 = mod(j0 + 1, cy) * cx;
      for (let x = 0; x < w; x++) {
        const gx = (x / w) * cx, i0 = Math.floor(gx), tx = fade(gx - i0);
        const c0 = mod(i0, cx), c1 = mod(i0 + 1, cx);
        const a = lat[r0 + c0] + (lat[r0 + c1] - lat[r0 + c0]) * tx;
        const b = lat[r1 + c0] + (lat[r1 + c1] - lat[r1 + c0]) * tx;
        out[y * w + x] += (a + (b - a) * ty) * amp;
      }
    }
    amp *= persistence;
  }
  // 拉伸到完整的 0..1，讓各種用途的門檻值都有作用
  let lo = Infinity, hi = -Infinity;
  for (let i = 0; i < out.length; i++) { const v = out[i]; if (v < lo) lo = v; if (v > hi) hi = v; }
  const k = hi > lo ? 1 / (hi - lo) : 0;
  for (let i = 0; i < out.length; i++) out[i] = (out[i] - lo) * k;
  return out;
}

// 高度圖 → 法線圖（Sobel 3×3，邊界環繞）
export function normalFromHeight(hgt, w, h, strength) {
  const c = canvas(w, h), ctx = c.getContext('2d');
  const img = ctx.createImageData(w, h), d = img.data;
  const H = (x, y) => hgt[mod(y, h) * w + mod(x, w)];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const tl = H(x - 1, y - 1), t = H(x, y - 1), tr = H(x + 1, y - 1);
    const l = H(x - 1, y), r = H(x + 1, y);
    const bl = H(x - 1, y + 1), b = H(x, y + 1), br = H(x + 1, y + 1);
    const dx = (tr + 2 * r + br) - (tl + 2 * l + bl);
    const dy = (bl + 2 * b + br) - (tl + 2 * t + tr);
    let nx = -dx * strength, ny = dy * strength, nz = 1;
    const inv = 1 / Math.hypot(nx, ny, nz);
    nx *= inv; ny *= inv; nz *= inv;
    const i = (y * w + x) * 4;
    d[i] = (nx * 0.5 + 0.5) * 255; d[i + 1] = (ny * 0.5 + 0.5) * 255; d[i + 2] = (nz * 0.5 + 0.5) * 255; d[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

// ───────── 繪圖小工具 ─────────

function canvas(w, h = w) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

function toTexture(c, { srgb = true, mips = true } = {}) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.generateMipmaps = mips;
  t.anisotropy = 4;
  t.needsUpdate = true;
  return t;
}

// 逐像素繪製：fn(u, v) 回傳 [r, g, b, a]（0..255），u、v 以中心為 0、邊緣為 ±1
function paint(size, fn) {
  const c = canvas(size), ctx = c.getContext('2d');
  const img = ctx.createImageData(size, size), d = img.data;
  const px = [0, 0, 0, 0];
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const u = (x + 0.5) / size * 2 - 1, v = (y + 0.5) / size * 2 - 1;
    fn(u, v, px, x, y);
    const i = (y * size + x) * 4;
    d[i] = px[0]; d[i + 1] = px[1]; d[i + 2] = px[2]; d[i + 3] = px[3];
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };

// 以角度取樣的平鋪噪聲：讓圓形圖案的邊緣不規則，且繞一圈接得起來
function ringNoise(n, seed, lumps) {
  const r = rng(seed), arr = new Float32Array(n);
  const ph = [], amp = [];
  for (let k = 1; k <= lumps; k++) { ph.push(r() * Math.PI * 2); amp.push((r() * 0.6 + 0.4) / k); }
  let hi = 0;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    let s = 0;
    for (let k = 0; k < lumps; k++) s += Math.sin(a * (k + 1) * 2 + ph[k]) * amp[k];
    arr[i] = s; hi = Math.max(hi, Math.abs(s));
  }
  for (let i = 0; i < n; i++) arr[i] /= hi || 1;
  return (ang) => arr[Math.floor(mod(ang / (Math.PI * 2), 1) * n) % n];
}

// ───────── 粒子 ─────────

// 加法發光點：中心白熱、外圈快速衰減
function glowTex(S) {
  return toTexture(paint(S, (u, v, p) => {
    const r = Math.hypot(u, v);
    const core = Math.exp(-r * r * 18), halo = Math.pow(clamp01(1 - r), 2.2) * 0.55;
    const a = clamp01(core + halo);
    p[0] = p[1] = p[2] = 255; p[3] = a * 255;
  }));
}

// 煙霧團：用噪聲侵蝕的柔邊圓，看起來像一團粉塵
function puffTex(S) {
  const n = fbm(S, S, 3, 3, 4, 31, 0.55);
  return toTexture(paint(S, (u, v, p, x, y) => {
    const r = Math.hypot(u, v);
    const body = smooth(1, 0.25, r + (n[y * S + x] - 0.5) * 0.55);
    const shade = 0.78 + n[y * S + x] * 0.22;
    p[0] = p[1] = p[2] = 255 * shade; p[3] = body * 0.9 * 255;
  }));
}

// ───────── 彈孔 ─────────
// 三種材質各自有不同的破壞樣貌，透明背景、中心為孔洞

function holeTex(S, kind) {
  const n = fbm(S, S, 6, 6, 4, kind === 'metal' ? 11 : kind === 'wood' ? 12 : 13);
  const edge = ringNoise(256, kind.length * 97 + 5, 7);
  const r = rng(kind.length * 31 + 1);
  // 木頭：沿紋理方向的裂片；石材：放射狀碎裂線
  const shards = [];
  const nShard = kind === 'wood' ? 6 : kind === 'stone' ? 9 : 5;
  for (let i = 0; i < nShard; i++) {
    shards.push({ a: kind === 'wood' ? (r() < 0.5 ? 0 : Math.PI) + (r() - 0.5) * 0.5 : r() * Math.PI * 2, len: 0.45 + r() * 0.45, w: 0.03 + r() * 0.05 });
  }
  return toTexture(paint(S, (u, v, p, x, y) => {
    const d = Math.hypot(u, v), ang = Math.atan2(v, u), nz = n[y * S + x];
    const holeR = kind === 'metal' ? 0.16 : 0.2;
    const rim = holeR + 0.05 + edge(ang) * 0.04;
    let a = 0, cr = 0, cg = 0, cb = 0;
    // 孔本體
    const hole = smooth(rim, rim - 0.06, d);
    // 周圍受損區
    let dmgR = kind === 'metal' ? 0.42 : kind === 'wood' ? 0.5 : 0.62;
    dmgR += edge(ang * 1.7 + 1) * 0.08;
    const dmg = smooth(dmgR, rim, d) * (0.65 + nz * 0.35);
    // 裂片／裂紋
    let crack = 0;
    for (const s of shards) {
      let da = Math.abs(mod(ang - s.a + Math.PI, Math.PI * 2) - Math.PI);
      const along = d / s.len;
      if (along < 1 && d > rim * 0.8) crack = Math.max(crack, smooth(s.w * (1 - along) + 0.004, 0, da * d) * (1 - along));
    }
    if (kind === 'metal') {
      // 被撐開的亮金屬唇邊 + 外圈的焦黑
      const lip = Math.exp(-Math.pow((d - rim) / 0.035, 2));
      const soot = dmg * 0.75;
      const shine = lip * (0.6 + 0.4 * Math.cos(ang - 2.3));
      cr = 40 + shine * 170 + crack * 60; cg = 38 + shine * 165 + crack * 55; cb = 36 + shine * 160 + crack * 50;
      a = Math.max(soot, lip * 0.95, crack * 0.6);
    } else if (kind === 'wood') {
      // 露出的淺色木纖維 + 深色撕裂
      const fiber = 0.5 + 0.5 * Math.sin(v * 70 + nz * 6);
      const exposed = dmg * (0.55 + fiber * 0.45);
      cr = 196 - crack * 90; cg = 156 - crack * 80; cb = 104 - crack * 60;
      a = Math.max(exposed * 0.85, crack * 0.9);
    } else {
      // 混凝土、磨石子、磁磚：灰白粉塵 + 剝落坑洞 + 放射裂紋
      const chip = smooth(0.2, 0.75, nz) * dmg;
      const dust = smooth(dmgR + 0.18, dmgR - 0.1, d) * 0.35;
      const lum = 205 - chip * 70 - crack * 110;
      cr = lum; cg = lum - 4; cb = lum - 10;
      a = Math.max(dust, chip * 0.9 + dmg * 0.25, crack * 0.85);
    }
    // 疊上孔洞（接近純黑，中心最深）
    const deep = 12 + 20 * smooth(0, rim, d);
    cr = cr + (deep - cr) * hole; cg = cg + (deep - cg) * hole; cb = cb + (deep - cb) * hole;
    a = Math.max(a, hole);
    p[0] = cr; p[1] = cg; p[2] = cb; p[3] = clamp01(a) * 255;
  }));
}

// 血跡：主體 + 噴出的液滴與拖尾
function bloodTex(S) {
  const n = fbm(S, S, 5, 5, 4, 77);
  const edge = ringNoise(256, 4242, 9);
  const r = rng(909), drops = [];
  for (let i = 0; i < 22; i++) {
    const a = r() * Math.PI * 2, dist = 0.4 + r() * 0.5;
    drops.push({ x: Math.cos(a) * dist, y: Math.sin(a) * dist, r: 0.015 + r() * 0.05 * (1 - dist * 0.6), a, tail: r() * 0.12 });
  }
  return toTexture(paint(S, (u, v, p, x, y) => {
    const d = Math.hypot(u, v), ang = Math.atan2(v, u), nz = n[y * S + x];
    let a = smooth(0.42 + edge(ang) * 0.14, 0.34 + edge(ang) * 0.14, d + (nz - 0.5) * 0.12);
    for (const q of drops) {
      // 液滴沿噴射方向拉長
      const dx = u - q.x, dy = v - q.y;
      const along = dx * Math.cos(q.a) + dy * Math.sin(q.a), side = -dx * Math.sin(q.a) + dy * Math.cos(q.a);
      const stretch = along < 0 ? along / (1 + q.tail * 12) : along;
      a = Math.max(a, smooth(q.r, q.r * 0.6, Math.hypot(stretch, side)));
    }
    const wet = 0.55 + nz * 0.45;
    p[0] = 92 * wet + 20; p[1] = 6 * wet; p[2] = 8 * wet; p[3] = clamp01(a) * 235;
  }));
}

// 爆炸焦痕：中心最黑，往外是一圈圈不均勻的煙燻
function scorchTex(S) {
  const n = fbm(S, S, 4, 4, 5, 55, 0.6);
  const edge = ringNoise(256, 5151, 10);
  return toTexture(paint(S, (u, v, p, x, y) => {
    const d = Math.hypot(u, v), ang = Math.atan2(v, u), nz = n[y * S + x];
    const reach = 0.82 + edge(ang) * 0.13;
    const soot = smooth(reach, 0.1, d + (nz - 0.5) * 0.35);
    // 噴濺狀的放射條紋
    const rays = 1 - smooth(0.25, 0.7, d) * (0.2 + 0.2 * Math.sin(ang * 11 + nz * 9));
    const a = clamp01(soot * rays * 1.15);
    const lum = 18 + nz * 26;
    p[0] = lum + 6; p[1] = lum + 2; p[2] = lum; p[3] = a * 245;
  }));
}

// ───────── 槍口火焰 ─────────

// 正面：白熱核心 + 數片不規則的火瓣
function flashFront(S, seed, petals) {
  const r = rng(seed), rot = r() * Math.PI;
  const len = [], wid = [];
  for (let i = 0; i < petals; i++) { len.push(0.6 + r() * 0.4); wid.push(0.25 + r() * 0.25); }
  const n = fbm(S, S, 4, 4, 3, seed * 3 + 1);
  return toTexture(paint(S, (u, v, p, x, y) => {
    const d = Math.hypot(u, v), ang = Math.atan2(v, u) + rot;
    // 找最近的火瓣
    const sector = (Math.PI * 2) / petals;
    const k = Math.round(ang / sector), idx = mod(k, petals);
    const off = Math.abs(ang - k * sector) / (sector * 0.5);
    const petal = smooth(len[idx], len[idx] * 0.35, d) * smooth(wid[idx] * (1 - d * 0.6) + 0.05, 0, off * d);
    const core = Math.exp(-d * d * 22);
    const flick = 0.75 + n[y * S + x] * 0.5;
    const a = clamp01(core * 1.3 + petal * flick * 0.85);
    // 中心偏白、外圍偏橘
    const hot = clamp01(core * 1.4 + 0.25);
    p[0] = 255; p[1] = 150 + hot * 105; p[2] = 60 + hot * 190; p[3] = a * 255;
  }));
}

// 側面：從槍口往外噴的錐形火舌（左側為槍口）
function flashSideTex(W, H) {
  const c = canvas(W, H), ctx = c.getContext('2d');
  const img = ctx.createImageData(W, H), d = img.data;
  const n = fbm(W, H, 6, 2, 3, 606);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const t = x / (W - 1), v = ((y + 0.5) / H) * 2 - 1;
    const nz = n[y * W + x];
    const width = 0.25 + t * 0.6 + Math.sin(t * 20 + nz * 3) * 0.06;
    const body = smooth(width, width * 0.25, Math.abs(v)) * smooth(1, 0.55, t + (nz - 0.5) * 0.3) * smooth(0, 0.05, t);
    const core = Math.exp(-v * v * 30) * Math.exp(-t * 3.5);
    const a = clamp01(body * 0.9 + core);
    const hot = clamp01(core * 1.5);
    const i = (y * W + x) * 4;
    d[i] = 255; d[i + 1] = 145 + hot * 110; d[i + 2] = 55 + hot * 200; d[i + 3] = a * 255;
  }
  ctx.putImageData(img, 0, 0);
  return toTexture(c);
}

// ───────── 打包 ─────────

// 回傳的物件：
//   glow        加法發光粒子（火花、彈道亮點）
//   puff        煙霧／粉塵粒子
//   holeMetal / holeWood / holeStone   三種材質的彈孔
//   blood       血跡
//   scorch      爆炸焦痕
//   flash[0..2] 三種正面槍口火焰（隨機輪替）
//   flashSide   側面槍口火舌
export function buildTextures(quality = 'high') {
  const q = quality === 'low' ? 0.5 : 1;
  const sz = (n) => Math.max(32, Math.round(n * q));
  return {
    glow: glowTex(sz(64)),
    puff: puffTex(sz(128)),
    holeMetal: holeTex(sz(128), 'metal'),
    holeWood: holeTex(sz(128), 'wood'),
    holeStone: holeTex(sz(128), 'stone'),
    blood: bloodTex(sz(256)),
    scorch: scorchTex(sz(256)),
    flash: [flashFront(sz(128), 101, 5), flashFront(sz(128), 202, 6), flashFront(sz(128), 303, 4)],
    flashSide: flashSideTex(sz(128), sz(32)),
  };
}
