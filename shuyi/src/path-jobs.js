// Cooperative A*: independent state per request, yielding every 32 expansions.
export function* searchPath(nav, ax, az, bx, bz, ay=0, by=0) {
  const a=nav.nearest(ax,az,ay),b=nav.nearest(bx,bz,by);if(!a||!b)return null;
  const cost=new Map([[a.id,0]]),parent=new Map(),heap=[];
  const h=n=>Math.hypot(n.x-b.x,n.z-b.z)+Math.abs(n.y-b.y);
  const push=(id,g)=>{const item={id,g,f:g+h(nav.nodes[id])};let i=heap.length;heap.push(item);while(i){const p=(i-1)>>1;if(heap[p].f<=item.f)break;heap[i]=heap[p];i=p;}heap[i]=item;};
  const pop=()=>{const top=heap[0],last=heap.pop();if(heap.length){let i=0;while(i*2+1<heap.length){let c=i*2+1;if(c+1<heap.length&&heap[c+1].f<heap[c].f)c++;if(heap[c].f>=last.f)break;heap[i]=heap[c];i=c;}heap[i]=last;}return top;};
  push(a.id,0);let expanded=0;
  while(heap.length){
    if(++expanded%32===0)yield;
    const item=pop(),n=nav.nodes[item.id];if(item.g!==cost.get(n.id))continue;
    if(!nav.nodeSupported(n))continue;
    if(n.id===b.id){const result=[];for(let id=b.id;id!==undefined;id=parent.get(id)){const p=nav.nodes[id];result.push([p.x,p.z,p.y]);}return result.reverse();}
    for(const id of n.edges){const q=nav.nodes[id];if(!nav.nodeSupported(q))continue;const g=item.g+Math.hypot(q.x-n.x,q.z-n.z)+Math.abs(q.y-n.y)*.8;
      if(g<(cost.get(id)??Infinity)){cost.set(id,g);parent.set(id,n.id);push(id,g);}}
  }
  return null;
}

export class PathJobs {
  constructor(nav){this.nav=nav;this.requests=new Map();this.active=null;}
  request(owner,args,done){this.requests.set(owner,{owner,args,done,revision:-1});}
  clear(){this.requests.clear();this.active=null;}
  update(budget=2){const end=performance.now()+budget;
    do {
      if(this.active&&this.requests.get(this.active.owner)!==this.active)this.active=null;
      if(!this.active)this.active=this.requests.values().next().value;
      const job=this.active;if(!job)return;
      const revision=this.nav.world.structuralRevision||0;
      if(job.revision!==revision){job.revision=revision;job.search=searchPath(this.nav,...job.args);}
      const result=job.search.next();
      if(result.done){this.requests.delete(job.owner);this.active=null;job.done(result.value);}
    }while(performance.now()<end);
  }
}
