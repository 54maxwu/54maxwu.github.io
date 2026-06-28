/* ============================================================
 * 天知道 · 曆法層 (Layer 0)
 * 節氣定月 / JDN定日 / 五虎遁 / 五鼠遁 / 立春定年
 * 農曆轉換 / 真太陽時校正 / 早晚子時三派
 * ============================================================ */

export const GAN = ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"];
export const ZHI = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];

export const GAN_WX = {甲:"木",乙:"木",丙:"火",丁:"火",戊:"土",己:"土",庚:"金",辛:"金",壬:"水",癸:"水"};
export const GAN_YY = {甲:"陽",乙:"陰",丙:"陽",丁:"陰",戊:"陽",己:"陰",庚:"陽",辛:"陰",壬:"陽",癸:"陰"};
export const ZHI_WX = {子:"水",丑:"土",寅:"木",卯:"木",辰:"土",巳:"火",午:"火",未:"土",申:"金",酉:"金",戌:"土",亥:"水"};
export const ZHI_YY = {子:"陽",丑:"陰",寅:"陽",卯:"陰",辰:"陽",巳:"陰",午:"陽",未:"陰",申:"陽",酉:"陰",戌:"陽",亥:"陰"};

/* 地支藏干 (主氣1.0 / 中氣0.5 / 餘氣0.3) */
export const ZHI_CANGAN = {
  子:[["癸",1.0]],
  丑:[["己",1.0],["癸",0.5],["辛",0.3]],
  寅:[["甲",1.0],["丙",0.5],["戊",0.3]],
  卯:[["乙",1.0]],
  辰:[["戊",1.0],["乙",0.5],["癸",0.3]],
  巳:[["丙",1.0],["庚",0.5],["戊",0.3]],
  午:[["丁",1.0],["己",0.5]],
  未:[["己",1.0],["丁",0.5],["乙",0.3]],
  申:[["庚",1.0],["壬",0.5],["戊",0.3]],
  酉:[["辛",1.0]],
  戌:[["戊",1.0],["辛",0.5],["丁",0.3]],
  亥:[["壬",1.0],["甲",0.5]]
};

/* 納音五行 (六十甲子) */
export const NAYIN = {
  甲子:"海中金",乙丑:"海中金",丙寅:"爐中火",丁卯:"爐中火",戊辰:"大林木",己巳:"大林木",
  庚午:"路旁土",辛未:"路旁土",壬申:"劍鋒金",癸酉:"劍鋒金",甲戌:"山頭火",乙亥:"山頭火",
  丙子:"澗下水",丁丑:"澗下水",戊寅:"城頭土",己卯:"城頭土",庚辰:"白蠟金",辛巳:"白蠟金",
  壬午:"楊柳木",癸未:"楊柳木",甲申:"泉中水",乙酉:"泉中水",丙戌:"屋上土",丁亥:"屋上土",
  戊子:"霹靂火",己丑:"霹靂火",庚寅:"松柏木",辛卯:"松柏木",壬辰:"長流水",癸巳:"長流水",
  甲午:"砂中金",乙未:"砂中金",丙申:"山下火",丁酉:"山下火",戊戌:"平地木",己亥:"平地木",
  庚子:"壁上土",辛丑:"壁上土",壬寅:"金箔金",癸卯:"金箔金",甲辰:"覆燈火",乙巳:"覆燈火",
  丙午:"天河水",丁未:"天河水",戊申:"大驛土",己酉:"大驛土",庚戌:"釵釧金",辛亥:"釵釧金",
  壬子:"桑柘木",癸丑:"桑柘木",甲寅:"大溪水",乙卯:"大溪水",丙辰:"沙中土",丁巳:"沙中土",
  戊午:"天上火",己未:"天上火",庚申:"石榴木",辛酉:"石榴木",壬戌:"大海水",癸亥:"大海水"
};

