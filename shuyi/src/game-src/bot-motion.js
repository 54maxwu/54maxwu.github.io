// Deliberate movement phases and shot-counted bursts; no hidden enemy state.
export function resetMotion(bot){bot.motionX=bot.motionZ=0;bot.movePhaseUntil=0;bot.triggerAt=0;bot.burstRemaining=0;bot.burstRestUntil=0;bot.burstWeapon=null;bot.plantUntil=bot.aimSettleUntil=0;}
export function smoothMovement(bot,act,dt){
  const k=1-Math.exp(-12*dt);
  bot.motionX=(bot.motionX||0)+(act.wishX-(bot.motionX||0))*k;
  bot.motionZ=(bot.motionZ||0)+(act.wishZ-(bot.motionZ||0))*k;
  act.wishX=bot.motionX;act.wishZ=bot.motionZ;
}
export function combatStep(bot,act,def,distance,now,random=Math.random){
  if(now>=(bot.movePhaseUntil||0)){
    bot.movePhaseUntil=now+.65+random()*.75;
    bot.strafeDir=random()<.3?0:random()<.5?-1:1;
  }
  const planted=def.type==='sniper'||now<(bot.plantUntil||0);
  const side=planted?0:bot.skill.strafe*bot.strafeDir;
  act.wishX=Math.cos(bot.yaw)*side;act.wishZ=-Math.sin(bot.yaw)*side;
  // Briefly plant the feet before a long-range shot, rather than snap-firing while strafing.
  if(distance>14&&now>=(bot.burstRestUntil||0)&&!bot.burstRemaining)bot.plantUntil=now+.24;
}
export function wantsBurst(bot,def,dist,now,random=Math.random){
  if(bot.burstWeapon!==def.id){bot.burstWeapon=def.id;bot.burstRemaining=0;bot.burstRestUntil=0;}
  if(now<(bot.burstRestUntil||0)||now<(bot.aimSettleUntil||0))return false;
  if(!bot.burstRemaining){bot.burstRemaining=dist>25?2+Math.floor(random()*2):dist>14?3+Math.floor(random()*3):7+Math.floor(random()*4);if(dist>14){bot.aimSettleUntil=now+.1;return false;}}
  return true;
}
export function shotFired(bot,def,now,random=Math.random){
  if(!def.auto)return;
  bot.burstRemaining=Math.max(0,(bot.burstRemaining||1)-1);
  if(!bot.burstRemaining){bot.burstRestUntil=now+.22+random()*.25;bot.aimSettleUntil=0;}
}
