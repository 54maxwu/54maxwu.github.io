import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {BotSchedule} from '../game-src/bot-schedule.js';
import {Bot} from '../game-src/bots.js';

function bot(){
 const b={pos:new THREE.Vector3(),hp:100,lastHurt:-99,lastSeenT:1,lastSeen:new THREE.Vector3(8,0,0),observedAim:new THREE.Vector3(8,1.5,0),visible:true,tactic:'peek',coverPoint:new THREE.Vector3(2,0,0),routeVersion:0,routePending:false,
  weapon:{mag:30,reloading:false,def:{mag:30},canReload(){return this.mag<30&&!this.reloading;}},
  game:{time:0,world:{structuralRevision:0,support:()=>({y:0}),blocked:()=>false,raycast:(x,y,z,dx,dy,dz,L,kind)=>kind==='sight'&&x<2.1?{t:.2}:null},nav:{nearest:(x,z)=>({x:Math.round(x),z:Math.round(z),y:.025})}},
  routes:[],routeTo(x,z,y){this.routes.push([x,z,y]);this.path=[[this.pos.x,this.pos.z,this.pos.y],[x,z,y]];this.pi=1;},pathDone(){return !this.path;},steer(){return [1,0];},newGoal(){this.newGoals=(this.newGoals||0)+1;},startReload(){this.reloads=(this.reloads||0)+1;this.weapon.reloading=true;}};
 b.schedule=new BotSchedule(b);return b;
}
const act=()=>({wishX:0,wishZ:0,fire:true,firePressed:true});

test('cover schedule completes observation, peek, firing window, return without continuously replacing its route',()=>{
 const b=bot(),s=b.schedule;s.coverAction(act(),0);assert.equal(s.task,'take-cover');
 b.pos.copy(b.coverPoint);s.coverAction(act(),.5);assert.equal(s.task,'observe-cover');assert.ok(s.holdsPlan());
 s.coverAction(act(),.8);assert.equal(s.task,'observe-cover');s.coverAction(act(),1);assert.equal(s.task,'peek-out');const routes=b.routes.length;
 for(let i=0;i<10;i++)s.coverAction(act(),1.01+i*.001);assert.equal(b.routes.length,routes);
 b.pos.copy(b.peekPoint);s.coverAction(act(),1.1);assert.equal(s.task,'fire-window');
 const firing=act();s.coverAction(firing,1.2);assert.equal(firing.fire,true);
 const returning=act();s.coverAction(returning,1.8);assert.equal(s.task,'return-cover');assert.equal(returning.fire,false);
 b.pos.copy(b.coverPoint);s.coverAction(act(),2);assert.equal(s.task,'observe-cover');
});

test('new damage interrupts an exposed firing task and immediately suppresses firing',()=>{
 const b=bot(),s=b.schedule;s.coverAction(act(),0);b.pos.copy(b.coverPoint);s.coverAction(act(),.5);s.coverAction(act(),1);b.pos.copy(b.peekPoint);s.coverAction(act(),1.1);
 b.lastHurt=1.2;const a=act();s.coverAction(a,1.21);assert.equal(s.task,'return-cover');assert.equal(a.fire,false);assert.equal(b.peekPhase,'return');
});

test('reload stays committed despite hearing clues and completes before a new peek',()=>{
 const b=bot(),s=b.schedule;b.weapon.mag=0;b.pos.copy(b.coverPoint);s.coverAction(act(),0);assert.equal(s.task,'reload-cover');assert.equal(b.reloads,1);
 b.heard=new THREE.Vector3(9,0,9);b.heardT=.5;for(let i=1;i<20;i++)s.coverAction(act(),i*.1);
 assert.equal(s.task,'reload-cover');assert.equal(b.reloads,1);assert.equal(b.routes.length,0);
 b.weapon.reloading=false;b.weapon.mag=30;s.coverAction(act(),2);assert.equal(s.task,'observe-cover');assert.ok(s.until>=2.5);
});

