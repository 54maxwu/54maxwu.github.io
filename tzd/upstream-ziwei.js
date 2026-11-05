import * as U from './vendor/generated/ziwei.js';
import { toTraditional as tw, toSimplified as cn } from './vendor/generated/chinese.js';
import { extractZiwei } from './engine-ziwei.js';
import {getZiweiReading,renderRuleEvidence} from './reading-model.js';
import {getTopicIds} from './dataset-format.js';
export { tw, cn };
export const UPSTREAM_COMMIT='1059c347231c636bd86ddb78fd8ed430d5de8d2a';
const KEY='tzd-upstream-school-v1';
let sessionSchool;
export function readSchool(){
  if(sessionSchool)return {...sessionSchool};
  let saved={};try{saved=JSON.parse(localStorage.getItem(KEY))||{};}catch{}
  return Object.fromEntries(['brightnessSchool','leapMonth','lateZishi'].map(key=>[
    key,U.SCHOOL_OPTIONS[key].some(o=>o.value===saved[key])?saved[key]:U.SCHOOL_DEFAULT_CONFIG[key]
  ]));
}
export function initUpstreamSettings(){
  const host=document.querySelector('#upstreamSettings');if(!host)return;
  const cfg=readSchool();
  for(const key of ['brightnessSchool','leapMonth','lateZishi']){
    const label=document.createElement('label');label.textContent=tw(U.SCHOOL_LABELS[key]);
    const select=document.createElement('select');select.dataset.upstreamSchool=key;
    for(const option of U.SCHOOL_OPTIONS[key].filter(o=>key!=='lateZishi'||['next-day','current-day'].includes(o.value))){
      const el=document.createElement('option');el.value=option.value;el.textContent=tw(option.label);select.append(el);
    }
    select.value=cfg[key];select.addEventListener('change',()=>{
      sessionSchool={...readSchool(),[key]:select.value};
      try{localStorage.setItem(KEY,JSON.stringify(sessionSchool));}catch{}
    });label.append(select);host.append(label);
  }
}
export function restoreSchool(cfg){
  if(!cfg)return;
  const safe={...readSchool()};
  for(const key of Object.keys(safe))if(U.SCHOOL_OPTIONS[key].some(o=>o.value===cfg[key]))safe[key]=cfg[key];
  sessionSchool=safe;
  try{localStorage.setItem(KEY,JSON.stringify(safe));}catch{}
  for(const select of document.querySelectorAll('[data-upstream-school]'))select.value=safe[select.dataset.upstreamSchool];
}
export function buildUpstreamZiwei(bz,gender,school=readSchool()){
  const s=bz.solarTime;
  const offset=U.resolveZiweiDayOffset(s,school.lateZishi);
  const date=U.shiftGregorianDate({year:bz.solar.y,month:bz.solar.m,day:bz.solar.d},offset);
  const birth={...date,hour:bz.hourIdx,gender:gender==='女'?'female':'male'};
  U.setBrightnessSchool(school.brightnessSchool);
  const chart=U.generateChart(birth,{leapMonth:school.leapMonth});
  const effective=U.resolveEffectiveLunarDate(date.year,date.month,date.day,school.leapMonth);
  const g=gender==='女'?'女':'男';
  const astro=school.leapMonth!=='split'&&effective.rawLunarMonth<0
    ? U.astro.byLunar(`${effective.lunarYear}-${effective.lunarMonth}-${effective.lunarDay}`,birth.hour,g,effective.isLeapMonth,false,'zh-TW')
    : U.astro.bySolar(`${date.year}-${date.month}-${date.day}`,birth.hour,g,true,'zh-TW');
  const z=extractZiwei(astro);
  const baseline=extractZiwei(U.astro.bySolar(`${date.year}-${date.month}-${date.day}`,birth.hour,g,true,'zh-TW'));
  const differences=[];
  for(const p of z.palaces){
    const source=chart.palaces.find(q=>tw(q.name)===p.name);
    if(!source)throw Error('上游宮位轉換失敗：'+p.name);
    const old=baseline.palaces.find(q=>q.name===p.name);
    const pack=star=>({name:tw(star.name),brightness:tw(star.brightnessRaw||''),mutagen:tw(star.siHua||''),type:star.type==='sha'?'tough':'soft'});
    p.majorStars=source.stars.filter(s=>s.type==='major').map(pack);
    p.minorStars=source.stars.filter(s=>s.type==='lucky'||s.type==='sha').map(pack);
    p.adjStars=source.stars.filter(s=>s.type==='minor').map(pack);
    p.empty=p.majorStars.length===0;
    p.jiangqian12=tw(U.jiangQianShenName(chart.lunarInfo.yearBranch,source.branch));
    p.suiqian12=tw(U.suiQianShenName(chart.lunarInfo.yearBranch,source.branch));
    const before=[...old.majorStars,...old.minorStars,...old.adjStars].map(s=>`${s.name}:${s.brightness||''}:${s.mutagen||''}`).sort();
    const after=[...p.majorStars,...p.minorStars,...p.adjStars].map(s=>`${s.name}:${s.brightness||''}:${s.mutagen||''}`).sort();
    if(before.join()!==after.join())differences.push({palace:p.name,before,after});
  }
  z.soul=tw(chart.mingZhu);z.body=tw(chart.shenZhu);z.fiveElementsClass=tw(chart.wuxingJuName);
  z.upstream={chart,school,date,patterns:U.detectPatterns(chart),differences,
    selfSihua:U.buildAllSelfSihua(chart),birthKey:`${date.year}-${String(date.month).padStart(2,'0')}-${String(date.day).padStart(2,'0')}-${birth.hour}-${birth.gender}`};
  return {z,astro};
}

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const text=s=>esc(tw(s||''));
// Escape source text before applying the dataset's bold markers.
export const formatInterpretation=s=>text(s).replace(/\*\*([^\n]*?)\*\*/g,'<strong>$1</strong>');
export function renderUpstream(z){
  if(!z?.upstream)return '';
  const {chart,school,patterns,differences,selfSihua,date}=z.upstream;
  const patternHtml=getZiweiReading(z).rules.map(renderRuleEvidence).join('');
  const fly=chart.palaces.map(p=>{
    const transforms=U.getSiHuaByStem(p.stem);
    return `<tr><td>${text(p.name)}</td><td>${Object.entries(transforms).map(([hua,star])=>{
      const target=chart.palaces.find(q=>q.stars.some(s=>s.name===star));
      return `${text(hua)}：${text(star)} → ${text(target?.name||'未落盤')}`;
    }).join('<br>')}</td><td>${(selfSihua[p.branch]||[]).map(s=>`${text(s.starName)}化${text(s.siHua)}`).join('、')||'—'}</td></tr>`;
  }).join('');
  const fuqi=chart.palaces.find(p=>p.name==='夫妻');
  const spouse=fuqi?.stars.filter(s=>s.type==='major').map(s=>{
    const k=U.STAR_IN_FUQI_GU[s.name];return k?`<article class="up-rule"><h4>${text(s.name)}在夫妻宮</h4><p>${text(k.summary)}</p><p>有利條件：${text(k.good)}</p><p>需留意：${text(k.bad)}</p><p>互動特質：${text(k.spouse_traits)}</p></article>`:'';
  }).join('');
  return `<section class="card upstream-card"><h3>紫微進階判讀與原典</h3>
    <p class="cap">排盤依據：${text(U.SCHOOL_OPTIONS.brightnessSchool.find(o=>o.value===school.brightnessSchool)?.label)}；閏月${text(U.SCHOOL_OPTIONS.leapMonth.find(o=>o.value===school.leapMonth)?.label)}；晚子時${school.lateZishi==='next-day'?'歸次日':'歸當日'}。紫微排盤日 ${date.year}/${date.month}/${date.day}，與八字的日柱換日選項分開。</p>
    <details><summary>本命・嚴格格局與判斷依據（${patterns.length} 項）</summary>${patternHtml||'<p>未命中特殊格局；不代表整體吉凶。</p>'}</details>
    <details><summary>四化飛入與宮干自化</summary><p class="hint">這是獨立的飛星派工具，不混入倪派格局判定。生年四化仍保留在本命盤。</p><div class="up-table"><table><thead><tr><th>發出宮</th><th>四化星與落宮</th><th>自化</th></tr></thead><tbody>${fly}</tbody></table></div></details>
    <details><summary>夫妻宮知識補充</summary>${spouse||'<p>夫妻宮無主星，請連同對宮與三方四正觀察。</p>'}<p class="hint">內容是傳統命理條件式解說，不能單憑一顆星推定婚姻結果。</p></details>
    <details><summary>排盤加工前後比對（${differences.length} 宮有差異）</summary><p class="hint">同一排盤日，對照上游使用的 iztro 原始輸出與加工後的星曜、亮度及四化。兩者共用 iztro 核心；差異代表加工規則不同，並非準確率分數。</p>${differences.map(d=>`<details><summary>${text(d.palace)}</summary><p>加工前：${esc(d.before.join('、'))}</p><p>加工後：${esc(d.after.join('、'))}</p></details>`).join('')||'<p>所有宮位相符。</p>'}</details>
    <details><summary>古籍節錄與繁簡搜尋</summary><div data-classics><p>按需載入上游整理的《骨髓賦》《紫微斗數全集》《紫微斗數全書》章節節錄；其中含現代說明，並非校勘原刻全文。</p><button type="button" data-load-classics>開啟古籍庫</button></div></details>
    <details><summary>本命解讀・事業、感情與其他 13 主題</summary><p class="hint">這是固定版本的參考解讀，不隨目前年齡或流年切換更新。採 2026-10-15「現代修正 v2」亮度口徑，可能與所選流派不同。請以上方實際命盤與限制條件為準。資料覆蓋 1950–2026 年。</p><button type="button" data-load-interpretation="${esc(z.upstream.birthKey)}">開啟本命解讀主題</button><div data-interpretation></div></details>
    <p class="hint">來源：<a href="https://github.com/Renhuai123/ziwei-doushu" target="_blank" rel="noopener">紫微斗數開源專案</a>，版本 ${UPSTREAM_COMMIT.slice(0,12)}。程式 MIT；資料集 CC BY 4.0（作者：王多魚AI）；古籍原文依上游標示為公版。<a href="./vendor/ziwei-doushu/LICENSE">程式授權</a> · <a href="./vendor/ziwei-doushu/DATASET-LICENSE">資料授權與引文例外</a>。</p>
  </section>`;
}

