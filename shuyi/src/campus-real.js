// 樹義國小 real-scale campus (metres). Replaces the Minecraft map as the game scene.
// Sources:
//  - Site, building outlines, courts: OpenStreetMap (ways 341801700, 1433684904, 1433684903,
//    783815368, 1433684905/6), converted to local metres around (24.1117N, 120.6570E).
//  - Room layout per floor and room names (堂號): official campus map, https://tanghao.neocities.org/
//  - Look (brick, grey bands, arcades, balconies, red-tile roofs, 化雨臺, 瑾瑜臺, 樂群樓, 鐘樓, 平安門…):
//    the 89 photos on the same site (reference/tanghao/image/view).
// Not survey data: floor heights, window counts and interior details are estimated from photos.
// Frame: x = east, y = up, OSM north n maps to z = -n.
import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {CampusNav} from './campus-physics.js';
import {buildLabels} from './campus-labels.js';

const FB=[0,4,7.6,11.2,14.8],FH=[4,3.6,3.6,3.6,3.6],ROOF=18.4,SLAB=0.25;   // floor bases / heights
const SITE={x0:-70,x1:71,n0:-70,n1:77};

// ---------- procedural textures ----------
function canvasTex(w,h,draw,{repeat=true}={}){const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');draw(g,w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;if(repeat)t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=8;return t}
const rnd=(()=>{let s=12345;return()=>(s=(s*16807)%2147483647)/2147483647})();
function noise(g,w,h,base,amp,n=6000,size=2){g.fillStyle=base;g.fillRect(0,0,w,h);for(let i=0;i<n;i++){const v=(rnd()-.5)*amp;g.fillStyle=`rgba(${v>0?255:0},${v>0?255:0},${v>0?255:0},${Math.abs(v)})`;g.fillRect(rnd()*w,rnd()*h,size,size)}}
const TEX={
  brick:()=>canvasTex(480,480,(g)=>{g.fillStyle='#cdbfae';g.fillRect(0,0,480,480);for(let r=0;r<12;r++)for(let c=-1;c<5;c++){const x=c*120+(r%2?60:0),y=r*40,k=rnd();g.fillStyle=`rgb(${176+k*28|0},${92+k*22|0},${72+k*16|0})`;g.fillRect(x+3,y+3,114,34);for(let i=0;i<40;i++){g.fillStyle=`rgba(80,30,20,${rnd()*.12})`;g.fillRect(x+3+rnd()*110,y+3+rnd()*30,3,3)}}}),
  stone:()=>canvasTex(256,256,(g,w,h)=>noise(g,w,h,'#b9b5ab',.18,5000,2)),
  granite:()=>canvasTex(256,256,(g,w,h)=>noise(g,w,h,'#8e8c86',.3,7000,2)),
  terrazzo:()=>canvasTex(256,256,(g,w,h)=>{noise(g,w,h,'#d3c8b8',.12,2000,2);for(let i=0;i<900;i++){g.fillStyle=['#8b7d6b','#efe8dc','#a35f4d','#6f6f6a'][i%4];g.fillRect(rnd()*w,rnd()*h,3,3)}}),
  quarry:()=>canvasTex(256,256,(g)=>{g.fillStyle='#8f5a48';g.fillRect(0,0,256,256);for(let r=0;r<4;r++)for(let c=0;c<4;c++){const k=rnd();g.fillStyle=`rgb(${160+k*25|0},${88+k*15|0},${70+k*10|0})`;g.fillRect(c*64+2,r*64+2,60,60)}}),
  plaster:()=>canvasTex(256,256,(g,w,h)=>noise(g,w,h,'#e8e3d8',.06,2000,3)),
  concrete:()=>canvasTex(256,256,(g,w,h)=>noise(g,w,h,'#bdb8ae',.12,3000,3)),
  roof:()=>canvasTex(256,256,(g)=>{g.fillStyle='#7a2a1e';g.fillRect(0,0,256,256);for(let r=0;r<8;r++)for(let c=0;c<8;c++){const k=rnd();g.fillStyle=`rgb(${168+k*30|0},${62+k*14|0},${44+k*10|0})`;g.fillRect(c*32+1,r*32+3,30,27);g.fillStyle='rgba(0,0,0,.18)';g.fillRect(c*32+1,r*32+24,30,6)}}),
  grass:()=>canvasTex(256,256,(g,w,h)=>{noise(g,w,h,'#5f8240',.22,9000,2)}),
  lawn:()=>canvasTex(256,256,(g,w,h)=>{noise(g,w,h,'#5e8a3c',.28,12000,2)}),
  asphalt:()=>canvasTex(256,256,(g,w,h)=>noise(g,w,h,'#55534f',.2,7000,2)),
  pave:()=>canvasTex(256,256,(g)=>{g.fillStyle='#9d968a';g.fillRect(0,0,256,256);for(let r=0;r<8;r++)for(let c=0;c<4;c++){const k=rnd();g.fillStyle=`rgb(${176+k*20|0},${170+k*18|0},${158+k*16|0})`;g.fillRect(c*64+(r%2?32:0)+1,r*32+1,62,30)}}),
  wood:()=>canvasTex(256,256,(g,w,h)=>{noise(g,w,h,'#a77a4b',.15,3000,2);for(let i=0;i<40;i++){g.fillStyle='rgba(70,40,20,.15)';g.fillRect(0,rnd()*h,w,1)}}),
  board:()=>canvasTex(128,128,(g,w,h)=>noise(g,w,h,'#2d4a3b',.1,800,2)),
  leaf:()=>canvasTex(128,128,(g,w,h)=>noise(g,w,h,'#3f6e2f',.35,4000,3)),
  bark:()=>canvasTex(128,128,(g,w,h)=>noise(g,w,h,'#5b4a3a',.3,2000,2)),
  pebble:()=>canvasTex(256,256,(g)=>{g.fillStyle='#8c8577';g.fillRect(0,0,256,256);for(let i=0;i<500;i++){const k=rnd();g.fillStyle=`rgb(${150+k*80|0},${145+k*75|0},${135+k*70|0})`;g.beginPath();g.ellipse(rnd()*256,rnd()*256,4+rnd()*5,3+rnd()*4,rnd()*3,0,7);g.fill()}}),
};
function makeMaterials(){
  const std=(tex,rough=.85,o={})=>new THREE.MeshStandardMaterial({map:tex?TEX[tex]():null,roughness:rough,metalness:0,...o});
  return {
    brick:{m:std('brick',.9),s:1,col:'concrete'}, stone:{m:std('stone',.8),s:1.5,col:'concrete'}, granite:{m:std('granite',.7),s:1.5,col:'concrete'},
    terrazzo:{m:std('terrazzo',.55),s:2,col:'concrete'}, quarry:{m:std('quarry',.75),s:1.2,col:'concrete'}, plaster:{m:std('plaster',.95),s:2,col:'concrete'},
    concrete:{m:std('concrete',.9),s:3,col:'concrete'}, roof:{m:std('roof',.7),s:1.6,col:'concrete'}, grass:{m:std('grass',1),s:4,col:'concrete'},
    lawn:{m:std('lawn',1),s:3,col:'concrete'}, asphalt:{m:std('asphalt',.95),s:5,col:'concrete'}, pave:{m:std('pave',.85),s:2,col:'concrete'},
    wood:{m:std('wood',.7),s:1.5,col:'wood'}, board:{m:std('board',.6),s:2,col:'wood'}, leaf:{m:std('leaf',1,{side:THREE.DoubleSide}),s:2,col:null},
    bark:{m:std('bark',1),s:1,col:'wood'}, pebble:{m:std('pebble',1),s:1.5,col:'concrete'},
    green:{m:std(null,.5,{color:'#2f6b4f'}),s:1,col:'metal'}, white:{m:std(null,.8,{color:'#eeeae2'}),s:1,col:'concrete'},
    beige:{m:std('plaster',.9,{color:'#e9d9b6'}),s:2,col:'concrete'}, metal:{m:std(null,.4,{color:'#8a9095',metalness:.6}),s:1,col:'metal'},
    glass:{m:new THREE.MeshStandardMaterial({color:'#8fb6bd',roughness:.08,metalness:.2,transparent:true,opacity:.38,depthWrite:false}),s:1,col:'glass'},
    water:{m:new THREE.MeshStandardMaterial({color:'#3f6f78',roughness:.05,metalness:.1,transparent:true,opacity:.82}),s:1,col:null},
    red:{m:std(null,.6,{color:'#b0322a'}),s:1,col:'metal'}, blue:{m:std(null,.6,{color:'#2c5aa0'}),s:1,col:'metal'}, yellow:{m:std(null,.6,{color:'#e2b33c'}),s:1,col:'metal'},
  };
}

// ---------- geometry + collider builder ----------
class Builder{
  constructor(world,scene){this.world=world;this.scene=scene;this.M=makeMaterials();this.buf={};this.extra={};this.boxes=0}
  arr(k){return this.buf[k]||(this.buf[k]={p:[],n:[],u:[]})}
  quad(k,a,b,c,d,nrm,uvs){const B=this.arr(k);for(const i of [0,1,2,0,2,3]){const v=[a,b,c,d][i];B.p.push(v[0],v[1],v[2]);B.n.push(...nrm);B.u.push(...uvs[i])}}
  // world box: x0..x1, y0..y1, n0..n1 (north). opts: col (false|object), faces
  box(k,x0,x1,y0,y1,n0,n1,col=true){
    if(x1<x0)[x0,x1]=[x1,x0];if(n1<n0)[n0,n1]=[n1,n0];if(y1<y0)[y0,y1]=[y1,y0];if(x1-x0<1e-3||y1-y0<1e-3||n1-n0<1e-3)return;
    const z0=-n1,z1=-n0,s=this.M[k].s,U=v=>v/s;this.boxes++;
    this.quad(k,[x1,y0,z1],[x1,y0,z0],[x1,y1,z0],[x1,y1,z1],[1,0,0],[[U(-z1),U(y0)],[U(-z0),U(y0)],[U(-z0),U(y1)],[U(-z1),U(y1)]]);
    this.quad(k,[x0,y0,z0],[x0,y0,z1],[x0,y1,z1],[x0,y1,z0],[-1,0,0],[[U(z0),U(y0)],[U(z1),U(y0)],[U(z1),U(y1)],[U(z0),U(y1)]]);
    this.quad(k,[x0,y1,z1],[x1,y1,z1],[x1,y1,z0],[x0,y1,z0],[0,1,0],[[U(x0),U(-z1)],[U(x1),U(-z1)],[U(x1),U(-z0)],[U(x0),U(-z0)]]);
    this.quad(k,[x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1],[0,-1,0],[[U(x0),U(z0)],[U(x1),U(z0)],[U(x1),U(z1)],[U(x0),U(z1)]]);
    this.quad(k,[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1],[0,0,1],[[U(x0),U(y0)],[U(x1),U(y0)],[U(x1),U(y1)],[U(x0),U(y1)]]);
    this.quad(k,[x1,y0,z0],[x0,y0,z0],[x0,y1,z0],[x1,y1,z0],[0,0,-1],[[U(-x1),U(y0)],[U(-x0),U(y0)],[U(-x0),U(y1)],[U(-x1),U(y1)]]);
    const kind=this.M[k].col;if(col&&kind)this.collide(x0,x1,y0,y1,n0,n1,kind,typeof col==='object'?col:{});
  }
  collide(x0,x1,y0,y1,n0,n1,kind='concrete',o={}){
    const base=kind==='glass'?{mat:'mesh',bullet:'pen',sight:false}:kind==='wood'?{mat:'wood',bullet:'pen',surface:'wood'}:kind==='metal'?{mat:'metal',bullet:'pass',sight:false}:{mat:'concrete',surface:'concrete'};
    this.world.add({x:(x0+x1)/2,y:(y0+y1)/2,z:-(n0+n1)/2,sx:x1-x0,sy:y1-y0,sz:n1-n0,...base,...o});
  }
  geo(k,g){(this.extra[k]||(this.extra[k]=[])).push(g.index?g.toNonIndexed():g)}
  finish(scene,shadows){
    const meshes=[];let faces=0;
    for(const k of new Set([...Object.keys(this.buf),...Object.keys(this.extra)])){
      const parts=[];const B=this.buf[k];
      if(B&&B.p.length){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(B.p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(B.n,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(B.u,2));parts.push(g)}
      for(const g of this.extra[k]||[]){for(const a of Object.keys(g.attributes))if(!['position','normal','uv'].includes(a))g.deleteAttribute(a);if(!g.attributes.uv)g.setAttribute('uv',new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count*2),2));parts.push(g)}
      const geo=parts.length>1?mergeGeometries(parts):parts[0];const mesh=new THREE.Mesh(geo,this.M[k].m);
      mesh.castShadow=shadows&&!['glass','water','grass','lawn','asphalt','pave','quarry','terrazzo'].includes(k);mesh.receiveShadow=shadows&&k!=='glass';
      mesh.name='real:'+k;scene.add(mesh);meshes.push(mesh);faces+=geo.attributes.position.count/3;
    }
    return {meshes,facesCount:faces};
  }
}

