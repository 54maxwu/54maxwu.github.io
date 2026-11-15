import * as THREE from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {applyOriginalCampusLighting} from './campus-lighting.js';
import {CampusSky} from './campus-sky.js';
export class CampusEnvironment {
 constructor(renderer,scene,quality='high'){this.renderer=renderer;this.scene=scene;this.shipSpeed=0;this.sunDir=new THREE.Vector3(-100,240,80).normalize();const room=new RoomEnvironment(),pmrem=new THREE.PMREMGenerator(renderer);this.envMap=pmrem.fromScene(room).texture;room.dispose();pmrem.dispose();this.real=scene.userData.lighting==='real';this.lights=applyOriginalCampusLighting(scene,renderer,{offset:this.real?[0,0,0]:[-137,-4,94]});
  if(this.real){ // real-scale campus: tone-mapped PBR light, sun shadows over the whole site
   const {hemi,sun}=this.lights;hemi.intensity=1.15;sun.intensity=3.2;sun.position.set(-70,120,55);sun.castShadow=quality!=='low';const shadowSize=quality==='high'?2048:1024;sun.shadow.mapSize.set(shadowSize,shadowSize);const c=sun.shadow.camera;c.left=-115;c.right=115;c.top=115;c.bottom=-115;c.near=10;c.far=400;sun.shadow.bias=-.0004;sun.shadow.normalBias=.04;
   this.sky=new CampusSky(scene);scene.environment=this.envMap;scene.environmentIntensity=.35;scene.fog.near=125;scene.fog.far=440;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.95;this.sunDir=sun.position.clone().normalize();}}
 apply(tod){
  for(const s of this.extraScenes||[])s.environment=this.envMap;
  const dusk=tod==='dusk';
  this.renderer.toneMapping=this.real?THREE.ACESFilmicToneMapping:THREE.NoToneMapping;
  this.renderer.toneMappingExposure=this.real?.95:1;
  this.scene.background.set(dusk?'#cbb9ac':'#b9d4df');
  this.scene.fog.color.copy(this.scene.background);
  const {sun,hemi}=this.lights;
  sun.color.set(dusk?'#ffd5ab':'#fff0dc');
  if(this.real){
   // 降低直射光，保留磚牆色澤；冷色天空補光讓拱廊陰影仍看得清楚。
   hemi.color.set(dusk?'#c8c7e4':'#d8ecff');
   hemi.groundColor.set('#82715d');hemi.intensity=dusk?.65:.85;
   sun.intensity=dusk?1.8:2.6;
   sun.position.set(-70,dusk?55:100,55);
   sun.shadow.radius=2;
   this.scene.environmentIntensity=dusk?.2:.24;
   this.sunDir.copy(sun.position).normalize();
   this.sky.apply(dusk,this.sunDir);
  }
 }
 update(_dt,time){this.sky?.update(time)}
}
