import * as THREE from 'three';
import {findCover,findPeek} from './bot-tactics.js';

const COVER_TASKS=new Set(['take-cover','observe-cover','reload-cover','peek-out','fire-window','return-cover']);

// Task completion and interruption rules inspired by classic FPS schedules.
// All threat positions come from perception snapshots, never hidden actors.
export class BotSchedule {
  constructor(bot){this.bot=bot;this.reset();}
  reset(){this.task='roam';this.entered=0;this.until=0;this.cover=null;this.revision=-1;this.trace=[];this.retryAt=0;this.routeRetryAt=0;this.progressAt=0;this.bestDistance=Infinity;}
  change(task,now,reason,duration=0){
    if(this.task===task)return;
    this.task=task;this.entered=now;this.until=now+duration;
    this.trace.push({task,time:now,reason});if(this.trace.length>24)this.trace.shift();
    this.progressAt=now;this.bestDistance=Infinity;
  }
  holdsPlan(){return COVER_TASKS.has(this.task)||this.task==='reload'||this.task==='observe-search';}
  allowsTactics(now){return !this.holdsPlan()&&now>=this.retryAt;}
  cancelRoute(){const b=this.bot;b.routeVersion=(b.routeVersion||0)+1;b.routePending=false;b.path=null;b.pi=0;b.routeGoal=null;}
  clearCover(now,reason){const b=this.bot;this.cancelRoute();this.cover=null;b.coverPoint=null;b.peekPoint=null;b.peekPhase=null;b.coverUntil=0;b.tacticAt=0;
    b.motionX=b.motionZ=0;this.retryAt=now+.6;this.change(b.visible?'engage':'search',now,reason);
  }
  valid(point,shield=false){
    const b=this.bot,W=b.game.world,floor=W.support(point.x,point.z,.3,point.y+.4);
    if(!floor||Math.abs(floor.y-point.y)>.35||W.blocked(point.x,point.y+.1,point.z,.34,1.7))return false;
    if(shield&&b.observedAim){const d=b.observedAim.clone().sub(point).add(new THREE.Vector3(0,-1.1,0)),L=d.length();d.divideScalar(L||1);
      if(!W.raycast(point.x,point.y+1.1,point.z,d.x,d.y,d.z,Math.max(0,L-.1),'sight'))return false;
    }
    return true;
  }
  refresh(now){
    const b=this.bot,revision=b.game.world.structuralRevision||0;
    if(this.cover&&revision!==this.revision){
      if(!this.valid(this.cover,true)){this.clearCover(now,'cover-destroyed');this.revision=revision;return;}
      if(b.peekPoint&&!this.valid(b.peekPoint)){b.peekPoint=null;b.peekPhase='return';this.change('return-cover',now,'peek-floor-destroyed');b.routeTo(this.cover.x,this.cover.z,this.cover.y);}
    }
    this.revision=revision;
    // A completed visual memory must not become permanent wall tracking.
    if(this.cover&&!b.visible&&now-b.lastSeenT>3&&!b.weapon.reloading)this.clearCover(now,'observation-expired');
  }
  adopt(now){const b=this.bot;if(!b.coverPoint)return;
    if(!this.cover||this.cover.distanceToSquared(b.coverPoint)>.09){
      this.cover=b.coverPoint.clone();b.peekPoint=null;b.peekPhase=null;
      this.change('take-cover',now,'cover-selected');
    }
  }
  move(act,destination,now,arrival=.65){
    const b=this.bot,d=b.pos.distanceTo(destination);
    if(d<this.bestDistance-.15){this.bestDistance=d;this.progressAt=now;}
    if(d<=arrival){act.wishX=act.wishZ=0;return true;}
    if(now-this.progressAt>4){this.clearCover(now,'route-timeout');act.wishX=act.wishZ=0;return false;}
    if(!b.routePending&&b.pathDone()){
      if(now>=(this.routeRetryAt||0)){this.routeRetryAt=now+.8;b.routeTo(destination.x,destination.z,destination.y);}
    }
    const direction=b.steer();act.wishX=direction?.[0]||0;act.wishZ=direction?.[1]||0;act.walk=true;
    return false;
  }
  coverAction(act,now){
    const b=this.bot,w=b.weapon;this.adopt(now);if(!this.cover)return;
    const endangered=w.reloading||w.mag===0||b.hp<=35||b.lastHurt>this.entered;
    if(['peek-out','fire-window'].includes(this.task)&&endangered){
      b.peekPhase='return';this.change('return-cover',now,'hurt-or-reload');b.routeTo(this.cover.x,this.cover.z,this.cover.y);
    }
    if(this.task==='take-cover'||this.task==='return-cover'){
      act.fire=act.firePressed=false;
      if(!this.move(act,this.cover,now))return;
      b.peekPoint=null;b.peekPhase=null;this.cancelRoute();
      this.change('observe-cover',now,'cover-reached',.45);act.crouch=true;
    }
    if(this.task==='observe-cover'||this.task==='reload-cover'){
      act.wishX=act.wishZ=0;act.fire=act.firePressed=false;act.crouch=true;
      if(w.reloading){this.change('reload-cover',now,'reload-in-progress');return;}
      if(w.canReload()&&(w.mag<Math.max(1,w.def.mag*.3)||b.hp<=35)){
        b.startReload();if(w.reloading)this.change('reload-cover',now,'reload-started');return;
      }
      if(this.task==='reload-cover'){this.change('observe-cover',now,'reload-complete',.5);return;}
      if(now<this.until)return;
      if(now-b.lastSeenT>2.5){this.clearCover(now,'search-after-cover');return;}
      if(b.tactic!=='peek'||b.hp<=35){
        if(now-this.entered>1.6)this.clearCover(now,'defensive-pause-complete');return;
      }
      const point=findPeek(b);
      if(!point){this.clearCover(now,'no-safe-peek');return;}
      b.peekPoint=point;b.peekPhase='out';this.change('peek-out',now,'peek-selected');b.routeTo(point.x,point.z,point.y);
    }
    if(this.task==='peek-out'){
      act.fire=act.firePressed=false;act.crouch=false;
      if(!b.peekPoint){this.clearCover(now,'peek-missing');return;}
      if(this.move(act,b.peekPoint,now,.5)){this.cancelRoute();b.peekPhase='exposed';this.change('fire-window',now,'peek-reached',.65);}
    }
    if(this.task==='fire-window'){
      act.wishX=act.wishZ=0;act.crouch=false;
      if(now>=this.until||!b.visible){act.fire=act.firePressed=false;b.peekPhase='return';this.change('return-cover',now,b.visible?'firing-window-complete':'lost-sight');b.routeTo(this.cover.x,this.cover.z,this.cover.y);}
    }
  }
  apply(act,now){
    const b=this.bot,w=b.weapon;
    if(b.coverPoint)return; // cover action already ran through fight()/travel().
    if(COVER_TASKS.has(this.task)){this.cover=null;this.change(b.visible?'engage':'search',now,'cover-released');}
    if(w.reloading){this.change('reload',now,'reload-in-progress');act.fire=act.firePressed=false;return;}
    if(w.mag===0&&w.canReload()){
      if(now>=this.retryAt&&b.observedAim&&now-b.lastSeenT<3){this.retryAt=now+1;const point=findCover(b,b.observedAim);
        if(point){b.coverPoint=point;b.tactic='cover';b.routeTo(point.x,point.z,point.y);this.coverAction(act,now);return;}}
      b.startReload();this.change('reload',now,'empty-no-cover');act.fire=act.firePressed=false;return;
    }
    if(b.visible){if(now>=b.reactUntil)this.change('engage',now,'visible-enemy');else this.change('react',now,'visual-reaction');return;}
    if(this.task==='reload')this.change('search',now,'reload-complete');
    const memory=b.lastSeen&&now-b.lastSeenT<5;
    if(memory&&b.pos.distanceTo(b.lastSeen)<2.5&&this.task!=='observe-search'){
      this.cancelRoute();this.searchYaw=b.yaw;this.change('observe-search',now,'search-location-reached',1.1);
    }
    if(this.task==='observe-search'){
      act.wishX=act.wishZ=0;act.fire=act.firePressed=false;
      act.yaw=(this.searchYaw??b.yaw)+Math.sin((now-this.entered)*3)*.6;act.pitch=0;
      if(now>=this.until||!memory){b.lastSeen=null;b.huntFor=undefined;this.change('roam',now,'search-complete');b.newGoal();}
      return;
    }
    this.change(memory?'search':b.state==='listen'?'listen':'roam',now,'perception-update');
  }
}
