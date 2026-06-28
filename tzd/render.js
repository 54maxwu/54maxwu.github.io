/* ============================================================
 * 天知道 · 渲染層（所有 render 與 bind 顯示邏輯）
 * 由 app.js 拆出。只依賴 ui-data.js 與 engine／glossary（無反向耦合）
 * ============================================================ */
import { buildBazi, lunar2solar, solar2lunar, leapMonth, GAN_WX, GAN, ZHI, ZHI_WX, GAN_YY, ZHI_YY } from "./engine-calendar.js";
import { chengGu } from "./engine-chenggu.js";
import { fullBaziAnalysis, SHISHEN_DESC } from "./engine-bazi.js";
import { calcDaYun, annotateDaYun, calcLiuNian, calcLiuYue, LUCK_THEME } from "./engine-luck.js";
import { shengXiaoInfo, sunSign, risingSign, SIGN_TRAIT, SIGN_DETAIL, SX_DETAIL, SX_NAMING, nameAnalysis, nameSuggest, charsByStroke, luckText } from "./engine-aux.js";
import { coupleAnalysis } from "./engine-couple.js";
import { extractZiwei, buildHoroscope, PALACE_ORDER, SIHUA_DESC, BOSHI12_DESC } from "./engine-ziwei.js";
import { $, $$, BRIGHT_NOTE, GAN_IMG, ZHI_SX, ZHI_HR, BR_LEVEL, NAYIN_PLAIN, WX_COLOR, PILLAR_LIFE, WX_REMEDY, COLOR_HEX, STRENGTH_PLAIN, SHENSHA_PLAIN, POS_PLAIN, PATTERN_PLAIN, GOD_SHORT, GOD_YEAR, GRID_POS, ZW_IDX_BRANCH, PALACE_TOPIC, PALACE_SHORT, ZW_CHONG, ZW_SANHE, WX_HEALTH } from "./ui-data.js";
import { GLOSSARY, SHISHEN_MONEY, DAYGAN_PROFILE, NAYIN_TREND,
  HAI_DESC, HAI_GENERAL, CHONG_DESC, CHONG_GENERAL, HE_GENERAL, TIANLUO_DESC, XING_GENERAL } from "./glossary.js";

export function ganTip(g){return `${g}＝${GAN_YY[g]||""}${GAN_WX[g]||""}，像${GAN_IMG[g]||""}`;}

export function zhiTip(z){return `${z}＝${ZHI_YY[z]||""}${ZHI_WX[z]||""}，生肖屬${ZHI_SX[z]||""}、時辰${ZHI_HR[z]||""}點`;}

export function brBars(brightness){
  const lv=BR_LEVEL[brightness]; if(!lv) return "";
  const col=lv>=6?"#16a34a":lv>=4?"#2563eb":lv>=3?"#94a3b8":"#f59e0b";
  let bars="";
  for(let i=1;i<=7;i++){
    const h=4+i*1.5; // 由矮到高
    bars+=`<i style="height:${h.toFixed(1)}px;background:${i<=lv?col:'#e2e8f0'}"></i>`;
  }
  return `<span class="br-sig" title="力量強弱 ${lv}/7">${bars}</span>`;
}

export function wxSpan(ch){const wx=GAN_WX[ch]; return `<span class="wx-${wx}">${ch}</span>`;}

export function stripDot(s){ return (s||"").replace(/[。\s]+$/,""); }

export function godPlain(g){
  if(!g||g==="日主") return "";
  const t=GLOSSARY[g]; return t?t.split("：")[0]:"";
}

export function renderBaziTable(a, showLegend=false){
  const c=a.chart, bz=a.bz;
  const cols=[["年柱",c.year],["月柱",c.month],["日柱",c.day]];
  if(c.hour) cols.push(["時柱",c.hour]); else cols.push(["時柱",null]);
  const ths=cols.map(([t])=>`<th>${t}<span class="th-sub">${PILLAR_LIFE[t]||""}</span></th>`).join("");
  const ZHI_WX_MAP={子:"水",丑:"土",寅:"木",卯:"木",辰:"土",巳:"火",午:"火",未:"土",申:"金",酉:"金",戌:"土",亥:"水"};
  const cell=(p,title)=>{
    if(!p) return `<td><div class="gz-cell"><div style="color:#cbd5e1;font-size:13px;padding:20px 0">時辰不詳<br><span style="font-size:11px">（補上出生時間更準）</span></div></div></td>`;
    const ganWx=GAN_WX[p.gan], zhiWx=ZHI_WX_MAP[p.zhi];
    const cangan=p.cangan.map(cg=>`<span class="wx-${GAN_WX[cg.gan]}">${cg.gan}</span>${cg.god&&cg.god!=="日主"?`<span class="cg-god god-click" data-god="${cg.god}" title="點我看「${cg.god}」是什麼">${cg.god}</span>`:`<span style="color:#cbd5e1">${cg.god||""}</span>`}`).join("　");
    const godNote = p.ganGod==="日主"
      ? `<div class="cell-note">這就是「你自己」，整張命盤的主角</div>`
      : (godPlain(p.ganGod)?`<div class="cell-note">${p.ganGod}＝${godPlain(p.ganGod)}</div>`:"");
    const csNote = p.changSheng&&GLOSSARY[p.changSheng]
      ? `<div class="cell-note sub">${p.changSheng}：${GLOSSARY[p.changSheng].split("：")[0].replace(/^像/,"")}</div>`:"";
    const godClickable=p.ganGod&&p.ganGod!=="日主";
    return `<td><div class="gz-cell">
      <div class="god${godClickable?' god-click':''}"${godClickable?` data-god="${p.ganGod}" title="點我看「${p.ganGod}」是什麼"`:''}>${p.ganGod}</div>
      <div class="gan wx-${ganWx} gz-tip" title="${ganTip(p.gan)}">${p.gan}<span class="wx-tag">${ganWx}</span></div>
      <div class="zhi wx-${zhiWx} gz-tip" title="${zhiTip(p.zhi)}">${p.zhi}<span class="wx-tag">${zhiWx}</span></div>
      ${godNote}
      <div class="cs${p.changSheng?' cs-click':''}"${p.changSheng?` data-cs="${p.changSheng}" title="點我看「${p.changSheng}」是什麼"`:''}>${p.changSheng||""}</div>
      ${csNote}
      <div class="cangan">${cangan}</div>
      <div class="ny${p.nayin?' ny-click':''}"${p.nayin?` data-nayin="${p.nayin}" title="點我看「${p.nayin}」的白話"`:''}>${p.nayin||""}</div>
    </div></td>`;
  };
  const legend=`<div class="bz-legend">
    <div class="lg-title">📖 看不懂？這張表一格一格這樣讀</div>
    <ul class="lg-list">
      <li><b>四個直行＝四柱</b>：年、月、日、時，分別代表人生不同階段（標題下方已寫）。<b>「日柱」的上面那個大字就是「你自己」</b>。</li>
      <li><b>最上面藍字＝十神</b>：那個字（天干）對「你」來說扮演什麼角色，例如「正印＝靠山貴人」「正官＝規矩責任」，下方已附白話。</li>
      <li><b>中間兩個大字＝天干＋地支</b>（八字的核心）：每字旁小灰字是它的<b>五行</b>，顏色也按五行分。<b>把滑鼠移到大字上（手機長按）</b>會顯示它的陰陽五行與意象（如「甲＝陽木，像大樹」「子＝陽水，屬鼠、深夜23-1點」）。天干＝天上的氣、地支＝地上的根與時間。</li>
      <li><b>紫色字＝十二長生</b>：這個天干在這格的「能量階段」，像人的一生十二步（見下方對照表，可點四柱裡的長生連動）。</li>
      <li><b>灰色小字＝藏干＋納音</b>：藏干＝地支裡「暗藏」的天干（<b>排第一個的力量最大、是主角</b>）；納音＝六十甲子配出的另一套五行象徵（如海中金），是這柱的「別名／質地」。</li>
    </ul>
    <div class="cs12-box">
      <div class="cs12-title">🌱 十二長生 白話對照（能量由生到滅再重生）</div>
      <div class="cs12-grid">
        ${[["長生","剛出生：生機勃勃、前途看好，能量正要往上"],["沐浴","剛出生要洗澡：不穩定、易迷惘，又叫桃花地"],["冠帶","成年戴冠：開始成熟、嶄露頭角"],["臨官","入朝當官：實力到位、可以擔當，很旺(又叫祿)"],["帝旺","登上巔峰：能量最強，氣勢最盛但要防過剛"],["衰","盛極轉衰：氣勢走下坡，宜守不宜衝"],["病","生病：能量低、易疲累，需要休養"],["死","生命終結：能量最弱，做事易力不從心"],["墓","入庫收藏：能量收斂內守，有積蓄但較封閉"],["絕","氣斷重來：低到極點即將反轉，是變動轉機之地"],["胎","受孕成胎：新的開始正在孕育，有潛力待發"],["養","胎兒養育：休養蓄力、準備再出發"]].map(([k,v])=>`<div class="cs12-row" data-cs12="${k}"><b>${k}</b><span>${v}</span></div>`).join("")}
      </div>
    </div>
    <div class="cs12-box">
      <div class="cs12-title" style="color:var(--blue-d)">🔵 十神 白話對照（藍字那個＝它對「你」扮演的角色）</div>
      <div class="cs12-grid">
        ${["比肩","劫財","食神","傷官","正財","偏財","正官","七殺","正印","偏印"].map(k=>`<div class="cs12-row god12-row" data-god12="${k}"><b style="color:var(--blue-d);width:40px">${k}</b><span>${(GLOSSARY[k]||"").split("：").slice(-1)[0]}</span></div>`).join("")}
      </div>
    </div>
  </div>`;
  return `${showLegend?legend:""}<table class="bazi-table"><tr>${ths}</tr><tr>${cols.map(([t,p])=>cell(p,t)).join("")}</tr></table>`;
}

export function radarChart(items, opt={}){
  const N=items.length, R=opt.r||78, cx=110, cy=104;
  const maxV=Math.max(...items.map(i=>i.value),0.1);
  const ang=i=>(-90 + i*360/N)*Math.PI/180;            // 從正上方開始
  const pt=(i,rad)=>[cx+rad*Math.cos(ang(i)), cy+rad*Math.sin(ang(i))];
  // 背景同心五邊形（4 圈）
  let grid="";
  for(let ring=1;ring<=4;ring++){
    const rr=R*ring/4;
    const poly=items.map((_,i)=>pt(i,rr).map(n=>n.toFixed(1)).join(",")).join(" ");
    grid+=`<polygon points="${poly}" fill="none" stroke="#e2e8f0" stroke-width="1"/>`;
  }
  // 軸線
  let axes="";
  items.forEach((_,i)=>{const[x,y]=pt(i,R);axes+=`<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#e2e8f0" stroke-width="1"/>`;});
  // 數值多邊形
  const dataPts=items.map((it,i)=>pt(i, R*Math.max(0.04,it.value/maxV)));
  const dataPoly=dataPts.map(p=>p.map(n=>n.toFixed(1)).join(",")).join(" ");
  // 頂點圓點
  const dots=dataPts.map((p,i)=>`<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="3.5" fill="${items[i].color}"/>`).join("");
  // 標籤 + 數值
  const labels=items.map((it,i)=>{
    const[lx,ly]=pt(i,R+15);
    const anchor=Math.abs(lx-cx)<6?"middle":(lx>cx?"start":"end");
    return `<text x="${lx.toFixed(1)}" y="${(ly+4).toFixed(1)}" font-size="13" font-weight="700" fill="${it.color}" text-anchor="${anchor}">${it.label}</text>
      <text x="${lx.toFixed(1)}" y="${(ly+17).toFixed(1)}" font-size="10" fill="#94a3b8" text-anchor="${anchor}">${it.value.toFixed(1)}</text>`;
  }).join("");
  return `<svg class="radar" viewBox="-30 -16 280 244" width="100%" style="max-width:300px;display:block;margin:0 auto">
    <circle cx="${cx}" cy="${cy}" r="${R+2}" fill="none" stroke="#f1f5f9" stroke-width="1"/>
    ${grid}${axes}
    <polygon points="${dataPoly}" fill="${opt.fill||'rgba(59,130,246,.18)'}" stroke="${opt.stroke||'#3b82f6'}" stroke-width="2" stroke-linejoin="round"/>
    ${dots}${labels}
  </svg>`;
}

export function renderWuxing(tally){
  const items=["木","火","土","金","水"].map(k=>({label:k,value:tally[k],color:WX_COLOR[k]}));
  const radar=radarChart(items,{fill:"rgba(22,163,74,.14)",stroke:"#16a34a"});
  // 五行性格＋適配行業對照（最強的標「你」）
  const sorted=["木","火","土","金","水"].slice().sort((a,b)=>tally[b]-tally[a]);
  const topWx=sorted[0], lowWx=sorted[4];
  const rows=["木","火","土","金","水"].map(w=>{
    const h=WX_HEALTH[w]; if(!h) return "";
    const mark=w===topWx?'<span class="wx-mark top">最強</span>':(w===lowWx?'<span class="wx-mark low">最弱</span>':"");
    const jobs=(h.jobs||[]).slice(0,4).map(j=>`<span class="wx-job">${j}</span>`).join("");
    return `<div class="wxp-row${w===topWx?' on':''}">
      <div class="wxp-h"><span class="wx-bullet wx-${w}">${w}</span>${mark}</div>
      <div class="wxp-trait">${h.trait}</div>
      <div class="wxp-jobs">${jobs}</div>
    </div>`;
  }).join("");
  const profile=`<div class="wx-profile">
    <div class="wxp-title">🧭 五行性格 × 適配行業（你最強的是 <b class="wx-${topWx}">${topWx}</b>，個性與適合領域會偏這邊）</div>
    <div class="wxp-grid">${rows}</div>
    <div class="cap" style="margin-top:8px;color:#94a3b8">※ 看「最強」那行最貼近你；但真正論「適合什麼」要以<b>用神喜忌</b>為準（見下方），五行多寡只是參考底色。</div>
  </div>`;
  return radar+profile;
}

export function renderWuxingRelation(a, embed=false){
  const t=a.tally;
  const SHENG_={木:"火",火:"土",土:"金",金:"水",水:"木"};   // 生
  const KE_={木:"土",土:"水",水:"火",火:"金",金:"木"};       // 剋
  const shengByOf=w=>Object.keys(SHENG_).find(k=>SHENG_[k]===w); // 生我者(母)
  const dot=w=>`<span class="wx-bullet wx-${w}" style="width:20px;height:20px;font-size:11px">${w}</span>`;
  // 相生鏈 / 相剋鏈
  const shengChain=["木","火","土","金","水"].map(dot).join('<span class="wx-arrow">→</span>')+'<span class="wx-arrow">→</span>'+dot("木");
  const keChain=["木","土","水","火","金"].map(dot).join('<span class="wx-arrow">剋</span>')+'<span class="wx-arrow">剋</span>'+dot("木");
  // 動態：找出過旺(>平均*1.7)五行，提示它可能「過度剋」誰、「通關」用誰
  const vals=Object.values(t); const avg=vals.reduce((x,y)=>x+y,0)/5;
  const overs=["木","火","土","金","水"].filter(w=>t[w]>avg*1.7 && t[w]>0).sort((x,y)=>t[y]-t[x]);
  let dynamic="";
  if(overs.length){
    dynamic=overs.slice(0,2).map(w=>{
      const victim=KE_[w];                 // 被它剋的
      const bridge=SHENG_[w];              // 它生的＝通關星（洩它去生被害者的母）
      const tongguan=shengByOf(victim);     // 真正能「通關」的：被害者的母（生被害者者）
      const weakVictim=t[victim]<avg*0.7;
      return `<div class="wxr-dyn-row">
        <b class="wx-${w}">${w}</b> 在你命中偏旺${weakVictim?`，而它所剋的 <b class="wx-${victim}">${victim}</b> 偏弱`:""}——容易形成「<b>${w}乘${victim}</b>」（過度剋制）。
        化解之道：補 <b class="wx-${tongguan}">${tongguan}</b> 來<b>通關</b>（讓 ${w} 的力量先去生 ${tongguan}、${tongguan} 再生 ${victim}），把「相剋」轉成「相生」一路流通。</div>`;
    }).join("");
  }else{
    dynamic=`<div class="wxr-dyn-row" style="color:#15803d">你的五行分布沒有明顯一方獨大去硬剋另一方，<b>相對均衡流通</b>，這是好事——能量比較順、不容易卡關。</div>`;
  }
  const inner=`<div class="cap" style="margin:14px 0 12px;border-top:1px dashed var(--line);padding-top:12px"><b style="color:var(--blue-d)">🔄 五行生剋關係（你的能量怎麼流動）</b>　五行不是各自獨立，而是彼此<b>相生</b>（滋養）與<b>相剋</b>（制衡）。懂得能量怎麼流，就懂得命局為什麼要「補某一行」或「通關」。</div>
    <div class="wxr-chains">
      <div class="wxr-chain"><div class="wxr-c-lbl sheng">相生鏈 · 一路滋養</div><div class="wxr-flow">${shengChain}</div>
        <div class="wxr-note">木生火、火生土、土生金、金生水、水又生木，循環不息。<b>補弱勢五行</b>時，優先沿這條鏈用「它的母」來生它最自然。</div></div>
      <div class="wxr-chain"><div class="wxr-c-lbl ke">相剋鏈 · 彼此制衡</div><div class="wxr-flow">${keChain}</div>
        <div class="wxr-note">木剋土、土剋水、水剋火、火剋金、金剋木。剋不是壞事，是<b>制約與平衡</b>；但一方過強去硬剋弱方，就會出問題（見下）。</div></div>
    </div>
    <div class="wxr-special">
      <div class="wxr-sp-title">⚠ 三種「失衡」狀況（命理進階）</div>
      <div class="wxr-sp-grid">
        <div class="wxr-sp"><b>反剋（相侮）</b><span>被剋的一方太強，反過來欺負原本該剋它的。例：水太多，火不但剋不了水，反被水澆熄。<i>解法：增強主剋方，或削弱過強的被剋方。</i></span></div>
        <div class="wxr-sp"><b>乘襲（過剋）</b><span>主剋方太強、被剋方太弱，剋得過頭。例：木太旺猛剋土，像肝氣犯脾。<i>解法：用「通關」五行轉化（如木乘土，補火讓木去生火、火再生土）。</i></span></div>
        <div class="wxr-sp"><b>母子同病</b><span>相生鏈斷掉，生的一方與被生的一方一起受損。例：火太衰，連帶它生的土也虛。<i>解法：母子一起補，或先找出斷鏈的源頭。</i></span></div>
      </div>
    </div>
    <div class="wxr-dynamic">
      <div class="wxr-dyn-title">🔎 套到你的命局</div>
      ${dynamic}
    </div>`;
  return embed ? inner : `<div class="card full"><h3><span class="ic">剋</span>五行生剋關係（你的能量怎麼流動）</h3>${inner}</div>`;
}

