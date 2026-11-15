import test from 'node:test';import assert from 'node:assert/strict';
import {Actor} from '../game-src/actor.js';
import * as THREE from 'three';
import {grenadeLaunch,GRENADE_WINDUP} from '../game-src/grenade-throw.js';
function actor(){const events=[];return {pendingThrow:0,grenadePrimed:false,autoSwitchAt:0,game:{onGrenadeStart:()=>events.push('prime'),onGrenadeRelease:()=>events.push('release'),throwGrenade:()=>events.push('throw')},events};}
test('a grenade stays held, then follows the arm windup before actual release',()=>{const a=actor(),w={mag:1};Actor.prototype.useGrenade.call(a,.01,{fire:true,firePressed:true},w,0);for(let i=0;i<300;i++)Actor.prototype.useGrenade.call(a,.01,{fire:true},w,i*.01);assert.deepEqual(a.events,['prime']);assert.equal(w.mag,1);Actor.prototype.useGrenade.call(a,.01,{fire:false},w,3.01);assert.deepEqual(a.events,['prime','release']);assert.equal(w.mag,1);Actor.prototype.useGrenade.call(a,GRENADE_WINDUP,{fire:false},w,3.21);assert.deepEqual(a.events,['prime','release','throw']);assert.equal(w.mag,0);assert.equal(a.grenadePrimed,false);});
test('a quick tap completes pin preparation and arm windup exactly once',()=>{const a=actor(),w={mag:1};Actor.prototype.useGrenade.call(a,.01,{fire:true,firePressed:true},w,0);Actor.prototype.useGrenade.call(a,.2,{fire:false},w,.2);assert.equal(w.mag,1);Actor.prototype.useGrenade.call(a,.33,{fire:false},w,.53);assert.equal(w.mag,1);Actor.prototype.useGrenade.call(a,GRENADE_WINDUP,{fire:false},w,.73);assert.equal(w.mag,0);assert.equal(a.events.filter(e=>e==='throw').length,1);});

test('grenade release is offset from the throwing hand and inherits movement without aiming at hidden state',()=>{
 const a={yaw:0,vel:new THREE.Vector3(2,0,0),eye:p=>p.set(0,1.62,0),forward:p=>p.set(0,0,-1)};
 let launch=grenadeLaunch(a);assert.ok(launch.position.distanceTo(new THREE.Vector3(.17,1.63,-.5))<1e-9);assert.deepEqual(launch.velocity.toArray(),[1.2,3.6,-15]);
 a.yaw=Math.PI/2;a.forward=p=>p.set(-1,0,0);launch=grenadeLaunch(a);assert.ok(Math.abs(launch.position.x+.5)<1e-6);assert.ok(Math.abs(launch.position.z+.17)<1e-6);
});