/* ---------- 太陽黃經 / 節氣 (天文公式) ---------- */
function sunLongitude(jde){
  const T=(jde-2451545.0)/36525.0;
  const L0=280.46646+36000.76983*T+0.0003032*T*T;
  const M=357.52911+35999.05029*T-0.0001537*T*T;
  const Mr=M*Math.PI/180;
  const C=(1.914602-0.004817*T-0.000014*T*T)*Math.sin(Mr)
        +(0.019993-0.000101*T)*Math.sin(2*Mr)
        +0.000289*Math.sin(3*Mr);
  const omega=125.04-1934.136*T;
  let lambda=L0+C-0.00569-0.00478*Math.sin(omega*Math.PI/180);
  return ((lambda%360)+360)%360;
}

export function jdeFromYMD(y,m,d){
  if(m<=2){y-=1;m+=12;}
  const A=Math.floor(y/100), B=2-A+Math.floor(A/4);
  return Math.floor(365.25*(y+4716))+Math.floor(30.6001*(m+1))+d+B-1524.5;
}

/* 求某年某黃經度數對應的節氣 JDE (牛頓迭代) */
function solarTermJDE(year,deg){
  let estMonth=Math.floor(deg/30)+3; if(estMonth>12)estMonth-=12;
  let jde=jdeFromYMD(year,estMonth,1);
  for(let i=0;i<12;i++){
    let diff=deg-sunLongitude(jde);
    if(diff>180)diff-=360; if(diff<-180)diff+=360;
    jde+=diff*(365.25/360);
    if(Math.abs(diff)<1e-7)break;
  }
  return jde;
}

/* 十二「節」(交節點，定月柱用，非中氣) — 立春315°起 */
const JIE = [
  {deg:315,zhi:"寅",name:"立春"},{deg:345,zhi:"卯",name:"驚蟄"},
  {deg:15, zhi:"辰",name:"清明"},{deg:45, zhi:"巳",name:"立夏"},
  {deg:75, zhi:"午",name:"芒種"},{deg:105,zhi:"未",name:"小暑"},
  {deg:135,zhi:"申",name:"立秋"},{deg:165,zhi:"酉",name:"白露"},
  {deg:195,zhi:"戌",name:"寒露"},{deg:225,zhi:"亥",name:"立冬"},
  {deg:255,zhi:"子",name:"大雪"},{deg:285,zhi:"丑",name:"小寒"}
];

/* 收集 y-1 ~ y+1 三年的所有節氣，排序 */
function gatherTerms(y){
  let terms=[];
  for(let yr=y-1; yr<=y+1; yr++)
    for(const j of JIE) terms.push({jde:solarTermJDE(yr,j.deg), zhi:j.zhi, deg:j.deg, name:j.name, year:yr});
  terms.sort((a,b)=>a.jde-b.jde);
  return terms;
}

/* ---------- 真太陽時校正 ----------
 * 平太陽時校正：經度時差 (每度4分鐘，以120°E東八區標準經線為基準)
 * 真太陽時再加均時差 (equation of time)
 */
export function trueSolarCorrection(jde, longitude){
  // 經度時差（小時）：(實際經度 - 120) / 15
  const lonDiffHours = (longitude - 120) / 15;
  // 均時差（分鐘）
  const T=(jde-2451545.0)/36525.0;
  const L0=((280.46646+36000.76983*T)%360+360)%360;
  const M=(357.52911+35999.05029*T)*Math.PI/180;
  const e=0.016708634-0.000042037*T;
  const y=Math.tan((23.439-0.0130042*T)*Math.PI/360)**2;
  const Eot = y*Math.sin(2*L0*Math.PI/180)
            - 2*e*Math.sin(M)
            + 4*e*y*Math.sin(M)*Math.cos(2*L0*Math.PI/180)
            - 0.5*y*y*Math.sin(4*L0*Math.PI/180)
            - 1.25*e*e*Math.sin(2*M);
  const eotMinutes = Eot*4*180/Math.PI;
  return lonDiffHours/24 + eotMinutes/1440; // 以「日」為單位回傳
}

/* ============================================================
 * 排八字主函式
 * @param y,m,d   國曆年月日
 * @param hour    24小時制時(0-23)，-1=時辰不詳
 * @param minute  分(0-59)
 * @param opts    { longitude, ziSchool:'late'|'early'|'astro', useTrueSolar }
 *   ziSchool: late=晚子時(23-24歸當日,夜子時)/ early=早子時(23後算次日)/ astro=以0點換日
 * ============================================================ */