export function colorize(str){
  return str.split("、").map(c=>{
    const hex=COLOR_HEX[c];
    if(!hex) return c;
    const light=["白色","銀色","米色","黃色","金色"].includes(c);
    return `<span class="cdot" style="background:${hex};${light?'border:1px solid #cbd5e1;':''}"></span><span style="color:${light?'#64748b':hex};font-weight:600">${c}</span>`;
  }).join("、");
}

export function renderRemedy(yong, avoid){
  const need=[...new Set(yong)].filter(Boolean);
  const av=[...new Set(avoid)].filter(Boolean);
  if(!need.length) return "";
  const rows=need.map(w=>{const r=WX_REMEDY[w];if(!r)return "";
    return `<div class="rmd-row">
      <span class="rmd-wx wx-${w}">${w}</span>
      <div class="rmd-detail">
        <div><b>顏色</b>${colorize(r.colors)}　<b>方位</b>${r.dir}　<b>幸運數</b>${r.num}</div>
        <div><b>適合領域</b>${r.ind}</div>
        <div><b>生活上</b>${r.act}</div>
      </div></div>`;}).join("");
  return `<div class="rmd">
    <div class="rmd-intro">所謂「<b>調補</b>」，就是日常多<b>親近你的喜用五行（${need.join("、")}）</b>來補運：
      從<b>穿著顏色、住家／座位方位、選擇行業、生活習慣</b>等面向，盡量靠近下面這些選項；
      ${av.length?`並盡量<b>避開忌神（${av.join("、")}）</b>的顏色與方位。`:""}這不是迷信靈藥，而是用環境暗示讓自己更順、更有狀態。</div>
    ${rows}
  </div>`;
}

export function strengthPlainLine(s){
  const dayName={金:"金（像金屬、刀劍、果決）",木:"木（像樹木、向上、有生機）",水:"水（像流水、聰明、靈活）",火:"火（像火焰、熱情、爆發）",土:"土（像土地、穩重、包容）"}[s.dayWx]||s.dayWx;
  const lingPlain={旺:"正逢你的旺季、力量最足",相:"季節在幫你、力量不錯",休:"力量被洩掉一些、平平",囚:"力量被壓制、較不利",死:"完全不合季節、力量最弱",平:"季節影響中性"}[s.ling.state]||"";
  return `你出生那天的「我」是 <b class="wx-${s.dayWx}">${s.dayGan}日主＝${dayName}</b>。出生的月份對你來說「<b>${s.ling.state}</b>」——${lingPlain}。綜合整張八字算下來，你屬於「<b>${s.strength}</b>」。`;
}

export function renderStrength(s){
  const pct=Math.max(5,Math.min(95,(s.score+16)/32*100));
  return `<div class="cap" style="margin-bottom:10px">「身強弱」講的是<b>你本人(日主)的能量強不強</b>——不是好壞，而是決定你「該主動衝、還是該借力守」。分數越往右越強。</div>
    <div class="score-big">
    <div style="flex:1">
      <div style="font-size:24px;font-weight:700;margin-bottom:4px">${s.strength}
        <span style="font-size:14px;color:var(--sub);font-weight:400">（分數 ${s.score}）</span></div>
      <div class="bar" style="height:10px"><i style="width:${pct}%;background:linear-gradient(90deg,#3b82f6,#6366f1)"></i></div>
      <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--sub);margin-top:3px">
        <span>極弱</span><span>身弱</span><span>中和</span><span>身強</span><span>極強</span></div>
    </div></div>
    <div class="note"><b>「${s.strength}」是什麼意思？</b>${STRENGTH_PLAIN[s.strength]||""}</div>
    <div class="note" style="margin-top:8px">${strengthPlainLine(s)}</div>
    <details style="margin-top:10px"><summary style="cursor:pointer;font-size:13px;color:var(--blue-d)">▸ 展開命理術語版與計分明細</summary>
      <div style="font-size:12px;color:#94a3b8;margin:6px 0">日主 ${s.dayGan}（${s.dayWx}），月令${s.ling.state}。${s.ling.note}。</div>
      <div class="detail-list" style="margin-top:8px">${s.detail.map(d=>
        `<div class="di"><span>${d.item} <span style="color:#94a3b8">${d.note}</span></span>
         <span class="${d.val>=0?'pos':'neg'}">${d.val>=0?'+':''}${d.val}</span></div>`).join("")}</div>
    </details>`;
}

export function renderYong(y){
  const r0=WX_REMEDY[y.primary[0]]||{};
  return `<div class="cap" style="margin-bottom:10px">「<b>喜用神</b>」＝對你最有幫助的五行，平常多<b>親近它</b>(顏色、方位、行業)會更順；「<b>忌神</b>」＝對你較不利、要盡量避開的五行。這是全盤<b>趨吉避凶的核心</b>。</div>
    <div style="margin-bottom:8px">喜用神（多親近）：${y.primary.map(w=>`<span class="badge good wx-${w}" style="background:#dcfce7">${w}</span>`).join("")}</div>
    <div style="margin-bottom:10px">忌神（盡量避）：${y.avoid.length?y.avoid.map(w=>`<span class="badge bad">${w}</span>`).join(""):'<span style="color:#94a3b8">—</span>'}</div>
    <div class="note" style="margin-top:0">👉 白話建議：多穿 ${r0.colors?colorize(r0.colors):""}、往 <b>${r0.dir||""}</b> 發展、選 ${r0.ind?r0.ind.split("、").slice(0,3).join("、"):""} 這類方向，運勢會更順。完整調補方式見「八字四柱」頁的五行能量卡。</div>
    <details style="margin-top:10px"><summary style="cursor:pointer;font-size:13px;color:var(--blue-d)">▸ 看命理術語版</summary>
      <div style="font-size:12px;color:#94a3b8;margin-top:6px">取用方法：${y.method}。${y.note}</div></details>`;
}

export function renderGodTally(gt, showIntro=false){
  const max=Math.max(...Object.values(gt),0.1);
  const colors={比劫:"#3b82f6",食傷:"#16a34a",財星:"#d97706",官殺:"#dc2626",印星:"#8b5cf6"};
  // 五大類白話：一句完整定義（這類在講什麼）
  const GOD_NOTE={
    比劫:"跟你「同一掛」的力量——自我、兄弟朋友同事、競爭較勁、講義氣。強代表很有主見、靠自己；但也容易為人破費、跟人爭。",
    食傷:"你「往外輸出」的力量——才華、口才、表達、創意、生養。強代表聰明有想法、能秀；但太強會心高氣傲、愛批評。",
    財星:"你「掌控、追求」的力量——財富、務實、慾望、行動力（也代表男性的感情）。強代表會賺會花、目標明確；太弱則財較淡。",
    官殺:"「管住你」的力量——壓力、責任、規矩、地位、權威（也代表女性的感情）。強代表能扛事、有自律；太強則壓力大、易緊繃。",
    印星:"「照顧你」的力量——學識、靠山、長輩貴人、被疼愛。強代表有貴人、愛學習、有安全感；太強則易依賴、想太多。"
  };
  const top=Object.entries(gt).slice().sort((a,b)=>b[1]-a[1])[0];
  const intro=showIntro?`<div class="cap" style="margin-bottom:12px">這張圖把你的八字換算成<b>五種「人生角色能量」</b>——角越往外代表那股力量越強。<b>下面每條都附白話解釋它在講什麼</b>。你最突出的是 <b style="color:${colors[top[0]]}">${top[0]}</b>，個性與做事會偏這個方向。</div>`:"";
  const radar=radarChart(Object.entries(gt).map(([k,v])=>({label:k,value:v,color:colors[k]})),{fill:"rgba(99,102,241,.14)",stroke:"#6366f1"});
  return `${intro}${radar}<div class="god-bars" style="margin-top:8px">${Object.entries(gt).map(([k,v])=>`
    <div class="god-bar">
      <div class="gb-top"><span class="gb-name" style="color:${colors[k]}">${k}</span>
        <div class="bar"><i style="width:${Math.max(4,v/max*100)}%;background:${colors[k]}"></i></div>
        <span class="val">${v.toFixed(1)}</span></div>
      <div class="gb-note">${GOD_NOTE[k]||""}</div>
    </div>`).join("")}</div>`;
}

export function renderGodMoney(a){
  const order=["比肩","劫財","食神","傷官","正財","偏財","正官","七殺","正印","偏印"];
  const cls={比肩:"比劫",劫財:"比劫",食神:"食傷",傷官:"食傷",正財:"財星",偏財:"財星",正官:"官殺",七殺:"官殺",正印:"印星",偏印:"印星"};
  const colors={比劫:"#3b82f6",食傷:"#16a34a",財星:"#d97706",官殺:"#dc2626",印星:"#8b5cf6"};
  // 找出命盤實際出現的十神（天干十神 + 藏干十神），用來高亮「最貼近你的」
  const have=new Set();
  [a.chart.year,a.chart.month,a.chart.day,a.chart.hour].forEach(p=>{
    if(!p) return;
    if(p.ganGod&&p.ganGod!=="日主") have.add(p.ganGod);
    (p.cangan||[]).forEach(cg=>{ if(cg.god&&cg.god!=="日主") have.add(cg.god); });
  });
  const cap=`<div class="cap" style="margin-bottom:12px">每個人八字裡的十神組合不同，<b>適合的賺錢方式也不一樣</b>。下面把十種十神各自的求財路線、適合行業與要注意的地方列出來；<b style="color:var(--blue-d)">有藍框的，是你命盤中實際出現、特別貼近你的那幾種</b>，可優先參考。<br><span style="color:var(--sub);font-size:12px">（命理為趨吉避凶之參考，實際仍要看整體格局與大運配合）</span></div>`;
  const cards=order.map(g=>{
    const m=SHISHEN_MONEY[g]; if(!m) return "";
    const c=colors[cls[g]];
    const mine=have.has(g);
    const jobs=(m.jobs||[]).map(j=>`<span class="gm-job">${j}</span>`).join("");
    return `<div class="gm-card${mine?' mine':''}" style="--gm:${c}">
      <div class="gm-head">
        <span class="gm-name">${g}</span>
        <span class="gm-cls" style="background:${c}">${cls[g]}</span>
        ${mine?'<span class="gm-mine-tag">你有</span>':''}
      </div>
      <div class="gm-special">${m.special}</div>
      <div class="gm-how">${m.how}</div>
      <div class="gm-jobs">${jobs}</div>
      <div class="gm-watch"><b>注意</b>${m.watch}</div>
    </div>`;
  }).join("");
  return `${cap}<div class="gm-grid">${cards}</div>`;
}

/* 十神組合看富貴：依命盤實有的十神類別，點出可能成立的「富/貴/才能」組合 */
export function renderGodWealth(a){
  const gt=a.godTally||{};
  const has=k=>(gt[k]||0)>=0.8;  // 該類十神有一定力量才算「有」
  // 依五大類組合判斷（食傷=才華、財星=財、官殺=權貴、印星=靠山、比劫=自我）
  const combos=[
    {on:has("食傷")&&has("財星"), grp:"富", name:"食傷生財", say:"你有「把才華變成錢」的組合——靠創意、技術、口才產出再換成收入，是會賺的命，適合創作、技術、生意。"},
    {on:has("財星")&&has("官殺"), grp:"貴", name:"財官相生", say:"你有「財生官」的組合——財力能撐起地位、事業，名利容易兼得，適合在組織或事業上往上走。"},
    {on:has("官殺")&&has("印星"), grp:"貴", name:"官印相生", say:"你有「官印相生」的組合——權力與學識互相加分，主穩定升遷、職場精英，適合體制內、管理、專業職。"},
    {on:has("印星")&&has("比劫"), grp:"助", name:"印比相隨", say:"你有「印比相隨」的組合——有靠山又有同儕助力，樂於出謀劃策、人緣與後援不錯。"},
    {on:has("食傷")&&has("印星"), grp:"才", name:"傷官佩印", say:"你有「才華＋修養」的組合——聰明又有內涵，名氣與貴氣兼具，最忌恃才傲物，收斂則名利雙收。"},
    {on:has("食傷")&&has("官殺"), grp:"才", name:"食神制殺", say:"你有「以智慧化解壓力」的組合——能在難局中靠才智與行動力脫穎而出，適合需要決斷與創造的領域。"}
  ].filter(c=>c.on);
  const tone={富:"#d97706",貴:"#dc2626",才:"#16a34a",助:"#2563eb"};
  const body = combos.length
    ? `<div class="gw-grid">${combos.map(c=>`<div class="gw-card" style="--gw:${tone[c.grp]}">
        <div class="gw-head"><span class="gw-grp" style="background:${tone[c.grp]}">${c.grp}</span><b>${c.name}</b></div>
        <div class="gw-say">${c.say}</div></div>`).join("")}</div>`
    : `<div class="empty-tip">你命中沒有特別突出的富貴組合——不代表不好，代表人生較平穩、靠後天經營與喜用神方向去發揮即可。</div>`;
  return `<div class="card full"><h3><span class="ic">貴</span>十神組合看富貴</h3>
    <div class="cap" style="margin-bottom:12px">命理看「富」與「貴」，重點不是某個十神多，而是<b>十神之間有沒有「相生流通」的好組合</b>。下面是你命盤中<b>可能成立</b>的組合（依十神能量判斷）：<br><span style="color:var(--sub);font-size:12px">※ 這是方向性參考，真正高低還要看格局純不純、有沒有被沖剋破壞，以及大運配合。</span></div>
    ${body}</div>`;
}

export function renderShensha(list){
  if(!list.length) return `<div class="empty-tip">命中無明顯神煞（不是壞事，代表命局較平穩）</div>`;
  const posLegend=`<div class="ss-poslegend">
    <span class="ss-pl-t">📍 神煞落在哪一柱，影響人生哪個階段：</span>
    <span><b>年柱</b>早年・家族長輩</span>
    <span><b>月柱</b>青年・事業人際</span>
    <span><b>日柱</b>自身・終身・配偶（最貼近你）</span>
    <span><b>時柱</b>晚年・子女子孫</span>
    <span class="ss-pl-n">吉星落該柱＝那階段／那方面受惠；凶煞落該柱＝那階段／那方面要多留意。</span>
  </div>`;
  return `<div class="cap" style="margin-bottom:6px">「神煞」是八字裡的吉星與凶星，<b><span style="color:#15803d">綠色＝吉星(加分)</span>、<span style="color:#b91c1c">紅色＝凶星(要注意)</span></b>。後面標的是它落在哪一柱（影響人生哪個階段）。</div>`
    +posLegend
    +list.map(s=>{
    const pl=SHENSHA_PLAIN[s.name]||{kind:"中",say:s.desc,tip:""};
    const kc=pl.kind==="吉"?"good":pl.kind==="凶"?"bad":"mid";
    const pos=s.positions.map(p=>`<span class="badge gray" style="font-size:10.5px">${POS_PLAIN[p]||p}</span>`).join(" ");
    return `<div class="ss-item">
      <div class="ss-head"><b>${s.name}</b><span class="badge ${kc}">${pl.kind}星</span>${pos}</div>
      <div class="ss-say">${pl.say}</div>
      ${pl.tip?`<div class="ss-tip">💡 ${pl.tip}</div>`:""}</div>`;}).join("");
}

