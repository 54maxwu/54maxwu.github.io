/* ============================================================
 * 天知道 · 大運流年層 (Layer 2)
 * 起運精算 / 大運十柱 / 流年 / 流月
 * ============================================================ */
import { GAN, ZHI, GAN_WX, ZHI_WX, jdeFromYMD, gatherTerms } from "./engine-calendar.js";
import { SHENG, KE, tenGod, changSheng } from "./engine-bazi.js";

/* 干支對喜用神的旺平弱（用於大運/流年吉凶） */
export function tierVsYong(gz, yongWxList){
  const gan=gz[0], zhi=gz[1];
  const ganWx=GAN_WX[gan], zhiWx=ZHI_WX[zhi];
  function rel(wx){
    // wx 對「喜用集合」的契合：是喜用本身或生喜用=正；剋喜用=負
    let best=0;
    for(const y of yongWxList){
      let v=0;
      if(wx===y) v=2;
      else if(SHENG[wx]===y) v=1;
      else if(KE[wx]===y) v=-2;
      else if(KE[y]===wx) v=-1;
      else if(SHENG[y]===wx) v=0; // 洩喜用，中性偏弱
      if(Math.abs(v)>Math.abs(best)) best=v;
    }
    return best;
  }
  const score = rel(ganWx)*2 + rel(zhiWx);
  let tier = score>=2 ? "旺" : score<=-2 ? "弱" : "平";
  return { tier, score, ganWx, zhiWx };
}

/* ============================================================
 * 起運精算
 * 順逆：陽年男 / 陰年女 → 順排；陰年男 / 陽年女 → 逆排
 * 起運歲 = 出生到「下一個節(順)/上一個節(逆)」的天數 ÷ 3
 *          (3天=1歲, 1天=4月, 1時辰=10日)
 * ============================================================ */
export function calcDaYun(bz, sex){
  const {solar} = bz;
  const y=solar.y, m=solar.m, d=solar.d;
  const hour = bz.hourKnown ? solar.hour : 12;
  const minute = bz.hourKnown ? (solar.minute||0) : 0;
  const male = !(sex==="女"||sex==="坤");
  const tz=8;
  const birthJDE = jdeFromYMD(y,m,d) + (hour + minute/60 - tz)/24.0
                   + (bz.useTrueSolar ? bz.correction : 0);

  const yangYear = (GAN.indexOf(bz.yGan) % 2 === 0); // 陽年
  const forward = (yangYear && male) || (!yangYear && !male);

  // 找最近的「節」(交節點)
  const terms = gatherTerms(y).filter(t=>true); // gatherTerms 已是「節」
  let targetJDE;
  if(forward){
    const nx=terms.find(t=>t.jde>birthJDE);
    targetJDE=nx?nx.jde:terms[terms.length-1].jde;
  }else{
    const pv=terms.filter(t=>t.jde<birthJDE);
    targetJDE=pv.length?pv[pv.length-1].jde:terms[0].jde;
  }
  const days=Math.abs(targetJDE-birthJDE);
  const startAgeFloat = days/3;
  const startYears = Math.floor(startAgeFloat);
  const remDays = (startAgeFloat - startYears)*365.25;       // 剩餘天→月日
  const startMonths = Math.floor(remDays/30.4375);
  const startDays = Math.round(remDays - startMonths*30.4375);

  // 從月柱排大運
  let gi=GAN.indexOf(bz.mGan), zi=ZHI.indexOf(bz.mZhi);
  const list=[];
  for(let s=0;s<10;s++){
    if(forward){gi=(gi+1)%10; zi=(zi+1)%12;}
    else       {gi=(gi+9)%10; zi=(zi+11)%12;}
    const ageStart = startYears + s*10;
    const gz=GAN[gi]+ZHI[zi];
    list.push({
      gz, ganGod: tenGod(bz.dGan, GAN[gi]),
      changSheng: changSheng(bz.dGan, ZHI[zi]),
      startAge: ageStart, endAge: ageStart+9,
      startYear: y+ageStart, endYear: y+ageStart+9
    });
  }

  return {
    dir: forward?"順行":"逆行",
    forward,
    startAge: startYears,
    startMonths, startDays,
    startDesc: `${startYears}歲${startMonths>0?startMonths+"個月":""}${startDays>0?startDays+"天":""}起運`,
    list
  };
}

