import test from 'node:test';
import assert from 'node:assert/strict';
import {Player} from '../game-src/player.js';

function player(){
  const p=Object.create(Player.prototype);
  Object.assign(p,{slot:0,lastSlot:1,pressed:new Set(),mouse:{wheel:0},game:{hud:{toast(){}}},inv:[{def:{type:'rifle'}},{def:{type:'pistol'}},{def:{type:'melee'}},{def:{type:'grenade'},mag:1}]});
  return p;
}
test('the mobile weapon cycle includes the grenade and wraps around',()=>{
  const p=player(),slots=[];
  for(let i=0;i<4;i++){p.pressed.add('CycleWeapon');p.slot=p.pickSlot();slots.push(p.slot)}
  assert.deepEqual(slots,[1,2,3,0]);
});
test('an empty grenade is skipped without skipping the knife',()=>{
  const p=player();p.inv[3].mag=0;const slots=[];
  for(let i=0;i<3;i++){p.pressed.add('CycleWeapon');p.slot=p.pickSlot();slots.push(p.slot)}
  assert.deepEqual(slots,[1,2,0]);
});
test('the dedicated grenade button takes priority over cycle and quick swap',()=>{
  const p=player();p.pressed=new Set(['Digit4','CycleWeapon','KeyQ']);p.mouse.wheel=1;
  assert.equal(p.pickSlot(),3);assert.equal(p.pressed.size,0);assert.equal(p.mouse.wheel,0);
});
test('desktop quick swap and reverse mouse wheel retain their behavior',()=>{
  const p=player();p.pressed.add('KeyQ');assert.equal(p.pickSlot(),1);
  p.mouse.wheel=-1;assert.equal(p.pickSlot(),3);
  p.inv[3].mag=0;p.mouse.wheel=-1;assert.equal(p.pickSlot(),2);
});
