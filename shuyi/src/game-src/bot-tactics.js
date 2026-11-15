import * as THREE from 'three';

export function combatIntent({health,mag,reloading,enemies=1,allies=0,type,distance}) {
  if(health<=35||reloading||mag===0||enemies>allies+1)return 'cover';
  if(type==='sniper'&&distance<9||type==='shotgun'&&distance>18)return 'reposition';
  return 'engage';
}

// Inspect only a small number of nearby standing positions against an observed threat.
export function findCover(bot,threat,requireCover=true) {
  const world=bot.game.world;let best=null,bestScore=-Infinity;
  for(let i=0;i<12;i++){
    const angle=i*Math.PI/4,r=i<8?3.5:6.5;
    const x=bot.pos.x+Math.cos(angle)*r,z=bot.pos.z+Math.sin(angle)*r;
    const node=bot.game.nav.nearest(x,z,bot.pos.y);
    if(!node||Math.hypot(node.x-x,node.z-z)>1.5||Math.abs(node.y-.025-bot.pos.y)>.65)continue;
    const floor=world.support(node.x,node.z,.3,bot.pos.y+.4);
    if(!floor||Math.abs(floor.y-bot.pos.y)>.65||world.blocked(node.x,floor.y+.1,node.z,.34,1.65))continue;
    const point=new THREE.Vector3(node.x,floor.y,node.z),eye=point.clone().add(new THREE.Vector3(0,1.1,0));
    const delta=threat.clone().sub(eye),length=delta.length();if(length<1)continue;delta.divideScalar(length);
    const hidden=!!world.raycast(eye.x,eye.y,eye.z,delta.x,delta.y,delta.z,length-.2,'sight');
    if(requireCover&&!hidden)continue;
    if(Math.abs(node.y-.025-floor.y)>.3)continue;
    const score=(hidden?8:0)+point.distanceTo(threat)*.2-point.distanceTo(bot.pos);
    if(score>bestScore){bestScore=score;best=point;}
  }
  return best;
}

export function planTactics(bot,seen,now){
  if(now<(bot.tacticAt||0))return;
  bot.tacticAt=now+.8;
  const w=bot.weapon;
  const allies=bot.game.actors.filter(a=>a!==bot&&a.alive&&a.team===bot.team&&a.pos.distanceToSquared(bot.pos)<144).length;
  bot.tactic=combatIntent({health:bot.hp,mag:w.mag,reloading:w.reloading,enemies:bot.visibleEnemies||1,allies,type:w.def.type,distance:seen.dist});
  if(bot.coverPoint&&now<(bot.coverUntil||0)){
    const p=bot.coverPoint,delta=bot.observedAim.clone().sub(p).add(new THREE.Vector3(0,-1.1,0)),length=delta.length();delta.divideScalar(length||1);
    if(bot.game.world.raycast(p.x,p.y+1.1,p.z,delta.x,delta.y,delta.z,length-.2,'sight')){if(bot.tactic==='engage')bot.tactic='peek';return;}
  }
  bot.coverPoint=null;
  bot.peekPoint=null;bot.peekPhase=null;
  if(bot.tactic==='engage'&&seen.dist>12&&now>=(bot.coverCycleAt||0)){
    bot.coverCycleAt=now+7;
    const point=findCover(bot,bot.observedAim);
    if(point){bot.tactic='peek';bot.coverPoint=point;bot.coverUntil=now+4.5;bot.routeTo(point.x,point.z,point.y);return;}
  }
  if(bot.tactic!=='engage'){
    const point=findCover(bot,bot.observedAim)||findCover(bot,bot.observedAim,false);
    if(point){bot.coverPoint=point;bot.coverUntil=now+2.4;bot.routeTo(point.x,point.z,point.y);bot.state='retreat';}
    else bot.tactic='engage';
  }
}

// A short, unobstructed step from cover, checked against the last observation.
// This does not inspect the hidden target's current position.
export function findPeek(bot){
  const p=bot.coverPoint,threat=bot.observedAim,W=bot.game.world;if(!p||!threat)return null;
  for(let i=0;i<8;i++){const angle=i*Math.PI/4,x=p.x+Math.cos(angle)*1.4,z=p.z+Math.sin(angle)*1.4;
    const node=bot.game.nav.nearest(x,z,p.y);if(!node||Math.hypot(node.x-x,node.z-z)>.8)continue;
    const floor=W.support(node.x,node.z,.3,p.y+.4);if(!floor||Math.abs(floor.y-p.y)>.3||Math.abs(node.y-.025-floor.y)>.3||W.blocked(node.x,floor.y+.1,node.z,.34,1.7))continue;
    const point=new THREE.Vector3(node.x,floor.y,node.z),step=point.clone().sub(p),L=step.length();if(L<.65||L>1.9)continue;step.divideScalar(L);
    if(W.raycast(p.x,p.y+.8,p.z,step.x,step.y,step.z,L,'move'))continue;
    const d=threat.clone().sub(point).add(new THREE.Vector3(0,-1.45,0)),range=d.length();d.divideScalar(range||1);
    if(!W.raycast(point.x,floor.y+1.45,point.z,d.x,d.y,d.z,range-.1,'sight'))return point;
  }
  return null;
}