export function renderChengGu(cg){
  if(!cg) return "";
  const rows=cg.parts.map(p=>`<div class="cg-row">
    <span class="cg-k">${p.label}</span>
    <span class="cg-sub">${p.sub}</span>
    <span class="cg-w">${p.cn}</span></div>`).join("");
  const poem=cg.poem.length
    ? `<div class="cg-poem">${cg.poem.map(line=>`<div>${line}</div>`).join("")}</div>`
    : "";
  const note=cg.hourKnown?"":`<div class="cg-warn">※ 未填出生時辰，僅以「年＋月＋日」三項計算，補上時辰會更準。</div>`;
  return `<div class="card cg-card"><h3><span class="ic">秤</span>袁天罡稱骨 · 八字幾兩重</h3>
    <div class="cap">這是一套傳統「查表」算命法：把出生年、月、日、時各換成一個「兩錢數」相加，得到骨重，再對照一首評語詩。<b>與八字／紫微是不同系統</b>，圖個趣味參考即可。</div>
    <div class="cg-body">
      <div class="cg-left">
        ${rows}
        <div class="cg-total">合計骨重　<b>${cg.totalCN}</b><span class="cg-num">（${cg.total.toFixed(1)} 兩）</span></div>
      </div>
      <div class="cg-right">
        <div class="cg-ptitle">「${cg.totalCN}」的評語</div>
        ${poem}
      </div>
    </div>${note}</div>`;
}

export function renderPattern(p){
  return `<div class="cap" style="margin-bottom:8px">「格局」是你八字的<b>整體結構與人生主軸</b>——也就是你這輩子最適合「怎麼走」。<span class="badge blue" style="font-size:10px">正格</span>＝結構清楚的常見命格、<span class="badge bad" style="font-size:10px">特殊</span>＝順從某股強勢的特別命格。</div>`
    +p.patterns.map(pt=>{
    const pl=PATTERN_PLAIN[pt.name]||{say:"",tip:""};
    return `<div class="palace-card">
      <div class="ptitle"><span>${pt.name}</span><span class="badge ${pt.type==='特殊'?'bad':pt.type==='正格'?'blue':'gray'}">${pt.type}</span></div>
      ${pl.say?`<div class="pt-say">${pl.say}</div>`:""}
      ${pl.tip?`<div class="pt-tip">💡 ${pl.tip}</div>`:""}
      <details class="pt-pro"><summary>看命理術語版</summary><div class="pdesc">${pt.desc}</div></details>
    </div>`;}).join("");
}

export function godShort(g){ return g&&g!=="日主"?(GOD_SHORT[g]||""):""; }

export function godYear(g){ return g&&g!=="日主"?(GOD_YEAR[g]||""):""; }

export function luckLegend(yong){
  return `<div class="zw-legend" style="margin-bottom:14px">
    <div class="lg-title">📖 這頁怎麼看</div>
    <ul class="lg-list">
      <li><b>大運＝每十年一個階段、流年＝每一年、流月＝每個月</b>，由粗到細。藍框那柱／當年是<b>現在所在</b>。</li>
      <li><b>「起運」</b>＝你的大運從幾歲開始套用（由出生到節氣的天數換算，每3天約抵1歲）。<b>「順行／逆行」</b>＝大運干支往前或往後排，由你的性別＋出生年陰陽決定——<b>懂結果就好、不用算</b>。</li>
      <li><b>名稱下方的「十神」</b>（正官、七殺、正印…）＝這段時間「主導你的能量類型」，下方已附白話（如「正官＝名譽責任」「七殺＝壓力挑戰」）。</li>
      <li><b><span style="color:#15803d">旺／得力之運</span></b>＝這段時間的五行<b>幫到你的喜用神（${yong.join("")}）</b>，較順；<b><span style="color:#b91c1c">弱／忌神當道</span></b>＝踩到忌神，較費力、宜守。</li>
      <li>年齡採<b>虛歲</b>（出生即1歲）來對應大運，與身分證實歲約差1歲，屬正常。</li>
    </ul>
  </div>`;
}

export function renderLuck(a){
  const dy=calcDaYun(a.bz,a.sex);
  const nowY=new Date().getFullYear();
  annotateDaYun(dy,a.yong.primary,nowY,a.bz.solar.y);
  const tl=dy.list.map(p=>`<div class="ty ${p.active?'active':''}" title="${p.ganGod}：${godShort(p.ganGod)}">
    <div class="gz">${wxSpan(p.gz[0])}${p.gz[1]}</div>
    <div class="g">${p.ganGod}</div>
    <div class="gnote">${godShort(p.ganGod)}</div>
    <div class="age">${p.startAge}-${p.endAge}歲</div>
    <div class="age">${p.startYear}</div>
    <div class="tier tier-${p.tier}">${p.tier}</div>
  </div>`).join("");
  const ln=calcLiuNian(a.bz.solar.y,nowY,10,a.yong.primary,a.bz.dGan);
  const lnRows=ln.map((L,i)=>{const th=LUCK_THEME[L.tier];
    const tierCls=L.tier==='旺'?'good':L.tier==='弱'?'bad':'mid';
    const tierWord=L.tier==='旺'?'順遂、得力':L.tier==='弱'?'費力、宜守':'平穩、待時';
    const isNow=L.year===nowY;
    return `<div class="ly-card ${isNow?'now':''}">
      <div class="ly-head">
        <span class="ly-yr">${L.year}<span class="ly-age">${L.age}歲</span>${isNow?'<span class="ly-tag">今年</span>':''}</span>
        <span class="ly-gz">${wxSpan(L.gz[0])}${L.gz[1]}</span>
        <span class="badge ${tierCls}">${L.tier}・${tierWord}</span>
      </div>
      <div class="ly-god"><b>${L.ganGod}年</b>（${godShort(L.ganGod)}）</div>
      <div class="ly-desc">${godYear(L.ganGod)}</div>
      <div class="ly-yiji">
        <div><span class="yj-y">宜</span>${th.yi.join("、")}</div>
        <div><span class="yj-j">忌</span>${th.ji.join("、")}</div>
      </div>
    </div>`;}).join("");
  return {dy,html:`<div class="dash">
    ${luckLegend(a.yong.primary)}
    <div class="card span-all"><h3><span class="ic">運</span>大運（每十年一柱）
      <span style="margin-left:auto;font-size:11.5px;font-weight:400;color:var(--sub)">${dy.dir}・${dy.startDesc}・旺衰依喜用神（${a.yong.primary.join("")}）判定</span></h3>
      <div class="timeline">${tl}</div></div>
    <div class="card span-all"><h3><span class="ic">年</span>流年（近十年）
      <span style="margin-left:auto;font-size:11.5px;font-weight:400;color:var(--sub)">每年干支對你喜用神（${a.yong.primary.join("")}）的旺衰＋當年主題</span></h3>
      <div class="cap" style="margin-bottom:10px">「<b>宜</b>」是這類年份較有利、可主動去做的事；「<b>忌</b>」是較不利、宜避開或謹慎的事。旺弱看的是當年五行幫不幫你的喜用神，主題看的是流年十神。</div>
      <div class="ly-grid">${lnRows}</div>
      <div class="note" id="liuyueBox" style="cursor:pointer;margin-top:12px">▸ 點此展開 <b>${nowY} 年流月</b>細解（看今年逐月吉凶）</div>
      <div id="liuyueDetail" class="flow2"></div></div>
    </div>`,nowY};
}

export function renderZiwei(a){
  if(!a.ziwei){
    return `<div class="card"><h3><span class="ic">紫</span>紫微斗數</h3>
      <div class="empty-tip">紫微排盤需要<b>準確的出生時辰</b>。請回上方填入出生時間後重新啟盤。</div></div>`;
  }
  const z=a.ziwei;
  // 方格盤
  const cellByBranch={};
  z.palaces.forEach(p=>{ if(p.earthlyBranch) cellByBranch[p.earthlyBranch]=p; });
  const bodyBranch=z.earthlyBranchOfBodyPalace||""; // 身宮所在地支
  const TONE_DOT={good:"#16a34a",ok:"#2563eb",mid:"#94a3b8",bad:"#f59e0b"};
  let cells="";
  for(let r=0;r<4;r++)for(let c=0;c<4;c++){
    if(r>=1&&r<=2&&c>=1&&c<=2){ if(r===1&&c===1){cells+=`<div class="zw-cell center">
        <div style="font-weight:700;font-size:19px;margin-bottom:8px">${a.name||"命盤"}</div>
        <div style="font-size:13.5px;color:var(--sub);line-height:2.1">
          命主 ${z.soul||"—"}・身主 ${z.body||"—"}<br>
          ${z.fiveElementsClass||""}<br>
          生肖 ${(z.zodiac||a.sx.sx).replace(/座$/,"")}・${(z.sign||a.sign+"座").replace(/座座$/,"座")}</div></div>`;} continue; }
    const branch=Object.keys(GRID_POS).find(b=>GRID_POS[b][0]===r&&GRID_POS[b][1]===c);
    const p=branch?cellByBranch[branch]:null;
    if(!p){cells+=`<div class="zw-cell"></div>`;continue;}
    const stars=p.majorStars.map(s=>{
      const meaning=GLOSSARY[s.name]?GLOSSARY[s.name].split("：")[0]:"";
      const brNote=s.brightness?(BRIGHT_NOTE[s.brightness]||s.brightness):"";
      const nm=GLOSSARY[s.name]
        ? `<span class="star-nm star-click" data-star="${s.name}" title="點我看「${s.name}」白話">${s.name}</span>`
        : `<span class="star-nm">${s.name}</span>`;
      return `<div class="star wx-default">${nm}${s.mutagen?`<span class="sh sh-${s.mutagen}">${s.mutagen}</span>`:""}${s.brightness?`<span class="br">${s.brightness}</span>${brBars(s.brightness)}`:""}</div>`
        +`<div class="star-note">${meaning}${brNote?`<br><span style="color:#b08900">${brNote}</span>`:""}${s.mutagen?`<br><span style="color:#2563eb">${(SIHUA_DESC[s.mutagen]||("化"+s.mutagen))}</span>`:""}</div>`;
    }).join("")
      || `<div style="color:#cbd5e1;font-size:10px">（此宮無主星，看對面那一宮借用）</div>`;
    // 輔星（六吉/六煞）＋雜曜：小字一排，吉藍煞紅雜灰；附白話 tooltip
    const starNote=nm=>{ const g=GLOSSARY[nm]; return g?` title="${nm}＝${g.split("：")[0]}"`:` title="${nm}"`; };
    const minorHTML=(p.minorStars||[]).map(s=>{
      const cls=s.type==="soft"?"zw-soft":s.type==="tough"?"zw-tough":(s.type==="lucun"||s.type==="tianma")?"zw-lucun":"zw-adj";
      const clickable=GLOSSARY[s.name]?" mstar-click":"";
      return `<span class="zw-mstar ${cls}${clickable}" data-mstar="${s.name}"${starNote(s.name)}>${s.name}${s.mutagen?`<i class="sh sh-${s.mutagen}">${s.mutagen}</i>`:""}${s.brightness?`<small>${s.brightness}</small>`:""}</span>`;
    }).join("");
    const adjHTML=(p.adjStars||[]).map(s=>{const nm=s.name||s;const clickable=GLOSSARY[nm]?" mstar-click":"";return `<span class="zw-mstar zw-adj${clickable}" data-mstar="${nm}"${starNote(nm)}>${nm}</span>`;}).join("");
    const minorLine=(minorHTML||adjHTML)?`<div class="zw-minor">${minorHTML}${adjHTML}</div>`:"";
    // 排盤明細：長生/博士/將前/歲前十二神 + 大限歲數
    const s12=[];
    if(p.changsheng12) s12.push(`<span class="zw-12 cs12" title="長生十二神：能量階段">${p.changsheng12}</span>`);
    if(p.boshi12) s12.push(`<span class="zw-12 bo12" title="博士十二神：${BOSHI12_DESC[p.boshi12]||''}">${p.boshi12}</span>`);
    if(p.jiangqian12) s12.push(`<span class="zw-12 jq12" title="將前十二神">${p.jiangqian12}</span>`);
    if(p.suiqian12) s12.push(`<span class="zw-12 sq12" title="歲前十二神（太歲方位）">${p.suiqian12}</span>`);
    const s12Line=s12.length?`<div class="zw-12row">${s12.join("")}</div>`:"";
    const decadalLine=p.decadal&&Array.isArray(p.decadal.range)?`<span class="zw-dec" title="大限：這十年走這一宮（虛歲 ${p.decadal.range[0]}–${p.decadal.range[1]}）">大限 ${p.decadal.range[0]}–${p.decadal.range[1]}</span>`:"";
    const laiyin=p.isOriginalPalace?'<span class="zw-laiyin" title="來因宮＝生年天干所落之宮，是你這輩子福分與因果的源頭">來因</span>':'';
    // 三方四正的宮（對宮＋兩三合宮）：宮名＋完整物件(供整合判斷)
    const b=p.earthlyBranch;
    const oppPal=cellByBranch[ZW_CHONG[b]]||null;
    const hePals=(ZW_SANHE[b]||[]).map(tb=>cellByBranch[tb]||null).filter(Boolean);
    // 該宮吉凶評分（含三方四正）
    const sc=palaceScore(p, cellByBranch);
    const isMing=p.name==='命宮';
    const isBody=bodyBranch&&b===bodyBranch;
    const badge=(isMing?'<span class="zw-badge ming-b" title="命宮＝你是誰、先天個性">命宮</span>':'')+(isBody?'<span class="zw-badge body-b" title="身宮＝後天會變成的樣子">身宮</span>':'');
    // 浮動框內容（點擊跳出）
    const detail=palaceDetailHTML(p,{opp:(oppPal||{}).name||"",he:hePals.map(x=>x.name),oppPal,hePals});
    cells+=`<div class="zw-cell clickable zwt-${sc.tone}${isMing?' ming':''}${isBody?' bodyp':''}${p.isOriginalPalace?' laiyinp':''}" data-detail="${encodeURIComponent(detail)}" data-branch="${p.earthlyBranch||''}" title="點我看「${p.name}」的三方四正與詳解">
      <span class="zw-dot" style="background:${TONE_DOT[sc.tone]}" title="這宮整體：${sc.word}"></span>
      ${laiyin}
      <div class="pn">${p.name}${badge}<span class="pn-note">${(GLOSSARY[p.name]||p.desc||"").split("（")[0].split("：").slice(-1)[0]}</span></div>${stars}${minorLine}${s12Line}
      <div class="mn">${decadalLine}<span class="zw-gz">${p.heavenlyStem||""}${p.earthlyBranch||""}</span></div></div>`;
  }
  const legend=`<div class="zw-legend">
    <div class="lg-title">📖 看不懂？這張盤這樣讀</div>
    <ul class="lg-list">
      <li><b>十二個格子＝人生十二個面向</b>：每格上面藍字是宮名（如「命宮＝核心性格」「夫妻＝感情婚姻」），下面灰字是它管什麼。<b>藍底那格是「命宮」，最重要</b>。</li>
      <li><b>格子裡的大字＝主星</b>：代表這個面向的「個性／能量」，星名下方已直接寫白話意思（如「紫微＝帝王星，主領導」）。</li>
      <li><b>星旁的小灰字＝這顆星的力量強弱</b>，由強到弱共七級：<span style="color:#b08900"><b>廟</b>(最強)＞<b>旺</b>(很強)＞<b>得</b>(不錯)＞<b>利</b>(尚可)＞<b>平</b>(普通)＞<b>不</b>(偏弱)＞<b>陷</b>(最弱)</span>。</li>
      <li><b>彩色小標＝四化</b>（出生那年天干決定、跟你一輩子的特殊加成）：<span class="sh sh-祿">祿</span>好處財祿、<span class="sh sh-權">權</span>權力能力、<span class="sh sh-科">科</span>名聲貴人、<span class="sh sh-忌">忌</span>牽絆阻礙（功課所在）。</li>
      <li><b>右上角圓點＋格子右下角的淡淡光暈＝這宮整體強弱</b>（已幫你算好）：<span style="color:#16a34a">●</span>強旺、<span style="color:#2563eb">●</span>不錯、<span style="color:#94a3b8">●</span>中等、<span style="color:#f59e0b">●</span>偏弱。</li>
      <li><b>命宮＝你是誰、身宮＝後天會變成的樣子</b>；格內有藍/紫徽章標示。</li>
      <li><b>有些格寫「無主星」＝空宮</b>：不是壞事，代表那面向個性較<b>隨環境而變</b>，要看「對宮」（正對面那宮）的星來借用論斷。</li>
      <li><b>點任一宮會拉出<span style="color:#dc2626">紅色虛線</span>＝三方四正</b>：連到要「一起合看」的另三宮——<b>對宮</b>（正對面，看外在結果）＋<b>兩個三合宮</b>（同組互助）。論命要四宮合看才完整。</li>
      <li><b>格子角落兩字（如壬午）＝干支座標</b>，排盤用的，不懂可略過。</li>
    </ul>
    <div class="lg-foot">命主 <b>${z.soul}</b>＝先天主導你的星、身主 <b>${z.body}</b>＝後天養成你的星；<b>${z.fiveElementsClass}</b>＝決定大運幾歲起運的五行局。</div>
  </div>`;
  // 14 主星白話小辭典（填左欄、幫助讀盤）
  const ZW_STARS=["紫微","天機","太陽","武曲","天同","廉貞","天府","太陰","貪狼","巨門","天相","天梁","七殺","破軍"];
  const starDict=`<div class="star-dict">
    <div class="sd-title">🔆 十四主星 白話速查</div>
    ${ZW_STARS.map(n=>`<div class="sd-row" data-stardict="${n}"><b>${n}</b><span>${(GLOSSARY[n]||"").split("：").slice(-1)[0]}</span></div>`).join("")}
  </div>`;
  // 輔星雜曜 白話速查（六吉/六煞/常見雜曜）
  const AUX_GROUPS=[
    ["六吉星（助力／貴人）",["左輔","右弼","文昌","文曲","天魁","天鉞","祿存"]],
    ["六煞星（阻力／要注意）",["擎羊","陀羅","火星","鈴星","地空","地劫"]],
    ["常見雜曜",["天馬","紅鸞","天喜","天姚","孤辰","寡宿","天刑","陰煞"]]
  ];
  const auxDict=`<div class="star-dict aux-dict">
    <div class="sd-title">⭐ 輔星・雜曜 白話速查</div>
    <div class="sd-intro">主星之外，盤上還有這些<b>輔星與雜曜</b>，會替主星「加分或扣分」。格子裡的小字星名就是它們，<b>點一下可在這裡查白話</b>。</div>
    ${AUX_GROUPS.map(([t,arr])=>`<div class="aux-grp"><div class="aux-grp-t">${t}</div>${arr.filter(n=>GLOSSARY[n]).map(n=>`<div class="sd-row" data-stardict="${n}"><b>${n}</b><span>${(GLOSSARY[n]||"").split("：").slice(-1)[0]}</span></div>`).join("")}</div>`).join("")}
  </div>`;
  const sihuaCard=`<div class="star-dict sihua-dict">
    <div class="sd-title">✨ 四化是什麼？（化祿/權/科/忌）</div>
    <div class="sh-intro">「四化」是你<b>出生那一年的天干</b>，讓四顆星各自「變化」出一種特殊力量，<b>跟你一輩子</b>。就像幫某顆星「加裝備」——星名後面有彩色小標的，就是被化到的星。</div>
    <div class="sh-row"><span class="sh sh-祿">祿</span><div><b>化祿＝財祿、好處、順遂</b>。這顆星帶來機會、收入、貴人緣，是你<b>最容易得到甜頭</b>的地方。</div></div>
    <div class="sh-row"><span class="sh sh-權">權</span><div><b>化權＝權力、能力、掌控</b>。這顆星讓你在那塊特別<b>強勢、有主導力、做得起來</b>，適合掌權扛責。</div></div>
    <div class="sh-row"><span class="sh sh-科">科</span><div><b>化科＝名聲、貴人、文書</b>。這顆星帶來<b>好名聲、考運、貴人相助</b>，遇難也較能化解。</div></div>
    <div class="sh-row"><span class="sh sh-忌">忌</span><div><b>化忌＝執著、牽絆、功課</b>。這顆星是你<b>最在意、最容易卡關</b>的地方，不是壞事，而是這輩子要學會放下、用心經營的課題。</div></div>
    <div class="sh-foot">舉例：「天梁化權」＝天梁這顆星被加上「權」的力量，在它管的事上你會更有主導力；「太陰化忌」＝太陰那塊是你較放不下、要多用心的功課。</div>
  </div>`;
  return `<div class="card zw-card"><h3><span class="ic">紫</span>紫微斗數 · 命盤
        <span style="margin-left:auto;font-size:11.5px;font-weight:400;color:var(--sub)">👆 點任一宮格看詳解＋三方四正連線</span></h3>
      <div class="zw-top2">
        <div class="zw-top-l">${ziweiOverview(z,a,cellByBranch,bodyBranch)}</div>
        <div class="zw-top-r">${ziweiSummary(z,a)}</div>
      </div>
      <div class="zw-layout">
        <div class="zw-side">${legend}</div>
        <div class="ziwei-wrap"><svg class="zw-lines" id="zwLines"></svg><div class="ziwei-grid">${cells}</div>
          <div class="zw-pop" id="zwPop" hidden></div></div>
      </div>
      <div class="zw-dicts">${sihuaCard}${starDict}${auxDict}</div>
      ${renderZiweiHoro(a)}</div>`;
}

