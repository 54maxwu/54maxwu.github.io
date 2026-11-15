import * as THREE from 'three';

// Keep the structural surface intact; reduce optional facade and foliage detail.
export class DistanceDetails {
  constructor(meshes){
    this.layers=[];this.elapsed=1;this.last=new THREE.Vector3(Infinity,Infinity,Infinity);
    for(const mesh of meshes){const kind=mesh.name.replace('real:','');
      if(!['foliage','flower','drain','lattice','waterRipple','shade'].includes(kind))continue;
      const geo=mesh.geometry,p=geo.attributes.position;if(geo.index||!p)continue;
      const bins=new Map();
      for(let i=0;i<p.count;i+=6){let x=0,z=0;const end=Math.min(i+6,p.count);for(let j=i;j<end;j++){x+=p.getX(j);z+=p.getZ(j);}x/=(end-i);z/=(end-i);
        const key=`${Math.floor(x/16)},${Math.floor(z/16)}`;
        if(!bins.has(key))bins.set(key,{x:Math.floor(x/16)*16+8,z:Math.floor(z/16)*16+8,full:[],simple:[]});
        const cell=bins.get(key),keep=(i/6)%3===0;
        for(let j=i;j<end;j++){cell.full.push(j);if(keep)cell.simple.push(j);}
      }
      const index=new THREE.BufferAttribute(new Uint32Array(p.count),1).setUsage(THREE.DynamicDrawUsage);
      for(let i=0;i<p.count;i++)index.array[i]=i;geo.setIndex(index);
      this.layers.push({geo,index,kind,bins:[...bins.values()]});
    }
  }
  update(dt,camera){this.elapsed+=dt;if(this.elapsed<.5||camera.position.distanceToSquared(this.last)<36)return;
    this.elapsed=0;this.last.copy(camera.position);
    for(const layer of this.layers){let n=0;
      for(const cell of layer.bins){const distance=Math.hypot(cell.x-this.last.x,cell.z-this.last.z);
        const indices=distance<55?cell.full:distance<110||layer.kind==='foliage'?cell.simple:[];
        layer.index.array.set(indices,n);n+=indices.length;
      }
      layer.geo.setDrawRange(0,n);layer.index.clearUpdateRanges();layer.index.addUpdateRange(0,n);layer.index.needsUpdate=true;
    }
  }
}
