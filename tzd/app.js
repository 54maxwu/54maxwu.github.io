import { buildBazi, lunar2solar, solar2lunar, leapMonth, GAN_WX, GAN, ZHI, ZHI_WX, GAN_YY, ZHI_YY } from "./engine-calendar.js";
import { chengGu } from "./engine-chenggu.js";
import { fullBaziAnalysis, SHISHEN_DESC } from "./engine-bazi.js";
import { calcDaYun, annotateDaYun, calcLiuNian, calcLiuYue, LUCK_THEME } from "./engine-luck.js";
import { shengXiaoInfo, sunSign, risingSign, SIGN_TRAIT, SIGN_DETAIL, SX_DETAIL, SX_NAMING, nameAnalysis, nameSuggest, charsByStroke, luckText } from "./engine-aux.js";
import { coupleAnalysis } from "./engine-couple.js";
import { extractZiwei, buildHoroscope, PALACE_ORDER, SIHUA_DESC, BOSHI12_DESC } from "./engine-ziwei.js";
import { BRIGHT_NOTE, GAN_IMG, ZHI_SX, ZHI_HR, BR_LEVEL, NAYIN_PLAIN, WX_COLOR, SHICHEN, TW_CITY, PILLAR_LIFE, WX_REMEDY, COLOR_HEX, STRENGTH_PLAIN, SHENSHA_PLAIN, POS_PLAIN, PATTERN_PLAIN, GOD_SHORT, GOD_YEAR, GRID_POS, ZW_IDX_BRANCH, PALACE_TOPIC, PALACE_SHORT, ZW_CHONG, ZW_SANHE, WX_HEALTH, SAVE_KEY } from "./ui-data.js";
import { renderSingle, renderCouple, bindTabs } from "./render.js";
import { GLOSSARY, SHISHEN_MONEY, DAYGAN_PROFILE, NAYIN_TREND,
  HAI_DESC, HAI_GENERAL, CHONG_DESC, CHONG_GENERAL, HE_GENERAL, TIANLUO_DESC, XING_GENERAL } from "./glossary.js";

/* 廟旺得利平不陷：星曜在該宮的「亮度／力量」，白話一句 */
/* 天干、地支白話意象（給四柱大字 tooltip） */
/* 亮度→七級訊號條（廟7…陷1），像手機訊號強弱 */

/* 三十納音白話一句（傳統意象，趣味參考） */
const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];

/* ---- 表單初始化 ---- */
function fillSelect(sel,from,to,suffix,fn){
  for(let i=from;i<=to;i++){const o=document.createElement("option");o.value=i;o.textContent=(fn?fn(i):i)+suffix;sel.appendChild(o);}
}
["m1","m2"].forEach(id=>fillSelect($("#"+id),1,12," 月"));
["d1","d2"].forEach(id=>fillSelect($("#"+id),1,31," 日"));
["h1","h2"].forEach(id=>{const s=$("#"+id);for(let i=0;i<24;i++){const o=document.createElement("option");o.value=i;o.textContent=String(i).padStart(2,"0")+" 時";s.appendChild(o);}});
["min1","min2"].forEach(id=>{const s=$("#"+id);for(let i=0;i<60;i+=5){const o=document.createElement("option");o.value=i;o.textContent=String(i).padStart(2,"0")+" 分";s.appendChild(o);}});

/* 台灣各縣市中心經度（東經），選了自動帶入做真太陽時校正 */
(function initCity(){
  const sel=$("#city1"); if(!sel) return;
  TW_CITY.forEach(([name,lon])=>{const o=document.createElement("option");o.value=lon;o.textContent=name;sel.appendChild(o);});
  sel.addEventListener("change",()=>{
    if(sel.value===""){ setSeg("tst1","0"); }     // 不指定 → 不校正
    else { $("#lon1").value=sel.value; setSeg("tst1","1"); }  // 選了縣市 → 帶經度並開啟校正
  });
})();

/* seg 按鈕通用 */
const segVal={};
$$(".seg").forEach(seg=>{
  const key=seg.dataset.seg;
  segVal[key]=seg.querySelector(".on")?.dataset.v;
  seg.querySelectorAll("button").forEach(b=>b.addEventListener("click",()=>{
    seg.querySelectorAll("button").forEach(x=>x.classList.remove("on"));
    b.classList.add("on");segVal[key]=b.dataset.v;
    if(key==="hknown1") $(".hrow1").style.display=b.dataset.v==="1"?"flex":"none";
    if(key==="hknown2") $(".hrow2").style.display=b.dataset.v==="1"?"flex":"none";
  }));
});
$$(".adv-toggle").forEach(t=>t.addEventListener("click",()=>{
  const box=$("#"+t.dataset.adv);box.classList.toggle("show");
  t.textContent=t.textContent.replace(box.classList.contains("show")?"▸":"▾",box.classList.contains("show")?"▾":"▸");
}));

