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
export function calcLiuNian(birthYear, fromYear, count, yongWxList, dGan){
  const list=[];
  for(let k=0;k<count;k++){
    const yr=fromYear+k;
    const g=((yr-4)%10+10)%10, z=((yr-4)%12+12)%12;
    const gz=GAN[g]+ZHI[z];
    const t=tierVsYong(gz, yongWxList);
    list.push({
      year:yr, age:yr-birthYear+1, gz,
      ganGod: tenGod(dGan, GAN[g]),
      tier:t.tier, tierScore:t.score
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