// Shapes in a vertical plane -> extruded geometry placed in world.
// plane 'x': shape (u=x, v=y) extruded along -n (thickness), at north coordinate n.
function placedExtrude(shape,depth,{plane='x',at=0,scale=1}){
  const g=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:false,curveSegments:16,UVGenerator:{
    generateTopUV:(geo,v,a,b,c)=>[new THREE.Vector2(v[a*3]/scale,v[a*3+1]/scale),new THREE.Vector2(v[b*3]/scale,v[b*3+1]/scale),new THREE.Vector2(v[c*3]/scale,v[c*3+1]/scale)],
    generateSideWallUV:(geo,v,a,b,c,d)=>{const f=i=>new THREE.Vector2((v[i*3]+v[i*3+2])/scale,v[i*3+1]/scale);return[f(a),f(b),f(c),f(d)]}}});
  if(plane==='x'){g.translate(0,0,-at-depth)}            // shape in x/y, spans z = -at-depth .. -at  (n = at .. at+depth)
  else{g.rotateY(Math.PI/2);g.translate(at,0,0)}           // plane 'n': shape u -> -z? (u = -z = n), spans x = at .. at+depth
  return g;
}
// Spandrel above an arch (rect from springY to topY minus a half-ellipse) of span a0..a1.
function archShape(a0,a1,spring,rise,top){const s=new THREE.Shape(),cx=(a0+a1)/2,rx=(a1-a0)/2;s.moveTo(a0,spring);s.lineTo(a0,top);s.lineTo(a1,top);s.lineTo(a1,spring);s.absellipse(cx,spring,rx,rise,0,Math.PI,false);return s}

