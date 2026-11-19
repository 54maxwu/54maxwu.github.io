import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {ReplayBuffer} from '../game-src/replay-buffer.js';
import {setCameraFov} from '../game-src/camera-fov.js';

test('ring reuses poses, preserves chronological order and isolates active clips',()=>{
  const root=new THREE.Group(),bone=new THREE.Bone();bone.name='head';
  const actor={id:1,soldier:{root,bones:[bone]}},buffer=new ReplayBuffer(2);
  const first=buffer.record(1,[actor]),values=first.actors.get(1).bones.head;
  root.position.x=2;buffer.record(2,[actor]);
  const clip=buffer.snapshot();
  root.position.x=3;bone.position.y=5;
  assert.equal(buffer.record(3,[actor]),first);
  assert.equal(first.actors.get(1).bones.head,values);
  assert.deepEqual(buffer.snapshot().map(f=>f.time),[2,3]);
  assert.equal(clip[0].actors.get(1).pos[0],0);
  assert.equal(clip[0].actors.get(1).bones.head[1],0);
  buffer.record(4,[]);assert.equal(buffer.snapshot()[1].actors.size,0);
  buffer.reset();assert.deepEqual(buffer.snapshot(),[]);
});

test('projection updates only for changed FOV and settles exactly at target',()=>{
  let updates=0;const camera={fov:78,updateProjectionMatrix(){updates++;}};
  setCameraFov(camera,78);assert.equal(updates,0);
  setCameraFov(camera,40);assert.equal(updates,1);
  setCameraFov(camera,77.99999,78);assert.equal(camera.fov,78);
  setCameraFov(camera,78);assert.equal(updates,2);
});
