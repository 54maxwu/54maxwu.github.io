import * as THREE from 'three';

// 校園靜態幾何的空間分割：每個材質網格建一棵三角形 BVH。
// - 三角形依 BVH 深度優先順序排列，任一子樹都是索引陣列中的一段連續區間；
//   整棵子樹在視錐內時一次收下，不再逐格判斷。
// - 每個材質仍只有一次繪製呼叫；頂點不重新編號，破壞／還原沿用原始頂點範圍。
// - 會移動的家具三角形放在最後一段，一律繪製。
// - 陰影另用一份索引：節點包圍盒沿陽光方向延伸到地面，與畫面視錐不相交、
//   或不在陰影攝影機範圍內的就不畫進陰影圖。

const SKIP = ['foliage', 'flower', 'drain', 'lattice', 'waterRipple', 'shade'];
const LEAF_TRIS = 256;      // 三角形少於此數即為葉節點
const MARGIN_ANGLE = THREE.MathUtils.degToRad(15);  // 選取視錐的放寬角度
const MARGIN_DIST = 2;      // 選取視錐的平面外推距離（公尺）

// 以重心中位數切分建 BVH，回傳節點陣列（扁平 Float32/Int32）與重排後的三角形順序。
export function buildTriangleBVH(position, triangles, leafSize = 8) {
  const n = triangles.length, tmin = new Float32Array(n * 3), tmax = new Float32Array(n * 3), cen = new Float32Array(n * 3);
  for (let k = 0; k < n; k++) {
    const t = triangles[k];
    for (let a = 0; a < 3; a++) {
      const g = a === 0 ? 'getX' : a === 1 ? 'getY' : 'getZ';
      const v0 = position[g](t * 3), v1 = position[g](t * 3 + 1), v2 = position[g](t * 3 + 2);
      tmin[k * 3 + a] = Math.min(v0, v1, v2); tmax[k * 3 + a] = Math.max(v0, v1, v2); cen[k * 3 + a] = (v0 + v1 + v2) / 3;
    }
  }
  // order[i] 是 triangles 的區域編號；建樹時就地分割
  const order = new Uint32Array(n); for (let i = 0; i < n; i++) order[i] = i;
  const box = [], left = [], right = [], start = [], count = [];
  const stack = n ? [[0, n, -1, 0]] : [];
  while (stack.length) {
    const [s, e, parent, side] = stack.pop(), id = start.length;
    if (parent >= 0) (side ? right : left)[parent] = id;
    let x0 = Infinity, y0 = Infinity, z0 = Infinity, x1 = -Infinity, y1 = -Infinity, z1 = -Infinity;
    let cx0 = Infinity, cy0 = Infinity, cz0 = Infinity, cx1 = -Infinity, cy1 = -Infinity, cz1 = -Infinity;
    for (let i = s; i < e; i++) {
      const k = order[i] * 3;
      if (tmin[k] < x0) x0 = tmin[k]; if (tmin[k + 1] < y0) y0 = tmin[k + 1]; if (tmin[k + 2] < z0) z0 = tmin[k + 2];
      if (tmax[k] > x1) x1 = tmax[k]; if (tmax[k + 1] > y1) y1 = tmax[k + 1]; if (tmax[k + 2] > z1) z1 = tmax[k + 2];
      if (cen[k] < cx0) cx0 = cen[k]; if (cen[k + 1] < cy0) cy0 = cen[k + 1]; if (cen[k + 2] < cz0) cz0 = cen[k + 2];
      if (cen[k] > cx1) cx1 = cen[k]; if (cen[k + 1] > cy1) cy1 = cen[k + 1]; if (cen[k + 2] > cz1) cz1 = cen[k + 2];
    }
    box.push(x0, y0, z0, x1, y1, z1); start.push(s); count.push(e - s); left.push(-1); right.push(-1);
    const ex = cx1 - cx0, ey = cy1 - cy0, ez = cz1 - cz0, extent = Math.max(x1 - x0, y1 - y0, z1 - z0);
    if (e - s <= LEAF_TRIS || extent <= leafSize || Math.max(ex, ey, ez) < 1e-4) continue;
    const axis = ex >= ey && ex >= ez ? 0 : ey >= ez ? 1 : 2, mid = (s + e) >> 1;
    selectNth(order, cen, axis, s, e - 1, mid);
    // 先推右再推左：彈出順序為左子樹優先，維持深度優先的連續區間
    stack.push([mid, e, id, 1], [s, mid, id, 0]);
  }
  const triOrder = new Uint32Array(n); for (let i = 0; i < n; i++) triOrder[i] = triangles[order[i]];
  return { box: new Float32Array(box), left: Int32Array.from(left), right: Int32Array.from(right), start: Uint32Array.from(start), count: Uint32Array.from(count), triOrder };
}

