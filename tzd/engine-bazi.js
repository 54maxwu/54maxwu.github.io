/* ============================================================
 * 天知道 · 八字核心層 (Layer 1)
 * 十神 / 身強弱 / 用神(扶抑+調候+通關) / 十二長生 / 神煞 / 格局
 * ============================================================ */
import {
  GAN, ZHI, GAN_WX, GAN_YY, ZHI_WX, ZHI_YY, ZHI_CANGAN
} from "./engine-calendar.js";

/* 五行生剋 */
export const SHENG = {木:"火",火:"土",土:"金",金:"水",水:"木"};
export const KE    = {木:"土",土:"水",水:"火",火:"金",金:"木"};
export const shengBy = wx => Object.keys(SHENG).find(k=>SHENG[k]===wx); // 生我者
export const keBy    = wx => Object.keys(KE).find(k=>KE[k]===wx);       // 剋我者

/* ---------- 十神 ---------- */
export function tenGod(dayGan, other){
  if(!other || other==="—") return null;
  const dWx=GAN_WX[dayGan], oWx=GAN_WX[other];
  const same=(GAN_YY[dayGan]===GAN_YY[other]);
  if(oWx===dWx)        return same?"比肩":"劫財";
  if(SHENG[dWx]===oWx) return same?"食神":"傷官";
  if(KE[dWx]===oWx)    return same?"偏財":"正財";
  if(KE[oWx]===dWx)    return same?"七殺":"正官";
  if(SHENG[oWx]===dWx) return same?"偏印":"正印";
  return null;
}
export const SHISHEN_CLASS = {
  比肩:"比劫",劫財:"比劫",食神:"食傷",傷官:"食傷",
  偏財:"財星",正財:"財星",七殺:"官殺",正官:"官殺",偏印:"印星",正印:"印星"
};
/* 十神簡義（自己的文案，後續UI用） */
export const SHISHEN_DESC = {
  比肩:"同我之氣，主自我、競爭、兄弟手足、合夥",
  劫財:"異性同我，主進取、爭奪、冒險、破耗",
  食神:"我所生（順），主才華、福氣、口福、温和輸出",
  傷官:"我所生（逆），主聰明、表現、叛逆、傷官見官為禍",
  偏財:"我所剋（順），主流動財、機會財、慷慨、父緣",
  正財:"我所剋（逆），主正財、妻財、務實、節儉",
  七殺:"剋我（順），主魄力、壓力、權威、小人或貴人兩極",
  正官:"剋我（逆），主名譽、地位、責任、自律",
  偏印:"生我（順），主偏門學問、孤剋、直覺、繼母緣",
  正印:"生我（逆），主學識、庇蔭、母緣、名譽靠山"
};

/* ---------- 十二長生 ---------- */
/* 各天干「長生」起始地支（陽干順行、陰干逆行） */
const CHANGSHENG_START = {
  甲:"亥",丙:"寅",戊:"寅",庚:"巳",壬:"申",
  乙:"午",丁:"酉",己:"酉",辛:"子",癸:"卯"
};
const CHANGSHENG_NAMES = ["長生","沐浴","冠帶","臨官","帝旺","衰","病","死","墓","絕","胎","養"];
export function changSheng(dayGan, zhi){
  if(zhi==="—") return null;
  const start = CHANGSHENG_START[dayGan];
  const yang = (GAN_YY[dayGan]==="陽");
  let si = ZHI.indexOf(start), zi = ZHI.indexOf(zhi);
  let step = yang ? ((zi - si + 12) % 12) : ((si - zi + 12) % 12);
  return CHANGSHENG_NAMES[step];
}
/* 長生強弱權重（用於身強弱微調與旺衰顯示） */
const CS_VITALITY = {長生:3,沐浴:1,冠帶:2,臨官:4,帝旺:5,衰:1,病:0,死:-1,墓:0,絕:-2,胎:1,養:2};