// ---------- building bar (corridor on courtyard side, rooms behind) ----------
// toW(u,w) -> [x,n]. w=0 courtyard face, w=D outer face. Corridor w 0..3.
function bar(B,o){
  const {u0,u1,D,toW,segs,open,ends={}}=o,COR=3;
  const lb=(k,a0,a1,y0,y1,w0,w1,col=true)=>{const p=toW(a0,w0),q=toW(a1,w1);B.box(k,p[0],q[0],y0,y1,p[1],q[1],col)};
  const isOpen=u=>open.some(([a,b])=>u>=a-1e-6&&u<=b+1e-6);
  const rooms=[];
  for(let f=0;f<5;f++){
    const yb=FB[f],h=FH[f],yt=f<4?FB[f+1]:ROOF,ceil=yt-SLAB,S=segs(f);
    for(const s of S){
      const [a0,a1]=[s.a0,s.a1],stair=s.type==='stair',pass=s.type==='passage'&&f===0,voidAbove=s.void;
      if(s.name&&!['stair','toilet','lift','void','passage','open'].includes(s.type)){const cat=roomCategory(s);rooms.push({name:s.name,cls:s.cls,cat,floor:f+1,a0,a1});
        if(o.corFace&&B.scene){const L0=a1-a0,du=L0>5?a0+.4+.85:(a0+a1)/2,p=toW(du,COR-.03),[base,paren]=s.name.split(/[（(]/),C=CAT[cat];
          plaque(B.scene,base,{x:p[0],y:yb+2.62,n:p[1],w:1.5,h:.46,face:o.corFace,bg:C.bg,fg:C.fg,sub:s.cls||(paren||'').replace(/[）)]/g,''),subSize:.34,mainSize:.42,font:'"Microsoft JhengHei",sans-serif'})}}
      // floor
      if(f===0){if(!pass)lb(s.type==='open'?'quarry':'terrazzo',a0,a1,0,.05,0,D)}
      else if(!voidAbove){if(stair){lb('concrete',a0,a1,yb-SLAB,yb,0,4.6);lb('concrete',a0,a1,yb-SLAB,yb,9.8,D);lb('terrazzo',a0,a1,yb,yb+.02,0,4.6,false)}
        else{lb('concrete',a0,a1,yb-SLAB,yb,0,D);lb('terrazzo',a0,a1,yb,yb+.02,0,D,false)}}
      // corridor-side room wall (w=3)
      if(!stair&&!pass&&s.type!=='open'&&s.type!=='void'){
        const L=a1-a0,DW=1.7,doors=L>5?[a0+.4,a1-.4-DW]:[a0+(L-DW)/2];let cuts=[];for(const d of doors)cuts.push([d,d+DW,0,2.3]);
        if(L>5)cuts.push([a0+2.5,a1-2.5,1.0,2.3]);
        wallU(lb,'brick',a0,a1,yb,ceil,COR,COR+.1,cuts,'glass');wallU(lb,'plaster',a0,a1,yb,ceil,COR+.1,COR+.2,cuts,false);
      }
      // outer wall (w = D-.3 .. D) with windows / openings
      const L=a1-a0;let cuts=[];
      if(pass)cuts=[[a0+.4,a1-.4,0,3.3]];
      else if(s.type==='open')cuts=[[a0+.6,a1-.6,0,3.0]];
      else if(stair)cuts=[[a0+L/2-.6,a0+L/2+.6,h/2+.6,h/2+2.0]];
      else if(s.type==='toilet')cuts=[[a0+L/2-.6,a0+L/2+.6,1.8,2.6]];
      else if(s.type==='lift')cuts=[];
      else if(voidAbove&&s.panel)cuts=[];
      else{const n=Math.max(1,Math.round(L/3.4));for(let i=0;i<n;i++){const c=a0+L*(i+.5)/n;cuts.push([c-1.1,c+1.1,.9,2.6])}}
      if(s.panel&&f>=2){lb('beige',a0+.4,a1-.4,yb,yt,D,D+.12)}
      wallU(lb,'brick',a0,a1,yb,ceil,D-.3,D,cuts,'glass');
      // balcony in front of the first window of classrooms (upper floors)
      if(f>=1&&s.type==='class'&&cuts.length){const [c0,c1]=cuts[0];lb('concrete',c0-.3,c1+.3,yb-SLAB,yb,D,D+1.2);lb('brick',c0-.3,c1+.3,yb,yb+1.0,D+1.0,D+1.2);lb('brick',c0-.3,c0-.1,yb,yb+1.0,D,D+1.2);lb('brick',c1+.1,c1+.3,yb,yb+1.0,D,D+1.2);lb('stone',c0-.35,c1+.35,yb+1.0,yb+1.1,D+.95,D+1.25,false);lb('green',c0-.3,c1+.3,yb+1.1,yb+1.14,D+1.08,D+1.12,false)}
      // partitions at segment ends (plaster)
      if(!pass&&s.type!=='open')for(const e of [a0,a1])if(Math.abs(e-u0)>.01&&Math.abs(e-u1)>.01)lb('plaster',e-.1,e+.1,yb,ceil,COR,D-.3);
      // classroom furnishing
      if(s.type==='class'&&!voidAbove){lb('board',a0+.9,a1-.9,yb+.9,yb+2.1,COR+.2,COR+.25,false);
        for(let r=0;r<5;r++)for(let c=0;c<6;c++){const uu=a0+1.2+(L-2.4)*(c+.5)/6,ww=COR+2.2+r*((D-COR-3.4)/5);if(ww>D-.9)continue;lb('wood',uu-.32,uu+.32,yb,yb+.72,ww-.22,ww+.22);lb('wood',uu-.2,uu+.2,yb,yb+.45,ww+.35,ww+.7,false)}}
      if(stair)stairs(lb,a0,a1,yb,yt,f);
    }
    // courtyard face (w = 0): arcade on the ground floor, parapets + piers above
    const cuts=[...new Set(segs(1).flatMap(s=>[s.a0,s.a1]))].sort((a,b)=>a-b);const piers=[];
    for(let i=0;i<cuts.length-1;i++){const a=cuts[i],b=cuts[i+1],n=Math.max(1,Math.round((b-a)/3.6));for(let k=0;k<=n;k++)piers.push(a+(b-a)*k/n)}
    const P=[...new Set(piers.map(p=>+p.toFixed(3)))].sort((a,b)=>a-b);
    for(let i=0;i<P.length;i++){
      const p=P[i];if(isOpen(p))lb('brick',p-.28,p+.28,yb,ceil,0,.5);
      if(i===P.length-1)break;const a=P[i]+.28,b=P[i+1]-.28;if(b<=a)continue;
      if(!isOpen((a+b)/2)){const j=(o.junction||[]).find(([j0,j1])=>a<j1&&b>j0);wallU(lb,'brick',a-.28,b+.28,yb,ceil,0,.3,j?[[Math.max(a,j[0]),Math.min(b,j[1]),0,2.6]]:[],false);continue}
      if(f===0){const top=ceil,spring=2.5,rise=Math.min(.9,(b-a)/2);lb('brick',a,b,spring+rise,top,0,.5);
        B.geo('brick',placedExtrude(archShape(a,b,spring,rise,spring+rise+.01),.5,{plane:o.plane,at:o.faceAt}))}
      else if((o.bridges||[]).some(([j0,j1])=>a<j1&&b>j0)){lb('brick',a,b,ceil-.45,ceil,0,.3)}
      else{lb('brick',a,b,yb,yb+.95,0,.3);lb('stone',a-.02,b+.02,yb+.95,yb+1.05,-.06,.36,false);lb('green',a,b,yb+1.05,yb+1.1,.12,.18,false);for(let x=a+.6;x<b;x+=1.2)lb('green',x-.03,x+.03,yb+1.05,yb+1.1,.12,.18,false);lb('brick',a,b,ceil-.45,ceil,0,.3)}
    }
    // grey stone bands at every slab (both faces)
    if(f>=1){lb('stone',u0,u1,yb-SLAB-.05,yb+.12,D,D+.08,false);lb('stone',u0,u1,yb-SLAB-.05,yb+.12,-.08,0,false)}
  }
  // roof slab, parapets, stair penthouses
  const S=segs(4);
  for(const s of S){if(s.type==='stair'){lb('concrete',s.a0,s.a1,ROOF-SLAB,ROOF,0,4.6);lb('concrete',s.a0,s.a1,ROOF-SLAB,ROOF,9.8,D);penthouse(B,lb,s.a0,s.a1,toW)}else lb('concrete',s.a0,s.a1,ROOF-SLAB,ROOF,0,D)}
  lb('stone',u0,u1,ROOF-SLAB-.05,ROOF+.12,D,D+.08,false);lb('stone',u0,u1,ROOF-SLAB-.05,ROOF+.12,-.08,0,false);
  lb('brick',u0,u1,ROOF,ROOF+1.0,D-.3,D);lb('brick',u0,u1,ROOF,ROOF+1.0,0,.3);lb('stone',u0,u1,ROOF+1.0,ROOF+1.1,D-.35,D+.05,false);lb('stone',u0,u1,ROOF+1.0,ROOF+1.1,-.05,.35,false);
  // end walls
  for(const [e,kind] of [[u0,ends.u0],[u1,ends.u1]]){if(kind==='none')continue;const s0=e===u0?e:e-.3,s1=s0+.3;
    for(let f=0;f<5;f++){const yb=FB[f],yt=f<4?FB[f+1]:ROOF;const win=[[D-4,D-2,.9,2.6]],cuts=kind==='corridor'?[[.3,2.7,0,2.4],...win]:f===0?[[.4,2.6,0,2.6],...win]:[[1,2.2,1,2.4],...win];wallW(lb,'brick',s0,s1,yb,yt-SLAB,0,D,cuts,'glass')}
    lb('brick',s0,s1,ROOF,ROOF+1,0,D)}
  return rooms;
}
// Wall in the u direction (constant w range) with rectangular cuts [a0,a1,v0,v1] relative to yb.
function wallU(lb,k,u0,u1,yb,yt,w0,w1,cuts,glass){
  const xs=[u0,u1];for(const c of cuts){xs.push(Math.max(u0,c[0]),Math.min(u1,c[1]))}const X=[...new Set(xs)].sort((a,b)=>a-b);
  for(let i=0;i<X.length-1;i++){const a=X[i],b=X[i+1];if(b-a<1e-3)continue;const holes=cuts.filter(c=>c[0]<=a+1e-6&&c[1]>=b-1e-6).map(c=>[yb+c[2],yb+c[3]]).sort((p,q)=>p[0]-q[0]);
    let y=yb;for(const [h0,h1] of holes){if(h0>y)lb(k,a,b,y,h0,w0,w1);y=Math.max(y,h1)}if(yt>y)lb(k,a,b,y,yt,w0,w1)}
  if(glass)for(const c of cuts)if(c[2]>0.5){lb('glass',c[0],c[1],yb+c[2],yb+c[3],(w0+w1)/2-.02,(w0+w1)/2+.02);lb('green',c[0],c[1],yb+c[2]-.05,yb+c[2],w0-.02,w1+.02,false);lb('green',c[0],c[1],yb+c[3],yb+c[3]+.05,w0-.02,w1+.02,false);lb('green',(c[0]+c[1])/2-.03,(c[0]+c[1])/2+.03,yb+c[2],yb+c[3],(w0+w1)/2-.05,(w0+w1)/2+.05,false)}
}
function wallW(lb,k,u0,u1,yb,yt,w0,w1,cuts,glass){ // wall at constant u range, cuts along w
  const ws=[w0,w1];for(const c of cuts)ws.push(Math.max(w0,c[0]),Math.min(w1,c[1]));const X=[...new Set(ws)].sort((a,b)=>a-b);
  for(let i=0;i<X.length-1;i++){const a=X[i],b=X[i+1];if(b-a<1e-3)continue;const holes=cuts.filter(c=>c[0]<=a+1e-6&&c[1]>=b-1e-6).map(c=>[yb+c[2],yb+c[3]]).sort((p,q)=>p[0]-q[0]);
    let y=yb;for(const [h0,h1] of holes){if(h0>y)lb(k,u0,u1,y,h0,a,b);y=Math.max(y,h1)}if(yt>y)lb(k,u0,u1,y,yt,a,b)}
  if(glass)for(const c of cuts)if(c[2]>0.5)lb('glass',(u0+u1)/2-.02,(u0+u1)/2+.02,yb+c[2],yb+c[3],c[0],c[1]);
}
// Dog-leg stair inside a stair segment: flight A (first half of u) w 4.6->8.2, mid landing w 8.2..9.8, flight B back to w 4.6.
function stairs(lb,a0,a1,yb,yt,f){
  const h=yt-yb,mid=(a0+a1)/2,steps=12,rise=h/2/steps,run=3.6/steps;
  for(let i=0;i<steps;i++){const t=yb+(i+1)*rise;lb('terrazzo',a0+.15,mid-.08,t-.35,t,4.6+i*run,4.6+(i+1)*run);
    const t2=yb+h/2+(i+1)*rise;lb('terrazzo',mid+.08,a1-.15,t2-.35,t2,8.2-(i+1)*run,8.2-i*run)}
  lb('concrete',a0+.1,a1-.1,yb+h/2-SLAB,yb+h/2,8.2,9.8);
  lb('plaster',mid-.08,mid+.08,yb,yt-SLAB,4.9,8.2);                     // wall between flights
  lb('green',mid-.04,mid+.04,yt-SLAB+.9,yt-SLAB+.95,3.4,4.6,false);       // rail at landing
  lb('plaster',a0,a1,yb,yt-SLAB,9.8,10);                                  // storage wall
}
function penthouse(B,lb,a0,a1,toW){const y0=ROOF,y1=ROOF+3;lb('brick',a0,a0+.25,y0,y1,3,9.8);lb('brick',a1-.25,a1,y0,y1,3,9.8);lb('brick',a0,a1,y0,y1,9.6,9.8);wallU(lb,'brick',a0,a1,y0,y1,3,3.25,[[a0+(a1-a0)/2-.9,a0+(a1-a0)/2+.9,0,2.3]],false);lb('concrete',a0-.3,a1+.3,y1,y1+.2,2.7,10.1);
  const p=toW(a0-.4,2.6),q=toW(a1+.4,10.2);hipRoof(B,Math.min(p[0],q[0]),Math.max(p[0],q[0]),y1+.2,Math.min(p[1],q[1]),Math.max(p[1],q[1]),1.6)}