/* 模式切換 */
let MODE="single";
$$(".mode-btn").forEach(b=>b.addEventListener("click",()=>{
  $$(".mode-btn").forEach(x=>x.classList.remove("on"));b.classList.add("on");
  MODE=b.dataset.mode;
  $("#personGrid").classList.toggle("couple",MODE==="couple");
  $("#p1label").textContent=MODE==="couple"?"本人資料":"命主資料";
  $("#result").classList.remove("show");
}));

/* ---- 讀取一個人的輸入 → bazi 分析 ---- */
function readPerson(n){
  const name=$("#name"+n).value.trim();
  const sex=segVal["sex"+n];
  let y=+$("#y"+n).value, m=+$("#m"+n).value, d=+$("#d"+n).value;
  const known=segVal["hknown"+n]==="1";
  const hour=known?+$("#h"+n).value:-1;
  const minute=known?+$("#min"+n).value:0;
  if(!y) throw "請輸入"+(n===1?"":"對方")+"出生年份";
  if(segVal["cal"+n]==="lunar"){
    if(y<1900||y>2100) throw "農曆轉換僅支援 1900–2100";
    const sol=lunar2solar(y,m,d,false);y=sol.y;m=sol.m;d=sol.d;
  }
  if(y<1900||y>2100) throw "請輸入正確年份 (1900–2100)";
  const opts={};
  if(n===1 && segVal.tst1==="1"){opts.useTrueSolar=true;opts.longitude=+$("#lon1").value||121.5;}
  if(n===1) opts.ziSchool=$("#zi1").value;
  const bz=buildBazi(y,m,d,hour,minute,opts);
  const analysis=fullBaziAnalysis(bz);
  analysis.name=name; analysis.sex=sex;
  // 命中最旺/最弱五行
  let _mx=-1,_mn=99;
  for(const k in analysis.tally){
    if(analysis.tally[k]>_mx){_mx=analysis.tally[k];analysis.strong=k;}
    if(analysis.tally[k]<_mn){_mn=analysis.tally[k];analysis.weak=k;}
  }
  analysis.sx=shengXiaoInfo(bz.yZhi);
  analysis.sign=sunSign(bz.solar.m,bz.solar.d);
  analysis.rising=known?risingSign(bz.solar.m,bz.solar.d,hour):null;
  analysis.nameInfo=name?nameAnalysis(name):null;
  // 紫微
  if(typeof iztro!=="undefined" && known){
    try{
      const g=sex==="女"?"女":"男";
      const ds=bz.solar.y+"-"+bz.solar.m+"-"+bz.solar.d;
      const hi=bz.hourIdx>=0?bz.hourIdx:0;
      const astro=iztro.astro.bySolar(ds,hi,g,true,"zh-TW");
      analysis.ziwei=extractZiwei(astro);
      // 紫微運限（流年盤）：以「今天」起盤，UI 可切換年份
      try{
        const now=new Date();
        const today=now.getFullYear()+"-"+(now.getMonth()+1)+"-"+now.getDate();
        analysis.ziweiHoro=buildHoroscope(astro, today, hi);
        analysis._ziweiAstro=astro;  // 留著供切換年份重算
      }catch(e){analysis.ziweiHoro=null;}
    }catch(e){analysis.ziwei=null;analysis.ziweiHoro=null;}
  }else analysis.ziwei=null;
  // 袁天罡稱骨（年干支+農曆月日+時辰，時辰依真太陽時）
  try{
    const eff=bz.effective||{y:bz.solar.y,m:bz.solar.m,d:bz.solar.d};
    const lun=solar2lunar(eff.y,eff.m,eff.d);
    analysis.chenggu=chengGu(bz,lun);
  }catch(e){analysis.chenggu=null;}
  return analysis;
}

/* ====== 渲染：四柱排盤表 ====== */
/* 四柱代表的人生範圍（白話） */
/* 去掉字串尾端的句號（避免拼接時出現「。。」） */
/* 取十神白話（GLOSSARY 第一句） */

/* ====== 五行條 ====== */
/* ====== 五角雷達圖（戰鬥力風格，五行/十神共用） ======
 * items: [{label, value, color}]  共5項
 */

