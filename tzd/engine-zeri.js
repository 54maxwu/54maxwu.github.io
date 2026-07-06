/* ============================================================
 * 天知道 · 個人化擇日引擎
 * 建除十二神定每日吉凶 → 依事件挑吉日 → 再用「你的八字」個人化：
 *   • 自動避開沖你生肖（年支）與沖你日支的日子
 *   • 每天干支對你喜用神標旺平弱
 *   • 六合你日支的日子加註「合日」
 * ============================================================ */
import { GAN, ZHI, jdeFromYMD, gatherTerms, solar2lunar } from "./engine-calendar.js";
import { tierVsYong, LN_CHONG, LN_HE } from "./engine-luck.js";
import { ZHI_SX } from "./ui-data.js";

/* 建除十二神：值神 = (日支 - 月支) 順數。月支同日支為「建」，之後依序輪。 */
const JIANCHU = ["建","除","滿","平","定","執","破","危","成","收","開","閉"];
export const JIANCHU_META = {
  建:{lv:"吉", say:"萬物初建之日——宜出行、動身、開始新事；忌動土。"},
  除:{lv:"吉", say:"除舊佈新之日——宜大掃除、就醫調理、了結舊事。"},
  滿:{lv:"吉", say:"圓滿豐收之日——宜開市、簽約、祈福。"},
  平:{lv:"平", say:"平穩持中之日——宜修整、鋪路、按部就班。"},
  定:{lv:"吉", say:"安定成形之日——宜嫁娶、訂盟、簽約、入宅。"},
  執:{lv:"平", say:"固守其事之日——宜執行既定計畫，不宜開創。"},
  破:{lv:"凶", say:"破敗之日——諸事不宜，只宜拆除破屋。"},
  危:{lv:"凶", say:"危險之日——宜靜不宜動，避免冒險。"},
  成:{lv:"吉", say:"萬事有成之日——嫁娶、開市、入宅皆大吉。"},
  收:{lv:"平", say:"收斂納財之日——宜收帳、入倉、收尾。"},
  開:{lv:"吉", say:"開通順遂之日——宜開市、開工、入學、求職。"},
  閉:{lv:"凶", say:"閉塞收藏之日——不宜開張、嫁娶，只宜填補修堵。"},
};

/* 擇日事件：每種事挑哪些值神（傳統建除擇日法） */
export const ZERI_EVENTS = [
  {key:"marry", icon:"💍", label:"嫁娶訂婚", good:["定","成","開"],       why:"定＝關係安定成形、成＝萬事有成、開＝開展新局"},
  {key:"move",  icon:"🏠", label:"搬家入宅", good:["定","成","開","滿"],  why:"定成開主安定開展，滿主圓滿豐足"},
  {key:"biz",   icon:"💼", label:"開市簽約", good:["開","成","滿","收"],  why:"開成主開展有成，滿收主豐收納財"},
  {key:"travel",icon:"✈️", label:"出行旅遊", good:["建","除","開","成"],  why:"建主動身啟程，除開成主順遂"},
  {key:"build", icon:"🔨", label:"動土裝修", good:["平","定","成","開"],  why:"平主整平、定成開主工程順利（建日忌動土已排除）"},
  {key:"heal",  icon:"🩺", label:"就醫調理", good:["除","開","成"],       why:"除＝除舊去病，開成主順利康復"},
];

/* 某日（國曆）的日柱干支 */
export function dayPillar(y,m,d){
  const jdn=Math.floor(jdeFromYMD(y,m,d)+0.5);
  return { gan:GAN[((jdn+9)%10+10)%10], zhi:ZHI[((jdn+1)%12+12)%12], jdn };
}

/* 農曆日期白話（五月初二 / 閏四月十五） */
const LMON=["正","二","三","四","五","六","七","八","九","十","冬","臘"];
const LDAY=["初一","初二","初三","初四","初五","初六","初七","初八","初九","初十",
            "十一","十二","十三","十四","十五","十六","十七","十八","十九","二十",
            "廿一","廿二","廿三","廿四","廿五","廿六","廿七","廿八","廿九","三十"];
export function lunarLabel(y,m,d){
  const l=solar2lunar(y,m,d);
  return `${l.isLeap?"閏":""}${LMON[l.m-1]}月${LDAY[l.d-1]||l.d}`;
}

const WEEK=["日","一","二","三","四","五","六"];

/* ============================================================
 * 個人化擇日主函式
 * @param from   {y,m,d} 起始日（含當日）
 * @param nDays  往後掃幾天
 * @param evKey  事件 key（ZERI_EVENTS）
 * @param person {yZhi,dZhi,yong}  yong=喜用神五行陣列
 * @return {days:[{y,m,d,week,gz,zhishen,lunar,tier,he,top}], clashSkipped, scanned}
 * ============================================================ */
export function pickDays(from, nDays, evKey, person){
  const ev=ZERI_EVENTS.find(e=>e.key===evKey);
  if(!ev) return {days:[],clashSkipped:0,scanned:0};
  const terms=gatherTerms(from.y);          // 涵蓋前後一年節氣，跨年掃描也夠用
  const out=[]; let clashSkipped=0;
  const t0=Date.UTC(from.y, from.m-1, from.d);
  for(let k=0;k<nDays;k++){
    const t=new Date(t0+k*86400000);
    const y=t.getUTCFullYear(), m=t.getUTCMonth()+1, d=t.getUTCDate();
    const p=dayPillar(y,m,d);
    // 該日所屬節氣月支（以當日正午定月，避免交節當天邊界飄移）
    const noon=jdeFromYMD(y,m,d)+0.5-8/24;
    let mz=terms[0].zhi;
    for(const tm of terms){ if(tm.jde<=noon) mz=tm.zhi; }
    const zhishen=JIANCHU[(ZHI.indexOf(p.zhi)-ZHI.indexOf(mz)+12)%12];
    if(!ev.good.includes(zhishen)) continue;               // 值神不合此事 → 略過
    const clash=LN_CHONG[p.zhi];
    if(person && (clash===person.yZhi || clash===person.dZhi)){ clashSkipped++; continue; }  // 沖你 → 避開
    const tier=person&&person.yong ? tierVsYong(p.gan+p.zhi, person.yong).tier : "平";
    const he=!!(person && LN_HE[p.zhi]===person.dZhi);     // 六合你日支：人和加分
    out.push({
      y,m,d, week:WEEK[t.getUTCDay()],
      gz:p.gan+p.zhi, zhishen, lunar:lunarLabel(y,m,d),
      chongSx:ZHI_SX[clash]||"",                            // 這天沖誰（給同行的家人朋友參考）
      tier, he, top: tier==="旺"||he,                       // 上吉：旺你喜用或合你日支
    });
  }
  return {days:out, clashSkipped, scanned:nDays, ev};
}
