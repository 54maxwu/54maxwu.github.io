import * as THREE from 'three';
import {buildCampusVisuals} from './campus-visuals.js';
import {CampusNav} from './campus-physics.js';
import {buildLabels} from './campus-labels.js';
import {buildRealCampus,REAL_LANDMARKS,realLocate} from './campus-real.js';
// Scene selection (?world=...):
//   (default) real   — real-scale campus rebuilt from OSM outlines + official floor plan + photos (campus-real.js)
//   voxel            — Minecraft map with facade/courtyard edits (world-real.bin)
//   original         — untouched Minecraft map
export async function buildCampus(scene,world,renderer,progress){
 const q=new URLSearchParams(location.search),mode=q.get('world')||'real';
 let visuals,bounds,labels=[],locateFn=()=>'',spawnAt,menuCam,glassApi=null,destruct=null;
 if(mode==='original'||mode==='voxel'){
  visuals=await buildCampusVisuals(scene,renderer,progress,{offset:[-137,-4,94],world:mode==='original'?'world':'world-real'});progress.textContent='建立校園碰撞';
  const data=await fetch(mode==='original'?'/campus-collision.json':'/campus-collision-real.json').then(r=>{if(!r.ok)throw Error('校園碰撞檔載入失敗');return r.json()});for(const c of data.colliders)world.add(c);bounds=data.bounds;
  const info=await fetch('/campus-info.json').then(r=>r.ok?r.json():null).catch(()=>null);if(info){labels=buildLabels(scene,info.landmarks);locateFn=p=>locate(info,p)}
  spawnAt=[['BL',-45,-55],['GR',-45,45]];
 }else{
  const r=await buildRealCampus(scene,world,renderer,progress,{quality:q.get('q')||'medium'});visuals=r;scene.userData.lighting='real';
  bounds={x0:-71,x1:72,z0:-78,z1:71};labels=buildLabels(scene,REAL_LANDMARKS);locateFn=p=>realLocate(r.rooms,p);
  spawnAt=[['BL',-36,-24],['GR',55,44]];menuCam={pos:[105,62,105],look:[-6,6,-4]};glassApi=r.glass;destruct=r.destruct;
 }
 // Contain play within the loaded physical world.
 for(const x of [bounds.x0,bounds.x1])world.add({x,y:25,z:(bounds.z0+bounds.z1)/2,sx:1,sy:100,sz:bounds.z1-bounds.z0,tag:'boundary',bullet:'pass',sight:false});for(const z of [bounds.z0,bounds.z1])world.add({x:(bounds.x0+bounds.x1)/2,y:25,z,sx:bounds.x1-bounds.x0,sy:100,sz:1,tag:'boundary',bullet:'pass',sight:false});world.build();
 const nav=await new CampusNav(world,{x0:bounds.x0+2,x1:bounds.x1-2,z0:bounds.z0+2,z1:bounds.z1-2,...(mode==='real'?{clearY:.45}:{})}).build(progress);const spawns={BL:[],GR:[]};for(const [team,cx,cz]of spawnAt){for(let i=0;i<12;i++){const n=nav.nearest(cx+(i%4-1.5)*2,cz+Math.floor(i/4)*2,0);if(n&&!spawns[team].some(p=>p.x===n.x&&p.z===n.z))spawns[team].push({x:n.x,y:n.y,z:n.z,yaw:team==='BL'?Math.PI:0})}if(!spawns[team].length)throw Error('找不到安全出生點');}
 const canvas=document.createElement('canvas'),S=4;canvas.width=(bounds.x1-bounds.x0)*S;canvas.height=(bounds.z1-bounds.z0)*S;const ctx=canvas.getContext('2d');ctx.fillStyle='#65795e';ctx.fillRect(0,0,canvas.width,canvas.height);for(const c of world.colliders){if(c.bottom>2||c.top<.25||c.tag==='boundary')continue;ctx.fillStyle=c.top>3?'#293b3e':c.top>1?'#44585a':'#7f8170';ctx.fillRect((c.minX-bounds.x0)*S,(c.minZ-bounds.z0)*S,(c.maxX-c.minX)*S,(c.maxZ-c.minZ)*S)}
 const map={campus:true,mode,name:'樹義國小',...visuals,nav,bounds,spawns,menuCam,lampSpots:[],funnelTop:null,radar:{image:canvas,scale:S,x:-bounds.x0,z:-bounds.z0},update(dt){if(destruct)destruct.update(Math.min(dt||0,0.05));const cam=scene.userData.camera;if(!cam)return;for(const s of labels){const d=cam.position.distanceTo(s.position);s.material.opacity=d<6?0:Math.max(0,Math.min(1,(45-d)/15));s.visible=s.material.opacity>0.02}},locate:locateFn,
  // Breakable glass (real-scale campus). Returns the pane box in game coords, or null.
  breakGlass(c){if(!glassApi||!c||c.tag!=='glass'||c.broken)return null;const p=glassApi.panes[c.glassId];if(!p)return null;c.broken=true;c.solid=false;c.bullet='pass';glassApi.place(c.glassId,false);glassApi.mesh.instanceMatrix.needsUpdate=true;return{x:(p.x0+p.x1)/2,y:(p.y0+p.y1)/2,z:-(p.n0+p.n1)/2,sx:p.x1-p.x0,sy:p.y1-p.y0,sz:p.n1-p.n0}},
  breakGlassNear(pos,r){if(!glassApi)return[];const out=[];for(const p of glassApi.panes){if(!p.c||p.c.broken)continue;const cx=(p.x0+p.x1)/2,cy=(p.y0+p.y1)/2,cz=-(p.n0+p.n1)/2;if(Math.hypot(cx-pos.x,cy-pos.y,cz-pos.z)<r){const b=this.breakGlass(p.c);if(b)out.push(b)}}return out},
  // Destruction (real-scale campus): damage a collider's part, area blast, reset per match.
  damageAt(c,dmg,dir){return destruct?destruct.damage(c,dmg,dir):null},
  blastAt(p,r,power){return destruct?destruct.blast(p,r,power):[]},
  takeWrecked(){return destruct?destruct.takeWrecked():[]},
  resetDestruction(){if(destruct)destruct.reset()},
  resetGlass(){if(!glassApi)return;glassApi.panes.forEach((p,i)=>{if(p.c&&p.c.broken){p.c.broken=false;p.c.solid=true;p.c.bullet='pen';glassApi.place(i,true)}});glassApi.mesh.instanceMatrix.needsUpdate=true},isSpawn(p){return spawns[p.team].some(s=>Math.hypot(s.x-p.pos.x,s.z-p.pos.z)<12&&Math.abs(s.y-p.pos.y)<3)},pickBotGoal(bot,near){const other=bot.team==='BL'?'GR':'BL';const pool=nav.main;
 // near: flank point within ~25 m of a target; otherwise roam the whole campus (all floors).
 if(near){for(let i=0;i<60;i++){const n=nav.nodes[pool[Math.floor(Math.random()*pool.length)]];const d=Math.hypot(n.x-near.x,n.z-near.z);if(d>6&&d<25)return[n.x,n.z,n.y]}}
 if(bot.stage<1&&Math.random()<.5){const s=spawns[other][bot.id%spawns[other].length];return[s.x,s.z,s.y]}
 const n=nav.nodes[pool[Math.floor(Math.random()*pool.length)]];return[n.x,n.z,n.y]}};
 console.log('CAMPUS_READY',{mode,faces:visuals.facesCount,colliders:world.colliders.length,nodes:nav.nodes.length,connected:nav.main.length,spawns});return map;
}

// "人傑樓 3F · 東海堂" style location for the HUD, from building boxes + nearest room on that floor.
function locate(info,p){const b=info.buildings.find(b=>p.x>=b.x0&&p.x<=b.x1&&p.z>=b.z0&&p.z<=b.z1);if(!b)return '';if(b.outdoor)return b.name;const floor=Math.max(1,Math.min(5,Math.round((p.y-3)/8)+1));let best=null,bd=1e9;for(const r of info.rooms){if(r.building!==b.name||(r.floor&&r.floor!==floor))continue;const d=Math.abs(r.z-p.z)+(r.floor?0:Math.abs(r.x-p.x));if(d<bd){bd=d;best=r}}return b.name+' '+floor+'F'+(best&&bd<12?' · '+best.name:'')}