/* ---------- 月令旺相休囚死（得令） ---------- */
export function getLing(dayWx, monthZhi){
  const mWx=ZHI_WX[monthZhi];
  if(mWx===dayWx)        return {state:"旺",score:3, note:"日主得月令當旺"};
  if(SHENG[mWx]===dayWx) return {state:"相",score:2, note:"月令生日主，次旺"};
  if(SHENG[dayWx]===mWx) return {state:"休",score:-1,note:"日主生月令，洩氣"};
  if(KE[dayWx]===mWx)    return {state:"囚",score:-1.5,note:"日主剋月令，受困"};
  if(KE[mWx]===dayWx)    return {state:"死",score:-2,note:"月令剋日主，最弱"};
  return {state:"平",score:0,note:""};
}

/* ============================================================
 * 身強弱（分數制，附明細）
 * 得令×3 + 得地(藏干通根) + 得勢(天干同類) + 月支長生微調
 * ============================================================ */
export function analyzeStrength(bz){
  const dayGan=bz.dGan, dayWx=GAN_WX[dayGan];
  const detail=[]; // 加減分明細
  const ling=getLing(dayWx, bz.mZhi);
  let score = ling.score*3;
  detail.push({item:`月令（${bz.mZhi}）${ling.state}`, val:ling.score*3, note:ling.note});

  // 得地：四支藏干
  const zhiList=[
    ["年支",bz.yZhi],["月支",bz.mZhi],["日支",bz.dZhi]
  ];
  if(bz.hourKnown) zhiList.push(["時支",bz.hZhi]);
  for(const [label,z] of zhiList){
    (ZHI_CANGAN[z]||[]).forEach(([g,w])=>{
      const gWx=GAN_WX[g];
      let v=0,kind="";
      if(gWx===dayWx){v=1.0*w;kind="同類(比劫)";}
      else if(SHENG[gWx]===dayWx){v=0.8*w;kind="生我(印)";}
      else if(SHENG[dayWx]===gWx){v=-0.5*w;kind="我生(食傷洩)";}
      else if(KE[dayWx]===gWx){v=-0.4*w;kind="我剋(財耗)";}
      else if(KE[gWx]===dayWx){v=-0.7*w;kind="剋我(官殺)";}
      if(v!==0) detail.push({item:`${label}藏${g}`, val:Math.round(v*100)/100, note:kind});
      score+=v;
    });
  }
  // 得勢：天干
  const ganList=[["年干",bz.yGan],["月干",bz.mGan]];
  if(bz.hourKnown) ganList.push(["時干",bz.hGan]);
  for(const [label,g] of ganList){
    if(g==="—") continue;
    const gWx=GAN_WX[g];
    let v=0,kind="";
    if(gWx===dayWx){v=1.0;kind="同類(比劫)";}
    else if(SHENG[gWx]===dayWx){v=0.8;kind="生我(印)";}
    else if(SHENG[dayWx]===gWx){v=-0.5;kind="我生(食傷洩)";}
    else if(KE[dayWx]===gWx){v=-0.4;kind="我剋(財耗)";}
    else if(KE[gWx]===dayWx){v=-0.7;kind="剋我(官殺)";}
    if(v!==0) detail.push({item:`${label}${g}`, val:v, note:kind});
    score+=v;
  }
  // 月支長生微調（小權重）
  const cs = changSheng(dayGan, bz.mZhi);
  if(cs){
    const v=(CS_VITALITY[cs]||0)*0.15;
    if(v!==0){ score+=v; detail.push({item:`日主於月支(${cs})`,val:Math.round(v*100)/100,note:"十二長生氣勢"}); }
  }

  score=Math.round(score*100)/100;
  let strength, level, abnormal=false;
  if(score>=14){strength="極強";level=5;abnormal=true;}
  else if(score>=4){strength="身強";level=4;}
  else if(score>-4){strength="中和";level=3;}
  else if(score>-12){strength="身弱";level=2;}
  else{strength="極弱";level=1;abnormal=true;}

  return {dayGan,dayWx,ling,score,strength,level,abnormal,detail};
}

/* ============================================================
 * 用神：扶抑 + 調候 + 通關
 * ============================================================ */
/* 調候用神簡表：依日主 + 月支(月令)，取最需要的調候五行
 * 規則化：寒(亥子丑)需火暖、暑(巳午未)需水潤，再依日主微調 */
