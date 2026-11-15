const xyz=p=>p?.toArray?p.toArray():p?Array.from(p):null;
export const actorSource=a=>a?{id:a.id,name:a.name,team:a.team}:null;

// Small local journal. No screenshots, network requests or unbounded match log.
export class CombatHistory {
  constructor(){this.reset();}
  reset(){this.events=[];this.projectiles=new Map();this.nextId=1;}
  add(time,type,data={}){
    const event={...data,id:this.nextId++,time,type};this.events.push(event);
    this.prune(time);
    return event;
  }
  prune(time){
    while(this.events.length>512||this.events[0]?.time<time-12)this.events.shift();
    for(const [id,p]of this.projectiles)if(p.ended!==undefined&&p.ended<time-12)this.projectiles.delete(id);
  }
  shot(time,actor,weapon,origin,direction){return this.add(time,'shot',{source:actorSource(actor),weapon,origin:xyz(origin),direction:xyz(direction)});}
  launch(time,actor,weapon,position){const e=this.add(time,'launch',{source:actorSource(actor),weapon,origin:xyz(position)});
    this.projectiles.set(e.id,{id:e.id,source:e.source,weapon,path:[{time,position:xyz(position)}]});
    while(this.projectiles.size>64)this.projectiles.delete(this.projectiles.keys().next().value);
    return e.id;
  }
  sample(id,time,position,force=false){const p=this.projectiles.get(id);if(!p)return;
    time=Math.max(time,p.path.at(-1).time);
    if(!force&&time-p.path.at(-1).time<.05)return;
    p.path.push({time,position:xyz(position)});if(p.path.length>256)p.path.shift();
  }
  finish(id,time,position){this.sample(id,time,position,true);const p=this.projectiles.get(id);if(p)p.ended=time;}
  impact(time,victim,attacker,weapon,part,point,damage,context={}){
    const projectile=this.projectiles.get(context.projectileId);
    return this.add(time,'hit',{source:context.source||projectile?.source||actorSource(attacker),victim:actorSource(victim),weapon,part,point:xyz(point),exact:!!context.exact,damage,wallbang:!!context.wallbang,
      shotId:context.shotId,origin:xyz(context.origin),projectile:projectile?{...projectile,path:projectile.path.map(s=>({time:s.time,position:[...s.position]}))}:null});
  }
}