/* ====== 五行生剋對照（相生/相剋/特殊作用/通關）======
 * 依使用者命局五行多寡，動態點出可能的「過旺乘剋」與建議的「通關」五行。*/

/* 五行調補對照：每個五行對應的顏色/方位/季節時段/行業/生活面向 */
/* 把顏色名稱（黑色、藍色…）渲染成有底色的小色塊，一看就懂 */
/* 五行調補說明卡 */

/* ====== 身強弱明細 ====== */
/* 身強弱白話 */
/* 把身強弱那句文言翻成白話 */

/* ====== 用神 ====== */

/* ====== 十神分布 ====== */

/* ====== 十神 × 賺錢方式 ====== */

/* ====== 神煞 ====== */
/* 神煞白話：類型(吉/凶/中)＋一句白話＋對你的提醒 */
/* 柱位白話 */

/* ====== 袁天罡稱骨 ====== */

/* ====== 格局 ====== */
/* 格局白話：是什麼人＋怎麼走最順＋提醒 */

/* 十神一句白話（用於大運/流年的小註解） */
/* 十神流年「主題」：這一年容易遇到的事（白話、不深） */

/* 大運流年共用：頂部白話說明 */

/* ====== 大運流年 ====== */

/* ====== 紫微方格盤 ====== */

/* iztro index(0-11) → 地支：固定 寅起 */

/* ====== 紫微流年盤（運限：大限/流年/小限/流月）====== */

/* 紫微命盤總評卡：跑遍12宮排序，主動給整體結論＋最強/最弱宮＋圖例 */

/* 紫微命盤白話總結 */

/* 單一宮位的浮動框內容 */
/* 一個宮的主星簡述（含亮度），給三方四正列用 */
/* 把本宮＋三方四正整合成一句白話結論 */
/* 各宮的白話主題 */
/* 純評分：把本宮＋三方四正的星算成分數＋吉凶級 */

/* 地支三方四正（對宮＝沖、三合＝左右隔四格） */

/* ====== 緊湊大運時間軸（dashboard 用） ====== */

/* ====== 一段話讀懂你的命（白話綜合解讀） ====== */

/* ====== Dashboard 總覽（寬版多欄，一頁看完） ====== */

/* ====== 八字健康（疾厄）分析 ====== */
/* 五行→臟腑/身體部位，及偏弱(缺)/偏旺(亢)各自的提醒 */
/* ====== 日主天干人格速寫（你是哪種人）====== */

/* ====== 地支互動（六合/三合/六沖/相刑/六害/天羅地網）====== */


/* ====== 星座（豐富版） ====== */

/* ====== 生肖（豐富版） ====== */

/* ====== 主渲染（單人） ====== */


/* 改名建議：凶格 → 要改哪個字、改成幾畫、有哪些字可選 */
/* 生肖宜用部首與範例字 */

/* 命局綜評（自家公式，透明可解釋） */

/* ====== 合盤用：個人命盤精簡摘要 ====== */

/* ====== 合盤渲染 ====== */

/* ====== tab 切換 + 流月 lazy ====== */

/* ====== 紫微流年盤：年份切換（重算 horoscope，原地換盤）====== */

/* ====== 點四柱的十二長生 → 上方對照表高亮 ====== */

/* ====== 紫微宮位浮動框＋三方四正連線 ====== */

/* ====== 收合 / 展開表單 ====== */
function calLabel(n){return segVal["cal"+n]==="lunar"?"農":"國";}
function personLabel(n){
  const name=$("#name"+n).value.trim()||"未命名";
  const y=$("#y"+n).value,m=$("#m"+n).value,d=$("#d"+n).value;
  const known=segVal["hknown"+n]==="1";
  const t=known?` ${String($("#h"+n).value).padStart(2,"0")}:${String($("#min"+n).value).padStart(2,"0")}`:" 時辰不詳";
  return `${name}・${calLabel(n)}${y}/${m}/${d}${t}`;
}
function collapseForm(){
  $("#formZone").classList.add("collapsed");
  $(".page-content").classList.add("wide");
  const info = MODE==="couple"
    ? `${personLabel(1)} ✕ ${personLabel(2)}`
    : personLabel(1);
  $("#recapInfo").textContent = info;
  $("#recap").classList.add("show");
  $(".app-header .tag").classList.add("hide");
}
function expandForm(){
  $("#formZone").classList.remove("collapsed");
  $(".page-content").classList.remove("wide");
  $("#recap").classList.remove("show");
  $(".app-header .tag").classList.remove("hide");
  $("#result").classList.remove("show");   // 回到輸入時收起舊命盤，避免表單下還卡著一長串
  window.scrollTo({top:0,behavior:"smooth"});
}
$("#recap").addEventListener("click",expandForm);

