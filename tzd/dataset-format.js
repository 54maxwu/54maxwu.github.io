export function getTopicIds(data,row,topic){
  const ref=row.c[topic];
  const ids=Array.isArray(ref)?ref:data.sequences?.[ref];
  if(!Array.isArray(ids))throw Error('解讀索引版本不一致，請重新載入。');
  return ids;
}
export function packMonthlySequences(data){
  const map=new Map(),sequences=[];
  const rows=Object.fromEntries(Object.entries(data.rows).map(([key,row])=>[key,{...row,c:Object.fromEntries(Object.keys(row.c).map(topic=>{
    const ids=getTopicIds(data,row,topic),key=JSON.stringify(ids);
    if(!map.has(key)){map.set(key,sequences.length);sequences.push(ids);}
    return [topic,map.get(key)];
  }))}]));
  return {...data,format:'topic-sequences-v2',sequences,rows};
}
