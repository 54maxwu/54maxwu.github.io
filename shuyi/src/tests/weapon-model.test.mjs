import test from 'node:test';import assert from 'node:assert/strict';import * as THREE from 'three';
import {restoreWeaponParts} from '../game-src/viewmodel.js';
test('interrupting reload and re-equipping never changes the original warhead position',()=>{
 const gun=new THREE.Group(),round=new THREE.Object3D();round.name='mag';round.position.set(0,.075,-.7);round.rotation.y=Math.PI;gun.add(round);
 restoreWeaponParts(gun);
 for(let i=0;i<10;i++){round.position.set(0,-.1,-1.15);round.rotation.x=.5;round.visible=false;restoreWeaponParts(gun);
 assert.deepEqual(round.position.toArray(),[0,.075,-.7]);assert.equal(round.rotation.x,0);assert.equal(round.rotation.y,Math.PI);assert.equal(round.visible,true);}
});
