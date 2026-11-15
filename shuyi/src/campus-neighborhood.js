// 校界外的街區為環境示意，並非逐棟測繪。細節同樣依材質合併。
export function buildNeighborhood(B){
  const blocks=[[-120,-86,-110,-20,22],[-120,-86,-10,60,30],[-120,-86,70,140,18],[-60,40,92,130,26],[50,110,92,130,34],[87,120,-60,-5,24],[87,120,5,70,40],[-40,70,-125,-84,20],[-120,-50,-125,-84,16]];
  for(const [x0,x1,n0,n1,height]of blocks){
    const longX=x1-x0>n1-n0,length=longX?x1-x0:n1-n0,count=Math.max(2,Math.round(length/15));
    for(let i=0;i<count;i++){
      const a=(longX?x0:n0)+length*i/count+.9,b=(longX?x0:n0)+length*(i+1)/count-.9;
      const xa=longX?a:x0,xb=longX?b:x1,na=longX?n0:a,nb=longX?n1:b;
      const h=Math.round((height*(.65+(i%3)*.18))/3)*3;
      B.box(i%3===0?'cityWarm':'cityCool',xa,xb,0,h,na,nb,false);
      B.box('cityTrim',xa-.12,xb+.12,h-.22,h+.12,na-.12,nb+.12,false);
      for(let y=3;y<h-1;y+=3){
        for(let x=xa+1.8;x<xb-1;x+=3){
          for(const n of [na-.025,nb+.025])B.box('cityWindow',x-.55,x+.55,y,y+1.4,n-.025,n+.025,false);
        }
        for(let n=na+1.8;n<nb-1;n+=3)for(const x of [xa-.025,xb+.025])B.box('cityWindow',x-.025,x+.025,y,y+1.4,n-.55,n+.55,false);
      }
      B.box('cityTrim',xa+1.2,Math.min(xb-1,xa+4.8),h,h+1.6,na+1,Math.min(nb-1,na+4),false);
    }
  }
}
