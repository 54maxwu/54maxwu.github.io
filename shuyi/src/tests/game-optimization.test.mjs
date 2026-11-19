import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {build} from 'esbuild';
import {fileURLToPath} from 'node:url';

// Audio is not played here; load clips as text while exercising actual game methods in Node.
const bundle=await build({stdin:{contents:"export {Game} from './game.js'; export {Soldier} from './character.js';",
  resolveDir:fileURLToPath(new URL('../game-src/',import.meta.url))},
  bundle:true,write:false,platform:'node',format:'esm',loader:{'.mp3':'text'}});
const {Game,Soldier}=await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString('base64')}`);

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
