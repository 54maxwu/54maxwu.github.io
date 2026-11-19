// Bounded diagnostics available through window.__game.performanceStats.report().
// Render duration is CPU submission time, not a GPU timer.
export class PerformanceStats {
  constructor(){this.samples=[];this.next=0;}
  add(sample){this.samples[this.next]=sample;this.next=(this.next+1)%300;}
  report(){const out={samples:this.samples.length};for(const key of ['frameMs','simulationMs','renderMs','calls','triangles']){
    const a=this.samples.map(s=>s[key]).filter(Number.isFinite).sort((a,b)=>a-b);
    out[key]=a.length?{median:a[Math.floor((a.length-1)*.5)],p95:a[Math.floor((a.length-1)*.95)],max:a.at(-1)}:null;
  }return out;}
}
