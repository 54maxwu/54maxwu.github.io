import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {StaticSet} from '../game-src/effects.js';
import {World} from '../game-src/physics.js';

test('cosmetic rubble is bounded, expires, and distant detail returns when approached', () => {
  const set = new StaticSet(new THREE.Scene(), new THREE.BoxGeometry(), new THREE.MeshBasicMaterial(), 2, false, 45);
  const camera = new THREE.PerspectiveCamera();
  const item = x => ({p:new THREE.Vector3(x,0,0), q:new THREE.Quaternion(), s:new THREE.Vector3(1,1,1)});
  set.add(item(0)); set.add(item(100)); set.add(item(101));
  set.flush(camera, .3);
  assert.equal(set.items.length, 2); assert.equal(set.mesh.count, 0);
  camera.position.x = 100; set.flush(camera, .3);
  assert.equal(set.mesh.count, 2);
  set.flush(camera, 45); assert.equal(set.items.length, 0); assert.equal(set.mesh.count, 0);
});

test('repeated temporary collider removal restores world and grid without removing permanent cover', () => {
  const world = new World(), permanent = world.add({x:0,y:1,z:0,sx:2,sy:2,sz:2});
  world.build(); const size = world.grid.size;
  for (let i=0;i<100;i++) {
    const tree = world.add({x:10,y:1,z:0,sx:12,sy:1,sz:1});
    world.build(); world.remove(tree); world.remove(tree);
    assert.equal(world.colliders.length, 1); assert.equal(world.grid.size, size);
    assert.ok([...world.grid.values()].every(list => list.every(c => c === permanent)));
  }
  assert.equal(world.support(0,0,.1,3).collider, permanent);
});
