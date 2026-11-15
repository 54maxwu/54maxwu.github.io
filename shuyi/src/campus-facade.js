// 依校園照片：淺色框帶、深紅格柵與綠色陶磚。尺寸為視覺估計。
export function decorateParapet(B,lb,a,b,y){
  const before=B.parts.length;
  lb('brick',a,b,y,y+.95,0,.3);
  const parts=B.parts.slice(before),anchor=parts[0],previous=B._attach;
  if(anchor){
    for(const p of parts){p.links=parts.filter(q=>q!==p)}
    B._attach=anchor;
  }
  // 深色內襯與細磚格柵位於結構牆前，避免透明材質的排序成本。
  lb('stone',a-.02,b+.02,y+.02,y+.19,-.065,.01,false);
  lb('stone',a-.02,b+.02,y+.81,y+.96,-.065,.01,false);
  for(const u of [a,a+(b-a)/2,b-.2])lb('stone',u,u+.2,y+.15,y+.85,-.065,.01,false);
  for(const [u0,u1]of [[a+.2,(a+b)/2],[(a+b)/2+.2,b-.2]]){
    if(u1-u0<.2)continue;
    lb('lattice',u0,u1,y+.19,y+.81,-.055,-.015,false);
  }
  const u=(a+b)/2;
  lb('green',u+.035,u+.165,y+.43,y+.57,-.08,-.067,false);
  lb('stone',a-.03,b+.03,y+.96,y+1.04,-.09,.36,false);
  lb('green',a,b,y+1.05,y+1.1,.12,.18,false);
  B._attach=previous;
}
