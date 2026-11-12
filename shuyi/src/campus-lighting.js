import * as THREE from 'three';
// Match the first map preview's materials, lighting and background.
export function applyOriginalCampusLighting(scene,renderer,{offset=[0,0,0],dusk=false}={}){
 renderer.toneMapping=THREE.NoToneMapping;renderer.toneMappingExposure=1;
 scene.background=new THREE.Color(dusk?'#cbb9ac':'#b9d4df');scene.fog=new THREE.Fog(dusk?'#cbb9ac':'#b9d4df',380,850);
 const hemi=new THREE.HemisphereLight(0xe5f3ff,0x80755c,2.4);const sun=new THREE.DirectionalLight(dusk?0xffd5ab:0xffeed6,2);
 sun.position.set(-100+offset[0],240+offset[1],80+offset[2]);sun.target.position.fromArray(offset);scene.add(hemi,sun,sun.target);
 return {hemi,sun};
}