// Hip / gable roofs as smooth geometry (red tile). Ridge along the longer side.
function hipRoof(B,x0,x1,y,n0,n1,rise,{gable=false,upturn=0}={}){
  const z0=-n1,z1=-n0,cx=(x0+x1)/2,cz=(z0+z1)/2,alongX=(x1-x0)>=(z1-z0),hw=alongX?(z1-z0)/2:(x1-x0)/2,top=y+rise;
  const up=(x,z)=>{if(!upturn)return 0;const ex=Math.min(x-x0,x1-x)/(x1-x0)*2,ez=Math.min(z-z0,z1-z)/(z1-z0)*2;return upturn*Math.pow(1-Math.min(ex,ez),3)};
  const C=[[x0,y,z0],[x1,y,z0],[x1,y,z1],[x0,y,z1]].map(c=>[c[0],c[1]+up(c[0],c[2]),c[2]]);
  const r0=alongX?[gable?x0:x0+hw,top,cz]:[cx,top,gable?z0:z0+hw],r1=alongX?[gable?x1:x1-hw,top,cz]:[cx,top,gable?z1:z1-hw];
  const mk=(k,tris)=>{const P=[],U=[];for(const t of tris)for(const v of [...t,t[0],t[2],t[1]].slice(0,6)){}for(const [a,b,c] of tris){for(const v of [a,b,c,a,c,b]){P.push(...v);U.push((v[0]+v[2])/1.6,v[1]/1.6)}}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(U,2));g.computeVertexNormals();B.geo(k,g)};
  const quad=(a,b,c,d)=>[[a,b,c],[a,c,d]];
  const slopes=alongX?[...quad(C[0],C[1],r1,r0),...quad(C[2],C[3],r0,r1)]:[...quad(C[1],C[2],r1,r0),...quad(C[3],C[0],r0,r1)];
  const endTris=alongX?[[C[3],C[0],r0],[C[1],C[2],r1]]:[[C[0],C[1],r0],[C[2],C[3],r1]];
  mk('roof',gable?slopes:[...slopes,...endTris]);if(gable)mk('brick',endTris);
}
// Trees
function tree(B,x,n,{h=7,r=3,kind='round'}={}){
  const z=-n;const trunk=new THREE.CylinderGeometry(.18*h/7,.28*h/7,h*.55,7);trunk.translate(x,h*.275,z);B.geo('bark',trunk);B.collide(x-.25,x+.25,0,h*.5,n-.25,n+.25,'wood');
  if(kind==='palm'){for(let i=0;i<7;i++){const leaf=new THREE.ConeGeometry(.35,2.6,4);leaf.rotateZ(Math.PI/2.4);leaf.rotateY(i/7*Math.PI*2);leaf.translate(x,h*.55+.3,z);B.geo('leaf',leaf)}return}
  if(kind==='cone'){const c=new THREE.ConeGeometry(r*.6,h*.75,9);c.translate(x,h*.6,z);B.geo('leaf',c);return}
  for(let i=0;i<5;i++){const s=new THREE.IcosahedronGeometry(r*(.55+rnd()*.25),1);s.translate(x+(rnd()-.5)*r*.9,h*.62+(rnd()-.3)*r*.6,z+(rnd()-.5)*r*.9);B.geo('leaf',s)}
}

// Room categories as in the 115學年度 allocation map legend: 班級教室 / 行政辦公室 / 專科教室 / 教學服務空間.
const CAT={班級教室:{bg:'#f7f4ec',fg:'#1d1d1d'},行政辦公室:{bg:'#2f58a6',fg:'#ffffff'},專科教室:{bg:'#b7322a',fg:'#ffffff'},教學服務空間:{bg:'#2e7a4c',fg:'#ffffff'}};
function roomCategory(s){if(s.cls)return '班級教室';const n=s.name;if(/處|辦公|校長|雅舍|主控|網管|準備|健康中心|輔導室|人事|諮商|警衛/.test(n))return '行政辦公室';if(/教室|美術|音樂|資訊|語言|視聽|彩虹班/.test(n))return '專科教室';return '教學服務空間'}
// Name plaque: text on a board. face: 'n'|'s'|'e'|'w' = outward normal.
function plaque(scene,text,{x,y,n,w,h,face,bg='#d9d2c3',fg='#7a2418',font='"DFKai-SB","KaiTi","Microsoft JhengHei",serif',sub='',subSize=.16,mainSize=null}){const c=document.createElement('canvas'),R=128;c.width=Math.round(w*R);c.height=Math.round(h*R);const g=c.getContext('2d');g.fillStyle=bg;g.fillRect(0,0,c.width,c.height);g.strokeStyle='rgba(60,40,30,.5)';g.lineWidth=6;g.strokeRect(6,6,c.width-12,c.height-12);g.fillStyle=fg;g.textAlign='center';g.textBaseline='middle';const fs=Math.min(c.height*(mainSize||(sub?.5:.7)),c.width*.9/Math.max(1,text.length));g.font=`bold ${fs}px ${font}`;g.fillText(text,c.width/2,c.height*(sub?.36:.53));if(sub){g.font=`bold ${Math.min(c.height*subSize,c.width*.95/Math.max(1,sub.length*(/[\u4e00-\u9fff]/.test(sub)?1:.55)))}px "Microsoft JhengHei",Arial,sans-serif`;g.fillText(sub,c.width/2,c.height*.78)}const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map:t,roughness:.8}));m.position.set(x,y,-n);m.rotation.y={s:0,n:Math.PI,e:Math.PI/2,w:-Math.PI/2}[face];scene.add(m);return m}

// ---------- big ground canvas (field, track, courts) ----------
function groundTexture(){const S=6,W=(SITE.x1-SITE.x0)*S,H=(SITE.n1-SITE.n0)*S;const c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d');
  const X=x=>(x-SITE.x0)*S,Y=n=>(SITE.n1-n)*S;noise(g,W,H,'#5f8240',.2,40000,3);
  // running track (oval around the two basketball courts) + sprint lanes in front of 化雨臺
  const cx=X(-13),cy=Y(46.6),half=17*S;const lane=(r,col,lw)=>{g.strokeStyle=col;g.lineWidth=lw;g.beginPath();g.moveTo(cx-half,cy-r);g.lineTo(cx+half,cy-r);g.arc(cx+half,cy,r,-Math.PI/2,Math.PI/2);g.lineTo(cx-half,cy+r);g.arc(cx-half,cy,r,Math.PI/2,Math.PI*1.5);g.stroke()};
  lane(16*S,'#b5523c',6.2*S);for(let i=0;i<=5;i++)lane((13+i*1.22)*S,'#f2efe6',2);
  g.fillStyle='#b5523c';g.fillRect(X(-45),Y(13.5),70*S,5.5*S);g.fillStyle='#f2efe6';for(let i=0;i<=4;i++)g.fillRect(X(-45),Y(13.5)+i*1.22*S,70*S,2);
  for(const [x0,x1] of [[-30.7,-16.2],[-10.5,4.5]]){g.fillStyle='#3f7d5a';g.fillRect(X(x0),Y(59.7),(x1-x0)*S,26.2*S);g.fillStyle='#2f5f9a';g.fillRect(X(x0)+1.5*S,Y(59.7)+1.5*S,(x1-x0-3)*S,23.2*S);g.strokeStyle='#f4f1e8';g.lineWidth=2;g.strokeRect(X(x0)+1.5*S,Y(59.7)+1.5*S,(x1-x0-3)*S,23.2*S);const mx=X((x0+x1)/2);g.beginPath();g.moveTo(X(x0)+1.5*S,Y(46.6));g.lineTo(X(x1)-1.5*S,Y(46.6));g.stroke();g.beginPath();g.arc(mx,Y(46.6),1.8*S,0,7);g.stroke();for(const yy of [Y(59.7)+1.5*S,Y(33.5)-1.5*S]){g.beginPath();g.arc(mx,yy,6.75*S,yy<Y(46.6)?0:Math.PI,yy<Y(46.6)?Math.PI:Math.PI*2);g.stroke()}}
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t}