export function renderZiweiHoro(a){
  const z=a.ziwei, ho=a.ziweiHoro;
  if(!z||!ho||!ho.yearly) return "";
  const nowY=(ho.solarDate&&(""+ho.solarDate).slice(0,4))|| (new Date().getFullYear()+"");
  const cellByBranch={}; z.palaces.forEach(p=>{ if(p.earthlyBranch) cellByBranch[p.earthlyBranch]=p; });
  // 把一個 scope（流年/大限/小限）攤平成 branch→{宮名, 流曜[]}
  const layout=(sc)=>{
    if(!sc) return {map:{}, mingBranch:""};
    const map={};
    (sc.palaceNames||[]).forEach((nm,i)=>{ const br=ZW_IDX_BRANCH[i]; map[br]={name:nm, stars:(sc.stars&&sc.stars[i])||[]}; });
    return {map, mingBranch: ZW_IDX_BRANCH[sc.index]||""};
  };
  const yl=layout(ho.yearly);
  const dec=layout(ho.decadal);
  const sihuaTags=(arr,scopeName)=>{
    if(!arr||!arr.length) return "";
    const labels=["祿","權","科","忌"];
    return arr.map((star,i)=>`<span class="hs-sihua sh-${labels[i]}" title="${scopeName}化${labels[i]}：${star} 被化${labels[i]}">${star}<i>${labels[i]}</i></span>`).join("");
  };
  // —— 四化白話＋落宮（找出流年四化星各自飛到流年盤的哪個宮）——
  const SIHUA_MEAN={
    祿:{word:"機遇、財富、人緣",good:true,say:"今年帶來機會、財路與好人緣的地方"},
    權:{word:"權力、掌控、競爭",good:true,say:"今年你能掌權、強勢發揮、扛得起來的地方"},
    科:{word:"名聲、貴人、化解",good:true,say:"今年有好名聲、考運、貴人相助的地方"},
    忌:{word:"阻礙、損失、執念",good:false,say:"今年最容易卡關、糾結、要特別留意的地方"}
  };
  const labels=["祿","權","科","忌"];
  // 流年四化星 → 該星落在流年盤哪一宮（用本命宮位星曜定位 → 對應流年宮名）
  const starPalace=(starName)=>{
    for(const p of z.palaces){
      if((p.majorStars||[]).some(s=>s.name===starName) || (p.minorStars||[]).some(s=>s.name===starName)){
        const yname=(yl.map[p.earthlyBranch]||{}).name;
        return yname||p.name;
      }
    }
    return "";
  };
  const sihuaLand=(ho.yearly.mutagen||[]).map((star,i)=>({
    label:labels[i], star, pal:starPalace(star), ...SIHUA_MEAN[labels[i]]
  }));
  // 流年盤：在本命格局上疊「流年宮名 + 流年四化星 + 流曜」
  let hcells="";
  for(let r=0;r<4;r++)for(let c=0;c<4;c++){
    if(r>=1&&r<=2&&c>=1&&c<=2){
      if(r===1&&c===1){
        const ymut=ho.yearly.mutagen||[];
        hcells+=`<div class="hs-cell center">
          <div class="hs-c-title">${nowY} 流年盤</div>
          <div class="hs-c-sub">流年干支 <b>${ho.yearly.stem}${ho.yearly.branch}</b>${ho.age&&ho.age.nominalAge?`　虛歲 <b>${ho.age.nominalAge}</b>`:""}</div>
          <div class="hs-c-sub" style="margin-top:6px">大限 <b>${ho.decadal.stem}${ho.decadal.branch}</b>（這十年主軸）</div>
          <div class="hs-c-sihua"><span class="hs-c-k">流年四化</span>${sihuaTags(ymut,"流年")}</div>
        </div>`;
      }
      continue;
    }
    const branch=ZW_IDX_BRANCH.find(b=>GRID_POS[b]&&GRID_POS[b][0]===r&&GRID_POS[b][1]===c);
    const nat=branch?cellByBranch[branch]:null;
    if(!nat){hcells+=`<div class="hs-cell"></div>`;continue;}
    const yInfo=yl.map[branch]||{name:"",stars:[]};
    const dInfo=dec.map[branch]||{name:""};
    const isYMing=branch===yl.mingBranch;
    const isDMing=branch===dec.mingBranch;
    // 本命主星（小灰字墊底，知道這格本來坐什麼星）
    const natStars=(nat.majorStars||[]).map(s=>s.name).join("·")||"（空宮借對宮）";
    // 流曜（流年飛入的星，如流昌流曲流陀等）—附白話 tooltip
    const FLOW_NOTE={流祿:"今年的財祿、好處",流羊:"今年的衝動、血光、是非（小心）",流陀:"今年的拖延、暗耗（小心）",流昌:"今年的考運、文書、聰明",流曲:"今年的才藝、口才、桃花",流魁:"今年的男貴人",流鉞:"今年的女貴人",流馬:"今年的走動、變遷",流喜:"今年的喜慶、桃花",流鸞:"今年的姻緣、桃花"};
    const flow=(yInfo.stars||[]).map(s=>{const note=FLOW_NOTE[s.name]||"今年飛入的流曜";return `<span class="hs-flow" title="${s.name}＝${note}">${s.name}</span>`;}).join("");
    hcells+=`<div class="hs-cell${isYMing?' y-ming':''}">
      <div class="hs-pnames">
        <span class="hs-yname" title="流年${yInfo.name}：今年這宮主管「${PALACE_SHORT[yInfo.name]||yInfo.name}」">流年·${yInfo.name||"—"}</span>
        <span class="hs-dname" title="大限${dInfo.name}：這十年這宮主管「${PALACE_SHORT[dInfo.name]||dInfo.name}」">限·${dInfo.name||"—"}</span>
      </div>
      <div class="hs-nat">本命 ${nat.name}：${natStars}</div>
      ${flow?`<div class="hs-flows">${flow}</div>`:""}
      <div class="hs-gz">${branch}</div>
      ${isYMing?'<span class="hs-tag y">流年命宮</span>':''}${isDMing&&!isYMing?'<span class="hs-tag d">大限命宮</span>':''}
    </div>`;
  }
  const yMingName=(yl.map[yl.mingBranch]||{}).name||"";
  // —— 白話總結：今年對你來說是什麼樣的一年（一般人直接讀這段就懂）——
  const mingTopic=PALACE_TOPIC[yMingName]||PALACE_SHORT[yMingName]||yMingName;
  const luItem=sihuaLand.find(s=>s.label==="祿");
  const jiItem=sihuaLand.find(s=>s.label==="忌");
  const verdict=`<div class="hs-verdict">
    <div class="hs-v-title">🔮 ${nowY} 年，這一年對你來說（白話總結）</div>
    <div class="hs-v-row"><b>整體主軸</b>今年的「流年命宮」落在 <b style="color:#dc2626">${yMingName}</b> 的位置——代表 <b>${nowY} 這一年的重心會放在「${mingTopic}」</b>這一塊，是今年最該用心、感受也最明顯的領域。</div>
    ${luItem&&luItem.pal?`<div class="hs-v-row good"><b>今年的甜頭</b>化祿（機遇、財富、人緣）落在 <b>${luItem.pal}宮</b>——今年在「${PALACE_SHORT[luItem.pal]||luItem.pal}」這方面較容易有機會、進財或遇貴人，可主動把握。</div>`:""}
    ${jiItem&&jiItem.pal?`<div class="hs-v-row bad"><b>今年要留意</b>化忌（阻礙、損失、執念）落在 <b>${jiItem.pal}宮</b>——今年在「${PALACE_SHORT[jiItem.pal]||jiItem.pal}」這方面較容易卡關、糾結或破耗，凡事多留一手、別鑽牛角尖。</div>`:""}
    <div class="hs-v-note">※ 這是依「流年命宮」與「流年四化落宮」推出的方向性參考，實際吉凶還要看本命格局與整體配合。</div>
  </div>`;
  // 四化白話速查卡
  const sihuaCard=`<div class="hs-sihua-card">
    <div class="hs-sc-title">✨ 流年四化在說什麼（${nowY} 年版）</div>
    <div class="hs-sc-grid">
      ${sihuaLand.map(s=>`<div class="hs-sc-row sh-row-${s.label}">
        <span class="sh sh-${s.label}">${s.label}</span>
        <div class="hs-sc-txt"><b>${s.star} 化${s.label}</b>＝${s.word}${s.pal?`，今年落在 <b>${s.pal}宮</b>` :""}。<span class="hs-sc-say">${s.say}。</span></div>
      </div>`).join("")}
    </div>
  </div>`;
  const guide=`<div class="hs-guide">
    <div class="hs-g-title">📖 流年盤怎麼看</div>
    <ul>
      <li>這張是 <b>${nowY} 這一年</b>的運勢盤（會疊在你<b>一輩子的本命盤</b>上看）。每格上面：<span style="color:#dc2626"><b>流年·宮名</b></span>＝今年這個位置變成什麼宮、<span style="color:#7c3aed"><b>限·宮名</b></span>＝這十年大限這格是什麼宮。</li>
      <li><b>「流年命宮」那格最關鍵</b>——今年的整體運勢主軸就看它（今年落在 <b style="color:#dc2626">${yMingName||"—"}</b> 的位置）。</li>
      <li><b>中間的流年四化</b>（${(ho.yearly.mutagen||[]).join("、")}）＝今年被加成的四顆星：<span class="sh sh-祿">祿</span>今年的財路機會、<span class="sh sh-權">權</span>今年能掌權發揮、<span class="sh sh-科">科</span>今年的貴人名聲、<span class="sh sh-忌">忌</span>今年較卡關、要留意的事。看它們<b>落在哪一宮</b>，就知道今年哪方面有好處／要小心。</li>
      <li>格子裡灰字「本命…」是這格<b>本來</b>坐什麼星，藍框小字是今年飛進來的<b>流曜</b>（如流昌、流陀）。</li>
    </ul>
  </div>`;
  // 年份切換器（提供前後幾年快速跳）
  const baseY=parseInt(nowY,10)||new Date().getFullYear();
  const yrs=[]; for(let d=-2;d<=4;d++) yrs.push(baseY+d);
  const switcher=`<div class="hs-years">
    <span class="hs-y-lbl">看其他年份：</span>
    ${yrs.map(y=>`<button class="hs-yr${y===baseY?' on':''}" data-hy="${y}">${y}</button>`).join("")}
  </div>`;
  return `<div class="zw-horo" id="zwHoro">
    <div class="zw-horo-head"><span class="ic">運</span>紫微流年盤<small>大限／流年／小限 運限疊算</small></div>
    ${switcher}
    <div class="hs-layout">
      <div class="hs-explain">${verdict}${sihuaCard}${guide}</div>
      <div class="hs-wrap"><div class="hs-grid">${hcells}</div></div>
    </div>
  </div>`;
}

