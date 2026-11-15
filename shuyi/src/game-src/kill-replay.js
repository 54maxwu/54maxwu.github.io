import * as THREE from 'three';
import {clone} from 'three/addons/utils/SkeletonUtils.js';
import {WEAPONS,CAUSES} from './weapons.js';
import {audio} from './audio.js';
import {replayTime,replaySpeed,REPLAY_DURATION,REPLAY_AFTER,SHOT} from './replay-timing.js';

// 擊殺回放：像電影一樣分四個鏡頭（見 replay-timing.js），鏡頭之間硬切，加上寬銀幕黑邊與調色。
//   一、擊殺者越肩鏡頭   二、子彈時間追蹤   三、命中定格   四、低角度環繞看身體倒下（慢動作漸快）

const UP=new THREE.Vector3(0,1,0);
const _v=new THREE.Vector3(),_w=new THREE.Vector3();

function pose(actor){const root=actor.soldier.root;return {pos:root.position.toArray(),q:root.quaternion.toArray(),bones:Object.fromEntries(actor.soldier.bones.map(b=>[b.name,[...b.position.toArray(),...b.quaternion.toArray()]]))};}
function apply(root,frame,next,t){root.position.fromArray(frame.pos).lerp(_v.fromArray(next.pos),t);root.quaternion.fromArray(frame.q).slerp(new THREE.Quaternion().fromArray(next.q),t);root.traverse(b=>{if(!b.isBone)return;const a=frame.bones[b.name],c=next.bones[b.name];if(!a||!c)return;b.position.fromArray(a).lerp(_v.fromArray(c),t);b.quaternion.fromArray(a,3).slerp(new THREE.Quaternion().fromArray(c,3),t);});}

