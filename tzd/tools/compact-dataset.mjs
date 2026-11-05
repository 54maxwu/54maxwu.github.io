import {readFile,writeFile,readdir,mkdir} from 'node:fs/promises';
import {gzipSync,gunzipSync} from 'node:zlib';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../data/interpretations/',import.meta.url));
const output=fileURLToPath(new URL('../data/interpretations-v4/',import.meta.url));
await mkdir(output,{recursive:true});
const maps={},dicts={};let count=0;
const files=(await readdir(root)).filter(n=>/^\d{4}-\d{2}\.json\.gz$/.test(n)).sort();
if(files.length!==77*12)throw Error(`Expected 924 month shards, received ${files.length}`);
for(const name of files){
  const d=JSON.parse(gunzipSync(await readFile(root+name)));
  const expected=new Date(Date.UTC(d.year,d.month,0)).getUTCDate()*24;
  if(Object.keys(d.rows).length!==expected)throw Error(`${name}: incomplete month`);
  for(const row of Object.values(d.rows)){
    for(const [topic,ids] of Object.entries(row.c)){
      const map=maps[topic]??=new Map(),dict=dicts[topic]??=[];
      row.c[topic]=ids.map(id=>{const text=d.dict[id];if(!map.has(text)){map.set(text,dict.length);dict.push(text);}return map.get(text);});
    }
    count++;
  }
  delete d.dict;d.format='topic-dictionary-v1';
  await writeFile(output+name,gzipSync(JSON.stringify(d),{level:6}));
}
if(count!==674976)throw Error(`Expected 674976 charts, received ${count}`);
for(const [topic,dict]of Object.entries(dicts))await writeFile(output+`topic-${topic}.json.gz`,gzipSync(JSON.stringify(dict),{level:6}));
await writeFile(output+'manifest.json',JSON.stringify({version:'v4.0-13d',format:'topic-dictionary-v1',count,years:[1950,2026],topics:Object.keys(dicts),source:'https://github.com/Renhuai123/ziwei-doushu',author:'王多鱼AI'},null,2));
console.log('Compacted',count,'charts; paragraphs',Object.fromEntries(Object.entries(dicts).map(([k,v])=>[k,v.length])));