export function ziweiOverview(z,a,cellByBranch,bodyBranch){
  const name=a.name||"你";
  const scored=z.palaces.map(p=>({p, sc:palaceScore(p,cellByBranch)}))
    .map(o=>({name:o.p.name, topic:PALACE_SHORT[o.p.name]||o.p.name, ...o.sc}));
  const sorted=scored.slice().sort((a,b)=>b.score-a.score);
  const strong=sorted.slice(0,3);
  const weak=sorted.slice(-2).reverse();
  const avg=scored.reduce((s,x)=>s+x.score,0)/scored.length;
  let oTone,oWord;
  if(avg>=2){oTone="good";oWord="整體偏旺，是格局不錯的命盤";}
  else if(avg>=0.5){oTone="ok";oWord="整體平穩，有亮點也有要努力的地方";}
  else if(avg>=-0.5){oTone="mid";oWord="整體中等，運勢起伏看後天經營";}
  else{oTone="bad";oWord="整體較需用心，靠努力與調整補強";}
  const emptyCnt=scored.filter(x=>x.empty).length;
  // 化忌落宮（你的功課）
  let jiPalace="";
  z.palaces.forEach(p=>p.majorStars.forEach(s=>{ if(s.mutagen==="忌") jiPalace=`${p.name}的${s.name}`; }));
  const chip=(x)=>`<span class="ov-chip ovt-${x.tone}">${x.name}<small>${x.topic}</small></span>`;
  const bodyName=(z.palaces.find(p=>p.earthlyBranch===bodyBranch)||{}).name||"";
  return `<div class="zw-overview">
    <div class="ov-head"><span class="ov-total ovt-${oTone}">命盤總評</span><b>${oWord}</b></div>
    <div class="ov-note">這是<b>${name}一輩子的「先天命盤」，不是今年運勢</b>（今年運勢請看上方「大運流年」分頁）。下面幫你把 12 宮排好了：</div>
    <div class="ov-grid">
      <div class="ov-col"><div class="ov-col-t">💪 你最強的三塊（優勢）</div><div class="ov-chips">${strong.map(chip).join("")}</div></div>
      <div class="ov-col"><div class="ov-col-t">⚠ 最該用心的兩塊</div><div class="ov-chips">${weak.map(chip).join("")}</div></div>
    </div>
    <div class="ov-extra">
      <span>🏠 <b style="color:var(--blue-d)">命宮</b>＝你「先天的個性、你是誰」；<b style="color:#7c3aed">身宮</b>＝你「後天會慢慢變成的樣子、中年後越明顯」。${
        bodyName==="命宮"
          ? `你的<b>命宮和身宮在同一格</b>——代表你<b>先天個性與後天發展方向一致、表裡如一</b>，人生主軸清楚、不太會中途大轉變。`
          : (bodyName?`你的身宮落在 <b>${bodyName}宮</b>——代表你後天會越來越重視、投入「${PALACE_SHORT[bodyName]||bodyName}」這一塊。`:"")
      }</span>
      ${jiPalace?`<span>📌 你這輩子的「功課」在 <b>${jiPalace}化忌</b>——這塊最容易卡關、要多用心。</span>`:""}
      ${emptyCnt?`<span>⭕ 你有 <b>${emptyCnt}</b> 個空宮（沒有主星），代表那些面向個性較隨環境、看對宮，不是壞事。</span>`:""}
    </div>
    <div class="ov-legend">每格右上角圓點＝該宮整體：<span class="ov-dot" style="background:#16a34a"></span>強旺　<span class="ov-dot" style="background:#2563eb"></span>不錯　<span class="ov-dot" style="background:#94a3b8"></span>中等　<span class="ov-dot" style="background:#f59e0b"></span>偏弱</div>
  </div>`;
}

export function ziweiSummary(z,a){
  const name=a.name||"這個人";
  const pget=n=>z.palaces.find(p=>p.name===n);
  const starList=p=>p&&p.majorStars.length?p.majorStars.map(s=>s.name):[];
  const starPlain=names=>names.map(n=>stripDot((GLOSSARY[n]||"").split("：").slice(-1)[0])).filter(Boolean);
  // 命宮
  const ming=pget("命宮"); const mingStars=starList(ming);
  let mingSay;
  if(mingStars.length){
    mingSay=`命宮坐 <b>${mingStars.join("、")}</b>——${starPlain(mingStars).join("；")}。這是${name}的核心性格與一生主軸。`;
  }else{
    const oppName={命宮:"遷移"}; const opp=pget("遷移"); const os=starList(opp);
    mingSay=`命宮無主星，個性較隨環境而變、可塑性高，要看對宮<b>遷移宮（${os.join("、")||"—"}）</b>來借用論斷——代表${name}在外、與人互動時更能展現自己。`;
  }
  // 事業 / 財帛 / 夫妻 三大重點宮
  const blocks=[
    ["官祿","事業","你的事業舞台與工作表現"],
    ["財帛","財運","你賺錢的方式與財運來源"],
    ["夫妻","感情","你的婚姻、另一半與相處模式"]
  ].map(([pn,label,desc])=>{
    const p=pget(pn); const st=starList(p);
    if(!st.length) return `<div class="zs-row"><span class="zs-k">${label}</span><span>此宮無主星，須參考對宮；${desc}較隨緣、起伏看大運。</span></div>`;
    const mut=p.majorStars.filter(s=>s.mutagen).map(s=>`${s.name}化${s.mutagen}`);
    const mutSay=mut.length?`（帶${mut.join("、")}，${p.majorStars.some(s=>s.mutagen==='祿'||s.mutagen==='權'||s.mutagen==='科')?'多為加分助力':'要多留意'}）`:"";
    return `<div class="zs-row"><span class="zs-k">${label}</span><span>坐 <b>${st.join("、")}</b>${mutSay}——${starPlain(st).join("；")}。</span></div>`;
  }).join("");
  // 四化：拆成「甜蜜點(祿權科)」與「功課(忌)」
  let sihua="";
  const sweet=[], task=[];
  z.palaces.forEach(p=>p.majorStars.forEach(s=>{
    if(s.mutagen==="祿"||s.mutagen==="權"||s.mutagen==="科") sweet.push(`${p.name}的${s.name}化${s.mutagen}`);
    if(s.mutagen==="忌") task.push(`${p.name}的${s.name}化忌`);
  }));
  if(sweet.length||task.length){
    sihua=`<div class="zs-row"><span class="zs-k">四化</span><span>`
      +(sweet.length?`<b style="color:#15803d">甜蜜點</b>（機會與助力所在）：${sweet.join("、")}。`:"")
      +(task.length?`<b style="color:#b91c1c">人生功課</b>（最該用心、易卡關）：${task.join("、")}。`:"")
      +`</span></div>`;
  }

  // 一句人物速寫：用命宮主星的關鍵特質拼一句
  const traitOf=p=>{const st=starList(p);return st.map(n=>{const g=GLOSSARY[n]||"";const m=g.match(/[：]([^，。]+)/);return m?m[1]:"";}).filter(Boolean);};
  const mc=ming&&ming.majorStars.length?traitOf(ming):traitOf(pget("遷移"));
  const speed=mc.length?`<p class="zs-speed">👤 一句話形容${name}：是一個<b>${mc.slice(0,3).join("、")}</b>的人。</p>`:"";
  return `<div class="zw-summary">
    <div class="zs-title">🔮 一段話總結${name}的紫微命盤</div>
    ${speed}
    <p class="zs-lead">${mingSay} 命主星 <b>${z.soul}</b>、身主星 <b>${z.body}</b>，五行屬 <b>${z.fiveElementsClass}</b>。</p>
    <div class="zs-rows">${blocks}${sihua}</div>
    <p class="zs-foot">綜合來看，${name}適合往「命宮＋事業宮」星曜的特質發展最順；想細看任何一宮，點上方該宮格會跳出詳解與三方四正連線。紫微為性格與運勢的參考，最終仍由自己掌握。</p>
  </div>`;
}

export function palaceDetailHTML(p, rel){
  const stars=p.majorStars.length
    ? p.majorStars.map(s=>`${s.name}${s.brightness?`<span style="color:#b08900;font-size:11px">${s.brightness}</span>`:""}${s.mutagen?`<span class="badge ${s.mutagen==='祿'?'good':s.mutagen==='忌'?'bad':'blue'}" style="padding:0 6px;margin-left:2px">化${s.mutagen}</span>`:""}`).join("、")
    : '<span style="color:#94a3b8">這格沒有主星，看正對面那一宮的星來借用論斷</span>';
  const starDescs=p.majorStars.map(s=>{
    const g=GLOSSARY[s.name];
    return g?`<div class="pd-star"><b>${s.name}</b>：${g}</div>`:"";
  }).join("");
  const palMeaning=GLOSSARY[p.name]||p.desc||"";
  const opp=rel&&rel.opp?rel.opp:"";
  const he=rel&&rel.he&&rel.he.length?rel.he:[];
  // 把本宮＋對宮＋三合宮的星整合，算出白話結論
  const verdict=sfszVerdict(p, rel);
  const sfszLines=[
    opp?`<div class="sf-line"><span class="sf-tag opp">對宮</span><b class="sf-pal">${opp}</b><span class="sf-desc">${starsOfPalShort(rel&&rel.oppPal)}</span></div>`:"",
    he.length?`<div class="sf-line"><span class="sf-tag he">三合</span><b class="sf-pal">${he.join("、")}</b><span class="sf-desc">${(rel&&rel.hePals||[]).map(starsOfPalShort).filter(Boolean).join("；")||"借對宮論"}</span></div>`:""
  ].join("");
  return `<div class="pd-head"><span class="pd-name">${p.name}</span>`
    +`<span class="pd-gz">${p.heavenlyStem||""}${p.earthlyBranch||""}</span></div>`
    +`<div class="pd-meaning">這一宮看的是：${palMeaning}</div>`
    +`<div class="pd-stars-line">坐這宮的主星：${stars}</div>`
    +(starDescs?`<div class="pd-starbox">${starDescs}</div>`:"")
    +`<div class="pd-sfsz">
        <div class="pd-sf-title">📊 綜合這宮＋連線三宮，整體判斷</div>
        <div class="pd-verdict pdv-${verdict.tone}">${verdict.text}</div>
        <div class="pd-sf-rel">同時參考（紅線連到的三宮）：</div>
        ${sfszLines}
      </div>`;
}

export function starsOfPalShort(pal){
  if(!pal) return "";
  if(!pal.majorStars||!pal.majorStars.length) return "（無主星）";
  return pal.majorStars.map(s=>`${s.name}${s.brightness||""}${s.mutagen?`化${s.mutagen}`:""}`).join("、");
}

export function palaceScore(p, palByBranch){
  const b=p.earthlyBranch;
  const pals=[p, palByBranch[ZW_CHONG[b]], ...((ZW_SANHE[b]||[]).map(tb=>palByBranch[tb]))].filter(Boolean);
  const allStars=pals.flatMap(x=>x.majorStars||[]);
  const BR={廟:2,旺:1.5,得:1,利:0.5,平:0,不:-1,陷:-1.5};
  let score=0, good=[], bad=[];
  allStars.forEach(s=>{
    const br=BR[s.brightness]!=null?BR[s.brightness]:0; score+=br;
    if(s.mutagen==="祿"||s.mutagen==="權"||s.mutagen==="科"){score+=1.5; good.push(`${s.name}化${s.mutagen}`);}
    if(s.mutagen==="忌"){score-=1.5; bad.push(`${s.name}化忌`);}
    if(br>=1.5) good.push(`${s.name}${s.brightness}`);
    if(br<=-1) bad.push(`${s.name}${s.brightness}`);
  });
  let tone, word;
  if(score>=4){ tone="good"; word="強旺、是你的優勢"; }
  else if(score>=1){ tone="ok"; word="不錯、平穩有亮點"; }
  else if(score>-1){ tone="mid"; word="中等、看後天努力"; }
  else{ tone="bad"; word="偏弱、較需用心"; }
  return {score, tone, word, good:[...new Set(good)], bad:[...new Set(bad)],
    empty:!(p.majorStars&&p.majorStars.length)};
}

export function sfszVerdict(p, rel){
  const palByBranch={}; // 從 rel 重建（rel 已含 oppPal/hePals）
  const sc=palaceScore(p, (function(){const m={};[p,rel&&rel.oppPal,...((rel&&rel.hePals)||[])].filter(Boolean).forEach(x=>m[x.earthlyBranch]=x);return m;})());
  const topic=PALACE_TOPIC[p.name]||"這個面向";
  const leadMap={good:"<b>強旺、是你的優勢</b>",ok:"<b>大致不錯、平穩中帶亮點</b>",mid:"<b>中規中矩、起伏看後天努力</b>",bad:"<b>力量偏弱、較需用心經營</b>"};
  const goodTxt=sc.good.length?`亮點在 ${sc.good.slice(0,3).join("、")}` : "";
  const badTxt=sc.bad.length?`要留意 ${sc.bad.slice(0,3).join("、")}` : "";
  const detail=[goodTxt,badTxt].filter(Boolean).join("，");
  const emptyNote=sc.empty?`本宮無主星、力量較依賴對宮，個性與表現較隨環境變化。` : "";
  return {tone:sc.tone, text:`把「${p.name}」連同對宮、三合宮一起看，<b>${topic}</b>這塊 ${leadMap[sc.tone]}。${detail?detail+"。":""}${emptyNote}`};
}

export function renderDaYunMini(a){
  const dy=calcDaYun(a.bz,a.sex);const nowY=new Date().getFullYear();
  annotateDaYun(dy,a.yong.primary,nowY,a.bz.solar.y);
  const tl=dy.list.map(p=>`<div class="ty ${p.active?'active':''}">
    <div class="gz">${wxSpan(p.gz[0])}${p.gz[1]}</div><div class="g">${p.ganGod}</div>
    <div class="age">${p.startAge}-${p.endAge}</div><div class="tier tier-${p.tier}">${p.tier}</div></div>`).join("");
  return `<div class="cap" style="margin-bottom:8px">${dy.dir}・${dy.startDesc}（喜用 ${a.yong.primary.join("")}）</div><div class="timeline">${tl}</div>`;
}

export function renderSummary(a){
  const name=a.name||"你";
  const str=a.strength.strength;
  const strSay={極強:"自我能量極強、很有主見",身強:"自我能量偏強、有衝勁、扛得住事",中和:"日主強弱適中、是最平衡的狀態",身弱:"自我能量偏弱、較需要支援與貴人",極弱:"自我能量很弱、宜順勢借力而非硬撐"}[str]||"";
  const pat=a.pattern.patterns[0]; const patP=PATTERN_PLAIN[pat.name]||{};
  const yong=a.yong.primary.join("、"); const avoid=a.yong.avoid.join("、");
  // 喜用的開運面向（取第一個喜用五行的色/方位/行業）
  const r0=WX_REMEDY[a.yong.primary[0]]||{};
  // 紫微命宮主星
  let mingSay="";
  if(a.ziwei){
    const ming=a.ziwei.palaces.find(p=>p.name==="命宮");
    if(ming&&ming.majorStars.length){
      const names=ming.majorStars.map(s=>s.name);
      const descs=names.map(n=>stripDot((GLOSSARY[n]||"").split("：").slice(-1)[0])).filter(Boolean);
      mingSay=`你的紫微命宮坐 <b>${names.join("、")}</b>，個性上${descs.join("；")}。`;
    }else{
      mingSay="你的紫微命宮無主星，個性較隨環境而變、可塑性高，要參考對宮的星。";
    }
  }
  // 神煞重點（挑最有感的吉/凶各一）
  const goodSS=a.shensha.filter(s=>/貴人|文昌|將星|天德|月德|祿/.test(s.name)).map(s=>s.name);
  const badSS=a.shensha.filter(s=>/羊刃|劫煞|空亡|亡神/.test(s.name)).map(s=>s.name);
  let ssSay="";
  if(goodSS.length) ssSay+=`命帶吉星 <b style="color:#15803d">${goodSS.join("、")}</b>，這是你的助力。`;
  if(badSS.length) ssSay+=`也有 <b style="color:#b91c1c">${badSS.join("、")}</b> 要留意，凡事多一分謹慎。`;
  // 今年運
  const nowY=new Date().getFullYear();
  const ln=calcLiuNian(a.bz.solar.y,nowY,1,a.yong.primary,a.bz.dGan)[0];
  const yearSay=ln?`<b>今年（${nowY}）</b>對你是「<b style="color:${ln.tier==='旺'?'#15803d':ln.tier==='弱'?'#b91c1c':'#b45309'}">${ln.tier==='旺'?'順遂得力':ln.tier==='弱'?'較費力、宜守':'平穩待時'}</b>」之年，走 ${ln.ganGod}運（${godShort?godShort(ln.ganGod):""}）。`:"";

  return `<div class="card full sum-card">
    <h3><span class="ic" style="background:#fef3c7;color:#b45309">解</span>一段話讀懂${name}的命
      <span style="margin-left:auto;font-size:11.5px;font-weight:400;color:var(--sub)">下面用白話幫你把整張命盤的重點講完，看這段就好</span></h3>
    <div class="sum-body">
      <p><span class="sum-tag">你是誰</span>${name}是 <b>${a.sex}・屬${a.sx.sx}・${a.sign}座</b>。八字日主${str}（${strSay}）。命格屬 <b>${pat.name}</b>——${patP.say||pat.desc}</p>
      ${mingSay?`<p><span class="sum-tag">個性</span>${mingSay}</p>`:""}
      <p><span class="sum-tag">怎麼走最順</span>${patP.tip||""} 你的<b>喜用五行是 ${yong}</b>${avoid?`、忌神是 ${avoid}`:""}。多親近喜用——例如穿 ${r0.colors?colorize(r0.colors):""} 的衣物、往 <b>${r0.dir||""}</b> 發展、選 ${r0.ind?r0.ind.split("、").slice(0,3).join("、"):""} 這類領域，運勢會更順。</p>
      ${ssSay?`<p><span class="sum-tag">提醒</span>${ssSay}</p>`:""}
      ${yearSay?`<p><span class="sum-tag">今年運勢</span>${yearSay}逐年細節見「大運流年」分頁。</p>`:""}
      <p class="sum-foot">想深入了解某一塊，再點上方各分頁；命理是參考，路還是自己走出來的。</p>
    </div>
  </div>`;
}