// 快速選擇：讓 order[s..e] 依 cen[axis] 分割，使第 nth 個就定位
function selectNth(order, cen, axis, s, e, nth) {
  while (e > s) {
    const pivot = cen[order[(s + e) >> 1] * 3 + axis];
    let i = s, j = e;
    while (i <= j) {
      while (cen[order[i] * 3 + axis] < pivot) i++;
      while (cen[order[j] * 3 + axis] > pivot) j--;
      if (i <= j) { const t = order[i]; order[i] = order[j]; order[j] = t; i++; j--; }
    }
    if (nth <= j) e = j; else if (nth >= i) s = i; else return;
  }
}

// Preserve one draw per material and destruction's canonical vertex offsets.
export function spatialBatches(meshes, movableRanges = new Map(), leafSize = 8) {
  for (const source of meshes) {
    const geo = source.geometry, p = geo?.attributes.position;
    if (source.isInstancedMesh || geo.index || !p || SKIP.includes(source.name.replace('real:', ''))) continue;
    const triCount = Math.floor(p.count / 3), moving = new Uint8Array(triCount);
    for (const r of movableRanges.get(source.name.replace('real:', '')) || [])
      for (let t = Math.floor(r.start / 3); t < Math.ceil((r.start + r.count) / 3) && t < triCount; t++) moving[t] = 1;
    const still = [], move = [];
    for (let t = 0; t < triCount; t++) (moving[t] ? move : still).push(t);
    const bvh = buildTriangleBVH(p, still, leafSize);
    const full = new Uint32Array(p.count);
    let w = 0;
    for (const t of bvh.triOrder) { full[w++] = t * 3; full[w++] = t * 3 + 1; full[w++] = t * 3 + 2; }
    for (const t of move) { full[w++] = t * 3; full[w++] = t * 3 + 1; full[w++] = t * 3 + 2; }
    for (let i = triCount * 3; i < p.count; i++) full[w++] = i;   // 不足一個三角形的殘餘頂點
    const movingRange = [still.length * 3, full.length - still.length * 3];
    const dynamic = () => new THREE.BufferAttribute(full.slice(), 1).setUsage(THREE.DynamicDrawUsage);
    const index = dynamic(), shadowIndex = dynamic();
    geo.setIndex(index);
    // cells：葉節點清單，供統計與測試；moving 為一律繪製的最後一段
    const cells = [];
    for (let i = 0; i < bvh.count.length; i++) if (bvh.left[i] < 0) cells.push({ start: bvh.start[i] * 3, count: bvh.count[i] * 3, moving: false });
    if (move.length) cells.push({ start: movingRange[0], count: movingRange[1], moving: true });
    geo.userData.spatial = { bvh, cells, full, index, shadowIndex, movingRange, selectionList: null, shadowSelectionList: null, count: full.length, shadowCount: full.length };
    source.frustumCulled = false;
    source.onBeforeShadow = () => { const s = geo.userData.spatial; geo.setIndex(s.shadowIndex); geo.setDrawRange(0, s.shadowCount); };
    source.onAfterShadow = () => { const s = geo.userData.spatial; geo.setIndex(s.index); geo.setDrawRange(0, s.count); };
  }
  return meshes;
}

const _corners = Array.from({ length: 8 }, () => new THREE.Vector3());
const _m = new THREE.Matrix4(), _dir = new THREE.Vector3(), _target = new THREE.Vector3();

export class SpatialVisibility {
  constructor(meshes) {
    this.layers = meshes.filter(m => m.geometry.userData.spatial);
    this.frustum = new THREE.Frustum(); this.shadowFrustum = new THREE.Frustum();
    this.projection = new THREE.Matrix4(); this.valid = false; this.sun = new THREE.Vector3(); this.stats = { reselections: 0 };
    this.ground = Infinity;
    for (const m of this.layers) { const b = m.geometry.userData.spatial.bvh.box; if (b.length) this.ground = Math.min(this.ground, b[1]); }
    if (!Number.isFinite(this.ground)) this.ground = 0;
  }