/* 用喜用神標註大運旺衰 */
export function annotateDaYun(daYun, yongWxList, currentYear, birthYear){
  const curAge = currentYear - birthYear;
  daYun.list.forEach((p,i)=>{
    const t=tierVsYong(p.gz, yongWxList);
    p.tier=t.tier; p.tierScore=t.score;
    p.active = curAge>=p.startAge && curAge<=p.endAge;
  });
  return daYun;
}

/* ============================================================
 * 流年（逐年）
 * ============================================================ */
/* 年支 vs 日支的關係（沖／合／害／刑），影響感情與變動 */
const LN_CHONG={子:"午",午:"子",丑:"未",未:"丑",寅:"申",申:"寅",卯:"酉",酉:"卯",辰:"戌",戌:"辰",巳:"亥",亥:"巳"};
const LN_HE={子:"丑",丑:"子",寅:"亥",亥:"寅",卯:"戌",戌:"卯",辰:"酉",酉:"辰",巳:"申",申:"巳",午:"未",未:"午"};
const LN_HAI={子:"未",未:"子",丑:"午",午:"丑",寅:"巳",巳:"寅",卯:"辰",辰:"卯",申:"亥",亥:"申",酉:"戌",戌:"酉"};
export function dayBranchRel(yearZhi, dayZhi){
  if(!yearZhi||!dayZhi) return null;
  if(LN_CHONG[yearZhi]===dayZhi) return {kind:"沖",say:"今年年支沖你的日支——主動盪、變化、易有搬遷、轉職、感情或健康的轉折，宜順勢調整、別硬抗。"};
  if(LN_HE[yearZhi]===dayZhi) return {kind:"合",say:"今年年支合你的日支——主和諧、貴人、感情升溫或有合作機緣，是適合談合作、論婚嫁的一年。"};
  if(LN_HAI[yearZhi]===dayZhi) return {kind:"害",say:"今年年支與日支相害——易有暗耗、小摩擦、親近的人之間的心結，凡事多溝通、別積怨。"};
  if(yearZhi===dayZhi) return {kind:"伏吟",say:"今年年支與日支相同（伏吟）——舊事重演、原地打轉的感覺，內心較悶，宜沉澱、別急於求變。"};
  return null;
}

/* ============================================================
 * 犯太歲：流年地支（太歲）對「本命年支（生肖）」的關係
 * 值（同支，本命年）／沖（六沖）／刑（三刑・自刑）／破（六破）／害（六害）
 * 可複合（如寅年生逢巳年＝刑＋害；午年生逢午年＝值＋自刑）
 * ============================================================ */
const TS_PO={子:"酉",酉:"子",午:"卯",卯:"午",辰:"丑",丑:"辰",寅:"亥",亥:"寅",巳:"申",申:"巳",戌:"未",未:"戌"};
/* 刑：子卯互刑；寅巳申三刑；丑戌未三刑；辰午酉亥自刑 */
const TS_XING={子:["卯"],卯:["子"],寅:["巳","申"],巳:["寅","申"],申:["寅","巳"],
               丑:["戌","未"],戌:["丑","未"],未:["丑","戌"],辰:["辰"],午:["午"],酉:["酉"],亥:["亥"]};
