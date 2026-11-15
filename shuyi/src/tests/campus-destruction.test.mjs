import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { fractureGeometry } from '../campus-breakables.js';
import {Builder} from '../campus-real.js';
import {CampusWorld} from '../campus-physics.js';

function area(g) {
  const p=g.attributes.position,a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3();let sum=0;
  for(let i=0;i<p.count;i+=3){a.fromBufferAttribute(p,i);b.fromBufferAttribute(p,i+1);c.fromBufferAttribute(p,i+2);sum+=b.sub(a).cross(c.sub(a)).length()/2;}return sum;
}
test('a large roof triangle is split locally without losing surface area or UVs',()=>{
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute([-8,6,-4,8,6,-4,0,9,4],3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,1,0,.5,1],2));g.computeVertexNormals();
  const parts=fractureGeometry(g);
  assert.ok(parts.length>10);
  assert.ok(Math.abs(parts.reduce((n,p)=>n+area(p),0)-area(g))<.001);
  for(const p of parts){assert.ok(p.boundingBox.max.x-p.boundingBox.min.x<=2.401);assert.ok(p.boundingBox.max.z-p.boundingBox.min.z<=2.401);
    for(const a of Object.values(p.attributes))assert.ok([...a.array].every(Number.isFinite));
    assert.equal(p.attributes.uv.count,p.attributes.position.count);
  }
});

test('neighbouring slabs cannot keep a disconnected island floating',()=>{
  const world=new CampusWorld(),builder=Object.create(Builder.prototype);builder.world=world;
  const part=(x0,x1,y0,y1)=>{const box={x0,x1,y0,y1,n0:0,n1:2};const c=world.add({x:(x0+x1)/2,y:(y0+y1)/2,z:-1,sx:x1-x0,sy:y1-y0,sz:2});const p={box,c,kind:'concrete'};c.part=p;return p;};
  const pillar=part(0,1,0,3),left=part(0,2,3,3.3),right=part(2,4,3,3.3);world.build();
  const initial=builder.supportCalc(new Set([pillar,left,right]));assert.equal(initial.get(left),true);assert.equal(initial.get(right),true);
  pillar.dead=true;pillar.c.solid=false;world.structuralRevision=1;
  assert.equal(builder.supportCalc(new Set([left])).get(left),false);
});