  // shadowLight：投射陰影的平行光（可省略：陰影改畫完整索引）
  update(camera, shadows = false, shadowLight = null) {
    camera.updateMatrixWorld();
    const light = shadows && shadowLight?.isDirectionalLight && shadowLight.castShadow ? shadowLight : null;
    if (light) { light.updateMatrixWorld(); light.target.updateMatrixWorld(); _dir.setFromMatrixPosition(light.matrixWorld).sub(_target.setFromMatrixPosition(light.target.matrixWorld)).normalize(); }
    const sunChanged = light ? this.sun.distanceToSquared(_dir) > 1e-6 : this.sun.lengthSq() > 0;
    if (this.valid && shadows === this.shadows && !sunChanged && this.contains(camera)) return false;
    this.shadows = shadows; this.sun.copy(light ? _dir : _dir.set(0, 0, 0));
    this.select(camera, light);
    return true;
  }

  // 目前真實視錐的 8 個角都還在選取視錐內，代表上次選取結果仍完整涵蓋畫面
  contains(camera) {
    _m.multiplyMatrices(camera.matrixWorld, camera.projectionMatrixInverse);
    let i = 0;
    for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) _corners[i++].set(x, y, z).applyMatrix4(_m);
    for (const plane of this.frustum.planes) for (const c of _corners) if (plane.distanceToPoint(c) < 0) return false;
    return true;
  }

  select(camera, light) {
    this.stats.reselections++;
    // 放寬視角後的投影：之後鏡頭小幅轉動、移動都不需要重新上傳索引
    const near = camera.near, far = camera.far;
    const halfV = Math.atan(Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) / (camera.zoom || 1));
    const halfH = Math.atan(Math.tan(halfV) * camera.aspect);
    const tv = Math.tan(Math.min(halfV + MARGIN_ANGLE, 1.48)), th = Math.tan(Math.min(halfH + MARGIN_ANGLE, 1.48));
    this.projection.makePerspective(-near * th, near * th, near * tv, -near * tv, near, far);
    this.frustum.setFromProjectionMatrix(_m.multiplyMatrices(this.projection, camera.matrixWorldInverse));
    for (const plane of this.frustum.planes) plane.constant += MARGIN_DIST;
    // 不使用遠平面：鏡頭一轉，遠平面的角就會落到舊遠平面外，造成每幀重選。
    // 遊戲攝影機的 far 為 60 km，原本就沒有遠距剔除效果。
    this.frustum.planes[4].normal.set(0, 0, 0); this.frustum.planes[4].constant = Infinity;
    this.valid = true;

    let sweep = null;
    if (light && this.sun.y > 0.05) {
      light.shadow.updateMatrices(light);
      const sc = light.shadow.camera;
      this.shadowFrustum.setFromProjectionMatrix(_m.multiplyMatrices(sc.projectionMatrix, sc.matrixWorldInverse));
      sweep = { x: -this.sun.x / this.sun.y, z: -this.sun.z / this.sun.y, ground: this.ground };
    }
    for (const mesh of this.layers) {
      const s = mesh.geometry.userData.spatial;
      const ranges = cull(s.bvh, this.frustum.planes, null, null);
      const shadowRanges = sweep ? cull(s.bvh, this.frustum.planes, sweep, this.shadowFrustum.planes) : null;
      s.count = writeRanges(s, s.index, ranges, 'selection');
      s.shadowCount = writeRanges(s, s.shadowIndex, shadowRanges, 'shadowSelection');
      mesh.geometry.setDrawRange(0, s.count);
    }
  }
}