function tiaohou(dayWx, monthZhi){
  const cold = ["亥","子","丑"].includes(monthZhi);
  const hot  = ["巳","午","未"].includes(monthZhi);
  const dry  = ["未","戌"].includes(monthZhi);
  const wet  = ["丑","辰"].includes(monthZhi);
  let need=[], reason="";
  if(cold){ need.push("火"); reason="生於寒月，氣候嚴寒，首取火調暖"; }
  else if(hot){ need.push("水"); reason="生於暑月，火土燥烈，首取水潤局"; }
  if(dry && !need.includes("水")){ need.push("水"); reason+=(reason?"；":"")+"土燥需水潤澤"; }
  if(wet && !need.includes("火")){ need.push("火"); reason+=(reason?"；":"")+"土濕需火暖土"; }
  return {need:[...new Set(need)], reason};
}

export function analyzeYongShen(bz, strengthInfo){
  const dayWx = GAN_WX[bz.dGan];
  const s = strengthInfo;
  let primary=[], avoid=[], method="", note="";

  // 扶抑
  if(s.strength==="身強"||s.strength==="極強"){
    method = "扶抑（身強宜剋洩耗）";
    primary = [SHENG[dayWx], KE[dayWx], keBy(dayWx)]; // 食傷洩、財耗、官殺剋
    avoid   = [dayWx, shengBy(dayWx)];                 // 忌比劫、印
    note = "日主偏旺，喜「食傷洩秀、財星耗身、官殺制身」，忌再添比劫與印星。";
    if(s.strength==="極強"){
      note += " 惟身過強近從旺，若全局無剋洩，反宜順其旺勢。";
    }
  } else if(s.strength==="身弱"||s.strength==="極弱"){
    method = "扶抑（身弱宜生扶）";
    primary = [dayWx, shengBy(dayWx)]; // 比劫幫身、印星生身
    avoid   = [SHENG[dayWx], KE[dayWx], keBy(dayWx)];
    note = "日主偏弱，喜「印星生身、比劫幫身」，忌食傷洩氣、財官剋洩耗身。";
    if(s.strength==="極弱"){
      note += " 惟身過弱近從弱，若印比無根，反宜順從旺神。";
    }
  } else {
    method = "中和（調候為先）";
    primary = [dayWx, SHENG[dayWx]];
    avoid   = [];
    note = "日主中和，扶抑空間小，以調候與通關取喜用，順勢微調即可。";
  }

  // 調候疊加
  const th = tiaohou(dayWx, bz.mZhi);
  if(th.need.length){
    note += ` 調候：${th.reason}。`;
    // 把調候五行提到 primary 前面（優先）
    primary = [...new Set([...th.need, ...primary])];
  }

  // 去重 + 解決矛盾：同一五行不可既喜用又忌神。
  // 調候用神優先：凡已列入喜用(primary)的五行，一律從忌神(avoid)中剔除。
  const primarySet = new Set([...new Set(primary)].filter(Boolean));
  const cleanAvoid = [...new Set(avoid)].filter(w=>w && !primarySet.has(w));
  if(avoid.some(w=>primarySet.has(w)) && th.need.length){
    note += " （註：因調候需要，原本扶抑要忌的「" + th.need.join("、") + "」改列為喜用，以調候為先。）";
  }

  return {
    method,
    primary: [...primarySet],
    avoid:   cleanAvoid,
    tiaohou: th,
    note
  };
}

/* ============================================================
 * 五行統計（含藏干權重）
 * ============================================================ */
export function wuxingTally(bz){
  const t={木:0,火:0,土:0,金:0,水:0};
  const add=(wx,v)=>{ if(t[wx]!=null) t[wx]+=v; };
  // 天干各1
  [bz.yGan,bz.mGan,bz.dGan].forEach(g=>add(GAN_WX[g],1));
  if(bz.hourKnown) add(GAN_WX[bz.hGan],1);
  // 地支藏干按權重
  const zs=[bz.yZhi,bz.mZhi,bz.dZhi]; if(bz.hourKnown) zs.push(bz.hZhi);
  zs.forEach(z=>(ZHI_CANGAN[z]||[]).forEach(([g,w])=>add(GAN_WX[g],w)));
  // 四捨五入
  for(const k in t) t[k]=Math.round(t[k]*100)/100;
  return t;
}

/* ============================================================
 * 神煞（全套）
 * 多以年支或日支起，部分以日干起
 * ============================================================ */
