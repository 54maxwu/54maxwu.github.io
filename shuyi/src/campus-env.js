import * as THREE from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {applyOriginalCampusLighting} from './campus-lighting.js';
export class CampusEnvironment {
 constructor(renderer,scene){this.renderer=renderer;this.scene=scene;this.shipSpeed=0;this.sunDir=new THREE.Vector3(-100,240,80).normalize();const room=new RoomEnvironment(),pmrem=new THREE.PMREMGenerator(renderer);this.envMap=pmrem.fromScene(room).texture;room.dispose();pmrem.dispose();this.real=scene.userData.lighting==='real';this.lights=applyOriginalCampusLighting(scene,renderer,{offset:this.real?[0,0,0]:[-137,-4,94]});
  if(this.real){ // real-scale campus: tone-mapped PBR light, sun shadows over the whole site
   const {hemi,sun}=this.lights;hemi.intensity=1.15;sun.intensity=3.2;sun.position.set(-70,120,55);sun.castShadow=true;sun.shadow.mapSize.set(4096,4096);const c=sun.shadow.camera;c.left=-115;c.right=115;c.top=115;c.bottom=-115;c.near=10;c.far=400;sun.shadow.bias=-.0004;sun.shadow.normalBias=.04;
   scene.environment=this.envMap;scene.environmentIntensity=.35;scene.fog.near=160;scene.fog.far=520;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;this.sunDir=sun.position.clone().normalize();}}
 apply(tod){for(const s of this.extraScenes||[])s.environment=this.envMap;const dusk=tod==='dusk';this.renderer.toneMapping=this.real?THREE.ACESFilmicToneMapping:THREE.NoToneMapping;this.renderer.toneMappingExposure=this.real?1.05:1;this.scene.background.set(dusk?'#cbb9ac':'#b9d4df');this.scene.fog.color.copy(this.scene.background);this.lights.sun.color.set(dusk?'#ffd5ab':'#ffeed6');}
 update(){}
}
