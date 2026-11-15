import * as THREE from 'three';

// 程序天空，不下載影像；線性色彩直接進入遊戲既有 HDR 輸出流程。
export class CampusSky {
  constructor(scene) {
    const u=this.uniforms={top:{value:new THREE.Color()},horizon:{value:new THREE.Color()},cloud:{value:new THREE.Color()},sunDir:{value:new THREE.Vector3()},time:{value:0}};
    const material=new THREE.ShaderMaterial({
      side:THREE.BackSide,depthWrite:false,depthTest:false,fog:false,toneMapped:false,uniforms:u,
      vertexShader:`varying vec3 vDirection;void main(){vDirection=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
      fragmentShader:`
        varying vec3 vDirection;
        uniform vec3 top,horizon,cloud,sunDir;
        uniform float time;
        float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
        float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
        float fbm(vec2 p){return .55*noise(p)+.28*noise(p*2.03+13.7)+.12*noise(p*4.07-7.1)+.05*noise(p*8.1);}
        void main(){
          vec3 d=normalize(vDirection);
          float elevation=max(d.y,0.0);
          vec3 color=mix(horizon,top,pow(smoothstep(0.0,.85,elevation),.55));
          vec2 p=d.xz/(elevation+.22)*1.6+vec2(time*.0015,0);
          float density=smoothstep(.48,.73,fbm(p));
          float band=smoothstep(.015,.12,elevation)*(1.0-smoothstep(.65,.95,elevation));
          color=mix(color,cloud,density*band*.8);
          float sun=max(dot(d,sunDir),0.0);
          color+=vec3(1.0,.78,.48)*pow(sun,32.0)*.13;
          gl_FragColor=vec4(color,1.0);
        }`,
    });
    this.mesh=new THREE.Mesh(new THREE.SphereGeometry(2500,24,12),material);
    this.mesh.name='campus:sky';this.mesh.frustumCulled=false;this.mesh.renderOrder=-100;
    this.mesh.onBeforeRender=(_r,_s,camera)=>{this.mesh.position.copy(camera.position);this.mesh.updateMatrixWorld()};
    scene.add(this.mesh);
  }
  apply(dusk,sunDir){
    this.uniforms.top.value.set(dusk?'#777fba':'#6d9fc7');
    this.uniforms.horizon.value.set(dusk?'#e7ba98':'#d4e0e0');
    this.uniforms.cloud.value.set(dusk?'#edd4c7':'#f4f2e9');
    this.uniforms.sunDir.value.copy(sunDir);
  }
  update(time){this.uniforms.time.value=time||0}
}