const PEACH = {申:"酉",子:"酉",辰:"酉", 寅:"卯",午:"卯",戌:"卯", 巳:"午",酉:"午",丑:"午", 亥:"子",卯:"子",未:"子"}; // 桃花(咸池)以年/日支三合局取
const HORSE = {申:"寅",子:"寅",辰:"寅", 寅:"申",午:"申",戌:"申", 巳:"亥",酉:"亥",丑:"亥", 亥:"巳",卯:"巳",未:"巳"}; // 驛馬
const HUAGAI= {申:"辰",子:"辰",辰:"辰", 寅:"戌",午:"戌",戌:"戌", 巳:"丑",酉:"丑",丑:"丑", 亥:"未",卯:"未",未:"未"}; // 華蓋
const JIANGXING={申:"子",子:"子",辰:"子", 寅:"午",午:"午",戌:"午", 巳:"酉",酉:"酉",丑:"酉", 亥:"卯",卯:"卯",未:"卯"}; // 將星
// 天乙貴人（以日干查，對應兩地支）
const TIANYI = {甲:["丑","未"],戊:["丑","未"],庚:["丑","未"],乙:["子","申"],己:["子","申"],
  丙:["亥","酉"],丁:["亥","酉"],壬:["卯","巳"],癸:["卯","巳"],辛:["寅","午"]};
// 文昌（日干查）
const WENCHANG = {甲:"巳",乙:"午",丙:"申",戊:"申",丁:"酉",己:"酉",庚:"亥",辛:"子",壬:"寅",癸:"卯"};
// 羊刃（日干查，陽干帝旺支）
const YANGREN = {甲:"卯",丙:"午",戊:"午",庚:"酉",壬:"子", 乙:"寅",丁:"巳",己:"巳",辛:"申",癸:"亥"};
// 祿神（日干臨官）
const LUSHEN = {甲:"寅",乙:"卯",丙:"巳",丁:"午",戊:"巳",己:"午",庚:"申",辛:"酉",壬:"亥",癸:"子"};
// 天德/月德（以月支查）
const TIANDE = {寅:"丁",卯:"申",辰:"壬",巳:"辛",午:"亥",未:"甲",申:"癸",酉:"寅",戌:"丙",亥:"乙",子:"巳",丑:"庚"};
const YUEDE  = {寅:"丙",午:"丙",戌:"丙", 申:"壬",子:"壬",辰:"壬", 亥:"甲",卯:"甲",未:"甲", 巳:"庚",酉:"庚",丑:"庚"};
// 劫煞、亡神（以年/日支三合局取）
const JIESHA = {申:"巳",子:"巳",辰:"巳", 寅:"亥",午:"亥",戌:"亥", 巳:"寅",酉:"寅",丑:"寅", 亥:"申",卯:"申",未:"申"};
const WANGSHEN={申:"亥",子:"亥",辰:"亥", 寅:"巳",午:"巳",戌:"巳", 巳:"申",酉:"申",丑:"申", 亥:"寅",卯:"寅",未:"寅"};
// 魁罡（日柱本身）
const KUIGANG = ["庚辰","庚戌","壬辰","戊戌"];
// 旬空（空亡）—— 依日柱所在旬
const XUNKONG = {
  甲子:["戌","亥"],甲戌:["申","酉"],甲申:["午","未"],甲午:["辰","巳"],甲辰:["寅","卯"],甲寅:["子","丑"]
};
function getXunKong(dGan,dZhi){
  // 求日柱在六十甲子的序，回推旬首
  const gi=GAN.indexOf(dGan), zi=ZHI.indexOf(dZhi);
  // 旬首天干一定是甲，找 zhi - gi 偏移
  const headZhiIdx = ((zi - gi)%12+12)%12;
  const headZhi = ZHI[headZhiIdx];
  const head = "甲"+headZhi;
  return XUNKONG[head] || [];
}

