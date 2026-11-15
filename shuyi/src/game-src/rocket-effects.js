import * as THREE from 'three';

const TAU = Math.PI * 2;
const rand = (a, b) => a + Math.random() * (b - a);
// All fire, embers and smoke share the existing fixed-size particle pools.
export const rocketEffects = {
  rocketLaunch(p, dir) {
    this.light(p, 16, 0.16, 0xffb35a, 9);
    for (let i = 0; i < 12; i++) {
      const speed = rand(1, 4);
      this.smoke.emit({ x: p.x, y: p.y - 0.12, z: p.z,
        vx: -dir.x * speed + rand(-0.6, 0.6), vy: -dir.y * speed + rand(0.1, 0.8), vz: -dir.z * speed + rand(-0.6, 0.6),
        max: rand(0.3, 0.65), s0: 0.12, s1: 0.75, r: 0.57, g: 0.53, b: 0.48, a0: 0.35, drag: 3 });
    }
  },
  rocketTrail(from, to, dir, rocket) {
    const length = from.distanceTo(to);
    // Sample by travelled distance, so low frame rates do not break the smoke ribbon.
    const spacing = 0.5;
    let offset = spacing - rocket.trailDistance;
    const count = Math.min(24, Math.max(0, Math.floor((length - offset) / spacing) + 1));
    for (let i = 0; i < count; i++, offset += spacing) {
      const p = from.clone().addScaledVector(dir, offset);
      this.smoke.emit({ x: p.x, y: p.y, z: p.z, vx: rand(-0.18, 0.18), vy: rand(0.12, 0.35), vz: rand(-0.18, 0.18),
        max: rand(0.9, 1.5), s0: 0.18, s1: rand(0.7, 1), r: 0.5, g: 0.48, b: 0.44, a0: 0.45, grav: -0.12, drag: 1.5 });
      this.add.emit({ x: p.x, y: p.y, z: p.z, vx: -dir.x * 1.5, vy: -dir.y * 1.5, vz: -dir.z * 1.5,
        max: rand(0.1, 0.2), s0: 0.36, s1: 0.08, r: 2.3, g: 0.8, b: 0.12, a0: 0.8 });
    }
    rocket.trailDistance = (rocket.trailDistance + length) % spacing;
  },
  rocketExplosion(p) {
    this.explosion(p);
    this.light(p, 95, 0.45, 0xffae65, 27);
    // A hot central flash, roiling orange lobes and long streaks of embers.
    this.add.emit({ x: p.x, y: p.y, z: p.z, max: 0.12, s0: 3, s1: 9, r: 3, g: 2.3, b: 1.6, a0: 1 });
    for (let i = 0; i < 32; i++) {
      const az = rand(0, TAU), h = rand(-0.6, 1), rad = Math.sqrt(1 - h * h), speed = rand(5, 16);
      const dx = Math.cos(az) * rad, dz = Math.sin(az) * rad;
      this.add.emit({ x: p.x, y: p.y, z: p.z, vx: dx * speed, vy: h * speed, vz: dz * speed,
        max: rand(0.35, 0.8), s0: rand(0.6, 1.2), s1: 2, r: 2.4, g: rand(0.5, 1.1), b: 0.08, a0: 0.9, drag: 4 });
      for (let j = 0; j < 3; j++) {
        this.add.emit({ x: p.x, y: p.y, z: p.z, vx: dx * speed * 1.9, vy: h * speed * 1.9, vz: dz * speed * 1.9,
          max: 0.65 + j * 0.16, s0: 0.12 - j * 0.025, s1: 0.015, r: 2.3, g: 1.1, b: 0.22, a0: 1, grav: 8, drag: 0.8 + j * 0.3 });
      }
    }
    // Reuse at most eight camera-facing shock fronts; no per-frame mesh allocation.
    if (!this.rocketWaves) {
      const geo = new THREE.PlaneGeometry(2, 2);
      this.rocketWaves = Array.from({ length: 8 }, () => {
        const mat = new THREE.ShaderMaterial({
          uniforms: { opacity: { value: 0 } },
          vertexShader: 'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
          fragmentShader: `varying vec2 vUv; uniform float opacity;
            void main(){vec2 p=(vUv-.5)*2.;float r=length(p);
              float band=smoothstep(.76,.9,r)*(1.-smoothstep(.91,1.,r));
              float wisps=.7+.3*sin(atan(p.y,p.x)*13.+r*24.);
              gl_FragColor=vec4(1.,.66,.32,band*wisps*opacity);
              #include <colorspace_fragment>
            }`,
          transparent: true, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
        const mesh = new THREE.Mesh(geo, mat); mesh.visible = false; this.scene.add(mesh);
        return { mesh, age: 1 };
      });
      this.rocketWaveNext = 0;
    }
    const wave = this.rocketWaves[this.rocketWaveNext++ % this.rocketWaves.length];
    wave.age = 0; wave.mesh.position.copy(p); wave.mesh.scale.setScalar(0.3); wave.mesh.visible = true;
    wave.mesh.material.uniforms.opacity.value = 0.55;
    wave.mesh.lookAt(this.camera.position);
  },
  updateRocketEffects(dt, camera) {
    for (const wave of this.rocketWaves || []) {
      if (!wave.mesh.visible) continue;
      wave.age += dt;
      const t = Math.min(1, wave.age / 0.48);
      wave.mesh.visible = t < 1;
      wave.mesh.scale.setScalar(0.3 + 10 * (1 - Math.pow(1 - t, 2)));
      wave.mesh.material.uniforms.opacity.value = 0.55 * (1 - t) * (1 - t);
      wave.mesh.lookAt(camera.position);
    }
  },
  clearRocketEffects() {
    for (const wave of this.rocketWaves || []) wave.mesh.visible = false;
    this.add.n = 0; this.smoke.n = 0;
  },
};
