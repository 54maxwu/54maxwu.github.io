import * as THREE from 'three';

// Clip triangles into local cells, retaining UVs and normals across the cuts.
// Unlike centroid grouping, this also splits a roof made from a few huge triangles.
export function fractureGeometry(source, size = 2.4) {
  const g = source.index ? source.toNonIndexed() : source;
  g.computeBoundingBox();
  const bounds = g.boundingBox, P = g.attributes.position, N = g.attributes.normal, U = g.attributes.uv;
  const cells = new Map();
  const clip = (poly, axis, edge, sign) => {
    const out = [];
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length];
      const da = sign * (a[axis] - edge), db = sign * (b[axis] - edge);
      if (da >= -1e-7) out.push(a);
      if ((da < 0) !== (db < 0)) {
        const t = da / (da - db); out.push(a.map((v, j) => v + (b[j] - v) * t));
      }
    }
    return out;
  };
  for (let i = 0; i < P.count; i += 3) {
    const tri = [0, 1, 2].map(j => { const n = i + j; return [P.getX(n), P.getY(n), P.getZ(n),
      N?.getX(n) || 0, N?.getY(n) || 0, N?.getZ(n) || 0, U?.getX(n) || 0, U?.getY(n) || 0]; });
    const xs = tri.map(v => v[0]), zs = tri.map(v => v[2]);
    for (let x = Math.floor(Math.min(...xs) / size); x <= Math.floor(Math.max(...xs) / size); x++)
      for (let z = Math.floor(Math.min(...zs) / size); z <= Math.floor(Math.max(...zs) / size); z++) {
        let poly = tri;
        for (const [axis, edge, sign] of [[0,x*size,1],[0,(x+1)*size,-1],[2,z*size,1],[2,(z+1)*size,-1]]) poly = clip(poly,axis,edge,sign);
        if (poly.length < 3) continue;
        const key = `${x},${z}`, data = cells.get(key) || [];
        for (let j = 1; j < poly.length - 1; j++) data.push(poly[0], poly[j], poly[j+1]);
        cells.set(key, data);
      }
  }
  return [...cells.values()].map(data => {
    const out = new THREE.BufferGeometry();
    out.setAttribute('position', new THREE.Float32BufferAttribute(data.flatMap(v => v.slice(0,3)),3));
    out.setAttribute('normal', new THREE.Float32BufferAttribute(data.flatMap(v => v.slice(3,6)),3));
    out.setAttribute('uv', new THREE.Float32BufferAttribute(data.flatMap(v => v.slice(6,8)),2));
    out.computeBoundingBox(); return out;
  }).filter(g => g.boundingBox.max.distanceTo(g.boundingBox.min) > 0.01);
}