export function renderDashboard(a,overall,luck){
  const nowY=new Date().getFullYear();
  const ln=calcLiuNian(a.bz.solar.y,nowY,9,a.yong.primary,a.bz.dGan);
  const lnRows=ln.map(L=>`<div class="ln-row" style="padding:5px 0">
    <span class="yr" style="width:60px">${L.year}</span>
    <span class="gz">${wxSpan(L.gz[0])}${L.gz[1]}</span>
    <span class="badge ${L.tier==='旺'?'good':L.tier==='弱'?'bad':'mid'}">${L.tier}</span>
    <span class="g">${L.ganGod}</span></div>`).join("");
  // 神煞精簡
  const ssShort=a.shensha.length
    ? a.shensha.map(s=>`<span class="badge ${/貴人|文昌|將星|天德|月德|祿/.test(s.name)?'good':/羊刃|劫煞|空亡|亡神/.test(s.name)?'bad':'gray'}" title="${s.desc}">${s.name}</span>`).join(" ")
    : '<span style="color:#94a3b8">命中無明顯神煞</span>';
  // 紫微命宮+三方（總覽只放重點）
  const zwBlock = a.ziwei ? (()=>{
    const ming=a.ziwei.palaces.find(p=>p.name==="命宮");
    const guan=a.ziwei.palaces.find(p=>p.name==="官祿");
    const cai=a.ziwei.palaces.find(p=>p.name==="財帛");
    const fu=a.ziwei.palaces.find(p=>p.name==="夫妻");
    const starsOf=p=>p&&p.majorStars.length?p.majorStars.map(s=>s.name+(s.mutagen?`<span class="badge ${s.mutagen==='祿'?'good':s.mutagen==='忌'?'bad':'blue'}" style="padding:0 5px">化${s.mutagen}</span>`:"")).join("、"):'<span style="color:#94a3b8">借對宮</span>';
    return `<div style="font-size:12px;color:var(--sub);margin-bottom:8px;line-height:1.7">命主 <b>${a.ziwei.soul}</b>（先天主導你的星）・身主 <b>${a.ziwei.body}</b>（後天養成你的星）・<b>${a.ziwei.fiveElementsClass}</b>（決定大運幾歲起運）</div>
      <div class="kv"><span class="k">命宮</span><span class="v">${starsOf(ming)}</span></div>
      <div class="kv"><span class="k">官祿(事業)</span><span class="v">${starsOf(guan)}</span></div>
      <div class="kv"><span class="k">財帛(財運)</span><span class="v">${starsOf(cai)}</span></div>
      <div class="kv"><span class="k">夫妻(感情)</span><span class="v">${starsOf(fu)}</span></div>
      <div style="text-align:right;margin-top:8px"><span class="rtab" style="font-size:12px;color:var(--blue-d);cursor:pointer;background:var(--blue-l);padding:4px 10px;border-radius:6px" data-p="ziwei">看完整十二宮 →</span></div>`;
  })() : `<div class="empty-tip" style="padding:14px">紫微排盤需準確出生時辰</div>`;

  return `<div class="grid g3">
    ${renderSummary(a)}
    <!-- 八字四柱（橫跨全寬，最重要） -->
    <div class="card full">
      <h3><span class="ic">柱</span>八字四柱
        <span class="rtab guide-link" data-p="bazi" style="margin-left:auto">看每格白話解釋 →</span></h3>
      ${renderBaziTable(a)}
    </div>

    <!-- 第1欄：命局綜評 + 五行能量 -->
    <div class="colstack">
      <div class="card">
        <div class="score-big" style="margin-bottom:4px">
          <div class="ring sm"><svg width="76" height="76" style="transform:rotate(-90deg)">
            <circle cx="38" cy="38" r="33" fill="none" stroke="#e2e8f0" stroke-width="6"/>
            <circle cx="38" cy="38" r="33" fill="none" stroke="#3b82f6" stroke-width="6" stroke-linecap="round"
              stroke-dasharray="${2*Math.PI*33}" stroke-dashoffset="${2*Math.PI*33*(1-overall/100)}"/></svg>
            <div class="num"><b>${overall}</b><small>綜評</small></div></div>
          <div style="flex:1">
            <div class="kv" style="padding:3px 0"><span class="k">身強弱</span><span class="v">${a.strength.strength}（${a.strength.score}）</span></div>
            <div class="kv" style="padding:3px 0"><span class="k">格局</span><span class="v">${a.pattern.patterns[0].name}</span></div>
          </div>
        </div>
        <div class="note" style="margin-top:0;font-size:12px">「<b>${a.strength.strength}</b>」＝${STRENGTH_PLAIN[a.strength.strength]||""}</div>
        <div class="kv"><span class="k">喜用神</span><span class="v">${a.yong.primary.map(w=>`<span class="badge good wx-${w}" style="background:#dcfce7">${w}</span>`).join("")}</span></div>
        <div class="kv"><span class="k">忌神</span><span class="v">${a.yong.avoid.length?a.yong.avoid.map(w=>`<span class="badge bad">${w}</span>`).join(""):'—'}</span></div>
      </div>
      <div class="card">
        <h3><span class="ic">五</span>五行能量</h3>
        ${renderWuxing(a.tally)}
        <div class="note" style="margin-top:8px">命局 <b class="wx-${a.strong}">${a.strong}</b> 旺、<b class="wx-${a.weak}">${a.weak}</b> 弱。</div>
        ${renderRemedy(a.yong.primary, a.yong.avoid)}
      </div>
    </div>

    <!-- 第2欄：十神能量 + 神煞 -->
    <div class="colstack">
      <div class="card">
        <h3><span class="ic">神</span>十神能量</h3>
        ${renderGodTally(a.godTally)}
      </div>
      <div class="card">
        <h3><span class="ic">煞</span>神煞
          <span class="rtab guide-link" data-p="shensha" style="margin-left:auto">看白話解釋 →</span></h3>
        <div style="font-size:11.5px;color:var(--sub);margin-bottom:6px"><span style="color:#15803d">綠＝吉星(加分)</span>、<span style="color:#b91c1c">紅＝凶星(注意)</span></div>
        <div style="line-height:2">${ssShort}</div>
      </div>
      ${a.chenggu?`<div class="card">
        <h3><span class="ic">秤</span>八字幾兩重</h3>
        <div style="font-size:15px;margin-bottom:4px">骨重 <b style="font-size:20px;color:var(--blue-d)">${a.chenggu.totalCN}</b></div>
        <div style="font-size:12.5px;color:var(--sub);line-height:1.7">${a.chenggu.poem[0]||""}</div>
        <div style="text-align:right;margin-top:6px"><span class="rtab" style="font-size:12px;color:var(--blue-d);cursor:pointer;background:var(--blue-l);padding:4px 10px;border-radius:6px" data-p="shensha">看完整評語 →</span></div>
      </div>`:""}
    </div>

    <!-- 第3欄：用神 + 紫微 -->
    <div class="colstack">
      <div class="card">
        <h3><span class="ic">用</span>用神喜忌
          <span class="rtab guide-link" data-p="god" style="margin-left:auto">看白話建議 →</span></h3>
        <div style="font-size:12.5px;line-height:1.8;color:#475569">喜用神 ${a.yong.primary.map(w=>`<span class="badge good wx-${w}" style="background:#dcfce7;padding:0 7px">${w}</span>`).join("")}（對你有利、多親近）；忌神 ${a.yong.avoid.length?a.yong.avoid.map(w=>`<span class="badge bad" style="padding:0 7px">${w}</span>`).join(""):"—"}（盡量避開）。</div>
      </div>
      <div class="card">
        <h3><span class="ic">紫</span>紫微（重點宮位）</h3>
        ${zwBlock}
      </div>
    </div>

    <!-- 大運（橫跨全寬）：總覽放精簡大運；逐年流年請見「大運流年」分頁 -->
    <div class="card full">
      <h3><span class="ic">運</span>大運走勢
        <span class="rtab guide-link" data-p="luck" style="margin-left:auto">看每運白話＋逐年流年 →</span></h3>
      ${renderDaYunMini(a)}
    </div>
  </div>`;
}

export function renderDayGan(a){
  const dg=a.bz&&a.bz.dGan; const pf=dg&&DAYGAN_PROFILE[dg];
  if(!pf) return "";
  const wx=GAN_WX[dg]||"";
  return `<div class="card"><h3><span class="ic">主</span>你的日主 · ${dg}（${pf.img}）</h3>
    <div class="cap" style="margin-bottom:10px">「日主」是你出生那天的天干，代表<b>你自己這個人</b>。下面是你日主天干 <b class="wx-${wx}">${dg}</b> 的先天性情速寫——這是你的<b>底色</b>，再搭配前面的身強弱與十神一起看。</div>
    <div class="dg-grid">
      <div class="dg-row"><span class="dg-k">個性</span><span class="dg-v">${pf.trait}</span></div>
      <div class="dg-row"><span class="dg-k">健康</span><span class="dg-v">較需留意：${pf.health}</span></div>
      <div class="dg-row"><span class="dg-k">合拍方向</span><span class="dg-v">${pf.jobs.map(j=>`<span class="dg-job">${j}</span>`).join("")}</span></div>
    </div>
    <div class="cap" style="margin-top:9px;color:#94a3b8">※ 這是日主天干的「通性」，實際還要看整張命盤的強弱、調候與大運，不是單看一個字定終身。</div>
  </div>`;
}

export function renderBranchRel(a){
  const br=a.branchRel; if(!br) return "";
  const wxC={木:"#16a34a",火:"#dc2626",土:"#b45309",金:"#a16207",水:"#2563eb"};
  const zb=(z,w)=>`<span class="br-zhi wx-bullet wx-${w||ZHI_WX[z]||''}" style="width:22px;height:22px;font-size:12px">${z}</span>`;
  const sections=[];
  // 六合
  if(br.liuhe.length){
    sections.push(`<div class="brx brx-he"><div class="brx-h">🤝 六合（和諧相吸）</div>
      ${br.liuhe.map(h=>`<div class="brx-item"><div class="brx-pair">${zb(h.a)}<span class="brx-op">合</span>${zb(h.b)}${h.wx?`<span class="brx-wx" style="background:${wxC[h.wx]}">化${h.wx}</span>`:""}<span class="brx-pos">${h.posA}·${h.posB}${h.adj?" 緊貼":""}</span></div></div>`).join("")}
      <div class="brx-note">${HE_GENERAL["六合"]}</div></div>`);
  }
  // 三合
  if(br.sanhe.length){
    sections.push(`<div class="brx brx-he"><div class="brx-h">🔺 三合局（強力結合）</div>
      ${br.sanhe.map(s=>`<div class="brx-item"><div class="brx-pair">${s.zhi.map(z=>`<span class="br-zhi wx-bullet wx-${ZHI_WX[z]||''}${s.have.includes(z)?'':' faint'}" style="width:22px;height:22px;font-size:12px">${z}</span>`).join("")}<span class="brx-wx" style="background:${wxC[s.wx]}">${s.full?"合":"半合"}化${s.wx}</span></div></div>`).join("")}
      <div class="brx-note">${HE_GENERAL["三合"]}</div></div>`);
  }
  // 六沖
  if(br.chong.length){
    sections.push(`<div class="brx brx-chong"><div class="brx-h">💥 六沖（衝擊變動）</div>
      ${br.chong.map(c=>{const key=CHONG_DESC[c.a+c.b]?c.a+c.b:c.b+c.a;return `<div class="brx-item"><div class="brx-pair">${zb(c.a)}<span class="brx-op bad">沖</span>${zb(c.b)}<span class="brx-pos">${c.posA}·${c.posB}${c.adj?" 緊貼":""}</span></div><div class="brx-sub">${CHONG_DESC[key]||""}</div></div>`;}).join("")}
      <div class="brx-note">${CHONG_GENERAL}</div></div>`);
  }
  // 相刑
  if(br.xing.length){
    sections.push(`<div class="brx brx-xing"><div class="brx-h">⚔ 相刑（磨合損耗）</div>
      ${br.xing.map(x=>`<div class="brx-item"><div class="brx-pair">${x.have.map(z=>zb(z)).join('<span class="brx-op warn">刑</span>')}<span class="brx-tag">${x.name}${x.type==="三刑全"?"（全）":""}</span></div><div class="brx-sub">${x.note||""}</div></div>`).join("")}
      <div class="brx-note">${XING_GENERAL}</div></div>`);
  }
  // 六害
  if(br.hai.length){
    sections.push(`<div class="brx brx-hai"><div class="brx-h">🩹 六害（暗中損耗）</div>
      ${br.hai.map(h=>{const d=HAI_DESC[h.a+h.b]||HAI_DESC[h.b+h.a];return `<div class="brx-item">
        <div class="brx-pair">${zb(h.a)}<span class="brx-op warn">害</span>${zb(h.b)}<span class="brx-tag">${d?d.title:"相害"}</span><span class="brx-pos">${h.posA}·${h.posB}${h.adj?" 緊貼":""}</span></div>
        ${d?`<div class="brx-detail">
          <div class="brx-d-row"><b>原理</b>${d.why}</div>
          <div class="brx-d-row"><b>健康</b>${d.health}</div>
          <div class="brx-d-row"><b>性情</b>${d.mind}</div>
          <div class="brx-d-row"><b>事業</b>${d.career}</div>
          <div class="brx-d-row cure"><b>化解</b>${d.cure}</div>
        </div>`:`<div class="brx-sub">${HAI_GENERAL}</div>`}</div>`;}).join("")}
      <div class="brx-note">${HAI_GENERAL}</div></div>`);
  }
  // 天羅地網（含進階危險等級＋四要素）
  if(br.tianluo){
    const tl=br.tianluo;
    const which=tl.both?"天羅＋地網皆見":tl.tianLuo?"天羅（戌亥·天門）":"地網（辰巳·地戶）";
    const lv=tl.level||"低";
    const lvColor={高:"#dc2626",中:"#d97706",低:"#16a34a"}[lv];
    const hitKeys=new Set((tl.factors||[]).map(f=>f.k));
    // 四要素逐條：命中的亮起、未中的淡顯
    const factorRows=(TIANLUO_DESC.factors||[]).map(f=>{
      const on=hitKeys.has(f.k);
      const myHit=(tl.factors||[]).find(x=>x.k===f.k);
      return `<div class="tl-factor${on?' on':''}">
        <div class="tl-f-h"><span class="tl-f-dot">${on?'●':'○'}</span><b>${f.k}</b>${on&&myHit?`<span class="tl-f-hit">${myHit.v}</span>`:'<span class="tl-f-no">未觸發</span>'}</div>
        <div class="tl-f-d">${f.d}</div></div>`;
    }).join("");
    sections.push(`<div class="brx brx-tl"><div class="brx-h">🕸 天羅地網（束縛／戒律）
        <span class="tl-level" style="background:${lvColor}">凶性 ${lv}</span></div>
      <div class="brx-item"><div class="brx-pair">${tl.have.map(z=>zb(z)).join("")}<span class="brx-tag">${which}</span>${tl.adjNet?'<span class="brx-pos">緊貼成網</span>':'<span class="brx-pos">隔位·網較鬆</span>'}</div>
      <div class="tl-verdict" style="border-color:${lvColor}">${(TIANLUO_DESC.levelSay||{})[lv]||""}</div>
      <div class="brx-detail">
        <div class="brx-d-row">${TIANLUO_DESC.intro}</div>
        <div class="brx-d-row"><b>常人</b>${TIANLUO_DESC.common}</div>
        <div class="brx-d-row"><b>修行</b>${TIANLUO_DESC.spirit}</div>
      </div>
      <div class="tl-factors-title">📐 應驗核心四要素（命中越多越凶 — 你中了 <b style="color:${lvColor}">${(tl.factors||[]).length}</b> 項）</div>
      <div class="tl-factors">${factorRows}</div>
      <div class="brx-detail" style="margin-top:9px">
        <div class="brx-d-row"><b>關鍵</b>${TIANLUO_DESC.key}</div>
        <div class="brx-d-row cure"><b>化解</b>${TIANLUO_DESC.cure}</div>
      </div></div></div>`);
  }
  if(!sections.length){
    return `<div class="card full"><h3><span class="ic">支</span>地支互動</h3>
      <div class="empty-tip">你的四柱地支之間沒有明顯的合、沖、刑、害——代表地支結構較<b>單純安定</b>，不是壞事。</div></div>`;
  }
  return `<div class="card full"><h3><span class="ic">支</span>地支互動（合・沖・刑・害）</h3>
    <div class="cap" style="margin-bottom:12px">地支之間會彼此「<b>合</b>（結合）、<b>沖</b>（衝擊）、<b>刑</b>（磨合）、<b>害</b>（暗耗）」，這些是八字裡很重要、卻常被簡化帶過的環節。下面列出你命中<b>實際出現</b>的地支關係——吉凶仍要配合喜用神與整體格局看，這裡先讓你讀懂原理。</div>
    <div class="brx-grid">${sections.join("")}</div>
  </div>`;
}

