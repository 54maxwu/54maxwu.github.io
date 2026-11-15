import test from 'node:test';import assert from 'node:assert/strict';import * as THREE from 'three';
import {combatIntent,findCover,planTactics,findPeek} from '../game-src/bot-tactics.js';
import {Bot} from '../game-src/bots.js';
const situation={health:100,mag:20,reloading:false,enemies:1,allies:0,type:'rifle',distance:15};
test('injury, reloading, empty ammunition and visible numerical disadvantage favor cover',()=>{
 assert.equal(combatIntent(situation),'engage');
 for(const change of [{health:25},{mag:0},{reloading:true},{enemies:3}])assert.equal(combatIntent({...situation,...change}),'cover');
 assert.equal(combatIntent({...situation,enemies:3,allies:3}),'engage');
 assert.equal(combatIntent({...situation,type:'sniper',distance:5}),'reposition');
});
function bot(){return{pos:new THREE.Vector3(),hp:25,team:'BL',weapon:{mag:10,reloading:false,def:{type:'rifle'}},observedAim:new THREE.Vector3(10,1.6,0),visibleEnemies:1,
 game:{actors:[],world:{support:()=>({y:0}),blocked:()=>false,raycast:x=>x<0?{}:null},nav:{nearest:(x,z)=>({x,z,y:.025})}},routeTo(...args){this.route=args}};}
test('cover uses a supported, unoccupied point shielded from the observed threat',()=>{const b=bot(),cover=findCover(b,b.observedAim);assert.ok(cover);assert.ok(cover.x<0);b.game.world.blocked=()=>true;assert.equal(findCover(b,b.observedAim),null);b.game.world.blocked=()=>false;b.game.world.support=()=>null;assert.equal(findCover(b,b.observedAim),null);});
test('tactics use the visual snapshot, throttle scans and do not continuously replace valid cover',()=>{const b=bot();b.game.actors=[b];let calls=0;const ray=b.game.world.raycast;b.game.world.raycast=(...a)=>{calls++;return ray(...a)};planTactics(b,{dist:10},1);assert.ok(b.coverPoint);const point=b.coverPoint;const count=calls;planTactics(b,{dist:10},1.1);assert.equal(calls,count);planTactics(b,{dist:10},1.9);assert.equal(b.coverPoint,point);assert.equal(b.tactic,'cover');});
test('search uses the last visual position and stops pursuing an expired memory',()=>{
 const b={planSearch:Bot.prototype.planSearch},routes=[];Object.assign(b,{pos:new THREE.Vector3(),lastSeen:new THREE.Vector3(5,0,0),lastSeenT:1,heard:null,weapon:{def:{mag:30},mag:30,canReload:()=>false},nadeCooldown:100,inv:[null,null,null,{mag:0}],pathDone:()=>true,routeTo:(...p)=>routes.push(p),newGoal:()=>routes.push('roam')});
 b.target={get pos(){throw Error('must not read hidden enemy position')}};
 b.planSearch(2);assert.deepEqual(routes,[[5,0,0]]);assert.equal(b.state,'hunt');
 b.planSearch(8);assert.equal(routes.at(-1),'roam');assert.equal(b.state,'roam');
});

test('peek requires supported clearance, a clear local step and visibility to the remembered threat',()=>{
 const b=bot();b.coverPoint=new THREE.Vector3();b.game.world.raycast=()=>null;
 assert.ok(findPeek(b));b.game.world.raycast=()=>({t:.1});assert.equal(findPeek(b),null);
 b.game.world.raycast=()=>null;b.game.world.support=()=>({y:3});assert.equal(findPeek(b),null);
});
