import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {spatialBatches,SpatialVisibility} from '../spatial-batches.js';
import {CombatHistory} from '../game-src/combat-history.js';
import {resetMotion,wantsBurst,shotFired,smoothMovement,combatStep} from '../game-src/bot-motion.js';

test('partition preserves every triangle, shares damage edits, and excludes moving ranges from static culling',()=>{
  const a=new THREE.BoxGeometry(2,2,2).toNonIndexed(),b=a.clone().translate(80,0,0);
  const p=new Float32Array([...a.attributes.position.array,...b.attributes.position.array]);
  const geo=new THREE.BufferGeometry().setAttribute('position',new THREE.BufferAttribute(p,3));
  const mesh=new THREE.Mesh(geo);mesh.name='real:brick';const scene=new THREE.Scene();scene.add(mesh);
  const chunks=spatialBatches([mesh],new Map([['brick',[{start:36,count:36}]]]));
  const indices=chunks.flatMap(c=>Array.from(c.geometry.index.array));assert.equal(indices.length,p.length/3);assert.equal(new Set(indices).size,p.length/3);
  assert.equal(chunks.length,1);assert.ok(mesh.geometry.userData.spatial.cells.some(c=>c.moving));
  geo.attributes.position.setXYZ(0,4,5,6);assert.ok(chunks.every(c=>c.geometry.attributes.position===geo.attributes.position));
  const camera=new THREE.PerspectiveCamera(60,1,.1,20);camera.position.set(0,0,6);camera.lookAt(0,0,0);camera.updateMatrixWorld();
  const visibility=new SpatialVisibility(chunks);visibility.update(camera);assert.equal(mesh.geometry.drawRange.count,72);
  camera.position.x=-100;camera.lookAt(-110,0,0);visibility.update(camera);assert.equal(mesh.geometry.drawRange.count,36);
  visibility.update(camera,true);assert.equal(mesh.geometry.drawRange.count,36);
  mesh.onBeforeShadow();assert.equal(mesh.geometry.drawRange.count,72);mesh.onAfterShadow();assert.equal(mesh.geometry.drawRange.count,36);
});

test('burst counts actual shots regardless of simulation frequency and movement reversal is smooth',()=>{
  const b={skill:{strafe:1},yaw:0};resetMotion(b);const d={id:'ak47',auto:true};
  assert.equal(wantsBurst(b,d,30,0,()=>0),false);
  for(let i=0;i<100;i++)wantsBurst(b,d,30,.05,()=>0);
  assert.equal(b.burstRemaining,2);assert.equal(wantsBurst(b,d,30,.11),true);
  shotFired(b,d,.12,()=>0);assert.equal(b.burstRemaining,1);shotFired(b,d,.22,()=>0);assert.equal(wantsBurst(b,d,30,.23),false);
  const act={wishX:1,wishZ:0};smoothMovement(b,act,1);act.wishX=-1;smoothMovement(b,act,.01);assert.ok(act.wishX>0);
  combatStep(b,act,d,30,1,()=>0);const direction=b.strafeDir;combatStep(b,act,d,30,1.1,()=>.9);assert.equal(b.strafeDir,direction);
});

test('hit records retain shooter identity and projectile trajectory after live actors mutate, with bounded storage',()=>{
  const h=new CombatHistory(),a={id:1,name:'before',team:'BL'},v={id:2,name:'victim'},p=new THREE.Vector3();
  const id=h.launch(0,a,'he',p);p.set(2,3,4);h.sample(id,.5,p);h.finish(id,1,p);
  const hit=h.impact(1,v,a,'he','chest',p,100,{projectileId:id,origin:p});
  a.name='after';p.set(99,99,99);h.sample(id,1.1,p);
  assert.equal(hit.source.name,'before');assert.deepEqual(hit.projectile.path.at(-1).position,[2,3,4]);assert.deepEqual(hit.origin,[2,3,4]);assert.equal(hit.exact,false);
  for(let i=0;i<1000;i++)h.add(2,'shot');assert.equal(h.events.length,512);h.add(20,'shot');assert.equal(h.projectiles.size,0);
  for(let i=0;i<80;i++)h.launch(20,a,'rpg',p);assert.equal(h.projectiles.size,64);h.reset();assert.equal(h.events.length,0);assert.equal(h.projectiles.size,0);
});
