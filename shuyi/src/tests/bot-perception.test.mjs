import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {Bot,DIFF} from '../game-src/bots.js';

function bot(blocked=false){
  const b=Object.create(Bot.prototype);
  Object.assign(b,{pos:new THREE.Vector3(),yaw:0,pitch:0,alive:true,visible:false,skill:DIFF.normal,game:{time:10,world:{raycast:()=>blocked?{}:null}},target:null,lastSeen:null,lastSeenT:-99,heard:null,heardT:-99,errYaw:0,errPitch:0,reactUntil:0});
  b.eye=out=>out.copy(b.pos).add(new THREE.Vector3(0,1.6,0));return b;
}
function foe(x,y,z){const pos=new THREE.Vector3(x,y,z);return{pos,vel:new THREE.Vector3(),soldier:{headWorld:out=>out.copy(pos).add(new THREE.Vector3(0,1.65,0)),chestWorld:out=>out.copy(pos).add(new THREE.Vector3(0,1.1,0))}}}

test('nearby enemies behind or beside a bot are not automatically visible',()=>{
  for(const skill of Object.values(DIFF)){
    const b=bot();b.skill=skill;
    assert.equal(b.canSee(foe(0,0,2)),false);
    assert.equal(b.canSee(foe(1.5,0,0)),false);
    assert.equal(b.canSee(foe(0,0,-2)),true);
    b.yaw=Math.PI;assert.equal(b.canSee(foe(0,0,2)),true);
  }
});
test('walls and vertical field of view limit vision',()=>{
  assert.equal(bot(true).canSee(foe(0,0,-5)),false);
  assert.equal(bot().canSee(foe(0,9,-2)),false);
  const b=bot();b.pitch=1.3;assert.equal(b.canSee(foe(0,9,-2)),true);
});
test('being hit creates a delayed directional clue without identifying the attacker',()=>{
  const b=bot();b.onDamaged(foe(0,0,20));
  assert.equal(b.target,null);assert.equal(b.lastSeen,null);
  assert.ok(b.heard);assert.ok(b.heardReady>b.game.time);
  assert.equal(b.lookYaw,undefined);
  assert.ok(b.heard.distanceTo(b.pos)<=9.01);
});
test('hearing has position uncertainty, delay, and wall attenuation',()=>{
  const b=bot(),source=new THREE.Vector3(0,0,10);b.hear(source,true);
  assert.ok(b.heard);assert.notDeepEqual(b.heard.toArray(),source.toArray());assert.ok(b.heardReady>10);
  assert.equal(b.target,null);assert.equal(b.lastSeen,null);
  const quiet=bot(true);quiet.hear(new THREE.Vector3(0,0,8),false);assert.equal(quiet.heard,null);
  const far=bot(true);far.hear(new THREE.Vector3(0,0,30),true);assert.equal(far.heard,null);
});
test('aim follows a visual snapshot rather than reading the live target every frame',()=>{
  const b=bot();Object.assign(b,{observedAim:new THREE.Vector3(0,1.1,-10),observedVelocity:new THREE.Vector3(),lastSeenT:10,reactUntil:20,readyAt:0,strafeT:1,strafeDir:0,errYaw:0,errPitch:0,punchP:0,id:1});
  b.target={get pos(){throw Error('live position leak')},soldier:{headWorld(){throw Error('live head leak')},chestWorld(){throw Error('live chest leak')}}};
  Object.defineProperty(b,'weapon',{value:{def:{type:'rifle'}}});b.steer=()=>null;
  const act={};b.fight(act,.01,10.01);assert.ok(Number.isFinite(act.yaw));assert.ok(Number.isFinite(act.pitch));
});
test('a stale visible flag cannot authorize firing through lost line of sight',()=>{
  const b=bot(true);Object.assign(b,{observedAim:new THREE.Vector3(0,1.6,-10),observedVelocity:new THREE.Vector3(),lastSeenT:10,readyAt:0,strafeT:1,strafeDir:0,punchP:0,id:1,target:foe(0,0,-10)});
  Object.defineProperty(b,'weapon',{value:{def:{type:'rifle'}}});b.steer=()=>null;
  b.pullTrigger=()=>assert.fail('fired without line of sight');b.fight({},.01,10.01);
});
