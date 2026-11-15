// 霞雲庭的景觀細節。沿用原有草坪、花台與荷塘位置；造景為示意，非實景測繪。
// 所有零件交給 Builder 合併，不為每片葉子增加獨立 draw call。
import * as THREE from 'three';
import {foliageCluster} from './campus-vegetation.js';

export function gardenDetails(B, lawn) {
  // 草坪曲線石緣：低於跨步高度，不改變原本的通行路線。
  const edge = lawn.getSpacedPoints(150);
  for (let i = 1; i < edge.length; i++) {
    const a = edge[i - 1], b = edge[i], d = a.distanceTo(b);
    const stone = new THREE.BoxGeometry(d + .025, .12, .16);
    stone.rotateY(Math.atan2(b.y - a.y, b.x - a.x));
    stone.translate((a.x + b.x) / 2, .09, -(a.y + b.y) / 2);
    B.geo('stone', stone);
  }

  // 花台內的土壤、石材壓頂與高低錯落的小葉灌木。
  for (const [x, n] of [[-14,-14.5],[4,-14.2],[-12,-37.4],[6,-37.5],[15,-26]]) {
    const soil = new THREE.CylinderGeometry(1.42, 1.42, .035, 24);
    soil.translate(x, .605, -n); B.geo('soil', soil);
    const rim = new THREE.TorusGeometry(1.51, .09, 5, 32);
    rim.rotateX(Math.PI / 2); rim.translate(x, .58, -n); B.geo('stone', rim);
    foliageCluster((k,g)=>B.geo(k,g),x,1.0,-n,1.28,{density:B.quality==='low'?12:35,flatten:.55});
    for (let i = 0; i < 14; i++) {
      const a = i * 2.39996, r = .35 + .85 * Math.sqrt(i / 14);
      if (i % 4 === 0) {
        const flower = new THREE.IcosahedronGeometry(.085, 1);
        flower.translate(x + Math.cos(a)*r, 1.03 + (i%3)*.06, -n + Math.sin(a)*r);
        B.geo('flower', flower);
      }
    }
  }

  // 照片可見的弧形、無靠背石座椅；維持南北緣的主要通道。
  for (const [cx,cn,sign] of [[-7,-17.4,1],[-5,-34.1,-1]]) {
    for(let i=0;i<23;i++){
      const a=.7+i/22*1.74,r=4.25,x=cx+Math.cos(a)*r,n=cn+sign*Math.sin(a)*r,yaw=sign*(Math.PI/2+a);
      const g=new THREE.BoxGeometry(.29,.13,.64);g.rotateY(yaw);g.translate(x,.53,-n);B.geo('stone',g);
      B.world.add({x,y:.53,z:-n,sx:.29,sy:.13,sz:.64,yaw,mat:'concrete',surface:'concrete'});
      if(i%5===1){const leg=new THREE.BoxGeometry(.18,.44,.45);leg.rotateY(yaw);leg.translate(x,.26,-n);B.geo('granite',leg)}
    }
  }

  // 中庭四季燈柱：石質錐柱與環形黑色燈架，造型依照片估計。
  for(const [x,n]of [[-17,-16.2],[9,-15.4],[-17,-34.8],[9,-35.2]]){
    const column=new THREE.CylinderGeometry(.13,.36,2.5,12);column.translate(x,1.29,-n);B.geo('stone',column);
    B.collide(x-.25,x+.25,.04,2.55,n-.25,n+.25);
    const hoop=new THREE.TorusGeometry(.29,.026,5,20);hoop.translate(x,2.9,-n);B.geo('shade',hoop);
    const cap=new THREE.ConeGeometry(.2,.19,12);cap.translate(x,2.85,-n);B.geo('shade',cap);
    const lamp=new THREE.SphereGeometry(.12,8,6);lamp.scale(1,1.45,1);lamp.translate(x,2.68,-n);B.geo('white',lamp);
    const stem=new THREE.CylinderGeometry(.035,.035,.35,6);stem.translate(x,2.62,-n);B.geo('shade',stem);
    for(let i=0;i<3;i++){
      const arc=new THREE.TorusGeometry(.22,.025,4,14,Math.PI*1.2);arc.translate(x, .75+i*.55,-n+.25-i*.02);B.geo('blue',arc);
    }
  }

  // 草地的低矮樹叢與景石，不在主要石板小徑上放置障礙。
  for(const [x,n]of [[-15,-30],[-1,-33],[2,-18]]){
    foliageCluster((k,g)=>B.geo(k,g),x,.3,-n,.85,{density:B.quality==='low'?8:20,flatten:.35});
    const rock=new THREE.DodecahedronGeometry(.4,0);rock.scale(1,.7,.8);rock.rotateY(x);rock.translate(x+.7,.25,-n);B.geo('granite',rock);
  }

  // 荷塘石材壓頂、睡蓮與磨石旁的靜態漣漪。
  for (const n of [-22.2,-17.3]) B.box('stone',5.55,12.45,.45,.52,n-.23,n+.23,false);
  for (const x of [5.8,12.2]) B.box('stone',x-.23,x+.23,.45,.52,-22,-17.5,false);
  for (const [x,n,r] of [[7,-18.5,.36],[7.7,-18.8,.29],[10.8,-21,.42],[11.3,-20.3,.26]]) {
    const pad = new THREE.CircleGeometry(r, 18, .15, Math.PI*1.87);
    pad.rotateX(-Math.PI/2); pad.translate(x,.315,-n); B.geo('leafLight',pad);
  }
  for (const r of [.78,1.05,1.35]) {
    const ripple = new THREE.RingGeometry(r,r+.018,40);
    ripple.rotateX(-Math.PI/2); ripple.translate(9,.312,19.75); B.geo('waterRipple',ripple);
  }
}
