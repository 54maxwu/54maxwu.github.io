import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {build} from 'esbuild';
import {fileURLToPath} from 'node:url';

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