// 階層式視錐測試；planeMask 記錄仍需檢查的平面，整棵子樹在內時直接收整段。
// sweep 存在時，節點盒沿光線延伸到地面後再與 planes 比較，並以 extra（陰影攝影機）檢查原盒。
export function cull(bvh, planes, sweep, extra) {
  const out = [];
  if (!bvh.start.length) return out;
  const all = (1 << planes.length) - 1, allExtra = extra ? (1 << extra.length) - 1 : 0;
  const stack = [0, all, allExtra];
  while (stack.length) {
    const extraMask0 = stack.pop(), mask0 = stack.pop(), id = stack.pop(), b = id * 6;
    let x0 = bvh.box[b], y0 = bvh.box[b + 1], z0 = bvh.box[b + 2], x1 = bvh.box[b + 3], y1 = bvh.box[b + 4], z1 = bvh.box[b + 5];
    let extraMask = extraMask0, outside = false;
    for (let i = 0; extraMask && i < extra.length; i++) {
      if (!(extraMask & (1 << i))) continue;
      const r = boxPlane(extra[i], x0, y0, z0, x1, y1, z1);
      if (r < 0) { outside = true; break; }
      if (r > 0) extraMask &= ~(1 << i);
    }
    if (outside) continue;
    if (sweep) {
      const h = Math.max(0, y1 - sweep.ground), ox = sweep.x * h, oz = sweep.z * h;
      if (ox < 0) x0 += ox; else x1 += ox;
      if (oz < 0) z0 += oz; else z1 += oz;
      y0 = Math.min(y0, sweep.ground);
    }
    let mask = mask0;
    for (let i = 0; mask && i < planes.length; i++) {
      if (!(mask & (1 << i))) continue;
      const r = boxPlane(planes[i], x0, y0, z0, x1, y1, z1);
      if (r < 0) { outside = true; break; }
      if (r > 0) mask &= ~(1 << i);
    }
    if (outside) continue;
    const l = bvh.left[id];
    if ((!mask && !extraMask) || l < 0) {
      const s = bvh.start[id] * 3, c = bvh.count[id] * 3, last = out.length - 1;
      if (last >= 0 && out[last][0] + out[last][1] === s) out[last][1] += c; else out.push([s, c]);
      continue;
    }
    // 右子先推、左子後推：左子先處理，輸出區間依序遞增並可合併
    stack.push(bvh.right[id], mask, extraMask, l, mask, extraMask);
  }
  return out;
}

// 1：整個盒子在平面內側；-1：完全在外側；0：跨越
function boxPlane(plane, x0, y0, z0, x1, y1, z1) {
  const n = plane.normal, d = plane.constant;
  const max = n.x * (n.x > 0 ? x1 : x0) + n.y * (n.y > 0 ? y1 : y0) + n.z * (n.z > 0 ? z1 : z0) + d;
  if (max < 0) return -1;
  const min = n.x * (n.x > 0 ? x0 : x1) + n.y * (n.y > 0 ? y0 : y1) + n.z * (n.z > 0 ? z0 : z1) + d;
  return min >= 0 ? 1 : 0;
}

// ranges 為 null 表示畫完整索引；選取結果與上次相同時不重新上傳
function writeRanges(s, attribute, ranges, key) {
  const moving = s.movingRange[1] ? [s.movingRange] : [];
  const list = ranges ? ranges.concat(moving) : [[0, s.full.length]];
  const previous = s[key + 'List'];
  let count = 0;
  for (const [, c] of list) count += c;
  // 與上次相同的前段（依 BVH 順序排列）在索引緩衝中的內容不變，只重寫並上傳之後的部分
  let same = 0, offset = 0;
  if (previous) {
    while (same < list.length && same < previous.length && list[same][0] === previous[same][0] && list[same][1] === previous[same][1]) offset += list[same++][1];
    if (same === list.length && same === previous.length) return count;
    if (same < list.length && same < previous.length && list[same][0] === previous[same][0]) offset += Math.min(list[same][1], previous[same][1]);
  }
  s[key + 'List'] = list;
  let n = 0;
  for (const [start, c] of list) {
    const end = n + c;
    if (end > offset) { const skip = Math.max(0, offset - n); attribute.array.set(s.full.subarray(start + skip, start + c), n + skip); }
    n = end;
  }
  // 尚未上傳的範圍要保留：同一幀若更新兩次，前一次的變更仍需送出（three 上傳後自行清除）
  // 畫面外（繪製數為 0）的網格不會上傳，待上傳範圍會累積；合併成一段避免重複上傳
  if (n > offset) {
    let lo = offset, hi = n;
    for (const r of attribute.updateRanges) { lo = Math.min(lo, r.start); hi = Math.max(hi, r.start + r.count); }
    attribute.clearUpdateRanges(); attribute.addUpdateRange(lo, hi - lo); attribute.needsUpdate = true;
  }
  return n;
}