// ---------- campus ----------
export async function buildRealCampus(scene,world,renderer,progress,{quality='medium'}={}){
  const B=new Builder(world,scene),shadows=quality!=='low';const tick=async m=>{progress.textContent=m;await new Promise(requestAnimationFrame)};
  await tick('建立實景校園：地面與操場');
  // ground (single collider) + field texture plane
  B.collide(SITE.x0-40,SITE.x1+40,-2,0,SITE.n0-40,SITE.n1+40,'concrete');
  const gplane=new THREE.Mesh(new THREE.PlaneGeometry(SITE.x1-SITE.x0,SITE.n1-SITE.n0),new THREE.MeshStandardMaterial({map:groundTexture(),roughness:1}));gplane.rotation.x=-Math.PI/2;gplane.position.set((SITE.x0+SITE.x1)/2,0,-(SITE.n0+SITE.n1)/2);gplane.receiveShadow=shadows;scene.add(gplane);
  // outside: sidewalks, streets
  B.box('pave',SITE.x0-4,SITE.x1+4,-.02,.06,SITE.n1,SITE.n1+4,false);B.box('pave',SITE.x0-4,SITE.x1+4,-.02,.06,SITE.n0-4,SITE.n0,false);B.box('pave',SITE.x0-4,SITE.x0,-.02,.06,SITE.n0,SITE.n1,false);B.box('pave',SITE.x1,SITE.x1+4,-.02,.06,SITE.n0,SITE.n1,false);
  B.box('asphalt',SITE.x0-14,SITE.x1+14,-.03,.01,SITE.n1+4,SITE.n1+12,false);B.box('asphalt',SITE.x0-14,SITE.x1+14,-.03,.01,SITE.n0-12,SITE.n0-4,false);B.box('asphalt',SITE.x1+4,SITE.x1+14,-.03,.01,SITE.n0-12,SITE.n1+12,false);B.box('asphalt',SITE.x0-14,SITE.x0-4,-.03,.01,SITE.n0-12,SITE.n1+12,false);
  // neighbourhood blocks (context only; outside the play area)
  for(const [x0,x1,n0,n1,h] of [[-120,-86,-110,-20,22],[-120,-86,-10,60,30],[-120,-86,70,140,18],[-60,40,92,130,26],[50,110,92,130,34],[87,120,-60,-5,24],[87,120,5,70,40],[-40,70,-125,-84,20],[-120,-50,-125,-84,16]])B.box('concrete',x0,x1,0,h,n0,n1,false);
  // perimeter brick base + green railing, with gates
  const gates={e:[-29.5,-22.5],s:[-13,-9],n:[-13.5,-10]};
  const fence=(x0,x1,n0,n1,gap,alongX)=>{const segs=gap?[[alongX?x0:n0,gap[0]],[gap[1],alongX?x1:n1]]:[[alongX?x0:n0,alongX?x1:n1]];for(const [a,b] of segs){if(alongX){B.box('brick',a,b,0,.6,n0,n1);B.box('stone',a,b,.6,.7,n0-.05,n1+.05,false);B.box('green',a,b,.7,2.2,(n0+n1)/2-.03,(n0+n1)/2+.03,false);B.collide(a,b,.7,2.4,n0,n1,'metal');for(let p=a;p<=b;p+=3)B.box('brick',p-.25,p+.25,0,2.4,n0-.1,n1+.1)}else{B.box('brick',x0,x1,0,.6,a,b);B.box('stone',x0-.05,x1+.05,.6,.7,a,b,false);B.box('green',(x0+x1)/2-.03,(x0+x1)/2+.03,.7,2.2,a,b,false);B.collide(x0,x1,.7,2.4,a,b,'metal');for(let p=a;p<=b;p+=3)B.box('brick',x0-.1,x1+.1,0,2.4,p-.25,p+.25)}}};
  fence(SITE.x0,SITE.x1,SITE.n1-.3,SITE.n1,gates.n,true);fence(SITE.x0,SITE.x1,SITE.n0,SITE.n0+.3,gates.s,true);fence(SITE.x0,SITE.x0+.3,SITE.n0,SITE.n1,null,false);fence(SITE.x1-.3,SITE.x1,SITE.n0,SITE.n1,gates.e,false);
  // east main gate (校門): granite sign wall with red-tile roof (photo E001) + gate piers
  B.box('granite',SITE.x1-3.2,SITE.x1-.4,0,2.4,-33,-29.5);B.box('stone',SITE.x1-3,SITE.x1-.5,.8,2.0,-32.8,-29.4,false);hipRoof(B,SITE.x1-3.6,SITE.x1,2.4,-33.4,-29.1,1.0,{upturn:.25});
  for(const n of [-22.5,-22]){B.box('brick',SITE.x1-1,SITE.x1,0,2.8,n-.5,n);}
  plaque(scene,'臺中市南區 樹義國民小學',{x:SITE.x1-.37,y:1.45,n:-31.25,w:3.2,h:1.05,face:'e',sub:'SHU I ELEMENTARY SCHOOL'});
  await tick('建立實景校園：義學樓（北棟）');

  const rooms=[];const allRooms=(bname,list,toW,D)=>{for(const r of list){const p=toW(r.a0,0),q=toW(r.a1,D),c=toW((r.a0+r.a1)/2,D/2);rooms.push({name:r.name,cls:r.cls,cat:r.cat,building:bname,floor:r.floor,x:c[0],z:-c[1],x0:Math.min(p[0],q[0]),x1:Math.max(p[0],q[0]),z0:Math.min(-p[1],-q[1]),z1:Math.max(-p[1],-q[1])})}};
  const PX=(u0,u1)=>px=>u0+(px-433)/1029*(u1-u0);
  // North block 義學樓: x -48.1..42.5, courtyard face n=-11.4, outer n=3.2
  { const u0=-48.1,u1=42.5,X=PX(u0,u1),D=14.6,toW=(u,w)=>[u,-11.4+w];
    const names={1:['天水堂|2-7','太原堂|1-4','平原堂|1-5','中山堂|1-6','平陽堂|1-7','安定堂|1-8','汝南堂|1-9','校長室'],2:['延陵堂|2-8','始平堂|2-9','京兆堂|2-10','沛國堂|4-4','宏農堂|4-3','下祁堂|4-2','上谷堂|4-1','語言教室一'],3:['彭城堂|6-7','陳留堂|6-8','清河堂|6-9','高陽堂|4-5','高平堂|4-6','苑陽堂|4-7','範陽堂|4-8','語言教室二'],4:['齊陽堂|6-6','臨淮堂|6-5','鍾陵堂|6-4','蘭陵堂|6-3','隴西堂|6-2','譙國堂|6-1','濟陽堂|6-10','語言教室三']};
    const segs=f=>{const s=(a,b,type,name)=>{const [nm,cls]=(name||'').split('|');return{a0:X(a),a1:X(b),type,name:nm||undefined,cls}};
      if(f===0)return[s(433,487,'toilet','廁所'),s(487,545,'lift','電梯'),s(545,595,'stair'),s(595,839,'class','廚房＆午辦'),s(839,976,'passage','穿堂'),s(976,1028,'stair'),s(1028,1083,'toilet','廁所'),s(1083,1166,'class','南陽堂（體育器材室・主控室）'),s(1166,1248,'office','江夏堂（學務處）'),s(1248,1331,'office','魯國堂（健康中心）'),s(1331,1381,'stair'),s(1381,1462,'office','教務處')];
      const N=names[f];return[s(433,487,'toilet','廁所'),s(487,545,'lift','電梯'),s(545,595,'stair'),s(595,677,'class',N[0]),s(677,759,'class',N[1]),s(759,839,'class',N[2]),s(839,921,'class',N[3]),s(921,976,'toilet','廁所'),s(976,1028,'stair'),s(1028,1083,'toilet','廁所'),s(1083,1166,'class',N[4]),s(1166,1248,'class',N[5]),s(1248,1331,'class',N[6]),s(1331,1381,'stair'),s(1381,1462,f===1?'office':'class',N[7])]};
    allRooms('義學樓',bar(B,{u0,u1,D,toW,segs,open:[[u0,20.7]],plane:'x',faceAt:-11.4,corFace:'s',junction:[[20.7,23.7]],bridges:[[-34,-31]],ends:{u0:'wall',u1:'wall'}}),toW,D);
  }
  await tick('建立實景校園：人傑樓（南棟）');
  // South block 人傑樓: x -49.7..41.8, courtyard face n=-40.2, outer n=-56
  { const u0=-49.7,u1=41.8,X=PX(u0,u1),D=15.8,toW=(u,w)=>[u,-40.2-w];
    const names={1:['百濟堂|2-5','西平堂|2-3','西河堂|2-2','吳興堂|2-1','解梁堂（團體諮商室）','廣平堂（輔導室）','汾陽堂（人事會計）','自然教室二'],2:['東海堂|2-6','河東堂|2-4','南昌堂|3-5','上黨堂|3-4','東魯堂|3-3','河南堂|3-2','河間堂|3-1','音樂教室一'],3:['敦煌堂|5-9','渤海堂|5-10','新鄭堂|5-1','鉅鹿堂|3-6','盧江堂|3-7','穎川堂|3-8','豫章堂（美術教室）','音樂教室二'],4:['齊郡堂|5-8','榮安堂|5-7','會稽堂|5-5','馮羽堂|5-4','雁門堂|5-3','博陵堂|5-2','晉陽堂|5-6','音樂教室三']};
    const segs=f=>{const s=(a,b,type,name)=>{const [nm,cls]=(name||'').split('|');return{a0:X(a),a1:X(b),type,name:nm||undefined,cls}};
      if(f===0)return[s(433,489,'office','儲藏室'),s(489,545,'stair'),s(545,595,'toilet','廁所'),s(595,677,'class','樂安堂|1-3'),s(677,759,'class','廣陵堂|1-2'),s(759,839,'class','榮陽堂|1-1'),s(839,976,'passage','穿堂'),s(976,1028,'stair'),s(1028,1083,'toilet','廁所'),s(1083,1248,'office','武功堂（科任教師辦公室・哺乳室）'),s(1248,1331,'office','總務處'),s(1331,1462,'office','雅舍')];
      const N=names[f];const office=f===1?'office':'class';return[s(433,489,'office','儲藏室'),s(489,545,'stair'),s(545,595,'toilet','廁所'),s(595,677,'class',N[0]),s(677,759,'class',N[1]),s(759,839,'class',N[2]),s(839,921,'class',N[3]),s(921,976,'toilet','廁所'),s(976,1028,'stair'),s(1028,1083,'toilet','廁所'),s(1083,1166,office,N[4]),s(1166,1248,office,N[5]),s(1248,1331,office,N[6]),s(1331,1462,'class',N[7])]};
    // u runs west->east but w runs south, so (u,w) is mirrored: swap so the arcade/shape math stays right-handed
    allRooms('人傑樓',bar(B,{u0,u1,D,toW,segs,open:[[u0,20.7]],plane:'x',faceAt:-40.7,corFace:'n',junction:[[20.7,23.7]],bridges:[[-34,-31]],ends:{u0:'wall',u1:'wall'}}),toW,D);
  }
  await tick('建立實景校園：樹德樓（東棟、大門穿堂）');
  // East middle 樹德樓: u = n from -40.2 to -11.4, w = x from 20.7 (courtyard) to 39.4 (east face)
  { const D=18.7,toW=(u,w)=>[20.7+w,u];
    const segs=f=>{const s=(a,b,type,name,o={})=>{const [nm,cls]=(name||'').split('|');return{a0:a,a1:b,type,name:nm||undefined,cls,...o}};
      if(f===0)return[s(-40.2,-31.5,'office','警衛／辦公室'),s(-31.5,-21,'passage','大門穿堂'),s(-21,-11.4,'open','機踏車停車場')];
      if(f===1)return[s(-40.2,-31.5,'office','辦公室'),s(-31.5,-21,'void','大門穿堂（挑高）',{void:true}),s(-21,-11.4,'office','辦公室')];
      if(f===2)return[s(-40.2,-31.5,'class','武陵堂（資訊教室一）'),s(-31.5,-21,'office','教師準備室＆網管中心',{panel:true}),s(-21,-11.4,'class','武威堂（資訊教室二）')];
      if(f===3)return[s(-40.2,-31.5,'class','山陽堂|3-9'),s(-31.5,-21,'class','禹陽堂（自然教室四）',{panel:true}),s(-21,-11.4,'class','趙陽堂|4-9')];
      return[s(-40.2,-31.5,'office','辦公室'),s(-31.5,-21,'hall','仁風臺',{panel:true}),s(-21,-11.4,'office','辦公室')]};
    allRooms('樹德樓',bar(B,{u0:-40.2,u1:-11.4,D,toW,segs,open:[[-40.2,-11.4]],plane:'n',faceAt:20.7,corFace:'w',ends:{u0:'none',u1:'none'}}),toW,D);
    // facade lettering 樹人明義 on the beige panel (east face, above the gate passage)
    const c=document.createElement('canvas');c.width=256;c.height=1024;const g=c.getContext('2d');g.fillStyle='#e9d9b6';g.fillRect(0,0,256,1024);g.fillStyle='#8e2a1f';g.font='bold 200px "DFKai-SB","KaiTi","Microsoft JhengHei",serif';g.textAlign='center';g.textBaseline='middle';'樹人明義'.split('').forEach((ch,i)=>g.fillText(ch,128,128+i*256));
    const tx=new THREE.CanvasTexture(c);tx.colorSpace=THREE.SRGBColorSpace;const plate=new THREE.Mesh(new THREE.PlaneGeometry(3.2,10),new THREE.MeshStandardMaterial({map:tx,roughness:.8}));plate.position.set(39.4+.14,13,26.25);plate.rotation.y=Math.PI/2;scene.add(plate);
    // grand steps in front of the gate passage + rooftop pergola terrace
    for(let x=24;x<=37;x+=2.6)for(const n of [-34,-18])B.box('green',x-.12,x+.12,ROOF,ROOF+2.6,n-.12,n+.12);for(let n=-34;n<=-18;n+=1.6)B.box('green',23.6,37.4,ROOF+2.6,ROOF+2.75,n-.06,n+.06,false);for(let i=0;i<14;i++){const s=new THREE.IcosahedronGeometry(1.1,0);s.translate(24+rnd()*13,ROOF+2.9,-(-34+rnd()*16));B.geo('leaf',s)}
    rooms.push({name:'大門穿堂',building:'樹德樓',floor:1,x:30,z:26.25,u0:-31.5,u1:-21});
  }
  await tick('建立實景校園：明哲樓（西棟、瑾瑜臺）');
  // West building 明哲樓: u = n from -34.6 to -16, w = -x from -31 (courtyard) to -50.3
  { const D=19.3,toW=(u,w)=>[-31-w,u];
    const segs=f=>{const s=(a,b,type,name,o={})=>{const [nm,cls]=(name||'').split('|');return{a0:a,a1:b,type,name:nm||undefined,cls,...o}};const st=s(-19.8,-16,'stair');
      if(f===0)return[s(-34.6,-27.6,'class','平陵堂（彩虹班一）'),s(-27.6,-23,'passage','穿堂'),s(-23,-19.8,'class','扶風堂（彩虹班二）'),st];
      if(f===1)return[s(-34.6,-27.2,'office','閱讀教室'),s(-27.2,-19.8,'office','香韻書齋'),st];
      if(f===2)return[s(-34.6,-29.7,'office','自然教室三'),s(-29.7,-24.7,'office','四五六年級圖書室'),s(-24.7,-19.8,'office','教具室'),st];
      if(f===3)return[s(-34.6,-19.8,'office','視聽教室'),st];
      return[s(-34.6,-19.8,'void','視聽教室（挑高）',{void:true}),st]};
    allRooms('明哲樓',bar(B,{u0:-34.6,u1:-16,D,toW,segs,open:[[-34.6,-16]],plane:'n',faceAt:-31.5,corFace:'e',ends:{u0:'corridor',u1:'corridor'}}),toW,D);
    // upper-floor bridges across the gaps to the north / south blocks (W corridor x -34..-31)
    for(let f=1;f<5;f++){const yb=FB[f];for(const [n0,n1] of [[-16,-11.4],[-40.2,-34.6]]){B.box('concrete',-34,-31,yb-SLAB,yb,n0,n1);B.box('terrazzo',-34,-31,yb,yb+.02,n0,n1,false);B.box('brick',-31.3,-31,yb,yb+1,n0,n1);B.box('brick',-34,-33.7,yb,yb+1,n0,n1);B.box('stone',-34,-31,yb-SLAB-.05,yb+.1,n0,n1,false)}}
    for(const [n0,n1] of [[-16,-11.4],[-40.2,-34.6]])B.box('concrete',-34,-31,ROOF-SLAB,ROOF,n0,n1);
  }
  await tick('建立實景校園：霞雲庭（中庭）');
  // Courtyard 霞雲庭: x -31..20.7, n -40.2..-11.4
  { B.box('quarry',-31,20.7,0,.04,-40.2,-11.4,false);
    // lawn (rounded) + stepping-stone path 四季花徑
    const lawn=new THREE.Shape();lawn.moveTo(-20,-36);lawn.bezierCurveTo(-8,-38,6,-37,13,-33);lawn.bezierCurveTo(17,-28,16,-18,12,-15);lawn.bezierCurveTo(2,-13,-12,-13.5,-19,-16);lawn.bezierCurveTo(-23,-20,-24,-31,-20,-36);
    const lg=new THREE.ShapeGeometry(lawn,24);lg.rotateX(-Math.PI/2);lg.translate(0,.06,0);const uv=lg.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)/3,uv.getY(i)/3);
    // ShapeGeometry is in (x, y=n) -> after rotateX(-90°) y becomes -z = n. Good.
    B.geo('lawn',lg);
    for(let i=0;i<=40;i++){const t=i/40,x=-20+t*33,n=-25.5+5*Math.sin(t*Math.PI*2.1);B.box('stone',x-.35,x+.35,.06,.1,n-.55,n+.55,false)}
    // round planters + palms 時間廊 + pond 荷塘 with stone-mill spring + 霞雲庭 stone
    for(const [x,n] of [[-14,-14.5],[4,-14.2],[-12,-37.4],[6,-37.5],[15,-26]]){const c=new THREE.CylinderGeometry(1.6,1.6,.55,20);c.translate(x,.28,-n);B.geo('stone',c);B.collide(x-1.4,x+1.4,0,.55,n-1.4,n+1.4);const s=new THREE.CylinderGeometry(1.45,1.45,.06,20);s.translate(x,.56,-n);B.geo('lawn',s);for(let k=0;k<3;k++){const b=new THREE.IcosahedronGeometry(.55,1);b.translate(x+(k-1)*.7,.9,-n+(k%2)*.4);B.geo('leaf',b)}}
    for(let n=-38;n<=-13;n+=4.2)tree(B,18.6,n,{h:7.5,kind:'palm'});
    { const x0=6,x1=12,n0=-22,n1=-17.5;B.box('granite',x0-.4,x1+.4,0,.45,n0-.4,n0);B.box('granite',x0-.4,x1+.4,0,.45,n1,n1+.4);B.box('granite',x0-.4,x0,0,.45,n0,n1);B.box('granite',x1,x1+.4,0,.45,n0,n1);B.box('water',x0,x1,.05,.3,n0,n1,false);const mill=new THREE.CylinderGeometry(.6,.6,.35,16);mill.translate(9,.45,19.75);B.geo('granite',mill)}
    B.box('stone',-24,-22.6,0,1.1,-14,-13.2);                                            // 霞雲庭 inscription stone
    // 瑾瑜臺 stage in front of the west building + 文苑 steps
    B.box('quarry',-31,-25.5,0,.9,-31,-20);for(let i=0;i<3;i++)B.box('granite',-25.5+i*.4,-25.1+i*.4,0,.9-(i+1)*.3,-30,-21);
    B.box('granite',-30.95,-30.7,2.6,3.6,-28.2,-22.8,false);plaque(scene,'瑾瑜臺',{x:-30.68,y:3.1,n:-25.5,w:4.6,h:.8,face:'e',bg:'#cfc7b6'});
  }
  await tick('建立實景校園：化雨臺、操場、樂群樓');
  // 化雨臺: stage on the north face at the north passage, granite columns, upturned red-tile roof (photo N004)
  { const x0=-14,x1=1,n0=3.2,n1=10;B.box('quarry',x0,x1,0,1.0,n0,n1);for(let i=0;i<4;i++)B.box('granite',x0+2,x1-2,0,1-(i+1)*.25,n1+i*.35,n1+(i+1)*.35);
    for(const x of [x0+.6,x1-.6,(x0+x1)/2-2.4,(x0+x1)/2+2.4])B.box('granite',x-.45,x+.45,1,5.6,n1-1.1,n1-.2);
    B.box('stone',x0-.4,x1+.4,5.6,6.2,n0,n1);plaque(scene,'化雨臺',{x:(x0+x1)/2,y:5.9,n:n1+.02,w:3.2,h:.55,face:'n',bg:'#c9c4b8'});hipRoof(B,x0-1.6,x1+1.6,6.2,n0-.4,n1+1.6,2.4,{upturn:.9});B.collide(x0-1.6,x1+1.6,6.2,7.6,n0,n1+1.6);}
  // basketball hoops (OSM courts)
  for(const [x0,x1] of [[-30.7,-16.2],[-10.5,4.5]])for(const n of [34.6,58.6]){const x=(x0+x1)/2,d=n<46?-1:1;B.box('metal',x-.1,x+.1,0,3.3,n+d*.5-.1,n+d*.5+.1);B.box('white',x-.9,x+.9,2.9,3.95,n-.03,n+.03);B.box('red',x-.23,x+.23,3.05,3.08,n-.5*d-.25,n-.5*d+.25,false)}
  // playground 遊戲器材區 (NW) + 湧泉臺
  { const x=-60,n=30;B.box('red',x-3,x+3,2,2.2,n-2,n+2);for(const [a,b] of [[-3,-2],[3,-2],[-3,2],[3,2]])B.box('yellow',x+a-.1,x+a+.1,0,3,n+b-.1,n+b+.1);B.box('blue',x+3,x+7,.6,.7,n-.6,n+.6);for(let i=0;i<8;i++)B.box('blue',x+3+i*.5,x+3.5+i*.5,0,2.1-i*.25,n-.6,n+.6,false);B.box('pebble',x-8,x+9,0,.03,n-6,n+6,false);B.box('granite',-64,-63,0,1.1,15,16)}
  // 樂群樓 activity centre (OSM x 32.5..61.6, n 17..61): brick base, gym hall on 2F, gable + raised 太子樓 roof, grand stairs, 鐘樓 tower
  { const x0=32.5,x1=61.6,n0=17,n1=61,h1=5,h2=13;
    const ring=(y0,y1,k,cutsS)=>{wallU((kk,a0,a1,ya,yb2,w0,w1,c)=>B.box(kk,a0,a1,ya,yb2,n0+w0,n0+w1,c),k,x0,x1,y0,y1,0,.35,cutsS,'glass');B.box(k,x0,x1,y0,y1,n1-.35,n1);
      for(const xx of [x0,x1-.35]){const L=n1-n0,c=[];for(let i=0;i<6;i++){const m=n0+L*(i+.5)/6;c.push([m-1-n0,m+1-n0,y0===0?1:2,y0===0?2.6:5.5])}wallW((kk,a0,a1,ya,yb2,w0,w1,cc)=>B.box(kk,a0,a1,ya,yb2,n0+w0,n0+w1,cc),k,xx,xx+.35,y0,y1,0,n1-n0,c,'glass')}};
    ring(0,h1,'brick',[[x0+8,x0+13,0,3.2],[x0+17,x0+21,0,3.2]]);B.box('concrete',x0,x1,h1-.3,h1,n0,n1);B.box('terrazzo',x0+.35,x1-.35,h1,h1+.03,n0+.35,n1-.35,false);
    for(let x=x0+5;x<x1-2;x+=6)for(let n=n0+6;n<n1-2;n+=7)B.box('concrete',x-.3,x+.3,0,h1-.3,n-.3,n+.3);
    ring(h1,h2,'brick',[[x0+12,x0+17.1,0,3.4],[x0+2,x0+6,1.5,6.5],[x0+23,x0+27,1.5,6.5]]);B.box('stone',x0-.1,x1+.1,h1-.3,h1+.1,n0-.1,n1+.1,false);B.box('stone',x0-.1,x1+.1,h2-.2,h2,n0-.1,n1+.1,false);
    // gable roof, ridge along n, with raised 太子樓 clerestory
    hipRoof(B,x0-.8,x1+.8,h2,n0-.8,n1+.8,6,{gable:true});B.collide(x0,x1,h2,h2+.3,n0,n1);
    B.box('white',(x0+x1)/2-3.2,(x0+x1)/2+3.2,h2+5.4,h2+6.6,n0+4,n1-4,false);hipRoof(B,(x0+x1)/2-4,(x0+x1)/2+4,h2+6.6,n0+3.5,n1-3.5,1.8,{gable:true});
    // front stairs from the south to the 2F hall entrance (photo N006)
    for(let i=0;i<30;i++){const t=h1*(30-i)/30;B.box('granite',41,52,0,t,n0-.33*(i+1),n0-.33*i)}B.box('brick',40.6,41,0,h1+1,n0-10,n0);B.box('brick',52,52.4,0,h1+1,n0-10,n0);
    rooms.push({name:'桌球教室',cat:'教學服務空間',building:'樂群樓（活動中心）',floor:1,x:47,z:-33,x0:x0,x1:x1,z0:-50,z1:-n0},{name:'自然教室一',cat:'專科教室',building:'樂群樓（活動中心）',floor:1,x:40,z:-55,x0:x0,x1:47,z0:-n1,z1:-50},{name:'家長會暨志工隊辦公室',cat:'行政辦公室',building:'樂群樓（活動中心）',floor:1,x:54,z:-55,x0:47,x1:x1,z0:-n1,z1:-50},{name:'禮堂（舞臺・音控室）',cat:'教學服務空間',building:'樂群樓（活動中心）',floor:2,x:47,z:-39,x0:x0,x1:x1,z0:-n1,z1:-n0});
    plaque(scene,'樂群樓',{x:(x0+x1)/2,y:h2-1.2,n:n0-.02,w:4.2,h:1.0,face:'s',bg:'#d8cdb8'});
    // gym floor markings plane
    B.box('wood',x0+.4,x1-.4,h1+.03,h1+.05,n0+.4,n1-.4,false);
    // 鐘樓 bell tower at the NE corner (photo N007)
    const tx0=x1-4.5,tx1=x1+.5,tn0=n1-4,tn1=n1+1;B.box('brick',tx0,tx1,0,26,tn0,tn1);B.box('glass',tx0+1.6,tx1-1.6,6,24,tn0-.05,tn0+.05,false);B.box('stone',tx0-.2,tx1+.2,21,21.4,tn0-.2,tn1+.2,false);hipRoof(B,tx0-.4,tx1+.4,26,tn0-.4,tn1+.4,2.6,{gable:true});
  }
  await tick('建立實景校園：庭園與樹木');
  // 古樸的迴廊: brick arcade along the south block's south face (photo S003)
  { const n0=-59.6,n1=-56;for(let x=-46;x<=38;x+=3.5){B.box('brick',x-.35,x+.35,0,3.4,n0,n0+.7)}B.box('concrete',-46.4,38.4,3.4,3.7,n0,n1);B.box('stone',-46.4,38.4,3.3,3.45,n0-.08,n1,false);
    for(let x=-46;x<38;x+=3.5){const sh=archShape(0,3.5-.7,2.4,.75,3.41);const g=placedExtrude(sh,.7,{plane:'x',at:0});g.translate(x+.35,0,0);g.translate(0,0,-(n0)-.0);B.geo('brick',g)}
    for(let x=-45;x<=38;x+=6)B.box('pave',x-.6,x+.6,0,.03,n1-14,n1,false)}
  // east yard: driveway, 榕園 banyans, lawns, 奠基石
  B.box('pave',39.4,SITE.x1,0,.04,-31,-20.5,false);B.box('lawn',44,66,0,.05,-18,-2,false);B.box('lawn',44,66,0,.05,-52,-34,false);
  for(const [x,n] of [[50,-6],[57,-9],[62,-4]])tree(B,x,n,{h:10,r:5});B.box('granite',53,55,0,1.3,-14,-12.6);B.box('granite',61,63.2,0,1.1,-38,-36.6);
  for(const n of [-15,-36])B.box('metal',44,44.15,0,12,n,n+.15);
  // south yard: 魚樂軒 pond, 悟智園 squares, 南側門 path
  { B.box('granite',24,34.4,0,.4,-67,-60.6);B.box('water',24.4,34,.05,.35,-66.6,-61,false);for(let i=0;i<9;i++)B.box(i%2?'quarry':'stone',-62+i*1.4,-61+i*1.4,0,.05,-66,-65,false);B.box('pave',-13,-9,0,.03,-70,-59.6,false)}
  // west yard: 健康步道 pebble path, 和風庭 lawn, 平安門 moon-gate wall (photo S007)
  { B.box('pebble',-67.5,-66,0,.05,-62,60,false);B.box('lawn',-64,-53,0,.05,-30,-6,false);
    const w=new THREE.Shape();w.moveTo(-6,0);w.lineTo(6,0);w.lineTo(6,3.2);w.lineTo(2.5,3.2);w.lineTo(2.5,4.2);w.lineTo(-2.5,4.2);w.lineTo(-2.5,3.2);w.lineTo(-6,3.2);w.lineTo(-6,0);
    const hole=new THREE.Path();hole.absarc(0,1.9,1.55,0,Math.PI*2,true);w.holes.push(hole);for(const sx of [-3.8,3.8]){const o=new THREE.Path();const r=.55;for(let i=0;i<=8;i++){const a=i/8*Math.PI*2+Math.PI/8;i?o.lineTo(sx+r*Math.cos(a),1.9+r*Math.sin(a)):o.moveTo(sx+r*Math.cos(a),1.9+r*Math.sin(a))}w.holes.push(o)}
    const g=placedExtrude(w,.4,{plane:'x',at:0});g.translate(-58,0,62);B.geo('white',g);B.collide(-64,-59.6,0,3.2,-62,-61.6);B.collide(-56.4,-52,0,3.2,-62,-61.6);B.collide(-59.6,-56.4,3.4,4.2,-62,-61.6);
    const door=new THREE.CylinderGeometry(1.5,1.5,.1,24,1,false,0,Math.PI);door.rotateX(Math.PI/2);door.translate(-58,1.9,62.2);}
  // trees along the boundary and yards
  for(let x=-64;x<=26;x+=7)tree(B,x,73,{h:7,r:2.8});for(let n=-64;n<=66;n+=7){tree(B,-69,n,{h:7,r:2.6});if(n<-2||n>14)tree(B,68,n,{h:7,r:2.6})}for(let x=-62;x<=60;x+=8)tree(B,x,-67.5,{h:6,r:2.4});
  for(const [x,n] of [[-45,10],[-30,12],[18,14],[25,22],[-50,40],[-48,55],[26,40],[24,58]])tree(B,x,n,{h:8,r:3.2});

  await tick('建立實景校園：合併網格');
  const vis=B.finish(scene,shadows);
  return {...vis,rooms,builder:B};
}