export class KillReplay {
  constructor(game){this.game=game;this.frames=[];this.nextSample=0;this.active=false;this.cine=0;this.flash=0;
    this.overlay=document.createElement('div');this.overlay.className='killReplay';this.overlay.hidden=true;
    const title=document.createElement('strong');title.textContent='致命一擊重現';this.title=title;
    this.detail=document.createElement('span');this.speed=document.createElement('small');
    const skip=document.createElement('button');skip.textContent='跳過回放 · 空白鍵';skip.onclick=()=>this.stop();
    this.overlay.append(title,this.detail,this.speed,skip);document.body.append(this.overlay);
    addEventListener('keydown',e=>{if(this.active&&e.code==='Space'){e.preventDefault();this.stop();}});
  }
  // 30Hz 取樣；慢動作時兩格之間用插值補
  record(){const g=this.game;if(g.time<this.nextSample)return;this.nextSample=g.time+1/30;
    const frame={time:g.time,actors:new Map(g.actors.map(a=>[a.id,pose(a)]))};this.frames.push(frame);while(this.frames.length>100)this.frames.shift();
    if(this.active&&g.time<=this.deathTime+REPLAY_AFTER)this.clip.push(frame);
  }
  reset(){this.stop();this.frames=[];this.nextSample=0;}
  start(victim,attacker,cause,headshot,wallbang,hitInfo={}){
    this.stop();const g=this.game;this.active=true;this.elapsed=0;this.deathTime=g.time;this.clip=this.frames.slice();this.victim=victim.id;this.attacker=attacker?.id;
    this.impact=hitInfo.point?.clone()||(headshot?victim.soldier.headWorld(new THREE.Vector3()):victim.soldier.chestWorld(new THREE.Vector3())).clone();
    this.partName=({head:'頭部',chest:'軀幹',stomach:'腹部',arm:'手臂',leg:'腿部'})[hitInfo.part]||(headshot?'頭部':'軀幹');
    this.damageText=hitInfo.damage?` · 最後一擊 ${hitInfo.damage} 傷害`:'';victim.respawnT=.2;
    this.byOther=!!attacker&&attacker!==victim;
    this.origin=this.byOther?attacker.soldier.muzzleWorld(new THREE.Vector3()):this.impact.clone().add(new THREE.Vector3(1,3,1));
    this.scene=new THREE.Scene();this.scene.background=g.renderer.scene.background;this.scene.environment=g.renderer.scene.environment;this.scene.environmentIntensity=g.renderer.scene.environmentIntensity;this.scene.fog=g.renderer.scene.fog;
    for(const mesh of g.map.meshes||[])this.scene.add(mesh.clone());
    // Terrain and signs are separate from the merged building meshes.
    for(const mesh of g.renderer.scene.children)if(mesh.isMesh&&!mesh.isInstancedMesh&&mesh.geometry?.type==='PlaneGeometry'&&!(g.map.meshes||[]).includes(mesh))this.scene.add(mesh.clone());
    // 電影打光：天光 + 偏暖主光 + 從背後打來的冷色輪廓光
    this.scene.add(new THREE.HemisphereLight(0xcfe0ff,0x4a3e34,1.25));
    const key=new THREE.DirectionalLight(0xffd6a8,2.8);key.position.set(-40,80,30);this.scene.add(key);
    this.rimLight=new THREE.DirectionalLight(0x9cc4ff,1.6);this.scene.add(this.rimLight);this.scene.add(this.rimLight.target);
    this.clones=new Map();for(const a of g.actors)if(a===victim||a===attacker){const root=clone(a.soldier.root);root.visible=true;root.traverse(o=>{if(o.isMesh)o.visible=true;});this.clones.set(a.id,root);this.scene.add(root);}
    const vRoot=this.clones.get(victim.id),aRoot=this.byOther?this.clones.get(attacker.id):null;
    this.vHips=vRoot?.getObjectByName('hips');this.aHead=aRoot?.getObjectByName('head');
    this.vGun=null;vRoot?.traverse(o=>{if(o.userData?.thirdPersonGun)this.vGun=o;});
    this.camera=new THREE.PerspectiveCamera(42,g.renderer.camera.aspect,.03,500);
    const delta=this.impact.clone().sub(this.origin),distance=delta.length();this.direction=delta.normalize();this.distance=distance;
    this.side=new THREE.Vector3().crossVectors(this.direction,UP);if(this.side.lengthSq()<.01)this.side.set(1,0,0);this.side.normalize();
    // 環繞鏡頭挑沒被牆擋住的那一側
    this.sideSign=this.freeDist(this.impact,this.side,3)>=this.freeDist(this.impact,_w.copy(this.side).negate(),3)?1:-1;
    const traceGeo=new THREE.BufferGeometry();traceGeo.setAttribute('position',new THREE.Float32BufferAttribute([...this.origin.toArray(),...this.origin.toArray()],3));
    this.trace=new THREE.Line(traceGeo,new THREE.LineBasicMaterial({color:0xffd894,transparent:true,opacity:.55,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}));
    this.trace.visible=false;this.scene.add(this.trace);
    // 子彈：拉長的發光彈頭（沿飛行方向）
    this.bullet=new THREE.Mesh(new THREE.CapsuleGeometry(.012,.09,3,8),new THREE.MeshBasicMaterial({color:0xfff0c0,toneMapped:false}));
    this.bullet.quaternion.setFromUnitVectors(UP,this.direction);this.scene.add(this.bullet);
    this.bulletGlow=new THREE.Sprite(new THREE.SpriteMaterial({map:g.T.glow,color:0xffc070,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false}));this.bulletGlow.scale.setScalar(.22);this.scene.add(this.bulletGlow);
    this.marker=new THREE.Mesh(new THREE.TorusGeometry(.075,.009,6,32),new THREE.MeshBasicMaterial({color:0xffad68,transparent:true,opacity:.9,depthTest:false,depthWrite:false,toneMapped:false}));this.marker.position.copy(this.impact);this.marker.renderOrder=10;this.scene.add(this.marker);
    this.explosive=['he','rpg'].includes(cause);this.impactFlash=new THREE.Sprite(new THREE.SpriteMaterial({map:g.T.glow,color:this.explosive?0xff8b35:0xffe7bc,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false}));this.impactFlash.position.copy(this.impact);this.scene.add(this.impactFlash);
    this.showTrace=this.byOther&&['rifle','smg','sniper','pistol','shotgun','launcher'].includes(WEAPONS[cause]?.type);
    this.killerName=this.byOther?attacker.name:'環境／自身';this.weaponName=WEAPONS[cause]?.name||CAUSES[cause]?.name||'傷害';
    this.explanation=`${this.killerName} 使用 ${this.weaponName} → 命中你的${this.partName}${headshot?'（爆頭）':''}${wallbang?' · 穿透掩體':''}${this.damageText}`;
    this.detail.textContent=this.explanation;
    this.overlay.hidden=false;this.overlay.classList.remove('cut');g.touch?.releaseAll();this.record();
    this.shot=-1;this.camPos=new THREE.Vector3();this.lookFocus=new THREE.Vector3();this.cine=0;this.flash=0;
    this.sounds={};audio.play('whiz',null,{ui:true,gain:.25,rate:.5,duration:.6});
  }
  freeDist(from,dir,max){const h=this.game.world.raycast(from.x,from.y,from.z,dir.x,dir.y,dir.z,max,'move');return h?h.t:max;}
  // 鏡頭不穿牆：從注視點往鏡頭位置打射線，被擋就拉近
  safe(focus,desired){const d=_w.copy(desired).sub(focus),L=d.length();if(L<1e-4)return desired;d.divideScalar(L);const t=this.freeDist(focus,d,L);return t<L?focus.clone().addScaledVector(d,Math.max(.12,t-.18)):desired;}
  once(key,fn){if(!this.sounds[key]){this.sounds[key]=true;fn();}}
  update(dt){if(!this.active)return false;const g=this.game;
    if(g.paused)return true;
    this.elapsed+=dt;const e=this.elapsed;if(e>=REPLAY_DURATION||g.player.alive||!g.playing){this.stop();return false;}
    const offset=replayTime(e),time=this.deathTime+offset;
    let a=this.clip[0],b=a;for(const f of this.clip){if(f.time<=time)a=f;if(f.time>=time){b=f;break;}b=f;}
    const t=a&&b?THREE.MathUtils.clamp((time-a.time)/(b.time-a.time||1),0,1):0;
    if(a&&b)for(const [id,root]of this.clones){const p=a.actors.get(id),q=b.actors.get(id);if(p&&q)apply(root,p,q,t);}
    for(const root of this.clones.values())root.updateMatrixWorld(true);

    const shot=e<SHOT.bullet?0:e<SHOT.impact?1:e<SHOT.fall?2:3,cut=shot!==this.shot;this.shot=shot;
    const D=this.direction,S=_v.copy(this.side).multiplyScalar(this.sideSign).clone();
    let pos,look,fov,shake=0;
    const bulletS=THREE.MathUtils.clamp((offset+.3)/.3,0,1),bp=this.origin.clone().lerp(this.impact,bulletS);
    if(shot===0){
      // 一、擊殺者：越肩、慢慢推進；沒有擊殺者就用廣角帶到受害者
      const k=e/SHOT.bullet;
      if(this.aHead){const head=this.aHead.getWorldPosition(new THREE.Vector3()).addScaledVector(UP,.08);
        // 用「擊殺者此刻 → 受害者此刻」的方向取景，擊殺者移動中也一定在畫面左前方
        const tgt=this.vHips?this.vHips.getWorldPosition(new THREE.Vector3()):this.impact,dA=tgt.clone().sub(head);const dist=dA.length();dA.normalize();
        const sA=new THREE.Vector3().crossVectors(dA,UP);if(sA.lengthSq()<.01)sA.copy(S);sA.normalize().multiplyScalar(this.sideSign);
        pos=head.clone().addScaledVector(dA,-1.9+.5*k).addScaledVector(sA,.85).addScaledVector(UP,.22);look=head.clone().addScaledVector(dA,Math.min(6,dist*.6)).addScaledVector(sA,-.25);fov=42-4*k;}
      else{pos=this.impact.clone().addScaledVector(S,3.6-.8*k).addScaledVector(UP,1.5).addScaledVector(D,-2);look=this.impact.clone();fov=46;}
      pos=this.safe(look,pos);
    }else if(shot===1){
      // 二、子彈時間：鏡頭貼在子彈後方側邊一起飛
      // 快打中時鏡頭往外拉開，才不會鑽進受害者身體裡
      if(this.showTrace){const out=THREE.MathUtils.smoothstep(bulletS,.55,1);pos=bp.clone().addScaledVector(D,-.6-1.1*out).addScaledVector(S,.24+.75*out).addScaledVector(UP,.07+.18*out);
        look=bp.clone().addScaledVector(D,2.5).lerp(this.impact,THREE.MathUtils.smoothstep(bulletS,.6,1));fov=36;pos=this.safe(bp,pos);}
      else{const k=(e-SHOT.bullet)/(SHOT.impact-SHOT.bullet);pos=this.impact.clone().addScaledVector(S,2.4-1.1*k).addScaledVector(UP,.5).addScaledVector(D,-1.4);look=this.impact.clone();fov=38;pos=this.safe(look,pos);}
    }else if(shot===2){
      // 三、命中定格：側面特寫，短暫震動 + 鏡頭衝擊
      const k=e-SHOT.impact;pos=this.safe(this.impact,this.impact.clone().addScaledVector(S,1.9).addScaledVector(UP,.2).addScaledVector(D,-.7));look=this.impact.clone();
      shake=.035*Math.exp(-k*9);fov=32+5*(1-Math.exp(-k*12));
    }else{
      // 四、倒下：低角度環繞追著骨盆，從側面轉到正面
      const k=THREE.MathUtils.clamp((e-SHOT.fall)/(REPLAY_DURATION-SHOT.fall),0,1),ease=k*k*(3-2*k);
      const hips=this.vHips?this.vHips.getWorldPosition(new THREE.Vector3()):this.impact.clone();
      const ang=THREE.MathUtils.lerp(.45,-.4,ease)*this.sideSign,orbit=S.clone().applyAxisAngle(UP,ang);
      look=hips.clone().addScaledVector(UP,.12);
      pos=this.safe(look,hips.clone().addScaledVector(orbit,THREE.MathUtils.lerp(3,2.25,ease)).addScaledVector(D,-.5).setY(Math.max(hips.y,this.impact.y-1.1)+.32));
      fov=34-4*ease;
    }
    if(cut){this.camPos.copy(pos);this.lookFocus.copy(look);}
    else{this.camPos.lerp(pos,1-Math.exp(-dt*(shot===1?30:8)));this.lookFocus.lerp(look,1-Math.exp(-dt*(shot===1?30:6)));}
    this.camera.position.copy(this.camPos);
    if(shake>0)this.camera.position.add(_w.set(Math.random()-.5,Math.random()-.5,Math.random()-.5).multiplyScalar(shake));
    this.camera.lookAt(this.lookFocus);this.camera.aspect=g.renderer.camera.aspect;this.camera.fov=fov;this.camera.updateProjectionMatrix();
    // 輪廓光從鏡頭對面打過來
    this.rimLight.position.copy(this.lookFocus).addScaledVector(_w.copy(this.lookFocus).sub(this.camPos).normalize(),20).addScaledVector(UP,8);this.rimLight.target.position.copy(this.lookFocus);

    // 受害者的槍在中彈後脫手（遊戲中也是 0.25 秒後消失）
    if(this.vGun)this.vGun.visible=offset<.25;
    // 子彈與彈道
    const flying=this.showTrace&&offset>=-.3&&offset<0;
    this.trace.visible=this.showTrace&&offset>=-.3&&e<SHOT.fall+1.2;
    if(this.trace.visible){const arr=this.trace.geometry.attributes.position;arr.setXYZ(1,bp.x,bp.y,bp.z);arr.needsUpdate=true;this.trace.material.opacity=e<SHOT.fall?.55:.55*(1-(e-SHOT.fall)/1.2);}
    this.bullet.visible=this.bulletGlow.visible=flying;this.bullet.position.copy(bp);this.bulletGlow.position.copy(bp);
    // 命中：閃光、定格、標記
    const sinceHit=offset>=0?e-SHOT.impact:-1;
    this.impactFlash.visible=sinceHit>=0&&sinceHit<.6;this.impactFlash.scale.setScalar((this.explosive?5:.7)*(1+Math.max(0,sinceHit)*2.5));this.impactFlash.material.opacity=Math.max(0,1-sinceHit/.6);
    this.flash=sinceHit>=0?(this.explosive?.9:.45)*Math.exp(-sinceHit*14):0;
    this.marker.visible=shot===2||(shot===3&&e<SHOT.fall+.8);this.marker.material.opacity=shot===2?.9:.9*(1-(e-SHOT.fall)/.8);this.marker.quaternion.copy(this.camera.quaternion);
    if(sinceHit>=0)this.once('hit',()=>audio.play('impf',null,{ui:true,gain:.55,rate:.5,duration:.4}));
    if(shot===1&&this.showTrace)this.once('whiz2',()=>audio.play('whiz',null,{ui:true,gain:.35,rate:.4,duration:1.2}));

    this.cine=Math.min(1,e/.4);
    const fadeOut=THREE.MathUtils.clamp((e-SHOT.fade)/(REPLAY_DURATION-SHOT.fade),0,1);
    this.overlay.style.backgroundColor=`rgba(0,0,0,${Math.max(0,1-e/.35,fadeOut)})`;
    this.overlay.classList.toggle('cut',shot>0);
    const sp=replaySpeed(e);
    this.title.textContent=shot===0?`擊殺者 · ${this.killerName}`:shot===1?(this.showTrace?'子彈時間':'最後一擊'):shot===2?`致命一擊 · ${this.partName}`:'倒下';
    this.speed.textContent=shot===2?'FREEZE':`SLOW · ${sp.toFixed(2)}×`;
    this.detail.textContent=shot===0?`${this.weaponName}`:this.explanation;
    return true;
  }
  stop(){this.active=false;this.overlay.hidden=true;this.cine=0;this.flash=0;
    for(const root of this.clones?.values()||[])root.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.dispose();});
    for(const o of [this.trace,this.bullet,this.marker]){o?.geometry.dispose();o?.material.dispose();}
    this.impactFlash?.material.dispose();this.bulletGlow?.material.dispose();
    this.impactFlash=this.bulletGlow=null;this.trace=this.bullet=this.marker=null;this.scene=null;this.clones=null;this.clip=[];}
}