/* ====== 推算（抽出共用） ====== */
function runChart(){
  const res=$("#result");
  try{
    res.innerHTML=`<div class="loading">排盤推算中…</div>`;res.classList.add("show");
    setTimeout(()=>{
      try{
        if(MODE==="single"){
          const A=readPerson(1);
          const out=renderSingle(A);
          res.innerHTML=out.html;
          bindTabs({...out.luck, nowY:out.luck.nowY, A});
        }else{
          const A=readPerson(1),B=readPerson(2);
          res.innerHTML=renderCouple(A,B);
          bindTabs(null);
        }
        collapseForm();
        window.scrollTo({top:0,behavior:"smooth"});
      }catch(e){res.innerHTML=`<div class="card"><div class="empty-tip" style="color:var(--bad)">⚠ ${e}</div></div>`;}
    },60);
  }catch(e){res.innerHTML=`<div class="card"><div class="empty-tip" style="color:var(--bad)">⚠ ${e}</div></div>`;}
}
$("#go").addEventListener("click",runChart);

/* ====== 存檔 / 讀檔（localStorage） ====== */
/* 設定某個 seg 段到指定值（同步 .on 與 segVal、觸發時辰列顯隱） */
function setSeg(key,val){
  const seg=document.querySelector(`.seg[data-seg="${key}"]`); if(!seg||val==null) return;
  seg.querySelectorAll("button").forEach(b=>b.classList.toggle("on",b.dataset.v===val));
  segVal[key]=val;
  if(key==="hknown1") $(".hrow1").style.display=val==="1"?"flex":"none";
  if(key==="hknown2") $(".hrow2").style.display=val==="1"?"flex":"none";
}
/* 把某人 n 的所有欄位打包 */
function snapshotPerson(n){
  return {
    name:$("#name"+n).value, y:$("#y"+n).value, m:$("#m"+n).value, d:$("#d"+n).value,
    h:$("#h"+n).value, min:$("#min"+n).value, lon:$("#lon"+n)?.value, zi:$("#zi"+n)?.value,
    city:$("#city"+n)?.value,
    sex:segVal["sex"+n], cal:segVal["cal"+n], hknown:segVal["hknown"+n], tst:segVal["tst"+n]
  };
}
/* 還原某人 n */
function restorePerson(n,p){
  if(!p) return;
  $("#name"+n).value=p.name||""; $("#y"+n).value=p.y||"";
  $("#m"+n).value=p.m||1; $("#d"+n).value=p.d||1;
  $("#h"+n).value=p.h||0; $("#min"+n).value=p.min||0;
  if($("#lon"+n)&&p.lon!=null) $("#lon"+n).value=p.lon;
  if($("#city"+n)&&p.city!=null) $("#city"+n).value=p.city;
  if($("#zi"+n)&&p.zi) $("#zi"+n).value=p.zi;
  setSeg("sex"+n,p.sex); setSeg("cal"+n,p.cal);
  setSeg("hknown"+n,p.hknown||"1"); setSeg("tst"+n,p.tst||"0");
}
function loadSaves(){ try{return JSON.parse(localStorage.getItem(SAVE_KEY))||[];}catch(e){return [];} }
function writeSaves(arr){ localStorage.setItem(SAVE_KEY,JSON.stringify(arr)); }
function savedLabel(rec){
  if(rec.mode==="couple") return `${rec.p1.name||"本人"} ✕ ${rec.p2.name||"對方"}`;
  return rec.p1.name||"未命名";
}
function savedSub(rec){
  const p=rec.p1; const cal=p.cal==="lunar"?"農":"國";
  const t=p.hknown==="1"?` ${String(p.h).padStart(2,"0")}:${String(p.min).padStart(2,"0")}`:" 時辰不詳";
  return `${rec.mode==="couple"?"合盤・":""}${p.sex}・${cal}${p.y}/${p.m}/${p.d}${t}`;
}
/* ---- 自製浮層：確認框 + 輕提示 ---- */
function showConfirm(msg,onYes){
  const ov=document.createElement("div"); ov.className="tzd-modal-ov";
  ov.innerHTML=`<div class="tzd-modal">
    <div class="tzd-modal-msg">${msg}</div>
    <div class="tzd-modal-btns">
      <button class="tzd-btn-cancel">取消</button>
      <button class="tzd-btn-ok">確定刪除</button>
    </div></div>`;
  document.body.appendChild(ov);
  const close=()=>ov.remove();
  ov.querySelector(".tzd-btn-cancel").onclick=close;
  ov.querySelector(".tzd-btn-ok").onclick=()=>{ close(); onYes&&onYes(); };
  ov.onclick=e=>{ if(e.target===ov) close(); };
}
function showToast(msg){
  const t=document.createElement("div"); t.className="tzd-toast"; t.textContent=msg;
  document.body.appendChild(t);
  setTimeout(()=>t.classList.add("show"),10);
  setTimeout(()=>{ t.classList.remove("show"); setTimeout(()=>t.remove(),250); },1800);
}
function saveCurrent(){
  if(!$("#y1").value){ showToast("請先填入出生年份再存檔"); return; }
  const rec={ id:String(Date.now())+Math.floor(performance.now()), mode:MODE, p1:snapshotPerson(1) };
  if(MODE==="couple") rec.p2=snapshotPerson(2);
  const arr=loadSaves(); arr.unshift(rec); writeSaves(arr); renderSaves();
  const btn=$("#saveBtn"); const old=btn.textContent; btn.textContent="✓ 已存"; setTimeout(()=>btn.textContent=old,1200);
}
function deleteSave(id){
  writeSaves(loadSaves().filter(r=>r.id!==id)); renderSaves();
}
function applySave(id){
  const rec=loadSaves().find(r=>r.id===id); if(!rec) return;
  // 切換模式
  document.querySelector(`.mode-btn[data-mode="${rec.mode}"]`)?.click();
  restorePerson(1,rec.p1);
  if(rec.mode==="couple") restorePerson(2,rec.p2);
  runChart();
}
function renderSaves(){
  const box=$("#savedBox"), list=$("#savedList"); const arr=loadSaves();
  if(!arr.length){ box.style.display="none"; return; }
  box.style.display="block";
  list.innerHTML=arr.map(rec=>`<div class="saved-item" data-id="${rec.id}">
    <div class="si-main" data-act="load" data-id="${rec.id}">
      <div class="si-name">${savedLabel(rec)}</div>
      <div class="si-sub">${savedSub(rec)}</div>
    </div>
    <button class="si-del" data-act="del" data-id="${rec.id}" title="刪除">✕</button>
  </div>`).join("");
}
$("#saveBtn").addEventListener("click",saveCurrent);
$("#savedList").addEventListener("click",e=>{
  const t=e.target.closest("[data-act]"); if(!t) return;
  if(t.dataset.act==="del"){ e.stopPropagation();
    const rec=loadSaves().find(r=>r.id===t.dataset.id);
    showConfirm(`確定刪除存檔「<b>${rec?savedLabel(rec):"這筆"}</b>」嗎？刪除後無法復原。`,()=>deleteSave(t.dataset.id));
  } else applySave(t.dataset.id);
});
renderSaves();

