import {toTraditional as tw} from './vendor/generated/chinese.js';
import {STAR_DESC} from './engine-ziwei.js';
export const escapeReading=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function getZiweiReading(z){
  if(!z?.upstream)return null;
  const rules=z.upstream.patterns.map(p=>{
    const required=(p.conditions?.required||[]).map(tw),bonus=(p.conditions?.bonus||[]).map(tw),breaking=(p.conditions?.breaking||[]).map(tw);
    const limited=breaking.length>0;
    return {name:tw(p.name),required,bonus,breaking,source:tw(p.source||'上游格局規則庫'),level:p.level,
      status:limited?'有破格提醒':p.level==='caution'?'需留意':p.level==='excellent'?'符合上格條件':p.level==='good'?'符合助力條件':'符合組合條件',
      limited,description:limited?`符合基本組合，但有 ${breaking.length} 項破格提醒；需連同限制判讀，不能直接套用完整吉格論斷。`:tw(p.description)};
  });
  return {rules,limited:rules.filter(p=>p.limited),cautions:rules.filter(p=>p.limited||p.level==='caution'),
    ming:z.palaces.find(p=>p.name==='命宮'),body:z.palaces.find(p=>p.isBodyPalace),
    transformations:z.palaces.flatMap(p=>[...p.majorStars,...(p.minorStars||[]),...(p.adjStars||[])].filter(s=>s.mutagen).map(s=>({palace:p.name,star:s.name,hua:s.mutagen})))};
}
const e=escapeReading;
export function renderRuleEvidence(rule){
  const list=(name,values)=>values.length?`<p><b>${name}</b> ${values.map(e).join('；')}</p>`:'';
  return `<article class="reading-rule ${rule.limited?'reading-limited':''}"><h4>${e(rule.name)} <small>${e(rule.status)}</small></h4><p>${e(rule.description)}</p><details><summary>看判斷依據</summary>${list('成立條件',rule.required)}${list('加分條件',rule.bonus)}${list('破格提醒',rule.breaking)}<p class="hint">來源：${e(rule.source)}</p></details></article>`;
}
export function renderReadingHighlights(a){
  const r=getZiweiReading(a.ziwei);
  if(!r)return `<section class="card full reading-highlights"><h3>命盤重點</h3><p>八字日主${e(a.strength.strength)}，取用方向為${e(a.yong.primary.join('、'))}。</p><p>${a.bz?.hourKnown===true?'紫微資料尚未建立，請確認排盤設定或重新啟盤。':'時辰不詳時不推論紫微格局與運限；請先查看八字四柱的已知部分。'}</p></section>`;
  const stars=r.ming?.majorStars||[],opp=a.ziwei.palaces.find(p=>p.name==='遷移');
  const ming=stars.length?`命宮主星為 ${stars.map(s=>s.name).join('、')}。`:`命宮無主星，需連同遷移宮的 ${(opp?.majorStars||[]).map(s=>s.name).join('、')||'星曜'} 觀察。`;
  const h=a.ziweiHoro,year=Number(String(h?.solarDate||'').slice(0,4))||new Date().getFullYear();
  const decade=a.ziwei.palaces.find(p=>p.earthlyBranch===h?.decadal?.branch)?.decadal?.range;
  const scoped=h?`目前查看 ${year} 年，流年命宮地支為 ${h.yearly?.branch||'—'}；大限命宮地支為 ${h.decadal?.branch||'—'}${decade?`（虛歲 ${decade.join('–')}）`:''}。`:'尚無運限資料，請到紫微流年盤選擇年份。';
  const status=!r.rules.length?'未命中特殊格局，不據此推定整體吉凶。':r.cautions.length?`${r.rules.length} 項組合中，${r.cautions.length} 項需連同限制判讀。`:`符合 ${r.rules.length} 項組合條件；仍需連同各宮與運限觀察。`;
  return `<section class="card full reading-highlights"><h3>先看這張命盤的三個重點</h3><div class="reading-three">
    <article><span class="badge blue">本命・做事風格</span><h4>${e(ming)}</h4><p>${stars.length?`傳統星義：${e(stars.map(s=>STAR_DESC[s.name]||s.name).join('；'))}。`:'先連同對宮及三方四正理解特質。'}</p><details><summary>看判斷依據</summary><p>${stars.map(s=>e(`${s.name}：${s.brightness||'未標亮度'}${s.mutagen?'、生年化'+s.mutagen:''}`)).join('；')||e(ming)}</p><p>身宮：${e(r.body?.name||a.ziwei.earthlyBranchOfBodyPalace||'—')}；八字日主：${e(a.strength.strength)}，喜用${e(a.yong.primary.join('、'))}。兩種系統各自判讀。</p></details></article>
    <article><span class="badge ${r.cautions.length?'mid':'blue'}">本命・格局與限制</span><h4>${e(status)}</h4><p>${e(r.cautions.length?r.cautions.map(p=>p.name).join('、'):'查看成立條件後，再閱讀詳細解說。')}</p><details><summary>看判斷依據</summary>${r.rules.map(renderRuleEvidence).join('')||'<p>未命中特殊格局，不據此推定整體吉凶。</p>'}</details></article>
    <article><span class="badge blue">運限・目前查看的年份</span><h4>${e(scoped)}</h4><p>本命是固定背景，大限是十年區間，流年是所選年度；固定資料集不替代流年判讀。</p><details><summary>看判斷依據</summary><p>大限：${e(h?.decadal?.stem||'')}${e(h?.decadal?.branch||'—')}；流年：${e(h?.yearly?.stem||'')}${e(h?.yearly?.branch||'—')}。</p><p>流年四化（祿、權、科、忌）：${e((h?.yearly?.mutagen||[]).join('、')||'尚無資料')}。</p></details></article>
    </div><p class="hint">深入閱讀：紫微斗數查看宮位、嚴格規則及所選年份的紫微流年盤；「大運流年」分頁為八字運勢。本命解讀按主題展開。</p></section>`;
}
export function renderNatalFacts(z){
  const r=getZiweiReading(z);if(!r)return '';
  return `<div class="zw-overview"><h3>本命盤・固定結構</h3><p>命主 ${e(z.soul)}，身主 ${e(z.body)}，${e(z.fiveElementsClass)}。</p><p>生年四化：${r.transformations.map(s=>e(`${s.star}化${s.hua}在${s.palace}`)).join('；')||'未標示'}。</p><p>嚴格規則符合 ${r.rules.length} 項，其中 ${r.limited.length} 項有破格提醒。各宮不以簡化加減分排定人生優劣。</p></div>`;
}
