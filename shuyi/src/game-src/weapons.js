// 樹義國小校園對戰：武器資料與射擊數學
//
// 對外介面
//   WEAPONS[id]            武器定義（欄位見下方 gun() 說明）
//   PRIMARIES              可選主武器清單（出生選單用）
//   new WeaponState(id)    一把武器的即時狀態（彈匣、備彈、冷卻、連射計數…）
//   currentSpread(ws, st)  目前的散佈角（弧度，圓錐半角）
//   recoilKick(ws, rnd)    這一發的後座力 [往上, 往右]（弧度）
//   jitterDir(dir, spread, rnd)  把方向向量在散佈圓錐內隨機偏移（就地修改並回傳）
//
// 平衡原則
//   - 步槍：身體 3～4 發、爆頭 1 發；第一發幾乎完全準確，連射時準度下降
//   - 衝鋒槍：射速快、近距離強、遠距衰減大，移動中仍堪用
//   - 狙擊槍：開鏡且完成穩定後才準；身體一發不死，爆頭必死
//   - 霰彈槍：近距離一發倒地，超過 15 m 幾乎沒威脅
//   - 後座力：每把槍都是「固定路徑」，練過就能壓；只疊上很小的隨機量

const D = Math.PI / 180;   // 1 度

// 後座力路徑：每個控制點是 [第幾發, 往上(度), 往右(度)]，中間的發數線性插值，
// 超出最後一點就在最後兩點之間來回擺（長時間連射時槍口左右飄）。
function path(points) {
  return points.map(([n, up, right]) => [n, up * D, right * D]);
}

