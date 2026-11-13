// 樹義國小校園對戰：碰撞世界
//
// 所有靜態碰撞體都是「只繞垂直軸旋轉的長方體」（OBB）。
// 旋轉慣例同 three.js 的 rotation.y：本地 (x, z) → 世界 (c·x + s·z, −s·x + c·z)
//
// 對外介面
//   new Collider({ x, y, z, sx, sy, sz, yaw?, mat?, solid?, bullet?, sight?, surface?, tag? })
//     mat      命中材質 metal | wood | mesh | concrete（決定彈孔與特效）
//     solid    擋不擋人
//     bullet   block 擋子彈 | pass 子彈直接穿過 | pen 可被穿透
//     sight    擋不擋視線（電腦玩家判斷看不看得到你）
//     surface  腳步聲材質
//   World
//     add(o) build()                       加入碰撞體、建立空間格（之後才能查詢）
//     grid                                 Map：鍵 = 格X*1000+格Z（每格 4 m），值 = 碰撞體陣列（校園程式會直接讀寫）
//     query(minX, minZ, maxX, maxZ)        範圍內的碰撞體（回傳共用陣列，下一次查詢會被覆蓋）
//     raycast(ox,oy,oz, dx,dy,dz, maxT, mode)   mode：move | bullet | sight，回傳最近命中
//     raycastAll(...)                      沿線所有命中（穿透用）
//     blocked(x, y, z, r, h)               這個圓柱空間有沒有被佔住
//     support(x, z, r, maxY)               腳下最高、不超過 maxY 的可站面
//     move(ent, dt)                        角色移動與碰撞（含上台階、落地、撞頭）
//     World.rayOBB / World.circleOBB       單一碰撞體的幾何測試

const CELL = 4;
const cellKey = (cx, cz) => cx * 1000 + cz;
const cellOf = (v) => Math.floor(v / CELL);

export class Collider {
  constructor(o) {
    this.x = o.x; this.y = o.y; this.z = o.z;
    this.hx = o.sx / 2; this.hy = o.sy / 2; this.hz = o.sz / 2;
    this.yaw = o.yaw || 0;
    this.c = Math.cos(this.yaw); this.s = Math.sin(this.yaw);
    this.mat = o.mat || 'metal';
    this.solid = o.solid !== false;
    this.bullet = o.bullet || 'block';
    this.sight = o.sight !== false;
    this.surface = o.surface || (this.mat === 'wood' ? 'wood' : 'metal');
    this.tag = o.tag || '';
    this.top = this.y + this.hy;
    this.bottom = this.y - this.hy;
    // 旋轉後在 XZ 平面上的外接矩形
    const ex = Math.abs(this.c) * this.hx + Math.abs(this.s) * this.hz;
    const ez = Math.abs(this.s) * this.hx + Math.abs(this.c) * this.hz;
    this.minX = this.x - ex; this.maxX = this.x + ex;
    this.minZ = this.z - ez; this.maxZ = this.z + ez;
    this.stamp = 0;   // 查詢去重用
  }

  toLocal(wx, wz) {
    const dx = wx - this.x, dz = wz - this.z;
    return [this.c * dx - this.s * dz, this.s * dx + this.c * dz];
  }

  toWorldDir(lx, lz) { return [this.c * lx + this.s * lz, -this.s * lx + this.c * lz]; }
}

const _slab = { t: 0, exit: 0, nx: 0, ny: 0, nz: 0 };
const _o = new Float64Array(3), _d = new Float64Array(3), _h = new Float64Array(3);   // rayOBB 暫存，避免每次配置
const _circle = { nx: 0, nz: 0, pen: 0 };

export class World {
  constructor() {
    this.colliders = [];
    this.grid = new Map();
    this.stamp = 1;
    this._found = [];
  }

  add(o) {
    const c = o instanceof Collider ? o : new Collider(o);
    this.colliders.push(c);
    return c;
  }

  build() {
    this.grid.clear();
    for (const c of this.colliders) {
      for (let cx = cellOf(c.minX); cx <= cellOf(c.maxX); cx++) {
        for (let cz = cellOf(c.minZ); cz <= cellOf(c.maxZ); cz++) {
          const k = cellKey(cx, cz);
          const list = this.grid.get(k);
          if (list) list.push(c); else this.grid.set(k, [c]);
        }
      }
    }
  }

  query(minX, minZ, maxX, maxZ) {
    const found = this._found;
    found.length = 0;
    const mark = ++this.stamp;   // 跨格的碰撞體只收一次
    for (let cx = cellOf(minX); cx <= cellOf(maxX); cx++) {
      for (let cz = cellOf(minZ); cz <= cellOf(maxZ); cz++) {
        const list = this.grid.get(cellKey(cx, cz));
        if (!list) continue;
        for (const c of list) {
          if (c.stamp === mark) continue;
          c.stamp = mark;
          if (c.maxX >= minX && c.minX <= maxX && c.maxZ >= minZ && c.minZ <= maxZ) found.push(c);
        }
      }
    }
    return found;
  }

