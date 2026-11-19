import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {build} from 'esbuild';
import {fileURLToPath} from 'node:url';
import {CampusWorld} from '../campus-physics.js';
import {normalizeOptions} from '../game-src/options.js';

// Audio is not played here; load clips as text while exercising actual game methods in Node.
const bundle=await build({stdin:{contents:"export {Game} from './game.js'; export {Soldier} from './character.js'; export {HUD} from './hud.js'; export {Effects} from './effects.js';",
  resolveDir:fileURLToPath(new URL('../game-src/',import.meta.url))},
  bundle:true,write:false,platform:'node',format:'esm',loader:{'.mp3':'text'}});
const {Game,Soldier,HUD,Effects}=await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString('base64')}`);

test('match reset cancels old scheduled results and clears loadout and target state',()=>{
  const game=Object.create(Game.prototype);let ended=0;
  Object.assign(game,{time:1,playing:true,timers:[],inLoadout:true,aimTarget:{},
    fixedStep:{reset(){}},hud:{scoreboard(){}},endMatch(){ended++;}});
  game.scheduleEnd();game.scheduleEnd();assert.equal(game.timers.length,1);
  game.resetMatchState();assert.equal(game.timers.length,0);
  assert.equal(game.inLoadout,false);assert.equal(game.aimTarget,null);
  game.scheduleEnd();assert.equal(game.timers.length,1);
  assert.equal(ended,0);game.timers[0].fn();assert.equal(ended,1);
});

test('repeated radar draws resize only when dimensions change',()=>{
  let width=300,height=150,writes=0,clears=0;
  const canvas={clientWidth:200,clientHeight:100,
    get width(){return width;},set width(v){width=v;writes++;},
    get height(){return height;},set height(v){height=v;writes++;}};
  const hud={el:{radar:canvas},radarCtx:{clearRect(){clears++;}}};
  HUD.prototype.drawRadar.call(hud,{},[]);HUD.prototype.drawRadar.call(hud,{},[]);
  assert.equal(writes,0);assert.equal(clears,2);
  canvas.clientWidth=240;HUD.prototype.drawRadar.call(hud,{},[]);
  assert.equal(writes,1);assert.equal(width,360);
});

test('shots invalidate hit caches without advancing the display frame',()=>{
  const game=Object.create(Game.prototype);
  Object.assign(game,{frame:20,hitQuery:0,actors:[],world:{raycastAll:()=>[]}});
  for(let i=0;i<12;i++)game.traceBullet({},new THREE.Vector3(),new THREE.Vector3(0,0,-1),{range:50,pen:1});
  assert.equal(game.frame,20);assert.equal(game.hitQuery,12);
});

test('pause freezes debris and structure physics and defers impact damage until resume',()=>{
  const calls=[];
  const game=Object.create(Game.prototype);
  Object.assign(game,{
    paused:true,playing:true,realTime:1,
    renderer:{camera:new THREE.PerspectiveCamera(),fx:{uniforms:{uCine:{value:0}}},render(){}},
    distanceDetails:{update(){}},fx:{update:dt=>calls.push(['fx',dt])},
    env:{update(){}},map:{update:dt=>calls.push(['map',dt])},
    updateLanded:()=>calls.push(['landed']),debrisHits:()=>calls.push(['hits']),
    updateRadarLabel(){},updateScreenFx(){},
  });
  game.renderFrame(.02);
  assert.deepEqual(calls,[['fx',0],['map',0]]);
  calls.length=0;game.paused=false;game.renderFrame(.02);
  assert.deepEqual(calls,[['fx',.02],['map',.02],['landed'],['hits']]);
  calls.length=0;game.playing=false;game.renderFrame(.02);
  assert.deepEqual(calls,[['fx',.02],['map',.02]]);
});

test('clearing a match stops replay before disposing owned resources exactly once',()=>{
  const calls=[];
  const soldier={root:{},mesh:{skeleton:{dispose:()=>calls.push('skeleton')}},
    material:{dispose:()=>calls.push('material')},dispose:Soldier.prototype.dispose};
  const tag={sprite:{material:{map:{dispose:()=>calls.push('texture')},dispose:()=>calls.push('sprite')}}};
  const game={actors:[{soldier}],tags:[tag],killReplay:{stop:()=>calls.push('replay')},renderer:{scene:{remove(){}}}};
  Game.prototype.clearActors.call(game);
  soldier.dispose();
  assert.deepEqual(calls,['replay','skeleton','material','texture','sprite']);
  assert.deepEqual(game.actors,[]);assert.deepEqual(game.tags,[]);
});

test('name tags update once across four simulation substeps',()=>{
  let updates=0;
  const game={time:0,timeLeft:10,timers:[],player:{update(){}},actors:[],nav:{},
    processWreckQueue(){},updateNades(){},updateRockets(){},updateNameTags(){updates++;}};
  for(let i=0;i<4;i++)Game.prototype.simulate.call(game,.01,i===3?.04:0);
  assert.equal(updates,1);
});

test('clearing effects hides old flashes, tracers and particle buffers immediately',()=>{
  const mesh=()=>({count:5});let particleClears=0;
  const pool=()=>({geo:{setDrawRange(a,b){assert.equal(b,0);particleClears++;}}});
  const fx={clearRocketEffects(){},decals:{},rubble:{clear(){}},jag:{clear(){}},rebar:{clear(){}},
    tracers:[{}],tracerMesh:mesh(),chunkMesh:mesh(),shardMesh:mesh(),caseMesh:mesh(),shake:1,
    flashes:[{t:1,s:{visible:true}}],lights:[{t:1,l:{intensity:20}}],add:pool(),smoke:pool()};
  Effects.prototype.clearDecals.call(fx);
  assert.equal(fx.flashes[0].s.visible,false);assert.equal(fx.lights[0].l.intensity,0);
  assert.equal(fx.tracers.length,0);assert.equal(fx.chunkMesh.count,0);
  assert.equal(fx.shake,0);assert.equal(particleClears,2);
});

test('fast forward rejects infinite work and honors exact duration with bounded steps',()=>{
  const game=Object.create(Game.prototype);const steps=[];
  Object.assign(game,{time:0,playing:true,paused:false,actors:[],score:{},simulate(dt){steps.push(dt);this.time+=dt;}});
  assert.throws(()=>game.fastForward(1,0),RangeError);
  assert.throws(()=>game.fastForward(Infinity),RangeError);
  game.fastForward(.025,.1);assert.ok(Math.abs(game.time-.025)<1e-10);
  assert.ok(steps.every(dt=>dt<=.01));
  game.paused=true;game.fastForward(1);assert.equal(steps.length,3);
});

test('damage cannot mutate actors after settlement or while paused',()=>{
  for(const field of ['ended','paused']){
    const game=Object.create(Game.prototype);game[field]=true;
    const victim={alive:true,hp:100,armor:100,protectT:0};
    game.damage(victim,null,50,'head','he');assert.equal(victim.hp,100);assert.equal(victim.armor,100);
  }
});

test('headless matches exercise all primary weapons, bots, collisions and repeated restarts',()=>{
  const originalRandom=Math.random;let seed=7391;
  Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const originals = new Map(['document','location','addEventListener'].map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)]));
  const noop=()=>{};
  const context=new Proxy({createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),
    getImageData:(x,y,w,h)=>({data:new Uint8ClampedArray(w*h*4)}),createLinearGradient:()=>({addColorStop:noop}),createRadialGradient:()=>({addColorStop:noop})},
    {get:(o,k)=>o[k]??noop});
  const canvas={getContext:()=>context,addEventListener:noop};
  const stub=()=>new Proxy({}, {get:(o,k)=>o[k]??noop});
  Object.defineProperty(globalThis,'document',{configurable:true,value:{addEventListener:noop,createElement:()=>({...canvas}),getElementById:()=>canvas,pointerLockElement:null}});
  Object.defineProperty(globalThis,'location',{configurable:true,value:{search:'?nolock'}});
  Object.defineProperty(globalThis,'addEventListener',{configurable:true,value:noop});
  try {
    const g=new Game();g.hud=stub();g.vm=stub();g.env=stub();g.fx=stub();g.fx.shake=0;
    g.renderer={scene:new THREE.Scene(),camera:new THREE.PerspectiveCamera()};
    g.world=new CampusWorld();g.world.add({x:0,y:-.5,z:0,sx:80,sy:1,sz:80});g.world.build();
    g.nav={nearest:(x,z)=>({x,z,y:.025}),findPath:(x,z,bx,bz)=>[[x,z,.025],[bx,bz,.025]],clearRequests:noop};
    g.map={spawns:{BL:[{x:-4,y:0,z:0,yaw:-Math.PI/2}],GR:[{x:4,y:0,z:0,yaw:Math.PI/2}]},
      pickBotGoal:a=>[a.team==='BL'?4:-4,0,.025],isSpawn:()=>true};
    for(const primary of ['ak47','m4a1','awm','mp5','m870','rpg']) {
      g.opts={...normalizeOptions(null),primary,size:2,goal:100};g.startMatch();
      g.player.scoped=2;g.player.reScope=2;g.player.grenadePrimed=true;
      g.chooseLoadout(primary);
      assert.equal(g.player.scoped,0);assert.equal(g.player.reScope,0);
      assert.equal(g.player.grenadePrimed,false);
      g.inLoadout=true;g.pause();assert.equal(g.inLoadout,false);
      assert.equal(g.paused,true);g.resume();assert.equal(g.paused,false);
      for(let i=0;i<1000;i++){
        const p=g.player;p.mouse.l=true;p.mouse.lp=i%25===0;
        if(i%200===0)p.pressed.add('KeyR');
        if(i===400)p.pressed.add('Digit4');
        if(i===480)p.mouse.l=false;
        if(i===600)p.pressed.add('Digit1');
        if(i===700)p.pressed.add('Digit3');
        if(i===800)p.pressed.add('Digit2');
        g.simulate(.01);
        for(const a of g.actors){
          assert.ok([a.pos.x,a.pos.y,a.pos.z,a.hp,a.armor,a.pitch,a.yaw].every(Number.isFinite),JSON.stringify({primary,i,id:a.id,pos:a.pos,hp:a.hp,armor:a.armor,pitch:a.pitch,yaw:a.yaw}));
          assert.ok(a.weapon.mag>=0,primary);
        }
      }
      g.quitToMenu();assert.equal(g.actors.length,0);assert.equal(g.timers.length,0);
      assert.equal(g.nades.length,0);assert.equal(g.rockets.length,0);
    }
  } finally {
    Math.random=originalRandom;
    for(const [key,descriptor]of originals){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];}
  }
});

test('grenades dropped during an explosion survive the current update',()=>{
 const g=Object.create(Game.prototype),dropped={fuse:3};
 const grenade={fuse:0,vel:new THREE.Vector3(),pos:new THREE.Vector3(),spin:new THREE.Vector3(),mesh:new THREE.Object3D()};
 Object.assign(g,{time:1,nades:[grenade],world:{raycast:()=>null},renderer:{scene:new THREE.Scene()},explode(){this.nades.push(dropped);}});
 g.updateNades(.01);assert.deepEqual(g.nades,[dropped]);assert.equal(dropped.fuse,3);
});

test('melee resolves at impact, respects walls and cancels after weapon changes',()=>{
 const g=Object.create(Game.prototype);let damage=0,targetDistance=.8,wall=null;
 const attacker={alive:true,team:'BL',weapon:{},weaponAction:0,eye:v=>v.set(0,1,0),forward:v=>v.set(0,0,-1)};
 const target={alive:true,team:'GR',forward:v=>v.set(0,0,1),soldier:{hitTest(o,d,max){return targetDistance<max?{t:targetDistance,part:'chest'}:null;}}};
 Object.assign(g,{time:1,hitQuery:0,timers:[],actors:[attacker,target],world:{raycast:()=>wall},
   fx:{impact(){},slash(){}},map:{},afterWreck(){},damage(){damage++;}});
 g.melee(attacker,false);targetDistance=10;g.timers.pop().fn();assert.equal(damage,0);
 targetDistance=.8;wall={t:.3,nx:0,ny:0,nz:1,collider:{mat:'concrete'}};
 g.melee(attacker,false);g.timers.pop().fn();assert.equal(damage,0);
 wall=null;g.melee(attacker,false);attacker.weaponAction++;g.timers.pop().fn();assert.equal(damage,0);
 g.melee(attacker,false);g.timers.pop().fn();assert.equal(damage,1);
});
