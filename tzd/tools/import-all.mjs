import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const script=fileURLToPath(new URL('./import-dataset.mjs',import.meta.url));
await Promise.all(Array.from({length:3},(_,worker)=>new Promise((resolve,reject)=>{
  const years=Array.from({length:77},(_,i)=>1950+i).filter((_,i)=>i%3===worker);
  const child=spawn(process.execPath,[script,...years.map(String)],{stdio:'inherit',windowsHide:true});
  child.on('exit',code=>code===0?resolve():reject(Error(`Worker ${worker}: ${code}`)));
  child.on('error',reject);
})));