  // 射線與 OBB：轉到盒子的本地座標後，對三個軸各做一次「進入／離開」區間交集
  // 命中時寫入 res：t 進入距離、exit 離開距離、nx/ny/nz 世界座標的命中面法線
  static rayOBB(c, ox, oy, oz, dx, dy, dz, maxT, res) {
    const rx = ox - c.x, rz = oz - c.z;
    const origin = _o, dir = _d, half = _h;
    origin[0] = c.c * rx - c.s * rz; origin[1] = oy - c.y; origin[2] = c.s * rx + c.c * rz;
    dir[0] = c.c * dx - c.s * dz; dir[1] = dy; dir[2] = c.s * dx + c.c * dz;
    half[0] = c.hx; half[1] = c.hy; half[2] = c.hz;
    let enter = 0, leave = maxT, hitAxis = -1, hitSign = 0;
    for (let a = 0; a < 3; a++) {
      if (Math.abs(dir[a]) < 1e-9) {
        if (origin[a] < -half[a] || origin[a] > half[a]) return false;   // 平行且在外面
        continue;
      }
      const inv = 1 / dir[a];
      let near = (-half[a] - origin[a]) * inv, far = (half[a] - origin[a]) * inv, face = -1;
      if (near > far) { const t = near; near = far; far = t; face = 1; }
      if (near > enter) { enter = near; hitAxis = a; hitSign = face; }
      if (far < leave) leave = far;
      if (enter > leave) return false;
    }
    res.exit = leave;
    if (hitAxis < 0) {   // 起點就在盒子裡
      res.t = 0; res.nx = -dx; res.ny = -dy; res.nz = -dz;
      return true;
    }
    res.t = enter;
    const lx = hitAxis === 0 ? hitSign : 0, lz = hitAxis === 2 ? hitSign : 0;
    res.nx = c.c * lx + c.s * lz;
    res.ny = hitAxis === 1 ? hitSign : 0;
    res.nz = -c.s * lx + c.c * lz;
    return true;
  }

  rayQuery(ox, oz, dx, dz, maxT) {
    const ex = ox + dx * maxT, ez = oz + dz * maxT;
    return this.query(Math.min(ox, ex) - 0.1, Math.min(oz, ez) - 0.1, Math.max(ox, ex) + 0.1, Math.max(oz, ez) + 0.1);
  }

  static passes(c, mode) {
    return (mode === 'bullet' && c.bullet === 'pass') || (mode === 'sight' && !c.sight) || (mode === 'move' && !c.solid);
  }

  raycast(ox, oy, oz, dx, dy, dz, maxT, mode = 'bullet', out = {}) {
    let best = maxT, hit = null;
    for (const c of this.rayQuery(ox, oz, dx, dz, maxT)) {
      if (World.passes(c, mode)) continue;
      if (World.rayOBB(c, ox, oy, oz, dx, dy, dz, best, _slab) && _slab.t < best) {
        best = _slab.t; hit = c;
        out.nx = _slab.nx; out.ny = _slab.ny; out.nz = _slab.nz; out.exit = _slab.exit;
      }
    }
    if (!hit) return null;
    out.t = best; out.collider = hit;
    return out;
  }

  raycastAll(ox, oy, oz, dx, dy, dz, maxT) {
    const hits = [];
    for (const c of this.rayQuery(ox, oz, dx, dz, maxT)) {
      if (c.bullet === 'pass') continue;
      if (World.rayOBB(c, ox, oy, oz, dx, dy, dz, maxT, _slab)) hits.push({ t: _slab.t, exit: _slab.exit, nx: _slab.nx, ny: _slab.ny, nz: _slab.nz, collider: c });
    }
    return hits.sort((a, b) => a.t - b.t);
  }

  // XZ 平面上的圓與 OBB：重疊時寫入 out（把圓推出去的方向 nx/nz 與深度 pen）
  static circleOBB(c, px, pz, r, out) {
    const [lx, lz] = c.toLocal(px, pz);
    const cx = Math.min(c.hx, Math.max(-c.hx, lx)), cz = Math.min(c.hz, Math.max(-c.hz, lz));
    const ox = lx - cx, oz = lz - cz, d2 = ox * ox + oz * oz;
    if (d2 >= r * r) return false;
    let nx, nz, pen;
    if (d2 > 1e-10) {                          // 圓心在盒外：沿最近點方向推
      const d = Math.sqrt(d2);
      nx = ox / d; nz = oz / d; pen = r - d;
    } else {                                   // 圓心在盒內：從最近的那一面推出去
      const gapX = c.hx - Math.abs(lx), gapZ = c.hz - Math.abs(lz);
      if (gapX < gapZ) { nx = lx >= 0 ? 1 : -1; nz = 0; pen = gapX + r; }
      else { nx = 0; nz = lz >= 0 ? 1 : -1; pen = gapZ + r; }
    }
    [out.nx, out.nz] = c.toWorldDir(nx, nz);
    out.pen = pen;
    return true;
  }

