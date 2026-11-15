// 霞雲庭的景觀細節。沿用原有草坪、花台與荷塘位置；造景為示意，非實景測繪。
// 所有零件交給 Builder 合併，不為每片葉子增加獨立 draw call。
import * as THREE from 'three';

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
    for (let i = 0; i < 14; i++) {
      const a = i * 2.39996, r = .35 + .85 * Math.sqrt(i / 14);
      const g = new THREE.IcosahedronGeometry(.25 + (i % 3) * .045, 1);
      g.scale(1, .65, 1); g.translate(x + Math.cos(a)*r, .84 + (i%3)*.06, -n + Math.sin(a)*r);
      B.geo(i % 3 ? 'leaf' : 'leafLight', g);
      if (i % 4 === 0) {
        const flower = new THREE.IcosahedronGeometry(.085, 1);
        flower.translate(x + Math.cos(a)*r, 1.03 + (i%3)*.06, -n + Math.sin(a)*r);
        B.geo('flower', flower);
      }
    }
  }

  // 座椅放在南北花台旁，避開東側棕櫚步道及西側舞臺階梯。
  for (const [x, n, facing] of [[-7,-13.3,1],[-5,-38.3,-1]]) {
    const start = B.parts.length;
    for (const dx of [-1.05, 1.05]) B.box('granite',x+dx-.12,x+dx+.12,.04,.48,n-.26,n+.26);
    for (let i=0;i<4;i++) B.box('wood',x-1.45,x+1.45,.48,.56,n-.28+i*.15,n-.16+i*.15);
    const back = n - facing*.26;
    for (const dx of [-1.05,1.05]) B.box('metal',x+dx-.035,x+dx+.035,.5,1.12,back-.035,back+.035);
    for (let i=0;i<3;i++) B.box('wood',x-1.45,x+1.45,.72+i*.15,.83+i*.15,back-.055,back+.055);
    // 座板等部件相連，破壞後不留下懸空椅背。
    const parts = B.parts.slice(start);
    for (const p of parts) p.links = parts.filter(q=>q!==p);
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
