import * as THREE from 'three';
import {clone} from 'three/addons/utils/SkeletonUtils.js';
import {WEAPONS,CAUSES} from './weapons.js';
import {audio} from './audio.js';

import {replayTime} from './replay-timing.js';
function pose(actor){const root=actor.soldier.root;return {pos:root.position.toArray(),q:root.quaternion.toArray(),bones:Object.fromEntries(actor.soldier.bones.map(b=>[b.name,[...b.position.toArray(),...b.quaternion.toArray()]]))};}
function apply(root,frame,next,t){root.position.fromArray(frame.pos).lerp(new THREE.Vector3().fromArray(next.pos),t);root.quaternion.fromArray(frame.q).slerp(new THREE.Quaternion().fromArray(next.q),t);root.traverse(b=>{if(!b.isBone)return;const a=frame.bones[b.name],c=next.bones[b.name];if(!a||!c)return;b.position.fromArray(a).lerp(new THREE.Vector3().fromArray(c),t);b.quaternion.fromArray(a,3).slerp(new THREE.Quaternion().fromArray(c,3),t);});}

export class KillReplay {
  constructor(game){this.game=game;this.frames=[];this.nextSample=0;this.active=false;
    this.overlay=document.createElement('div');this.overlay.className='killReplay';this.overlay.hidden=true;
    const title=document.createElement('strong');title.textContent='致命一擊重現';this.title=title;
    this.detail=document.createElement('span');this.speed=document.createElement('small');
    const skip=document.createElement('button');skip.textContent='跳過回放 · 空白鍵';skip.onclick=()=>this.stop();
    this.overlay.append(title,this.detail,this.speed,skip);document.body.append(this.overlay);
    addEventListener('keydown',e=>{if(this.active&&e.code==='Space'){e.preventDefault();this.stop();}});
  }
  record(){const g=this.game;if(g.time<this.nextSample)return;this.nextSample=g.time+1/20;
    const frame={time:g.time,actors:new Map(g.actors.map(a=>[a.id,pose(a)]))};this.frames.push(frame);while(this.frames.length>65)this.frames.shift();
    if(this.active&&g.time<=this.deathTime+.6)this.clip.push(frame);
  }
  reset(){this.stop();this.frames=[];this.nextSample=0;}
  start(victim,attacker,cause,headshot,wallbang){
    this.stop();const g=this.game;this.active=true;this.elapsed=0;this.deathTime=g.time;this.clip=this.frames.slice();this.victim=victim.id;this.attacker=attacker?.id;
    this.impact=(headshot?victim.soldier.headWorld(new THREE.Vector3()):victim.soldier.chestWorld(new THREE.Vector3())).clone();
    this.origin=attacker&&attacker!==victim?attacker.soldier.muzzleWorld(new THREE.Vector3()):this.impact.clone().add(new THREE.Vector3(1,3,1));
    this.scene=new THREE.Scene();this.scene.background=g.renderer.scene.background;this.scene.environment=g.renderer.scene.environment;this.scene.environmentIntensity=g.renderer.scene.environmentIntensity;this.scene.fog=g.renderer.scene.fog;
    for(const mesh of g.map.meshes||[])this.scene.add(mesh.clone());
    // Terrain and signs are separate from the merged building meshes.
    for(const mesh of g.renderer.scene.children)if(mesh.isMesh&&!mesh.isInstancedMesh&&mesh.geometry?.type==='PlaneGeometry'&&!(g.map.meshes||[]).includes(mesh))this.scene.add(mesh.clone());
    this.scene.add(new THREE.HemisphereLight(0xd9e8ff,0x625446,1.6));const light=new THREE.DirectionalLight(0xffdfbd,2.5);light.position.set(-40,80,30);this.scene.add(light);
    this.clones=new Map();for(const a of g.actors)if(a===victim||a===attacker){const root=clone(a.soldier.root);root.visible=true;root.traverse(o=>{if(o.isMesh)o.visible=true;});this.clones.set(a.id,root);this.scene.add(root);}
    this.camera=new THREE.PerspectiveCamera(52,g.renderer.camera.aspect,.05,500);
    const delta=this.impact.clone().sub(this.origin),distance=delta.length();this.direction=delta.normalize();
    this.trace=new THREE.Line(new THREE.BufferGeometry().setFromPoints([this.origin,this.impact]),new THREE.LineBasicMaterial({color:0xffcf77,transparent:true,opacity:.5,depthTest:true}));
    this.trace.visible=false;this.scene.add(this.trace);this.distance=distance;
    this.bullet=new THREE.Mesh(new THREE.SphereGeometry(.045,8,6),new THREE.MeshBasicMaterial({color:0xffecaa,toneMapped:false}));this.scene.add(this.bullet);
    this.explosive=['he','rpg'].includes(cause);this.impactFlash=new THREE.Sprite(new THREE.SpriteMaterial({map:g.T.glow,color:this.explosive?0xff8b35:0xffe7bc,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false}));this.impactFlash.position.copy(this.impact);this.scene.add(this.impactFlash);
    this.showTrace=!!attacker&&attacker!==victim&&['rifle','smg','sniper','pistol','shotgun','launcher'].includes(WEAPONS[cause]?.type);
    this.detail.textContent=`${attacker&&attacker!==victim?attacker.name:'環境／自身'} · ${WEAPONS[cause]?.name||CAUSES[cause]?.name||'傷害'}${headshot?' · 爆頭':''}${wallbang?' · 穿透掩體':''}`;
    this.overlay.hidden=false;g.touch?.releaseAll();this.record();
    this.impactSound=false;audio.play('whiz',null,{ui:true,gain:.3,rate:.55,duration:.5});
  }
  update(dt){if(!this.active)return false;const g=this.game;
    if(g.paused)return true;
    this.elapsed+=dt;if(this.elapsed>=3.85||g.player.alive||!g.playing){this.stop();return false;}
    const offset=replayTime(this.elapsed),time=this.deathTime+offset;
    let a=this.clip[0],b=a;for(const f of this.clip){if(f.time<=time)a=f;if(f.time>=time){b=f;break;}b=f;}
    const t=a&&b?THREE.MathUtils.clamp((time-a.time)/(b.time-a.time||1),0,1):0;
    if(a&&b)for(const [id,root]of this.clones){const p=a.actors.get(id),q=b.actors.get(id);if(p&&q)apply(root,p,q,t);}
    const side=new THREE.Vector3().crossVectors(this.direction,new THREE.Vector3(0,1,0));if(side.lengthSq()<.01)side.set(1,0,0);side.normalize();
    const phase=THREE.MathUtils.clamp((this.elapsed-.55)/3.3,0,1),focus=this.origin.clone().lerp(this.impact,THREE.MathUtils.smoothstep(phase,0,.65));
    const desired=focus.clone().addScaledVector(side,2.2+Math.sin(phase*Math.PI)*1.2).add(new THREE.Vector3(0,.8,0)).addScaledVector(this.direction,-(1.3+3*(1-phase)));
    const delta=desired.clone().sub(focus),length=delta.length();delta.normalize();const hit=g.world.raycast(focus.x,focus.y,focus.z,delta.x,delta.y,delta.z,length,'move');
    this.camera.position.copy(focus).addScaledVector(delta,hit?Math.max(.15,hit.t-.2):length);this.camera.lookAt(focus);this.camera.aspect=g.renderer.camera.aspect;this.camera.fov=52-phase*12;this.camera.updateProjectionMatrix();
    this.trace.visible=this.showTrace&&offset>=-.2;this.bullet.visible=this.showTrace&&offset>=-.2&&offset<=0;
    this.bullet.position.copy(this.origin).lerp(this.impact,THREE.MathUtils.clamp((offset+.2)/.2,0,1));
    this.impactFlash.visible=offset>=0&&offset<.35;this.impactFlash.scale.setScalar((this.explosive?5:.6)*(1+Math.max(0,offset)*3));this.impactFlash.material.opacity=Math.max(0,1-offset/.35);
    if(offset>=0&&!this.impactSound){this.impactSound=true;audio.play('impf',null,{ui:true,gain:.45,rate:.55,duration:.35});}
    this.speed.textContent=this.elapsed<1.25?'回看攻擊位置':this.elapsed<3.45?'SLOW · 0.2× · 致命路徑示意':'命中細節';
    return true;
  }
  stop(){this.active=false;this.overlay.hidden=true;for(const root of this.clones?.values()||[])root.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.dispose();});for(const o of [this.trace,this.bullet]){o?.geometry.dispose();o?.material.dispose();}this.impactFlash?.material.dispose();this.impactFlash=null;this.trace=this.bullet=null;this.scene=null;this.clones=null;this.clip=[];}
}