  // 垂直圓柱（底 y、高 h、半徑 r）內是否有實心碰撞體
  blocked(px, py, pz, r, h) {
    for (const c of this.query(px - r, pz - r, px + r, pz + r)) {
      if (!c.solid || c.top <= py + 0.001 || c.bottom >= py + h - 0.001) continue;
      if (World.circleOBB(c, px, pz, r, _circle)) return true;
    }
    return false;
  }

  support(px, pz, r, maxY) {
    let bestY = -Infinity, best = null;
    for (const c of this.query(px - r, pz - r, px + r, pz + r)) {
      if (!c.solid || c.top > maxY || c.top <= bestY) continue;
      if (World.circleOBB(c, px, pz, r, _circle)) { bestY = c.top; best = c; }
    }
    return best ? { y: bestY, collider: best } : null;
  }

  // 角色移動。ent：pos（腳底）、vel、radius、height、stepHeight、onGround
  // 每一小步最多走 0.12 m，避免高速穿牆；結束時寫入 landed / landSpeed / ground
  move(ent, dt) {
    const travel = Math.hypot(ent.vel.x, ent.vel.y, ent.vel.z) * dt;
    const steps = Math.max(1, Math.ceil(travel / 0.12));
    const h = dt / steps;
    let landed = false, landSpeed = 0;
    for (let i = 0; i < steps; i++) {
      this.moveHorizontal(ent, h);
      const r = this.moveVertical(ent, h);
      if (r) { landed = true; landSpeed = r; }
    }
    ent.landed = landed;
    ent.landSpeed = landSpeed;
  }

  // 水平：先走，再把重疊的牆推開並削掉撞牆方向的速度；矮於台階高度的直接踩上去
  moveHorizontal(ent, h) {
    const p = ent.pos, r = ent.radius;
    p.x += ent.vel.x * h;
    p.z += ent.vel.z * h;
    for (let pass = 0; pass < 3; pass++) {
      let touched = false;
      for (const c of this.query(p.x - r, p.z - r, p.x + r, p.z + r)) {
        if (!c.solid || c.top <= p.y + 0.001 || c.bottom >= p.y + ent.height - 0.001) continue;
        if (!World.circleOBB(c, p.x, p.z, r, _circle)) continue;
        touched = true;
        const rise = c.top - p.y;
        if (ent.onGround && rise > 0 && rise <= ent.stepHeight && !this.blocked(p.x, c.top, p.z, r * 0.95, ent.height)) {
          p.y = c.top;
          ent.stepped = (ent.stepped || 0) + rise;
          continue;
        }
        const { nx, nz, pen } = _circle;
        p.x += nx * (pen + 0.0005);
        p.z += nz * (pen + 0.0005);
        const into = ent.vel.x * nx + ent.vel.z * nz;
        if (into < 0) { ent.vel.x -= nx * into; ent.vel.z -= nz * into; }
      }
      if (!touched) break;
    }
  }

  // 垂直：下落時找腳下支撐面（在地上時會吸附 0.3 m，下樓梯不會一直騰空）；上升時檢查撞頭
  // 回傳：這一步剛落地時的落地速度，否則 0
  moveVertical(ent, h) {
    const p = ent.pos, r = ent.radius, prevY = p.y;
    p.y += ent.vel.y * h;
    if (ent.vel.y <= 0) {
      const floor = this.support(p.x, p.z, r * 0.92, prevY + 0.001);
      const snap = ent.onGround && ent.vel.y <= 0.01 ? Math.max(0.3, -ent.vel.y * h) : 0;
      if (floor && p.y <= floor.y + snap) {
        const impact = ent.onGround ? 0 : -ent.vel.y;
        p.y = floor.y; ent.vel.y = 0; ent.onGround = true; ent.ground = floor.collider;
        return impact;
      }
      ent.onGround = false; ent.ground = null;
      return 0;
    }
    ent.onGround = false; ent.ground = null;
    const headBefore = prevY + ent.height, headNow = p.y + ent.height;
    for (const c of this.query(p.x - r, p.z - r, p.x + r, p.z + r)) {
      if (!c.solid || c.bottom < headBefore - 0.01 || c.bottom >= headNow) continue;
      if (World.circleOBB(c, p.x, p.z, r * 0.9, _circle)) { p.y = c.bottom - ent.height - 0.001; ent.vel.y = 0; }
    }
    return 0;
  }
}