export function buildBazi(y,m,d,hour=-1,minute=0,opts={}){
  const tz = 8;
  const longitude = (opts.longitude!=null) ? opts.longitude : 120;
  const useTrueSolar = !!opts.useTrueSolar;
  const ziSchool = opts.ziSchool || 'late';

  const known = hour>=0;
  let H = known ? hour : 12;     // 不詳以正午佔位（只為定日柱用，不輸出時柱）
  let MM = known ? minute : 0;

  // 1) 構造出生時刻 JDE（東八區鐘錶時）
  let baseJDE = jdeFromYMD(y,m,d) + (H + MM/60 - tz)/24.0;

  // 2) 真太陽時校正
  let corr = 0;
  if(useTrueSolar){
    corr = trueSolarCorrection(baseJDE, longitude);
    baseJDE += corr;
  }
  // 校正後的「鐘錶等效時刻」用來判定時辰/換日
  const solarHourFloat = (H + MM/60) + corr*24; // 真太陽時的小時數（可能跨日）

  // 3) 定時辰索引（每2小時一柱，23:00起為子時）
  let effY=y, effM=m, effD=d;
  let ziweiY=y, ziweiM=m, ziweiD=d;  // 給紫微用的「校正後日曆日」（不套早子時規則）
  let hourIdx = -1; // 時支索引 0=子..11=亥
  const shiftDays=(n)=>{ if(!n) return; const t=new Date(Date.UTC(effY,effM-1,effD)+n*86400000);
    effY=t.getUTCFullYear(); effM=t.getUTCMonth()+1; effD=t.getUTCDate(); };
  if(known){
    // 真太陽時校正可能把出生瞬間推過子夜：先讓日柱跟著校正後的「真太陽時civil日」走，
    // 否則日柱(用raw日)會與時辰(用校正後時刻)不一致，子夜前後出生會錯一天 → 連帶時干(五鼠遁)也錯。
    shiftDays(Math.floor(solarHourFloat / 24));
    let sh = ((solarHourFloat % 24) + 24) % 24;
    // 23:00-01:00 子時
    hourIdx = Math.floor(((sh + 1) % 24) / 2); // +1使23時→0(子)
    // 此時的 effY/effM/effD = 校正後真太陽時的「日曆日」，尚未套早子時規則 → 給紫微用（iztro 內部會依時辰自行換日，不可重複套子時）。
    ziweiY=effY; ziweiM=effM; ziweiD=effD;
    // 早晚子時換日處理：23-24點出生
    if(sh >= 23){
      if(ziSchool === 'early') shiftDays(1); // 早子時派：23點後即算次日（在已校正日上再進一天）
      // late(晚子時/夜子時)派：日柱仍歸當日，時柱用子
    }
  }

  // 4) 定月柱（依節氣）
  const birthForTerm = useTrueSolar ? baseJDE : (jdeFromYMD(y,m,d) + (H+MM/60-tz)/24.0);
  const terms = gatherTerms(y);
  let curTerm = terms[0];
  for(const t of terms) if(t.jde <= birthForTerm) curTerm = t;
  const monthZhi = curTerm.zhi;
  const jieName = curTerm.name;

  // 5) 定年柱（立春換年）
  let lichunYear = y;
  for(const t of terms){
    if(t.deg===315 && t.jde<=birthForTerm) lichunYear=t.year;
  }
  const yGan = GAN[((lichunYear-4)%10+10)%10];
  const yZhi = ZHI[((lichunYear-4)%12+12)%12];

  // 6) 月干（五虎遁）：甲己之年丙作首...
  const wuhu = {甲:2,己:2,乙:4,庚:4,丙:6,辛:6,丁:8,壬:8,戊:0,癸:0};
  const monthOrder = ((ZHI.indexOf(monthZhi) - 2) + 12) % 12; // 寅=0
  const mGan = GAN[(wuhu[yGan] + monthOrder) % 10];

  // 7) 日柱（JDN）—— 使用換日後的 effY/effM/effD
  const jdn = Math.floor(jdeFromYMD(effY,effM,effD)+0.5);
  const dGan = GAN[((jdn+9)%10+10)%10];
  const dZhi = ZHI[((jdn+1)%12+12)%12];

  // 8) 時柱（五鼠遁）：甲己還加甲...
  let hGan="—", hZhi="—";
  if(known && hourIdx>=0){
    const wushu = {甲:0,己:0,乙:2,庚:2,丙:4,辛:4,丁:6,壬:6,戊:8,癸:8};
    hGan = GAN[(wushu[dGan] + hourIdx) % 10];
    hZhi = ZHI[hourIdx];
  }

  const pillars = {
    year:{gan:yGan,zhi:yZhi},
    month:{gan:mGan,zhi:monthZhi},
    day:{gan:dGan,zhi:dZhi},
    hour:known ? {gan:hGan,zhi:hZhi} : null
  };

  return {
    pillars,
    yGan,yZhi,mGan,mZhi:monthZhi,dGan,dZhi,hGan,hZhi,
    hourKnown:known, hourIdx,
    lichunYear, jieName, monthZhi,
    correction: corr,           // 真太陽時校正量(日)
    correctionMin: Math.round(corr*1440),
    longitude, useTrueSolar, ziSchool,
    solar:{y,m,d,hour:known?hour:null,minute:known?minute:null},
    effective:{y:effY,m:effM,d:effD},
    ziweiDate:{y:ziweiY,m:ziweiM,d:ziweiD},  // 紫微排盤用的校正後日曆日（隨真太陽時跨日，但不套早子時）
    nayin:{
      year:NAYIN[yGan+yZhi], month:NAYIN[mGan+monthZhi],
      day:NAYIN[dGan+dZhi], hour:known?NAYIN[hGan+hZhi]:null
    }
  };
}

