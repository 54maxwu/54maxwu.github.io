import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {Actor} from '../game-src/actor.js';

test('respawn clears motion, damage, scope and cooldown state from the previous life',()=>{
  const actor={pos:new THREE.Vector3(),vel:new THREE.Vector3(1,2,3),
    soldier:{reset(){},root:new THREE.Group()},giveLoadout(){},
    speed:5,walk:true,aimPunch:1,jumpCD:2,slideCD:2,mantleCD:2,stepDist:2,
    scopeT:2,reScope:2,landed:true,landSpeed:20,lastAttacker:{},lastHurt:100,radarT:3};
  Actor.prototype.spawn.call(actor,{x:1,y:2,z:3,yaw:1});
  for(const key of ['speed','aimPunch','jumpCD','slideCD','mantleCD','stepDist','scopeT','reScope','landSpeed','radarT'])assert.equal(actor[key],0,key);
  assert.equal(actor.lastAttacker,null);assert.equal(actor.walk,false);assert.equal(actor.landed,false);
  assert.equal(actor.alive,true);assert.equal(actor.hp,100);assert.equal(actor.protectT,3);
  assert.equal(actor.vel.length(),0);
});