export function renderHealth(a){
  const t=a.tally; const avoid=new Set(a.yong.avoid||[]);
  const vals=Object.values(t); const avg=vals.reduce((x,y)=>x+y,0)/5;
  // 找出偏弱(<平均*0.55 或最弱)與偏旺(>平均*1.6)的五行
  const items=["木","火","土","金","水"].map(w=>({w,v:t[w]}));
  const weakOnes=items.filter(i=>i.v<avg*0.6).sort((x,y)=>x.v-y.v);
  const overOnes=items.filter(i=>i.v>avg*1.7).sort((x,y)=>y.v-x.v);
  const rows=[];
  weakOnes.slice(0,2).forEach(i=>{const h=WX_HEALTH[i.w];rows.push({w:i.w,kind:"偏弱",say:h.weak,organ:h.organ,tip:h.tip});});
  overOnes.slice(0,2).forEach(i=>{const h=WX_HEALTH[i.w];rows.push({w:i.w,kind:"偏旺",say:h.over,organ:h.organ,tip:h.tip});});
  // 忌神對應的器官也提醒（行運踩到忌神時較易出狀況）
  const avoidWx=[...avoid].filter(w=>WX_HEALTH[w]&&!rows.some(r=>r.w===w));
  const body=rows.length?rows.map(r=>`<div class="hl-row">
      <div class="hl-head"><span class="hl-wx wx-${r.w}">${r.w}</span><span class="badge ${r.kind==='偏弱'?'mid':'bad'}">${r.kind}</span><span class="hl-organ">${r.organ}</span></div>
      <div class="hl-say">${r.say}</div>
      <div class="hl-tip">💡 ${r.tip}</div>
    </div>`).join("")
    : `<div class="hl-row"><div class="hl-say">你的五行算是平衡，沒有特別突出的弱項，整體體質尚穩——維持規律作息即可。</div></div>`;
  // 算出未來幾個「忌神年份」具體是哪幾年（流年天干或地支五行踩到忌神）
  const allAvoid=new Set(a.yong.avoid||[]);
  let avoidLine="";
  if(allAvoid.size){
    const nowY=new Date().getFullYear();
    const years=[];
    for(let yr=nowY; yr<nowY+12 && years.length<5; yr++){
      const g=GAN[((yr-4)%10+10)%10], z=ZHI[((yr-4)%12+12)%12];
      const wxs=[...new Set([GAN_WX[g],ZHI_WX[z]])].filter(w=>allAvoid.has(w));
      if(wxs.length){
        const organs=[...new Set(wxs.map(w=>WX_HEALTH[w].organ.split("、").slice(0,2).join("、")))].join("；");
        years.push(`<div class="hl-yr"><span class="hl-yr-y">${yr} ${g}${z}</span><span class="hl-yr-wx">${wxs.join("、")}年</span><span class="hl-yr-org">留意 ${organs}</span></div>`);
      }
    }
    avoidLine=`<div class="hl-avoid">
      <div style="font-weight:600;color:#b45309;margin-bottom:5px">⚠ 你的忌神是 ${[...allAvoid].join("、")}，當流年（每一年）的五行踩到忌神時，那些對應部位較需注意。近年的忌神年份：</div>
      ${years.length?years.join(""):"<div style=\"color:#94a3b8\">近 12 年內無明顯忌神年。</div>"}
      <div style="font-size:11px;color:#b6c0cf;margin-top:6px">＊「水年/火年」就是該年干支五行屬水或火的年份，不是壞年，只是這方面多保養。</div>
    </div>`;
  }
  return `<div class="card"><h3><span class="ic" style="background:#dcfce7;color:#15803d">疾</span>健康提醒（八字疾厄）</h3>
    <div class="cap" style="margin-bottom:10px">八字五行對應身體臟腑（<b>木→肝膽、火→心血管、土→脾胃、金→肺與呼吸道、水→腎與泌尿</b>）。某五行<b>太弱或太旺</b>，對應部位就比較需要照顧。這是體質傾向參考，<b>不是診斷，身體不適請就醫</b>。</div>
    ${body}${avoidLine}</div>`;
}

export function renderSign(a){
  const d=SIGN_DETAIL[a.sign]||{};
  const ELEM_TIP={火象:"火象＝熱情、衝勁、行動派",土象:"土象＝務實、穩重、重物質",風象:"風象＝理性、善溝通、重思想",水象:"水象＝感性、直覺、重感情"};
  const MODE_TIP={開創:"開創＝主動發起、喜歡帶頭開始",固定:"固定＝穩定執著、認定就堅持",變動:"變動＝靈活善變、適應力強"};
  const rising=a.rising?`<span class="kv2"><span class="k2">上升（近似）</span><b title="上升星座＝別人對你的第一印象、外在形象，跟太陽星座不同">${a.rising}座 ⓘ</b></span>`:"";
  const tags=[
    d.element&&`<span class="badge gray gz-tip" style="font-size:11px" title="${ELEM_TIP[d.element]||d.element}">${d.element} ⓘ</span>`,
    d.mode&&`<span class="badge gray gz-tip" style="font-size:11px" title="${MODE_TIP[d.mode]||d.mode}">${d.mode}星座 ⓘ</span>`,
    d.ruler&&`<span class="badge gray gz-tip" style="font-size:11px" title="守護星＝主宰這個星座的行星，影響你的核心特質">守護星 ${d.ruler} ⓘ</span>`
  ].filter(Boolean).join("");
  return `<div class="card"><h3><span class="ic">星</span>星座</h3>
    <div class="cap" style="margin-bottom:8px">每個星座由<b>元素（火土風水）＋性質（開創/固定/變動）</b>決定基本性格。<b>太陽星座</b>＝你的核心個性；<b>上升星座</b>＝外人對你的第一印象。（標 ⓘ 的滑過/長按看說明）</div>
    <div class="sign-head">
      <span class="sign-name">${a.sign}座</span>
      <span class="sign-date">${d.date||""}</span>${rising}
    </div>
    <div style="margin:6px 0 10px">${tags}</div>
    <div class="note" style="margin-bottom:10px">${SIGN_TRAIT[a.sign]||""}</div>
    <div class="detail-block">
      ${d.love?`<div class="db-row"><span class="db-k">💗 感情</span><span>${d.love}</span></div>`:""}
      ${d.career?`<div class="db-row"><span class="db-k">💼 事業</span><span>${d.career}</span></div>`:""}
      ${d.match?`<div class="db-row"><span class="db-k">🤝 速配</span><span>${d.match}</span></div>`:""}
      ${d.color?`<div class="db-row"><span class="db-k">🎨 幸運色</span><span>${d.color}</span></div>`:""}
      ${d.advice?`<div class="db-row"><span class="db-k">💡 提醒</span><span>${d.advice}</span></div>`:""}
    </div>
    <div class="db-foot">上升星座為近似推算，需精確出生時間與經緯度才準。</div></div>`;
}

export function renderShengXiao(a){
  const sx=a.sx, d=SX_DETAIL[sx.sx]||{};
  return `<div class="card"><h3><span class="ic">肖</span>生肖</h3>
    <div class="sign-head"><span class="sign-name">屬${sx.sx}</span></div>
    <div class="note" style="margin:8px 0 10px">${sx.trait}</div>
    <div class="detail-block">
      ${d.career?`<div class="db-row"><span class="db-k">💼 事業財運</span><span>${d.career}</span></div>`:""}
      ${d.love?`<div class="db-row"><span class="db-k">💗 感情</span><span>${d.love}</span></div>`:""}
      ${d.health?`<div class="db-row"><span class="db-k">🩺 健康</span><span>${d.health}</span></div>`:""}
      ${d.luck?`<div class="db-row"><span class="db-k">🍀 開運</span><span>${d.luck}</span></div>`:""}
      ${d.remind?`<div class="db-row"><span class="db-k">📌 提醒</span><span>${d.remind}</span></div>`:""}
    </div>
    <div class="sx-rel">
      <div class="srt">生肖配對</div>
      <div>三合（最速配・貴助）：<b class="wx-木">${sx.sanhe.join("、")}</b></div>
      <div>六合（貼心貴人）：<b class="wx-木">${sx.liuhe}</b></div>
      <div>六沖（最不合，多包容）：<b style="color:var(--bad)">${sx.chong}</b></div>
      <div>相害／相刑（易暗耗摩擦）：<b style="color:#b45309">${sx.hai}</b>／<b style="color:#b45309">${sx.xing.join("、")}</b></div>
    </div></div>`;
}

export let CUR_A=null;  // 目前單人命盤 analysis（供紫微流年盤年份切換重算）

export function renderSingle(a){
  CUR_A=a;
  const luck=renderLuck(a);
  const overall=computeOverall(a);
  const tabs=[
    ["命盤總覽","overview"],["八字四柱","bazi"],["十神用神","god"],
    ["紫微斗數","ziwei"],["大運流年","luck"],["神煞格局","shensha"],["姓名星座","name"]
  ];
  const html=`
   <div class="tabbar-row">
   <div class="result-tabs">${tabs.map((t,i)=>`<button class="rtab ${i===0?'on':''}" data-p="${t[1]}">${t[0]}</button>`).join("")}</div>

   <div class="summary-bar">
     <span class="sb-name">${a.name||"命主"}</span>
     <span class="sb-sep">${a.sex}・屬${a.sx.sx}・${a.sign}座${a.rising?`・${a.rising}升`:""}</span>
     <span class="sb-pill">日主 <b class="wx-${a.strength.dayWx}">${a.bz.dGan}（${a.strength.dayWx}）</b></span>
     <span class="sb-pill">${a.strength.strength}</span>
     <span class="sb-pill">${a.pattern.patterns[0].name}</span>
     <span class="sb-pill">喜用 ${a.yong.primary.map(w=>`<b class="wx-${w}">${w}</b>`).join("")}</span>
     <span class="sb-pill">忌 ${a.yong.avoid.length?a.yong.avoid.map(w=>`<b class="wx-${w}">${w}</b>`).join(""):'<span style="color:#94a3b8">無</span>'}</span>
   </div>
   </div>

   <div class="panel on" data-panel="overview">
     ${renderDashboard(a,overall,luck)}
   </div>

   <div class="panel" data-panel="bazi"><div class="stack">
     <div class="card"><h3><span class="ic">柱</span>四柱排盤
       <span style="margin-left:auto;font-size:11.5px;font-weight:400;color:var(--sub)">每柱含天干十神、地支藏干十神、十二長生、納音</span></h3>${renderBaziTable(a,true)}</div>
     ${renderDayGan(a)}
     <div class="card"><h3><span class="ic">五</span>五行能量・性格・調補</h3>
       <div class="wx-energy-layout">
         <div class="wx-energy-left">${renderWuxing(a.tally,true)}
           <div class="note" style="margin-top:8px">命局 <b class="wx-${a.strong}">${a.strong}</b> 旺、<b class="wx-${a.weak}">${a.weak}</b> 弱。</div></div>
         <div class="wx-energy-right">${renderRemedy(a.yong.primary, a.yong.avoid)}</div>
       </div>
       ${renderWuxingRelation(a,true)}
     </div>
     ${renderBranchRel(a)}
     <div class="sec-2col">
       <div class="card"><h3><span class="ic">納</span>四柱納音</h3>
         <div class="cap" style="margin-bottom:10px">納音＝用六十甲子配出的<b>另一套五行象徵</b>（如海中金、爐中火），是每一柱的「別名／質地」，傳統用來補充看個性與緣分，屬趣味參考。</div>
         ${[["年柱",a.bz.nayin.year],["月柱",a.bz.nayin.month],["日柱",a.bz.nayin.day],...(a.bz.nayin.hour?[["時柱",a.bz.nayin.hour]]:[])].map(([k,v])=>`
           <div class="ny-row" data-nayin="${v}"><div class="ny-top"><span class="k">${k}</span><span class="v">${v}</span></div>
             <div class="ny-say">${NAYIN_PLAIN[v]||""}</div>${NAYIN_TREND[v]?`<div class="ny-trend">📌 傾向：${NAYIN_TREND[v]}</div>`:""}</div>`).join("")}</div>
       ${renderHealth(a)}
     </div>
   </div></div>

   <div class="panel" data-panel="god"><div class="grid g2">
     <div class="card full"><h3><span class="ic">身</span>身強弱判定</h3>${renderStrength(a.strength)}</div>
     <div class="card"><h3><span class="ic">用</span>用神・喜忌</h3>${renderYong(a.yong)}</div>
     <div class="card"><h3><span class="ic">神</span>十神能量分布</h3>${renderGodTally(a.godTally,true)}</div>
     <div class="card full"><h3><span class="ic">財</span>十神 × 賺錢方式</h3>${renderGodMoney(a)}</div>
     ${renderGodWealth(a)}
   </div></div>

   <div class="panel" data-panel="ziwei">${renderZiwei(a)}</div>

   <div class="panel" data-panel="luck">${luck.html}</div>

   <div class="panel" data-panel="shensha">
     ${renderChengGu(a.chenggu)}
     <div class="grid g2" style="align-items:start">
     <div class="card"><h3><span class="ic">煞</span>神煞</h3>
       <div class="cap">命盤中的吉神與凶煞，標示其所在柱位。</div>${renderShensha(a.shensha)}</div>
     <div class="card"><h3><span class="ic">格</span>格局</h3>
       <div class="cap">以月令取格，判斷命局結構與取用方向。</div>${renderPattern(a.pattern)}</div>
   </div></div>

   <div class="panel" data-panel="name"><div class="grid g3">
     ${a.nameInfo?renderName(a):`<div class="card"><div class="empty-tip">未輸入姓名。可回上方填入姓名以分析五格三才。</div></div>`}
     ${renderSign(a)}
     ${renderShengXiao(a)}
   </div></div>`;
  return {html, luck};
}

export function renderName(a){
  const n=a.nameInfo;
  return `<div class="card"><h3><span class="ic">名</span>姓名五格剖象</h3>
    <div class="cap" style="margin-bottom:8px">把名字每個字的<b>康熙字典筆畫</b>，依規則組成<b>五格</b>（天/人/地/外/總），再用傳統姓名學的<b>81 數理</b>判斷每格<span class="badge good" style="font-size:10px">大吉</span><span class="badge mid" style="font-size:10px">半吉</span><span class="badge bad" style="font-size:10px">凶</span>。</div>
    ${n.hasEstimate?'<div class="cap" style="color:#d97706">⚠ 部分用字筆畫未收錄，以估算值計算，僅供參考。</div>':''}
    <div style="margin:8px 0">${n.chars.map(c=>`<span class="badge gray">${c.c} ${c.n}畫</span>`).join("")} 　總 ${n.total} 畫</div>
    ${n.grids.map(g=>`<div class="kv"><span class="k">${g.name} <span style="font-size:11px;color:#94a3b8">${g.meaning}</span></span>
      <span class="v">${g.num}（${g.wx}）<span class="badge ${g.luck===3?'good':g.luck===1?'bad':'mid'}">${luckText(g.luck)}</span></span></div>`).join("")}
    <div class="note" style="margin-top:12px">三才配置 <b>${n.sancai.wx.join("－")}</b>
      <span class="badge ${n.sancai.luck==='吉'?'good':n.sancai.luck==='凶'?'bad':'mid'}">${n.sancai.luck}</span>
      <span style="font-size:11px;color:#94a3b8">（三才＝天格‧人格‧地格三者的五行生剋，看名字的基礎吉凶）</span><br>${n.sancai.desc}</div>
    ${renderNameAdvice(n, a.yong&&a.yong.primary, a.sx&&a.sx.sx)}</div>`;
}

export function sxNamingBlock(sx){
  const d=SX_NAMING[sx]; if(!d) return "";
  return `<div class="na-sx">
    <div class="na-sx-t">🐾 屬${sx} 取名宜忌（傳統姓名學）</div>
    <div class="na-sx-r"><span class="na-sx-k good">宜用</span>部首 <b>${d.like.join(" ")}</b>　<span style="color:#94a3b8">（${d.likeWhy}）</span></div>
    <div class="na-sx-r"><span class="na-sx-k bad">忌用</span>部首 <b>${d.avoid.join(" ")}</b>　<span style="color:#94a3b8">（${d.avoidWhy}）</span></div>
    <div class="na-sx-r">宜用字例：<span class="na-egs">${d.eg.join("、")}</span></div>
  </div>`;
}

