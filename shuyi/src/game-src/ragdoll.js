import * as THREE from 'three';

// 固定步長的關節粒子與距離約束；碰撞使用場景實際 OBB。
export class Ragdoll {
  constructor(bones, world, direction, velocity, headshot) {
    this.bones = bones; this.world = world; this.acc = 0;
    this.nodes = bones.map(b => ({ p: b.getWorldPosition(new THREE.Vector3()), prev: new THREE.Vector3(), q: b.getWorldQuaternion(new THREE.Quaternion()), radius: /head/.test(b.name) ? 0.14 : /hips|chest/.test(b.name) ? 0.16 : 0.065 }));
    const dir = direction.clone(); if (dir.lengthSq() > 0) dir.normalize();
    this.nodes.forEach((n, i) => {
      const k = /head|chest|neck/.test(bones[i].name) ? (headshot ? 3.2 : 2.4) : 0.65;
      n.prev.copy(n.p).addScaledVector(velocity, -1 / 120).addScaledVector(dir, -k / 120);
    });
    this.links = []; this.children = bones.map(() => []);
    const add = (a,b) => { if (a >= 0 && b >= 0) this.links.push({a,b,len:this.nodes[a].p.distanceTo(this.nodes[b].p)}); };
    bones.forEach((b,i) => { const p = bones.indexOf(b.parent); if(p >= 0) {add(p,i); this.children[p].push(i);} });
    // 軀幹維持形狀，肘膝保留彎曲空間。
    for (const [a,b] of [['hips','chest'],['hips','shoulderR'],['hips','shoulderL'],['shoulderR','shoulderL'],['chest','head'],['thighR','thighL']]) add(bones.findIndex(x=>x.name===a),bones.findIndex(x=>x.name===b));
    this.axes = this.children.map((ch,i)=>ch.length ? this.nodes[ch[0]].p.clone().sub(this.nodes[i].p).normalize() : null);
  }
  collide(n) {
    const p=n.p,r=n.radius;
    const cs=this.world.query(p.x-r,p.z-r,p.x+r,p.z+r);
    for(const c of cs) {
      if(!c.solid || p.y+r<c.bottom || p.y-r>c.top) continue;
      const [x,z]=c.toLocal(p.x,p.z), y=p.y-c.y;
      const qx=Math.max(-c.hx,Math.min(c.hx,x)), qy=Math.max(-c.hy,Math.min(c.hy,y)), qz=Math.max(-c.hz,Math.min(c.hz,z));
      let dx=x-qx,dy=y-qy,dz=z-qz,dist=Math.hypot(dx,dy,dz);
      if(dist>=r) continue;
      let push;
      if(dist>1e-8) {push=r-dist;dx/=dist;dy/=dist;dz/=dist;}
      else {const gaps=[c.hx-Math.abs(x),c.hy-Math.abs(y),c.hz-Math.abs(z)];const a=gaps.indexOf(Math.min(...gaps));dx=a===0?(x<0?-1:1):0;dy=a===1?(y<0?-1:1):0;dz=a===2?(z<0?-1:1):0;push=r+gaps[a];}
      const [wx,wz]=c.toWorldDir(dx,dz);p.x+=wx*push;p.y+=dy*push;p.z+=wz*push;
      const v=p.clone().sub(n.prev),normal=new THREE.Vector3(wx,dy,wz),vn=v.dot(normal);
      v.addScaledVector(normal,-Math.min(0,vn)).multiplyScalar(0.72);n.prev.copy(p).sub(v);
    }
  }
  update(dt) {
    this.acc=Math.min(this.acc+dt,0.1);
    while(this.acc>=1/120) {
      this.acc-=1/120;
      for(const n of this.nodes) {const v=n.p.clone().sub(n.prev).multiplyScalar(0.997);n.prev.copy(n.p);n.p.add(v);n.p.y-=9.8/14400;}
      for(let it=0;it<10;it++) {
        for(const l of this.links) {const a=this.nodes[l.a].p,b=this.nodes[l.b].p,d=b.clone().sub(a),L=d.length();if(L>1e-8){d.multiplyScalar((L-l.len)/L*0.5);a.add(d);b.sub(d);}}
        for(const n of this.nodes)this.collide(n);
      }
    }
    const parentQ=new THREE.Quaternion(),desired=new THREE.Quaternion();
    this.bones.forEach((b,i)=>{
      b.parent.updateWorldMatrix(true,false);
      b.position.copy(b.parent.worldToLocal(this.nodes[i].p.clone()));
      const ch=this.children[i];desired.copy(this.nodes[i].q);
      if(ch.length){const d=this.nodes[ch[0]].p.clone().sub(this.nodes[i].p);if(d.lengthSq()>1e-10)desired.premultiply(new THREE.Quaternion().setFromUnitVectors(this.axes[i],d.normalize()));}
      b.parent.getWorldQuaternion(parentQ);b.quaternion.copy(parentQ.invert().multiply(desired));b.updateWorldMatrix(false,false);
    });
  }
}

