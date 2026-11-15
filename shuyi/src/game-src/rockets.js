import * as THREE from 'three';

// Shared geometry/materials: restarting a match only removes projectile instances.
let bodyGeometry, bodyMaterial, flameGeometry, flameMaterial, coreMaterial;
function rocketMesh() {
  bodyGeometry ||= new THREE.ConeGeometry(0.055, 0.42, 8).rotateX(-Math.PI / 2);
  bodyMaterial ||= new THREE.MeshStandardMaterial({ color: 0x687440, metalness: 0.5, roughness: 0.5 });
  flameGeometry ||= new THREE.ConeGeometry(0.11, 0.85, 12).rotateX(Math.PI / 2).translate(0, 0, 0.58);
  flameMaterial ||= new THREE.MeshBasicMaterial({ color: 0xff661b, transparent: true, opacity: 0.65, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
  coreMaterial ||= new THREE.MeshBasicMaterial({ color: 0xfff1bc, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
  const mesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
  mesh.add(new THREE.Mesh(flameGeometry, flameMaterial));
  const core = new THREE.Mesh(flameGeometry, coreMaterial);
  core.scale.set(0.45, 0.45, 0.7); mesh.add(core);
  return mesh;
}

export const rocketCombat = {
  launchRocket(owner, eye, dir, def) {
    const mesh = rocketMesh();
    mesh.position.copy(eye);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), dir);
    this.renderer.scene.add(mesh);
    this.fx.rocketLaunch?.(eye, dir);
    // Start at the eye so a nearby wall cannot be skipped by the spawn offset.
    this.rockets.push({ mesh, owner, dir: dir.clone(), def, distance: 0, trailDistance: 0 });
  },
  updateRockets(dt) {
    this.rockets = this.rockets.filter(r => {
      const p = r.mesh.position, d = r.dir;
      const length = Math.min(r.def.projectileSpeed * dt, r.def.range - r.distance);
      const wall = this.world.raycast(p.x, p.y, p.z, d.x, d.y, d.z, length, 'move');
      const actor = this.firstActorHit(r.owner, p, d, 0, wall ? wall.t : length);
      const hit = actor || wall;
      const old = p.clone();
      p.addScaledVector(d, hit ? Math.max(0, hit.t - 0.08) : length);
      r.distance += length;
      this.fx.rocketTrail?.(old, p, d, r);
      const flicker = 0.85 + Math.random() * 0.3;
      r.mesh.children[0].scale.set(flicker, flicker, flicker);
      if (hit) this.explode(p.clone(), r.owner, r.def.id);
      if (hit || r.distance >= r.def.range) {
        this.renderer.scene.remove(r.mesh);
        return false;
      }
      return true;
    });
  },
  clearRockets() {
    for (const r of this.rockets) this.renderer.scene.remove(r.mesh);
    this.rockets = [];
  },
};