export function analyzeShenSha(bz){
  const list=[];
  const branches=[
    ["年支",bz.yZhi],["月支",bz.mZhi],["日支",bz.dZhi]
  ];
  if(bz.hourKnown) branches.push(["時支",bz.hZhi]);
  const allZhi = branches.map(b=>b[1]);
  const refSet = [bz.yZhi, bz.dZhi]; // 桃花驛馬等以年支或日支起，命中即算

  const checkByRef = (table,name,desc)=>{
    const targets=new Set(refSet.map(r=>table[r]).filter(Boolean));
    const hits=branches.filter(([,z])=>targets.has(z)).map(([p])=>p);
    if(hits.length) list.push({name,positions:hits,desc});
  };
  checkByRef(PEACH,"桃花","主魅力、情緣、人緣，旺則異性緣佳，過則易招情困");
  checkByRef(HORSE,"驛馬","主走動、遷移、變動，利出行求財、外地發展");
  checkByRef(HUAGAI,"華蓋","主才藝、孤高、宗教玄學緣，文藝與靈性天分");
  checkByRef(JIANGXING,"將星","主領導、權柄，逢吉則掌權，宜居要職");
  checkByRef(JIESHA,"劫煞","主突發、破耗、是非，須防意外損失");
  checkByRef(WANGSHEN,"亡神","主謀略、內斂，亦主暗耗、心事重");

  // 日干查（貴人/文昌/羊刃/祿）
  const checkByDayGan=(val,name,desc)=>{
    const arr = Array.isArray(val)?val:[val];
    const hits=branches.filter(([,z])=>arr.includes(z)).map(([p])=>p);
    if(hits.length) list.push({name,positions:hits,desc});
  };
  checkByDayGan(TIANYI[bz.dGan],"天乙貴人","第一吉神，主逢凶化吉、貴人扶持");
  checkByDayGan(WENCHANG[bz.dGan],"文昌","主聰慧、文采、考運，利讀書功名");
  checkByDayGan(YANGREN[bz.dGan],"羊刃","剛烈之刃，主魄力與衝勁，過則傷災刑剋");
  checkByDayGan(LUSHEN[bz.dGan],"祿神","主衣祿、實力，日主臨官得地之氣");

  // 天月德（查天干）
  const allGan=[bz.yGan,bz.mGan,bz.dGan]; if(bz.hourKnown) allGan.push(bz.hGan);
  if(TIANDE[bz.mZhi] && allGan.includes(TIANDE[bz.mZhi]))
    list.push({name:"天德貴人",positions:["天干"],desc:"逢凶化吉、行善得福之吉神"});
  if(YUEDE[bz.mZhi] && allGan.includes(YUEDE[bz.mZhi]))
    list.push({name:"月德貴人",positions:["天干"],desc:"主慈祥、福德、化解災厄"});

  // 魁罡（日柱）
  if(KUIGANG.includes(bz.dGan+bz.dZhi))
    list.push({name:"魁罡",positions:["日柱"],desc:"主聰明果斷、性烈掌權，喜身旺忌刑沖"});

  // 空亡
  const kong=getXunKong(bz.dGan,bz.dZhi);
  const kongHits=branches.filter(([,z])=>kong.includes(z)).map(([p])=>p);
  if(kongHits.length) list.push({name:"空亡(旬空)",positions:kongHits,desc:"該柱之氣落空，吉減力、凶亦減，逢沖反實"});

  return list;
}

/* ============================================================
 * 格局判定（正格 + 特殊格局）
 * ============================================================ */
