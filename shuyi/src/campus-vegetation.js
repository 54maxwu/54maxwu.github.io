import * as THREE from 'three';

// 同一位置固定造型；不消耗遊戲或場景其他部分的亂數。
function randomAt(x,z){let s=(Math.imul(Math.round(x*100),73856093)^Math.imul(Math.round(z*100),19349663))>>>0;return()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296}}

export function foliageCluster(emit,x,y,z,r,{density=28,flatten=.8}={}){
  const rand=randomAt(x,z);
  // 輪廓由不規則、彼此重疊的小葉團形成，外緣再用鏤空葉叢打散。
  for(let i=0;i<7;i++){
    const angle=i*2.39996,spread=i?Math.sqrt(i/7)*r*.63:0;
    const g=new THREE.SphereGeometry(r*(.43+rand()*.18),6,4);
    const pos=g.attributes.position;
    for(let j=0;j<pos.count;j++){
      const k=.92+.1*Math.sin(pos.getX(j)*9+pos.getY(j)*7+pos.getZ(j)*11+i);
      pos.setXYZ(j,pos.getX(j)*k,pos.getY(j)*k,pos.getZ(j)*k);
    }
    g.scale(1,flatten,1);g.computeVertexNormals();
    g.translate(x+Math.cos(angle)*spread,y+(rand()-.4)*r*.26,z+Math.sin(angle)*spread);
    emit(i%3===0?'leaf':i%3===1?'leafLight':'leafDark',g);
  }
  for(let i=0;i<density;i++){
    const a=rand()*Math.PI*2,v=rand()*1.6-.65,ring=Math.sqrt(1-v*v);
    const g=new THREE.PlaneGeometry(r*(.38+rand()*.25),r*(.33+rand()*.28));
    g.rotateX(v-.15);g.rotateY(-a+Math.PI/2);g.rotateZ((rand()-.5)*.6);
    g.translate(x+Math.cos(a)*ring*r*.88,y+v*r*flatten,z+Math.sin(a)*ring*r*.88);
    emit('foliage',g);
  }
}

export function treeCrown(emit,x,z,h,r,low){
  const rand=randomAt(x,z),base=new THREE.Vector3(x,h*.39,z);
  for(let i=0;i<5;i++){
    const a=i*2.39996,end=new THREE.Vector3(x+Math.cos(a)*r*.6,h*(.6+rand()*.12),z+Math.sin(a)*r*.6);
    const axis=end.clone().sub(base),branch=new THREE.CylinderGeometry(.045*h/7,.11*h/7,axis.length(),6);
    branch.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),axis.clone().normalize()));
    branch.translate(...base.clone().add(end).multiplyScalar(.5).toArray());emit('bark',branch);
    foliageCluster(emit,end.x,end.y,end.z,r*(.55+rand()*.13),{density:low?9:22,flatten:.8});
  }
}
