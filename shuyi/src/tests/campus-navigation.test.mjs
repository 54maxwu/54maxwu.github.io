import test from 'node:test';
import assert from 'node:assert/strict';
import {CampusNav,CampusWorld} from '../campus-physics.js';

function world(){const w=new CampusWorld();w.add({x:1,y:-.5,z:0,sx:8,sy:1,sz:6});return w}
function nav(w){w.build();return new CampusNav(w,{x0:-2,x1:4,z0:-2,z1:2,clearY:.45})}

test('a sampled staircase can gain more than one step across a one metre edge',()=>{
  const w=world();
  for(let i=0;i<5;i++)w.add({x:.15+i*.3,y:(i+1)*.15/2,z:0,sx:.3,sy:(i+1)*.15,sz:2});
  const n=nav(w),a={x:-.25,y:.025,z:0},b={x:1.25,y:.775,z:0};
  assert.equal(n.canClimb(a,b),true);assert.equal(n.canClimb(b,a),true);
});

test('a desk and a parapet cannot be mistaken for small stairs',()=>{
  for(const height of [.72,1]){
    const w=world();w.add({x:1,y:height/2,z:0,sx:1,sy:height,sz:2});
    assert.equal(nav(w).canClimb({x:0,y:.025,z:0},{x:1,y:height+.025,z:0}),false);
  }
});

test('a low step remains usable when there is head clearance',()=>{
  const w=world();w.add({x:1,y:.25,z:0,sx:1,sy:.5,sz:2});
  assert.equal(nav(w).canClimb({x:0,y:.025,z:0},{x:1,y:.525,z:0}),true);
  w.add({x:1,y:2.2,z:0,sx:1,sy:.4,sz:2});
  assert.equal(nav(w).canClimb({x:0,y:.025,z:0},{x:1,y:.525,z:0}),false);
});

test('destroyed floors invalidate walking nodes and resetting restores them',()=>{
  const w=world(),floor=w.add({x:1,y:3.9,z:0,sx:3,sy:.2,sz:3});
  const n=nav(w),point={x:1,y:4.025,z:0};
  assert.equal(n.nodeSupported(point),true);
  floor.solid=false;w.structuralRevision=1;
  assert.equal(n.nodeSupported(point),false);
  floor.solid=true;w.structuralRevision=2;
  assert.equal(n.nodeSupported(point),true);
});
