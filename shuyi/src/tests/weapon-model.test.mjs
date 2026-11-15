import test from 'node:test';import assert from 'node:assert/strict';import * as THREE from 'three';
import {restoreWeaponParts} from '../game-src/viewmodel.js';
import {WEAPONS} from '../game-src/weapons.js';
import {replayTime} from '../game-src/replay-timing.js';
test('interrupting reload and re-equipping never changes the original warhead position',()=>{
 const gun=new THREE.Group(),round=new THREE.Object3D();round.name='mag';round.position.set(0,.075,-.7);round.rotation.y=Math.PI;gun.add(round);
 restoreWeaponParts(gun);
 for(let i=0;i<10;i++){round.position.set(0,-.1,-1.15);round.rotation.x=.5;round.visible=false;restoreWeaponParts(gun);
 assert.deepEqual(round.position.toArray(),[0,.075,-.7]);assert.equal(round.rotation.x,0);assert.equal(round.rotation.y,Math.PI);assert.equal(round.visible,true);}
});
test('lighter held weapons move faster than heavier weapons',()=>{
 const speeds=['knife','deagle','mp5','m4a1','ak47','m870','awm','rpg'].map(id=>WEAPONS[id].speed);
 for(let i=1;i<speeds.length;i++)assert.ok(speeds[i-1]>speeds[i]);
});
test('replay slows the fatal interval and holds the impact for a final close-up',()=>{
 assert.ok(Math.abs((replayTime(4)-replayTime(3))-.075)<1e-6);
 assert.ok(replayTime(.55)<0);assert.equal(replayTime(7),0);assert.equal(replayTime(9),0);
});
