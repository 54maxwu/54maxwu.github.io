import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { rocketCombat } from '../game-src/rockets.js';
import { WEAPONS, WeaponState, PRIMARIES } from '../game-src/weapons.js';
import { rocketEffects } from '../game-src/rocket-effects.js';

function game(wall = null, actor = null) {
  const blasts = [];
  return { ...rocketCombat, rockets: [], renderer: { scene: new THREE.Scene() },
    world: { raycast: () => wall }, firstActorHit: () => actor,
    fx: { tracer() {} }, explode: (...args) => blasts.push(args), blasts };
}
test('launcher is a selectable primary and reload consumes one reserve rocket', () => {
  assert.ok(PRIMARIES.includes('rpg'));
  const w = new WeaponState('rpg');
  assert.equal(w.mag, 1); w.mag--; assert.ok(w.canReload()); w.finishReload();
  assert.equal(w.mag, 1); assert.equal(w.reserve, 2);
});
test('rockets fly over time and do not cause instant hitscan damage', () => {
  const g = game(); g.launchRocket({}, new THREE.Vector3(), new THREE.Vector3(0, 0, -1), WEAPONS.rpg);
  assert.equal(g.blasts.length, 0); g.updateRockets(0.1);
  assert.equal(g.rockets[0].mesh.position.z, -4); assert.equal(g.blasts.length, 0);
  g.updateRockets(4); assert.equal(g.rockets.length, 0); assert.equal(g.renderer.scene.children.length, 0);
});
test('a nearby wall stops a rocket in the same update and attributes the blast', () => {
  const g = game({ t: 0.1 }), owner = {};
  g.launchRocket(owner, new THREE.Vector3(), new THREE.Vector3(0, 0, -1), WEAPONS.rpg);
  g.updateRockets(0.1); assert.equal(g.rockets.length, 0);
  assert.equal(g.blasts.length, 1); assert.equal(g.blasts[0][1], owner); assert.equal(g.blasts[0][2], 'rpg');
  assert.ok(g.blasts[0][0].z > -0.1);
});
test('actor contact detonates the projectile and restarting removes active rockets', () => {
  const g = game(null, { t: 2 });
  g.launchRocket({}, new THREE.Vector3(), new THREE.Vector3(0, 0, -1), WEAPONS.rpg);
  g.updateRockets(0.1); assert.equal(g.blasts.length, 1);
  g.launchRocket({}, new THREE.Vector3(), new THREE.Vector3(0, 0, -1), WEAPONS.rpg);
  g.clearRockets(); assert.equal(g.rockets.length, 0); assert.equal(g.renderer.scene.children.length, 0);
});

test('smoke trail density follows distance instead of frame rate and stops at impact', () => {
  function trail(steps) {
    const smoke = [], fire = [], r = { trailDistance: 0 };
    const fx = { smoke: { emit: p => smoke.push(p) }, add: { emit: p => fire.push(p) } };
    const dir = new THREE.Vector3(0, 0, -1);
    for (let i = 0; i < steps; i++) {
      rocketEffects.rocketTrail.call(fx, new THREE.Vector3(0, 0, -i * 12 / steps),
        new THREE.Vector3(0, 0, -(i + 1) * 12 / steps), dir, r);
    }
    assert.ok(smoke.every(p => p.z >= -12 && Number.isFinite(p.z)));
    assert.equal(fire.length, smoke.length);
    return smoke.length;
  }
  assert.equal(trail(24), 24);
  assert.equal(trail(96), 24);
});
