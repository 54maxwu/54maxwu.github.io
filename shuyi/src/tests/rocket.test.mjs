import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { rocketCombat } from '../game-src/rockets.js';
import { WEAPONS, WeaponState, PRIMARIES } from '../game-src/weapons.js';

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