/* 各類犯太歲的白話（自家文案）：w=嚴重度權重 */
export const TAISUI_KIND={
  值:{w:3,name:"值太歲",say:"就是俗稱的「本命年」，太歲當頭坐。這一年運勢起伏較明顯、事情變動多，情緒也容易浮動——凡事宜穩不宜急，別在這年硬做重大豪賭。"},
  沖:{w:4,name:"沖太歲",say:"沖者動也——五種裡變動感最強的一年：搬遷、轉職、感情或合作關係的重整都可能發生。變動不一定是壞事，順勢調整就是轉機，怕的是硬抗。"},
  刑:{w:2,name:"刑太歲",say:"刑者傷也——容易有口舌是非、人際摩擦或小人暗損。說話留三分、合約文件多看兩眼、少替人作保。"},
  破:{w:1,name:"破太歲",say:"破者耗也——容易破財、計畫生變的小狀況年。錢財往來保守些、重要安排多留備案，就能把「破」降到最低。"},
  害:{w:1,name:"害太歲",say:"害者阻也——易犯小人、暗中受阻，親近的人之間也容易生心結。少涉入他人紛爭、多當面溝通。"},
};
export function taiSuiRel(taisuiZhi, birthZhi){
  if(!taisuiZhi||!birthZhi) return null;
  const kinds=[];
  if(birthZhi===taisuiZhi) kinds.push("值");
  if(LN_CHONG[taisuiZhi]===birthZhi) kinds.push("沖");
  if((TS_XING[taisuiZhi]||[]).includes(birthZhi)) kinds.push("刑");
  if(TS_PO[taisuiZhi]===birthZhi) kinds.push("破");
  if(LN_HAI[taisuiZhi]===birthZhi) kinds.push("害");
  if(!kinds.length) return null;
  const selfXing = kinds.includes("值")&&kinds.includes("刑");   // 辰午酉亥：本命年兼自刑
  const label = selfXing ? "值太歲（兼自刑）" : kinds.map(k=>TAISUI_KIND[k].name).join("＋");
  const maxW = Math.max(...kinds.map(k=>TAISUI_KIND[k].w));
  const level = (maxW>=3||kinds.length>=2) ? "重" : maxW>=2 ? "中" : "輕";
  const say = selfXing
    ? TAISUI_KIND.值.say+" 又逢「自刑」——這年最大的敵人是自己：容易鑽牛角尖、情緒內耗，記得對自己寬容些。"
    : kinds.map(k=>TAISUI_KIND[k].say).join(" ");
  return { kinds, label, level, say };
}
/* 安太歲白話（給 UI 共用一句） */
export const TAISUI_ADVICE="傳統習俗上可在年初到廟裡「安太歲」、點光明燈，求個心安；就命理本意而言，化解之道其實是：這一年<b>凡事多一分謹慎、避免重大冒進</b>，把健康作息與人際和氣顧好，平順走過就是最好的化解。";

export function calcLiuNian(birthYear, fromYear, count, yongWxList, dGan, dZhi, yZhi){
  const list=[];
  for(let k=0;k<count;k++){
    const yr=fromYear+k;
    const g=((yr-4)%10+10)%10, z=((yr-4)%12+12)%12;
    const gz=GAN[g]+ZHI[z];
    const t=tierVsYong(gz, yongWxList);
    list.push({
      year:yr, age:yr-birthYear+1, gz,
      ganGod: tenGod(dGan, GAN[g]),
      tier:t.tier, tierScore:t.score,
      rel: dZhi?dayBranchRel(ZHI[z], dZhi):null,
      taisui: yZhi?taiSuiRel(ZHI[z], yZhi):null
    });
  }
  return list;
}

/* ============================================================
 * 流月（某一年的十二個月）
 * 月柱依該年年干用五虎遁
 * ============================================================ */
export function calcLiuYue(year, yongWxList, dGan){
  const g=((year-4)%10+10)%10;
  const yGan=GAN[g];
  const wuhu={甲:2,己:2,乙:4,庚:4,丙:6,辛:6,丁:8,壬:8,戊:0,癸:0};
  // 十二月支固定：寅(正)…丑(臘)
  const monthZhiOrder=["寅","卯","辰","巳","午","未","申","酉","戌","亥","子","丑"];
  const list=[];
  monthZhiOrder.forEach((mz,idx)=>{
    const mGan=GAN[(wuhu[yGan]+idx)%10];
    const gz=mGan+mz;
    const t=tierVsYong(gz, yongWxList);
    list.push({
      monthName:["正月","二月","三月","四月","五月","六月","七月","八月","九月","十月","十一月","臘月"][idx],
      gz, ganGod: tenGod(dGan, mGan), tier:t.tier, tierScore:t.score
    });
  });
  return list;
}

/* 大運流年文案庫（自己的文案） */
export const LUCK_THEME = {
  旺:{theme:"得力之運，喜用得地，宜主動進取、把握機會",
      yi:["謀職升遷","拓展事業","投資佈局","婚戀大事","學習考試"],
      ji:["過度擴張","樹大招風","輕忽風險"]},
  平:{theme:"平順之運，宜守正待時、穩中求進、厚積實力",
      yi:["充實本業","規劃整理","維繫人脈","量力而為"],
      ji:["躁進冒險","三心二意","與人爭利"]},
  弱:{theme:"忌神當道，宜低調守成、避險蓄力、調養身心",
      yi:["沉潛蓄力","謹慎理財","休養生息","避免衝突"],
      ji:["重大決策","盲目投資","硬撐逞強","口舌官非"]}
};
