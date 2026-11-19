import test from 'node:test';
import assert from 'node:assert/strict';
import {Actor} from '../game-src/actor.js';
import {WeaponState} from '../game-src/weapons.js';

test('switching away from a cycling sniper cancels automatic scope and grenade timers',()=>{
 const a=Object.create(Actor.prototype);
 Object.assign(a,{slot:0,inv:[new WeaponState('awm'),new WeaponState('deagle')],
   reScope:2,scoped:1,scopeReady:true,autoSwitchAt:12,grenadePrimed:true,
   soldier:{setWeapon(){}},game:{onSwitch(){}}});
 a.weapon.reloadUntil=20;a.switchTo(1,3);
 assert.equal(a.reScope,0);assert.equal(a.scoped,0);assert.equal(a.autoSwitchAt,0);
 assert.equal(a.grenadePrimed,false);assert.equal(a.inv[0].reloadUntil,0);
});

test('death during movement cannot execute a queued weapon action',()=>{
 const a=Object.create(Actor.prototype);a.alive=false;
 a.switchTo=()=>assert.fail('dead actor switched weapon');
 a.weaponUpdate(.01,{fire:true,firePressed:true,sw:1});
});

test('knife attacks and grenade release remove spawn protection',()=>{
 let swings=0,throws=0;
 const a={protectT:3,game:{melee(){swings++;},throwGrenade(){throws++;}},
   grenadePrimed:true,grenadeThrowing:true,grenadeReleaseT:.01};
 Actor.prototype.useKnife.call(a,{fire:true},new WeaponState('knife'),1);
 assert.equal(a.protectT,0);assert.equal(swings,1);
 a.protectT=3;Actor.prototype.useGrenade.call(a,.01,{},new WeaponState('he'),1);
 assert.equal(a.protectT,0);assert.equal(throws,1);
});
