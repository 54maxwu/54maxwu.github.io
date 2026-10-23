import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {gunzipSync,createZstdDecompress,constants} from 'node:zlib';
import {createInterface} from 'node:readline';
import {fileURLToPath} from 'node:url';
import {getTopicIds} from '../dataset-format.js';
const root=fileURLToPath(new URL('../data/interpretations-v4/',import.meta.url));
const json=async name=>JSON.parse(gunzipSync(await readFile(root+name)));
const manifest=JSON.parse(await readFile(root+'manifest.json','utf8'));
const dictionaries=Object.fromEntries(await Promise.all(manifest.topics.map(async t=>[t,await json(`topic-${t}.json.gz`)])));
test('all 924 months contain all real dates, 24 combinations per day, and 13 valid topic references',async()=>{
  const files=(await readdir(root)).filter(n=>/^\d{4}-\d{2}\.json\.gz$/.test(n));
  assert.equal(files.length,924);assert.equal(manifest.topics.length,13);
  let total=0;
  for(let year=1950;year<=2026;year++)for(let month=1;month<=12;month++){
    const data=await json(`${year}-${String(month).padStart(2,'0')}.json.gz`);
    const days=new Date(Date.UTC(year,month,0)).getUTCDate();
    assert.equal(Object.keys(data.rows).length,days*24);
    for(let day=1;day<=days;day++)for(let hour=0;hour<12;hour++)for(const gender of ['male','female']){
      const key=`${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}-${hour}-${gender}`;
      const row=data.rows[key];assert.ok(row,key);assert.equal(Object.keys(row.c).length,13);
      for(const topic of Object.keys(row.c))assert.ok(getTopicIds(data,row,topic).every(id=>Number.isInteger(id)&&typeof dictionaries[topic]?.[id]==='string'),`${key}: ${topic}`);
      total++;
    }
  }
  assert.equal(total,674976);assert.equal(total,manifest.count);
});
test('reconstructed source text is byte-identical for both sexes across sampled years',async()=>{
  for(const year of [1950,1990,2024,2026]){
    const file=fileURLToPath(new URL(`./downloads/year-${year}.jsonl.zst`,import.meta.url));
    const stream=createReadStream(file).pipe(createZstdDecompress({params:{[constants.ZSTD_d_windowLogMax]:27}}));
    const lines=createInterface({input:stream,crlfDelay:Infinity});
    const data=await json(`${year}-01.json.gz`);let checked=0;
    try{
      for await(const line of lines){
        if(!line.trim())continue;
        const row=JSON.parse(line),stored=data.rows[row.k];assert.ok(stored);
        for(const [topic,body]of Object.entries(row.c))assert.equal(getTopicIds(data,stored,topic).map(id=>dictionaries[topic][id]).join('\n'),body);
        if(++checked===2)break;
      }
    }finally{lines.close();stream.destroy();}
    assert.equal(checked,2);
  }
});
