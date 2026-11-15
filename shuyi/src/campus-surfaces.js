import * as THREE from 'three';

function texture(size,draw,data=false){
  const c=document.createElement('canvas');c.width=c.height=size;draw(c.getContext('2d'),size);
  const t=new THREE.CanvasTexture(c);t.colorSpace=data?THREE.NoColorSpace:THREE.SRGBColorSpace;
  t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=8;return t;
}
function seeded(seed=421){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}}

export function brickMaps(){
  // 與實景一致的細灰縫、褪色紅磚；高度圖獨立，避免把亮色灰縫做成凸起。
  const draw=(mode)=>(g,size)=>{
    const rand=seeded(),bw=size/8,bh=size/24;
    g.fillStyle=mode==='color'?'#999287':mode==='height'?'#333333':'#ededed';g.fillRect(0,0,size,size);
    for(let row=0;row<24;row++)for(let col=-1;col<8;col++){
      const x=col*bw+(row%2?bw/2:0),y=row*bh,k=rand(),warm=rand();
      g.fillStyle=mode==='color'?`rgb(${145+k*40|0},${84+k*26+warm*6|0},${64+k*22|0})`:mode==='height'?`rgb(${180+k*40|0},${180+k*40|0},${180+k*40|0})`:'#c9c9c9';
      g.fillRect(x+1.5,y+1.5,bw-3,bh-3);
      if(mode==='color'){
        for(let i=0;i<16;i++){g.fillStyle=`rgba(45,33,25,${.025+rand()*.055})`;g.fillRect(x+rand()*bw,y+rand()*bh,1+rand()*5,1+rand()*2)}
        g.fillStyle='rgba(230,211,181,.07)';g.fillRect(x+3,y+2,bw-6,2);
      }
    }
  };
  return{map:texture(768,draw('color')),bumpMap:texture(768,draw('height'),true),bumpScale:.018,roughnessMap:texture(768,draw('rough'),true)};
}

export function foliageTexture(){
  return texture(256,(g)=>{
    const rand=seeded(827);g.clearRect(0,0,256,256);
    g.strokeStyle='#475b32';g.lineWidth=3;g.beginPath();g.moveTo(128,245);g.bezierCurveTo(105,150,160,95,128,12);g.stroke();
    for(let i=0;i<70;i++){
      const y=20+rand()*211,spread=Math.sin((y/256)*Math.PI)*100,x=128+(rand()-.5)*spread*2;
      const k=rand();g.fillStyle=`rgb(${39+k*37|0},${69+k*43|0},${23+k*20|0})`;
      g.beginPath();g.ellipse(x,y,7+rand()*7,3+rand()*4,rand()*Math.PI,0,Math.PI*2);g.fill();
    }
  });
}

export function lawnTexture(){
  return texture(512,(g,size)=>{
    const rand=seeded(594);g.fillStyle='#657b42';g.fillRect(0,0,size,size);
    for(let i=0;i<95;i++){
      const x=rand()*size,y=rand()*size,r=12+rand()*52,grad=g.createRadialGradient(x,y,0,x,y,r);
      grad.addColorStop(0,i%3?'rgba(160,150,81,.24)':'rgba(45,76,36,.24)');grad.addColorStop(1,'rgba(90,110,50,0)');g.fillStyle=grad;g.fillRect(x-r,y-r,r*2,r*2);
    }
    for(let i=0;i<26000;i++){
      const x=rand()*size,y=rand()*size,k=rand();g.strokeStyle=k>.5?'rgba(178,188,106,.22)':'rgba(37,65,27,.22)';g.lineWidth=.6;
      g.beginPath();g.moveTo(x,y);g.lineTo(x+(rand()-.5)*3,y-1-rand()*3);g.stroke();
    }
  });
}

export function herringboneTexture(){
  return texture(512,(g,size)=>{
    const rand=seeded(316);g.fillStyle='#8e8274';g.fillRect(0,0,size,size);
    const unit=32;
    // 2:1 磚以直、橫方向交錯鋪設，形成照片可見的人字紋。
    for(let a=-16;a<24;a++)for(let b=-32;b<32;b++){
      const x=(2*a-b)*unit,y=(2*a+b)*unit;
      for(const [dx,dy,w,h]of [[0,0,unit*2,unit],[unit*2,0,unit,unit*2]]){
        const k=rand();g.fillStyle=`rgb(${139+k*31|0},${93+k*23|0},${73+k*21|0})`;
        g.fillRect(x+dx+1,y+dy+1,w-2,h-2);
      }
    }
  });
}

export function latticeTexture(){
  return texture(128,g=>{
    g.fillStyle='#333c34';g.fillRect(0,0,128,128);
    g.fillStyle='#854936';g.fillRect(0,0,128,18);g.fillRect(0,0,18,128);
    g.fillStyle='#a8684b';g.fillRect(1,1,127,3);g.fillRect(1,1,3,127);
    g.fillStyle='rgba(0,0,0,.25)';g.fillRect(18,18,110,7);g.fillRect(18,18,7,110);
  });
}
