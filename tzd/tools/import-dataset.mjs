// Node 25+: stream upstream zstd, deduplicate paragraphs, emit month-sized gzip shards.
import { createReadStream } from 'node:fs';
import { mkdir, readFile, writeFile, rename, readdir } from 'node:fs/promises';
import { createZstdDecompress, constants, gzipSync } from 'node:zlib';
import { createInterface } from 'node:readline';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../',import.meta.url));
const downloads=root+'tools/downloads/';
const output=root+'data/interpretations/';
await mkdir(downloads,{recursive:true}); await mkdir(output,{recursive:true});
const assets=JSON.parse(await readFile(root+'tools/release-assets.json','utf8'));
const checks=await readFile(root+'vendor/ziwei-doushu/DATASET-SHA256SUMS.txt','utf8');
const selected=process.argv.slice(2);
let count=0;
for(const a of assets.filter(a=>/^year-\d+\.jsonl.zst$/.test(a.name) && (!selected.length||selected.some(y=>a.name.includes(y))))) {
  const year=a.name.slice(5,9);
  if((await readdir(output)).filter(n=>n.startsWith(year+'-')&&n.endsWith('.json.gz')).length===12){console.log(`${year}: already imported`);continue;}
  const path=downloads+a.name;
  try { await readFile(path); } catch {
    const res=await fetch(a.browser_download_url,{signal:AbortSignal.timeout(60000)}); if(!res.ok)throw Error(`${a.name}: HTTP ${res.status}`);
    await writeFile(path+'.tmp',new Uint8Array(await res.arrayBuffer())); await rename(path+'.tmp',path);
  }
  const digest=createHash('sha256').update(await readFile(path)).digest('hex');
  if(!checks.includes(`${digest}  ${a.name}`) && !checks.includes(`${digest} *${a.name}`))throw Error('Checksum mismatch: '+a.name);
  const lines=createInterface({input:createReadStream(path).pipe(createZstdDecompress({params:{[constants.ZSTD_d_windowLogMax]:27}})),crlfDelay:Infinity});
  let month=null, dict=[], map=new Map(), rows={};
  const flush=async()=>{
    if(month===null)return;
    const data={version:'v4.0-13d',sourceSha256:digest,year:+a.name.slice(5,9),month,dict,rows};
    const destination=`${output}${data.year}-${String(month).padStart(2,'0')}.json.gz`;
    await writeFile(destination,gzipSync(JSON.stringify(data),{level:1}));
  };
  for await(const line of lines) {
    if(!line.trim())continue;
    const row=JSON.parse(line);
    if(row.m!==month){await flush();month=row.m;dict=[];map=new Map();rows={};}
    const topics={};
    for(const [topic,body] of Object.entries(row.c))topics[topic]=body.split('\n').map(p=>{
      if(!map.has(p)){map.set(p,dict.length);dict.push(p);}return map.get(p);
    });
    rows[row.k]={ms:row.ms,c:topics};count++;
  }
  await flush();
  console.log(`${a.name}: imported; total ${count}`);
}
console.log('Dataset import complete');