let classicsPromise;
const topicCache=new Map();
async function fetchGzip(path){
  const url=path+'?format=sequence-v2';
  let cache;try{cache=await caches.open('tzd-reading-data-v2');}catch{}
  const res=await cache?.match(url)||await fetch(url);
  if(!res.ok)throw Error('資料無法讀取，請稍後重試。');
  if(cache){try{await cache.put(url,res.clone());const keys=await cache.keys();for(const key of keys.slice(0,Math.max(0,keys.length-8)))await cache.delete(key);}catch{}}
  if(typeof DecompressionStream==='undefined')throw Error('此瀏覽器不支援 gzip 解壓，請更新瀏覽器。');
  // Some static hosts supply Content-Encoding:gzip and browsers decode it first.
  const bytes=new Uint8Array(await res.arrayBuffer());
  return bytes[0]===31&&bytes[1]===139
    ? new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).json()
    : JSON.parse(new TextDecoder().decode(bytes));
}
const topics={overview:'命格總覽',personality:'性格',love:'感情',career:'事業',wealth:'財運',health:'健康',family:'兄弟',children:'子女',move:'遷移',friends:'人際',home:'田宅',spirit:'福德',parents:'父母'};
let bound=false;
export function bindUpstream(){
  if(bound)return;bound=true;
  document.addEventListener('click',async event=>{
    const button=event.target.closest('[data-load-classics],[data-load-interpretation]');if(!button)return;
    const host=button.parentElement;button.disabled=true;
    host.querySelector('[data-up-error]')?.remove();
    try{
      if(button.hasAttribute('data-load-classics')){
        const C=await(classicsPromise??=import('./vendor/generated/classics.js'));
        host.innerHTML='<label>搜尋原文 <input type="search" data-classic-search placeholder="例如：太陰、紫府"></label><div data-classic-hits></div><div data-classic-books></div>';
        const input=host.querySelector('input');
        const search=()=>{host.querySelector('[data-classic-hits]').innerHTML=C.searchClassics(cn(input.value),40).map(h=>`<article class="up-rule"><b>${text(h.bookTitle)} · ${text(h.chapterTitle)}</b><p>${text(h.text)}</p></article>`).join('')||(input.value.trim()?'<p>找不到相符原文。</p>':'');};
        input.addEventListener('input',search);
        host.querySelector('[data-classic-books]').innerHTML=C.ALL_BOOKS.map(b=>`<details><summary>${text(b.title)} · ${b.chapters.length} 章</summary>${b.chapters.map(ch=>`<details><summary>${text(ch.title)}</summary>${ch.paragraphs.map(p=>`<p id="${esc(p.id)}">${text(p.text)}</p>`).join('')}</details>`).join('')}</details>`).join('');
      }else{
        const key=button.dataset.loadInterpretation;
        const [year,month]=key.split('-');if(+year<1950||+year>2026)throw Error('此排盤日不在資料集的 1950–2026 範圍內。');
        const data=await fetchGzip(`./data/interpretations-v4/${year}-${month}.json.gz`);
        const row=data.rows[key];if(!row)throw Error('找不到這張命盤的解讀。');
        const target=host.querySelector('[data-interpretation]');
        target.replaceChildren();
        const scope=document.createElement('p');scope.className='note';scope.textContent='本命參考・固定文本：文中的「今年／當前大限」不隨你選擇的年份更新；目前大限與流年請以運限盤為準。';target.append(scope);
        const note=document.createElement('p');note.className='hint';note.textContent='本專案使用了紫微斗數開源解讀資料集 v4.0，來源：Renhuai123/ziwei-doushu，作者：王多魚AI。引述倪海廈原話不在 CC BY 資料授權內，權利依原權利人及上游引文說明。';target.append(note);
        const ordered=['career','love','wealth','overview','personality','health','family','children','move','friends','home','spirit','parents'];
        for(const topic of ordered.filter(t=>t in row.c)){
          const ids=getTopicIds(data,row,topic);
          const details=document.createElement('details'),summary=document.createElement('summary'),body=document.createElement('div');
          summary.textContent=topics[topic]||topic;body.className='up-interpretation';body.textContent='展開此主題時載入解讀。';
          let loaded=false,pending=false;
          details.addEventListener('toggle',async()=>{
            if(!details.open||loaded||pending)return;pending=true;body.textContent='載入中…';
            try{
              if(!topicCache.has(topic))topicCache.set(topic,fetchGzip(`./data/interpretations-v4/topic-${topic}.json.gz`).catch(e=>{topicCache.delete(topic);throw e;}));
              while(topicCache.size>3)topicCache.delete(topicCache.keys().next().value);
              const dict=await topicCache.get(topic);
              if(ids.some(id=>typeof dict[id]!=='string'))throw Error('解讀資料版本不一致，請重新整理。');
              body.innerHTML=formatInterpretation(ids.map(id=>dict[id]).join('\n'));loaded=true;
            }catch(e){body.textContent=e.message+' 收合後再展開可重試。';}finally{pending=false;}
          });
          details.append(summary,body);target.append(details);
        }
        button.textContent='已開啟 13 主題，展開閱讀';
      }
    }catch(error){
      let message=host.querySelector('[data-up-error]');if(!message){message=document.createElement('p');message.dataset.upError='';host.append(message);}message.textContent=error.message;button.disabled=false;
    }
  });
}
