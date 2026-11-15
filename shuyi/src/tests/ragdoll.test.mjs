import test from 'node:test';import assert from 'node:assert/strict';import * as THREE from 'three';
import {Ragdoll} from '../game-src/ragdoll.js';

// 與 character.js 相同的骨架（站姿）
const SKELETON=[['hips',-1,[0,.97,0]],['spine',0,[0,.13,0]],['chest',1,[0,.19,0]],['neck',2,[0,.21,0]],['head',3,[0,.08,0]],
 ['shoulderR',2,[.17,.13,0]],['upperArmR',5,[.04,0,0]],['forearmR',6,[0,-.29,0]],['handR',7,[0,-.26,0]],
 ['shoulderL',2,[-.17,.13,0]],['upperArmL',9,[-.04,0,0]],['forearmL',10,[0,-.29,0]],['handL',11,[0,-.26,0]],
 ['thighR',0,[.1,-.05,0]],['shinR',13,[0,-.44,0]],['footR',14,[0,-.44,0]],['thighL',0,[-.1,-.05,0]],['shinL',16,[0,-.44,0]],['footL',17,[0,-.44,0]]];
function body(yaw=0){const root=new THREE.Group(),mesh=new THREE.Object3D();root.rotation.y=yaw;root.add(mesh);
 const bones=SKELETON.map(([n,,p])=>{const b=new THREE.Bone();b.name=n;b.position.set(...p);return b;});
 SKELETON.forEach(([,parent],i)=>(parent>=0?bones[parent]:mesh).add(bones[i]));root.updateMatrixWorld(true);return bones;}
// 平地：一個頂面在 y=0 的大方塊
const ground={solid:true,bottom:-1,top:0,y:-.5,hx:100,hy:.5,hz:100,toLocal:(x,z)=>[x,z],toWorldDir:(x,z)=>[x,z]};
const world={query:()=>[ground]};
function rng(seed){return()=>((seed=(seed*16807)%2147483647)/2147483647);}
function run(rd,secs){for(let t=0;t<secs;t+=1/60)rd.update(1/60);}

for(const [label,opts,headshot] of [['body shot',{force:1.7},false],['headshot',{force:2.2},true],['shotgun',{force:3.4},false],['explosion',{force:7,explosive:true},false]]){
 test(`ragdoll ${label}: falls to the ground, stays finite, joints bend the right way and it settles`,()=>{
  for(let s=1;s<=6;s++){
   const bones=body(s*.9),rd=new Ragdoll(bones,world,new THREE.Vector3(Math.sin(s),0,Math.cos(s)),new THREE.Vector3(),headshot,{...opts,rng:rng(s)});
   run(rd,5);
   for(const n of rd.nodes){assert.ok(Number.isFinite(n.p.x+n.p.y+n.p.z));assert.ok(n.p.y>-.02,'nothing sinks through the floor');}
   const hips=rd.nodes[rd.I.hips].p,head=rd.nodes[rd.I.head].p;
   assert.ok(hips.y<.35&&head.y<.45,`lying down (hips ${hips.y.toFixed(2)}, head ${head.y.toFixed(2)})`);
   assert.ok(rd.asleep,'comes to rest');
   // 肢體長度保持
   for(const l of rd.links)if(l.k===1&&l.min===l.max){const L=rd.nodes[l.a].p.distanceTo(rd.nodes[l.b].p);assert.ok(Math.abs(L-l.min)<.03);}
   // 膝蓋往前凸、手肘往後凸（不會反折）
   const N=rd.nodes,sideL=N[rd.I.thighR].p.clone().sub(N[rd.I.thighL].p).normalize(),sideA=N[rd.I.shoulderR].p.clone().sub(N[rd.I.shoulderL].p).normalize();
   for(const h of rd.hinges){const A=N[h.a].p,B=N[h.b].p,C=N[h.c].p,f=new THREE.Vector3().crossVectors(h.leg?sideL:sideA,C.clone().sub(A)).normalize();
    assert.ok(h.sign*B.clone().sub(A).dot(f)>-.02,`${h.leg?'knee':'elbow'} not hyperextended`);}
   // 骨頭的旋轉都是有效的單位四元數
   for(const b of bones)assert.ok(Math.abs(b.quaternion.length()-1)<1e-4);
  }
 });
}

test('body shot crumples (knees give, torso still upright) before the full collapse; headshot drops at once',()=>{
 const tallAt=(headshot)=>{const bones=body(),rd=new Ragdoll(bones,world,new THREE.Vector3(0,0,1),new THREE.Vector3(),headshot,{force:1.5,rng:rng(3)});run(rd,.25);
  const n=rd.nodes,I=rd.I;return {hips:n[I.hips].p.y,upright:n[I.neck].p.y-n[I.hips].p.y};};
 const body1=tallAt(false),head1=tallAt(true);
 assert.ok(body1.hips<.97,'hips already sinking');
 assert.ok(body1.upright>.4,'upper body still held up');
 assert.ok(head1.upright<body1.upright,'headshot goes limp sooner');
});