test('destroyed cover or floor cancels the old task, route and residual movement',()=>{
 const b=bot(),s=b.schedule;s.coverAction(act(),0);s.refresh(0);b.motionX=1;b.path=[[0,0,0],[2,0,0]];const version=b.routeVersion;
 b.game.world.support=()=>null;b.game.world.structuralRevision=1;s.refresh(.1);
 assert.equal(b.coverPoint,null);assert.equal(b.path,null);assert.equal(b.motionX,0);assert.ok(b.routeVersion>version);assert.equal(s.trace.at(-1).reason,'cover-destroyed');
});

test('an unreachable cover route times out instead of leaving the bot in a permanent task',()=>{
 const b=bot(),s=b.schedule;s.coverAction(act(),0);s.coverAction(act(),4.1);assert.equal(b.coverPoint,null);assert.equal(s.task,'engage');assert.equal(s.trace.at(-1).reason,'route-timeout');
});

test('search observes the remembered position then releases the memory, without reading hidden enemy coordinates',()=>{
 const b=bot(),s=b.schedule;b.coverPoint=null;b.visible=false;b.pos.copy(b.lastSeen);b.target={get pos(){throw Error('hidden coordinates');}};
 const a=act();s.apply(a,2);assert.equal(s.task,'observe-search');assert.equal(a.fire,false);assert.ok(s.holdsPlan());s.apply(act(),3.2);assert.equal(s.task,'roam');assert.equal(b.lastSeen,null);assert.equal(b.newGoals,1);
});

test('new path requests discard old paths and stale callbacks cannot overwrite a newer route or respawn',()=>{
 const callbacks=[],b={game:{world:{structuralRevision:0},nav:{requestPath:(owner,args,done)=>callbacks.push(done)}},pos:new THREE.Vector3(),alive:true,path:[[99,99,0]],pi:0,pathDone:Bot.prototype.pathDone};
 Bot.prototype.routeTo.call(b,5,0);assert.equal(b.path,null);Bot.prototype.routeTo.call(b,9,0);
 callbacks[0]([[0,0,0],[5,0,0]]);assert.equal(b.path,null);assert.equal(b.routePending,true);
 callbacks[1]([[0,0,0],[9,0,0]]);assert.deepEqual(b.path.at(-1),[9,0,0]);
 Bot.prototype.routeTo.call(b,12,0);b.routeVersion++;callbacks[2]([[0,0,0],[12,0,0]]);assert.equal(b.path,null);
});

test('task trace stays bounded and scheduler reset drops commitments on respawn',()=>{
 const b=bot(),s=b.schedule;for(let i=0;i<100;i++)s.change(i%2?'roam':'search',i,'test');assert.equal(s.trace.length,24);s.reset();assert.equal(s.trace.length,0);assert.equal(s.holdsPlan(),false);
});

test('observe-search keeps a finite heading after travel() clears lookYaw',()=>{
 const b=bot(),s=b.schedule;b.coverPoint=null;b.peekPoint=null;b.visible=false;b.yaw=1.25;b.lastSeenT=0;b.lastSeen=new THREE.Vector3(1,0,0);
 const first=act();s.apply(first,.5);assert.equal(s.task,'observe-search');assert.ok(Number.isFinite(first.yaw));
 b.lookYaw=undefined; // Bot.travel() clears this every update once lookUntil has passed.
 for(const t of [.6,.9,1.3]){const a=act();s.apply(a,t);assert.ok(Number.isFinite(a.yaw),'yaw at '+t+' was '+a.yaw);assert.ok(Math.abs(a.yaw-1.25)<=.61);}
});

test('turnToward ignores a non-finite requested heading instead of keeping NaN forever',()=>{
 const b={yaw:.4,pitch:.1,visible:true,skill:{turnRate:6}};
 Bot.prototype.turnToward.call(b,NaN,undefined,1/60);
 assert.equal(b.yaw,.4);assert.equal(b.pitch,.1);
 Bot.prototype.turnToward.call(b,.5,.1,1/60);assert.ok(Number.isFinite(b.yaw)&&b.yaw>.4);
});
