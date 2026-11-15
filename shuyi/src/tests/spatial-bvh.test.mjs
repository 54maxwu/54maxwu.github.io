import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {spatialBatches,SpatialVisibility,buildTriangleBVH,cull} from '../spatial-batches.js';

// 散布在 200×200 m 的小方塊，各 12 個三角形
function scatter(n=300,seed=7){
  let s=seed;const rnd=()=>(s=(s*16807)%2147483647)/2147483647;
  const parts=[];for(let i=0;i<n;i++){const h=1+rnd()*8;parts.push(new THREE.BoxGeometry(1,h,1).toNonIndexed().translate(rnd()*200-100,h/2,rnd()*200-100).attributes.position.array);}
  const p=new Float32Array(parts.reduce((a,b)=>a+b.length,0));let o=0;for(const a of parts){p.set(a,o);o+=a.length;}
  const geo=new THREE.BufferGeometry().setAttribute('position',new THREE.BufferAttribute(p,3));const mesh=new THREE.Mesh(geo);mesh.name='real:brick';return mesh;
}
const triBox=(p,t)=>new THREE.Box3().setFromBufferAttribute(new THREE.BufferAttribute(p.array.slice(t*9,t*9+9),3));

test('BVH covers every triangle once in contiguous depth-first ranges',()=>{
  const mesh=scatter(),p=mesh.geometry.attributes.position,tris=[...Array(p.count/3).keys()];
  const bvh=buildTriangleBVH(p,tris,8);
  assert.deepEqual([...bvh.triOrder].sort((a,b)=>a-b),tris);
  for(let i=0;i<bvh.start.length;i++){const l=bvh.left[i],r=bvh.right[i];if(l<0)continue;
    assert.equal(bvh.start[l],bvh.start[i]);assert.equal(bvh.start[r],bvh.start[l]+bvh.count[l]);assert.equal(bvh.count[l]+bvh.count[r],bvh.count[i]);
    const b=bvh.box;for(const c of [l,r])for(let a=0;a<3;a++){assert.ok(b[c*6+a]>=b[i*6+a]-1e-4);assert.ok(b[c*6+3+a]<=b[i*6+3+a]+1e-4);}
  }
});

test('hierarchical culling keeps every triangle a per-triangle frustum test would keep',()=>{
  const mesh=scatter(),p=mesh.geometry.attributes.position;
  const bvh=buildTriangleBVH(p,[...Array(p.count/3).keys()],8);
  const camera=new THREE.PerspectiveCamera(70,16/9,.1,90);camera.position.set(-20,1.7,10);camera.lookAt(30,1.7,-20);camera.updateMatrixWorld();
  const frustum=new THREE.Frustum().setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));
  const kept=new Set();for(const [s,c] of cull(bvh,frustum.planes,null,null))for(let i=s;i<s+c;i+=3)kept.add(bvh.triOrder[i/3]);
  let need=0;for(let t=0;t<p.count/3;t++)if(frustum.intersectsBox(triBox(p,t))){need++;assert.ok(kept.has(t),'visible triangle '+t+' was culled');}
  assert.ok(need>0&&kept.size<p.count/3,`expected partial selection (${kept.size}/${p.count/3})`);
});

test('shadow pass keeps an off-screen caster whose shadow falls into view and drops casters behind the camera',()=>{
  // 高塔在畫面左側之外；太陽在西方低處，塔影往東落進畫面。另一個方塊在鏡頭正後方。
  const make=(name,g)=>{const m=new THREE.Mesh(g.toNonIndexed());m.name='real:'+name;return m;};
  const tower=make('brick',new THREE.BoxGeometry(2,30,2).translate(-30,15,-20));
  const behind=make('stone',new THREE.BoxGeometry(2,2,2).translate(0,1,60));
  const ground=make('pave',new THREE.PlaneGeometry(400,400).rotateX(-Math.PI/2));
  const meshes=spatialBatches([tower,behind,ground]);
  const sun=new THREE.DirectionalLight();sun.castShadow=true;sun.position.set(-60,40,0);sun.target.position.set(0,0,0);
  const c=sun.shadow.camera;c.left=c.bottom=-150;c.right=c.top=150;c.near=1;c.far=400;c.updateProjectionMatrix();
  const camera=new THREE.PerspectiveCamera(50,1,.1,200);camera.position.set(10,2,0);camera.lookAt(10,0,-40);camera.updateMatrixWorld();
  const visibility=new SpatialVisibility(meshes);visibility.update(camera,true,sun);
  const S=m=>m.geometry.userData.spatial;
  assert.equal(S(tower).count,0,'tower is outside the camera view');
  assert.equal(S(tower).shadowCount,36,'tower shadow reaches the visible ground');
  assert.equal(S(behind).count,0);assert.equal(S(behind).shadowCount,0,'caster behind the camera is skipped');
  assert.equal(S(ground).count,6);
  visibility.update(camera,false,sun);assert.equal(S(behind).shadowCount,36,'shadows off falls back to the full index');
});

test('incremental index writes always leave the buffer equal to a full rewrite',()=>{
  const mesh=scatter(400,11);spatialBatches([mesh]);const visibility=new SpatialVisibility([mesh]),s=mesh.geometry.userData.spatial;
  const camera=new THREE.PerspectiveCamera(70,16/9,.05,500);camera.rotation.order='YXZ';
  let s0=3;const rnd=()=>(s0=(s0*16807)%2147483647)/2147483647;
  for(let i=0;i<60;i++){
    camera.position.set(rnd()*160-80,1.7,rnd()*160-80);camera.rotation.y=rnd()*Math.PI*2;camera.updateMatrixWorld();
    if(!visibility.update(camera))continue;
    const expect=[];for(const [a,c] of cull(s.bvh,visibility.frustum.planes,null,null))expect.push(...s.full.subarray(a,a+c));
    assert.equal(s.count,expect.length);assert.deepEqual(Array.from(s.index.array.subarray(0,s.count)),expect);
  }
});

test('small turns reuse the selection; large turns reselect',()=>{
  const mesh=scatter();spatialBatches([mesh]);const visibility=new SpatialVisibility([mesh]);
  const camera=new THREE.PerspectiveCamera(70,16/9,.05,500);camera.position.set(0,1.7,0);camera.rotation.order='YXZ';camera.updateMatrixWorld();
  assert.equal(visibility.update(camera),true);
  camera.rotation.y=THREE.MathUtils.degToRad(6);camera.position.x=.5;camera.updateMatrixWorld();assert.equal(visibility.update(camera),false);
  camera.rotation.y=THREE.MathUtils.degToRad(40);camera.updateMatrixWorld();assert.equal(visibility.update(camera),true);
  camera.fov=30;camera.updateProjectionMatrix();assert.equal(visibility.update(camera),false,'zooming in stays inside the selection');
});