export function renderNameAdvice(n, favorWx, sx){
  let adv=[];
  try{ adv=nameSuggest(n.chars,n.grids,favorWx); }catch(e){ adv=[]; }
  const sxBlock=sxNamingBlock(sx);
  if(!adv.length) return `<div class="na-ok">✓ 五格沒有明顯凶數，姓名整體穩定，不需特別改名。</div>${sxBlock}`;
  const favor=new Set(favorWx||[]);
  const favorNote=favor.size?`<div class="na-fav">⭐ 標記者＝筆畫五行剛好補你的喜用神（${[...favor].join("、")}），優先考慮這些。</div>`:"";
  const rows=adv.map(g=>{
    if(g.fixable===false){
      return `<div class="na-row"><div class="na-head"><span class="badge bad">${g.grid} 凶</span></div>
        <div class="na-say">${g.note}</div></div>`;
    }
    const cands=g.cands.map(c=>{
      const egs=charsByStroke(c.stroke).slice(0,6);
      const fav=c.wx&&favor.has(c.wx);
      return `<div class="na-cand">${fav?'⭐ ':''}改成 <b>${c.stroke} 畫</b>（${g.grid}→${c.grid}，吉${c.wx?`・五行屬${c.wx}${fav?'，補喜用':''}`:''}）${egs.length?`：例如 <span class="na-egs">${egs.join("、")}</span>`:"（此筆畫無範例字，可請命名老師選）"}</div>`;
    }).join("");
    return `<div class="na-row"><div class="na-head"><span class="badge bad">${g.grid} 凶</span>
        <span class="na-who">建議改「${g.who}」（目前 ${g.curStroke} 畫）</span></div>
      ${cands}</div>`;
  }).join("");
  return `<div class="na-box">
    <div class="na-title">✍ 改名建議（針對凶數）</div>
    <div class="na-intro">姓名五格中，<b>天格＝姓</b>（不能改），<b>人格／地格／外格／總格</b>都跟「名字的字」有關。某格是<b style="color:#b91c1c">凶</b>時，把對應的字換成下面建議的筆畫，那一格就會轉吉。筆畫以康熙字典為準，<b>實際取名請再確認字義與讀音</b>。</div>
    ${favorNote}${rows}
    ${sxBlock}
  </div>`;
}

export function computeOverall(a){
  // 五行均衡(40) + 身強弱中和度(30) + 格局(15) + 姓名(15)
  const vals=Object.values(a.tally),mx=Math.max(...vals),mn=Math.min(...vals),sum=vals.reduce((x,y)=>x+y,0)||1;
  const balance=100-(mx-mn)/sum*60;
  const mid=100-Math.abs(a.strength.score)/16*55;  // 越接近中和越高
  const patScore=a.pattern.patterns[0].type==="正格"?80:a.pattern.patterns[0].type==="特殊"?75:65;
  const nameScore=a.nameInfo?a.nameInfo.score:70;
  return Math.max(50,Math.min(98,Math.round(balance*0.4+mid*0.3+patScore*0.15+nameScore*0.15)));
}

export function renderPersonDigest(a){
  const dy=calcDaYun(a.bz,a.sex);const nowY=new Date().getFullYear();
  annotateDaYun(dy,a.yong.primary,nowY,a.bz.solar.y);
  const tl=dy.list.map(p=>`<div class="ty ${p.active?'active':''}">
    <div class="gz">${wxSpan(p.gz[0])}${p.gz[1]}</div><div class="g">${p.ganGod}</div>
    <div class="age">${p.startAge}-${p.endAge}歲</div><div class="tier tier-${p.tier}">${p.tier}</div></div>`).join("");
  return `<div class="card">
      <div style="font-size:17px;font-weight:700;margin-bottom:4px">${a.name||"此人"}
        <span style="font-size:13px;color:var(--sub);font-weight:400">${a.sex}・屬${a.sx.sx}・${a.sign}座</span></div>
      <div style="font-size:13px;color:var(--sub)">日主 <b class="wx-${a.strength.dayWx}">${a.bz.dGan}（${a.strength.dayWx}）</b>・${a.strength.strength}・${a.pattern.patterns[0].name}・喜用 ${a.yong.primary.map(w=>`<span class="badge good wx-${w}" style="background:#dcfce7">${w}</span>`).join("")}</div>
    </div>
    <div class="card"><h3><span class="ic">柱</span>八字四柱</h3>${renderBaziTable(a)}</div>
    <div class="card"><h3><span class="ic">五</span>五行能量</h3>${renderWuxing(a.tally)}</div>
    <div class="card"><h3><span class="ic">用</span>用神喜忌</h3>${renderYong(a.yong)}</div>
    <div class="card"><h3><span class="ic">煞</span>神煞</h3>${renderShensha(a.shensha)}</div>
    <div class="card"><h3><span class="ic">運</span>大運</h3><div class="cap">${dy.dir}・${dy.startDesc}</div><div class="timeline">${tl}</div></div>`;
}

export function renderCouple(A,B){
  const c=coupleAnalysis(A,B);
  const nameA=A.name||"本人",nameB=B.name||"對方";
  return `<div class="result-tabs"><button class="rtab on" data-p="cp">合盤總覽</button>
    <button class="rtab" data-p="cpA">${nameA}命盤</button><button class="rtab" data-p="cpB">${nameB}命盤</button></div>
    <div class="panel on" data-panel="cp">
      <div class="card">
        <div class="score-big">
          <div class="ring"><svg width="96" height="96" style="transform:rotate(-90deg)">
            <circle cx="48" cy="48" r="42" fill="none" stroke="#e2e8f0" stroke-width="7"/>
            <circle cx="48" cy="48" r="42" fill="none" stroke="#ec4899" stroke-width="7" stroke-linecap="round"
              stroke-dasharray="${2*Math.PI*42}" stroke-dashoffset="${2*Math.PI*42*(1-c.overall/100)}"/></svg>
            <div class="num"><b style="color:#db2777">${c.overall}</b><small>契合度</small></div></div>
          <div style="flex:1">
            <div style="font-size:20px;font-weight:700">${c.grade.label}</div>
            <div style="font-size:13px;color:var(--sub);margin-top:4px">${c.grade.hint}</div>
            <div style="margin-top:8px;font-size:13px">${nameA}（${A.bz.dGan}日・屬${A.sx.sx}） × ${nameB}（${B.bz.dGan}日・屬${B.sx.sx}）</div>
          </div></div></div>
      <div class="card"><h3><span class="ic">析</span>契合分項</h3>
        ${[["日主關係",c.breakdown.day],["生肖合沖",c.breakdown.sx],["五行互補",c.breakdown.complement],["用神互助",c.breakdown.yong]].map(([k,v])=>
          `<div style="margin:8px 0"><div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:3px"><span>${k}</span><span style="font-weight:600">${v}</span></div>
           <div class="bar"><i style="width:${v}%;background:#ec4899"></i></div></div>`).join("")}</div>
      <div class="card"><h3><span class="ic">緣</span>關係解讀</h3>
        <div class="kv"><span class="k">日主關係</span><span class="v">${c.dayRel.type}</span></div>
        <div class="note" style="margin:6px 0 12px">${c.dayRel.desc}</div>
        <div class="kv"><span class="k">生肖關係</span><span class="v">${c.sxRel.type}</span></div>
        <div class="note" style="margin:6px 0 12px">${c.sxRel.desc}</div>
        <div style="font-size:13.5px;line-height:1.9;margin-top:8px">
          <div>◆ 在你眼中，${c.shishen.aDesc}</div>
          <div style="margin-top:6px">◆ 在對方眼中，${c.shishen.bDesc}</div></div></div>
      <div class="card"><h3><span class="ic">議</span>相處建議</h3>
        <div class="note">${c.comp.desc}<br><br>${c.yong.desc}<br><br><b>重點提醒：</b>${c.advice.join("；")}。</div></div>
    </div>
    <div class="panel" data-panel="cpA">${renderPersonDigest(A)}</div>
    <div class="panel" data-panel="cpB">${renderPersonDigest(B)}</div>`;
}

export function bindTabs(luckCtx){
  $$(".rtab").forEach(t=>t.addEventListener("click",()=>{
    $$(".rtab").forEach(x=>x.classList.remove("on"));t.classList.add("on");
    $$(".panel").forEach(p=>p.classList.toggle("on",p.dataset.panel===t.dataset.p));
    window.scrollTo({top:0,behavior:"smooth"});
  }));
  bindZiweiPopover();
  bindChangSheng();
  bindZiweiHoroYears();
  const lyBox=$("#liuyueBox");
  if(lyBox && luckCtx){
    lyBox.addEventListener("click",()=>{
      const det=$("#liuyueDetail");
      if(det.dataset.open){det.innerHTML="";det.dataset.open="";lyBox.innerHTML=lyBox.innerHTML.replace("▾","▸");return;}
      const ly=calcLiuYue(luckCtx.nowY,luckCtx.A.yong.primary,luckCtx.A.bz.dGan);
      det.innerHTML=ly.map(M=>`<div class="ln-row"><span class="yr">${M.monthName}</span>
        <span class="gz">${wxSpan(M.gz[0])}${M.gz[1]}</span>
        <span class="badge ${M.tier==='旺'?'good':M.tier==='弱'?'bad':'mid'}">${M.tier}</span>
        <span class="g">${M.ganGod}</span></div>`).join("");
      det.dataset.open="1";lyBox.innerHTML=lyBox.innerHTML.replace("▸","▾");
    });
  }
}

export function bindZiweiHoroYears(){
  const host=$("#zwHoro"); if(!host||!CUR_A||!CUR_A._ziweiAstro) return;
  host.addEventListener("click",e=>{
    const btn=e.target.closest(".hs-yr"); if(!btn) return;
    const y=parseInt(btn.dataset.hy,10); if(!y) return;
    try{
      // 以該年「年中(7/1)」重算運限，UI 年份切換用
      const dateStr=y+"-7-1";
      CUR_A.ziweiHoro=buildHoroscope(CUR_A._ziweiAstro, dateStr, 6);
      const fresh=renderZiweiHoro(CUR_A);
      const tmp=document.createElement("div"); tmp.innerHTML=fresh;
      const next=tmp.firstElementChild;
      if(next){ host.replaceWith(next); bindZiweiHoroYears(); }
    }catch(err){ /* 安靜失敗，保留原盤 */ }
  });
}

export function bindChangSheng(){
  // 點術語 → 在「原地」彈出小框解釋，不再滾動到別處（避免跑上跑下）
  let pop=$("#termPop");
  if(!pop){ pop=document.createElement("div"); pop.id="termPop"; pop.className="term-pop"; pop.hidden=true; document.body.appendChild(pop); }
  const show=(el,term,text)=>{
    if(!text){ return; }
    pop.innerHTML=`<b>${term}</b>${text}`;
    pop.hidden=false;
    const r=el.getBoundingClientRect();
    const pw=Math.min(280, window.innerWidth-24);
    pop.style.width=pw+"px";
    let left=r.left+window.scrollX; if(left+pw>window.scrollX+window.innerWidth-12) left=window.scrollX+window.innerWidth-pw-12;
    pop.style.left=Math.max(12,left)+"px";
    pop.style.top=(r.bottom+window.scrollY+6)+"px";
  };
  const close=()=>{ pop.hidden=true; };
  document.addEventListener("click",e=>{ if(!e.target.closest(".cs-click,.god-click,.ny-click,.star-click,.mstar-click,#termPop")) close(); });
  const plain=t=>(t||"").replace(/^像/,"");
  $$(".cs-click").forEach(el=>el.addEventListener("click",ev=>{ev.stopPropagation();show(el,el.dataset.cs,plain(GLOSSARY[el.dataset.cs]||""));}));
  $$(".god-click").forEach(el=>el.addEventListener("click",ev=>{ev.stopPropagation();show(el,el.dataset.god,GLOSSARY[el.dataset.god]||"");}));
  $$(".ny-click").forEach(el=>el.addEventListener("click",ev=>{ev.stopPropagation();show(el,el.dataset.nayin,(NAYIN_PLAIN[el.dataset.nayin]||"")+(NAYIN_TREND[el.dataset.nayin]?"　傾向："+NAYIN_TREND[el.dataset.nayin]:""));}));
  $$(".star-click").forEach(el=>el.addEventListener("click",ev=>{ev.stopPropagation();show(el,el.dataset.star,GLOSSARY[el.dataset.star]||"");}));
  $$(".mstar-click").forEach(el=>el.addEventListener("click",ev=>{ev.stopPropagation();show(el,el.dataset.mstar,GLOSSARY[el.dataset.mstar]||"");}));
}

export function bindZiweiPopover(){
  const grid=$(".ziwei-grid"); const pop=$("#zwPop"); const svg=$("#zwLines");
  if(!grid||!pop) return;
  const wrap=$(".ziwei-wrap");
  const cellOf=b=>grid.querySelector(`.zw-cell[data-branch="${b}"]`);
  const centerOf=(cell,wr)=>{const cr=cell.getBoundingClientRect();
    return {x:cr.left-wr.left+cr.width/2, y:cr.top-wr.top+cr.height/2};};
  const clearLines=()=>{ if(svg) svg.innerHTML=""; };
  const clearHi=()=>grid.querySelectorAll(".zw-cell.active,.zw-cell.sfsz").forEach(c=>c.classList.remove("active","sfsz"));
  const close=()=>{ pop.hidden=true; clearHi(); clearLines(); };
  // 畫三方四正連線
  const drawLines=(srcCell)=>{
    if(!svg) return;
    const b=srcCell.dataset.branch; if(!b) return;
    const wr=wrap.getBoundingClientRect();
    svg.setAttribute("width",wr.width); svg.setAttribute("height",wr.height);
    svg.setAttribute("viewBox",`0 0 ${wr.width} ${wr.height}`);
    const targets=[ZW_CHONG[b],...(ZW_SANHE[b]||[])].filter(Boolean);
    const src=centerOf(srcCell,wr);
    let html="";
    targets.forEach(tb=>{
      const tc=cellOf(tb); if(!tc) return;
      tc.classList.add("sfsz");
      const tp=centerOf(tc,wr);
      html+=`<line x1="${src.x}" y1="${src.y}" x2="${tp.x}" y2="${tp.y}" stroke="#dc2626" stroke-width="1.6" stroke-opacity="0.7" stroke-dasharray="5 4"/>`;
    });
    svg.innerHTML=html;
  };
  grid.addEventListener("click",e=>{
    const cell=e.target.closest(".zw-cell.clickable");
    if(!cell) return;
    if(cell.classList.contains("active")){ close(); return; }
    clearHi(); clearLines();
    cell.classList.add("active");
    drawLines(cell);
    pop.innerHTML=`<div class="zw-pop-bar" id="zwBar"><span class="zw-pop-drag">⠿ 可拖曳移動</span><button class="zw-pop-x" aria-label="關閉">✕</button></div>`
      +`<div class="zw-pop-body">${decodeURIComponent(cell.dataset.detail||"")}</div>`;
    // 首次開啟：置中偏右；之後保留上次位置
    if(!pop.dataset.moved){
      const w=pop.offsetWidth||380;
      pop.style.left=Math.max(12,(window.innerWidth-w)/2)+"px";
      pop.style.top="90px";
    }
    pop.hidden=false;
    pop.querySelector(".zw-pop-body").scrollTop=0;
    pop.querySelector(".zw-pop-x").addEventListener("click",ev=>{ev.stopPropagation();close();});
  });
  // 拖曳移動（抓標題列）
  let drag=null;
  pop.addEventListener("mousedown",e=>{
    const bar=e.target.closest(".zw-pop-bar"); if(!bar||e.target.closest(".zw-pop-x")) return;
    const r=pop.getBoundingClientRect();
    drag={dx:e.clientX-r.left, dy:e.clientY-r.top};
    pop.classList.add("dragging"); e.preventDefault();
  });
  document.addEventListener("mousemove",e=>{
    if(!drag) return;
    let x=e.clientX-drag.dx, y=e.clientY-drag.dy;
    x=Math.min(Math.max(0,x),window.innerWidth-60);
    y=Math.min(Math.max(0,y),window.innerHeight-40);
    pop.style.left=x+"px"; pop.style.top=y+"px"; pop.dataset.moved="1";
  });
  document.addEventListener("mouseup",()=>{ if(drag){drag=null;pop.classList.remove("dragging");} });
  // Esc 關閉
  document.addEventListener("keydown",e=>{ if(e.key==="Escape"&&!pop.hidden) close(); });
}