/* ====== 雙人合盤：從存檔挑人填入 ====== */
function showPicker(n){
  const arr=loadSaves();
  const ov=document.createElement("div"); ov.className="tzd-modal-ov";
  const list=arr.length?arr.map(rec=>`<button type="button" class="pk-item" data-id="${rec.id}">
      <span class="pk-name">${savedLabel(rec)}</span><span class="pk-sub">${savedSub(rec)}</span></button>`).join("")
    : `<div style="text-align:center;color:#94a3b8;padding:20px;font-size:13px">還沒有任何存檔。<br>先在單人命盤填好生辰、按「💾 存檔」即可。</div>`;
  ov.innerHTML=`<div class="tzd-modal" style="max-width:380px">
    <div class="pk-title">📁 從我的命盤選一位填入「${n===1?'本人':'對方'}」</div>
    <div class="pk-list">${list}</div>
    <div style="text-align:right;margin-top:10px"><button type="button" class="tzd-btn-cancel">取消</button></div>
  </div>`;
  document.body.appendChild(ov);
  const close=()=>ov.remove();
  ov.querySelector(".tzd-btn-cancel").onclick=close;
  ov.onclick=e=>{ if(e.target===ov) close(); };
  ov.querySelectorAll(".pk-item").forEach(b=>b.onclick=()=>{
    const rec=arr.find(r=>r.id===b.dataset.id); if(!rec) return;
    restorePerson(n, rec.mode==="couple"?rec.p1:rec.p1);
    close();
  });
}
$$(".pick-save").forEach(b=>b.addEventListener("click",()=>showPicker(+b.dataset.pick)));
