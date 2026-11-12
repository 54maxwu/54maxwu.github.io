// 打包遊戲：src/game-src/main.js → ../game-app.js，並由 game-src/index.html + style.css 產生 ../index.html。
const fs=require('fs'),path=require('path'),crypto=require('crypto'),esbuild=require('esbuild');
const out=path.join(__dirname,'..');
(async()=>{
  await esbuild.build({entryPoints:[path.join(__dirname,'game-src/main.js')],bundle:true,format:'iife',target:['es2020'],outfile:path.join(out,'game-app.js'),legalComments:'none'});
  let html=fs.readFileSync(path.join(__dirname,'game-src/index.html'),'utf8');
  html=html.replace('/*__CSS__*/',()=>fs.readFileSync(path.join(__dirname,'game-src/style.css'),'utf8')).replace('/*__JS__*/','');
  const v=crypto.createHash('sha256').update(fs.readFileSync(path.join(out,'game-app.js'))).digest('hex').slice(0,12);
  html=html.replace('</body>','<script src="game-app.js?v='+v+'"></script></body>');
  fs.writeFileSync(path.join(out,'index.html'),html);console.log('built ../index.html, ../game-app.js?v='+v);
})().catch(e=>{console.error(e);process.exit(1)});