function sampleRecoil(pts, n) {
  if (pts.length === 1) return [pts[0][1], pts[0][2]];     // 單發武器：每發都一樣
  if (n >= pts[pts.length - 1][0]) {
    const a = pts[pts.length - 2], b = pts[pts.length - 1];
    const span = b[0] - a[0];
    const t = ((n - b[0]) % (span * 2)) / span;            // 0..2
    const f = t <= 1 ? 1 - t : t - 1;                      // 在 b→a→b 之間來回
    return [a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
  }
  for (let i = 1; i < pts.length; i++) {
    if (n < pts[i][0]) {
      const a = pts[i - 1], b = pts[i], t = (n - a[0]) / (b[0] - a[0]);
      return [a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
    }
  }
  return [pts[0][1], pts[0][2]];
}

// 槍枝定義的預設值。欄位：
//   type        rifle | smg | sniper | shotgun | pistol | melee | grenade
//   slot        0 主武器、1 手槍、2 近戰、3 投擲
//   dmg / headMul / limbMul      基本傷害、爆頭與四肢倍率
//   rpm / mag / reserve / reload / draw   射速、彈匣、備彈、換彈秒數、掏槍秒數
//   speed       持槍移動速度倍率
//   range / falloff              有效射程（m）、每公尺傷害保留比例
//   pen / armorPen               穿透力（可打穿薄牆的程度）、護甲穿透比例
//   spread      散佈：base 靜止、move 跑動加成、air 空中加成、crouch 蹲下倍率、
//               perShot 每發累積、max 累積上限、recover 停火恢復速度（scoped：狙擊開鏡）
//   recoil      後座力：pattern 路徑、upMax 鏡頭最多上抬、recover 停火回正速度
function gun(o) {
  return {
    auto: false, headMul: 3.5, limbMul: 0.8, speed: 1, falloff: 0.98, pen: 1, armorPen: 0.75,
    sound: o.id, hudName: o.name, ...o,
  };
}

export const WEAPONS = {
  ak47: gun({
    id: 'ak47', name: 'AK-47', slot: 0, type: 'rifle', auto: true,
    dmg: 35, headMul: 4.2, limbMul: 0.78, rpm: 600, mag: 30, reserve: 90, reload: 2.45, draw: 0.85,
    speed: 0.92, range: 220, falloff: 0.986, pen: 1.25, armorPen: 0.78,
    spread: { base: 0.0026, move: 0.046, air: 0.16, crouch: 0.6, perShot: 0.0055, max: 0.05, recover: 7 },
    // 前 8 發幾乎直直往上，之後先往左、再大幅往右擺
    recoil: { pattern: path([[0, 0.66, 0], [3, 0.62, 0.04], [8, 0.42, -0.12], [12, 0.2, -0.42], [17, 0.12, 0.48], [22, 0.1, -0.36]]), upMax: 0.11, recover: 6.5 },
  }),
  m4a1: gun({
    id: 'm4a1', name: 'M4A1', slot: 0, type: 'rifle', auto: true,
    dmg: 31, headMul: 4.0, limbMul: 0.8, rpm: 720, mag: 30, reserve: 90, reload: 2.3, draw: 0.8,
    speed: 0.95, range: 220, falloff: 0.985, pen: 1.0, armorPen: 0.72,
    spread: { base: 0.0022, move: 0.04, air: 0.15, crouch: 0.6, perShot: 0.0043, max: 0.042, recover: 8 },
    // 上跳較小，橫向先往右再緩慢回左
    recoil: { pattern: path([[0, 0.52, 0], [4, 0.47, 0.06], [9, 0.3, 0.3], [14, 0.16, -0.26], [20, 0.12, 0.22]]), upMax: 0.085, recover: 7 },
  }),
  awm: gun({
    id: 'awm', name: 'AWM', slot: 0, type: 'sniper',
    dmg: 115, headMul: 2.3, limbMul: 0.82, rpm: 42, mag: 5, reserve: 20, reload: 3.5, draw: 1.1,
    speed: 0.82, range: 400, falloff: 0.998, pen: 2.6, armorPen: 0.95, bolt: 1.35,
    spread: { base: 0.06, scoped: 0.0004, move: 0.09, air: 0.22, crouch: 0.85, perShot: 0, max: 0.2, recover: 3 },
    recoil: { pattern: path([[0, 2.0, 0.15]]), upMax: 0.035, recover: 4 },
    zoom: [30, 11],
  }),
  mp5: gun({
    id: 'mp5', name: 'MP5', slot: 0, type: 'smg', auto: true,
    dmg: 25, headMul: 3.6, limbMul: 0.86, rpm: 800, mag: 30, reserve: 120, reload: 2.1, draw: 0.6,
    speed: 1.0, range: 120, falloff: 0.946, pen: 0.6, armorPen: 0.6,
    spread: { base: 0.0038, move: 0.022, air: 0.12, crouch: 0.7, perShot: 0.0035, max: 0.04, recover: 9 },
    // 小幅、快速的左右抖動
    recoil: { pattern: path([[0, 0.36, 0], [5, 0.3, -0.12], [9, 0.18, 0.2], [13, 0.12, -0.18]]), upMax: 0.06, recover: 8 },
  }),
  m870: gun({
    id: 'm870', name: 'M870', slot: 0, type: 'shotgun',
    dmg: 21, pellets: 9, pelletSpread: 0.05, headMul: 2.0, limbMul: 0.8, rpm: 72, mag: 7, reserve: 28, reload: 3.1, draw: 0.9,
    speed: 0.93, range: 70, falloff: 0.62, pen: 0.45, armorPen: 0.7, bolt: 0.72, pump: true,
    spread: { base: 0.008, move: 0.03, air: 0.1, crouch: 0.85, perShot: 0, max: 0.01, recover: 5 },
    recoil: { pattern: path([[0, 2.9, 0.4]]), upMax: 0.07, recover: 5 },
  }),
  deagle: gun({
    id: 'deagle', name: '沙漠之鷹', slot: 1, type: 'pistol', hudName: 'DESERT EAGLE',
    dmg: 54, headMul: 3.8, limbMul: 0.75, rpm: 250, mag: 7, reserve: 35, reload: 2.0, draw: 0.55,
    speed: 1.0, range: 150, falloff: 0.98, pen: 1.0, armorPen: 0.8,
    spread: { base: 0.0036, move: 0.05, air: 0.18, crouch: 0.7, perShot: 0.028, max: 0.07, recover: 5 },
    recoil: { pattern: path([[0, 1.75, 0.1], [1, 1.75, -0.35], [3, 1.6, 0.45]]), upMax: 0.09, recover: 5 },
  }),
  knife: {
    id: 'knife', name: '軍刀', slot: 2, type: 'melee', auto: true, sound: 'knife', hudName: 'KNIFE',
    dmgLight: 50, dmgHeavy: 100, rangeLight: 1.9, rangeHeavy: 1.6, rateLight: 0.42, rateHeavy: 1.05,
    draw: 0.4, speed: 1.08, mag: 0, reserve: 0,
  },
  he: {
    id: 'he', name: '手雷', slot: 3, type: 'grenade', sound: 'grenade', hudName: 'HE GRENADE',
    dmg: 170, armorPen: 0.9, radius: 7.5, fuse: 2.6, count: 1, draw: 0.5, speed: 1.0, mag: 1, reserve: 0,
  },
};

export const PRIMARIES = Object.values(WEAPONS).filter((w) => w.slot === 0).map((w) => w.id);

export class WeaponState {
  constructor(id) {
    this.id = id;
    this.def = WEAPONS[id];
    this.mag = this.def.mag;
    this.reserve = this.def.reserve;
    this.nextFire = 0;       // 下一發最早可擊發的時間
    this.reloadUntil = 0;    // 換彈完成時間（0 = 沒在換彈）
    this.boltUntil = 0;      // 拉栓／泵動完成時間
    this.lastShot = -10;
    this.shotsFired = 0;     // 這一串連射已打幾發（停火後歸零）
    this.spreadAcc = 0;      // 連射累積的散佈
  }

  get reloading() { return this.reloadUntil > 0; }

  get usesAmmo() { return this.def.type !== 'melee' && this.def.type !== 'grenade'; }

  canReload() {
    return this.usesAmmo && !this.reloading && this.mag < this.def.mag && this.reserve > 0;
  }

  finishReload() {
    const moved = Math.min(this.def.mag - this.mag, this.reserve);
    this.mag += moved;
    this.reserve -= moved;
    this.reloadUntil = 0;
  }

  refill() {
    this.mag = this.def.mag;
    this.reserve = this.def.reserve;
    this.reloadUntil = 0;
    this.boltUntil = 0;
  }
}

// st：{ speed 水平速度 m/s, onGround, crouch, scoped, scopeReady }
export function currentSpread(ws, st) {
  const s = ws.def.spread;
  if (!s) return 0;
  const sniperSteady = ws.def.type === 'sniper' && st.scoped && st.scopeReady;
  let cone = sniperSteady ? s.scoped : s.base;
  // 走路（1.6 m/s 以下）不影響，跑到 5 m/s 時加滿
  const run = Math.min(1, Math.max(0, ((st.speed || 0) - 1.6) / 3.4));
  cone += s.move * run + ws.spreadAcc;
  if (!st.onGround) cone += s.air;
  else if (st.crouch) cone *= s.crouch;
  const cap = s.base + s.max + (st.onGround ? 0 : s.air);
  return Math.min(cone, cap);
}

export function recoilKick(ws, rnd) {
  const r = ws.def.recoil;
  if (!r) return [0, 0];
  const [up, right] = sampleRecoil(r.pattern, ws.shotsFired);
  // 小幅隨機：上下 ±4%，左右 ±0.05 度
  return [up * (0.96 + rnd() * 0.08), right + (rnd() - 0.5) * 0.1 * D];
}

// 在圓錐內偏移方向。偏移量偏向中心（近似常態分布），大多數子彈落在準星附近、偶爾飛遠一點。
export function jitterDir(dir, spread, rnd) {
  if (!(spread > 0)) return dir;
  // 與 dir 垂直的兩個單位向量（無分支正交基）
  const sign = dir.z >= 0 ? 1 : -1;
  const a = -1 / (sign + dir.z), b = dir.x * dir.y * a;
  const t1x = 1 + sign * dir.x * dir.x * a, t1y = sign * b, t1z = -sign * dir.x;
  const t2x = b, t2y = sign + dir.y * dir.y * a, t2z = -dir.y;
  // 取兩個均勻亂數的平均當半徑比例 → 中心較密，且不會超出圓錐
  const r = spread * Math.abs(rnd() + rnd() - 1);
  const ang = rnd() * Math.PI * 2;
  const c = Math.cos(ang) * r, s = Math.sin(ang) * r;
  dir.x += t1x * c + t2x * s;
  dir.y += t1y * c + t2y * s;
  dir.z += t1z * c + t2z * s;
  return dir.normalize();
}
