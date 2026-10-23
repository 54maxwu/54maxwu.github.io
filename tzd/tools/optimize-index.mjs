import {readFile,writeFile,readdir} from 'node:fs/promises';
import {gunzipSync,gzipSync} from 'node:zlib';
import {fileURLToPath} from 'node:url';
import {packMonthlySequences,getTopicIds} from '../dataset-format.js';
const root=fileURLToPath(new URL('../data/interpretations-v4/',import.meta.url));
let before=0,after=0,count=0;
for(const name of (await readdir(root)).filter(n=>/^\d{4}-\d{2}\.json\.gz$/.test(n))){
  const raw=await readFile(root+name),old=JSON.parse(gunzipSync(raw)),packed=packMonthlySequences(old);
  for(const [key,row] of Object.entries(old.rows))for(const topic of Object.keys(row.c))if(JSON.stringify(getTopicIds(old,row,topic))!==JSON.stringify(getTopicIds(packed,packed.rows[key],topic)))throw Error('Roundtrip failed: '+key);
  const output=gzipSync(JSON.stringify(packed),{level:6});
  await writeFile(root+name,output);before+=raw.length;after+=output.length;count++;
}
if(count!==924)throw Error('Incomplete dataset');
const manifest=JSON.parse(await readFile(root+'manifest.json','utf8'));
await writeFile(root+'manifest.json',JSON.stringify({...manifest,format:'topic-sequences-v2'},null,2));
console.log({months:count,before,after,saved:before-after});