export function analyzePattern(bz, strengthInfo, tally){
  const dayGan=bz.dGan, dayWx=GAN_WX[dayGan];
  // 月支主氣十神（取格優先看月令本氣）
  const monthMain = (ZHI_CANGAN[bz.mZhi]||[])[0];
  const monthGod = monthMain ? tenGod(dayGan, monthMain[0]) : null;

  const patterns=[];

  // --- 特殊格局：從格 / 化氣（先判，因會推翻正格）---
  const s=strengthInfo;
  if(s.strength==="極弱"){
    // 從弱：看最旺之神
    const sorted=Object.entries(tally).sort((a,b)=>b[1]-a[1]);
    const dominant=sorted[0][0];
    if(dominant===KE[dayWx]) patterns.push({name:"從財格",type:"特殊",desc:"日主極弱無根，順從財星之旺勢，喜財及食傷生財，忌印比助身破格"});
    else if(dominant===keBy(dayWx)) patterns.push({name:"從殺格",type:"特殊",desc:"日主極弱，順從官殺之勢，喜官殺財，忌印比"});
    else if(dominant===SHENG[dayWx]) patterns.push({name:"從兒格",type:"特殊",desc:"日主極弱，順從食傷洩秀，喜食傷財，忌印星"});
  }
  if(s.strength==="極強"){
    // 從旺/從強
    if(s.ling.state==="旺"||s.ling.state==="相")
      patterns.push({name:"從旺／專旺格",type:"特殊",desc:"滿盤比劫印綬，日主旺極，宜順其勢，喜比劫印，忌官殺剋身"});
  }

  // --- 正格（八格，依月令透干）---
  if(monthGod){
    const gName = monthGod==="比肩"||monthGod==="劫財"
      ? "建祿／月劫格"
      : monthGod+"格";
    const cls=SHISHEN_CLASS[monthGod];
    const descMap={
      正官格:"以正官為用，主貴氣、名譽、規矩，喜財生官、印護官，忌傷官見官",
      七殺格:"以七殺為用，主權威、魄力，喜食神制殺或印化殺，忌財黨殺攻身",
      正財格:"以正財為用，主務實、理財，喜身旺任財、食傷生財，忌比劫奪財",
      偏財格:"以偏財為用，主機會財、慷慨，喜身旺、官星護財，忌比劫爭財",
      正印格:"以正印為用，主學識、庇蔭，喜官殺生印，忌財星壞印",
      偏印格:"以偏印(梟神)為用，主偏才、直覺，喜身弱用印，忌食神被奪(梟印奪食)",
      食神格:"以食神為用，主才華、福氣，喜身旺生食、財來流通，忌偏印奪食",
      傷官格:"以傷官為用，主聰明、表現力，喜傷官生財或佩印，忌傷官見官",
      "建祿／月劫格":"月令逢比劫，身旺之造，喜財官食傷流通發越，忌再逢比劫印綬"
    };
    patterns.push({name:gName,type:"正格",monthGod,cls,desc:descMap[gName]||`以${monthGod}立格`});
  }

  return {
    monthGod,
    monthMainGan: monthMain?monthMain[0]:null,
    patterns: patterns.length?patterns:[{name:"普通格局",type:"普通",desc:"月令未透清純之神，以日主旺衰扶抑取用為主"}]
  };
}

/* ============================================================
 * 主整合：完整八字分析
 * ============================================================ */
export function fullBaziAnalysis(bz){
  // 十神標註（四柱天干 + 地支藏干）
  const annotate = (gan,zhi) => ({
    gan, ganGod: tenGod(bz.dGan,gan),
    zhi,
    cangan: (ZHI_CANGAN[zhi]||[]).map(([g,w])=>({gan:g,weight:w,god:tenGod(bz.dGan,g)})),
    changSheng: changSheng(bz.dGan, zhi),
    nayin: null
  });
  const chart = {
    year: annotate(bz.yGan,bz.yZhi),
    month: annotate(bz.mGan,bz.mZhi),
    day: annotate(bz.dGan,bz.dZhi),
    hour: bz.hourKnown ? annotate(bz.hGan,bz.hZhi) : null
  };
  chart.year.nayin=bz.nayin.year; chart.month.nayin=bz.nayin.month;
  chart.day.nayin=bz.nayin.day; if(chart.hour) chart.hour.nayin=bz.nayin.hour;
  // 日干自己不算十神（為日主本身）
  chart.day.ganGod = "日主";

  const tally = wuxingTally(bz);
  const strength = analyzeStrength(bz);
  const yong = analyzeYongShen(bz, strength);
  const shensha = analyzeShenSha(bz);
  const pattern = analyzePattern(bz, strength, tally);

  // 十神分類統計
  const godTally={比劫:0,食傷:0,財星:0,官殺:0,印星:0};
  const addGod=(g,w)=>{ if(!g||g==="日主")return; const c=SHISHEN_CLASS[g]; if(c)godTally[c]+=w; };
  [chart.year,chart.month,chart.hour].forEach(p=>{ if(p) addGod(p.ganGod,1); });
  [chart.year,chart.month,chart.day,chart.hour].forEach(p=>{
    if(!p)return; p.cangan.forEach(c=>addGod(c.god, c.weight*0.6));
  });
  for(const k in godTally) godTally[k]=Math.round(godTally[k]*100)/100;

  return { bz, chart, tally, strength, yong, shensha, pattern, godTally };
}