/* ---------- 今日干支 ---------- */
export function todayGanzhi(date){
  const now = date || new Date();
  const y=now.getFullYear(), m=now.getMonth()+1, d=now.getDate();
  const a=Math.floor((14-m)/12), yj=y+4800-a, mj=m+12*a-3;
  const jdn=d+Math.floor((153*mj+2)/5)+365*yj+Math.floor(yj/4)-Math.floor(yj/100)+Math.floor(yj/400)-32045;
  const gan=GAN[((jdn+9)%10+10)%10], zhi=ZHI[((jdn+1)%12+12)%12];
  return {gan,zhi,wx:GAN_WX[gan],y,m,d,jdn};
}

/* ---------- 農曆轉國曆 (1900-2100) ---------- */
const LUNAR_INFO=[0x04bd8,0x04ae0,0x0a570,0x054d5,0x0d260,0x0d950,0x16554,0x056a0,0x09ad0,0x055d2,0x04ae0,0x0a5b6,0x0a4d0,0x0d250,0x1d255,0x0b540,0x0d6a0,0x0ada2,0x095b0,0x14977,0x04970,0x0a4b0,0x0b4b5,0x06a50,0x06d40,0x1ab54,0x02b60,0x09570,0x052f2,0x04970,0x06566,0x0d4a0,0x0ea50,0x06e95,0x05ad0,0x02b60,0x186e3,0x092e0,0x1c8d7,0x0c950,0x0d4a0,0x1d8a6,0x0b550,0x056a0,0x1a5b4,0x025d0,0x092d0,0x0d2b2,0x0a950,0x0b557,0x06ca0,0x0b550,0x15355,0x04da0,0x0a5b0,0x14573,0x052b0,0x0a9a8,0x0e950,0x06aa0,0x0aea6,0x0ab50,0x04b60,0x0aae4,0x0a570,0x05260,0x0f263,0x0d950,0x05b57,0x056a0,0x096d0,0x04dd5,0x04ad0,0x0a4d0,0x0d4d4,0x0d250,0x0d558,0x0b540,0x0b6a0,0x195a6,0x095b0,0x049b0,0x0a974,0x0a4b0,0x0b27a,0x06a50,0x06d40,0x0af46,0x0ab60,0x09570,0x04af5,0x04970,0x064b0,0x074a3,0x0ea50,0x06b58,0x055c0,0x0ab60,0x096d5,0x092e0,0x0c960,0x0d954,0x0d4a0,0x0da50,0x07552,0x056a0,0x0abb7,0x025d0,0x092d0,0x0cab5,0x0a950,0x0b4a0,0x0baa4,0x0ad50,0x055d9,0x04ba0,0x0a5b0,0x15176,0x052b0,0x0a930,0x07954,0x06aa0,0x0ad50,0x05b52,0x04b60,0x0a6e6,0x0a4e0,0x0d260,0x0ea65,0x0d530,0x05aa0,0x076a3,0x096d0,0x04afb,0x04ad0,0x0a4d0,0x1d0b6,0x0d250,0x0d520,0x0dd45,0x0b5a0,0x056d0,0x055b2,0x049b0,0x0a577,0x0a4b0,0x0aa50,0x1b255,0x06d20,0x0ada0,0x14b63,0x09370,0x049f8,0x04970,0x064b0,0x168a6,0x0ea50,0x06b20,0x1a6c4,0x0aae0,0x0a2e0,0x0d2e3,0x0c960,0x0d557,0x0d4a0,0x0da50,0x05d55,0x056a0,0x0a6d0,0x055d4,0x052d0,0x0a9b8,0x0a950,0x0b4a0,0x0b6a6,0x0ad50,0x055a0,0x0aba4,0x0a5b0,0x052b0,0x0b273,0x06930,0x07337,0x06aa0,0x0ad50,0x14b55,0x04b60,0x0a570,0x054e4,0x0d160,0x0e968,0x0d520,0x0daa0,0x16aa6,0x056d0,0x04ae0,0x0a9d4,0x0a2d0,0x0d150,0x0f252,0x0d520];
function lYearDays(y){let s=348;for(let i=0x8000;i>0x8;i>>=1)s+=(LUNAR_INFO[y-1900]&i)?1:0;return s+leapDays(y);}
function leapDays(y){return leapMonth(y)?((LUNAR_INFO[y-1900]&0x10000)?30:29):0;}
export function leapMonth(y){return LUNAR_INFO[y-1900]&0xf;}
function monthDays(y,m){return (LUNAR_INFO[y-1900]&(0x10000>>m))?30:29;}
export function lunar2solar(lY,lM,lD,isLeap){
  let offset=0;
  for(let i=1900;i<lY;i++) offset+=lYearDays(i);
  const leapM=leapMonth(lY);
  for(let i=1;i<lM;i++){offset+=monthDays(lY,i);if(leapM>0 && i===leapM) offset+=leapDays(lY);}
  if(isLeap && leapM===lM) offset+=monthDays(lY,lM);
  offset+=lD-1;
  const t=new Date(Date.UTC(1900,0,31)+offset*86400000);
  return {y:t.getUTCFullYear(), m:t.getUTCMonth()+1, d:t.getUTCDate()};
}

/* ---------- 國曆轉農曆 (1900-2100) ---------- */
export function solar2lunar(y,m,d){
  // 與 1900-01-31（農曆1900正月初一）的天數差
  const base=Date.UTC(1900,0,31);
  let offset=Math.floor((Date.UTC(y,m-1,d)-base)/86400000);
  let lY=1900;
  for(;lY<2101;lY++){ const yd=lYearDays(lY); if(offset<yd) break; offset-=yd; }
  const leapM=leapMonth(lY);
  let lM=1, isLeap=false;
  for(;lM<=12;lM++){
    const dm=monthDays(lY,lM);
    if(offset<dm){ isLeap=false; break; }
    offset-=dm;
    if(leapM>0 && lM===leapM){
      const dl=leapDays(lY);
      if(offset<dl){ isLeap=true; break; }
      offset-=dl;
    }
  }
  return {y:lY, m:lM, d:offset+1, isLeap};
}

/* 匯出供其他層使用 */
export { gatherTerms, solarTermJDE, sunLongitude, JIE };
