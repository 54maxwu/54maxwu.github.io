import { SFX } from './sfx.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const pick = (...names) => names[Math.floor(Math.random() * names.length)];

// 響度校正（dB）：以每段錄音最大 100 ms RMS 量測，拉到同類的共同基準；槍聲刻意保留層次（AWM、M870 較響，MP5 較輕）
const CAL = {
  ak47: 4.0, m4a1: 0.8, awm: 1.1, mp5: -4.9, m870: -0.3, deagle: 3.0,
  magin: -4.1, bolt: 4.4, boltback: 4.4, boltfwd: 5.5, dry: 4.1,
  impc: 1.7, impc2: -3.1, impf: -1.1, impm: 6,
  step1: 1.4, step2: 2, step3: 1.8, step4: -2.1,
  explosion: 2.2, explosion2: -0.7, shell: 8,
};

// 所有可聽訊號來自錄音；Web Audio 僅負責播放、定位及濾波。
export class AudioSystem {
  constructor() {
    this.ctx = null; this.ready = false; this.samples = {}; this.active = [];
    this.vol = { master: 0.8, sfx: 0.9, voice: 0.9, ambient: 0 };
    this.listener = { x: 0, y: 0, z: 0 }; this.lowHealth = false; this.nextBeat = 0;
  }
  init(context) {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {}); return this.ready; }
    const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!context && !AC) return false;
    this.ctx = context || new AC({ latencyHint: 'interactive' });
    const c = this.ctx;
    this.master = c.createGain(); this.sfx = c.createGain(); this.world = c.createBiquadFilter();
    this.world.type = 'lowpass'; this.world.frequency.value = 20000;
    this.compressor = c.createDynamicsCompressor();
    this.world.connect(this.sfx); this.sfx.connect(this.compressor); this.compressor.connect(this.master); this.master.connect(c.destination);
    this.setVolumes(this.vol); this.ready = true;
    this.loading = Promise.all(Object.entries(SFX).map(async ([name, bytes]) => {
      try {
        const buffer = await c.decodeAudioData(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
        // 多聲道共同判斷，避免裁掉只出現在右聲道的起音。
        let i = 0; const channels = Array.from({length:buffer.numberOfChannels}, (_,k)=>buffer.getChannelData(k));
        while (i < buffer.length && channels.every(ch=>Math.abs(ch[i])<0.003)) i++;
        this.samples[name] = { buffer, offset: Math.max(0, i - 32) / buffer.sampleRate };
      } catch (e) { console.warn('音效解碼失敗：' + name, e); }
    }));
    if(c.state === 'suspended') c.resume().catch(()=>{});
    return true;
  }
  setVolumes(v) {
    for(const k of Object.keys(this.vol)) if(Number.isFinite(v?.[k]))this.vol[k]=clamp(v[k],0,1);
    if(this.ctx){this.master.gain.value=this.vol.master;this.sfx.gain.value=this.vol.sfx;}
  }
  setListener(p, forward, up) {
    if(p)this.listener={x:p.x,y:p.y,z:p.z}; if(!this.ctx)return;
    const l=this.ctx.listener;
    if(l.positionX){for(const a of ['x','y','z'])l['position'+a.toUpperCase()].value=this.listener[a];
      if(forward)for(const a of ['x','y','z'])l['forward'+a.toUpperCase()].value=forward[a];
      if(up)for(const a of ['x','y','z'])l['up'+a.toUpperCase()].value=up[a];
    }else{l.setPosition(this.listener.x,this.listener.y,this.listener.z);if(forward&&up)l.setOrientation(forward.x,forward.y,forward.z,up.x,up.y,up.z);}
  }
  play(name, pos, {gain=1,rate=1,delay=0,duration,offset=0,ui=false}={}) {
    if(!this.ctx)return;
    const sample=this.samples[name]; if(!sample)return;
    gain*=Math.pow(10,(CAL[name]||0)/20);   // 各段錄音響度不同，先拉到同類一致的基準
    if(pos && Math.hypot(pos.x-this.listener.x,pos.y-this.listener.y,pos.z-this.listener.z)>250)return;
    while(this.active.length>=48)this.active.shift().stop();
    const c=this.ctx, source=c.createBufferSource(), g=c.createGain(), nodes=[source,g];
    source.buffer=sample.buffer;source.playbackRate.value=rate;g.gain.value=gain;source.connect(g);
    let out=g;
    if(pos){const pan=c.createPanner();pan.panningModel='HRTF';pan.distanceModel='inverse';pan.refDistance=4;pan.rolloffFactor=1;pan.maxDistance=250;
      pan.setPosition(pos.x,pos.y,pos.z);out.connect(pan);out=pan;nodes.push(pan);}
    out.connect(ui?this.sfx:this.world);
    const at=c.currentTime+0.005+delay,off=Math.min(sample.buffer.duration,sample.offset+offset),len=Math.min(duration??Infinity,sample.buffer.duration-off);
    if(len<=0){nodes.forEach(n=>n.disconnect());return;}
    // 裁切片段收尾淡出，避免截斷雜音。
    const end=at+len/rate;g.gain.setValueAtTime(gain,at);g.gain.setValueAtTime(gain,Math.max(at,end-0.008));g.gain.linearRampToValueAtTime(0,end);
    this.active.push(source);source.onended=()=>{this.active=this.active.filter(s=>s!==source);nodes.forEach(n=>n.disconnect());};
    source.start(at,off,len);return source;
  }
  playShot(id,pos){this.play(id,pos,{gain:0.85,rate:0.98+Math.random()*0.04});}
  playReload(id,stage){this.play(({magout:'magout',magin:'magin',bolt:'bolt',boltback:'boltback',boltforward:'boltfwd',shell:'magin',pump:'pump'})[stage]||'bolt',null,{gain:0.5,duration:stage==='shell'?0.22:undefined,rate:stage==='shell'?1.2:1});}
  playDryFire(){this.play('dry',null,{gain:0.4});}
  playFootstep(pos,surface,opts={}){this.play(pick('step1','step2','step3','step4'),pos,{gain:opts.crouch?0.13:opts.run?0.5:0.32,rate:0.95+Math.random()*0.1});}
  playLand(pos,surface,strength=1){this.play('land',pos,{gain:0.25+0.5*clamp(strength,0,1)});}
  playJump(pos){this.play('step1',pos,{gain:0.2,duration:0.16});}
  playImpact(pos,mat){this.play(mat==='flesh'?'impf':mat==='metal'?'impm':pick('impc','impc2'),pos,{gain:0.6});}
  playGlassBreak(pos,big=1){this.play(pick('glass','glass2'),pos,{gain:Math.min(big,1.5)*0.65});}
  playDestroy(pos,kind,big=1){this.play('collapse',pos,{gain:Math.min(big,1.5)*0.7});}
  playRicochet(pos){this.play('impm',pos,{gain:0.5,rate:1.35});}
  playBulletWhiz(pos){this.play('whiz',pos,{gain:0.6});}
  playHitmarker(headshot,armored){this.play(headshot?'impm':armored?'impm':'dry',null,{ui:true,gain:headshot?0.9:0.7,rate:headshot?1.7:armored?1.1:1.4,duration:headshot?0.16:0.09});}   // 爆頭用清脆的金屬聲，原本的彈殼聲幾乎聽不到
  playArmorBreak(pos){this.play('glass2',pos,{gain:0.35,duration:0.3,rate:1.3});}
  playSlide(pos){this.play('step3',pos,{gain:0.3,rate:0.65});}
  playKillConfirm(headshot){this.play('bolt',null,{ui:true,gain:0.3,rate:headshot?1.4:1.1,duration:0.22});}
  playHurt(amount){this.play('impf',null,{gain:0.15+clamp(amount,0,100)*0.004});}
  playDeath(pos){this.play('land',pos,{gain:0.6,rate:0.8});}
  playKnife(kind,result,pos){this.play(result==='flesh'?'impf':'knife',pos,{gain:0.5,rate:kind==='heavy'?0.85:1});}
  playGrenadePin(){this.play('boltback',null,{gain:0.35,rate:1.3,duration:0.18});}
  playGrenadeThrow(){this.play('knife',null,{gain:0.22,rate:0.8,duration:0.25});}
  playGrenadeBounce(pos){this.play('impm',pos,{gain:0.35,rate:0.8,duration:0.22});}
  playExplosion(pos){
    this.play(pick('explosion','explosion2'),pos,{gain:1});
    const d=pos?Math.hypot(pos.x-this.listener.x,pos.y-this.listener.y,pos.z-this.listener.z):0;
    if(d<14){const k=1-d/14;this._muffle(k,1.5+2.5*k);this.play('tinnitus',null,{ui:true,gain:0.1+0.25*k,duration:1.5+2.5*k});}
  }
  _muffle(k,duration){if(!this.ctx)return;const f=this.world.frequency,t=this.ctx.currentTime;f.cancelScheduledValues(t);f.setValueAtTime(Math.min(f.value,20000-19000*k),t);f.exponentialRampToValueAtTime(20000,t+duration);}
  playWeaponSwitch(){this.play('magout',null,{gain:0.25,duration:0.2});}
  playScope(zoomIn){this.play('dry',null,{gain:0.15,rate:zoomIn?1.3:1,duration:0.1});}
  playShellDrop(pos){this.play('shell',pos,{gain:0.3,rate:0.95+Math.random()*0.1});}
  playUI(kind){this.play(kind==='start'||kind==='roundEnd'?'boltfwd':'dry',null,{ui:true,gain:0.18,duration:0.18});}
  announce(){this.play('bolt',null,{ui:true,gain:0.18,duration:0.18});}
  setLowHealth(on){this.lowHealth=!!on;if(!on)this.nextBeat=0;}
  startAmbient(){}
  stopAmbient(){}
  update(){if(this.ctx&&this.lowHealth&&this.ctx.currentTime>=this.nextBeat){this.nextBeat=this.ctx.currentTime+0.9;this.play('land',null,{ui:true,gain:0.08,rate:0.65,duration:0.12});}}
}
export const audio = new AudioSystem();