// Landmarks at their real positions (game coords: x, y, z=-n).
export const REAL_LANDMARKS=[
  ['校門',[70,4,26]],['大門穿堂',[31,6,26]],['樹人明義',[42,20,26]],['仁風臺',[31,17.5,26]],['霞雲庭',[-5,4,25]],['四季花徑',[-2,2,25]],['荷塘',[9,2,20]],['時間廊',[18.6,4,26]],['瑾瑜臺',[-28,4,25.5]],['文苑',[-24,3,25.5]],
  ['化雨臺',[-6.5,9,-7]],['運動場',[-13,4,-47]],['籃球場',[-13,5,-46]],['樂群樓（活動中心）',[47,20,-39]],['鐘樓',[59,29,-59.5]],['遊戲器材區',[-60,5,-30]],['湧泉臺',[-63.5,3,-15.5]],
  ['榕園',[56,9,6]],['蘭因庭',[55,3,10]],['桂苑',[55,3,30]],['奠基石',[62,3,37]],['妙禪庭',[55,3,47]],['古樸的迴廊',[-5,4,58]],['魚樂軒',[29,3,64]],['悟智園',[-56,3,65]],['南側門',[-11,4,70]],
  ['平安門',[-58,5,62.2]],['健康步道',[-66.7,2,0]],['和風庭',[-58,3,18]],['豫園',[-58,3,5]],['北側門',[-11.7,4,-77]],
].map(([name,pos])=>({name,pos}));
export const REAL_BUILDINGS=[
  {name:'義學樓',x0:-48.1,x1:42.5,z0:-3.2,z1:11.4},{name:'人傑樓',x0:-49.7,x1:41.8,z0:40.2,z1:56},{name:'樹德樓',x0:20.7,x1:42,z0:11.4,z1:40.2},
  {name:'明哲樓',x0:-50.3,x1:-31,z0:16,z1:34.6},{name:'霞雲庭',x0:-31,x1:20.7,z0:11.4,z1:40.2,outdoor:true},{name:'樂群樓（活動中心）',x0:32.5,x1:61.6,z0:-61,z1:-17},
  {name:'運動場',x0:-70,x1:32,z0:-77,z1:-3.2,outdoor:true},{name:'東側庭園',x0:42,x1:71,z0:-17,z1:70,outdoor:true},{name:'南側庭園',x0:-70,x1:42,z0:56,z1:70,outdoor:true},{name:'西側庭園',x0:-70,x1:-48,z0:-3.2,z1:56,outdoor:true},
];
export function realLocate(rooms,p){const b=REAL_BUILDINGS.find(b=>p.x>=b.x0&&p.x<=b.x1&&p.z>=b.z0&&p.z<=b.z1);if(!b)return '';if(b.outdoor)return b.name;
  const floor=Math.max(1,Math.min(5,FB.findLastIndex(y=>p.y>=y-.6)+1));const r=rooms.find(r=>r.building===b.name&&r.floor===floor&&p.x>=r.x0-.2&&p.x<=r.x1+.2&&p.z>=r.z0-.2&&p.z<=r.z1+.2);
  return b.name+' '+floor+'F'+(r?' · '+r.name+(r.cls?' '+r.cls:''):'')}
export {FB,ROOF,SITE,CampusNav};
